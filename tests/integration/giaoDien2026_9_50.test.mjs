// Giao diện 2026.9.50: khung ứng dụng mới (tông màu cũ) - thanh bên theo nhóm, thu gọn, ngăn kéo trên điện thoại.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const INDEX = readFileSync(new URL('../../Index.html', import.meta.url), 'utf8');
const CSS = INDEX.slice(INDEX.indexOf('<style>'), INDEX.indexOf('</style>'));

test('old colour palette stays the base of the new layout', () => {
  ['--forest:#1f2937', '--accent:#2563eb', '--timber:#b45309', '--moss:#16a34a', '--paper:#f3f4f6'].forEach(t => assert.ok(CSS.includes(t), t));
});

test('sidebar menu is grouped, each page still listed once with its permission check', () => {
  const nav = INDEX.slice(INDEX.indexOf('<nav id="nav"'), INDEX.indexOf('</nav>', INDEX.indexOf('<nav id="nav"')));
  assert.deepEqual([...nav.matchAll(/class="nav-nhom">([^<]+)</g)].map(m => m[1]), ['Tổng quan', 'Nghiệp vụ', 'Báo cáo', 'Hỗ trợ &amp; quản trị']);
  assert.deepEqual([...nav.matchAll(/data-page="(\w+)"/g)].map(m => m[1]), ['dashboard', 'draft', 'report', 'debt', 'huongdan', 'hethong', 'settings']);
  assert.match(nav, /title="Báo Cáo Công Nợ Khách Hàng Gỗ Keo"/, 'short label, full name on hover');
  assert.match(INDEX, /document\.querySelectorAll\('#nav \.nav-nhom'\)[\s\S]{0,300}nhom\.style\.display = conTrang \? '' : 'none';/, 'empty group headings hidden');
});

test('a page-wide "nav" rule no longer styles the "Đi nhanh" bar (settings bar was a vertical column)', () => {
  assert.doesNotMatch(CSS, /(^|\n)\s*nav\{/);
  assert.match(CSS, /\.muc-luc\{display:flex; flex-direction:row;/);
});

test('breadcrumb shows the menu group of every page', () => {
  assert.equal([...INDEX.matchAll(/\{nhom:'[^']+', title:/g)].length, 7);
  assert.match(INDEX, /getElementById\('page-crumb'\)\.textContent = meta\.nhom \+ ' › ' \+ meta\.title;/);
});

test('sidebar collapses on desktop (remembered) and becomes a drawer on phones', () => {
  assert.match(INDEX, /const THU_GON_KHOA = 'hak_thanh_ben_gon';/);
  assert.match(INDEX, /try \{ localStorage\.setItem\(THU_GON_KHOA/, 'storage may be blocked');
  assert.match(CSS, /body\.menu-mo \.sidebar\{transform:none;/);
  assert.match(INDEX, /_dongMenuDienThoai_\(\);\n  window\.scrollTo\(0, 0\);/, 'drawer closes after picking a page');
  assert.match(CSS, /position:sticky; top:0; z-index:10;\n      flex-shrink:0;/, 'top bar never squeezed on small screens');
  assert.match(CSS, /@media print\{[\s\S]*\.sidebar, \.nut-menu, \.nen-menu,/);
});

test('draft list fits the screen: merged name / bank / weight columns, totals row still lines up', () => {
  const bang = INDEX.slice(INDEX.indexOf('<div class="cuon-ngang"><table class="cot-cuoi-dinh">'), INDEX.indexOf('</tfoot></table></div>'));
  const soCot = (bang.match(/<th[ >]/g) || []).length;
  assert.equal(soCot, 8);
  const tfoot = bang.slice(bang.indexOf('<tfoot>'));
  const cong = [...tfoot.matchAll(/<td(?: colspan="(\d+)")?/g)].reduce((t, m) => t + Number(m[1] || 1), 0);
  assert.equal(cong, soCot, 'footer spans every column');
});
