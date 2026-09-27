# TEST REPORT — v2026.9.7 (27/09/2026)

## Tổng kết

| Bộ | Số test | Kết quả | Thời gian | Môi trường |
|---|---|---|---|---|
| Nghiệp vụ + bảo mật (`tests/unit`, `tests/integration`) | **109** | ✅ 109/109 | ~0,8 s | Node 22, mock Apps Script trong bộ nhớ |
| Giao diện (`tests/ui/giaoDien.ui.mjs`) | **5** | ✅ 5/5 | ~3 s | Chromium 1194 (Playwright 1.56), `google.script.run` giả |
| **Tổng** | **113** | ✅ | | |

Mới ở bản này: 9 test hồi quy (`review202609.test.mjs`) — **cả 9 đều thất bại trên 2026.9.6** (đã chạy lại với `HAK_CODE_GS=Code.gs của 2026.9.6`) và đạt trên 2026.9.7; 5 test giao diện (lần đầu có).

## Chi tiết theo file

| File | Test | Phạm vi |
|---|---|---|
| unit/utils | 6 | standardize, parseNum, ngày, buildIndexMap |
| unit/safeWrite | 11 | Lớp ghi/xóa an toàn, giữ số 0 đầu, nhóm dòng liền kề |
| unit/clientDates | 2 | Ngày giờ VN phía client |
| unit/clientActions | 4 | Nút mang dữ liệu (`hanhDong`) — chống XSS |
| integration/auth | 20 | SSO HMAC, hạn/nonce, phiên, 4 vai trò, route theo trang, menu Sheet, đăng nhập khi nhúng |
| integration/confirmPayment | 8 | Duyệt end-to-end, chạy lại không trùng, chặn trả 2 lần với sổ chốt |
| integration/review202609 | 9 | **Trùng phiếu trong lượt Duyệt (2)**, mở khóa phiếu cân đúng cột, đồng bộ tên đúng cột, công nợ phiếu cân ngày D, sao lưu khi xóa Nháp, sắp xếp tình hình TT, 1 lần mở File Chính/lượt, file báo cáo dùng `moveTo` |
| integration/reopenAndMaintenance | 6 | Mở Đóng TT, xóa mồ côi, khôi phục |
| integration/luuTruNam, khoaSoNam | 7 + 2 | Khóa sổ năm, báo cáo năm đóng/mở, làm tiếp khi bị dừng |
| integration/congNoCccd | 4 | Công nợ theo CCCD + tên |
| integration/dashboard | 3 | Trang chủ không quét Phiếu Cân |
| integration/draftAndCache | 5 | Nháp, cache |
| integration/phieuCanPicker, pcColumns | 3 + 3 | Chọn phiếu cân; chỉ đọc cột cần; cấm số cột trần |
| integration/leadingZeros, formulaInjection | 4 + 2 | Số 0 đầu; chống chèn công thức |
| integration/errors | 3 | Lỗi lập trình → mã tra cứu |
| integration/hieuNang | 3 | Ghi lần chạy chậm, quá giờ |
| integration/geminiModels | 3 | Cấu hình / dò model |
| ui/giaoDien | 5 | Mọi trang không lỗi JS + XSS; chế độ tối; 375px & 768px không tràn ngang; bàn phím/Esc/ARIA; bản in |

## Ma trận theo loại kiểm thử yêu cầu

| Loại | Trạng thái | Ghi chú |
|---|---|---|
| Unit | ✅ | `tests/unit` |
| Integration | ✅ | `tests/integration` (mock SpreadsheetApp/Drive/Cache/Lock/Properties/Session/Utilities) |
| Regression | ✅ | Mỗi lỗi sửa có test thất bại trên bản cũ (`HAK_CODE_GS`) |
| Security | ✅ | auth (20), formulaInjection, clientActions, XSS trong UI test |
| UI / Mobile / Accessibility | ✅ cơ bản | Playwright: 1366/768/375 px, bàn phím, ARIA, dark, print. Chưa có đo WCAG tự động (axe) |
| Performance | 🟡 | Đếm khối lượng đọc/ghi trên dữ liệu 1 năm (`docs/HIEU_NANG.md`), test “1 lần mở File Chính/lượt Duyệt”; thời gian thật đo ở Hệ Thống › Hiệu Năng |
| Stress / Load | ⏳ | Apps Script giới hạn 30 lượt chạy đồng thời/người dùng & 6 phút/lượt — mô phỏng tải trên mock không có ý nghĩa; cần đo trên Google thật (xem “Kiểm chứng”) |
| Browser compatibility | 🟡 | Chromium tự động. CSS mới dùng `:has()`, `color-mix()` (Chrome 111+, Safari 16.2+, Firefox 121+); trình duyệt cũ hơn chỉ mất hiệu ứng cuộn ngang/màu nền chờ — không mất chức năng |

## Chưa tự động hóa được (cần kiểm chứng trên Google thật)
1. Duyệt lô có 2 hồ sơ trùng phiếu cân → cả 2 bị giữ lại.
2. Mở Đóng TT hồ sơ có phiếu cân nhiều dòng / cột A khác cột W.
3. Xóa hồ sơ Nháp đã In BC ĐNTT + Tạo UNC → Khôi phục.
4. `DriveApp.File.moveTo` với thư mục Báo Cáo trên Shared Drive (nếu có).
5. Chế độ tối/in trên trình duyệt và điện thoại của người dùng.

## Cách chạy lại
```bash
node --test "tests/**/*.test.mjs"
NODE_PATH=$(npm root -g) node --test tests/ui/giaoDien.ui.mjs
```
