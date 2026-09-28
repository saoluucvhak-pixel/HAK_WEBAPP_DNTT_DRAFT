# ARCHITECTURE — HAK Quản Lý Thanh Toán (v2026.9.49)

> Tài liệu sống: cập nhật mỗi khi đổi module, lớp, luồng dữ liệu hoặc schema.
> Phân tích chi tiết hiện trạng: `docs/PROJECT_ANALYSIS.md`. Kiến trúc đích: `docs/REFACTOR_PLAN.md` §3–§4.

## 1. Tổng quan triển khai

| Thành phần | Mô tả |
|---|---|
| Runtime | Google Apps Script V8, web app (`executeAs: USER_DEPLOYING`, `access: ANYONE`), múi giờ `Asia/Ho_Chi_Minh` |
| Script gắn với | **File Nháp** (`SpreadsheetApp.getActive()`) |
| File Chính | Script Property `MAIN_SS_ID` — DNTT_GK_DN, DNTT_GK_DN_CT, DNTT_GK_DN_112, NhatKyThaoTac, ChiTietDNTT, ChiTietUNC, **SYS_SaoLuuDongXoa**, **SYS_NguoiDung** |
| Cổng đăng nhập | Dự án Apps Script **riêng** (Execute as: User accessing, Anyone with Google account) — mã nguồn sinh từ `_maNguonCongDangNhap_()`, dán qua Cài đặt |
| File ngoài | PhieuCan_DN, HD_NCC/HD_STK/DM_NG, Update_NganHang_DN, Danh Mục NH (ID trong `LINKS` + Script Properties) |
| Mã nguồn | `Code.gs` (backend), `Index.html` (frontend), `appsscript.json` |
| Kiểm thử | `tests/` — chạy ngoài Apps Script bằng Node (xem §5) |

## 2. Lớp logic trong `Code.gs` (hiện tại, file phẳng)

```
Router (doGet, onOpen, trigger)            → B05, B26, B20
API web (web*/get*/run*)                   → B06..B25
Nghiệp vụ lõi (chốt/tách/112/mở đóng)      → B15, B25, B07
Cache & mirror                             → B17..B21
Hạ tầng dùng chung                         → B04 utils/sysLock/logAction
                                              + LỚP GHI/XÓA AN TOÀN (mới, v2026.6)
Cấu hình                                   → B01/B03 LINKS, CFG, Script Properties
```

Danh mục module B01–B27 / F01–F13: `PROJECT_ANALYSIS.md` §4.

## 3. Lớp ghi/xóa an toàn (v2026.6)

Quy tắc bắt buộc cho mọi code mới: **không đọc cả sheet rồi ghi đè lại cả sheet**; **không `clear()` rồi mới ghi**; **mọi xóa dữ liệu đều sao lưu trước**.

| Hàm | Dùng khi | Số lệnh API |
|---|---|---|
| `_ghiCungGiaTri_(sh, rows, c1, c2, v)` | Cùng 1 giá trị cho nhiều dòng (khóa/mở khóa, trạng thái) | 1 (RangeList) |
| `_ghiTheoDong_(sh, [{row, values}], startCol)` | Giá trị khác nhau theo dòng | 1 / đoạn dòng liền kề |
| `_thayVungDuLieu_(sh, startRow, nCols, oldCount, newRows)` | Thay toàn bộ vùng dữ liệu Nháp | 1–2 (ghi đè, rồi xóa đuôi) |
| `_ghiLaiMirror_(sh, header, rows, cotText)` | Làm mới sheet mirror/snapshot | 2–4, không có lúc sheet trống |
| `_saoLuuVaXoaDong_(sh, predicate, hanhDong)` | Xóa dòng theo điều kiện (đọc lại mới nhất, theo ID) | 1 sao lưu + 1 / đoạn |
| `_tapKhoaTrongCot_(sh, colKey, colCo)` | Kiểm tra “đã tồn tại / đã chốt” (idempotency) | 1–2 đọc |
| `_chayTrongKhoa_(fn)` | Đoạn đọc-rồi-ghi-thêm ngoài luồng đã giữ `sysLock` | – |
| `_giuDangChu_(v)` | Giữ số 0 đầu cho chuỗi số khi ghi | – |
| `_oAnToan_(v)` / `_dongAnToan_(rows, cotChu)` | **Mọi** ô/dòng dữ liệu trước khi ghi: chữ mở đầu `= + - @` thêm `'` (không thành công thức); `cotChu` giữ số 0 đầu. Các hàm trên đã tự gọi | – |

### Sao lưu dòng bị xóa — `SYS_SaoLuuDongXoa` (File Chính)

| Cột | Nội dung |
|---|---|
| Thời gian | thời điểm xóa |
| Người thực hiện | `Session.getActiveUser()` (có thể `N/A` với USER_DEPLOYING) |
| Hành động | `MO_DONG_THANH_TOAN`, `XOA_MO_COI_*` |
| File / Sheet / Dòng gốc | nguồn của dòng |
| Dữ liệu (JSON) | nguyên dòng (ngày dạng ISO) |
| File ID | file chứa sheet gốc (từ 2026.8.2) |
| Mã thao tác | gom mọi dòng của 1 lần xóa (`_maThaoTacMoi_`; Mở Đóng TT dùng 1 mã cho cả 6 sheet). Bản cũ chưa có mã: gom theo hành động + người + phút |
| Đã khôi phục | thời điểm + người khôi phục — mỗi dòng chỉ khôi phục 1 lần |

Khôi phục (`webKhoiPhucSaoLuuXoa_`, Hệ Thống › Khôi Phục Dữ Liệu Đã Xóa): ghi lại cuối sheet gốc (`_giaTriKhoiPhuc_`: ISO → Date, chữ giữ dạng chữ); dòng về `DNTT_GK_DN_CT` phải qua kiểm tra chống trả 2 lần (phiếu không có trong sổ chốt / hồ sơ Nháp) rồi `_khoaPhieuCanDaTra_` (dùng chung với Duyệt).

