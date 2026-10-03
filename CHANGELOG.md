# CHANGELOG

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/). Phiên bản theo `NĂM.ĐỢT.SỬA`; thay đổi làm đổi hành vi nghiệp vụ (⚖️) sẽ tăng số ĐỢT và ghi rõ đã được người dùng đồng ý.

## [2026.9.55] — Kiểm soát toàn vẹn dữ liệu thanh toán (Integrity Gate) (người dùng đồng ý 03/10/2026: "làm cả 2 và có cảnh báo giá phiếu cân thay đổi")

Rà soát chuỗi Phiếu Cân → đơn xin (DNTT_GK_DN) → CT → 112 → Duyệt theo các sai lệch phát hiện trong dữ liệu thật (a0e8c1c2, f94f41a3, 9636702c, lệch 1.000đ). Hai lỗi gốc CÒN trên bản 2026.9.54 đã dựng lại được và sửa; chốt chặn có sẵn (khóa hệ thống, chặn trả 2 lần, Duyệt chạy lại không ghi trùng, lệch tiền 112/CT) giữ nguyên.

### Fixed
- **ID_CT bị trùng (f94f41a3-2)**: Thêm phiếu đặt mã dòng = số dòng + 1 → hồ sơ có -1, -2, bỏ -1 rồi Thêm phiếu ra lại -2. Nay = STT lớn nhất + 1. **Bỏ phiếu** trước đây xóa MỌI dòng cùng mã (bỏ 1 phiếu mất cả 2, có khi mất cả hồ sơ) → nay xóa đúng 1 dòng (theo mã + số phiếu), từ chối nếu không xác định được.
- ⚖️ **Đơn xin không theo phiếu thật (a0e8c1c2, 9636702c)**: cột KL Tổng / DS Phiếu cân gốc của đơn xin (và cột I/J của dòng CT) chỉ ghi lúc Tạo mới - Thêm / Bỏ phiếu, Mở Đóng TT không sửa, Duyệt chép nguyên vào DNTT_GK_DN: đơn xin còn ghi phiếu đã chuyển sang hồ sơ khác (lệch đúng KL các phiếu đó) hoặc thiếu phiếu Thêm sau. Nay mỗi lần hệ thống tính lại tiền (Tạo / Thêm / Bỏ / Mở Đóng TT / 🔄 Tính lại) đơn xin **Nháp** tự cập nhật theo phiếu trong CT, có nhật ký `DONG_BO_DON_XIN` (trước → sau). Sổ đã chốt không bị sửa.
- Tạo mới chặn 1 phiếu cân được chọn 2 lần trong cùng hồ sơ.

### Added
- **Integrity Gate** `_kiemTraToanVenHoSo_` (1 hàm dùng chung, đọc theo lô, Map/Set O(N), không tự sửa dữ liệu) chặn ở **Xác nhận, In Báo Cáo ĐNTT, Tạo UNC, Duyệt** với mã lỗi: `DUPLICATE_ID_CT`, `DUPLICATE_TICKET` (phiếu ở 2 hồ sơ / đã trả ở hồ sơ khác), `MISSING_CT` / `ORPHAN_CT` (tập phiếu đơn xin ≠ CT), `KG_MISMATCH` (KG Phiếu Cân = đơn xin = CT), `PRICE_CHANGED`, `AMOUNT_MISMATCH`, `VUOT_SL_HD`. Duyệt kiểm tra đầy đủ nhất (đọc Phiếu Cân không qua bộ nhớ đệm, ChiTietDNTT chỉ các dòng của phiếu liên quan). Thông báo cụ thể từng hồ sơ, từng phiếu; mỗi lần chặn ghi nhật ký `CHAN_TOAN_VEN` (mã lỗi, phiếu, KG Phiếu Cân / đơn xin / CT, tiền CT / 112).
- ⚖️ **Chặn vượt khối lượng hợp đồng** (`VUOT_SL_HD`, người dùng yêu cầu 03/10/2026): KL đã thanh toán của hợp đồng (sổ CT đã chốt) + KL đang đề nghị ở MỌI hồ sơ Nháp cùng hợp đồng > SL HĐ dự kiến (cột R sổ 112) → chặn Xác nhận / In / UNC / Duyệt, báo rõ SL HĐ, đã trả, Nháp (hồ sơ nào), vượt bao nhiêu tấn. Hợp đồng chưa khai báo SL (= 0): chỉ cảnh báo trong Chi tiết hồ sơ (`SL_HD_CHUA_KHAI`). Lưu ý: "đã thanh toán" tính trên sổ đang mở (như cột Đã trả của Ghi chú 112), không gồm năm đã khóa sổ sang file lưu trữ.
- ⚖️ **Sai chủ phiếu chỉ cảnh báo** (`WRONG_OWNER`, người dùng yêu cầu 03/10/2026 "sai chủ chỉ cảnh báo, KG chặn"): đơn xin ghi phiếu đang thuộc hồ sơ khác (theo CT Nháp, CT đã chốt, ChiTietDNTT đã trả) → cảnh báo ở Danh Sách (nhãn vàng), Chi tiết (khung cam) và thông báo các bước, ghi nhật ký `CANH_BAO_TOAN_VEN` - **không chặn**. Phiếu sai chủ không tính là "thiếu CT"; KG của chúng được trừ khỏi KG đơn xin khi so - lệch KG còn lại vẫn **chặn** (`KG_MISMATCH`).
- ⚖️ **Cảnh báo giá phiếu cân thay đổi**: Phiếu Cân sửa KL / giá sau khi lập hồ sơ → Danh Sách ĐNTT hiện "⚠️ Giá phiếu cân đã đổi" (rê chuột xem cũ → mới), Chi tiết hồ sơ hiện khung đỏ, 4 bước trên bị chặn. **🔄 Tính lại số tiền** lấy giá / KL mới cho hồ sơ "Chờ xác nhận" (nhật ký `CAP_NHAT_GIA_PHIEU_CAN`); hồ sơ đã Xác nhận (có thể đã in / tạo UNC) không tự đổi - phải "Về Chờ xác nhận" trước.
- Duyệt **kiểm lại sổ chính** (đủ dòng CT theo ID_CT và dòng 112) trước khi dọn File Nháp; thiếu thì dừng, giữ Nháp + dấu lượt Duyệt dở (nhật ký `LOI_KIEM_LAI_SAU_CHOT`).
- **Bảo Trì** thêm 3 mục toàn vẹn sổ đã chốt (chỉ đọc, không có nút xóa): ID_CT trùng / phiếu thuộc nhiều hồ sơ; đơn xin lệch phiếu / KG (WRONG_OWNER, MISSING_CT, ORPHAN_CT, KG_MISMATCH); chốt dở dang (PARTIAL_COMMIT, ORPHAN_112, MISSING_112) + nút **📥 Tải báo cáo toàn vẹn đầy đủ (CSV)** (ID_KEY, Mã lỗi, Mức độ, Phiếu cân, DNTT KG, CT KG, CT tiền, 112 tiền, Ghi chú). Kiểm tra hằng đêm báo cả 3 mục.

### Quy tắc làm tròn (ghi rõ)
- Số tiền 112 = cộng thẳng Thành tiền từng phiếu (Thành tiền có sẵn trên Phiếu Cân) - **không có bước làm tròn nghiệp vụ nào**. Sai số 1đ (tiền) / 0,5 kg (KL) chỉ để bỏ qua sai số cộng số thực. Lệch 1.000đ trong sổ đã chốt nhiều khả năng là hồ sơ chốt trước 2026.9.44 (Thêm / Bỏ phiếu không tính lại) - Bảo Trì mục "Tổng tiền 112 LỆCH" liệt kê; cần mã hồ sơ + nhật ký để xác nhận.

### Xử lý dữ liệu cũ
- Hồ sơ **Nháp**: lần tính lại kế tiếp tự cập nhật đơn xin. Hồ sơ Nháp có ID_CT trùng: mở Chi tiết, Xóa đúng phiếu của dòng trùng rồi Thêm lại (mã mới).
- Sổ **đã chốt**: Hệ Thống › Bảo Trì › Chạy Kiểm Tra → xem 3 mục mới / tải CSV. Không tự sửa - sửa từng hồ sơ có xác nhận (Mở Đóng TT nếu cần).

### Tests
- 296 test (thêm `toanVen2026_9_55.test.mjs` 16 test: 12 trường hợp yêu cầu + hồi quy a0e8c1c2 (sai chủ = cảnh báo) / f94f41a3 / 9636702c + cảnh báo giá + vượt SL hợp đồng + Bảo Trì chỉ đọc). Trên Code.gs 2026.9.54: 12/15 thất bại; 3 ca đạt cả bản cũ là chốt chặn đã có (bấm Duyệt 2 lần, Duyệt đồng thời, ghi 112 lỗi giữa chừng).

## [2026.9.54] — Bỏ phiếu cân / Duyệt giữ ChiTietDNTT khớp phiếu thật (người dùng báo 03/10/2026)

### Fixed
- **Bảo Trì báo “ChiTietDNTT: dòng N nhưng hồ sơ không còn trong File Nháp”** (hồ sơ 96c36b58, phiếu 10034/2026/NK). Nguyên nhân: hồ sơ đã In Báo Cáo ĐNTT (ghi dòng N), sau đó Về Chờ xác nhận và **bỏ phiếu cân cuối cùng** - hồ sơ tự xóa khỏi Nháp nhưng dòng N (cùng đơn xin Nháp và lịch sử UNC) ở lại. Nay bỏ phiếu cuối dọn đúng như **Xóa hồ sơ**; bỏ 1 phiếu khi hồ sơ còn phiếu khác thì xóa dòng N của đúng phiếu đó. Dòng bị xóa đều sao lưu, khôi phục được ở Hệ Thống.
- ⚖️ **Duyệt**: trước đây đổi MỌI dòng N của hồ sơ thành Y - phiếu đã bỏ sau khi In vẫn thành Y, vào **MISA và Báo cáo Thanh toán như đã trả**; phiếu Thêm sau khi In thì không được tính bù (thiếu dòng, thiếu MISA). Nay so theo từng phiếu: chỉ phiếu thật đang chốt thành Y, dòng N thừa bị xóa (sao lưu), phiếu thiếu được tính bù.
- Dọn dẹp chỉ đọc cột mã hồ sơ rồi đúng các dòng khớp (`_saoLuuVaXoaDongTheoKhoa_`), không đọc cả ChiTietDNTT / ChiTietUNC.

### Xử lý dữ liệu cũ
- Dòng mồ côi đang có: Hệ Thống › Bảo Trì › tích dòng ở mục “ChiTietDNTT: dòng N nhưng hồ sơ không còn trong File Nháp” › Xóa (an toàn - hồ sơ chưa từng Duyệt).
- Nếu trước đây đã Duyệt hồ sơ có phiếu bỏ sau khi In: Bảo Trì mục “ChiTietDNTT Y mồ côi” sẽ liệt kê; dòng MISA tương ứng dọn ở Hệ Thống › Dọn Dẹp MISA › Mồ côi.

## [2026.9.53] — Sửa lỗi mã hồ sơ mới có thể bị Sheets đổi thành số (rà soát 03/10/2026)

### Fixed
- Mã hồ sơ mới (8 ký tự ngẫu nhiên) đôi khi ra toàn chữ số (vd `00123456`) hoặc dạng số mũ (`12e45678`). Cột mã hồ sơ không khóa dạng chữ nên Google Sheets đổi thành SỐ khi ghi: mất số 0 đầu / thành số khổng lồ, hồ sơ vừa tạo không tìm lại được theo mã (chi tiết, sửa, xác nhận, UNC, Duyệt). Xảy ra ngẫu nhiên khoảng 1/70 lần Tạo mới / Mở Đóng TT. Nay mã luôn có ít nhất 1 chữ cái và không ở dạng số mũ (`_maKhongThanhSo_`); mã cũ đã có không đổi.
- Phát hiện khi kiểm tra main: bộ test thỉnh thoảng hỏng 1 test (Tạo mới không tìm lại được hồ sơ) đúng vì lỗi này - nay ổn định.

## [2026.9.52] — Ghi chú sổ 112 luôn có “SL HĐ” (người dùng yêu cầu 03/10/2026)

### Changed
- ⚖️ Cột **Ghi chú** của sổ **DNTT_GK_DN_112** mở đầu bằng **SL HĐ** (SL hợp đồng dự kiến - cột R) cho MỌI hồ sơ: `SL HĐ: 1.800,00 | Tổng KL: 1.691,11 | Đã trả: 1.678,50 | Còn lại: 12,61 | Đề nghị đợt này: 12,61 | Phiếu: 9877`. Trước đây không có mục này (sổ lẫn dòng cũ có “SL HĐ” với dòng mới không có). Hợp đồng chưa khai báo SL dự kiến hiện `SL HĐ: 0,00`.
- Bảng đề xuất (In Báo Cáo ĐNTT) tự in thành 3 dòng cân đối: “SL HĐ · Tổng KL”, “Đã trả · Còn lại”, “Đề nghị đợt này · Phiếu”; phiếu PDF và Diễn giải trên web có thêm dòng SL HĐ.
- Áp dụng cho hồ sơ Nháp ở lần tính tiền kế tiếp (Tạo / Thêm / Bỏ phiếu cân / 🔄 Tính lại số tiền); hồ sơ đã Duyệt giữ nguyên Ghi chú lúc chốt.

## [2026.9.51] — Làm lại giao diện chuyên nghiệp trên tông màu cũ (yêu cầu 29/09/2026)

### Changed
- **Khung ứng dụng**: giữ nguyên bảng màu cũ (thanh bên xám than `#1f2937`, xanh dương `#2563eb`, hổ phách `#b45309`, xanh lá `#16a34a`, nền `#f3f4f6`) và chế độ sáng / tối.
  - Thanh bên chia nhóm **Tổng quan / Nghiệp vụ / Báo cáo / Hỗ trợ & quản trị**; biểu tượng nét (SVG) thay biểu tượng cảm xúc; tên menu ngắn "Công Nợ Gỗ Keo" (rê chuột thấy tên đầy đủ); nhóm không còn trang nào được phép thì tự ẩn.
  - Ô Tìm nhanh có biểu tượng kính lúp + gợi ý phím `/`; thẻ người dùng có ảnh chữ cái đầu, vai trò, nút đăng xuất gọn.
  - Nút **‹ thu gọn thanh bên** (chỉ còn biểu tượng, nhớ trên máy). Máy tính bảng / điện thoại: thanh bên thành **ngăn kéo** mở bằng nút ☰ (bấm nền mờ / Esc / chọn trang để đóng) - trước đây menu dồn lên đầu trang.
  - Thanh tiêu đề nền trắng, có **đường dẫn** (vd "Báo cáo › Báo Cáo Thanh Toán"), bóng nhẹ khi cuộn; nội dung rộng tối đa 1680px.
- **Thành phần**: thẻ bo 12px, ô số liệu có vạch màu bên trái (xanh / hổ phách / đỏ); ô nhập nền trắng, viền xanh khi đang gõ; nút cao đều 36px (nhỏ 30px); bảng có dòng tiêu đề nền nhạt, dòng tổng nền nhạt; thanh tab dạng khối phân đoạn; hộp thoại bo 14px, chân hộp nền nhạt; thanh thao tác (hồ sơ đã chọn) nổi cách đáy 12px.
- **Trang chủ**: quy trình 5 bước → Hồ sơ đang xử lý → Tháng này → **Xu hướng 30 ngày và Công nợ đặt cạnh nhau (2 cột)** → Tuổi nợ (61-90 ngày hổ phách, trên 90 ngày đỏ) → Theo nguồn gốc / đại lý.
- **Danh Sách ĐNTT**: bảng gọn 8 cột, vừa màn hình 1366px không phải cuộn ngang - "HĐ · Ngày", "Chủ rừng / Người nhận", "STK / Ngân hàng" (tên ngân hàng dài rút gọn, rê chuột xem đủ), "KL (kg)" kèm số phiếu; khung lọc gọn 1 hàng, dòng quy trình chuyển vào khung lọc.

### Fixed
- Thanh "Đi nhanh" ở Cài đặt / Hướng dẫn bị xếp dọc giữa trang (quy tắc CSS `nav{...}` của thanh bên áp nhầm) - nay nằm ngang, xuống dòng khi hết chỗ.
- Cột Trạng thái của Danh Sách ĐNTT bị cột thao tác dính phải che mất ở màn hình 1366px.
- Điện thoại: thanh tiêu đề bị ép thấp, nút đè lên nội dung.
- Hàng nút cạnh ô ngày (Xem / Làm mới / 📥 Xuất Excel + PDF của Công nợ) xuống dòng khi hết chỗ, không tràn ra ngoài thẻ.

### Tests
- 271 test sau khi gộp main (thêm `giaoDien2026_9_51.test.mjs` 6 test; `clientAlign` chấp nhận tham số lớp màu của ô số liệu). Kiểm tra Chromium: 7 trang sáng / tối ở 1366px, thanh bên thu gọn, ngăn kéo điện thoại 390px (không cuộn ngang), hộp xác nhận.

## [2026.9.50] — Xuất Excel + PDF cho báo cáo Công nợ (người dùng yêu cầu 29/09/2026)

### Added
- **Báo Cáo Công Nợ › 1 · Công nợ theo Khách hàng, 2 · Công nợ theo Hợp đồng**: nút **📥 Xuất Excel + PDF** cạnh nút Xem. **3 · Sổ chi tiết công nợ**: nút cùng tên ở góc bảng (cả sổ theo Khách hàng và theo Hợp đồng). File lưu trong thư mục Báo cáo, cùng số liệu màn hình: tên đơn vị, tiêu đề, khoảng ngày, nguồn số liệu (“tổng hợp lúc …” hoặc “tính trực tiếp lúc …”), STT, dòng TỔNG CỘNG; ngày thật theo Vùng xuất, CCCD / Số HĐ / Số phiếu giữ số 0 đầu, số tiền `#,##0`, căn lề theo kiểu dữ liệu. PDF lỗi vẫn trả file Excel kèm hướng dẫn tải PDF.
- Cài đặt › cạnh nút **🌙 Bật kiểm tra dữ liệu hằng đêm**: ghi rõ email cảnh báo gửi tới Quản trị cố định + tài khoản vai trò Quản trị (thêm ở **👥 Người Dùng & Phân Quyền**), lần đầu cần cấp quyền gửi email.

