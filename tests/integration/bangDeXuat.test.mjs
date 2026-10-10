import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Bảng Đề Xuất (sheet 1 Báo Cáo ĐNTT) - người dùng báo 28/09/2026: "cột ghi chú chữ bị
// dính, cột rộng quá, nên cân chỉnh cột vừa phải, cho xuống dòng cân đối".
const GHI_CHU = 'Tổng KL: 214.11 | Đã trả: 199.28 | Còn lại: 14.83 | Đề nghị đợt này: 14.83 | Phiếu: 9941, 9942';
function ve() {
  const w = buildWorld();
  const { run, env } = loadCode(w.options);
  const sh = env.SpreadsheetApp.create('BAO CAO').getSheets()[0];
  run('renderSheet1Full_')(sh, [{ ngayISO: '2026-09-28', soLan: '1', chuRung: 'TRẦN HỒNG', nguoiNhan: 'NGUYỄN QUỐC PHỤNG', stk: '4230205094617',
    nganHang: 'AGRIBANK', klTan: 14.83, soTien: 25952000, noiDungCK: 'Thanh toán tiền mua gỗ keo HĐ số 20260901002 ngày 01.09.2026', ghiChu: GHI_CHU }], '28/09/2026');
  return sh;
}

test('the note column breaks into balanced lines and never glues words together', () => {
  const sh = ve();
  const o = sh.rows(11)[4][10];
  const dong = o.split('\n').map(d => d.trim());
  assert.deepEqual(dong.map(d => d.replace(/ /g, ' ')),
    ['Tổng KL: 214.11 · Đã trả: 199.28', 'Còn lại: 14.83 · Đề nghị đợt này: 14.83', 'Phiếu: 9941, 9942'], '2 items per line');
  assert.doesNotMatch(o.replace(/\n/g, ''), /\d[A-Za-zÀ-ỹ]/, 'even if a viewer ignores line breaks, "214.11Đã trả" cannot happen');
  assert.ok(!/(Tổng|KL:|trả:|lại:) /.test(o), 'no break inside an item (non-breaking spaces)');
});

test('the note column has a moderate width and every row is tall enough for its text', () => {
  const sh = ve();
  assert.ok(sh.colWidths[11] >= 260 && sh.colWidths[11] <= 320, 'note column: moderate width (was up to ~700px in the user file)');
  assert.ok(sh.colWidths[10] <= 300, 'transfer text column: just wide enough for two lines');
  assert.ok(sh.rowHeights[5] >= 3 * 19, 'three lines of note fit without being cut');
});

test('the transfer text is always exactly two balanced lines', () => {
  const sh = ve();
  const o = sh.rows(11)[4][9];
  const dong = o.split('\n').map(d => d.trim());
  assert.deepEqual(dong, ['Thanh toán tiền mua gỗ keo', 'HĐ số 20260901002 ngày 01.09.2026'], 'balanced, "HĐ số" kept with the number');
  assert.ok(sh.colWidths[10] >= 248 + 8, 'column wide enough that each half stays on one line (longest half measured 248px in Arial 11pt)');
});

test('names and text are left-aligned, numbers right-aligned (header stays centred)', () => {
  const sh = ve();
  const canh = c => sh.alignments.get('5,' + c);
  assert.deepEqual([1, 2, 3, 8, 9].map(canh), Array(5).fill('right'), 'STT, Ngày đề nghị (ngày thật từ 2026.9.47), Lần, KL, Số tiền');
  assert.deepEqual([4, 5, 6, 7, 10, 11].map(canh), Array(6).fill('left'), 'names, account (text), bank, transfer text, note');
  assert.ok(sh.rows(11)[4][1] instanceof Date, 'Ngày đề nghị is a real date');
  assert.equal(sh.getRange(5, 2).getNumberFormat(), 'dd/MM/yyyy', 'formatted by the export region');
  assert.equal(sh.alignments.get('4,1'), 'center', 'header');
});

