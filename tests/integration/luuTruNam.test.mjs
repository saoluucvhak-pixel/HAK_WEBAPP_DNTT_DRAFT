import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Khóa sổ năm Y (năm đã qua) bằng 1 thao tác: sổ ĐNTT năm Y sang file DATA<Y>,
// phiếu cân đã trả trong năm Y sang PhieuCan_DN_<năm cân>, cùng lúc.
//   A cân 01/03/Y, trả 05/03/Y                -> PhieuCan_DN_Y
//   D cân 30/12/Y-1, trả 05/01/Y              -> PhieuCan_DN_(Y-1)
//   F cân 01/05/Y, trả 01/06/Y, ID_DNTT trống  -> vẫn chuyển (sổ đã khóa là căn cứ)
//   G trả 01/07/Y nhưng thiếu ngày cân        -> ở lại, báo trong xem trước
//   B cân 28/12/Y, trả 10/01/Y+1 (sổ đang mở) -> ở lại
//   C cân 20/12/Y chưa trả, E cân 03/01/Y+1 chưa trả -> ở lại
const Y = Number(new Date().toISOString().slice(0, 4)) - 1;
const D = s => new Date(s + 'T03:00:00Z');
const blank = n => new Array(n).fill('');

function pcRow(so, ngay, ten, tien, daTra) {
  const r = blank(28);
  r[0] = so; r[1] = ngay ? D(ngay) : ''; r[9] = 1000; r[11] = ten; r[13] = 'DL1'; r[22] = so; r[25] = tien;
  if (daTra) { r[24] = 'OK'; r[26] = 'Đóng TT'; r[27] = 'Y'; }
  return r;
}
const hoSo = so => 'K-' + so;
function ctRow(so, ten, tien, ngay) {
  const r = blank(22);
  r[0] = 'CT-' + so; r[1] = hoSo(so); r[3] = ten; r[4] = '012345678901'; r[11] = so; r[12] = 1; r[16] = tien; r[18] = 'Y'; r[19] = 'HD01'; r[20] = D(ngay);
  return r;
}

function world() {
  const w = buildWorld();
  const pc = w.pc.getSheetByName('PhieuCan_DN');
  pc.data = [pc.data[0],
    pcRow(`A/${Y}`, `${Y}-03-01`, 'Nguyen Van A', 5e6, true),
    pcRow(`B/${Y}`, `${Y}-12-28`, 'Nguyen Van A', 20e6, true),
    pcRow(`C/${Y}`, `${Y}-12-20`, 'Nguyen Van A', 30e6, false),
    pcRow(`D/${Y - 1}`, `${Y - 1}-12-30`, 'Tran Thi D', 7e6, true),
    pcRow(`E/${Y + 1}`, `${Y + 1}-01-03`, 'Nguyen Van A', 10e6, false),
    pcRow(`F/${Y}`, `${Y}-05-01`, 'Le Van F', 2e6, false),
    pcRow(`G/${Y}`, '', 'Pham G', 1e6, true)];

  const traNamY = [[`D/${Y - 1}`, 'Tran Thi D', 7e6, `${Y}-01-05`], [`A/${Y}`, 'Nguyen Van A', 5e6, `${Y}-03-05`],
    [`F/${Y}`, 'Le Van F', 2e6, `${Y}-06-01`], [`G/${Y}`, 'Pham G', 1e6, `${Y}-07-01`]];
  const tatCa = traNamY.concat([[`B/${Y}`, 'Nguyen Van A', 20e6, `${Y + 1}-01-10`]]);
  const main = w.main;
  tatCa.forEach(([so, ten]) => { const r = blank(18); r[0] = hoSo(so); r[3] = ten; r[12] = hoSo(so); r[17] = 'Y'; main.getSheetByName('DNTT_GK_DN').data.push(r); });
  tatCa.forEach(x => main.getSheetByName('DNTT_GK_DN_CT').data.push(ctRow(...x)));
  tatCa.forEach(([so, ten, tien, ngay]) => { const r = blank(23); r[0] = hoSo(so); r[2] = ten; r[6] = tien; r[8] = 'HD01'; r[16] = D(ngay); r[20] = 'Y'; main.getSheetByName('DNTT_GK_DN_112').data.push(r); });
  const chiTiet = blank(28); chiTiet[0] = hoSo(`A/${Y}`); chiTiet[2] = `A/${Y}`; chiTiet[21] = 5e6; chiTiet[26] = 'Y'; chiTiet[27] = D(`${Y}-03-05`);
  main.getSheetByName('ChiTietDNTT').data.push(chiTiet);
  const unc = blank(18); unc[0] = hoSo(`A/${Y}`); unc[4] = 'Nguyen Van A'; unc[5] = '0123456789'; unc[7] = 5e6; unc[14] = D(`${Y}-03-05`);
  main.addSheet('ChiTietUNC', [Array.from({ length: 18 }, (_, i) => 'u' + (i + 1)), unc]);
  return { w, ...loadCode(w.options) };
}
const so = rows => Array.from(rows, r => r.soPhieuCan).sort();
const cot = (sh, i) => sh.rows().slice(1).map(r => r[i]);
const fileData = env => {
  const id = JSON.parse(env.PropertiesService.getScriptProperties().getProperty('LUU_TRU_NAM') || '{}')[Y];
  return id && env.SpreadsheetApp.openById(id);
};

