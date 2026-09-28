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
| M-02, M-05..M-09, M-11, M-12, M-14.., L-* | | ⏳ | Xem `REFACTOR_PLAN.md` §5 |

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
- ⏳ Kiểm chứng trên Google thật: đăng nhập qua Cổng (lần đầu Google hỏi quyền xem email), đăng xuất, khóa tài khoản.
- ✅ 2026.8.2: Giao diện “Khôi phục từ SYS_SaoLuuDongXoa” (hoàn tất C-07).
- ⏳ Kiểm chứng trên Google Sheets thật: `getRangeList().setValue()` và `deleteRows()` với dữ liệu lớn (mock đã kiểm chứng logic).
- ✅ Khóa sổ năm (quy trình người dùng): kiểm chứng công nợ đầu năm = phiếu chưa trả mang sang (test `khoaSoNam`); không cần bộ nhớ đệm 6 tháng.
- ✅ 2026.9.16: Nhật ký thao tác giữ dạng chữ cho Mã hồ sơ / mã lỗi (không mất số 0 đầu).
- ✅ 2026.9.15: Hệ Thống › Dọn Dẹp MISA (trùng / mồ côi / tất cả trong khoảng Ngày CK), xem trước + sao lưu. UNC không cần nút xóa riêng (xem CHANGELOG).
- ✅ 2026.9.41: Trang chủ — ô số liệu dạng nút mở thẳng màn hình; tab “Đã có số tiền” ở Danh Sách ĐNTT.
- ✅ 2026.9.40: Thiết kế lại giao diện — 1 font Inter, thang cỡ chữ 1 chỗ, Trang chủ dạng bước + nhóm số liệu.
- ✅ 2026.9.39: Trang chủ — Quy trình thanh toán 5 bước lên đầu trang (chung nội dung với Hướng Dẫn).
- ✅ 2026.9.38: Danh Sách ĐNTT — tổng tiền đang đề nghị, tổng theo khách hàng, lọc tên khách hàng.
- ✅ 2026.9.37: Trigger đang chạy → thông báo, thao tác chờ đồng bộ xong rồi tự chạy.
- ✅ 2026.9.36: Làm mới bản sao chỉ ghi khi dữ liệu đổi (File Nháp bớt bận, Danh Sách ĐNTT không phải chờ). ⏳ Theo dõi Hệ Thống › Hiệu Năng: nếu còn chức năng nhẹ bị quá giờ, xem các chức năng nặng chạy cùng thời điểm.
- ✅ 2026.9.35: Báo Cáo Thanh Toán — bấm dòng khách hàng xem phiếu hoàn thành trước khi in.
- ✅ 2026.9.34: Kiểm tra hiệu năng lần 2 — Duyệt, MISA, trigger bớt đọc lại sổ (xem CHANGELOG). ⏳ Người dùng đo thời gian thật ở Hệ Thống › Hiệu Năng. Còn lại nặng nhất: báo cáo Công Nợ (~1,2 triệu ô, cần toàn bộ lịch sử).
- ✅ 2026.9.33: ⚖️ Báo Cáo Thanh Toán (Gỗ Keo, Chi Tiết, MISA, UNC) chỉ trong phạm vi 1 tháng. Người dùng xác nhận 28/09/2026: "1 tháng" = khoảng 1 tháng bất kỳ (không theo tháng lịch); KHÔNG áp dụng cho báo cáo Công Nợ.
- ✅ 2026.9.32: Đo lại hiệu năng Báo Cáo TT / Chi Tiết (xem CHANGELOG); xuất Excel Chi Tiết đủ dòng (tối đa 30.000). ⏳ Người dùng đo thời gian thật ở Hệ Thống › Hiệu Năng sau khi triển khai.
- ✅ 2026.9.31: Phiếu PDF luôn có Nội dung chuyển khoản + Ghi chú; tự điền Nội dung CK chuẩn khi sổ trống.
- ✅ 2026.9.30: Bảng Kê Chi Tiết CK từ ChiTietDNTT; Báo cáo Chi Tiết lọc theo Ngày CK; nút In phiếu hoàn thành thanh toán (Ngày CK). ⏳ Hồ sơ cũ chưa có ChiTietDNTT: chạy Hệ Thống › Đồng Bộ Lịch Sử để Bảng Kê và tab Chi Tiết đầy đủ.
- ✅ 2026.9.29: Xuất báo cáo / MISA chỉ đọc dòng cần (không đọc cả sổ CT, cả file Phiếu Cân); Dọn Dẹp UNC. ⏳ Người dùng đo lại thời gian Xuất Báo Cáo trên Google thật (Hệ Thống › Hiệu Năng).
- ✅ 2026.9.28: Xuất Báo Cáo ĐNTT nhanh lại (lỗi chậm từ 2026.9.25); font web đồng bộ; nút in phiếu chi tiết thanh toán PDF. ⏳ Kiểm chứng trên Google thật: chuyển HTML → PDF (`getAs`) hiển thị đúng tiếng Việt; người dùng xác nhận các ô ký trên phiếu.
- ✅ 2026.9.27: Quy tắc căn lề toàn web app (mọi file xuất + mọi bảng web).
- ✅ 2026.9.26: Báo Cáo ĐNTT — Nội dung CK luôn 2 dòng; tên/chuỗi căn trái, số căn phải (2 sheet).
- ✅ 2026.9.25: Bảng Đề Xuất — Ghi chú 2 mục/dòng, cột vừa phải, chiều cao dòng đủ chữ.
- ✅ 2026.9.24: SL dự kiến hợp đồng = tổng lô rừng HD_RUNG (app Hợp Đồng để cột Z = 0). ⏳ Đề xuất sửa app Hợp Đồng (HDMB_HAK): ghi cột Z = tổng lô rừng khi lưu hợp đồng — chờ người dùng đồng ý.
- ✅ 2026.9.23: Ghi sổ ChiTietDNTT/ChiTietUNC bằng Date theo Vùng Lãnh Thổ; file xuất theo Vùng xuất. ⏳ Người dùng soát cột Ngày hiệu lực các dòng ChiTietUNC cũ (ngày ≤ 12 có thể bị Sheets đọc lộn).
- ✅ 2026.9.22: Quy định định dạng ngày giờ (web VN / Sheet theo Vùng Lãnh Thổ / xuất theo Vùng xuất) — mọi ô ngày web dd/mm/yyyy.
- ✅ 2026.9.21: Ô ngày Duyệt gõ dd/mm/yyyy cố định + nút lịch (trình duyệt tiếng Anh hiện tháng/ngày).
- ✅ 2026.9.20: Tiêu chuẩn vùng US (Google Sheet) / VN (xuất MISA); Vùng xuất mặc định VN. ⏳ Người dùng kiểm tra Update_NganHang_DN có dòng cũ dạng mm/dd/yyyy không (nếu Vùng xuất từng để trống).
- ✅ 2026.9.19: Duyệt chọn ngày bằng lịch; máy chủ từ chối ngày không có thật (lỗi 26/09/2026 → 09/02/2028 khi Vùng lãnh thổ = US).
- ✅ 2026.9.18: Tạo lại MISA chọn theo Ngày CK (trước theo Ngày ĐN - lệch với Báo Cáo MISA). ❓ Hỏi người dùng: Tạo lại UNC có cần đổi sang Ngày CK không (hiện theo Ngày ĐN).
- ✅ Kiểm chứng: trigger không bị phân quyền chặn (test `triggers.test.mjs`).
- ✅ Kiểm chứng: cờ “đang khóa sổ” trên file Phiếu Cân đặt/gỡ đúng (test `luuTruNam`). ✅ Đã đọc mã QL_NHAPKHO (28/09/2026): đọc cờ đúng quy ước.
- ✅ 2026.9.17: Báo Cáo MISA cảnh báo phiếu đã chốt chưa có dòng MISA + nút “Tạo bổ sung”. Mở Đóng TT vẫn xóa dòng MISA (người dùng chọn không giữ).
- ✅ 2026.9.14: Tạo lại UNC thay dòng cũ trong ChiTietUNC; Báo Cáo UNC mỗi hồ sơ 1 dòng (mới nhất).
- ✅ 2026.9.13: Xuất MISA theo ngày trở lại đúng mẫu nhập MISA 33 cột như bản 2026.8 (+ sheet tóm tắt).
- ✅ 2026.9.7 → 2026.9.12 (cập nhật trực tiếp trên main): an toàn Mở Đóng TT, chặn trùng phiếu trong lượt Duyệt, số dạng chữ VN, cờ khóa sổ cho QL_NHAPKHO, giao diện tối / bàn phím, bỏ webhook — xem CHANGELOG.
- ✅ 2026.9.6: Ngày đề nghị ở Danh sách ĐNTT, % tiến độ màn hình chờ, Hệ Thống › Hiệu Năng (đo thật), Duyệt bớt 1 lượt đọc Phiếu Cân + CT.
- ⏳ Sau 1–2 tuần dùng: xem Hệ Thống › Hiệu Năng để quyết định tối ưu tiếp (trigger đọc 2 lần đã sửa ở 2026.9.34; còn Công nợ/Sổ chi tiết đọc toàn bộ lịch sử).
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
