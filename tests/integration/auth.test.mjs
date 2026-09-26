import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { createHmac } from 'node:crypto';
import { loadCode } from '../gas/loadCode.mjs';
import { createGasEnvironment } from '../gas/mock.mjs';
import { buildWorld, pcRow } from '../gas/fixtures.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CODE = readFileSync(path.join(ROOT, 'Code.gs'), 'utf8');
const INDEX = readFileSync(path.join(ROOT, 'Index.html'), 'utf8');

const OWNER = 'owner@hak.test';
const KE_TOAN = 'ketoan@gmail.com';
const XEM = 'xem@gmail.com';

const MENU_FUNCTIONS = ['runProcessDetail', 'runCreate112', 'showPayDialog', 'showAddPaymentDialog', 'showOpenDraftDialog',
  'showDeleteDraftDialog', 'runFillMissingBankOnly', 'showRefreshPcCacheDialog', 'showSetupPcCacheTriggerDialog',
  'showSetup10MinTriggerDialog', 'showSetupDaily15hTriggerDialog', 'showResetPhanTichDialog', 'showResetChiTietCongNoDialog',
  'showWebhookInfoDialog', 'showKhoaDinhDangTextDialog', 'showChonVungDialog', 'showGenerateThongSoDialog', 'showKetNoiFileChinhDialog'];
const ENTRY_POINTS = ['doGet', 'onOpen', 'api', 'thongTinDangNhap', 'dangXuat'];

/** Main app (owner deployment) + helpers to act as different visitors. */
function setup() {
  const world = buildWorld();
  const { env, run } = loadCode({ ...world.options, owner: OWNER });
  const actAs = email => { env._identity.activeUser = email; };
  const addUser = (email, vaiTro, trangThai = 'Hoạt động') => {
    actAs(OWNER);
    const res = run('api')('', 'webLuuNguoiDung', [{ email, vaiTro, trangThai }]);
    assert.equal(res.success, true, res.message);
  };
  return { world, env, run, actAs, addUser };
}

