# PROJECT_ANALYSIS — Hệ Thống Quản Lý Thanh Toán HAK (v2026.5)

> **Phạm vi**: repo `HAK_WEBAPP_DNTT_DRAFT`, nhánh `main` @ `1ece58f`.
> **Phương pháp**: đọc 100% mã nguồn (`Code.gs` 8 024 dòng · `Index.html` 4 121 dòng · `appsscript.json` · `README.md`), đối chiếu chéo luồng gọi hàm, luồng ghi/đọc sheet.
> **Nguyên tắc**: tài liệu này **chỉ phân tích — KHÔNG sửa code**. Mọi đề xuất nằm ở `REFACTOR_PLAN.md` và chỉ thực hiện sau khi người dùng đồng ý.
> Tham chiếu dạng `Code.gs:3071` = file:dòng tại commit trên.
>
> **Cập nhật v2026.6.0**: các rủi ro C-01…C-04, H-02…H-06 (xem `REFACTOR_PLAN.md`) đã được xử lý — chi tiết trong `CHANGELOG.md`, trạng thái trong `docs/TODO.md`. Nội dung dưới đây giữ nguyên là ảnh chụp hiện trạng **trước** khi sửa.

---

## 0. Tóm tắt điều hành

| Chỉ số | Giá trị |
|---|---|
| Tổng dòng code | 12 145 (Code.gs 8 024 · Index.html 4 121) |
| Số hàm server (`Code.gs`) | 261 |
| Số hàm client (`Index.html`) | 210 |
| Số file mã nguồn | 2 (toàn bộ backend 1 file, toàn bộ frontend + CSS 1 file) |
| Thư viện ngoài | 0 (chỉ Google Fonts) — **tốt** |
| Lời gọi `getValues()` / `setValues()` | 109 / 80 |
| `clear()` / `clearContent()` / `deleteRow` | 12 / 15 / 13 |
| Hàm có `sysLock.acquire()` | 17 |
| `logAction()` (nhật ký) | 51 vị trí |
| `innerHTML` / `onclick=` inline (client) | 132 / 125 |
| ARIA / `role=` / `tabindex` | 0 / 0 / 0 |
| Test tự động | 0 |

**Kết luận nhanh**

- Nghiệp vụ **rất đầy đủ** và đã được “vá” kỹ theo từng yêu cầu (chú thích `MỚI/SỬA (mục X)` khắp nơi). Nhiều thực hành tốt: khóa `LockService`, nhật ký thao tác, chunked cache, khóa định dạng TEXT, xử lý theo lô để tránh timeout.
- **Kiến trúc là “monolith 2 file”**: không có tách lớp (UI ↔ controller ↔ service ↔ repository), cột sheet truy cập bằng **chỉ số cứng** (magic index), nghiệp vụ trộn lẫn I/O.
- **Rủi ro lớn nhất** thuộc 3 nhóm:
  1. **Toàn vẹn dữ liệu**: `runConfirmPayment` ghi nhiều file/sheet **không nguyên tử**, không idempotent; nhiều chỗ **ghi đè toàn bộ sheet** (kể cả file PhieuCan_DN bên ngoài).
  2. **Bảo mật**: web app `ANYONE` + `USER_DEPLOYING`, **không có xác thực/phân quyền**; `doGet?action=` cho phép chạy nghiệp vụ không cần đăng nhập; nhiều `onclick` inline chứa dữ liệu người dùng.
  3. **Khả năng mở rộng thương mại**: không có khái niệm Company/Branch/User/Role, không có versioning schema, không có test → mọi tính năng thương mại (multi-tenant, license, plugin…) đều cần tái cấu trúc nền.

---

## 1. Kiến trúc hiện tại

```
┌────────────────────────── Trình duyệt ──────────────────────────┐
│ Index.html  (CSS + HTML shell + 210 hàm JS, 1 biến global state)│
│  goTo(page) → PAGES[page].render() → innerHTML template          │
│  call(fn,args) = Promise(google.script.run[fn])                  │
│  localStorage 'hak_bulk_ref_v1' (HĐ + STK + CCCD toàn bộ NCC)    │
└───────────────┬─────────────────────────────────────────────────┘
                │ google.script.run (mọi hàm không kết thúc "_")
┌───────────────▼──────────── Apps Script (V8) ───────────────────┐
│ Code.gs (261 hàm, ~20 “khối mục” theo lịch sử yêu cầu)           │
│  doGet(): trả Index | ?action=tach_phieu|lap_de_nghi|…           │
│  onOpen(): menu “🚀 QUẢN LÝ HAK” trong Sheet                     │
│  Trigger: 7:30/13:00 · 10 phút (7:30-19:00) · 15h (cấu hình)     │
│  Dịch vụ: SpreadsheetApp, DriveApp, LockService, CacheService,   │
│           PropertiesService, UrlFetchApp(Gemini), Session         │
└───────┬───────────────┬──────────────────┬───────────────┬──────┘
        │               │                  │               │
┌───────▼──────┐ ┌──────▼─────────┐ ┌──────▼──────┐ ┌──────▼──────────┐
│ FILE NHÁP    │ │ FILE CHÍNH     │ │ FILE NGOÀI  │ │ Drive folder    │
│ (bound)      │ │ MAIN_SS_ID     │ │ PhieuCan_DN │ │ BAOCAO_FOLDER   │
│ *_DRAFT      │ │ DNTT_GK_DN     │ │ HD_NCC      │ │ (file Excel/UNC │
│ mirror/cache │ │ DNTT_GK_DN_CT  │ │ HD_STK      │ │  xuất ra)       │
│ sheets       │ │ DNTT_GK_DN_112 │ │ DM_NG       │ └─────────────────┘
│              │ │ NhatKyThaoTac  │ │ Update_NH_DN│
│              │ │ ChiTietDNTT    │ │ Danh Mục NH │
│              │ │ ChiTietUNC     │ └─────────────┘
│              │ │ Lanthanhtoan   │
│              │ │ Thông Số       │
└──────────────┘ └────────────────┘
```

- **Mô hình triển khai**: script **gắn liền (bound)** với File Nháp (`SpreadsheetApp.getActive()`), File Chính tham chiếu qua Script Property `MAIN_SS_ID`; các file ngoài qua `LINKS` (cứng) + Script Properties (đổi được ở Cài Đặt).
- **Không có lớp**: mỗi hàm web (`webXxx`, `getXxx`, `runXxx`) tự mở sheet, tự đọc/ghi, tự tính nghiệp vụ, tự trả về object cho UI.
- **Cấu hình**: `LINKS` + `CFG` (`Code.gs:108-474`) đọc Script Properties **ở phạm vi global** (chạy lại mỗi lần gọi server).
- **Manifest**: `timeZone Asia/Ho_Chi_Minh`, `executeAs USER_DEPLOYING`, `access ANYONE`, `exceptionLogging STACKDRIVER`.

---

## 2. Luồng xử lý (nghiệp vụ)

### 2.1 Vòng đời một Đề Nghị Thanh Toán (ĐNTT)

```
[Tạo Mới – Wizard 3 bước]            createNewPaymentRequest()   Code.gs:6205
   B1 chọn Chủ rừng/CCCD → B2 chọn HĐ, STK, phiếu cân → B3 xác nhận
   ⇒ ghi Draft Src + Draft CT + placeholder Draft 112 (File Nháp)
            │  (hoặc menu “Tách Phiếu” runProcessDetail() từ DNTT_GK_DN thật)
            ▼
 Trạng thái 1 “Chưa ĐNTT”  (Số tiền 112 ≤ 0)
            │ Tổng Hợp 112  runCreate112()                     Code.gs:3436
            ▼
 Trạng thái 2 “Chờ ĐNTT”   (Số tiền > 0, cột 24 rỗng) ← được Sửa/Xóa
            │ Xác Nhận  runXacNhanDNTT()                        Code.gs:7339
            ▼
 Trạng thái 3 “Đang ĐNTT”  ← In Báo Cáo ĐNTT (ChiTietDNTT = "N"),
            │                Tạo UNC (ChiTietUNC), Về Chờ ĐNTT (runHuyXacNhanDNTT)
            │ Duyệt  webConfirmPayment → runConfirmPayment()   Code.gs:3071
            ▼
 ĐÃ CHỐT (bản chính):  CT thật + 112 thật + Src thật (Đóng TT)
            + ChiTietDNTT "Y" + MISA tự động (Update_NganHang_DN)
            + khóa Phiếu Cân (PhieuCan_DN) + dọn File Nháp
            │ (ngoại lệ) Mở Đóng TT  webMoDongThanhToanTheoHoSo() Code.gs:1037
            ▼
 Quay lại File Nháp “Chờ ĐNTT”, xóa khỏi bản chính + 3 bảng con
```

