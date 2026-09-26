import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

/** Code.gs with a fake Gemini API: `alive` = models that answer, `listed` = what ListModels returns. */
function setup({ alive = [], listed = [] } = {}) {
  const world = buildWorld();
  const { env, run } = loadCode(world.options);
  const calls = [];
  const reply = obj => ({ getContentText: () => JSON.stringify(obj) });
  run('globalThis').UrlFetchApp = {
    fetch(url) {
      const list = /\/models\?/.test(url);
      const m = /\/models\/([^:]+):generateContent/.exec(url);
      calls.push(list ? 'LIST' : m[1]);
      if (list) return reply({ models: listed.map(n => ({ name: 'models/' + n, supportedGenerationMethods: n.includes('embedding') ? ['embedContent'] : ['generateContent'] })) });
      return alive.includes(m[1])
        ? reply({ candidates: [{ content: { parts: [{ text: 'Chào bạn (' + m[1] + ')' }] } }] })
        : reply({ error: { message: m[1] + ' is no longer available' } });
    }
  };
  env._props.setProperty('GEMINI_API_KEY', 'k');
  const ask = () => run('TRA_LOI_CHATBOT_')('Xin chào', []);
  return { env, run, calls, ask };
}

test('models come from the admin setting, in order, and the working one is remembered', () => {
  const { env, run, calls, ask } = setup({ alive: ['gemini-b'] });
  assert.equal(run('webSetGeminiModels_')('gemini-a, models/gemini-b;  <script>').success, true);
  assert.equal(env._props.getProperty('GEMINI_MODELS'), 'gemini-a, gemini-b');

  const r = ask();
  assert.equal(r.khongDungAI, false);
  assert.match(r.traLoi, /gemini-b/);
  assert.deepEqual(calls, ['gemini-a', 'gemini-b']);
  assert.equal(env._props.getProperty('GEMINI_MODEL'), 'gemini-b');

  calls.length = 0;
  ask();
  assert.deepEqual(calls, ['gemini-b'], 'the last working model is tried first');
});

test('when every configured model is retired, available models are discovered from Google', () => {
  const listed = ['gemini-8.5-flash-lite', 'gemini-9.0-flash-preview-01', 'gemini-9.0-flash', 'text-embedding-9', 'gemini-9.0-pro'];
  const { env, run, calls, ask } = setup({ alive: ['gemini-9.0-flash'], listed });
  run('webSetGeminiModels_')('gemini-old');
  const r = ask();
  assert.equal(r.khongDungAI, false);
  assert.deepEqual(calls, ['gemini-old', 'LIST', 'gemini-9.0-flash']);
  assert.equal(env._props.getProperty('GEMINI_MODEL'), 'gemini-9.0-flash');

  const found = run('webDoModelGemini_')();
  assert.deepEqual([...found.models], ['gemini-9.0-flash', 'gemini-8.5-flash-lite']);
});

test('saving an empty list goes back to the defaults; nothing works -> fallback answer', () => {
  const { env, run, ask } = setup();
  run('webSetGeminiModels_')('');
  assert.equal(env._props.getProperty('GEMINI_MODELS'), null);
  const s = run('getChatbotSettingsForWeb_')();
  assert.equal(s.coApiKey, true);
  assert.deepEqual([...s.models], []);
  assert.ok(s.modelsMacDinh.length > 0);
  const r = ask();
  assert.equal(r.khongDungAI, true);
  assert.match(r.traLoi, /AI đang lỗi/);
});