### Changed
- Tạo PDF từ file báo cáo dùng chung `_luuPdfCuaFile_` (Báo cáo tổng hợp NG-ĐL và Công nợ) - bỏ đoạn lặp; hộp “Xuất báo cáo thành công” dùng chung, ngày hiện dd/mm/yyyy.

## [2026.9.49] — Nâng cấp theo báo cáo rà soát (người dùng đồng ý 28/09/2026: "bỏ mục 2, còn lại bạn làm đi")

### Changed
- ⚖️ **#1 Tự tính tiền**: Lưu hồ sơ mới, Thêm / Bỏ phiếu cân, Mở Đóng TT tự tính lại Số tiền + lũy kế ngay - không còn bước bấm "Đề Nghị Thanh Toán (tính lại)" (gốc lỗi lệch tiền B-01). Hồ sơ mới vào thẳng "Chờ xác nhận". Nút đổi tên "🔄 Tính lại số tiền" (chỉ cần khi có cảnh báo).
- ⚖️ **#10 Tên trạng thái**: Chưa ĐNTT / Chờ ĐNTT / Đang ĐNTT → **Chưa tính tiền / Chờ xác nhận / Chờ duyệt** (chỉ chữ hiển thị; giá trị trong sheet giữ nguyên).
- **#3** 26 hộp `confirm()` / `prompt()` của trình duyệt → hộp xác nhận trong trang; thao tác nguy hiểm nút đỏ, con trỏ ở Hủy; Mở Đóng TT (gõ `MO DONG`), Khóa sổ (gõ năm), Xóa mồ côi sổ đã chốt / Xóa sạch Phân tích - Công nợ (gõ `XOA`), Tạo mã bí mật (gõ `MA MOI`).
- **#11** Hệ Thống tách 2 tab: 🔎 Tra cứu & kiểm tra / ⚠️ Can thiệp dữ liệu.
- **#12** Nút Lưu Tạo Mới ghi đúng việc: "Lưu hồ sơ (vào Danh Sách ĐNTT, tự tính tiền)".

### Added
- **#4** Mục "📜 Lịch sử hồ sơ" trong chi tiết hồ sơ: ai tạo, sửa gì (trước → sau), xác nhận, duyệt - lúc nào.
- **#5** Kiểm tra toàn vẹn dữ liệu hằng đêm 2:00 (bật ở Cài đặt): Bảo Trì + MISA thiếu dòng 30 ngày + phiếu cân đã trả chưa khóa; kết quả ở Trang chủ (quyền Hệ Thống) và Hệ Thống; **email Quản trị** khi có vấn đề mới. ⚠️ Lần triển khai đầu Google sẽ hỏi cấp quyền gửi email.
- **#6** Lượt Duyệt bị dừng giữa chừng (giới hạn 6 phút, mất kết nối) được phát hiện: Danh Sách ĐNTT báo đỏ + nút "Hoàn tất lượt Duyệt" (làm nốt, không ghi trùng).
- **#7** Trang chủ: **tuổi nợ** phiếu cân chưa thanh toán (0-30 / 31-60 / 61-90 / trên 90 ngày) + **biểu đồ xu hướng 30 ngày** mua / thanh toán (rê chuột xem số, có bảng số liệu).
- **#8** **Tìm nhanh** (ô trên thanh bên, phím `/` hoặc Ctrl+K): mã hồ sơ, số phiếu cân, STK, Số HĐ, tên không dấu - Nháp + sổ đang mở.
- **#9** Tạo Mới **tự lưu nháp** (còn khi tải lại trang; xóa khi đóng tab / Lưu / Bỏ / Đăng xuất) và hỏi tiếp tục hồ sơ dở.
- **#13** **Đối chiếu sao kê ngân hàng** (Báo Cáo Thanh Toán › 🏦 Đối chiếu sao kê): tải .xlsx/.xls/.csv, khớp UNC theo số tiền + STK/tên + ngày ±3 → Khớp / Cần kiểm tra / UNC chưa thấy trên sao kê / Khoản chi không có UNC; tải CSV.
- **#14** **VietQR** trên phiếu chi tiết thanh toán (PDF) - quét kiểm tra STK / số tiền; dùng dịch vụ ảnh img.vietqr.io (tắt: Script Property `PHIEU_VIETQR` = `0`).
- **#15** CI GitHub Actions: mỗi lần đẩy code kiểm cú pháp Code.gs + chạy toàn bộ test.

### Fixed
- Nhận diện ngân hàng "Sài Gòn - Hà Nội (SHB)" không bị nhầm SCB (dấu gạch giữa tên).
- **#16** Dời 15 chú thích mồ côi về đúng hàm chúng mô tả.

### Tests
- 260 test (thêm `nangCap2026_9_49.test.mjs` 19 test). Kiểm tra Chromium: hộp xác nhận, Hệ Thống 2 tab, cảnh báo Duyệt dở, tìm nhanh, Tạo Mới khôi phục sau tải lại trang, đối chiếu sao kê CSV, biểu đồ sáng / tối.

## [2026.9.48] — Rà tự động ngày + số 0 đầu trên MỌI file xuất Excel (28/09/2026)

Người dùng hỏi "định dạng cột ngày khi kết xuất Excel chưa, khóa số 0 đầu của chuỗi khi kết xuất Excel đã rà chưa".

### Fixed
- File **Đối soát tên**, **Tình hình thanh toán**, **Công nợ phiếu cân**: Số phiếu cân / Số HĐ ghi thêm dấu giữ chữ (trước đây chỉ dựa vào khóa cột "@") - cùng 2 lớp bảo vệ như các file khác.

### Tests
- `xuatExcelRaSoat.test.mjs` (vùng VN và US): chạy đủ 10 hàm xuất trên dữ liệu có số 0 đầu (STK 0071000123456, Số HĐ 00123, CCCD 048…/012…, phiếu 00450) rồi kiểm theo tiêu đề cột: 30 cột mã (Số TK, CCCD, Số HĐ, Số phiếu cân, TK trích nợ / thu phí) khóa "@" và còn số 0 đầu; 14 cột ngày của báo cáo là ngày thật đúng định dạng Vùng xuất; mẫu nhập file UNC ngân hàng và XuatMISA giữ chữ (mã + ngày). Test thất bại trên 2026.9.47. Hàm xuất mới / cột mới có tiêu đề mã hay ngày sẽ tự được kiểm.

## [2026.9.47] — MISA 1 kiểu, Excel ngày thật theo Vùng xuất, dòng Báo cáo ĐNTT không giãn, tăng tốc, giao diện (28/09/2026)

### Changed
- ⚖️ **B-10 (người dùng chọn "1 hình thức như Duyệt")**: Tạo lại MISA / Tạo bổ sung MISA ghi dòng Update_NganHang_DN **giống hệt** lúc Duyệt - cột K Họ tên chủ rừng trên hồ sơ ĐNTT (trước đây tên trong HD_NCC), Nội dung CK "Thanh toán phiếu cân X" (trước đây Nội dung CK của hồ sơ). 1 hàm dùng chung `_dongMisa_`.
- ⚖️ **Báo cáo xuất Excel ghi NGÀY THẬT theo Vùng xuất** (người dùng yêu cầu): Báo cáo ĐNTT (Bảng Đề Xuất + Bảng Kê), Báo cáo UNC, Chi tiết, MISA tóm tắt, Tình hình thanh toán, Công nợ phiếu cân, Phân tích tổng hợp - lọc / sắp xếp / tính theo ngày được trong Excel; file tạo ra có locale + giờ Việt Nam theo Vùng xuất. Ngày căn phải như số. **Giữ dạng chữ** ở 2 mẫu nhập liệu: file UNC nộp ngân hàng và sheet XuatMISA (phần mềm nhận file đọc chữ).

### Fixed
- 🟠 **Báo cáo ĐNTT xuất Excel dòng giãn rất lớn** (người dùng báo): quá 30 nhóm chiều cao là cả bảng bị đặt bằng dòng cao nhất - 1 hồ sơ ghi chú dài làm mọi dòng cao theo. Nay mỗi dòng theo nội dung của nó (vài lệnh đặt chiều cao).
- **P-04** Trợ lý AI: mỗi câu hỏi quét lại Phiếu Cân 90 ngày + tính lại công nợ (20-60 giây). Nay Đại lý / Nguồn gốc lấy từ bảng Phân tích đã tổng hợp; phần công nợ giữ 10 phút, tự tính lại ngay sau Duyệt / Mở Đóng TT; hồ sơ Nháp vẫn đọc mới mỗi câu.
- **P-05** Mở Cài đặt: 13 lời gọi máy chủ song song → 1 lời gọi (`getCaiDatTongHop`); phần nào lỗi tự gọi riêng để hiện lỗi như cũ.
- **P-06** Trình duyệt: 5 bộ theo dõi DOM quét cả trang mỗi thay đổi → 1 bộ, xử lý 1 lần mỗi khung hình.
- **P-07** Bảng MISA / Chi tiết (tới 2.000 dòng) phân trang 100 dòng; tổng tiền vẫn trên mọi dòng.
- **P-08** Ô lọc tên Danh Sách ĐNTT chờ ngừng gõ 150 ms mới vẽ lại.
- **P-10** "Đề Nghị Thanh Toán (tính lại)" chỉ đọc dòng sổ CT của các hợp đồng đang có hồ sơ Nháp (trước đây cả sổ, mọi cột) - kết quả y hệt (có test so khớp), đọc ít hơn hàng chục lần khi sổ lớn.
- **U-03** Danh Sách ĐNTT: cột Xem / Sửa / Xóa luôn thấy ở mép phải khi bảng cuộn ngang.
- **U-04** Thông báo không che nút Trợ lý AI.
- **U-05** Hộp thoại giữ phím Tab bên trong.
- **U-06** Bỏ bộ chọn CSS `:has()` (Firefox cũ bỏ cả quy tắc cuộn ngang).
- **U-07** Trợ lý AI khi đang đồng bộ: chờ xong rồi tự hỏi lại (trước đây hiện chuỗi lỗi kỹ thuật).
- **U-08** Mốc làm mới dữ liệu hợp đồng trong trình duyệt (7:30 / 13:00) theo giờ Việt Nam, không theo giờ máy.

### Tests
- 240 test (thêm `raSoat2026_9_47.test.mjs`, `xuatExcel2026_9_47.test.mjs`, `troLyAi.test.mjs`, MISA "Tạo lại giống hệt Duyệt"). Test phía máy chủ mới đều thất bại trên 2026.9.46. Cập nhật test cũ theo quy định ngày thật (quyDinhNgay, ngayThanhToan, misa, bangDeXuat, baoCaoTuChiTietDNTT). Kiểm tra Chromium: cột thao tác dính phải, phân trang MISA, Cài đặt 1 lời gọi, Tab trong hộp thoại, Trợ lý AI chờ đồng bộ.

## [2026.9.46] — Nhóm 1 báo cáo rà soát + màn chỉ xem không phải chờ đồng bộ (28/09/2026)

### Changed
- ⚖️ **P-02 (người dùng đồng ý 28/09/2026): màn chỉ xem chạy luôn khi đang đồng bộ.** Trước đây cứ 10 phút (7:30–19:00) mọi thao tác, kể cả chỉ xem, phải chờ trigger chạy xong. Nay Báo Cáo Thanh Toán (danh sách, Chi tiết, MISA, Lịch sử UNC), Danh Sách ĐNTT / chi tiết hồ sơ, phiếu hoàn thành, Lịch sử sửa đổi, Khôi phục, Hiệu năng, tìm hồ sơ đã chốt và các màn đọc Cài đặt **không chờ**. Thao tác ghi (Tạo, Sửa, Xác nhận, UNC, Duyệt…) và màn đọc số liệu do trigger dựng (Trang chủ, Công nợ, Phân tích, dữ liệu Tạo mới) vẫn chờ như cũ.

### Fixed
- 🟡 **B-11** Mã hồ sơ mới có thể trùng mã hồ sơ đã chốt của năm đã khóa sổ (Tạo mới) hoặc bất kỳ hồ sơ nào (Mở Đóng TT không kiểm tra gì) → ChiTietDNTT / UNC / MISA của 2 hồ sơ lẫn nhau. Nay kiểm tra Nháp + sổ đang mở + sổ các năm đã khóa (`_maHoSoMoi_`).
- 🟡 **B-12** Mở Đóng TT: dọn ChiTietDNTT / ChiTietUNC / MISA hoặc mở khóa Phiếu Cân bị lỗi vẫn báo "✅ … 0 dòng". Nay báo ⚠️ rõ bảng nào lỗi, ghi nhật ký `LOI_DON_DEP_KHI_MO_DONG` / `LOI_MO_KHOA_PHIEU_CAN`, hướng dẫn chạy Bảo Trì.
- 🟡 **B-13** 17 chỗ nuốt lỗi đọc sổ trong Công nợ KH / HĐ, sổ chi tiết công nợ, Phân tích, Tình hình thanh toán, Tiến độ HĐ, phiếu cân khả dụng: đọc lỗi thì báo cáo tính như chưa thanh toán gì (công nợ phóng to, phiếu đã trả hiện "chưa trả") mà không báo. Nay dừng và báo "Không đọc được … thử lại sau". Trang chủ hiện cảnh báo phần thiếu thay vì số 0; Trợ lý AI được báo phần nào không đọc được (không coi là 0).
- 🟡 **B-14** Về "Chờ ĐNTT" khi hồ sơ **đã có UNC**: nay hỏi xác nhận riêng (hiện STK, số tiền, ngày của UNC cũ, nhắc hủy lệnh ở ngân hàng nếu đã nộp) và ghi vào nhật ký. Tạo UNC lần 2 mà STK khác UNC cũ → cảnh báo ⛔ riêng.
- 🟢 **B-15** Báo Cáo Chi Tiết vượt 2.000 dòng hiện 2.000 dòng **cũ nhất** của khoảng ngày; nay hiện các dòng Ngày CK **mới nhất**.
- 🟢 **B-16** Ghi chú sổ 112 ("Tổng KL | Đã trả | …") định dạng số kiểu Mỹ 1,234.00; nay theo Vùng xuất (mặc định VN 1.234,00) như phiếu / báo cáo.

### Tests
- 222 test (thêm `raSoat2026_9_46.test.mjs` 9 test, `chiDoc.test.mjs` 3 test: mọi màn CHI_DOC chạy trong lúc đồng bộ và **không ghi ô nào**, đọc được hồ sơ vừa chốt; thao tác ghi vẫn chờ). 10 test bắt lỗi thất bại trên bản 2026.9.45. `choDongBo.test.mjs`: ví dụ "phải chờ" đổi sang Trang chủ (Danh Sách ĐNTT nay không chờ).

### Chờ người dùng quyết định
- **B-10** 2 đường ghi MISA lấy cột K "Họ tên chủ rừng" và Nội dung CK khác nhau (xem báo cáo) - cần kế toán chốt.

## [2026.9.45] — Đối chiếu Số tài khoản với hợp đồng khi Lưu / Sửa hồ sơ (người dùng đồng ý 28/09/2026)

### Changed
- ⚖️ **Lưu hồ sơ mới** và **Sửa hồ sơ** (khi đổi Số tài khoản hoặc Số hợp đồng) chỉ nhận Số tài khoản **có trong HD_STK của đúng hợp đồng đó** (mọi tình trạng hợp đồng). Trước đây máy chủ tin STK trình duyệt gửi lên → gõ tay ở Sửa hồ sơ hoặc gọi thẳng API tạo được hồ sơ chuyển tiền vào tài khoản bất kỳ (S-03 báo cáo rà soát). Báo lỗi rõ: "Số tài khoản X không có trong danh sách tài khoản (HD_STK) của hợp đồng Y - thêm tài khoản này vào hợp đồng ở app Hợp Đồng rồi làm lại."
- So sánh bỏ dấu `'` và số 0 đầu (ô HD_STK dạng số); tài khoản vừa thêm ở app Hợp Đồng được nhận ngay (đọc lại HD_STK bỏ qua bộ nhớ đệm trước khi báo lỗi).
- Hồ sơ cũ có STK chưa khai báo: sửa các ô khác (người nhận, ngân hàng, ghi chú…) vẫn được; chỉ kiểm tra khi đổi STK / Số HĐ.

### Không đổi (người dùng quyết định 28/09/2026)
- Không làm: tách quyền Lập / Duyệt (S-02), mã xác nhận đăng nhập từ trang nhúng (S-01).
- Giữ như cũ: quyền "Cập nhật ngay" của tài khoản Chỉ xem (P-03); các đánh đổi đã chốt H-01, H-08, H-09, H-10.

### Tests
- 210 test (thêm `stkTheoHopDong.test.mjs`: Lưu / Sửa với STK không khai báo hoặc của hợp đồng khác bị chặn và không ghi gì; STK khai báo được nhận; bỏ qua số 0 đầu; sửa ô khác của hồ sơ cũ vẫn được; STK vừa thêm được nhận dù bộ nhớ đệm cũ). Các test chặn thất bại trên bản 2026.9.44. Dữ liệu mẫu HD_STK khai báo STK cho HD01 / 00123.

## [2026.9.44] — Rà soát toàn bộ mã nguồn: chặn chuyển sai tiền, báo cáo đọc lại từ sổ, bộ nhớ đệm tiếng Việt, nhật ký cấu hình (28/09/2026)

Báo cáo rà soát đầy đủ (13 phần, chấm điểm, lộ trình): `docs/RA_SOAT_2026-09-28.md`. Bản này chỉ sửa lỗi - quy trình bình thường không đổi; các đề xuất đổi nghiệp vụ / phân quyền để người dùng quyết định (xem báo cáo).

