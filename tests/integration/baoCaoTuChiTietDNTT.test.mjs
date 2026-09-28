import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Người dùng chốt 28/09/2026: (a) Bảng Kê Chi Tiết CK lấy thẳng ChiTietDNTT; (b) Báo Cáo
// Thanh Toán Chi Tiết lọc theo Ngày CK; (c) in "Phiếu chi tiết hoàn thành thanh toán" có Ngày CK.
const NGAY_CK = '2026-01-15';
function daChot() {
  const w = buildWorld();
  const ctd = w.main.getSheetByName('ChiTietDNTT');
  ctd.data = [ctd.data[0]]; // bỏ dòng mẫu rút gọn: để Duyệt tự ghép ChiTietDNTT đầy đủ như thật
  w.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').data[1][16] = new Date(Date.UTC(2026, 0, 14, 5)); // Ngày ĐN của A1
  const ctx = loadCode(w.options);
  assert.match(ctx.run('runConfirmPayment_')(['A1'], NGAY_CK), /^✅/);
  let docPc = 0;
  const pc = w.pc.getSheetByName('PhieuCan_DN');
  const goc = pc.getRange.bind(pc);
  pc.getRange = (...a) => { docPc++; return goc(...a); };
  return { ...ctx, w, ctd, docPc: () => docPc };
}
const bangKe = ({ run, env }) => {
  const sh = env.SpreadsheetApp.create('BK').getSheets()[0];
  const hoSo = Array.from(run('get112ViewData_')('', '')).filter(r => r.idHeThong === 'A1'); // đúng dòng màn Báo Cáo gửi lên
  assert.equal(hoSo.length, 1);
  run('renderSheet2Detail_')(sh, hoSo, 'x');
  return sh.rows(26).slice(4).filter(r => typeof r[0] === 'number');
};

test('(a) the detail sheet of "Export report" is taken from ChiTietDNTT, without reading the weigh-ticket file', () => {
  const ctx = daChot();
  ctx.ctd.data.slice(1).filter(r => r[0] === 'A1').forEach(r => { r[7] = 'XE-TU-CHITIET'; });
  const dong = bangKe(ctx);
  assert.equal(dong.length, 2);
  assert.deepEqual(dong.map(r => r[0]), [1, 2]);
  assert.ok(dong.every(r => r[7] === 'XE-TU-CHITIET'), 'values come from ChiTietDNTT');
  assert.equal(dong[0][3], '15/01/2026', 'Ngày CK in the export region format');
  assert.equal(ctx.docPc(), 0, 'weigh-ticket file not read');
});

test('(a) a record missing from ChiTietDNTT is still rebuilt from the ledger + weigh tickets', () => {
  const ctx = daChot();
  ctx.ctd.data = ctx.ctd.data.filter((r, i) => i === 0 || r[0] !== 'A1');
  const dong = bangKe(ctx);
  assert.deepEqual(dong.map(r => String(r[2]).replace(/'/g, '')), ['PC001', 'PC002']);
  assert.ok(ctx.docPc() > 0, 'fallback join reads the weigh tickets');
});

test('(b) the detailed payment report filters by Ngày CK, not by the time the row was written', () => {
  const { run } = daChot();
  const theoCK = run('getChiTietDNTTDaChot_')(NGAY_CK, NGAY_CK);
  assert.deepEqual(Array.from(theoCK.items).map(x => x.soPhieuCan).sort(), ['PC001', 'PC002']);
  assert.equal(theoCK.items[0].ngayCK, '15/01/2026');
  const homNay = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  assert.equal(run('getChiTietDNTTDaChot_')(homNay, homNay).items.length, 0, 'written today but paid on 15/01: not in today\'s range');
});

test('(c) completed-payment slip: PDF with the payment date (Ngày CK) and the paid tickets', () => {
  const { run, env } = daChot();
  const res = run('webInPhieuHoanThanhThanhToan_')('A1', '');
  assert.ok(res.success, res.message);
  const f = env.driveFiles[0];
  assert.equal(f.name, 'PHIEU HOAN THANH THANH TOAN A1.pdf');
  assert.match(f.nguon, /PHIẾU CHI TIẾT HOÀN THÀNH THANH TOÁN/);
  assert.match(f.nguon, /Ngày thanh toán \(Ngày CK\)<\/th><td class=""><b>15\/01\/2026<\/b>/);
  assert.match(f.nguon, /Số tiền đã thanh toán/);
  assert.match(f.nguon, /Tổng cộng \(2 phiếu\)/);
  assert.equal(run('webInPhieuHoanThanhThanhToan_')('KHONG_CO', '').success, false);
  assert.equal(run('API_ROUTES.webInPhieuHoanThanhThanhToan.quyen'), run('API_ROUTES.webExportReport.quyen'), 'same permission as the report page export');
});

test('(a) same detail sheet whether taken from ChiTietDNTT or rebuilt by the join', () => {
  const a = daChot(), b = daChot();
  b.ctd.data = b.ctd.data.filter((r, i) => i === 0 || r[0] !== 'A1');
  assert.deepEqual(bangKe(a), bangKe(b));
});

test('(c) the completed-payment slip always shows the transfer text and the note', () => {
  const w = buildWorld();
  const h = w.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').data[1];
  h[7] = 'Thanh toán tiền mua gỗ keo HĐ số HD01 ngày 01.09.2026'; h[15] = 'Tổng KL: 2.00 | Đã trả: 0.00 | Còn lại: 2.00';
  const { run, env } = loadCode(w.options);
  assert.match(run('runConfirmPayment_')(['A1'], NGAY_CK), /^✅/);
  const html = (run('webInPhieuHoanThanhThanhToan_')('A1', ''), env.driveFiles[0].nguon);
  assert.match(html, /Nội dung chuyển khoản<\/th><td class="">Thanh toán tiền mua gỗ keo HĐ số HD01 ngày 01\.09\.2026</);
  assert.match(html, /Ghi chú<\/th><td class="">Tổng KL: 2\.00<br>Đã trả: 0\.00<br>Còn lại: 2\.00</);
});

test('(c) a record whose transfer text is empty in the ledger gets the standard text from its contract', () => {
  const w = buildWorld();
  const h = w.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').data[1];
  h[7] = ''; h[9] = new Date(Date.UTC(2026, 8, 1, 5)); h[15] = '';
  const { run, env } = loadCode(w.options);
  assert.match(run('runConfirmPayment_')(['A1'], NGAY_CK), /^✅/);
  run('webInPhieuHoanThanhThanhToan_')('A1', '');
  const html = env.driveFiles[0].nguon;
  assert.match(html, /Nội dung chuyển khoản<\/th><td class="">Thanh toán tiền mua gỗ keo HĐ số HD01 ngày 01\.09\.2026</);
  assert.match(html, /Ghi chú<\/th><td class="">—</, 'the note row is always printed');
});
