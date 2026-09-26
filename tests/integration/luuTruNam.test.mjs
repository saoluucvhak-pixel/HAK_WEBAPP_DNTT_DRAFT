import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';
import { MockSpreadsheet } from '../gas/mock.mjs';

// Khóa sổ năm 2026 (đang ở năm 2027). Sổ ĐNTT 2026 đã chuyển hết sang file
// DATA2026 (giữ nguyên tên sheet). Phiếu cân:
//   A/2026 cân 01/03/2026, trả 05/03/2026 (sổ 2026)  -> chuyển PhieuCan_DN_2026
//   D/2025 cân 30/12/2025, trả 05/01/2026 (sổ 2026)  -> chuyển PhieuCan_DN_2025
//   F/2026 trả trong sổ 2026, ID_DNTT chưa "Đóng TT"    -> vẫn chuyển (sổ đã khóa là căn cứ)
//   G/2026 trả trong sổ 2026 nhưng thiếu ngày cân      -> ở lại, báo trong xem trước
//   B/2026 cân 28/12/2026, trả 10/01/2027 (sổ đang mở) -> ở lại
//   C/2026 chưa trả, E/2027 chưa trả                    -> ở lại
const D = s => new Date(s + 'T03:00:00Z');
const DATA_ID = 'DATA2026_ID';
const header = (p, n) => Array.from({ length: n }, (_, i) => `${p}${i + 1}`);

function pcRow(so, ngay, ten, tien, daTra) {
  const r = new Array(28).fill('');
  r[0] = so; r[1] = ngay ? D(ngay) : ''; r[9] = 1000; r[11] = ten; r[13] = 'DL1'; r[22] = so; r[25] = tien;
  if (daTra) { r[24] = 'OK'; r[26] = 'Đóng TT'; r[27] = 'Y'; }
  return r;
}
function ctRow(id, so, ten, tien, ngay) {
  const r = new Array(22).fill('');
  r[0] = id; r[1] = 'K' + so; r[3] = ten; r[11] = so; r[12] = 1; r[16] = tien; r[18] = 'Y'; r[19] = 'HD01'; r[20] = D(ngay);
  return r;
}

function world() {
  const w = buildWorld();
  const pc = w.pc.getSheetByName('PhieuCan_DN');
  pc.data = [pc.data[0],
    pcRow('A/2026', '2026-03-01', 'Nguyen Van A', 5e6, true),
    pcRow('B/2026', '2026-12-28', 'Nguyen Van A', 20e6, true),
    pcRow('C/2026', '2026-12-20', 'Nguyen Van A', 30e6, false),
    pcRow('D/2025', '2025-12-30', 'Tran Thi D', 7e6, true),
    pcRow('E/2027', '2027-01-03', 'Nguyen Van A', 10e6, false),
    pcRow('F/2026', '2026-05-01', 'Le Van F', 2e6, false),
    pcRow('G/2026', '', 'Pham G', 1e6, true)];
  w.main.getSheetByName('DNTT_GK_DN_CT').data.push(ctRow('CT-B', 'B/2026', 'Nguyen Van A', 20e6, '2027-01-10'));

  const data = new MockSpreadsheet(DATA_ID, 'DATA2026');
  data.addSheet('DNTT_GK_DN', [header('s', 18)]);
  data.addSheet('DNTT_GK_DN_CT', [header('ct', 22),
    ctRow('CT-D', 'D/2025', 'Tran Thi D', 7e6, '2026-01-05'),
    ctRow('CT-A', 'A/2026', 'Nguyen Van A', 5e6, '2026-03-05'),
    ctRow('CT-F', 'F/2026', 'Le Van F', 2e6, '2026-06-01'),
    ctRow('CT-G', 'G/2026', 'Pham G', 1e6, '2026-07-01')]);
  const h112 = new Array(23).fill(''); h112[0] = 'X26'; h112[2] = 'Nguyen Van A'; h112[6] = 5e6; h112[8] = 'HD01'; h112[16] = D('2026-03-05'); h112[20] = 'Y';
  data.addSheet('DNTT_GK_DN_112', [header('h', 23), h112]);
  const unc = new Array(18).fill(''); unc[0] = 'X26'; unc[4] = 'Nguyen Van A'; unc[7] = 5e6; unc[14] = D('2026-03-05');
  data.addSheet('ChiTietUNC', [header('u', 18), unc]);
  const chiTiet = new Array(28).fill(''); chiTiet[0] = 'X26'; chiTiet[2] = 'A/2026'; chiTiet[21] = 5e6; chiTiet[26] = 'Y'; chiTiet[27] = D('2026-03-05');
  data.addSheet('ChiTietDNTT', [header('c', 28), chiTiet]);

  w.options.spreadsheets.push(data);
  const code = loadCode(w.options);
  return { w, data, ...code };
}
const dangKy = run => run('webSetLuuTruNam_')('2026', `https://docs.google.com/spreadsheets/d/${DATA_ID}/edit`);
const so = rows => Array.from(rows, r => r.soPhieuCan).sort();

