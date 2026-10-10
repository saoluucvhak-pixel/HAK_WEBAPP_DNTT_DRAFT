import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld, pcRow } from '../gas/fixtures.mjs';

// 2026.9.55 - Payment Data Integrity Gate (rà soát toàn vẹn 03/10/2026).
// Gốc lỗi đã dựng lại được trên bản 2026.9.54:
//  C1 Thêm phiếu đặt ID_CT = số dòng + 1 -> bỏ 1 phiếu rồi thêm ra mã trùng (f94f41a3-2), Bỏ 1 dòng
//     trùng mã xóa cả 2; Duyệt vẫn chốt.
//  C2 Đơn xin (-> DNTT_GK_DN) chỉ ghi DS phiếu / KL lúc Tạo mới: phiếu đã chuyển hồ sơ khác vẫn nằm
//     trong đơn xin (a0e8c1c2, lệch đúng KL 2 phiếu), phiếu Thêm sau không có (9636702c).
// Mã hồ sơ thật chỉ dùng làm tên ca test, không có trong code chạy thật.

const homNay = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
function phieu(so, kg, tien) { const r = pcRow(so, 'Nguyen Van A'); r[9] = kg; r[25] = tien; return r; }
function theGioi(them = []) {
  const w = buildWorld();
  w.pc.getSheetByName('PhieuCan_DN').data.push(
    phieu('PC004', 16720, 16720000), phieu('PC005', 14610, 14610000), phieu('PC006', 13600, 13600000),
    phieu('PC007', 11390, 11390000), phieu('PC008', 5000, 5000000), ...them);
  const code = loadCode({ ...w.options, owner: 'owner@hak.test' });
  const sh = n => w.draft.getSheetByName(n);
  const ct = () => sh('DNTT_GK_DN_CT_DRAFT');
  const ctCua = id => ct().data.slice(1).filter(r => r[1] === id);
  const src = id => sh('DNTT_GK_DN_DRAFT').data.slice(1).find(r => r[0] === id);
  const r112 = id => sh('DNTT_GK_DN_112_DRAFT').data.slice(1).find(r => r[0] === id);
  const tao = ds => {
    const kq = code.run('createNewPaymentRequest_')({ hoTenChuRung: 'Nguyen Van A', cccdChuRung: '012345678901', nguoiDeNghi: 'A', nguoiNhanTien: 'Nguyen Van A', soTKNhanTien: '0123456789', nganHang: 'BIDV', soHopDong: 'HD01', ngayDeNghi: homNay(), danhSachPhieuCan: ds });
    assert.equal(kq.success, true, kq.message);
    return kq.idKey;
  };
  const kiem = (ids, tc = {}) => code.run('_kiemTraToanVenHoSo_')(ids, code.run('_nguonToanVen_')(Object.assign({ ctThat: code.run('_ctThatDataCache_')(), chuSoHuu: true, phieuCan: true }, tc), ids)).ketQua;
  const ma = (id, tc) => Array.from(kiem([id], tc).get(id).errors, e => e.ma); // mảng tạo trong vm khác realm
  const duyet = id => { code.run('runXacNhanDNTT_')([id], true); return code.run('runConfirmPayment_')([id], homNay()); };
  const soChinh = (n, cot) => w.main.getSheetByName(n).data.slice(1).map(r => r[cot]);
  return { w, ...code, ct, ctCua, src, r112, tao, kiem, ma, duyet, soChinh };
}

test('Case 1 / 12 - consistent record passes every gate and approves unchanged', () => {
  const t = theGioi();
  const id = t.tao(['PC004', 'PC005']);
  const k = t.kiem([id]).get(id);
  assert.equal(k.ok, true, JSON.stringify(k.errors));
  assert.equal(k.kgSource, 31330); assert.equal(k.kgDntt, 31330); assert.equal(k.kgCt, 31330);
  assert.equal(k.amountCt, 31330000); assert.equal(k.amount112, 31330000);
  assert.match(t.duyet(id), /^✅/);
  assert.equal(t.soChinh('DNTT_GK_DN_CT', 1).filter(x => x === id).length, 2);
});

