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

test('the 15h summary starts at the 1st of the month, or yesterday on the 1st (end-of-month tickets)', () => {
  const tu = run('_tuNgayTongHop15h_');
  assert.equal(tu('2026-09-25', '2026-09-26'), '2026-09-01');
  assert.equal(tu('2026-09-30', '2026-10-01'), '2026-09-30');
  assert.equal(tu('2026-12-31', '2027-01-01'), '2026-12-31');
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
