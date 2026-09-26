# REFACTOR_PLAN — Nâng cấp HAK lên Commercial Edition

> Dựa trên `docs/PROJECT_ANALYSIS.md` (commit `1ece58f`).
> **Trạng thái:** P0 + P1 xong ở v2026.6.0; P2a (đăng nhập Gmail + phân quyền) xong ở v2026.7.0. Quyết định đã có: giữ gas-tools (§9.1 → cấu trúc đích §3 sẽ dùng tên file phẳng, vd `Service_Payment.gs`, thay cho thư mục), Cổng đăng nhập Gmail với Admin saoluucvhak@gmail.com (§9.3), bỏ `?action=` (§9.4). Tiến độ từng mục: `docs/TODO.md`.
> Hạng mục có ký hiệu **⚖️** làm **thay đổi hành vi nghiệp vụ** → cần người dùng đồng ý riêng.

---

## 1. Nguyên tắc bắt buộc (theo yêu cầu)

1. Không sửa nhanh; mỗi thay đổi có mục tiêu, phạm vi, tiêu chí nghiệm thu, cách rollback.
2. Không hard-code: ID file, tài khoản ngân hàng, giờ trigger, tên model AI, chỉ số cột, giới hạn… đều nằm trong `config/` hoặc lưu cấu hình.
3. Không copy code, không duplicate: dùng chung service/component.
4. Không thêm thư viện nếu JS thuần làm được. Kế hoạch này dùng **0 thư viện runtime**; test dùng `node:test` có sẵn trong Node.
5. Không làm mất chức năng nghiệp vụ (Phụ lục C của PROJECT_ANALYSIS là checklist nghiệm thu).
6. Mỗi thay đổi cập nhật: `docs/ARCHITECTURE.md`, `CHANGELOG.md`, `docs/TODO.md`, `VERSION`, `docs/ROADMAP.md`.
7. Giữ nguyên các ràng buộc đã thống nhất: **UNC ghi từ dòng 4 theo mẫu ngân hàng**; **`webShareConfigLink` giữ hành vi hiện tại**.

---

## 2. Ràng buộc nền tảng Apps Script (quyết định kỹ thuật)

| Vấn đề | Thực tế GAS | Giải pháp đề xuất |
|---|---|---|
| Không có thư mục | Editor lưu phẳng, nhưng **tên file được chứa `/`** (vd `services/PaymentService`) | Dùng **clasp** (`rootDir: "src"`), cấu trúc thư mục trong Git được giữ nguyên khi push |
| Không có ES module | Mọi file `.gs` chung 1 phạm vi global, nạp theo thứ tự | Mỗi file = 1 namespace IIFE (`var PaymentService = (function(){ … return {…}; })();`); **không có side-effect ở top-level** (bỏ việc `CFG` đọc Properties khi nạp) |
| Thứ tự nạp | Theo `filePushOrder` của clasp | Khai báo thứ tự: `config → constants → utils → helpers → storage → models → repository → services → controllers → plugins` |
| Frontend nhiều file | `HtmlService` hỗ trợ template | `index.html` dùng `<?!= include('styles/base') ?>`, `<?!= include('components/DataTable') ?>`… — không cần bundler |
| Hàm client gọi được | Mọi hàm global không có `_` cuối | Chỉ expose **1 điểm vào** `api(route, payload)` + các handler bắt buộc (`doGet`, `doPost`, `onOpen`, trigger). Mọi hàm khác kết thúc `_` hoặc nằm trong namespace |
| Đồng bộ repo hiện tại | README ghi “gas-tools extension” | **Cần người dùng xác nhận** chuyển sang clasp (hoặc kiểm tra gas-tools có hỗ trợ thư mục) |

---

## 3. Cấu trúc đích

