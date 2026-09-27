# DATABASE — Cấu trúc dữ liệu Google Sheets (v2026.9.7)

Hệ thống dùng Google Sheets làm cơ sở dữ liệu. Cột được đọc **theo vị trí** (quyết định H-01: cột các file nguồn cố định, không ai sửa trực tiếp; đổi cột PhieuCan_DN sẽ có cảnh báo ở Cài đặt). Chỉ số dưới đây: **0-based** (cột A = 0). `(T)` = cột phải giữ dạng chữ (số 0 đầu) — xem `COT_CHU`, `_lockTextCols_`.

## 1. File Nháp (script gắn liền, `SpreadsheetApp.getActive()`)

### DNTT_GK_DN_CT_DRAFT / DNTT_GK_DN_CT (File Chính) — 22 cột, 1 dòng = 1 phiếu cân của 1 hồ sơ
| # | Cột | Ghi chú |
|---|---|---|
| 0 | ID_CT (T) | `ID_KEY-STT` — khóa chính |
| 1 | ID_KEY (T) | Khóa ngoại → 112.A, Src.A (**mã hồ sơ**) |
| 2 | Timestamp | |
| 3 | Chủ rừng | |
| 4 | CCCD (T) | |
| 5 | Người ĐN | |
| 6 | Người nhận | |
| 7 | STK người nhận (T) | |
| 8 | KL Tổng nguồn (kg) | |
| 9 | DS Phiếu cân gốc | |
| 10 | STT | |
| 11 | Số phiếu cân (T) | Khóa ngoại → PhieuCan_DN cột W (`PC_COL.SO_CT`). **Duy nhất trong sổ chốt** (chặn trả 2 lần) |
| 12 | KL Tấn | |
| 13–15 | Đơn giá áp dụng · Giảm giá · Đơn giá cộng | từ Phiếu Cân |
| 16 | Thành tiền | |
| 17 | Trạng thái giá | |
| 18 | Đã chốt (Y/N) | |
| 19 | Số HĐ (T) | Khóa ngoại → HD_NCC |
| 20 | Ngày CK/TT | Date 12:00 trưa giờ VN (`_ngayVNTruaThat_`) — căn cứ khóa sổ năm |
| 21 | Ngày Đề Nghị | |

### DNTT_GK_DN_112_DRAFT (24 cột) / DNTT_GK_DN_112 (23 cột) — 1 dòng = 1 hồ sơ
0 ID_KEY (T) · 1 Timestamp · 2 Chủ rừng · 3 Người nhận · 4 Ngân hàng · 5 STK (T) · 6 **Số tiền** · 7 Nội dung CK · 8 Số HĐ (T) · 9 Ngày HĐ · 10 Ủy quyền · 11 KL Tổng (kg) · 12 SL HĐ lũy kế · 13 Đã trả · 14 Còn lại · 15 Ghi chú (diễn giải) · 16 Ngày ĐN · 17 SL HĐ dự kiến · 18 **Lần TT** · 19 Ngày dự kiến TT · 20 Đã chốt (Y/N) · 21 Đủ ĐK TT · 22 ID_112 (T) · 23 **Trạng Thái ĐNTT** (chỉ Nháp: `""` = Chờ, `"Đang ĐNTT"`).

Trạng thái hiển thị: Số tiền ≤ 0 → *Chưa ĐNTT*; > 0 và cột 23 rỗng → *Chờ ĐNTT*; `Đang ĐNTT` → chờ Duyệt.

### DNTT_GK_DN_DRAFT / DNTT_GK_DN (18 cột) — “đơn xin”
0 ID_KEY (T) · 1 Timestamp · 2 Email · 3 Chủ rừng · 4 CCCD (T) · 5 Người đề nghị · 6 Ủy quyền · 7 Người nhận · 8 STK (T) · 9 KL Tổng · 10 DS phiếu cân · 11 Ngày ĐN · 12 ID_112 · 13 Số HĐ (T) · 14 Trạng thái (`Đóng TT`) · 15 Mã Lần TT (`yyyyMMdd_lần`) · 16 Ngày Đóng TT · 17 Đã xử lý (Y).

