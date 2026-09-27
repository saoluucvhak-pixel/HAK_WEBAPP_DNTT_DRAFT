# CHANGELOG

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/). Phiên bản theo `NĂM.ĐỢT.SỬA`; thay đổi làm đổi hành vi nghiệp vụ (⚖️) sẽ tăng số ĐỢT và ghi rõ đã được người dùng đồng ý.

## [2026.9.9] — Bỏ webhook làm mới cache (người dùng yêu cầu)

### Removed
- Webhook `?action=lam_moi_cache&secret=…` (file Phiếu Cân / HD_NCC tự gọi web app khi có thay đổi) cùng nút/menu “🔑 Xem Link Webhook Làm Mới Cache Tức Thì” (Cài đặt + menu Sheet), `getWebhookInfoForWeb`, `showWebhookInfoDialog`, `_getWebhookSecret_`. Mọi link `?action=` giờ đều bị từ chối — web app không còn cửa nào chạy được mà không đăng nhập (xử lý luôn R-11/R-12).
- Dữ liệu Phiếu Cân / Hợp đồng vẫn tự làm mới theo trigger 10 phút (7:30–19:00), 7:30 & 13:00, hoặc nút “↻ Làm mới” / “🔄 Tải & Tính Lại”.

### Việc cần làm tay (nếu trước đây đã cài webhook)
- Mở Apps Script của file **Phiếu Cân** và **HD_NCC** → Triggers → xóa trigger `onChangeLamMoiCache`, xóa file mã chứa hàm đó.
- (Tùy chọn) Apps Script của File Nháp → Project Settings › Script Properties → xóa `WEBHOOK_SECRET`.

### Tests
- 109 test; `auth` kiểm tra `?action=lam_moi_cache` bị từ chối và không còn chức năng webhook.

## [2026.9.8] — In Báo Cáo ĐNTT theo thời gian lập hồ sơ

### Fixed
- **In Báo Cáo ĐNTT (Excel)** liệt kê hồ sơ theo thứ tự dòng trong File Nháp (thực tế đang theo tên chủ rừng). Nay sắp theo **thời gian lập hồ sơ** (Timestamp, cũ trước); cùng thời điểm thì theo Ngày đề nghị. Sheet “Bảng Kê Chi Tiết CK” theo đúng thứ tự hồ sơ đó (trong 1 hồ sơ giữ thứ tự phiếu cân), STT liên tục. Không đổi số liệu.

### Tests
- 109 test (thêm 1; thất bại trên 2026.9.7 — Excel ra “Nguyen Van A” trước “Tran Thi B” dù B lập trước).

## [2026.9.7] — Rà soát toàn hệ thống: chặn trả 2 lần trong 1 lượt Duyệt, giao diện tối / in / bàn phím

Báo cáo đầy đủ: `docs/REVIEW_2026_09.md` (kiến trúc, 34 mục lỗi R-01…R-34, đề xuất tính năng). Không đổi schema dữ liệu, không đổi quy trình thanh toán.

### Fixed
- **R-01 (CRITICAL) Trả tiền 2 lần trong cùng lượt Duyệt**: 1 phiếu cân nằm ở 2 dòng Nháp (2 hồ sơ, hoặc 2 lần trong 1 hồ sơ — vd sửa tay File Nháp) được Duyệt cùng lượt thì cả 2 đều được ghi vào sổ (kiểm tra cũ chỉ so với sổ đã chốt). Nay mọi hồ sơ có phiếu trùng trong lượt bị giữ lại, báo rõ phiếu nào, ghi `CHAN_TRA_HAI_LAN`; các hồ sơ khác vẫn chốt.
- **R-02 Mở Đóng TT không mở khóa đủ phiếu cân**: Duyệt khóa theo cột W (Số CT) nhưng Mở Đóng TT tìm theo cột A và chỉ 1 dòng/số → phiếu có 2 cột khác nhau hoặc nhiều dòng vẫn bị khóa “Đóng TT”. Nay dùng chung 1 hàm (`_dongPhieuCanTheoSo_`, cột W, mọi dòng).
- **R-03 Đồng bộ tên khách hàng** (Hệ Thống › Đối soát) tìm sai cột / thiếu dòng — cùng nguyên nhân R-02.
- **R-04 Xóa hồ sơ Nháp** xóa dòng ChiTietDNTT/ChiTietUNC (lịch sử UNC) **không sao lưu**, từng dòng một. Nay sao lưu vào `SYS_SaoLuuDongXoa` (hành động `XOA_NHAP`, khôi phục được ở Hệ Thống) và xóa theo khối.
- **R-07 Chi tiết công nợ theo phiếu cân “đến ngày D”** vẫn tính các phiếu đã trả ĐÚNG ngày D (ngày TT lưu 12:00 so với mốc 00:00). Nay so theo ngày giờ VN.
- **R-21** Tình hình thanh toán hằng ngày sắp sai thứ tự khi khoảng ngày qua nhiều tháng.
- **R-22** Sheet “Thông Số” hiện link mặc định trong code thay vì link đang dùng (đã đổi ở Cài đặt).
- Client: “Khách lẻ” (có dấu) bị coi là khác tên chủ rừng khi Lưu (R-19); `var(--border)` chưa khai báo làm mất viền ở Cài đặt (R-20); `<a><button>` lồng nhau, thiếu `rel="noopener"` (R-23).

