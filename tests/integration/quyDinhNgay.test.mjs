import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// QUY ĐỊNH (người dùng chốt 28/09/2026): web app dd/mm/yyyy; GHI SỔ (Google Sheet)
// theo Vùng Lãnh Thổ = Date thật + cột ngày định dạng theo vùng; XUẤT FILE theo Vùng xuất.
const iso = d => d.toISOString().slice(0, 10);
const homNayVN = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
function world(xuat) {
  const w = buildWorld();
  const code = loadCode(w.options);
  const props = code.env.PropertiesService.getScriptProperties();
  props.setProperty('REGION_LOCALE', 'US');            // như máy chủ thật
  if (xuat) props.setProperty('EXPORT_REGION_LOCALE', xuat);
  const mo = kq => code.env.SpreadsheetApp.openById(/\/d\/([^/]+)/.exec(kq.url)[1]);
  return { w, mo, ...code };
}

test('ChiTietDNTT ledger stores real dates formatted by the system region; web VN; exports by the export region', () => {
  for (const [xuat, mongDoi] of [['VN', '05/09/2026'], ['US', '09/05/2026']]) {
    const { run, w, mo } = world(xuat);
    assert.match(run('runConfirmPayment_')(['A1'], '2026-09-05'), /^✅/);
    const sh = w.main.getSheetByName('ChiTietDNTT');
    const dong = sh.rows(28).findIndex((r, i) => i > 0 && r[0] === 'A1') + 1;
    const r = sh.rows(28)[dong - 1];
    assert.ok(r[3] instanceof Date && iso(r[3]) === '2026-09-05', 'ledger: real date');
    assert.equal(sh.getRange(dong, 4).getNumberFormat(), 'MM/dd/yyyy', 'ledger column follows the system region (US)');
    const web = run('getChiTietDNTTDaChot_')('2026-09-01', '2026-09-30').items.filter(x => x.idHeThong === 'A1');
    assert.ok(web.length && web.every(x => x.ngayCK === '05/09/2026'), 'web: dd/mm/yyyy');
    const file = mo(run('exportChiTietDNTTDaChotExcel_')('2026-09-01', '2026-09-30')).getSheets()[0].rows();
    assert.equal(file[1][1], mongDoi, `export follows the export region (${xuat})`);
    assert.equal(w.updateNh.getSheetByName('Update_NganHang_DN').rows(33)[1][2], mongDoi, `MISA follows the export region (${xuat})`);
  }
});

test('ChiTietUNC ledger stores the value date as a real date; web VN; the UNC report by the export region', () => {
  for (const [xuat, mongDoi] of [['VN', '05/09/2026'], ['US', '09/05/2026']]) {
    const { run, w, mo } = world(xuat);
    assert.equal(run('webCreateUNCFromDraft_')(['A1'], '2026-09-05').success, true);
    const sh = w.main.getSheetByName('ChiTietUNC');
    const r = sh.rows(18)[1];
    assert.ok(r[12] instanceof Date && iso(r[12]) === '2026-09-05', 'ledger: real date (a text "05/09/2026" in a US sheet would become 9 May)');
    assert.equal(sh.getRange(2, 13).getNumberFormat(), 'MM/dd/yyyy');
    assert.equal(run('getLichSuUNC_')(homNayVN(), homNayVN())[0].ngayHieuLuc, '05/09/2026', 'web: dd/mm/yyyy');
    const file = mo(run('exportLichSuUNCExcel_')(homNayVN(), homNayVN())).getSheets()[0].rows();
    assert.equal(file[1][0], mongDoi, `UNC report follows the export region (${xuat})`);
  }
});

test('rows written as text by older versions are still read correctly', () => {
  const { run, w } = world('VN');
  run('webCreateUNCFromDraft_')(['A1'], '2026-09-05');
  w.main.getSheetByName('ChiTietUNC').data[1][12] = '15/09/2026'; // bản cũ: chữ theo Vùng xuất (VN)
  assert.equal(run('getLichSuUNC_')(homNayVN(), homNayVN())[0].ngayHieuLuc, '15/09/2026');
  assert.match(run('runConfirmPayment_')(['A1'], '2026-09-05'), /^✅/);
  const sh = w.main.getSheetByName('ChiTietDNTT');
  sh.data.slice(1).filter(r => r[0] === 'A1').forEach(r => { r[3] = '16/09/2026'; });
  assert.ok(run('getChiTietDNTTDaChot_')('2026-09-01', '2026-09-30').items.filter(x => x.idHeThong === 'A1').every(x => x.ngayCK === '16/09/2026'));
});

test('report titles show the date range in the export region', () => {
  const { run, w, mo } = world('VN');
  assert.match(run('runConfirmPayment_')(['A1'], '2026-09-05'), /^✅/);
  w.main.getSheetByName('DNTT_GK_DN_112').data.slice(1).forEach(r => { r[16] = new Date('2026-09-01T05:00:00Z'); });
  const kq = run('createFinalReportFromFilteredData_')(run('get112ViewData_')('2026-09-01', '2026-09-30'), '2026-09-01 - 2026-09-30');
  assert.equal(kq.success, true, kq.message);
  const chu = mo(kq).getSheets().flatMap(s => s.rows().flat()).filter(v => typeof v === 'string' && /2026/.test(v));
  assert.ok(chu.some(v => v.includes('01/09/2026 - 30/09/2026')), 'title range dd/mm/yyyy');
  assert.ok(!chu.some(v => /2026-09-/.test(v)), 'no yyyy-mm-dd left in the file');
});