### Fixed
- 🔴 **Chuyển sai tiền sau khi Thêm / Bỏ phiếu cân**: hồ sơ vẫn "Chờ ĐNTT" với **Số tiền cũ** (không tự tính lại) nên Xác nhận → Tạo UNC → Duyệt được với số tiền lệch tổng phiếu cân (vd bỏ 1 phiếu 1.000.000 đ vẫn chuyển 2.000.000 đ, phiếu cân bị khóa "đã trả"). Nay **Xác nhận, In Báo Cáo ĐNTT, Tạo UNC, Duyệt** đều từ chối hồ sơ có Số tiền khác tổng Thành tiền phiếu cân (sai số 1 đ) và nhắc bấm "Đề Nghị Thanh Toán (tính lại)"; Danh Sách ĐNTT hiện nhãn **⚠️ Cần tính lại** (`_hoSoLechTien_`, `canTinhLai`).
- 🟠 **Xuất Báo Cáo Thanh Toán in số liệu do trình duyệt gửi lên** (số tiền, STK, người nhận) vào Bảng Đề Xuất chính thức - tài khoản Chỉ xem sửa được. Nay trình duyệt chỉ gửi mã hồ sơ, máy chủ đọc lại từ sổ 112 đã chốt (`webExportReport_`); hồ sơ vừa bị Mở Đóng TT (không còn trong sổ) được báo rõ thay vì xuất lặng lẽ thiếu.
- 🟠 **Bộ nhớ đệm dữ liệu tham chiếu âm thầm không hoạt động với tên tiếng Việt**: chia mảnh theo số ký tự (90.000) trong khi giới hạn 100KB tính theo byte UTF-8 (chữ có dấu 2-3 byte) → mảnh quá cỡ, lưu lỗi, mọi lần đều đọc lại file. Nay chia theo byte (`_chiaManhTheoByte_`).
- 🟠 **Cài đặt › Đổi link** ghi được Script Property **bất kỳ** theo tên trình duyệt gửi (kể cả `SSO_SECRET`). Nay chỉ nhận đúng các link khai báo, loại Sheet/Thư mục lấy theo khai báo.
- 🟡 **Nhật ký cấu hình**: đổi Số TK / Ngân hàng công ty (MISA), cấu hình UNC, File Chính, link file, Vùng lãnh thổ, Vùng xuất, API key Gemini (không ghi giá trị key) nay ghi "trước → sau" (`CAU_HINH_HE_THONG`), hiện ở Hệ Thống › Lịch sử sửa đổi.
- 🟡 **Tạo Mới bước 2**: đổi Số HĐ / Người nhận / STK nhiều lần làm **nhân bản trình xử lý** → mỗi lần đổi gọi máy chủ N lần. Nay gán 1 trình xử lý duy nhất.
- 🟡 **Màn hình chờ**: 2 thao tác chạy cùng lúc thì thao tác xong trước ẩn màn hình chờ khi thao tác kia còn chạy. Nay đếm số thao tác đang chờ.
- 🟡 **Báo Cáo ĐNTT (chờ duyệt) › Bảng Kê**: khóa TEXT theo số hồ sơ thay vì số phiếu cân - ngày dạng chữ ở các dòng sau có thể bị đọc lộn ngày/tháng (lỗi đã sửa ở bản đã chốt, bản chờ duyệt còn sót).
- Hướng Dẫn: Danh Sách ĐNTT có 5 tab (ghi 4), Công nợ 7 mục (ghi 8); 2 link chưa thoát ký tự.

### Tests
- 205 test (thêm `raSoat2026_9_44.test.mjs`: chặn lệch tiền ở 4 bước, tính lại xong thì Duyệt đúng số, quy trình khớp tiền không đổi, xuất báo cáo không tin trình duyệt, chia mảnh theo byte + bộ nhớ đệm dùng được với tiếng Việt, đổi link chỉ theo khai báo, nhật ký cấu hình, không nhân bản trình xử lý, màn hình chờ đếm lượt, **mã trình duyệt không lỗi cú pháp** - trước đây không test nào bắt). Các test mới thất bại trên bản 2026.9.43. Kiểm tra trình duyệt (Chromium): nhãn "Cần tính lại" ở Danh Sách ĐNTT, không lỗi JS.
- `nhatKySua.test.mjs`: test "bỏ phiếu cân rồi Duyệt" trước đây Duyệt **không tính lại** (chính là lỗi trên) - nay tính lại trước khi Xác nhận.

## [2026.9.43] — Tạo lại UNC theo Ngày CK (người dùng đồng ý 28/09/2026)

### Changed
- ⚖️ **Hệ Thống › Tạo Lại UNC** chọn hồ sơ theo **Ngày CK** (ngày thanh toán), như Tạo lại MISA và Báo cáo Thanh toán. Trước đây chọn theo Ngày ĐN của sổ 112 → chọn đúng ngày thanh toán thì báo “không có hồ sơ”. Dùng chung `_hoSoDaChotTheoNgayCK_` với Tạo lại MISA (bỏ đoạn chọn lặp).
- Nhãn ô ngày, lời xác nhận và Hướng Dẫn ghi rõ “Ngày CK”.

### Không đổi (người dùng xác nhận)
- Ô ký phiếu PDF giữ nguyên: Người lập phiếu / Kế toán trưởng / Giám đốc.
- Khối lượng dự kiến hợp đồng: app Hợp Đồng đã sửa ghi cột Z nhưng chưa triển khai; app này vẫn lấy tổng lô rừng trước, cột Z sau — đúng cả trước và sau khi app kia cập nhật.

## [2026.9.42] — Công nợ mở bằng bản tổng hợp, rà bố cục trang dài, nhật ký trước → sau (người dùng đồng ý 28/09/2026)

### Changed — 1. Báo cáo Công nợ nhanh hơn
- Khoảng mặc định (90 ngày gần nhất) của **Công nợ theo Khách hàng / Hợp đồng** luôn mở bằng **bản tổng hợp sẵn** (trigger 7:30 / 13:00), kèm dòng “📋 Số liệu tổng hợp lúc …”. Muốn mới nhất: bấm **🔄 Làm mới (tính lại, chậm hơn)**.
- ⚖️ Sau Duyệt / Mở Đóng TT **không xóa** bản tổng hợp nữa (trước: lần xem kế tiếp phải tính lại ~1,2 triệu ô) — chỉ ghi lúc có thay đổi; màn hình báo “⚠️ Sau đó đã có Duyệt / Mở Đóng TT lúc … - số liệu chưa gồm thay đổi này” và nút Làm mới nổi bật. Người dùng chọn: nhanh trước, muốn thì làm mới.
- Xem **khoảng ngày khác** thì tính trực tiếp (luôn mới nhất) và **không ghi đè** bản tổng hợp mặc định (trước: 1 người xem khoảng khác làm người sau xem mặc định phải tính lại; Tiến độ HĐ dùng ở Tạo mới cũng bị đổi theo khoảng đó). `getCongNoTrangThai_`, `_laKhoangCongNoMacDinh_`, `CONGNO_LUC`.

### Changed — 2. Rà bố cục
- Trang dài **Hệ Thống, Cài đặt, Hướng Dẫn**: thanh **“Đi nhanh”** ở đầu trang (tự lấy từ tiêu đề các thẻ, kể cả thẻ tải sau) — bấm là cuộn tới đúng mục, không bị thanh tiêu đề che (`_ganMucLuc`).
- Tab Công nợ đánh số liền **1–7** (trước 1, 2, 4…8 — thiếu số 3); Hướng Dẫn cập nhật theo.
- Ô “Tổng công nợ còn lại” âm / dương hiện đúng màu (trước luôn xanh).

### Added — 3. Nhật ký trước → sau
- **Sửa hồ sơ Nháp**: ghi đúng các trường đổi, dạng `Người nhận: "A" → "B"; STK: "…" → "…"` (trước: ghi toàn bộ giá trị mới dạng JSON, không có giá trị cũ).
- **Bỏ phiếu cân khỏi hồ sơ**: ghi mã hồ sơ, số phiếu, tấn, số tiền (trước: chỉ mã dòng, không có mã hồ sơ).
- **Duyệt**: ghi số hồ sơ, số phiếu, **tổng tiền**, ngày TT.
- **Hệ Thống › Lịch sử sửa đổi** hiện thêm: Sửa hồ sơ Nháp, Thêm / Bỏ phiếu cân, Xóa hồ sơ Nháp, Xác nhận ĐNTT, Về Chờ ĐNTT, Duyệt (Đóng TT).

### Tests
- 192 test (thêm: Công nợ đọc bản tổng hợp không đọc sổ, sau Duyệt vẫn nhanh + báo thay đổi, Làm mới tính lại, khoảng khác không ghi đè; nhật ký trước → sau, bỏ phiếu, tổng tiền Duyệt, Lịch sử sửa đổi — thất bại trên bản cũ). Kiểm tra trình duyệt: thanh Đi nhanh 3 trang, tab Công nợ, dòng trạng thái Công nợ, Lịch sử sửa đổi.

## [2026.9.41] — Trang chủ: ô số liệu dạng nút, bấm vào mở thẳng màn hình (người dùng yêu cầu 28/09/2026)

### Added
- Các ô số liệu Trang chủ là **nút bấm** (mũi tên →, đổi viền khi rê chuột, bấm bằng Enter / Space), mở thẳng màn hình tương ứng:
  | Ô | Mở |
  |---|---|
  | Hồ sơ đang ở Nháp | Danh Sách ĐNTT › Tất cả |
  | Sẵn sàng chốt, Tổng tiền sẵn sàng | Danh Sách ĐNTT › **Đã có số tiền (2 + 3)** (tab mới: Chờ + Đang ĐNTT) |
  | Chờ Đề Nghị TT | Danh Sách ĐNTT › 1 · Chưa ĐNTT |
  | KL / Tiền mua tháng này | Công Nợ › 6 · Phân tích Nhập/TT theo NG-ĐL (tháng này) |
  | KL / Tiền thanh toán tháng này | Báo Cáo Thanh Toán Gỗ Keo — **tự tải luôn tháng này** |
  | Tổng nợ tiền gỗ keo | Công Nợ › 1 · Công nợ theo Khách hàng |
- Tài khoản không có quyền vào trang nào thì ô tương ứng không hiện dạng nút. Nút “Cập nhật ngay” trong ô vẫn chỉ cập nhật, không chuyển trang.
- Danh Sách ĐNTT có thêm tab **Đã có số tiền (2 + 3)** (cũng có tổng tiền, lọc tên như các tab khác).

### Tests
- 186 test (thêm: ô số liệu → đúng trang/tab, chỉ khi có quyền, bàn phím, báo cáo tự tải; tab “Đã có số tiền”). Kiểm tra trình duyệt: bấm từng ô, Enter, tài khoản Chỉ xem.

## [2026.9.40] — Thiết kế lại giao diện: 1 font, thang cỡ chữ cân đối, Trang chủ chuyên nghiệp (người dùng yêu cầu 28/09/2026)

### Changed
- **Một font duy nhất (Inter)** cho toàn web app — bỏ font có chân (Source Serif) ở tiêu đề trang, tiêu đề thẻ, logo, ô trống, diễn giải; bỏ tải font đó (trang nhẹ hơn).
- **Thang cỡ chữ khai báo 1 chỗ** (`--fs-nho` 12 · `--fs-phu` 13 · `--fs-than` 14 · `--fs-the` 15 · `--fs-trang` 22 · `--fs-so` 28px) thay cho ~12 cỡ rời rạc: chữ thân 14px (dòng 1,5), nhãn / gợi ý 12px, tiêu đề thẻ 15px, tiêu đề trang 22px, số liệu lớn 28px. Menu, ô nhập, nút, bảng, nhãn trạng thái dùng theo thang.
- **Tiêu đề màu chữ đậm** (trước: xanh như nút bấm) — màu xanh dành cho nút và số liệu, dễ phân biệt thứ bấm được.
- **Trang chủ**: Quy trình thanh toán thành **5 bước đánh số có đường nối** (trên điện thoại xếp dọc); số liệu chia nhóm có tiêu đề nhỏ: *Hồ sơ đang xử lý*, *Mua & thanh toán tháng này*, *Công nợ khách hàng gỗ keo*, *Mua tháng này theo nguồn gốc & đại lý*; tiêu đề thẻ viết thường gọn. Trên điện thoại các ô số liệu xếp 2 cột.
- **Danh Sách ĐNTT**: nhãn trạng thái không bị gãy dòng (“Đang / ĐNTT”); chế độ chữ to cân lại theo thang mới (bảng 15px, tiêu đề cột 12px, nút 14px) — bảng không còn tràn khỏi khung.
- Giao diện tối, bản in giữ nguyên hoạt động (đã kiểm tra).

### Tests
- 184 test (thêm: thang cỡ chữ, không còn font có chân, tiêu đề màu chữ, nhãn trạng thái không gãy dòng, quy trình dạng bước). Kiểm tra trình duyệt: Trang chủ (sáng, tối, điện thoại), Danh Sách ĐNTT — toàn trang chỉ dùng 1 font.

## [2026.9.39] — Trang chủ: Quy trình thanh toán lên đầu trang (người dùng yêu cầu 28/09/2026)

### Changed
- **Quy trình thanh toán (5 bước)** nằm **đầu Trang chủ** (trước các ô số liệu); mỗi bước: tên, làm ở đâu, trạng thái sau khi xong; kèm link sang Hướng Dẫn Sử Dụng. Cảnh báo “Chưa thiết lập File Nháp” (nếu có) hiện trên cùng.
- Sửa nội dung cũ lệch thực tế: Trang chủ trước ghi 4 bước và bước 1 “ghi vào sheet chính” — hồ sơ mới chỉ vào File Nháp, chỉ ghi sổ chính khi Duyệt. Nay Trang chủ và Hướng Dẫn dùng **chung 1 danh sách** `QUY_TRINH_TT` (5 bước), không còn 2 bản viết tay khác nhau.

### Tests
- 183 test (thêm: Trang chủ mở đầu bằng quy trình, cùng danh sách với Hướng Dẫn).

## [2026.9.38] — Danh Sách ĐNTT: tổng tiền đang đề nghị, lọc tên khách hàng (người dùng yêu cầu 28/09/2026)

### Added
- **Tổng tiền** theo tab đang xem (và theo bộ lọc): “Đang ĐNTT - đã đề nghị, chưa chuyển tiền: N hồ sơ · Tổng số tiền … đ” phía trên bảng; dòng **TỔNG CỘNG** cuối bảng (số phiếu, KL, số tiền); hồ sơ chưa tính tiền được đếm riêng.
- **Tổng theo khách hàng** (mở/đóng): chủ rừng, số hồ sơ, số tiền — xếp theo số tiền giảm dần → thấy ngay khách nào đã đề nghị mà chưa được chuyển tiền.
- **Lọc theo tên khách hàng** (chủ rừng hoặc người nhận): gõ không cần dấu, không phân biệt hoa thường (“nguyen van duc” khớp “Nguyễn Văn Đức”), có gợi ý tên; nút “✕ Bỏ lọc”. Bộ lọc áp cho cả 4 tab; mỗi tab hiện số hồ sơ khớp.
- Thanh hành động cảnh báo cả hồ sơ đang chọn nhưng bị bộ lọc tên ẩn (trước chỉ báo hồ sơ ở tab khác) — tránh Xác nhận / In / Duyệt nhầm hồ sơ không nhìn thấy.

### Tests
- 182 test (thêm: lọc tên bỏ dấu / hoa thường / khoảng trắng, theo chủ rừng hoặc người nhận; hồ sơ chọn bị bộ lọc ẩn được cảnh báo). Kiểm tra trình duyệt: tổng tab, tổng theo khách, lọc, bỏ lọc.

## [2026.9.37] — Trigger đang chạy: thông báo và chờ đồng bộ xong mới chạy thao tác (người dùng yêu cầu 28/09/2026)

### Added
- Khi 1 trigger cập nhật dữ liệu đang chạy (Làm mới 10 phút, Cập nhật 7:30/13:00, Cập nhật 15h — kể cả khi chạy tay từ web), mọi thao tác trên web **không chạy chồng** mà **chờ đồng bộ xong**:
  - Máy chủ (`api`) kiểm tra cờ “đang chạy” (Script Properties, không đọc sheet) trước khi chạy chức năng; đang đồng bộ thì trả `[DONG_BO]` kèm tên, giờ bắt đầu, thời gian đã chạy.
  - Trình duyệt hiện thông báo trên cùng: “⏳ Hệ thống đang đồng bộ: … (bắt đầu 15:30, đã chạy 2 phút). N thao tác đang chờ — sẽ tự chạy khi đồng bộ xong”, hỏi lại mỗi 10 giây, xong thì **tự chạy tiếp** đúng các thao tác đã bấm (báo “✅ Đồng bộ xong”). Nút **Hủy** bỏ các thao tác đang chờ.
  - Trigger bị Google dừng giữa chừng (cờ còn sót) không giữ thao tác quá 7 phút.
  - Chức năng rất nhẹ / phục vụ việc chờ vẫn chạy ngay (`getTrangThaiDongBo`, `getAppSetupStatus`, `ghiQuaGioTrinhDuyet` — cờ `khongChoDongBo` trong `API_ROUTES`).

### Tests
- 181 test (thêm: Tạo ĐNTT chạy bình thường, đang đồng bộ thì chờ rồi tạo đúng 1 lần; thao tác bị hoãn khi đang đồng bộ, chức năng chờ vẫn chạy, cờ cũ quá 6 phút không giữ, cờ chỉ bật trong lúc trigger chạy, trình duyệt cùng tiền tố với máy chủ). Kiểm tra trình duyệt: thông báo hiện, thao tác tự chạy lại khi đồng bộ xong.

## [2026.9.36] — Danh Sách ĐNTT có lần chạy 361 giây: giảm ghi đè File Nháp (người dùng báo 28/09/2026)

