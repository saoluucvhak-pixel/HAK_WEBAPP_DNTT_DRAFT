# ARCHITECTURE — HAK Quản Lý Thanh Toán (v2026.8.2)

> Tài liệu sống: cập nhật mỗi khi đổi module, lớp, luồng dữ liệu hoặc schema.
> Phân tích chi tiết hiện trạng: `docs/PROJECT_ANALYSIS.md`. Kiến trúc đích: `docs/REFACTOR_PLAN.md` §3–§4.

## 1. Tổng quan triển khai

| Thành phần | Mô tả |
|---|---|
| Runtime | Google Apps Script V8, web app (`executeAs: USER_DEPLOYING`, `access: ANYONE`), múi giờ `Asia/Ho_Chi_Minh` |
| Script gắn với | **File Nháp** (`SpreadsheetApp.getActive()`) |
| File Chính | Script Property `MAIN_SS_ID` — DNTT_GK_DN, DNTT_GK_DN_CT, DNTT_GK_DN_112, NhatKyThaoTac, ChiTietDNTT, ChiTietUNC, **SYS_SaoLuuDongXoa**, **SYS_NguoiDung** |
| Cổng đăng nhập | Dự án Apps Script **riêng** (Execute as: User accessing, Anyone with Google account) — mã nguồn sinh từ `_maNguonCongDangNhap_()`, dán qua Cài đặt |
| File ngoài | PhieuCan_DN, HD_NCC/HD_STK/DM_NG, Update_NganHang_DN, Danh Mục NH (ID trong `LINKS` + Script Properties) |
| Mã nguồn | `Code.gs` (backend), `Index.html` (frontend), `appsscript.json` |
| Kiểm thử | `tests/` — chạy ngoài Apps Script bằng Node (xem §5) |

## 2. Lớp logic trong `Code.gs` (hiện tại, file phẳng)

```
Router (doGet, onOpen, trigger)            → B05, B26, B20
API web (web*/get*/run*)                   → B06..B25
Nghiệp vụ lõi (chốt/tách/112/mở đóng)      → B15, B25, B07
Cache & mirror                             → B17..B21
Hạ tầng dùng chung                         → B04 utils/sysLock/logAction
                                              + LỚP GHI/XÓA AN TOÀN (mới, v2026.6)
Cấu hình                                   → B01/B03 LINKS, CFG, Script Properties
```

Danh mục module B01–B27 / F01–F13: `PROJECT_ANALYSIS.md` §4.

## 3. Lớp ghi/xóa an toàn (v2026.6)

Quy tắc bắt buộc cho mọi code mới: **không đọc cả sheet rồi ghi đè lại cả sheet**; **không `clear()` rồi mới ghi**; **mọi xóa dữ liệu đều sao lưu trước**.

| Hàm | Dùng khi | Số lệnh API |
|---|---|---|
| `_ghiCungGiaTri_(sh, rows, c1, c2, v)` | Cùng 1 giá trị cho nhiều dòng (khóa/mở khóa, trạng thái) | 1 (RangeList) |
| `_ghiTheoDong_(sh, [{row, values}], startCol)` | Giá trị khác nhau theo dòng | 1 / đoạn dòng liền kề |
| `_thayVungDuLieu_(sh, startRow, nCols, oldCount, newRows)` | Thay toàn bộ vùng dữ liệu Nháp | 1–2 (ghi đè, rồi xóa đuôi) |
| `_ghiLaiMirror_(sh, header, rows, cotText)` | Làm mới sheet mirror/snapshot | 2–4, không có lúc sheet trống |
| `_saoLuuVaXoaDong_(sh, predicate, hanhDong)` | Xóa dòng theo điều kiện (đọc lại mới nhất, theo ID) | 1 sao lưu + 1 / đoạn |
| `_tapKhoaTrongCot_(sh, colKey, colCo)` | Kiểm tra “đã tồn tại / đã chốt” (idempotency) | 1–2 đọc |
| `_chayTrongKhoa_(fn)` | Đoạn đọc-rồi-ghi-thêm ngoài luồng đã giữ `sysLock` | – |
| `_giuDangChu_(v)` | Giữ số 0 đầu cho chuỗi số khi ghi | – |
| `_oAnToan_(v)` / `_dongAnToan_(rows, cotChu)` | **Mọi** ô/dòng dữ liệu trước khi ghi: chữ mở đầu `= + - @` thêm `'` (không thành công thức); `cotChu` giữ số 0 đầu. Các hàm trên đã tự gọi | – |

