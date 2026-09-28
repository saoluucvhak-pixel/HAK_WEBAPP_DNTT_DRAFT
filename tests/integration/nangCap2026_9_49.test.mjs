import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Nâng cấp 2026.9.49 (người dùng đồng ý 28/09/2026: "bỏ mục 2, còn lại bạn làm đi").
const INDEX = readFileSync(new URL('../../Index.html', import.meta.url), 'utf8');
const theGioi = () => { const w = buildWorld(); return { w, ...loadCode({ ...w.options, owner: 'owner@hak.test' }) }; };
const hoSo = (run, id) => run('getDraftListSummary_')().find(r => r.idKey === id);

// ---------- #1 Tự tính tiền khi Tạo / Thêm / Bỏ phiếu ----------
test('#1 a new record gets its amount at once (no manual recalculation step)', () => {
  const { run } = theGioi();
  run('refreshPhieuCanUnpaidCache_')();
  const kq = run('createNewPaymentRequest_')({ hoTenChuRung: 'Tran Thi B', cccdChuRung: '012345678901', nguoiDeNghi: 'X', nguoiNhanTien: 'Tran Thi B',
    soTKNhanTien: '0123', nganHang: 'BIDV', soHopDong: 'HD01', ngayDeNghi: '2026-09-26', danhSachPhieuCan: ['PC999'] });
  assert.equal(kq.success, true, kq.message);
  assert.match(kq.message, /đã tự tính Số tiền/);
  const r = hoSo(run, kq.idKey);
  assert.equal(r.sanSangChot, true);
  assert.equal(r.soTien, 1000000);
  assert.equal(r.trangThaiKey, 'cho_dntt', 'goes straight to "Chờ xác nhận"');
  assert.equal(r.canTinhLai, false);
});

test('#1 adding / removing a weigh ticket recalculates the amount immediately', () => {
  const { run } = theGioi();
  run('runHuyXacNhanDNTT_')('A1');
  run('refreshPhieuCanUnpaidCache_')();
  const them = run('addPhieuCanToDraft_')('A1', 'PC999');
  assert.equal(them.success, true, them.message);
  assert.match(them.message, /đã tự tính lại Số tiền/);
  assert.equal(hoSo(run, 'A1').soTien, 3000000);
  const ct = run('getDraftRecordDetail_')('A1').chiTiet.find(c => String(c.soPhieuCan).includes('PC999'));
  const bo = run('removePhieuCanFromDraft_')(ct.idCT);
  assert.equal(bo.success, true);
  const r = hoSo(run, 'A1');
  assert.equal(r.soTien, 2000000);
  assert.equal(r.canTinhLai, false);
  const xn = run('runXacNhanDNTT_')(['A1']);
  assert.equal(xn.success, true, xn.message);
});

test('#12 the save button says what it really does', () => {
  assert.match(INDEX, /💾 Lưu hồ sơ \(vào Danh Sách ĐNTT, tự tính tiền\)/);
  assert.doesNotMatch(INDEX, /ghi sheet chính \+ tách vào Nháp/);
});

