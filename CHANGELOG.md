# CHANGELOG

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/). Phiên bản theo `NĂM.ĐỢT.SỬA`; thay đổi làm đổi hành vi nghiệp vụ (⚖️) sẽ tăng số ĐỢT và ghi rõ đã được người dùng đồng ý.

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
