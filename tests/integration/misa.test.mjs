import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Xuất MISA theo ngày: file nhập được vào MISA như bản cũ (33 cột, tiêu đề của
// Update_NganHang_DN, giữ số 0 đầu) + sheet tóm tắt 9 cột.
const D = s => new Date(s + 'T05:00:00Z');
function world() {
  const w = buildWorld();
  const nh = w.updateNh.getSheetByName('Update_NganHang_DN');
  nh.data[0] = Array.from({ length: 33 }, (_, i) => 'MISA cột ' + (i + 1));
  const dong = (so, ngay, tien) => { const r = new Array(33).fill(''); r[2] = ngay; r[3] = ngay; r[4] = so; r[5] = '0011001234567'; r[8] = 'Thanh toán phiếu cân ' + so;
    r[9] = '048000000111'; r[10] = 'Nguyen Van A'; r[12] = '0123456789'; r[13] = 'BIDV'; r[14] = 'Nguyen Van A'; r[22] = '33111'; r[23] = '1121'; r[24] = tien; r[32] = '0012/HĐ'; return r; };
  nh.data.push(dong('PC001', '05/09/2026', 1e6), dong('PC002', '20/10/2026', 2e6));
  const ct = w.main.getSheetByName('DNTT_GK_DN_CT');
  const ctRow = (so, ngay) => { const r = new Array(22).fill(''); r[1] = 'K'; r[11] = so; r[20] = D(ngay); return r; };
  ct.data.push(ctRow('PC001', '2026-09-05'), ctRow('PC002', '2026-10-20'));
  return { w, ...loadCode(w.options) };
}

test('the MISA export is the 33-column MISA import layout, filtered by payment date, plus a summary sheet', () => {
  const { run, env } = world();
  const kq = run('exportMisaTheoNgayExcel_')('2026-09-01', '2026-09-30');
  assert.equal(kq.success, true, kq.message);
  assert.equal(kq.count, 1);
  const ss = env.SpreadsheetApp.openById(/\/d\/([^/]+)/.exec(kq.url)[1]);
  assert.match(ss.getName(), /^XUAT MISA/);
  const [misa, tomTat] = ss.getSheets();
  assert.equal(misa.getName(), 'XuatMISA');
  const rows = misa.rows(33);
  assert.equal(rows[0][0], 'MISA cột 1', 'header copied from Update_NganHang_DN');
  assert.equal(rows[0].length, 33);
  assert.equal(rows.length, 2, 'only the September payment');
  const r = rows[1];
  assert.deepEqual([r[4], r[5], r[9], r[12], r[32], r[22], r[23], r[24]], ['PC001', '0011001234567', '048000000111', '0123456789', '0012/HĐ', 33111, 1121, 1e6]);
  assert.equal(tomTat.getName(), 'TomTat');
  assert.deepEqual(tomTat.rows(9)[1].slice(0, 2), ['05/09/2026', 'PC001']);
  // Màn hình Báo Cáo MISA vẫn ra đúng dòng như file xuất.
  assert.deepEqual(Array.from(run('getMisaDataTheoNgay_')('2026-09-01', '2026-09-30').items, x => x.soPhieuCan), ['PC001']);
});

// Dọn dẹp MISA (Hệ Thống): xem trước không đổi dữ liệu; xóa có sao lưu, khôi
// phục được; chỉ trong khoảng Ngày CK đã chọn.
function worldDonDep() {
  const ctx = world();
  const nh = ctx.w.updateNh.getSheetByName('Update_NganHang_DN');
  const dong = (so, ngay, tien) => { const r = new Array(33).fill(''); r[2] = ngay; r[4] = so; r[5] = '0011001234567'; r[24] = tien; return r; };
  nh.data.push(
    dong('PC001', '05/09/2026', 999),   // trùng PC001 (dòng đầu là 1e6)
    dong('PC009', '10/09/2026', 3e6),   // mồ côi: không có trong sổ đã chốt
    dong('', '10/09/2026', 4e6));       // nhập tay, không có Số phiếu cân
  return { ...ctx, nh };
}
const soVaTien = nh => nh.rows(33).slice(1).map(r => r[4] + ':' + r[24]);

test('MISA cleanup, duplicates: preview changes nothing, delete keeps the first row and can be restored', () => {
  const { run, nh } = worldDonDep();
  const truoc = soVaTien(nh);
  const xem = run('webDonDepMisa_')('trung', '2026-09-01', '2026-09-30', false);
  assert.equal(xem.success, true, xem.message);
  assert.equal(xem.soDong, 1);
  assert.deepEqual([xem.dong[0].soPhieuCan, xem.dong[0].thanhTien], ['PC001', 999]);
  assert.match(xem.dong[0].lyDo, /Trùng/);
  assert.deepEqual(soVaTien(nh), truoc, 'preview does not change data');

  const kq = run('webDonDepMisa_')('trung', '2026-09-01', '2026-09-30', true);
  assert.equal(kq.success, true, kq.message);
  assert.equal(kq.soDong, 1);
  assert.deepEqual(soVaTien(nh), ['PC001:1000000', 'PC002:2000000', 'PC009:3000000', ':4000000']);
  assert.equal(nh.rows(33)[1][5], '0011001234567', 'leading zero kept on remaining rows');

  const ds = run('getDanhSachSaoLuuXoa_')();
  assert.equal(ds[0].hanhDong, 'XOA_MISA');
  assert.equal(run('webKhoiPhucSaoLuuXoa_')(ds[0].ma).success, true);
  assert.deepEqual(soVaTien(nh).sort(), truoc.slice().sort(), 'restored');
  const khoiPhuc = nh.rows(33).slice(1).find(r => r[24] === 999);
  assert.equal(khoiPhuc[5], '0011001234567', 'restored row keeps leading zero');
});

test('MISA cleanup, orphans: only rows whose ticket is not in the closed ledger; manual rows are kept', () => {
  const { run, nh } = worldDonDep();
  const kq = run('webDonDepMisa_')('moCoi', '2026-09-01', '2026-09-30', true);
  assert.equal(kq.success, true, kq.message);
  assert.equal(kq.soDong, 1);
  assert.deepEqual(soVaTien(nh), ['PC001:1000000', 'PC002:2000000', 'PC001:999', ':4000000']);
});

test('MISA cleanup, all rows in range: only the chosen payment dates are touched', () => {
  const { run, nh } = worldDonDep();
  assert.equal(run('webDonDepMisa_')('trung', '2026-10-01', '2026-10-31', false).soDong, 0, 'duplicate outside the range is not touched');
  const kq = run('webDonDepMisa_')('tatCa', '2026-09-01', '2026-09-30', true);
  assert.equal(kq.soDong, 4);
  assert.deepEqual(soVaTien(nh), ['PC002:2000000']);
});

test('MISA cleanup rejects a missing date or an unknown mode', () => {
  const { run } = worldDonDep();
  assert.equal(run('webDonDepMisa_')('trung', '', '2026-09-30', false).success, false);
  assert.equal(run('webDonDepMisa_')('khac', '2026-09-01', '2026-09-30', false).success, false);
});

// Báo Cáo MISA: cảnh báo hồ sơ đã chốt chưa có dòng MISA + Tạo bổ sung.
function worldDaChot() {
  const w = buildWorld();
  const code = loadCode(w.options);
  assert.match(code.run('runConfirmPayment_')(['A1'], '2026-09-26'), /^✅/);
  // Ngày ĐN của hồ sơ (sổ 112 cột Q) - thực tế luôn có, dữ liệu mẫu để trống.
  w.main.getSheetByName('DNTT_GK_DN_112').data.slice(1).forEach(r => { r[16] = D('2026-09-20'); });
  const nh = w.updateNh.getSheetByName('Update_NganHang_DN');
  return { w, nh, ...code };
}
const soTrongMisa = nh => nh.rows(33).slice(1).map(r => String(r[4]).replace(/^'/, '')).sort();

test('the MISA screen flags closed tickets that have no MISA row, and "Tạo bổ sung" writes only those', () => {
  const { run, nh } = worldDaChot();
  const xem = () => run('getMisaDataTheoNgay_')('2026-09-26', '2026-09-26');
  assert.equal(xem().thieu.soPhieu, 0, 'approval wrote every MISA row');

  const truoc = nh.rows(33).slice(1).find(r => String(r[4]).includes('PC001')).slice();
  nh.data.splice(nh.data.findIndex(r => String(r[4]).includes('PC001')), 1); // như lần tự động ghi bị lỗi / bị xóa tay
  const thieu = xem().thieu;
  assert.deepEqual([thieu.soPhieu, thieu.soHoSo, thieu.phieu[0].soPhieuCan, thieu.phieu[0].idHeThong], [1, 1, 'PC001', 'A1']);
  assert.equal(xem().items.length, 1, 'the MISA rows themselves are still shown');

  const kq = run('webTaoBoSungMisa_')('2026-09-26', '2026-09-26');
  assert.equal(kq.success, true, kq.message);
  assert.deepEqual([kq.count, kq.xong], [1, true]);
  assert.deepEqual(soTrongMisa(nh), ['PC001', 'PC002'], 'only the missing ticket is written, no duplicate of PC002');
  const moi = nh.rows(33).slice(1).find(r => String(r[4]).includes('PC001'));
  assert.deepEqual([moi[4], moi[24]].map(String), [truoc[4], truoc[24]].map(String), 'same ticket and amount as the original row');
  assert.equal(String(moi[12]).replace(/^'/, ''), '0123456789', 'account of the record (sổ 112), leading zero kept');
  assert.equal(xem().thieu.soPhieu, 0);

  const lan2 = run('webTaoBoSungMisa_')('2026-09-26', '2026-09-26');
  assert.deepEqual([lan2.count, lan2.xong], [0, true]);
  assert.deepEqual(soTrongMisa(nh), ['PC001', 'PC002'], 'running again writes nothing');
});

test('"Tạo bổ sung" is an accounting action (view-only users cannot run it)', () => {
  const { run } = worldDaChot();
  assert.equal(run('API_ROUTES').webTaoBoSungMisa.quyen, 'NGHIEP_VU');
  assert.equal(run('webTaoBoSungMisa_')('', '2026-09-26').success, false);
});

test('"Tạo lại MISA" picks records by payment date (Ngày CK) like the MISA report, not by request date', () => {
  const { run, nh } = worldDaChot(); // lập ĐN 20/09, thanh toán (Ngày CK) 26/09
  nh.data = [nh.data[0]];
  const khong = run('webTaoLaiMisaTheoNgay_')('2026-09-20', '2026-09-20', 0, 150);
  assert.deepEqual([khong.count, khong.xong], [0, true], 'the request date is not the payment date');
  assert.equal(nh.getLastRow(), 1);
  const kq = run('webTaoLaiMisaTheoNgay_')('2026-09-26', '2026-09-26', 0, 150);
  assert.equal(kq.success, true, kq.message);
  assert.deepEqual(soTrongMisa(nh), ['PC001', 'PC002']);
  assert.deepEqual(nh.rows(33).slice(1).map(r => r[2]), ['26/09/2026', '26/09/2026']);
  assert.equal(run('getMisaDataTheoNgay_')('2026-09-26', '2026-09-26').items.length, 2, 'the report shows them on the same date');
});
