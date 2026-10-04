# Đo hiệu năng web app (27/09/2026, v2026.9.6)

## Cách đo

1. **Khối lượng dữ liệu mỗi chức năng** — chạy toàn bộ code trên bộ giả lập Google Sheets
   (`tests/gas/mock.mjs`) với dữ liệu cỡ **1 năm**: 15.000 phiếu cân, 12.000 dòng CT,
   2.400 hồ sơ 112, 3.000 hợp đồng, 150 hồ sơ Nháp; bộ nhớ đệm để trống (lần mở đầu).
   Đếm số lần mở file, số ô đọc / ghi, số lệnh gọi sheet, số lần xóa dòng. Trên Google
   thật, thời gian chạy tỉ lệ chủ yếu với các con số này (đọc/ghi file khác qua mạng).
   Thời gian đo trên giả lập **không** phải thời gian thật.
2. **Thời gian thật** — từ bản này hệ thống tự ghi mọi lần chạy ≥ 3 giây (web app và
   3 trigger) cùng các lần Google dừng vì quá 6 phút vào `SYS_HieuNang` (File Nháp);
   xem ở **Hệ Thống › ⏱️ Hiệu Năng**.

## Kết quả (dữ liệu 1 năm, sau khi tối ưu Duyệt ở bản này)

| Chức năng | Mở file | Đọc (ô) | Ghi (ô) | Ghi chú cách chạy |
|---|---|---|---|---|
| Trigger 7:30 / 13:00 | 12 | 1,56 triệu | 165 nghìn | Làm mới bản sao phiếu cân chưa TT + hợp đồng, tiến độ HĐ (cả sổ CT + 112), công nợ KH (Phiếu Cân + CT + HĐ). Chạy nền |
| Trigger 15h | 4 | 0,89 triệu | 45 nghìn | Phân tích Nhập/TT + chi tiết công nợ phiếu cân hôm qua. Chạy nền |
| **Duyệt 1 hồ sơ** | 6 | **0,82 triệu** (trước: 1,44 triệu) | 101 nghìn | Đọc sổ CT (chặn trả 2 lần), Phiếu Cân (tính bù ChiTietDNTT, khóa phiếu), cập nhật Phân Tích ngày TT |
| Bảo trì kiểm tra 4 sheet | 5 | 0,72 triệu | 0 | Đối chiếu Nguồn / CT / 112 / Phiếu Cân |
| Công nợ KH, Sổ chi tiết, Công nợ phiếu cân ngày khác, Tình hình TT, Phân tích, Đối soát tên | 2 | 0,62–0,64 triệu | 0–45 nghìn | Mỗi cái đọc toàn bộ Phiếu Cân + sổ CT một lần |
| Làm mới 10 phút | 5 | 0,48 triệu | 112 nghìn | Bản sao phiếu cân chưa TT + hợp đồng. Chạy nền |
| Công nợ HĐ (khoảng khác mặc định) | 3 | 0,37 triệu | 24 nghìn | Sổ CT + 112 mọi năm |
| Tổng hợp 112 | 2 | 0,31 triệu | 4 nghìn | |
| Duyệt 1 hồ sơ (2026.9.34) | 3 | 1,41 triệu (9.27: 2,91 triệu) | 18 nghìn (9.27: 298 nghìn) | Đọc Phiếu Cân + sổ CT 1 lần; ChiTietDNTT / bản sao chưa TT chỉ dòng liên quan |
| Trigger 7:30 / 15h (2026.9.34) | 6 / 2 | 1,54 / 1,16 triệu (9.27: 2,70 / 2,32 triệu) | 387 / 151 nghìn | Mỗi sổ đọc 1 lần trong lượt dù không vừa bộ nhớ đệm |
| Xuất Báo Cáo TT 1.648 hồ sơ (2026.9.32) | 1 | 370 nghìn | file mới | 169 lời gọi Google, không tăng theo số hồ sơ (9.27: 1.790) |
| Báo cáo Chi Tiết xem 7 ngày / xuất 3 tháng (2026.9.32) | 0 | 37 / 205 nghìn | file mới | Chỉ đọc dòng ChiTietDNTT có Ngày CK trong khoảng (9.27: 560 nghìn ô mỗi lần) |
| Xuất Báo Cáo TT 30 hồ sơ (2026.9.29) | 1 | 57 nghìn (trước: 1,16 triệu) | file mới | Chỉ đọc dòng CT của hồ sơ chọn + phiếu cân của chúng (đo trên 30.000 phiếu / 20.000 dòng CT) |
| Báo cáo MISA (2026.9.29) | 2 | 58 nghìn (trước: 0,44 triệu) | 0 | Chỉ đọc dòng CT có Ngày CK trong khoảng (cùng bộ dữ liệu) |
| Chọn phiếu cân (Tạo mới) | 1 | 97 nghìn | 0 | Đọc bản sao "chưa TT" ở File Nháp |
| Báo cáo thanh toán 3 tháng | 1 | 53 nghìn | 0 | Đọc từ cuối sheet 112, dừng sớm |
| Trang chủ, Danh sách ĐNTT | 0 | 17 nghìn | 0 | Chỉ File Nháp + bản tổng hợp |

