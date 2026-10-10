import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Người dùng báo 28/09/2026: Danh sách ĐNTT (hàm rất nhẹ) có lần chạy 361 giây. Làm mới 10
// phút/lần ghi đè toàn bộ bản sao trong File Nháp dù dữ liệu không đổi - File Nháp bận ghi thì
// mọi thao tác đọc phải chờ. Nay chỉ ghi khi dữ liệu thật sự đổi.
function theGioi() {
  const w = buildWorld();
  const ctx = loadCode(w.options);
  let ghi = 0;
  const theoDoi = sh => { const goc = sh.getRange.bind(sh); sh.getRange = (...a) => { const r = goc(...a); const sv = r.setValues.bind(r); r.setValues = v => { ghi += v.length * v[0].length; return sv(v); }; return r; }; };
  ctx.run('refreshAllDraftCaches_')(); // lần đầu: tạo bản sao
  w.draft.getSheets().forEach(theoDoi);
  return { ...ctx, w, ghi: () => ghi, datLai: () => { ghi = 0; } };
}
const mirror = w => w.draft.getSheetByName('PhieuCan_DN_CHUA_TT_DRAFT');

test('a refresh with nothing changed writes nothing to the draft file', () => {
  const { run, ghi } = theGioi();
  run('refreshAllDraftCaches_')();
  assert.equal(ghi(), 0);
});

test('a changed weigh ticket is written at the next refresh', () => {
  const { run, w, ghi } = theGioi();
  const moi = w.pc.getSheetByName('PhieuCan_DN').data[1].slice(); moi[0] = 'PC555'; moi[22] = 'PC555'; moi[24] = ''; moi[26] = ''; moi[27] = '';
  w.pc.getSheetByName('PhieuCan_DN').data.push(moi);
  run('refreshAllDraftCaches_')();
  assert.ok(ghi() > 0);
  assert.ok(mirror(w).rows(28).some(r => String(r[22]).replace(/'/g, '') === 'PC555'), 'new unpaid ticket in the mirror');
});

test('a mirror damaged by hand (rows removed) is rebuilt even if the source did not change', () => {
  const { run, w } = theGioi();
  const truoc = mirror(w).getLastRow();
  mirror(w).deleteRows(2, 1);
  run('refreshAllDraftCaches_')();
  assert.equal(mirror(w).getLastRow(), truoc);
});

test('fingerprint: same text same value, any change a different value', () => {
  const { run } = theGioi();
  const dau = run('_dauVanTay_');
  assert.equal(dau('abc'), dau('abc'));
  assert.notEqual(dau('abc'), dau('abd'));
  assert.notEqual(dau('ab'), dau('ab '));
  assert.match(dau(''), /^[0-9a-f]{16}$/);
});