### Changed (hiệu năng, không đổi kết quả)
- 1 lượt chạy mở File Chính **1 lần** (`getMainSs_` nhớ theo ID trong lượt) — trước đây mỗi lần ghi nhật ký/tra “Lần TT”… lại `openById` (~0,1–0,5 s/lần).
- Tổng hợp 112 đọc sheet “Lần TT” 1 lần/lượt (trước: mỗi hồ sơ mới); ghi lịch sử UNC không đọc Script Properties theo từng dòng; xuất báo cáo Phân tích ghi 1 lệnh/bảng.
- Tạo file báo cáo: `_taoFileBaoCao_` (DriveApp `moveTo`) thay 10 bản sao dùng `addFile/removeFile` (API lỗi thời).

### Added — Giao diện
- **Chế độ tối** theo hệ điều hành + nút “🌓 Giao diện” (Tự động / Sáng / Tối) ở chân thanh bên.
- **Bản in** (Ctrl+P): chỉ phần nội dung, ẩn menu/nút, lặp tiêu đề bảng.
- **Bàn phím & trình đọc màn hình**: menu, tab con, dòng bấm được dùng Tab + Enter/Space; Esc đóng hộp thoại/Trợ lý AI; focus vào hộp thoại và trả lại khi đóng; `lang="vi"`, `role`/`aria-*`, `aria-live` cho thông báo; viền focus rõ; tôn trọng “giảm chuyển động”.
- **Màn hình nhỏ**: bảng rộng cuộn ngang trong thẻ (trước tràn ra ngoài), hộp thoại toàn màn hình trên điện thoại.
- Hộp thoại “Xuất Excel thành công” dùng chung (`_hienKetQuaXuat_`).

### Removed
- Mã chết không có route/không nơi gọi (R-26): `searchChuRungNames_`, `getNguoiDeNghiInfo_`, `getNguoiNhanTienOptions_`, `getSoHopDongOptions_`, `getChuRungContext_`, `_hdNccActiveData_`, `HD_TRANG_THAI_LOAI_TRU`, `MISA_DEFAULT_KEYS`, `UNC_DEFAULT_KEYS`, `CFG.FOLDER_REPORT_ID`, client `doSetupDraft` (đã được thay bằng cache trình duyệt từ mục AG).

### Tests
- 108 test Node (thêm 9 trong `review202609.test.mjs` — **cả 9 thất bại trên 2026.9.6**).
- Mới: 5 test giao diện Playwright (`tests/ui/giaoDien.ui.mjs`): mọi trang không lỗi JS + chống XSS, chế độ tối, 375/768 px không tràn, bàn phím/Esc/ARIA, bản in.

### Docs
- Mới: `docs/REVIEW_2026_09.md`, `API.md`, `DATABASE.md`, `FLOW.md`, `SECURITY.md`, `DEPLOY.md`, `INSTALL.md`, `USER_GUIDE.md`, `ADMIN_GUIDE.md`, `DEVELOPER_GUIDE.md`, `TEST_REPORT.md`.

### Kiểm chứng trên Google thật (sau khi Deploy)
Xem `docs/DEPLOY.md` › “Riêng v2026.9.7”.

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
