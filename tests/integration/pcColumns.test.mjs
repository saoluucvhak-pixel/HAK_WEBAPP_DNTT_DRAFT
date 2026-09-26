import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

const CODE = readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'Code.gs'), 'utf8');
// Cột PhieuCan_DN hệ thống không dùng: D, G, K, P, Q, S, U, V.
const KHONG_DUNG = [3, 6, 10, 15, 16, 18, 20, 21];

function world() {
  const w = buildWorld();
  const pc = w.pc.getSheetByName('PhieuCan_DN');
  pc.data.slice(1).forEach(r => {
    KHONG_DUNG.forEach(c => { r[c] = 'KHONG_DOC_' + c; });
    r[17] = 50000; r[19] = 1450000; r[2] = '06:30'; r[5] = '92C-12345';
  });
  const { run } = loadCode(w.options);
  const reads = [];
  const goc = pc.getRange.bind(pc);
  pc.getRange = (...a) => { if (typeof a[0] === 'number') reads.push(a); return goc(...a); };
  return { w, run, reads };
}

test('only the Phiếu Cân columns the system uses are read and kept', () => {
  const { run, reads } = world();
  const rows = run('_pcData_')();
  assert.equal(reads.length, 3, 'A:O, R:T, W:AB');
  reads.forEach(([, col, , n]) => {
    for (let c = col - 1; c < col - 1 + n; c++) assert.ok(![15, 16, 20, 21].includes(c), `column ${c} must not be read`);
  });
  rows.forEach(r => {
    assert.equal(r.length, 28);
    KHONG_DUNG.forEach(c => assert.equal(r[c], ''));
  });
  const pc001 = rows.find(r => r[22] === 'PC001');
  assert.deepEqual([pc001[11], pc001[17], pc001[19], pc001[25]], ['Nguyen Van A', 50000, 1450000, 1000000]);
});

test('reports and payment records never contain data from unused columns', () => {
  const { w, run } = world();
  run('refreshPhieuCanUnpaidCache_')();
  assert.match(run('runConfirmPayment_')(['A1'], '26/09/2026'), /^✅/);
  const tao = run('createNewPaymentRequest_')({ hoTenChuRung: 'Tran Thi B', cccdChuRung: '012345678901', nguoiDeNghi: 'X', nguoiNhanTien: 'Tran Thi B',
    soTKNhanTien: '0123', nganHang: 'BIDV', soHopDong: 'HD01', ngayDeNghi: '2026-09-26', danhSachPhieuCan: ['PC999'] });
  assert.equal(tao.success, true, tao.message);
  const all = [];
  for (const ss of [w.main, w.draft, w.updateNh]) for (const sh of ss.getSheets()) sh.data.forEach(r => r.forEach(v => all.push(String(v))));
  assert.ok(!all.some(v => v.includes('KHONG_DOC_')), 'unused column leaked into a sheet');
  const ctMoi = w.draft.getSheetByName('DNTT_GK_DN_CT_DRAFT').rows(22).find(r => r[11] === 'PC999');
  assert.deepEqual([ctMoi[13], ctMoi[14]], [1450000, 50000], 'ĐG_AD and Giảm giá still come from Phiếu Cân');
});

test('Phiếu Cân columns are never referenced by a bare number', () => {
  assert.doesNotMatch(CODE, /\b(pc|pcRow)\[\d+\]/);
  assert.doesNotMatch(CODE, /buildIndexMap\([^,]+, 22,/);
});
