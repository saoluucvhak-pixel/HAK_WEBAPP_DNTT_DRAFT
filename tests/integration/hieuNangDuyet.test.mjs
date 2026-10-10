import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Kiểm tra hiệu năng lần 2 (28/09/2026): Duyệt đọc cả ChiTietDNTT và đọc Phiếu Cân 2 lần;
// Báo Cáo MISA đọc cả 22 cột sổ CT chỉ để lấy Ngày CK.
const N = 2000;
function theGioi() {
  const w = buildWorld();
  const ctd = w.main.getSheetByName('ChiTietDNTT'); ctd.data = [ctd.data[0]];
  const ct = w.main.getSheetByName('DNTT_GK_DN_CT');
  const pc = w.pc.getSheetByName('PhieuCan_DN');
  for (let i = 0; i < N; i++) {
    const c = new Array(28).fill(''); c[0] = 'CU' + i; c[2] = 'Z' + i; c[26] = 'Y'; ctd.data.push(c);
    const r = new Array(22).fill(''); r[0] = 'CTCU' + i; r[1] = 'CU' + i; r[11] = 'Z' + i; r[18] = 'Y'; r[20] = new Date(Date.UTC(2026, i === 7 ? 0 : 2, 5, 5)); ct.data.push(r); // chỉ Z7 thanh toán tháng 1
    const p = new Array(28).fill(''); p[0] = 'Z' + i; p[22] = 'Z' + i; pc.data.push(p);
  }
  const ctx = loadCode(w.options);
  const doc = {};
  const dem = (sh, k) => { const goc = sh.getRange.bind(sh); sh.getRange = (...a) => { const r = goc(...a); const gv = r.getValues.bind(r); r.getValues = () => { const v = gv(); doc[k] = (doc[k] || 0) + v.length * (v[0] ? v[0].length : 0); return v; }; return r; }; };
  dem(ctd, 'ctd'); dem(ct, 'ct'); dem(pc, 'pc');
  return { ...ctx, w, doc };
}

test('approval touches only the approved records\' ChiTietDNTT rows', () => {
  const { run, w, doc } = theGioi();
  assert.match(run('runConfirmPayment_')(['A1'], '2026-09-26'), /^✅/);
  const y = w.main.getSheetByName('ChiTietDNTT').rows(28).slice(1).filter(r => r[0] === 'A1');
  assert.equal(y.length, 2);
  assert.ok(y.every(r => r[26] === 'Y' && r[3] instanceof Date), 'A1 rows switched to Y with Ngày CK');
  assert.ok(doc.ctd < 3 * N, `ChiTietDNTT: ${doc.ctd} cells read (whole sheet = ${28 * N})`);
});

test('building ChiTietDNTT rows reads only the tickets it needs, not the whole weigh-ticket file', () => {
  const { run, doc } = theGioi();
  const ctRow = new Array(22).fill(''); ctRow[1] = 'A1'; ctRow[11] = 'PC001';
  const rows = Array.from(run('_xayChiTietDNTTRows_')([ctRow], () => '1', () => null));
  assert.equal(rows.length, 1);
  assert.equal(rows[0][18], 1000, 'KL from the matching ticket');
  assert.ok(doc.pc < 3 * N, `Phiếu Cân: ${doc.pc} cells read (whole file ≈ ${28 * N})`);
});

test('MISA report looks up payment dates from two ledger columns only', () => {
  const { run, w, doc } = theGioi();
  const m = new Array(33).fill(''); m[2] = '05/01/2026'; m[4] = 'Z7'; m[24] = 1000;
  w.updateNh.getSheetByName('Update_NganHang_DN').data.push(m);
  const kq = run('getMisaDataTheoNgay_')('2026-01-01', '2026-01-31');
  assert.equal(kq.total, 1, 'the row is found through the real Ngày CK of ticket Z7');
  assert.ok(doc.ct <= 4 * (N + 5), `ledger: ${doc.ct} cells read (whole ledger = ${22 * N})`);
});