### 2.2 Các luồng phụ

| Luồng | Điểm vào | Ghi chú |
|---|---|---|
| Báo cáo thanh toán gỗ keo / chi tiết / MISA / UNC | `getMainTableData`, `getChiTietDNTTDaChot`, `getMisaDataTheoNgay`, `getLichSuUNC` | Đọc bản chính, lọc theo ngày, xuất Excel (tạo Spreadsheet mới trong folder báo cáo) |
| Công nợ (7 tab) | `getDebtByCustomer`, `getDebtByContract`, `getDebtLedgerDetail`, `getPaymentAnalysis`, `getPhanTichNhapTTReport`, `getChiTietCongNoPhieuCanWeb`, `getTinhHinhThanhToanHangNgayWeb` | Snapshot trong File Nháp + tính trực tiếp khi khác khoảng mặc định |
| Hệ thống/Bảo trì | `getDoiSoatTenKhachHang`, `webDongBoTenKhachHang`, `getKiemTraDoiChieuBaoTri`, `webXoa*MoCoi*`, `runFillMissingBankOnly`, `dongBoChiTietDNTTTuDauLichSu`, `webTaoLaiMisaTheoNgay`, `webTaoLaiUNCTheoNgay` | Nhiều thao tác ghi thẳng dữ liệu đã chốt / file ngoài |
| Cài đặt | `webSetMainSsId`, `webSetSwappableLink`, `webShareConfigLink`, `webSetRegion`, `webSetExportRegion`, `webSetMisaDefaults`, `webSetUncConfig`, `webSetChatbotApiKey`, trigger setup | Lưu Script Properties |
| Chạy nền | `dailyRefreshAllCaches_`, `refreshAllDraftCaches10Min_`, `daily15hRefresh_`, webhook `lam_moi_cache` | Làm mới mirror/snapshot |
| Chatbot | `TRA_LOI_CHATBOT` → `_goiGeminiCoDuPhong_` | Gemini + chế độ dự phòng không AI |
| Menu trong Sheet | `onOpen` (`Code.gs:7700`) | 20 mục, trùng chức năng với web app |

---

## 3. Luồng dữ liệu

### 3.1 Bản đồ lưu trữ

| Kho | Sheet | Số cột | Vai trò | Ai ghi |
|---|---|---|---|---|
| File Nháp | `DNTT_GK_DN_DRAFT` | 18 | “Đơn xin” tạo qua web | create, confirm (dọn), mở đóng |
| File Nháp | `DNTT_GK_DN_CT_DRAFT` | 22 | Chi tiết phiếu cân đang xử lý (= “khóa tạm” phiếu cân) | create, processDetail, add/remove PC, confirm |
| File Nháp | `DNTT_GK_DN_112_DRAFT` | 24 (+ cột “Trạng Thái ĐNTT”) | Tổng hợp tiền | create112, update112, xác nhận, confirm |
| File Nháp | `PhieuCan_DN_CHUA_TT_DRAFT`, `HD_NCC_DRAFT`, `HD_STK_DRAFT`, `HopDongTienDo_DRAFT`, `CongNoKhachHang_DRAFT`, `PhanTichNhapTT_DRAFT`, `ChiTietCongNoPhieuCan_DRAFT` | – | Mirror/snapshot | trigger, refresh thủ công |
| File Chính | `DNTT_GK_DN` | 18 | Nguồn (thật) | confirm, processDetail, mở đóng, xóa mồ côi |
| File Chính | `DNTT_GK_DN_CT` | 22 | Chi tiết đã chốt | confirm, mở đóng, xóa mồ côi |
| File Chính | `DNTT_GK_DN_112` | 23 | Tổng hợp đã chốt | confirm, fill bank, mở đóng |
| File Chính | `ChiTietDNTT` | 28 | Báo cáo chi tiết (N/Y) | in báo cáo, confirm, đồng bộ lịch sử |
| File Chính | `ChiTietUNC` | 18 | Lịch sử UNC | tạo UNC |
| File Chính | `NhatKyThaoTac` | 5 | Audit log | `logAction` |
| File Chính | `Lanthanhtoan`, `Thông Số` | – | Tham số | thủ công / generateThongSoSheet |
| File ngoài | `PhieuCan_DN` | ≥28 | Phiếu cân gốc | **confirm (ghi đè toàn sheet)**, **đồng bộ tên (ghi đè cột)**, mở đóng |
| File ngoài | `HD_NCC`, `HD_STK`, `DM_NG` | – | Hợp đồng, tài khoản, nguồn gốc | chỉ đọc |
| File ngoài | `Update_NganHang_DN` | 33 | Mẫu nhập MISA | MISA tự động / tạo lại / mở đóng (xóa) |
| File ngoài | Danh Mục NH | – | Mã ngân hàng cho UNC | chỉ đọc |
| Script Properties | `MAIN_SS_ID`, `PC_SS_ID`, `HD_SS_ID`, `UPDATE_NH_SS_ID`, `REPORT_FOLDER_ID`, `DM_NH_SS_ID`, MISA/UNC defaults, REGION, EXPORT_REGION, `GEMINI_API_KEY`, `WEBHOOK_SECRET`, meta cache (`CONGNO_CACHE_*`, `HDTIENDO_*`, `CTCN_SNAPSHOT_DATE`), `TRIGGER_15H_*`, header PC | – | Cấu hình + trạng thái | Cài đặt, trigger |
| CacheService | chunked `pc_unpaid_data_v1`, `ct/src/112` … TTL 90 s | – | Cache đọc | `_getCachedRefData_` |
| localStorage | `hak_bulk_ref_v1` | – | HĐ + CCCD + STK toàn bộ NCC | client |

### 3.2 Ma trận Đọc/Ghi của thao tác quan trọng nhất — `runConfirmPayment` (`Code.gs:3071-3325`)

| Bước | Dòng (tương đối) | Hành động | Nguyên tử? |
|---|---|---|---|
| 1 | +4 | `sysLock.acquire()` (script lock 30 s) | – |
| 2 | +111 | APPEND CT thật (22 cột) | ✗ |
| 3 | +117 | APPEND 112 thật (23 cột) | ✗ |
| 4 | +138 | ChiTietDNTT N→Y + bù dòng + **MISA tự động** (file ngoài) — lỗi chỉ ghi log | ✗ |
| 5 | +166..170 | APPEND Src thật; **clearContent + setValues** Draft Src | ✗ |
| 6 | +191 | **Ghi đè TOÀN BỘ** DNTT_GK_DN (Đóng TT) | ✗ |
| 7 | +204 | **Ghi đè TOÀN BỘ PhieuCan_DN (file ngoài)** | ✗ |
| 8 | +213..218 | **clearContent + setValues** Draft CT, Draft 112 | ✗ |
| 9 | +228.. | logAction, invalidate cache, refresh phân tích | – |

➡️ Bị timeout (6 phút) hoặc lỗi ở giữa bước 2-8 → dữ liệu **nửa chốt nửa nháp**; chạy lại sẽ **APPEND trùng** vào CT/112 thật (không có khóa idempotent theo `ID_KEY`).

### 3.3 Dòng dữ liệu cache

```
PhieuCan_DN ─(10’/7:30/13:00/webhook)→ PhieuCan_DN_CHUA_TT_DRAFT ─→ CacheService(90s, chunk) ─→ client
HD_NCC/HD_STK ─(như trên)→ HD_*_DRAFT ─→ getBulkReferenceData ─→ localStorage (đổi mốc 7:30/13:00)
CT/112 thật ─(7:30/13:00)→ HopDongTienDo_DRAFT, CongNoKhachHang_DRAFT
PhieuCan + CT thật ─(15h)→ PhanTichNhapTT_DRAFT, ChiTietCongNoPhieuCan_DRAFT
```