### Fixed
- **Danh Sách ĐNTT** (`getDraftListSummary`) ghi nhận 1 lần quá giờ 361 giây (28/09/2026 15:33) dù hàm chỉ đọc 2 sheet Nháp (~17 nghìn ô, dưới 1 giây khi thử). Google Sheets xử lý lần lượt các thao tác trên cùng 1 file: khi 1 tác vụ khác đang ghi nhiều vào **File Nháp**, thao tác đọc phải chờ. Nguồn ghi lặp lại lớn nhất: **Làm mới 10 phút** (và trigger 7:30/13:00) ghi đè toàn bộ các bản sao trong File Nháp (Phiếu cân chưa TT, HD_NCC, HD_STK, Tiến độ HĐ, Công nợ KH — ~300 nghìn ô mỗi lần) **dù dữ liệu không đổi**.
- Nay `_ghiLaiMirror_` chỉ ghi khi dữ liệu thật sự đổi: so **dấu vân tay** nội dung (`_dauVanTay_`, lưu `MIRROR_DAU_<tên sheet>`) và kích thước sheet; giống hệt thì bỏ qua. Bản sao bị sửa tay (mất dòng, đổi cột) vẫn được ghi lại ở lần làm mới kế tiếp. Phần lớn các lượt làm mới 10 phút giờ không ghi gì vào File Nháp.
- Lần quá giờ 15:33 trùng thời điểm các lần Xuất Báo Cáo chậm của bản cũ (247–325 giây, đã sửa ở 2026.9.28–9.29).

### Tests
- 175 test (thêm: làm mới khi không đổi không ghi ô nào; phiếu mới được ghi; bản sao mất dòng được dựng lại; dấu vân tay — thất bại trên bản cũ).

## [2026.9.35] — Báo Cáo Thanh Toán: bấm vào dòng khách hàng để xem phiếu hoàn thành trước khi in (người dùng yêu cầu 28/09/2026)

### Added
- Báo Cáo Thanh Toán (tab Gỗ Keo): **bấm vào dòng hồ sơ** (hoặc nút **👁️ Xem** cuối dòng) mở cửa sổ xem trước **Phiếu chi tiết hoàn thành thanh toán** — đúng nội dung sẽ in (cùng hàm dựng phiếu PDF: Ngày CK, chủ rừng, người nhận, NH/STK, HĐ, SL, số tiền, nội dung CK, ghi chú, phiếu cân, ô ký). Nút **🖨️ In phiếu (PDF)** ngay trong cửa sổ; in xong đổi thành “📄 Mở phiếu PDF”. Xem trước không tạo file. `getPhieuHoanThanh_` (quyền như xem báo cáo), dùng chung `_hoSoHoanThanh_` với lệnh in.
- Bấm ô tích chọn / nút trong dòng không mở cửa sổ (quy tắc chung: hành động gắn cho cả dòng không chạy khi bấm vào ô nhập, nút, link bên trong). Phiếu hiển thị trong khung cách ly (`iframe sandbox`), cửa sổ rộng (`openModal(html, { rong: true })`).

### Changed
- Nút In phiếu PDF ở Nháp và ở Báo Cáo dùng chung `_inPhieuPdf` (trình duyệt).

### Tests
- 171 test (thêm: xem trước = phiếu in, không tạo file, quyền; dòng mở xem trước, ô tích không mở, khung cách ly).

## [2026.9.34] — Kiểm tra hiệu năng lần 2: Duyệt, MISA, trigger bớt đọc lại sổ (người dùng yêu cầu 28/09/2026)

### Changed (tối ưu, kết quả không đổi)
- **Duyệt**: ChiTietDNTT chỉ đọc dòng của hồ sơ đang Duyệt (trước: cả sheet); ghép ChiTietDNTT chỉ đọc đúng phiếu cân cần (trước: đọc cả file Phiếu Cân lần 2 — cũng áp cho In Báo Cáo ĐNTT); bỏ phiếu vừa trả khỏi bản sao “chưa TT” bằng xóa đúng dòng (trước: đọc + ghi đè cả bản sao).
- **Báo Cáo MISA / Dọn dẹp MISA**: tra Ngày CK chỉ đọc 2 cột (Số phiếu cân, Ngày CK) của sổ CT thay vì cả 22 cột (`_ctCacCot_`).
- **Đọc 1 lần trong 1 lượt chạy** (`_DA_DOC_TRONG_LUOT_`): sổ lớn hơn giới hạn bộ nhớ đệm của Google (~3,6 MB — Phiếu Cân, sổ CT 1 năm) trước đây bị đọc lại ở mỗi bước của cùng 1 lượt (trigger 7:30, 15h…). Nay bước sau dùng lại bản vừa đọc; ghi sổ thì bản nhớ bị xóa ngay (cùng chỗ xóa bộ nhớ đệm), nơi gọi nhận bản sao từng dòng. Mỗi lần bấm / mỗi trigger là 1 lượt mới.
- `_docDongTheoKhoa_` có thêm bản trả kèm số dòng (`_doanDongTheoKhoa_`) để ghi đúng ô mà không đọc cả sheet.

### Đo hiệu năng (dữ liệu thử 1 năm: 30.000 phiếu cân, 20.000 dòng CT / ChiTietDNTT) — ô đọc (ô ghi), so với 2026.9.27
| Thao tác | Nay | 2026.9.27 |
|---|---|---|
| Duyệt 1 hồ sơ | 1,41 triệu (18 nghìn) | 2,91 triệu (298 nghìn) |
| Báo Cáo TT: xuất 30 hồ sơ | 46 nghìn | 1,16 triệu |
| Báo Cáo TT: xuất cả tháng (574 hồ sơ) | 155 nghìn, 169 lời gọi | 1,16 triệu, 716 lời gọi |
| Báo Cáo Chi Tiết: xem / xuất 1 tháng | 84 nghìn | 560 nghìn |
| Báo Cáo MISA: xem 1 tháng | 111 nghìn | 440 nghìn |
| Trigger 7:30 / 13:00 | 1,54 triệu | 2,70 triệu |
| Trigger 15h | 1,16 triệu | 2,32 triệu |
- Không đổi: Công nợ KH, Sổ chi tiết, Tình hình TT, Phân tích, Đối soát tên, Bảo trì (~1,2 triệu ô) — cần toàn bộ lịch sử phiếu cân + sổ CT để tính lũy kế, mỗi lần đọc 1 lần.

### Tests
- 169 test (thêm: Duyệt chỉ đọc dòng ChiTietDNTT của hồ sơ; ghép ChiTietDNTT không đọc cả Phiếu Cân; MISA đọc 2 cột; trigger 15h đọc mỗi sổ 1 lần khi bộ nhớ đệm đầy; ghi sổ thì đọc lại bản mới, sửa dòng trả về không ảnh hưởng; Duyệt không ghi đè bản sao “chưa TT” — thất bại trên bản cũ). Bộ chạy test: mỗi lần gọi hàm là 1 lượt chạy mới như trên Google.

## [2026.9.33] — ⚖️ Quy định: báo cáo chỉ trong phạm vi 1 tháng (người dùng yêu cầu 28/09/2026)

### Changed
- ⚖️ **Báo Cáo Thanh Toán** — 4 tab Gỗ Keo, Chi Tiết, MISA, UNC — mỗi lần **xem / xuất / in** chỉ trong phạm vi **1 tháng**: “Đến ngày” xa nhất = “Từ ngày” + 1 tháng − 1 ngày (01/09 → 30/09; 15/08 → 14/09; 31/01 → cuối tháng 2). Trước đây Gỗ Keo tự co về ~3 tháng, các tab khác không giới hạn.
  - Khi chọn/gõ ngày làm khoảng quá 1 tháng: **thông báo và không nhận** — “Đến ngày” được đưa về ngày xa nhất được phép.
  - Nút Xem / Xuất Excel / Xuất Báo Cáo kiểm tra lại, sai thì báo và không chạy.
  - Máy chủ kiểm tra lại ở cổng API (`_theoKhoangBaoCao_`, `webExportReport_`) — gọi thẳng API cũng không vượt được. Hàm nội bộ, trigger, Hệ Thống (Tạo lại / Dọn dẹp MISA, UNC) và các báo cáo Công Nợ không đổi.
  - Số tháng cấu hình 1 chỗ `KHOANG_BAO_CAO.SO_THANG` (máy chủ gửi xuống trang), quy tắc ngày giống hệt nhau ở trình duyệt và máy chủ (test so từng ngày 2024–2026).
- Tab Gỗ Keo mở mặc định **từ đầu tháng hiện tại đến hôm nay** (trước: 90 ngày).
- Người dùng xác nhận (28/09/2026): “1 tháng” là **khoảng 1 tháng bất kỳ** (không bắt buộc từ ngày 1 đến cuối tháng); **không áp dụng** cho các báo cáo Công Nợ.

### Tests
- 163 test (thêm: ngày cuối tối đa, trình duyệt = máy chủ, cổng API từ chối > 1 tháng ở cả 7 chức năng xem/xuất + Xuất Báo Cáo, trang gắn quy định vào đủ ô ngày và nút). Kiểm tra trình duyệt: gõ ngày quá 1 tháng, bấm Xem khi sai.

## [2026.9.32] — Kiểm tra hiệu năng Báo Cáo Thanh Toán / Chi Tiết; xuất Excel Chi Tiết không còn cắt 2.000 dòng (người dùng yêu cầu 28/09/2026)

### Fixed
- **Xuất Excel Báo Cáo Thanh Toán Chi Tiết** bị cắt ở 2.000 dòng (giới hạn dành cho màn hình): khoảng 3 tháng (~6.600 phiếu) chỉ ra 2.000 dòng. Nay xem trên web vẫn tối đa 2.000 dòng, **xuất Excel tối đa 30.000 dòng** (`CHI_TIET_DNTT_GIOI_HAN`).

### Đo hiệu năng (dữ liệu thử: 30.000 phiếu cân, 20.000 dòng CT / ChiTietDNTT, 9 tháng; so với 2026.9.27)
| Thao tác | Lời gọi Google | Ô đọc | Trước (9.27) |
|---|---|---|---|
| Báo Cáo TT: xem 3 tháng | 5 | 44 nghìn | 5 lời gọi, 44 nghìn ô |
| Báo Cáo TT: xuất 30 hồ sơ | 177 | 46 nghìn | 185 lời gọi, **1,25 triệu** ô |
| Báo Cáo TT: xuất 300 hồ sơ | 169 | 100 nghìn | **442** lời gọi, 1,16 triệu ô |
| Báo Cáo TT: xuất tất cả 1.648 hồ sơ | 169 | 370 nghìn | **1.790** lời gọi, 1,16 triệu ô |
| Chi Tiết: xem 7 ngày | 7 | 37 nghìn | 560 nghìn ô |
| Chi Tiết: xuất Excel 3 tháng | 47 | 205 nghìn (ghi đủ 6.592 dòng) | 560 nghìn ô, **chỉ 2.000 dòng** |
- Số lời gọi Google khi xuất không tăng theo số hồ sơ; ô đọc tỉ lệ với số hồ sơ/khoảng ngày chọn, không theo độ lớn cả sổ.

### Tests
- 159 test (thêm: xem giới hạn 2.000 dòng nhưng xuất Excel đủ 2.500 dòng — thất bại trên 2026.9.31).

## [2026.9.31] — Phiếu PDF luôn có Nội dung chuyển khoản và Ghi chú (người dùng báo 28/09/2026)

### Fixed
- **Phiếu chi tiết hoàn thành thanh toán** (và Phiếu chi tiết thanh toán ở Nháp) thiếu Ghi chú: mục ghi chú chỉ in khi có dữ liệu và mang tên “Diễn giải”. Nay luôn in 2 dòng **Nội dung chuyển khoản** và **Ghi chú** (mỗi phần ghi chú 1 dòng; trống thì “—”).
- Hồ sơ có ô Nội dung CK trong sổ 112 trống: phiếu (và modal Chi tiết hồ sơ) tự điền nội dung chuẩn “Thanh toán tiền mua gỗ keo HĐ số … ngày …” theo Số HĐ + Ngày ký HĐ. Công thức gom 1 hàm `_noiDungCK_`, Tổng Hợp 112 dùng chung (trước đây viết thẳng trong Tổng Hợp 112).

### Tests
- 158 test (thêm: phiếu hoàn thành in Nội dung CK + Ghi chú; tự điền Nội dung CK khi sổ trống — thất bại trên 2026.9.30).

## [2026.9.30] — Bảng Kê lấy từ ChiTietDNTT, Báo cáo Chi Tiết lọc theo Ngày CK, Phiếu hoàn thành thanh toán (người dùng chốt 28/09/2026)

### Changed
- **Xuất Báo Cáo (đã chọn)** › sheet **Bảng Kê Chi Tiết CK** lấy thẳng **ChiTietDNTT** (đã ghép sẵn lúc Đóng TT, cùng bố cục cột) — không đọc file Phiếu Cân, HD_NCC nữa; số liệu khớp đúng tab Báo Cáo Thanh Toán Chi Tiết. Hồ sơ nào ChiTietDNTT thiếu phiếu so với sổ CT (chốt trước khi có ChiTietDNTT, chưa đồng bộ) thì tự ghép lại như cũ. Thứ tự: theo hồ sơ trên màn hình (như sheet 1), trong hồ sơ theo sổ CT. Khóa TEXT đủ số dòng phiếu cân (trước đây chỉ bằng số hồ sơ).
- ⚖️ **Báo Cáo Thanh Toán Chi Tiết** (xem + xuất Excel) lọc theo **Ngày CK** (ngày thanh toán, cùng ngày với MISA) thay cho Ngày ghi — người dùng chọn. Chỉ đọc dòng có Ngày CK trong khoảng; xếp theo Ngày CK.

### Added
- Báo Cáo Thanh Toán: mỗi hồ sơ có nút **🖨️ In** → PDF **“PHIẾU CHI TIẾT HOÀN THÀNH THANH TOÁN”** có **Ngày thanh toán (Ngày CK)** (từ sổ CT), số tiền đã thanh toán, SL HĐ (tấn), danh sách phiếu cân + dòng tổng, ô ký; số/ngày theo Vùng xuất. Tìm cả hồ sơ năm đã khóa sổ. Quyền như Xuất Báo Cáo. Dùng chung khung phiếu PDF với Phiếu chi tiết thanh toán (Nháp) — `_luuPhieuPdf_`, `_chiTietHoSo_`, `PHIEU_CT_TT.DE_NGHI / HOAN_THANH`.

### Tests
- 156 test (thêm: Bảng Kê lấy từ ChiTietDNTT không đọc Phiếu Cân; hồ sơ thiếu ChiTietDNTT vẫn ghép đủ; Bảng Kê từ ChiTietDNTT giống hệt bảng ghép lại; Chi Tiết lọc theo Ngày CK; phiếu hoàn thành có Ngày CK). Kiểm tra trình duyệt: nút In ở Báo Cáo Thanh Toán, tab Chi Tiết.

## [2026.9.29] — Xuất báo cáo chỉ đọc dòng cần, Dọn Dẹp UNC (người dùng báo 28/09/2026)

### Fixed
- **Xuất Báo Cáo (đã chọn)** ở Báo Cáo Thanh Toán chậm (~108 giây với 30 hồ sơ, có lần Google dừng vì quá 6 phút): mỗi lần xuất đọc **cả sổ CT và cả file Phiếu Cân** chỉ để lấy vài chục dòng. Nay đọc 1 cột mã rồi chỉ đọc các dòng của hồ sơ đã chọn và đúng các phiếu cân của chúng (`_docDongTheoKhoa_`; dòng gần nhau gộp 1 lần đọc, tối đa 40 lần). Dữ liệu thử 1 năm (30.000 phiếu, 20.000 dòng CT), 30 hồ sơ: **1,16 triệu → 57 nghìn ô**.
- Áp dụng cùng cách cho mọi chức năng dùng chung phần này: Tạo lại / Tạo bổ sung MISA, In Báo Cáo ĐNTT (bản chờ duyệt), và **Báo Cáo MISA** theo Ngày CK (chỉ đọc dòng CT có Ngày CK trong khoảng: 440 → 58 nghìn ô). Sổ năm đã khóa đọc như cũ. Kết quả không đổi (test so với cách quét cả sổ).

### Added
- **Hệ Thống › 🧹 Dọn Dẹp UNC** (cạnh Tạo Lại UNC), cùng cách với Dọn Dẹp MISA: theo khoảng **Thời gian tạo** (như Báo Cáo UNC); 3 loại — **Trùng hồ sơ** (giữ lần tạo UNC mới nhất, đúng dòng Báo Cáo UNC đang hiện), **Mồ côi** (hồ sơ không còn trong sổ 112 / Nháp), **Tất cả trong khoảng ngày**. Luôn xem trước; xóa có sao lưu, khôi phục được (nhãn “🧹 Dọn UNC”), ghi Lịch sử sửa đổi. Chỉ xóa dòng lịch sử ChiTietUNC, không đụng file UNC đã gửi ngân hàng. Quyền: Hệ Thống (như Dọn Dẹp MISA). Thay quyết định “không thêm nút xóa cho UNC” ở 2026.9.15 theo yêu cầu người dùng.

### Changed
- Dọn Dẹp MISA và UNC dùng chung khung `_donDep_` (xem trước → khóa hệ thống → sao lưu → xóa) phía máy chủ và `doDonDep(loai)` phía web — không lặp code.

### Tests
- 151 test (thêm: đọc theo khóa — đúng dòng, số ô đọc, số lần đọc có giới hạn; Dọn Dẹp UNC — xem trước, trùng/mồ côi/tất cả, khôi phục, quyền — thất bại trên 2026.9.28). Kiểm tra trình duyệt: Hệ Thống › Dọn Dẹp UNC / MISA.

## [2026.9.28] — Xuất báo cáo nhanh lại, font đồng bộ, in phiếu chi tiết thanh toán PDF (người dùng báo 28/09/2026)

### Fixed
- **Xuất Báo Cáo ĐNTT rất chậm** (247–325 giây với 2141 hồ sơ). Nguyên nhân: bản 2026.9.25 đặt chiều cao **từng dòng** một (2141 lệnh gọi Google). Nay gom các dòng liền nhau cùng chiều cao thành 1 lệnh; quá 30 nhóm thì cả bảng dùng 1 chiều cao chung (cao nhất). Căn lề đặt theo **từng cột** thay vì gửi cả ma trận; tra hồ sơ bằng Map thay vì tìm lần lượt. Số lệnh gọi khi xuất 2141 hồ sơ: **2329 → 213** (không đổi theo số hồ sơ).
- Lỗi trình duyệt `Cannot read properties of null (reading 'classList')` ở `renderBaoCaoUncFilterOptions` (và 18 chỗ tương tự): dữ liệu về khi đã rời tab thì bỏ qua, không báo lỗi.
- Modal **Chi tiết hồ sơ**: SL HĐ Dự Kiến / Lũy Kế / Còn Lại ghi đơn vị **tấn** (trước ghi nhầm “kg”).

