import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// v2026.9.47 - người dùng đồng ý 28/09/2026: P-05, P-06/07/08, P-10, giao diện U-03…U-08.
const INDEX = readFileSync(new URL('../../Index.html', import.meta.url), 'utf8');
const theGioi = () => { const w = buildWorld(); return { w, ...loadCode({ ...w.options, owner: 'owner@hak.test' }) }; };

// ---------- P-05: Cài đặt 1 lời gọi ----------
test('the settings page gets all its sections in one server call, same data as the separate calls', () => {
  const { run } = theGioi();
  const gop = run('api')('', 'getCaiDatTongHop', []);
  const phan = { nguoiDung: 'getDanhSachNguoiDungForWeb', cauHinhDangNhap: 'getCauHinhDangNhapForWeb', luuTruNam: 'getLuuTruNamForWeb',
    mainSs: 'getMainSsInfoForWeb', trigger: 'getTriggerStatusForWeb', khoaDinhDang: 'getFormatLockStatusForWeb', localeFile: 'getSheetLocaleInfoForWeb',
    vung: 'getRegionInfoForWeb', vungXuat: 'getExportRegionInfoForWeb', misa: 'getMisaDefaultsForWeb', unc: 'getUncConfigForWeb',
    chatbot: 'getChatbotSettingsForWeb', links: 'getConfigLinksForSettings' };
  assert.deepEqual(Object.keys(gop).sort(), Object.keys(phan).sort());
  Object.entries(phan).forEach(([k, ham]) => {
    assert.ok(!(gop[k] && gop[k].__loi), `${k}: ${gop[k] && gop[k].__loi}`);
    assert.deepEqual(JSON.parse(JSON.stringify(gop[k])), JSON.parse(JSON.stringify(run('api')('', ham, []))), k);
  });
  assert.equal(run('API_ROUTES').getCaiDatTongHop.quyen, 'QUAN_TRI');
});

test('a failing section is reported on its own, the others still load', () => {
  const { run } = theGioi();
  run(`() => { getTriggerStatusForWeb_ = () => { throw new Error('khong doc duoc trigger'); }; }`)();
  // API_ROUTES giữ tham chiếu hàm cũ; gọi thẳng hàm gộp (đọc theo tên lúc chạy).
  const gop = run('getCaiDatTongHop_')();
  assert.match(gop.trigger.__loi, /khong doc duoc trigger/);
  assert.ok(gop.misa && !gop.misa.__loi);
});

