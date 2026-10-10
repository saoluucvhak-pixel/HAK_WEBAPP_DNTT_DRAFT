import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Người dùng chọn 28/09/2026: Công nợ mở bằng bản tổng hợp sẵn (nhanh); muốn mới nhất thì
// bấm Làm mới (chậm hơn). Sau Duyệt không xóa bản tổng hợp mà báo "có thay đổi".
function theGioi() {
  const w = buildWorld();
  const ctx = loadCode(w.options);
  let doc = 0;
  [w.pc.getSheetByName('PhieuCan_DN'), w.main.getSheetByName('DNTT_GK_DN_CT')].forEach(sh => {
    const goc = sh.getRange.bind(sh); sh.getRange = (...a) => { doc++; return goc(...a); };
  });
  const md = ctx.run('_defaultCongNoRange_')();
  const khongCache = () => { ctx.run('_invalidatePcCache_')(); ctx.run('_invalidateCtSrc112Cache_')(); };
  return { ...ctx, w, md, khongCache, doc: () => doc, datLai: () => { doc = 0; } };
}

test('default range: computed once, then read from the summary (no ledger read)', () => {
  const t = theGioi();
  const lan1 = t.run('getDebtByCustomer_')(t.md.fDate, t.md.tDate);
  t.khongCache(); t.datLai();
  const lan2 = t.run('getDebtByCustomer_')(t.md.fDate, t.md.tDate);
  assert.equal(t.doc(), 0, 'weigh tickets / ledger not read');
  assert.deepEqual(JSON.parse(JSON.stringify(lan2)), JSON.parse(JSON.stringify(lan1)));
  const tt = t.run('getCongNoTrangThai_')('kh', t.md.fDate, t.md.tDate);
  assert.equal(tt.tongHop, true);
  assert.match(tt.capNhatLuc, /^\d\d:\d\d \d\d\/\d\d\/\d{4}$/);
  assert.equal(tt.coThayDoi, false);
});

test('after an approval the summary is still shown quickly, flagged as changed; Refresh recomputes', () => {
  const t = theGioi();
  t.run('getDebtByCustomer_')(t.md.fDate, t.md.tDate);
  t.run('getDebtByContract_')(t.md.fDate, t.md.tDate);
  assert.match(t.run('runConfirmPayment_')(['A1'], '2026-09-26'), /^✅/);
  t.khongCache(); t.datLai();
  t.run('getDebtByCustomer_')(t.md.fDate, t.md.tDate);
  assert.equal(t.doc(), 0, 'no recalculation just because of the approval');
  for (const loai of ['kh', 'hd']) {
    const tt = t.run('getCongNoTrangThai_')(loai, t.md.fDate, t.md.tDate);
    assert.equal(tt.coThayDoi, true, loai);
    assert.ok(tt.thayDoiLuc, loai);
  }
  assert.match(t.run('webRunCongNoRefreshNow_')(t.md.fDate, t.md.tDate), /^✅/);
  assert.ok(t.doc() > 0, 'refresh reads the ledgers');
  for (const loai of ['kh', 'hd']) assert.equal(t.run('getCongNoTrangThai_')(loai, t.md.fDate, t.md.tDate).coThayDoi, false, loai);
});

test('viewing another range is computed live and never replaces the default summary', () => {
  const t = theGioi();
  t.run('getDebtByCustomer_')(t.md.fDate, t.md.tDate);
  t.run('getDebtByContract_')(t.md.fDate, t.md.tDate);
  t.run('getDebtByCustomer_')('2026-01-01', '2026-02-01');
  t.run('getDebtByContract_')('2026-01-01', '2026-02-01');
  assert.equal(t.run('getCongNoTrangThai_')('kh', '2026-01-01', '2026-02-01').tongHop, false, 'custom range = live');
  assert.match(t.run('webRunCongNoRefreshNow_')('2026-01-01', '2026-02-01'), /tính trực tiếp/);
  t.khongCache(); t.datLai();
  t.run('getDebtByCustomer_')(t.md.fDate, t.md.tDate);
  t.run('getDebtByContract_')(t.md.fDate, t.md.tDate);
  assert.equal(t.doc(), 0, 'default summary still there');
});