test('registering a yearly archive file checks the year, the sheets and leftover rows in the main file', () => {
  const { run, w, data } = world();
  assert.equal(run('webSetLuuTruNam_')('26', DATA_ID).success, false);
  assert.equal(run('webSetLuuTruNam_')('2026', 'MAIN_SS').success, false, 'the main file is not an archive');

  w.main.getSheetByName('DNTT_GK_DN_CT').data.push(ctRow('CT-A', 'A/2026', 'Nguyen Van A', 5e6, '2026-03-05'));
  const conSot = dangKy(run);
  assert.equal(conSot.success, false, 'rows still in the main file would be counted twice');
  assert.match(conSot.message, /CT-A/);
  w.main.getSheetByName('DNTT_GK_DN_CT').data.pop();

  data.sheets.delete('DNTT_GK_DN_112');
  assert.match(dangKy(run).message, /DNTT_GK_DN_112/);
});

test('reports for a closed year read the archive file, reports for the open year do not', () => {
  const { run, env } = world();
  assert.equal(dangKy(run).success, true);
  const mo = env.SpreadsheetApp.openById;
  let moDATA = 0;
  env.SpreadsheetApp.openById = id => { if (id === DATA_ID) moDATA++; return mo(id); };
  assert.equal(run('get112ViewData_')('2027-01-01', '2027-12-31').length, 0);
  assert.deepEqual(so(run('getTinhHinhThanhToanHangNgay_')('2027-01-01', '2027-12-31')), ['B/2026']);
  run('getPaymentAnalysis_')('2027-01-01', '2027-01-31');
  run('getLichSuUNC_')('2027-01-01', '2027-12-31');
  assert.equal(moDATA, 0, 'open-year reports never open the archive file');
  run('get112ViewData_')('2026-01-01', '2026-01-31');
  assert.ok(moDATA > 0, 'a closed-year report does open it');
  assert.deepEqual(Array.from(run('getLuuTruNamForWeb_')(), x => [x.nam, x.ten, x.ok]), [['2026', 'DATA2026', true]]);

  const nam2026 = ['2026-01-01', '2026-12-31'];
  assert.deepEqual(Array.from(run('get112ViewData_')(...nam2026), r => r.idHeThong), ['X26']);
  assert.deepEqual(Array.from(run('getLichSuUNC_')(...nam2026), r => r.idHeThong), ['X26']);
  assert.deepEqual(Array.from(run('getChiTietDNTTDaChot_')(...nam2026).items, r => r.soPhieuCan), ['A/2026']);
  assert.deepEqual(so(run('getTinhHinhThanhToanHangNgay_')(...nam2026)), ['A/2026', 'D/2025', 'F/2026', 'G/2026']);
  assert.equal(run('getPaymentAnalysis_')('2026-01-01', '2026-03-31').tongGiaTriDaTT, 12e6);

});