Thiếu MISA (`_misaThieu_`, hiện trong `getMisaDataTheoNgay_().thieu`): dòng CT (`_ctGopLuuTru_`) có Ngày CK trong khoảng mà Số phiếu cân không có trong `_laySoPhieuCanDaCoTrongMisa_`. `webTaoBoSungMisa_(f, t)` (Nghiệp vụ) lấy hồ sơ theo mã (`_hoSoDaChotTheoMa_`; Ngày ĐN của 112 khác Ngày CK), mỗi lần ≤ `MISA_BO_SUNG_HO_SO_MOI_LAN` hồ sơ → `_gomChiTietChuyenKhoan_` → `_ghiMisaChuaCo_` (chung với Tạo lại MISA; kiểm tra trùng + ghi trong `_chayTrongKhoa_`).

Dọn dẹp MISA (`webDonDepMisa_(che, f, t, chayThat)`, Hệ Thống): `_boChonMisaDonDep_` trả lý do xóa cho từng dòng `Update_NganHang_DN` — `trung` (Số phiếu cân lặp lại, giữ lần đầu trong file), `moCoi` (không có trong `_ctGopLuuTru_("", "", true)`; bỏ qua dòng không có Số phiếu cân), `tatCa`; luôn giới hạn theo Ngày CK bằng `_boLocNgayMisa_` (chung với Báo Cáo MISA / file xuất). `chayThat = false` chỉ xem trước; `true` quét lại trong `_chayTrongKhoa_` rồi `_saoLuuVaXoaDong_(…, "XOA_MISA", mã)`.

## 4. Chốt thanh toán — trình tự & tính chạy lại (`runConfirmPayment`)

1. `sysLock` → đọc Nháp → lọc hồ sơ “Đang ĐNTT”, Số tiền > 0.
2. Đọc tập ID **đã chốt** trong CT (cột B + S=“Y”), 112 (cột A + U=“Y”), DNTT_GK_DN (cột A).
3. Append CT/112/Src thật — **bỏ qua ID đã có**.
4. ChiTietDNTT N→Y (chỉ ghi ô), tính bù nếu thiếu — **không bù lại nếu đã có Y**; MISA tự loại trùng theo Số phiếu cân.
5. Cập nhật trạng thái Src tại chỗ (cột O..R) cho dòng chưa “Y”.
6. Khóa phiếu cân: 3 lệnh RangeList trên đúng các dòng.
7. Dọn Nháp: ghi đè trước, xóa đuôi sau.

Chặn trả 2 lần: trước bước 3, đọc thẳng CT thật (`_phieuCanDaTraThat_`); hồ sơ có phiếu cân đã chốt ở hồ sơ khác bị bỏ qua cả hồ sơ (`CHAN_TRA_HAI_LAN`). Tạo mới / Thêm phiếu cũng kiểm tra (`_chanPhieuCanDaTra_`). **Cache “phiếu cân chưa TT” chỉ để gợi ý, không dùng một mình để quyết định phiếu còn trả được.**

Số tiền phải khớp phiếu cân (2026.9.44): Xác nhận, In Báo Cáo ĐNTT, Tạo UNC và Duyệt bỏ qua hồ sơ có Số tiền (cột G sổ 112 Nháp) khác tổng Thành tiền các dòng CT Nháp quá `LECH_TIEN_CHO_PHEP` (1 đ) — `_hoSoLechTien_`; Danh Sách ĐNTT gắn cờ `canTinhLai`. Thêm / Bỏ phiếu cân không tự tính lại nên luôn phải qua "Đề Nghị Thanh Toán (tính lại)".

STK theo hợp đồng (2026.9.45): Lưu hồ sơ mới (`createNewPaymentRequest_`) và Sửa hồ sơ khi đổi STK hoặc Số HĐ (`updateDraft112Info_`) gọi `_kiemTraStkTheoHopDong_` — STK phải có trong HD_STK (bản đầy đủ `_hdStkFullData_`, mọi tình trạng HĐ) của đúng Số HĐ; so sánh bỏ dấu `'` / số 0 đầu (`_khoaStk_`); không thấy thì đọc lại HD_STK bỏ qua bộ nhớ đệm 1 lần rồi mới báo lỗi.

Lỗi ở bất kỳ bước nào → log `LOI_CHOT_THANH_TOAN`, người dùng bấm Duyệt lại cùng hồ sơ để hoàn tất (không trùng dữ liệu).

## 4b. Xác thực & phân quyền (v2026.7)

```
Người dùng ──► Cổng đăng nhập (chạy dưới quyền NGƯỜI DÙNG)
                 email + exp(5') + nonce ─HMAC-SHA256(SSO_SECRET)─► ?sso=token
          ──► Web app chính doGet(sso): xác minh chữ ký, hạn, nonce chưa dùng,
                 email có trong SYS_NguoiDung (Hoạt động) → cấp mã phiên 64 hex (CacheService 6h)
Trình duyệt ─ google.script.run.api(phiên, "tenChucNang", [tham số])
          ──► api(): phiên → email → vai trò → API_ROUTES[tenChucNang].quyen → gọi hàm nội bộ
```

