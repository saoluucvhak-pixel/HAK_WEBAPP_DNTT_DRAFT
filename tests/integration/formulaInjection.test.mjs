import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';
import { FORMULA_MARK } from '../gas/mock.mjs';

// The mock flags text written WITHOUT a leading apostrophe that Google Sheets would
// parse as a formula (= + - @). Text typed on the web, or read back from a text
// cell and written again, must always land in the sheet as plain text.

const EVIL = '=HYPERLINK("http://evil.example","bấm vào đây")';
const PLUS = '+cmd|calc';
const AT = '@SUM(1)';
const MINUS = '-Nguyễn Văn A';

function worldWithFormulaText() {
  const world = buildWorld();
  // As Google Sheets returns stored text: without the apostrophe.
  world.draft.getSheetByName('DNTT_GK_DN_CT_DRAFT').data.slice(1).forEach(r => { r[3] = EVIL; r[6] = PLUS; });
  world.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').data.slice(1).forEach(r => { r[2] = EVIL; r[3] = PLUS; r[4] = AT; });
  world.draft.getSheetByName('DNTT_GK_DN_DRAFT').data.slice(1).forEach(r => { r[3] = EVIL; r[5] = MINUS; r[7] = PLUS; });
  world.pc.getSheetByName('PhieuCan_DN').data.slice(1).forEach(r => { r[11] = EVIL; }); // Khách hàng
  return { world, ...loadCode(world.options) };
}

function formulaCells(env) {
  const found = [];
  for (const ss of env._registry.values()) {
    for (const sh of ss.getSheets()) {
      sh.data.forEach((line, r) => line.forEach((v, c) => {
        if (typeof v === 'string' && v.startsWith(FORMULA_MARK)) found.push(`${ss.name} / ${sh.name} / R${r + 1}C${c + 1}`);
      }));
    }
  }
  return found;
}

const ok = res => assert.ok(typeof res === 'string' ? !/^❌/.test(res) : res.success !== false, JSON.stringify(res));

test('text starting with = + - @ never becomes a formula anywhere in the payment flow', () => {
  const { env, run, world } = worldWithFormulaText();
  ok(run('refreshAllDraftCaches_')());
  ok(run('runCreate112')());
  ok(run('updateDraft112Info_')('B2', { nguoiNhan: EVIL, nganHang: AT }));
  ok(run('runXacNhanDNTT_')(['B2'], true));
  ok(run('exportBaoCaoDNTTFromDraft_')(['A1']));
  ok(run('webCreateUNCFromDraft_')(['A1'], {}));
  ok(run('webSuaTenKhachHangPhieuCan_')('PC003', MINUS));
  ok(run('webLuuNguoiDung_')({ email: 'xem@gmail.com', hoTen: EVIL, vaiTro: 'XEM' }));
  ok(run('runConfirmPayment_')(['A1'], '2026-09-26'));
  ok(run('createNewPaymentRequest_')({
    hoTenChuRung: EVIL, cccdChuRung: '012345678901', nguoiDeNghi: PLUS, nguoiNhanTien: AT,
    soTKNhanTien: '0123', nganHang: MINUS, soHopDong: 'HD01', ngayDeNghi: '2026-09-26', danhSachPhieuCan: ['PC999']
  }));
  ok(run('runHuyXacNhanDNTT_')(['B2']));
  ok(run('runDeleteDraftRecord_')('B2'));

  assert.deepEqual(formulaCells(env), []);
  // The text itself is kept exactly as typed.
  const src = world.main.getSheetByName('DNTT_GK_DN').rows(18).find(r => r[0] === 'A1');
  assert.deepEqual([src[3], src[5], src[7]], [EVIL, MINUS, PLUS]);
  const pc = world.pc.getSheetByName('PhieuCan_DN').rows(28).find(r => r[22] === 'PC003');
  assert.equal(pc[11], MINUS);
});

test('_oAnToan_ only touches text that Sheets would parse as a formula', () => {
  const { run } = loadCode();
  const f = run('_oAnToan_');
  assert.equal(f(EVIL), "'" + EVIL);
  assert.equal(f(MINUS), "'" + MINUS);
  assert.equal(f("'" + EVIL), "'" + EVIL, 'already protected text is not double-quoted');
  ['Nguyễn Văn A', '', '0123', '-5', '+84', '12.5', 'a=b'].forEach(v => assert.equal(f(v), v, v));
  const d = new Date();
  [0, -5, 12.5, d, true, null].forEach(v => assert.equal(f(v), v));
  const rows = run('_dongAnToan_')([[EVIL, '0123', 5]], [1]);
  assert.deepEqual(JSON.parse(JSON.stringify(rows)), [["'" + EVIL, "'0123", 5]]);
});
