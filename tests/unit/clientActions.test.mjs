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
  registered.forEach(n => assert.match(INDEX, new RegExp(`^function ${n}\\(`, 'm'), `${n} must be a top-level function`));
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