### Mirror / snapshot (tự dựng lại — xóa được, hệ thống tự nạp lại)
| Sheet | Nội dung | Làm mới |
|---|---|---|
| `PhieuCan_DN_CHUA_TT_DRAFT` | Phiếu cân chưa thanh toán (20/28 cột dùng) | 10 phút, 7:30/13:00, nút Làm mới, sau Duyệt (bỏ phiếu vừa trả) |
| `HD_NCC_DRAFT` (8 cột), `HD_STK_DRAFT` (6 cột) | Hợp đồng “Đang Thực Hiện” | như trên |
| `HopDongTienDo_DRAFT` (12 cột) | Tiến độ + công nợ theo HĐ | 7:30/13:00 |
| `CongNoKhachHang_DRAFT` (11 cột) | Công nợ theo CCCD + tên, khoảng mặc định 90 ngày | 7:30/13:00 |
| `PhanTichNhapTT_DRAFT` (Ngày·Loại·PhanLoai·Ten·KL·GiaTri) | Dạng dài, pivot khi xem | 15h, tự bù ngày thiếu |
| `ChiTietCongNoPhieuCan_DRAFT` (15 cột) | Phiếu chưa TT đến hôm qua | 15h |
| `SYS_HieuNang` | Thời gian · Chức năng · Số giây · Người dùng · Kết quả · Ghi chú (giữ 5.000 dòng) | mỗi lần chạy ≥ 3 giây |

## 2. File Chính (`MAIN_SS_ID`)

| Sheet | Cột chính | Ghi chú |
|---|---|---|
| DNTT_GK_DN / _CT / _112 | như trên | Sổ đã chốt (chỉ ghi khi Duyệt; sửa qua Mở Đóng TT / Bảo trì) |
| `ChiTietDNTT` (28) | 0 ID Hệ Thống · 1 Lần TT · 2 Số phiếu cân · 3 Ngày CK · … · 21 Thành tiền · 23 Ngân hàng · 24 STK · 26 Trạng thái **N/Y** · 27 Ngày ghi | N khi In BC ĐNTT, Y khi Duyệt |
| `ChiTietUNC` (18) | 0 ID Hệ Thống · … · 7 Số tiền · 12 Ngày hiệu lực · 13 Người tạo · 14 Thời gian tạo · 15 Link file · 16 Chủ rừng · 17 Số HĐ | Mỗi lần Tạo UNC |
| `NhatKyThaoTac` (5) | Thời gian · Người thực hiện · Hành động · Mã hồ sơ · Chi tiết | Mọi thao tác quan trọng |
| `SYS_SaoLuuDongXoa` (10) | Thời gian · Người · Hành động · File · Sheet · Dòng gốc · Dữ liệu JSON · File ID · Mã thao tác · Đã khôi phục | Mọi dòng bị xóa |
| `SYS_NguoiDung` (6) | Email · Họ tên · Vai trò (ADMIN/KE_TOAN_TONG_HOP/KE_TOAN/XEM) · Trạng thái (Hoạt động/Khóa) · Cập nhật lúc · bởi | Cache 60 giây |
| `Lanthanhtoan` (5) | Mã phiên · Từ giờ · Đến giờ · Lần · Số ngày cộng | Tính “Lần TT” theo giờ tạo |
| `Thông Số` | Bảng tra cứu cấu hình | Sinh bằng nút |

## 3. File ngoài

