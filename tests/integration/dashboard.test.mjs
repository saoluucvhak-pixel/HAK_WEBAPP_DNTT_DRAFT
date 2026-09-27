import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Trang chủ lấy "tháng này" từ PhanTichNhapTT_DRAFT (trigger 15h), không quét PhieuCan_DN mỗi lần mở.
function world() {
  const w = buildWorld();
  const now = new Date();
  const thangTruoc = new Date(now.getTime() - 40 * 86400000);
  const pc = w.pc.getSheetByName('PhieuCan_DN');
  pc.data = [pc.data[0]];
  const pcRow = (so, ngay, kg, tien, dl, ng) => { const r = new Array(28).fill(''); r[0] = so; r[1] = ngay; r[9] = kg; r[11] = 'KH'; r[13] = dl; r[14] = ng; r[22] = so; r[25] = tien; return r; };
  pc.data.push(pcRow('T1', now, 10000, 15e6, 'DT', 'ĐL'), pcRow('T2', now, 5000, 8e6, 'QT', 'ĐL'),
    pcRow('T3', now, 2000, 3e6, 'DT', 'PS'), pcRow('CU', thangTruoc, 99000, 99e6, 'DT', 'ĐL'));
  const ct = w.main.getSheetByName('DNTT_GK_DN_CT');
  const ctRow = (so, ngay, tan, tien) => { const r = new Array(22).fill(''); r[1] = 'X'; r[3] = 'KH'; r[11] = so; r[12] = tan; r[16] = tien; r[20] = ngay; return r; };
  ct.data.push(ctRow('T1', now, 10, 15e6), ctRow('CU', thangTruoc, 99, 99e6));
  const { run } = loadCode(w.options);
  return { w, run };
}

test('month figures on the home page match purchases and payments of this month', () => {
  const { run } = world();
  const s = run('getDashboardStats_')();
  assert.deepEqual([s.klMuaThangKg, s.tienMuaThang, s.klThanhToanThangTan, s.tienThanhToanThang], [17000, 26e6, 10, 15e6]);
  const theo = rows => Object.fromEntries(Array.from(rows, r => [r.ten, [r.klKg, r.tien]]));
  assert.deepEqual(theo(s.muaTheoDaiLy), { DT: [12000, 18e6], QT: [5000, 8e6] });
  assert.equal(s.muaTheoDaiLy[0].ten, 'DT', 'sorted by weight');
  assert.equal(Array.from(s.muaTheoNguonGoc).reduce((a, r) => a + r.klKg, 0), 17000);
});

test('once the summary sheet covers the month, opening the home page does not read PhieuCan_DN', () => {
  const { w, run } = world();
  run('getDashboardStats_')(); // lần đầu: tính bù các ngày chưa có
  run('_invalidatePcCache_')();
  const sh = w.pc.getSheetByName('PhieuCan_DN');
  let doc = 0;
  const goc = sh.getRange.bind(sh);
  sh.getRange = (...a) => { doc++; return goc(...a); };
  const s = run('getDashboardStats_')();
  assert.equal(doc, 0, 'PhieuCan_DN must not be read');
  assert.equal(s.klMuaThangKg, 17000);
});

test('the home page debt figures come from the stored summary, not a fresh debt calculation', () => {
  const { w, run } = world();
  const r = run('_defaultCongNoRange_')();
  const live = Array.from(run('_computeDebtByCustomerLive_')(r.fDate, r.tDate)).filter(x => x.congNo > 0);
  const s1 = run('getDashboardStats_')(); // lần đầu: chưa có bản tổng hợp -> tính 1 lần
  assert.equal(s1.tongNoGoKeo, live.reduce((a, x) => a + x.congNo, 0));
  assert.ok(s1.congNoCapNhatLuc, 'shows when the figures were computed');

  // Sau khi Duyệt (xóa snapshot) hoặc có người xem Công nợ khoảng khác: Trang chủ vẫn không tính lại.
  run('_invalidateCongNoCache_')();
  run('getDebtByCustomer_')('2020-01-01', '2020-02-01');
  run('_invalidatePcCache_')(); run('_invalidateCtSrc112Cache_')();
  let doc = 0;
  [w.pc.getSheetByName('PhieuCan_DN'), w.main.getSheetByName('DNTT_GK_DN_CT'), w.main.getSheetByName('DNTT_GK_DN')].forEach(sh => {
    const goc = sh.getRange.bind(sh); sh.getRange = (...a) => { doc++; return goc(...a); };
  });
  const s2 = run('getDashboardStats_')();
  assert.equal(doc, 0, 'PhieuCan_DN and the payment books are not read');
  assert.equal(s2.tongNoGoKeo, s1.tongNoGoKeo);

  // Nút "Cập nhật ngay" tính lại khoảng mặc định.
  assert.match(run('webRunCongNoRefreshNow_')(), /^✅/);
  assert.ok(doc > 0);
});
