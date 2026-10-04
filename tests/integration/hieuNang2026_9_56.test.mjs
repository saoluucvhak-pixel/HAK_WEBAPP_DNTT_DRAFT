import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MockRange } from '../gas/mock.mjs';
import { loadCode } from '../gas/loadCode.mjs';
import { duLieuLon, ngayThuI } from '../gas/duLieuLon.mjs';
import { IDS } from '../gas/fixtures.mjs';

// 2026.9.56 - tối ưu hiệu năng theo SYS_HieuNang thật (27/09-03/10): đọc đúng cột / đúng dòng cần thay
// vì cả sheet. Mỗi thay đổi: kết quả GIỐNG HỆT cách đọc cũ và đọc ít hơn hẳn.
const CO = { N_PC: 2000, N_CT: 1800, N_HD: 60, N_NHAP: 10 };
const doc = {};
const goc = MockRange.prototype.getValues;
MockRange.prototype.getValues = function () { const v = goc.call(this); doc[this.sheet.name] = (doc[this.sheet.name] || 0) + v.length * (v[0] ? v[0].length : 0); return v; };
const datLai = () => Object.keys(doc).forEach(k => delete doc[k]);
const caSheet = sh => (sh.data.length - 1) * sh.data[0].length;

function theGioi({ khongCache = true } = {}) {
  const w = duLieuLon(CO);
  const ctx = loadCode({ ...w.options, owner: 'owner@hak.test' });
  if (khongCache) { // sổ 1 năm vượt giới hạn bộ nhớ đệm / hết 90 giây - như thực tế
    const trong = { get: () => null, getAll: () => ({}), put() {}, putAll() {}, remove() {}, removeAll() {} };
    ctx.env.CacheService.getScriptCache = () => trong;
  }
  const mo = {};
  const openById = ctx.env.SpreadsheetApp.openById.bind(ctx.env.SpreadsheetApp);
  ctx.env.SpreadsheetApp.openById = id => { mo[id] = (mo[id] || 0) + 1; return openById(id); };
  return { w, mo, ...ctx };
}
const pcSheet = w => w.pc.getSheetByName('PhieuCan_DN');

test('10-minute trigger: the unpaid-ticket mirror is identical, reading only status columns and unpaid rows', () => {
  const t = theGioi();
  t.run('refreshAllDraftCaches_')();
  const mirror = () => JSON.stringify(t.w.draft.getSheetByName('PhieuCan_DN_CHUA_TT_DRAFT').rows());
  const truoc = mirror();
  t.w.draft.getSheetByName('PhieuCan_DN_CHUA_TT_DRAFT').data.splice(1); // buộc ghi lại
  datLai();
  t.run('refreshAllDraftCaches_')({ chiPhieuChuaTra: true });
  assert.equal(mirror(), truoc, 'same rows, same columns');
  assert.ok(doc.PhieuCan_DN < caSheet(pcSheet(t.w)) / 3, `Phiếu Cân: ${doc.PhieuCan_DN} cells (whole file ${caSheet(pcSheet(t.w))})`);
});

test('10-minute trigger skips source files nobody edited, refreshes edited ones, and at least hourly', () => {
  const t = theGioi();
  const sua = { [IDS.PC]: Date.now() - 3600e3, [IDS.HD]: Date.now() - 3600e3 };
  let loiDrive = false;
  t.env.DriveApp.getFileById = id => ({ getLastUpdated: () => { if (loiDrive) throw new Error('drive'); return new Date(sua[id]); } });
  const chay = () => { datLai(); Object.keys(t.mo).forEach(k => delete t.mo[k]); t.run('refreshAllDraftCaches_')({ chiPhieuChuaTra: true, chiKhiDoi: true }); };
  chay();
  assert.ok(t.mo[IDS.PC] && t.mo[IDS.HD], 'first run refreshes both');
  chay();
  assert.deepEqual([t.mo[IDS.PC], t.mo[IDS.HD], doc.PhieuCan_DN, doc.HD_NCC], [undefined, undefined, undefined, undefined], 'nothing edited: files not opened');
  sua[IDS.PC] = Date.now();
  chay();
  assert.ok(t.mo[IDS.PC] && !t.mo[IDS.HD], 'only the edited weigh-ticket file');
  const props = t.env.PropertiesService.getScriptProperties();
  props.setProperty('LAM_MOI_FILE_LUC_HD', String(Date.now() - 61 * 60e3));
  chay();
  assert.ok(t.mo[IDS.HD], 'refreshed after an hour even if unchanged');
  loiDrive = true; sua[IDS.PC] = 0;
  chay();
  assert.ok(t.mo[IDS.PC], 'cannot read the edit time -> refresh as before');
  datLai(); t.run('refreshAllDraftCaches_')();
  assert.ok(doc.PhieuCan_DN && doc.HD_NCC, 'manual / daily refresh is never skipped');
});

