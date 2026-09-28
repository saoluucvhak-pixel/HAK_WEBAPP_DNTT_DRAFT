// In-memory mock of the Apps Script services used by Code.gs.
// Every write is recorded in sheet.writes so tests can assert which cells were touched.
import { randomUUID, createHmac } from 'node:crypto';

const toBuffer = v => (typeof v === 'string' ? Buffer.from(v, 'utf8') : Buffer.from(v.map(b => b & 0xff)));
const b64WebSafe = v => toBuffer(v).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
const fromB64WebSafe = s => Array.from(Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64'));

/** Prefix stored for text that Google Sheets would have turned into a formula. */
export const FORMULA_MARK = '⚠FORMULA:';

const colToNum = (letters) => letters.split('').reduce((n, ch) => n * 26 + (ch.charCodeAt(0) - 64), 0);

function parseA1(a1) {
  const m = /^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/.exec(a1);
  if (!m) throw new Error('Unsupported A1 notation: ' + a1);
  const c1 = colToNum(m[1]), r1 = Number(m[2]);
  const c2 = m[3] ? colToNum(m[3]) : c1, r2 = m[4] ? Number(m[4]) : r1;
  return { row: r1, col: c1, numRows: r2 - r1 + 1, numCols: c2 - c1 + 1 };
}

export class MockRange {
  constructor(sheet, row, col, numRows = 1, numCols = 1) {
    if (row < 1 || col < 1 || numRows < 1 || numCols < 1) {
      throw new Error(`Invalid range ${row},${col},${numRows},${numCols} on ${sheet.name}`);
    }
    Object.assign(this, { sheet, row, col, numRows, numCols });
  }
  getValues() {
    const out = [];
    for (let r = 0; r < this.numRows; r++) {
      const src = this.sheet.data[this.row - 1 + r] || [];
      const line = [];
      for (let c = 0; c < this.numCols; c++) {
        const v = src[this.col - 1 + c];
        line.push(v === undefined ? '' : v);
      }
      out.push(line);
    }
    return out;
  }
  getValue() { return this.getValues()[0][0]; }
  setValues(values) {
    if (values.length !== this.numRows || values.some(r => r.length !== this.numCols)) {
      throw new Error(`setValues dimension mismatch on ${this.sheet.name}: range ${this.numRows}x${this.numCols}, data ${values.length}x${values[0] && values[0].length}`);
    }
    this.sheet._record('setValues', this);
    values.forEach((line, r) => line.forEach((v, c) => this.sheet._set(this.row + r, this.col + c, v)));
    return this;
  }
  setValue(v) {
    this.sheet._record('setValue', this);
    for (let r = 0; r < this.numRows; r++) for (let c = 0; c < this.numCols; c++) this.sheet._set(this.row + r, this.col + c, v);
    return this;
  }
  clearContent() {
    this.sheet._record('clearContent', this);
    for (let r = 0; r < this.numRows; r++) for (let c = 0; c < this.numCols; c++) this.sheet._set(this.row + r, this.col + c, '');
    return this;
  }
  // Định dạng số/ngày lưu theo từng ô (sheet.formats) để test kiểm tra được cột ngày/chữ.
  _eachCell(fn) { for (let r = 0; r < this.numRows; r++) for (let c = 0; c < this.numCols; c++) fn(this.row + r, this.col + c, r, c); }
  setNumberFormat(fmt) { const f = (this.sheet.formats ||= new Map()); this._eachCell((r, c) => f.set(r + ',' + c, fmt)); return this; }
  setNumberFormats(m) { const f = (this.sheet.formats ||= new Map()); this._eachCell((r, c, i, j) => f.set(r + ',' + c, m[i][j])); return this; }
  getNumberFormat() { return (this.sheet.formats && this.sheet.formats.get(this.row + ',' + this.col)) || ''; }
  getNumberFormats() {
    const f = this.sheet.formats || new Map();
    return Array.from({ length: this.numRows }, (_, i) => Array.from({ length: this.numCols }, (_, j) => f.get((this.row + i) + ',' + (this.col + j)) || ''));
  }
  setFontWeight() { return this; }
  setBackground() { return this; }
  setFontColor() { return this; }
  setHorizontalAlignment() { return this; }
  setWrap() { return this; }
  setFontSize() { return this; }
  setFontStyle() { return this; }
  setFontFamily() { return this; }
  setBorder() { return this; }
  setVerticalAlignment() { return this; }
  setBackgrounds() { return this; }
  merge() { return this; }
  setWrapStrategy() { return this; }
  // Formulas written on purpose (setFormula*) are stored as-is, never flagged.
  setFormula(f) { this.sheet._record('setFormula', this); this.sheet.data[this.row - 1] = this.sheet.data[this.row - 1] || []; this.sheet.data[this.row - 1][this.col - 1] = f; return this; }
  setFormulaR1C1(f) { return this.setFormula(f); }
  getRow() { return this.row; }
  getColumn() { return this.col; }
  getNumRows() { return this.numRows; }
  getNumColumns() { return this.numCols; }
}

export class MockSheet {
  constructor(name, rows = [], parent = null) {
    this.name = name;
    this.data = rows.map(r => r.slice());
    this.parent = parent;
    this.writes = [];
  }
  _record(op, range) {
    this.writes.push({ op, row: range.row, col: range.col, numRows: range.numRows, numCols: range.numCols });
  }
  _set(row, col, value) {
    // Like Google Sheets on an unformatted cell: a leading apostrophe forces text and is
    // not stored; a numeric-looking string WITHOUT it becomes a number ("0123" -> 123);
    // text starting with = + - @ WITHOUT it is parsed as a formula (flagged, see FORMULA_MARK).
    let v = value;
    if (typeof value === 'string') {
      if (value.startsWith("'")) v = value.slice(1);
      else if (/^-?\d+(\.\d+)?$/.test(value)) v = Number(value);
      else if (/^[=+\-@]/.test(value)) v = FORMULA_MARK + value;
    }
    while (this.data.length < row) this.data.push([]);
    const line = this.data[row - 1];
    while (line.length < col) line.push('');
    line[col - 1] = v;
  }
  getName() { return this.name; }
  setName(n) { this.name = n; return this; }
  getParent() { return this.parent; }
  getSheetId() { return this.name; }
  getLastRow() {
    for (let r = this.data.length; r >= 1; r--) {
      if ((this.data[r - 1] || []).some(v => v !== '' && v !== null && v !== undefined)) return r;
    }
    return 0;
  }
  getLastColumn() {
    let max = 0;
    this.data.forEach(line => {
      for (let c = line.length; c >= 1; c--) {
        if (line[c - 1] !== '' && line[c - 1] !== null && line[c - 1] !== undefined) { max = Math.max(max, c); break; }
      }
    });
    return max;
  }
  getMaxRows() { return Math.max(1000, this.data.length); }
  getMaxColumns() { return Math.max(26, this.getLastColumn()); }
  getRange(a, b, c, d) {
    if (typeof a === 'string') {
      const p = parseA1(a);
      return new MockRange(this, p.row, p.col, p.numRows, p.numCols);
    }
    return new MockRange(this, a, b, c === undefined ? 1 : c, d === undefined ? 1 : d);
  }
  getRangeList(a1s) {
    const ranges = a1s.map(a1 => this.getRange(a1));
    return {
      getRanges: () => ranges,
      setValue: (v) => { ranges.forEach(r => r.setValue(v)); },
      clearContent: () => { ranges.forEach(r => r.clearContent()); },
      setNumberFormat: () => {}
    };
  }
  getDataRange() {
    return new MockRange(this, 1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn()));
  }
  appendRow(values) {
    const row = this.getLastRow() + 1;
    this.writes.push({ op: 'appendRow', row, col: 1, numRows: 1, numCols: values.length });
    values.forEach((v, i) => this._set(row, i + 1, v));
    return this;
  }
  deleteRow(row) { return this.deleteRows(row, 1); }
  deleteRows(row, count) {
    this.writes.push({ op: 'deleteRows', row, col: 1, numRows: count, numCols: 0 });
    this.data.splice(row - 1, count);
    return this;
  }
  insertRowsAfter() { return this; }
  clear() {
    this.writes.push({ op: 'clear', row: 1, col: 1, numRows: this.data.length, numCols: 0 });
    this.data = [];
    return this;
  }
  clearContents() { return this.clear(); }
  setFrozenRows() { return this; }
  // Độ rộng cột / chiều cao dòng lưu lại để test kiểm tra bố cục bảng xuất.
  setColumnWidths(c, n, w) { for (let i = 0; i < n; i++) (this.colWidths ||= {})[c + i] = w; return this; }
  setColumnWidth(c, w) { (this.colWidths ||= {})[c] = w; return this; }
  setRowHeights(r, n, h) { for (let i = 0; i < n; i++) (this.rowHeights ||= {})[r + i] = h; return this; }
  setRowHeight(r, h) { (this.rowHeights ||= {})[r] = h; return this; }
  autoResizeColumns() { return this; }
  autoResizeRows() { return this; }
  hideSheet() { return this; }
  /** Rows as plain arrays (row 1 = header), padded to the given width. */
  rows(width) {
    return this.data.slice(0, this.getLastRow()).map(line => {
      const out = line.slice();
      while (width && out.length < width) out.push('');
      return width ? out.slice(0, width) : out;
    });
  }
}

