# HAK_WEBAPP_DNTT_DRAFT

Hệ thống Quản Lý Thanh Toán HAK (Đề Nghị Thanh Toán gỗ keo) — Google Apps Script web app gắn với **File Nháp**. Repo được đồng bộ bằng gas-tools extension.

Phiên bản hiện tại: xem `VERSION` · Lịch sử thay đổi: `CHANGELOG.md`.

## Mã nguồn

| File | Vai trò |
|---|---|
| `Code.gs` | Backend Apps Script (router, nghiệp vụ, cache, trigger, xuất file, chatbot) |
| `Index.html` | Giao diện web app |
| `appsscript.json` | Manifest |
| `tests/` | Bộ kiểm thử chạy bằng Node (không đưa lên Apps Script) |
| `docs/` | Kiến trúc, phân tích, kế hoạch, TODO, lộ trình |

## Cài đặt (1 lần)

1. Mở Google Sheet dùng làm **File Nháp** → Extensions › Apps Script → dán `Code.gs`, `Index.html`, `appsscript.json`.
2. Menu **🚀 QUẢN LÝ HAK › 🔗 Kết Nối File Chính** (hoặc Cài Đặt trên web app) → dán URL/ID File Chính.
3. Deploy › Web app. Trong Cài Đặt: bật các Trigger, khóa định dạng TEXT, cấu hình MISA/UNC.

## Kiểm thử

Yêu cầu Node ≥ 20 (không cần cài thư viện):

```bash
node --test "tests/**/*.test.mjs"
```

## Tài liệu

- `docs/ARCHITECTURE.md` — kiến trúc hiện tại & quy tắc ghi/xóa an toàn
- `docs/PROJECT_ANALYSIS.md` — phân tích toàn bộ dự án
- `docs/REFACTOR_PLAN.md` — kế hoạch nâng cấp Commercial Edition
- `docs/TODO.md`, `docs/ROADMAP.md` — tiến độ
