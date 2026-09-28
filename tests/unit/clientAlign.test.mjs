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

test('payment report: clicking a row opens the slip preview; its checkbox and buttons do not', () => {
  assert.match(INDEX, /<tr class="dong-bam" title="Bấm để xem phiếu chi tiết hoàn thành thanh toán" \$\{hanhDong\('xemPhieuHoanThanh', r\.idHeThong, r\.ngayISO\)\}>/);
  assert.match(INDEX, /const dieuKhien = e\.target\.closest\('input, button, a, select, textarea, label'\);\s*if \(dieuKhien && dieuKhien !== el && el\.contains\(dieuKhien\)\) return;/);
  const xem = /function xemPhieuHoanThanh\(idHeThong, ngayISO\)\{[\s\S]*?\n\}/.exec(INDEX)[0];
  assert.match(xem, /<iframe class="xem-phieu" sandbox /, 'slip shown in a sandboxed frame (no script)');
  assert.match(xem, /srcdoc="\$\{esc\(res\.html\)\}"/);
  assert.match(xem, /hanhDong\('inPhieuHoanThanh', res\.idKey, ngayISO\)/, 'print from the preview');
  assert.match(INDEX, /inPhieuHoanThanh, xemPhieuHoanThanh, doDonDep,/);
});

test('home page opens with the 5-step payment process, the same steps as the user guide', () => {
  const trangChu = /function renderDashboard\(\)\{[\s\S]*?\n\}/.exec(INDEX)[0];
  const dau = /c\.innerHTML = `([\s\S]*?)<div class="grid cols-4 o-so" id="dash-stats"/.exec(trangChu)[1];
  assert.match(dau, /id="dash-quy-trinh"/, 'process card comes before the figures');
  assert.match(dau, /QUY_TRINH_TT\.map/);
  assert.match(/function renderHuongDan\(\)\{[\s\S]*?\n\}/.exec(INDEX)[0], /QUY_TRINH_TT\.map/, 'user guide uses the same list');
  assert.equal((/const QUY_TRINH_TT = \[([\s\S]*?)\n\];/.exec(INDEX)[1].match(/\{ ten: /g) || []).length, 5);
  assert.ok(INDEX.indexOf('const DRAFT_STATUS_BADGE') < INDEX.indexOf('const QUY_TRINH_TT'), 'badges defined before use');
});

test('design: one type scale declared once, no serif font left, headings in text colour', () => {
  ['--fs-nho:12px', '--fs-phu:13px', '--fs-than:14px', '--fs-the:15px', '--fs-trang:22px', '--fs-so:28px'].forEach(t => assert.ok(INDEX.includes(t), t));
  assert.doesNotMatch(INDEX, /Source Serif|Source\+Serif|serif;\}/, 'no second (serif) font');
  assert.match(INDEX, /\.topbar h1\{font-size:var\(--fs-trang\);[^}]*color:var\(--ink\);\}/);
  assert.match(INDEX, /\.card h3\{[^}]*font-size:var\(--fs-the\);[^}]*color:var\(--ink\);\}/);
  assert.match(INDEX, /\.badge\{[\s\S]*?white-space:nowrap;/, 'status labels never wrap');
  assert.match(INDEX, /<ol class="quy-trinh">/, 'home page process as numbered steps');
});

test('home page figures are buttons that open the matching screen (only if allowed)', () => {
  const trangChu = /function renderDashboard\(\)\{[\s\S]*?\n\}/.exec(INDEX)[0];
  [["draft', 'all"], ["draft', 'san_sang"], ["draft', 'cho_tinh"], ["debt', 'phantich"], ["report', 'gokeo"], ["debt', 'customer', 'card"]]
    .forEach(([a]) => assert.ok(trangChu.includes(`_oSoMo('${a}')`), a));
  const oSo = /function _oSoMo\(trang, tab, lopThem\)\{[\s\S]*?\n\}/.exec(INDEX)[0];
  assert.match(oSo, /coQuyen\(PAGES\[trang\]\.quyen\)/, 'no button look when the page is not allowed');
  assert.match(oSo, /stat-nut/);
  assert.match(INDEX, /const BAM_DUOC_BANG_PHIM = '[^']*\.stat-nut'/, 'keyboard: Enter / Space');
  assert.match(INDEX, /if \(state\.xemNgayBaoCao\) \{ state\.xemNgayBaoCao = false; loadReport\(\); \}/, 'payment report opens already showing this month');
  assert.match(INDEX, /<div class="subtab" data-f="san_sang">/);
});
