# FLOW — Luồng nghiệp vụ (v2026.9.7)

## 1. Vòng đời 1 hồ sơ ĐNTT

```
 [Tạo Mới]  createNewPaymentRequest_          (Kế toán, trong sysLock)
    │  kiểm tra: phiếu có trong sổ chốt? đang bị Nháp khác giữ? còn chưa TT?
    │  ghi: DNTT_GK_DN_DRAFT + CT_DRAFT (từng phiếu) + 112_DRAFT (placeholder)
    ▼
 Chưa ĐNTT ──[Đề Nghị Thanh Toán] runCreate112 ── tính Số tiền, lũy kế HĐ (sổ chốt + Nháp), điền Ngân hàng
    ▼
 Chờ ĐNTT  ── Sửa (updateDraft112Info_) / Thêm-Bớt phiếu / Xóa hồ sơ (sao lưu ChiTiet*) chỉ ở trạng thái này
    │ [Xác Nhận] runXacNhanDNTT_ (cảnh báo phiếu khác tên chủ rừng)
    ▼
 Đang ĐNTT ── [In BC ĐNTT] ghi ChiTietDNTT = N · [Tạo UNC] ghi ChiTietUNC (cảnh báo trùng) · [Về Chờ ĐNTT]
    │ [Duyệt] runConfirmPayment_(ids, ngàyTT)
    ▼
 Đã chốt (File Chính)
```

## 2. Duyệt — `runConfirmPayment_` (trong sysLock)

1. Đọc Nháp; lọc hồ sơ: có 112, Số tiền > 0, `Đang ĐNTT`.
2. **Chặn trả 2 lần**: bỏ hồ sơ có phiếu đã nằm trong sổ chốt của hồ sơ khác; bỏ **mọi** hồ sơ có phiếu xuất hiện ≥ 2 lần trong lượt (2026.9.7). Ghi `CHAN_TRA_HAI_LAN`.
3. Đọc tập ID đã có ở CT/112/Src (chạy lại an toàn).
4. Ghi thêm CT, 112 (bỏ ID đã có).
5. ChiTietDNTT N→Y (+ Ngày CK), tính bù hồ sơ chưa In BC → ghi MISA `Update_NganHang_DN` (loại trùng theo Số phiếu cân).
6. Chép “đơn xin” Nháp → DNTT_GK_DN (Đóng TT, Mã lần TT, Ngày Đóng TT, Y).
7. Khóa phiếu cân (`_khoaPhieuCanDaTra_`: Trạng thái OK, ID_DNTT `Đóng TT`, Chọn TT `Y` — theo cột W, mọi dòng).
8. Dọn Nháp (ghi đè trước, xóa đuôi sau).
9. Xóa cache CT/Src/112, công nợ; tính lại Phân tích cho các ngày TT vừa chốt.
Lỗi giữa chừng → `LOI_CHOT_THANH_TOAN`; bấm Duyệt lại cùng hồ sơ để hoàn tất (không trùng).

## 3. Sửa dữ liệu đã chốt

| Thao tác | Luồng | Hoàn tác |
|---|---|---|
| Mở Đóng TT (`webMoDongThanhToanTheoHoSo_`) | Tìm đúng 1 hồ sơ (Chủ rừng + Ngày Đóng TT + Lần TT) → tạo lại hồ sơ mới trong Nháp (Chờ ĐNTT) → sao lưu + xóa Src/CT/112/ChiTietDNTT/ChiTietUNC/MISA → mở khóa mọi dòng phiếu cân (cột W), Trạng thái “Test giá” → tính lại Phân tích | Khôi phục theo mã thao tác (từ chối nếu gây trả 2 lần) |
| Xóa mồ côi (Bảo trì) | Đọc lại mới nhất, xóa theo ID, sao lưu | Khôi phục |
| Đồng bộ tên KH | Sửa cột Khách hàng PhieuCan_DN theo CT (cột W, mọi dòng); nhật ký tên cũ → mới | Nhật ký |
| Vá ngân hàng 112 | Chỉ ô Ngân hàng đang trống, tra HD_STK | Nhật ký |
| Khôi phục (`webKhoiPhucSaoLuuXoa_`) | Ghi lại cuối sheet gốc; dòng về CT → kiểm tra trả 2 lần + khóa lại phiếu cân; đánh dấu “Đã khôi phục” | – |

## 4. Phiếu cân

```
 Nhập ở file Phiếu Cân (bên ngoài) ─► mirror "chưa TT" (10'/7:30/13:00/webhook)
   ─► chọn ở Tạo Mới/Sửa (gợi ý) ─► "giữ tạm" khi nằm trong CT_DRAFT
   ─► Duyệt: khóa (OK / Đóng TT / Y) ─► Mở Đóng TT: mở khóa (Test giá)
   ─► Khóa sổ năm: phiếu đã trả chuyển sang PhieuCan_DN_<năm>; phiếu chưa trả ở lại = công nợ đầu năm
```

## 5. Hợp đồng & ngân hàng
HD_NCC/HD_STK (file ngoài) → mirror “Đang Thực Hiện” → cache trình duyệt (`hak_bulk_ref_v1`, làm mới theo mốc 7:30/13:00) → Tạo Mới tra cục bộ. Tiến độ HĐ tính sẵn (`HopDongTienDo_DRAFT`). UNC: `runCreateUNCOnly_` tạo file Excel + `ChiTietUNC`. MISA: tự ghi khi Duyệt; “Tạo lại MISA/UNC” theo lô ở Hệ Thống.

## 6. Báo cáo
Báo cáo khoảng ngày chạm năm đã khóa sổ tự đọc `DATA<năm>` (+ `PhieuCan_DN_<năm>`); năm đang mở không mở file lưu trữ. Snapshot: xem `DATABASE.md` §1.

## 7. Log · Undo · Rollback · Recovery
- **Log**: `NhatKyThaoTac` (email thật), `SYS_HieuNang`, lỗi lập trình có mã.
- **Undo**: Về Chờ ĐNTT; Xóa hồ sơ Nháp; Mở Đóng TT.
- **Rollback**: Khôi phục theo lần xóa (`SYS_SaoLuuDongXoa`).
- **Recovery**: chạy lại Duyệt / Khóa sổ / Đồng bộ ChiTietDNTT / Tạo lại MISA-UNC đều bỏ qua phần đã làm; sự cố lớn: File › Lịch sử phiên bản của Google Sheets.

## 8. Đăng nhập
Người dùng → Cổng đăng nhập (chạy dưới quyền người dùng, lấy email) → ký HMAC (email, hạn 5', nonce, [mã yêu cầu khung nhúng]) → `doGet(?sso)` xác minh + tra `SYS_NguoiDung` → cấp phiên 6h → mọi lời gọi `api(phiên, …)`. Chi tiết: `SECURITY.md`.
