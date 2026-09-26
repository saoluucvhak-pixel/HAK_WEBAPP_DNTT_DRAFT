# CHANGELOG

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/). Phiên bản theo `NĂM.ĐỢT.SỬA`; thay đổi làm đổi hành vi nghiệp vụ (⚖️) sẽ tăng số ĐỢT và ghi rõ đã được người dùng đồng ý.

## [2026.7.1] — Hợp nhất bản code người dùng gửi (`Code_SUATENKH.gs`)

So sánh với bản người dùng đang chạy (khác `main` ~330 dòng). Giữ lại mọi thay đổi của bản đó, không làm mất bản sửa nào đã có:

### Added
- **Quản trị cố định** `QUAN_TRI_CO_DINH` = saoluucvhak@gmail.com, phuthuy.apple@gmail.com (bản của người dùng có `ADMIN_EMAILS = ["phuthuy.apple@gmail.com"]` — giữ lại để không mất quyền). Không đổi/khóa được từ web app; thêm/bớt trong code.
- Nhật ký `CANH_BAO_HEADER_PC` khi cột PhieuCan_DN thay đổi (như bản người dùng) nhưng chỉ ghi **1 lần** mỗi thay đổi, không lặp lại mỗi 10 phút; hiện ở Lịch Sử Sửa Đổi.

### Changed (tốc độ, lấy từ bản người dùng)
- Tổng Hợp 112: tra HD_NCC theo Số HĐ bằng bảng tra dựng 1 lần thay vì quét lại cho từng hồ sơ.
- Trang chủ: so ngày với mốc đầu tháng GMT+7 thay vì `Utilities.formatDate` cho từng dòng (test đối chiếu quanh ranh giới tháng/năm).

### Removed (hàm không còn nơi dùng — như bản người dùng)
- `getSwappableLinkInfo`, `setReportFolderId_`, `setDmNhSsId_`, `getMainTableData`, `getCccdListByChuRung`, `getSoTaiKhoanOptions`.

### Không lấy từ bản người dùng (đã có cách làm tốt hơn / tránh lùi lỗi)
- `_requireAdmin_()` rải từng hàm → đã thay bằng bảng phân quyền `API_ROUTES` (16 hàm bản đó giới hạn cho quản trị đều là `QUAN_TRI`).
- `?action=` kèm mã bí mật → đã bỏ hẳn các action này (người dùng xác nhận không có hệ thống ngoài gọi).
- `webSuaTenKhachHangPhieuCan` bản đó: không khóa, không cập nhật mirror (danh sách chọn phiếu cân vẫn hiện tên cũ tới lần làm mới) → giữ bản 2026.7.0.
- Bản đó **thiếu** bản sửa mất số 0 đầu ở mirror HD_NCC/HD_STK (STK, CCCD, Số HĐ) → giữ bản sửa.

## [2026.7.0] — P2: Đăng nhập Gmail & phân quyền ⚖️

⚖️ Thay đổi hành vi, người dùng đã đồng ý: dùng Cổng đăng nhập Gmail; Admin = chủ script (saoluucvhak@gmail.com); 3 vai trò Quản trị / Kế toán / Chỉ xem; bỏ các action `?action=tach_phieu|lap_de_nghi` (và 2 action đọc dữ liệu không cần đăng nhập). Không bỏ chức năng nghiệp vụ nào — chỉ giới hạn ai được dùng.

> **Lưu ý triển khai:** sau khi cập nhật, chỉ chủ script vào được web app cho tới khi Quản trị (1) thêm người dùng ở Cài đặt › Người Dùng & Phân Quyền và (2) thiết lập Cổng đăng nhập (Cài đặt › Cổng Đăng Nhập Gmail). Người được chia sẻ quyền sửa File Nháp cũng phải có trong danh sách người dùng mới dùng được menu “🚀 QUẢN LÝ HAK”.

