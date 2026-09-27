# SECURITY — Bảo mật (v2026.9.7)

## 1. Mô hình
- Web app chạy **dưới quyền chủ script** (`executeAs: USER_DEPLOYING`, `access: ANYONE`) — người dùng không cần quyền trên các file Sheets.
- Danh tính do **Cổng đăng nhập** (dự án Apps Script riêng, chạy dưới quyền người dùng) xác nhận và ký HMAC-SHA256 bằng `SSO_SECRET`.
- `doGet(?sso=token)`: kiểm tra chữ ký (so sánh thời gian hằng), hạn 5 phút, nonce dùng 1 lần (CacheService 15'), email có trong `SYS_NguoiDung` ở trạng thái Hoạt động → cấp mã phiên 64 hex (CacheService 6h).
- Mọi chức năng đi qua `api()` → `API_ROUTES` (whitelist + quyền). Chủ script và `QUAN_TRI_CO_DINH` luôn là Quản trị.
- Menu trong Google Sheet: mỗi mục gọi `_yeuCauQuyen_()` theo email người bấm.

## 2. Vai trò → quyền
| Vai trò | XEM | NGHIEP_VU | HE_THONG | QUAN_TRI |
|---|---|---|---|---|
| Chỉ xem | ✔ | | | |
| Kế toán | ✔ | ✔ | | |
| Kế toán tổng hợp | ✔ | ✔ | ✔ | |
| Quản trị | ✔ | ✔ | ✔ | ✔ |

Khóa tài khoản: đổi trạng thái “Khóa” — hiệu lực ≤ 60 giây (cache danh sách), phiên đang mở bị từ chối ở lời gọi kế tiếp.

## 3. Kiểm soát theo loại tấn công
| Loại | Biện pháp |
|---|---|
| XSS / HTML injection | Mọi dữ liệu động qua `esc()`; nút mang dữ liệu dùng `data-ts` JSON + bảng `HANH_DONG` (không nhúng dữ liệu vào `onclick`); test trình duyệt kiểm tra chuỗi `<img onerror>` |
| Script injection (server) | Không `eval`; HTML server (`_trangDangNhapNhung_`, hộp thoại menu) thoát ký tự `_escHtml_` |
| Spreadsheet/formula injection | `_oAnToan_`: chuỗi mở đầu `= + - @` được thêm `'` ở mọi lần ghi |
| CSRF | Phiên truyền trong tham số `api()` (không cookie tự gửi) |
| Brute-force phiên | 256 bit ngẫu nhiên; mẫu `^[0-9a-f]{64}$` |
| Replay SSO | Nonce dùng 1 lần + hạn 5 phút |
| Clickjacking | `ALLOWALL` (giữ theo quyết định H-08 — web app nhúng trang chủ) |
| Lộ lỗi nội bộ | `_loiChoNguoiDung_`: lỗi lập trình chỉ trả mã tra cứu, stack ghi nhật ký |
| Mất dữ liệu | Sao lưu mọi dòng bị xóa; chặn trả 2 lần; khóa `sysLock` |

## 4. Bí mật & dữ liệu nhạy cảm
- `SSO_SECRET`, `WEBHOOK_SECRET`, `GEMINI_API_KEY` chỉ nằm trong Script Properties; API key không bao giờ trả về trình duyệt. Mã nguồn Cổng (chứa `SSO_SECRET`) chỉ Quản trị xem — **không gửi cho người khác**; nghi lộ → “Tạo lại mã bí mật”.
- ID các file và 2 email Quản trị cố định nằm trong code (không phải bí mật).
- PII: CCCD/STK lưu `localStorage` để gợi ý nhanh (H-09) và gửi Gemini khi dùng Trợ lý AI (H-10) — giữ theo quyết định người dùng; chỉ dùng máy riêng.

## 5. Điểm còn mở (xem `REVIEW_2026_09.md`)
- R-11/R-12: webhook `lam_moi_cache` — bí mật trong URL, không giới hạn tần suất.
- R-13: nonce SSO kiểm tra-rồi-ghi không nguyên tử (rủi ro rất thấp).
- L-07: chưa khai báo `oauthScopes` tối thiểu trong `appsscript.json`.

## 6. Quy trình khi nghi sự cố
1. Khóa tài khoản liên quan (Cài đặt › Người dùng).
2. Tạo lại mã bí mật SSO, dán lại mã Cổng, Deploy lại Cổng.
3. Xem `NhatKyThaoTac` (lọc theo email) và Hệ Thống › Lịch sử sửa đổi.
4. Khôi phục dữ liệu bị xóa ở Hệ Thống › Khôi phục; sự cố lớn dùng Lịch sử phiên bản Google Sheets.
