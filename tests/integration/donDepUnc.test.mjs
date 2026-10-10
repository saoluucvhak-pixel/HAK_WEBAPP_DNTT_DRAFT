import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Người dùng yêu cầu 28/09/2026: "không có nút dọn dẹp UNC như dọn dẹp MISA".
const luc = (d, h = 3) => new Date(Date.UTC(2026, d[0] - 1, d[1], h));
function theGioi() {
  const w = buildWorld();
  const ctx = loadCode(w.options);
  const sh = ctx.run('_getChiTietUncSheet_')();
  const dong = (id, t, tien, link) => { const r = new Array(18).fill(''); r[0] = id; r[4] = 'Nguoi nhan ' + id; r[5] = "'0071000123456"; r[7] = tien; r[14] = t; r[15] = link; r[16] = 'Chu rung ' + id; return r; };
  sh.data.push(
    dong('A1', luc([8, 20]), 1, 'a1-thang8'),  // lần cũ ngoài khoảng ngày
    dong('A1', luc([9, 5]), 2, 'a1-cu'),       // lần cũ trong khoảng -> trùng
    dong('B2', luc([9, 6]), 3, 'b2'),
    dong('A1', luc([9, 10]), 4, 'a1-moi'),     // lần mới nhất
    dong('X9', luc([9, 10]), 5, 'x9'));        // hồ sơ không còn tồn tại
  return { ...ctx, w, links: () => sh.rows(18).slice(1).map(r => r[15]) };
}

test('UNC cleanup, duplicates: preview changes nothing; delete keeps the newest creation and can be restored', () => {
  const { run, links } = theGioi();
  const truoc = links();
  const xem = run('webDonDepUnc_')('trung', '2026-09-01', '2026-09-30', false);
  assert.equal(xem.success, true, xem.message);
  assert.equal(xem.soDong, 1);
  assert.deepEqual([xem.dong[0].idHeThong, xem.dong[0].soTien], ['A1', 2]);
  assert.match(xem.dong[0].lyDo, /mới nhất/);
  assert.deepEqual(links(), truoc, 'preview does not change data');

  const kq = run('webDonDepUnc_')('trung', '2026-09-01', '2026-09-30', true);
  assert.equal(kq.soDong, 1, kq.message);
  assert.deepEqual(links(), ['a1-thang8', 'b2', 'a1-moi', 'x9'], 'older creation outside the range is not touched');

  const ds = run('getDanhSachSaoLuuXoa_')();
  assert.equal(ds[0].hanhDong, 'XOA_UNC');
  assert.equal(run('webKhoiPhucSaoLuuXoa_')(ds[0].ma).success, true);
  assert.deepEqual(links().sort(), truoc.slice().sort(), 'restored');
});

test('UNC cleanup, orphans: only records that no longer exist in 112 / draft', () => {
  const { run, links } = theGioi();
  const kq = run('webDonDepUnc_')('moCoi', '2026-09-01', '2026-09-30', true);
  assert.equal(kq.soDong, 1, kq.message);
  assert.deepEqual(links(), ['a1-thang8', 'a1-cu', 'b2', 'a1-moi']);
});

test('UNC cleanup, all rows in range; rejects a missing date or an unknown mode', () => {
  const { run, links } = theGioi();
  assert.equal(run('webDonDepUnc_')('tatCa', '2026-09-01', '2026-09-30', true).soDong, 4);
  assert.deepEqual(links(), ['a1-thang8']);
  assert.equal(run('webDonDepUnc_')('trung', '', '2026-09-30', false).success, false);
  assert.equal(run('webDonDepUnc_')('khac', '2026-09-01', '2026-09-30', false).success, false);
});

test('UNC cleanup is a system-maintenance action (same permission as MISA cleanup)', () => {
  const { run } = theGioi();
  assert.equal(run('API_ROUTES.webDonDepUnc.quyen'), run('API_ROUTES.webDonDepMisa.quyen'));
});
