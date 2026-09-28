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

test('standard regions: Google Sheet side US, exports (MISA) VN - even when only the system region is set', () => {
  const { run, w, env } = world('US'); // như máy chủ thật: Vùng lãnh thổ US, Vùng xuất chưa cài riêng
  assert.equal(run('_getExportRegion_')(), 'VN');
  assert.match(run('runConfirmPayment_')(['A1'], '2026-09-05'), /^✅/);
  const misa = w.updateNh.getSheetByName('Update_NganHang_DN').rows(33).slice(1);
  assert.deepEqual(misa.map(r => [r[2], r[3]]), [['05/09/2026', '05/09/2026'], ['05/09/2026', '05/09/2026']], 'MISA dates dd/mm/yyyy');
  const chiTiet = w.main.getSheetByName('ChiTietDNTT').rows(28).slice(1).filter(r => r[0] === 'A1');
  assert.ok(chiTiet.length && chiTiet.every(r => r[3] instanceof Date && r[3].toISOString().slice(0, 10) === '2026-09-05'), 'ChiTietDNTT (ledger) stores a real date');
  assert.ok(run('getChiTietDNTTDaChot_')('2026-09-01', '2026-09-30').items.every(x => x.ngayCK === '05/09/2026'), 'web shows dd/mm/yyyy');
  const xuat = run('exportMisaTheoNgayExcel_')('2026-09-05', '2026-09-05');
  const file = env.SpreadsheetApp.openById(/\/d\/([^/]+)/.exec(xuat.url)[1]);
  assert.equal(file.getSheets()[0].rows(33)[1][2], '05/09/2026', 'MISA export file dd/mm/yyyy');
  // Chọn riêng Vùng xuất ở Cài đặt vẫn được tôn trọng.
  env.PropertiesService.getScriptProperties().setProperty('EXPORT_REGION_LOCALE', 'US');
  assert.equal(run('_formatNgayXuat_')(new Date(Date.UTC(2026, 8, 5, 5))), '09/05/2026');
});

test('rule: the web app always shows dd/mm/yyyy; sheets and exports follow the settings', () => {
  const { run, w, env } = world('US');
  env.PropertiesService.getScriptProperties().setProperty('EXPORT_REGION_LOCALE', 'US'); // giả sử Vùng xuất đổi sang US
  assert.match(run('runConfirmPayment_')(['A1'], '2026-09-05'), /^✅/);
  assert.equal(w.updateNh.getSheetByName('Update_NganHang_DN').rows(33)[1][2], '09/05/2026', 'MISA sheet follows the export setting');
  assert.deepEqual(Array.from(run('getMisaDataTheoNgay_')('2026-09-05', '2026-09-05').items, x => x.ngayHachToan), ['05/09/2026', '05/09/2026'], 'web shows VN');
  const ct = run('getChiTietDNTTDaChot_')('2026-09-01', '2026-09-30').items.filter(x => x.idHeThong === 'A1');
  assert.ok(ct.length && ct.every(x => x.ngayCK === '05/09/2026'), 'web shows VN');
  const xuat = run('exportChiTietDNTTDaChotExcel_')('2026-09-01', '2026-09-30');
  const file = env.SpreadsheetApp.openById(/\/d\/([^/]+)/.exec(xuat.url)[1]);
  assert.ok(file.getSheets()[0].rows().some(r => r.includes('09/05/2026')), 'export follows the export setting');
});
