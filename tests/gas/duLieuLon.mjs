// Dữ liệu cỡ lớn (mặc định ~1 năm: 10.000 phiếu cân, 9.000 dòng sổ CT đã chốt, 330 hợp đồng, 30 hồ sơ
// Nháp) dùng chung cho test hiệu năng và bộ đo tests/perf/doHieuNang.mjs.
import { buildWorld } from './fixtures.mjs';

const blank = n => new Array(n).fill('');
const ngay = i => new Date(Date.UTC(2026, 0, 1 + Math.floor(i / 35), 3));
export { ngay as ngayThuI };

export function duLieuLon({ N_PC = 10000, N_CT = 9000, N_HD = 330, N_NHAP = 30 } = {}) {
  const w = buildWorld();
  const pc = w.pc.getSheetByName('PhieuCan_DN'), ct = w.main.getSheetByName('DNTT_GK_DN_CT'), h112 = w.main.getSheetByName('DNTT_GK_DN_112');
  const src = w.main.getSheetByName('DNTT_GK_DN'), ctd = w.main.getSheetByName('ChiTietDNTT'), nh = w.updateNh.getSheetByName('Update_NganHang_DN');
  const hd = w.hd.getSheetByName('HD_NCC'), stk = w.hd.getSheetByName('HD_STK');
  for (let k = 0; k < N_HD; k++) {
    const soHD = String(20260000000 + k), r = blank(31);
    r[2] = "'" + soHD; r[3] = ngay(k); r[4] = 'CHU RUNG ' + k; r[6] = "'0490" + String(k).padStart(8, '0'); r[25] = 500; r[29] = 'ID' + k; r[30] = 'Đang Thực Hiện'; hd.data.push(r);
    const s = blank(9); s[2] = 'CHU RUNG ' + k; s[3] = r[6]; s[5] = "'42302" + String(k).padStart(8, '0'); s[6] = 'AGRIBANK'; s[8] = "'" + soHD; stk.data.push(s);
  }
  let id = 0;
  for (let i = 0; i < N_PC; i++) {
    const so = `${i}/2026/NK`, k = i % N_HD, p = blank(28), daTra = i < N_CT;
    p[0] = String(i); p[1] = ngay(i); p[9] = 12000; p[11] = 'CHU RUNG ' + k; p[22] = so; p[23] = 1750000; p[25] = 21000000; p[27] = daTra ? 'Y' : ''; pc.data.push(p);
    if (!daTra) continue;
    const ma = 'H' + (id++).toString(16).padStart(7, 'a'), soHD = String(20260000000 + k);
    const c = blank(22); c[0] = ma + '-1'; c[1] = ma; c[2] = ngay(i); c[3] = 'CHU RUNG ' + k; c[4] = "'049"; c[7] = "'423"; c[11] = "'" + so; c[12] = 12; c[16] = 21000000; c[18] = 'Y'; c[19] = "'" + soHD; c[20] = ngay(i + 2); ct.data.push(c);
    const h = blank(23); h[0] = ma; h[1] = ngay(i); h[2] = 'CHU RUNG ' + k; h[6] = 21000000; h[8] = "'" + soHD; h[16] = ngay(i); h22(h, ma); h112.data.push(h);
    const s = blank(18); s[0] = ma; s[3] = 'CHU RUNG ' + k; s[12] = ma; s[13] = "'" + soHD; s[17] = 'Y'; src.data.push(s);
    const d = blank(28); d[0] = ma; d[1] = '1'; d[2] = "'" + so; d[3] = ngay(i + 2); d[8] = 'CHU RUNG ' + k; d[21] = 21000000; d[26] = 'Y'; ctd.data.push(d);
    const m = blank(33); m[2] = '05/03/2026'; m[4] = "'" + so; m[24] = 21000000; nh.data.push(m);
  }
  function h22(h, ma) { h[22] = "'" + ma + '_112'; }
  // Nháp: N_NHAP hồ sơ, phiếu chưa trả cuối danh sách.
  const dct = w.draft.getSheetByName('DNTT_GK_DN_CT_DRAFT'), d112 = w.draft.getSheetByName('DNTT_GK_DN_112_DRAFT'), dsrc = w.draft.getSheetByName('DNTT_GK_DN_DRAFT');
  dct.data = [dct.data[0]]; d112.data = [d112.data[0]]; dsrc.data = [dsrc.data[0]]; ctd.data = ctd.data.filter(r => r[26] !== 'N');
  for (let j = 0; j < N_NHAP; j++) {
    const i = N_CT + j, k = i % N_HD, so = `${i}/2026/NK`, ma = 'n' + j.toString(16).padStart(7, 'b'), soHD = String(20260000000 + k);
    const c = blank(22); c[0] = ma + '-1'; c[1] = ma; c[2] = ngay(i); c[3] = 'CHU RUNG ' + k; c[7] = "'42302" + String(k).padStart(8, '0'); c[10] = 1; c[11] = so; c[12] = 12; c[16] = 21000000; c[19] = "'" + soHD; dct.data.push(c);
    const h = blank(24); h[0] = ma; h[1] = ngay(i); h[2] = 'CHU RUNG ' + k; h[3] = h[2]; h[4] = 'AGRIBANK'; h[5] = c[7]; h[6] = 21000000; h[8] = "'" + soHD; h[17] = 500; h[22] = ma + '_112'; h[23] = ''; d112.data.push(h);
    const s = blank(18); s[0] = ma; s[3] = 'CHU RUNG ' + k; s[9] = 12000; s[10] = so; s[12] = ma; s[13] = "'" + soHD; dsrc.data.push(s);
  }
  return w;
}
