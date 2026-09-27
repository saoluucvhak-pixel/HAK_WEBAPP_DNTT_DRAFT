import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld, pcRow } from '../gas/fixtures.mjs';

// Hồi quy cho các lỗi tìm thấy ở đợt rà soát toàn hệ thống 27/09/2026 (v2026.9.7).
// Mỗi test đều THẤT BẠI trên bản 2026.9.6.

function setup(chinhWorld) {
  const world = buildWorld();
  if (chinhWorld) chinhWorld(world);
  const { run } = loadCode(world.options);
  return { world, run };
}
const soTrongCT = w => w.main.getSheetByName('DNTT_GK_DN_CT').rows(22).slice(1).map(r => r[11]);
const ngayVN = iso => new Date(iso + 'T00:00:00+07:00');

test('Duyệt: the same weigh ticket in two draft records of one batch is never paid twice', () => {
  const { world, run } = setup(w => {
    w.draft.getSheetByName('DNTT_GK_DN_CT_DRAFT').data[2][11] = 'PC001'; // B2 cũng chứa PC001
    w.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').data[2][23] = 'Đang ĐNTT';
  });
  const msg = run('runConfirmPayment_')(['A1', 'B2'], '26/09/2026');
  assert.match(msg, /TRÙNG trong lượt Duyệt/, msg);
  assert.match(msg, /PC001/);
  assert.deepEqual(soTrongCT(world), [], 'no record involving the duplicated ticket is committed');
  const pc = world.pc.getSheetByName('PhieuCan_DN').rows(28).slice(1);
  assert.equal(pc.find(r => r[22] === 'PC001')[27], '', 'the ticket is not locked');
});

test('Duyệt: a ticket listed twice inside one record is blocked, other records still commit', () => {
  const { world, run } = setup(w => {
    w.draft.getSheetByName('DNTT_GK_DN_CT_DRAFT').data[3][11] = 'PC001'; // A1 có PC001 hai lần
    w.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').data[2][23] = 'Đang ĐNTT';
  });
  const msg = run('runConfirmPayment_')(['A1', 'B2'], '26/09/2026');
  assert.match(msg, /^✅/, msg);
  assert.deepEqual(soTrongCT(world), ['PC003'], 'only B2 is committed');
});

test('Mở Đóng TT unlocks by the Số phiếu cân column Duyệt locked (W), every row of the ticket', () => {
  const { world, run } = setup(w => {
    const pc = w.pc.getSheetByName('PhieuCan_DN');
    pc.data.slice(1).forEach(r => { r[0] = 'CAN-' + r[22]; }); // cột A khác cột W
    pc.data.push(pcRow('PC002', 'Nguyen Van A')); // phiếu PC002 có 2 dòng
    pc.data[pc.data.length - 1][0] = 'CAN-PC002-B';
  });
  assert.match(run('runConfirmPayment_')(['A1'], '26/09/2026'), /^✅/);
  const locked = world.pc.getSheetByName('PhieuCan_DN').rows(28).slice(1).filter(r => r[27] === 'Y');
  assert.equal(locked.length, 3, 'Duyệt locks every row of PC001 + PC002');

  const res = run('webMoDongThanhToanTheoHoSo_')('Nguyen Van A', '2026-09-26', '1');
  assert.equal(res.success, true, res.message);
  assert.doesNotMatch(res.message, /Không mở khóa được/, res.message);
  const pc = world.pc.getSheetByName('PhieuCan_DN').rows(28).slice(1);
  pc.filter(r => ['PC001', 'PC002'].includes(r[22])).forEach(r => {
    assert.equal(r[27], '', `${r[0]} must be unlocked`);
    assert.equal(r[26], '');
    assert.equal(r[24], 'Test giá');
  });
});