test('browser: settings sections use the combined result once, then fall back to their own call', () => {
  assert.match(INDEX, /api\(PHIEN, 'getCaiDatTongHop', \[\]\)/);
  assert.equal((INDEX.match(/_caiDat_\('/g) || []).length, 13, 'all 13 sections');
  assert.match(INDEX, /if \(!\(v && v\.__loi\)\) return v;/);
});

// ---------- P-06/07/08: bảng lớn trên trình duyệt ----------
test('browser: one DOM observer, batched per frame (was 5 observers re-scanning the page on every change)', () => {
  assert.equal((INDEX.match(/new MutationObserver\(/g) || []).length, 2, 'the shared one + the help-page table of contents');
  assert.match(INDEX, /requestAnimationFrame\(chay\)/);
  assert.match(INDEX, /function _xuLyDomMoi_\(\)\{\s*_ganONgayVN_\(document\.body\);/);
  assert.match(INDEX, /BAM_DUOC_BANG_PHIM\.split\(','\)\.map\(s => s\.trim\(\) \+ ':not\(\[tabindex\]\)'\)/);
});

test('browser: MISA and detail tables are paged (100 rows), totals still over all rows', () => {
  ['renderMisaResultTable', 'renderChiTietResultTable'].forEach(fn => {
    const than = INDEX.slice(INDEX.indexOf(`function ${fn}(){`), INDEX.indexOf('\n}\n', INDEX.indexOf(`function ${fn}(){`)));
    assert.match(than, /pageSlice\(rows, _trangHopLe_\('(misa|chiTiet)Page', rows\.length\), BANG_LON_MOI_TRANG\)/, fn);
    assert.match(than, /const tongTien = rows\.reduce/, `${fn}: total over the filtered rows, not the page`);
    assert.match(than, /renderPager\(rows\.length/, fn);
  });
  assert.match(INDEX, /const BANG_LON_MOI_TRANG = 100;/);
});

test('browser: the draft-list name filter waits for typing to pause', () => {
  assert.match(INDEX, /state\._henLocDraft = setTimeout\(renderDraftTable, 150\);/);
});

// ---------- P-10: Đề Nghị Thanh Toán (tính lại) chỉ đọc sổ CT của hợp đồng liên quan ----------
function soLon() {
  const w = buildWorld();
  const ct = w.main.getSheetByName('DNTT_GK_DN_CT');
  // 3.000 dòng hợp đồng khác + vài dòng HD01 (đã trả Y / chưa trả, trước và sau thời điểm hồ sơ).
  for (let i = 0; i < 3000; i++) {
    const r = Array(22).fill(''); r[0] = 'X' + i; r[1] = 'OLDX' + i; r[2] = new Date('2026-01-01T03:00:00Z'); r[11] = 'Q' + i; r[12] = 1 + (i % 7); r[16] = 1e5; r[18] = 'Y'; r[19] = "'HDKHAC" + (i % 50);
    ct.data.push(r);
  }
  [['2026-02-01', 'Y', 12.5], ['2026-03-01', 'Y', 7.25], ['2026-03-05', '', 3], ['2099-01-01', 'Y', 99]].forEach(([d, y, kl], i) => {
    const r = Array(22).fill(''); r[0] = 'H' + i; r[1] = 'OLDH' + i; r[2] = new Date(d + 'T03:00:00Z'); r[11] = 'PH' + i; r[12] = kl; r[16] = 1; r[18] = y; r[19] = "'HD01";
    ct.data.push(r);
  });
  w.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').data.slice(1).forEach(r => { r[1] = new Date('2026-09-20T03:00:00Z'); });
  return w;
}
test('recalculation gives exactly the same 112 rows while reading only the relevant contracts', () => {
  const tinh = docCaSo => {
    const w = soLon();
    const { run } = loadCode(w.options);
    const ct = w.main.getSheetByName('DNTT_GK_DN_CT');
    let oDoc = 0;
    const goc = ct.getRange.bind(ct);
    ct.getRange = (...a) => { const rg = goc(...a); const gv = rg.getValues.bind(rg); rg.getValues = () => { const v = gv(); oDoc += v.length * (v[0] || []).length; return v; }; return rg; };
    if (docCaSo) run(`() => { _docDongTheoKhoa_ = (sh, c, rong) => sh.getRange(2, 1, sh.getLastRow() - 1, rong).getValues(); }`)(); // như bản cũ: cả sổ
    assert.match(run('runCreate112')(), /^✅/);
    return { rows: JSON.stringify(w.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').rows(24)), oDoc };
  };
  const moi = tinh(false), cu = tinh(true);
  assert.equal(moi.rows, cu.rows, 'identical Số tiền, lũy kế, ghi chú, trạng thái');
  assert.match(moi.rows, /Đã trả: 19,75/, 'HD01 history (12,5 + 7,25) is still counted');
  assert.ok(moi.oDoc < cu.oDoc / 10, `cells read from the ledger: ${moi.oDoc} vs ${cu.oDoc}`);
});

// ---------- Giao diện U-03 … U-08 ----------
test('browser: UI fixes U-03 … U-08', () => {
  assert.match(INDEX, /<div class="cuon-ngang"><table class="cot-cuoi-dinh"><thead><tr>\s*<th><input type="checkbox" id="chk-all"/, 'U-03 draft list: action column pinned');
  assert.match(INDEX, /table\.cot-cuoi-dinh td:last-child\{position:sticky; right:0;/);
  assert.match(INDEX, /#toast-wrap\{position:fixed; bottom:86px;/, 'U-04 toasts above the AI button');
  assert.match(INDEX, /if \(_giuTabTrongModal_\(e\)\) return;/, 'U-05 Tab stays inside the open dialog');
  assert.doesNotMatch(INDEX, /:has\(/, 'U-06 no :has() selector');
  assert.match(INDEX, /\.card:not\(\.co-goi-y\), \.modal-body\{overflow-x:auto;\}/);
  assert.match(INDEX, /call\('TRA_LOI_CHATBOT', \[cauHoi, chatbotLichSu_\.slice\(\)\], null\)/, 'U-07 AI chat goes through call()');
  assert.doesNotMatch(INDEX, /\.api\(PHIEN, 'TRA_LOI_CHATBOT'/);
  const moc = INDEX.slice(INDEX.indexOf('function _bulkRefBoundary_(){'), INDEX.indexOf('\n}\n', INDEX.indexOf('function _bulkRefBoundary_(){')));
  assert.match(moc, /_vnNow_\(\)/, 'U-08 refresh boundary in Vietnam time');
  assert.doesNotMatch(moc, /setHours\(/);
});

test('browser: the 7:30 / 13:00 refresh boundary is Vietnam time whatever the computer time zone', () => {
  const src = INDEX.slice(INDEX.indexOf('function _vnNow_(){'), INDEX.indexOf('function todayISOVN'))
    + INDEX.slice(INDEX.indexOf('function _bulkRefBoundary_(){'), INDEX.indexOf('\n}\n', INDEX.indexOf('function _bulkRefBoundary_(){')) + 2);
  const moc = bayGioUtc => new Function('Date', src + 'return _bulkRefBoundary_();')(class extends Date {
    constructor(...a) { super(...(a.length ? a : [bayGioUtc])); }
    static now() { return bayGioUtc; }
  });
  const iso = ms => new Date(ms).toISOString();
  // 10:00 VN (03:00Z) -> mốc 7:30 VN = 00:30Z cùng ngày.
  assert.equal(iso(moc(Date.UTC(2026, 8, 28, 3, 0))), '2026-09-28T00:30:00.000Z');
  // 14:00 VN (07:00Z) -> mốc 13:00 VN = 06:00Z.
  assert.equal(iso(moc(Date.UTC(2026, 8, 28, 7, 0))), '2026-09-28T06:00:00.000Z');
  // 06:00 VN (23:00Z hôm trước) -> 13:00 VN hôm trước = 06:00Z ngày 27.
  assert.equal(iso(moc(Date.UTC(2026, 8, 27, 23, 0))), '2026-09-27T06:00:00.000Z');
});