```
/
├─ appsscript.json
├─ .clasp.json                 (rootDir: src, filePushOrder)
├─ VERSION
├─ CHANGELOG.md
├─ README.md
├─ docs/
│   ├─ ARCHITECTURE.md  ROADMAP.md  TODO.md
│   ├─ PROJECT_ANALYSIS.md  REFACTOR_PLAN.md
│   ├─ DATA_SCHEMA.md          (mọi sheet, cột, kiểu, khóa)
│   ├─ API.md                  (route ↔ quyền ↔ payload)
│   └─ adr/                    (Architecture Decision Records)
├─ tests/                      (node:test + mock GAS, chạy ngoài GAS)
│   ├─ mocks/  unit/  integration/
└─ src/
    ├─ config/        AppConfig.gs, TenantConfig.gs, FeatureRegistry.gs
    ├─ constants/     SheetSchemas.gs, Status.gs, Actions.gs, Permissions.gs, Limits.gs
    ├─ utils/         Str.gs, Num.gs, DateVN.gs, Id.gs, Hash.gs, Result.gs
    ├─ helpers/       SheetFormat.gs, Region.gs, Html.gs
    ├─ storage/       SheetStore.gs, PropertyStore.gs, CacheStore.gs, DriveStore.gs, LockManager.gs
    ├─ models/        PaymentRequest.gs, PaymentLine.gs, Summary112.gs, WeighTicket.gs, Contract.gs, BankAccount.gs, User.gs, Tenant.gs
    ├─ repository/    DraftRepository.gs, LedgerRepository.gs, WeighTicketRepository.gs, ContractRepository.gs,
    │                 ChiTietDnttRepository.gs, UncRepository.gs, MisaRepository.gs, AuditRepository.gs, UserRepository.gs
    ├─ services/      PaymentWorkflowService.gs, CalculationService.gs, ReopenService.gs, UncService.gs, MisaService.gs,
    │                 ReportService.gs, DebtService.gs, AnalyticsService.gs, ReconcileService.gs, MaintenanceService.gs,
    │                 ExportService.gs, CacheService.gs, JobService.gs, AuditService.gs, AuthService.gs,
    │                 NotificationService.gs, BackupService.gs, LicenseService.gs, UpdateService.gs, AiService.gs
    ├─ controllers/   Router.gs (doGet/doPost/api), *Controller.gs (Draft, Create, Report, Debt, System, Settings, Chat)
    ├─ plugins/       PluginRegistry.gs, core/…
    ├─ workers/       Triggers.gs (7:30/13:00, 10’, 15h, webhook), JobQueue.gs
    ├─ pages/         index.html, dashboard.html, draft.html, create.html, report.html, debt.html, system.html, settings.html, guide.html
    ├─ components/    ApiClient.html, Store.html, DataTable.html, Modal.html, Toast.html, ConfirmDialog.html,
    │                 Autocomplete.html, DateRange.html, Pager.html, Stepper.html, Chatbot.html, NotificationCenter.html
    ├─ styles/        tokens.html, base.html, layout.html, components.html, themes.html
    └─ assets/        icons.html (SVG sprite)
```

### 3.1 Ánh xạ module hiện tại → đích

| Hiện tại | Đích |
|---|---|
| B01, B03, B06 (`LINKS`, `CFG`, getter/setter Properties) | `config/AppConfig`, `storage/PropertyStore` |
| B04 `utils`, `sysLock`, `logAction` | `utils/*`, `storage/LockManager`, `services/AuditService` |
| B05 `doGet` | `controllers/Router` |
| B13 Draft infra, chỉ số cột | `constants/SheetSchemas` + `repository/DraftRepository` + migration |
| B15 Chốt/Tách/112, B25 Duyệt | `services/PaymentWorkflowService`, `services/CalculationService` |
| B07 Mở Đóng TT | `services/ReopenService` |
| B08 UNC, B09 MISA, B10 ChiTietDNTT | `services/UncService`, `MisaService`, `repository/ChiTietDnttRepository` |
| 10 hàm xuất Excel | `services/ExportService` + định nghĩa cột khai báo |
| B17, B19, B20, snapshot công nợ | `services/CacheService` + `workers/Triggers` |
| B14, B18, B21 | `services/ReportService`, `AnalyticsService`, `DebtService` |
| B22, B23 | `controllers/CreateController`, `DraftController` |
| B24 | `services/ReconcileService`, `MaintenanceService` |
| B26 menu | `controllers/SheetMenuController` (giữ menu, gọi cùng service) |
| B27 chatbot | `services/AiService` + `plugins/core/ai-gemini` |
| F01 CSS | `styles/*` |
| F03 core client | `components/ApiClient`, `Store`, `Toast`, `Modal` |
| F04–F11 | `pages/*` |
| F12 | `components/Chatbot` |