---

## 4. Danh sách Module

Code hiện **không có module vật lý**; bảng dưới là **module logic** suy ra từ khối chú thích và quan hệ gọi hàm.

### 4.1 Backend (`Code.gs`)

| Mã | Module | Phạm vi dòng | Hàm tiêu biểu |
|---|---|---|---|
| B01 | Cấu hình & Link file | 98-298 | `LINKS`, `_swappableLinkDefs_`, `getConfigLinksForSettings`, `webSetSwappableLink`, `webShareConfigLink`, `getSharedUsersForLink`, `webRevokeConfigLinkAccess` |
| B02 | Sheet Thông Số | 299-393 | `generateThongSoSheet` |
| B03 | CFG + hằng trạng thái | 394-499 | `CFG`, `COL_TRANG_THAI_DNTT`, `_isRecordEditable_` |
| B04 | Core utils / Lock / Log | 500-563 | `utils`, `sysLock`, `logAction` |
| B05 | Router HTTP | 564-606 | `doGet` |
| B06 | Kết nối File Chính & tham số | 607-920 | `getMainSs_`, `webSetMainSsId`, `getTriggerStatusForWeb`, `getFormatLockStatusForWeb`, MISA defaults, Export region, UNC config |
| B07 | Lịch sử sửa đổi & Mở Đóng TT | 921-1235 | `getLichSuSuaDoi`, `timChuRungDaChot`, `webMoDongThanhToanTheoHoSo` |
| B08 | UNC | 1236-1351, 1459-1545, 1622-1729, 2795-2821 | `webCreateUNCFromDraft`, `_ghiLichSuUNC_`, `runCreateUNCOnly`, `webTaoLaiUNCTheoNgay` |
| B09 | MISA | 1352-1458, 2710-2871 | `getMisaDataTheoNgay`, `exportMisaTheoNgayExcel`, `webTaoLaiMisaTheoNgay`, `_tuDongXuatMisaKhiDong_` |
| B10 | ChiTietDNTT | 1546-1621, 2367-2658 | `_xayChiTietDNTTRows_`, `_ghiChiTietDNTT_N_`, `_chuyenChiTietDNTTSangYVaTinhBu_`, `dongBoChiTietDNTTTuDauLichSu` |
| B11 | Khóa định dạng & Vùng | 1730-1966 | `_lockTextCols_`, `khoaDinhDangTextTatCa`, `REGION_PRESETS`, `_parseNgayTheoVung_`, `_parseNgayVN_` |
| B12 | Webhook | 1967-2056 | `_getWebhookSecret_`, `onChangeLamMoiCache`, `getWebhookInfoForWeb` |
| B13 | Hạ tầng File Nháp | 2057-2168 | `getDraftSheets_`, `_ensureDraft112Schema_`, `buildDraftCtRow_` |
| B14 | Báo cáo thanh toán gỗ keo | 2169-2366 | `get112ViewData`, `getMainTableData`, `createFinalReportFromFilteredData`, `renderSheet1Full` |
| B15 | Nghiệp vụ lõi (Chốt/Tách/112) | 2872-3600 | `_gomChiTietChuyenKhoan_`, `renderSheet2Detail(FromDraft)`, `buildBankLookupFromHDSTK`, `runConfirmPayment`, `runProcessDetail`, `runCreate112` |
| B16 | Tra cứu phiên/phiếu cân/HĐ | 3601-3710 | `getSessionInfo`, `findAvailablePhieuCan`, `getContractInfo` |
| B17 | Lớp cache & mirror | 3711-4106 | `PC_COL`, `_getCachedRefData_`, `refreshHdNccCache_`, `refreshHdStkCache_`, `_ctThatDataCache_`, `refreshAllDraftCaches_` |
| B18 | Phân tích NG-ĐL / CTCN / THT | 4107-4950 | `refreshPhanTichNhapTT*`, `getPhanTichNhapTTReport`, `buildPivot`, `getChiTietCongNoPhieuCan`, `getTinhHinhThanhToanHangNgay`, `daily15hRefresh_`, exports |
| B19 | Tiến độ hợp đồng | 4951-5164 | `refreshHopDongTienDoCache_`, `_computeHopDongTienDoLiveSingle_`, `_getDmNgMap_` |
| B20 | Cache Phiếu Cân chưa TT & Trigger | 5165-5388 | `refreshPhieuCanUnpaidCache_`, `_removeFromPcUnpaidCache_`, `setup*Trigger` |
| B21 | Công nợ | 5389-5856 | `_computeDebtByCustomerLive_`, `getDebtByCustomer`, `getDebtByContract`, `getDebtLedgerDetail`, `getPaymentAnalysis` |
| B22 | API luồng Tạo Mới | 5857-6337 | `searchChuRungNames`, `getAvailablePhieuCanForChuRung`, `getBulkReferenceData`, `getChuRungContext`, `createNewPaymentRequest` |
| B23 | Quản lý Nháp & Dashboard | 6338-6924 | `runDeleteDraftRecord`, `getAppSetupStatus`, `getDashboardStats`, `getDraftListSummary`, `getDraftRecordDetail`, `updateDraft112Info`, `add/removePhieuCan*` |
| B24 | Đối soát tên & Bảo trì | 6925-7338 | `getDoiSoatTenKhachHang`, `webDongBoTenKhachHang`, `getKiemTraDoiChieuBaoTri`, `webXoa*MoCoi*` |
| B25 | Duyệt 3 bước & In báo cáo | 7339-7566 | `runXacNhanDNTT`, `runHuyXacNhanDNTT`, `webConfirmPayment`, `webRunCreate112`, `exportBaoCaoDNTTFromDraft` |
| B26 | Menu & Dialog Sheet | 7567-7799 | `onOpen`, `show*Dialog`, `runFillMissingBankOnly`, `showPayDialog`, `showAddPaymentDialog` |
| B27 | Chatbot Gemini | 7800-8024 | `_goiGeminiCoDuPhong_`, `_chatbotTraLoiDuPhong_`, `_layNgayVaSoLieuThatChoChatbot_`, `TRA_LOI_CHATBOT` |

### 4.2 Frontend (`Index.html`)

| Mã | Module | Phạm vi dòng | Nội dung |
|---|---|---|---|
| F01 | CSS / Design tokens | 10-396 | biến `:root`, layout, bảng, modal, toast, chatbot, 2 `@media` |
| F02 | Khung HTML | 397-454 | sidebar `nav`, topbar, `#content`, overlay, toast, modal, widget chatbot |
| F03 | Core client | 455-720 | `state`, `esc`, format số, phân trang, ngày VN, bulk-ref localStorage, `call`, `toast`, `handleResult`, modal, `PAGES`, `goTo` |
| F04 | Trang chủ | 720-818 | `renderDashboard` |
| F05 | Wizard Tạo Mới | 819-1438 | 3 bước, gợi ý chủ rừng, chọn phiếu cân, HĐ, STK, submit |
| F06 | Danh sách ĐNTT | 1439-1867 | bảng nháp theo trạng thái, xác nhận, in, UNC, 112, chi tiết, sửa, xóa, duyệt |
| F07 | Báo cáo thanh toán | 1868-2431 | 4 subtab + batch job (đồng bộ lịch sử, tạo lại MISA/UNC) |
| F08 | Công nợ | 2432-3140 | 7 subtab, ledger, pivot, xuất Excel |
| F09 | Hướng dẫn | 3141-3255 | nội dung tĩnh |
| F10 | Hệ thống | 3256-3417, 3733-3862 | đối soát, bảo trì, fill bank, mở đóng TT, lịch sử, tạo lại MISA/UNC |
| F11 | Cài đặt | 3418-3732, 3863-4041 | file chính, link, chia sẻ, trigger, khóa định dạng, vùng, MISA/UNC, API key |
| F12 | Chatbot | 4043-4100 | widget |
| F13 | Khởi động | 4102-4118 | `getAppSetupStatus` → `goTo` |

