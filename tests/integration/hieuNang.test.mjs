import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Đo hiệu năng thật: ghi lần chạy chậm (≥ ngưỡng), trigger bị dừng ở 6 phút, lời gọi quá giờ do trình duyệt báo.
function world() {
  const w = buildWorld();
  const code = loadCode({ ...w.options, owner: 'owner@hak.test' });
  const dong = () => { const sh = w.draft.getSheetByName('SYS_HieuNang'); return sh ? sh.rows(6).slice(1) : []; };
  return { w, ...code, dong };
}
function voiDongHoGia(fn) {
  const that = Date.now;
  let bayGio = that();
  Date.now = () => bayGio;
  try { return fn(ms => { bayGio += ms; }); } finally { Date.now = that; }
}

test('a slow web call is recorded with its name, duration and user; fast calls are not', () => {
  const { run, dong } = world();
  run('api')('', 'getDraftListSummary', []);
  assert.equal(dong().length, 0, 'fast call: nothing written');
  voiDongHoGia(troiQua => {
    const goc = run('API_ROUTES.getDraftListSummary.fn');
    run('API_ROUTES').getDraftListSummary.fn = (...a) => { troiQua(4200); return goc(...a); };
    run('api')('', 'getDraftListSummary', []);
    run('API_ROUTES').getDraftListSummary.fn = goc;
  });
  const [r] = dong();
  assert.deepEqual([r[1], r[2], r[3], r[4]], ['getDraftListSummary', 4.2, 'owner@hak.test', 'OK']);
});

test('a trigger stopped at the 6-minute limit is reported at the next run; browser-reported timeouts are kept', () => {
  const { run, env, dong } = world();
  env.PropertiesService.getScriptProperties().setProperty('HN_TRIGGER_DANG_CHAY_daily15hRefresh_', String(Date.now() - 8 * 60000));
  env.PropertiesService.getScriptProperties().setProperty('HN_TRIGGER_DANG_CHAY_refreshAllDraftCaches10Min_', String(Date.now() - 60000));
  assert.equal(run('ghiQuaGioTrinhDuyet_')('khongCo', 400).success, false);
  run('ghiQuaGioTrinhDuyet_')('webConfirmPayment', 361);
  const kq = run('getHieuNangForWeb_')('', '');
  assert.deepEqual(Array.from(dong(), r => [r[1], r[4]]).sort(), [['Trigger: daily15hRefresh_', 'Quá giờ'], ['webConfirmPayment', 'Quá giờ']].sort());
  assert.ok(env.PropertiesService.getScriptProperties().getProperty('HN_TRIGGER_DANG_CHAY_refreshAllDraftCaches10Min_'), 'a trigger still within its time is left alone');
  assert.deepEqual(Array.from(kq.tongHop, o => [o.chucNang, o.quaGio]).sort(), [['Trigger: daily15hRefresh_', 1], ['webConfirmPayment', 1]].sort());
});

test('trigger runs are timed and their "running" mark is cleared', () => {
  const { run, env, dong } = world();
  voiDongHoGia(troiQua => {
    run('_chayTriggerCoDo_')('thuNghiem_', () => { troiQua(5000); return 1; });
  });
  assert.equal(env.PropertiesService.getScriptProperties().getProperty('HN_TRIGGER_DANG_CHAY_thuNghiem_'), null);
  assert.deepEqual(Array.from(dong(), r => [r[1], r[2], r[4]]), [['Trigger: thuNghiem_', 5, 'OK']]);
});