---

## 4. Thiết kế nền để mở rộng tính năng thương mại (không đổi kiến trúc về sau)

### 4.1 Lõi xuyên suốt

| Thành phần | Thiết kế |
|---|---|
| **Request Context** | Mọi request đi qua `Router.api(route, payload)` → dựng `ctx = { user, roles, tenantId, companyId, branchId, warehouseId, locale, requestId, idempotencyKey }` → truyền xuống service. Service **không** tự đọc Session/Properties |
| **Schema-driven Repository** | `SheetSchemas.PAYMENT_LINE = { sheet:'DNTT_GK_DN_CT', version:3, columns:[{key:'idCt',header:'ID_CT',type:'text'}, …] }`. Repository map header→index lúc đọc, **kiểm tra header** (chặn khi lệch thay vì chỉ cảnh báo), trả **model object** thay vì mảng |
| **Ghi theo dòng/ô** | `SheetStore.updateRows(schema, [{rowNumber, patch}])` gom theo dải liên tiếp; **không bao giờ ghi đè cả sheet** |
| **Unit of Work + Journal** | `Tx.begin(ctx,'CONFIRM_PAYMENT',ids)` ghi `SYS_TxJournal` (trạng thái từng bước, dữ liệu trước) → các bước idempotent → `Tx.commit()`. Lỗi giữa chừng: `Tx.resume()` chạy tiếp hoặc `Tx.rollback()` từ dữ liệu trước |
| **Idempotency** | Khóa `ID_KEY` + `idempotencyKey` của request; repository từ chối append trùng |
| **Row version** | Cột ẩn `_ver`/`_updatedAt`/`_updatedBy` → chống ghi đè (optimistic concurrency) & phục vụ Conflict Resolution |
| **Lock chi tiết** | `LockManager.withLock(scope, fn)` — script lock ngắn + khóa logic theo `tenant:resource:id` (Properties/Cache) để 2 người chốt 2 hồ sơ khác nhau không chặn nhau |
| **Event bus** | `Events.emit('payment.confirmed', payload)` → Cache invalidation, Audit, Notification, Plugin hook đăng ký lắng nghe — nghiệp vụ không còn gọi `_invalidate*` trực tiếp |
| **Result chuẩn** | `{ ok, data, error:{code, message, details}, meta:{requestId} }`; mã lỗi trong `constants/` |
| **Tenant** | Cấu hình theo tenant (`TenantConfig`): ID file, tài khoản công ty, mẫu UNC/MISA, trigger giờ… Một tenant = bộ file của 1 công ty/chi nhánh |

### 4.2 Bản đồ tính năng thương mại → điểm mở rộng

