# Rà soát toàn vẹn dữ liệu DNTT — 03/10/2026 (bản tham chiếu `main` 2026.9.54, sửa ở 2026.9.55)

Chuỗi kiểm tra: Phiếu Cân → đơn xin (DNTT_GK_DN_DRAFT → DNTT_GK_DN) → CT (Nháp → DNTT_GK_DN_CT) → 112 (Nháp → DNTT_GK_DN_112) → Duyệt. ChiTietDNTT là bảng con theo từng phiếu (N lúc In, Y lúc Duyệt).

## A. Đã có trước 2026.9.55 (giữ nguyên)
| Kiểm soát | Ở đâu |
|---|---|
| Tiền 112 ≠ tổng Thành tiền CT (> 1đ) thì chặn (2026.9.44) | Xác nhận, In, UNC, Duyệt |
| Phiếu đã chốt ở hồ sơ khác (đọc thẳng CT thật) | Tạo mới, Thêm, Duyệt |
| Phiếu trùng trong cùng lượt Duyệt | Duyệt |
| Phiếu đang ở hồ sơ Nháp khác | Tạo mới, Thêm |
| Khóa hệ thống (LockService) cho mọi thao tác ghi | Toàn bộ |
| Duyệt chạy lại không ghi trùng (bỏ qua hồ sơ đã có trong CT / 112 thật) | Duyệt |
| Dấu lượt Duyệt dở + Hoàn tất (2026.9.49); dọn Nháp sau cùng | Duyệt |
| Máy chủ tự đọc KL / tiền từ Phiếu Cân, không tin trình duyệt | Tạo mới, Thêm |
| ChiTietDNTT đổi Y theo đúng phiếu thật (2026.9.54) | Duyệt |

## B. Lỗi đã sửa ở các bản trước (không sửa lại)
B-01 tự tính tiền (2026.9.44 chặn, 2026.9.49 tự tính); dòng N cũ thành Y (2026.9.54); mã hồ sơ thành số (2026.9.53).

## C. Nguyên nhân gốc
| # | Nguyên nhân | Mức | Ca thực tế |
|---|---|---|---|
| C1 | Thêm phiếu: ID_CT = số dòng + 1 → bỏ 1 phiếu rồi thêm ra mã trùng; Bỏ phiếu xóa mọi dòng cùng mã; Duyệt không chặn | CONFIRMED (dựng lại được) | f94f41a3-2 |
| C2 | Đơn xin chỉ ghi DS phiếu / KL lúc Tạo mới; Thêm / Bỏ / Mở Đóng TT không cập nhật; Duyệt chép nguyên vào DNTT_GK_DN | CONFIRMED (dựng lại được) | a0e8c1c2 (LIKELY - lệch đúng 31.330 kg = 2 phiếu chuyển đi), 9636702c (NEEDS MORE EVIDENCE - có thể là phiếu Thêm sau, hợp lệ) |
| C3 | Lệch 1.000đ CT / 112 ở sổ đã chốt: Duyệt hiện chặn > 1đ → nhiều khả năng hồ sơ chốt trước 2026.9.44 | LIKELY | cần mã hồ sơ + nhật ký |
| C4 | Cùng phiếu chọn 2 lần trong 1 lần Tạo mới; Duyệt không đọc lại giá Phiếu Cân | Rủi ro tiềm ẩn | - |

Làm tròn: Số tiền 112 = cộng thẳng Thành tiền từng phiếu (đã có trên Phiếu Cân); không có bước làm tròn nghiệp vụ. Sai số 1đ / 0,5 kg chỉ là sai số cộng số thực.

## D. Bổ sung ở 2026.9.55
| Rule | Trước | Sau |
|---|---|---|
| R1 ID_CT duy nhất | Không | `_sttKeTiep_`, Bỏ phiếu xóa đúng 1 dòng, gate `DUPLICATE_ID_CT` |
| R2 Phiếu không trả 2 lần | Gần đủ | + chọn trùng lúc Tạo mới, gate `DUPLICATE_TICKET` toàn File Nháp |
| R3/R6/R7 Tập phiếu đơn xin = CT | Không | `_dongBoDonXinNhap_` (gốc) + gate `MISSING_CT` / `ORPHAN_CT` |
| R4 KG | Một phần | gate `KG_MISMATCH` (Phiếu Cân = đơn xin = CT) |
| Giá Phiếu Cân đổi | Không | gate `PRICE_CHANGED`, cảnh báo Danh Sách / Chi tiết, Tính lại lấy giá mới (hồ sơ Chờ xác nhận) |
| R5 Tiền | Có | giữ, `AMOUNT_MISMATCH` trong gate |
| R8 Chủ phiếu | Một phần | `WRONG_OWNER` chỉ CẢNH BÁO theo yêu cầu người dùng (CT Nháp, CT đã chốt, ChiTietDNTT Y) |
| KL hợp đồng | Không | `VUOT_SL_HD` chặn: đã thanh toán + Nháp > SL HĐ dự kiến |
| R9 Không chốt 2 lần | Có | giữ + test |
| R10 Không chốt dở | Gần đủ | kiểm lại sổ chính trước khi dọn Nháp |
| Health Check | 8 mục | + 3 mục toàn vẹn sổ đã chốt + CSV, chỉ đọc |
| Audit log | Một phần | `CHAN_TOAN_VEN`, `DONG_BO_DON_XIN`, `CAP_NHAT_GIA_PHIEU_CAN`, `LOI_KIEM_LAI_SAU_CHOT` |

## E. Ảnh hưởng
Không đổi cấu trúc sheet. Chỉ ghi lại cột J/K của đơn xin Nháp + cột I/J của CT Nháp khi tính lại; sổ đã chốt không bị sửa. Hiệu năng: Duyệt đọc thêm cột Số phiếu của ChiTietDNTT + đúng dòng liên quan; Phiếu Cân đã được đọc sẵn trong lượt. Danh Sách ĐNTT / Xác nhận / In / UNC đọc Phiếu Cân qua bộ nhớ đệm 90 giây.

## F. Việc còn lại
Gửi mã hồ sơ + nhật ký (NhatKyThaoTac) của ca lệch 1.000đ và 9636702c để xác nhận nguyên nhân dữ liệu cũ; dọn sổ đã chốt theo báo cáo Bảo Trì (có xác nhận, từng hồ sơ).
