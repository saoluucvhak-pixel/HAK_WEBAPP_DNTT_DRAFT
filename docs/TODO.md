# TODO — Backlog theo mã trong REFACTOR_PLAN §5

Trạng thái: ✅ xong · 🟡 một phần · ⏳ chưa làm · ⚖️ cần người dùng đồng ý · ❓ cần thông tin

## 🔴 Critical
| ID | Hạng mục | Trạng thái | Ghi chú |
|---|---|---|---|
| C-01 | Chốt TT không idempotent | ✅ 2026.6.0 | Chạy lại an toàn; journal/resume tự động để P3 |
| C-02 | Ghi đè toàn bộ PhieuCan_DN | ✅ 2026.6.0 | RangeList đúng ô |
| C-03 | Ghi đè toàn bộ DNTT_GK_DN / 112 | ✅ 2026.6.0 | runConfirmPayment, runProcessDetail, runFillMissingBankOnly |
| C-04 | Mở Đóng TT xóa theo vị trí dòng cũ, không sao lưu | ✅ 2026.6.0 | Xóa theo ID đọc lại + sao lưu |
| C-05 | `doGet?action=` không xác thực | ✅ 2026.7.0 ⚖️ | Bỏ 4 action; giữ webhook có mã bí mật |
| C-06 | Không xác thực/phân quyền | ✅ 2026.7.0 ⚖️ | Cổng đăng nhập Gmail + 3 vai trò + API_ROUTES |
| C-07 | Sao lưu trước thao tác nguy hiểm | ✅ 2026.8.2 | Sao lưu mọi dòng bị xóa + giao diện Khôi phục theo từng lần xóa (chặn trả 2 lần) |

## 🟠 High
| ID | Hạng mục | Trạng thái | Ghi chú |
|---|---|---|---|
| H-01 | Chỉ số cột cứng → Schema/Repository | 🚫 Không làm | Người dùng quyết định 26/09/2026: cột file nguồn cố định, không ai sửa trực tiếp trên Google Sheet; đã có cảnh báo khi tiêu đề PhieuCan_DN thay đổi (v2026.7.1) |
| H-02 | clearContent + setValues trên Nháp/mirror | ✅ 2026.6.0 | |
| H-03 | Thiếu khóa ở hàm ghi | ✅ 2026.6.0 | Refresh mirror không khóa (tránh khóa lồng) nhưng không còn lúc trống |
| H-04 | Đồng bộ tên ghi lại cả cột | ✅ 2026.6.0 | |
| H-05 | Mất số 0 đầu ở cache Phiếu Cân | ✅ 2026.6.0 | |
| H-06 | STK còn dấu `'` | ✅ 2026.6.0 | |
| H-07 | XSS qua `onclick` inline | ✅ 2026.7.4 | Mọi nút mang dữ liệu dùng `hanhDong()`; `onclick` còn lại chỉ chứa hằng/chỉ số (bỏ hẳn ở P4) |
| H-08 | `ALLOWALL` iframe | 🚫 Giữ nguyên | Người dùng quyết định 26/09/2026: web app đang nhúng vào trang chủ |
| H-09 | PII trong localStorage | 🚫 Giữ nguyên | Người dùng quyết định 26/09/2026: giữ (máy dùng riêng, ưu tiên gợi ý nhanh) |
| H-10 | PII gửi Gemini | 🚫 Giữ nguyên | Người dùng quyết định 26/09/2026: không sửa |
| H-11 | Audit thiếu user thật & before/after | 🟡 2026.7.0 | Đã ghi email thật cho mọi thao tác; before/after mới có ở Đồng bộ tên, Sửa tên KH, Phân quyền |
| H-12 | Formula injection | ✅ 2026.7.4 | `_oAnToan_`/`_dongAnToan_` ở mọi chỗ ghi dữ liệu |
| H-13 | `showAddPaymentDialog` trỏ file không tồn tại | ✅ 2026.7.5 | Cách B: mở Web App màn Tạo Mới (`?trang=taoMoi`) |
| H-14 | Test tự động | ✅ 2026.6.0 | 68 test (2026.7.4); mở rộng dần mỗi Phase |

