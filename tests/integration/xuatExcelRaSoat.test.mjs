import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// Rà TỰ ĐỘNG mọi file xuất Excel (người dùng hỏi 28/09/2026: "định dạng cột ngày khi kết xuất Excel
// chưa, khóa số 0 đầu của chuỗi khi kết xuất Excel đã rà chưa"). Chạy đủ 10 hàm xuất trên dữ liệu có
// số 0 đầu, rồi theo TIÊU ĐỀ cột kiểm tra:
//  - cột mã (Số TK, CCCD, Số HĐ, Số phiếu cân, TK trích nợ / thu phí): ô khóa "@" và giá trị là chữ còn số 0 đầu;
//  - cột ngày của BÁO CÁO: ngày thật, định dạng theo Vùng xuất. Mẫu nhập liệu (file UNC ngân hàng,
//    sheet XuatMISA) giữ ngày dạng chữ theo Vùng xuất.
const STK = '0071000123456', SO_HD = '00123', CCCD = '048123456789', CCCD_TH = '012345678901';
const MA = /^(Số TK|Số tài khoản|SoTK|TkNo|TkPhi|CCCD|Số HĐ|Số hợp đồng|Số phiếu cân)/i;
const NGAY = /^(Ngày|Thời gian)/;

function theGioi(xuat) {
  const w = buildWorld();
  const n = new Date(), homNay = new Date(n.getTime() + 7 * 3600e3).toISOString().slice(0, 10);
  const nhapLuc = new Date(n.getTime() - 3600e3);
  w.draft.getSheetByName('DNTT_GK_DN_CT_DRAFT').data.slice(1).forEach(r => { r[2] = nhapLuc; r[4] = "'" + CCCD; r[7] = "'" + STK; r[19] = "'" + SO_HD; });
  w.draft.getSheetByName('DNTT_GK_DN_112_DRAFT').data.slice(1).forEach(r => { r[1] = nhapLuc; r[5] = "'" + STK; r[8] = "'" + SO_HD; r[16] = new Date(homNay + 'T03:00:00Z'); });
  w.draft.getSheetByName('DNTT_GK_DN_DRAFT').data.slice(1).forEach(r => { r[4] = "'" + CCCD; r[8] = "'" + STK; r[13] = "'" + SO_HD; });
  // Hợp đồng 00123 (HD_NCC: [2] Số HĐ, [4] Họ tên, [5] Địa chỉ, [6] CCCD, [10] Người UQ, [11] CCCD UQ, [18] Địa chỉ rừng).
  const hd = Array(31).fill(''); hd[2] = "'" + SO_HD; hd[4] = 'Nguyen Van A'; hd[5] = 'Que Son'; hd[6] = "'" + CCCD; hd[10] = 'Nguyen Van A'; hd[11] = "'" + CCCD_TH; hd[18] = 'Rung 1'; hd[30] = 'Đang Thực Hiện';
  w.hd.getSheetByName('HD_NCC').data.push(hd);
  const stk = Array(9).fill(''); stk[2] = 'Nguyen Van A'; stk[5] = "'" + STK; stk[6] = 'BIDV'; stk[8] = "'" + SO_HD;
  w.hd.getSheetByName('HD_STK').data.push(stk);
  w.pc.getSheetByName('PhieuCan_DN').data.slice(1).forEach(r => { r[1] = new Date(homNay + 'T01:00:00Z'); });
  // Phiếu cân chưa thanh toán có số 0 đầu (Công nợ phiếu cân liệt kê).
  const pc0 = w.pc.getSheetByName('PhieuCan_DN').data[1].slice(); pc0[0] = "'00450"; pc0[22] = "'00450"; pc0[27] = ''; pc0[26] = ''; pc0[24] = '';
  w.pc.getSheetByName('PhieuCan_DN').data.push(pc0);
  const code = loadCode({ ...w.options, owner: 'owner@hak.test' });
  if (xuat) code.env.PropertiesService.getScriptProperties().setProperty('EXPORT_REGION_LOCALE', xuat);
  const files = [];
  const mo = (ten, kq) => {
    assert.ok(kq && kq.success !== false, `${ten}: ${kq && kq.message}`);
    const url = kq.url || kq.excelUrl;
    files.push({ ten, ss: code.env.SpreadsheetApp.openById(/\/d\/([^/]+)/.exec(url)[1]) });
  };
  return { w, homNay, files, mo, ...code };
}

function chayMoiFileXuat(t) {
  const { run, mo, homNay } = t;
  const dauThang = homNay.slice(0, 8) + '01';
  mo('Báo cáo ĐNTT (Nháp)', run('exportBaoCaoDNTTFromDraft_')(['A1']));
  mo('UNC nộp ngân hàng', run('webCreateUNCFromDraft_')(['A1'], homNay, '', ''));
  assert.match(run('runConfirmPayment_')(['A1'], homNay), /^✅/);
  mo('Báo cáo ĐNTT (đã chốt)', run('createFinalReportFromFilteredData_')(run('get112ViewData_')(dauThang, homNay), `${dauThang} - ${homNay}`));
  mo('MISA', run('exportMisaTheoNgayExcel_')(dauThang, homNay));
  mo('Báo cáo UNC', run('exportLichSuUNCExcel_')(dauThang, homNay));
  mo('Chi tiết', run('exportChiTietDNTTDaChotExcel_')(dauThang, homNay));
  mo('Tình hình thanh toán', run('exportTinhHinhThanhToanExcel_')(dauThang, homNay, {}));
  mo('Công nợ phiếu cân', run('exportChiTietCongNoPhieuCanExcel_')(homNay, {}));
  mo('Phân tích', run('exportPhanTichNhapTTBaoCao_')(dauThang, homNay));
  mo('Đối soát tên', run('exportDoiSoatTenKhachHangExcel_')([{ soPhieuCan: '0099', soHD: SO_HD, chuRungCT: 'A', khachHangPC: 'B' }]));
}

