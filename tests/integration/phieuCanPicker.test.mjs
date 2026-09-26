import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld, pcRow } from '../gas/fixtures.mjs';

function pickerWorld(extraRows) {
  const world = buildWorld();
  const pc = world.pc.getSheetByName('PhieuCan_DN');
  extraRows.forEach(r => pc.data.push(r));
  const { run } = loadCode(world.options);
  run('refreshPhieuCanUnpaidCache_')();
  return { world, run };
}

test('all weigh tickets of the chosen forest owner are returned even behind many "Khách lẻ" tickets', () => {
  const rows = [];
  for (let i = 0; i < 80; i++) rows.push(pcRow('KL' + String(i).padStart(3, '0'), 'Khách lẻ'));
  rows.push(pcRow('PCMOI1', 'Nguyen Van A'), pcRow('PCMOI2', 'Nguyen Van A'));
  const { run } = pickerWorld(rows);
  const list = run('getAvailablePhieuCanForChuRung_')('Nguyen Van A', '');
  const so = list.map(p => p.soPhieuCan);
  assert.ok(so.includes('PCMOI1') && so.includes('PCMOI2'), 'own tickets must not be cut off');
  assert.equal(list.findIndex(p => p.soPhieuCan === 'PCMOI1') < list.findIndex(p => p.laKhachLe), true, 'own tickets come first');
});

test('"Khách lẻ" (with Vietnamese accents) is treated as a generic customer and can be renamed', () => {
  const { run } = pickerWorld([pcRow('KL900', 'Khách lẻ')]);
  const p = run('getAvailablePhieuCanForChuRung_')('Nguyen Van A', '').find(x => x.soPhieuCan === 'KL900');
  assert.ok(p, 'generic ticket is listed by default');
  assert.equal(p.khopTen, true);
  assert.equal(p.laKhachLe, true);
});

test('a ticket with a wrong customer name is found by its number and flagged', () => {
  const { run } = pickerWorld([pcRow('PC555', 'Nguyen Van Aa')]);
  assert.equal(run('getAvailablePhieuCanForChuRung_')('Nguyen Van A', '').some(x => x.soPhieuCan === 'PC555'), false);
  const p = run('getAvailablePhieuCanForChuRung_')('Nguyen Van A', 'PC555').find(x => x.soPhieuCan === 'PC555');
  assert.ok(p);
  assert.equal(p.khopTen, false);
});