test('the preview lists what the yearly close moves and changes nothing', () => {
  const { run, w } = world();
  assert.equal(run('webKhoaSoNam_')(Y + 1, false).success, false, 'the current year cannot be closed');
  const truoc = JSON.stringify([w.main.getSheetByName('DNTT_GK_DN_CT').data, w.pc.getSheetByName('PhieuCan_DN').data]);
  const xem = run('webKhoaSoNam_')(Y, false);
  assert.equal(xem.xemTruoc, true);
  assert.equal(xem.soHoSo, 4);
  assert.deepEqual(Object.fromEntries(Array.from(xem.soSach, x => [x.ten, x.soDong])),
    { DNTT_GK_DN: 4, DNTT_GK_DN_CT: 4, DNTT_GK_DN_112: 4, ChiTietDNTT: 1, ChiTietUNC: 1 });
  assert.equal(xem.tongPhieu, 3);
  assert.deepEqual(Array.from(xem.theoSheet, x => [x.tenSheet, x.soDong]), [[`PhieuCan_DN_${Y - 1}`, 1], [`PhieuCan_DN_${Y}`, 2]]);
  assert.deepEqual(Array.from(xem.boQua, x => x.soPhieu), [`G/${Y}`]);
  assert.equal(JSON.stringify([w.main.getSheetByName('DNTT_GK_DN_CT').data, w.pc.getSheetByName('PhieuCan_DN').data]), truoc);
});