### Changed
- **Font đồng bộ**: web app dùng 1 font (Inter) cho cả chữ và số; số giữ chữ số đều cột (`tabular-nums`) — bỏ font số riêng IBM Plex Mono. Biến `--font-chu`.
- **Bảng Đề Xuất** (Báo Cáo ĐNTT): cả bảng cùng cỡ chữ 11 (`BANG_DE_XUAT.CO_CHU`); mọi cột rộng **vừa nội dung** theo đo chữ Arial 11 (Họ tên Chủ rừng, Người nhận tiền đủ rộng cho tên dài; cột **Lần** hẹp lại). Tên đơn vị đầu báo cáo gom 1 hằng `TEN_DON_VI_BAO_CAO`.

### Added
- Nút **🖨️ In phiếu chi tiết thanh toán (PDF)** trong modal Chi tiết hồ sơ: phiếu gồm chủ rừng, người nhận, ngân hàng/STK, số HĐ, SL HĐ (tấn), số tiền, nội dung CK, diễn giải, bảng phiếu cân kèm dòng tổng, ô ký (Người lập phiếu / Kế toán trưởng / Giám đốc). Ngày giờ và số theo **Vùng xuất**; số căn phải, chữ căn trái. File lưu vào thư mục Báo cáo; nút đổi thành “📄 Mở phiếu PDF”. Quyền: nghiệp vụ (như xem chi tiết hồ sơ). `webInPhieuChiTietThanhToan_`, thông số `PHIEU_CT_TT`.
- `REGION_PRESETS` có thêm dấu phân cách nghìn/thập phân theo vùng (VN `.` `,` — US `,` `.`).

### Tests
- 144 test (thêm: phiếu PDF — lưu Drive, nội dung, số theo Vùng xuất VN/US, chặn chèn HTML, hồ sơ không tồn tại, quyền; font web đồng bộ, đơn vị tấn và nút in trong modal; số lệnh chỉnh chiều cao dòng khi xuất 2000 hồ sơ ≤ 31 — thất bại trên 2026.9.27). Mock lưu file Drive và chuyển HTML → PDF. Kiểm tra trình duyệt: modal Chi tiết hồ sơ và phiếu PDF.

## [2026.9.27] — Quy tắc căn lề toàn web app (người dùng yêu cầu 28/09/2026)

### Changed
- **File xuất**: số căn phải, tên/chuỗi căn trái ở mọi file — MISA (+ Tóm tắt), Báo Cáo UNC, Báo Cáo Chi Tiết, File UNC, Tình hình thanh toán, Báo cáo tổng hợp NG/ĐL (cả dòng tổng), Chi tiết công nợ theo phiếu cân, Đối soát tên KH (Báo Cáo ĐNTT đã có từ 2026.9.26). Dùng chung `_canhLeTheoKieu_`.
- **Bảng trên web**: tự nhận cột toàn số (số có phân cách nghìn/thập phân, kèm đ/kg/tấn/%, hoặc 1–3 chữ số như STT/Lần) → căn phải cả ô lẫn tiêu đề; dãy chữ số dài không phân cách (Số TK, CCCD, Số phiếu, Số HĐ), ngày, tên → căn trái. Tự chạy cho mọi bảng, chỉ thêm căn phải, không gỡ định dạng sẵn có; bỏ qua ô trống/“—” và cột có nút/ô nhập.
- Quy định ghi vào `docs/ARCHITECTURE.md`.

### Tests
- 135 test (thêm nhận diện số/mã trên web; căn lề file Báo Cáo UNC, Báo Cáo Chi Tiết, MISA + Tóm tắt — thất bại trên 2026.9.26). Kiểm tra trình duyệt: Danh sách ĐNTT, Báo Cáo Chi Tiết, Báo Cáo MISA.

## [2026.9.26] — Báo Cáo ĐNTT: Nội dung CK luôn 2 dòng, căn lề theo kiểu dữ liệu (người dùng yêu cầu 28/09/2026)

### Changed
- Bảng Đề Xuất: **Nội dung chuyển khoản luôn 2 dòng**, ngắt ở chỗ 2 dòng dài gần bằng nhau, không ngắt ngay sau từ 1–2 ký tự (“HĐ số 20260901002” đi liền). Cột tự rộng vừa đủ để mọi dòng đúng 2 dòng (250–400px). Chỉ đổi cách hiển thị trong file — nội dung CK gửi ngân hàng / UNC / MISA giữ nguyên.
- **Căn lề theo kiểu dữ liệu** ở cả Bảng Đề Xuất và Bảng Kê Chi Tiết (bản chờ duyệt và chính thức): cột toàn số (STT, Lần, KL, Đơn giá, Số tiền…) căn **phải**; tên, chuỗi (kể cả Số TK/Số phiếu/Số HĐ dạng chữ, ngày dạng chữ) căn **trái**; tiêu đề căn giữa. Lần TT ghi dạng số.
- Thông số độ rộng chữ đo lại theo dòng nhiều chữ số (Nội dung 8,2px, Ghi chú 7,25px/ký tự, Ghi chú 310px).

### Tests
- 132 test (thêm: Nội dung CK đúng 2 dòng cân đối, căn lề Bảng Đề Xuất và Bảng Kê Chi Tiết — thất bại trên 2026.9.25). Mock lưu căn lề từng ô.

## [2026.9.25] — Bảng Đề Xuất: cột Ghi chú vừa phải, xuống dòng cân đối (người dùng báo 28/09/2026)

### Fixed
- Cột **Ghi chú** của Bảng Đề Xuất (sheet 1 Báo Cáo ĐNTT, cả bản chờ duyệt và bản chính thức) chỉ dựa vào ký tự xuống dòng giữa các mục → ở chỗ không bật tự xuống dòng (file tải về, định dạng bị chép đè) chữ **dính liền** “214.11Đã trả”; cột rộng, dòng thấp nên **Nội dung CK bị cắt** dòng cuối.
- Nay Ghi chú xếp **2 mục mỗi dòng** (“Tổng KL · Đã trả” / “Còn lại · Đề nghị đợt này” / “Phiếu”), mục dài không vừa thì tách riêng; trong mỗi mục dùng khoảng trắng không ngắt nên chỉ xuống dòng giữa các mục, và kể cả khi trình xem bỏ qua xuống dòng các mục vẫn cách nhau.
- Độ rộng cột theo đo thực tế Arial cỡ 12 (giữ chữ to như 2026.7.2): Nội dung CK 270px (2 dòng), Ghi chú 300px; bật cả tự xuống dòng kiểu Excel; **chiều cao từng dòng tính theo số dòng chữ** (ngắt theo từ) thay cho tự co của Sheets. Thông số gom 1 chỗ `BANG_DE_XUAT`.
- Dữ liệu Ghi chú trong sổ 112 và phần Diễn giải trên web giữ nguyên.

### Tests
- 129 test (thêm `bangDeXuat.test.mjs`: 2 mục/dòng, không dính chữ khi bỏ xuống dòng, không ngắt giữa mục, độ rộng vừa phải, chiều cao đủ — thất bại trên 2026.9.24). Mock lưu độ rộng cột / chiều cao dòng.

## [2026.9.24] — Khối lượng dự kiến của hợp đồng tạo trên app Hợp Đồng (người dùng báo 28/09/2026)

### Fixed
- Hợp đồng ông Bình (tạo hôm trước trên app Hợp Đồng) **không có khối lượng dự kiến** khi làm thanh toán. Nguyên nhân (đọc code app Hợp Đồng HDMB_HAK): app chỉ ghi KL dự kiến vào **từng lô rừng (HD_RUNG)** và bảng `ct_hopdong`; cột Z “SL_Dự kiến” của HD_NCC chỉ ghi từ ô `slDuKien` mà màn hình nhập hợp đồng không gửi → **Z = 0** với mọi hợp đồng tạo trên app. Web app thanh toán chỉ đọc cột Z.
- Nay SL dự kiến = **tổng KhoiLuongDuKien các lô rừng** của hợp đồng (theo ID_HD), không có lô rừng thì dùng cột Z — đúng quy tắc app Hợp Đồng dùng trong báo cáo của nó. Áp dụng ở bản sao HD_NCC (tạo hồ sơ, tóm lược hợp đồng, tiến độ, SL HĐ dự kiến của 112) và báo cáo công nợ theo hợp đồng. Cột HD_RUNG tra theo tiêu đề; không có sheet HD_RUNG thì như cũ.
- Hồ sơ Nháp đã tạo với SL HĐ = 0: bấm “Đề Nghị Thanh Toán (tính lại)” để tự bù (sau khi bản sao HD_NCC làm mới — tối đa 10 phút hoặc bấm Làm mới).

### Tests
- 127 test (thêm `klDuKienHopDong.test.mjs`: HĐ tạo trên app = tổng lô rừng, HĐ cũ giữ cột Z, có cả 2 thì theo lô rừng, báo cáo công nợ cùng quy tắc, không có HD_RUNG như cũ — thất bại trên 2026.9.23).

## [2026.9.23] — Ghi sổ theo Vùng Lãnh Thổ, xuất file theo Vùng xuất (người dùng chốt 28/09/2026)

### Fixed
- **Sổ ChiTietUNC**: Ngày hiệu lực ghi CHỮ theo Vùng xuất ("05/09/2026") vào cột **không khóa TEXT** — file Sheet locale US tự đọc thành **09/05** (ngày ≤ 12) hoặc để chữ (ngày > 12). Nay ghi **Date thật**, cột định dạng theo Vùng Lãnh Thổ. ⚠️ Dòng cũ có ngày ≤ 12 có thể đã bị Sheets đọc lộn — cần soát tay.
- **Sổ ChiTietDNTT**: Ngày CK, Ngày nhập ghi CHỮ theo Vùng xuất → nay **Date thật** theo Vùng Lãnh Thổ (cột được định dạng lại 1 lần; dòng cũ dạng chữ vẫn đọc đúng).
- File **Báo Cáo Chi Tiết** khóa TEXT nhầm cột (3,4,5,7,17 thay vì Ngày CK/Ngày nhập/Số HĐ/Số TK) và ghi nguyên chữ từ sổ; file **Báo Cáo UNC** không khóa cột Ngày hiệu lực/Thời gian tạo và ghi ngày dd/MM cố định. Nay khóa đúng cột, ngày/giờ theo Vùng xuất.
- Tiêu đề khoảng ngày của **Báo Cáo ĐNTT** (“Thời gian: 2026-09-01 - 2026-09-30”, “CHỜ DUYỆT - dd/MM/yyyy” viết cố định) nay theo Vùng xuất.
- Dòng MISA ghi lúc Duyệt định dạng Ngày CK theo Vùng xuất ngay lúc ghi (không phụ thuộc cách sổ lưu).
- Nút **Khóa định dạng** thêm cột ngày của ChiTietDNTT và ChiTietUNC.

### Tests
- 125 test (thêm `quyDinhNgay.test.mjs`: 2 sổ lưu Date + định dạng cột theo Vùng Lãnh Thổ, web dd/mm, file xuất/MISA đổi theo Vùng xuất VN/US, dòng cũ dạng chữ vẫn đọc đúng, tiêu đề khoảng ngày — 3 test thất bại trên 2026.9.22). Mock lưu định dạng ô.

## [2026.9.22] — Quy định định dạng ngày giờ: web VN, Google Sheet theo Vùng Lãnh Thổ, xuất theo Vùng xuất (người dùng chốt 28/09/2026)

### Changed
- **Mọi ô ngày trong web app (32 ô: báo cáo, Hệ Thống, Mở Đóng TT, Duyệt…) hiện/nhập dd/mm/yyyy** bất kể ngôn ngữ trình duyệt: gắn tự động ô gõ dd/mm/yyyy (26/09/2026, 26-9-2026, 26092026) + nút lịch 📅 đồng bộ 2 chiều; gõ sai báo đỏ và ô lịch rỗng. Code cũ đọc/gán `.value` (yyyy-mm-dd) không phải sửa. Ô Duyệt dùng chung thành phần này (bỏ phần code riêng của 2026.9.21).
- Web luôn hiện ngày kiểu VN kể cả với dữ liệu ghi dạng chữ theo Vùng xuất (Báo Cáo Chi Tiết, Báo Cáo MISA, Dọn dẹp MISA); file xuất vẫn theo Vùng xuất.
- Quy định ghi vào `docs/ARCHITECTURE.md`.

### Tests
- 121 test (thêm: Vùng xuất US → sheet MISA / file xuất theo US, web vẫn dd/mm/yyyy). Kiểm tra giao diện trình duyệt en-US: Báo Cáo MISA, Hệ Thống (12 ô ngày), Duyệt.

## [2026.9.21] — Duyệt: chọn ngày thanh toán không phụ thuộc ngôn ngữ trình duyệt (người dùng báo 28/09/2026)

### Fixed
- “Chọn ngày không được để duyệt”: ô lịch của trình duyệt (2026.9.19) hiện theo **ngôn ngữ trình duyệt** — Chrome tiếng Anh là **tháng/ngày/năm**, gõ “26” vào ô đầu (tháng) thì không nhận. Nay:
  - Ô gõ **luôn ngày/tháng/năm** kiểu VN (26/09/2026, 26-9-2026, 26.09.2026 hoặc 26092026), không theo vùng hay trình duyệt;
  - Nút lịch 📅 bên cạnh, đồng bộ 2 chiều với ô gõ;
  - Dòng “Ngày CK sẽ ghi: Thứ Bảy, 26/09/2026”; ngày không có thật → báo đỏ, không gửi; ngày sau hôm nay phải xác nhận.
  - Máy chủ vẫn nhận `yyyy-mm-dd` (không mơ hồ) như 2026.9.19.

### Tests
- 120 test (thêm test đọc ngày ô Duyệt: các cách gõ VN đúng; 09/26/2026, 31/02, năm 2 chữ số… bị từ chối). Kiểm tra giao diện với trình duyệt en-US và vi-VN.

## [2026.9.20] — Tiêu chuẩn vùng: Google Sheet US, xuất MISA VN (người dùng chốt 28/09/2026)

### Changed
- Tiêu chuẩn khai báo 1 chỗ (`VUNG_MAC_DINH`): **Vùng lãnh thổ = US** (theo file Google Sheet), **Vùng xuất = VN** (file MISA / Excel xuất ra, dd/mm/yyyy). Chỉ dùng khi Cài đặt chưa chọn; chọn ở Cài đặt vẫn được tôn trọng.

### Fixed
- **Vùng xuất chưa cài riêng thì đi theo Vùng lãnh thổ (US)** → dòng MISA (Update_NganHang_DN), file XUAT MISA và cột ngày ChiTietDNTT ra **mm/dd/yyyy**. Nay mặc định VN, độc lập với Vùng lãnh thổ. ⚠️ Nếu trước đây Cài đặt › Vùng xuất để trống, các dòng MISA cũ đã ghi dạng mm/dd/yyyy — dòng mới từ bản này là dd/mm/yyyy.
- Cài đặt ghi rõ tiêu chuẩn của từng vùng.

### Tests
- 119 test. Dữ liệu test chạy đúng tiêu chuẩn (vùng mặc định US/VN; Duyệt gửi `yyyy-mm-dd` như ô lịch). Thêm test: Vùng lãnh thổ US + Vùng xuất chưa cài → MISA, file xuất MISA, ChiTietDNTT đều dd/mm/yyyy (thất bại trên 2026.9.19).

## [2026.9.19] — Duyệt: Ngày CK không còn bị đọc nhầm (người dùng báo 28/09/2026)

### Fixed
- Chọn ngày thanh toán **26/09/2026** lúc Duyệt mà sổ ghi Ngày CK **09/02/2028**: ô ngày là ô chữ, máy chủ hiểu theo **Vùng lãnh thổ** (máy chủ đang đặt **US** = tháng/ngày) nên “26/09/2026” thành *tháng 26* và không hề kiểm tra — Date tự cộng dồn sang 09/02/2028. Đã tái hiện đúng trên bản cũ.
  - Máy chủ (`_parseNgayTheoVung_`): **từ chối ngày không có thật** (tháng 26, 31/02, năm ngoài 2000–2100…) và báo rõ; nhận thêm dạng `yyyy-mm-dd` (không mơ hồ, không phụ thuộc vùng).
  - Màn Duyệt: ô **chọn ngày bằng lịch** (gửi `yyyy-mm-dd`), hiện lại “Ngày CK sẽ ghi: dd/mm/yyyy”; ngày sau hôm nay phải xác nhận thêm. Không cần gọi thông tin vùng nữa.
- Hồ sơ đã bị ghi 09/02/2028: **Mở Đóng TT** (chủ rừng + ngày 09/02/2028 + lần TT) rồi Duyệt lại với ngày đúng — MISA/ChiTiết được xóa (có sao lưu) và ghi lại theo ngày mới.

### Tests
- 118 test (thêm `ngayThanhToan.test.mjs`: vùng US gõ 26/09/2026 bị từ chối, không ghi gì; ngày không có thật bị từ chối; `yyyy-mm-dd` đúng ở cả VN/US; gõ tay vẫn theo vùng — 2 test thất bại trên 2026.9.18).

## [2026.9.18] — Tạo lại MISA chọn đúng ngày thanh toán (người dùng báo 28/09/2026)