// Sổ 1 năm lớn hơn giới hạn bộ nhớ đệm của Google: giả lập bằng bộ nhớ đệm luôn trống.
function khongCoBoNhoDem(env) {
  const trong = { get: () => null, getAll: () => ({}), put() {}, putAll() {}, remove() {}, removeAll() {} };
  env.CacheService.getScriptCache = () => trong;
}
function demDoc(w) {
  const doc = { pc: 0, ct: 0 };
  [[w.pc.getSheetByName('PhieuCan_DN'), 'pc'], [w.main.getSheetByName('DNTT_GK_DN_CT'), 'ct']].forEach(([sh, k]) => {
    const goc = sh.getRange.bind(sh);
    sh.getRange = (...a) => { const r = goc(...a); const gv = r.getValues.bind(r); r.getValues = () => { const v = gv(); doc[k] += v.length * (v[0] ? v[0].length : 0); return v; }; return r; };
  });
  return doc;
}

test('one run reads each big ledger once, even when it does not fit the Google cache (15:00 trigger)', () => {
  const { run, w, env } = theGioi();
  khongCoBoNhoDem(env);
  const doc = demDoc(w);
  run('webRunDaily15hRefreshNow_')();
  const soDongPc = w.pc.getSheetByName('PhieuCan_DN').getLastRow() - 1, soDongCt = w.main.getSheetByName('DNTT_GK_DN_CT').getLastRow() - 1;
  assert.ok(doc.pc < 2 * soDongPc * run('PC_COT_CAN_DOC.length'), `Phiếu Cân read ${doc.pc} cells - more than once`);
  assert.ok(doc.ct < 2 * soDongCt * 22, `ledger read ${doc.ct} cells - more than once`);
});

test('within one run: a write to the ledger forces a fresh read; editing returned rows never leaks', () => {
  const { run, w, env } = theGioi();
  khongCoBoNhoDem(env);
  const kq = run(`() => {
    const a = _ctThatDocThang_(); a[0][3] = 'DA SUA';
    const b = _ctThatDocThang_();
    _shCtThat_().appendRow(new Array(22).fill('MOI')); _invalidateCtSrc112Cache_();
    const c = _ctThatDocThang_();
    return [b[0][3], b.length, c.length];
  }`)();
  const soDong = w.main.getSheetByName('DNTT_GK_DN_CT').getLastRow() - 1;
  assert.notEqual(kq[0], 'DA SUA', 'rows are copies');
  assert.equal(kq[1], soDong - 1);
  assert.equal(kq[2], soDong, 'fresh read after the write');
});

test('approval removes only the paid tickets from the unpaid mirror, without rewriting it', () => {
  const { run, w } = theGioi();
  run('refreshPhieuCanUnpaidCache_')();
  const mirror = w.draft.getSheetByName('PhieuCan_DN_CHUA_TT_DRAFT');
  const truoc = mirror.getLastRow() - 1;
  let doc = 0, ghi = 0;
  const goc = mirror.getRange.bind(mirror);
  mirror.getRange = (...a) => { const r = goc(...a); const gv = r.getValues.bind(r), sv = r.setValues.bind(r);
    r.getValues = () => { const v = gv(); doc += v.length * (v[0] ? v[0].length : 0); return v; };
    r.setValues = v => { ghi += v.length * v[0].length; return sv(v); }; return r; };
  assert.match(run('runConfirmPayment_')(['A1'], '2026-09-26'), /^✅/);
  const con = mirror.rows(28).slice(1).map(r => String(r[22]));
  assert.ok(!con.includes('PC001') && !con.includes('PC002'), 'paid tickets removed');
  assert.equal(con.length, truoc - 2, 'every other unpaid ticket kept');
  assert.ok(doc < 3 * truoc && ghi === 0, `mirror: ${doc} cells read, ${ghi} written`);
});