- Không chức năng nào tiến gần giới hạn 6 phút với dữ liệu 1 năm. Các thao tác theo lô
  (Khóa sổ năm, Đồng bộ ChiTietDNTT, Tạo lại MISA/UNC) tự dừng trước giới hạn và cho chạy tiếp.
- Với dữ liệu ~3 năm chưa khóa sổ (40.000 phiếu), Phiếu Cân vượt trần bộ nhớ đệm (3,6 MB)
  nên mỗi lần dùng đều đọc lại file: Duyệt ~3,1 triệu ô, trigger 7:30 ~3,9 triệu ô. Khóa sổ
  năm giữ PhieuCan_DN ở cỡ 1 năm.

## Đã tối ưu trong bản này
- **Duyệt**: bỏ lượt đọc lại toàn bộ Phiếu Cân và sổ CT khi cập nhật Phân Tích ngày TT
  (dùng dữ liệu vừa đọc ở đầu lượt Duyệt) — 1,44 → 0,82 triệu ô. Test đối chiếu số liệu
  Phân Tích với tính lại từ đầu.

## 2026.9.56 - tối ưu theo số đo thật (SYS_HieuNang 27/09-03/10)

Số đo thật 7 ngày (lượt bị ghi chậm): trigger 10 phút 403 lượt × 14,2 s; Tạo mới 194 lượt × 14,6 s; Làm mới cache 37 s; Duyệt 52 s; Báo cáo MISA 23,6 s. Đo lại bằng `tests/perf/doHieuNang.mjs`, sổ 1 năm, không bộ nhớ đệm (như thực tế):

| Thao tác | Trước (lượt / ô đọc) | Sau | Giảm |
|---|---|---|---|
| Trigger 10 phút | 6 / 253k | 7 / 71k (0 khi file nguồn không đổi) | 72% |
| Danh Sách ĐNTT | 9 / 441k | 10 / 68k | 85% |
| Tạo mới hồ sơ | 46 / 287k | 20 / 112k | 61% |
| Tính lại số tiền | 39 / 278k | 13 / 73k | 74% |
| Xác nhận 5 hồ sơ | 12 / 442k | 15 / 79k | 82% |
| In Báo Cáo ĐNTT 5 hồ sơ | 30 / 482k | 31 / 109k | 77% |
| Duyệt 5 hồ sơ | 42 / 704k | 48 / 226k | 68% |
| Báo cáo MISA 1 tháng | 7 / 357k | 8 / 123k | 66% |
| Trang chủ (có tính Phân Tích hôm nay) | 16 / 441k | 25 / 143k | 68% |

Nguyên nhân chung: đọc cả sheet (mọi cột, mọi dòng) trong khi chỉ cần vài cột hoặc vài chục dòng; bản đủ cột của sổ CT / Phiếu Cân 1 năm gần chạm hoặc vượt giới hạn bộ nhớ đệm và chỉ giữ 90 giây. Test `hieuNang2026_9_56.test.mjs`: kết quả giống hệt cách đọc cũ + giới hạn số ô đọc (7/7 thất bại trên bản 2026.9.55).
