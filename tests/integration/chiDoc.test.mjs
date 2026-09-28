import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// P-02 (người dùng đồng ý 28/09/2026): màn chỉ xem sổ / hồ sơ / cấu hình chạy luôn khi đang đồng bộ.
const homNay = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const thamSoMau = () => {
  const d = homNay(), dauThang = d.slice(0, 8) + '01';
  return {
    getReportList: [dauThang, d], getChiTietDNTTDaChot: [dauThang, d], getMisaDataTheoNgay: [dauThang, d], getLichSuUNC: [dauThang, d],
    getDraftRecordDetail: ['B2'], getPhieuHoanThanh: ['A1'], timChuRungDaChot: ['Nguyen'],
    getLichSuSuaDoi: [d, d], getDanhSachSaoLuuXoa: [d, d]
  };
};
function theGioi() {
  const w = buildWorld();
  const ctx = loadCode({ ...w.options, owner: 'owner@hak.test' });
  const tatCaFile = Object.values(w).filter(v => v && typeof v.getSheets === 'function');
  const soLanGhi = () => tatCaFile.reduce((t, ss) => t + ss.getSheets().reduce((u, sh) => u + sh.writes.length, 0), 0);
  const goi = (ten, thamSo = []) => { try { return { ok: true, kq: ctx.run('api')('', ten, thamSo) }; } catch (e) { return { ok: false, loi: e.message }; } };
  const datTrigger = () => ctx.env.PropertiesService.getScriptProperties().setProperty('HN_TRIGGER_DANG_CHAY_refreshAllDraftCaches10Min_', String(Date.now() - 60e3));
  return { ...ctx, w, soLanGhi, goi, datTrigger };
}
const dsChiDoc = run => Object.keys(run('API_ROUTES')).filter(k => run(`API_ROUTES[${JSON.stringify(k)}].chiDoc`));

test('read-only screens run during a sync and write nothing', () => {
  const { run, w, goi, datTrigger, soLanGhi } = theGioi();
  w.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').data[1][16] = new Date(); // Ngày ĐN - báo cáo lọc theo cột này
  assert.match(run('runConfirmPayment_')(['A1'], homNay()), /^✅/); // có dữ liệu đã chốt để các báo cáo đọc thật
  const ts = thamSoMau();
  const ds = dsChiDoc(run);
  assert.ok(ds.length >= 20, ds.join(','));
  ds.forEach(ten => goi(ten, ts[ten] || [])); // chạy 1 lượt không đồng bộ (tạo sheet phụ nếu thiếu)
  datTrigger();
  const ketQua = {};
  ds.forEach(ten => {
    const truoc = soLanGhi();
    const kq = goi(ten, ts[ten] || []);
    assert.equal(kq.ok, true, `${ten} must run during a sync: ${kq.loi}`);
    ketQua[ten] = kq.kq;
    assert.equal(soLanGhi(), truoc, `${ten} is marked CHI_DOC but wrote to a sheet`);
  });
  // Các báo cáo đọc được hồ sơ vừa chốt (không phải kiểm tra trên dữ liệu rỗng).
  assert.equal(ketQua.getReportList.length, 1);
  assert.ok(ketQua.getChiTietDNTTDaChot.total > 0);
  assert.ok(ketQua.getMisaDataTheoNgay.total > 0);
  assert.equal(ketQua.getPhieuHoanThanh.success, true, ketQua.getPhieuHoanThanh.message);
  assert.equal(ketQua.getDraftRecordDetail.idKey, 'B2');
});

test('writes and trigger-built screens still wait during a sync', () => {
  const { goi, datTrigger } = theGioi();
  datTrigger();
  ['runXacNhanDNTT', 'updateDraft112Info', 'createNewPaymentRequest', 'webConfirmPayment', 'getDashboardStats',
    'getDebtByCustomer', 'getBulkReferenceData', 'webExportReport'].forEach(ten => {
    const kq = goi(ten, []);
    assert.ok(!kq.ok && kq.loi.startsWith('[DONG_BO] '), `${ten} should wait`);
  });
});

test('the draft list opens during a sync with the same content as outside it', () => {
  const { run, goi, datTrigger } = theGioi();
  const ngoai = JSON.stringify(goi('getDraftListSummary').kq);
  datTrigger();
  const trong = goi('getDraftListSummary');
  assert.equal(trong.ok, true, trong.loi);
  assert.equal(JSON.stringify(trong.kq), ngoai);
});
