import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// 2026.9.60 - P1-02 và các sửa nhỏ khác. Test có ghi "(9.59: hỏng)" thất bại trên 2026.9.59.
const theGioi = () => { const w = buildWorld(); return { w, ...loadCode({ ...w.options, owner: 'owner@hak.test' }) }; };

test('P1-02 (9.59: hỏng): admin alert e-mails reach fixed admins AND active admins added in the UI, never locked ones, no duplicates', () => {
  const { run, w, env } = theGioi();
  w.main.addSheet('SYS_NguoiDung', [['Email', 'Họ tên', 'Vai trò', 'Trạng thái', 'x', 'y'],
    ['admin.moi@hak.test', 'A', 'ADMIN', 'Hoạt động', '', ''],
    ['Admin.Khoa@hak.test', 'B', 'ADMIN', 'Khóa', '', ''],
    ['ketoan@hak.test', 'C', 'KE_TOAN', 'Hoạt động', '', ''],
    ['SAOLUUCVHAK@gmail.com', 'D', 'ADMIN', 'Hoạt động', '', '']]); // trùng Quản trị cố định
  assert.equal(run('_guiEmailQuanTri_')('Tiêu đề', 'Nội dung'), 3);
  const nhan = env.MailApp.daGui.at(-1).to.split(',').sort();
  assert.deepEqual(nhan, ['admin.moi@hak.test', 'phuthuy.apple@gmail.com', 'saoluucvhak@gmail.com']);
});

test('P1-02: a mail failure is logged, not thrown', () => {
  const { run, env } = theGioi();
  env.MailApp.sendEmail = () => { throw new Error('quota'); };
  assert.equal(run('_guiEmailQuanTri_')('t', 'n'), 0);
});

// Mục V.5.3: Đối soát toàn vẹn thanh toán (chỉ đọc) theo mã D01-D20.
const homNay = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const maCua = kq => kq.rows.map(x => x.ma);

test('Đối soát: a clean approval reports no BLOCK and lists the codes it does not check yet', () => {
  const { run } = theGioi();
  assert.match(run('runConfirmPayment_')(['A1'], homNay()), /^✅/);
  const kq = run('getDoiSoatToanVenThanhToan_')();
  assert.equal(kq.success, true, kq.message);
  assert.equal(kq.rows.filter(x => x.mucDo === 'BLOCK').length, 0, JSON.stringify(kq.rows));
  assert.ok(!maCua(kq).includes('D09') && !maCua(kq).includes('D10'), JSON.stringify(kq.rows));
  assert.equal(kq.tongQuan.soPhieu, 2);
  assert.equal(kq.tongQuan.tongTien, 2000000);
  assert.equal(kq.dsMa.length, 20);
  assert.ok(kq.dsMa.find(x => x.ma === 'D20').chuaKiem, 'unchecked codes are flagged, not reported as clean');
});

test('Đối soát: missing MISA (D10), duplicate MISA row (D11), pending catch-up (D15) and a draft left behind (D14) are reported', () => {
  const { run, w } = theGioi();
  const misa = w.updateNh.getSheetByName('Update_NganHang_DN');
  const goc = misa.getRange;
  misa.getRange = function (...a) { const rg = goc.apply(this, a); rg.setValues = () => { throw new Error('x'); }; return rg; };
  run('webConfirmPayment_')(['A1'], homNay());
  misa.getRange = goc;
  const dong = new Array(33).fill(''); dong[4] = 'PC777';
  misa.data.push(dong.slice(), dong.slice());
  w.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').data.push(w.main.getSheetByName('DNTT_GK_DN_112').data[1].concat(['Đang ĐNTT']));
  const kq = run('getDoiSoatToanVenThanhToan_')();
  const ma = maCua(kq);
  ['D10', 'D11', 'D14', 'D15'].forEach(m => assert.ok(ma.includes(m), m + ' in ' + ma.join(',')));
  assert.equal(kq.tongQuan.soHoSoThieuMisa, 1);
  assert.ok(kq.rows.filter(x => ['D10', 'D11', 'D14', 'D15'].includes(x.ma)).every(x => x.mucDo === 'WARNING'), 'new report-only checks never BLOCK');
});

test('Đối soát: gate codes keep their approved level (amount mismatch BLOCK, wrong owner WARNING)', () => {
  const { run, w } = theGioi();
  assert.match(run('runConfirmPayment_')(['A1'], homNay()), /^✅/);
  w.main.getSheetByName('DNTT_GK_DN_112').data[1][6] = 999; // 112 lệch CT
  run('_invalidateCtSrc112Cache_')();
  const kq = run('getDoiSoatToanVenThanhToan_')();
  const d06 = kq.rows.find(x => x.ma === 'D06');
  assert.ok(d06, JSON.stringify(kq.rows));
  assert.equal(d06.mucDo, 'BLOCK');
  assert.equal(kq.tongQuan.soHoSoLechTien, 1);
  assert.equal(run('DOI_SOAT_TU_MA_GATE.WRONG_OWNER'), 'D03');
  assert.ok(run('TOAN_VEN.CHI_CANH_BAO').includes('WRONG_OWNER'));
});
