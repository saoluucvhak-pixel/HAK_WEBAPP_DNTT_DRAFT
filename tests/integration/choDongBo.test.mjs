import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';
import { INDEX } from '../gas/clientSource.mjs';

// Người dùng yêu cầu 28/09/2026: trigger đang chạy thì báo và cho các thao tác CHỜ ĐỒNG BỘ XONG.
const ctx = () => { const w = buildWorld(); return loadCode({ ...w.options, owner: 'owner@hak.test' }); };
const goi = (run, ten, thamSo = []) => { try { return { ok: true, kq: run('api')('', ten, thamSo) }; } catch (e) { return { ok: false, loi: e.message }; } };
const datTrigger = (env, ten, truocMs) => env.PropertiesService.getScriptProperties().setProperty('HN_TRIGGER_DANG_CHAY_' + ten, String(Date.now() - truocMs));

test('while a sync trigger runs, web operations are held back with the running sync described', () => {
  const { run, env } = ctx();
  datTrigger(env, 'refreshAllDraftCaches10Min_', 90e3);
  const kq = goi(run, 'getDashboardStats'); // Trang chủ đọc số liệu do trigger dựng -> vẫn chờ
  assert.equal(kq.ok, false);
  assert.ok(kq.loi.startsWith('[DONG_BO] '), kq.loi);
  const ds = JSON.parse(kq.loi.slice('[DONG_BO] '.length));
  assert.equal(ds.length, 1);
  assert.match(ds[0].ten, /Làm mới 10 phút/);
  assert.ok(ds[0].daChayGiay >= 89 && ds[0].daChayGiay <= 95);
  assert.equal(goi(run, 'runXacNhanDNTT', [['A1']]).ok, false, 'writes wait too');
});

test('the waiting helpers still answer during a sync', () => {
  const { run, env } = ctx();
  datTrigger(env, 'daily15hRefresh_', 30e3);
  const tt = goi(run, 'getTrangThaiDongBo');
  assert.equal(tt.ok, true);
  assert.match(tt.kq[0].ten, /15h/);
  assert.equal(goi(run, 'ghiQuaGioTrinhDuyet', ['getDraftListSummary', 10]).ok, true);
  assert.equal(goi(run, 'getAppSetupStatus').ok, true);
});

test('no sync, or a sync that died past the 6-minute limit, does not hold anything', () => {
  const { run, env } = ctx();
  assert.equal(goi(run, 'getDraftListSummary').ok, true);
  datTrigger(env, 'dailyRefreshAllCaches_', 8 * 60e3);
  assert.equal(goi(run, 'getDraftListSummary').ok, true, 'stale flag ignored');
  assert.deepEqual(Array.from(goi(run, 'getTrangThaiDongBo').kq), []);
});

test('the flag is set only while the trigger body runs', () => {
  const { run } = ctx();
  const trongLuc = run(`() => _chayTriggerCoDo_('refreshAllDraftCaches10Min_', () => _dongBoDangChay_().length)`)();
  assert.equal(trongLuc, 1);
  assert.equal(goi(run, 'getDraftListSummary').ok, true, 'released afterwards');
});

test('browser: same prefix as the server, waits and re-runs, can cancel', () => {
  const { run } = ctx();
  assert.equal(/const LOI_DONG_BO = '([^']+)';/.exec(INDEX)[1], run('AUTH_CFG.LOI_DONG_BO'));
  assert.match(INDEX, /const dongBo = _phanSauTienTo_\(msg, LOI_DONG_BO\);\s*if \(dongBo\) \{ _choDongBo\(dongBo\)\.then\(goi,/);
  assert.match(INDEX, /<div id="bang-dong-bo" class="bang-dong-bo hidden" role="status"/);
  assert.match(INDEX, /function huyChoDongBo\(\)/);
});

test('creating a payment request (Tạo ĐNTT) runs normally; during a sync it waits, then runs', () => {
  const { run, env } = ctx();
  run('refreshPhieuCanUnpaidCache_')();
  assert.equal(goi(run, 'getBulkReferenceData').ok, true, 'step 1 data');
  assert.equal(goi(run, 'getAvailablePhieuCanForChuRung', ['Tran Thi B']).ok, true, 'step 2 tickets');
  const payload = { hoTenChuRung: 'Tran Thi B', cccdChuRung: '012345678901', nguoiDeNghi: 'X', nguoiNhanTien: 'Tran Thi B',
    soTKNhanTien: '0123', nganHang: 'BIDV', soHopDong: 'HD01', ngayDeNghi: '2026-09-26', danhSachPhieuCan: ['PC999'] };

  datTrigger(env, 'refreshAllDraftCaches10Min_', 20e3);
  const cho = goi(run, 'createNewPaymentRequest', [payload]);
  assert.ok(!cho.ok && cho.loi.startsWith('[DONG_BO] '), 'held while syncing - nothing written yet');
  env.PropertiesService.getScriptProperties().deleteProperty('HN_TRIGGER_DANG_CHAY_refreshAllDraftCaches10Min_');

  const tao = goi(run, 'createNewPaymentRequest', [payload]); // trình duyệt tự gọi lại khi đồng bộ xong
  assert.equal(tao.ok, true, tao.loi);
  assert.equal(tao.kq.success, true, tao.kq.message);
  assert.equal(Array.from(run('getDraftListSummary_')()).filter(h => h.danhSachPhieuCan.includes('PC999')).length, 1, 'created exactly once');
});
