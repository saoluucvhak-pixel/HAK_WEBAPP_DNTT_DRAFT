import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld, pcRow, rowWasWritten } from '../gas/fixtures.mjs';

test('refreshPhieuCanUnpaidCache_ keeps leading zeros and does not blank the mirror first', () => {
  const world = buildWorld();
  const pc = world.pc.getSheetByName('PhieuCan_DN');
  pc.data.push(pcRow('0456', 'Le Van C'));
  const mirror = world.draft.addSheet('PhieuCan_DN_CHUA_TT_DRAFT', [['old'], ['stale1'], ['stale2'], ['stale3'], ['stale4'], ['stale5'], ['stale6']]);
  const { run } = loadCode(world.options);

  const n = run('refreshPhieuCanUnpaidCache_')();
  assert.equal(n, 5);
  const rows = mirror.rows(28);
  assert.equal(rows.length, 6);
  assert.equal(rows[5][0], '0456');
  assert.equal(rows[5][22], '0456');
  assert.equal(mirror.writes.some(w => w.op === 'clear'), false);
});

test('runProcessDetail only writes the status cell of processed source rows', () => {
  const world = buildWorld();
  const src = world.main.getSheetByName('DNTT_GK_DN');
  src.data[0][10] = 'Số phiếu cân';
  const legacy = new Array(18).fill('');
  legacy[0] = 'L1'; legacy[3] = 'Khach Legacy'; legacy[10] = 'PC999';
  src.data.push(legacy);
  const { run } = loadCode(world.options);

  const msg = run('runProcessDetail')();
  assert.match(msg, /^✅/, msg);
  assert.equal(src.rows(18)[2][14], 'Đang xử lý (Nháp)');
  assert.equal(rowWasWritten(src, 1), false);
  assert.equal(rowWasWritten(src, 2), false);
  const draftIds = world.draft.getSheetByName('DNTT_GK_DN_CT_DRAFT').rows().slice(1).map(r => r[1]);
  assert.ok(draftIds.includes('L1'));
});

test('runFillMissingBankOnly only writes the empty bank cells', () => {
  const world = buildWorld();
  const h112 = world.main.getSheetByName('DNTT_GK_DN_112');
  const empty = new Array(23).fill(''); empty[0] = 'X1'; empty[5] = '0123456789'; empty[8] = 'HD01';
  const full = new Array(23).fill(''); full[0] = 'X2'; full[4] = 'VCB'; full[5] = '999'; full[8] = 'HD02';
  h112.data.push(full, empty);
  const stk = new Array(9).fill(''); stk[5] = '0123456789'; stk[6] = 'BIDV'; stk[8] = 'HD01';
  world.hd.getSheetByName('HD_STK').data.push(stk);
  const { run } = loadCode(world.options);

  const msg = run('runFillMissingBankOnly')();
  assert.match(msg, /^✅/, msg);
  assert.equal(h112.rows(23)[2][4], 'BIDV');
  assert.equal(h112.rows(23)[1][4], 'VCB');
  assert.equal(rowWasWritten(h112, 2), false);
  assert.equal(rowWasWritten(h112, 1), false);
});

test('runXacNhanDNTT / runHuyXacNhanDNTT only touch the status cell', () => {
  const world = buildWorld();
  const h112 = world.draft.getSheetByName('DNTT_GK_DN_112_DRAFT');
  const { run } = loadCode(world.options);
  const res = run('runXacNhanDNTT')(['B2'], true);
  assert.equal(res.success, true, res.message);
  assert.equal(h112.rows(24)[2][23], 'Đang ĐNTT');
  assert.equal(rowWasWritten(h112, 2), false);
  assert.ok(h112.writes.every(w => w.col === 24 && w.numCols === 1));

  const undo = run('runHuyXacNhanDNTT')('B2');
  assert.equal(undo.success, true, undo.message);
  assert.equal(h112.rows(24)[2][23], '');
  assert.ok(h112.writes.every(w => w.col === 24 && w.numCols === 1));
});

test('runDeleteDraftRecord removes only the chosen draft record', () => {
  const world = buildWorld();
  const { run } = loadCode(world.options);
  // B2 is "Chờ ĐNTT" (amount > 0, not confirmed) so it can be deleted.
  const res = run('runDeleteDraftRecord')('B2');
  const ok = typeof res === 'string' ? /^✅/.test(res) : res && res.success;
  assert.ok(ok, JSON.stringify(res));
  const ctIds = world.draft.getSheetByName('DNTT_GK_DN_CT_DRAFT').rows().slice(1).map(r => r[1]);
  assert.deepEqual(ctIds, ['A1', 'A1']);
  const h112Ids = world.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').rows().slice(1).map(r => r[0]);
  assert.deepEqual(h112Ids, ['A1']);
});
