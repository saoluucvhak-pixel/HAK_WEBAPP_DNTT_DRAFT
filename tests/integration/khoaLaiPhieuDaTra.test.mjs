import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// 2026.9.57 - kiểm tra đêm 06/10/2026 báo 7 phiếu "đã thanh toán nhưng chưa khóa" (6859, 6982, 7031,
// 7081, 7140, 7187, 7363/2026/NK): Duyệt 30/07 17:04 đã chốt (sổ CT có đủ), nhưng ô khóa của Phiếu
// Cân còn "Đã Lập ĐNTT" / "N" - Duyệt bản cũ ghi đè CẢ sheet Phiếu Cân cùng lúc công cụ khác ghi.
// Bảo Trì liệt kê và cho Khóa lại (chỉ phiếu thật sự đã chốt), có nhật ký trước -> sau.
const INDEX = readFileSync(new URL('../../Index.html', import.meta.url), 'utf8');
function theGioi() {
  const w = buildWorld();
  const code = loadCode({ ...w.options, owner: 'owner@hak.test' });
  assert.match(code.run('runConfirmPayment_')(['A1'], '2026-07-30'), /^✅/);
  const pc = w.pc.getSheetByName('PhieuCan_DN');
  const dongPc = so => pc.data.find(r => r[22] === so);
  const r = dongPc('PC001'); r[26] = 'Đã Lập ĐNTT'; r[27] = 'N'; // ô khóa bị ghi đè sau Duyệt
  const nhatKy = ma => w.main.getSheetByName('NhatKyThaoTac').rows().filter(x => x[2] === ma);
  return { w, ...code, dongPc, nhatKy };
}

test('maintenance and the nightly check list a paid ticket whose lock was overwritten', () => {
  const t = theGioi();
  const bt = t.run('getKiemTraDoiChieuBaoTri_')();
  assert.equal(bt.phieuDaTraChuaKhoa.total, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(bt.phieuDaTraChuaKhoa.items[0])), { soPhieuCan: 'PC001', idHeThong: 'A1', idDntt: 'Đã Lập ĐNTT', chonTT: 'N' });
  const dem = t.run('_kiemTraToanVenThucHien_')();
  const muc = dem.muc.find(m => /chưa khóa/.test(m.ten));
  assert.ok(muc && muc.so === 1 && muc.chiTiet === 'PC001', JSON.stringify(dem.muc));
});

test('"Khóa lại" locks only tickets still in the closed ledger, logs before -> after', () => {
  const t = theGioi();
  const kq = t.run('webKhoaLaiPhieuDaTra_')([{ soPhieuCan: 'PC001' }, { soPhieuCan: 'PC003' }]); // PC003 chưa thanh toán (hồ sơ Nháp B2)
  assert.equal(kq.success, true, kq.message);
  assert.equal(kq.count, 1);
  assert.deepEqual([t.dongPc('PC001')[24], t.dongPc('PC001')[26], t.dongPc('PC001')[27]], ['OK', 'Đóng TT', 'Y']);
  assert.deepEqual([t.dongPc('PC003')[26], t.dongPc('PC003')[27]], ['', ''], 'an unpaid ticket is never locked');
  const [log] = t.nhatKy('KHOA_LAI_PHIEU_DA_TRA');
  assert.equal(log[3], 'A1');
  assert.match(log[4], /PC001 \(hồ sơ A1\): "Đã Lập ĐNTT" \/ "N" → "Đóng TT" \/ "Y"/);
  assert.equal(t.run('getKiemTraDoiChieuBaoTri_')().phieuDaTraChuaKhoa.total, 0);
  assert.equal(t.run('webKhoaLaiPhieuDaTra_')([{ soPhieuCan: 'PC001' }]).count, 0, 'running again changes nothing');
});

test('only system / admin roles can lock; the maintenance screen offers the action', () => {
  const t = theGioi();
  assert.equal(t.run('API_ROUTES').webKhoaLaiPhieuDaTra.quyen, 'HE_THONG');
  assert.match(INDEX, /'phieuDaTraChuaKhoa', \[\{key:'soPhieuCan'/);
  assert.match(INDEX, /\{fnName:'webKhoaLaiPhieuDaTra', riskLevel:'khoa'\}/);
  assert.match(INDEX, /🔒 Khóa Lại Các Phiếu Đã Chọn/);
});