| Tính năng | Điểm mở rộng đã chuẩn bị | Ghi chú |
|---|---|---|
| Multi Company / Branch / Warehouse | `ctx.tenantId/companyId/branchId/warehouseId`, `TenantConfig`, cột `companyId` trong schema mới | Dữ liệu cũ gán tenant mặc định |
| Multi User | `SYS_Users` (email, tên, trạng thái, tenant) | Cần `executeAs: USER_ACCESSING` **hoặc** đăng nhập riêng ⚖️ |
| Role Permission | `constants/Permissions` + `SYS_Roles` + `AuthService.require(ctx,'payment.confirm')` tại Router | Route không khai báo quyền = bị chặn |
| License Activation | `LicenseService.verify()` (token ký HMAC, hạn dùng, số user, tính năng) chạy ở Router | Không chặn đọc dữ liệu khi hết hạn (chỉ chặn ghi) — cần thống nhất ⚖️ |
| Online Update | `VERSION` + `UpdateService.checkLatest()` + **Migration runner** (`migrations/NNN_*.gs`, lưu `SCHEMA_VERSION`) | Nâng cấp schema tự động, có backup trước |
| Plugin System | `PluginRegistry.register({id, version, permissions, hooks, routes, pages, menus, settings})`; hook: `before/after` cho mọi sự kiện Event bus | Gemini/OCR/e-sign là plugin |
| Theme System | `styles/tokens` (CSS custom properties) + `data-theme="light|dark|<brand>"` + theme lưu theo user | Dark/Light có sẵn |
| Dashboard Builder | Widget registry client + định nghĩa JSON (`SYS_Dashboards`) → `ReportService.query(def)` | Tái dùng DataTable/Chart thuần SVG |
| Report Builder | Định nghĩa báo cáo khai báo (nguồn, cột, lọc, nhóm, pivot) + `ExportService` | `buildPivot` hiện tại thành engine chung |
| Audit Trail | `AuditService.record(ctx, action, entity, before, after)` ghi batch vào `SYS_Audit` | Thay `logAction` (giữ sheet `NhatKyThaoTac` để tương thích) |
| Notification Center | `NotificationService` (`SYS_Notifications`) + component chuông; nguồn: Event bus | Email tùy chọn |
| Offline Mode | Client `Store` + IndexedDB (thuần) cho dữ liệu tham chiếu (**đã lọc PII**) | – |
| Sync Queue | Hàng đợi thao tác client có `idempotencyKey`, gửi lại khi online | Phụ thuộc Idempotency |
| Conflict Resolution | So `_ver` khi ghi; xung đột → trả `CONFLICT` kèm bản hiện tại → UI cho chọn | Phụ thuộc Row version |
| Backup / Restore | `BackupService`: snapshot (`makeCopy`) theo lịch vào folder backup, giữ N bản; restore có xác nhận | Chạy trước mỗi migration & thao tác nguy hiểm |
| Import / Export Wizard | `ExportService` + `ImportService` (map cột, validate theo schema, xem trước, dry-run) | – |
| Template Manager | Mẫu (UNC, MISA, báo cáo ĐNTT) lưu Drive + metadata `SYS_Templates` (vị trí bắt đầu ghi — **UNC dòng 4 là giá trị mẫu mặc định**) | Không đổi đầu ra hiện tại |
| Print Designer | Mẫu in HTML có placeholder, render → PDF (`_exportSheetAsPdf_` tổng quát hóa) | – |
| Electronic Signature | Plugin: hash nội dung + người ký + thời điểm + trạng thái vào `SYS_Signatures`; tích hợp nhà cung cấp qua API | – |
| API Integration | `doPost` + `Router` + token API theo tenant (header/secret trong body, không trong URL) + rate-limit | – |
| OCR Integration | Plugin dùng Drive OCR / dịch vụ ngoài → ImportService | – |
| AI Assistant | `AiService` với provider interface; model trong cấu hình; **lọc/mask PII** trước khi gửi ⚖️ | Gemini hiện tại thành provider mặc định |

---

## 5. Backlog theo mức ưu tiên

Cột “⚖️” = cần người dùng đồng ý vì thay đổi hành vi.

### 🔴 CRITICAL

| ID | Hạng mục | Vị trí hiện tại | Hướng xử lý | ⚖️ | Nghiệm thu |
|---|---|---|---|---|---|
| C-01 | Chốt thanh toán không nguyên tử / không idempotent | `runConfirmPayment` | Unit-of-Work + Journal + idempotency theo `ID_KEY`; tách bước; có `resume` | – | Mô phỏng lỗi ở mỗi bước → chạy lại không trùng, không mất |
| C-02 | Ghi đè toàn bộ `PhieuCan_DN` (file ngoài) | `runConfirmPayment` (+204) | Chỉ ghi các ô cột khóa của đúng dòng phiếu cân (gom dải) | – | Người khác sửa PC cùng lúc → không mất dữ liệu |
| C-03 | Ghi đè toàn bộ DNTT_GK_DN / 112 | `runConfirmPayment` (+191), `runProcessDetail`, `runFillMissingBankOnly` | Ghi theo dòng/ô | – | Công thức & dòng mới không bị ảnh hưởng |
| C-04 | Mở Đóng TT xóa theo vị trí dòng cũ, từng dòng, không sao lưu | `webMoDongThanhToanTheoHoSo` | Ghi Nháp 1 lệnh; xóa theo ID đọc lại mới nhất, theo khối; sao lưu nguyên dòng trước khi xóa | – | Không xóa nhầm dòng; khôi phục được |
| C-05 | `doGet?action=` không xác thực | `doGet` | Bỏ hẳn action ghi dữ liệu qua GET (`tach_phieu`, `lap_de_nghi`), action đọc yêu cầu token; webhook giữ secret nhưng chuyển sang `doPost` | ⚖️ | Gọi GET không token → từ chối |
| C-06 | Không có xác thực/phân quyền | toàn bộ `web*` | `AuthService` + RBAC tại Router; vai trò mặc định: Admin, Kế toán, Người xem. `webShareConfigLink` **giữ hành vi**, chỉ đặt sau quyền Admin | ⚖️ | Người xem không gọi được hàm ghi |
| C-07 | Thiếu backup trước thao tác nguy hiểm | Mở Đóng TT, Xóa mồ côi, Đồng bộ tên | `BackupService` snapshot dòng bị ảnh hưởng (sheet `SYS_Backup_Rows`) + restore | – | Khôi phục được 1 thao tác |

