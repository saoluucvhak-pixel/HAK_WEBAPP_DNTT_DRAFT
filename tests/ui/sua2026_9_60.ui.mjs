// 2026.9.60 - P1-03 / P1-04 / P1-05 + thông báo Đồng bộ bổ sung (P0-01). Chạy:
//   NODE_PATH=$(npm root -g) node --test tests/ui/sua2026_9_60.ui.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { trangMau, tuyChonChromium } from './trangMau.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const URL = 'http://hak.test/';
let browser;
before(async () => { browser = await chromium.launch(tuyChonChromium()); });
after(async () => { await browser.close(); });

/** Mở trang mẫu đã đăng nhập; `truocKhiChay` chạy trước mã của trang (đặt sẵn localStorage...). */
async function moTrang(context, { truocKhiChay } = {}) {
  const page = await context.newPage();
  const loi = [];
  page.on('pageerror', e => loi.push(e.message));
  await page.route('**/fonts.googleapis.com/**', r => r.abort());
  await page.route(URL, r => r.fulfill({ contentType: 'text/html; charset=utf-8', body: trangMau().replace('data-phien=""', 'data-phien="P"') }));
  if (truocKhiChay) await page.addInitScript(truocKhiChay);
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof state !== 'undefined' && state.nguoiDung && state.nguoiDung.daDangNhap);
  return { page, loi };
}
/** Thay máy chủ giả: ten -> hàm (args) trả {ok} | {loi}; ghi lại mọi lượt gọi vào window.__goi. */
async function datMayChu(page) {
  await page.evaluate(() => {
    window.__goi = []; window.__xuLy = window.__xuLy || {};
    const goc = Object.getOwnPropertyDescriptor(window.google.script, 'run').get;
    Object.defineProperty(window.google.script, 'run', { configurable: true, get() {
      const r = goc.call(this); const apiGoc = r.api;
      let ok = () => {}, loi = () => {};
      r.withSuccessHandler = f => { ok = f; return r; }; r.withFailureHandler = f => { loi = f; return r; };
      r.api = (phien, ten, args) => {
        window.__goi.push(ten);
        const x = window.__xuLy[ten];
        if (!x) { const v = window.__DU_LIEU[ten]; setTimeout(() => ok(v === undefined ? {} : JSON.parse(JSON.stringify(v))), 0); return; }
        const kq = x(args); setTimeout(() => kq && kq.loi ? loi(new Error(kq.loi)) : ok(kq.ok), kq && kq.tre || 0);
      };
      void apiGoc; return r;
    } });
  });
}

test('P1-03: a failed contract/bank-account load is not cached - the next use asks the server again', async () => {
  const context = await browser.newContext();
  const { page, loi } = await moTrang(context);
  await datMayChu(page);
  await page.evaluate(() => { let lan = 0; window.__xuLy.getBulkReferenceData = () => (++lan === 1 ? { loi: 'Mất mạng' } : { ok: { hopDong: [{ soHD: 'HD01' }], taiKhoan: [] } }); });
  const lan1 = await page.evaluate(() => ensureBulkRef());
  assert.equal(lan1.loi, true);
  assert.equal(await page.evaluate(() => localStorage.getItem('hak_bulk_ref_v1')), null, 'error is not stored as valid cache');
  const lan2 = await page.evaluate(() => ensureBulkRef());
  assert.equal(lan2.hopDong.length, 1, 'second call retried and got data');
  assert.equal(await page.evaluate(() => window.__goi.filter(t => t === 'getBulkReferenceData').length), 2);
  const lan3 = await page.evaluate(() => ensureBulkRef());
  assert.equal(lan3.hopDong.length, 1);
  assert.equal(await page.evaluate(() => window.__goi.filter(t => t === 'getBulkReferenceData').length), 2, 'good data is cached');
  // dữ liệu sai dạng (không có mảng) cũng không được giữ
  await page.evaluate(() => { invalidateBulkRef(); window.__xuLy.getBulkReferenceData = () => ({ ok: null }); });
  assert.equal((await page.evaluate(() => ensureBulkRef())).loi, true);
  assert.equal(await page.evaluate(() => _bulkRefPromise), null);
  assert.deepEqual(loi, []);
  await context.close();
});