test('Đồng bộ tên KH finds tickets by the W column and renames every row of the ticket', () => {
  const { world, run } = setup(w => {
    const pc = w.pc.getSheetByName('PhieuCan_DN');
    pc.data.slice(1).forEach(r => { r[0] = 'CAN-' + r[22]; });
    pc.data.push(pcRow('PC003', 'Ten Sai'));
  });
  const res = run('webDongBoTenKhachHang_')([{ soPhieuCan: 'PC003', chuRungCT: 'Tran Thi B (dung)' }]);
  assert.equal(res.success, true, res.message);
  const rows = world.pc.getSheetByName('PhieuCan_DN').rows(28).slice(1).filter(r => r[22] === 'PC003');
  assert.equal(rows.length, 2);
  rows.forEach(r => assert.equal(r[11], 'Tran Thi B (dung)'));
});

test('Công nợ theo phiếu cân "đến ngày D" excludes tickets paid ON day D', () => {
  const { run } = setup(w => {
    w.pc.getSheetByName('PhieuCan_DN').data.slice(1).forEach(r => { r[1] = ngayVN('2026-09-20'); });
  });
  assert.match(run('runConfirmPayment_')(['A1'], '26/09/2026'), /^✅/);
  const so = d => Array.from(run('getChiTietCongNoPhieuCan_')(d), r => r.soPhieuCan).sort();
  assert.deepEqual(so('2026-09-25'), ['PC001', 'PC002', 'PC003', 'PC999'], 'before payment: all are debt');
  assert.deepEqual(so('2026-09-26'), ['PC003', 'PC999'], 'paid on the day -> no longer debt that day');
});

test('Xóa hồ sơ Nháp backs up its ChiTietDNTT / ChiTietUNC rows (restorable) before deleting', () => {
  const { world, run } = setup(w => {
    const ctiet = w.main.getSheetByName('ChiTietDNTT');
    const r = new Array(28).fill(''); r[0] = 'B2'; r[2] = "'PC003"; r[26] = 'N';
    ctiet.data.push(r);
    w.main.addSheet('ChiTietUNC', [Array.from({ length: 18 }, (_, i) => 'u' + i), ['B2', 1, 'O', "'1", 'Tran Thi B']]);
  });
  const msg = run('runDeleteDraftRecord_')('B2');
  assert.match(msg, /^✅/, msg);
  assert.equal(world.main.getSheetByName('ChiTietUNC').rows().length, 1);
  const bk = world.main.getSheetByName('SYS_SaoLuuDongXoa').rows().slice(1);
  assert.deepEqual(bk.map(r => [r[2], r[4]]).sort(), [['XOA_NHAP', 'ChiTietDNTT'], ['XOA_NHAP', 'ChiTietUNC']]);
  assert.equal(new Set(bk.map(r => r[8])).size, 1, 'one restore group for the whole deletion');
  const nhom = run('getDanhSachSaoLuuXoa_')();
  assert.equal(nhom[0].soDong, 2);
});

test('Tình hình thanh toán is sorted by real date across months (newest first)', () => {
  const w = buildWorld();
  w.pc.getSheetByName('PhieuCan_DN').data.slice(1).forEach(r => { r[1] = ngayVN('2026-09-20'); });
  w.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').data[2][23] = 'Đang ĐNTT';
  const { run } = loadCode(w.options);
  assert.match(run('runConfirmPayment_')(['A1'], '30/09/2026'), /^✅/);
  assert.match(run('runConfirmPayment_')(['B2'], '01/10/2026'), /^✅/);
  const ngay = Array.from(run('getTinhHinhThanhToanHangNgay_')('2026-09-01', '2026-10-31'), r => r.ngayThanhToan);
  assert.deepEqual(ngay, ['01/10/2026', '30/09/2026', '30/09/2026']);
});

test('Hiệu năng: 1 lượt Duyệt mở File Chính đúng 1 lần (trước đây mở lại ở mỗi lần ghi nhật ký...)', () => {
  const w = buildWorld();
  const { run, env } = loadCode(w.options);
  const mo = env.SpreadsheetApp.openById;
  let soLanMoChinh = 0;
  env.SpreadsheetApp.openById = id => { if (id === 'MAIN_SS') soLanMoChinh++; return mo(id); };
  assert.match(run('runConfirmPayment_')(['A1'], '26/09/2026'), /^✅/);
  assert.equal(soLanMoChinh, 1);
});