### 🟠 HIGH

| ID | Hạng mục | Vị trí | Hướng xử lý | ⚖️ |
|---|---|---|---|---|
| H-01 | Chỉ số cột cứng | toàn bộ | `SheetSchemas` + Repository đọc theo header, chặn khi lệch | – |
| H-02 | clearContent + setValues trên nháp/mirror | runConfirmPayment, `refresh*Cache_` | Ghi vào sheet tạm → hoán đổi, hoặc xóa đúng dòng; lock cho refresh | – |
| H-03 | Thiếu lock ở các hàm ghi | `webDongBoTenKhachHang`, `webXoaMoCoiChiTietDNTT/UNC`, `webCreateUNCFromDraft`, `runCreateUNCOnly`, `exportBaoCaoDNTTFromDraft`, `webTaoLai*`, `refresh*Cache_` | `LockManager.withLock` | – |
| H-04 | `webDongBoTenKhachHang` ghi lại cả cột | `Code.gs:6975` | Chỉ ghi ô thay đổi, kiểm tra giá trị cũ trước khi ghi | – |
| H-05 | Mất số 0 đầu ở cache Phiếu Cân | `refreshPhieuCanUnpaidCache_` | Khóa định dạng TEXT theo schema (dùng chung cơ chế đã làm cho HD_NCC/HD_STK) | – |
| H-06 | STK chưa bỏ dấu `'` | `get112ViewData` | Chuẩn hóa ở Repository (mọi trường type `text`) | – |
| H-07 | Stored XSS qua `onclick` inline | `Index.html` (125 chỗ) | Event delegation `data-action` + `data-id`; dữ liệu tra từ `Store`, không nhúng JSON vào thuộc tính | – |
| H-08 | `ALLOWALL` iframe | `doGet` | `DEFAULT` (chặn nhúng) — trừ khi đang nhúng vào Google Sites | ⚖️ |
| H-09 | PII trong localStorage | `hak_bulk_ref_v1` | Lưu tối thiểu (tên/HĐ), CCCD/STK tải theo yêu cầu; hoặc `sessionStorage` + mã hóa | ⚖️ (ảnh hưởng tốc độ gợi ý) |
| H-10 | PII gửi Gemini | `_layNgayVaSoLieuThatChoChatbot_` | Chỉ gửi số liệu tổng hợp, mask CCCD/STK | ⚖️ |
| H-11 | Audit thiếu user thật & before/after | `logAction` | `AuditService` (batch, before/after, requestId). Người dùng thật phụ thuộc C-06 | – |
| H-12 | Nhập chuỗi bắt đầu `=`/`+`/`-`/`@` ghi vào Sheet | các hàm ghi từ input | Tiền tố `'` cho trường text theo schema (chống formula injection) | – |
| H-13 | `showAddPaymentDialog` trỏ file không tồn tại | `Code.gs:7772` | Trỏ về wizard web app hoặc bỏ mục menu | ⚖️ |
| H-14 | Không có test | – | `tests/` với `node:test` + mock SpreadsheetApp; phủ CalculationService (112, lũy kế, lần TT), parse ngày/số, workflow trạng thái | – |

### 🟡 MEDIUM

