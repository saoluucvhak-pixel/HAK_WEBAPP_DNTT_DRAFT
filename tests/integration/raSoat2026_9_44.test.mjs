import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Rà soát toàn bộ 28/09/2026 (v2026.9.44) - các lỗi sửa trong đợt này.
const INDEX = readFileSync(new URL('../../Index.html', import.meta.url), 'utf8');
const homNay = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);

function theGioi() {
  const world = buildWorld();
  const ctx = loadCode(world.options);
  return { ...ctx, world };
}
/** A1: bỏ 1 phiếu cân (còn 1 phiếu 1.000.000 đ) nhưng tính lại KHÔNG chạy được -> Số tiền 112 vẫn
 * 2.000.000 đ. Từ 2026.9.49 bỏ phiếu tự tính lại; lớp chặn lệch tiền vẫn phải giữ cho khi tự tính lỗi. */
function boPhieuKhongTinhLai(run) {
  run('runHuyXacNhanDNTT_')('A1');
  const ct = run('getDraftRecordDetail_')('A1').chiTiet[0];
  run(`() => { globalThis.__tinhLaiGoc = _tinhLai112Nhap_; _tinhLai112Nhap_ = () => { throw new Error('het quota'); }; }`)();
  const kq = run('removePhieuCanFromDraft_')(ct.idCT);
  run(`() => { _tinhLai112Nhap_ = globalThis.__tinhLaiGoc; }`)();
  assert.equal(kq.success, true);
  assert.match(kq.message, /Chưa tự tính lại được Số tiền \(.*het quota.*\)/);
}

// ---------- CRITICAL: Số tiền hồ sơ phải khớp tổng tiền phiếu cân ----------
test('a record whose amount no longer matches its weigh tickets cannot be confirmed, printed, sent to UNC or approved', () => {
  const { run, world } = theGioi();
  boPhieuKhongTinhLai(run);

  const ds = run('getDraftListSummary_')().find(r => r.idKey === 'A1');
  assert.equal(ds.soTien, 2000000);
  assert.equal(ds.tongTienPhieu, 1000000);
  assert.equal(ds.canTinhLai, true, 'list flags the record');

  const xn = run('runXacNhanDNTT_')(['A1']);
  assert.equal(xn.success, false);
  assert.match(xn.message, /Đề Nghị Thanh Toán \(tính lại\)/);

  // Dù ai đó ghi tay "Đang ĐNTT" vào File Nháp, In / UNC / Duyệt vẫn chặn.
  const sh112 = world.draft.getSheetByName('DNTT_GK_DN_112_DRAFT');
  sh112.data[1][23] = 'Đang ĐNTT';
  assert.equal(run('exportBaoCaoDNTTFromDraft_')(['A1']).success, false);
  assert.equal(run('webCreateUNCFromDraft_')(['A1'], homNay(), '', '').success, false);
  const duyet = run('runConfirmPayment_')(['A1'], homNay());
  assert.doesNotMatch(duyet, /^✅/);
  assert.match(duyet, /tính lại/);
  assert.equal(world.main.getSheetByName('DNTT_GK_DN_CT').rows().length, 1, 'nothing committed');
  assert.equal(world.pc.getSheetByName('PhieuCan_DN').rows(28).slice(1).filter(r => r[27] === 'Y').length, 0, 'no weigh ticket locked');
});

test('after recalculating, the same record goes through and pays exactly its weigh tickets', () => {
  const { run, world } = theGioi();
  boPhieuKhongTinhLai(run);
  assert.match(run('runCreate112')(), /^✅/);
  assert.equal(run('getDraftListSummary_')().find(r => r.idKey === 'A1').canTinhLai, false);
  assert.equal(run('runXacNhanDNTT_')(['A1']).success, true);
  assert.match(run('runConfirmPayment_')(['A1'], homNay()), /^✅/);
  const h112 = world.main.getSheetByName('DNTT_GK_DN_112').rows(23).slice(1);
  assert.equal(h112[0][6], 1000000);
});

