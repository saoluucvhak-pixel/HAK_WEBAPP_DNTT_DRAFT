import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Người dùng đồng ý 28/09/2026 (S-03 báo cáo rà soát): Lưu / Sửa hồ sơ chỉ nhận Số tài khoản
// có trong HD_STK của đúng hợp đồng đó - máy chủ không tin STK trình duyệt gửi lên.
function theGioi() {
  const w = buildWorld();
  const ctx = loadCode(w.options);
  const dong112 = id => w.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').rows(24).find(r => r[0] === id);
  const themStk = (soHD, stk) => { const r = Array(9).fill(''); r[5] = stk; r[8] = soHD; w.hd.getSheetByName('HD_STK').data.push(r); };
  return { ...ctx, w, dong112, themStk };
}
const hoSo = (stk, soHD = 'HD01') => ({ hoTenChuRung: 'Tran Thi B', cccdChuRung: '012345678901', nguoiDeNghi: 'X', nguoiNhanTien: 'Tran Thi B',
  soTKNhanTien: stk, nganHang: 'BIDV', soHopDong: soHD, ngayDeNghi: '2026-09-28', danhSachPhieuCan: ['PC003'] });

test('saving a new record with an account not declared for the contract is refused, nothing written', () => {
  const { run, w } = theGioi();
  const truoc = w.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').data.length;
  const kq = run('createNewPaymentRequest_')(hoSo('9999999999'));
  assert.equal(kq.success, false);
  assert.match(kq.message, /Số tài khoản 9999999999 không có trong .*HD_STK.* hợp đồng HD01/);
  assert.equal(w.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').data.length, truoc);
  // STK có thật nhưng thuộc hợp đồng khác -> cũng chặn.
  assert.match(run('createNewPaymentRequest_')(hoSo('0099887766')).message, /không có trong/);
  assert.match(run('createNewPaymentRequest_')(hoSo('0123', 'HD_KHONG_CO')).message, /chưa khai báo tài khoản nào/);
});

test('editing a record to an undeclared account (or another contract) is refused and the record stays as is', () => {
  const { run, dong112 } = theGioi();
  const kq = run('updateDraft112Info_')('B2', { stk: '8888888888' });
  assert.equal(kq.success, false);
  assert.match(kq.message, /8888888888 không có trong/);
  assert.equal(String(dong112('B2')[5]).replace(/'/g, ''), '0123456789');
  assert.equal(run('updateDraft112Info_')('B2', { soHD: '00123' }).success, false, 'keeping STK but moving to another contract');
  // Đổi sang STK khác CÓ trong HD_STK của hợp đồng -> được.
  assert.equal(run('updateDraft112Info_')('B2', { stk: '0123' }).success, true);
  assert.equal(String(dong112('B2')[5]).replace(/'/g, ''), '0123');
});

test('account comparison ignores the apostrophe and leading zeros lost by numeric cells', () => {
  const { run, themStk } = theGioi();
  themStk('HD01', 555666777); // ô số -> mất số 0 đầu
  assert.equal(run('updateDraft112Info_')('B2', { stk: '0555666777' }).success, true);
});

test('edits that do not touch account / contract still work for records saved before this check', () => {
  const { run, w } = theGioi();
  const sh = w.draft.getSheetByName('DNTT_GK_DN_112_DRAFT');
  sh.data.find(r => r[0] === 'B2')[5] = "'7777777777"; // hồ sơ cũ có STK không khai báo
  const kq = run('updateDraft112Info_')('B2', { nguoiNhan: 'Nguyen Van C', stk: '7777777777' });
  assert.equal(kq.success, true, kq.message);
});

test('an account just added in the Contract app is accepted even if the cache is stale', () => {
  const { run, themStk } = theGioi();
  run('_hdStkFullData_')(); // nạp bộ nhớ đệm
  themStk('HD01', "'4444444444");
  assert.equal(run('updateDraft112Info_')('B2', { stk: '4444444444' }).success, true);
});