### Sao lưu dòng bị xóa — `SYS_SaoLuuDongXoa` (File Chính)

| Cột | Nội dung |
|---|---|
| Thời gian | thời điểm xóa |
| Người thực hiện | `Session.getActiveUser()` (có thể `N/A` với USER_DEPLOYING) |
| Hành động | `MO_DONG_THANH_TOAN`, `XOA_MO_COI_*` |
| File / Sheet / Dòng gốc | nguồn của dòng |
| Dữ liệu (JSON) | nguyên dòng (ngày dạng ISO) |
| File ID | file chứa sheet gốc (từ 2026.8.2) |
| Mã thao tác | gom mọi dòng của 1 lần xóa (`_maThaoTacMoi_`; Mở Đóng TT dùng 1 mã cho cả 6 sheet). Bản cũ chưa có mã: gom theo hành động + người + phút |
| Đã khôi phục | thời điểm + người khôi phục — mỗi dòng chỉ khôi phục 1 lần |

Khôi phục (`webKhoiPhucSaoLuuXoa_`, Hệ Thống › Khôi Phục Dữ Liệu Đã Xóa): ghi lại cuối sheet gốc (`_giaTriKhoiPhuc_`: ISO → Date, chữ giữ dạng chữ); dòng về `DNTT_GK_DN_CT` phải qua kiểm tra chống trả 2 lần (phiếu không có trong sổ chốt / hồ sơ Nháp) rồi `_khoaPhieuCanDaTra_` (dùng chung với Duyệt).

## 4. Chốt thanh toán — trình tự & tính chạy lại (`runConfirmPayment`)

1. `sysLock` → đọc Nháp → lọc hồ sơ “Đang ĐNTT”, Số tiền > 0.
2. Đọc tập ID **đã chốt** trong CT (cột B + S=“Y”), 112 (cột A + U=“Y”), DNTT_GK_DN (cột A).
3. Append CT/112/Src thật — **bỏ qua ID đã có**.
4. ChiTietDNTT N→Y (chỉ ghi ô), tính bù nếu thiếu — **không bù lại nếu đã có Y**; MISA tự loại trùng theo Số phiếu cân.
5. Cập nhật trạng thái Src tại chỗ (cột O..R) cho dòng chưa “Y”.
6. Khóa phiếu cân: 3 lệnh RangeList trên đúng các dòng.
7. Dọn Nháp: ghi đè trước, xóa đuôi sau.

Chặn trả 2 lần: trước bước 3, đọc thẳng CT thật (`_phieuCanDaTraThat_`); hồ sơ có phiếu cân đã chốt ở hồ sơ khác bị bỏ qua cả hồ sơ (`CHAN_TRA_HAI_LAN`). Tạo mới / Thêm phiếu cũng kiểm tra (`_chanPhieuCanDaTra_`). **Cache “phiếu cân chưa TT” chỉ để gợi ý, không dùng một mình để quyết định phiếu còn trả được.**

Lỗi ở bất kỳ bước nào → log `LOI_CHOT_THANH_TOAN`, người dùng bấm Duyệt lại cùng hồ sơ để hoàn tất (không trùng dữ liệu).

## 4b. Xác thực & phân quyền (v2026.7)

```
Người dùng ──► Cổng đăng nhập (chạy dưới quyền NGƯỜI DÙNG)
                 email + exp(5') + nonce ─HMAC-SHA256(SSO_SECRET)─► ?sso=token
          ──► Web app chính doGet(sso): xác minh chữ ký, hạn, nonce chưa dùng,
                 email có trong SYS_NguoiDung (Hoạt động) → cấp mã phiên 64 hex (CacheService 6h)
Trình duyệt ─ google.script.run.api(phiên, "tenChucNang", [tham số])
          ──► api(): phiên → email → vai trò → API_ROUTES[tenChucNang].quyen → gọi hàm nội bộ
```

