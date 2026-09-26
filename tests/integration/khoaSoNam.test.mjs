import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Khóa sổ năm (quy trình của người dùng): cuối năm, phiếu cân ĐÃ trả chuyển
// sang sheet lưu trữ, phiếu CHƯA trả giữ lại trong PhieuCan_DN; DNTT_GK_DN khóa
// sổ theo năm. Công nợ đầu năm mới phải bằng đúng các phiếu cân chưa trả mang sang.
const D = s => new Date(s + 'T03:00:00Z');

function namMoi() {
  const w = buildWorld();
  const pc = w.pc.getSheetByName('PhieuCan_DN');
  pc.data = [pc.data[0]];
  const pcRow = (so, ngay, ten, tien, daTra) => { const r = new Array(28).fill(''); r[0] = so; r[1] = D(ngay); r[9] = 1000; r[11] = ten; r[22] = so; r[25] = tien;
    if (daTra) { r[24] = 'OK'; r[26] = 'Đóng TT'; r[27] = 'Y'; } return r; };
  pc.data.push(
    pcRow('9001/2026/NK', '2026-12-20', 'Nguyen Van A', 30e6, false),  // 2026 chưa trả, mang sang
    pcRow('9002/2026/NK', '2026-12-28', 'Nguyen Van A', 20e6, true),   // 2026 mang sang, trả trong 2027
    pcRow('1/2027/NK', '2027-01-03', 'Nguyen Van A', 10e6, false),     // phiếu năm mới
    pcRow('2/2027/NK', '2027-01-04', 'Tran Thi B', 5e6, true));
  const ct = w.main.getSheetByName('DNTT_GK_DN_CT');                 // sổ 2027 (đã khóa sổ 2026)
  const ctRow = (so, ten, tien, ngay) => { const r = new Array(22).fill(''); r[1] = 'K' + so; r[3] = ten; r[11] = so; r[16] = tien; r[18] = 'Y'; r[20] = D(ngay); return r; };
  ct.data.push(ctRow('9002/2026/NK', 'Nguyen Van A', 20e6, '2027-01-10'), ctRow('2/2027/NK', 'Tran Thi B', 5e6, '2027-01-12'));
  return { w, ...loadCode(w.options) };
}

test('after the yearly close, debt equals exactly the unpaid weigh tickets carried over', () => {
  const { run } = namMoi();
  const rows = run('_computeDebtByCustomerLive_')('2027-01-01', '2027-01-31', run('_nhanDienKhachTheoTen_()'));
  const no = Object.fromEntries(Array.from(rows, r => [r.khachHang, r.congNo]));
  assert.deepEqual(no, { 'Nguyen Van A': 40e6, 'Tran Thi B': 0 }); // 30tr (2026 chưa trả) + 10tr (2027 chưa trả)
  const chuaTra = run('getChiTietCongNoPhieuCan_')('2027-01-31');
  const so = Array.from(chuaTra.rows || chuaTra, r => r.soPhieuCan).sort();
  assert.deepEqual(so, ['1/2027/NK', '9001/2026/NK']);
});

test('a carried-over unpaid ticket can still be paid in the new year, but only once', () => {
  const { run } = namMoi();
  run('refreshPhieuCanUnpaidCache_')();
  const ds = Array.from(run('getAvailablePhieuCanForChuRung_')('Nguyen Van A').items || run('getAvailablePhieuCanForChuRung_')('Nguyen Van A'), p => p.soPhieuCan);
  assert.ok(ds.includes('9001/2026/NK'), 'unpaid 2026 ticket is selectable in 2027');
  assert.ok(!ds.includes('9002/2026/NK'), 'paid ticket is not selectable');
  const tao = run('createNewPaymentRequest_')({ hoTenChuRung: 'Nguyen Van A', cccdChuRung: '012345678901', nguoiDeNghi: 'X', nguoiNhanTien: 'Nguyen Van A',
    soTKNhanTien: '0123', nganHang: 'BIDV', soHopDong: 'HD01', ngayDeNghi: '2027-01-15', danhSachPhieuCan: ['9002/2026/NK'] });
  assert.equal(tao.success, false, 'paying 9002 again is blocked');
});
