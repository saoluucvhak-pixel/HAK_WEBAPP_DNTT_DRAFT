# ROADMAP — Commercial Edition

| Phase | Nội dung | Trạng thái | Phiên bản |
|---|---|---|---|
| P0 | Nền móng: tài liệu quản trị, bộ test `node:test` + mock GAS | ✅ Hoàn thành | 2026.6.0 |
| P1 | An toàn dữ liệu: ghi đúng ô, chạy lại an toàn, sao lưu trước khi xóa, khóa bổ sung, giữ số 0 đầu | ✅ Hoàn thành (trừ UI Khôi phục) | 2026.6.0 |
| P2 | Bảo mật: Router + Auth + RBAC, siết `doGet`, XSS, PII | ⏳ Chờ quyết định §9.3–9.5 | – |
| P3 | Phân lớp backend (Schema/Repository/Service), ExportService, Cache + Event bus, JobService | ⏳ Chờ quyết định §9.1 (clasp) | – |
| P4 | Frontend components, theme, a11y, virtual scroll | ⏳ | – |
| P5 | Multi-tenant, Notification, Audit UI, Backup/Restore UI, Import/Export, Template, Plugin, Online Update | ⏳ | – |
| P6 | Dashboard/Report Builder, Print Designer, e-Sign, API, OCR, AI đa provider, Offline/Sync | ⏳ | – |

Quy trình mỗi Phase: backup → deployment thử nghiệm → nghiệm thu Phụ lục C (PROJECT_ANALYSIS) → người dùng duyệt → triển khai → cập nhật ARCHITECTURE / CHANGELOG / TODO / VERSION / ROADMAP.
