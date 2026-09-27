import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

const OWNER = 'owner@hak.test';

function setup() {
  const world = buildWorld();
  const { env, run } = loadCode({ ...world.options, owner: OWNER });
  env._identity.activeUser = OWNER;
  const log = () => world.main.getSheetByName('NhatKyThaoTac').rows().slice(1);
  return { world, run, log };
}

test('business errors reach the user as plain Vietnamese text, without "Error:"', () => {
  const { run } = setup();
  const res = run('api')('', 'createNewPaymentRequest', [{}]);
  assert.equal(res.success, false);
  assert.equal(res.message, 'Thiếu thông tin bắt buộc: hoTenChuRung');
});

test('programming errors show a lookup code only, and the details go to the log', () => {
  const { run, log } = setup();
  // A function that returns {success:false, message} on failure.
  run('refreshAllDraftCaches_ = function () { const x = null; return x.pc; }');
  const res = run('api')('', 'webRefreshPhieuCanCache', []);
  assert.equal(res.success, false);
  const ma = /mã ([0-9A-F]{8})/.exec(res.message);
  assert.ok(ma, res.message);
  assert.doesNotMatch(res.message, /TypeError|null|reading/);
  const entry = log().find(r => r[2] === 'LOI_HE_THONG' && r[3] === ma[1]);
  assert.ok(entry, 'error must be logged with its code');
  assert.match(entry[4], /^TypeError: .*\n/);
  assert.equal(entry[1], OWNER);

  // A function that lets the error escape to the api() router.
  run('API_ROUTES.getDashboardStats.fn = function () { return undefined.x; }');
  assert.throws(() => run('api')('', 'getDashboardStats', []), e => /^Lỗi hệ thống \(mã [0-9A-F]{8}\)/.test(e.message) && !/TypeError/.test(e.message));
  assert.equal(log().filter(r => r[2] === 'LOI_HE_THONG').length, 2);
});

test('login and permission errors pass through the router unchanged', () => {
  const { run } = setup();
  assert.throws(() => run('api')('khong-hop-le', 'getDashboardStats', []), /^Error: \[AUTH\]/);
});

test('an all-digit error code keeps its leading zero in the log (found as a 2% flaky run)', () => {
  const world = buildWorld();
  const { env, run } = loadCode({ ...world.options, owner: OWNER });
  env._identity.activeUser = OWNER;
  env.Utilities.getUuid = () => '01234567-0000-4000-8000-000000000000';
  run('refreshAllDraftCaches_ = function () { const x = null; return x.pc; }');
  assert.match(run('api')('', 'webRefreshPhieuCanCache', []).message, /mã 01234567/);
  const entry = world.main.getSheetByName('NhatKyThaoTac').rows().slice(1).find(r => r[2] === 'LOI_HE_THONG');
  assert.equal(entry[3], '01234567');
});