// ---------- #10 Tên trạng thái dễ phân biệt (chỉ đổi chữ hiển thị) ----------
test('#10 statuses read "Chưa tính tiền / Chờ xác nhận / Chờ duyệt"; the stored value is unchanged', () => {
  const { run, w } = theGioi();
  const ds = run('getDraftListSummary_')();
  assert.deepEqual([...new Set(ds.map(r => r.trangThaiLabel))].sort(), ['Chờ duyệt', 'Chờ xác nhận'].sort());
  assert.equal(run('runHuyXacNhanDNTT_')('A1').success, true);
  assert.equal(run('runXacNhanDNTT_')(['A1']).success, true);
  assert.equal(w.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').rows(24).find(r => r[0] === 'A1')[23], 'Đang ĐNTT', 'sheet value kept (older data, formulas)');
  assert.doesNotMatch(INDEX, /Chưa ĐNTT|Chờ ĐNTT|Đang ĐNTT/);
  assert.match(INDEX, /cho_dntt: '<span class="badge wait dot">Chờ xác nhận<\/span>'/);
  assert.match(INDEX, /🔄 Tính lại số tiền/);
});

// ---------- #3 Hộp xác nhận trong trang ----------
test('#3 no browser confirm()/prompt() left; dangerous actions ask to type a code', () => {
  const js = INDEX.slice(INDEX.indexOf('<script>', INDEX.indexOf('</style>')));
  assert.doesNotMatch(js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''), /(?<![\w.])(confirm|prompt)\(/, 'native dialogs gone');
  assert.ok((js.match(/await (xacNhan|nhapChu)\(/g) || []).length >= 24);
  [/maGo: 'MO DONG'/, /maGo: String\(nam\)/, /maGo: 'MA MOI'/, /maGo: riskLevel === 'danger' \? 'XOA'/].forEach(re => assert.match(js, re));
  assert.match(INDEX, /<div class="modal-bg" id="hop-xac-nhan"><div class="modal" role="alertdialog"/);
  assert.match(js, /\(o \|\| \(tc\.nguyHiem \? huy : ok\)\)\.focus\(\);/, 'dangerous: focus starts on Cancel');
});

// ---------- #4 Lịch sử của từng hồ sơ ----------
test('#4 a record history lists every action on that record (also multi-record approvals), oldest first', () => {
  const { run } = theGioi();
  run('runHuyXacNhanDNTT_')('A1');
  assert.equal(run('updateDraft112Info_')('A1', { nguoiNhan: 'Nguyen Van Z' }).success, true);
  run('runXacNhanDNTT_')(['B2', 'A1']);
  assert.match(run('runConfirmPayment_')(['A1', 'B2'], new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10)), /^✅/);
  const ls = run('api')('', 'getLichSuHoSo', ['A1']);
  const hd = ls.map(x => x.hanhDong);
  assert.ok(hd.includes('SUA_NHAP') && hd.includes('CHOT_THANH_TOAN'), hd.join(','));
  assert.ok(hd.indexOf('SUA_NHAP') < hd.indexOf('CHOT_THANH_TOAN'), 'oldest first');
  assert.match(ls.find(x => x.hanhDong === 'SUA_NHAP').chiTiet, /Nguyen Van Z/);
  assert.ok(!run('getLichSuHoSo_')('B2').some(x => x.hanhDong === 'SUA_NHAP'), 'only its own edits');
  assert.match(INDEX, /taiLichSuHoSo\(this\.dataset\.id\)/);
});

// ---------- #6 Duyệt bị dừng giữa chừng ----------
test('#6 an approval stopped half-way is detected and can be completed, without duplicates', () => {
  const { run, w, env } = theGioi();
  const ngay = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  // Giả lập Google dừng lượt Duyệt ngay sau khi ghi sổ CT (trước khi khóa phiếu cân / dọn Nháp).
  run(`() => { globalThis.__khoaGoc = _khoaPhieuCanDaTra_; _khoaPhieuCanDaTra_ = () => { throw new Error('Exceeded maximum execution time'); }; }`)();
  assert.doesNotMatch(run('runConfirmPayment_')(['A1'], ngay), /^✅/);
  run(`() => { _khoaPhieuCanDaTra_ = globalThis.__khoaGoc; }`)();
  assert.equal(run('getDuyetDoDang_')(), null, 'not reported while it could still be running');
  const props = env.PropertiesService.getScriptProperties();
  const j = JSON.parse(props.getProperty('DUYET_DO_DANG'));
  j.luc -= 8 * 60e3; props.setProperty('DUYET_DO_DANG', JSON.stringify(j));
  const dd = run('api')('', 'getDuyetDoDang', []);
  assert.deepEqual(Array.from(dd.ids), ['A1']);
  const kq = run('api')('', 'webHoanTatDuyetDoDang', []);
  assert.equal(kq.success, true, kq.message);
  assert.equal(w.main.getSheetByName('DNTT_GK_DN_CT').rows(22).slice(1).filter(r => r[1] === 'A1').length, 2, 'no duplicate ledger rows');
  assert.ok(w.pc.getSheetByName('PhieuCan_DN').rows(28).slice(1).filter(r => ['PC001', 'PC002'].includes(r[22])).every(r => r[27] === 'Y'), 'tickets now locked');
  assert.equal(props.getProperty('DUYET_DO_DANG'), null, 'journal cleared');
  assert.equal(run('getDuyetDoDang_')(), null);
});

test('#6 a normal approval leaves no journal', () => {
  const { run, env } = theGioi();
  assert.match(run('runConfirmPayment_')(['A1'], new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10)), /^✅/);
  assert.equal(env.PropertiesService.getScriptProperties().getProperty('DUYET_DO_DANG'), null);
});

