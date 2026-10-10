import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCode } from '../gas/loadCode.mjs';
import { buildWorld } from '../gas/fixtures.mjs';

// M-04: Công nợ theo khách hàng = CCCD + Tên.
//   Hợp đồng: 2 người "Nguyen Van A" (CCCD 048...111 và 049...222), "Le Thi B" (048...333).
//   Phiếu cân: P1 Nguyen Van A 1tr (đã TT, hồ sơ CCCD 111) · P2 Nguyen Van A 2tr (chưa vào hồ sơ)
//              P3 "Lê Thị B" 5tr (đã TT, hồ sơ ghi "Le Thi B" CCCD 333) · P4 "Le Thi B" 0,7tr (chưa vào hồ sơ)
//              P5 Tran Van C 0,3tr (không có hợp đồng)
const A1 = '048000000111', A2 = '049000000222', B = '048000000333';
const NGAY = new Date('2026-09-10T03:00:00Z');

function world() {
  const w = buildWorld();
  const hd = w.hd.getSheetByName('HD_NCC');
  const hdRow = (soHD, ten, cccd) => { const r = new Array(31).fill(''); r[2] = soHD; r[4] = ten; r[6] = cccd; return r; };
  hd.data.push(hdRow('HD01', 'Nguyen Van A', A1), hdRow('HD02', 'NGUYEN VAN A', A2), hdRow('HD03', 'Le Thi B', B));

  const pc = w.pc.getSheetByName('PhieuCan_DN');
  pc.data = [pc.data[0]];
  const pcRow = (so, ten, tien) => { const r = new Array(28).fill(''); r[0] = so; r[1] = NGAY; r[9] = 1000; r[11] = ten; r[22] = so; r[25] = tien; return r; };
  pc.data.push(pcRow('P1', 'Nguyen Van A', 1e6), pcRow('P2', 'Nguyen Van A', 2e6), pcRow('P3', 'Lê Thị B', 5e6),
    pcRow('P4', 'Le Thi B', 7e5), pcRow('P5', 'Tran Van C', 3e5));

  const ct = w.main.getSheetByName('DNTT_GK_DN_CT');
  const ctRow = (so, ten, cccd, tien) => { const r = new Array(22).fill(''); r[1] = 'X'; r[3] = ten; r[4] = cccd; r[11] = so; r[16] = tien; r[18] = 'Y'; r[19] = 'HD'; r[20] = NGAY; return r; };
  ct.data.push(ctRow('P1', 'Nguyen Van A', A1, 1e6), ctRow('P3', 'Le Thi B', B, 5e6));
  // Nháp: chỉ các hồ sơ không liên quan
  return { w, ...loadCode(w.options) };
}

const F = '2026-09-01', T = '2026-09-30';
const theoKhoa = rows => Object.fromEntries(rows.map(r => [r.khoa, r]));

test('debt is grouped by CCCD + name following the agreed rule', () => {
  const { run } = world();
  const rows = run('_computeDebtByCustomerLive_')(F, T);
  const k = theoKhoa(rows);
  assert.deepEqual(Object.keys(k).sort(), [`${A1}|NGUYENVANA`, `${B}|LETHIB`, 'TRUNG_TEN|NGUYENVANA', '|TRANVANC'].sort());
  // 1. phiếu đã vào hồ sơ theo CCCD của hồ sơ
  assert.equal(k[`${A1}|NGUYENVANA`].congNo, 0);
  // "Lê Thị B" (phiếu) và "Le Thi B" (hồ sơ) là 1 người: nhập 5tr + 0,7tr, đã trả 5tr
  assert.deepEqual([k[`${B}|LETHIB`].giaTriNhapLuyKe, k[`${B}|LETHIB`].daTTLuyKe, k[`${B}|LETHIB`].congNo], [5.7e6, 5e6, 7e5]);
  assert.equal(k[`${B}|LETHIB`].cccd, B);
  // 2. phiếu chưa vào hồ sơ, tên có 2 CCCD -> trùng tên
  assert.equal(k['TRUNG_TEN|NGUYENVANA'].trungTen, true);
  assert.equal(k['TRUNG_TEN|NGUYENVANA'].congNo, 2e6);
  assert.equal(k['TRUNG_TEN|NGUYENVANA'].cccd, '');
  // 3. không có hợp đồng -> CCCD trống
  assert.deepEqual([k['|TRANVANC'].cccd, k['|TRANVANC'].congNo], ['', 3e5]);
});

test('the detail ledger opens by CCCD + name key and old name-only keys still work', () => {
  const { run } = world();
  const res = run('getDebtLedgerDetail_')('customer', `${B}|LETHIB`, T);
  assert.equal(res.success, true);
  assert.equal(res.cccd, B);
  assert.deepEqual([res.tongNo, res.tongCo, res.duCuoiKy], [5.7e6, 5e6, 7e5]);
  const cu = run('getDebtLedgerDetail_')('customer', 'Lê Thị B', T);
  assert.deepEqual([cu.tongNo, cu.tongCo], [5e6, 0]);
});

test('comparison with the old name-only method: same total, lists what changed', () => {
  const { run } = world();
  const d = run('getDoiChieuCongNoCccd_')(F, T);
  assert.equal(d.tongCu, 3e6);
  assert.equal(d.tongMoi, 3e6);
  const ten = Array.from(d.khacBiet, o => o.ten).sort();
  assert.deepEqual(ten, ['Le Thi B', 'Lê Thị B', 'Nguyen Van A'].sort());
  const a = d.khacBiet.find(o => o.ten === 'Nguyen Van A');
  assert.equal(a.dongMoi.length, 2);
  assert.equal(a.congNoCu, 2e6);
});

test('the Công Nợ snapshot keeps CCCD leading zeros and an old-format snapshot is recomputed', () => {
  const { run, w } = world();
  const snap = () => w.draft.getSheetByName('CongNoKhachHang_DRAFT');
  const { fDate: F, tDate: T } = run('_defaultCongNoRange_')(); // chỉ khoảng mặc định có bản tổng hợp
  const lan1 = run('getDebtByCustomer_')(F, T);
  const lan2 = run('getDebtByCustomer_')(F, T); // đọc lại từ snapshot
  assert.deepEqual(JSON.parse(JSON.stringify(lan2)), JSON.parse(JSON.stringify(lan1)));
  assert.equal(theoKhoa(lan2)[`${B}|LETHIB`].cccd, B);

  // Snapshot do bản cũ ghi (không có cột CCCD/khóa) -> tính lại, không trả dữ liệu thiếu khóa.
  snap().data = [['khachHang', 'klNhapTrongKy', 'giaTriNhapTrongKy', 'daTTTrongKy', 'klNhapLuyKe', 'giaTriNhapLuyKe', 'daTTLuyKe', 'congNo'], ['Cu', 0, 0, 0, 0, 0, 0, 1]];
  const lan3 = run('getDebtByCustomer_')(F, T);
  assert.ok(lan3.every(r => r.khoa), 'every row has a key');
});
