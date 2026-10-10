import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Người dùng yêu cầu 29/09/2026: Công nợ theo Khách hàng, theo Hợp đồng và Sổ chi tiết công nợ
// xuất được Excel + PDF - cùng số liệu với màn hình, ngày thật theo Vùng xuất, giữ số 0 đầu.
const A = '048000000111', HD = '00123';
const NGAY = new Date('2026-09-10T03:00:00Z'); // 10/09/2026 giờ VN
const F = '2026-09-01', T = '2026-09-30';
const iso = d => new Date(d.getTime() + 7 * 3600e3).toISOString().slice(0, 10);

function world({ xuat = 'VN', pdfLoi = false } = {}) {
  const w = buildWorld();
  const hd = w.hd.getSheetByName('HD_NCC');
  const hdRow = () => { const r = new Array(31).fill(''); r[2] = "'" + HD; r[4] = 'Nguyen Van A'; r[6] = "'" + A; return r; };
  hd.data.push(hdRow());
  const pc = w.pc.getSheetByName('PhieuCan_DN');
  pc.data = [pc.data[0]];
  const pcRow = (so, tien) => { const r = new Array(28).fill(''); r[0] = so; r[1] = NGAY; r[9] = 1000; r[11] = 'Nguyen Van A'; r[22] = so; r[25] = tien; return r; };
  pc.data.push(pcRow('P1', 1e6), pcRow('P2', 2e6));
  const ct = w.main.getSheetByName('DNTT_GK_DN_CT');
  const ctRow = (so, tien) => { const r = new Array(22).fill(''); r[1] = 'X'; r[3] = 'Nguyen Van A'; r[4] = A; r[11] = "'" + so; r[12] = 1; r[16] = tien; r[18] = 'Y'; r[19] = "'" + HD; r[20] = NGAY; return r; };
  ct.data.push(ctRow('P1', 1e6));
  const code = loadCode(w.options);
  code.env.PropertiesService.getScriptProperties().setProperty('EXPORT_REGION_LOCALE', xuat);
  code.env.ScriptApp.getOAuthToken = () => 'token'; // PDF: endpoint xuất của Google, gọi bằng token của script
  code.env.UrlFetchApp.fetch = () => {
    if (pdfLoi) return { getResponseCode: () => 500 };
    const blob = code.env.Utilities.newBlob('%PDF', 'application/pdf', 'x.pdf');
    blob.setName = blob.setName || function (n) { this.name = n; return this; }; // Blob thật có setName
    return { getResponseCode: () => 200, getBlob: () => blob };
  };
  const mo = kq => code.env.SpreadsheetApp.openById(/\/d\/([^/]+)/.exec(kq.excelUrl)[1]).getSheets()[0];
  return { w, mo, ...code };
}
/** Dòng tiêu đề cột = dòng có ô đầu "STT"; trả { tieuDe, dong (dữ liệu), tong, so dòng đầu }. */
function bang(sh) {
  const rows = sh.rows();
  const i = rows.findIndex(r => r[0] === 'STT');
  const du = rows.slice(i + 1).filter(r => r.some(v => v !== '' && v !== null && v !== undefined));
  return { dau: rows.slice(0, i), tieuDe: rows[i], dong: du.slice(0, -1), tong: du[du.length - 1], dongDau: i + 2 };
}

