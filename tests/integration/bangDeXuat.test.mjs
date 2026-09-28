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
  assert.ok(sh.colWidths[11] >= 260 && sh.colWidths[11] <= 300, 'note column: moderate width (was up to ~700px in the user file)');
  assert.ok(sh.colWidths[10] <= 280, 'transfer text column');
  assert.ok(sh.rowHeights[5] >= 3 * 19, 'three lines of note fit without being cut');
});
