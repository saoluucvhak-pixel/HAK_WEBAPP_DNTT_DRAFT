import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Báo Cáo UNC: tạo lại UNC cho cùng hồ sơ không làm báo cáo nhân thêm dòng.
function world() {
  const w = buildWorld();
  return { w, ...loadCode(w.options) };
}
const homNay = () => new Date().toISOString().slice(0, 10);
const cuaA1 = w => w.main.getSheetByName('ChiTietUNC').rows(18).slice(1).filter(r => r[0] === 'A1');

test('creating the UNC again for the same record replaces its history row (old row backed up)', () => {
  const { run, w } = world();
  for (let i = 0; i < 3; i++) assert.equal(run('webCreateUNCFromDraft_')(['A1'], homNay()).success, true);
  assert.equal(cuaA1(w).length, 1, 'one history row per record');
  assert.equal(Array.from(run('getLichSuUNC_')(homNay(), homNay())).filter(r => r.idHeThong === 'A1').length, 1);
  const saoLuu = Array.from(run('getDanhSachSaoLuuXoa_')()).filter(g => g.hanhDong === 'TAO_LAI_UNC');
  assert.equal(saoLuu.length, 2, 'each replaced row is restorable');
});

test('history written by older versions (several rows per record) shows only the newest in the report', () => {
  const { run, w } = world();
  run('webCreateUNCFromDraft_')(['A1'], homNay());
  const sh = w.main.getSheetByName('ChiTietUNC');
  const cu = sh.data[1].slice(); cu[14] = new Date(Date.now() - 3600e3); cu[15] = 'link-cu';
  sh.data.splice(1, 0, cu); // dòng cũ hơn của cùng hồ sơ, như bản cũ đã ghi thêm
  const rows = Array.from(run('getLichSuUNC_')(homNay(), homNay())).filter(r => r.idHeThong === 'A1');
  assert.equal(rows.length, 1);
  assert.notEqual(rows[0].linkFile, 'link-cu', 'the newest creation is kept');
});
