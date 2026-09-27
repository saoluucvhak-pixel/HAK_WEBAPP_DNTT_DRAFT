# DEVELOPER GUIDE

## Bố cục mã
| File | Nội dung |
|---|---|
| `Code.gs` | Backend (file phẳng — gas-tools). Thứ tự: cấu hình → lớp ghi/xóa an toàn → sao lưu/khôi phục → xác thực & `API_ROUTES` → hiệu năng → lưu trữ năm/khóa sổ → cài đặt → UNC/MISA/báo cáo → Duyệt → Tạo mới/Nháp → cache/mirror → công nợ/phân tích → trigger → menu Sheet → chatbot |
| `Index.html` | CSS (biến màu, dark/print ở cuối `<style>`) + JS SPA: helpers → a11y/giao diện → đăng nhập → `call()` → điều hướng `PAGES` → các trang |
| `tests/gas/` | Mock Apps Script (`mock.mjs`), nạp `Code.gs` (`loadCode.mjs`), dữ liệu mẫu (`fixtures.mjs`), tách hàm client (`clientSource.mjs`) |
| `tests/unit`, `tests/integration` | Test Node (`*.test.mjs`) |
| `tests/ui` | Test trình duyệt Playwright (`*.ui.mjs`) + `trangMau.mjs` (dựng trang với `google.script.run` giả) |

## Quy ước bắt buộc
1. Hàm nội bộ kết thúc `_`. Chức năng gọi từ web = hàm `_` + 1 dòng `API_ROUTES` (xem `API.md`).
2. Ghi sheet: chỉ qua `_ghiTheoDong_` / `_ghiCungGiaTri_` / `_thayVungDuLieu_` / `_ghiLaiMirror_` hoặc `setValues(_dongAnToan_(rows, COT_CHU.*))`. Không `clear()` rồi ghi.
3. Xóa dòng: chỉ `_saoLuuVaXoaDong_(sh, điềuKiện, HÀNH_ĐỘNG, mãThaoTác)`.
4. Tìm dòng phiếu cân: `_dongPhieuCanTheoSo_` (cột `PC_COL.SO_CT`); cột Phiếu Cân chỉ qua `PC_COL` (test chặn số trần).
5. Chữ số giữ số 0 đầu: `_chu_`; ngày người dùng nhập: `_ngayVNTruaThat_`; so ngày: `_inDateRange_` / `_onOrBefore_` (giờ VN, không so mốc 00:00).
6. Thao tác đọc-rồi-ghi: trong `sysLock.acquire()` hoặc `_chayTrongKhoa_` (không lồng khóa).
7. File báo cáo mới: `_taoFileBaoCao_(tên, thưMục)`.
8. Lỗi trả người dùng: `_loiChoNguoiDung_(e)`; nhật ký: `logAction_(HÀNH_ĐỘNG, mã, chiTiết)` — thêm nhãn vào `NHAN_HANH_DONG` (client) nếu hiện ở Lịch sử/Khôi phục.
9. Client: dữ liệu động luôn `esc()`; nút mang dữ liệu `hanhDong()`; ngày mặc định `todayISOVN()`; phần tử bấm được dạng `<div>` dùng class `.subtab` / `tr.clickable` / `.suggest-item` (tự có role/tabindex) hoặc `role="button" tabindex="0"`.
10. Màu: dùng biến CSS (`--white` = nền thẻ, `--ink`, `--line`…) để chế độ tối hoạt động.
11. Chú thích giải thích **vì sao**; lịch sử ghi `CHANGELOG.md`.

## Chạy test
```bash
node --test "tests/**/*.test.mjs"                                     # nghiệp vụ, không cần cài gì
HAK_CODE_GS=/đường/dẫn/Code.cu.gs node --test "tests/**/*.test.mjs"    # chạy cùng bộ test trên bản khác (chứng minh test bắt lỗi)
NODE_PATH=$(npm root -g) node --test tests/ui/giaoDien.ui.mjs           # giao diện (cần playwright; CHROMIUM=đường dẫn nếu khác mặc định)
```

## Viết test cho lỗi mới
1. Dựng dữ liệu bằng `buildWorld()` (có thể chỉnh sheet trước khi `loadCode`).
2. `run('tênHàm_')(…)` gọi thẳng hàm nội bộ; `env` để chặn/đếm lệnh gọi dịch vụ (vd đếm `openById`).
3. Test phải **thất bại trên bản cũ** (`HAK_CODE_GS`) và đạt trên bản mới.

## Sinh lại bảng API
```bash
node -e "import('./tests/gas/loadCode.mjs').then(async ({loadCode}) => { const {buildWorld} = await import('./tests/gas/fixtures.mjs'); const {run} = loadCode(buildWorld().options); for (const [k,r] of Object.entries(run('API_ROUTES'))) console.log(k, r.fn.name, r.quyen); })"
```

## Phát hành
Xem `DEPLOY.md`. Mỗi thay đổi: CHANGELOG (+ ⚖️ nếu đổi nghiệp vụ và đã được đồng ý), VERSION, dòng đầu `Code.gs`, chân thanh bên `Index.html`, TODO/ROADMAP, ARCHITECTURE nếu đổi module.