---

## 5. Quan hệ giữa các Module

```
F05/F06/F07/F08/F10/F11 ──call()──► B22/B23/B25/B14/B21/B18/B24/B06/B01 (API)
                                           │
      ┌────────────────────────────────────┼─────────────────────────────┐
      ▼                                    ▼                             ▼
B15 Nghiệp vụ lõi ◄── B25 Duyệt       B21 Công nợ ◄── B18 Phân tích   B24 Bảo trì
   │  ├─► B10 ChiTietDNTT ─► B09 MISA      │                              │
   │  ├─► B08 UNC                          ▼                              ▼
   │  └─► B20 PC cache                  B17 Cache/mirror ◄── B19 Tiến độ HĐ
   ▼                                        ▲
B13 Draft infra ─► B11 Format lock          │  trigger / webhook (B12)
   ▼                                        │
B04 utils/lock/log ◄──────── (mọi module) ──┘
B03/B01 CFG/LINKS ◄──────── (mọi module, qua global)
```

- **Khớp nối chặt (tight coupling)**: mọi module phụ thuộc trực tiếp vào `CFG`, chỉ số cột dạng số, và `SpreadsheetApp`.
- **Phụ thuộc vòng về mặt ngữ nghĩa**: B15 ↔ B17 (ghi xong phải tự gọi `_invalidate*`), B15 → B18 (`_refreshPhanTichNhapTTChoDanhSachNgayNoLock_`) — nghiệp vụ “biết” về cache.
- **Frontend ↔ backend** chỉ gắn bằng **chuỗi tên hàm** (`call('webXxx')`) — không có hợp đồng API/kiểu dữ liệu, đổi tên hàm server là vỡ client mà không có cảnh báo.

---

## 6. Phụ thuộc (Dependency)

| Loại | Thành phần | Mức độ dùng | Ghi chú |
|---|---|---|---|
| GAS service | `SpreadsheetApp` | rất nhiều (12 `openById`) | cốt lõi |
| GAS service | `DriveApp` | 33 | tạo/di chuyển file báo cáo, chia sẻ quyền |
| GAS service | `LockService` | 1 (qua `sysLock`) | script lock toàn cục |
| GAS service | `CacheService` | 12 | chunked cache |
| GAS service | `PropertiesService` | 43 | cấu hình + trạng thái |
| GAS service | `ScriptApp` | 4 `newTrigger` | trigger thời gian |
| GAS service | `UrlFetchApp` | 3 | Gemini API |
| GAS service | `HtmlService`, `ContentService`, `Session`, `Utilities` | – | UI, JSON, email, định dạng |
| Ngoài | Google Fonts (Inter, Source Serif 4, IBM Plex Mono) | 1 link | CSS |
| Ngoài | Gemini API (`gemini-3.6-flash` + 3 model dự phòng) | chatbot | tên model hard-code |
| Dữ liệu | 6 file Google Sheet + 1 folder Drive | – | ID cứng trong `LINKS` làm mặc định |
| Thư viện JS | **không có** | – | phù hợp yêu cầu “ưu tiên JS thuần” |
| Build/Deploy | “gas-tools extension” (theo README) | – | không có clasp/CI/test |

---

## 7. Điểm yếu

1. **Monolith 2 file** (436 KB + 257 KB): khó đọc, khó review, xung đột merge cao, vượt khả năng “đọc hết” của 1 người.
2. **Không có lớp dữ liệu (repository)**: chỉ số cột viết cứng (`r[6]`, `row112[23]`, `newRow[16] = first[21]`…) rải khắp 261 hàm. Chèn 1 cột trong sheet = vỡ âm thầm (đã phải thêm cảnh báo header PC để bù).
3. **Không có xác thực/phân quyền** (xem §12).
4. **Không có giao dịch/rollback** cho thao tác nhiều bước (xem §13).
5. **Không có test tự động**, không có môi trường staging; mọi thay đổi thử thẳng trên dữ liệu thật.
6. **Không có versioning schema/migration**: cột mới được “tự vá” rải rác (`_ensureDraft112Schema_`).
7. **Audit yếu**: `logAction` dùng `appendRow` (chậm, không khóa), `Session.getActiveUser()` với `USER_DEPLOYING` thường trả rỗng cho người dùng ngoài domain → cột “Người thực hiện” = `N/A`; không lưu giá trị trước/sau.
8. **Trộn ngôn ngữ đặt tên** (Việt không dấu + Anh: `webXoaCTMoCoi`, `getDebtByCustomer`, `_layNgayVaSoLieuThatChoChatbot_`).
9. **Tài liệu trong code lỗi thời**: header `Code.gs` mô tả “File Nháp là file riêng / CFG.DRAFT_SS_ID” trong khi code hiện tại đã chuyển sang bound script.
10. **Hai giao diện song song** (menu trong Sheet + Web App) cho cùng nghiệp vụ → nhân đôi đường vào, nhân đôi chỗ cần bảo vệ; `showAddPaymentDialog` còn trỏ tới file `AddPaymentDialog` **không tồn tại**.
11. **Không có i18n**: chuỗi tiếng Việt nằm trong logic server & client.
12. **Không hỗ trợ đa đơn vị**: mọi thứ gắn với 1 công ty (tài khoản `8619299999`, BIDV, mã 43 trong `CFG`; prompt chatbot ghi cứng “Hoàng Anh Khôi Đà Nẵng”).

---

## 8. Lỗi thiết kế

| # | Lỗi thiết kế | Bằng chứng | Hệ quả |
|---|---|---|---|
| D1 | Nghiệp vụ tài chính nhiều bước không nguyên tử & không idempotent | `runConfirmPayment` (§3.2), `webMoDongThanhToanTheoHoSo` | trùng/mất dữ liệu khi lỗi giữa chừng |
| D2 | “Khóa tạm” phiếu cân = “đang xuất hiện trong Draft CT” | header `Code.gs` mục J | xóa tay 1 dòng trong Sheet là giải phóng phiếu cân, không có dấu vết |
| D3 | Khóa đọc-sửa-ghi **toàn bộ sheet** thay vì ghi theo ô/dòng | `Code.gs:3274-3275`(+191/+204), `runProcessDetail`, `runFillMissingBankOnly` | ghi đè thay đổi đồng thời, phá công thức ở file ngoài |
| D4 | Mẫu “clearContent rồi setValues” cho sheet nháp | runConfirmPayment +169/+213/+217, `refresh*Cache_` | bị ngắt giữa 2 lệnh = mất sạch nháp |
| D5 | Công nợ gom theo **tên** khách hàng, không theo ID/CCCD | `_computeDebtByCustomerLive_` | trùng tên → gộp sai, đổi tên → tách sai |
| D6 | Nghiệp vụ biết cache (gọi `_invalidate*` thủ công) | 15+ vị trí | quên invalidate = số liệu cũ |
| D7 | Cấu hình đọc ở phạm vi global (`CFG` gọi PropertiesService khi nạp script) | `Code.gs:394-402` | mỗi request tốn thêm 3 lượt đọc property; không test được |
| D8 | Trạng thái nghiệp vụ lưu trong 1 cột text tự do (“Đang ĐNTT”, “OK”, “Test giá”, “Y/N”) | `COL_TRANG_THAI_DNTT`, Src cột Đóng TT | không có state machine, dễ sai chính tả |
| D9 | Hợp đồng API client-server là tên chuỗi | 94 lời gọi `call('...')` | đổi tên hàm không phát hiện được |
| D10 | Mọi hàm không có `_` cuối đều gọi được từ client | GAS mặc định | lộ hàm nội bộ nếu quên `_` |
| D11 | Dữ liệu cá nhân (CCCD/STK) nhân bản vào mirror, CacheService, localStorage, prompt AI | B17, F03, B27 | tăng bề mặt rò rỉ |

---

## 9. Code smell

