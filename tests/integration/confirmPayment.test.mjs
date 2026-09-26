import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld, rowWasWritten } from '../gas/fixtures.mjs';

function setup() {
  const world = buildWorld();
  const { run } = loadCode(world.options);
  return { world, run };
}

const idsIn = (sheet, col) => sheet.rows().slice(1).map(r => String(r[col]).trim());

test('runConfirmPayment commits the selected record end-to-end', () => {
  const { world, run } = setup();
  const msg = run('runConfirmPayment')(['A1'], '26/09/2026');
  assert.match(msg, /^✅/, msg);

  const ct = world.main.getSheetByName('DNTT_GK_DN_CT').rows(22).slice(1);
  assert.equal(ct.length, 2);
  ct.forEach(r => { assert.equal(r[1], 'A1'); assert.equal(r[18], 'Y'); assert.ok(r[20] instanceof Date); });

  const h112 = world.main.getSheetByName('DNTT_GK_DN_112').rows(23).slice(1);
  assert.equal(h112.length, 1);
  assert.equal(h112[0][0], 'A1');
  assert.equal(h112[0][20], 'Y');

  const src = world.main.getSheetByName('DNTT_GK_DN').rows(18).slice(1);
  const a1 = src.filter(r => r[0] === 'A1');
  assert.equal(a1.length, 1);
  assert.equal(a1[0][14], 'Đóng TT');
  assert.equal(a1[0][15], '20260926_1');
  assert.equal(a1[0][17], 'Y');

  const pc = world.pc.getSheetByName('PhieuCan_DN').rows(28);
  const bySo = Object.fromEntries(pc.slice(1).map(r => [r[22], r]));
  ['PC001', 'PC002'].forEach(so => {
    assert.equal(bySo[so][24], 'OK');
    assert.equal(bySo[so][26], 'Đóng TT');
    assert.equal(bySo[so][27], 'Y');
  });
  assert.equal(bySo.PC003[27], '');
  assert.equal(bySo.PC999[27], '');

  assert.deepEqual(idsIn(world.draft.getSheetByName('DNTT_GK_DN_CT_DRAFT'), 1), ['B2']);
  assert.deepEqual(idsIn(world.draft.getSheetByName('DNTT_GK_DN_112_DRAFT'), 0), ['B2']);
  assert.deepEqual(idsIn(world.draft.getSheetByName('DNTT_GK_DN_DRAFT'), 0), ['B2']);

  const chiTiet = world.main.getSheetByName('ChiTietDNTT').rows(28).slice(1);
  assert.equal(chiTiet.length, 2);
  chiTiet.forEach(r => { assert.equal(r[26], 'Y'); assert.equal(r[3], '26/09/2026'); });

  const misa = world.updateNh.getSheetByName('Update_NganHang_DN').rows(33).slice(1);
  assert.equal(misa.length, 2);
});

test('runConfirmPayment never rewrites unrelated rows of external/main sheets', () => {
  const { world, run } = setup();
  const pcSheet = world.pc.getSheetByName('PhieuCan_DN');
  const srcSheet = world.main.getSheetByName('DNTT_GK_DN');
  const chiTietSheet = world.main.getSheetByName('ChiTietDNTT');
  const msg = run('runConfirmPayment')(['A1'], '26/09/2026');
  assert.match(msg, /^✅/, msg);

  assert.equal(rowWasWritten(pcSheet, 1), false, 'PhieuCan header must not be rewritten');
  assert.equal(rowWasWritten(pcSheet, 3), false, 'PC999 (unrelated) must not be rewritten');
  assert.equal(rowWasWritten(pcSheet, 5), false, 'PC003 (other record) must not be rewritten');
  assert.equal(pcSheet.rows(28)[2][11], '=HYPERLINK("x")');

  assert.equal(rowWasWritten(srcSheet, 1), false, 'DNTT_GK_DN header must not be rewritten');
  assert.equal(rowWasWritten(srcSheet, 2), false, 'unrelated DNTT_GK_DN row must not be rewritten');
  assert.equal(rowWasWritten(chiTietSheet, 1), false, 'ChiTietDNTT header must not be rewritten');
});

test('runConfirmPayment re-run after an interrupted commit does not duplicate data', () => {
  const { world, run } = setup();
  const draftNames = ['DNTT_GK_DN_CT_DRAFT', 'DNTT_GK_DN_112_DRAFT', 'DNTT_GK_DN_DRAFT'];
  const snapshot = draftNames.map(n => world.draft.getSheetByName(n).data.map(r => r.slice()));

  assert.match(run('runConfirmPayment')(['A1'], '26/09/2026'), /^✅/);
  // Simulate a crash that happened before the draft clean-up: drafts still hold A1.
  draftNames.forEach((n, i) => { world.draft.getSheetByName(n).data = snapshot[i].map(r => r.slice()); });
  // Re-running also has to cope with ChiTietDNTT already being "Y".
  const msg = run('runConfirmPayment')(['A1'], '26/09/2026');
  assert.match(msg, /^✅/, msg);

  assert.equal(idsIn(world.main.getSheetByName('DNTT_GK_DN_CT'), 1).filter(id => id === 'A1').length, 2);
  assert.equal(idsIn(world.main.getSheetByName('DNTT_GK_DN_112'), 0).filter(id => id === 'A1').length, 1);
  assert.equal(idsIn(world.main.getSheetByName('DNTT_GK_DN'), 0).filter(id => id === 'A1').length, 1);
  assert.equal(world.main.getSheetByName('ChiTietDNTT').rows().length - 1, 2);
  assert.equal(world.updateNh.getSheetByName('Update_NganHang_DN').rows().length - 1, 2);
  assert.deepEqual(idsIn(world.draft.getSheetByName('DNTT_GK_DN_CT_DRAFT'), 1), ['B2']);
});

test('re-run is also safe when ChiTietDNTT had to be compensated (report never printed)', () => {
  const { world, run } = setup();
  world.main.getSheetByName('ChiTietDNTT').data.length = 1;
  const draftNames = ['DNTT_GK_DN_CT_DRAFT', 'DNTT_GK_DN_112_DRAFT', 'DNTT_GK_DN_DRAFT'];
  const snapshot = draftNames.map(n => world.draft.getSheetByName(n).data.map(r => r.slice()));

  assert.match(run('runConfirmPayment')(['A1'], '26/09/2026'), /^✅/);
  assert.equal(world.main.getSheetByName('ChiTietDNTT').rows().length - 1, 2);
  draftNames.forEach((n, i) => { world.draft.getSheetByName(n).data = snapshot[i].map(r => r.slice()); });
  assert.match(run('runConfirmPayment')(['A1'], '26/09/2026'), /^✅/);

  assert.equal(world.main.getSheetByName('ChiTietDNTT').rows().length - 1, 2);
  assert.equal(world.updateNh.getSheetByName('Update_NganHang_DN').rows().length - 1, 2);
});

test('runConfirmPayment skips records that are not confirmed yet', () => {
  const { world, run } = setup();
  const msg = run('runConfirmPayment')(['B2'], '26/09/2026');
  assert.match(msg, /Chưa "Xác Nhận"/);
  assert.equal(world.main.getSheetByName('DNTT_GK_DN_CT').rows().length, 1);
});
