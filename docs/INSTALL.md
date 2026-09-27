# INSTALL — Cài đặt lần đầu

## Yêu cầu
- Tài khoản Google (chủ hệ thống) có quyền **chỉnh sửa** 5 file: File Chính, Phiếu Cân, Hợp Đồng, Update Ngân Hàng, Danh Mục Ngân Hàng, và thư mục Báo Cáo trên Drive.
- 1 Google Sheet trống dùng làm **File Nháp** (script sẽ gắn liền với file này).
- (Phát triển) Node ≥ 20 để chạy test; tiện ích **gas-tools** nếu đồng bộ repo ↔ Apps Script.

## Các bước
1. Mở File Nháp → **Extensions › Apps Script**.
2. Tạo/ghi đè 3 file: `Code.gs`, `Index.html` (HTML), `appsscript.json` (bật “Show appsscript.json” trong Project Settings). Lưu.
3. **Project Settings › Time zone** = `(GMT+07:00) Bangkok, Hanoi, Jakarta` (bắt buộc — trigger và “Lần TT” dựa vào múi giờ này).
4. Quay lại File Nháp, tải lại trang → menu **🚀 QUẢN LÝ HAK** xuất hiện → **🔗 Kết Nối / Đổi File Chính** → dán URL File Chính. Cấp quyền khi Google hỏi.
5. **Deploy › New deployment › Web app**: Execute as **Me**, Who has access **Anyone with Google account** → Deploy → sao chép URL web app.
6. Mở URL web app bằng tài khoản chủ → **Cài đặt**:
   - Kiểm tra “Link các file liên quan” (đổi nếu dùng file khác mặc định).
   - **🔒 Khóa Định Dạng TEXT/Ngày** (1 lần).
   - Bật 3 trigger: 10 phút, 7:30 & 13:00, 15h.
   - Nhập Giá trị mặc định MISA, Cấu hình UNC.
7. **Cổng đăng nhập Gmail** (Cài đặt): làm theo 3 bước trên màn hình (script.new → dán mã → Deploy *User accessing the web app* → dán link Cổng).
8. **Người dùng & Phân quyền**: thêm email từng người + vai trò.
9. (Tùy chọn) Webhook làm mới tức thì: Cài đặt › Xem Link Webhook → dán đoạn mã vào file Phiếu Cân và HD_NCC, tạo trigger *On change*.
10. (Tùy chọn) Trợ lý AI: dán API key Gemini ở Cài đặt.

Xong: gửi link web app cho người dùng; họ bấm **Đăng nhập bằng Google**.

## Kiểm tra sau cài đặt
- Cài đặt không có cảnh báo đỏ múi giờ; 3 trigger “✅ Đã bật”; khóa định dạng đủ cột.
- Trang chủ hiện số liệu; Danh Sách ĐNTT mở được; Tạo Mới gợi ý được chủ rừng.
- Chạy test cục bộ: `node --test "tests/**/*.test.mjs"`.