// ---------- #5 Kiểm tra toàn vẹn hằng đêm ----------
test('#5 the nightly check finds problems, stores them for the home page and emails admins once', () => {
  const { run, w, env } = theGioi();
  assert.match(run('runConfirmPayment_')(['A1'], new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10)), /^✅/);
  // Phiếu cân đã trả nhưng bị ai đó mở khóa tay + dòng MISA bị xóa.
  w.pc.getSheetByName('PhieuCan_DN').data.find(r => r[22] === 'PC001')[27] = '';
  const nh = w.updateNh.getSheetByName('Update_NganHang_DN');
  nh.data = nh.data.filter(r => !String(r[4]).includes('PC002'));
  run('_invalidatePcCache_')();
  const kq = run('kiemTraToanVenHangDem_')();
  const ten = kq.muc.map(m => m.ten).join(' | ');
  assert.match(ten, /chưa khóa trong Phiếu Cân/, ten);
  assert.match(ten, /chưa có dòng MISA/);
  assert.equal(env.MailApp.daGui.length, 1);
  assert.match(env.MailApp.daGui[0].to, /saoluucvhak@gmail\.com/);
  assert.match(env.MailApp.daGui[0].body, /PC001/);
  run('kiemTraToanVenHangDem_')();
  assert.equal(env.MailApp.daGui.length, 1, 'same result -> no repeated email');
  const trangChu = run('api')('', 'getDashboardStats', []);
  assert.ok(trangChu.kiemTraDem && trangChu.kiemTraDem.tong > 0);
  assert.equal(run('KIEM_TRA_DEM.GIO'), 2);
});

test('#5 a clean system sends nothing', () => {
  const { run, env } = theGioi();
  const kq = run('_kiemTraToanVenThucHien_')();
  // Dữ liệu mẫu có sẵn 1 đơn xin cũ "OLD1" không có 112 - đúng là vấn đề; ngoài ra không có gì.
  assert.deepEqual(Array.from(kq.muc, m => m.ten).filter(t => !/đối soát tên|Đơn xin không có dòng 112/.test(t)), [], JSON.stringify(kq.muc));
  assert.ok(!kq.muc.some(m => /MISA|chưa khóa/.test(m.ten)));
  assert.equal(env.MailApp.daGui.length, kq.tong ? 1 : 0);
});

// ---------- #11 Trang Hệ Thống 2 tab ----------
test('#11 the System page separates look-up from data-changing tools', () => {
  const than = INDEX.slice(INDEX.indexOf('function renderHeThong(){'), INDEX.indexOf('\n}\n', INDEX.indexOf('function renderHeThong(){')));
  const tra = than.slice(than.indexOf('<div id="hethong-tracuu">'), than.indexOf('<div id="hethong-canthiep"'));
  const can = than.slice(than.indexOf('<div id="hethong-canthiep"'));
  const tieuDe = html => Array.from(html.matchAll(/<h3[^>]*>([^<]*)<\/h3>/g), m => m[1]).join(' | ');
  const tTra = tieuDe(tra), tCan = tieuDe(can);
  ['Kiểm Tra Dữ Liệu Hằng Đêm', 'Lịch Sử Sửa Đổi', 'Bảo Trì', 'Hiệu Năng', 'Đối Soát Tên'].forEach(t => assert.ok(tTra.includes(t), t));
  ['Mở "Đóng" Thanh Toán', 'Khôi Phục Dữ Liệu Đã Xóa', 'Khóa Sổ Năm', 'Cập Nhật Ngân Hàng', 'Đồng Bộ Lịch Sử', 'Tạo Lại MISA', 'Tạo Lại UNC'].forEach(t => assert.ok(tCan.includes(t) && !tTra.includes(t), t));
  assert.match(can, /Các chức năng dưới đây SỬA \/ XÓA dữ liệu đã chốt/);
});

