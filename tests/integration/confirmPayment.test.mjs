import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld, rowWasWritten } from '../gas/fixtures.mjs';

function setup() {
  const world = buildWorld();
  const { run } = loadCode(world.options);
  return { world, run };
}

const idsIn = (sheet, col) => sheet.rows().slice(1).map(r => String(r[col]).trim());

test('runConfirmPayment commits the selected record end-to-end', () => {
  const { world, run } = setup();
  const msg = run('runConfirmPayment_')(['A1'], '2026-09-26');
  assert.match(msg, /^✅/, msg);

  const ct = world.main.getSheetByName('DNTT_GK_DN_CT').rows(22).slice(1);
  assert.equal(ct.length, 2);
  ct.forEach(r => { assert.equal(r[1], 'A1'); assert.equal(r[18], 'Y'); assert.ok(r[20] instanceof Date); });

  const h112 = world.main.getSheetByName('DNTT_GK_DN_112').rows(23).slice(1);
  assert.equal(h112.length, 1);
  assert.equal(h112[0][0], 'A1');
  assert.equal(h112[0][20], 'Y');

  const src = world.main.getSheetByName('DNTT_GK_DN').rows(18).slice(1);
  const a1 = src.filter(r => r[0] === 'A1');
  assert.equal(a1.length, 1);
  assert.equal(a1[0][14], 'Đóng TT');
  assert.equal(a1[0][15], '20260926_1');
  assert.equal(a1[0][17], 'Y');

  const pc = world.pc.getSheetByName('PhieuCan_DN').rows(28);
  const bySo = Object.fromEntries(pc.slice(1).map(r => [r[22], r]));
  ['PC001', 'PC002'].forEach(so => {
    assert.equal(bySo[so][24], 'OK');
    assert.equal(bySo[so][26], 'Đóng TT');
    assert.equal(bySo[so][27], 'Y');
  });
  assert.equal(bySo.PC003[27], '');
  assert.equal(bySo.PC999[27], '');

  assert.deepEqual(idsIn(world.draft.getSheetByName('DNTT_GK_DN_CT_DRAFT'), 1), ['B2']);
  assert.deepEqual(idsIn(world.draft.getSheetByName('DNTT_GK_DN_112_DRAFT'), 0), ['B2']);
  assert.deepEqual(idsIn(world.draft.getSheetByName('DNTT_GK_DN_DRAFT'), 0), ['B2']);

  const chiTiet = world.main.getSheetByName('ChiTietDNTT').rows(28).slice(1);
  assert.equal(chiTiet.length, 2);
  chiTiet.forEach(r => { assert.equal(r[26], 'Y'); assert.ok(r[3] instanceof Date, 'ledger stores a real date'); assert.equal(r[3].toISOString().slice(0, 10), '2026-09-26'); });

  const misa = world.updateNh.getSheetByName('Update_NganHang_DN').rows(33).slice(1);
  assert.equal(misa.length, 2);
});

test('runConfirmPayment never rewrites unrelated rows of external/main sheets', () => {
  const { world, run } = setup();
  const pcSheet = world.pc.getSheetByName('PhieuCan_DN');
  const srcSheet = world.main.getSheetByName('DNTT_GK_DN');
  const chiTietSheet = world.main.getSheetByName('ChiTietDNTT');
  const msg = run('runConfirmPayment_')(['A1'], '2026-09-26');
  assert.match(msg, /^✅/, msg);

  assert.equal(rowWasWritten(pcSheet, 1), false, 'PhieuCan header must not be rewritten');
  assert.equal(rowWasWritten(pcSheet, 3), false, 'PC999 (unrelated) must not be rewritten');
  assert.equal(rowWasWritten(pcSheet, 5), false, 'PC003 (other record) must not be rewritten');
  assert.equal(pcSheet.rows(28)[2][11], '=HYPERLINK("x")');

  assert.equal(rowWasWritten(srcSheet, 1), false, 'DNTT_GK_DN header must not be rewritten');
  assert.equal(rowWasWritten(srcSheet, 2), false, 'unrelated DNTT_GK_DN row must not be rewritten');
  assert.equal(rowWasWritten(chiTietSheet, 1), false, 'ChiTietDNTT header must not be rewritten');
});