export class MockSpreadsheet {
  constructor(id, name) {
    this.id = id;
    this.name = name || id;
    this.sheets = new Map();
  }
  addSheet(name, rows) {
    const sh = new MockSheet(name, rows, this);
    this.sheets.set(name, sh);
    return sh;
  }
  getSheetByName(name) { return this.sheets.get(name) || null; }
  // Developer Metadata cấp spreadsheet (đủ cho cờ khóa sổ dùng chung với QL_NHAPKHO).
  addDeveloperMetadata(key, value, visibility) {
    const list = (this.metadata ||= []);
    const md = { key, value, visibility, getKey: () => key, getValue: () => value, getVisibility: () => visibility,
      remove: () => { const i = list.indexOf(md); if (i >= 0) list.splice(i, 1); } };
    list.push(md);
    return this;
  }
  createDeveloperMetadataFinder() {
    let key = null;
    const finder = { withKey: k => { key = k; return finder; }, find: () => (this.metadata || []).filter(m => key === null || m.key === key) };
    return finder;
  }
  insertSheet(name) { return this.addSheet(name || 'Sheet' + (this.sheets.size + 1), []); }
  getSheets() { return Array.from(this.sheets.values()); }
  deleteSheet(sh) { this.sheets.delete(sh.getName()); }
  getId() { return this.id; }
  getName() { return this.name; }
  getUrl() { return 'https://docs.google.com/spreadsheets/d/' + this.id + '/edit'; }
  getSpreadsheetLocale() { return this.locale || 'vi_VN'; }
  getSpreadsheetTimeZone() { return this.timeZone || 'Asia/Ho_Chi_Minh'; }
  setSpreadsheetLocale(v) { this.locale = v; }
  setSpreadsheetTimeZone(v) { this.timeZone = v; }
}