test('closing a year moves the payment books and the paid weigh tickets together', () => {
  const { run, w, env } = world();
  const kq = run('webKhoaSoNam_')(Y, true);
  assert.equal(kq.success, true, kq.message);
  assert.equal(kq.daChuyen, 3);

  const data = fileData(env);
  assert.ok(data, 'the new DATA file is registered');
  assert.equal(data.getName(), `DATA${Y}`);
  assert.deepEqual(data.getSheets().map(s => s.getName()).sort(), ['ChiTietDNTT', 'ChiTietUNC', 'DNTT_GK_DN', 'DNTT_GK_DN_112', 'DNTT_GK_DN_CT']);
  assert.deepEqual(cot(data.getSheetByName('DNTT_GK_DN_CT'), 11).sort(), [`A/${Y}`, `D/${Y - 1}`, `F/${Y}`, `G/${Y}`]);
  assert.equal(data.getSheetByName('DNTT_GK_DN_CT').rows()[0][0], 'ct1', 'same header as the main file');
  assert.equal(cot(data.getSheetByName('DNTT_GK_DN_CT'), 4)[0], '012345678901', 'CCCD keeps its leading zero');
  assert.equal(cot(data.getSheetByName('ChiTietUNC'), 5)[0], '0123456789', 'account number keeps its leading zero');

  assert.deepEqual(cot(w.main.getSheetByName('DNTT_GK_DN_CT'), 11), [`B/${Y}`], 'only next-year payments stay open');
  assert.deepEqual(cot(w.main.getSheetByName('DNTT_GK_DN'), 0), ['OLD1', hoSo(`B/${Y}`)]);
  assert.deepEqual(cot(w.main.getSheetByName('DNTT_GK_DN_112'), 0), [hoSo(`B/${Y}`)]);
  assert.deepEqual(cot(w.main.getSheetByName('ChiTietDNTT'), 0), ['A1', 'A1'], 'draft report rows stay');
  assert.equal(w.main.getSheetByName('ChiTietUNC').getLastRow(), 1);

  assert.deepEqual(cot(w.pc.getSheetByName('PhieuCan_DN'), 22).sort(), [`B/${Y}`, `C/${Y}`, `E/${Y + 1}`, `G/${Y}`]);
  assert.deepEqual(cot(w.pc.getSheetByName(`PhieuCan_DN_${Y}`), 22), [`A/${Y}`, `F/${Y}`]);
  assert.deepEqual(cot(w.pc.getSheetByName(`PhieuCan_DN_${Y - 1}`), 22), [`D/${Y - 1}`]);
  assert.equal(w.pc.getSheetByName(`PhieuCan_DN_${Y}`).rows()[0][0], 'pc1');

  const lai = run('webKhoaSoNam_')(Y, true);
  assert.equal(lai.xemTruoc, true, 'running again has nothing left to do');
  assert.equal(data.getSheetByName('DNTT_GK_DN_CT').getLastRow(), 5, 'no duplicate rows');
  assert.equal(w.pc.getSheetByName(`PhieuCan_DN_${Y}`).getLastRow(), 3);
});

test('closed-year reports give the same figures after the close; open-year reports do not open the DATA file', () => {
  const { run, env } = world();
  const f = `${Y}-01-01`, t = `${Y}-12-31`;
  const baoCao = () => JSON.stringify({
    h112: Array.from(run('get112ViewData_')(f, t), r => r.idHeThong).sort(),
    unc: Array.from(run('getLichSuUNC_')(f, t), r => r.idHeThong),
    chiTiet: Array.from(run('getChiTietDNTTDaChot_')(f, t).items, r => r.soPhieuCan),
    tinhHinh: so(run('getTinhHinhThanhToanHangNgay_')(f, t)),
    phanTich: run('getPaymentAnalysis_')(`${Y}-01-01`, `${Y}-03-31`),
    noNgay: so(run('getChiTietCongNoPhieuCan_')(`${Y}-03-02`)),
    hopDong: run('_computeHopDongTienDoLiveSingle_')('HD01').slThucHien
  });
  const truoc = baoCao();
  run('webKhoaSoNam_')(Y, true);
  run('_invalidatePcCache_')(); run('_invalidateCtSrc112Cache_')();

  const mo = env.SpreadsheetApp.openById;
  const idData = fileData(env).getId();
  let moData = 0;
  env.SpreadsheetApp.openById = id => { if (id === idData) moData++; return mo(id); };
  assert.deepEqual(so(run('getTinhHinhThanhToanHangNgay_')(`${Y + 1}-01-01`, `${Y + 1}-12-31`)), [`B/${Y}`]);
  run('get112ViewData_')(`${Y + 1}-01-01`, `${Y + 1}-12-31`);
  run('getLichSuUNC_')(`${Y + 1}-01-01`, `${Y + 1}-12-31`);
  const no = Object.fromEntries(Array.from(run('_computeDebtByCustomerLive_')(`${Y + 1}-01-01`, `${Y + 1}-01-31`, run('_nhanDienKhachTheoTen_()')), r => [r.khachHang, r.congNo]));
  assert.equal(moData, 0, 'open-year reports never open the archive file');
  assert.deepEqual(no, { 'Nguyen Van A': 40e6 }, 'C (Y, unpaid) + E (Y+1); nothing left over from the closed year');

  assert.equal(baoCao(), truoc, 'closed-year reports are unchanged');
  assert.ok(moData > 0, 'closed-year reports read the archive file');
  assert.equal(JSON.parse(truoc).hopDong, 5, 'contract progress keeps every year');
});