### Fixed
- **Hệ Thống › Tạo Lại MISA** chọn hồ sơ theo **Ngày ĐN** (ngày lập đề nghị, cột ngày của sổ 112), trong khi Báo Cáo MISA, file xuất, Tạo bổ sung, Dọn dẹp và chính dòng MISA (Ngày hạch toán) đều theo **Ngày CK** (ngày thanh toán). Hậu quả: chọn đúng ngày thanh toán thì báo “không có hồ sơ”; chọn ngày lập ĐN thì tạo ra dòng MISA mang ngày khác, xem Báo Cáo MISA cùng khoảng không thấy. Nay Tạo lại MISA chọn theo **Ngày CK**; ô ngày ghi rõ “Ngày CK”.
- Chọn dòng CT theo Ngày CK (`_ctTheoNgayCK_`) và lấy hồ sơ theo mã (`_hoSoDaChotTheoMa_`) dùng chung cho Tạo lại MISA, kiểm tra thiếu và Tạo bổ sung.
- Tạo lại **UNC** vẫn chọn theo Ngày ĐN như trước (khớp Báo Cáo Thanh Toán / 112).

### Tests
- 115 test (thêm test Tạo lại MISA theo Ngày CK — thất bại trên 2026.9.17).

## [2026.9.17 + test] — chỉ thêm test (code web app không đổi)

### Tests
- 114 test. Thêm 2 test **cờ “đang khóa sổ”** trên file Phiếu Cân (Developer Metadata `HAK_KHOA_SO_NAM_DANG_CHAY`, có từ 2026.9.10 nhưng trước đây chưa được kiểm chứng — mock chưa hỗ trợ nên lệnh đặt cờ lỗi và bị bỏ qua trong test): suốt lúc xóa dòng PhieuCan_DN có đúng 1 cờ `{nam, batDau, ung: "DNTT"}` hiển thị DOCUMENT; xem trước không đặt cờ; xong thì gỡ; lỗi giữa chừng vẫn gỡ; cờ sót từ lần bị ngắt được thay. Đã thử bỏ đặt cờ / bỏ gỡ cờ → test đỏ. Mock thêm Developer Metadata cấp spreadsheet.
- Thêm `triggers.test.mjs`: 3 trigger tự động (7:30/13:00, 15:00, 10 phút) chạy được khi **không có ai đăng nhập** và khi người chạy **không có trong danh sách phân quyền** — phân quyền chỉ áp dụng cho lời gọi từ trình duyệt (`api`). Đã thử cố ý gắn kiểm tra quyền vào trigger 15:00 → test đỏ.

## [2026.9.17] — Báo Cáo MISA: cảnh báo hồ sơ đã chốt thiếu dòng MISA + “Tạo bổ sung” (người dùng đồng ý 27/09/2026)

### Added
- **Báo Cáo MISA › 🔍 Xem** kiểm tra thêm: phiếu cân **đã chốt** (sổ CT, kể cả năm đã khóa sổ) có **Ngày CK** trong khoảng đang xem mà Số phiếu cân **chưa có** dòng nào trong `Update_NganHang_DN` (vd lần tự động ghi lúc Duyệt bị lỗi, hoặc dòng đã bị xóa). Có thì hiện khung ⚠️ “N phiếu cân của M hồ sơ đã chốt chưa có dòng MISA” kèm danh sách (tối đa 50 dòng).
- Nút **➕ Tạo bổ sung** (vai trò Kế toán trở lên; Chỉ xem chỉ thấy cảnh báo): chỉ ghi các phiếu còn thiếu, không tạo trùng; thông tin người nhận lấy từ sổ 112 theo mã hồ sơ (kể cả sửa tay), giống Tạo lại MISA. Tự làm theo lô 150 hồ sơ tới khi xong, rồi tải lại màn hình.
- Kiểm tra thiếu bị lỗi thì màn MISA vẫn hiện dữ liệu, chỉ báo “chưa kiểm tra được”.

### Changed
- Ghi dòng MISA còn thiếu (kiểm tra trùng + ghi trong 1 khóa) tách thành `_ghiMisaChuaCo_`, dùng chung cho Tạo lại MISA (Hệ Thống) và Tạo bổ sung. Lấy dòng CT của các hồ sơ tách thành `_ctDongCuaHoSo_` (dùng trong `_gomChiTietChuyenKhoan_`).

### Giữ nguyên (người dùng quyết định 27/09/2026)
- **Mở Đóng TT vẫn xóa dòng MISA** của hồ sơ (có sao lưu) — không giữ lại.

### Tests
- 110 test (thêm 2 test: phát hiện phiếu thiếu, Tạo bổ sung chỉ ghi phiếu thiếu + giữ số 0 đầu STK, chạy lại không ghi thêm; quyền Nghiệp vụ). Test phân quyền trang nhận biết hàm có chặn `coQuyen(...)` ở đầu.

## [2026.9.16] — Nhật ký thao tác giữ số 0 đầu của mã (phát hiện khi chạy test lặp lại)

### Fixed
- Cột **Mã hồ sơ** của `NhatKyThaoTac` ghi không khóa dạng chữ: mã toàn chữ số (vd mã lỗi `01234567`, khoảng 2% số mã lỗi) bị Google Sheets đổi thành số, mất số 0 đầu → Quản trị tra mã lỗi người dùng báo không ra. Nay `logAction_` luôn ghi cột này dạng chữ (`_dongAnToan_(…, [3])`).

### Tests
- 108 test. Thêm test mã lỗi toàn chữ số (thất bại trên 2026.9.15) — trước đây test lỗi hệ thống thỉnh thoảng đỏ vì đúng lỗi này.
- `uncHistory.test.mjs` lấy “hôm nay” theo giờ VN như code (trước lấy theo UTC nên đỏ từ 0 giờ đến 7 giờ sáng VN).

## [2026.9.15] — Nút Dọn Dẹp MISA (người dùng yêu cầu 27/09/2026)

### Added
- Hệ Thống › **🔧 Tạo Lại MISA** có thêm phần **🧹 Dọn Dẹp MISA** (vai trò có quyền Hệ Thống): xóa dòng thừa trong `Update_NganHang_DN` theo khoảng **Ngày CK**, chọn 1 trong 3 loại:
  - **Trùng Số phiếu cân** — giữ dòng xuất hiện đầu tiên trong file, xóa các dòng lặp lại;
  - **Mồ côi** — Số phiếu cân không còn trong sổ đã chốt (kể cả năm đã khóa sổ); dòng nhập tay không có Số phiếu cân thì giữ;
  - **Tất cả trong khoảng ngày** — dùng trước khi Tạo lại MISA cho sạch.
- Luôn **Xem trước** (danh sách + lý do, không đổi dữ liệu) rồi mới hiện nút **Xóa N dòng** (có xác nhận). Đổi loại/ngày sau khi xem thì phải xem lại. Lúc xóa quét lại dữ liệu mới nhất trong khóa hệ thống; dòng bị xóa **sao lưu** và khôi phục được ở Hệ Thống › Khôi Phục (nhãn “🧹 Dọn MISA”), ghi Lịch Sử Sửa Đổi.
- Lọc ngày của Báo Cáo MISA, file xuất và Dọn dẹp dùng chung 1 hàm (`_boLocNgayMisa_`).

### Không thêm nút xóa cho UNC
- `ChiTietUNC` là dấu vết file UNC đã gửi ngân hàng. Dòng trùng đã được xử lý từ 2026.9.14 (tạo lại thì thay bản cũ, báo cáo chỉ hiện bản mới nhất); dòng của hồ sơ không còn tồn tại đã có Bảo Trì › Xóa Mồ Côi ChiTietUNC.

### Tests
- 107 test (thêm 4 test Dọn dẹp MISA: xem trước không đổi dữ liệu, trùng giữ dòng đầu + khôi phục giữ số 0 đầu, mồ côi bỏ qua dòng nhập tay, chỉ trong khoảng ngày, từ chối thiếu ngày / chế độ lạ).

## [2026.9.14] — Báo Cáo UNC không nhân dòng khi tạo lại UNC (người dùng báo 27/09/2026)

### Fixed
- Mỗi lần bấm **Tạo File UNC** (Danh Sách ĐNTT) hoặc **Tạo lại UNC** (Hệ Thống), lịch sử `ChiTietUNC` **ghi thêm** dòng mới, không thay dòng cũ của cùng hồ sơ → tạo lại 3 lần thì Báo Cáo UNC hiện hồ sơ đó 3 lần. Nay tạo lại **thay** dòng cũ của đúng các hồ sơ đó (giống ChiTietDNTT khi In Báo Cáo ĐNTT); dòng cũ được sao lưu, khôi phục được ở Hệ Thống › Khôi Phục (nhãn “🔁 Tạo lại UNC (thay bản cũ)”).
- Dữ liệu đã bị nhân dòng từ trước: Báo Cáo UNC (xem + xuất Excel) chỉ lấy **lần tạo mới nhất** của mỗi hồ sơ.
- Cảnh báo “hồ sơ đã từng có UNC” vẫn giữ (tránh nộp ngân hàng trùng), ghi rõ bản mới thay bản cũ.

### Tests
- 103 test (thêm `uncHistory.test.mjs`: tạo lại 3 lần còn 1 dòng + 2 bản sao lưu; dữ liệu cũ nhiều dòng chỉ hiện bản mới nhất — cả 2 thất bại trên 2026.9.13).

## [2026.9.13] — Xuất MISA trở lại đúng mẫu cũ (người dùng báo 27/09/2026)

### Fixed
- **Báo Cáo MISA › 📥 Xuất file MISA** trở lại như bản 2026.8: file **“XUAT MISA (…)”** có sheet `XuatMISA` **đúng mẫu nhập MISA — 33 cột, dòng tiêu đề chép nguyên từ Update_NganHang_DN**, cột chữ giữ số 0 đầu (Số phiếu cân, TK, CCCD, STK, Số HĐ). Từ khi chuyển sang lọc theo ngày, nút này chỉ còn xuất bảng tóm tắt 9 cột, không nhập được vào MISA.
- Bảng tóm tắt 9 cột vẫn giữ, ở sheet thứ 2 `TomTat`. Màn hình và file xuất dùng chung 1 hàm lọc (`_locMisaTheoNgay_`) nên luôn cùng số dòng.
- Danh sách cột chữ của mẫu MISA khai báo 1 chỗ (`MISA_COT_CHU`), dùng chung cho ghi tự động lúc Duyệt, Tạo lại MISA và file xuất.

### Tests
- 101 test (thêm `misa.test.mjs`: 33 cột, tiêu đề, lọc theo ngày TT, số 0 đầu, sheet tóm tắt, khớp màn hình).

## [2026.9.7 → 2026.9.12] — Đồng bộ từ code trên main (commit “UPDATE270920265”, 27/09/2026)

Code.gs / Index.html đã được cập nhật trực tiếp trên main; mục này ghi lại theo chú thích phiên bản trong code và phần so sánh với 2026.9.6.

### Fixed
- **Mở Đóng TT** (9.12, R-05): xóa khỏi sổ chính (có sao lưu) TRƯỚC rồi mới ghi hồ sơ Nháp; lỗi giữa chừng không còn để hồ sơ nằm ở cả 2 nơi — báo rõ mã thao tác để Khôi phục. Mở khóa phiếu cân tìm theo cột Số phiếu cân (SO_CT) — đúng cột Duyệt đã khóa, mọi dòng cùng số (9.7).
- **Duyệt**: chặn thêm trường hợp 1 phiếu cân nằm ở 2 dòng Nháp trong CÙNG lượt Duyệt (2 hồ sơ, hoặc 2 lần trong 1 hồ sơ).
- **Công nợ theo phiếu cân tại 1 ngày** (9.7): so theo ngày giờ VN — phiếu trả đúng ngày đang xem không còn bị tính là nợ.
- **Tình hình thanh toán**: sắp theo ngày thật (trước đây so chuỗi dd/MM/yyyy, sai khi qua nhiều tháng).
- **Xóa hồ sơ Nháp** (9.7): dọn ChiTietDNTT / ChiTietUNC có sao lưu (khôi phục được, nhãn “🗑️ Xóa hồ sơ Nháp”), xóa theo khối.
- **Đối soát tên KH** (9.7): tra theo cột Số phiếu cân, sửa mọi dòng cùng số.
- **Số dạng chữ kiểu Việt Nam** (9.11, R-14): `utils.parseNum` đọc đúng “1.234.567”, “12,5”… (trước: 1,234 và 125).
- **Xuất PDF** (9.11, R-18): Google trả lỗi thì không lưu trang lỗi thành .pdf; báo cáo tổng hợp vẫn trả file Excel kèm cảnh báo.
- Nhật ký lỗi ghi (9.11, R-06): ghi thất bại thì ghi vào nhật ký thực thi Apps Script, không mất âm thầm.
- Sheet Thông Số (9.7): hiện link file ĐANG DÙNG (đã đổi ở Cài đặt), không phải mặc định trong code.

### Changed
- **Báo cáo ĐNTT** (9.8): in theo thời gian lập hồ sơ; Bảng kê chi tiết cùng thứ tự hồ sơ.
- **Khóa sổ năm** (9.10): cờ “đang khóa sổ” trên file Phiếu Cân cho QL_NHAPKHO (xem ARCHITECTURE §4e).
- Tạo file báo cáo dùng `moveTo` thư mục (thay addFile/removeFile đã lỗi thời); mở File Chính 1 lần mỗi lượt chạy; Tổng hợp 112 đọc “Lần TT” 1 lần.
- **Giao diện** (9.7): chế độ sáng / tối (nút ở chân thanh bên), điều khiển bằng bàn phím + trình đọc màn hình, giảm chuyển động, bảng cuộn ngang trên điện thoại, bản in gọn; nút mở file là thẻ link đúng chuẩn.

### Removed
- **Webhook làm mới cache tức thì** (9.9, người dùng yêu cầu): bỏ `?action=lam_moi_cache`, menu “🔑 Xem Link Webhook…”, nút ở Cài đặt. Đoạn onChange cũ còn cài ở file Phiếu Cân / HD_NCC chỉ nhận lỗi, không làm gì.
- Code không còn dùng: `searchChuRungNames_`, `getChuRungContext_`, `getNguoiDeNghiInfo_`, `getSoHopDongOptions_`, `getNguoiNhanTienOptions_`, `_hdNccActiveData_`…

### Tests
- 100 test: bỏ `showWebhookInfoDialog` khỏi danh sách hàm công khai; thêm test đọc số dạng chữ kiểu Việt Nam.

## [2026.9.6] — Ngày đề nghị, % tiến độ, đo hiệu năng

### Added
- Danh sách ĐNTT: cột **Ngày đề nghị** (cột Q của 112 Nháp; hồ sơ cũ lấy ở CT Nháp).
- Màn hình chờ hiện **% tiến độ ước tính + số giây đã chờ** (Google không báo tiến độ giữa chừng nên % tính theo thời gian các lần chạy trước của cùng chức năng; lâu hơn thường lệ thì báo).
- **Hệ Thống › ⏱️ Hiệu Năng**: tự ghi mọi lần chạy từ 3 giây trở lên (web app + trigger 7:30/13:00, 15h, 10 phút) và các lần Google **dừng vì quá 6 phút** (sheet `SYS_HieuNang` trong File Nháp); bảng chậm nhất / quá giờ xếp trước + 50 lần gần nhất. Khi 1 chức năng bị dừng vì quá giờ, người dùng thấy thông báo rõ thay vì lỗi kỹ thuật.
- `docs/HIEU_NANG.md`: kết quả đo khối lượng đọc/ghi của từng chức năng.

### Changed
- **Duyệt** nhanh hơn: không đọc lại toàn bộ Phiếu Cân và sổ CT lần 2 khi cập nhật Phân Tích ngày thanh toán (1,44 → 0,82 triệu ô với dữ liệu 1 năm). Số liệu Phân Tích không đổi (test đối chiếu với tính lại từ đầu).

### Tests
- 99 test (thêm 4: ghi lần chạy chậm, trigger quá giờ, quá giờ do trình duyệt báo, Duyệt không đọc Phiếu Cân 2 lần — test này thất bại trên bản cũ).

## [2026.9.5] — Đăng nhập khi web app nằm trong trang chủ (web app khác)

### Fixed
- Người dùng (không phải chủ script) mở web app **nhúng trong trang chủ**: bấm “Đăng nhập bằng Google” làm cả tab rời trang chủ, đăng nhập xong web app mở toàn trang, quay lại trang chủ lại phải đăng nhập (vòng lặp). Nay khi đang nhúng, Cổng mở ở **cửa sổ nhỏ**; đăng nhập xong cửa sổ tự đóng và web app trong trang chủ tự vào hệ thống. Trình duyệt chặn popup → hiện link mở ở tab mới.
- Bảo mật giữ nguyên: mã từ Cổng vẫn ký HMAC, hạn 5 phút, dùng 1 lần; mã yêu cầu 128 bit ngẫu nhiên nằm trong phần đã ký; phiên chỉ trao 1 lần.
- ⚠️ Cần **dán lại mã Cổng đăng nhập** (Cài đặt › Cấu hình đăng nhập) vào dự án Cổng rồi Deploy lại — Cổng cũ không chuyển tiếp mã yêu cầu.

### Tests
- 95 test (thêm 1: đăng nhập từ trang nhúng; kiểm tra thêm cửa vào công khai `nhanPhienDangNhap`).

## [2026.9.4] — Vai trò Kế toán tổng hợp (người dùng yêu cầu 27/09/2026)

### Added
- Vai trò **Kế toán tổng hợp**: đủ quyền Kế toán + **toàn bộ trang Hệ Thống** (Đối soát tên KH, Bảo trì, Cập nhật ngân hàng, Mở Đóng TT, Khóa sổ năm, Khôi phục dữ liệu đã xóa, Lịch sử sửa đổi, Đồng bộ ChiTietDNTT, Tạo lại MISA/UNC) — người dùng chọn “Toàn bộ Hệ Thống”. Không vào Cài đặt (người dùng, Cổng đăng nhập, kết nối file, trigger…).
- Quyền mới `HE_THONG` giữa Kế toán và Quản trị; các chức năng trang Hệ Thống và menu Sheet “Vá Ngân Hàng Còn Trống” chuyển sang quyền này (Quản trị vẫn làm được tất cả).

### Tests
- 94 test (thêm 1: Kế toán tổng hợp vào được mọi chức năng Hệ Thống, không vào Cài đặt; Kế toán không vào Hệ Thống).