test('creating records reads a few ledger columns once, then the compact copy from the cache', () => {
  const t = theGioi({ khongCache: false });
  const tao = j => {
    const i = CO.N_CT + CO.N_NHAP + j, k = i % CO.N_HD;
    return t.run('createNewPaymentRequest_')({ hoTenChuRung: 'CHU RUNG ' + k, cccdChuRung: '049012345678', nguoiDeNghi: 'X', nguoiNhanTien: 'CHU RUNG ' + k,
      soTKNhanTien: '42302' + String(k).padStart(8, '0'), nganHang: 'AGRIBANK', soHopDong: String(20260000000 + k), ngayDeNghi: '2026-10-03', danhSachPhieuCan: [`${i}/2026/NK`] });
  };
  const ct = t.w.main.getSheetByName('DNTT_GK_DN_CT');
  datLai(); assert.equal(tao(1).success, true);
  assert.ok(doc.DNTT_GK_DN_CT <= caSheet(ct) * 6 / 22 + 50, `first: ${doc.DNTT_GK_DN_CT} ledger cells (whole ${caSheet(ct)})`);
  datLai(); assert.equal(tao(2).success, true);
  assert.ok(!doc.DNTT_GK_DN_CT, `second within 10 minutes: ${doc.DNTT_GK_DN_CT || 0} ledger cells`);
});

test('the draft list, confirm and print read only the weigh tickets of the draft records', () => {
  const t = theGioi();
  const full = caSheet(pcSheet(t.w));
  datLai(); const ds = t.run('getDanhSachNhapCoKiemTra_')();
  assert.equal(ds.length, CO.N_NHAP);
  assert.ok(doc.PhieuCan_DN < full / 10, `list: ${doc.PhieuCan_DN} of ${full}`);
  const ids = ds.slice(0, 3).map(r => r.idKey);
  datLai(); assert.notEqual(t.run('runXacNhanDNTT_')(ids).success, false);
  assert.ok(doc.PhieuCan_DN < full / 10, `confirm: ${doc.PhieuCan_DN} of ${full}`);
  datLai(); assert.equal(t.run('exportBaoCaoDNTTFromDraft_')(ids).success, true);
  assert.ok(doc.PhieuCan_DN < full / 5, `print: ${doc.PhieuCan_DN} of ${full}`);
});

test('approval no longer reads the whole weigh-ticket file or request ledger, same outcome', () => {
  const t = theGioi();
  const ids = t.run('getDraftListSummary_')().slice(0, 3).map(r => r.idKey);
  t.run('runXacNhanDNTT_')(ids);
  datLai();
  assert.match(t.run('runConfirmPayment_')(ids, '2026-10-03'), /^✅/);
  assert.ok(doc.PhieuCan_DN < caSheet(pcSheet(t.w)) / 4, `Phiếu Cân ${doc.PhieuCan_DN}`);
  assert.ok(doc.DNTT_GK_DN < caSheet(t.w.main.getSheetByName('DNTT_GK_DN')) / 4, `DNTT_GK_DN ${doc.DNTT_GK_DN}`);
  const daChot = t.w.main.getSheetByName('DNTT_GK_DN_CT').rows(22).filter(r => ids.includes(r[1]));
  assert.equal(daChot.length, 3, 'each approved ticket is in the ledger');
});

test('payment / purchase analysis: identical figures to reading the whole files', () => {
  const t = theGioi();
  const ngayDs = [5, 40, 41, 300].map(i => Utilities(ngayThuI(i)));
  function Utilities(d) { return new Date(d.getTime() + 7 * 3600e3).toISOString().slice(0, 10); }
  const ketQua = () => JSON.stringify(t.w.draft.getSheetByName('PhanTichNhapTT_DRAFT').rows().slice(1).filter(r => ngayDs.includes(String(r[0]))).map(r => r.map(String)).sort());
  t.run('_refreshPhanTichNhapTTChoDanhSachNgayNoLock_')(ngayDs, { pc: t.run('_pcData_')(), ct: t.run('_ctThatDocThang_')() }); // đối chứng: cả 2 file
  const doiChung = ketQua();
  assert.ok(doiChung.length > 10);
  datLai();
  t.run('_refreshPhanTichNhapTTChoDanhSachNgayNoLock_')(ngayDs);
  assert.equal(ketQua(), doiChung);
  assert.ok(doc.PhieuCan_DN < caSheet(pcSheet(t.w)) / 4, `Phiếu Cân ${doc.PhieuCan_DN}`);
  assert.ok(doc.DNTT_GK_DN_CT < caSheet(t.w.main.getSheetByName('DNTT_GK_DN_CT')) / 4, `sổ CT ${doc.DNTT_GK_DN_CT}`);
});

test('MISA report: same rows as scanning the whole sheet, reading two columns plus the matching rows', () => {
  const t = theGioi();
  const nh = t.w.updateNh.getSheetByName('Update_NganHang_DN');
  const ngayCk = new Map(t.w.main.getSheetByName('DNTT_GK_DN_CT').rows(22).slice(1).map(r => [String(r[11]).replace(/^'/, ''), r[20]]));
  const iso = d => new Date(d.getTime() + 7 * 3600e3).toISOString().slice(0, 10);
  const mong = nh.rows(33).slice(1).filter(r => { const d = ngayCk.get(String(r[4]).replace(/^'/, '')); return d && iso(d) >= '2026-02-01' && iso(d) <= '2026-02-28'; });
  datLai();
  const kq = t.run('_locMisaTheoNgay_')('2026-02-01', '2026-02-28');
  assert.ok(mong.length > 50);
  assert.equal(kq.total, mong.length);
  assert.deepEqual(JSON.stringify(kq.dong), JSON.stringify(mong));
  const toiDa = 3 * (nh.data.length - 1) + 33 * (mong.length + 1); // cột C..E cả sheet + đủ 33 cột cho dòng khớp + dòng tiêu đề
  assert.ok(doc.Update_NganHang_DN <= toiDa, `Update_NganHang_DN ${doc.Update_NganHang_DN} (bound ${toiDa}, whole sheet ${caSheet(nh)})`);
});
