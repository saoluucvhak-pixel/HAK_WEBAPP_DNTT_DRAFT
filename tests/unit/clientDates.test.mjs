import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { INDEX, clientFunction } from '../gas/clientSource.mjs';

/** Loads the client date helpers with the clock frozen at `isoInstant`. */
function clientDatesAt(isoInstant) {
  const fixed = new Date(isoInstant).getTime();
  class FrozenDate extends Date { constructor(...a) { super(...(a.length ? a : [fixed])); } }
  const ctx = vm.createContext({ Date: FrozenDate });
  vm.runInContext(['_vnNow_', 'todayISOVN', 'isoDaysAgoVN'].map(clientFunction).join('\n'), ctx);
  return ctx;
}

test('date defaults follow Vietnam time, not UTC', () => {
  // 06:30 on 26/09 in Vietnam is still 25/09 in UTC.
  const c = clientDatesAt('2026-09-25T23:30:00Z');
  assert.equal(c.todayISOVN(), '2026-09-26');
  assert.equal(c.isoDaysAgoVN(1), '2026-09-25');
  assert.equal(c.isoDaysAgoVN(30), '2026-08-27');
});

test('the client has no UTC-based date defaults left', () => {
  assert.doesNotMatch(INDEX, /new Date\(\)\.toISOString\(\)/);
  assert.doesNotMatch(INDEX, /\bisoDaysAgo\(/);
});

test('the payment date box always reads day/month/year, whatever the browser language or region', () => {
  const c = vm.createContext({ Date });
  vm.runInContext(['_vnSangIso', '_isoSangVN'].map(clientFunction).join('\n'), c);
  for (const [go, iso] of [['26/09/2026', '2026-09-26'], ['26-9-2026', '2026-09-26'], ['26.09.2026', '2026-09-26'], ['26092026', '2026-09-26'], [' 1/10/2026 ', '2026-10-01']]) {
    assert.equal(c._vnSangIso(go), iso, go);
  }
  for (const sai of ['09/26/2026', '31/02/2026', '0/1/2026', '26/09/26', '2026-09-26', '', 'abc', '26/09/1999']) {
    assert.equal(c._vnSangIso(sai), '', sai); // tháng 26, ngày không có thật... -> không gửi đi
  }
  assert.equal(c._isoSangVN('2026-09-26'), '26/09/2026');
});