## [2026.9.3] — Trang chủ mở nhanh

### Fixed
- **Trang chủ tải rất lâu**: “Tổng nợ / Top 5 khách hàng nợ” tính lại TOÀN BỘ công nợ (đọc cả PhieuCan_DN + sổ đã chốt, ~720 nghìn ô với 15.000 phiếu) mỗi khi vừa Duyệt, sang ngày mới trước trigger 7:30, hoặc có người xem Báo cáo Công nợ khoảng ngày khác. Nay Trang chủ đọc bản tổng hợp gọn (Tổng nợ + Top 5) lưu mỗi lần công nợ khoảng mặc định được tính (trigger 7:30/13:00, nút Cập nhật, Báo cáo Công nợ khoảng mặc định) — chỉ còn đọc ~17 nghìn ô của File Nháp, không mở file Phiếu Cân / File Chính.
- Trang chủ không còn che cả màn hình khi tải; ghi rõ thời điểm tổng hợp công nợ + nút **🔄 Cập nhật ngay**.
- Bỏ lượt đọc cả sheet DNTT_GK_DN mỗi lần mở Trang chủ (số “đơn xin cũ chưa xử lý” chỉ Trợ lý AI dùng — nay chỉ tính khi hỏi AI).

### Tests
- 93 test (thêm 1; thất bại trên 2026.9.2).

## [2026.9.2] — Xuất lại Báo cáo Thanh toán của năm đã khóa sổ

### Fixed
- Xuất Báo cáo Thanh toán (và Tạo lại MISA theo ngày) cho hồ sơ của năm đã khóa sổ: sheet “Bảng Kê Chi Tiết CK” bị trống vì chỉ đọc sổ đang mở. Nay đọc thêm file DATA của đúng các năm có hồ sơ được chọn.

### Tests
- 92 test (thêm 1; thất bại trên 2026.9.1).

## [2026.9.1] — Khóa sổ năm thành 1 thao tác (người dùng yêu cầu 26/09/2026)

### Changed
- **Hệ Thống › 🔒 Khóa Sổ Năm** thay cho quy trình 3 bước của 2026.9.0 (tự chuyển sổ ĐNTT → đăng ký file → bấm chuyển phiếu cân), vì làm riêng từng bên thì giữa các bước sổ ĐNTT và Phiếu Cân **lệch nhau** (công nợ tính dư). Nay 1 lần bấm, trong khóa hệ thống:
  - tự tạo file **DATA<năm>** (cùng thư mục File Chính), chuyển các hồ sơ thanh toán trong năm ở DNTT_GK_DN, _CT, _112, ChiTietDNTT, ChiTietUNC sang, xóa khỏi File Chính, tự đăng ký;
  - chuyển phiếu cân đã trả sang `PhieuCan_DN_<năm ngày cân>`.
  - Xem trước số dòng từng sheet; chép xong mới xóa; bị dừng giữa chừng thì bấm lại, dùng lại đúng file DATA, không chép trùng; chưa xóa xong khỏi File Chính thì chưa đăng ký (báo cáo không cộng trùng).
  - Từ chối năm chưa kết thúc và khi sổ đang mở còn hồ sơ của năm trước đó.
- Cài đặt › File lưu trữ theo năm: chỉ xem / trỏ lại file. Nhật ký `KHOA_SO_NAM` thay `CHUYEN_PHIEU_CAN_KHOA_SO`.
- QL_NHAPKHO bỏ “Chốt sổ năm” (người dùng quyết định) — khóa sổ chỉ làm ở ĐNTT.

### Tests
- 91 test; `luuTruNam` viết lại theo luồng 1 thao tác (xem trước, khóa sổ, báo cáo năm đóng không đổi + năm mở không mở file DATA, bị dừng 2 lần rồi làm tiếp không trùng, chặn năm trước còn mở, chặn Mở Đóng TT, trỏ lại file).

## [2026.9.0] — ⚖️ Khóa sổ năm (người dùng đồng ý 26/09/2026)

### Added
- **Cài đặt › 🗄️ File lưu trữ theo năm** (Quản trị): đăng ký file `DATA<năm>` chứa dữ liệu ĐNTT đã khóa sổ (giữ nguyên tên sheet). Kiểm tra: năm hợp lệ, không phải File Chính, đủ sheet `DNTT_GK_DN` / `_CT` / `_112`, và File Chính **không còn** dòng CT của file đó (tránh báo cáo cộng 2 lần). Bỏ đăng ký bằng nút “Bỏ”. Ghi nhật ký `CAU_HINH_LUU_TRU_NAM`.
- **Hệ Thống › 🔒 Chuyển Phiếu Cân Đã Khóa Sổ** (Quản trị): phiếu cân đã trả trong năm đã khóa sổ chuyển khỏi PhieuCan_DN sang sheet `PhieuCan_DN_<năm ngày cân>` (cùng file Phiếu Cân, cùng quy ước QL_NHAPKHO). Phiếu chưa trả / trả ở năm đang mở ở lại. Có xem trước, chạy theo lô 500 Số phiếu trong khóa hệ thống, chép xong mới xóa, dừng an toàn sau ~4 phút; chạy lại không chép trùng. Ghi nhật ký `CHUYEN_PHIEU_CAN_KHOA_SO`.

### Changed
- Báo cáo có khoảng ngày chạm năm đã khóa sổ **tự đọc file DATA** (và phiếu cân ở `PhieuCan_DN_<năm>`): Báo cáo 112, Lịch sử UNC, Báo cáo Thanh toán Chi tiết, MISA, Tình hình thanh toán, Phân tích Nhập/TT, Công nợ khách hàng, Sổ chi tiết, Công nợ phiếu cân tại 1 ngày. Tiến độ / Công nợ theo hợp đồng cộng mọi năm. Báo cáo năm đang mở không đọc thêm gì.
- Lũy kế công nợ khách hàng tính từ đầu năm của “Từ ngày” khi năm trước đã khóa sổ (năm cũ chỉ mang sang phiếu chưa trả); số **công nợ** không đổi.

### Fixed
- Mở Đóng TT từ chối Ngày Đóng TT thuộc năm đã khóa sổ (dữ liệu đã ở file lưu trữ).

### Tests
- 91 test (thêm 6 trong `luuTruNam`: đăng ký, báo cáo năm đóng/năm mở, xem trước + chuyển, chạy lại sau khi dừng giữa chừng, số liệu năm đóng không đổi sau khi chuyển và công nợ hiện tại = phiếu chưa trả, chặn Mở Đóng TT).

## [2026.8.4] — Chỉ đọc các cột Phiếu Cân cần dùng

### Changed
- Đọc PhieuCan_DN **chỉ 20/28 cột hệ thống dùng** (3 lần đọc A:O, R:T, W:AB); bộ nhớ đệm và bản sao “phiếu cân chưa TT” chỉ giữ 20 cột này. 8 cột không dùng: Ngày cân 2, Biển số 2, mã Nguồn gốc ghép, Hình ảnh, Mã ĐG, Timestamp, Picture, ID_PC.
- Bộ nhớ đệm Phiếu Cân nhỏ hơn ~22%/dòng → chứa được ~16.000 phiếu (trước ~12.500, ước tính).
- Mọi chỗ dùng cột Phiếu Cân gọi theo tên (`PC_COL`), thêm `GIAM_GIA` (R) và `DON_GIA_AD` (T); bỏ các hằng số cột trùng (`PC_COL_*_IDX`) và 2 khóa không dùng. Danh sách cột cần đọc tự lấy từ `PC_COL`.
- Kết quả không đổi: đối chiếu toàn bộ đầu ra (sổ đã chốt, ChiTietDNTT, Báo cáo ĐNTT, UNC, MISA, công nợ) giữa bản 2026.8.3 và bản này giống hệt; chỉ bản sao “chưa TT” để trống các cột không dùng.

### Tests
- 83 test (thêm 3: chỉ đọc đúng cột, cột không dùng không lọt vào báo cáo/sổ, không còn số cột trần).

## [2026.8.3] — Trang chủ dùng số tổng hợp 15h (người dùng đồng ý 26/09/2026)

### Changed
- **Trang chủ không còn quét cả file Phiếu Cân mỗi lần mở**: “Mua / Thanh toán tháng này” và “Mua theo Nguồn gốc / Đại lý” lấy từ **PhanTichNhapTT_DRAFT** (trigger 15h tổng hợp, cùng quy tắc tính). Ngày chưa có trong bảng (vd hôm nay trước 15h) được tính bù 1 lần rồi dùng lại. Số liệu giống hệt cách tính cũ (test đối chiếu).
- Trang chủ ghi rõ thời điểm tổng hợp gần nhất, kèm nút **🔄 Cập nhật ngay** (chạy nội dung trigger 15h).
- Báo cáo Phân tích Nhập/TT và Trang chủ dùng chung 1 hàm đọc + tính bù ngày thiếu.

### Fixed
- Trigger 15h ngày 1 hằng tháng chỉ tổng hợp tháng mới → **phiếu cân / thanh toán sau 15h ngày cuối tháng trước không bao giờ vào báo cáo Phân tích**. Nay ngày 1 tổng hợp từ hôm qua.

### Decided
- Không “gọn bộ nhớ đệm Phiếu Cân”: màn hay dùng đã đọc sheet tổng hợp. Không ghi nhật ký STK trước/sau khi sửa hồ sơ.

### Tests
- 80 test (thêm 3; test “Trang chủ không đọc PhieuCan_DN” thất bại trên bản 2026.8.2, test đối chiếu số liệu chạy qua trên cả 2 bản).

## [2026.8.2] — Khôi phục dữ liệu đã xóa (C-07)

### Added
- Hệ Thống › **♻️ Khôi Phục Dữ Liệu Đã Xóa** (Quản trị): liệt kê từng **lần xóa** đã sao lưu (Mở Đóng TT, Xóa Mồ Côi…) — thời gian, người, hành động, mã hồ sơ, số dòng theo từng sheet — và nút **Khôi phục** cả lần xóa đó.
  - Ghi lại vào cuối sheet gốc (đúng file theo File ID), giữ số 0 đầu và ngày tháng; dòng về sổ đã chốt thì **khóa lại phiếu cân** như lúc Duyệt.
  - **Từ chối** nếu làm 1 phiếu cân bị trả 2 lần: phiếu đã có trong sổ đã chốt, hoặc đang nằm trong hồ sơ Nháp (vd hồ sơ Nháp tạo ra khi Mở Đóng TT — xóa hồ sơ Nháp đó trước).
  - Mỗi dòng chỉ khôi phục được 1 lần (cột “Đã khôi phục”); ghi nhật ký `KHOI_PHUC_DONG_DA_XOA`.
- `SYS_SaoLuuDongXoa` thêm cột File ID, Mã thao tác (gom mọi dòng của 1 lần xóa), Đã khôi phục; sao lưu từ bản cũ vẫn xem và khôi phục được (gom theo hành động + người + phút).

### Changed
- Khóa phiếu cân sau khi thanh toán dùng chung 1 hàm cho Duyệt và Khôi phục.

### Decided
- Không làm sao lưu cả file theo lịch: Google Sheets đã có Lịch sử phiên bản (File › Version history).

### Tests
- 78 test (thêm 2).

## [2026.8.1] — Chặn trả tiền 2 lần cho cùng 1 phiếu cân

### Fixed
- **Có thể trả tiền 2 lần cho cùng 1 phiếu cân** (đã tái hiện được): lượt tự làm mới cache “phiếu cân chưa TT” (10 phút / nút ↻ Làm mới) đọc PhieuCan_DN **trước** khi Duyệt nhưng ghi xong **sau** khi Duyệt → cache vẫn còn phiếu vừa trả trong vài phút → Tạo mới / Thêm phiếu vào hồ sơ vẫn chọn được → Duyệt lần 2 ghi phiếu đó vào DNTT_GK_DN_CT lần nữa. Nay kiểm tra với **sổ đã chốt thật (DNTT_GK_DN_CT)**, không chỉ tin cache:
  - Tạo mới và Thêm phiếu cân vào hồ sơ: báo lỗi “Số phiếu cân … ĐÃ ĐƯỢC THANH TOÁN (hồ sơ …)”.
  - Duyệt: đọc thẳng CT thật; hồ sơ có phiếu đã trả ở hồ sơ khác thì **không chốt cả hồ sơ**, báo rõ phiếu nào, ghi nhật ký `CHAN_TRA_HAI_LAN`. Duyệt lại chính hồ sơ bị ngắt giữa chừng vẫn chạy như cũ.

### Decided
- H-01 (đọc theo tên cột) không làm: cột các file nguồn cố định, không ai sửa trực tiếp; đã có cảnh báo khi tiêu đề PhieuCan_DN thay đổi.

### Tests
- 76 test (thêm 2, đều thất bại trên bản 2026.8.0).

## [2026.8.0] — ⚖️ Công nợ theo khách hàng gom theo CCCD + Tên (M-04, người dùng đồng ý 26/09/2026)

Đổi số liệu báo cáo Công nợ theo Khách hàng (đúng hơn); tổng công nợ toàn bộ không đổi.

### Changed
- **Mỗi dòng Công nợ = 1 khách hàng theo CCCD + Tên** (trước đây chỉ theo tên → 2 người trùng tên bị cộng chung; 1 người gõ tên khác nhau giữa phiếu cân và hồ sơ bị tách làm 2, 1 dòng nợ + 1 dòng âm).
- PhieuCan_DN không có cột CCCD nên phiếu cân được gán CCCD theo quy tắc đã thống nhất:
  1. Phiếu đã nằm trong hồ sơ ĐNTT (đã chốt hoặc Nháp) → CCCD + tên của hồ sơ.
  2. Phiếu chưa vào hồ sơ → tra tên trong HD_NCC: đúng 1 CCCD thì dùng; từ 2 CCCD trở lên → dòng “⚠️ Trùng tên – chưa rõ CCCD”; không có hợp đồng → CCCD trống.
- Bảng Công nợ có thêm cột **CCCD**; Sổ chi tiết chọn/mở theo CCCD + Tên (2 người trùng tên là 2 lựa chọn); Top 5 ở Trang chủ mở đúng người.
- Snapshot `CongNoKhachHang_DRAFT` thêm cột CCCD (giữ số 0 đầu), khóa; snapshot định dạng cũ tự tính lại.

### Added
- Nút **🔎 So sánh với cách tính cũ (theo tên)** ở tab Công nợ theo Khách hàng: tổng cũ/mới, số khách hàng cũ/mới, danh sách tên có thay đổi kèm chênh lệch và cách tách theo CCCD (chỉ đọc).

### Tests
- 74 test (thêm 4 cho M-04, đều thất bại trên bản 2026.7.5).

## [2026.7.5] — Menu “Thêm Mới” mở Web App, cảnh báo hồ sơ chọn ở tab khác (⚖️ người dùng đồng ý 26/09/2026)

### Fixed
- **H-13 — Menu Sheet “4. Thêm Mới Đề Nghị Thanh Toán” báo lỗi** (mở màn hình `AddPaymentDialog` không tồn tại). Nay mở hộp thoại có nút **➕ Mở màn Tạo Mới** → Web App mở thẳng màn Tạo Mới (`?trang=taoMoi`). Nếu phải đăng nhập, Cổng đăng nhập chuyển tiếp tham số này để vào đúng màn Tạo Mới (cần dán lại mã Cổng đăng nhập mới ở Cài đặt; Cổng cũ vẫn chạy, chỉ vào Trang chủ).
- **M-03 — Hồ sơ đã chọn “biến mất” khi đổi tab**: chuyển tab ở Danh Sách ĐNTT, hồ sơ đã tích vẫn được chọn (và vẫn bị Xác nhận/In/UNC/Duyệt) nhưng ô tích hiện trống. Nay ô tích hiện đúng; thanh hành động báo rõ “⚠️ trong đó N hồ sơ ở tab khác” kèm nút **Bỏ chọn N hồ sơ này**; tab trống vẫn hiện thanh hành động nếu còn hồ sơ đang chọn.
- Lỗi JS khi rời Danh Sách ĐNTT (vd bấm ➕ Tạo Mới) trước khi danh sách tải xong.

### Decided (không sửa)
- **H-08** giữ cho phép nhúng web app (đang nhúng vào trang chủ). **H-10** giữ gửi số liệu hồ sơ cho Trợ lý AI.

### Tests
- 70 test (thêm: menu Thêm Mới + chuyển tiếp `?trang=` qua Cổng đăng nhập + chặn giá trị lạ; đếm hồ sơ chọn ở tab khác).

## [2026.7.4] — Rà soát theo kế hoạch: phân quyền, ngày giờ VN, XSS, công thức, lỗi, model AI

Không đổi nghiệp vụ; chỉ sửa lỗi và bảo mật.

### Fixed
- **Kế toán bấm “Duyệt” bị báo thiếu quyền**: màn Duyệt cần đọc định dạng vùng (dd/mm hay mm/dd) nhưng quyền đọc này lại xếp vào Quản trị → chuyển thành **Xem** (chỉ đọc). Nút **↻ Làm mới** ở Danh Sách ĐNTT (làm mới cache Phiếu Cân/Hợp đồng) chuyển thành **Kế toán**. Test mới tự dò mọi trang: trang nào gọi chức năng cần quyền cao hơn quyền mở trang sẽ báo lỗi. (Việc đổi, sửa định dạng vùng vẫn chỉ Quản trị.)
- **M-01 — Ngày mặc định lệch 1 ngày trước 7h sáng**: các ô “Đến ngày”, “Ngày đề nghị”, “Ngày hiệu lực UNC”, “Ngày thanh toán”… lấy ngày theo giờ UTC → trước 7h sáng hiện ngày hôm qua. Nay mọi ô ngày mặc định dùng giờ Việt Nam (`todayISOVN` / `isoDaysAgoVN`); bỏ hàm `isoDaysAgo` theo UTC.

