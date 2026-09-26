# ARCHITECTURE — HAK Quản Lý Thanh Toán (v2026.6.0)

> Tài liệu sống: cập nhật mỗi khi đổi module, lớp, luồng dữ liệu hoặc schema.
> Phân tích chi tiết hiện trạng: `docs/PROJECT_ANALYSIS.md`. Kiến trúc đích: `docs/REFACTOR_PLAN.md` §3–§4.

## 1. Tổng quan triển khai

| Thành phần | Mô tả |
|---|---|
| Runtime | Google Apps Script V8, web app (`executeAs: USER_DEPLOYING`, `access: ANYONE`), múi giờ `Asia/Ho_Chi_Minh` |
| Script gắn với | **File Nháp** (`SpreadsheetApp.getActive()`) |
| File Chính | Script Property `MAIN_SS_ID` — DNTT_GK_DN, DNTT_GK_DN_CT, DNTT_GK_DN_112, NhatKyThaoTac, ChiTietDNTT, ChiTietUNC, **SYS_SaoLuuDongXoa** |
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

### Sao lưu dòng bị xóa — `SYS_SaoLuuDongXoa` (File Chính)

| Cột | Nội dung |
|---|---|
| Thời gian | thời điểm xóa |
| Người thực hiện | `Session.getActiveUser()` (có thể `N/A` với USER_DEPLOYING) |
| Hành động | `MO_DONG_THANH_TOAN`, `XOA_MO_COI_*` |
| File / Sheet / Dòng gốc | nguồn của dòng |
| Dữ liệu (JSON) | nguyên dòng (ngày dạng ISO) — dùng để khôi phục thủ công |

## 4. Chốt thanh toán — trình tự & tính chạy lại (`runConfirmPayment`)

1. `sysLock` → đọc Nháp → lọc hồ sơ “Đang ĐNTT”, Số tiền > 0.
2. Đọc tập ID **đã chốt** trong CT (cột B + S=“Y”), 112 (cột A + U=“Y”), DNTT_GK_DN (cột A).
3. Append CT/112/Src thật — **bỏ qua ID đã có**.
4. ChiTietDNTT N→Y (chỉ ghi ô), tính bù nếu thiếu — **không bù lại nếu đã có Y**; MISA tự loại trùng theo Số phiếu cân.
5. Cập nhật trạng thái Src tại chỗ (cột O..R) cho dòng chưa “Y”.
6. Khóa phiếu cân: 3 lệnh RangeList trên đúng các dòng.
7. Dọn Nháp: ghi đè trước, xóa đuôi sau.

Lỗi ở bất kỳ bước nào → log `LOI_CHOT_THANH_TOAN`, người dùng bấm Duyệt lại cùng hồ sơ để hoàn tất (không trùng dữ liệu).

## 5. Kiểm thử

```bash
node --test "tests/**/*.test.mjs"                       # toàn bộ
HAK_CODE_GS=/đường/dẫn/Code.cu.gs node --test "tests/**/*.test.mjs"   # so sánh với bản khác
```

| Thư mục | Nội dung |
|---|---|
| `tests/gas/mock.mjs` | Mock SpreadsheetApp/Properties/Cache/Lock/Utilities/Session… trong bộ nhớ, ghi lại mọi thao tác ghi (`sheet.writes`) |
| `tests/gas/loadCode.mjs` | Nạp `Code.gs` vào V8 context riêng |
| `tests/gas/fixtures.mjs` | Bộ dữ liệu mẫu File Nháp + File Chính + file ngoài |
| `tests/unit/` | Hàm thuần & lớp ghi an toàn |
| `tests/integration/` | Chốt TT, chạy lại, Mở Đóng TT, bảo trì, tách phiếu, vá ngân hàng, xác nhận, cache |

File test dùng đuôi `.mjs` để công cụ đồng bộ Apps Script không coi là mã server.

## 6. Quy ước

- Hàm nội bộ kết thúc bằng `_` (không gọi được từ client).
- Chỉ số cột: ưu tiên hằng (`PC_COL`, `COL_TRANG_THAI_DNTT`, `HDNCC_COL`…); chỉ số trần là nợ kỹ thuật (TODO H-01).
- Chú thích chỉ giải thích **vì sao**; lịch sử thay đổi ghi ở `CHANGELOG.md`.
