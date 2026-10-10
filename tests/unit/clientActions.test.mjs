import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { INDEX, clientFunction } from '../gas/clientSource.mjs';

const HANDLER_WITH_DATA = /\bon[a-z]+=("[^"]*|'[^']*)(\$\{esc\(|JSON\.stringify)/;

test('inline handlers never embed data values', () => {
  const bad = INDEX.split('\n').map((l, i) => [i + 1, l.trim()]).filter(([, l]) => HANDLER_WITH_DATA.test(l));
  assert.deepEqual(bad, []);
});

test('every action used in markup is registered in HANH_DONG', () => {
  const registry = /const HANH_DONG = \{([^}]*)\}/.exec(INDEX);
  assert.ok(registry, 'HANH_DONG not found');
  const registered = new Set(registry[1].split(/[\s,]+/).filter(Boolean));
  const used = new Set([
    ...[...INDEX.matchAll(/\$\{hanhDong\('([A-Za-z0-9_]+)'/g)].map(m => m[1]),
    ...[...INDEX.matchAll(/\$\{hanhDongKhi\('[a-z]+', '([A-Za-z0-9_]+)'/g)].map(m => m[1])
  ]);
  used.forEach(n => assert.ok(registered.has(n), `${n} is used but not registered`));
  registered.forEach(n => assert.match(INDEX, new RegExp(`^(async )?function ${n}\\(`, 'm'), `${n} must be a top-level function`));
});

test('values with quotes and markup reach the handler unchanged', () => {
  const ctx = vm.createContext({});
  vm.runInContext(['esc', 'hanhDongKhi', 'hanhDong'].map(clientFunction).join('\n'), ctx);
  const tricky = `O'Brien "</div><img src=x onerror=alert(1)>" \\ ');alert(1);//`;
  const attrs = ctx.hanhDong('goToLedgerFor', 'customer', tricky);
  // The markup must stay a set of quoted attributes: no raw quote or angle bracket inside a value.
  assert.match(attrs, /^data-hd="goToLedgerFor" data-hd-su-kien="click" data-ts="[^"<>]*"$/);
  // What the browser gives back through dataset is the HTML-decoded attribute value.
  const ts = /data-ts="([^"]*)"/.exec(attrs)[1]
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  assert.deepEqual(JSON.parse(ts), ['customer', tricky]);
});

test('records selected in another tab are counted so the action bar can warn about them', () => {
  const ctx = vm.createContext({});
  ['_khongDau', '_khopTenDraft', '_thuocTabDraft', '_draftDangHien', '_hoSoChonOTabKhac_'].forEach(f => vm.runInContext(clientFunction(f), ctx));
  ctx.state = {
    draftStatusFilter: 'dang_dntt', draftTuKhoa: '',
    draftSelected: new Set(['A1', 'B2']),
    draftList: [{ idKey: 'A1', trangThaiKey: 'dang_dntt', chuRung: 'Nguyễn Văn A' }, { idKey: 'B2', trangThaiKey: 'cho_dntt', chuRung: 'Trần Thị B' }, { idKey: 'C3', trangThaiKey: 'cho_dntt', chuRung: 'Lê C' }]
  };
  assert.deepEqual(vm.runInContext('_hoSoChonOTabKhac_().map(r => r.idKey)', ctx), ['B2']);
  ctx.state.draftStatusFilter = 'all';
  assert.equal(vm.runInContext('_hoSoChonOTabKhac_().length', ctx), 0);
  ctx.state.draftTuKhoa = 'tran thi';   // bộ lọc tên ẩn A1 đang chọn
  assert.deepEqual(vm.runInContext('_hoSoChonOTabKhac_().map(r => r.idKey)', ctx), ['A1'], 'selected but hidden by the name filter');
});

test('draft list tab "has an amount" = waiting + requested records (home page "Sẵn sàng chốt")', () => {
  const ctx = vm.createContext({});
  vm.runInContext(clientFunction('_thuocTabDraft'), ctx);
  const tab = (trangThaiKey, sanSangChot, f) => { ctx.r = { trangThaiKey, sanSangChot }; ctx.f = f; return vm.runInContext('_thuocTabDraft(r, f)', ctx); };
  assert.equal(tab('cho_dntt', true, 'san_sang'), true);
  assert.equal(tab('dang_dntt', true, 'san_sang'), true);
  assert.equal(tab('cho_tinh', false, 'san_sang'), false);
  assert.equal(tab('cho_tinh', false, 'cho_tinh'), true);
  assert.equal(tab('cho_tinh', false, 'all'), true);
});

test('draft list name filter ignores accents, case and extra spaces, on owner or payee', () => {
  const ctx = vm.createContext({});
  ['_khongDau', '_khopTenDraft'].forEach(f => vm.runInContext(clientFunction(f), ctx));
  const khop = (tuKhoa, r) => { ctx.state = { draftTuKhoa: tuKhoa }; ctx.r = r; return vm.runInContext('_khopTenDraft(r)', ctx); };
  const r = { chuRung: 'Nguyễn Văn Đức', nguoiNhan: 'Trần Thị Bích' };
  assert.equal(khop('', r), true);
  assert.equal(khop('nguyen van duc', r), true);
  assert.equal(khop('  NGUYỄN   văn ', r), true);
  assert.equal(khop('bich', r), true, 'payee name matches too');
  assert.equal(khop('le van', r), false);
});
