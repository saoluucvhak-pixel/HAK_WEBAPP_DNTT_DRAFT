import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// 2026.9.53: mã hồ sơ mới không bao giờ trông như số. Cột mã không khóa dạng chữ nên mã toàn
// chữ số ("00123456") bị Sheets đổi thành số (mất số 0 đầu), "12e45678" thành số mũ -> hồ sơ
// vừa tạo không tìm lại được theo mã. Trước đây xảy ra ngẫu nhiên ~1/70 lần tạo.
function theGioi(uuids) {
  const w = buildWorld();
  const code = loadCode({ ...w.options, owner: 'owner@hak.test' });
  const goc = code.env.Utilities.getUuid;
  code.env.Utilities.getUuid = () => uuids.length ? uuids.shift() + '-0000-4000-8000-000000000000' : goc();
  return { w, ...code };
}

test('numeric-looking codes are skipped: all digits with a leading zero, all digits, scientific notation', () => {
  const { run } = theGioi(['00123456', '12e45678', '98765432', '0e123456', 'ab12cd34']);
  assert.equal(run('_maHoSoMoi_')(), 'ab12cd34');
  for (const ma of ['00123456', '12e45678', '98765432', '0e123456', '1E000000']) assert.equal(run('_maKhongThanhSo_')(ma), false, ma);
  for (const ma of ['ab12cd34', '0012345a', 'e1234567', '1234567e', 'deadbeef']) assert.equal(run('_maKhongThanhSo_')(ma), true, ma);
});

test('a record created when the generator first offers "00123456" can be found again by its code', () => {
  const { run } = theGioi(['00123456', '0a123456']);
  run('refreshPhieuCanUnpaidCache_')();
  const kq = run('createNewPaymentRequest_')({ hoTenChuRung: 'Tran Thi B', cccdChuRung: '012345678901', nguoiDeNghi: 'X', nguoiNhanTien: 'Tran Thi B',
    soTKNhanTien: '0123', nganHang: 'BIDV', soHopDong: 'HD01', ngayDeNghi: '2026-09-26', danhSachPhieuCan: ['PC999'] });
  assert.equal(kq.success, true, kq.message);
  assert.equal(kq.idKey, '0a123456');
  const r = run('getDraftListSummary_')().find(x => x.idKey === kq.idKey);
  assert.ok(r, 'the new record is listed under its code');
  assert.equal(r.soTien, 1000000);
});