/** Runs the generated gateway source as `email` and returns the sso token it links to. */
function loginThroughGateway(run, actAs, email) {
  actAs(OWNER);
  const cfg = run('api')('', 'getCauHinhDangNhapForWeb', []);
  const gwEnv = createGasEnvironment({ owner: 'admin-gateway@hak.test', activeUser: email });
  const ctx = vm.createContext({ ...gwEnv });
  vm.runInContext(cfg.maNguon, ctx);
  const page = vm.runInContext('doGet()', ctx).getContent();
  const m = /\?sso=([^"]+)"/.exec(page);
  assert.ok(m, 'gateway page must link back with ?sso=');
  return decodeURIComponent(m[1]);
}

function openApp(run, actAs, token) {
  actAs('');
  const out = run('doGet')({ parameter: { sso: token } });
  return out.templateVars;
}

test('only entry points and guarded menu functions are callable from the browser', () => {
  const { run } = setup();
  // Apps Script exposes every global function whose name does not end with "_".
  const publicFns = run(`Object.getOwnPropertyNames(globalThis).filter(k => {
    const v = globalThis[k];
    if (typeof v !== 'function' || k.endsWith('_')) return false;
    const src = Function.prototype.toString.call(v);
    return src.startsWith('function ') && !src.includes('[native code]');
  })`);
  assert.deepEqual([...publicFns].sort(), [...ENTRY_POINTS, ...MENU_FUNCTIONS].sort());
  MENU_FUNCTIONS.forEach(n => {
    const body = new RegExp(`^function ${n}\\([^)]*\\) \\{\\n\\s+_yeuCauQuyen_\\(QUYEN\\.`, 'm');
    assert.match(CODE, body, `${n} must start with a permission guard`);
  });
});

test('every browser call has a route, and every route points to a function', () => {
  const { run } = setup();
  const routes = run('API_ROUTES');
  const called = new Set([...INDEX.matchAll(/call\('([A-Za-z0-9_]+)'/g)].map(m => m[1]));
  [...INDEX.matchAll(/fnName:'([A-Za-z0-9_]+)'/g)].forEach(m => called.add(m[1]));
  called.forEach(n => assert.ok(routes[n], `missing route for ${n}`));
  Object.entries(routes).forEach(([n, r]) => {
    assert.equal(typeof r.fn, 'function', n);
    assert.ok(['XEM', 'NGHIEP_VU', 'QUAN_TRI'].includes(r.quyen), n);
  });
});

test('anonymous visitors are rejected, the script owner is always admin', () => {
  const { run, actAs } = setup();
  actAs('');
  assert.throws(() => run('api')('', 'getDashboardStats', []), /^Error: \[AUTH\]/);
  assert.throws(() => run('api')('', 'khongTonTai', []), /không tồn tại/);
  actAs(OWNER);
  const info = run('thongTinDangNhap')('');
  assert.equal(info.daDangNhap, true);
  assert.equal(info.vaiTro, 'ADMIN');
  assert.equal(run('api')('', 'getTriggerStatusForWeb', []).trigger10Min, false);
});

test('Gmail gateway login creates a session with the right role', () => {
  const { world, run, actAs, addUser } = setup();
  addUser(KE_TOAN, 'KE_TOAN');
  const token = loginThroughGateway(run, actAs, KE_TOAN);
  const vars = openApp(run, actAs, token);
  assert.equal(vars.loiDangNhap, '');
  assert.match(vars.phien, /^[0-9a-f]{64}$/);

  actAs('');
  const info = run('thongTinDangNhap')(vars.phien);
  assert.deepEqual([info.daDangNhap, info.email, info.vaiTro], [true, KE_TOAN, 'KE_TOAN']);
  assert.ok(Array.isArray(run('api')(vars.phien, 'getDraftListSummary', [])));
  assert.throws(() => run('api')(vars.phien, 'webSetMainSsId', ['x']), /^Error: \[QUYEN\]/);

  const log = world.main.getSheetByName('NhatKyThaoTac').rows().slice(1);
  assert.ok(log.some(r => r[2] === 'DANG_NHAP' && r[1] === KE_TOAN));
});

test('actions performed through a session are logged with the real email', () => {
  const { world, run, actAs, addUser } = setup();
  addUser(KE_TOAN, 'KE_TOAN');
  const phien = openApp(run, actAs, loginThroughGateway(run, actAs, KE_TOAN)).phien;
  const res = run('api')(phien, 'runXacNhanDNTT', [['B2'], true]);
  assert.equal(res.success, true, res.message);
  const log = world.main.getSheetByName('NhatKyThaoTac').rows().slice(1);
  const entry = log.find(r => r[2] === 'XAC_NHAN_DNTT');
  assert.ok(entry, 'confirmation must be logged');
  assert.equal(entry[1], KE_TOAN);
});

test('view-only role cannot run business actions', () => {
  const { run, actAs, addUser } = setup();
  addUser(XEM, 'XEM');
  const phien = openApp(run, actAs, loginThroughGateway(run, actAs, XEM)).phien;
  assert.ok(run('api')(phien, 'getAppSetupStatus', []));
  assert.throws(() => run('api')(phien, 'createNewPaymentRequest', [{}]), /^Error: \[QUYEN\]/);
  assert.throws(() => run('api')(phien, 'webConfirmPayment', [['A1'], '26/09/2026']), /^Error: \[QUYEN\]/);
});

test('login links are single-use, expire, and cannot be forged', () => {
  const { run, actAs, env, addUser } = setup();
  addUser(KE_TOAN, 'KE_TOAN');
  const token = loginThroughGateway(run, actAs, KE_TOAN);
  assert.ok(openApp(run, actAs, token).phien);
  const replay = openApp(run, actAs, token);
  assert.equal(replay.phien, '');
  assert.match(replay.loiDangNhap, /đã được dùng/);

  const [p64, sig] = token.split('.');
  const forged = openApp(run, actAs, p64 + '.' + sig.slice(0, -2) + 'AA');
  assert.equal(forged.phien, '');
  assert.match(forged.loiDangNhap, /sai chữ ký/);

  const secret = env._props.getProperty('SSO_SECRET');
  const b64 = b => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
  const oldPayload = b64(JSON.stringify({ email: KE_TOAN, exp: Date.now() - 1000, n: 'old-nonce' }));
  const oldSig = b64(createHmac('sha256', secret).update(oldPayload).digest());
  const expired = openApp(run, actAs, oldPayload + '.' + oldSig);
  assert.equal(expired.phien, '');
  assert.match(expired.loiDangNhap, /hết hạn/);
});

test('unregistered and locked accounts are refused', () => {
  const { run, actAs, addUser } = setup();
  const stranger = openApp(run, actAs, loginThroughGateway(run, actAs, 'la@gmail.com'));
  assert.equal(stranger.phien, '');
  assert.match(stranger.loiDangNhap, /chưa được cấp quyền/);

  addUser(KE_TOAN, 'KE_TOAN');
  const phien = openApp(run, actAs, loginThroughGateway(run, actAs, KE_TOAN)).phien;
  addUser(KE_TOAN, 'KE_TOAN', 'Khóa');
  actAs('');
  assert.throws(() => run('api')(phien, 'getDraftListSummary', []), /^Error: \[AUTH\].*khóa/);
});

test('logout ends the session', () => {
  const { run, actAs, addUser } = setup();
  addUser(KE_TOAN, 'KE_TOAN');
  const phien = openApp(run, actAs, loginThroughGateway(run, actAs, KE_TOAN)).phien;
  run('dangXuat')(phien);
  assert.throws(() => run('api')(phien, 'getDraftListSummary', []), /^Error: \[AUTH\].*hết hạn/);
});

test('the owner cannot be demoted and invalid input is rejected', () => {
  const { run, actAs } = setup();
  actAs(OWNER);
  assert.equal(run('api')('', 'webLuuNguoiDung', [{ email: OWNER, vaiTro: 'XEM' }]).success, false);
  assert.equal(run('api')('', 'webLuuNguoiDung', [{ email: 'khong-phai-email', vaiTro: 'XEM' }]).success, false);
  assert.equal(run('api')('', 'webLuuNguoiDung', [{ email: 'a@b.com', vaiTro: 'SUPER' }]).success, false);
  assert.equal(run('api')('', 'webSetCongDangNhapUrl', ['https://evil.example/exec']).success, false);
  assert.equal(run('api')('', 'webSetCongDangNhapUrl', ['https://script.google.com/macros/s/AKfy_abc-123/exec']).success, true);
  assert.equal(run('thongTinDangNhap')('').congDangNhapUrl, 'https://script.google.com/macros/s/AKfy_abc-123/exec');
});

test('fixed admins declared in code are always admin and cannot be changed from the web app', () => {
  const { run, actAs } = setup();
  const fixed = run('QUAN_TRI_CO_DINH');
  assert.ok(fixed.includes('saoluucvhak@gmail.com'));
  actAs('saoluucvhak@gmail.com');
  assert.equal(run('thongTinDangNhap')('').vaiTro, 'ADMIN');
  assert.equal(run('api')('', 'webLuuNguoiDung', [{ email: 'saoluucvhak@gmail.com', vaiTro: 'XEM', trangThai: 'Khóa' }]).success, false);
  const token = loginThroughGateway(run, actAs, 'saoluucvhak@gmail.com');
  assert.match(openApp(run, actAs, token).phien, /^[0-9a-f]{64}$/);
});

test('menu functions check the email of the person using the Sheet', () => {
  const { run, actAs, addUser } = setup();
  actAs('');
  assert.throws(() => run('runProcessDetail')(), /\[AUTH\]/);
  addUser(XEM, 'XEM');
  actAs(XEM);
  assert.throws(() => run('runProcessDetail')(), /\[QUYEN\]/);
  addUser(KE_TOAN, 'KE_TOAN');
  actAs(KE_TOAN);
  assert.equal(typeof run('runProcessDetail')(), 'string');
});

test('doGet no longer runs business actions from a bare link', () => {
  const { run, actAs } = setup();
  actAs('');
  for (const action of ['tach_phieu', 'lap_de_nghi', 'tim_phieu_can', 'tra_cuu_hop_dong']) {
    const out = JSON.parse(run('doGet')({ parameter: { action } }).text);
    assert.equal(out.status, 'error', action);
  }
});

test('changed PhieuCan_DN column layout raises a warning until an admin confirms it', () => {
  const { world, run, actAs } = setup();
  actAs(OWNER);
  run('refreshPhieuCanUnpaidCache_')();
  assert.equal(run('api')('', 'getTriggerStatusForWeb', []).pcHeaderCanhBao, false);
  world.pc.getSheetByName('PhieuCan_DN').data[0][11] = 'Tên KH (đã đổi)';
  run('refreshPhieuCanUnpaidCache_')();
  run('refreshPhieuCanUnpaidCache_')();
  assert.equal(run('api')('', 'getTriggerStatusForWeb', []).pcHeaderCanhBao, true);
  const canhBao = world.main.getSheetByName('NhatKyThaoTac').rows().filter(r => r[2] === 'CANH_BAO_HEADER_PC');
  assert.equal(canhBao.length, 1, 'the warning is logged once, not on every refresh');
  assert.equal(run('api')('', 'webXacNhanHeaderPhieuCanMoi', []).success, true);
  assert.equal(run('api')('', 'getTriggerStatusForWeb', []).pcHeaderCanhBao, false);
});

test('webSuaTenKhachHangPhieuCan renames one weigh ticket in the source and the mirror', () => {
  const { world, run, actAs, addUser } = setup();
  world.pc.getSheetByName('PhieuCan_DN').data.push(pcRow('PC777', 'Ten Cu'));
  actAs(OWNER);
  run('refreshPhieuCanUnpaidCache_')();
  addUser(KE_TOAN, 'KE_TOAN');
  const phien = openApp(run, actAs, loginThroughGateway(run, actAs, KE_TOAN)).phien;
  const res = run('api')(phien, 'webSuaTenKhachHangPhieuCan', ['PC777', 'Ten Moi']);
  assert.equal(res.success, true, res.message);
  const src = world.pc.getSheetByName('PhieuCan_DN').rows(28).find(r => r[22] === 'PC777');
  assert.equal(src[11], 'Ten Moi');
  const mirror = world.draft.getSheetByName('PhieuCan_DN_CHUA_TT_DRAFT').rows(28).find(r => r[22] === 'PC777');
  assert.equal(mirror[11], 'Ten Moi');
});