test('runConfirmPayment re-run after an interrupted commit does not duplicate data', () => {
  const { world, run } = setup();
  const draftNames = ['DNTT_GK_DN_CT_DRAFT', 'DNTT_GK_DN_112_DRAFT', 'DNTT_GK_DN_DRAFT'];
  const snapshot = draftNames.map(n => world.draft.getSheetByName(n).data.map(r => r.slice()));

  assert.match(run('runConfirmPayment_')(['A1'], '2026-09-26'), /^✅/);
  // Simulate a crash that happened before the draft clean-up: drafts still hold A1.
  draftNames.forEach((n, i) => { world.draft.getSheetByName(n).data = snapshot[i].map(r => r.slice()); });
  // Re-running also has to cope with ChiTietDNTT already being "Y".
  const msg = run('runConfirmPayment_')(['A1'], '2026-09-26');
  assert.match(msg, /^✅/, msg);

  assert.equal(idsIn(world.main.getSheetByName('DNTT_GK_DN_CT'), 1).filter(id => id === 'A1').length, 2);
  assert.equal(idsIn(world.main.getSheetByName('DNTT_GK_DN_112'), 0).filter(id => id === 'A1').length, 1);
  assert.equal(idsIn(world.main.getSheetByName('DNTT_GK_DN'), 0).filter(id => id === 'A1').length, 1);
  assert.equal(world.main.getSheetByName('ChiTietDNTT').rows().length - 1, 2);
  assert.equal(world.updateNh.getSheetByName('Update_NganHang_DN').rows().length - 1, 2);
  assert.deepEqual(idsIn(world.draft.getSheetByName('DNTT_GK_DN_CT_DRAFT'), 1), ['B2']);
});

test('re-run is also safe when ChiTietDNTT had to be compensated (report never printed)', () => {
  const { world, run } = setup();
  world.main.getSheetByName('ChiTietDNTT').data.length = 1;
  const draftNames = ['DNTT_GK_DN_CT_DRAFT', 'DNTT_GK_DN_112_DRAFT', 'DNTT_GK_DN_DRAFT'];
  const snapshot = draftNames.map(n => world.draft.getSheetByName(n).data.map(r => r.slice()));

  assert.match(run('runConfirmPayment_')(['A1'], '2026-09-26'), /^✅/);
  assert.equal(world.main.getSheetByName('ChiTietDNTT').rows().length - 1, 2);
  draftNames.forEach((n, i) => { world.draft.getSheetByName(n).data = snapshot[i].map(r => r.slice()); });
  assert.match(run('runConfirmPayment_')(['A1'], '2026-09-26'), /^✅/);

  assert.equal(world.main.getSheetByName('ChiTietDNTT').rows().length - 1, 2);
  assert.equal(world.updateNh.getSheetByName('Update_NganHang_DN').rows().length - 1, 2);
});

test('runConfirmPayment skips records that are not confirmed yet', () => {
  const { world, run } = setup();
  const msg = run('runConfirmPayment_')(['B2'], '2026-09-26');
  assert.match(msg, /Chưa "Xác Nhận"/);
  assert.equal(world.main.getSheetByName('DNTT_GK_DN_CT').rows().length, 1);
});

// Lượt tự làm mới cache đọc PhieuCan_DN TRƯỚC khi Duyệt nhưng ghi xong SAU
// khi Duyệt -> cache "chưa TT" còn phiếu vừa trả. Không được trả lần 2.
test('a weigh ticket already paid can never be paid again, even with a stale cache', () => {
  const world = buildWorld();
  const { run } = loadCode(world.options);
  run('refreshPhieuCanUnpaidCache_')();
  const cacheCu = world.draft.getSheetByName('PhieuCan_DN_CHUA_TT_DRAFT').data.map(r => r.slice());
  assert.match(run('runConfirmPayment_')(['A1'], '2026-09-26'), /^✅/);
  world.draft.getSheetByName('PhieuCan_DN_CHUA_TT_DRAFT').data = cacheCu;
  run('_invalidateChunkedCache_')('pc_unpaid_data_v1');

  const payload = { hoTenChuRung: 'Nguyen Van A', cccdChuRung: '012345678901', nguoiDeNghi: 'X', nguoiNhanTien: 'Nguyen Van A',
    soTKNhanTien: '0123', nganHang: 'BIDV', soHopDong: 'HD01', ngayDeNghi: '2026-09-26', danhSachPhieuCan: ['PC001'] };
  const tao = run('createNewPaymentRequest_')(payload);
  assert.equal(tao.success, false);
  assert.match(tao.message, /PC001.*ĐÃ ĐƯỢC THANH TOÁN.*A1/);

  const them = run('addPhieuCanToDraft_')('B2', 'PC002');
  assert.equal(them.success, false);
  assert.match(them.message, /PC002.*ĐÃ ĐƯỢC THANH TOÁN/);
});