| File / Sheet | Cột dùng (0-based) |
|---|---|
| Phiếu Cân / `PhieuCan_DN` (28) | `PC_COL`: 0 Số phiếu · 1 Ngày cân 1 · 2 Giờ cân 1 · 4 Giờ cân 2 · 5 Biển số · 7 Cân lần 1 · 8 Cân lần 2 · 9 KL kg · 11 Khách hàng · 12 Mặt hàng · 13 Đại lý · 14 Nguồn gốc · 17 Giảm giá · 19 Đơn giá AD · **22 Số CT (khóa)** · 23 Đơn giá TC · 24 Trạng thái · 25 Thành tiền · 26 ID_DNTT (`Đóng TT`) · 27 Chọn TT (`Y`) |
| Phiếu Cân / `PhieuCan_DN_<năm>` | Cùng cấu trúc — phiếu đã trả của năm đã khóa sổ |
| Hợp Đồng / `HD_NCC` (31) | `HDNCC_SRC_COL`: 2 Số HĐ · 3 Ngày ký · 4 Họ tên · 6 CCCD · 10 Người UQ · 24 Ủy quyền TT · 25 SL dự kiến · 30 Tình trạng |
| Hợp Đồng / `HD_STK` | `HDSTK_SRC_COL`: 2 Họ tên · 3 CCCD · 4 Người UQ · 5 STK · 6 Ngân hàng · 8 Số HĐ |
| Hợp Đồng / `DM_NG` | B Mã NG · C Tên NG |
| Update NH / `Update_NganHang_DN` (33) | 2–3 Ngày hạch toán/chứng từ · 4 Số phiếu cân (khóa loại trùng) · 5–7 TK/NH/Mã NH công ty · 8 Nội dung · 9 CCCD · 10 Họ tên · 11 Địa chỉ · 12 STK · 13 NH · 14 Thụ hưởng · 15 CCCD thụ hưởng · 19 VND · 21 Diễn giải · 22 TK Nợ `33111` · 23 TK Có `1121` · 24 Thành tiền · 32 Số HĐ |
| Danh Mục NH / `UNC_NGANHANG_HAK` | B Tên đầy đủ · C Tên ngắn (tra khi tạo UNC) |
| `DATA<năm>` | Bản sao 5 sheet sổ của năm đã khóa sổ (giữ tên sheet) |

## 4. Script Properties (cấu hình)

| Khóa | Ý nghĩa |
|---|---|
| `MAIN_SS_ID`, `PC_SS_ID`, `HD_SS_ID`, `UPDATE_NH_SS_ID`, `DM_NH_SS_ID`, `REPORT_FOLDER_ID` | Link file/thư mục (đổi ở Cài đặt) |
| `REGION_LOCALE`, `EXPORT_REGION_LOCALE` | VN / US |
| `MISA_COMPANY_BANK_*`, `UNC_*` | Mặc định MISA / UNC |
| `SSO_SECRET`, `SSO_GATEWAY_URL` | Bí mật (không chia sẻ). `WEBHOOK_SECRET` (bản ≤ 2026.9.8) không còn dùng — xóa được |
| `GEMINI_API_KEY`, `GEMINI_MODELS`, `GEMINI_MODEL` | Trợ lý AI |
| `TRIGGER_15H_HOUR/MINUTE` | Giờ trigger 15h |
| `LUU_TRU_NAM`, `KHOA_SO_DANG_LAM` | Khóa sổ năm (JSON {năm: ID}) |
| `CONGNO_CACHE_*`, `HDTIENDO_CONGNO_*`, `CTCN_SNAPSHOT_DATE`, `TRANG_CHU_CONG_NO`, `PHANTICH_CAP_NHAT_LUC` | Meta snapshot |
| `PC_HEADER_CHUAN/MOI` | Cảnh báo cấu trúc cột Phiếu Cân |
| `HN_TRIGGER_DANG_CHAY_<tên>` | Dấu trigger đang chạy (phát hiện quá giờ) |

## 5. Toàn vẹn dữ liệu — quy tắc

1. Không ghi đè cả sheet; chỉ ghi đúng ô/dòng (`_ghiTheoDong_`, `_ghiCungGiaTri_`).
2. Mọi xóa đều sao lưu trước (`_saoLuuVaXoaDong_`) — khôi phục ở Hệ Thống.
3. 1 phiếu cân chỉ được trả 1 lần: kiểm tra sổ chốt thật (Tạo mới/Thêm/Duyệt/Khôi phục) **và** trùng trong lượt Duyệt (2026.9.7).
4. Chữ số giữ số 0 đầu: `_chu_`, `_dongAnToan_(rows, COT_CHU.*)`; chống công thức: `_oAnToan_`.
5. Cache chỉ để gợi ý — quyết định “còn trả được không” luôn đọc sổ thật.
