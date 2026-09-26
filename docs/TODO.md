# TODO — Backlog theo mã trong REFACTOR_PLAN §5

Trạng thái: ✅ xong · 🟡 một phần · ⏳ chưa làm · ⚖️ cần người dùng đồng ý · ❓ cần thông tin

## 🔴 Critical
| ID | Hạng mục | Trạng thái | Ghi chú |
|---|---|---|---|
| C-01 | Chốt TT không idempotent | ✅ 2026.6.0 | Chạy lại an toàn; journal/resume tự động để P3 |
| C-02 | Ghi đè toàn bộ PhieuCan_DN | ✅ 2026.6.0 | RangeList đúng ô |
| C-03 | Ghi đè toàn bộ DNTT_GK_DN / 112 | ✅ 2026.6.0 | runConfirmPayment, runProcessDetail, runFillMissingBankOnly |
| C-04 | Mở Đóng TT xóa theo vị trí dòng cũ, không sao lưu | ✅ 2026.6.0 | Xóa theo ID đọc lại + sao lưu |
| C-05 | `doGet?action=` không xác thực | ⏳ ⚖️ | Chờ trả lời câu hỏi §9.4 |
| C-06 | Không xác thực/phân quyền | ⏳ ⚖️ | Chờ chọn mô hình §9.3 |
| C-07 | Sao lưu trước thao tác nguy hiểm | 🟡 2026.6.0 | Đã sao lưu mọi dòng bị xóa; còn thiếu giao diện Khôi phục |

## 🟠 High
| ID | Hạng mục | Trạng thái | Ghi chú |
|---|---|---|---|
| H-01 | Chỉ số cột cứng → Schema/Repository | ⏳ | P3 (cần quyết định clasp §9.1) |
| H-02 | clearContent + setValues trên Nháp/mirror | ✅ 2026.6.0 | |
| H-03 | Thiếu khóa ở hàm ghi | ✅ 2026.6.0 | Refresh mirror không khóa (tránh khóa lồng) nhưng không còn lúc trống |
| H-04 | Đồng bộ tên ghi lại cả cột | ✅ 2026.6.0 | |
| H-05 | Mất số 0 đầu ở cache Phiếu Cân | ✅ 2026.6.0 | |
| H-06 | STK còn dấu `'` | ✅ 2026.6.0 | |
| H-07 | XSS qua `onclick` inline | ⏳ | P2 |
| H-08 | `ALLOWALL` iframe | ⏳ ⚖️ | |
| H-09 | PII trong localStorage | ⏳ ⚖️ | |
| H-10 | PII gửi Gemini | ⏳ ⚖️ | |
| H-11 | Audit thiếu user thật & before/after | 🟡 | Đồng bộ tên đã ghi cũ→mới; phần còn lại P2 |
| H-12 | Formula injection | ⏳ | Làm cùng Schema (H-01) |
| H-13 | `showAddPaymentDialog` trỏ file không tồn tại | ⏳ ⚖️ | |
| H-14 | Test tự động | ✅ 2026.6.0 | 28 test; mở rộng dần mỗi Phase |

## 🟡 Medium / 🟢 Low
Xem `REFACTOR_PLAN.md` §5 — tất cả ⏳.

## ❓ Cần thông tin
- L-09: “Số điện thoại mất số 0” — file/cột nào? (code hiện không có trường điện thoại)

## Việc kỹ thuật phát sinh
- ⏳ Giao diện “Khôi phục từ SYS_SaoLuuDongXoa” (hoàn tất C-07).
- ⏳ Kiểm chứng trên Google Sheets thật: `getRangeList().setValue()` và `deleteRows()` với dữ liệu lớn (mock đã kiểm chứng logic).
