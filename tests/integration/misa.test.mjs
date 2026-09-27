import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Xuất MISA theo ngày: file nhập được vào MISA như bản cũ (33 cột, tiêu đề của
// Update_NganHang_DN, giữ số 0 đầu) + sheet tóm tắt 9 cột.
const D = s => new Date(s + 'T05:00:00Z');
function world() {
  const w = buildWorld();
  const nh = w.updateNh.getSheetByName('Update_NganHang_DN');
  nh.data[0] = Array.from({ length: 33 }, (_, i) => 'MISA cột ' + (i + 1));
  const dong = (so, ngay, tien) => { const r = new Array(33).fill(''); r[2] = ngay; r[3] = ngay; r[4] = so; r[5] = '0011001234567'; r[8] = 'Thanh toán phiếu cân ' + so;
    r[9] = '048000000111'; r[10] = 'Nguyen Van A'; r[12] = '0123456789'; r[13] = 'BIDV'; r[14] = 'Nguyen Van A'; r[22] = '33111'; r[23] = '1121'; r[24] = tien; r[32] = '0012/HĐ'; return r; };
  nh.data.push(dong('PC001', '05/09/2026', 1e6), dong('PC002', '20/10/2026', 2e6));
  const ct = w.main.getSheetByName('DNTT_GK_DN_CT');
  const ctRow = (so, ngay) => { const r = new Array(22).fill(''); r[1] = 'K'; r[11] = so; r[20] = D(ngay); return r; };
  ct.data.push(ctRow('PC001', '2026-09-05'), ctRow('PC002', '2026-10-20'));
  return { w, ...loadCode(w.options) };
}

test('the MISA export is the 33-column MISA import layout, filtered by payment date, plus a summary sheet', () => {
  const { run, env } = world();
  const kq = run('exportMisaTheoNgayExcel_')('2026-09-01', '2026-09-30');
  assert.equal(kq.success, true, kq.message);
  assert.equal(kq.count, 1);
  const ss = env.SpreadsheetApp.openById(/\/d\/([^/]+)/.exec(kq.url)[1]);
  assert.match(ss.getName(), /^XUAT MISA/);
  const [misa, tomTat] = ss.getSheets();
  assert.equal(misa.getName(), 'XuatMISA');
  const rows = misa.rows(33);
  assert.equal(rows[0][0], 'MISA cột 1', 'header copied from Update_NganHang_DN');
  assert.equal(rows[0].length, 33);
  assert.equal(rows.length, 2, 'only the September payment');
  const r = rows[1];
  assert.deepEqual([r[4], r[5], r[9], r[12], r[32], r[22], r[23], r[24]], ['PC001', '0011001234567', '048000000111', '0123456789', '0012/HĐ', 33111, 1121, 1e6]);
  assert.equal(tomTat.getName(), 'TomTat');
  assert.deepEqual(tomTat.rows(9)[1].slice(0, 2), ['05/09/2026', 'PC001']);
  // Màn hình Báo Cáo MISA vẫn ra đúng dòng như file xuất.
  assert.deepEqual(Array.from(run('getMisaDataTheoNgay_')('2026-09-01', '2026-09-30').items, x => x.soPhieuCan), ['PC001']);
});
