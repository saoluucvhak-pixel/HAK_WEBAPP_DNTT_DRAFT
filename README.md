# HAK_WEBAPP_DNTT_DRAFT

Hệ thống Quản Lý Thanh Toán HAK (Đề Nghị Thanh Toán gỗ keo) — Google Apps Script web app gắn với **File Nháp**. Repo được đồng bộ bằng gas-tools extension.

Phiên bản hiện tại: xem `VERSION` · Lịch sử thay đổi: `CHANGELOG.md`.

## Mã nguồn

| File | Vai trò |
|---|---|
| `Code.gs` | Backend Apps Script (router, nghiệp vụ, cache, trigger, xuất file, chatbot) |
| `Index.html` | Giao diện web app |
| `appsscript.json` | Manifest |
| `tests/` | Bộ kiểm thử chạy bằng Node + Playwright (không đưa lên Apps Script) |
| `docs/` | Kiến trúc, phân tích, kế hoạch, TODO, lộ trình |

## Cài đặt (1 lần)

1. Mở Google Sheet dùng làm **File Nháp** → Extensions › Apps Script → dán `Code.gs`, `Index.html`, `appsscript.json`.
2. Menu **🚀 QUẢN LÝ HAK › 🔗 Kết Nối File Chính** (hoặc Cài Đặt trên web app) → dán URL/ID File Chính.
3. Deploy › Web app (Execute as: **Me**, Who has access: **Anyone with Google account**). Trong Cài Đặt: bật các Trigger, khóa định dạng TEXT, cấu hình MISA/UNC.
4. **Đăng nhập & phân quyền** (từ v2026.7): mở web app bằng tài khoản chủ script (luôn là Quản trị) → Cài đặt:
   - *Cổng Đăng Nhập Gmail*: tạo dự án mới tại script.new, dán mã nguồn được sinh sẵn, Deploy (Execute as: **User accessing the web app**, Who has access: **Anyone with Google account**), dán link Web app vào ô “Link Cổng đăng nhập”. (Từ 2026.7.5: dán lại mã Cổng mới để menu Sheet “Thêm Mới” vào thẳng màn Tạo Mới sau khi đăng nhập — không bắt buộc.)
   - *Người Dùng & Phân Quyền*: thêm email Google của từng người với vai trò Quản trị / Kế toán tổng hợp / Kế toán / Chỉ xem.

   Người dùng mở link web app chính → bấm “Đăng nhập bằng Google”. Chưa thêm vào danh sách thì không vào được (kể cả menu trong Sheet).

## Kiểm thử

Yêu cầu Node ≥ 20 (không cần cài thư viện):

```bash
node --test "tests/**/*.test.mjs"                                  # 108 test nghiệp vụ / bảo mật
NODE_PATH=$(npm root -g) node --test tests/ui/giaoDien.ui.mjs        # 5 test giao diện (cần Playwright + Chromium)
```

Kết quả gần nhất: `docs/TEST_REPORT.md`.

## Tài liệu

- `docs/INSTALL.md`, `docs/DEPLOY.md` — cài đặt lần đầu, cập nhật phiên bản
- `docs/USER_GUIDE.md`, `docs/ADMIN_GUIDE.md` — hướng dẫn người dùng, quản trị
- `docs/DEVELOPER_GUIDE.md`, `docs/API.md`, `docs/DATABASE.md`, `docs/FLOW.md`, `docs/SECURITY.md` — kỹ thuật
- `docs/REVIEW_2026_09.md` — rà soát toàn hệ thống 27/09/2026 (danh sách lỗi R-xx, đề xuất tính năng)
- `docs/TEST_REPORT.md` — báo cáo kiểm thử
- `docs/ARCHITECTURE.md` — kiến trúc hiện tại & quy tắc ghi/xóa an toàn
- `docs/PROJECT_ANALYSIS.md` — phân tích toàn bộ dự án
- `docs/REFACTOR_PLAN.md` — kế hoạch nâng cấp Commercial Edition
- `docs/TODO.md`, `docs/ROADMAP.md` — tiến độ
- `docs/RA_SOAT_2026-09-28.md` — rà soát toàn bộ mã nguồn (lỗi, kiến trúc, UI/UX, bảo mật, hiệu năng, chấm điểm, lộ trình)
