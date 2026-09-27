# API — Chức năng gọi từ web app (v2026.9.7)

Mọi lời gọi từ trình duyệt đi qua **1 cửa**:

```js
google.script.run
  .withSuccessHandler(kq => …)
  .withFailureHandler(loi => …)      // loi.message bắt đầu "[AUTH] " -> đăng nhập lại, "[QUYEN] " -> không đủ quyền
  .api(PHIEN, "tenChucNang", [thamSo1, thamSo2, …]);
```

- `PHIEN`: mã phiên 64 hex do `doGet(?sso=…)` cấp sau khi đăng nhập qua Cổng (lưu `sessionStorage`). Chủ script mở web app trực tiếp có thể gọi với phiên rỗng.
- Chức năng **không có trong bảng dưới thì không gọi được** (`API_ROUTES`, `Code.gs`). Hàm nội bộ tên kết thúc `_` nên không gọi thẳng được.
- Lỗi nghiệp vụ trả nguyên câu; lỗi lập trình trả “Lỗi hệ thống (mã XXXXXXXX)” và ghi chi tiết vào `NhatKyThaoTac` (`LOI_HE_THONG`).
- Lời gọi ≥ 3 giây được ghi vào `SYS_HieuNang`.

Phần lớn chức năng ghi trả `{ success: boolean, message: string, … }`; một số chức năng cũ trả chuỗi bắt đầu bằng `✅`/`❌`/`⚠️` (client `handleResult()` hiểu cả 2).

## Cửa vào công khai (không cần đăng nhập)

| Hàm | Mô tả |
|---|---|
| `doGet(e)` | Trang web app; `?sso=` đăng nhập; `?trang=taoMoi` mở thẳng Tạo Mới; mọi `?action=` đều bị từ chối (webhook đã bỏ ở 2026.9.9) |
| `thongTinDangNhap(phien)` | Trạng thái đăng nhập của chính người gọi + link Cổng |
| `nhanPhienDangNhap(yeuCau)` | Khung nhúng lấy phiên theo mã yêu cầu (dùng 1 lần) |
| `dangXuat(phien)` | Hủy phiên |
| `api(phien, tenHam, thamSo)` | Cửa duy nhất tới các chức năng dưới đây |

## Bảng chức năng (sinh tự động từ `API_ROUTES`)

Quyền tối thiểu: **Chỉ xem** ⊂ **Kế toán** ⊂ **Kế toán tổng hợp** ⊂ **Quản trị**.

