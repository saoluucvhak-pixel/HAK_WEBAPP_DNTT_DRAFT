# DEPLOY — Cập nhật phiên bản mới

## Nguyên tắc
- Mỗi phiên bản: `VERSION` + dòng đầu `Code.gs` + chân thanh bên `Index.html` + mục mới trong `CHANGELOG.md`.
- Không đổi nghiệp vụ thanh toán nếu chưa có người dùng đồng ý (đánh dấu ⚖️ trong CHANGELOG).
- Trước khi cập nhật: tất cả test phải đạt.

## Quy trình
1. **Kiểm thử cục bộ**
   ```bash
   node --test "tests/**/*.test.mjs"                               # 108 test nghiệp vụ (không cần thư viện)
   NODE_PATH=$(npm root -g) node --test tests/ui/giaoDien.ui.mjs     # 5 test giao diện (cần Playwright + Chromium)
   ```
2. **Sao lưu**: File › Tạo bản sao cho File Chính (hoặc ghi lại thời điểm để dùng Lịch sử phiên bản). Trong Apps Script: Deploy › Manage deployments ghi lại số phiên bản đang chạy.
3. **Đưa mã lên**: gas-tools push, hoặc dán tay `Code.gs`, `Index.html`, `appsscript.json`.
4. **Deploy › Manage deployments › (web app đang dùng) › Edit › Version: New version › Deploy.** Giữ nguyên URL — không tạo deployment mới (người dùng giữ link cũ).
5. **Sau khi deploy**: mở web app → Cài đặt: kiểm tra trigger vẫn bật (trigger gắn theo tên hàm, không mất khi cập nhật); với bản có ghi chú “bấm lại Khóa định dạng” thì bấm lại.
6. **Kiểm tra nhanh trên dữ liệu thật** các mục trong phần “Kiểm chứng” của phiên bản ở CHANGELOG.

## Hoàn tác
Deploy › Manage deployments › Edit › chọn **phiên bản cũ** → Deploy. Dữ liệu không bị ảnh hưởng bởi việc lùi mã (mọi thay đổi schema đều tương thích ngược).

## Riêng v2026.9.7
Không đổi schema, không cần thao tác thêm. Kiểm chứng trên Google thật:
- Duyệt 1 lượt có 2 hồ sơ trùng phiếu cân → cả 2 bị giữ lại, có thông báo.
- Mở Đóng TT 1 hồ sơ → mọi phiếu cân của hồ sơ được mở khóa (không còn cảnh báo “không mở khóa được”).
- Xóa 1 hồ sơ Nháp đã In BC ĐNTT/Tạo UNC → Hệ Thống › Khôi phục thấy lần xóa `🗑️ Xóa hồ sơ Nháp`.
- Giao diện: nút “🌓 Giao diện” ở chân thanh bên; Ctrl+P chỉ in nội dung.