| ID | Hạng mục | Hướng xử lý | ⚖️ |
|---|---|---|---|
| M-01 | Ngày UTC ở client (14 chỗ) | Dùng duy nhất `DateVN.today()` | – |
| M-02 | Listener nhân đôi khi render lại | Component có `mount/unmount`, delegation | – |
| M-03 | `draftSelected` tồn tại qua các tab | Xóa chọn khi đổi tab hoặc hiển thị rõ “đang chọn N hồ sơ ở tab khác” | ⚖️ (UX) |
| M-04 | Công nợ gom theo tên | Khóa theo CCCD/mã KH, hiển thị tên | ⚖️ (số liệu nhóm có thể đổi) |
| M-05 | 10 hàm xuất Excel trùng | `ExportService` khai báo cột | – |
| M-06 | `renderSheet2Detail` ↔ `FromDraft` | 1 hàm nhận nguồn dữ liệu | – |
| M-07 | 8 tab báo cáo client trùng khuôn | `DataTable` component (lọc, sort, phân trang, export, virtual scroll) | – |
| M-08 | Cache phân tán 3 cơ chế + invalidate thủ công | `CacheService` thống nhất + Event bus | – |
| M-09 | O(n·m) & đọc CT thật lặp lại | Index Map + đọc qua Repository có memo trong request | – |
| M-10 | Tên model Gemini cứng | Cấu hình + tự dò model khả dụng | – |
| M-11 | ID file / TK công ty / tên công ty cứng | `TenantConfig`; giá trị hiện tại thành mặc định của tenant đầu tiên | – |
| M-12 | `confirm()/prompt()` gốc | `ConfirmDialog` component (gõ lại mã để xác nhận thao tác nguy hiểm) | – |
| M-13 | Lỗi trả `err.toString()` cho client | Mã lỗi + message thân thiện; stack vào log | – |
| M-14 | `parseNum` phụ thuộc định dạng | Parse theo vùng (dùng cấu hình Region sẵn có) | – |
| M-15 | Trigger chồng nhau (10’ & 7:30) | `JobService` có khóa job + ghi nhận lần chạy/thời lượng/lỗi | – |
| M-16 | Menu Sheet trùng Web App | Menu gọi cùng service qua controller (không trùng logic) | – |

### 🟢 LOW

| ID | Hạng mục | Hướng xử lý |
|---|---|---|
| L-01 | Accessibility | Nav bằng `<button>`/`<a>`, ARIA, focus trap modal, Esc để đóng, nhãn cho icon |
| L-02 | Dark/Light mode | `styles/themes` + tokens |
| L-03 | Đặt tên trộn Việt/Anh | Quy ước: code tiếng Anh, nhãn UI tiếng Việt qua `i18n` |
| L-04 | Chú thích lịch sử trong code | Chuyển sang `CHANGELOG.md`/ADR, giữ chú thích “vì sao” |
| L-05 | Header `Code.gs` lỗi thời | Viết lại vào `docs/ARCHITECTURE.md` |
| L-06 | README 2 dòng | Hướng dẫn cài đặt/triển khai/cấu hình |
| L-07 | `oauthScopes` chưa khai báo | Liệt kê scope tối thiểu trong manifest |
| L-08 | Magic number UI | `constants/Limits` |
| L-09 | Hiển thị “Số điện thoại mất số 0” (người dùng báo) | **Chưa xác định vị trí** — code hiện không có trường điện thoại; cần người dùng chỉ file/cột phát sinh |

---

## 6. Lộ trình (Phase)

Mỗi Phase: backup dữ liệu → làm trên **deployment thử nghiệm** (Deployment ID riêng) → nghiệm thu theo Phụ lục C → người dùng duyệt → chuyển deployment chính → cập nhật 5 tài liệu.