| Tên gọi (`tenHam`) | Hàm nội bộ (tham số) | Quyền tối thiểu |
|---|---|---|
| `getAppSetupStatus` | `getAppSetupStatus_()` | Chỉ xem |
| `getDashboardStats` | `getDashboardStats_()` | Chỉ xem |
| `ghiQuaGioTrinhDuyet` | `ghiQuaGioTrinhDuyet_(tenHam, soGiay)` | Chỉ xem |
| `getDraftBadgeCount` | `getDraftBadgeCount_()` | Chỉ xem |
| `TRA_LOI_CHATBOT` | `TRA_LOI_CHATBOT_(cauHoi, lichSuHoiDap)` | Chỉ xem |
| `getReportList` | `getReportList_(fDate, tDate)` | Chỉ xem |
| `webExportReport` | `webExportReport_(rows, dateRange)` | Chỉ xem |
| `getChiTietDNTTDaChot` | `getChiTietDNTTDaChot_(fDate, tDate)` | Chỉ xem |
| `exportChiTietDNTTDaChotExcel` | `exportChiTietDNTTDaChotExcel_(fDate, tDate)` | Chỉ xem |
| `getMisaDataTheoNgay` | `getMisaDataTheoNgay_(fDate, tDate)` | Chỉ xem |
| `exportMisaTheoNgayExcel` | `exportMisaTheoNgayExcel_(fDate, tDate)` | Chỉ xem |
| `getLichSuUNC` | `getLichSuUNC_(fDate, tDate)` | Chỉ xem |
| `exportLichSuUNCExcel` | `exportLichSuUNCExcel_(fDate, tDate)` | Chỉ xem |
| `getDebtByCustomer` | `getDebtByCustomer_(fDate, tDate)` | Chỉ xem |
| `getDebtByContract` | `getDebtByContract_(fDate, tDate)` | Chỉ xem |
| `getDebtLedgerDetail` | `getDebtLedgerDetail_(type, key, tDate)` | Chỉ xem |
| `getDoiChieuCongNoCccd` | `getDoiChieuCongNoCccd_(fDate, tDate)` | Chỉ xem |
| `getPaymentAnalysis` | `getPaymentAnalysis_(fDate, tDate)` | Chỉ xem |
| `getPhanTichNhapTTReport` | `getPhanTichNhapTTReport_(fDate, tDate)` | Chỉ xem |
| `exportPhanTichNhapTTBaoCao` | `exportPhanTichNhapTTBaoCao_(fDate, tDate)` | Chỉ xem |
| `getChiTietCongNoPhieuCanWeb` | `getChiTietCongNoPhieuCanWeb_(ngayStr, filters)` | Chỉ xem |
| `exportChiTietCongNoPhieuCanExcel` | `exportChiTietCongNoPhieuCanExcel_(ngayStr, filters)` | Chỉ xem |
| `getTinhHinhThanhToanHangNgayWeb` | `getTinhHinhThanhToanHangNgayWeb_(fDate, tDate, filters)` | Chỉ xem |
| `exportTinhHinhThanhToanExcel` | `exportTinhHinhThanhToanExcel_(fDate, tDate, filters)` | Chỉ xem |
| `webRunCongNoRefreshNow` | `webRunCongNoRefreshNow_(fDate, tDate)` | Chỉ xem |
| `webRunDaily15hRefreshNow` | `webRunDaily15hRefreshNow_()` | Chỉ xem |
| `getRegionInfoForWeb` | `getRegionInfoForWeb_()` | Chỉ xem |
| `getBulkReferenceData` | `getBulkReferenceData_()` | Kế toán |
| `getAvailablePhieuCanForChuRung` | `getAvailablePhieuCanForChuRung_(hoTen, query)` | Kế toán |
| `getHopDongSummary` | `getHopDongSummary_(soHD, stkDangDeNghi)` | Kế toán |
| `webRefreshCreateFlowData` | `webRefreshCreateFlowData_()` | Kế toán |
| `webRefreshPhieuCanCache` | `webRefreshPhieuCanCache_()` | Kế toán |
| `webSuaTenKhachHangPhieuCan` | `webSuaTenKhachHangPhieuCan_(soPhieuCan, tenMoi)` | Kế toán |
| `createNewPaymentRequest` | `createNewPaymentRequest_(payload)` | Kế toán |
| `getDraftListSummary` | `getDraftListSummary_()` | Kế toán |
| `getDraftRecordDetail` | `getDraftRecordDetail_(idKey)` | Kế toán |
| `updateDraft112Info` | `updateDraft112Info_(idKey, updates)` | Kế toán |
| `addPhieuCanToDraft` | `addPhieuCanToDraft_(idKey, soPhieuCan)` | Kế toán |
| `removePhieuCanFromDraft` | `removePhieuCanFromDraft_(idCT)` | Kế toán |
| `runDeleteDraftRecord` | `runDeleteDraftRecord_(idKey)` | Kế toán |
| `webRunCreate112` | `webRunCreate112_()` | Kế toán |
| `runXacNhanDNTT` | `runXacNhanDNTT_(selectedIds, forceConfirm)` | Kế toán |
| `runHuyXacNhanDNTT` | `runHuyXacNhanDNTT_(idKey)` | Kế toán |
| `exportBaoCaoDNTTFromDraft` | `exportBaoCaoDNTTFromDraft_(selectedIds)` | Kế toán |
| `getUncConfigForWeb` | `getUncConfigForWeb_()` | Kế toán |
| `webCreateUNCFromDraft` | `webCreateUNCFromDraft_(selectedIds, ngayHieuLuc, tkTrichNoOverride, tkThuPhiOverride)` | Kế toán |
| `webConfirmPayment` | `webConfirmPayment_(selectedIds, payDateStr)` | Kế toán |
| `getDoiSoatTenKhachHang` | `getDoiSoatTenKhachHang_()` | Kế toán tổng hợp |
| `webDongBoTenKhachHang` | `webDongBoTenKhachHang_(items)` | Kế toán tổng hợp |
| `exportDoiSoatTenKhachHangExcel` | `exportDoiSoatTenKhachHangExcel_(rowsCoSan)` | Kế toán tổng hợp |
| `getKiemTraDoiChieuBaoTri` | `getKiemTraDoiChieuBaoTri_()` | Kế toán tổng hợp |
| `webXoaCTMoCoi` | `webXoaCTMoCoi_(items)` | Kế toán tổng hợp |
| `webXoaSrcMoCoi` | `webXoaSrcMoCoi_(items)` | Kế toán tổng hợp |
| `webXoaMoCoiChiTietDNTT` | `webXoaMoCoiChiTietDNTT_(items)` | Kế toán tổng hợp |
| `webXoaMoCoiChiTietUNC` | `webXoaMoCoiChiTietUNC_(items)` | Kế toán tổng hợp |
| `runFillMissingBankOnly` | `runFillMissingBankOnly()` | Kế toán tổng hợp |
| `timChuRungDaChot` | `timChuRungDaChot_(query)` | Kế toán tổng hợp |
| `webMoDongThanhToanTheoHoSo` | `webMoDongThanhToanTheoHoSo_(chuRungInput, ngayDongTTInput, lanTTInput)` | Kế toán tổng hợp |
| `getLichSuSuaDoi` | `getLichSuSuaDoi_(fDate, tDate)` | Kế toán tổng hợp |
| `getDanhSachSaoLuuXoa` | `getDanhSachSaoLuuXoa_()` | Kế toán tổng hợp |
| `webKhoiPhucSaoLuuXoa` | `webKhoiPhucSaoLuuXoa_(ma)` | Kế toán tổng hợp |
| `dongBoChiTietDNTTTuDauLichSu` | `dongBoChiTietDNTTTuDauLichSu_(gioiHanMoiLan)` | Kế toán tổng hợp |
| `webTaoLaiMisaTheoNgay` | `webTaoLaiMisaTheoNgay_(fDate, tDate, offset, gioiHanMoiLan)` | Kế toán tổng hợp |
| `webTaoLaiUNCTheoNgay` | `webTaoLaiUNCTheoNgay_(fDate, tDate, ngayHieuLuc, offset, gioiHanMoiLan, tkTrichNoOverride, tkThuPhiOverride)` | Kế toán tổng hợp |
| `webKhoaSoNam` | `webKhoaSoNam_(namInput, chayThat)` | Kế toán tổng hợp |
| `getHieuNangForWeb` | `getHieuNangForWeb_(fDate, tDate)` | Kế toán tổng hợp |
| `getMainSsInfoForWeb` | `getMainSsInfoForWeb_()` | Quản trị |
| `webSetMainSsId` | `webSetMainSsId_(id)` | Quản trị |
| `getLuuTruNamForWeb` | `getLuuTruNamForWeb_()` | Quản trị |
| `webSetLuuTruNam` | `webSetLuuTruNam_(nam, link)` | Quản trị |
| `setupDraftSpreadsheet` | `setupDraftSpreadsheet_()` | Quản trị |
| `getConfigLinksForSettings` | `getConfigLinksForSettings_()` | Quản trị |
| `webSetSwappableLink` | `webSetSwappableLink_(key, idOrUrl, type)` | Quản trị |
| `getSharedUsersForLink` | `getSharedUsersForLink_(key)` | Quản trị |
| `webShareConfigLink` | `webShareConfigLink_(key, email, role)` | Quản trị |
| `webRevokeConfigLinkAccess` | `webRevokeConfigLinkAccess_(key, email)` | Quản trị |
| `getTriggerStatusForWeb` | `getTriggerStatusForWeb_()` | Quản trị |
| `webXacNhanHeaderPhieuCanMoi` | `webXacNhanHeaderPhieuCanMoi_()` | Quản trị |
| `getFormatLockStatusForWeb` | `getFormatLockStatusForWeb_()` | Quản trị |
| `webKhoaDinhDangTextTatCa` | `webKhoaDinhDangTextTatCa_()` | Quản trị |
| `webSetupPcCacheAutoRefreshTrigger` | `webSetupPcCacheAutoRefreshTrigger_()` | Quản trị |
| `setup10MinRefreshTrigger` | `setup10MinRefreshTrigger_()` | Quản trị |
| `setupDaily15hTrigger` | `setupDaily15hTrigger_(gio, phut)` | Quản trị |
| `webResetPhanTichNhapTTSheet` | `webResetPhanTichNhapTTSheet_()` | Quản trị |
| `webResetChiTietCongNoSheet` | `webResetChiTietCongNoSheet_()` | Quản trị |
| `getSheetLocaleInfoForWeb` | `getSheetLocaleInfoForWeb_()` | Quản trị |
| `webSetRegion` | `webSetRegion_(region)` | Quản trị |
| `getExportRegionInfoForWeb` | `getExportRegionInfoForWeb_()` | Quản trị |
| `webSetExportRegion` | `webSetExportRegion_(region)` | Quản trị |
| `getMisaDefaultsForWeb` | `getMisaDefaultsForWeb_()` | Quản trị |
| `webSetMisaDefaults` | `webSetMisaDefaults_(values)` | Quản trị |
| `webSetUncConfig` | `webSetUncConfig_(values)` | Quản trị |
| `getChatbotSettingsForWeb` | `getChatbotSettingsForWeb_()` | Quản trị |
| `webSetChatbotApiKey` | `webSetChatbotApiKey_(apiKey)` | Quản trị |
| `webSetGeminiModels` | `webSetGeminiModels_(chuoi)` | Quản trị |
| `webDoModelGemini` | `webDoModelGemini_()` | Quản trị |
| `generateThongSoSheet` | `generateThongSoSheet_()` | Quản trị |
| `getDanhSachNguoiDungForWeb` | `getDanhSachNguoiDungForWeb_()` | Quản trị |
| `webLuuNguoiDung` | `webLuuNguoiDung_(duLieu)` | Quản trị |
| `getCauHinhDangNhapForWeb` | `getCauHinhDangNhapForWeb_()` | Quản trị |
| `webSetCongDangNhapUrl` | `webSetCongDangNhapUrl_(url)` | Quản trị |
| `webTaoLaiSsoSecret` | `webTaoLaiSsoSecret_()` | Quản trị |

## Thêm chức năng mới

1. Viết hàm nội bộ `tenMoi_(…)` (kết thúc `_`).
2. Thêm 1 dòng `tenMoi: r(tenMoi_, X|N|H|Q)` vào `API_ROUTES` đúng nhóm quyền.
3. Client gọi `call('tenMoi', [..], 'Đang …')`.
4. `tests/integration/auth.test.mjs` tự báo lỗi nếu quên route, hoặc trang gọi chức năng cần quyền cao hơn quyền mở trang.

Tài liệu này sinh lại bằng: `node` + `loadCode()` đọc `API_ROUTES` (xem `docs/DEVELOPER_GUIDE.md`).
