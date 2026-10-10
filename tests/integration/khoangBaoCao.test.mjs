import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';
import { INDEX } from '../gas/clientSource.mjs';

// Quy định người dùng 28/09/2026: báo cáo in từng tháng - chọn quá 1 tháng thì báo và không cho.
const ctx = () => { const w = buildWorld(); return loadCode({ ...w.options, owner: 'owner@hak.test' }); };

test('the furthest allowed end date is one month from the start date', () => {
  const { run } = ctx();
  const den = run('_denNgayToiDaBaoCao_');
  assert.equal(den('2026-09-01'), '2026-09-30');
  assert.equal(den('2026-08-15'), '2026-09-14');
  assert.equal(den('2026-01-31'), '2026-02-28', 'no 31 in February: end of February');
  assert.equal(den('2024-01-31'), '2024-02-29');
  assert.equal(den('2026-12-15'), '2027-01-14', 'across the year end');
});

test('browser and server use exactly the same rule', () => {
  const { run } = ctx();
  const ham = /function _denNgayToiDaBaoCao\(f\)\{[\s\S]*?\n\}/.exec(INDEX)[0];
  const trinhDuyet = vm.runInNewContext(`function _soThangBaoCao(){ return ${run('KHOANG_BAO_CAO.SO_THANG')}; }\n${ham}\n_denNgayToiDaBaoCao`);
  for (let d = new Date(Date.UTC(2024, 0, 1)); d < new Date(Date.UTC(2027, 0, 1)); d = new Date(d.getTime() + 86400000)) {
    const iso = d.toISOString().slice(0, 10);
    assert.equal(trinhDuyet(iso), run('_denNgayToiDaBaoCao_')(iso), iso);
  }
});

test('the web API refuses report ranges longer than one month, for viewing and exporting', () => {
  const { run } = ctx();
  const api = (ten, thamSo) => { try { return { ok: true, kq: run('api')('', ten, thamSo) }; } catch (e) { return { ok: false, loi: e.message }; } };
  for (const ten of ['getReportList', 'getChiTietDNTTDaChot', 'exportChiTietDNTTDaChotExcel', 'getMisaDataTheoNgay', 'exportMisaTheoNgayExcel', 'getLichSuUNC', 'exportLichSuUNCExcel']) {
    const qua = api(ten, ['2026-08-01', '2026-09-01']);
    assert.equal(qua.ok, false, ten + ' must refuse 01/08 - 01/09');
    assert.match(qua.loi, /phạm vi 1 tháng.*31\/08\/2026/, ten);
    assert.equal(api(ten, ['2026-08-01', '2026-08-31']).ok, true, ten + ' accepts one month');
  }
  assert.equal(api('getReportList', ['2026-09-10', '2026-09-01']).ok, false, 'end before start');
  const xuat = run('webExportReport_')([], '2026-07-01 - 2026-09-27');
  assert.equal(xuat.success, false);
  assert.match(xuat.message, /phạm vi 1 tháng/);
});

test('the page passes the month limit to the browser; the payment report opens on the current month', () => {
  const { run } = ctx();
  assert.match(INDEX, /data-so-thang-bao-cao="<\?= soThangBaoCao \?>"/);
  assert.match(INDEX, /id="rp-from" data-khoang-bao-cao="rp" value="\$\{firstDayOfMonthStr\(todayISOVN\(\)\)\}"/);
  ['rp', 'misa', 'chitiet', 'baocaounc'].forEach(p => ['from', 'to'].forEach(k => assert.match(INDEX, new RegExp(`id="${p}-${k}" data-khoang-bao-cao="${p}"`), p + '-' + k)));
  assert.equal((INDEX.match(/if \(!_khoangBaoCaoHopLe\('(rp|misa|chitiet|baocaounc)'\)\) return;/g) || []).length, 9, 'every view / export button checks the range');
  assert.equal(run('KHOANG_BAO_CAO.SO_THANG'), 1);
});