### Added
- **Cổng đăng nhập Gmail**: dự án Apps Script riêng (chạy dưới quyền người dùng) ký HMAC-SHA256 email + hạn 5 phút + mã dùng 1 lần; web app chính xác minh và cấp phiên 6 giờ (CacheService). Mã nguồn cổng được sinh sẵn trong Cài đặt kèm hướng dẫn 3 bước.
- **Phân quyền** 3 vai trò, bảng `API_ROUTES` (93 chức năng) là nơi duy nhất quy định quyền; sheet `SYS_NguoiDung` (File Chính) quản lý người dùng, trạng thái Hoạt động/Khóa; chủ script luôn là Quản trị.
- Cài đặt: thẻ **Người Dùng & Phân Quyền** và **Cổng Đăng Nhập Gmail** (sao chép mã nguồn, lưu link, tạo lại mã bí mật).
- Giao diện: màn hình đăng nhập, thông tin người dùng + nút Đăng xuất ở thanh bên, ẩn trang theo quyền.
- Nhật ký: `DANG_NHAP`, `DANG_NHAP_BI_TU_CHOI`, `PHAN_QUYEN`, `CAU_HINH_DANG_NHAP`, `SUA_TEN_KH_PHIEU_CAN`, `XAC_NHAN_HEADER_PHIEU_CAN` (3 mục quản trị hiện ở Lịch Sử Sửa Đổi).
- Cảnh báo **cấu trúc cột PhieuCan_DN thay đổi** (giao diện đã có sẵn nhưng server chưa từng phát hiện): so tiêu đề mỗi lần làm mới cache, Quản trị xác nhận chuẩn mới.
- 14 test xác thực (đầu-cuối qua mã nguồn Cổng đăng nhập thật, chống dùng lại/giả mạo/hết hạn, khóa tài khoản, phân quyền, menu Sheet, danh sách hàm công khai).

### Changed
- Mọi lời gọi từ trình duyệt đi qua `api(phiên, chức năng, tham số)`; 114 hàm nghiệp vụ chuyển thành hàm nội bộ (tên kết thúc `_`) nên **không gọi thẳng được** bằng `google.script.run`.
- 18 hàm menu trong Sheet kiểm tra email + vai trò của người bấm menu.
- Nhật ký, sao lưu dòng xóa, lịch sử UNC, “Người tạo” hồ sơ ghi **email thật** của người thao tác (trước đây thường là `N/A`/rỗng).

### Fixed
- Nút **Sửa tên KH** ở bước chọn phiếu cân (Tạo Mới / Sửa hồ sơ) gọi hàm server không tồn tại → đã bổ sung `webSuaTenKhachHangPhieuCan` (ghi đúng 1 ô ở PhieuCan_DN + mirror).
- Nút **Xác nhận cấu trúc cột Phiếu Cân** gọi hàm server không tồn tại → đã bổ sung.

### Removed
- `doGet?action=tach_phieu`, `lap_de_nghi`, `tim_phieu_can`, `tra_cuu_hop_dong` (chạy nghiệp vụ / lộ dữ liệu không cần đăng nhập). Webhook `lam_moi_cache` (có mã bí mật) giữ nguyên.
- Hàm không còn nơi dùng: `findAvailablePhieuCan`, `getContractInfo`, `showSetupDraftDialog`.

### Security
- Đóng các rủi ro Critical C-05, C-06 (PROJECT_ANALYSIS §12). `webShareConfigLink` giữ nguyên hành vi, nay chỉ Quản trị dùng được.

## [2026.6.0] — P0 + P1: nền móng kiểm thử & an toàn dữ liệu

Không thay đổi quy trình nghiệp vụ hay giao diện. Mọi chức năng trong Phụ lục C của `docs/PROJECT_ANALYSIS.md` giữ nguyên.

