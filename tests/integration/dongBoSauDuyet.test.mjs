import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// 2026.9.60 (P0-01): Duyệt báo trung thực khi ghi ChiTietDNTT / Update_NganHang_DN (MISA) lỗi,
// lưu hồ sơ còn thiếu và cho "Đồng bộ bổ sung" chạy lại được. Mock: dữ liệu giả lập trong bộ nhớ,
// không phải bằng chứng Google Sheets thật đã ghi thành công.

const homNay = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const theGioi = () => { const w = buildWorld(); return { w, ...loadCode({ ...w.options, owner: 'owner@hak.test' }) }; };
const misa = w => w.updateNh.getSheetByName('Update_NganHang_DN');
const soDong = sh => sh.rows().length - 1;
/** Làm cho mọi lệnh ghi (setValues / setValue) vào sheet ném lỗi cho tới khi gọi hàm trả về. */
function hongGhi(sh) {
  const goc = sh.getRange;
  sh.getRange = function (...a) {
    const rg = goc.apply(this, a);
    rg.setValues = () => { throw new Error('Mất kết nối (giả lập)'); };
    rg.setValue = () => { throw new Error('Mất kết nối (giả lập)'); };
    return rg;
  };
  return () => { sh.getRange = goc; };
}

test('happy path: Duyệt says the MISA sync is complete only after re-reading both tables', () => {
  const { run, w } = theGioi();
  const kq = run('webConfirmPayment_')(['A1'], homNay());
  assert.equal(kq.success, true, kq.message);
  assert.equal(kq.trangThai, 'HOAN_TAT');
  assert.match(kq.message, /đã ghi đủ ChiTietDNTT \+ Update_NganHang_DN \(MISA\) - đã kiểm lại dữ liệu/);
  assert.equal(soDong(misa(w)), 2);
  assert.equal(run('getDongBoBoSung_')(), null);
});

test('MISA write fails: Duyệt reports "hoàn tất một phần", never claims MISA was written, and lists the record', () => {
  const { run, w } = theGioi();
  const sua = hongGhi(misa(w));
  const kq = run('webConfirmPayment_')(['A1'], homNay());
  sua();
  assert.equal(kq.success, true, 'the ledger IS committed - the list must reload');
  assert.equal(kq.trangThai, 'HOAN_TAT_MOT_PHAN');
  assert.equal(kq.thieuMisa, 2);
  assert.doesNotMatch(kq.message, /đã (tự động )?ghi (đủ )?.*Update_NganHang_DN/);
  assert.match(kq.message, /HOÀN TẤT MỘT PHẦN - CẦN ĐỒNG BỘ BỔ SUNG/);
  assert.match(kq.message, /KHÔNG Duyệt lại/);
  assert.equal(soDong(misa(w)), 0);
  assert.equal(soDong(w.main.getSheetByName('DNTT_GK_DN_112')), 1, 'ledger not rolled back');
  const dd = run('getDongBoBoSung_')();
  assert.deepEqual(Array.from(dd.ds[0].ids), ['A1']);
  assert.equal(dd.ds[0].trangThai, 'HOAN_TAT_MOT_PHAN');
  assert.equal(run('getDuyetDoDang_')(), null, 'not a half-done Duyệt - the ledger part finished');

  // Đồng bộ bổ sung: ghi nốt, kiểm lại, xóa khỏi danh sách; chạy lại không ghi trùng.
  const bs = run('webDongBoBoSungSauDuyet_')();
  assert.equal(bs.success, true, bs.message);
  assert.equal(soDong(misa(w)), 2);
  assert.equal(run('getDongBoBoSung_')(), null);
  assert.equal(run('webDongBoBoSungSauDuyet_')().success, true);
  assert.equal(soDong(misa(w)), 2, 'idempotent - no duplicate MISA rows');
  assert.equal(soDong(w.main.getSheetByName('ChiTietDNTT')), 2, 'idempotent - no duplicate ChiTietDNTT rows');
});