### Security
- **H-07 — XSS / nút hỏng khi dữ liệu có dấu nháy**: 18 nút/dòng nhúng tên khách hàng, ID, email, số HĐ vào `onclick="f('…')"` (trình duyệt giải mã `&#39;` trước khi chạy → tên như `O'Brien` làm hỏng nút, tên độc hại chạy được mã). Thay bằng `hanhDong(tenHam, …)`: tham số nằm trong `data-ts` (JSON), đọc như dữ liệu; chỉ hàm có trong `HANH_DONG` mới gọi được. Ô chọn dùng `this.dataset.id`. Kiểm tra trên trình duyệt thật với giá trị có `'`, `"`, `<img onerror>`.
- **H-12 — Chèn công thức (formula injection)**: chữ bắt đầu bằng `=`, `+`, `-`, `@` (vd tên KH `=HYPERLINK(...)`) bị Google Sheets/Excel chạy như công thức — cả khi nhập từ web lẫn khi hệ thống **đọc lại ô chữ rồi ghi lại** (Tổng Hợp 112, Duyệt, Xóa hồ sơ, Mở Đóng TT, mirror, UNC, MISA, Báo Cáo ĐNTT, Nhật ký, Người dùng, Sửa tên KH…). Thêm `_oAnToan_` / `_dongAnToan_` (thay `_giuDangChuTheoCot_`, gộp luôn bảo vệ số 0 đầu) và áp dụng ở lớp ghi dùng chung + mọi chỗ ghi dữ liệu. Chữ hiển thị giữ nguyên; công thức cố ý (`setFormula`) không bị ảnh hưởng.
- **M-13 — Lỗi hệ thống lộ chi tiết kỹ thuật**: lỗi lập trình (TypeError…) trước đây hiện nguyên văn cho người dùng và không được ghi lại. Nay chỉ hiện “Lỗi hệ thống (mã XXXXXXXX)…”, chi tiết + stack ghi vào Nhật ký thao tác (`LOI_HE_THONG`). Lỗi nghiệp vụ hiện đúng câu tiếng Việt, bỏ tiền tố thừa “Error: ”.

### Changed
- **M-10 — Model Gemini không còn sửa trong code**: Cài đặt › Trợ Lý AI có ô **danh sách model** (thứ tự ưu tiên) và nút **🔍 Dò model khả dụng** (hỏi Google). Khi mọi model trong danh sách đều lỗi (Google ngừng hỗ trợ), hệ thống **tự dò** model còn dùng được và thử tiếp. Bỏ danh sách “model đã ngừng” viết cứng.

### Tests
- 68 test (thêm 15): phân quyền theo trang, ngày giờ VN, nút mang dữ liệu, chống công thức trên toàn luồng (mock mô phỏng Google Sheets chạy công thức), thông điệp lỗi, model Gemini. Mỗi test mới đều **thất bại trên bản 2026.7.3**.

## [2026.7.3] — Diễn giải gọn khi chọn nhiều phiếu cân

### Changed
- Diễn giải phiếu cân đã chọn (Tạo Mới): tổng số phiếu / Tổng KL / Tổng tiền hiện NGAY dưới tiêu đề; thêm cột STT; dòng gọn hơn (chữ vẫn 15px); nhiều phiếu thì bảng cuộn bên trong (~10 dòng), tiêu đề cột và dòng “Tổng cộng” luôn hiện.

## [2026.7.2] — Sửa tên KH, thêm phiếu cân khi sửa hồ sơ, Diễn giải, số 0 đầu

### Fixed
- **Sửa hồ sơ: không thấy phiếu cân cần thêm** — server chỉ trả 60 phiếu đầu tiên (cũ nhất), gộp chung với phiếu “Khách lẻ”, màn Sửa hồ sơ lại chỉ hiện 30 → phiếu mới của chính chủ rừng bị đẩy mất. Nay phiếu của **đúng chủ rừng luôn trả đủ và đứng đầu**; màn Sửa hồ sơ có **phân trang** như Tạo Mới.
- Phiếu tên **“Khách lẻ”** (có dấu) không được nhận là khách chung (chuẩn hóa giữ dấu → “KHÁCHLẺ” ≠ “KHACHLE”) → bị ẩn khỏi danh sách và đối soát. Gom 4 bản sao danh sách tên chung về 1 hằng `TEN_KHACH_CHUNG`.
- **Mất số 0 đầu** (CCCD, STK, Số HĐ, Số phiếu cân) khi hệ thống **ghi lại** dữ liệu Nháp/chính: Tổng Hợp 112, Duyệt (ghi CT/112/DNTT_GK_DN thật + dọn Nháp), Xóa hồ sơ, Bỏ phiếu cân, Sửa hồ sơ, Mở Đóng TT, cache Phiếu Cân. Khai báo cột dạng chữ `COT_CHU` cho từng loại sheet và bảo vệ ở mọi lần ghi.
- **Sửa hồ sơ** ghi lại TOÀN BỘ Draft CT (làm mất số 0 đầu của hồ sơ khác) → chỉ ghi đúng các dòng của hồ sơ đang sửa.
- `''0123` / `'undefined` khi nối dấu `'` vào giá trị đã có dấu hoặc rỗng → hàm `_chu_()` dùng chung cho mọi chỗ ghi (UNC, MISA, ChiTietDNTT, ChiTietUNC, file Excel xuất, tạo mới).
- ID_112 (18 chữ số) ghi dạng số bị Google Sheets làm tròn → ghi dạng chữ.

### Added
- **Khôi phục số 0 đầu của CCCD/CMND** đã mất ở file gốc HD_NCC/HD_STK: CCCD luôn 12 số (còn 11 → thêm 0), CMND 9 số (còn 8 → thêm 0); độ dài khác giữ nguyên. Áp dụng cho mirror hợp đồng, ChiTietDNTT, MISA.
- Nút **✏️ Sửa tên** hiện cho cả phiếu **khác tên** và phiếu **“Khách lẻ/KH/KL”** (Tạo Mới + Sửa hồ sơ); ô nhập điền sẵn **tên Chủ rừng** đang chọn; sau khi sửa phiếu vào ngay danh sách mặc định. Hướng dẫn ngay dưới ô tìm phiếu cân.
- **Diễn giải** chữ to, rõ: bảng phiếu cân đã chọn (Số phiếu, Khách hàng, KL, Đơn giá, Thành tiền, tổng) ở Tạo Mới; khối Diễn giải (Nội dung CK, Tổng KL, Đã trả, Còn lại, Đề nghị đợt này, Phiếu — mỗi mục 1 dòng) ở Chi tiết hồ sơ; file Excel Báo Cáo ĐNTT: cột Nội dung/Ghi chú rộng hơn, cỡ chữ 12, mỗi phần diễn giải 1 dòng.
- Test: 9 test mới (mock mô phỏng đúng việc Google Sheets đổi "0123" thành số) — 53 test.

### Security
- Các nút trong danh sách chọn phiếu cân dùng chỉ số dòng thay vì nhúng dữ liệu vào `onclick` (tránh lỗi/XSS khi tên có dấu nháy).

## [2026.7.1] — Hợp nhất bản code người dùng gửi (`Code_SUATENKH.gs`)

So sánh với bản người dùng đang chạy (khác `main` ~330 dòng). Giữ lại mọi thay đổi của bản đó, không làm mất bản sửa nào đã có:

### Added
- **Quản trị cố định** `QUAN_TRI_CO_DINH` = saoluucvhak@gmail.com, phuthuy.apple@gmail.com (bản của người dùng có `ADMIN_EMAILS = ["phuthuy.apple@gmail.com"]` — giữ lại để không mất quyền). Không đổi/khóa được từ web app; thêm/bớt trong code.
- Nhật ký `CANH_BAO_HEADER_PC` khi cột PhieuCan_DN thay đổi (như bản người dùng) nhưng chỉ ghi **1 lần** mỗi thay đổi, không lặp lại mỗi 10 phút; hiện ở Lịch Sử Sửa Đổi.

### Changed (tốc độ, lấy từ bản người dùng)
- Tổng Hợp 112: tra HD_NCC theo Số HĐ bằng bảng tra dựng 1 lần thay vì quét lại cho từng hồ sơ.
- Trang chủ: so ngày với mốc đầu tháng GMT+7 thay vì `Utilities.formatDate` cho từng dòng (test đối chiếu quanh ranh giới tháng/năm).

### Removed (hàm không còn nơi dùng — như bản người dùng)
- `getSwappableLinkInfo`, `setReportFolderId_`, `setDmNhSsId_`, `getMainTableData`, `getCccdListByChuRung`, `getSoTaiKhoanOptions`.

### Không lấy từ bản người dùng (đã có cách làm tốt hơn / tránh lùi lỗi)
- `_requireAdmin_()` rải từng hàm → đã thay bằng bảng phân quyền `API_ROUTES` (16 hàm bản đó giới hạn cho quản trị đều là `QUAN_TRI`).
- `?action=` kèm mã bí mật → đã bỏ hẳn các action này (người dùng xác nhận không có hệ thống ngoài gọi).
- `webSuaTenKhachHangPhieuCan` bản đó: không khóa, không cập nhật mirror (danh sách chọn phiếu cân vẫn hiện tên cũ tới lần làm mới) → giữ bản 2026.7.0.
- Bản đó **thiếu** bản sửa mất số 0 đầu ở mirror HD_NCC/HD_STK (STK, CCCD, Số HĐ) → giữ bản sửa.

## [2026.7.0] — P2: Đăng nhập Gmail & phân quyền ⚖️

⚖️ Thay đổi hành vi, người dùng đã đồng ý: dùng Cổng đăng nhập Gmail; Admin = chủ script (saoluucvhak@gmail.com); 3 vai trò Quản trị / Kế toán / Chỉ xem; bỏ các action `?action=tach_phieu|lap_de_nghi` (và 2 action đọc dữ liệu không cần đăng nhập). Không bỏ chức năng nghiệp vụ nào — chỉ giới hạn ai được dùng.

> **Lưu ý triển khai:** sau khi cập nhật, chỉ chủ script vào được web app cho tới khi Quản trị (1) thêm người dùng ở Cài đặt › Người Dùng & Phân Quyền và (2) thiết lập Cổng đăng nhập (Cài đặt › Cổng Đăng Nhập Gmail). Người được chia sẻ quyền sửa File Nháp cũng phải có trong danh sách người dùng mới dùng được menu “🚀 QUẢN LÝ HAK”.

### Added
- **Cổng đăng nhập Gmail**: dự án Apps Script riêng (chạy dưới quyền người dùng) ký HMAC-SHA256 email + hạn 5 phút + mã dùng 1 lần; web app chính xác minh và cấp phiên 6 giờ (CacheService). Mã nguồn cổng được sinh sẵn trong Cài đặt kèm hướng dẫn 3 bước.
- **Phân quyền** 3 vai trò, bảng `API_ROUTES` (93 chức năng) là nơi duy nhất quy định quyền; sheet `SYS_NguoiDung` (File Chính) quản lý người dùng, trạng thái Hoạt động/Khóa; chủ script luôn là Quản trị.
- Cài đặt: thẻ **Người Dùng & Phân Quyền** và **Cổng Đăng Nhập Gmail** (sao chép mã nguồn, lưu link, tạo lại mã bí mật).
- Giao diện: màn hình đăng nhập, thông tin người dùng + nút Đăng xuất ở thanh bên, ẩn trang theo quyền.
- Nhật ký: `DANG_NHAP`, `DANG_NHAP_BI_TU_CHOI`, `PHAN_QUYEN`, `CAU_HINH_DANG_NHAP`, `SUA_TEN_KH_PHIEU_CAN`, `XAC_NHAN_HEADER_PHIEU_CAN` (3 mục quản trị hiện ở Lịch Sử Sửa Đổi).
- Cảnh báo **cấu trúc cột PhieuCan_DN thay đổi** (giao diện đã có sẵn nhưng server chưa từng phát hiện): so tiêu đề mỗi lần làm mới cache, Quản trị xác nhận chuẩn mới.
- 14 test xác thực (đầu-cuối qua mã nguồn Cổng đăng nhập thật, chống dùng lại/giả mạo/hết hạn, khóa tài khoản, phân quyền, menu Sheet, danh sách hàm công khai).

### Changed
- Mọi lời gọi từ trình duyệt đi qua `api(phiên, chức năng, tham số)`; 114 hàm nghiệp vụ chuyển thành hàm nội bộ (tên kết thúc `_`) nên **không gọi thẳng được** bằng `google.script.run`.
- 18 hàm menu trong Sheet kiểm tra email + vai trò của người bấm menu.
- Nhật ký, sao lưu dòng xóa, lịch sử UNC, “Người tạo” hồ sơ ghi **email thật** của người thao tác (trước đây thường là `N/A`/rỗng).

### Fixed
- Nút **Sửa tên KH** ở bước chọn phiếu cân (Tạo Mới / Sửa hồ sơ) gọi hàm server không tồn tại → đã bổ sung `webSuaTenKhachHangPhieuCan` (ghi đúng 1 ô ở PhieuCan_DN + mirror).
- Nút **Xác nhận cấu trúc cột Phiếu Cân** gọi hàm server không tồn tại → đã bổ sung.

### Removed
- `doGet?action=tach_phieu`, `lap_de_nghi`, `tim_phieu_can`, `tra_cuu_hop_dong` (chạy nghiệp vụ / lộ dữ liệu không cần đăng nhập). Webhook `lam_moi_cache` (có mã bí mật) giữ nguyên.
- Hàm không còn nơi dùng: `findAvailablePhieuCan`, `getContractInfo`, `showSetupDraftDialog`.

### Security
- Đóng các rủi ro Critical C-05, C-06 (PROJECT_ANALYSIS §12). `webShareConfigLink` giữ nguyên hành vi, nay chỉ Quản trị dùng được.

## [2026.6.0] — P0 + P1: nền móng kiểm thử & an toàn dữ liệu

Không thay đổi quy trình nghiệp vụ hay giao diện. Mọi chức năng trong Phụ lục C của `docs/PROJECT_ANALYSIS.md` giữ nguyên.

### Added
- Lớp **ghi/xóa an toàn** dùng chung trong `Code.gs`: `_ghiCungGiaTri_`, `_ghiTheoDong_`, `_thayVungDuLieu_`, `_ghiLaiMirror_`, `_saoLuuVaXoaDong_`, `_tapKhoaTrongCot_`, `_chayTrongKhoa_`, `_giuDangChu_`.
- Sheet **`SYS_SaoLuuDongXoa`** (tự tạo trong File Chính): mọi dòng bị xóa bởi Mở Đóng TT / Xóa mồ côi được sao lưu nguyên dòng (JSON) kèm người thực hiện, thời gian, file, sheet, số dòng gốc. Sao lưu lỗi → không xóa.
- Nhật ký `LOI_CHOT_THANH_TOAN` khi Duyệt bị lỗi; nhật ký Đồng bộ tên KH ghi rõ tên cũ → tên mới.
- Bộ kiểm thử tự động `tests/` (Node `node:test`, 0 thư viện) với mock Apps Script chạy trong bộ nhớ — 28 test.
- Tài liệu: `docs/PROJECT_ANALYSIS.md`, `docs/REFACTOR_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/TODO.md`, `docs/ROADMAP.md`, `VERSION`, `CHANGELOG.md`.

### Changed
- `runConfirmPayment` (Duyệt/Đóng TT):
  - Không còn ghi đè **toàn bộ** `PhieuCan_DN` (file ngoài) và `DNTT_GK_DN`; chỉ ghi đúng 3 ô khóa phiếu cân và 4 ô trạng thái của đúng các dòng liên quan.
  - **Chạy lại an toàn**: hồ sơ đã có sẵn trong CT/112/DNTT_GK_DN thật (lần trước bị ngắt giữa chừng) không bị ghi trùng; hệ thống chỉ hoàn tất phần còn thiếu và báo rõ.
  - Dọn File Nháp theo kiểu “ghi đè trước, xóa đuôi sau” — không còn thời điểm Nháp trống.
- `_chuyenChiTietDNTTSangYVaTinhBu_`: chỉ ghi ô Ngày CK và Trạng thái/Ngày ghi; không tính bù lại khi đã có dòng Y (trước đây chạy lại sẽ nhân đôi ChiTietDNTT).
- `webMoDongThanhToanTheoHoSo`: ghi CT con vào Nháp bằng 1 lệnh; xóa bản chính theo **ID đọc lại mới nhất** (không theo vị trí dòng cũ), có sao lưu; mở khóa phiếu cân bằng 2 lệnh RangeList.
- `_donDep3BangConKhiMoDong_`, `webXoaCTMoCoi`, `webXoaSrcMoCoi`, `webXoaMoCoiChiTietDNTT`, `webXoaMoCoiChiTietUNC`: dùng chung đường xóa có sao lưu, xóa theo khối.
- `webDongBoTenKhachHang`: có khóa hệ thống; chỉ ghi đúng ô Khách hàng được chọn (trước đây ghi lại cả cột).
- `runProcessDetail`, `runFillMissingBankOnly`, `runXacNhanDNTT`, `runHuyXacNhanDNTT`: chỉ ghi đúng ô thay đổi.
- `runCreate112`, `runDeleteDraftRecord`, `removePhieuCanFromDraft`, `_removeFromPcUnpaidCache_`, phân tích NG-ĐL: bỏ mẫu “clearContent rồi setValues”.
- Làm mới mirror (`HD_NCC_DRAFT`, `HD_STK_DRAFT`, `PhieuCan_DN_CHUA_TT_DRAFT`, `HopDongTienDo_DRAFT`, `CongNoKhachHang_DRAFT`): không còn `sh.clear()` trước khi ghi.
- `_ghiChiTietDNTT_N_`, `_ghiLichSuUNC_`, `webTaoLaiMisaTheoNgay`: phần đọc-rồi-ghi-thêm chạy trong khóa hệ thống (chống 2 người ghi đè dòng của nhau / ghi MISA trùng).

### Fixed
- Mirror Phiếu Cân chưa TT làm **mất số 0 đầu** của Số phiếu / Số phiếu cân dạng chữ.
- `get112ViewData` trả STK còn dấu `'` → UNC/báo cáo có thể ra `''0123…`.

### Security
- Không có thay đổi về xác thực/phân quyền ở bản này (chờ người dùng quyết định mô hình — xem `docs/REFACTOR_PLAN.md` §9).