const pad = (n, w = 2) => String(n).padStart(w, '0');

function formatDate(date, tz, fmt) {
  const offsetH = /\+7|Ho_Chi_Minh|Bangkok/.test(String(tz)) ? 7 : 0;
  const d = new Date(date.getTime() + offsetH * 3600 * 1000);
  const map = {
    yyyy: String(d.getUTCFullYear()), MM: pad(d.getUTCMonth() + 1), dd: pad(d.getUTCDate()),
    HH: pad(d.getUTCHours()), mm: pad(d.getUTCMinutes()), ss: pad(d.getUTCSeconds())
  };
  return fmt.replace(/yyyy|MM|dd|HH|mm|ss/g, t => map[t]);
}

function makeStore() {
  const m = new Map();
  return {
    getProperty: k => (m.has(k) ? m.get(k) : null),
    setProperty(k, v) { m.set(k, String(v)); return this; },
    deleteProperty(k) { m.delete(k); return this; },
    getProperties: () => Object.fromEntries(m),
    setProperties(obj) { Object.entries(obj).forEach(([k, v]) => m.set(k, String(v))); return this; },
    _map: m
  };
}

function makeCache() {
  const m = new Map();
  return {
    get: k => (m.has(k) ? m.get(k) : null),
    put: (k, v) => { m.set(k, v); },
    remove: k => { m.delete(k); },
    getAll: keys => Object.fromEntries(keys.filter(k => m.has(k)).map(k => [k, m.get(k)])),
    putAll: obj => { Object.entries(obj).forEach(([k, v]) => m.set(k, v)); },
    removeAll: keys => { keys.forEach(k => m.delete(k)); },
    _map: m
  };
}

/**
 * Builds a fresh GAS-like global environment.
 * owner = script owner (Session.getEffectiveUser); activeUser = who Google says is
 * calling (owner by default; '' simulates another Gmail user of an "execute as me" web app).
 */
