import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Nâng cấp 2026.9.49 (người dùng đồng ý 28/09/2026: "bỏ mục 2, còn lại bạn làm đi").
const INDEX = readFileSync(new URL('../../Index.html', import.meta.url), 'utf8');
const theGioi = () => { const w = buildWorld(); return { w, ...loadCode({ ...w.options, owner: 'owner@hak.test' }) }; };
const hoSo = (run, id) => run('getDraftListSummary_')().find(r => r.idKey === id);

// ---------- #1 Tự tính tiền khi Tạo / Thêm / Bỏ phiếu ----------
test('#1 a new record gets its amount at once (no manual recalculation step)', () => {
  const { run } = theGioi();
  run('refreshPhieuCanUnpaidCache_')();
  const kq = run('createNewPaymentRequest_')({ hoTenChuRung: 'Tran Thi B', cccdChuRung: '012345678901', nguoiDeNghi: 'X', nguoiNhanTien: 'Tran Thi B',
    soTKNhanTien: '0123', nganHang: 'BIDV', soHopDong: 'HD01', ngayDeNghi: '2026-09-26', danhSachPhieuCan: ['PC999'] });
  assert.equal(kq.success, true, kq.message);
  assert.match(kq.message, /đã tự tính Số tiền/);
  const r = hoSo(run, kq.idKey);
  assert.equal(r.sanSangChot, true);
  assert.equal(r.soTien, 1000000);
  assert.equal(r.trangThaiKey, 'cho_dntt', 'goes straight to "Chờ xác nhận"');
  assert.equal(r.canTinhLai, false);
});

test('#1 adding / removing a weigh ticket recalculates the amount immediately', () => {
  const { run } = theGioi();
  run('runHuyXacNhanDNTT_')('A1');
  run('refreshPhieuCanUnpaidCache_')();
  const them = run('addPhieuCanToDraft_')('A1', 'PC999');
  assert.equal(them.success, true, them.message);
  assert.match(them.message, /đã tự tính lại Số tiền/);
  assert.equal(hoSo(run, 'A1').soTien, 3000000);
  const ct = run('getDraftRecordDetail_')('A1').chiTiet.find(c => String(c.soPhieuCan).includes('PC999'));
  const bo = run('removePhieuCanFromDraft_')(ct.idCT);
  assert.equal(bo.success, true);
  const r = hoSo(run, 'A1');
  assert.equal(r.soTien, 2000000);
  assert.equal(r.canTinhLai, false);
  const xn = run('runXacNhanDNTT_')(['A1']);
  assert.equal(xn.success, true, xn.message);
});

test('#12 the save button says what it really does', () => {
  assert.match(INDEX, /💾 Lưu hồ sơ \(vào Danh Sách ĐNTT, tự tính tiền\)/);
  assert.doesNotMatch(INDEX, /ghi sheet chính \+ tách vào Nháp/);
});

