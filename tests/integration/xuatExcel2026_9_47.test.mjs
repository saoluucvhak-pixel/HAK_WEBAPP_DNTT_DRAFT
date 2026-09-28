import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Người dùng báo 28/09/2026: "Báo cáo ĐNTT xuất Excel dòng giãn rất lớn; cột ngày của các báo
// cáo kết xuất Excel đều định dạng ngày theo locale riêng (hiện tại 1 số định dạng chuỗi)".
const homNay = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const hoSo = (i, ghiChu) => ({ ngayISO: '2026-09-28', soLan: '1', chuRung: 'CHỦ RỪNG ' + i, nguoiNhan: 'NGƯỜI NHẬN ' + i, stk: '4230205094617',
  nganHang: 'AGRIBANK', klTan: 10, soTien: 1e7, noiDungCK: 'Thanh toán tiền mua gỗ keo HĐ số 20260901002 ngày 01.09.2026', ghiChu });
const NGAN = 'Tổng KL: 1 | Đã trả: 1';
const DAI = 'Tổng KL: 214.11 | Đã trả: 199.28 | Còn lại: 14.83 | Đề nghị đợt này: 14.83 | Phiếu: ' + Array.from({ length: 40 }, (_, i) => 9900 + i).join(', ');

test('one record with a long note no longer stretches every row of the report', () => {
  const w = buildWorld();
  const { run, env } = loadCode(w.options);
  const sh = env.SpreadsheetApp.create('BC').getSheets()[0];
  // Xen kẽ chiều cao (> 30 nhóm như trước) + 1 hồ sơ ghi chú rất dài.
  const BA_DONG = 'Tổng KL: 1 | Đã trả: 1 | Còn lại: 1 | Đề nghị đợt này: 1 | Phiếu: ' + Array.from({ length: 12 }, (_, i) => 9800 + i).join(', ');
  const rows = Array.from({ length: 120 }, (_, i) => hoSo(i, i === 7 ? DAI : i % 2 ? NGAN : BA_DONG));
  let goi = 0;
  const goc = sh.setRowHeights.bind(sh);
  sh.setRowHeights = (...a) => { goi++; return goc(...a); };
  run('renderSheet1Full_')(sh, rows, 'x');
  const cao = Array.from({ length: 120 }, (_, i) => sh.rowHeights[5 + i]);
  const caoNhat = Math.max(...cao);
  assert.equal(cao[7], caoNhat, 'the long note row is the tallest, text not cut');
  assert.ok(cao.filter(h => h === caoNhat).length === 1, `only that row is that tall (was: every row) - ${cao.slice(0, 10)}`);
  assert.ok(cao.every((h, i) => i === 7 || h < caoNhat), 'other rows keep a normal height');
  assert.ok(new Set(cao).size >= 2, 'heights still follow the text');
  assert.ok(goi <= 41, `few calls: ${goi}`);
});

test('every row is still at least as tall as its own text needs', () => {
  const w = buildWorld();
  const { run, env } = loadCode(w.options);
  const sh = env.SpreadsheetApp.create('BC').getSheets()[0];
  const rows = Array.from({ length: 300 }, (_, i) => hoSo(i, [NGAN, DAI, NGAN + ' | Còn lại: 1 | Đề nghị đợt này: 1 | Phiếu: 1'][(i * 7) % 3]));
  run('renderSheet1Full_')(sh, rows, 'x');
  const can = rows.map(r => run('_ghiChuBangDeXuat_')(r.ghiChu).split('\n').length);
  rows.forEach((_, i) => assert.ok(sh.rowHeights[5 + i] >= can[i] * 19, `row ${i}: ${sh.rowHeights[5 + i]} px for ${can[i]} lines`));
});

function daChot(xuat) {
  const w = buildWorld();
  const code = loadCode(w.options);
  if (xuat) code.env.PropertiesService.getScriptProperties().setProperty('EXPORT_REGION_LOCALE', xuat);
  w.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').data[1][16] = new Date('2026-09-20T05:00:00Z');
  assert.match(code.run('runConfirmPayment_')(['A1'], homNay()), /^✅/);
  const mo = kq => { assert.equal(kq.success, true, kq.message); return code.env.SpreadsheetApp.openById(/\/d\/([^/]+)/.exec(kq.url || kq.excelUrl)[1]); };
  return { w, mo, ...code };
}
const laNgay = v => v instanceof Date && !isNaN(v);

test('the ĐNTT report (both sheets) writes real dates formatted by the export region', () => {
  for (const [xuat, fmt, locale] of [['VN', 'dd/MM/yyyy', 'vi_VN'], ['US', 'MM/dd/yyyy', 'en_US']]) {
    const { run, mo, w } = theGioiNhap(xuat);
    const ss = mo(run('exportBaoCaoDNTTFromDraft_')(['A1']));
    assert.equal(ss.locale, locale);
    const [s1, s2] = ss.getSheets();
    assert.ok(laNgay(s1.rows(11)[4][1]), 'Bảng Đề Xuất: Ngày đề nghị');
    assert.equal(s1.getRange(5, 2).getNumberFormat(), fmt);
    assert.equal(s1.rows(11)[4][1].toISOString().slice(0, 10), '2026-09-20', 'no day/month swap');
    const bk = s2.rows(26)[4];
    assert.ok(bk[3] === '' || laNgay(bk[3]), 'Bảng Kê: Ngày CK (dự kiến) - trống khi chưa thanh toán');
    assert.ok(laNgay(bk[25]), 'Bảng Kê: Thời gian nhập liệu');
    assert.equal(s2.getRange(5, 4).getNumberFormat(), fmt);
    assert.equal(s2.getRange(5, 26).getNumberFormat(), fmt + ' HH:mm:ss');
    void w;
  }
});
function theGioiNhap(xuat) {
  const w = buildWorld();
  const code = loadCode(w.options);
  code.env.PropertiesService.getScriptProperties().setProperty('EXPORT_REGION_LOCALE', xuat);
  const sh = w.draft.getSheetByName('DNTT_GK_DN_112_DRAFT');
  sh.data[1][16] = new Date('2026-09-20T05:00:00Z');
  w.draft.getSheetByName('DNTT_GK_DN_CT_DRAFT').data.slice(1).forEach(r => { r[2] = new Date('2026-09-20T03:00:00Z'); });
  const mo = kq => { assert.equal(kq.success, true, kq.message); return code.env.SpreadsheetApp.openById(/\/d\/([^/]+)/.exec(kq.url)[1]); };
  return { w, mo, ...code };
}

test('payment-status, ticket-debt and summary reports write real dates too', () => {
  const { run, mo } = daChot('VN');
  const tt = mo(run('exportTinhHinhThanhToanExcel_')('2026-09-01', homNay(), {})).getSheets()[0];
  const dong = tt.rows().slice(1).filter(r => r[0]);
  assert.ok(dong.length && dong.every(r => laNgay(r[1])), 'Ngày thanh toán');
  assert.equal(tt.getRange(2, 2).getNumberFormat(), 'dd/MM/yyyy');
  assert.notEqual(tt.getRange(2, 2).getNumberFormat(), '@', 'not a text column any more');
});

test('import templates keep text dates (bank UNC file, MISA import sheet)', () => {
  const { run, mo, w } = daChot('VN');
  void w;
  const misa = mo(run('exportMisaTheoNgayExcel_')(homNay().slice(0, 8) + '01', homNay())).getSheets()[0];
  assert.equal(typeof misa.rows(33)[1][2], 'string');
});
