import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';

const { run } = loadCode();

test('utils.standardize removes spaces/apostrophes, upper-cases and drops .0', () => {
  const s = run('utils.standardize');
  assert.equal(s(" 'nguyen van a "), 'NGUYENVANA');
  assert.equal(s("'0123"), '0123');
  assert.equal(s(12345), '12345');
  assert.equal(s('100.00'), '100');
  assert.equal(s(0), '0');
  assert.equal(s(null), '');
});

test('utils.parseNum keeps numbers and strips non-numeric characters', () => {
  const p = run('utils.parseNum');
  assert.equal(p(1500), 1500);
  assert.equal(p('1500000'), 1500000);
  assert.equal(p(''), 0);
  assert.equal(p('abc'), 0);
  assert.equal(p(NaN), 0);
});

test('utils.isBlank', () => {
  const b = run('utils.isBlank');
  assert.equal(b(''), true);
  assert.equal(b('  '), true);
  assert.equal(b(null), true);
  assert.equal(b(0), false);
  assert.equal(b('x'), false);
});

test('_parseNgayVN_ parses dd/MM/yyyy as a noon-UTC date (no day/month swap)', () => {
  const parse = run('_parseNgayVN_');
  const d = parse('05/11/2026');
  assert.equal(d.getUTCFullYear(), 2026);
  assert.equal(d.getUTCMonth(), 10);
  assert.equal(d.getUTCDate(), 5);
  const d2 = parse('25/12/2026');
  assert.equal(d2.getUTCMonth(), 11);
  assert.equal(d2.getUTCDate(), 25);
});

test('_mocThangHienTaiGMT7_ matches formatDate(GMT+7, "yyyy-MM") around month/year edges', () => {
  const moc = run('_mocThangHienTaiGMT7_');
  const fmt = run('Utilities.formatDate');
  const nows = ['2026-12-31T16:59:59Z', '2026-12-31T17:00:00Z', '2026-01-31T18:00:00Z', '2026-02-28T16:30:00Z', '2026-09-26T03:00:00Z'];
  for (const iso of nows) {
    const now = new Date(iso);
    const { dauThangNay, dauThangSau } = moc(now);
    const thang = fmt(now, 'GMT+7', 'yyyy-MM');
    const probes = [-1, 0, 1].flatMap(d => [dauThangNay.getTime() + d, dauThangSau.getTime() + d]).map(t => new Date(t));
    for (let i = 0; i < 400; i++) probes.push(new Date(now.getTime() + (i - 200) * 3.7 * 3600 * 1000));
    for (const p of probes) {
      assert.equal(p >= dauThangNay && p < dauThangSau, fmt(p, 'GMT+7', 'yyyy-MM') === thang, `${iso} vs ${p.toISOString()}`);
    }
  }
});

test('_isRecordEditable_ only allows "Chờ ĐNTT" (amount > 0 and not confirmed)', () => {
  const editable = run('_isRecordEditable_');
  const row = new Array(24).fill('');
  row[6] = 0;
  assert.equal(editable(row), false);
  row[6] = 1000;
  assert.equal(editable(row), true);
  row[23] = 'Đang ĐNTT';
  assert.equal(editable(row), false);
});