test('debt by customer: same rows as the screen, CCCD keeps its leading zero, totals, Excel + PDF', () => {
  const { run, mo } = world();
  const manHinh = run('getDebtByCustomer_')(F, T);
  const kq = run('exportCongNo_')('kh', F, T);
  assert.equal(kq.success, true, kq.message);
  assert.ok(kq.excelUrl && kq.pdfUrl, 'both files');
  const sh = mo(kq), b = bang(sh);
  assert.match(b.dau.flat().join(' '), /BÁO CÁO CÔNG NỢ THEO KHÁCH HÀNG/);
  assert.match(b.dau.flat().join(' '), /Từ ngày 01\/09\/2026 đến ngày 30\/09\/2026/);
  assert.ok(manHinh.length > 0, 'fixture has debt rows');
  assert.equal(b.dong.length, manHinh.length);
  assert.equal(kq.count, manHinh.length);
  const dongA = b.dong.find(r => String(r[2]).replace(/^'/, '') === A);
  assert.ok(dongA, 'CCCD kept as text with the leading zero');
  assert.equal(b.tong[1], 'TỔNG CỘNG');
  assert.equal(b.tong[8], manHinh.reduce((t, r) => t + r.congNo, 0), 'total debt');
  assert.equal(sh.getRange(b.dongDau, 9).getNumberFormat(), '#,##0');
  assert.equal(sh.alignments.get(`${b.dongDau},2`), 'left', 'name left');
  assert.equal(sh.alignments.get(`${b.dongDau},9`), 'right', 'amount right');
});

test('debt by contract: contract number keeps its leading zero, one row per contract on screen', () => {
  const { run, mo } = world();
  const manHinh = run('getDebtByContract_')(F, T);
  const kq = run('exportCongNo_')('hd', F, T);
  assert.equal(kq.success, true, kq.message);
  const b = bang(mo(kq));
  assert.match(b.dau.flat().join(' '), /BÁO CÁO CÔNG NỢ THEO HỢP ĐỒNG/);
  assert.ok(manHinh.length > 0, 'fixture has debt rows');
  assert.equal(b.dong.length, manHinh.length);
  assert.ok(b.dong.some(r => String(r[1]).replace(/^'/, '') === HD), JSON.stringify(b.dong));
  assert.equal(b.tong[8], manHinh.reduce((t, r) => t + r.congNo, 0));
});

test('customer ledger: real dates read as dd/mm/yyyy even when the export region is US', () => {
  const { run, mo } = world({ xuat: 'US' });
  const khoa = run('getDebtByCustomer_')(F, T).find(r => r.cccd === A).khoa;
  const so = run('getDebtLedgerDetail_')('customer', khoa, T);
  const kq = run('exportCongNo_')('so', F, T, { loaiSo: 'customer', khoa });
  assert.equal(kq.success, true, kq.message);
  const sh = mo(kq), b = bang(sh);
  assert.match(b.dau.flat().join(' '), /SỔ CHI TIẾT CÔNG NỢ THEO KHÁCH HÀNG/);
  assert.match(b.dau.flat().join(' '), new RegExp(A));
  assert.ok(so.rows.length > 0, 'fixture has ledger rows');
  assert.equal(b.dong.length, so.rows.length);
  assert.ok(b.dong.every(r => r[1] instanceof Date && iso(r[1]) === '2026-09-10'), '10 September, not 9 October');
  assert.equal(sh.getRange(b.dongDau, 2).getNumberFormat(), 'MM/dd/yyyy', 'US export region format');
  assert.deepEqual([b.tong[3], b.tong[4], b.tong[5]], [so.tongNo, so.tongCo, so.duCuoiKy]);
});

test('contract ledger: weigh ticket numbers as text, totals of weight and amount', () => {
  const { run, mo } = world();
  const so = run('getDebtLedgerDetail_')('contract', HD, T);
  const kq = run('exportCongNo_')('so', F, T, { loaiSo: 'contract', khoa: HD });
  assert.equal(kq.success, true, kq.message);
  const b = bang(mo(kq));
  assert.ok(so.rows.length > 0, 'fixture has ledger rows');
  assert.equal(b.dong.length, so.rows.length);
  assert.ok(b.dong.some(r => String(r[2]).replace(/^'/, '') === 'P1'));
  assert.equal(b.tong[4], so.rows.reduce((t, r) => t + r.thanhTien, 0));
});

test('a failed PDF still returns the Excel file with a warning; bad requests are refused', () => {
  const { run } = world({ pdfLoi: true });
  const kq = run('exportCongNo_')('kh', F, T);
  assert.equal(kq.success, true, kq.message);
  assert.ok(kq.excelUrl);
  assert.equal(kq.pdfUrl, '');
  assert.match(kq.canhBao, /Không tạo được file PDF/);
  assert.equal(run('exportCongNo_')('so', F, T, { loaiSo: 'customer', khoa: '' }).success, false);
  assert.equal(run('exportCongNo_')('khac', F, T).success, false);
  assert.equal(run('API_ROUTES').exportCongNo.quyen, 'XEM', 'anyone who can view the report can export it');
});
