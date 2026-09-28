import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// P-04 (người dùng đồng ý 28/09/2026): Trợ lý AI không tính lại công nợ / quét Phiếu Cân ở MỖI câu hỏi.
function theGioi() {
  const w = buildWorld();
  const ctx = loadCode(w.options);
  ctx.run(`() => {
    globalThis.__dem = { congNoPc: 0, phanTichQuetPc: 0 };
    const g1 = getChiTietCongNoPhieuCanWeb_, g2 = getPaymentAnalysis_;
    getChiTietCongNoPhieuCanWeb_ = (...a) => { __dem.congNoPc++; return g1(...a); };
    getPaymentAnalysis_ = (...a) => { __dem.phanTichQuetPc++; return g2(...a); };
  }`)();
  const dem = { get congNoPc() { return ctx.run('__dem.congNoPc'); }, get phanTichQuetPc() { return ctx.run('__dem.phanTichQuetPc'); } };
  return { ...ctx, w, dem };
}

test('the heavy figures are computed once and reused for the next questions', () => {
  const { run, dem } = theGioi();
  const a = run('_layNgayVaSoLieuThatChoChatbot_')();
  const b = run('_layNgayVaSoLieuThatChoChatbot_')();
  assert.ok(a && a.includes('CÔNG NỢ THEO KHÁCH HÀNG'), String(a).slice(0, 200));
  assert.equal(a, b);
  assert.equal(dem.congNoPc, 1, 'second question reuses the figures');
  assert.equal(dem.phanTichQuetPc, 0, 'no full weigh-ticket scan (uses the pre-aggregated analysis table)');
  assert.match(a, /TỔNG HỢP THEO ĐẠI LÝ \(90 ngày gần nhất\)/);
});

test('after an approval the next question gets fresh figures', () => {
  const { run, dem } = theGioi();
  run('_layNgayVaSoLieuThatChoChatbot_')();
  assert.match(run('runConfirmPayment_')(['A1'], new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10)), /^✅/);
  run('_layNgayVaSoLieuThatChoChatbot_')();
  assert.equal(dem.congNoPc, 2);
});

test('draft counts are always read fresh', () => {
  const { run } = theGioi();
  const truoc = run('_layNgayVaSoLieuThatChoChatbot_')();
  assert.match(run('runDeleteDraftRecord_')('B2'), /^✅/);
  const sau = run('_layNgayVaSoLieuThatChoChatbot_')();
  assert.notEqual(sau, truoc);
  assert.doesNotMatch(sau, /Tran Thi B \(Số HĐ/);
});