| Thành phần | Vị trí |
|---|---|
| Vai trò → quyền | `VAI_TRO`, `QUYEN`, `QUYEN_THEO_VAI_TRO` — ADMIN (XEM, NGHIEP_VU, HE_THONG, QUAN_TRI) ⊇ KE_TOAN_TONG_HOP (XEM, NGHIEP_VU, HE_THONG) ⊇ KE_TOAN (XEM, NGHIEP_VU) ⊇ XEM. `HE_THONG` = toàn bộ trang Hệ Thống (2026.9.4, người dùng chọn); `QUAN_TRI` = Cài đặt, người dùng, Cổng đăng nhập |
| Bảng phân quyền | `API_ROUTES` (tên chức năng → hàm nội bộ + quyền). Không có trong bảng = không gọi được |
| Cửa vào công khai | `doGet`, `onOpen`, `api`, `thongTinDangNhap` (không cần đăng nhập, chỉ trả trạng thái của chính người gọi + link cổng), `dangXuat` |
| Menu Sheet | 18 hàm công khai, dòng đầu `_yeuCauQuyen_(QUYEN.*)` — email lấy từ `Session.getActiveUser()` (người bấm menu) |
| Danh tính | `_xacDinhNguoiDung_()`: người của phiên hiện tại, nếu không có thì `Session.getActiveUser()` (chủ script khi tự mở web app; người bấm menu). Người Gmail khác mở web app “execute as me” → rỗng → bị chặn |
| Chủ script & Quản trị cố định | `Session.getEffectiveUser()` và danh sách `QUAN_TRI_CO_DINH` (trong code) luôn là ADMIN, không đổi/khóa được từ web app |
| Người dùng | `SYS_NguoiDung`: Email · Họ tên · Vai trò · Trạng thái · Cập nhật lúc · Cập nhật bởi (cache 60 giây) |
| Cấu hình | Script Properties `SSO_SECRET`, `SSO_GATEWAY_URL` (Trợ lý AI: `GEMINI_API_KEY`, `GEMINI_MODELS`, `GEMINI_MODEL`) |
| Lỗi | `[AUTH] …` → client hiện màn hình đăng nhập; `[QUYEN] …` → chỉ báo lỗi |
| Mở thẳng 1 màn hình | `?trang=` chỉ nhận giá trị trong `TRANG_MO_THANG` (server) ↔ `MO_THANG` (client, kèm quyền). Link đăng nhập gắn thêm `trang`, Cổng đăng nhập (mã sinh từ 2026.7.5) chuyển tiếp lại. Dùng cho menu Sheet “Thêm Mới” |
| Nhúng iframe | `ALLOWALL` — giữ theo quyết định người dùng (web app nhúng vào trang chủ, H-08) |
| Đăng nhập khi nhúng (2026.9.5) | Client `_dangNhung_()` (`window.parent !== window.top`) → nút mở Cổng ở **cửa sổ nhỏ** kèm `?yc=<32 hex ngẫu nhiên>`; Cổng đưa `yc` vào phần **đã ký** → `doGet(sso)` tạo phiên, lưu `dn_yc_<yc>` (10 phút) rồi trả trang “Đăng nhập thành công” tự đóng (`_trangDangNhapNhung_`); khung nhúng hỏi `nhanPhienDangNhap(yc)` 2,5 giây/lần — trả phiên **1 lần** hoặc lỗi. Mở thẳng (không nhúng) giữ cách cũ. Cần dán lại mã Cổng từ bản này |

Quy tắc: **thêm chức năng mới gọi từ web** = viết hàm nội bộ `ten_` + thêm 1 dòng vào `API_ROUTES` với quyền phù hợp. Test `auth.test.mjs` sẽ báo lỗi nếu có hàm global mới không kết thúc bằng `_`, trình duyệt gọi 1 chức năng chưa có route, hoặc 1 trang (theo `PAGES[].quyen`) gọi chức năng cần quyền **cao hơn** quyền mở trang đó.

Lỗi: `api()` và các hàm trả `{success:false, message}` dùng `_loiChoNguoiDung_(e)` — lỗi nghiệp vụ (`new Error("…")`) hiện nguyên câu; lỗi lập trình (TypeError…) chỉ hiện mã tra cứu, chi tiết + stack ghi `NhatKyThaoTac` (`LOI_HE_THONG`).

## 4d. Sheet tổng hợp (snapshot) trong File Nháp

| Sheet | Trigger ghi | Màn hình đọc |
|---|---|---|
| `PhanTichNhapTT_DRAFT` | 15h (`daily15hRefresh_`: từ đầu tháng, ngày 1 thì từ hôm qua) | Báo cáo Phân tích Nhập/TT, **Trang chủ “tháng này”** (`_docPhanTichTheoKhoang_`, ngày thiếu tự tính bù) |
| `CongNoKhachHang_DRAFT` | 7:30 / 13:00 (`dailyRefreshAllCaches_`, 90 ngày) | Công nợ theo KH (khoảng mặc định), Trang chủ (tổng nợ, top 5), Trợ lý AI |
| `ChiTietCongNoPhieuCan_DRAFT` | 15h (ngày hôm qua) | Chi tiết công nợ theo phiếu cân (ngày hôm qua), Trợ lý AI |

Quy tắc: màn hình mở thường xuyên đọc snapshot, không quét PhieuCan_DN. `_pcData_()` (bộ nhớ đệm 90 giây, tối đa 3,6 MB) chỉ dùng khi tính snapshot, khi chọn khoảng ngày khác mặc định, sổ chi tiết, đối soát/bảo trì và các bước cần chi tiết vài phiếu (Duyệt, Báo cáo ĐNTT, Mở Đóng TT).

- Trang chủ: “tháng này” đọc PhanTichNhapTT_DRAFT; **Tổng nợ + Top 5** đọc Script Property `TRANG_CHU_CONG_NO` (`_luuCongNoTrangChu_`, ghi trong `refreshCongNoCache_` khi khoảng = `_defaultCongNoRange_`). Chỉ tính công nợ khi chưa từng có bản tổng hợp hoặc bấm “Cập nhật ngay” (`webRunCongNoRefreshNow_()` không tham số = khoảng mặc định). Sau Duyệt số trên Trang chủ cập nhật ở lần trigger kế tiếp (có ghi giờ).

## 4f. Đo hiệu năng thật (v2026.9.6)

`api()` và 3 trigger (qua `_chayTriggerCoDo_`) ghi mọi lần chạy ≥ `HIEU_NANG_NGUONG_MS` (3 giây) vào `SYS_HieuNang` (File Nháp, giữ 5.000 dòng): thời gian, chức năng, số giây, người dùng, kết quả (OK / Lỗi / Quá giờ). Quá giờ: lời gọi web do trình duyệt báo (`ghiQuaGioTrinhDuyet_`, nhận ra lỗi “maximum execution time”); trigger để dấu `HN_TRIGGER_DANG_CHAY_<tên>` và lần chạy sau (hoặc khi xem báo cáo) ghi “Quá giờ” nếu dấu còn quá 7 phút. Xem ở Hệ Thống › Hiệu Năng (`getHieuNangForWeb_`). Kết quả đo khối lượng dữ liệu: `docs/HIEU_NANG.md`.

