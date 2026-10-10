// Đo hiệu năng (không phải test tự động): dữ liệu giả lập cỡ 1 năm, đếm lượt gọi API Sheets,
// số ô đọc / ghi và số lần mở file của từng thao tác. Chạy: node tests/perf/doHieuNang.mjs [HAK_CODE_GS=...]
import { MockRange } from '../gas/mock.mjs';
import { loadCode } from '../gas/loadCode.mjs';
import { duLieuLon } from '../gas/duLieuLon.mjs';

const N_PC = +process.env.N_PC || 10000, N_CT = +process.env.N_CT || 9000, N_HD = 330, N_NHAP = 30;

const dem = { goi: 0, oDoc: 0, oGhi: 0, mo: 0, theoSheet: {}, theoHam: {} };
const CHI_TIET = process.env.CHI_TIET; // tên thao tác cần in chi tiết theo hàm Code.gs
let dangDo = '';
const hamGoi = () => {
  const dong = String(new Error().stack).split('\n').filter(l => l.includes('Code.gs:'));
  const f = dong.map(l => (l.match(/at ([\w$.]+) \(/) || [])[1]).filter(Boolean).filter(n => !/^(_docDongTheoKhoa_|_doanDongTheoKhoa_|_docCacCot_|_docTrongLuot_|Object\.|Array\.)/.test(n));
  return f.slice(0, 2).join(' < ');
};
const ghiNhan = (sh, k, n) => {
  const t = dem.theoSheet[sh] = dem.theoSheet[sh] || { goi: 0, doc: 0, ghi: 0 }; t.goi++; t[k] += n;
  if (CHI_TIET && dangDo.includes(CHI_TIET)) { const h = sh + ' ← ' + hamGoi(); const x = dem.theoHam[h] = dem.theoHam[h] || { goi: 0, doc: 0, ghi: 0 }; x.goi++; x[k] += n; }
};
for (const ten of ['getValues', 'getDisplayValues']) {
  const goc = MockRange.prototype[ten];
  MockRange.prototype[ten] = function () { const v = goc.call(this); const n = v.length * (v[0] ? v[0].length : 0); dem.goi++; dem.oDoc += n; ghiNhan(this.sheet.name, 'doc', n); return v; };
}
for (const ten of ['setValues', 'setValue', 'clearContent']) {
  const goc = MockRange.prototype[ten];
  MockRange.prototype[ten] = function (...a) { const n = this.numRows * this.numCols; dem.goi++; dem.oGhi += n; ghiNhan(this.sheet.name, 'ghi', n); return goc.apply(this, a); };
}

function theGioi() {
  const w = duLieuLon({ N_PC, N_CT });
  const ctx = loadCode({ ...w.options, owner: 'owner@hak.test' });
  if (process.env.KHONG_CACHE) { // như thực tế: sổ 1 năm vượt giới hạn / hết 90 giây -> bộ nhớ đệm trống
    const trong = { get: () => null, getAll: () => ({}), put() {}, putAll() {}, remove() {}, removeAll() {} };
    ctx.env.CacheService.getScriptCache = () => trong;
  }
  const goc = ctx.env.SpreadsheetApp.openById.bind(ctx.env.SpreadsheetApp);
  ctx.env.SpreadsheetApp.openById = id => { dem.mo++; return goc(id); };
  return { w, ...ctx };
}

function doThu(ten, fn) {
  Object.assign(dem, { goi: 0, oDoc: 0, oGhi: 0, mo: 0, theoSheet: {}, theoHam: {} }); dangDo = ten;
  const t = Date.now(); let kq, loi = '';
  try { kq = fn(); } catch (e) { loi = String(e.message || e); }
  const ms = Date.now() - t;
  const top = Object.entries(dem.theoSheet).sort((a, b) => b[1].doc - a[1].doc).slice(0, 4).map(([k, v]) => `${k}:${v.goi}/${Math.round(v.doc / 1000)}k`).join(' ');
  const tt = loi ? 'LỖI ' + loi.slice(0, 60) : (typeof kq === 'string' ? kq.slice(0, 40) : kq && kq.success === false ? 'false: ' + String(kq.message).slice(0, 50) : 'ok');
  console.log(`${ten.padEnd(34)} gọi=${String(dem.goi).padStart(4)} đọc=${String(Math.round(dem.oDoc / 1000)).padStart(5)}k ghi=${String(dem.oGhi).padStart(6)} mở=${String(dem.mo).padStart(2)} ${String(ms).padStart(5)}ms | ${top} | ${tt}`);
  if (CHI_TIET && ten.includes(CHI_TIET)) Object.entries(dem.theoHam).sort((a, b) => (b[1].doc + b[1].ghi) - (a[1].doc + a[1].ghi)).slice(0, 15)
    .forEach(([k, v]) => console.log(`    ${String(v.goi).padStart(3)} lượt  đọc ${String(Math.round(v.doc / 1000)).padStart(4)}k  ghi ${String(v.ghi).padStart(5)}  ${k}`));
  return kq;
}

const t = theGioi();
const R = t.run;
doThu('Làm mới cache (lần đầu)', () => R('refreshAllDraftCaches_')());
const banSao = () => JSON.stringify(t.w.draft.getSheetByName('PhieuCan_DN_CHUA_TT_DRAFT').rows());
const truoc = banSao();
doThu('Trigger 10 phút (phần việc)', () => R('refreshAllDraftCaches_')({ chiPhieuChuaTra: true }));
console.log('   bản sao phiếu chưa trả giống cách đọc cũ:', banSao() === truoc);
doThu('Danh sách ĐNTT (màn hình)', () => R('getDanhSachNhapCoKiemTra_')());
doThu('Phiếu cân của chủ rừng', () => R('getAvailablePhieuCanForChuRung_')('CHU RUNG 5'));
const soMoi = `${N_CT + N_NHAP + 5}/2026/NK`, k5 = (N_CT + N_NHAP + 5) % N_HD;
doThu('Tạo mới hồ sơ', () => R('createNewPaymentRequest_')({ hoTenChuRung: 'CHU RUNG ' + k5, cccdChuRung: '049012345678', nguoiDeNghi: 'X', nguoiNhanTien: 'CHU RUNG ' + k5,
  soTKNhanTien: '42302' + String(k5).padStart(8, '0'), nganHang: 'AGRIBANK', soHopDong: String(20260000000 + k5), ngayDeNghi: '2026-10-03', danhSachPhieuCan: [soMoi] }));
doThu('Tính lại số tiền', () => R('runCreate112')());
const ids = R('getDraftListSummary_')().slice(0, 5).map(r => r.idKey);
doThu('Xác nhận 5 hồ sơ', () => R('runXacNhanDNTT_')(ids));
doThu('In Báo Cáo ĐNTT 5 hồ sơ', () => R('exportBaoCaoDNTTFromDraft_')(ids));
doThu('Duyệt 5 hồ sơ', () => R('runConfirmPayment_')(ids, '2026-10-03'));
doThu('Báo cáo chi tiết 1 tháng', () => R('getChiTietDNTTDaChot_')('2026-03-01', '2026-03-31'));
doThu('Báo cáo MISA 1 tháng', () => R('getMisaDataTheoNgay_')('2026-03-01', '2026-03-31'));
doThu('Công nợ KH (làm mới)', () => R('webRunCongNoRefreshNow_')());
doThu('Trang chủ', () => R('getDashboardStats_')());
