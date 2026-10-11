import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// 2026.9.60 (mục 8.3): trình duyệt dựa vào cờ `doc` của API_ROUTES (không đoán theo tên "get...") để
// biết chức năng nào chỉ đọc. Mọi chức năng có cờ doc phải không ghi vào sheet nào (bộ nhớ đệm
// CacheService / Script Properties không tính). Chạy trên dữ liệu mẫu đã chốt 1 hồ sơ.
const homNay = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const thamSoMau = () => {
  const d = homNay(), dauThang = d.slice(0, 8) + '01';
  return {
    getReportList: [dauThang, d], getChiTietDNTTDaChot: [dauThang, d], getMisaDataTheoNgay: [dauThang, d], getLichSuUNC: [dauThang, d],
    getDraftRecordDetail: ['B2'], getPhieuHoanThanh: ['A1'], timChuRungDaChot: ['Nguyen'],
    getLichSuSuaDoi: [d, d], getDanhSachSaoLuuXoa: [d, d], getAvailablePhieuCanForChuRung: ['Nguyen Van A'],
    getHopDongSummary: ['HD01'], getDebtLedgerDetail: ['1|A'], getTinhHinhThanhToanHangNgayWeb: [dauThang, d],
    getChiTietCongNoPhieuCanWeb: [dauThang, d], getPhanTichNhapTTReport: [dauThang, d], getPaymentAnalysis: [dauThang, d],
    getSharedUsersForLink: ['PC']
  };
};

test('every route the browser treats as read-only (doc flag) writes to no sheet', () => {
  const w = buildWorld();
  const { run } = loadCode({ ...w.options, owner: 'owner@hak.test' });
  const tatCaFile = Object.values(w).filter(v => v && typeof v.getSheets === 'function');
  const ghi = () => tatCaFile.flatMap(ss => ss.getSheets().flatMap(sh => sh.writes.map(x => sh.getName() + ':' + x.op)));
  assert.match(run('runConfirmPayment_')(['A1'], homNay()), /^✅/);
  const ts = thamSoMau();
  const ds = Object.keys(run('API_ROUTES')).filter(k => run(`API_ROUTES[${JSON.stringify(k)}].doc`));
  assert.ok(ds.length >= 40, ds.length + ' routes');
  ds.forEach(ten => { try { run('api')('', ten, ts[ten] || []); } catch (e) { /* lượt làm nóng: tạo sheet phụ nếu thiếu */ } });
  const viPham = [];
  ds.forEach(ten => {
    const truoc = ghi().length;
    try { run('api')('', ten, ts[ten] || []); } catch (e) { /* lỗi tham số mẫu vẫn không được ghi */ }
    const sau = ghi();
    if (sau.length !== truoc) viPham.push(`${ten} -> ${sau.slice(truoc).join(', ')}`);
  });
  assert.deepEqual(viPham, [], 'routes flagged doc but writing to sheets');
});

test('login info lists the read-only routes for the browser; write routes are never in it', () => {
  const w = buildWorld();
  const { run } = loadCode({ ...w.options, owner: 'owner@hak.test' });
  const ds = Array.from(run('thongTinDangNhap')(run('_taoPhien_')('owner@hak.test')).tuyenDoc);
  ['getDashboardStats', 'getDraftListSummary', 'getDongBoBoSung', 'getBulkReferenceData'].forEach(t => assert.ok(ds.includes(t), t));
  ['webConfirmPayment', 'createNewPaymentRequest', 'webDongBoBoSungSauDuyet', 'ghiQuaGioTrinhDuyet', 'webRunCongNoRefreshNow',
    'TRA_LOI_CHATBOT', 'webExportReport'].forEach(t => assert.ok(!ds.includes(t), t));
});
