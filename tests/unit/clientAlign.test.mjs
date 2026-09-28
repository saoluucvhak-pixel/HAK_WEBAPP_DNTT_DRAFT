import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { INDEX } from '../gas/clientSource.mjs';

// Quy định 28/09/2026: toàn web app - cột toàn số căn phải, tên/chuỗi căn trái.
const dong = /^const _LA_SO_WEB_ = .*;$/m.exec(INDEX)[0];
const laSo = vm.runInNewContext(dong.replace('const _LA_SO_WEB_ =', '(') .replace(/;$/, ')'));

test('web tables: formatted amounts and short counters are numbers', () => {
  for (const v of ['25.952.000', '25,952,500', '14,83', '14.83', '1,326.13', '108.28', '0', '1', '12', '1.000.000 đ', '14,83 tấn', '2.500 kg', '12,5%', '-1.234', '0,00'])
    assert.ok(laSo.test(v), v);
});

test('web tables: codes, dates and names are text', () => {
  for (const v of ['4230205094617', '048074003768', '9941', '20260901002', '28/09/2026', '2026-09-28', 'NGUYỄN VĂN BÌNH', 'PC001', '9941/2026/NK', 'HĐ 293', '0123'])
    assert.ok(!laSo.test(v), v);
});

// Người dùng báo 28/09/2026: "FONT CHỮ KG ĐỒNG BỘ" - số dùng cùng font với chữ.
test('web: one font for text and numbers (numbers keep aligned digits)', () => {
  assert.doesNotMatch(INDEX, /IBM Plex Mono|IBM\+Plex\+Mono/, 'no second font for numbers');
  assert.match(INDEX, /--font-chu:'Inter',sans-serif;/);
  assert.match(INDEX, /td\.num, th\.num\{text-align:right; font-family:var\(--font-chu\); font-variant-numeric:tabular-nums;\}/);
});

test('record detail modal: contract volumes in tonnes and a PDF print button', () => {
  const m = /function viewDraftDetail\(idKey\)\{[\s\S]*?\n\}/.exec(INDEX)[0];
  assert.match(m, /fmtKl\(r\.conLai\)\} tấn/);
  assert.doesNotMatch(m, /\} kg</);
  assert.match(m, /hanhDong\('inPhieuChiTietThanhToan', r\.idKey\)/);
  assert.match(INDEX, /searchPhieuCanForEdit, inPhieuChiTietThanhToan,/, 'action registered');
});
