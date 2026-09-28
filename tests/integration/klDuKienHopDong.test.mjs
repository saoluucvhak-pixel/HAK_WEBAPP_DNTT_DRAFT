import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Người dùng báo 28/09/2026: hợp đồng ông Bình tạo trên app Hợp Đồng hôm trước không có
// khối lượng dự kiến khi làm thanh toán. App Hợp Đồng ghi KL dự kiến vào các lô rừng
// (HD_RUNG), cột Z "SL_Dự kiến" của HD_NCC để 0.
function hdNcc(soHD, idHD, ten, slZ, tinhTrang = 'Đang thực hiện') {
  const r = new Array(31).fill('');
  r[2] = soHD; r[3] = new Date('2026-09-27T05:00:00Z'); r[4] = ten; r[6] = '049081006443';
  r[24] = 'Không'; r[25] = slZ; r[29] = idHD; r[30] = tinhTrang;
  return r;
}
function world({ coHdRung = true } = {}) {
  const w = buildWorld();
  w.hd.getSheetByName('HD_NCC').data.push(
    hdNcc('20260927001', '20260927001-20260927', 'NGUYỄN VĂN BÌNH', 0),     // tạo trên app Hợp Đồng: Z = 0
    hdNcc('293', '293-20251218', 'ĐẶNG NGỌC LỘC', 480),                    // hợp đồng cũ: Z có số, không có lô rừng
    hdNcc('20260801001', '20260801001-20260801', 'LÊ VĂN C', 999));        // có cả Z và lô rừng -> theo lô rừng như app Hợp Đồng
  if (coHdRung) {
    // Cột xếp khác thứ tự thật - tra theo tiêu đề.
    w.hd.addSheet('HD_RUNG', [['MaRung', 'KhoiLuongDuKien', 'SoHopDong', 'ID_KEY_HD'],
      ['HAK1', 300, '20260927001', '20260927001-20260927'],
      ['HAK2', '200', '20260927001', '20260927001-20260927'],
      ['HAK3', 120, '20260801001', '20260801001-20260801']]);
  }
  const code = loadCode(w.options);
  code.run('refreshHdNccCache_')();
  return { w, ...code };
}

test('expected volume of a contract made in the contract app = sum of its forest plots', () => {
  const { run } = world();
  assert.equal(run('getHopDongSummary_')('20260927001').slDuKien, 500, 'ông Bình: 300 + 200 tấn from HD_RUNG');
  assert.equal(run('getHopDongSummary_')('293').slDuKien, 480, 'old contract without plots keeps column Z');
  assert.equal(run('getHopDongSummary_')('20260801001').slDuKien, 120, 'plots first, like the contract app itself');
  // Báo cáo công nợ đọc HD_NCC gốc (không qua bản sao) - cùng quy tắc.
  const kl = run('_klDuKienTheoIdHD_')();
  const theoSo = Object.fromEntries(Array.from(run('_hdNccFullData_')(), r => [r[2], run('_slDuKienHopDong_')(r, kl)]));
  assert.deepEqual([theoSo['20260927001'], theoSo['293'], theoSo['20260801001']], [500, 480, 120], 'debt report uses the same rule');
});

test('without an HD_RUNG sheet, column Z is used as before', () => {
  const { run } = world({ coHdRung: false });
  assert.equal(run('getHopDongSummary_')('20260927001').slDuKien, 0);
  assert.equal(run('getHopDongSummary_')('293').slDuKien, 480);
});