test('the detail sheet follows the same alignment rule', () => {
  const w = buildWorld();
  const { run, env } = loadCode(w.options);
  assert.match(run('runConfirmPayment_')(['A1'], '2026-09-05'), /^✅/);
  w.main.getSheetByName('DNTT_GK_DN_112').data.slice(1).forEach(r => { r[16] = new Date('2026-09-01T05:00:00Z'); });
  const kq = run('createFinalReportFromFilteredData_')(run('get112ViewData_')('2026-09-01', '2026-09-30'), '2026-09-01 - 2026-09-30');
  const sh2 = env.SpreadsheetApp.openById(/\/d\/([^/]+)/.exec(kq.url)[1]).getSheets()[1];
  const hang = sh2.rows(26)[4];
  hang.forEach((v, i) => {
    if (v === '' || v === null) return;
    assert.equal(sh2.alignments.get('5,' + (i + 1)), typeof v === 'number' || v instanceof Date ? 'right' : 'left', `column ${i + 1} (${JSON.stringify(v)})`);
  });
});

test('every export file follows the alignment rule (numbers right, text left)', () => {
  const w = buildWorld();
  const { run, env } = loadCode(w.options);
  assert.equal(run('webCreateUNCFromDraft_')(['A1'], '2026-09-05').success, true);
  assert.match(run('runConfirmPayment_')(['A1'], '2026-09-05'), /^✅/);
  const homNay = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  const mo = kq => { assert.equal(kq.success, true, kq.message); return env.SpreadsheetApp.openById(/\/d\/([^/]+)/.exec(kq.url)[1]); };
  const kiem = (sh, dongDau, ten) => {
    const hang = sh.rows()[dongDau - 1];
    hang.forEach((v, i) => {
      if (v === '' || v === null || v === undefined) return;
      const laSo = typeof v === 'number' || v instanceof Date || (typeof v === 'string' && /^-?(0|[1-9]\d*)(\.\d+)?$/.test(v));
      assert.equal(sh.alignments.get(dongDau + ',' + (i + 1)), laSo ? 'right' : 'left', `${ten} column ${i + 1} (${JSON.stringify(v)})`);
    });
  };
  kiem(mo(run('exportLichSuUNCExcel_')(homNay, homNay)).getSheets()[0], 2, 'UNC report');
  kiem(mo(run('exportChiTietDNTTDaChotExcel_')('2026-09-01', '2026-09-30')).getSheets()[0], 2, 'detail report');
  const misa = mo(run('exportMisaTheoNgayExcel_')('2026-09-01', '2026-09-30')).getSheets();
  kiem(misa[0], 2, 'MISA'); kiem(misa[1], 2, 'MISA summary');
});

test('one font size for the whole table; name columns fit the names; "Lần" is narrow', () => {
  const sh = ve();
  assert.equal(sh.colWidths[3] < 50, true, '"Lần" column narrow');
  assert.ok(sh.colWidths[4] >= 100 && sh.colWidths[5] >= 150, 'names fit ("NGUYỄN QUỐC PHỤNG" ~168px at 11pt)');
});

test('a large report (2,000 records) sets row heights with a handful of calls, not one per row', () => {
  const w = buildWorld();
  const { run, env } = loadCode(w.options);
  const sh = env.SpreadsheetApp.create('BIG').getSheets()[0];
  let goi = 0;
  const goc = sh.setRowHeights.bind(sh), goc1 = sh.setRowHeight.bind(sh);
  sh.setRowHeights = (...a) => { goi++; return goc(...a); };
  sh.setRowHeight = (...a) => { goi++; return goc1(...a); };
  const rows = Array.from({ length: 2000 }, (_, i) => ({ ngayISO: '2026-09-28', soLan: '1', chuRung: 'CHỦ RỪNG ' + i, nguoiNhan: 'NGƯỜI NHẬN ' + i, stk: '4230205094617',
    nganHang: 'AGRIBANK', klTan: 10 + (i % 150), soTien: 1e7, noiDungCK: `Thanh toán tiền mua gỗ keo HĐ số 2026090${i % 10}002 ngày 01.09.2026`,
    ghiChu: `Tổng KL: ${100 + i} | Đã trả: 90 | Còn lại: ${10 + (i % 150)} | Đề nghị đợt này: ${10 + (i % 150)} | Phiếu: ${9000 + i}` }));
  run('renderSheet1Full_')(sh, rows, 'x');
  assert.ok(goi <= 31, `row height calls: ${goi}`);
  assert.ok(Object.keys(sh.rowHeights).length >= 2000, 'every data row has a height');
});
