// Builds a small but complete data set (File Nháp + File Chính + external files)
// for workflow tests. Column positions follow Code.gs (0-based comments).
import { MockSpreadsheet } from './mock.mjs';

export const IDS = {
  MAIN: 'MAIN_SS',
  PC: '1vqMVxccBA7zlAMHrGsVBydGFwZJ6QuDZW10zJ74V29g',
  HD: '1cv11ORWuAF3Sit4f-kA0xrP6-ab4SF-7LEdkCvGi_gI',
  UPDATE_NH: '1id7m092q2OVY4dJgcavzPM5HNO14_QIUburVN7y7szg'
};

const blank = n => new Array(n).fill('');

export function pcRow(soPhieu, khachHang) {
  const r = blank(28);
  r[0] = soPhieu; r[9] = 1000; r[11] = khachHang; r[22] = soPhieu; r[23] = 1000; r[25] = 1000000;
  return r;
}

export function draftCtRow(idKey, stt, soPhieu, chuRung) {
  const r = blank(22);
  r[0] = `${idKey}-CT${stt}`; r[1] = idKey; r[3] = chuRung; r[10] = stt; r[11] = soPhieu;
  r[12] = 1; r[16] = 1000000; r[19] = "'HD01";
  return r;
}

export function draft112Row(idKey, chuRung, soTien, trangThai) {
  const r = blank(24);
  r[0] = idKey; r[2] = chuRung; r[3] = chuRung; r[4] = 'BIDV'; r[5] = "'0123456789";
  r[6] = soTien; r[8] = "'HD01"; r[18] = '1'; r[22] = idKey + '_112'; r[23] = trangThai;
  return r;
}

export function draftSrcRow(idKey, chuRung) {
  const r = blank(18);
  r[0] = idKey; r[3] = chuRung; r[12] = idKey; r[13] = "'HD01";
  return r;
}

export function chiTietNRow(idKey, soPhieu, chuRung) {
  const r = blank(28);
  r[0] = idKey; r[1] = '1'; r[2] = "'" + soPhieu; r[8] = chuRung; r[21] = 1000000; r[26] = 'N';
  return r;
}

const header = (prefix, n) => Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`);

export function buildWorld() {
  const draft = new MockSpreadsheet('DRAFT_SS', 'File Nháp');
  draft.addSheet('DNTT_GK_DN_CT_DRAFT', [header('ct', 22),
    draftCtRow('A1', 1, 'PC001', 'Nguyen Van A'),
    draftCtRow('B2', 1, 'PC003', 'Tran Thi B'),
    draftCtRow('A1', 2, 'PC002', 'Nguyen Van A')]);
  draft.addSheet('DNTT_GK_DN_112_DRAFT', [header('h', 24),
    draft112Row('A1', 'Nguyen Van A', 2000000, 'Đang ĐNTT'),
    draft112Row('B2', 'Tran Thi B', 1000000, '')]);
  draft.addSheet('DNTT_GK_DN_DRAFT', [header('s', 18), draftSrcRow('A1', 'Nguyen Van A'), draftSrcRow('B2', 'Tran Thi B')]);

  const main = new MockSpreadsheet(IDS.MAIN, 'File Chính');
  const unrelatedSrc = blank(18); unrelatedSrc[0] = 'OLD1'; unrelatedSrc[3] = 'Khach Cu'; unrelatedSrc[17] = 'Y';
  main.addSheet('DNTT_GK_DN', [header('s', 18), unrelatedSrc]);
  main.addSheet('DNTT_GK_DN_CT', [header('ct', 22)]);
  main.addSheet('DNTT_GK_DN_112', [header('h', 23)]);
  main.addSheet('ChiTietDNTT', [header('c', 28),
    chiTietNRow('A1', 'PC001', 'Nguyen Van A'),
    chiTietNRow('A1', 'PC002', 'Nguyen Van A')]);

  const pc = new MockSpreadsheet(IDS.PC, 'Phiếu Cân');
  pc.addSheet('PhieuCan_DN', [header('pc', 28),
    pcRow('PC001', 'Nguyen Van A'),
    pcRow('PC999', '=HYPERLINK("x")'),
    pcRow('PC002', 'Nguyen Van A'),
    pcRow('PC003', 'Tran Thi B')]);

  const hd = new MockSpreadsheet(IDS.HD, 'Hợp Đồng');
  hd.addSheet('HD_NCC', [header('n', 31)]);
  // Tài khoản khai báo theo hợp đồng (HD_STK: C tên, D CCCD, E người UQ, F STK, G ngân hàng, I Số HĐ) -
  // Lưu / Sửa hồ sơ chỉ nhận STK có ở đây (2026.9.45).
  const stkRow = (soHD, stk) => { const r = blank(9); r[2] = 'Chu rung'; r[5] = stk; r[6] = 'BIDV'; r[8] = soHD; return r; };
  hd.addSheet('HD_STK', [header('k', 9), stkRow('HD01', "'0123"), stkRow('HD01', "'0123456789"), stkRow('00123', "'0099887766")]);
  hd.addSheet('DM_NG', [header('g', 3)]);

  const updateNh = new MockSpreadsheet(IDS.UPDATE_NH, 'Update NH');
  updateNh.addSheet('Update_NganHang_DN', [header('m', 33)]);

  return {
    draft, main, pc, hd, updateNh,
    options: {
      activeSpreadsheet: draft,
      spreadsheets: [main, pc, hd, updateNh],
      properties: { MAIN_SS_ID: IDS.MAIN }
    }
  };
}

/** True when any recorded write on the sheet touches the given 1-based row. */
export function rowWasWritten(sheet, row) {
  return sheet.writes.some(w => w.op !== 'deleteRows' && row >= w.row && row < w.row + w.numRows);
}
