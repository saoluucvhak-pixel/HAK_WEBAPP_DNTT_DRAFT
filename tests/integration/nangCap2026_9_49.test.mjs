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
  assert.ok((js.match(/await xacNhan\(/g) || []).length >= 24);
  [/maGo: 'MO DONG'/, /maGo: String\(nam\)/, /maGo: 'MA MOI'/, /maGo: riskLevel === 'danger' \? 'XOA'/].forEach(re => assert.match(js, re));
  assert.match(INDEX, /<div class="modal-bg" id="hop-xac-nhan"><div class="modal" role="alertdialog"/);
  assert.match(js, /\(o \|\| \(tc\.nguyHiem \? huy : ok\)\)\.focus\(\);/, 'dangerous: focus starts on Cancel');
});
