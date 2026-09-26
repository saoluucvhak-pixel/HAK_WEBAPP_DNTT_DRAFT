import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld, rowWasWritten } from '../gas/fixtures.mjs';

function committedWorld() {
  const world = buildWorld();
  const { run } = loadCode(world.options);
  const msg = run('runConfirmPayment')(['A1'], '26/09/2026');
  assert.match(msg, /^✅/, msg);
  Object.values(world).forEach(ss => ss && ss.sheets && ss.sheets.forEach(sh => { sh.writes = []; }));
  return { world, run };
}

const ids = (sheet, col) => sheet.rows().slice(1).map(r => String(r[col]).trim());

test('webMoDongThanhToanTheoHoSo moves the record back to draft, backs up every deleted row', () => {
  const { world, run } = committedWorld();
  const res = run('webMoDongThanhToanTheoHoSo')('Nguyen Van A', '2026-09-26', '1');
  assert.equal(res.success, true, res.message);

  assert.deepEqual(ids(world.main.getSheetByName('DNTT_GK_DN_CT'), 1), []);
  assert.deepEqual(ids(world.main.getSheetByName('DNTT_GK_DN_112'), 0), []);
  assert.deepEqual(ids(world.main.getSheetByName('DNTT_GK_DN'), 0), ['OLD1']);
  assert.equal(world.main.getSheetByName('ChiTietDNTT').rows().length, 1);
  assert.equal(world.updateNh.getSheetByName('Update_NganHang_DN').rows().length, 1);

  const backup = world.main.getSheetByName('SYS_SaoLuuDongXoa').rows().slice(1);
  // 2 CT + 1 Src + 1 112 + 2 ChiTietDNTT + 2 MISA
  assert.equal(backup.length, 8);
  backup.forEach(r => { assert.equal(r[2], 'MO_DONG_THANH_TOAN'); assert.ok(JSON.parse(r[6]).length > 0); });

  const draftCt = world.draft.getSheetByName('DNTT_GK_DN_CT_DRAFT').rows(22).slice(1);
  const newIds = new Set(draftCt.filter(r => r[1] !== 'B2').map(r => r[1]));
  assert.equal(newIds.size, 1);
  assert.equal(draftCt.filter(r => r[1] !== 'B2').length, 2);

  const pc = world.pc.getSheetByName('PhieuCan_DN').rows(28);
  const bySo = Object.fromEntries(pc.slice(1).map(r => [r[22], r]));
  ['PC001', 'PC002'].forEach(so => {
    assert.equal(bySo[so][24], 'Test giá');
    assert.equal(bySo[so][26], '');
    assert.equal(bySo[so][27], '');
  });
  const pcSheet = world.pc.getSheetByName('PhieuCan_DN');
  assert.equal(rowWasWritten(pcSheet, 3), false, 'unrelated PC999 must not be touched');
  assert.equal(rowWasWritten(pcSheet, 1), false, 'header must not be touched');
});

test('webXoaCTMoCoi backs up the row before deleting and deletes by ID only', () => {
  const { world, run } = committedWorld();
  const ctSheet = world.main.getSheetByName('DNTT_GK_DN_CT');
  const target = ctSheet.rows(22)[1][0];
  const res = run('webXoaCTMoCoi')([{ idCT: target }]);
  assert.equal(res.success, true, res.message);
  assert.equal(res.count, 1);
  assert.equal(ids(ctSheet, 0).includes(target), false);
  assert.equal(ids(ctSheet, 0).length, 1);
  const backup = world.main.getSheetByName('SYS_SaoLuuDongXoa').rows().slice(1);
  assert.equal(backup.length, 1);
  assert.equal(JSON.parse(backup[0][6])[0], target);
});

test('webXoaMoCoiChiTietDNTT backs up through the shared delete path', () => {
  const { world, run } = committedWorld();
  const res = run('webXoaMoCoiChiTietDNTT')([{ idHeThong: 'A1', soPhieuCan: 'PC001' }]);
  assert.equal(res.success, true, res.message);
  assert.equal(res.count, 1);
  assert.equal(world.main.getSheetByName('ChiTietDNTT').rows().length - 1, 1);
  assert.equal(world.main.getSheetByName('SYS_SaoLuuDongXoa').rows().length - 1, 1);
});

test('webDongBoTenKhachHang only writes the selected customer cells', () => {
  const { world, run } = committedWorld();
  const pcSheet = world.pc.getSheetByName('PhieuCan_DN');
  const res = run('webDongBoTenKhachHang')([{ soPhieuCan: 'PC003', chuRungCT: 'Tran Thi B (moi)' }]);
  assert.equal(res.success, true, res.message);
  assert.equal(pcSheet.rows(28)[4][11], 'Tran Thi B (moi)');
  assert.equal(pcSheet.rows(28)[2][11], '=HYPERLINK("x")');
  assert.equal(rowWasWritten(pcSheet, 3), false);
  assert.equal(rowWasWritten(pcSheet, 2), false);
  const log = world.main.getSheetByName('NhatKyThaoTac').rows().slice(1).map(r => r[4]).join('\n');
  assert.match(log, /PC003: "Tran Thi B" → "Tran Thi B \(moi\)"/);
});