// ---------- #7 Tuổi nợ + xu hướng 30 ngày ----------
test('#7 the home page gets a 30-day buy / pay trend and debt ageing from pre-aggregated data only', () => {
  const { run, w } = theGioi();
  const homNay = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  const pt = w.draft.getSheetByName('PhanTichNhapTT_DRAFT') || w.draft.addSheet('PhanTichNhapTT_DRAFT', [['Ngày', 'Loại', 'PhanLoai', 'Ten', 'KhoiLuongKg', 'GiaTri']]);
  pt.data.push([homNay, 'NHAP', 'TONG', 'Tổng', 5000, 7e6], [homNay, 'THANHTOAN', 'TONG', 'Tổng', 3, 4e6], [homNay, 'NHAP', 'DL', 'DL1', 5000, 7e6]);
  const ct = w.draft.getSheetByName('ChiTietCongNoPhieuCan_DRAFT') || w.draft.addSheet('ChiTietCongNoPhieuCan_DRAFT', [run('CTCN_HEADERS').slice()]);
  const dong = (so, tien, tre) => { const r = run('CTCN_HEADERS').map(() => ''); r[0] = so; r[11] = tien; r[14] = tre; return r; };
  ct.data.push(dong('P1', 1e6, 5), dong('P2', 2e6, 45), dong('P3', 3e6, 75), dong('P4', 4e6, 120), dong('P5', 5e6, 10));
  run('PropertiesService.getScriptProperties()').setProperty('CTCN_SNAPSHOT_DATE', '2026-09-27');
  run('getDashboardStats_')(); // lần đầu: ngày chưa có trong bảng Phân tích được tính bù 1 lần (như cũ)
  run(`() => { const g = _pcGopLuuTru_; globalThis.__quetPc = 0; _pcGopLuuTru_ = (...a) => { globalThis.__quetPc++; return g(...a); }; }`)();
  const s = run('getDashboardStats_')();
  const quetPc = run('globalThis.__quetPc');
  assert.equal(s.xuHuong30Ngay.length, 30);
  const cuoi = s.xuHuong30Ngay[29];
  assert.deepEqual([cuoi.ngayISO, cuoi.mua, cuoi.tt], [homNay, 7e6, 4e6], 'TONG rows only (DL row not double-counted)');
  assert.deepEqual(Array.from(s.tuoiNo.nhom, g => [g.soPhieu, g.tien]), [[2, 6e6], [1, 2e6], [1, 3e6], [1, 4e6]]);
  assert.equal(s.tuoiNo.tinhDen, '27/09/2026');
  assert.equal(quetPc, 0, 'later visits: no weigh-ticket scan');
  assert.match(INDEX, /--series-1:#2a78d6; --series-2:#eb6834;/);
  assert.match(INDEX, /<summary style="cursor:pointer;font-size:13px">Xem bảng số liệu<\/summary>/, 'table view');
});

// ---------- #8 Tìm nhanh ----------
test('#8 quick search finds draft and closed records by id, ticket, account, contract or name (no accents)', () => {
  const { run } = theGioi();
  assert.match(run('runConfirmPayment_')(['A1'], new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10)), /^✅/);
  const tim = q => run('api')('', 'timKiemNhanh', [q]).ketQua;
  assert.deepEqual(Array.from(tim('B2'), r => [r.loai, r.idKey, r.khop]), [['nhap', 'B2', 'Mã hồ sơ']]);
  const pc = tim('pc002');
  assert.equal(pc[0].loai, 'chot'); assert.equal(pc[0].idKey, 'A1'); assert.match(pc[0].khop, /Số phiếu cân PC002/);
  assert.ok(tim('tran thi').some(r => r.idKey === 'B2' && r.khop === 'Tên'), 'accent-insensitive name');
  assert.ok(tim('0123456789').length >= 1, 'account number');
  assert.equal(tim('x').length, 0);
  assert.equal(run('API_ROUTES').timKiemNhanh.quyen, 'NGHIEP_VU');
  assert.match(INDEX, /<form id="tim-nhanh" class="tim-nhanh hidden" role="search"/);
});

