// Loads Code.gs into an isolated V8 context backed by the in-memory GAS mock.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { createGasEnvironment } from './mock.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
// HAK_CODE_GS lets you run the same suite against another revision of Code.gs.
const SOURCE = readFileSync(process.env.HAK_CODE_GS || path.join(ROOT, 'Code.gs'), 'utf8');

/**
 * @returns {{ env, run: (expr: string) => any }}
 * `run` evaluates an expression inside the script scope, so top-level
 * const/let declarations of Code.gs (utils, CFG, PC_COL...) are reachable.
 */
export function loadCode(options = {}) {
  const env = createGasEnvironment(options);
  const context = vm.createContext({ ...env, Date, Math, JSON, Set, Map });
  vm.runInContext(SOURCE, context, { filename: 'Code.gs' });
  // Trên Google mỗi lần gọi (1 lần bấm / 1 trigger) là 1 LƯỢT CHẠY mới: biến toàn cục (vd
  // bộ nhớ trong lượt _DA_DOC_TRONG_LUOT_) bắt đầu trống. Mỗi lần test gọi 1 hàm cũng vậy.
  const luotMoi = () => vm.runInContext("typeof _DA_DOC_TRONG_LUOT_ === 'object' && _DA_DOC_TRONG_LUOT_.clear()", context);
  const run = expr => {
    const v = vm.runInContext(expr, context);
    return typeof v === 'function' ? (...a) => { luotMoi(); return v(...a); } : v;
  };
  return { env, run };
}