test('ChiTietDNTT write fails: partial status, then catch-up writes ChiTietDNTT AND MISA', () => {
  const { run, w } = theGioi();
  const ct = w.main.getSheetByName('ChiTietDNTT');
  ct.data.length = 1; // hồ sơ chưa từng In Báo Cáo ĐNTT -> phải tính bù (ghi thêm dòng)
  const sua = hongGhi(ct);
  const kq = run('webConfirmPayment_')(['A1'], homNay());
  sua();
  assert.equal(kq.trangThai, 'HOAN_TAT_MOT_PHAN', kq.message);
  assert.equal(kq.thieuChiTiet, 2);
  assert.match(kq.message, /ChiTietDNTT thiếu 2 phiếu/);
  assert.equal(soDong(misa(w)), 0, 'MISA is not written from ChiTietDNTT rows that do not exist');
  const bs = run('webDongBoBoSungSauDuyet_')();
  assert.equal(bs.success, true, bs.message);
  const rows = ct.rows(28).slice(1);
  assert.equal(rows.length, 2);
  rows.forEach(r => assert.equal(r[26], 'Y'));
  assert.equal(soDong(misa(w)), 2);
});

test('missing Update_NganHang_DN sheet is a failure, not a silent success', () => {
  const { run, w } = theGioi();
  const sh = misa(w);
  w.updateNh.sheets.delete('Update_NganHang_DN'); // sheet bị đổi tên / xóa
  const kq = run('webConfirmPayment_')(['A1'], homNay());
  w.updateNh.sheets.set('Update_NganHang_DN', sh);
  assert.notEqual(kq.trangThai, 'HOAN_TAT', kq.message);
  assert.ok(run('getDongBoBoSung_')());
});

test('a record reopened (Mở Đóng Thanh Toán) before the catch-up is dropped from the list, nothing is written for it', () => {
  const { run, w } = theGioi();
  const sua = hongGhi(misa(w));
  run('webConfirmPayment_')(['A1'], homNay());
  sua();
  // giả lập đã mở lại: hồ sơ không còn trong sổ 112 / CT đã chốt
  w.main.getSheetByName('DNTT_GK_DN_112').data.length = 1;
  w.main.getSheetByName('DNTT_GK_DN_CT').data.length = 1;
  const bs = run('webDongBoBoSungSauDuyet_')();
  assert.equal(bs.success, true, bs.message);
  assert.match(bs.message, /Bỏ khỏi danh sách/);
  assert.equal(soDong(misa(w)), 0);
  assert.equal(run('getDongBoBoSung_')(), null);
});

// Lỗi ở từng bước ghi TRƯỚC khi dọn Nháp: không báo ✅, dấu Lượt Duyệt dở còn lại, "Hoàn tất" làm
// nốt mà không ghi trùng sổ chính / MISA.
for (const [ten, laySheet] of [
  ['sổ CT', w => w.main.getSheetByName('DNTT_GK_DN_CT')],
  ['sổ 112', w => w.main.getSheetByName('DNTT_GK_DN_112')],
  ['đơn xin (DNTT_GK_DN)', w => w.main.getSheetByName('DNTT_GK_DN')],
  ['Phiếu Cân (khóa)', w => w.pc.getSheetByName('PhieuCan_DN')],
  ['dọn File Nháp', w => w.draft.getSheetByName('DNTT_GK_DN_CT_DRAFT')]
]) {
  test(`write failure at ${ten}: no success message, resumable without duplicates`, () => {
    const { run, w, env } = theGioi();
    const sua = hongGhi(laySheet(w));
    const kq = run('webConfirmPayment_')(['A1'], homNay());
    sua();
    assert.equal(kq.success, false, kq.message);
    assert.ok(env.PropertiesService.getScriptProperties().getProperty('DUYET_DO_DANG'), 'half-done marker kept');
    const lai = run('webConfirmPayment_')(['A1'], homNay()); // = "Hoàn tất lượt Duyệt"
    assert.equal(lai.success, true, lai.message);
    assert.equal(lai.trangThai, 'HOAN_TAT');
    assert.equal(soDong(w.main.getSheetByName('DNTT_GK_DN_CT')), 2, 'CT rows not duplicated');
    assert.equal(soDong(w.main.getSheetByName('DNTT_GK_DN_112')), 1, '112 row not duplicated');
    assert.equal(soDong(misa(w)), 2, 'MISA rows not duplicated');
    assert.equal(env.PropertiesService.getScriptProperties().getProperty('DUYET_DO_DANG'), null);
  });
}