test('records whose amount matches are not affected (normal flow unchanged)', () => {
  const { run } = theGioi();
  const ds = run('getDraftListSummary_')();
  assert.ok(ds.every(r => r.canTinhLai === false));
  assert.match(run('runConfirmPayment_')(['A1'], homNay()), /^✅/);
});

test('the draft list shows a "needs recalculation" badge', () => {
  assert.match(INDEX, /r\.canTinhLai \? `<br><span class="badge pending dot"[^`]*⚠️ Cần tính lại/);
});

// ---------- HIGH: Xuất Báo Cáo đọc lại số liệu từ sổ, không tin trình duyệt ----------
test('report export uses the ledger figures, not the amounts / accounts sent by the browser', () => {
  const { run, world, env } = theGioi();
  world.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').data[1][16] = new Date(); // Ngày ĐN - Báo cáo lọc theo cột này
  assert.match(run('runConfirmPayment_')(['A1'], homNay()), /^✅/);
  const d = homNay();
  const thang = d.slice(0, 8) + '01';
  const gia = [{ idHeThong: 'A1', soTien: 999999999, stk: '9999', nguoiNhan: 'Ke gian', chuRung: 'X', ngayDN: '', ghiChu: '' }];
  const kq = run('webExportReport_')(gia, `${thang} - ${d}`);
  assert.equal(kq.success, true, kq.message);
  // File báo cáo mới tạo: tìm qua SpreadsheetApp của mock bằng URL trả về.
  const ss = env.SpreadsheetApp.openById(/\/d\/([^/]+)/.exec(kq.url)[1]);
  const bang = ss.getSheets()[0].rows(11);
  const dong = bang.find(r => r[0] === 1);
  assert.ok(dong, 'one data row');
  assert.equal(dong[8], 2000000, 'amount comes from DNTT_GK_DN_112');
  assert.notEqual(String(dong[5]).replace(/'/g, ''), '9999', 'account comes from the ledger');
  assert.notEqual(dong[4], 'Ke gian');

  const khong = run('webExportReport_')([{ idHeThong: 'KHONG_CO' }], `${thang} - ${d}`);
  assert.equal(khong.success, false);
  const motPhan = run('webExportReport_')([{ idHeThong: 'A1' }, { idHeThong: 'DA_MO_LAI' }], `${thang} - ${d}`);
  assert.equal(motPhan.success, true);
  assert.equal(motPhan.soHoSo, 1);
  assert.match(motPhan.message, /1 hồ sơ không còn trong sổ đã chốt/);
});

// ---------- MEDIUM: bộ nhớ đệm chia mảnh theo BYTE UTF-8 ----------
test('cache chunks never exceed the byte limit, even for Vietnamese text, and never split surrogate pairs', () => {
  const { run } = theGioi();
  const chia = run('_chiaManhTheoByte_');
  const s = 'Nguyễn Văn Ánh - Đại lý Quế Sơn 😀 '.repeat(5000);
  const manh = chia(s, 90000);
  assert.equal(manh.join(''), s, 'lossless');
  manh.forEach(m => assert.ok(Buffer.byteLength(m, 'utf8') <= 90000, 'chunk ≤ 90000 bytes'));
  manh.forEach(m => assert.ok(!/^[\uDC00-\uDFFF]/.test(m), 'no chunk starts with a low surrogate'));
  assert.ok(manh.length > Math.ceil(s.length / 90000), 'more chunks than a char-based split');
  assert.deepEqual(Array.from(chia('abc', 90000)), ['abc']);
  assert.equal(chia('', 90000).length, 0);
});

test('reference data with Vietnamese text is really served from the cache on the next call', () => {
  const { run, env } = theGioi();
  let lanDoc = 0;
  const rows = Array.from({ length: 4000 }, (_, i) => [`Nguyễn Thị Hồng Nhung ${i}`, 'Đại lý Quế Sơn - Thăng Bình', i]);
  env.__docThu = () => { lanDoc++; return rows; };
  run('_getCachedRefData_')('thu_utf8', () => env.__docThu());
  run('_getCachedRefData_')('thu_utf8', () => env.__docThu());
  assert.equal(lanDoc, 1);
  const cache = run('CacheService.getScriptCache()');
  Object.entries(Object.fromEntries(cache._map)).filter(([k]) => k.startsWith('thu_utf8_c'))
    .forEach(([, v]) => assert.ok(Buffer.byteLength(v, 'utf8') <= 90000));
});

// ---------- MEDIUM: Cài đặt - đổi link chỉ theo danh sách khai báo + nhật ký cấu hình ----------
test('the settings link changer only accepts declared links and logs before → after', () => {
  const { run, world } = theGioi();
  const lo = run('webSetSwappableLink_')('SSO_SECRET', world.pc.id);
  assert.equal(lo.success, false, 'cannot overwrite arbitrary script properties');
  assert.equal(run('PropertiesService.getScriptProperties().getProperty("SSO_SECRET")'), null);

  const ok = run('webSetSwappableLink_')('PC_SS_ID', `https://docs.google.com/spreadsheets/d/${world.pc.id}/edit`);
  assert.equal(ok.success, true, ok.message);
  const log = world.main.getSheetByName('NhatKyThaoTac').rows(5).slice(1).filter(r => r[2] === 'CAU_HINH_HE_THONG');
  assert.equal(log.length, 1);
  assert.match(log[0][4], /File Phiếu Cân/);
});

test('bank / UNC / region settings changes are written to the change history', () => {
  const { run, world } = theGioi();
  run('webSetMisaDefaults_')({ account: '1234567890', name: 'BIDV', code: '43' });
  run('webSetUncConfig_')({ tkTrichNo: '5555555555' });
  run('webSetRegion_')('VN');
  run('webSetExportRegion_')('US');
  run('webSetChatbotApiKey_')('AIza-bi-mat');
  const log = world.main.getSheetByName('NhatKyThaoTac').rows(5).slice(1).filter(r => r[2] === 'CAU_HINH_HE_THONG').map(r => String(r[4]));
  assert.ok(log.some(x => /Số TK công ty: "8619299999" → "1234567890"/.test(x)), log.join(' | '));
  assert.ok(log.some(x => /TK trích nợ/.test(x)));
  assert.ok(log.some(x => /Vùng lãnh thổ: US → VN/.test(x)));
  assert.ok(log.some(x => /Vùng định dạng file xuất: VN → US/.test(x)));
  assert.ok(log.every(x => !x.includes('AIza-bi-mat')), 'API key value never logged');
  assert.ok(run('LICH_SU_SUA_DOI_ACTIONS.has("CAU_HINH_HE_THONG")'));
  assert.match(INDEX, /CAU_HINH_HE_THONG: '⚙️ Đổi cấu hình'/);
});

// ---------- Giao diện: không nhân bản sự kiện, màn hình chờ đếm lượt ----------
test('create-flow selects assign a single change handler (no duplicated server calls)', () => {
  assert.doesNotMatch(INDEX, /sel\.addEventListener\('change', on(SoHD|NguoiNhan|Stk)Change\)/);
  ['onSoHDChange', 'onNguoiNhanChange', 'onStkChange'].forEach(fn => assert.match(INDEX, new RegExp(`sel\\.onchange = ${fn};`)));
});

test('the loading overlay stays up while another call is still running', () => {
  assert.match(INDEX, /let _soLuotCho_ = 0;/);
  assert.match(INDEX, /if \(_soLuotCho_ > 0\) return; \/\/ còn thao tác khác đang chờ/);
});

// Trước đợt này không test nào bắt lỗi cú pháp của mã trình duyệt (lỗi cú pháp = trắng trang).
test('the browser script parses (a syntax error would leave the web app blank)', () => {
  const khoi = INDEX.match(/<script>([\s\S]*?)<\/script>/g);
  assert.ok(khoi && khoi.length);
  khoi.forEach(k => assert.doesNotThrow(() => new Function(k.replace(/^<script>|<\/script>$/g, ''))));
});