/** Dòng tiêu đề đầu tiên có ít nhất 1 cột mã hoặc cột ngày; dữ liệu = các dòng sau tới dòng trống / TỔNG CỘNG. */
const x0 = o => o[0].f;
function bang(sh) {
  const rows = sh.rows();
  const h = rows.findIndex(r => r.filter(v => typeof v === 'string' && (MA.test(v) || NGAY.test(v) || /^(STT|Số phiếu cân)$/.test(v))).length >= 1 && new Set(r.filter(v => v !== '')).size >= 3);
  if (h < 0) return null;
  const du = [];
  for (let i = h + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r.some(v => v !== '' && v !== null && v !== undefined) || /TỔNG CỘNG/.test(r.join('|'))) { if (du.length) break; else continue; }
    du.push({ dong: i + 1, r });
  }
  return { tieuDe: rows[h], du };
}

for (const [xuat, fmt] of [['VN', 'dd/MM/yyyy'], ['US', 'MM/dd/yyyy']]) {
  test(`every Excel export: code columns keep leading zeros (text "@"), date columns are real dates by the export region (${xuat})`, () => {
    const t = theGioi(xuat);
    chayMoiFileXuat(t);
    const daKiem = { ma: 0, ngay: 0, chuMau: 0 };
    t.files.forEach(({ ten, ss }) => ss.getSheets().forEach(sh => {
      const mauNhap = ten === 'UNC nộp ngân hàng' || sh.getName() === 'XuatMISA';
      if (sh.getName() === 'XuatMISA') {
        // Mẫu nhập MISA: tiêu đề chép từ Update_NganHang_DN - kiểm theo vị trí cột mã / ngày của mẫu.
        const cotChu = t.run('MISA_COT_CHU');
        sh.rows(33).slice(1).forEach((r, i) => cotChu.forEach(c => {
          assert.equal(sh.getRange(i + 2, c + 1).getNumberFormat(), '@', `${ten} › ${sh.getName()} col ${c + 1}`);
          assert.equal(typeof r[c], r[c] === '' ? 'string' : 'string', `${ten} col ${c + 1} = ${r[c]}`);
        }));
        const r = sh.rows(33)[1];
        assert.equal(r[12], STK); assert.equal(r[9], CCCD); assert.equal(r[32], SO_HD);
        assert.equal(r[2], t.run('_formatNgayXuat_')(new Date(t.homNay + 'T05:00:00Z')), 'template date = text by the export region');
        daKiem.chuMau++;
        return;
      }
      const b = bang(sh);
      if (!b || !b.du.length) return;
      b.tieuDe.forEach((td, c) => {
        if (typeof td !== 'string') return;
        const o = b.du.map(({ dong, r }) => ({ v: r[c], f: sh.getRange(dong, c + 1).getNumberFormat() })).filter(x => x.v !== '' && x.v !== null && x.v !== undefined);
        if (MA.test(td)) {
          o.forEach(x => {
            assert.equal(x.f, '@', `${ten} › ${sh.getName()} › "${td}": text format`);
            assert.equal(typeof x.v, 'string', `${ten} › ${sh.getName()} › "${td}": ${x.v} lost its leading zeros`);
          });
          if (o.length) { daKiem.ma++; (daKiem.ds ||= []).push(`${ten}|${sh.getName()}|MÃ|${td}|${o.map(x => x.v).slice(0, 1)}`); }
          if (/Số TK|Số tài khoản|SoTK/i.test(td)) o.forEach(x => assert.equal(x.v, STK, `${ten} › "${td}"`));
          if (/Số HĐ|Số hợp đồng/i.test(td)) o.forEach(x => assert.equal(x.v, SO_HD, `${ten} › "${td}"`));
          if (/CCCD Chủ rừng/i.test(td)) o.forEach(x => assert.equal(x.v, CCCD, `${ten} › "${td}"`));
          if (ten === 'Công nợ phiếu cân' && /Số phiếu cân/.test(td)) assert.ok(o.some(x => x.v === '00450'), `${ten}: ${o.map(x => x.v)}`);
        } else if (NGAY.test(td) && !mauNhap) {
          o.forEach(x => {
            assert.ok(x.v instanceof Date, `${ten} › ${sh.getName()} › "${td}": ${JSON.stringify(x.v)} is not a real date`);
            assert.ok(x.f === fmt || x.f === fmt + ' HH:mm:ss', `${ten} › ${sh.getName()} › "${td}": format ${x.f}`);
          });
          if (o.length) { daKiem.ngay++; (daKiem.ds ||= []).push(`${ten}|${sh.getName()}|NGÀY|${td}|${x0(o)}`); }
        }
      });
      if (ten === 'UNC nộp ngân hàng') {
        const r = sh.rows(16)[3];
        assert.deepEqual([r[2], r[4], r[14]].map(v => typeof v), ['string', 'string', 'string'], 'TkNo / SoTK / TkPhi text');
        assert.equal(r[4], STK);
        assert.equal(typeof r[15], 'string', 'bank template date stays text');
        assert.equal(sh.getRange(4, 16).getNumberFormat(), '@');
      }
    }));
    assert.equal(t.files.length, 10, 'all 10 exports ran');
    assert.ok(daKiem.ma >= 15, `code columns checked: ${daKiem.ma}`);
    assert.ok(daKiem.ngay >= 10, `date columns checked: ${daKiem.ngay}`);
    assert.equal(daKiem.chuMau, 1);
  });
}