test('P1-04: logging out clears business data from the browser but keeps the theme choice', async () => {
  const context = await browser.newContext();
  const { page } = await moTrang(context);
  await datMayChu(page);
  await page.evaluate(async () => {
    window.__xuLy.getBulkReferenceData = () => ({ ok: { hopDong: [{ soHD: 'HD01', cccd: '0123' }], taiKhoan: [] } });
    await ensureBulkRef();
    localStorage.setItem('hak_giao_dien', 'dark');
    sessionStorage.setItem('hak_tao_moi_nhap_v1', JSON.stringify({ email: 'qt@hak.test', data: { hoTenChuRung: 'A', cccd: '0123' } }));
  });
  await page.waitForFunction(() => localStorage.getItem('hak_trang_chu_v1'));
  assert.ok(await page.evaluate(() => localStorage.getItem('hak_bulk_ref_v1')));
  await page.evaluate(() => dangXuatWeb());
  const con = await page.evaluate(() => ({ ls: Object.keys(localStorage), ss: Object.keys(sessionStorage), p: _bulkRefPromise }));
  assert.ok(!con.ls.includes('hak_bulk_ref_v1') && !con.ls.includes('hak_trang_chu_v1'), con.ls.join(','));
  assert.ok(!con.ss.includes('hak_tao_moi_nhap_v1'), con.ss.join(','));
  assert.ok(con.ls.includes('hak_giao_dien'), 'theme choice kept');
  assert.equal(con.p, null);
  await context.close();
});

test('P1-04: opening the app as another account on the same browser drops the previous account\'s cached data', async () => {
  const context = await browser.newContext();
  const { page } = await moTrang(context, { truocKhiChay: () => {
    localStorage.setItem('hak_tai_khoan_v1', 'nguoi.truoc@hak.test');
    localStorage.setItem('hak_bulk_ref_v1', JSON.stringify({ email: 'nguoi.truoc@hak.test', fetchedAt: Date.now(), data: { hopDong: [{ soHD: 'CU' }], taiKhoan: [] } }));
    sessionStorage.setItem('hak_tao_moi_nhap_v1', JSON.stringify({ email: 'nguoi.truoc@hak.test', data: { hoTenChuRung: 'X' } }));
  } });
  await page.waitForFunction(() => localStorage.getItem('hak_tai_khoan_v1') === 'qt@hak.test');
  const kq = await page.evaluate(() => ({ bulk: localStorage.getItem('hak_bulk_ref_v1'), nhap: _docNhapTaoMoi_() }));
  assert.ok(!kq.bulk || JSON.parse(kq.bulk).email === 'qt@hak.test', 'previous account\'s contracts are gone');
  assert.equal(kq.nhap, null, 'previous account\'s unsaved form is not restored');
  await context.close();
});

test('P1-05: a write action clicked twice is sent once; read actions are not blocked', async () => {
  const context = await browser.newContext();
  const { page } = await moTrang(context);
  await datMayChu(page);
  await page.evaluate(() => { window.__xuLy.webConfirmPayment = () => ({ ok: { success: true, message: '✅' }, tre: 300 }); window.__xuLy.getReportList = () => ({ ok: [], tre: 300 }); });
  const kq = await page.evaluate(async () => {
    const a = call('webConfirmPayment', [['A1'], '2026-10-11'], 'Đang chốt...');
    const b = call('webConfirmPayment', [['A1'], '2026-10-11'], 'Đang chốt...').then(() => 'chay', e => e.message);
    const c = call('getReportList', ['2026-10-01', '2026-10-11'], null); const d = call('getReportList', ['2026-10-01', '2026-10-11'], null);
    await Promise.all([a, c, d]);
    const sau = await call('webConfirmPayment', [['A1'], '2026-10-11'], 'Đang chốt...'); // lượt trước xong -> gửi lại được
    return { b: await b, sau: sau.success, goi: window.__goi };
  });
  assert.match(kq.b, /bỏ qua lần gửi lặp/);
  assert.equal(kq.goi.filter(t => t === 'webConfirmPayment').length, 2, 'duplicate click not sent; later attempt allowed');
  assert.equal(kq.goi.filter(t => t === 'getReportList').length, 2, 'reads are not deduplicated');
  assert.equal(kq.sau, true);
  await context.close();
});

test('P1-05: a failed server call does not leave an "Uncaught (in promise)" error', async () => {
  const context = await browser.newContext();
  const { page, loi } = await moTrang(context);
  await datMayChu(page);
  const chuaXuLy = [];
  page.on('console', m => { if (/Uncaught/.test(m.text())) chuaXuLy.push(m.text()); });
  await page.evaluate(() => { window.__xuLy.webRunCreate112 = () => ({ loi: 'Lỗi giả lập' }); call('webRunCreate112', [], null); });
  await page.waitForTimeout(300);
  assert.deepEqual(chuaXuLy, []);
  assert.deepEqual(loi, []);
  await context.close();
});

