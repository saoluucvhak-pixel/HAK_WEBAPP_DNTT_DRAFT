# ADMIN GUIDE — Quản trị & Kế toán tổng hợp

## Quản trị (trang Cài đặt)
| Việc | Nơi | Ghi chú |
|---|---|---|
| Thêm / đổi vai trò / khóa người dùng | Người Dùng & Phân Quyền | Không xóa, chỉ “Khóa”. Hiệu lực ≤ 1 phút |
| Cổng đăng nhập | Cổng Đăng Nhập Gmail | Dán lại mã Cổng khi CHANGELOG yêu cầu; “Tạo lại mã bí mật” khi nghi lộ |
| Đổi file / thư mục dùng | Link các file liên quan | Kiểm tra mở được trước khi lưu |
| Chia sẻ / thu hồi quyền truy cập trực tiếp file | nút 📤 Chia sẻ | Tách biệt với quyền dùng web app |
| Trigger | Tốc độ tải dữ liệu | 10 phút (7:30–19:00), 7:30 & 13:00, 15h (đổi giờ được) |
| Khóa định dạng TEXT/Ngày | Tốc độ tải dữ liệu | Bấm lại sau khi đổi Vùng lãnh thổ |
| Cảnh báo cột Phiếu Cân đổi | Tốc độ tải dữ liệu | Kiểm tra tay, đúng thì bấm “Xác nhận cấu trúc” |
| Vùng lãnh thổ / Vùng xuất Excel | 2 thẻ riêng | Ảnh hưởng cách hiểu “Ngày thanh toán” khi Duyệt |
| MISA, UNC, Trợ lý AI | các thẻ tương ứng | |
| File lưu trữ theo năm | 🗄️ | Chỉ để trỏ lại file DATA bị di chuyển |

## Kế toán tổng hợp + Quản trị (trang Hệ Thống)
| Công cụ | Khi nào | Rủi ro |
|---|---|---|
| Đối soát tên KH | Tên trong phiếu cân khác CT | Ghi vào file Phiếu Cân gốc |
| Bảo trì 4 sheet | Định kỳ hằng tuần | Nút xóa dòng mồ côi CT/Nguồn = dữ liệu đã chốt (có sao lưu) |
| Cập nhật ngân hàng | 112 thiếu tên ngân hàng | Thấp |
| Mở Đóng TT | Chốt sai cần sửa | Cao — xóa sổ + MISA của cả đợt (có sao lưu, khôi phục được) |
| Khóa sổ năm | Đầu năm mới, sau khi Duyệt hết hồ sơ năm cũ | Xem trước trước khi chạy; bị dừng thì bấm lại |
| Khôi phục dữ liệu đã xóa | Xóa nhầm (Mở Đóng TT, mồ côi, **xóa hồ sơ Nháp** từ 2026.9.7) | Từ chối nếu gây trả 2 lần |
| Hiệu năng | Người dùng báo chậm | Xem chức năng chậm / quá 6 phút |
| Lịch sử sửa đổi | Kiểm toán | |
| Đồng bộ ChiTietDNTT, Tạo lại MISA/UNC | Dữ liệu cũ / sự cố | Tự chạy theo lô, không tạo trùng |

## Việc định kỳ
- **Hằng ngày**: không cần (trigger tự chạy). Xem Trang chủ thời điểm tổng hợp.
- **Hằng tuần**: Bảo trì 4 sheet; Hệ Thống › Hiệu năng.
- **Hằng năm**: Khóa sổ năm; kiểm tra danh sách người dùng.
- **Khi cập nhật mã**: làm theo `DEPLOY.md`.

## Xử lý sự cố
| Hiện tượng | Cách xử lý |
|---|---|
| “Hệ thống đang bận…” | Người khác đang chốt/ghi — đợi 1 phút bấm lại |
| Duyệt báo trùng phiếu cân | Mở hồ sơ, bỏ phiếu trùng khỏi 1 hồ sơ, Tổng hợp 112, Xác nhận, Duyệt lại |
| Duyệt lỗi giữa chừng | Bấm Duyệt lại đúng các hồ sơ đó (không tạo trùng) |
| Trigger chạy sai giờ | Kiểm tra múi giờ project (Cài đặt hiện cảnh báo đỏ) |
| Người dùng không đăng nhập được | Kiểm tra email trong danh sách + Hoạt động; link Cổng đã lưu; mã Cổng mới nhất |
| “Lỗi hệ thống (mã XXXX)” | Tìm mã trong `NhatKyThaoTac` (LOI_HE_THONG) |
