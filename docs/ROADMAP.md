# ROADMAP — Commercial Edition

| Phase | Nội dung | Trạng thái | Phiên bản |
|---|---|---|---|
| P0 | Nền móng: tài liệu quản trị, bộ test `node:test` + mock GAS | ✅ Hoàn thành | 2026.6.0 |
| P1 | An toàn dữ liệu: ghi đúng ô, chạy lại an toàn, sao lưu trước khi xóa, khóa bổ sung, giữ số 0 đầu, khôi phục dòng đã xóa, chặn trả 2 lần | ✅ Hoàn thành | 2026.6.0 → 2026.8.2 |
| P2a | Bảo mật: Router `api` + Cổng đăng nhập Gmail + 3 vai trò, siết `doGet` | ✅ Hoàn thành | 2026.7.0 |
| P2b | Bảo mật: XSS (bỏ `onclick` inline), PII (localStorage, Gemini), iframe, chèn công thức, lỗi nội bộ | 🟡 H-07, H-12, M-13, H-13 xong; H-08/H-09/H-10 giữ nguyên theo quyết định người dùng | 2026.7.5 |
| P3 | Phân lớp backend (Schema/Repository/Service), ExportService, Cache + Event bus, JobService — file **phẳng** cho gas-tools | ⏳ | – |
| P4 | Frontend components, theme, a11y, virtual scroll | ⏳ | – |
| P5 | Multi-tenant, Notification, Audit UI, Backup/Restore UI, Import/Export, Template, Plugin, Online Update | ⏳ | – |
| – | ⚖️ Công nợ theo CCCD + Tên (M-04) | ✅ Hoàn thành | 2026.8.0 |
| – | ⚖️ Khóa sổ năm 1 thao tác (Phiếu Cân + ĐNTT cùng lúc, file DATA<năm>), báo cáo đọc năm đã khóa sổ | ✅ Hoàn thành | 2026.9.0 → 2026.9.1 |
| – | 🔎 Rà soát toàn hệ thống (R-01…R-34), chặn trả 2 lần trong lượt Duyệt, giao diện tối/in/bàn phím, 12 tài liệu | ✅ Hoàn thành | 2026.9.7 |
| P4a | Giao diện: dark mode, print, a11y bàn phím/ARIA, bảng cuộn ngang | ✅ Hoàn thành (phần CSS/a11y của P4) | 2026.9.7 |
| P6 | Dashboard/Report Builder, Print Designer, e-Sign, API, OCR, AI đa provider, Offline/Sync | ⏳ | – |

Đề xuất tiếp theo (chờ người dùng chọn — `REVIEW_2026_09.md` §GĐ6, mục ⭐): R-05 Mở Đóng TT nguyên tử, R-06 nhật ký không mất âm thầm, R-11 giới hạn webhook, sao lưu File Chính hằng tuần, email cảnh báo, biểu đồ 12 tháng, phân trang tab MISA/Chi tiết/UNC, menu thu gọn trên điện thoại.

Quy trình mỗi Phase: backup → deployment thử nghiệm → nghiệm thu Phụ lục C (PROJECT_ANALYSIS) → người dùng duyệt → triển khai → cập nhật ARCHITECTURE / CHANGELOG / TODO / VERSION / ROADMAP.
