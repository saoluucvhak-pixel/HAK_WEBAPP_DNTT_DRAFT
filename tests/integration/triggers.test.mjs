import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Trigger tự động (7:30/13:00, 15:00, 10 phút) do Google chạy, không qua web app:
// không có phiên đăng nhập, người chạy có thể không có trong danh sách phân quyền.
// Phân quyền chỉ áp dụng cho lời gọi từ trình duyệt (api) - trigger phải luôn chạy.
const TRIGGER = ['dailyRefreshAllCaches_', 'daily15hRefresh_', 'refreshAllDraftCaches10Min_'];

for (const [moTa, nguoiChay] of [['no signed-in user', ''], ['an account without any role', 'la@gmail.com']]) {
  test(`scheduled triggers run with ${moTa}`, () => {
    const w = buildWorld();
    const { run, env } = loadCode({ ...w.options, owner: 'owner@hak.test' });
    env._identity.activeUser = nguoiChay;
    TRIGGER.forEach(t => assert.doesNotThrow(() => run(t)(), t));
    const log = w.main.getSheetByName('NhatKyThaoTac').rows().slice(1);
    assert.ok(['REFRESH_ALL_CACHE', 'DAILY_REFRESH_ALL', 'DAILY_15H_REFRESH'].every(a => log.some(r => r[2] === a)), 'each trigger did its work');
    assert.ok(!log.some(r => /LOI_HE_THONG|quyền|đăng nhập/i.test(r[2] + ' ' + r[4])), 'no permission or system error');
  });
}