## 🟡 Medium / 🟢 Low
| ID | Hạng mục | Trạng thái | Ghi chú |
|---|---|---|---|
| M-01 | Ngày UTC ở client | ✅ 2026.7.4 | `todayISOVN` / `isoDaysAgoVN` |
| M-10 | Tên model Gemini cứng | ✅ 2026.7.4 | Cấu hình ở Cài đặt + tự dò qua ListModels |
| M-13 | Lỗi trả `err.toString()` cho client | ✅ 2026.7.4 | `_loiChoNguoiDung_` + log `LOI_HE_THONG` |
| M-03 | Hồ sơ chọn tồn tại qua các tab | ✅ 2026.7.5 | Cách B: giữ chọn + cảnh báo “N hồ sơ ở tab khác” |
| M-04 | Công nợ gom theo tên | ✅ 2026.8.0 ⚖️ | CCCD + Tên; phiếu cân gán CCCD theo hồ sơ, rồi theo HD_NCC; có bảng đối chiếu cũ/mới |
| M-05 | 10 hàm xuất Excel trùng | 🟡 2026.9.7 | Phần tạo file dùng chung `_taoFileBaoCao_`; dựng bảng từng báo cáo vẫn riêng |
| M-02, M-06..M-09, M-11, M-12, M-14.., L-* | | ⏳ | Xem `REFACTOR_PLAN.md` §5 |

## Rà soát 27/09/2026 (`REVIEW_2026_09.md`)
| ID | Hạng mục | Trạng thái |
|---|---|---|
| R-01 | Trả 2 lần trong cùng lượt Duyệt | ✅ 2026.9.7 |
| R-02, R-03 | Mở Đóng TT / Đồng bộ tên tìm phiếu cân sai cột | ✅ 2026.9.7 |
| R-04 | Xóa hồ sơ Nháp không sao lưu ChiTietDNTT/UNC | ✅ 2026.9.7 |
| R-07, R-21, R-22 | Công nợ phiếu cân ngày D; sắp xếp Tình hình TT; Thông Số | ✅ 2026.9.7 |
| R-08, R-09, R-10 | Mở File Chính 1 lần/lượt; `_taoFileBaoCao_`; bỏ đọc lặp | ✅ 2026.9.7 |
| R-19, R-20, R-23…R-26 | Client, a11y, dark/print, mã chết | ✅ 2026.9.7 |
| R-05 | Mở Đóng TT nguyên tử | ✅ 2026.9.12 ⚖️ (người dùng đồng ý 27/09/2026) |
| R-06 | `logAction_` lỗi âm thầm | ✅ 2026.9.11 |
| R-11, R-12 | Webhook: giới hạn tần suất, so sánh an toàn | ✅ 2026.9.9 — bỏ hẳn webhook (người dùng yêu cầu) |
| R-14, R-18 | Đọc số dạng chữ VN; PDF lỗi | ✅ 2026.9.11 |
| R-13, R-16, R-17, R-27, R-29, R-31, R-32 | Xem REVIEW | ⏳ |
| L-01, L-02 | Accessibility, Dark mode | ✅ 2026.9.7 (cơ bản) |

## Đã bỏ theo yêu cầu người dùng
- L-09: “Số điện thoại mất số 0” — người dùng quyết định **không rà nữa** (26/09/2026).

## Quyết định đã có (REFACTOR_PLAN §9)
- Hệ thống **dùng nội bộ** (26/09/2026): bỏ P5/P6, chỉ lấy Sao lưu/Khôi phục và Nhật ký trước/sau.
- §9.1: giữ **gas-tools** → P3 tách code thành nhiều file **phẳng** (không thư mục).
- §9.3: **Cổng đăng nhập Gmail**, Admin = saoluucvhak@gmail.com (chủ script), vai trò Quản trị / Kế toán / Chỉ xem.
- §9.4: không có hệ thống ngoài gọi `?action=` → đã bỏ.
- Quản trị cố định giữ nguyên: saoluucvhak@gmail.com và **phuthuy.apple@gmail.com** (người dùng xác nhận 26/09/2026).
- Không mở PR gộp vào `main`; làm tiếp trên nhánh `claude/check-fix-code-bugs-lb2uuf`.

