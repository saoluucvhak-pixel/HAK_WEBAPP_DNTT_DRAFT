import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Người dùng yêu cầu 28/09/2026: "BỔ SUNG NÚT IN PHIẾU CHI TIẾT THANH TOÁN PDF".
function inPhieu(props = {}) {
  const world = buildWorld();
  const h = world.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').data[1]; // hồ sơ A1
  h[2] = 'NGUYỄN <b>VĂN</b> A'; h[7] = 'Thanh toán tiền mua gỗ keo HĐ số HD01';
  h[12] = 83.91; h[14] = 28.26; h[15] = 'Tổng KL: 83.91 | Còn lại: 28.26'; h[17] = 1200;
  const ct = world.draft.getSheetByName('DNTT_GK_DN_CT_DRAFT').data;
  ct[1][12] = 14.835; ct[1][16] = 25961250; ct[3][12] = 13.425; ct[3][16] = 23493750;
  Object.assign(world.options.properties || (world.options.properties = {}), props);
  const { run, env } = loadCode(world.options);
  return { res: run('webInPhieuChiTietThanhToan_')('A1'), env, world };
}

test('the payment detail slip is saved as a PDF in the report folder and its link returned', () => {
  const { res, env } = inPhieu();
  assert.ok(res.success, JSON.stringify(res));
  assert.equal(env.driveFiles.length, 1);
  const f = env.driveFiles[0];
  assert.equal(f.mime, 'application/pdf');
  assert.equal(f.name, 'PHIEU CHI TIET THANH TOAN A1.pdf');
  assert.match(res.pdfUrl, /PHIEU%20CHI%20TIET%20THANH%20TOAN%20A1\.pdf$/);
});

test('the slip shows the record, its weigh tickets with totals, and signatures; numbers follow the export region', () => {
  const html = inPhieu().env.driveFiles[0].nguon;
  assert.match(html, /PHIẾU CHI TIẾT THANH TOÁN/);
  assert.match(html, /HOÀNG ANH KHÔI ĐÀ NẴNG/);
  assert.match(html, /1\.200,000 \/ 83,910 \/ 28,260/, 'contract volumes in tonnes, VN separators (export region default VN)');
  assert.match(html, /PC001<\/td><td class="so">14,835<\/td><td class="so">25\.961\.250</);
  assert.match(html, /Tổng cộng \(2 phiếu\)<\/td><td class="so">28,260<\/td><td class="so">49\.455\.000</);
  assert.match(html, /Tổng KL: 83\.91<br>Còn lại: 28\.26/, 'each note part on its own line');
  ['Người lập phiếu', 'Kế toán trưởng', 'Giám đốc'].forEach(k => assert.ok(html.includes(k), k));
  assert.ok(html.includes('NGUYỄN &lt;b&gt;VĂN&lt;/b&gt; A'), 'data is escaped, never rendered as HTML');
  assert.doesNotMatch(html, /\bkg\b/, 'no wrong unit');
});

test('with export region US the slip uses US separators', () => {
  const html = inPhieu({ EXPORT_REGION_LOCALE: 'US' }).env.driveFiles[0].nguon;
  assert.match(html, /1,200\.000 \/ 83\.910 \/ 28\.260/);
});

test('an unknown record is refused without creating a file', () => {
  const world = buildWorld();
  const { run, env } = loadCode(world.options);
  const res = run('webInPhieuChiTietThanhToan_')('KHONG_CO');
  assert.equal(res.success, false);
  assert.equal(env.driveFiles.length, 0);
});

test('the web API exposes the print action to accounting roles only', () => {
  const world = buildWorld();
  const { run } = loadCode(world.options);
  assert.equal(run("API_ROUTES.webInPhieuChiTietThanhToan && API_ROUTES.webInPhieuChiTietThanhToan.quyen"), run('QUYEN.NGHIEP_VU'));
});