### Added
- Lớp **ghi/xóa an toàn** dùng chung trong `Code.gs`: `_ghiCungGiaTri_`, `_ghiTheoDong_`, `_thayVungDuLieu_`, `_ghiLaiMirror_`, `_saoLuuVaXoaDong_`, `_tapKhoaTrongCot_`, `_chayTrongKhoa_`, `_giuDangChu_`.
- Sheet **`SYS_SaoLuuDongXoa`** (tự tạo trong File Chính): mọi dòng bị xóa bởi Mở Đóng TT / Xóa mồ côi được sao lưu nguyên dòng (JSON) kèm người thực hiện, thời gian, file, sheet, số dòng gốc. Sao lưu lỗi → không xóa.
- Nhật ký `LOI_CHOT_THANH_TOAN` khi Duyệt bị lỗi; nhật ký Đồng bộ tên KH ghi rõ tên cũ → tên mới.
- Bộ kiểm thử tự động `tests/` (Node `node:test`, 0 thư viện) với mock Apps Script chạy trong bộ nhớ — 28 test.
- Tài liệu: `docs/PROJECT_ANALYSIS.md`, `docs/REFACTOR_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/TODO.md`, `docs/ROADMAP.md`, `VERSION`, `CHANGELOG.md`.

### Changed
- `runConfirmPayment` (Duyệt/Đóng TT):
  - Không còn ghi đè **toàn bộ** `PhieuCan_DN` (file ngoài) và `DNTT_GK_DN`; chỉ ghi đúng 3 ô khóa phiếu cân và 4 ô trạng thái của đúng các dòng liên quan.
  - **Chạy lại an toàn**: hồ sơ đã có sẵn trong CT/112/DNTT_GK_DN thật (lần trước bị ngắt giữa chừng) không bị ghi trùng; hệ thống chỉ hoàn tất phần còn thiếu và báo rõ.
  - Dọn File Nháp theo kiểu “ghi đè trước, xóa đuôi sau” — không còn thời điểm Nháp trống.
- `_chuyenChiTietDNTTSangYVaTinhBu_`: chỉ ghi ô Ngày CK và Trạng thái/Ngày ghi; không tính bù lại khi đã có dòng Y (trước đây chạy lại sẽ nhân đôi ChiTietDNTT).
- `webMoDongThanhToanTheoHoSo`: ghi CT con vào Nháp bằng 1 lệnh; xóa bản chính theo **ID đọc lại mới nhất** (không theo vị trí dòng cũ), có sao lưu; mở khóa phiếu cân bằng 2 lệnh RangeList.
- `_donDep3BangConKhiMoDong_`, `webXoaCTMoCoi`, `webXoaSrcMoCoi`, `webXoaMoCoiChiTietDNTT`, `webXoaMoCoiChiTietUNC`: dùng chung đường xóa có sao lưu, xóa theo khối.
- `webDongBoTenKhachHang`: có khóa hệ thống; chỉ ghi đúng ô Khách hàng được chọn (trước đây ghi lại cả cột).
- `runProcessDetail`, `runFillMissingBankOnly`, `runXacNhanDNTT`, `runHuyXacNhanDNTT`: chỉ ghi đúng ô thay đổi.
- `runCreate112`, `runDeleteDraftRecord`, `removePhieuCanFromDraft`, `_removeFromPcUnpaidCache_`, phân tích NG-ĐL: bỏ mẫu “clearContent rồi setValues”.
- Làm mới mirror (`HD_NCC_DRAFT`, `HD_STK_DRAFT`, `PhieuCan_DN_CHUA_TT_DRAFT`, `HopDongTienDo_DRAFT`, `CongNoKhachHang_DRAFT`): không còn `sh.clear()` trước khi ghi.
- `_ghiChiTietDNTT_N_`, `_ghiLichSuUNC_`, `webTaoLaiMisaTheoNgay`: phần đọc-rồi-ghi-thêm chạy trong khóa hệ thống (chống 2 người ghi đè dòng của nhau / ghi MISA trùng).

### Fixed
- Mirror Phiếu Cân chưa TT làm **mất số 0 đầu** của Số phiếu / Số phiếu cân dạng chữ.
- `get112ViewData` trả STK còn dấu `'` → UNC/báo cáo có thể ra `''0123…`.

### Security
- Không có thay đổi về xác thực/phân quyền ở bản này (chờ người dùng quyết định mô hình — xem `docs/REFACTOR_PLAN.md` §9).