| Smell | Ví dụ |
|---|---|
| God file / God function | `runConfirmPayment` ~255 dòng; `webMoDongThanhToanTheoHoSo` ~200 dòng; `getKiemTraDoiChieuBaoTri` ~150 dòng; `createNewPaymentRequest` ~140 dòng |
| Magic number | chỉ số cột (`r[16]`, `[23]`, `22`, `24`, `18`, `33`), `30000` ms lock, `90000` byte, `PAGE_SIZE=20`, `1000` giới hạn lịch sử, `50` bảo trì, giờ trigger 7:30/13:00 |
| Chú thích lịch sử thay cho VCS | hàng trăm khối `// SỬA (theo yêu cầu …)`, `MỚI (mục AH)` |
| Nuốt lỗi | `catch (e) {}` trong `logAction`, localStorage, ~158 `try` phần lớn trả `{success:false,message}` không log stack |
| Global state client | 1 object `state` (272 truy cập), biến global `chatbotLichSu_` |
| Inline handler | 125 `onclick="..."` trong template string |
| Tên không nhất quán | `webXxx` / `getXxx` / `runXxx` / `doXxx` / `_xxx_` lẫn lộn cho cùng loại hàm |
| Ngày theo UTC ở client | 14 chỗ `new Date().toISOString().slice(0,10)` dù đã có `todayISOVN()` (`Index.html:543`) |
| Primitive obsession | hàng trả về mảng 2 chiều thô, không có model |
| Dead code | `showAddPaymentDialog` (file không tồn tại); `renderSheet2Detail` gần như trùng `renderSheet2DetailFromDraft` |

---

## 10. Code trùng lặp

| Nhóm trùng | Vị trí | Mức |
|---|---|---|
| Xuất Excel: tạo Spreadsheet → chuyển folder → khóa cột → header → ghi → trả URL | `exportMisaTheoNgayExcel`, `exportLichSuUNCExcel`, `exportChiTietDNTTDaChotExcel`, `exportTinhHinhThanhToanExcel`, `exportChiTietCongNoPhieuCanExcel`, `exportDoiSoatTenKhachHangExcel`, `createFinalReportFromFilteredData`, `runCreateUNCOnly`, `exportPhanTichNhapTTBaoCao`, `exportBaoCaoDNTTFromDraft` (~10 bản) | Cao |
| Render chi tiết chuyển khoản | `renderSheet2Detail` ↔ `renderSheet2DetailFromDraft` | Cao |
| Wrapper dialog menu | `show*Dialog` (12 hàm cùng khuôn) | Trung bình |
| Xóa mồ côi | `webXoaMoCoiChiTietDNTT`, `webXoaMoCoiChiTietUNC`, `webXoaCTMoCoi`, `webXoaSrcMoCoi` (cùng vòng lặp xóa dòng) | Trung bình |
| Tab báo cáo client: render → load → filter options → result table → export → paging | MISA, ChiTiet, UNC, GoKeo, CTCN, THT, Debt… (≥8 bản) | Cao |
| Batch job client `chayMotLot` | 3 bản (`doDongBoChiTietLichSu`, `doTaoLaiMisaTheoNgay`, `doTaoLaiUncTheoNgay`) | Trung bình |
| Đọc “CT thật” trực tiếp thay vì qua `_ctThatDataCache_` | nhiều hàm công nợ/bảo trì | Trung bình |
| Getter/Setter Script Property | `_getMisaDefault_`, `_getUncDefault_`, `_getRegion_`, `_getExportRegion_`, `getReportFolderId_`, `getDmNhSsId_`… | Thấp |
| Menu Sheet ↔ nút Web App | cùng nghiệp vụ, 2 đường vào | Trung bình |

---

## 11. Code cần refactor (ưu tiên)

| Ưu tiên | Đối tượng | Lý do |
|---|---|---|
| 1 | `runConfirmPayment`, `webMoDongThanhToanTheoHoSo`, `runProcessDetail`, `runCreate112` | Tài chính cốt lõi; cần Unit-of-Work + idempotency + ghi theo dòng |
| 2 | Toàn bộ truy cập cột | Đưa về Schema/Repository (map tên cột → chỉ số, kiểm tra header) |
| 3 | `doGet` + tất cả `web*` | Thêm lớp Auth/Permission trước controller |
| 4 | Lớp cache (B17, B20, B19, B21 snapshot) | Hợp nhất 1 CacheService có invalidation theo sự kiện |
| 5 | 10 hàm xuất Excel | 1 `ExportService` + định nghĩa cột khai báo |
| 6 | Frontend render tab | Component bảng dùng chung (filter, sort, paging, export, virtual scroll) |
| 7 | `logAction` | AuditService (batch ghi, before/after, user thật) |
| 8 | Chatbot | Tách provider AI, cấu hình model, lọc PII |

---

## 12. Code nguy hiểm (bảo mật)

| Mức | Vấn đề | Vị trí | Mô tả |
|---|---|---|---|
| 🔴 Critical | Web app không xác thực | `appsscript.json` (`ANYONE`, `USER_DEPLOYING`) | Ai có link (tài khoản Google bất kỳ) đều chạy mọi hàm server **với quyền chủ script** |
| 🔴 Critical | GET action chạy nghiệp vụ | `doGet` `Code.gs:564-601` | `?action=tach_phieu` (ghi dữ liệu), `lap_de_nghi` (ghi), `tim_phieu_can`, `tra_cuu_hop_dong` (lộ dữ liệu) — không cần secret |
| 🔴 Critical | Không có phân quyền theo vai trò | toàn bộ `web*` | người xem cũng xóa được dữ liệu đã chốt (`webXoaCTMoCoi`, `webMoDongThanhToanTheoHoSo`), đổi File Chính, cấp quyền Drive (`webShareConfigLink` — **người dùng đã chọn giữ nguyên**, ghi nhận là rủi ro chấp nhận) |
| 🟠 High | Clickjacking | `doGet` `setXFrameOptionsMode(ALLOWALL)` | nhúng được vào iframe bất kỳ |
| 🟠 High | Stored XSS qua inline handler | `onclick='pickModongChuRung(${JSON.stringify(r)})'` (`Index.html:3356`), `goToLedgerFor`, `openLedgerFor`, `pickChuRung`, `addChosenPC`, `suaTenKhachHangPC`, `doRevokeLink('${esc(key)}','${esc(u.email)}')`… | `esc()` mã hóa HTML nhưng trình duyệt **giải mã entity trước khi chạy JS trong thuộc tính** → tên khách hàng chứa `'` hoặc `</` có thể thoát chuỗi JS |
| 🟠 High | `innerHTML` với URL chưa kiểm tra scheme | `loadMainSsInfo` `href="${info.url}"` (`Index.html:3558`), `res.url` trong modal xuất Excel | URL không qua `esc()` |
| 🟠 High | PII trong localStorage | `hak_bulk_ref_v1` (`Index.html:558-611`) | toàn bộ Họ tên + CCCD + STK nhà cung cấp lưu lâu dài trên máy người dùng |
| 🟠 High | PII gửi AI bên ngoài | `_layNgayVaSoLieuThatChoChatbot_` | dữ liệu thật đưa vào prompt Gemini |
| 🟡 Medium | Secret webhook trong query string | `doGet` `lam_moi_cache&secret=` | lộ qua log/lịch sử trình duyệt; so sánh chuỗi không constant-time |
| 🟡 Medium | Thông báo lỗi trả thẳng `err.toString()` | `doGet`, nhiều `web*` | lộ cấu trúc nội bộ |
| 🟡 Medium | Không có `eval`/`new Function` | – | ✅ không phát hiện |

---

## 13. Code có thể gây mất dữ liệu

