import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Nhóm 1 báo cáo rà soát 28/09/2026 (B-11 … B-16), người dùng yêu cầu làm - v2026.9.46.
const homNay = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
function theGioi() {
  const w = buildWorld();
  const ctx = loadCode(w.options);
  const nhatKy = hanhDong => w.main.getSheetByName('NhatKyThaoTac').rows(5).slice(1).filter(r => r[2] === hanhDong);
  return { ...ctx, w, nhatKy };
}
/** A1 đã Duyệt (sổ chính + ChiTietDNTT + MISA) - để thử Mở Đóng TT. */
function daChot() {
  const t = theGioi();
  assert.match(t.run('runConfirmPayment_')(['A1'], '2026-09-26'), /^✅/);
  return t;
}

// ---------- B-11: mã hồ sơ mới không trùng hồ sơ nào, kể cả sổ năm đã khóa ----------
test('a new record id never reuses an id from the draft, the open ledger or a closed year', () => {
  const { run, env } = theGioi();
  const data = env.SpreadsheetApp.create('DATA2025');
  data.insertSheet('DNTT_GK_DN').data = [['ID_KEY'], ['deadbeef']];
  env.PropertiesService.getScriptProperties().setProperty('LUU_TRU_NAM', JSON.stringify({ 2025: data.getId() }));
  const hangDoi = ['A1', 'B2', 'OLD1', 'deadbeef', 'c0ffee00'];
  env.Utilities.getUuid = () => (hangDoi.shift() || 'ffffffff') + '-0000-4000-8000-000000000000';
  assert.equal(run('_maHoSoMoi_')(), 'c0ffee00', 'skips draft A1/B2, ledger OLD1 and archived deadbeef');
});

test('reopening a payment gets a fresh id through the same check', () => {
  const { run, env } = daChot();
  const hangDoi = ['B2', 'abcd1234'];
  env.Utilities.getUuid = () => (hangDoi.shift() || 'ffffffff') + '-0000-4000-8000-000000000000';
  const kq = run('webMoDongThanhToanTheoHoSo_')('Nguyen Van A', '2026-09-26', '1');
  assert.equal(kq.success, true, kq.message);
  assert.ok(run('getDraftListSummary_')().some(h => h.idKey === 'abcd1234'), 'B2 (already in draft) was not reused');
});

// ---------- B-12: Mở Đóng TT báo rõ khi dọn bảng con lỗi ----------
test('reopening reports (and logs) a child-table clean-up failure instead of "0 rows"', () => {
  const { run, w, nhatKy } = daChot();
  const sh = w.main.getSheetByName('ChiTietUNC') || w.main.addSheet('ChiTietUNC', [Array(18).fill('h')]);
  sh.getLastRow = () => { throw new Error('mat ket noi'); };
  const kq = run('webMoDongThanhToanTheoHoSo_')('Nguyen Van A', '2026-09-26', '1');
  assert.equal(kq.success, true, 'the record is back in the draft');
  assert.equal(kq.canhBao, true);
  assert.match(kq.message, /^⚠️/);
  assert.match(kq.message, /Không dọn được: ChiTietUNC: .*mat ket noi.*Bảo Trì/);
  assert.equal(nhatKy('LOI_DON_DEP_KHI_MO_DONG').length, 1);
});

// ---------- B-13: báo cáo không nuốt lỗi đọc sổ ----------
test('debt reports stop with a clear message when the ledger cannot be read (no silently inflated debt)', () => {
  const { run } = daChot();
  run(`() => { _ctGopLuuTru_ = () => { throw new Error('quota'); }; }`)();
  assert.throws(() => run('_computeDebtByContractLive_')('2026-01-01', homNay()), /Không đọc được sổ CT đã chốt \(Công nợ hợp đồng\): quota/);
  assert.throws(() => run('getPaymentAnalysis_')('2026-09-01', homNay()), /Không đọc được sổ CT đã chốt/);
});

