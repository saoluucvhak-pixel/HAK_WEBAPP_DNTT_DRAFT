import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// The mock behaves like an unformatted Google Sheet: "0123" written without a
// leading apostrophe turns into the number 123. These tests fail if any
// rewrite path drops the protection of CCCD / STK / Số HĐ / Số phiếu cân.

function worldWithZeros() {
  const world = buildWorld();
  const ct = world.draft.getSheetByName('DNTT_GK_DN_CT_DRAFT');
  ct.data.slice(1).forEach(r => { r[4] = '0481234567'; r[7] = '0071000123456'; r[19] = '0012/HĐ'; });
  const ct2 = ct.data[1]; ct2[11] = 'PC001';
  const h112 = world.draft.getSheetByName('DNTT_GK_DN_112_DRAFT');
  h112.data.slice(1).forEach(r => { r[5] = '0071000123456'; r[8] = '00123'; r[22] = '202609261030451234'; });
  const src = world.draft.getSheetByName('DNTT_GK_DN_DRAFT');
  src.data.slice(1).forEach(r => { r[4] = '0481234567'; r[8] = '0071000123456'; r[13] = '00123'; });
  const { run } = loadCode(world.options);
  return { world, run };
}

const zerosKept = (rows, cols) => rows.forEach(r => cols.forEach(c => assert.equal(typeof r[c], 'string', `col ${c} = ${r[c]}`)));

test('deleting one draft record keeps leading zeros of the others', () => {
  const { world, run } = worldWithZeros();
  const res = run('runDeleteDraftRecord_')('B2');
  assert.ok(typeof res === 'string' ? /^✅/.test(res) : res.success, JSON.stringify(res));
  const ct = world.draft.getSheetByName('DNTT_GK_DN_CT_DRAFT').rows(22).slice(1);
  zerosKept(ct, [4, 7, 19]);
  assert.equal(ct[0][4], '0481234567');
  zerosKept(world.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').rows(24).slice(1), [5, 8, 22]);
  zerosKept(world.draft.getSheetByName('DNTT_GK_DN_DRAFT').rows(18).slice(1), [4, 8, 13]);
});

test('confirming payment keeps leading zeros in the main sheets and remaining drafts', () => {
  const { world, run } = worldWithZeros();
  assert.match(run('runConfirmPayment_')(['A1'], '2026-09-26'), /^✅/);
  zerosKept(world.main.getSheetByName('DNTT_GK_DN_CT').rows(22).slice(1), [4, 7, 19]);
  zerosKept(world.main.getSheetByName('DNTT_GK_DN_112').rows(23).slice(1), [5, 8, 22]);
  const src = world.main.getSheetByName('DNTT_GK_DN').rows(18).filter(r => r[0] === 'A1');
  zerosKept(src, [4, 8, 13]);
  zerosKept(world.draft.getSheetByName('DNTT_GK_DN_CT_DRAFT').rows(22).slice(1), [4, 7, 19]);
  assert.equal(world.main.getSheetByName('DNTT_GK_DN_112').rows(23)[1][22], '202609261030451234');
});

test('"Tổng Hợp 112" rewrites draft 112 without losing leading zeros', () => {
  const { world, run } = worldWithZeros();
  const msg = run('runCreate112')();
  assert.doesNotMatch(String(msg), /^❌/, msg);
  zerosKept(world.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').rows(24).slice(1), [5, 8, 22]);
});

test('editing one draft record only rewrites its own rows and keeps zeros', () => {
  const { world, run } = worldWithZeros();
  const ct = world.draft.getSheetByName('DNTT_GK_DN_CT_DRAFT');
  ct.writes = [];
  const res = run('updateDraft112Info_')('B2', { stk: '0099887766' });
  assert.equal(res.success, true, res.message);
  const rows = ct.rows(22);
  assert.equal(rows[2][7], '0099887766');           // B2 row updated, zeros kept
  assert.equal(rows[1][7], '0071000123456');        // A1 rows untouched
  assert.ok(ct.writes.every(w => w.row === 3), 'only the B2 row may be written');
});
