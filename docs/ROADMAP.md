# ROADMAP — Commercial Edition

| Phase | Nội dung | Trạng thái | Phiên bản |
|---|---|---|---|
| P0 | Nền móng: tài liệu quản trị, bộ test `node:test` + mock GAS | ✅ Hoàn thành | 2026.6.0 |
| P1 | An toàn dữ liệu: ghi đúng ô, chạy lại an toàn, sao lưu trước khi xóa, khóa bổ sung, giữ số 0 đầu | ✅ Hoàn thành (trừ UI Khôi phục) | 2026.6.0 |
| P2a | Bảo mật: Router `api` + Cổng đăng nhập Gmail + 3 vai trò, siết `doGet` | ✅ Hoàn thành | 2026.7.0 |
| P2b | Bảo mật: XSS (bỏ `onclick` inline), PII (localStorage, Gemini), iframe, chèn công thức, lỗi nội bộ | 🟡 H-07, H-12, M-13, H-13 xong; H-08/H-10 giữ nguyên theo quyết định; H-09 chờ quyết định | 2026.7.5 |
| P3 | Phân lớp backend (Schema/Repository/Service), ExportService, Cache + Event bus, JobService — file **phẳng** cho gas-tools | ⏳ | – |
| P4 | Frontend components, theme, a11y, virtual scroll | ⏳ | – |
| P5 | Multi-tenant, Notification, Audit UI, Backup/Restore UI, Import/Export, Template, Plugin, Online Update | ⏳ | – |
| P6 | Dashboard/Report Builder, Print Designer, e-Sign, API, OCR, AI đa provider, Offline/Sync | ⏳ | – |

Quy trình mỗi Phase: backup → deployment thử nghiệm → nghiệm thu Phụ lục C (PROJECT_ANALYSIS) → người dùng duyệt → triển khai → cập nhật ARCHITECTURE / CHANGELOG / TODO / VERSION / ROADMAP.