## Việc kỹ thuật phát sinh
- ⏳ Kiểm chứng trên Google thật (2026.9.7): Duyệt lô có phiếu trùng, Mở Đóng TT phiếu nhiều dòng, xóa Nháp rồi Khôi phục, chế độ tối/in (xem `DEPLOY.md`).
- ⏳ Kiểm chứng trên Google thật: đăng nhập qua Cổng (lần đầu Google hỏi quyền xem email), đăng xuất, khóa tài khoản.
- ✅ 2026.8.2: Giao diện “Khôi phục từ SYS_SaoLuuDongXoa” (hoàn tất C-07).
- ⏳ Kiểm chứng trên Google Sheets thật: `getRangeList().setValue()` và `deleteRows()` với dữ liệu lớn (mock đã kiểm chứng logic).
- ✅ Khóa sổ năm (quy trình người dùng): kiểm chứng công nợ đầu năm = phiếu chưa trả mang sang (test `khoaSoNam`); không cần bộ nhớ đệm 6 tháng.
- ✅ 2026.9.6: Ngày đề nghị ở Danh sách ĐNTT, % tiến độ màn hình chờ, Hệ Thống › Hiệu Năng (đo thật), Duyệt bớt 1 lượt đọc Phiếu Cân + CT.
- ⏳ Sau 1–2 tuần dùng: xem Hệ Thống › Hiệu Năng để quyết định tối ưu tiếp (trigger 7:30 đọc Phiếu Cân/CT 2 lần; Công nợ/Sổ chi tiết đọc toàn bộ).
- ✅ 2026.9.5: Đăng nhập khi nhúng trong trang chủ (cửa sổ nhỏ, không rời trang chủ).
- ⏳ Kiểm chứng trên Google thật: đăng nhập từ trang chủ nhúng (popup, tự đóng cửa sổ) sau khi dán lại mã Cổng.
- ✅ 2026.9.4: Vai trò Kế toán tổng hợp (Kế toán + toàn bộ Hệ Thống, không Cài đặt).
- ✅ 2026.9.3: Trang chủ không tính lại công nợ khi mở (đọc bản tổng hợp), không che màn hình.
- ✅ 2026.9.1: Khóa sổ năm là **1 thao tác** (tự tạo DATA<năm>, chuyển sổ ĐNTT + phiếu cân cùng lúc, tự đăng ký) — người dùng yêu cầu 26/09/2026.
- ✅ 2026.9.0: Báo cáo tự đọc năm đã khóa sổ.
- 🚫 QL_NHAPKHO bỏ “Chốt sổ năm” (người dùng quyết định 26/09/2026): khóa sổ chỉ làm ở ĐNTT; sheet `PhieuCan_DN_<năm>` chỉ do nút “Chuyển Phiếu Cân Đã Khóa Sổ” tạo. Không sửa repo QL_NHAPKHO.
- ⏳ Kiểm chứng trên Google thật: Khóa sổ năm với dữ liệu lớn (thời gian `deleteRows` theo khối, `SpreadsheetApp.create` + `moveTo` thư mục File Chính).
- ✅ 2026.8.4: Chỉ đọc 20/28 cột Phiếu Cân cần dùng (bộ nhớ đệm ~16.000 phiếu).
- ✅ 2026.8.3: Trang chủ đọc PhanTichNhapTT_DRAFT (không quét PhieuCan_DN); sửa trigger 15h bỏ sót cuối tháng.
- 🚫 Không làm (người dùng quyết định): gọn bộ nhớ đệm Phiếu Cân; nhật ký trước/sau khi sửa hồ sơ; P4.1 hộp gõ mã (đã có hộp xác nhận).
- ✅ 2026.8.1: Chặn trả 2 lần cho cùng 1 phiếu cân (cache “chưa TT” cũ khi làm mới chạy trùng lúc Duyệt) — kiểm tra với CT thật ở Tạo mới / Thêm phiếu / Duyệt.
- ✅ 2026.7.4: Kế toán không Duyệt được / không bấm được “↻ Làm mới” (route xếp nhầm quyền Quản trị) — thêm test dò quyền theo trang.
