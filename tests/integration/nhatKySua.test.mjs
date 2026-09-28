import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Người dùng đồng ý 28/09/2026: nhật ký "trước → sau" cho thao tác trên hồ sơ, hiện ở Lịch sử sửa đổi.
function theGioi() {
  const w = buildWorld();
  const ctx = loadCode(w.options);
  const nhatKy = hanhDong => w.main.getSheetByName('NhatKyThaoTac').rows(5).slice(1).filter(r => r[2] === hanhDong);
  return { ...ctx, w, nhatKy };
}
const homNay = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);

test('editing a draft record logs only the fields that changed, before → after', () => {
  const { run, nhatKy } = theGioi();
  const kq = run('updateDraft112Info_')('B2', { nguoiNhan: 'Nguyen Van C', stk: '0123456789', nganHang: 'BIDV' });
  assert.equal(kq.success, true, kq.message);
  const [dong] = nhatKy('SUA_NHAP');
  assert.equal(dong[3], 'B2');
  assert.equal(dong[4], 'Sửa hồ sơ Nháp: Người nhận: "Tran Thi B" → "Nguyen Van C"', 'unchanged STK / bank not listed');
  run('updateDraft112Info_')('B2', { nguoiNhan: 'Nguyen Van C' });
  assert.match(nhatKy('SUA_NHAP')[1][4], /không đổi giá trị nào/);
});

test('removing a ticket logs the record, ticket, weight and amount; approval logs the total', () => {
  const { run, nhatKy } = theGioi();
  const ct = run('getDraftRecordDetail_')('A1').chiTiet[0];
  run('runHuyXacNhanDNTT_')('A1');
  assert.equal(run('removePhieuCanFromDraft_')(ct.idCT).success, true);
  const [xoa] = nhatKy('XOA_PHIEU_NHAP');
  assert.equal(xoa[3], 'A1');
  assert.match(xoa[4], /Xóa phiếu cân PC00\d \(dòng A1-CT\d, 1 tấn, 1\.000\.000 đ\)/);
  run('runCreate112')(); // bỏ phiếu cân -> phải tính lại Số tiền trước khi Xác nhận / Duyệt
  run('runXacNhanDNTT_')(['A1']);
  assert.match(run('runConfirmPayment_')(['A1'], homNay()), /^✅/);
  assert.match(nhatKy('CHOT_THANH_TOAN')[0][4], /Duyệt \(Đóng Thanh Toán\) 1 hồ sơ, 1 phiếu cân, tổng [\d.]+ đ, ngày TT/);
});

test('record actions appear in System › Change history', () => {
  const { run } = theGioi();
  run('updateDraft112Info_')('B2', { nguoiNhan: 'Nguyen Van C' });
  run('runHuyXacNhanDNTT_')('A1');
  const ds = Array.from(run('getLichSuSuaDoi_')(homNay(), homNay()).items || run('getLichSuSuaDoi_')(homNay(), homNay()));
  const hanhDong = new Set(ds.map(x => x.hanhDong || x.action || x[2]));
  assert.ok(hanhDong.has('SUA_NHAP'), JSON.stringify(ds).slice(0, 300));
  assert.ok(hanhDong.has('HUY_XAC_NHAN_DNTT'));
});