| Mức | Vị trí | Kịch bản |
|---|---|---|
| 🔴 | `runConfirmPayment` +204: ghi đè **toàn bộ PhieuCan_DN** (file ngoài) | Người khác đang nhập phiếu cân trong lúc chốt → dòng mới/ô vừa sửa bị ghi đè bằng ảnh chụp cũ; công thức trong vùng bị thay bằng giá trị |
| 🔴 | `runConfirmPayment` +191, `runProcessDetail`, `runFillMissingBankOnly`: ghi đè toàn bộ sheet chính | Như trên với DNTT_GK_DN / 112 |
| 🔴 | `runConfirmPayment` bước 2-8 không nguyên tử | Timeout giữa chừng → CT/112 thật đã append nhưng Nháp chưa dọn → chạy lại tạo **bản trùng**; hoặc ngược lại |
| 🔴 | `webMoDongThanhToanTheoHoSo`: chép sang Nháp bằng nhiều `appendRow`, rồi xóa bản chính **theo vị trí dòng đọc từ trước**, từng dòng một, không sao lưu (đính chính: thứ tự là chép trước – xóa sau) | Sheet bị chèn/xóa dòng trong lúc chạy → xóa **nhầm dòng**; lỗi giữa chừng → CT đã xóa nhưng Src/112 còn (lệch); không có bản sao để khôi phục |
| 🟠 | `webDongBoTenKhachHang` (`Code.gs:6975`): đọc cả cột KHÁCH HÀNG, sửa trong bộ nhớ, ghi lại cả cột, **không lock** | Ghi đè tên vừa sửa bởi người khác |
| 🟠 | clearContent + setValues trên Draft CT/112/Src | Ngắt giữa 2 lệnh = mất toàn bộ nháp chưa chốt |
| 🟠 | `refresh*Cache_` dùng `sh.clear()` không lock; trigger 10’ và 7:30 có thể chồng nhau | Mirror trống tạm thời → người dùng thấy “không còn phiếu cân” |
| 🟠 | `refreshPhieuCanUnpaidCache_` (`Code.gs:5208`) ghi Số phiếu cân **không** tiền tố `'` sau `sh.clear()` | Mất số 0 đầu (đã sửa cho HD_NCC/HD_STK, **chưa** cho PC) |
| 🟠 | `webXoaCTMoCoi`, `webXoaSrcMoCoi`: xóa dữ liệu đã chốt, không backup, không soft-delete | Chỉ có log text |
| 🟡 | `logAction` nuốt lỗi | Mất dấu vết audit khi File Chính lỗi |
| 🟡 | Không có backup/versioning tự động | Chỉ dựa vào Version History của Google Sheets |

---

## 14. Code dễ phát sinh bug

| # | Vị trí | Vấn đề |
|---|---|---|
| 1 | 14 chỗ `toISOString().slice(0,10)` trong `Index.html` (vd `3294`, `3310`, `3320-3321`) | Trước 07:00 giờ VN trả **ngày hôm qua** |
| 2 | `get112ViewData` (`Code.gs:2169`) | STK không bỏ dấu `'` → có thể ra `''0123…` ở `renderSheet1Full` / UNC từ báo cáo |
| 3 | Render function gắn `addEventListener` mỗi lần render | Listener nhân đôi trong wizard Tạo Mới |
| 4 | `draftSelected` giữ nguyên khi đổi tab trạng thái | Nút hành động đã tính theo trạng thái thật của dòng chọn (giảm rủi ro), nhưng người dùng vẫn có thể thao tác cả hồ sơ đang bị ẩn ở tab khác |
| 5 | Chỉ số cột cứng + header PC có thể đổi | Chỉ cảnh báo (`pcHeaderCanhBao`), không chặn |
| 6 | `utils.standardize` bỏ mọi khoảng trắng & `'` | “NGUYEN VAN A” ≡ “NGUYENVANA”; khóa ghép có thể trùng |
| 7 | `utils.parseNum` xóa mọi ký tự ≠ `[0-9.-]` | “1.234.567” (VN) → `1.234` ; phụ thuộc định dạng vùng |
| 8 | Tên model Gemini hard-code (`gemini-3.6-flash`…) | Google ngừng model → chatbot lỗi |
| 9 | `ChiTietDNTT`/`ChiTietUNC` khóa theo `ID|Số phiếu` chuỗi | Chuẩn hóa không đồng nhất giữa các hàm |
| 10 | Trigger phụ thuộc múi giờ project | Có cảnh báo nhưng không chặn |
| 11 | `showAddPaymentDialog` | Gọi file không tồn tại → lỗi khi bấm menu 4 |
| 12 | Truy vấn O(n·m) `filteredRows.find` trong vòng lặp | Chậm/timeout khi dữ liệu lớn |

---

# PHỤ LỤC A — Phân tích từng file

### A.1 `Code.gs`

| Thuộc tính | Nội dung |
|---|---|
| Tên file | `Code.gs` (436 KB, 8 024 dòng, 261 hàm) |
| Chức năng | Toàn bộ backend: router, nghiệp vụ, truy cập dữ liệu, cache, trigger, xuất file, chatbot, menu Sheet |
| Được gọi từ | `Index.html` (94 `call()` + 1 `google.script.run` trực tiếp); menu `onOpen`; trigger thời gian; HTTP GET (`doGet`); webhook từ file PhieuCan/HD_NCC |
| Gọi tới | SpreadsheetApp, DriveApp, LockService, CacheService, PropertiesService, ScriptApp, UrlFetchApp (Gemini), Session, Utilities, HtmlService, ContentService |
| Biến toàn cục | `LINKS`, `CFG`, `utils`, `sysLock`, `COL_TRANG_THAI_DNTT`, `LICH_SU_SUA_DOI_ACTIONS`, `CHITIET_*_HEADERS`, `REGION_PRESETS`, `HDNCC_*`, `HDSTK_*`, `PC_COL`, `PC_MIRROR_COLS`, `REF_CACHE_*`, `PHANTICH_HEADERS`, `CTCN_HEADERS`, `CONGNO_KH_HEADERS`, `HD_TRANG_THAI_*`, `PC_COL_*_IDX`, `MISA_DEFAULT_KEYS`, `UNC_DEFAULT_KEYS`, `GEMINI_MODEL_MAC_DINH_`, `MODEL_DU_PHONG_`, `MODEL_DA_NGUNG_HO_TRO_`, `CHATBOT_HE_THONG_PROMPT_` |
| Hàm global (entry point) | `doGet`, `onOpen`, `onChangeLamMoiCache`, trigger handler (`dailyRefreshAllCaches_`, `refreshAllDraftCaches10Min_`, `daily15hRefresh_`), ~150 hàm public gọi từ client |
| Event | Menu Sheet, time-driven trigger, HTTP GET, webhook onChange (ở file ngoài) |
| Phụ thuộc | 6 Spreadsheet + 1 Drive folder + Gemini API |
| Mức quan trọng | **Rất cao** — chứa toàn bộ dữ liệu tài chính |
| Cần refactor? | **Có** — tách ≥ 25 file theo lớp (xem REFACTOR_PLAN §3) |

### A.2 `Index.html`

| Thuộc tính | Nội dung |
|---|---|
| Tên file | `Index.html` (257 KB, 4 121 dòng, 210 hàm) |
| Chức năng | Toàn bộ UI: CSS, khung trang, 7 trang (+ 11 subtab), wizard, bảng, modal, toast, chatbot |
| Được gọi từ | `doGet()` → `HtmlService.createTemplateFromFile('Index')` |
| Gọi tới | ~95 hàm server qua `call()` / `google.script.run`; Google Fonts |
| Biến toàn cục | `state` (≈40 khóa), `PAGES`, `PAGE_SIZE`, `PC_PICKER_PAGE_SIZE`, `BULK_REF_CACHE_KEY`, `chatbotLichSu_` |
| Hàm global | 210 (tất cả gắn vào `window` — cần cho `onclick` inline) |
| Event | 125 `onclick` inline, 6 `onchange`, 27 `addEventListener`, `DOMContentLoaded`, debounce `setTimeout` |
| Phụ thuộc | `google.script.run`, `localStorage` |
| Mức quan trọng | Cao |
| Cần refactor? | **Có** — tách CSS / core / components / pages; bỏ inline handler (event delegation) |

### A.3 `appsscript.json`

| Thuộc tính | Nội dung |
|---|---|
| Chức năng | Manifest: múi giờ, runtime V8, web app, logging |
| Rủi ro | `access: ANYONE` + `executeAs: USER_DEPLOYING` = không kiểm soát người dùng; thiếu `oauthScopes` tường minh |
| Cần refactor? | **Có** (sau khi có lớp Auth): khai báo `oauthScopes` tối thiểu, cân nhắc `DOMAIN`/`ANYONE` + whitelist |

### A.4 `README.md`

