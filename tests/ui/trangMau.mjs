// Dựng trang Index.html chạy ngoài Apps Script: bỏ thẻ template <?= ?> và giả
// lập google.script.run bằng dữ liệu mẫu (dùng cho test giao diện + chụp màn hình).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const XSS = '<img src=x onerror="window.__xss=1">';

// Dữ liệu trả về theo tên chức năng (API_ROUTES) - chỉ đủ để vẽ màn hình.
export const DU_LIEU = {
  getAppSetupStatus: { mainSetup: true, muiGio: { timezone: 'Asia/Ho_Chi_Minh', dungVN: true } },
  getDashboardStats: { draftSetup: true, draftCount: 2, draftReady: 1, draftPending: 1, draftTotalTien: 5e6,
    klMuaThangKg: 12000, tienMuaThang: 9e6, klThanhToanThangTan: 8, tienThanhToanThang: 6e6,
    muaTheoNguonGoc: [{ ten: XSS, klKg: 1000, tien: 1e6 }], muaTheoDaiLy: [], tongNoGoKeo: 3e6,
    top5KhachHangNo: [{ khachHang: XSS, khoa: '1|A', congNo: 3e6 }], congNoCapNhatLuc: '27/09/2026 07:30' },
  getDraftBadgeCount: 2,
  getDraftListSummary: [
    { idKey: 'A1', ngayDeNghi: '26/09/2026', chuRung: XSS, nguoiNhan: 'B', nganHang: 'BIDV', stk: '0123', soHD: 'HD01', soLuongPhieu: 2, klTongKg: 2000, soTien: 2e6, sanSangChot: true, trangThaiKey: 'cho_dntt', trangThaiLabel: 'Chờ ĐNTT' },
    { idKey: 'B2', ngayDeNghi: '26/09/2026', chuRung: 'Tran Thi B', nguoiNhan: 'C', nganHang: 'VCB', stk: '0456', soHD: 'HD02', soLuongPhieu: 1, klTongKg: 1000, soTien: 0, sanSangChot: false, trangThaiKey: 'cho_tinh', trangThaiLabel: 'Chưa ĐNTT' }],
  getDraftRecordDetail: { idKey: 'A1', chuRung: 'A', nguoiNhan: 'B', nganHang: 'BIDV', stk: '0123', soTien: 2e6, soHD: 'HD01', chiTiet: [], daXacNhan: false },
  getReportList: [], getDebtByCustomer: [], getLichSuSuaDoi: [], getHieuNangForWeb: { nguongGiay: 3, tongHop: [], ganDay: [] },
  getDanhSachNguoiDungForWeb: { chuScript: 'owner@x', quanTriCoDinh: [], vaiTro: [{ ma: 'XEM', nhan: 'Chỉ xem' }], trangThai: ['Hoạt động'], nguoiDung: [] },
  getCauHinhDangNhapForWeb: { appUrl: '', congDangNhapUrl: '', maNguon: '' },
  getConfigLinksForSettings: [], getLuuTruNamForWeb: [], getSheetLocaleInfoForWeb: {},
  getRegionInfoForWeb: { current: 'VN', presets: [{ code: 'VN', label: 'Việt Nam' }] },
  getExportRegionInfoForWeb: { current: 'VN', presets: [{ code: 'VN', label: 'Việt Nam' }] },
  getMisaDefaultsForWeb: {}, getUncConfigForWeb: {}, getMainSsInfoForWeb: { configured: true, name: 'Chính', url: '#' },
  getTriggerStatusForWeb: {}, getFormatLockStatusForWeb: { items: [] }, getChatbotSettingsForWeb: { models: [] },
  getMisaDataTheoNgay: { items: [], total: 0 }, getChiTietDNTTDaChot: { items: [] }, getLichSuUNC: [],
  getPaymentAnalysis: { tongKLNhap: 0, tongGiaTriNhap: 0, tongGiaTriDaTT: 0, soLuongHopDongDuocTT: 0, theoNguonGoc: [], theoDaiLy: [] },
  exportMisaTheoNgayExcel: { success: true, url: 'https://docs.google.com/x', count: 3 }
};

export function trangMau() {
  const html = readFileSync(path.join(ROOT, 'Index.html'), 'utf8')
    .replace(/<\?= *(\w+) *\?>/g, '')
    .replace('<script>', `<script>
      window.__DU_LIEU = ${JSON.stringify(DU_LIEU)};
      window.google = { script: { get run() {
        let ok = () => {}, loi = () => {};
        const r = {
          withSuccessHandler(f) { ok = f; return r; }, withFailureHandler(f) { loi = f; return r; },
          thongTinDangNhap() { setTimeout(() => ok({ daDangNhap: true, email: 'qt@hak.test', vaiTro: 'ADMIN', vaiTroNhan: 'Quản trị',
            quyen: ['XEM', 'NGHIEP_VU', 'HE_THONG', 'QUAN_TRI'], quaPhien: true }), 0); },
          api(phien, ten) { const v = window.__DU_LIEU[ten]; setTimeout(() => ok(v === undefined ? {} : JSON.parse(JSON.stringify(v))), 0); },
          dangXuat() {}, nhanPhienDangNhap() {}
        };
        return r; } } };
    </script><script>`);
  return html;
}