| Thành phần | Vị trí |
|---|---|
| Vai trò → quyền | `VAI_TRO`, `QUYEN`, `QUYEN_THEO_VAI_TRO` — ADMIN ⊇ KE_TOAN ⊇ XEM |
| Bảng phân quyền | `API_ROUTES` (tên chức năng → hàm nội bộ + quyền). Không có trong bảng = không gọi được |
| Cửa vào công khai | `doGet`, `onOpen`, `api`, `thongTinDangNhap` (không cần đăng nhập, chỉ trả trạng thái của chính người gọi + link cổng), `dangXuat` |
| Menu Sheet | 18 hàm công khai, dòng đầu `_yeuCauQuyen_(QUYEN.*)` — email lấy từ `Session.getActiveUser()` (người bấm menu) |
| Danh tính | `_xacDinhNguoiDung_()`: người của phiên hiện tại, nếu không có thì `Session.getActiveUser()` (chủ script khi tự mở web app; người bấm menu). Người Gmail khác mở web app “execute as me” → rỗng → bị chặn |
| Chủ script & Quản trị cố định | `Session.getEffectiveUser()` và danh sách `QUAN_TRI_CO_DINH` (trong code) luôn là ADMIN, không đổi/khóa được từ web app |
| Người dùng | `SYS_NguoiDung`: Email · Họ tên · Vai trò · Trạng thái · Cập nhật lúc · Cập nhật bởi (cache 60 giây) |
| Cấu hình | Script Properties `SSO_SECRET`, `SSO_GATEWAY_URL` (Trợ lý AI: `GEMINI_API_KEY`, `GEMINI_MODELS`, `GEMINI_MODEL`) |
| Lỗi | `[AUTH] …` → client hiện màn hình đăng nhập; `[QUYEN] …` → chỉ báo lỗi |
| Mở thẳng 1 màn hình | `?trang=` chỉ nhận giá trị trong `TRANG_MO_THANG` (server) ↔ `MO_THANG` (client, kèm quyền). Link đăng nhập gắn thêm `trang`, Cổng đăng nhập (mã sinh từ 2026.7.5) chuyển tiếp lại. Dùng cho menu Sheet “Thêm Mới” |
| Nhúng iframe | `ALLOWALL` — giữ theo quyết định người dùng (web app nhúng vào trang chủ, H-08) |

Quy tắc: **thêm chức năng mới gọi từ web** = viết hàm nội bộ `ten_` + thêm 1 dòng vào `API_ROUTES` với quyền phù hợp. Test `auth.test.mjs` sẽ báo lỗi nếu có hàm global mới không kết thúc bằng `_`, trình duyệt gọi 1 chức năng chưa có route, hoặc 1 trang (theo `PAGES[].quyen`) gọi chức năng cần quyền **cao hơn** quyền mở trang đó.

Lỗi: `api()` và các hàm trả `{success:false, message}` dùng `_loiChoNguoiDung_(e)` — lỗi nghiệp vụ (`new Error("…")`) hiện nguyên câu; lỗi lập trình (TypeError…) chỉ hiện mã tra cứu, chi tiết + stack ghi `NhatKyThaoTac` (`LOI_HE_THONG`).

## 4c. Công nợ theo khách hàng (v2026.8.0)

Khách hàng = **CCCD + Tên**, khóa `CCCD|TÊN_CHUẨN_HÓA` (`_khoaCongNo_`); trùng tên chưa rõ người: `TRUNG_TEN|TÊN`.

| Phía | Nguồn | Nhận diện (`_nhanDienKhachCongNo_`) |
|---|---|---|
| Nợ | PhieuCan_DN (không có CCCD) | Phiếu có trong CT thật/Nháp → CCCD + tên của hồ sơ; không → tên tra HD_NCC (1 CCCD / trùng tên / trống) |
| Có | DNTT_GK_DN_CT | CCCD + tên của dòng CT |

`_computeDebtByCustomerLive_(f, t, nhanDien)` và Sổ chi tiết dùng CHUNG bộ nhận diện; `_nhanDienKhachTheoTen_()` là cách gom cũ, chỉ dùng cho `getDoiChieuCongNoCccd_` (đối chiếu) và mở Sổ chi tiết bằng khóa cũ (chỉ có tên).

