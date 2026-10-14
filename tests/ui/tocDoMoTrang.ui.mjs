// Tốc độ mở trang (2026.9.59) - chạy riêng như giaoDien.ui.mjs:
//   NODE_PATH=$(npm root -g) node --test tests/ui/tocDoMoTrang.ui.mjs
// Mỗi lượt gọi máy chủ giả lập trễ TRE_MS (Apps Script thật ~1-2 giây chỉ để khởi động).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { trangMau, tuyChonChromium } from './trangMau.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const TRE_MS = 800;
const TRE_TRANG_CHU_MS = 3 * TRE_MS; // Trang chủ tổng hợp số liệu - chạy lâu hơn hẳn bước xác thực
const URL = 'http://hak.test/';

let browser;
before(async () => { browser = await chromium.launch(tuyChonChromium()); });
after(async () => { await browser.close(); });

/** Trang mẫu đã có phiên đăng nhập; mỗi lượt gọi máy chủ trễ TRE_MS và được ghi lại. */
function trangCoPhien() {
  return trangMau()
    .replace('data-phien=""', 'data-phien="PHIEN_TEST"')
    .replace("thongTinDangNhap() { setTimeout(() => ok({", "thongTinDangNhap() { (window.__goi = window.__goi || []).push('thongTinDangNhap'); setTimeout(() => ok({ mainSetup: true,")
    .replace("api(phien, ten) {", "api(phien, ten) { (window.__goi = window.__goi || []).push(ten); const tre = ten === 'getDashboardStats' ? " + TRE_TRANG_CHU_MS + " : " + TRE_MS + ";")
    .replace(/(thongTinDangNhap\(\) \{[\s\S]*?)\), 0\); \}/, `$1), ${TRE_MS}); }`)
    .replace(/(api\(phien, ten\) \{[\s\S]*?)\), 0\); \}/, '$1), tre); }');
}
async function moTrang(context) {
  const page = await context.newPage();
  await page.route('**/fonts.googleapis.com/**', r => r.abort());
  await page.route(URL, r => r.fulfill({ contentType: 'text/html; charset=utf-8', body: trangCoPhien() }));
  const batDau = Date.now();
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  return { page, batDau };
}

test('opening the app with a session shows the home figures after ONE server round trip, not three', async () => {
  const context = await browser.newContext();
  const { page, batDau } = await moTrang(context);
  await page.waitForFunction(() => document.getElementById('s-draft') && document.getElementById('s-draft').textContent === '2', null, { timeout: 10000 });
  const ms = Date.now() - batDau;
  assert.ok(ms < TRE_TRANG_CHU_MS + TRE_MS / 2, `home figures after ${ms} ms (sequential calls would be >= ${TRE_MS * 2 + TRE_TRANG_CHU_MS} ms)`);
  const goi = await page.evaluate(() => window.__goi);
  assert.equal(goi.filter(t => t === 'getAppSetupStatus').length, 0, 'setup status comes with the login info');
  assert.equal(goi.filter(t => t === 'getDashboardStats').length, 1, 'home figures loaded once');
  await context.close();
});

test('the draft list is preloaded in the background and opens without another call', async () => {
  const context = await browser.newContext();
  const { page } = await moTrang(context);
  await page.waitForFunction(() => document.getElementById('s-draft') && document.getElementById('s-draft').textContent === '2');
  await page.waitForTimeout(TRE_MS + 300); // nạp sẵn Danh Sách ĐNTT xong
  const truoc = await page.evaluate(() => window.__goi.filter(t => t === 'getDraftListSummary').length);
  assert.equal(truoc, 1, 'preloaded once');
  const batDau = Date.now();
  await page.evaluate(() => goTo('draft'));
  await page.waitForFunction(() => document.querySelector('#draft-table-wrap table'), null, { timeout: 5000 });
  assert.ok(Date.now() - batDau < TRE_MS, 'list shown without waiting for the server');
  assert.equal(await page.evaluate(() => window.__goi.filter(t => t === 'getDraftListSummary').length), 1, 'no second load');
  await context.close();
});

test('reopening shows the last home figures at once, then replaces them with fresh ones', async () => {
  const context = await browser.newContext();
  const lan1 = await moTrang(context);
  await lan1.page.waitForFunction(() => document.getElementById('s-draft') && document.getElementById('s-draft').textContent === '2');
  await lan1.page.close();
  const { page, batDau } = await moTrang(context); // cùng trình duyệt -> có số liệu đã lưu
  await page.waitForFunction(() => document.getElementById('s-draft') && document.getElementById('s-draft').textContent === '2', null, { timeout: 5000 });
  assert.ok(Date.now() - batDau < TRE_MS * 2, 'saved figures shown right after the login check, long before the home figures are computed');
  assert.match(await page.textContent('#dash-dang-cu'), /Đang cập nhật/);
  await page.waitForFunction(() => document.getElementById('dash-dang-cu').textContent === '', null, { timeout: 8000 });
  await context.close();
});

test('logging out removes the saved home figures', async () => {
  const context = await browser.newContext();
  const { page } = await moTrang(context);
  await page.waitForFunction(() => document.getElementById('s-draft') && document.getElementById('s-draft').textContent === '2');
  assert.ok(await page.evaluate(() => localStorage.getItem('hak_trang_chu_v1')));
  await page.evaluate(() => dangXuatWeb());
  assert.equal(await page.evaluate(() => localStorage.getItem('hak_trang_chu_v1')), null);
  await context.close();
});