test('Case 2 - request lists a ticket the CT does not have -> MISSING_CT, approval blocked', () => {
  const t = theGioi();
  const id = t.tao(['PC004', 'PC005']);
  t.ct().data = t.ct().data.filter(r => !(r[1] === id && String(r[11]).includes('PC005'))); // như sửa tay / bản cũ
  t.run('_tuTinhLaiSauThayDoi_'); // không gọi: giữ đơn xin cũ
  const r = t.r112(id); r[6] = 16720000; r[23] = 'Đang ĐNTT';
  assert.ok(t.ma(id).includes('MISSING_CT'));
  const msg = t.run('runConfirmPayment_')([id], homNay());
  assert.match(msg, /MISSING_CT/); assert.match(msg, /thiếu: PC005/);
  assert.equal(t.soChinh('DNTT_GK_DN_CT', 1).filter(x => x === id).length, 0, 'nothing written');
});

test('Case 3 / regression 9636702c - CT has a ticket the request does not list -> ORPHAN_CT; new Add keeps them in step', () => {
  const t = theGioi();
  const id = t.tao(['PC006']);
  // Bản cũ: Thêm phiếu không cập nhật đơn xin -> đơn xin 13.600 kg, CT thêm dòng 11.390 kg.
  const dong = t.ctCua(id)[0].slice(); dong[0] = id + '-2'; dong[10] = 2; dong[11] = "'PC007"; dong[12] = 11.39; dong[16] = 11390000;
  t.ct().data.push(dong);
  assert.ok(t.ma(id).includes('ORPHAN_CT'));
  // Bản mới: Thêm phiếu -> đơn xin tự cập nhật.
  t.ct().data = t.ct().data.filter(r => r !== dong);
  assert.equal(t.run('addPhieuCanToDraft_')(id, 'PC007').success, true);
  assert.equal(String(t.src(id)[10]).replace(/^'/, ''), 'PC006, PC007');
  assert.equal(t.src(id)[9], 24990);
  assert.equal(t.kiem([id]).get(id).ok, true);
});

test('Case 4 - one ticket in two records -> DUPLICATE_TICKET for both', () => {
  const t = theGioi();
  const a = t.tao(['PC004']), b = t.tao(['PC005']);
  const dong = t.ctCua(b)[0].slice(); dong[0] = b + '-9'; dong[11] = "'PC004"; t.ct().data.push(dong); // sửa tay File Nháp
  assert.ok(t.ma(a).includes('DUPLICATE_TICKET'));
  assert.ok(t.ma(b).includes('DUPLICATE_TICKET'));
});

test('Case 5 / regression a0e8c1c2 - request still lists tickets now owned by another record -> WRONG_OWNER warning (not a block), KG gap explained', () => {
  const t = theGioi();
  const a = t.tao(['PC004', 'PC005', 'PC008']);
  // Bản cũ: bỏ PC004, PC005 khỏi A (đơn xin không đổi), rồi lập hồ sơ B với 2 phiếu đó.
  t.ct().data = t.ct().data.filter(r => !(r[1] === a && /PC00[45]/.test(r[11])));
  const b = t.tao(['PC004', 'PC005']);
  // Lập B tự tính lại -> bản mới tự sửa đơn xin Nháp của A theo CT (có nhật ký DONG_BO_DON_XIN):
  assert.equal(String(t.src(a)[10]).replace(/^'/, ''), 'PC008');
  assert.ok(t.w.main.getSheetByName('NhatKyThaoTac').data.some(r => r.join('|').includes('DONG_BO_DON_XIN')));
  // Dữ liệu cũ chưa được tính lại (hoặc đơn xin đã chốt ở sổ chính) vẫn mang DS phiếu cũ:
  t.src(a)[10] = "'PC004, PC005, PC008"; t.src(a)[9] = 36330;
  const k = t.kiem([a]).get(a);
  // Người dùng 03/10/2026: "sai chủ chỉ cảnh báo, KG chặn".
  assert.deepEqual(Array.from(k.warnings, w => w.ma).filter(m => m !== 'SL_HD_CHUA_KHAI'), ['WRONG_OWNER'], JSON.stringify(k.errors));
  assert.equal(k.ok, true, 'no blocking error: the moved tickets are explained, KG matches after removing them');
  assert.match(k.warnings[0].thongDiep, /đơn xin ghi thừa 31\.330 kg/);
  assert.deepEqual(Array.from(k.wrongOwnerTickets), [`PC004 (thuộc hồ sơ ${b})`, `PC005 (thuộc hồ sơ ${b})`]);
  assert.equal(k.kgDntt - k.kgCt, 16720 + 14610, 'gap = the two moved tickets (31.330 kg)');
  const r = t.r112(a); r[6] = 5000000; r[23] = 'Đang ĐNTT';
  const msg = t.run('runConfirmPayment_')([a], homNay());
  assert.match(msg, /^✅/, msg); assert.match(msg, /Cảnh báo.*\n.*WRONG_OWNER/); assert.match(msg, new RegExp(`PC004 \\(thuộc hồ sơ ${b}\\)`));
  assert.ok(t.w.main.getSheetByName('NhatKyThaoTac').data.some(r => r.join('|').includes('CANH_BAO_TOAN_VEN')));
  // Bản mới: Bỏ phiếu cập nhật đơn xin nên không phát sinh lệch.
  const c = t.tao(['PC006', 'PC007']);
  assert.equal(t.run('removePhieuCanFromDraft_')(c + '-1', 'PC006').success, true);
  assert.equal(String(t.src(c)[10]).replace(/^'/, ''), 'PC007');
  assert.equal(t.kiem([c]).get(c).ok, true);
});

test('Case 6 / regression f94f41a3 - duplicate ID_CT is blocked; Add never reuses a code; Remove deletes exactly one row', () => {
  const t = theGioi();
  const id = t.tao(['PC004', 'PC005']);
  assert.equal(t.run('removePhieuCanFromDraft_')(id + '-1', 'PC004').success, true);
  assert.equal(t.run('addPhieuCanToDraft_')(id, 'PC006').success, true);
  assert.deepEqual(t.ctCua(id).map(r => r[0]).sort(), [id + '-2', id + '-3'], 'new code -3, not a second -2');
  // Dữ liệu cũ có mã trùng: Duyệt chặn, Bỏ phiếu chỉ xóa đúng 1 dòng.
  t.ctCua(id).find(r => r[0] === id + '-3')[0] = id + '-2';
  assert.ok(t.ma(id).includes('DUPLICATE_ID_CT'));
  assert.match(t.run('runXacNhanDNTT_')([id], true).message, /ID_CT trùng: .*-2/);
  t.r112(id)[23] = 'Đang ĐNTT'; // đã Xác nhận từ trước khi nâng cấp
  assert.match(t.run('runConfirmPayment_')([id], homNay()), /ID_CT trùng: .*-2/);
  t.r112(id)[23] = ''; // Về Chờ xác nhận để sửa
  assert.equal(t.run('removePhieuCanFromDraft_')(id + '-2').success, false, 'ambiguous without the ticket number');
  assert.equal(t.run('removePhieuCanFromDraft_')(id + '-2', 'PC006').success, true);
  assert.deepEqual(t.ctCua(id).map(r => String(r[11]).replace(/^'/, '')), ['PC005'], 'the other ticket stays');
});

test('Case 7 - same tickets, different KG -> KG_MISMATCH', () => {
  const t = theGioi();
  const id = t.tao(['PC004', 'PC005']);
  t.src(id)[9] = 30000;
  const k = t.kiem([id]).get(id);
  assert.deepEqual(Array.from(k.errors, e => e.ma), ['KG_MISMATCH']);
  assert.match(k.errors[0].thongDiep, /đơn xin 30\.000 kg, CT 31\.330 kg/);
});

test('Case 8 - KG right but CT money differs from 112 -> AMOUNT_MISMATCH (1đ float tolerance only)', () => {
  const t = theGioi();
  const id = t.tao(['PC004']);
  t.r112(id)[6] = 16720000 + 1000;
  assert.deepEqual(t.ma(id), ['AMOUNT_MISMATCH']);
  t.r112(id)[6] = 16720000 + 0.4;
  assert.deepEqual(t.ma(id), [], 'sub-đồng float noise is not a mismatch');
});

test('Case 9 - double click on Duyệt writes once', () => {
  const t = theGioi();
  const id = t.tao(['PC004', 'PC005']);
  assert.match(t.duyet(id), /^✅/);
  assert.match(t.run('runConfirmPayment_')([id], homNay()), /Không có hồ sơ nào đủ điều kiện|Không tìm thấy/);
  assert.equal(t.soChinh('DNTT_GK_DN_CT', 1).filter(x => x === id).length, 2);
  assert.equal(t.soChinh('DNTT_GK_DN_112', 0).filter(x => x === id).length, 1);
});

test('Case 10 - a second Duyệt while the first holds the lock is refused and writes nothing', () => {
  const t = theGioi();
  const id = t.tao(['PC004']);
  t.run('runXacNhanDNTT_')([id], true);
  const lock = t.env.LockService.getScriptLock();
  lock.waitLock = function () { if (this.held) throw new Error('timeout'); this.held++; };
  const ct = t.w.main.getSheetByName('DNTT_GK_DN_CT');
  const goc = ct.getRange.bind(ct);
  let lan2 = null;
  ct.getRange = (...a) => { const r = goc(...a); const sv = r.setValues.bind(r); r.setValues = v => { if (lan2 === null) lan2 = t.run('runConfirmPayment_')([id], homNay()); return sv(v); }; return r; };
  assert.match(t.run('runConfirmPayment_')([id], homNay()), /^✅/);
  assert.match(lan2, /bận/);
  assert.equal(t.soChinh('DNTT_GK_DN_CT', 1).filter(x => x === id).length, 1);
});

test('Case 11 - CT written but 112 write fails: record is not silently complete, re-run finishes without duplicates', () => {
  const t = theGioi();
  const id = t.tao(['PC004', 'PC005']);
  t.run('runXacNhanDNTT_')([id], true);
  const h112 = t.w.main.getSheetByName('DNTT_GK_DN_112');
  const goc = h112.getRange.bind(h112);
  h112.getRange = (...a) => { const r = goc(...a); r.setValues = () => { throw new Error('Service error'); }; return r; };
  const loi = t.run('runConfirmPayment_')([id], homNay());
  assert.match(loi, /^❌/);
  assert.equal(t.ctCua(id).length, 2, 'draft kept - nothing deleted');
  assert.match(t.env.PropertiesService.getScriptProperties().getProperty('DUYET_DO_DANG') || '', new RegExp(id), 'interrupted approval is flagged');
  h112.getRange = goc;
  assert.match(t.run('runConfirmPayment_')([id], homNay()), /^✅/);
  assert.equal(t.soChinh('DNTT_GK_DN_CT', 1).filter(x => x === id).length, 2, 'CT not duplicated');
  assert.equal(t.soChinh('DNTT_GK_DN_112', 0).filter(x => x === id).length, 1);
});

test('price / weight changed on Phiếu Cân after the record was made: warned in the list, blocked, Tính lại picks it up', () => {
  const t = theGioi();
  const a = t.tao(['PC004']), b = t.tao(['PC005']);
  t.run('runXacNhanDNTT_')([b], true);
  const pc = t.w.pc.getSheetByName('PhieuCan_DN').data;
  pc.find(r => r[22] === 'PC004')[25] = 17000000;
  pc.find(r => r[22] === 'PC005')[25] = 15000000;
  t.run('_invalidatePcCache_')();
  const ds = Array.from(t.run('getDanhSachNhapCoKiemTra_')());
  assert.deepEqual(Array.from(ds.find(r => r.idKey === a).canhBaoToanVen, c => c.ma), ['PRICE_CHANGED']);
  assert.match(ds.find(r => r.idKey === a).canhBaoToanVen[0].thongDiep, /PC004 \(thành tiền 16\.720\.000 → 17\.000\.000 đ\)/);
  const xn = t.run('runXacNhanDNTT_')([a], true);
  assert.equal(xn.success, false); assert.match(xn.message, /PRICE_CHANGED/);
  assert.match(t.run('runConfirmPayment_')([b], homNay()), /PRICE_CHANGED/);
  const tl = t.run('runCreate112')();
  assert.match(tl, /cập nhật giá .* 1 phiếu/); assert.match(tl, new RegExp(`đã Xác nhận ${b}`));
  assert.equal(t.ctCua(a)[0][16], 17000000); assert.equal(t.r112(a)[6], 17000000, 'Số tiền recalculated');
  assert.equal(t.ctCua(b)[0][16], 14610000, 'confirmed record not changed silently');
  assert.equal(t.run('runXacNhanDNTT_')([a], true).success, true);
});

test('creating a record with the same ticket twice is refused', () => {
  const t = theGioi();
  const kq = t.run('createNewPaymentRequest_')({ hoTenChuRung: 'Nguyen Van A', cccdChuRung: '012345678901', nguoiDeNghi: 'A', nguoiNhanTien: 'Nguyen Van A', soTKNhanTien: '0123456789', nganHang: 'BIDV', soHopDong: 'HD01', ngayDeNghi: homNay(), danhSachPhieuCan: ['PC004', 'pc004'] });
  assert.equal(kq.success, false); assert.match(kq.message, /chọn 2 lần/);
});

test('UNC and the printed report are gated too; a blocked step is logged with codes, tickets and gaps', () => {
  const t = theGioi();
  const id = t.tao(['PC004', 'PC005']);
  t.run('runXacNhanDNTT_')([id], true);
  t.src(id)[9] = 1;
  assert.match(t.run('webCreateUNCFromDraft_')([id], homNay()).message, /KG_MISMATCH/);
  assert.match(t.run('exportBaoCaoDNTTFromDraft_')([id]).message, /KG_MISMATCH/);
  const log = t.w.main.getSheetByName('NhatKyThaoTac').data.map(r => r.join('|')).filter(x => x.includes('CHAN_TOAN_VEN'));
  assert.ok(log.length >= 2);
  assert.match(log[0], /KG_MISMATCH .*KG Phiếu Cân 31330 \/ đơn xin 1 \/ CT 31330/);
});

test('ledger health check: read only, reports duplicate ID_CT, ticket in two records, wrong owner, partial commit', () => {
  const t = theGioi();
  const ct = t.w.main.getSheetByName('DNTT_GK_DN_CT'), src = t.w.main.getSheetByName('DNTT_GK_DN'), h112 = t.w.main.getSheetByName('DNTT_GK_DN_112');
  const dong = (idCt, id, so, kg) => { const r = new Array(22).fill(''); r[0] = idCt; r[1] = id; r[11] = "'" + so; r[12] = kg / 1000; r[16] = kg * 1000; r[18] = 'Y'; return r; };
  const don = (id, ds, kg) => { const r = new Array(18).fill(''); r[0] = id; r[9] = kg; r[10] = ds; r[17] = 'Y'; return r; };
  const s112 = (id, tien) => { const r = new Array(23).fill(''); r[0] = id; r[6] = tien; r[20] = 'Y'; return r; };
  ct.data.push(dong('X1-1', 'X1', 'PC9674', 16720), dong('X1-1', 'X1', 'PC9713', 14610), dong('X2-1', 'X2', 'PC9674', 16720), dong('X3-1', 'X3', 'PC1', 1000));
  src.data.push(don('X1', 'PC9674, PC9713', 31330), don('X2', 'PC9674', 16720), don('X4', 'PC2', 1000), don('X3', 'PC1, PC9713', 15610));
  h112.data.push(s112('X1', 31330000), s112('X2', 16720000), s112('X4', 1000000), s112('X3', 1000000));
  t.run('_invalidateCtSrc112Cache_')();
  const truoc = JSON.stringify([ct.data, src.data, h112.data]);
  const kq = t.run('getBaoCaoToanVen_')();
  assert.equal(kq.success, true);
  const ma = Array.from(kq.rows).map(r => `${r.ma}:${r.phieu || r.idKey}`);
  ['DUPLICATE_ID_CT:X1', 'DUPLICATE_TICKET:PC9674', 'WRONG_OWNER:PC9713', 'PARTIAL_COMMIT:X4'].forEach(x => assert.ok(ma.includes(x), x + ' in ' + ma.join(', ')));
  assert.equal(JSON.stringify([ct.data, src.data, h112.data]), truoc, 'health check never writes');
  const bt = t.run('getKiemTraDoiChieuBaoTri_')();
  assert.ok(bt.trungIdCtPhieu.total >= 2 && bt.donXinLechPhieu.total >= 1 && bt.chotDoDang.total >= 1);
});

test('contract quantity: paid KL (incl. closed years) + KL proposed in the draft may not exceed SL HĐ -> VUOT_SL_HD; only an admin may go on', () => {
  const keToan = t => t.run('_coQuyenHienTai_ = q => q !== QUYEN.QUAN_TRI'); // đăng nhập là Kế toán
  const quanTri = t => t.run('_coQuyenHienTai_ = q => true');
  const t = theGioi();
  // Đã thanh toán trước 20 tấn của HD01 (sổ CT đang mở).
  const cu = new Array(22).fill(''); cu[0] = 'CU-1'; cu[1] = 'CU'; cu[11] = "'PCCU"; cu[12] = 20; cu[16] = 20000000; cu[18] = 'Y'; cu[19] = "'HD01";
  t.w.main.getSheetByName('DNTT_GK_DN_CT').data.push(cu);
  t.run('_invalidateCtSrc112Cache_')();
  const a = t.tao(['PC004']), b = t.tao(['PC005']); // Nháp HD01: A1 + B2 có sẵn (3 tấn) + 16,72 + 14,61 = 34,33 tấn
  [a, b].forEach(id => { t.r112(id)[17] = 50; });     // SL HĐ 50 tấn: 20 + 34,33 = 54,33 > 50

  keToan(t);
  const k = t.kiem([a]).get(a);
  assert.deepEqual(Array.from(k.errors, e => e.ma), ['VUOT_SL_HD']);
  assert.match(k.errors[0].thongDiep, /SL HĐ 50,000 tấn; đã thanh toán 20,000 \+ đang đề nghị ở Nháp 34,330 \(hồ sơ .*\) = 54,330 tấn - vượt 4,330 tấn/);
  assert.match(k.errors[0].thongDiep, /chỉ Quản trị mới duyệt được/);
  const xn = t.run('runXacNhanDNTT_')([a], true);
  assert.equal(xn.success, false); assert.match(xn.message, /VUOT_SL_HD/);
  t.r112(a)[23] = 'Đang ĐNTT';
  assert.match(t.run('runConfirmPayment_')([a], homNay()), /VUOT_SL_HD/);
  assert.equal(t.soChinh('DNTT_GK_DN_CT', 1).filter(x => x === a).length, 0);

  // Quản trị: chỉ cảnh báo, được duyệt, có nhật ký.
  quanTri(t);
  const kqt = t.kiem([a]).get(a);
  assert.equal(kqt.ok, true); assert.ok(Array.from(kqt.warnings, w => w.ma).includes('VUOT_SL_HD'));
  const duyet = t.run('runConfirmPayment_')([a], homNay());
  assert.match(duyet, /^✅/); assert.match(duyet, /Quản trị được phép duyệt vượt/);
  assert.ok(t.w.main.getSheetByName('NhatKyThaoTac').data.some(r => r.join('|').includes('QUAN_TRI_VUOT_SL_HD')));

  // Hợp đồng chưa khai báo SL: chỉ cảnh báo, không chặn.
  keToan(t);
  const c = t.tao(['PC006']); t.r112(c)[17] = 0;
  const kc = t.kiem([c]).get(c);
  assert.equal(kc.ok, true); assert.deepEqual(Array.from(kc.warnings, w => w.ma), ['SL_HD_CHUA_KHAI']);

  // Năm đã khóa sổ (file DATA2025) cũng tính vào "đã thanh toán".
  const t2 = theGioi();
  const dong2025 = new Array(22).fill(''); dong2025[1] = 'CU25'; dong2025[12] = 40; dong2025[18] = 'Y'; dong2025[19] = "'HD01";
  t2.run(`_docLuuTruTrongKhoang_ = ten => ten === CFG.DNTT_CT ? ${JSON.stringify([dong2025])} : []`);
  keToan(t2);
  const d = t2.tao(['PC008']); t2.r112(d)[17] = 45; // 40 (2025 đã khóa sổ) + 3 + 5 = 48 > 45
  const kd = t2.kiem([d]).get(d);
  assert.deepEqual(Array.from(kd.errors, e => e.ma), ['VUOT_SL_HD']);
  assert.match(kd.errors[0].thongDiep, /đã thanh toán 40,000/);
});