## 5. Kiểm thử

```bash
node --test "tests/**/*.test.mjs"                       # toàn bộ
HAK_CODE_GS=/đường/dẫn/Code.cu.gs node --test "tests/**/*.test.mjs"   # so sánh với bản khác
```

| Thư mục | Nội dung |
|---|---|
| `tests/gas/mock.mjs` | Mock SpreadsheetApp/Properties/Cache/Lock/Utilities/Session… trong bộ nhớ, ghi lại mọi thao tác ghi (`sheet.writes`); như Google Sheets: `"0123"` không có `'` thành số, chữ mở đầu `= + - @` không có `'` bị đánh dấu `FORMULA_MARK` |
| `tests/gas/loadCode.mjs` | Nạp `Code.gs` vào V8 context riêng |
| `tests/gas/fixtures.mjs` | Bộ dữ liệu mẫu File Nháp + File Chính + file ngoài |
| `tests/gas/clientSource.mjs` | Tách 1 hàm của `Index.html` để test không cần trình duyệt |
| `tests/unit/` | Hàm thuần, lớp ghi an toàn, ngày giờ VN & nút mang dữ liệu ở client |
| `tests/integration/` | Chốt TT, chạy lại, Mở Đóng TT, bảo trì, tách phiếu, vá ngân hàng, xác nhận, cache, đăng nhập & phân quyền, số 0 đầu, chống công thức, thông điệp lỗi, model Gemini |

File test dùng đuôi `.mjs` để công cụ đồng bộ Apps Script không coi là mã server.

## 6. Quy ước

- Hàm nội bộ kết thúc bằng `_` (không gọi được từ client). Mọi hàm mới đều phải là hàm nội bộ; trình duyệt gọi qua `API_ROUTES` (xem §4b).
- Email người thao tác: dùng `_emailNguoiThucHien_()`, không gọi `Session.getActiveUser()` trực tiếp.
- **Số 0 đầu** (CCCD, STK, Số HĐ, Số phiếu cân, ID_112): mọi lần GHI giá trị dạng chữ dùng `_chu_(v)`; ghi lại cả dòng thì dùng `_dongAnToan_(rows, COT_CHU.CT|H112|SRC)` hoặc tham số `cotChu` của `_thayVungDuLieu_`. CCCD đọc từ file gốc qua `_chuanHoaCCCD_()`. Không nối `"'" + x` trực tiếp.
- Tên khách hàng chung trên phiếu cân: hằng `TEN_KHACH_CHUNG` (đã chuẩn hóa, gồm cả dạng có dấu).
- **Ghi dữ liệu vào Sheet**: luôn qua `_dongAnToan_(rows, cotChu)` / `_oAnToan_(v)` hoặc các hàm lớp ghi ở §3 (đã tự áp dụng). Header/tiêu đề cố định trong code thì không cần. Công thức cố ý dùng `setFormula`.
- **Client — nút mang dữ liệu**: không nhúng dữ liệu vào `onclick="f('…')"`; dùng `${hanhDong('tenHam', thamSo…)}` (hoặc `hanhDongKhi('mousedown', …)`) và đăng ký hàm trong `HANH_DONG`. Ô chọn dùng `data-id` + `this.dataset.id`.
- **Client — ngày**: ngày mặc định luôn `todayISOVN()` / `isoDaysAgoVN(n)` (giờ Việt Nam), không dùng `new Date().toISOString()`.
- **Model Gemini**: không viết tên model trong code nghiệp vụ; danh sách mặc định `GEMINI_MODELS_MAC_DINH_`, cấu hình `GEMINI_MODELS` (Script Property, sửa ở Cài đặt), model chạy được gần nhất `GEMINI_MODEL`.
- Chỉ số cột: ưu tiên hằng (`PC_COL`, `COL_TRANG_THAI_DNTT`, `HDNCC_COL`…); chỉ số trần là nợ kỹ thuật (TODO H-01).
- Chú thích chỉ giải thích **vì sao**; lịch sử thay đổi ghi ở `CHANGELOG.md`.