test('approval skips a record that contains a ticket already paid in another record', () => {
  const world = buildWorld();
  const { run } = loadCode(world.options);
  assert.match(run('runConfirmPayment_')(['A1'], '2026-09-26'), /^✅/);
  // Hồ sơ B2 (tạo trước khi A1 được duyệt, dữ liệu cũ) lại chứa PC001 đã trả.
  const ct = world.draft.getSheetByName('DNTT_GK_DN_CT_DRAFT');
  ct.data.find(r => r[1] === 'B2')[11] = 'PC001';
  const h = world.draft.getSheetByName('DNTT_GK_DN_112_DRAFT');
  h.data.find(r => r[0] === 'B2')[23] = 'Đang ĐNTT';
  const truoc = world.main.getSheetByName('DNTT_GK_DN_CT').rows().slice(1).filter(r => r[11]).length;
  const msg = run('runConfirmPayment_')(['B2'], '2026-09-26');
  assert.match(msg, /^❌.*ĐÃ ĐƯỢC THANH TOÁN.*B2.*PC001/);
  assert.equal(world.main.getSheetByName('DNTT_GK_DN_CT').rows().slice(1).filter(r => r[11]).length, truoc, 'nothing was paid again');
});

test('approving reads Phiếu Cân once and the day summary equals a full recalculation', () => {
  const { world, run } = setup();
  const pcSheet = world.pc.getSheetByName('PhieuCan_DN');
  pcSheet.data.slice(1).forEach(r => { r[1] = new Date('2026-09-20T03:00:00Z'); r[13] = 'DL1'; r[14] = 'NG1'; });
  // Sổ Phiếu Cân cỡ thật hơn (vài trăm phiếu khác): đọc theo khóa phải rẻ hơn hẳn đọc cả sổ.
  for (let i = 0; i < 500; i++) { const r = new Array(28).fill(''); r[0] = 'X' + i; r[22] = 'X' + i; pcSheet.data.push(r); }
  // Khoản đã trả trước đó CÙNG ngày: phải có trong tổng thanh toán của ngày.
  const cu = new Array(22).fill(''); cu[0] = 'OLD-CT1'; cu[1] = 'OLD'; cu[11] = 'PC999'; cu[12] = 2; cu[16] = 3e6; cu[18] = 'Y'; cu[20] = new Date('2026-09-26T05:00:00Z');
  world.main.getSheetByName('DNTT_GK_DN_CT').data.push(cu);
  // Hồ sơ chưa từng In Báo Cáo ĐNTT: Duyệt tự tính bù ChiTietDNTT (cần Phiếu Cân).
  const chiTiet = world.main.getSheetByName('ChiTietDNTT'); chiTiet.data = [chiTiet.data[0]];
  run('_invalidatePcCache_')(); run('_invalidateCtSrc112Cache_')();

  let oPhieuCan = 0;
  const goc = pcSheet.getRange.bind(pcSheet);
  pcSheet.getRange = (...a) => { const r = goc(...a); const gv = r.getValues.bind(r); r.getValues = () => { const v = gv(); oPhieuCan += v.length * v[0].length; return v; }; return r; };
  assert.match(run('runConfirmPayment_')(['A1'], '2026-09-26'), /^✅/);
  const soDong = pcSheet.getLastRow() - 1;
  assert.ok(oPhieuCan < 2 * soDong * run('PC_COT_CAN_DOC.length'), `Phiếu Cân must not be read in full twice (${oPhieuCan} cells)`);

  const ngay = '2026-09-26';
  const sauDuyet = JSON.stringify(Array.from(run('_docPhanTichTheoKhoang_')(ngay, ngay), r => Array.from(r).slice(1)));
  run('_refreshPhanTichNhapTTChoDanhSachNgayNoLock_')([ngay]);
  const tinhLai = JSON.stringify(Array.from(run('_docPhanTichTheoKhoang_')(ngay, ngay), r => Array.from(r).slice(1)));
  assert.equal(sauDuyet, tinhLai);
  const tongTT = JSON.parse(sauDuyet).find(r => r[0] === 'THANHTOAN' && r[1] === 'TONG');
  assert.equal(tongTT[4], 2e6 + 3e6, 'A1 (2 phiếu) + the earlier payment of the same day');
});