Màn hình chờ (client): % ước tính theo thời gian 5 lần chạy gần nhất của cùng chức năng trên máy đó (`localStorage` `hak_tg_<tên>`), chưa có số liệu thì đường cong chậm dần; luôn kèm số giây đã chờ.

## 4e. Khóa sổ năm (quy trình của người dùng, 26/09/2026)

- PhieuCan_DN chỉ chứa năm hiện tại: cuối năm, phiếu **đã trả** chuyển sang sheet lưu trữ, phiếu **chưa trả giữ lại** (mang sang năm mới).
- DNTT_GK_DN khóa sổ theo năm (sổ đã chốt chỉ còn khoản trả của năm hiện tại).
- Công nợ = Σ phiếu cân − Σ đã trả ⇒ sau khóa sổ đúng bằng **các phiếu cân chưa trả** (số dư đầu năm mang sang tự đúng, không cần bút toán số dư). Test `khoaSoNam.test.mjs`.
- Bộ nhớ đệm Phiếu Cân tự giới hạn theo năm (~13.500 phiếu/năm < trần ~16.000).
- Lưu ý khi khóa sổ: chuyển phiếu đã trả và khóa sổ DNTT_GK_DN **cùng lúc**; không chuyển phiếu đang nằm trong hồ sơ Nháp. Nếu khóa sổ bằng cách **tạo File Chính mới**, phải mang theo sheet `SYS_NguoiDung` (danh sách người dùng) – nếu không chỉ Quản trị cố định đăng nhập được.

### Khóa sổ năm N — 1 thao tác (v2026.9.1)

Hệ Thống › **🔒 Khóa Sổ Năm** (`webKhoaSoNam_(nam, chayThat)`, Quản trị, toàn bộ trong `sysLock`) làm **cùng lúc** Phiếu Cân và ĐNTT — không có bước tay nào giữa chừng (bản 2026.9.0 tách 3 bước gây lệch công nợ ở giữa).

1. Hồ sơ năm N = mã hồ sơ (CT cột B) có Ngày CK/TT (CT cột U) thuộc năm N. Từ chối nếu sổ đang mở còn hồ sơ năm < N, hoặc N chưa kết thúc.
2. Chép các dòng của các hồ sơ đó ở 5 sheet sổ (`_sheetSoKhoaSo_`: DNTT_GK_DN cột A, _CT cột B, _112 cột A, ChiTietDNTT cột A, ChiTietUNC cột A) sang file **DATA<N>** — tự tạo cùng thư mục, múi giờ, locale với File Chính, giữ tên sheet + dòng tiêu đề, định dạng số theo dòng 2 của sheet nguồn, ô chữ giữ là chữ (`_ghiThemGiuNguyen_`). `flush` → xóa khỏi File Chính theo mã hồ sơ (đọc lại cột lúc xóa) → đăng ký `LUU_TRU_NAM[N]`.
3. Phiếu cân: Số phiếu có trong CT các năm đã khóa sổ (kể cả N) và không còn trong sổ đang mở → `PhieuCan_DN_<năm NGÀY CÂN>` (cùng quy ước QL_NHAPKHO). Sổ đã khóa là căn cứ “đã trả” (không cần ID_DNTT = Đóng TT). Mọi dòng cùng Số phiếu đi cùng nhau; thiếu ngày cân → ở lại, liệt kê. Lô 500 Số phiếu: chép phần còn thiếu → `flush` → xóa.
4. Chạy lại an toàn: file DATA đang tạo dở lưu ở `KHOA_SO_DANG_LAM` (dùng lại, không tạo file thứ 2); dòng sổ có mã hồ sơ đã ở DATA không chép lại; phiếu đếm theo Số phiếu ở sheet đích. Hết ~4 phút thì dừng, bấm lại để làm tiếp. Chưa xóa xong khỏi File Chính thì **chưa đăng ký** (báo cáo không cộng trùng).
5. Mở Đóng TT từ chối Ngày Đóng TT thuộc năm đã khóa sổ.
5b. Trong lúc chạy thật, file Phiếu Cân mang **cờ “đang khóa sổ”** (Developer Metadata cấp spreadsheet, khóa `HAK_KHOA_SO_NAM_DANG_CHAY`, hiển thị DOCUMENT, giá trị `{nam, batDau, ung:"DNTT"}`; gỡ trong `finally`) để QL_NHAPKHO tạm dừng import / nhập tay / tính giá — bên đọc coi cờ hết hiệu lực sau 10 phút (2026.9.10, `_voiCoKhoaSo_`).
6. Khóa sổ **chỉ làm ở ĐNTT**: QL_NHAPKHO bỏ “Chốt sổ năm” (người dùng quyết định 26/09/2026), chỉ còn đọc các sheet `PhieuCan_DN_<năm>`.
7. Cài đặt › File lưu trữ theo năm (`webSetLuuTruNam_`): chỉ xem / trỏ lại file (vd file bị di chuyển); từ chối nếu thiếu sheet sổ, là File Chính, hoặc File Chính còn dòng CT cùng ID_CT.

### Báo cáo đọc năm đã khóa sổ

Chỉ khi khoảng ngày **chạm năm đã đăng ký**; báo cáo năm đang mở không mở file DATA (test `luuTruNam`). Dữ liệu lưu trữ cache 6 giờ, khóa cache gắn ID file.

| Hàm | Đọc thêm |
|---|---|
| `_ctGopLuuTru_(f, t, docThang)` | CT của các năm khóa sổ ∈ [năm f, năm t] + sổ đang mở |
| `_h112GopLuuTru_(f, t)` / `_docLuuTruTrongKhoang_(sheet, soCot, f, t)` | tương tự cho 112, ChiTietDNTT, ChiTietUNC |
| `_pcGopLuuTru_(f, t)` | PhieuCan_DN + dòng ở `PhieuCan_DN_<năm>` có Số phiếu **trả trong** năm khóa sổ ∈ [năm f, năm t] |