// ---------- #10 Tên trạng thái dễ phân biệt (chỉ đổi chữ hiển thị) ----------
test('#10 statuses read "Chưa tính tiền / Chờ xác nhận / Chờ duyệt"; the stored value is unchanged', () => {
  const { run, w } = theGioi();
  const ds = run('getDraftListSummary_')();
  assert.deepEqual([...new Set(ds.map(r => r.trangThaiLabel))].sort(), ['Chờ duyệt', 'Chờ xác nhận'].sort());
  assert.equal(run('runHuyXacNhanDNTT_')('A1').success, true);
  assert.equal(run('runXacNhanDNTT_')(['A1']).success, true);
  assert.equal(w.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').rows(24).find(r => r[0] === 'A1')[23], 'Đang ĐNTT', 'sheet value kept (older data, formulas)');
  assert.doesNotMatch(INDEX, /Chưa ĐNTT|Chờ ĐNTT|Đang ĐNTT/);
  assert.match(INDEX, /cho_dntt: '<span class="badge wait dot">Chờ xác nhận<\/span>'/);
  assert.match(INDEX, /🔄 Tính lại số tiền/);
});

// ---------- #3 Hộp xác nhận trong trang ----------
test('#3 no browser confirm()/prompt() left; dangerous actions ask to type a code', () => {
  const js = INDEX.slice(INDEX.indexOf('<script>', INDEX.indexOf('</style>')));
  assert.doesNotMatch(js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''), /(?<![\w.])(confirm|prompt)\(/, 'native dialogs gone');
  assert.ok((js.match(/await (xacNhan|nhapChu)\(/g) || []).length >= 24);
  [/maGo: 'MO DONG'/, /maGo: String\(nam\)/, /maGo: 'MA MOI'/, /maGo: riskLevel === 'danger' \? 'XOA'/].forEach(re => assert.match(js, re));
  assert.match(INDEX, /<div class="modal-bg" id="hop-xac-nhan"><div class="modal" role="alertdialog"/);
  assert.match(js, /\(o \|\| \(tc\.nguyHiem \? huy : ok\)\)\.focus\(\);/, 'dangerous: focus starts on Cancel');
});

// ---------- #4 Lịch sử của từng hồ sơ ----------
test('#4 a record history lists every action on that record (also multi-record approvals), oldest first', () => {
  const { run } = theGioi();
  run('runHuyXacNhanDNTT_')('A1');
  assert.equal(run('updateDraft112Info_')('A1', { nguoiNhan: 'Nguyen Van Z' }).success, true);
  run('runXacNhanDNTT_')(['B2', 'A1']);
  assert.match(run('runConfirmPayment_')(['A1', 'B2'], new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10)), /^✅/);
  const ls = run('api')('', 'getLichSuHoSo', ['A1']);
  const hd = ls.map(x => x.hanhDong);
  assert.ok(hd.includes('SUA_NHAP') && hd.includes('CHOT_THANH_TOAN'), hd.join(','));
  assert.ok(hd.indexOf('SUA_NHAP') < hd.indexOf('CHOT_THANH_TOAN'), 'oldest first');
  assert.match(ls.find(x => x.hanhDong === 'SUA_NHAP').chiTiet, /Nguyen Van Z/);
  assert.ok(!run('getLichSuHoSo_')('B2').some(x => x.hanhDong === 'SUA_NHAP'), 'only its own edits');
  assert.match(INDEX, /taiLichSuHoSo\(this\.dataset\.id\)/);
});

// ---------- #6 Duyệt bị dừng giữa chừng ----------
test('#6 an approval stopped half-way is detected and can be completed, without duplicates', () => {
  const { run, w, env } = theGioi();
  const ngay = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  // Giả lập Google dừng lượt Duyệt ngay sau khi ghi sổ CT (trước khi khóa phiếu cân / dọn Nháp).
  run(`() => { globalThis.__khoaGoc = _khoaPhieuCanDaTra_; _khoaPhieuCanDaTra_ = () => { throw new Error('Exceeded maximum execution time'); }; }`)();
  assert.doesNotMatch(run('runConfirmPayment_')(['A1'], ngay), /^✅/);
  run(`() => { _khoaPhieuCanDaTra_ = globalThis.__khoaGoc; }`)();
  assert.equal(run('getDuyetDoDang_')(), null, 'not reported while it could still be running');
  const props = env.PropertiesService.getScriptProperties();
  const j = JSON.parse(props.getProperty('DUYET_DO_DANG'));
  j.luc -= 8 * 60e3; props.setProperty('DUYET_DO_DANG', JSON.stringify(j));
  const dd = run('api')('', 'getDuyetDoDang', []);
  assert.deepEqual(Array.from(dd.ids), ['A1']);
  const kq = run('api')('', 'webHoanTatDuyetDoDang', []);
  assert.equal(kq.success, true, kq.message);
  assert.equal(w.main.getSheetByName('DNTT_GK_DN_CT').rows(22).slice(1).filter(r => r[1] === 'A1').length, 2, 'no duplicate ledger rows');
  assert.ok(w.pc.getSheetByName('PhieuCan_DN').rows(28).slice(1).filter(r => ['PC001', 'PC002'].includes(r[22])).every(r => r[27] === 'Y'), 'tickets now locked');
  assert.equal(props.getProperty('DUYET_DO_DANG'), null, 'journal cleared');
  assert.equal(run('getDuyetDoDang_')(), null);
});

test('#6 a normal approval leaves no journal', () => {
  const { run, env } = theGioi();
  assert.match(run('runConfirmPayment_')(['A1'], new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10)), /^✅/);
  assert.equal(env.PropertiesService.getScriptProperties().getProperty('DUYET_DO_DANG'), null);
});

// ---------- #5 Kiểm tra toàn vẹn hằng đêm ----------
test('#5 the nightly check finds problems, stores them for the home page and emails admins once', () => {
  const { run, w, env } = theGioi();
  assert.match(run('runConfirmPayment_')(['A1'], new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10)), /^✅/);
  // Phiếu cân đã trả nhưng bị ai đó mở khóa tay + dòng MISA bị xóa.
  w.pc.getSheetByName('PhieuCan_DN').data.find(r => r[22] === 'PC001')[27] = '';
  const nh = w.updateNh.getSheetByName('Update_NganHang_DN');
  nh.data = nh.data.filter(r => !String(r[4]).includes('PC002'));
  run('_invalidatePcCache_')();
  const kq = run('kiemTraToanVenHangDem_')();
  const ten = kq.muc.map(m => m.ten).join(' | ');
  assert.match(ten, /chưa khóa trong Phiếu Cân/, ten);
  assert.match(ten, /chưa có dòng MISA/);
  assert.equal(env.MailApp.daGui.length, 1);
  assert.match(env.MailApp.daGui[0].to, /saoluucvhak@gmail\.com/);
  assert.match(env.MailApp.daGui[0].body, /PC001/);
  run('kiemTraToanVenHangDem_')();
  assert.equal(env.MailApp.daGui.length, 1, 'same result -> no repeated email');
  const trangChu = run('api')('', 'getDashboardStats', []);
  assert.ok(trangChu.kiemTraDem && trangChu.kiemTraDem.tong > 0);
  assert.equal(run('KIEM_TRA_DEM.GIO'), 2);
});

test('#5 a clean system sends nothing', () => {
  const { run, env } = theGioi();
  const kq = run('_kiemTraToanVenThucHien_')();
  // Dữ liệu mẫu có sẵn 1 đơn xin cũ "OLD1" không có 112 - đúng là vấn đề; ngoài ra không có gì.
  assert.deepEqual(Array.from(kq.muc, m => m.ten).filter(t => !/đối soát tên|Đơn xin không có dòng 112/.test(t)), [], JSON.stringify(kq.muc));
  assert.ok(!kq.muc.some(m => /MISA|chưa khóa/.test(m.ten)));
  assert.equal(env.MailApp.daGui.length, kq.tong ? 1 : 0);
});