test('the home page says which part is missing instead of showing 0', () => {
  const { run } = theGioi();
  run(`() => { _congNoTrangChu_ = () => { throw new Error('het han'); }; }`)();
  const s = run('getDashboardStats_')();
  assert.equal(s.tongNoGoKeo, 0);
  assert.ok(s.canhBao.some(x => /Công nợ: .*het han/.test(x)), JSON.stringify(s.canhBao));
});

// ---------- B-14: Về "Chờ ĐNTT" khi hồ sơ đã có UNC ----------
test('moving a record with a UNC back to "Chờ ĐNTT" needs an explicit confirmation and is logged', () => {
  const { run, w, nhatKy } = theGioi();
  w.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').data[1][16] = new Date();
  assert.equal(run('webCreateUNCFromDraft_')(['A1'], homNay(), '', '').success, true);
  const trangThai = () => w.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').rows(24).find(r => r[0] === 'A1')[23];
  const truoc = trangThai();

  const hoi = run('runHuyXacNhanDNTT_')('A1');
  assert.equal(hoi.success, false);
  assert.equal(hoi.canXacNhanUnc, true);
  assert.match(hoi.message, /ĐÃ CÓ UNC .*STK 0123456789/);
  assert.equal(trangThai(), truoc, 'nothing changed until confirmed');

  assert.equal(run('runHuyXacNhanDNTT_')('A1', true).success, true);
  assert.equal(trangThai(), '');
  assert.match(nhatKy('HUY_XAC_NHAN_DNTT')[0][4], /đã có UNC - người dùng xác nhận vẫn hủy: UNC tạo/);

  // Đổi STK rồi tạo UNC lần 2 -> cảnh báo riêng về tài khoản khác UNC cũ.
  assert.equal(run('updateDraft112Info_')('A1', { stk: '0123' }).success, true);
  run('runXacNhanDNTT_')(['A1']);
  const lan2 = run('webCreateUNCFromDraft_')(['A1'], homNay(), '', '');
  assert.equal(lan2.success, true, lan2.message);
  assert.match(lan2.canhBaoTrung, /A1\) có SỐ TÀI KHOẢN KHÁC UNC cũ/);
});

test('records without a UNC go back to "Chờ ĐNTT" in one step as before', () => {
  const { run } = theGioi();
  assert.equal(run('runHuyXacNhanDNTT_')('A1').success, true);
});

// ---------- B-15: vượt giới hạn xem thì giữ các dòng mới nhất ----------
test('when the payment detail exceeds the view limit, the newest payment dates are kept', () => {
  const { run, w } = theGioi();
  const sh = w.main.getSheetByName('ChiTietDNTT');
  sh.data = [sh.data[0]];
  ['2026-09-01', '2026-09-20', '2026-09-10'].forEach((d, i) => {
    const r = Array(28).fill(''); r[0] = 'X' + i; r[2] = 'P' + i; r[3] = new Date(d + 'T03:00:00Z'); r[21] = 1; r[26] = 'Y';
    sh.data.push(r);
  });
  const kq = run('_docChiTietDNTTDaChot_')('2026-09-01', '2026-09-30', 2);
  assert.equal(kq.total, 3);
  assert.equal(kq.truncated, true);
  assert.deepEqual(Array.from(kq.items, x => x.soPhieuCan), ['P1', 'P2'], 'newest first: 20/09, 10/09 (01/09 dropped)');
});

// ---------- B-16: Ghi chú 112 theo Vùng xuất ----------
test('the 112 note formats numbers by the export region (VN 1.234,00), not US style', () => {
  const { run, w } = theGioi();
  assert.match(run('runCreate112')(), /^✅/);
  const ghiChu = String(w.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').rows(24).find(r => r[0] === 'A1')[15]);
  assert.match(ghiChu, /Đề nghị đợt này: [\d.]+,\d{2} /, ghiChu);
  run('webSetExportRegion_')('US');
  run('runCreate112')();
  assert.match(String(w.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').rows(24).find(r => r[0] === 'A1')[15]), /Đề nghị đợt này: [\d,]+\.\d{2} /);
});
