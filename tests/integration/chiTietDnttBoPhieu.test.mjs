import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// 2026.9.54 - Bảo Trì báo "ChiTietDNTT: dòng N nhưng hồ sơ không còn trong File Nháp" (hồ sơ
// 1 phiếu cân 96c36b58 / 10034). Dòng N ghi lúc In Báo Cáo ĐNTT; Bỏ phiếu cân không dọn theo:
//  - bỏ phiếu CUỐI: hồ sơ biến khỏi Nháp nhưng dòng N (và đơn xin, ChiTietUNC) ở lại -> mồ côi;
//  - bỏ 1 phiếu (còn phiếu khác): dòng N của phiếu đó ở lại, lúc Duyệt thành Y như đã trả.
// Fixture: A1 = PC001 + PC002 (có sẵn dòng N cả 2 phiếu), B2 = PC003.
const homNay = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
function theGioi() {
  const w = buildWorld();
  const code = loadCode({ ...w.options, owner: 'owner@hak.test' });
  const chiTiet = () => w.main.getSheetByName('ChiTietDNTT').rows(28).slice(1)
    .map(r => `${r[0]}|${String(r[2]).replace(/^'/, '')}|${r[26]}`).sort();
  const srcNhap = () => w.draft.getSheetByName('DNTT_GK_DN_DRAFT').rows(18).slice(1).map(r => r[0]);
  const misa = () => w.updateNh.getSheetByName('Update_NganHang_DN').rows(33).slice(1).map(r => String(r[4]).replace(/^'/, '')).sort();
  return { w, ...code, chiTiet, srcNhap, misa };
}

test('removing the last ticket of a printed record cleans its ChiTietDNTT rows, request row and UNC history', () => {
  const t = theGioi();
  // Trình tự thật: Xác nhận -> In Báo Cáo ĐNTT (dòng N) -> Tạo UNC -> Về Chờ xác nhận -> Bỏ phiếu cân.
  t.run('runCreate112')();
  t.run('runXacNhanDNTT_')(['B2']);
  const inBc = t.run('exportBaoCaoDNTTFromDraft_')(['B2']);
  assert.equal(inBc.success, true, inBc.message);
  assert.ok(t.chiTiet().includes('B2|PC003|N'));
  assert.equal(t.run('webCreateUNCFromDraft_')(['B2'], homNay()).success, true);
  t.run('runHuyXacNhanDNTT_')('B2', true);
  const kq = t.run('removePhieuCanFromDraft_')('B2-CT1');
  assert.equal(kq.success, true, kq.message);
  assert.equal(kq.recordRemoved, true);
  assert.ok(!t.chiTiet().some(k => k.startsWith('B2|')), 'no ChiTietDNTT row left for B2');
  assert.ok(!t.srcNhap().includes('B2'), 'the request row is removed like "Xóa hồ sơ"');
  const uncB2 = (t.w.main.getSheetByName('ChiTietUNC') || { rows: () => [] }).rows(18).slice(1).filter(r => r[0] === 'B2');
  assert.equal(uncB2.length, 0, 'UNC history of the removed record');
  const baoTri = t.run('getKiemTraDoiChieuBaoTri_')();
  assert.equal(baoTri.chiTietDnttNMoCoi.total, 0, 'Bảo Trì: nothing orphaned');
  assert.ok(Array.from(t.run('getDanhSachSaoLuuXoa_')()).some(g => g.hanhDong === 'XOA_PHIEU_NHAP'), 'removed rows are restorable');
});

test('removing one of two tickets removes only that ticket\'s N row', () => {
  const t = theGioi();
  t.run('runHuyXacNhanDNTT_')('A1');
  assert.equal(t.run('removePhieuCanFromDraft_')('A1-CT2').success, true); // PC002
  assert.deepEqual(t.chiTiet().filter(k => k.startsWith('A1|')), ['A1|PC001|N']);
});

test('approval turns only the tickets still in the record into Y: a stale N row is dropped, not paid in MISA', () => {
  const t = theGioi();
  // Dữ liệu do bản cũ để lại: PC002 đã bỏ khỏi hồ sơ nhưng dòng N vẫn còn.
  const ct = t.w.draft.getSheetByName('DNTT_GK_DN_CT_DRAFT');
  ct.data = ct.data.filter(r => r[0] !== 'A1-CT2');
  t.run('runHuyXacNhanDNTT_')('A1');
  t.run('runCreate112')();
  t.run('runXacNhanDNTT_')(['A1']);
  assert.ok(t.chiTiet().includes('A1|PC002|N'));
  assert.match(t.run('runConfirmPayment_')(['A1'], homNay()), /^✅/);
  assert.deepEqual(t.chiTiet().filter(k => k.startsWith('A1|')), ['A1|PC001|Y']);
  assert.deepEqual(t.misa(), ['PC001'], 'the removed ticket is not written to MISA as paid');
});

test('a ticket without an N row (added after printing) still gets its Y row at approval', () => {
  const t = theGioi();
  const sh = t.w.main.getSheetByName('ChiTietDNTT');
  sh.data = sh.data.filter(r => !(r[0] === 'A1' && String(r[2]).includes('PC002'))); // PC002 thêm sau khi In
  assert.match(t.run('runConfirmPayment_')(['A1'], homNay()), /^✅/);
  assert.deepEqual(t.chiTiet().filter(k => k.startsWith('A1|')), ['A1|PC001|Y', 'A1|PC002|Y']);
  assert.deepEqual(t.misa(), ['PC001', 'PC002']);
});
