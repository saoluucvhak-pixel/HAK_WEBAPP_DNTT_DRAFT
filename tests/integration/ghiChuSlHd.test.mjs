import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Người dùng yêu cầu 03/10/2026: Ghi chú sổ 112 của MỌI hồ sơ mở đầu bằng "SL HĐ" (SL hợp đồng
// dự kiến - cột R), như "SL HĐ: 1.800,00 | Tổng KL: 1.691,11 | Đã trả: ... | Phiếu: 9877".
function world(slTheoHoSo) {
  const w = buildWorld();
  const h112 = w.draft.getSheetByName('DNTT_GK_DN_112_DRAFT');
  h112.data.slice(1).forEach(r => { if (slTheoHoSo[r[0]] !== undefined) r[17] = slTheoHoSo[r[0]]; });
  const code = loadCode(w.options);
  const ghiChu = () => Object.fromEntries(h112.rows(24).slice(1).map(r => [r[0], String(r[15])]));
  return { ...code, ghiChu };
}

test('every draft record note starts with the contract quantity (SL HĐ), then the usual items', () => {
  const { run, ghiChu } = world({ A1: 1800, B2: 444 });
  assert.match(String(run('runCreate112')()), /^✅/);
  const g = ghiChu();
  assert.match(g.A1, /^SL HĐ: 1\.800,00 \| Tổng KL: [\d.,]+ \| Đã trả: [\d.,]+ \| Còn lại: [\d.,]+ \| Đề nghị đợt này: [\d.,]+ \| Phiếu: /, g.A1);
  assert.match(g.B2, /^SL HĐ: 444,00 \| Tổng KL: /, g.B2);
});

test('a contract without a declared quantity still shows SL HĐ (0,00), so no row lacks it', () => {
  const { run, ghiChu } = world({ A1: '', B2: 0 });
  run('runCreate112')();
  Object.values(ghiChu()).forEach(g => assert.match(g, /^SL HĐ: 0,00 \| Tổng KL: /, g));
});

test('the payment proposal sheet prints SL HĐ first: 3 balanced lines of 2 items', () => {
  const { run } = world({ A1: 1800 });
  run('runCreate112')();
  const dong = String(run('_ghiChuBangDeXuat_')('SL HĐ: 1.800,00 | Tổng KL: 1.691,11 | Đã trả: 1.678,50 | Còn lại: 12,61 | Đề nghị đợt này: 12,61 | Phiếu: 9877'))
    .split('\n').map(s => s.trim().replace(/ /g, ' '));
  assert.deepEqual(dong, ['SL HĐ: 1.800,00 · Tổng KL: 1.691,11', 'Đã trả: 1.678,50 · Còn lại: 12,61', 'Đề nghị đợt này: 12,61 · Phiếu: 9877']);
});
