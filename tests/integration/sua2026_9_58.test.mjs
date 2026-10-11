import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// 2026.9.58 - sửa 3 lỗi tìm thấy khi rà soát 9.17 → 9.57 (11/10/2026). Mỗi test thất bại trên 2026.9.57.

const theGioi = () => { const w = buildWorld(); return { w, ...loadCode({ ...w.options, owner: 'owner@hak.test' }) }; };
const homNay = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const cachNgay = n => new Date(Date.now() + 7 * 3600e3 + n * 86400e3).toISOString().slice(0, 10);
const dau = env => env.PropertiesService.getScriptProperties().getProperty('DUYET_DO_DANG');
const datDauCu = (env, ids, ngay) => env.PropertiesService.getScriptProperties()
  .setProperty('DUYET_DO_DANG', JSON.stringify({ ids, ngay, luc: Date.now() - 8 * 60e3, nguoi: 'kt@hak.test' }));

test('Duyệt: the half-done marker is cleared once the ledger and Nháp are done, before the slow Phân Tích refresh', () => {
  const { run, env } = theGioi();
  let dauLucPhanTich;
  run(`(f) => { const goc = _refreshPhanTichNhapTTChoDanhSachNgayNoLock_;
    _refreshPhanTichNhapTTChoDanhSachNgayNoLock_ = function () { f(); return goc.apply(this, arguments); }; }`)(() => { dauLucPhanTich = dau(env); });
  assert.match(run('runConfirmPayment_')(['A1'], homNay()), /^✅/);
  assert.equal(dauLucPhanTich, null, 'a time-out during Phân Tích must not leave a marker that can never be completed');
});

test('Duyệt: "Hoàn tất" on a marker whose records are already committed clears it instead of failing forever', () => {
  const { run, env } = theGioi();
  assert.match(run('runConfirmPayment_')(['A1'], homNay()), /^✅/);
  datDauCu(env, ['A1'], homNay()); // dấu sót lại: lượt đã ghi xong sổ + dọn Nháp rồi mới bị dừng
  assert.deepEqual(Array.from(run('getDuyetDoDang_')().ids), ['A1']);
  const kq = run('webHoanTatDuyetDoDang_')();
  assert.equal(kq.success, true, kq.message);
  assert.equal(dau(env), null);
  assert.equal(run('getDuyetDoDang_')(), null);
});

test('Duyệt: a later approval of other records does not erase the marker of a batch still half-done', () => {
  const { run, env } = theGioi();
  run('_ghiDuyetDoDang_')(['X9'], homNay());
  datDauCu(env, ['X9'], homNay()); // lượt X9 bị dừng từ trước
  assert.match(run('runConfirmPayment_')(['A1'], homNay()), /^✅/);
  const dd = run('getDuyetDoDang_')();
  assert.ok(dd, 'the X9 batch is still reported');
  assert.deepEqual(Array.from(dd.ids), ['X9']);
});

test('Duyệt: when the post-commit check fails, the ledger cache is cleared so create / add still block the just-paid tickets', () => {
  const { run, w } = theGioi();
  assert.doesNotThrow(() => run('_chanPhieuCanDaTra_')(['PC001']), 'PC001 not paid yet (and the cache is now filled)');
  const sh112 = w.main.getSheetByName('DNTT_GK_DN_112');
  const goc = sh112.getRange.bind(sh112);
  sh112.getRange = (r, ...a) => { const rg = goc(r, ...a); if (r > sh112.getLastRow()) rg.setValues = () => rg; return rg; }; // 112 không ghi được
  const msg = run('runConfirmPayment_')(['A1'], homNay());
  assert.match(msg, /chưa ghi đủ dòng CT \/ 112/, msg);
  assert.throws(() => run('_chanPhieuCanDaTra_')(['PC001']), /ĐÃ ĐƯỢC THANH TOÁN/);
});

test('Đối chiếu sao kê: a UNC dated after the statement\'s last day is not reported as missing from it', () => {
  const { run } = theGioi();
  assert.equal(run('webCreateUNCFromDraft_')(['A1'], homNay(), '', '').success, true);
  // Sao kê kết thúc 2 ngày TRƯỚC Ngày hiệu lực của UNC -> UNC không thể có trên sao kê này.
  const kq = run('doiChieuSaoKe_')([{ ngay: cachNgay(-2), soTien: 999, noiDung: 'Phi SMS', tk: '' }]);
  assert.equal(kq.success, true, kq.message);
  assert.equal(kq.uncThieu.length, 0, JSON.stringify(kq.uncThieu));
  // UNC trong khoảng sao kê mà không khớp vẫn bị báo (giữ nguyên).
  const trong = run('doiChieuSaoKe_')([{ ngay: homNay(), soTien: 999, noiDung: 'x', tk: '' }]);
  assert.equal(trong.uncThieu.length, 1);
});

// 2026.9.59 - tốc độ mở trang: trạng thái đã kết nối File Chính đi kèm bước đăng nhập.
test('thongTinDangNhap tells a signed-in user whether the main file is connected (no extra call needed)', () => {
  const { run, env } = theGioi();
  const phien = run('_taoPhien_')('owner@hak.test');
  assert.equal(run('thongTinDangNhap')(phien).mainSetup, true);
  env.PropertiesService.getScriptProperties().deleteProperty('MAIN_SS_ID');
  assert.equal(run('thongTinDangNhap')(phien).mainSetup, false);
  run("_vaiTroCua_ = () => null"); // người lạ: không có vai trò
  assert.equal(run('thongTinDangNhap')('').mainSetup, undefined, 'nothing extra for visitors without a role');
});
