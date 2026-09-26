// Helpers to test pieces of the browser script in Index.html without a browser.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const INDEX = readFileSync(path.join(ROOT, 'Index.html'), 'utf8');

/**
 * Source of the top-level `function name(...) {...}` in Index.html: the shortest slice
 * ending at a `}` that V8 accepts as a program (strings, templates and regexes handled by V8 itself).
 */
export function clientFunction(name) {
  const start = new RegExp(`^function ${name.replace(/\$/g, '\\$')}\\(`, 'm').exec(INDEX);
  if (!start) throw new Error(`${name} not found in Index.html`);
  for (let end = INDEX.indexOf('}', start.index); end !== -1; end = INDEX.indexOf('}', end + 1)) {
    const src = INDEX.slice(start.index, end + 1);
    try { new vm.Script(src); return src; } catch (e) { /* not complete yet */ }
  }
  throw new Error(`could not parse ${name}`);
}