test('moving closed-year weigh tickets: preview first, then only paid-in-closed-year tickets move', () => {
  const { run, w } = world();
  dangKy(run);
  const pc = w.pc.getSheetByName('PhieuCan_DN');
  const truoc = JSON.stringify(pc.data);

  const xem = run('webChuyenPhieuCanKhoaSo_')(false);
  assert.equal(xem.xemTruoc, true);
  assert.equal(xem.tongDong, 3);
  assert.deepEqual(Array.from(xem.theoSheet, x => [x.tenSheet, x.soDong]), [['PhieuCan_DN_2025', 1], ['PhieuCan_DN_2026', 2]]);
  assert.deepEqual(Array.from(xem.boQua, x => x.soPhieu), ['G/2026']);
  assert.equal(JSON.stringify(pc.data), truoc, 'preview changes nothing');

  const kq = run('webChuyenPhieuCanKhoaSo_')(true);
  assert.equal(kq.success, true, kq.message);
  assert.equal(kq.daChuyen, 3);
  assert.deepEqual(pc.rows().slice(1).map(r => r[22]).sort(), ['B/2026', 'C/2026', 'E/2027', 'G/2026']);
  const lt26 = w.pc.getSheetByName('PhieuCan_DN_2026'), lt25 = w.pc.getSheetByName('PhieuCan_DN_2025');
  assert.equal(lt26.rows()[0][0], 'pc1', 'archive sheet gets the header of the working sheet');
  assert.deepEqual(lt26.rows().slice(1).map(r => r[22]), ['A/2026', 'F/2026']);
  assert.deepEqual(lt25.rows().slice(1).map(r => r[22]), ['D/2025']);
  assert.equal(lt26.rows(28)[1].length, 28, 'all columns are copied');

  const lai = run('webChuyenPhieuCanKhoaSo_')(true);
  assert.equal(lai.tongDong, 0, 'running again moves nothing');
  assert.equal(lt26.getLastRow(), 3, 'no duplicate rows');
});

test('a run stopped after copying but before deleting can be repeated without duplicates', () => {
  const { run, w } = world();
  dangKy(run);
  const pc = w.pc.getSheetByName('PhieuCan_DN');
  const xoaGoc = pc.deleteRows.bind(pc);
  pc.deleteRows = () => { throw new Error('Hết thời gian'); };
  assert.equal(run('webChuyenPhieuCanKhoaSo_')(true).success, false);
  assert.equal(w.pc.getSheetByName('PhieuCan_DN_2026').getLastRow(), 3, 'copied');
  pc.deleteRows = xoaGoc;
  const kq = run('webChuyenPhieuCanKhoaSo_')(true);
  assert.equal(kq.daChuyen, 3);
  assert.equal(w.pc.getSheetByName('PhieuCan_DN_2026').getLastRow(), 3, 'not copied twice');
  assert.equal(w.pc.getSheetByName('PhieuCan_DN_2025').getLastRow(), 2);
});

test('after the move, closed-year reports are unchanged and current debt is only the unpaid tickets', () => {
  const { run } = world();
  dangKy(run);
  const noHienTai = () => Object.fromEntries(Array.from(run('_computeDebtByCustomerLive_')('2027-01-01', '2027-01-31', run('_nhanDienKhachTheoTen_()')), r => [r.khachHang, r.congNo]));
  const baoCaoNamDong = () => ({
    tinhHinh: so(run('getTinhHinhThanhToanHangNgay_')('2026-01-01', '2026-12-31')),
    phanTich: run('getPaymentAnalysis_')('2026-01-01', '2026-03-31'),
    noNgay: so(run('getChiTietCongNoPhieuCan_')('2026-03-02')),
    hopDong: run('_computeHopDongTienDoLiveSingle_')('HD01').slThucHien
  });
  const truoc = JSON.stringify(baoCaoNamDong());
  // Trước khi chuyển: thanh toán của A, D đã sang file DATA nhưng phiếu còn ở sheet đang dùng -> công nợ dư.
  assert.equal(noHienTai()['Tran Thi D'], 7e6);

  run('webChuyenPhieuCanKhoaSo_')(true);
  run('_invalidatePcCache_')();
  assert.equal(JSON.stringify(baoCaoNamDong()), truoc, 'closed-year reports give the same figures');
  assert.deepEqual(JSON.parse(truoc).noNgay, ['A/2026'], 'on 02/03/2026 only A was owed');
  assert.equal(JSON.parse(truoc).hopDong, 5, 'contract progress keeps the closed-year payments (A, D, F, G) + B');
  const no = noHienTai();
  assert.equal(no['Nguyen Van A'], 40e6, 'C (2026, unpaid) + E (2027)');
  assert.equal(no['Tran Thi D'], undefined);
  assert.equal(no['Le Van F'], undefined);
});

test('a payment of a closed year cannot be reopened', () => {
  const { run } = world();
  dangKy(run);
  const kq = run('webMoDongThanhToanTheoHoSo_')('Nguyen Van A', '2026-03-05', '1');
  assert.equal(kq.success, false);
  assert.match(kq.message, /2026 đã khóa sổ/);
});