test('a close interrupted midway resumes into the same file without duplicates', () => {
  const { run, w, env } = world();
  const tao = env.SpreadsheetApp.create;
  let soFileTao = 0;
  env.SpreadsheetApp.create = ten => { soFileTao++; return tao(ten); };

  const ct = w.main.getSheetByName('DNTT_GK_DN_CT');
  const xoa = ct.deleteRows.bind(ct);
  ct.deleteRows = () => { throw new Error('Hết thời gian'); };
  assert.equal(run('webKhoaSoNam_')(Y, true).success, false);
  assert.equal(fileData(env), undefined, 'not registered while rows are still in the main file');
  ct.deleteRows = xoa;

  const pc = w.pc.getSheetByName('PhieuCan_DN');
  const xoaPc = pc.deleteRows.bind(pc);
  pc.deleteRows = () => { throw new Error('Hết thời gian'); };
  assert.equal(run('webKhoaSoNam_')(Y, true).success, false);
  pc.deleteRows = xoaPc;

  const kq = run('webKhoaSoNam_')(Y, true);
  assert.equal(kq.success, true, kq.message);
  assert.equal(soFileTao, 1, 'one DATA file');
  const data = fileData(env);
  assert.equal(data.getSheetByName('DNTT_GK_DN_CT').getLastRow(), 5, 'books copied once');
  assert.equal(data.getSheetByName('DNTT_GK_DN').getLastRow(), 5);
  assert.deepEqual(cot(ct, 11), [`B/${Y}`]);
  assert.equal(w.pc.getSheetByName(`PhieuCan_DN_${Y}`).getLastRow(), 3, 'tickets copied once');
  assert.deepEqual(cot(pc, 22).sort(), [`B/${Y}`, `C/${Y}`, `E/${Y + 1}`, `G/${Y}`]);
});

test('an earlier year still open blocks the close; a closed-year payment cannot be reopened', () => {
  const { run, w } = world();
  w.main.getSheetByName('DNTT_GK_DN_CT').data.push(ctRow(`Z/${Y - 1}`, 'X', 1, `${Y - 1}-06-01`));
  assert.match(run('webKhoaSoNam_')(Y, true).message, new RegExp(`trước năm ${Y}`));
  w.main.getSheetByName('DNTT_GK_DN_CT').data.pop();

  run('webKhoaSoNam_')(Y, true);
  const kq = run('webMoDongThanhToanTheoHoSo_')('Nguyen Van A', `${Y}-03-05`, '1');
  assert.equal(kq.success, false);
  assert.match(kq.message, new RegExp(`${Y} đã khóa sổ`));
});

test('pointing a year to another archive file checks the sheets and leftover rows', () => {
  const { run, w, env } = world();
  run('webKhoaSoNam_')(Y, true);
  const data = fileData(env);
  assert.equal(run('webSetLuuTruNam_')(String(Y), 'MAIN_SS').success, false, 'the main file is not an archive');
  w.main.getSheetByName('DNTT_GK_DN_CT').data.push(ctRow(`A/${Y}`, 'Nguyen Van A', 5e6, `${Y}-03-05`));
  assert.match(run('webSetLuuTruNam_')(String(Y), data.getUrl()).message, new RegExp(`CT-A/${Y}`));
  w.main.getSheetByName('DNTT_GK_DN_CT').data.pop();
  assert.equal(run('webSetLuuTruNam_')(String(Y), data.getUrl()).success, true);
  data.deleteSheet(data.getSheetByName('DNTT_GK_DN_112'));
  assert.match(run('webSetLuuTruNam_')(String(Y), data.getUrl()).message, /DNTT_GK_DN_112/);
});

test('re-exporting a payment report of a closed year still lists its transfers in detail', () => {
  const { run } = world();
  run('webKhoaSoNam_')(Y, true);
  const hoSoNam = run('getReportList_')(`${Y}-01-01`, `${Y}-03-31`);
  assert.deepEqual(Array.from(hoSoNam, r => r.idHeThong).sort(), [hoSo(`A/${Y}`), hoSo(`D/${Y - 1}`)]);
  const chiTiet = run('_gomChiTietChuyenKhoan_')(hoSoNam);
  assert.equal(chiTiet.length, 2, 'detail rows come from the archive file');
});