test('Xuất báo cáo tạo file thẳng trong thư mục báo cáo (moveTo), không qua addFile/removeFile', () => {
  const w = buildWorld();
  const { run, env } = loadCode(w.options);
  const daChuyen = [];
  env.DriveApp.getFileById = id => ({ getId: () => id, moveTo: f => daChuyen.push([id, f.ten]) });
  env.DriveApp.getFolderById = () => ({ ten: 'BAO_CAO' });
  env.DriveApp.getRootFolder = () => { throw new Error('không được dùng thư mục gốc'); };
  const ss = run('_taoFileBaoCao_')('Thu nghiem');
  assert.deepEqual(daChuyen, [[ss.getId(), 'BAO_CAO']]);
});

test('In Báo Cáo ĐNTT (Excel) xếp hồ sơ theo THỜI GIAN LẬP, không theo tên / thứ tự dòng Nháp', () => {
  const w = buildWorld();
  const h112 = w.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').data;
  // Dòng Nháp đang theo tên (A trước B) nhưng B2 lập TRƯỚC A1.
  h112[1][1] = new Date('2026-09-26T10:00:00+07:00'); // A1 - Nguyen Van A
  h112[2][1] = new Date('2026-09-25T08:00:00+07:00'); // B2 - Tran Thi B
  h112[2][23] = 'Đang ĐNTT';
  const { run, env } = loadCode(w.options);
  let file;
  const tao = env.SpreadsheetApp.create;
  env.SpreadsheetApp.create = ten => (file = tao(ten));
  const kq = run('exportBaoCaoDNTTFromDraft_')(['A1', 'B2']);
  assert.equal(kq.success, true, kq.message);
  const chuRung = file.getSheets()[0].rows(11).slice(4, 6).map(r => r[3]);
  assert.deepEqual(chuRung, ['Tran Thi B', 'Nguyen Van A']);
  const bangKe = file.getSheets()[1].rows(26).slice(4, 7).map(r => [r[0], String(r[2]).replace(/^'/, '')]);
  assert.deepEqual(bangKe, [[1, 'PC003'], [2, 'PC001'], [3, 'PC002']], 'bảng kê theo cùng thứ tự hồ sơ, STT liên tục');
});

// ---- Rà soát lại 27/09/2026 (v2026.9.11) ----

test('R-18: a failed PDF export keeps the Excel report and says the PDF failed', () => {
  const { run } = setup();
  run('UrlFetchApp').fetch = () => ({
    getResponseCode: () => 500, getContentText: () => '<html>error</html>',
    getBlob() { return { setName() { return this; } }; },
  });
  const kq = run('exportPhanTichNhapTTBaoCao_')('2026-09-01', '2026-09-26');
  assert.equal(kq.success, true, kq.message);
  assert.ok(kq.excelUrl, 'Excel link is still returned');
  assert.equal(kq.pdfUrl, '', 'no PDF file made from an error page');
  assert.match(kq.canhBao, /PDF/);
});

test('R-06: a failure writing the action log is reported to the execution log, not lost', () => {
  const { run } = setup();
  const loi = [];
  run('console').error = (...a) => loi.push(a.join(' '));
  run("getMainSs_ = () => { throw new Error('Hết quota'); }");
  run('logAction_')('THU', 'X1', 'chi tiết');
  assert.equal(loi.length, 1);
  assert.match(loi[0], /THU/);
  assert.match(loi[0], /X1/);
  assert.match(loi[0], /Hết quota/);
});

test('R-14: parseNum reads Vietnamese-formatted text numbers; plain numbers are unchanged', () => {
  const { run } = setup();
  const p = run('utils.parseNum');
  assert.equal(p('1.234.567'), 1234567);
  assert.equal(p('1.234.567,5'), 1234567.5);
  assert.equal(p('5.000.000 đ'), 5000000);
  assert.equal(p('1,234.5'), 1234.5);   // kiểu Mỹ giữ nguyên
  assert.equal(p('1.234'), 1.234);      // 1 dấu chấm: không đoán, giữ như cũ
  assert.equal(p('12,5'), 12.5);        // dấu phẩy thập phân kiểu VN
  assert.equal(p(1234.5), 1234.5);
  assert.equal(p(''), 0);
  assert.equal(p('-2.500.000'), -2500000);
});