| Phase | Nội dung | Hạng mục | Kết quả |
|---|---|---|---|
| **P0 – Nền móng** | clasp + thư mục `src/`, `docs/ARCHITECTURE.md`, `CHANGELOG.md`, `TODO.md`, `VERSION`, `ROADMAP.md`, `DATA_SCHEMA.md`, test harness `node:test`, test “chụp hành vi” (golden) cho tính 112/lần TT/công nợ | H-14, L-04..L-07 | Không đổi hành vi; có lưới an toàn |
| **P1 – An toàn dữ liệu** | Schema + Repository cho các sheet chính, ghi theo dòng, Unit-of-Work, idempotency, lock bổ sung, backup dòng | C-01..C-04, C-07, H-01..H-06, H-12 | Không còn ghi đè toàn sheet; chốt chạy lại an toàn |
| **P2 – Bảo mật** | Router + AuthService + RBAC + License khung; siết `doGet`; XSS; PII | C-05, C-06, H-07..H-11, H-13, M-13 | Có người dùng/vai trò; không còn inline handler |
| **P3 – Phân lớp backend** | Tách services/controllers, ExportService, CacheService + Event bus, JobService | M-05, M-06, M-08, M-09, M-10, M-11, M-14..M-16 | `Code.gs` được thay bằng ~40 file có trách nhiệm rõ |
| **P4 – Frontend** | ApiClient/Store/DataTable/Dialog/Toast; pages; theme; a11y; virtual scroll | M-01..M-03, M-07, M-12, L-01..L-03, L-08 | `Index.html` thành shell + components |
| **P5 – Commercial** | Multi-tenant, Notification, Audit UI, Backup/Restore UI, Import/Export wizard, Template Manager, Plugin System, Online Update/Migration | §4.2 | Nền sẵn sàng thương mại |
| **P6 – Mở rộng** | Dashboard/Report Builder, Print Designer, e-Sign, API, OCR, AI Assistant đa provider, Offline + Sync Queue + Conflict | §4.2 | Tính năng nâng cao dạng plugin |

---

## 7. Chiến lược kiểm thử & phát hành

- **Unit test** (Node `node:test`, không thư viện): utils, DateVN, parse số/ngày theo vùng, CalculationService, trạng thái workflow, schema mapping.
- **Mock GAS**: `tests/mocks/SpreadsheetApp.js` mô phỏng range `getValues/setValues` trên mảng — kiểm tra “không ghi ngoài dòng được phép”.
- **Golden test**: chụp đầu ra hiện tại (112, ChiTietDNTT, MISA 33 cột, UNC từ dòng 4) trên dữ liệu mẫu ẩn danh → bản refactor phải cho **kết quả giống hệt**.
- **Nghiệm thu thủ công**: checklist Phụ lục C (PROJECT_ANALYSIS) cho từng Phase.
- **Rollback**: giữ deployment cũ; backup file trước khi migration; `CHANGELOG` ghi rõ cách quay lại.

---

## 8. Quản trị tài liệu (áp dụng cho MỌI thay đổi)

| File | Cập nhật khi |
|---|---|
| `docs/ARCHITECTURE.md` | Thêm/đổi module, lớp, luồng dữ liệu, schema |
| `CHANGELOG.md` | Mọi commit hợp nhất (theo Keep a Changelog: Added/Changed/Fixed/Security/Removed) |
| `docs/TODO.md` | Mở/đóng hạng mục backlog (ID như §5) |
| `VERSION` | `NĂM.ĐỢT.SỬA` nối tiếp đánh số hiện có (v2026.5 → `2026.6.0`): tăng ĐỢT khi có tính năng/thay đổi hành vi (⚖️ ghi rõ đã được đồng ý), tăng SỬA khi chỉ sửa lỗi |
| `docs/ROADMAP.md` | Tiến độ Phase |

---

## 9. Các quyết định cần người dùng xác nhận trước khi bắt đầu

1. **Công cụ đồng bộ**: chuyển sang **clasp** với thư mục `src/` (khuyến nghị), hay giữ “gas-tools extension”?
2. **Phạm vi bắt đầu**: duyệt **P0 + P1** trước (nền móng + an toàn dữ liệu, không đổi hành vi) — khuyến nghị.
3. **Xác thực (C-05, C-06)**: chọn mô hình — (a) `executeAs: USER_ACCESSING` + whitelist email trong `SYS_Users`, hay (b) giữ `USER_DEPLOYING` + đăng nhập nội bộ bằng email Google + whitelist. Ai là Admin đầu tiên?
4. **`doGet?action=tach_phieu|lap_de_nghi`** có hệ thống nào bên ngoài đang gọi không? (nếu không → bỏ).
5. **Các mục ⚖️**: H-08, H-09, H-10, H-13, M-03, M-04 — đồng ý từng mục.
6. **Lỗi số điện thoại mất số 0 (L-09)**: xảy ra ở file/cột nào?

> Sau khi có xác nhận, tôi sẽ bắt đầu từ Phase được duyệt, mỗi bước kèm cập nhật ARCHITECTURE / CHANGELOG / TODO / VERSION / ROADMAP.
