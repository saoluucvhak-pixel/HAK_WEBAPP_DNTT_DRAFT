import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Người dùng báo 28/09/2026: "Xuất Báo Cáo (đã chọn)" 30 hồ sơ chạy rất chậm, có lần quá 6 phút.
// Nguyên nhân: mỗi lần xuất đọc CẢ sổ CT và CẢ file Phiếu Cân. Nay chỉ đọc dòng cần.
const N = 3000;
const ngay = i => new Date(Date.UTC(2026, 0, 1, 3) + Math.floor(i / 10) * 86400000); // sổ ghi theo thời gian
function theGioi() {
  const w = buildWorld();
  const pc = w.pc.getSheetByName('PhieuCan_DN');
  const ct = w.main.getSheetByName('DNTT_GK_DN_CT');
  for (let i = 0; i < N; i++) {
    const p = new Array(28).fill(''); p[0] = 'S' + i; p[1] = ngay(i); p[9] = 12000; p[22] = 'S' + i; p[25] = 1000 + i; pc.data.push(p);
    const c = new Array(22).fill(''); c[0] = 'C' + i; c[1] = 'K' + Math.floor(i / 3); c[3] = 'Chu rung ' + i; c[11] = 'S' + i; c[16] = 1000 + i; c[19] = 'HD01'; c[20] = ngay(i); ct.data.push(c);
  }
  const ctx = loadCode(w.options);
  const doc = { pc: 0, ct: 0, lenh: 0 };
  [[pc, 'pc'], [ct, 'ct']].forEach(([sh, k]) => {
    const goc = sh.getRange.bind(sh);
    sh.getRange = (...a) => {
      const r = goc(...a); const gv = r.getValues.bind(r);
      r.getValues = () => { const v = gv(); doc[k] += v.length * (v[0] ? v[0].length : 0); doc.lenh++; return v; };
      return r;
    };
  });
  return { ...ctx, doc };
}

test('report detail of selected records reads only their ledger rows and weigh tickets', () => {
  const { run, doc } = theGioi();
  const kq = Array.from(run('_gomChiTietChuyenKhoan_')([{ idHeThong: 'K500', soLan: 1 }, { idHeThong: 'K900', soLan: 2 }]));
  assert.deepEqual(kq.map(x => x.data[2]), ["'S1500", "'S1501", "'S1502", "'S2700", "'S2701", "'S2702"]);
  assert.deepEqual(kq.map(x => x.data[21]), [2500, 2501, 2502, 3700, 3701, 3702], 'amount from the matching weigh ticket');
  assert.ok(doc.ct < 2 * N, `ledger: ${doc.ct} cells read (whole ledger = ${22 * N})`);
  assert.ok(doc.pc < 2 * N, `weigh tickets: ${doc.pc} cells read (whole file = ${28 * N})`);
});

test('MISA by payment date reads only the rows in the date range, same rows as a full scan', () => {
  const { run, doc } = theGioi();
  const kq = Array.from(run('_ctTheoNgayCK_')('2026-03-01', '2026-03-05'));
  const mong = [];
  for (let i = 0; i < N; i++) { const iso = new Date(ngay(i).getTime() + 7 * 3600e3).toISOString().slice(0, 10); if (iso >= '2026-03-01' && iso <= '2026-03-05') mong.push('C' + i); }
  assert.deepEqual(kq.map(r => r[0]), mong);
  assert.ok(doc.ct < 2 * N, `${doc.ct} cells read`);
});

test('scattered matches never cost more than a bounded number of reads', () => {
  const { run, doc } = theGioi();
  const ids = Array.from({ length: 200 }, (_, k) => 'K' + k * 5);
  const kq = Array.from(run('_ctDongCuaHoSo_')(ids.map(idHeThong => ({ idHeThong }))));
  assert.equal(kq.length, 600);
  assert.ok(doc.lenh <= 1 + run('DOC_THEO_KHOA.TOI_DA_LENH'), `${doc.lenh} reads`);
});