test('P0-01: the draft list shows records that still need ChiTietDNTT / MISA catch-up, with a button that runs it', async () => {
  const context = await browser.newContext();
  const { page, loi } = await moTrang(context);
  await datMayChu(page);
  await page.evaluate(() => {
    let con = true;
    window.__xuLy.getDongBoBoSung = () => ({ ok: con ? { soLuot: 1, soHoSo: 1, ds: [{ ids: ['A1'], luc: '11/10/2026 09:00', trangThai: 'HOAN_TAT_MOT_PHAN', thieuMisa: 2, thieuChiTiet: 0 }] } : null });
    window.__xuLy.webDongBoBoSungSauDuyet = () => { con = false; return { ok: { success: true, message: '✅ Đã đồng bộ đủ' } }; };
    goTo('draft');
  });
  await page.waitForSelector('#dong-bo-bo-sung .card');
  assert.match(await page.textContent('#dong-bo-bo-sung'), /CẦN ĐỒNG BỘ BỔ SUNG[\s\S]*A1[\s\S]*MISA thiếu 2 phiếu/);
  await page.click('#nut-dong-bo-bo-sung');
  await page.waitForFunction(() => document.getElementById('dong-bo-bo-sung').textContent.trim() === '');
  assert.deepEqual(loi, []);
  await context.close();
});

test('Đối soát toàn vẹn: System page shows totals, filters by code / level, marks unchecked codes and escapes data', async () => {
  const context = await browser.newContext();
  const { page, loi } = await moTrang(context);
  await datMayChu(page);
  await page.evaluate(() => {
    window.__xuLy.getDoiSoatToanVenThanhToan = () => ({ ok: { success: true, luc: '11/10/2026 10:00', ghiChu: 'Chỉ đọc.', loiKiem: [],
      tongQuan: { soHoSo: 3, soPhieu: 5, tongKg: 5000, tongTien: 5e6, soHoSoLoi: 2, soPhieuTrung: 0, soHoSoThieuMisa: 1, soHoSoLechTien: 1, soPhieuChuaKhoa: 0 },
      dsMa: [{ ma: 'D06', ten: 'Số tiền CT không bằng 112', so: 1, chuaKiem: '' }, { ma: 'D10', ten: 'Thiếu MISA', so: 1, chuaKiem: '' }, { ma: 'D20', ten: 'Sửa sau xuất', so: 0, chuaKiem: 'Chưa có.' }],
      rows: [{ ma: 'D06', ten: 'Lệch tiền', mucDo: 'BLOCK', idKey: 'A1', phieu: '', ngayTT: '11/10/2026', kyVong: '2.000.000 đ', hienTai: '1.000 đ', ghiChu: '<img src=x onerror="window.__xss=1">' },
        { ma: 'D10', ten: 'Thiếu MISA', mucDo: 'WARNING', idKey: 'B2', phieu: 'PC003', ngayTT: '11/10/2026', kyVong: 'Có', hienTai: 'Không', ghiChu: 'Tạo bổ sung' }] } });
    goTo('hethong');
  });
  await page.waitForSelector('#doisoat-tv-result', { state: 'attached' });
  await page.click('button[onclick="doDoiSoatToanVen()"]');
  await page.waitForSelector('#doisoat-tv-result > div[style*="overflow"] table');
  const chu = await page.textContent('#doisoat-tv-result');
  assert.match(chu, /Hồ sơ thiếu MISA[\s\S]*1/);
  assert.match(chu, /Chưa kiểm tra: Chưa có\./);
  assert.equal(await page.locator('#doisoat-tv-result > div[style*="overflow"] tbody tr').count(), 2);
  await page.selectOption('#dstv-muc', 'BLOCK');
  assert.doesNotMatch(await page.textContent('#doisoat-tv-result > div[style*="overflow"]'), /PC003/);
  assert.equal(await page.evaluate(() => window.__xss), undefined);
  assert.equal(await page.evaluate(() => window.__goi.filter(t => t !== 'getDoiSoatToanVenThanhToan' && !/^get/.test(t)).length), 0, 'read-only: no write call');
  assert.deepEqual(loi, []);
  await context.close();
});