// ---------- #9 Tạo Mới tự lưu nháp ----------
test('#9 the create wizard saves its progress in sessionStorage and offers to resume it', () => {
  assert.match(INDEX, /const TAO_MOI_NHAP_KHOA = 'hak_tao_moi_nhap_v1';/);
  assert.match(INDEX, /sessionStorage\.setItem\(TAO_MOI_NHAP_KHOA/, 'session only - cleared when the tab closes');
  assert.doesNotMatch(INDEX, /localStorage\.setItem\(TAO_MOI_NHAP_KHOA/);
  const bat = INDEX.slice(INDEX.indexOf('async function startCreateFlow(){'), INDEX.indexOf('\n}\n', INDEX.indexOf('async function startCreateFlow(){')));
  assert.match(bat, /Tiếp tục nhập hồ sơ đó\?/);
  const luu = INDEX.slice(INDEX.indexOf("call('createNewPaymentRequest'"), INDEX.indexOf("call('createNewPaymentRequest'") + 300);
  assert.match(luu, /_xoaNhapTaoMoi_\(\);/, 'cleared after a successful save');
  assert.match(INDEX, /_xoaNhapTaoMoi_\(\);\s*hienManHinhDangNhap\('Đã đăng xuất\.'\)/, 'cleared on logout');
});

// ---------- #13 Đối chiếu sao kê ngân hàng ----------
test('#13 bank statement lines are matched to UNCs by amount + account/name + date; the rest is reported', () => {
  const { run } = theGioi();
  const homNay = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  assert.equal(run('webCreateUNCFromDraft_')(['A1'], homNay, '', '').success, true); // UNC 2.000.000 đ -> STK 0123456789
  const ngayTruoc = new Date(Date.now() + 7 * 3600e3 - 86400e3).toISOString().slice(0, 10);
  const kq = run('api')('', 'doiChieuSaoKe', [[
    { ngay: ngayTruoc, soTien: -2000000, noiDung: 'CK DEN TK 0123456789 NGUYEN VAN A THANH TOAN GO KEO', tk: '' }, // khớp (lệch 1 ngày)
    { ngay: homNay, soTien: 2000000, noiDung: 'Phi dich vu', tk: '' },                                          // cùng số tiền nhưng đã dùng -> thừa
    { ngay: homNay, soTien: 55000, noiDung: 'Phi SMS', tk: '' },                                                 // không có UNC
    { ngay: 'sai', soTien: 1, noiDung: 'x' }                                                                     // bỏ (không đọc được ngày)
  ]]);
  assert.equal(kq.success, true, kq.message);
  assert.equal(kq.soDongSaoKe, 3);
  assert.equal(kq.khop.length, 1);
  assert.equal(kq.khop[0].unc.idHeThong, 'A1');
  assert.equal(kq.khop[0].theo, 'STK');
  assert.equal(kq.uncThieu.length, 0);
  assert.deepEqual(Array.from(kq.saoKeThua, d => d.soTien).sort(), [2000000, 55000].sort());
});

test('#13 an amount-only match is flagged for checking; an unpaid UNC is listed', () => {
  const { run } = theGioi();
  const homNay = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  run('webCreateUNCFromDraft_')(['A1'], homNay, '', '');
  const chiSoTien = run('doiChieuSaoKe_')([{ ngay: homNay, soTien: 2000000, noiDung: 'CHUYEN TIEN', tk: '' }]);
  assert.equal(chiSoTien.canKiem.length, 1);
  const khongCo = run('doiChieuSaoKe_')([{ ngay: homNay, soTien: 999, noiDung: 'x', tk: '' }]);
  assert.equal(khongCo.uncThieu.length, 1);
  assert.equal(khongCo.uncThieu[0].stk, '0123456789');
  assert.equal(run('doiChieuSaoKe_')([]).success, false);
});

test('#13 browser: statement amounts / dates in bank formats are read correctly', () => {
  const lay = ten => { const a = INDEX.indexOf(`function ${ten}(`); return INDEX.slice(a, INDEX.indexOf('\n}\n', a) + 2); };
  const f = new Function(lay('_docSoTienSaoKe_') + lay('_docNgaySaoKe_') + lay('_docCsv_') + 'return { _docSoTienSaoKe_, _docNgaySaoKe_, _docCsv_ };')();
  [['1.234.567', 1234567], ['1,234,567.00', 1234567], ['1.234.567,50', 1234567.5], ['-2.000.000', -2000000], ['(2,000)', -2000], ['55.000', 55000], ['12,5', 12.5], [2000000, 2000000], ['', 0]]
    .forEach(([v, kq]) => assert.equal(f._docSoTienSaoKe_(v), kq, String(v)));
  assert.equal(f._docNgaySaoKe_('28/09/2026'), '2026-09-28', 'Vietnamese banks: day/month/year');
  assert.equal(f._docNgaySaoKe_('28-09-2026 10:15'), '2026-09-28');
  assert.equal(f._docNgaySaoKe_('2026-09-28'), '2026-09-28');
  assert.deepEqual(f._docCsv_('a;b\n"x;1";2\n'), [['a', 'b'], ['x;1', '2']], 'semicolon CSV with quotes');
  assert.match(INDEX, /cdnjs\.cloudflare\.com\/ajax\/libs\/xlsx\/0\.18\.5\/xlsx\.full\.min\.js/);
});