- Theo khoảng ngày thanh toán (112 / Báo cáo Thanh toán, UNC, Chi tiết, MISA, Tình hình TT): `(f, t)`. Xuất Báo cáo Thanh toán (`_gomChiTietChuyenKhoan_`) lấy khoảng theo Ngày TT của các hồ sơ được chọn. Mọi chức năng MISA và **Tạo lại UNC** (từ 2026.9.43) chọn theo **Ngày CK** của sổ CT (`_ctTheoNgayCK_`), hồ sơ lấy theo mã (`_hoSoDaChotTheoNgayCK_` → `_hoSoDaChotTheoMa_`) — không theo Ngày ĐN của sổ 112.
- **QUY ĐỊNH ĐỊNH DẠNG NGÀY GIỜ** (người dùng chốt 28/09/2026 — không đổi khi chưa được đồng ý):
  1. **Web app**: luôn hiển thị và nhập ngày **dd/mm/yyyy**, giờ Việt Nam (GMT+7). Mọi `<input type="date">` được `_ganONgayVN_` gắn ô gõ dd/mm/yyyy + nút lịch (ô lịch trình duyệt hiện theo ngôn ngữ trình duyệt); `.value` ô lịch (`yyyy-mm-dd`) vẫn là giá trị code đọc/ghi. Ngày dạng chữ đọc từ sheet đổi sang dd/mm/yyyy trước khi lên web (`_ngayChuSangWeb_`).
  2. **Ghi sổ (Google Sheet)**: theo **Vùng Lãnh Thổ** (`REGION_LOCALE`, hiện **US** = locale file en_US) — ngày lưu là **Date thật**, cột ngày định dạng theo vùng (`_dinhDangCotNgaySo_` cho dòng vừa ghi, `_damBaoCotNgaySo_` 1 lần cho cả cột mỗi sổ/vùng, nút Khóa định dạng). Gồm sổ CT/112/Nguồn, **ChiTietDNTT** (Ngày CK, Ngày nhập — `CHITIET_DNTT_COT_NGAY`) và **ChiTietUNC** (Ngày hiệu lực — `CHITIET_UNC_COT_NGAY`), từ 2026.9.23. Dòng bản cũ ghi dạng chữ vẫn đọc được (`_docNgaySo_`).
  3. **Xuất file / in báo cáo** (Excel, PDF, Update_NganHang_DN/MISA): theo **Vùng xuất** (`EXPORT_REGION_LOCALE`, hiện **VN**) qua `_formatNgayXuat_` / `_ngayXuat_` / `_ngayGioXuat_` / `_khoangNgayXuat_` (tiêu đề khoảng ngày); cột ngày dạng chữ trong file xuất luôn khóa TEXT. Web đọc sổ qua `_ngayWeb_`.
  Bảng tính sẵn trong File Nháp (công nợ, phân tích) là bộ nhớ đệm hiển thị web, giữ chữ dd/MM/yyyy ở cột khóa TEXT.
  Mặc định khi Cài đặt để trống: `VUNG_MAC_DINH` (US / VN).
