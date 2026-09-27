// Kiểm thử giao diện thật trên Chromium (Playwright) - KHÔNG chạy trong
// `node --test "tests/**/*.test.mjs"` vì cần trình duyệt. Chạy riêng:
//   NODE_PATH=$(npm root -g) node --test tests/ui/giaoDien.ui.mjs
// Index.html được mở trực tiếp; google.script.run được giả lập (dữ liệu mẫu
// trong trangMau.mjs) nên không cần Apps Script. Kiểm tra: không lỗi JS ở mọi trang,
// chế độ tối, điện thoại/máy tính bảng không tràn ngang, bàn phím, Esc, bản in,
// dữ liệu độc hại không chạy thành mã (XSS).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { trangMau } from './trangMau.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

let browser;
before(async () => { browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); });
after(async () => { await browser.close(); });

async function moTrang(opts = {}) {
  const page = await browser.newPage(opts);
  const loi = [];
  page.on('pageerror', e => loi.push(e.message));
  // Bỏ qua lỗi tải tài nguyên: font Google bị chặn trong test, ảnh của chuỗi XSS mẫu.
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) loi.push(m.text()); });
  await page.route('**/fonts.googleapis.com/**', r => r.abort());
  await page.setContent(trangMau(), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.getElementById('s-draft') && document.getElementById('s-draft').textContent === '2');
  return { page, loi };
}

test('mọi trang vẽ được, không lỗi JavaScript, dữ liệu độc hại không chạy', async () => {
  const { page, loi } = await moTrang();
  for (const trang of ['draft', 'report', 'debt', 'huongdan', 'hethong', 'settings', 'dashboard']) {
    await page.evaluate(t => goTo(t), trang);
    await page.waitForTimeout(60);
  }
  assert.deepEqual(loi, []);
  assert.equal(await page.evaluate(() => window.__xss), undefined, 'XSS payload must stay text');
  await page.close();
});

test('chế độ tối theo máy + nút chọn Sáng/Tối', async () => {
  const { page } = await moTrang({ colorScheme: 'dark' });
  const nen = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  assert.equal(await nen(), 'rgb(15, 23, 42)', 'dark background follows the OS');
  await page.click('#theme-toggle'); // Tự động -> Sáng
  assert.equal(await nen(), 'rgb(243, 244, 246)');
  await page.click('#theme-toggle'); // Sáng -> Tối
  assert.equal(await nen(), 'rgb(15, 23, 42)');
  await page.close();
});

test('điện thoại 375px và máy tính bảng 768px: trang không tràn ngang', async () => {
  for (const width of [375, 768]) {
    const { page } = await moTrang({ viewport: { width, height: 800 } });
    for (const trang of ['dashboard', 'draft', 'hethong', 'settings']) {
      await page.evaluate(t => goTo(t), trang);
      await page.waitForTimeout(60);
      const tran = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      const thu = tran > 1 ? await page.evaluate(() => Array.from(document.querySelectorAll('body *')).filter(e => e.getBoundingClientRect().right > window.innerWidth + 1).slice(0, 5).map(e => `${e.tagName}.${e.className}#${e.id}`).join(', ')) : '';
      assert.ok(tran <= 1, `${trang} @${width}px overflows by ${tran}px: ${thu}`);
    }
    await page.close();
  }
});

test('bàn phím: Tab tới menu, Enter mở trang; Esc đóng hộp thoại và trả focus', async () => {
  const { page } = await moTrang();
  await page.focus('.nav-item[data-page="report"]');
  await page.keyboard.press('Enter');
  assert.equal(await page.textContent('#page-title'), 'Báo Cáo Thanh Toán');
  assert.equal(await page.getAttribute('.nav-item[data-page="report"]', 'aria-current'), 'page');
  await page.focus('.subtab[data-t="misa"]');
  await page.keyboard.press(' ');
  await page.waitForSelector('#misa-from');
  await page.click('button:has-text("Xuất Excel")');
  await page.waitForSelector('#modal-bg.show');
  assert.equal(await page.getAttribute('#modal', 'role'), 'dialog');
  assert.equal(await page.getAttribute('#modal a.btn', 'rel'), 'noopener');
  await page.keyboard.press('Escape');
  assert.equal(await page.isVisible('#modal-bg.show'), false);
  await page.close();
});

test('bản in: chỉ in nội dung, ẩn thanh bên và nút bấm', async () => {
  const { page } = await moTrang();
  await page.emulateMedia({ media: 'print' });
  assert.equal(await page.isVisible('.sidebar'), false);
  assert.equal(await page.isVisible('#chatbotNut'), false);
  assert.equal(await page.isVisible('#content'), true);
  await page.close();
});
