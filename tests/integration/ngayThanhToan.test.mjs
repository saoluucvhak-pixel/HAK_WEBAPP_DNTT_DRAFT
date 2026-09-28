import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Ngày thanh toán (Ngày CK) lúc Duyệt: người dùng báo chọn 26/09/2026 mà sổ ghi
// 09/02/2028 - vùng lãnh thổ US đọc "26/09/2026" thành tháng 26, không kiểm tra.
function world(vung) {
  const w = buildWorld();
  const code = loadCode(w.options);
  if (vung) code.env.PropertiesService.getScriptProperties().setProperty('REGION_LOCALE', vung);
  const ngayCK = () => w.main.getSheetByName('DNTT_GK_DN_CT').rows(22).slice(1).map(r => r[20] instanceof Date ? r[20].toISOString().slice(0, 10) : r[20]);
  return { w, ngayCK, ...code };
}

test('a date that does not exist in the configured order is refused and nothing is written', () => {
  const { run, ngayCK } = world('US');
  const msg = run('runConfirmPayment_')(['A1'], '26/09/2026'); // theo mm/dd: tháng 26
  assert.match(msg, /^❌.*26\/09\/2026.*không phải ngày có thật/);
  assert.deepEqual(ngayCK(), [], 'no record was closed');
  for (const sai of ['31/02/2026', '00/05/2026', '2026-13-01', '15/08/1900']) {
    assert.match(world('VN').run('runConfirmPayment_')(['A1'], sai), /^❌/, sai);
  }
});

test('the date picker value (yyyy-mm-dd) is read the same way whatever the region', () => {
  for (const vung of ['VN', 'US']) {
    const { run, ngayCK } = world(vung);
    assert.match(run('runConfirmPayment_')(['A1'], '2026-09-26'), /^✅/);
    assert.deepEqual(ngayCK(), ['2026-09-26', '2026-09-26'], vung);
  }
});

test('typed dates still follow the configured region', () => {
  const vn = world('VN'); assert.match(vn.run('runConfirmPayment_')(['A1'], '26/09/2026'), /^✅/);
  assert.deepEqual(vn.ngayCK(), ['2026-09-26', '2026-09-26']);
  const us = world('US'); assert.match(us.run('runConfirmPayment_')(['A1'], '09/26/2026'), /^✅/);
  assert.deepEqual(us.ngayCK(), ['2026-09-26', '2026-09-26']);
});