| Thuộc tính | Nội dung |
|---|---|
| Chức năng | 2 dòng (“Created from gas-tools extension”) |
| Cần refactor? | **Có** — viết lại: cài đặt, cấu hình, triển khai, kiến trúc |

### A.5 Phân tích theo module (mẫu cột yêu cầu)

| Module | Chức năng | Được gọi từ | Gọi tới | Global dùng | Event | Quan trọng | Refactor |
|---|---|---|---|---|---|---|---|
| B01 Link/Cấu hình | xem/đổi/chia sẻ file | F11 | DriveApp, Properties | `LINKS`, `CFG` | click | Cao | Có – ConfigService |
| B04 Core | chuẩn hóa, lock, log | tất cả | LockService, Sheet log | `utils`, `sysLock` | – | Rất cao | Có – tách helpers/audit |
| B05 Router | điều hướng HTTP | Web | B15, B16, B17 | – | GET | Rất cao | Có – Auth + router |
| B07 Mở Đóng TT | mở lại hồ sơ đã chốt | F10 | B13, B10, B08, B09, B20 | `CFG` | click | Rất cao | Có – Unit-of-Work |
| B08 UNC | tạo/tra/xuất UNC | F06, F07, F10 | Drive, Danh Mục NH | `CFG`, `CHITIET_UNC_*` | click | Cao | Có – ExportService |
| B09 MISA | xuất MISA | B15, F07, F10 | Update_NganHang_DN | `CFG`, region | click/auto | Cao | Có |
| B10 ChiTietDNTT | bảng chi tiết N/Y | B15, B25, F10 | File Chính | `CHITIET_DNTT_*` | click | Cao | Có |
| B11 Format/Region | khóa TEXT, parse ngày | B13, B17, F11 | Sheet format | `REGION_PRESETS` | click | Cao | Có – FormatService |
| B13 Draft infra | tạo/đảm bảo sheet nháp | hầu hết | Sheet | `CFG` | – | Cao | Có – Repository + migration |
| B14 Báo cáo gỗ keo | xem/xuất | F07 | Sheet, Drive | – | click | Trung bình | Có |
| B15 Nghiệp vụ lõi | chốt/tách/112 | B25, menu, doGet | B08-B11, B17-B20 | `CFG`, `utils` | click/GET | **Rất cao** | **Có – ưu tiên 1** |
| B17 Cache | mirror + chunk cache | hầu hết | CacheService, Sheet | `REF_CACHE_*` | trigger | Cao | Có – CacheService thống nhất |
| B18 Phân tích | NG-ĐL, CTCN, THT | F08, trigger | B17, Sheet | headers | trigger/click | Trung bình | Có |
| B19 Tiến độ HĐ | lũy kế HĐ | F05, trigger | B17 | – | trigger | Trung bình | Có |
| B20 PC cache/Trigger | cache chưa TT, trigger | F11, B15 | ScriptApp | `PC_COL_*` | trigger | Cao | Có – JobScheduler |
| B21 Công nợ | 4 báo cáo nợ | F08, F04 | B17 | `CONGNO_*` | click | Cao | Có – khóa theo ID |
| B22 Tạo Mới | API wizard | F05 | B17, B13 | `HDNCC_*`,`HDSTK_*` | click | Rất cao | Có |
| B23 Nháp/Dashboard | CRUD nháp, dashboard | F04, F06 | B13, B17 | – | click | Cao | Có |
| B24 Đối soát/Bảo trì | kiểm tra & xóa mồ côi | F10 | File Chính, PC | – | click | Cao (xóa dữ liệu chốt) | Có – soft-delete |
| B25 Duyệt 3 bước | xác nhận/hủy/duyệt/in | F06 | B15, B10 | `COL_TRANG_THAI_DNTT` | click | Rất cao | Có – state machine |
| B26 Menu Sheet | menu + dialog | Sheet | B15, B20… | – | onOpen | Trung bình | Có – gộp/giảm |
| B27 Chatbot | trợ lý AI | F12 | UrlFetchApp | model consts | click | Thấp | Có – AI plugin |
| F03 Core client | call/toast/modal/state | tất cả F | google.script.run | `state` | – | Rất cao | Có – store + services |
| F05 Wizard | tạo ĐNTT | nav | B22 | `state.create*` | input/click | Rất cao | Có – component |
| F06 Danh sách | vòng đời ĐNTT | nav | B23, B25, B08 | `state.draft*` | click | Rất cao | Có |
| F07/F08 Báo cáo | bảng + xuất | nav | B14, B18, B21 | `state.*` | click | Cao | Có – DataTable chung |
| F10/F11 Hệ thống/Cài đặt | quản trị | nav | B01, B06, B24 | – | click | Cao | Có – kèm phân quyền |

---

# PHỤ LỤC B — Đánh giá theo hạng mục

Ký hiệu: ✅ có/đạt · ⚠️ một phần · ❌ không có

### B.1 Kiến trúc

| Tiêu chí | Đánh giá | Ghi chú |
|---|---|---|
| MVC | ❌ | View (template string) + Controller + Model trộn trong 1 hàm |
| Tách business logic | ❌ | Nghiệp vụ nằm chung với I/O sheet |
| Service layer | ❌ | – |
| Repository layer | ❌ | Truy cập sheet trực tiếp, chỉ số cột cứng |
| Config layer | ⚠️ | `LINKS`/`CFG` + Script Properties; còn giá trị cứng (TK công ty, ID file) |
| Constants | ⚠️ | Có một số (`HDNCC_COL`, `PC_COL`, headers) nhưng phần lớn chỉ số vẫn là số trần |
| Helpers / Utils | ⚠️ | `utils` 6 hàm; nhiều helper `_xxx_` rải rác |
| Data layer | ❌ | Không model/schema |
| Cache layer | ⚠️ | Tốt nhưng phân tán (3 cơ chế: CacheService, mirror sheet, localStorage) |
| API layer | ⚠️ | `web*`/`get*` đóng vai trò API nhưng không hợp đồng, không auth |
| Storage layer | ❌ | Không trừu tượng hóa Google Sheet |

### B.2 UI

| Tiêu chí | Đánh giá | Ghi chú |
|---|---|---|
| Responsive | ⚠️ | 2 `@media`; bảng rộng dùng `overflow-x:auto` |
| Dark/Light mode | ❌ | Có biến CSS `:root` nhưng không có theme tối |
| Table | ⚠️ | Phân trang 20 dòng, không sort cột, không sticky header chung |
| Loading | ✅ | Overlay toàn màn hình (chặn thao tác) |
| Toast | ✅ | `toast(msg,type)` |
| Dialog | ⚠️ | Dùng `confirm()`/`prompt()` gốc của trình duyệt (16 + 1) |
| Modal | ✅ | `openModal/closeModal` (không bẫy focus, không đóng bằng Esc) |
| Notification center | ❌ | – |
| Animation | ⚠️ | Spinner, chuyển trạng thái CSS cơ bản |
| Sidebar / Menu | ✅ | Sidebar cố định + huy hiệu số nháp |
| Accessibility | ❌ | Nav là `<div>` (không focus bàn phím), 0 ARIA, emoji làm icon không nhãn |

### B.3 Google Sheets

| Tiêu chí | Đánh giá | Ghi chú |
|---|---|---|
| Đọc toàn sheet | ⚠️ | Có `_docSheetToiUuTheoNgay_` & cache, nhưng nhiều hàm vẫn đọc toàn bộ CT thật |
| Batch read | ✅ | Chủ yếu `getRange().getValues()` 1 lần |
| Batch write | ⚠️ | Có, nhưng dạng ghi đè toàn sheet; `_renderPhanTichSheet_` ghi từng dòng |
| Cache | ✅ | Chunked cache + mirror |
| LockService | ⚠️ | 17 hàm; **thiếu** ở đồng bộ tên, xóa mồ côi ChiTiet*, tạo UNC, in báo cáo, tạo lại MISA/UNC, mọi `refresh*Cache_` |
| Queue | ❌ | – |
| Retry | ❌ | (chỉ fallback model Gemini) |
| Chống ghi đè | ❌ | Không kiểm tra phiên bản/hash trước khi ghi |
| Transaction | ❌ | – |
| Incremental update | ⚠️ | Phân tích NG-ĐL theo ngày ✅; phần còn lại ghi lại toàn bộ |