export function createGasEnvironment({ activeSpreadsheet, spreadsheets = [], properties = {}, owner = 'owner@hak.test', activeUser, serviceUrl = 'https://script.google.com/macros/s/MAIN/exec', uiAvailable = false } = {}) {
  const identity = { owner, activeUser: activeUser === undefined ? owner : activeUser, uiAvailable };
  const registry = new Map();
  spreadsheets.forEach(ss => registry.set(ss.id, ss));
  const active = activeSpreadsheet || new MockSpreadsheet('ACTIVE', 'File Nháp');
  registry.set(active.id, active);

  const scriptProps = makeStore();
  scriptProps.setProperties(properties);
  const scriptCache = makeCache();
  const lock = { held: 0, waitLock() { this.held++; }, tryLock() { this.held++; return true; }, releaseLock() { this.held = Math.max(0, this.held - 1); }, hasLock() { return this.held > 0; } };

  const SpreadsheetApp = {
    DeveloperMetadataVisibility: { DOCUMENT: 'DOCUMENT', PROJECT: 'PROJECT' },
    getActive: () => active,
    getActiveSpreadsheet: () => active,
    openById: id => {
      if (!registry.has(id)) throw new Error('Mock: unknown spreadsheet id ' + id);
      return registry.get(id);
    },
    create: name => {
      const ss = new MockSpreadsheet('NEW_' + registry.size, name);
      ss.addSheet('Sheet1', []);
      registry.set(ss.id, ss);
      return ss;
    },
    flush: () => {},
    WrapStrategy: { WRAP: 'WRAP', CLIP: 'CLIP', OVERFLOW: 'OVERFLOW' },
    getUi: () => {
      if (!identity.uiAvailable) throw new Error('Cannot call SpreadsheetApp.getUi() from this context.');
      return {
        alert: () => 'OK',
        prompt: () => ({ getSelectedButton: () => 'CANCEL', getResponseText: () => '' }),
        showModalDialog: (html, title) => { identity.lastDialog = { title, content: html.getContent() }; },
        createMenu: () => ({ addItem() { return this; }, addSeparator() { return this; }, addToUi() {} }),
        Button: { OK: 'OK', YES: 'YES', CANCEL: 'CANCEL' },
        ButtonSet: { OK: 'OK', OK_CANCEL: 'OK_CANCEL', YES_NO: 'YES_NO' }
      };
    }
  };

  const htmlOutput = (content) => {
    const out = { content, title: '', setTitle(t) { this.title = t; return this; }, addMetaTag() { return this; }, setXFrameOptionsMode(m) { this.xframe = m; return this; }, setWidth() { return this; }, setHeight() { return this; }, getContent() { return this.content; } };
    return out;
  };

  const env = {
    SpreadsheetApp,
    PropertiesService: { getScriptProperties: () => scriptProps, getUserProperties: () => makeStore(), getDocumentProperties: () => makeStore() },
    CacheService: { getScriptCache: () => scriptCache, getUserCache: () => makeCache(), getDocumentCache: () => makeCache() },
    LockService: { getScriptLock: () => lock, getDocumentLock: () => lock, getUserLock: () => lock },
    Utilities: {
      formatDate,
      getUuid: () => randomUUID(),
      sleep: () => {},
      newBlob: (s) => ({ getDataAsString: () => toBuffer(typeof s === 'string' ? s : s).toString('utf8'), getBytes: () => Array.from(toBuffer(s)) }),
      computeDigest: () => [],
      computeHmacSha256Signature: (value, key) => Array.from(createHmac('sha256', toBuffer(key)).update(toBuffer(value)).digest()).map(b => (b > 127 ? b - 256 : b)),
      base64Encode: s => toBuffer(s).toString('base64'),
      base64EncodeWebSafe: s => b64WebSafe(s),
      base64DecodeWebSafe: s => fromB64WebSafe(s),
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      Charset: { UTF_8: 'UTF_8' }
    },
    Session: {
      getActiveUser: () => ({ getEmail: () => identity.activeUser }),
      getEffectiveUser: () => ({ getEmail: () => identity.owner }),
      getScriptTimeZone: () => 'Asia/Ho_Chi_Minh'
    },
    DriveApp: {
      getFolderById: () => ({ addFile() {}, createFile() { return {}; } }),
      getFileById: () => ({ getId: () => 'file', getUrl: () => 'url', moveTo() {}, getParents: () => ({ hasNext: () => false }) }),
      getRootFolder: () => ({ removeFile() {} })
    },
    ScriptApp: { getProjectTriggers: () => [], newTrigger: () => ({ timeBased: () => ({}) }), deleteTrigger() {}, getService: () => ({ getUrl: () => serviceUrl }) },
    HtmlService: {
      createTemplateFromFile: (name) => {
        const tpl = { file: name, evaluate() { const out = htmlOutput(''); out.templateVars = { ...tpl }; return out; } };
        return tpl;
      },
      createHtmlOutput: (content) => htmlOutput(content),
      createHtmlOutputFromFile: (name) => htmlOutput(name),
      XFrameOptionsMode: { ALLOWALL: 'ALLOWALL', DEFAULT: 'DEFAULT' }
    },
    ContentService: { createTextOutput: s => ({ text: s, setMimeType() { return this; } }), MimeType: { JSON: 'JSON' } },
    UrlFetchApp: { fetch: () => { throw new Error('Mock: network disabled'); } },
    Logger: { log: () => {} },
    console: { log: () => {}, warn: () => {}, error: () => {}, info: () => {} },
    _registry: registry,
    _identity: identity,
    _lock: lock,
    _props: scriptProps,
    _cache: scriptCache
  };
  return env;
}