- **QUY ĐỊNH CĂN LỀ** (người dùng chốt 28/09/2026, toàn web app): cột toàn **số** căn **phải**; **tên, chuỗi** căn **trái**; tiêu đề căn giữa. File xuất: `_canhLeTheoKieu_(sheet, dòngĐầu, rows)` theo kiểu giá trị (số, hoặc chuỗi Sheets tự đổi thành số → phải; chuỗi có dấu ' / số 0 đầu như Số TK, CCCD, Số HĐ → trái) — gọi ở mọi hàm xuất. Web: `_canhLeBangWeb_` tự chạy cho mọi bảng mới vẽ, thêm class `num` cho cột toàn số (`_LA_SO_WEB_`: có dấu phân cách hoặc 1–3 chữ số; dãy số dài không phân cách là mã → trái), chỉ thêm không gỡ.
- **FONT & CỠ CHỮ**: web 1 font `--font-chu` cho chữ và số (số `tabular-nums`). File xuất Bảng Đề Xuất cỡ `BANG_DE_XUAT.CO_CHU` (11), độ rộng cột đo theo chữ (`_rongCotVua_`), chiều cao dòng đặt theo nhóm (`_datChieuCaoDong_`, tối đa `NHOM_CAO_TOI_DA` lệnh) — **không gọi API Sheets theo từng dòng** trong hàm xuất.
- **ĐỌC THEO KHÓA**: chức năng chỉ cần vài chục/trăm dòng (xuất báo cáo hồ sơ đã chọn, MISA theo Ngày CK) **không đọc cả sheet**: `_docDongTheoKhoa_(sh, cộtKhóa, rộng, khớp)` đọc 1 cột khóa rồi các đoạn dòng khớp (`DOC_THEO_KHOA`). Dùng qua `_ctDongCuaHoSo_`, `_ctTheoNgayCK_`, `_pcTheoSoPhieu_`. Quét cả sổ chỉ dành cho công nợ/phân tích/bảo trì (cần mọi dòng).
- **CÔNG NỢ TỔNG HỢP**: chỉ khoảng mặc định (`_defaultCongNoRange_`, 90 ngày) có bản tổng hợp (CongNoKhachHang_DRAFT, HopDongTienDo_DRAFT); khoảng khác tính trực tiếp, không ghi đè. Ghi sổ đã chốt → `_invalidateCongNoCache_` chỉ ghi `CONGNO_THAY_DOI_LUC` (màn hình báo “có thay đổi”, người dùng bấm Làm mới).
- **NHẬT KÝ TRƯỚC → SAU**: sửa dữ liệu hồ sơ ghi `_moTaThayDoi_(trước, sau, nhãn)`; hành động muốn hiện ở Lịch sử sửa đổi thêm vào `LICH_SU_SUA_DOI_ACTIONS` + nhãn `NHAN_HANH_DONG` (trình duyệt).
- **TRANG DÀI**: gọi `_ganMucLuc()` sau khi vẽ trang để có thanh “Đi nhanh”.
- **CHỜ ĐỒNG BỘ**: trigger chạy qua `_chayTriggerCoDo_` (bật cờ `HN_TRIGGER_DANG_CHAY_<tên>`). `api()` thấy cờ còn hiệu lực (`_dongBoDangChay_`) thì trả `AUTH_CFG.LOI_DONG_BO` + JSON; `call()` ở trình duyệt chờ (`_choDongBo`, hỏi `getTrangThaiDongBo` mỗi `CHO_DONG_BO_MS`) rồi gọi lại. Route mới rất nhẹ / phục vụ việc chờ: `r(fn, quyen, KHONG_CHO)`. Trigger mới phải chạy qua `_chayTriggerCoDo_` và có tên trong `TEN_DONG_BO`.
- **GIAO DIỆN (thiết kế 28/09/2026)**: 1 font `--font-chu` (Inter); cỡ chữ chỉ dùng thang `--fs-nho/phu/than/the/trang/so` trong `:root` — màn hình mới không đặt cỡ chữ rời. Tiêu đề màu `--ink`; `--accent` cho nút và số liệu.
- **KHÔNG GHI LẠI KHI KHÔNG ĐỔI**: bản sao / snapshot trong File Nháp ghi qua `_ghiLaiMirror_` — so dấu vân tay nội dung + kích thước, giống thì không ghi (File Nháp bận ghi thì mọi thao tác đọc web phải chờ).
- **Chia mảnh theo byte** (2026.9.44): `_chiaManhTheoByte_` cắt dữ liệu cache ≤ 90KB UTF-8/mảnh (giới hạn CacheService tính theo byte; chữ có dấu 2–3 byte).
- **ĐỌC 1 LẦN TRONG 1 LƯỢT**: `_getCachedRefData_` / `_ctThatDocThang_` nhớ dữ liệu trong lượt chạy (`_DA_DOC_TRONG_LUOT_`, trả bản sao từng dòng). Quy tắc bắt buộc: **mọi chỗ ghi sổ phải gọi hàm xóa bộ nhớ đệm tương ứng ngay sau khi ghi** (`_invalidatePcCache_`, `_invalidateCtSrc112Cache_`, `_invalidateChunkedCache_`) — hàm đó xóa luôn bản nhớ trong lượt.
- **DỌN DẸP** (MISA, UNC): `_donDep_(cấu hình, chayThat)` — xem trước, rồi trong khóa hệ thống quét lại, sao lưu (`_saoLuuVaXoaDong_`), xóa; mỗi sổ chỉ viết hàm chọn dòng (`_boChonMisaDonDep_`, `_boChonUncDonDep_`).
- **KHOẢNG NGÀY BÁO CÁO** (⚖️ người dùng 28/09/2026): Báo Cáo Thanh Toán (Gỗ Keo, Chi Tiết, MISA, UNC) tối đa `KHOANG_BAO_CAO.SO_THANG` tháng. Trình duyệt: ô ngày `data-khoang-bao-cao`, `_khoangBaoCaoHopLe` ở mọi nút; máy chủ: route bọc `_theoKhoangBaoCao_`. Chức năng báo cáo MỚI có khoảng ngày trên trang này phải dùng cả hai. Khoảng 1 tháng bất kỳ (không theo tháng lịch); báo cáo Công Nợ không áp dụng (người dùng xác nhận).
- **NGUỒN BÁO CÁO THANH TOÁN**: danh sách = sổ 112 (lọc Ngày ĐN); Bảng Kê Chi Tiết CK và tab Chi Tiết = ChiTietDNTT (Y), tab Chi Tiết và MISA lọc **Ngày CK**. `_dongBangKeChiTiet_` chỉ ghép lại từ CT + Phiếu Cân + HĐ (`_gomChiTietChuyenKhoan_`) cho hồ sơ ChiTietDNTT thiếu phiếu.
- **Phiếu PDF**: `_luuPhieuPdf_(hồSơ, PHIEU_CT_TT.DE_NGHI | HOAN_THANH)` — Nháp: `webInPhieuChiTietThanhToan_` (từ `getDraftRecordDetail_`); đã chốt: `webInPhieuHoanThanhThanhToan_` / xem trước `getPhieuHoanThanh_` (cùng `_hoSoHoanThanh_` + cùng HTML - xem trước luôn giống bản in). Cả hai qua `_chiTietHoSo_`; dựng HTML → `Utilities.newBlob(html).getAs("application/pdf")` → thư mục Báo cáo. Số/ngày theo Vùng xuất (`_soHienThi_(n, soLe, preset)`, `_ngayGioXuat_`).
- **SL dự kiến hợp đồng** (`_slDuKienHopDong_`): tổng `KhoiLuongDuKien` các lô rừng sheet HD_RUNG (file Hợp Đồng, theo ID_HD, cột tra theo tiêu đề — `_klDuKienTheoIdHD_`), không có lô rừng thì cột Z “SL_Dự kiến” HD_NCC. Áp dụng khi dựng bản sao HD_NCC và báo cáo công nợ theo hợp đồng. Ngày thanh toán lúc Duyệt gửi `yyyy-mm-dd`; `_parseNgayTheoVung_` từ chối ngày không có thật.
- Theo ngày cân / lũy kế đến ngày D (Phân tích, Công nợ KH, Sổ chi tiết KH, Công nợ phiếu cân tại D): `(f hoặc D, "")` — năm khóa sổ **từ** năm đó trở đi; năm khóa sổ trước đó chỉ mang sang phiếu chưa trả (lũy kế tính từ đầu năm của “Từ ngày”, công nợ không đổi).
- Tiến độ hợp đồng / Công nợ theo HĐ / Sổ chi tiết HĐ: mọi năm `("", "")` (hợp đồng kéo dài nhiều năm).

## 4c. Công nợ theo khách hàng (v2026.8.0)

Khách hàng = **CCCD + Tên**, khóa `CCCD|TÊN_CHUẨN_HÓA` (`_khoaCongNo_`); trùng tên chưa rõ người: `TRUNG_TEN|TÊN`.

| Phía | Nguồn | Nhận diện (`_nhanDienKhachCongNo_`) |
|---|---|---|
| Nợ | PhieuCan_DN (không có CCCD) | Phiếu có trong CT thật/Nháp → CCCD + tên của hồ sơ; không → tên tra HD_NCC (1 CCCD / trùng tên / trống) |
| Có | DNTT_GK_DN_CT | CCCD + tên của dòng CT |

`_computeDebtByCustomerLive_(f, t, nhanDien)` và Sổ chi tiết dùng CHUNG bộ nhận diện; `_nhanDienKhachTheoTen_()` là cách gom cũ, chỉ dùng cho `getDoiChieuCongNoCccd_` (đối chiếu) và mở Sổ chi tiết bằng khóa cũ (chỉ có tên).

## 5. Kiểm thử

```bash
node --test "tests/**/*.test.mjs"                       # toàn bộ
HAK_CODE_GS=/đường/dẫn/Code.cu.gs node --test "tests/**/*.test.mjs"   # so sánh với bản khác
```

| Thư mục | Nội dung |
|---|---|
| `tests/gas/mock.mjs` | Mock SpreadsheetApp/Properties/Cache/Lock/Utilities/Session… trong bộ nhớ, ghi lại mọi thao tác ghi (`sheet.writes`); như Google Sheets: `"0123"` không có `'` thành số, chữ mở đầu `= + - @` không có `'` bị đánh dấu `FORMULA_MARK` |
| `tests/gas/loadCode.mjs` | Nạp `Code.gs` vào V8 context riêng |
| `tests/gas/fixtures.mjs` | Bộ dữ liệu mẫu File Nháp + File Chính + file ngoài |
| `tests/gas/clientSource.mjs` | Tách 1 hàm của `Index.html` để test không cần trình duyệt |
| `tests/unit/` | Hàm thuần, lớp ghi an toàn, ngày giờ VN & nút mang dữ liệu ở client |
| `tests/integration/` | Chốt TT, chạy lại, Mở Đóng TT, bảo trì, tách phiếu, vá ngân hàng, xác nhận, cache, đăng nhập & phân quyền, số 0 đầu, chống công thức, thông điệp lỗi, model Gemini |

File test dùng đuôi `.mjs` để công cụ đồng bộ Apps Script không coi là mã server.

## 6. Quy ước

- Hàm nội bộ kết thúc bằng `_` (không gọi được từ client). Mọi hàm mới đều phải là hàm nội bộ; trình duyệt gọi qua `API_ROUTES` (xem §4b).
- Email người thao tác: dùng `_emailNguoiThucHien_()`, không gọi `Session.getActiveUser()` trực tiếp.
- **Số 0 đầu** (CCCD, STK, Số HĐ, Số phiếu cân, ID_112): mọi lần GHI giá trị dạng chữ dùng `_chu_(v)`; ghi lại cả dòng thì dùng `_dongAnToan_(rows, COT_CHU.CT|H112|SRC)` hoặc tham số `cotChu` của `_thayVungDuLieu_`. CCCD đọc từ file gốc qua `_chuanHoaCCCD_()`. Không nối `"'" + x` trực tiếp.
- Tên khách hàng chung trên phiếu cân: hằng `TEN_KHACH_CHUNG` (đã chuẩn hóa, gồm cả dạng có dấu).
- **Ghi dữ liệu vào Sheet**: luôn qua `_dongAnToan_(rows, cotChu)` / `_oAnToan_(v)` hoặc các hàm lớp ghi ở §3 (đã tự áp dụng). Header/tiêu đề cố định trong code thì không cần. Công thức cố ý dùng `setFormula`.
- **Client — nút mang dữ liệu**: không nhúng dữ liệu vào `onclick="f('…')"`; dùng `${hanhDong('tenHam', thamSo…)}` (hoặc `hanhDongKhi('mousedown', …)`) và đăng ký hàm trong `HANH_DONG`. Ô chọn dùng `data-id` + `this.dataset.id`.
- **Client — ngày**: ngày mặc định luôn `todayISOVN()` / `isoDaysAgoVN(n)` (giờ Việt Nam), không dùng `new Date().toISOString()`.
- **Model Gemini**: không viết tên model trong code nghiệp vụ; danh sách mặc định `GEMINI_MODELS_MAC_DINH_`, cấu hình `GEMINI_MODELS` (Script Property, sửa ở Cài đặt), model chạy được gần nhất `GEMINI_MODEL`.
- Chỉ số cột: ưu tiên hằng (`PC_COL`, `COL_TRANG_THAI_DNTT`, `HDNCC_COL`…). **Phiếu Cân bắt buộc dùng `PC_COL`** (test chặn `pc[số]`): hệ thống chỉ đọc các cột có trong `PC_COL` (`PC_COT_CAN_DOC`, `_docCacCot_`), cột khác để trống.
- Chú thích chỉ giải thích **vì sao**; lịch sử thay đổi ghi ở `CHANGELOG.md`.

## Đồng bộ và thao tác chỉ đọc (2026.9.46)

`API_ROUTES` có 3 loại: thường (chờ khi trigger đồng bộ đang chạy — `[DONG_BO]`), `KHONG_CHO` (tiện ích phục vụ việc chờ) và `CHI_DOC` (P-02): chỉ đọc sổ đã chốt, hồ sơ Nháp, nhật ký hoặc cấu hình — những thứ trigger không ghi — nên chạy luôn. Thao tác ghi và các màn đọc số liệu do trigger dựng (Trang chủ, Công nợ, Phân tích, dữ liệu Tạo mới) vẫn chờ. `tests/integration/chiDoc.test.mjs` gọi mọi route `CHI_DOC` trong lúc đồng bộ và kiểm tra không ghi ô nào; thêm route `CHI_DOC` mới mà có ghi thì test đỏ.

Mã hồ sơ mới (`_maHoSoMoi_`, 2026.9.46): 8 ký tự hex, không trùng Nháp (Src, 112), sổ đang mở (Src, 112) và `DNTT_GK_DN` của các năm đã khóa sổ — dùng cho Tạo mới và Mở Đóng TT.

Lỗi đọc sổ trong báo cáo (2026.9.46): công nợ / phân tích / tiến độ HĐ / phiếu cân khả dụng ném `_loiDocDuLieu_` thay vì nuốt lỗi (trước đây tính như chưa thanh toán gì). Trang chủ và Trợ lý AI vẫn hiện phần đọc được, phần lỗi ghi vào `canhBao` / báo AI "không đọc được".

## File xuất Excel (2026.9.47)

- `_taoFileBaoCao_` đặt múi giờ `Asia/Ho_Chi_Minh` và locale theo Vùng xuất (`LOCALE_THEO_VUNG`: VN → vi_VN, US → en_US).
- Báo cáo: cột ngày / ngày giờ ghi **Date thật** qua `_cotNgayThatChoXuat_(sh, dongDau, body, cotNgay, cotNgayGio)` (định dạng `dateFmt` / `dateTimeFmt` của Vùng xuất, không khóa TEXT). Áp cho Báo cáo ĐNTT (Bảng Đề Xuất + Bảng Kê, cả bản chốt và bản Nháp), Báo cáo UNC, Chi tiết, MISA (sheet TomTat), Tình hình thanh toán, Công nợ phiếu cân, Phân tích tổng hợp. Chuỗi ngày kiểu VN của dữ liệu web đọc bằng `_docNgayVN_`.
- Mẫu nhập liệu giữ ngày dạng chữ: file UNC nộp ngân hàng (`runCreateUNCOnly_`) và sheet XuatMISA / Update_NganHang_DN.
- Dòng MISA: 1 hàm `_dongMisa_` cho Duyệt và Tạo lại / Tạo bổ sung (B-10).
- Chiều cao dòng Bảng Đề Xuất (`_datChieuCaoDong_`): 1 lệnh đặt nền (chiều cao phổ biến) + tối đa `NHOM_CAO_TOI_DA` lệnh cho các dòng cao hơn; không còn đặt mọi dòng bằng dòng cao nhất.

## Hiệu năng (2026.9.47)

- `runCreate112` đọc sổ CT bằng `_docDongTheoKhoa_` theo Số HĐ đang có trong Nháp (CT + 112) thay vì cả sổ.
- Trợ lý AI: `_soLieuNangChoChatbot_` giữ phần công nợ / tổng hợp 10 phút, khóa gắn `CONGNO_LUC.THAY_DOI`; Đại lý / Nguồn gốc lấy từ `PhanTichNhapTT_DRAFT`.
- Cài đặt: `getCaiDatTongHop_` (CHI_DOC) trả 13 phần trong 1 lời gọi; trình duyệt `_caiDat_(tên, hàm)` dùng mỗi phần 1 lần, phần lỗi gọi riêng.
- Trình duyệt: 1 `MutationObserver` gom theo khung hình (`_xuLyDomMoi_`); bảng MISA / Chi tiết phân trang `BANG_LON_MOI_TRANG` = 100; lọc tên Danh Sách ĐNTT chờ 150 ms.

## Nâng cấp 2026.9.49

- **Tự tính tiền**: `_tinhLai112Nhap_()` (không khóa) là phần tính của `runCreate112`; Tạo mới, Thêm / Bỏ phiếu cân, Mở Đóng TT gọi `_tuTinhLaiSauThayDoi_()` trong khóa của thao tác. Lỗi tính lại không hỏng thao tác chính; chặn lệch tiền (`_hoSoLechTien_`) vẫn giữ ở Xác nhận / In / UNC / Duyệt.
- **Trạng thái hiển thị**: Chưa tính tiền / Chờ xác nhận / Chờ duyệt. Giá trị lưu cột X Draft 112 vẫn là `"Đang ĐNTT"` (so sánh trong code dùng giá trị này).
- **Hộp xác nhận** `xacNhan(noiDung, {tieuDe, nutOk, nguyHiem, maGo, oNhap})` / `nhapChu()` thay `confirm()` / `prompt()` (#hop-xac-nhan, z-index trên modal).
- **Nhật ký bước Duyệt**: Script Property `DUYET_DO_DANG` ghi trước khi ghi sổ, xóa khi xong; `getDuyetDoDang_` báo lượt dở (> 7 phút), `webHoanTatDuyetDoDang_` chạy lại đúng hồ sơ + ngày (runConfirmPayment_ bỏ qua phần đã ghi).
- **Kiểm tra đêm**: trigger `kiemTraToanVenHangDem_` 2:00 (`setupKiemTraDemTrigger_`), kết quả `KIEM_TRA_DEM_KET_QUA`, email Quản trị (`MailApp`, chỉ khi kết quả đổi - `KIEM_TRA_DEM_DA_GUI`). Cần cấp thêm quyền gửi email khi triển khai.
- **Lịch sử hồ sơ** `getLichSuHoSo_`, **tìm nhanh** `timKiemNhanh_`, **đối chiếu sao kê** `doiChieuSaoKe_` (chỉ đọc ChiTietUNC), **VietQR** `_urlVietQr_` / `_anhVietQr_` (img.vietqr.io, tắt bằng `PHIEU_VIETQR=0`), **Trang chủ** `xuHuong30Ngay` + `tuoiNo` (chỉ đọc số đã tổng hợp).
- **Trình duyệt**: Hệ Thống 2 tab (Tra cứu / Can thiệp), Tạo Mới lưu nháp `sessionStorage` (`hak_tao_moi_nhap_v1`), biểu đồ SVG dùng `--series-1/2` (đã kiểm định mù màu sáng/tối).
- **CI**: `.github/workflows/test.yml` - `node --check` Code.gs + `node --test`.