### B.4 Apps Script

| Tiêu chí | Đánh giá | Ghi chú |
|---|---|---|
| Quota | ⚠️ | Trigger 10’ × 11,5 giờ/ngày đọc file ngoài; `appendRow` log mỗi thao tác |
| Trigger | ✅ | 3 loại, có trạng thái trên UI |
| Execution time | ⚠️ | Batch offset/`conLai` cho việc dài ✅; `runConfirmPayment` chưa có |
| Logger | ⚠️ | Chỉ `logAction` nghiệp vụ; 1 `console.log`; lỗi kỹ thuật không log stack |
| Exception | ⚠️ | 158 `try` nhưng nhiều `catch(e){}` im lặng |
| Retry | ❌ | – |
| Performance | ⚠️ | Xem B.7 |
| Concurrency | ⚠️ | Script lock toàn cục (1 người chốt thì mọi người chờ); nhiều ghi không lock |

### B.5 JavaScript

| Tiêu chí | Đánh giá | Ghi chú |
|---|---|---|
| Global variable | ❌ | `state`, 210 hàm global, `chatbotLichSu_` |
| Memory leak | ⚠️ | Listener gắn lại mỗi lần render, `state._*Debounce` |
| DOM query | ⚠️ | 231 `getElementById` lặp lại, không cache |
| Duplicate code | ❌ | Xem §10 |
| Hard-code | ❌ | Chuỗi, màu inline (`#b00`), kích thước |
| Magic number | ❌ | `20`, `10`, `200ms`, `150ms`, `1000`, `999999` |
| Nested if/loop | ⚠️ | Nặng ở server (`runConfirmPayment`, bảo trì) |
| Async/Promise | ✅ | `call()` bọc Promise; nhiều `.then` không `.catch` |
| Error handling | ⚠️ | `handleResult` thống nhất; lỗi mạng hiển thị toast |
| Naming | ⚠️ | Trộn Việt/Anh, tiền tố không nhất quán |

### B.6 Security — xem §12

| Tiêu chí | Đánh giá |
|---|---|
| XSS | ⚠️ `esc()` dùng rộng (168) nhưng inline handler vẫn rủi ro |
| Injection | ⚠️ Không có SQL; có nguy cơ công thức Sheet (`=...`) khi ghi chuỗi người dùng nhập không tiền tố `'` |
| eval / Function | ✅ không dùng |
| innerHTML | ⚠️ 132 lần |
| Token | ⚠️ API key trong Script Properties ✅; secret webhook qua query ⚠️ |
| Permission / AuthN / AuthZ | ❌ |

### B.7 Performance

| Tiêu chí | Đánh giá | Ghi chú |
|---|---|---|
| Render | ⚠️ | Render lại toàn trang bằng `innerHTML` |
| Repaint / Reflow | ⚠️ | Chèn bảng lớn 1 lần (tốt); đổi trang/lọc thì render lại toàn bộ `#content` |
| Loop lớn | ⚠️ | O(n·m) `find` trong vòng lặp; đọc CT thật nhiều lần |
| Lazy loading | ⚠️ | Tab tải khi mở ✅; bulk ref tải trước toàn bộ |
| Debounce | ✅ | Gợi ý tên (200 ms) |
| Throttle | ❌ | – |
| Memoization | ⚠️ | Cache server; client không |
| Web worker | ❌ | (không bắt buộc) |
| Virtual scroll | ❌ | Bảng tới 1 000–2 000 dòng |

### B.8 Dữ liệu

| Tiêu chí | Đánh giá | Ghi chú |
|---|---|---|
| Validation | ⚠️ | Có ở wizard & server rải rác; không có schema |
| Duplicate | ⚠️ | Chặn trùng phiếu cân trong nháp, trùng UNC, trùng MISA; **không** chặn chốt trùng |
| Rollback | ❌ | – |
| Undo / Redo | ❌ | “Mở Đóng TT” là cách undo thủ công duy nhất |
| History | ⚠️ | `NhatKyThaoTac` + `ChiTietUNC` |
| Audit | ⚠️ | Không lưu trước/sau, user có thể `N/A` |

### B.9 Log

| Tiêu chí | Đánh giá |
|---|---|
| Error log | ⚠️ Chỉ một số lỗi được `logAction` (vd `LOI_CHITIET_DNTT_LUC_CHOT`) |
| User log | ⚠️ Email người dùng thường rỗng |
| Activity log | ✅ 51 điểm ghi |
| Sync log | ⚠️ Refresh cache có log số dòng; không log thời lượng/lỗi trigger |

### B.10 Backup

| Tiêu chí | Đánh giá |
|---|---|
| Auto backup | ❌ |
| Restore | ❌ |
| Version | ❌ (chỉ Version History mặc định của Google) |
| Rollback | ❌ |

---

# PHỤ LỤC C — Danh mục chức năng nghiệp vụ hiện có (phải giữ nguyên)

> Mọi refactor phải giữ 100% các chức năng dưới đây trừ khi người dùng đồng ý bỏ.

**Web App**
1. Trang chủ: thống kê mua/thanh toán tháng, nguồn gốc/đại lý, top 5 công nợ, số nháp.
2. Tạo Mới ĐNTT (wizard 3 bước): gợi ý chủ rừng, CCCD, HĐ, người nhận tiền, STK, chọn phiếu cân (phân trang), sửa tên KH phiếu cân, tóm tắt HĐ/tiến độ, làm mới dữ liệu tạo.
3. Danh sách ĐNTT: 3 trạng thái, chọn nhiều, Tổng Hợp 112, Xác Nhận, Về Chờ ĐNTT, In Báo Cáo ĐNTT, Tạo UNC, Duyệt (Đóng TT), xem chi tiết, thêm/bớt phiếu cân, sửa thông tin 112, xóa hồ sơ, làm mới toàn bộ.
4. Báo cáo thanh toán: Gỗ Keo, Chi Tiết (ChiTietDNTT), MISA theo ngày, UNC — lọc + xuất Excel.
5. Công nợ: theo KH, theo HĐ, sổ chi tiết, phân tích thanh toán, Phân tích Nhập/TT NG-ĐL (pivot + xuất), Chi tiết công nợ theo phiếu cân, Tình hình thanh toán hằng ngày; đồng bộ ngay; làm mới công nợ.
6. Hướng dẫn sử dụng.
7. Hệ thống: đối soát tên KH (+ đồng bộ, xuất Excel), bảo trì đối chiếu 4 sheet (+ xóa mồ côi), cập nhật ngân hàng, Mở Đóng TT, Lịch sử sửa đổi, đồng bộ lịch sử ChiTietDNTT, tạo lại MISA, tạo lại UNC.
8. Cài đặt: kết nối File Chính, link file (đổi/chia sẻ/thu hồi), trigger 10’/7:30-13:00/15h (+ chạy ngay), reset phân tích/CTCN, webhook, khóa định dạng TEXT, locale thật, vùng lãnh thổ, vùng định dạng xuất, mặc định MISA, cấu hình UNC, API key chatbot, sheet Thông Số.
9. Chatbot AI (Gemini + chế độ dự phòng).

**Menu trong Google Sheet** (`onOpen`): Tách Phiếu, Tổng Hợp 112, Chốt Thanh Toán, Thêm Mới ĐNTT, Mở File Nháp, Xóa 1 hồ sơ nháp, Vá ngân hàng, làm mới cache, 3 trigger, 2 reset, webhook, khóa định dạng, vùng lãnh thổ, sheet Thông Số, kết nối File Chính.

**HTTP**: `?action=tach_phieu | lap_de_nghi | tim_phieu_can | tra_cuu_hop_dong | lam_moi_cache`.

**Chạy nền**: 7:30 & 13:00, 10 phút (7:30–19:00), 15h cấu hình được, webhook onChange.

**Ràng buộc đã thống nhất với người dùng**
- File UNC ghi dữ liệu từ **dòng 4** theo mẫu ngân hàng — **không đổi**.
- `webShareConfigLink` — **giữ nguyên hành vi** (người dùng đã chọn).
