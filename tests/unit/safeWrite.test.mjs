import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { MockSpreadsheet } from '../gas/mock.mjs';

function sheetWith(rows) {
  const ss = new MockSpreadsheet('MAIN_SS', 'File Chính');
  const sh = ss.addSheet('S', rows);
  const { run } = loadCode({ spreadsheets: [ss], properties: { MAIN_SS_ID: 'MAIN_SS' } });
  return { ss, sh, run };
}

test('_tenCotA1_ converts column numbers to A1 letters', () => {
  const { run } = sheetWith([]);
  const f = run('_tenCotA1_');
  assert.equal(f(1), 'A');
  assert.equal(f(26), 'Z');
  assert.equal(f(27), 'AA');
  assert.equal(f(28), 'AB');
  assert.equal(f(703), 'AAA');
});

test('_nhomDongLienTiep_ groups sorted unique rows into ranges', () => {
  const { run } = sheetWith([]);
  const groups = run('_nhomDongLienTiep_')([9, 2, 3, 4, 7, 3, 10]);
  assert.deepEqual(JSON.parse(JSON.stringify(groups)), [[2, 4], [7, 7], [9, 10]]);
});

test('_ghiCungGiaTri_ writes only the listed rows/columns', () => {
  const { sh, run } = sheetWith([['h1', 'h2', 'h3'], ['a', 'b', 'c'], ['d', 'e', 'f'], ['g', 'h', 'i']]);
  run('_ghiCungGiaTri_')(sh, [2, 4], 2, 3, 'X');
  assert.deepEqual(sh.rows(), [['h1', 'h2', 'h3'], ['a', 'X', 'X'], ['d', 'e', 'f'], ['g', 'X', 'X']]);
});

test('_ghiTheoDong_ writes per-row values in contiguous blocks', () => {
  const { sh, run } = sheetWith([['h'], ['1'], ['2'], ['3'], ['4']]);
  run('_ghiTheoDong_')(sh, [{ row: 2, values: ['A'] }, { row: 3, values: ['B'] }, { row: 5, values: ['D'] }], 1);
  assert.deepEqual(sh.rows().map(r => r[0]), ['h', 'A', 'B', '3', 'D']);
  assert.equal(sh.writes.filter(w => w.op === 'setValues').length, 2);
});

test('_thayVungDuLieu_ overwrites first then clears only the leftover tail', () => {
  const { sh, run } = sheetWith([['h', 'h'], ['1', 'a'], ['2', 'b'], ['3', 'c']]);
  run('_thayVungDuLieu_')(sh, 2, 2, 3, [['x9', 'z']]);
  assert.deepEqual(sh.rows(), [['h', 'h'], ['x9', 'z']]);
  assert.deepEqual(sh.writes.map(w => w.op), ['setValues', 'clearContent']);
  assert.equal(sh.writes[1].row, 3);
});

test('_thayVungDuLieu_ keeps leading zeros in the declared text columns', () => {
  const { sh, run } = sheetWith([['h', 'h'], ['a', 'b']]);
  run('_thayVungDuLieu_')(sh, 2, 2, 1, [['0123', '0456']], [0]);
  assert.deepEqual(sh.rows(), [['h', 'h'], ['0123', 456]]);
});

test('_chu_ adds exactly one apostrophe, _chuanHoaCCCD_ restores one lost leading zero', () => {
  const { run } = sheetWith([]);
  const chu = run('_chu_');
  assert.equal(chu('0123'), "'0123");
  assert.equal(chu("''0123"), "'0123");
  assert.equal(chu(123), "'123");
  assert.equal(chu(''), '');
  assert.equal(chu(undefined), '');
  const cccd = run('_chuanHoaCCCD_');
  assert.equal(cccd(48123456789), '048123456789');     // CCCD 12 số, mất 1 số 0
  assert.equal(cccd("'048123456789"), '048123456789');
  assert.equal(cccd(12345678), '012345678');           // CMND 9 số, mất 1 số 0
  assert.equal(cccd('201234567'), '201234567');
  assert.equal(cccd('12345'), '12345');                // độ dài lạ: không đoán
});

test('_saoLuuVaXoaDong_ backs up then deletes matching rows bottom-up', () => {
  const { ss, sh, run } = sheetWith([['id', 'v'], ['A', 1], ['B', 2], ['A', 3], ['C', 4], ['A', 5]]);
  const n = run('_saoLuuVaXoaDong_')(sh, r => r[0] === 'A', 'TEST');
  assert.equal(n, 3);
  assert.deepEqual(sh.rows().map(r => r[0]), ['id', 'B', 'C']);
  const backup = ss.getSheetByName('SYS_SaoLuuDongXoa').rows().slice(1);
  assert.deepEqual(backup.map(r => r[5]), [2, 4, 6]);
  assert.deepEqual(backup.map(r => JSON.parse(r[6])), [['A', 1], ['A', 3], ['A', 5]]);
});

test('_saoLuuVaXoaDong_ does not delete when the backup cannot be written', () => {
  const ss = new MockSpreadsheet('OTHER', 'x');
  const sh = ss.addSheet('S', [['id'], ['A']]);
  // No MAIN_SS_ID configured -> backup fails -> nothing may be deleted.
  const { run } = loadCode({ spreadsheets: [ss] });
  assert.throws(() => run('_saoLuuVaXoaDong_')(sh, () => true, 'TEST'));
  assert.deepEqual(sh.rows(), [['id'], ['A']]);
});

test('_ghiLaiMirror_ never leaves the sheet empty and trims leftovers', () => {
  const { sh, run } = sheetWith([['old1', 'old2', 'old3'], ['a', 'b', 'c'], ['d', 'e', 'f'], ['g', 'h', 'i']]);
  run('_ghiLaiMirror_')(sh, ['H1', 'H2'], [['x', 'y']]);
  assert.deepEqual(sh.rows(3), [['H1', 'H2', ''], ['x', 'y', '']]);
  assert.equal(sh.writes.some(w => w.op === 'clear'), false);
});

test('_giuDangChu_ only prefixes non-empty strings', () => {
  const { run } = sheetWith([]);
  const f = run('_giuDangChu_');
  assert.equal(f('0123'), "'0123");
  assert.equal(f("'0123"), "'0123");
  assert.equal(f(123), 123);
  assert.equal(f(''), '');
});
