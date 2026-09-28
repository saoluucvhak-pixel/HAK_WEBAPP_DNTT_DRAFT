/**
 * ============================================================
 * HỆ THỐNG QUẢN LÝ THANH TOÁN HAK - PHIÊN BẢN 2026.9.42
 * Lịch sử thay đổi: CHANGELOG.md · Kiến trúc: docs/ARCHITECTURE.md
 * ------------------------------------------------------------
 * *** QUAN TRỌNG - CẦN LÀM TRƯỚC KHI DÙNG BẢN NÀY (chỉ 1 LẦN DUY NHẤT
 * cho cả đời dự án - KHÔNG cần lặp lại kể cả khi dán đè code mới sau
 * này) ***
 * SỬA (theo yêu cầu - kiến trúc "gắn liền" ổn định): code này PHẢI được
 * dán vào Apps Script GẮN LIỀN với chính FILE NHÁP (File Nháp = file bạn
 * đang mở Extensions > Apps Script để dán code này) - KHÔNG dán vào File
 * Chính hay 1 file trống nào khác. "File Chính" (DNTT_GK_DN/CT/112/Nhật
 * Ký) là 1 file KHÁC, được tham chiếu qua ID cấu hình sẵn.
 * Trước khi dùng, bạn CHỈ cần:
 *   1. Mở Google Sheet BẤT KỲ (sẽ dùng làm File Nháp), vào Extensions >
 *      Apps Script, dán code này vào.
 *   2. Chạy menu "🚀 QUẢN LÝ HAK" > "🔗 Kết Nối File Chính" (hoặc mục
 *      Cài Đặt trên Web App) - dán URL/ID của File Chính (chứa
 *      DNTT_GK_DN/CT/112/Nhật Ký) vào.
 *   3. XONG. Từ giờ dùng menu/Web App như bình thường - các sheet Draft
 *      cần thiết tự tạo ngay trong file này nếu chưa có.
 * ------------------------------------------------------------
 * THAY ĐỔI SO VỚI BẢN 2026.3:
 *
 * J) KIẾN TRÚC "FILE NHÁP" (DRAFT) RIÊNG BIỆT - THAY ĐỔI LỚN:
 *    - MỤC TIÊU: cho phép xem/sửa/xóa thoải mái ở giai đoạn "Tách
 *      Phiếu" + "Tổng Hợp 112" mà KHÔNG ảnh hưởng dữ liệu chính thức
 *      (DNTT_GK_DN_CT, DNTT_GK_DN_112) hay khóa Phiếu Cân thật. Dữ
 *      liệu chỉ được ghi CHÍNH THỨC (và không thể sửa qua lại nữa) khi
 *      bấm "Chốt Thanh Toán".
 *    - File Nháp là 1 Google Spreadsheet HOÀN TOÀN RIÊNG BIỆT (không
 *      phải tab trong file hiện tại), gồm 2 sheet:
 *        + DNTT_GK_DN_CT_DRAFT  (22 cột - giống schema DNTT_GK_DN_CT)
 *        + DNTT_GK_DN_112_DRAFT (23 cột - giống schema DNTT_GK_DN_112)
 *      Vì đây là 1 Google Sheet bình thường, bạn có thể mở và xem/sửa/
 *      xóa dòng trực tiếp bằng giao diện Sheets - KHÔNG cần thêm giao
 *      diện Web App nào cho việc này.
 *    - Nút 1 "Tách Phiếu": đọc DNTT_GK_DN (nguồn, THẬT) như cũ, nhưng
 *      giờ ghi dòng chi tiết vào DRAFT CT thay vì DNTT_GK_DN_CT thật,
 *      và KHÔNG khóa Phiếu Cân thật. Chỉ APPEND các hồ sơ CHƯA có trong
 *      Draft CT (tránh tạo trùng / đè lên dòng bạn đã sửa tay trong
 *      Nháp) - muốn tách lại 1 hồ sơ, phải xóa hồ sơ đó khỏi Nháp trước
 *      (menu "🗑️ Xóa 1 Hồ Sơ Khỏi Nháp").
 *    - Nút 2 "Tổng Hợp 112": đọc DRAFT CT, tính Số tiền / lũy kế theo
 *      hợp đồng / diễn giải P..., ghi vào DRAFT 112 (không đụng dữ liệu
 *      thật). Lũy kế theo hợp đồng được tính gộp cả lịch sử ĐÃ CHỐT
 *      (DNTT_GK_DN_CT thật) LẪN các hồ sơ khác đang nằm trong Nháp cho
 *      cùng hợp đồng, để "Còn lại" không bị tính sai khi có nhiều hồ sơ
 *      cùng chờ xử lý. Cột Ngân hàng chỉ tự điền khi đang trống (không
 *      ghi đè nếu bạn đã sửa tay trong Nháp); các cột khác (Số tiền,
 *      Nội dung CK, lũy kế...) LUÔN được tính lại mỗi lần bấm nút này
 *      (giống hành vi cũ của bản chính thức).
 *    - "KHÓA TẠM" Số phiếu cân trong lúc còn ở Nháp: KHÔNG dùng bảng
 *      khóa riêng. Một Số phiếu cân được coi là "đang bị giữ" nếu nó
 *      ĐANG XUẤT HIỆN trong DRAFT CT. Vì vậy: xóa dòng khỏi Draft CT
 *      (qua menu xóa, hoặc xóa tay trực tiếp trong Google Sheet) sẽ TỰ
 *      ĐỘNG giải phóng Số phiếu cân đó, không cần bước mở khóa riêng.
 *      findAvailablePhieuCan_() và createNewPaymentRequest_() đều kiểm
 *      tra thêm điều kiện này trước khi cho phép chọn 1 phiếu cân.
 *    - Nút 3 "Chốt Thanh Toán": đọc các hồ sơ đã chọn TỪ FILE NHÁP (chỉ
 *      chốt được hồ sơ đã có Số tiền > 0 trong Draft 112, tức đã chạy
 *      xong "Tổng Hợp 112" - hồ sơ chưa đủ điều kiện sẽ bị bỏ qua kèm
 *      cảnh báo, không chốt dữ liệu nửa vời). Với các hồ sơ hợp lệ:
 *        a. APPEND dòng chi tiết vào DNTT_GK_DN_CT thật (Ngày CK = ngày
 *           vừa nhập khi chốt).
 *        b. APPEND dòng tổng hợp vào DNTT_GK_DN_112 thật.
 *        c. Cập nhật DNTT_GK_DN (nguồn) thật: Đóng TT / Y / ngày TT.
 *        d. Khóa VĨNH VIỄN các Phiếu Cân liên quan (như bản cũ).
 *        e. XÓA các dòng vừa chốt khỏi File Nháp (Draft CT + Draft
 *           112) - dọn dẹp Nháp, các hồ sơ CHƯA chọn vẫn còn nguyên.
 *    - "Thêm Mới Đề Nghị Thanh Toán": vẫn ghi ngay vào DNTT_GK_DN
 *      (nguồn, THẬT - vì đây chỉ là "đơn xin", không phải số liệu tiền
 *      bạc), nhưng phần chi tiết (từng Số phiếu cân) và placeholder
 *      tổng hợp giờ được tạo THẲNG vào File Nháp (tương đương tự chạy
 *      "Tách Phiếu" cho riêng hồ sơ đó) - nhờ vậy hồ sơ mới tạo lập tức
 *      xuất hiện trong Nháp, đã giữ tạm Số phiếu cân, và có thể bấm
 *      "Tổng Hợp 112" để tính tiền như hồ sơ tách từ nguồn bình thường.
 *    - showPayDialog() (hộp thoại nhanh trong Sheet) giờ chọn danh sách
 *      hồ sơ để chốt DỰA TRÊN DRAFT 112 (Số tiền > 0) thay vì dựa trên
 *      cột trạng thái của nguồn như bản cũ (vì cột đó giờ chỉ mang tính
 *      thông tin, không còn phản ánh "đã sẵn sàng chốt" nữa).
 *    - THÊM MENU: "📂 Mở File Nháp", "🗑️ Xóa 1 Hồ Sơ Khỏi Nháp", và
 *      "⚙️ Khởi Tạo File Nháp" (chỉ hiện khi CFG.DRAFT_SS_ID còn trống).
 *    - GIẢ ĐỊNH CẦN LƯU Ý: với hồ sơ đến từ Google Form (không qua
 *      "Thêm Mới"), code KHÔNG có thông tin "Ngày HĐ" để tự điền vào
 *      Draft 112 khi tự tạo placeholder (trước đây, nếu có 1 trigger/
 *      quy trình khác điền sẵn "Ngày HĐ" thẳng vào DNTT_GK_DN_112 THẬT
 *      trước khi chạy Tổng Hợp 112, quy trình đó KHÔNG có trong file
 *      code này nên không thể tái tạo lại). Bạn có thể bổ sung tay cột
 *      "Ngày HĐ" ngay trong Draft 112 nếu cần, trước khi Chốt Thanh
 *      Toán - vì đây chỉ dùng để hiển thị diễn giải, không ảnh hưởng
 *      tính toán Số tiền.
 *
 * (Các ghi chú thay đổi C-I của bản 2026.3 vẫn còn hiệu lực và đã được
 * giữ nguyên trong các hàm liên quan, không lặp lại chi tiết ở đây.)
 * ============================================================
 */

// ============================================================
// MỚI (mục T - dễ bảo trì): CẤU HÌNH LINK/ID CÁC FILE LIÊN QUAN
// ------------------------------------------------------------
// Gom TOÀN BỘ ID Google Sheet/Drive Folder mà hệ thống cần kết nối tới
// vào 1 CHỖ DUY NHẤT - sau này cần đổi sang file khác (vd thay file
// Phiếu Cân mới, đổi thư mục lưu báo cáo...) chỉ cần sửa đúng 1 dòng ở
// đây, không phải tìm rải rác trong code. Lấy ID từ URL Google Sheet/
// Drive, ví dụ URL "https://docs.google.com/spreadsheets/d/ABC123/edit"
// thì ID là "ABC123".
// ============================================================
const LINKS = {
  PHIEU_CAN_SS_ID: "1vqMVxccBA7zlAMHrGsVBydGFwZJ6QuDZW10zJ74V29g",       // File "Phiếu Cân" (sheet PhieuCan_DN)
  HOP_DONG_SS_ID: "1cv11ORWuAF3Sit4f-kA0xrP6-ab4SF-7LEdkCvGi_gI",        // File "Hợp Đồng" (sheet HD_NCC, HD_STK)
  UPDATE_NGANHANG_SS_ID: "1id7m092q2OVY4dJgcavzPM5HNO14_QIUburVN7y7szg", // File cập nhật Ngân hàng (Update_NganHang_DN)
  BAOCAO_FOLDER_ID: "13_ed2jCP8CgL-UJk0eOn-vIH6LqQElxc"                  // Thư mục Drive lưu file Báo Cáo xuất ra
};

/** Tạo Google Sheet mới ngay trong thư mục báo cáo (thay cho create +
 * addFile + removeFile khỏi thư mục gốc - 2 lệnh DriveApp đã lỗi thời). */
function _taoFileBaoCao_(ten, thuMuc) {
  const ss = SpreadsheetApp.create(ten);
  DriveApp.getFileById(ss.getId()).moveTo(thuMuc || DriveApp.getFolderById(getReportFolderId_()));
  return ss;
}

function _sheetUrl_(id) { return id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : ""; }
function _driveFolderUrl_(id) { return id ? `https://drive.google.com/drive/folders/${id}` : ""; }

/** Danh sách khai báo MỌI link (Sheet/Thư mục Drive) hiện ở "Link các
 * file liên quan" (Cài Đặt) - CHỖ DUY NHẤT, dùng chung cho
 * getConfigLinksForSettings_() (hiển thị), webSetSwappableLink_() (đổi
 * link) và webShareConfigLink_() (chia sẻ cho email khác) để 3 hàm này
 * không bao giờ lệch danh sách/ID nhau. */
function _swappableLinkDefs_() {
  return [
    { key: "MAIN_SS_ID", label: "File Chính (DNTT_GK_DN/CT/112/Nhật Ký)", type: "sheet", fallback: "" },
    { key: null, label: "File Nháp (Draft - file hiện tại, không đổi được qua ID)", type: "sheet" },
    { key: "PC_SS_ID", label: "File Phiếu Cân", type: "sheet", fallback: LINKS.PHIEU_CAN_SS_ID },
    { key: "HD_SS_ID", label: "File Hợp Đồng (HD_NCC / HD_STK)", type: "sheet", fallback: LINKS.HOP_DONG_SS_ID },
    { key: "UPDATE_NH_SS_ID", label: "File Cập Nhật Ngân Hàng", type: "sheet", fallback: LINKS.UPDATE_NGANHANG_SS_ID },
    { key: "DM_NH_SS_ID", label: "File Danh Mục Ngân Hàng (dùng khi tạo UNC)", type: "sheet", fallback: "1v6MlQaMF4N8BoTUqaraInxJFPUKcA7u3z_zVle8cXw8" },
    { key: "REPORT_FOLDER_ID", label: "Thư mục Báo Cáo (Drive)", type: "folder", fallback: LINKS.BAOCAO_FOLDER_ID }
  ];
}
/** ID thật của 1 def trong _swappableLinkDefs_() - File Nháp (key null)
 * LÀ chính file code đang chạy, không lưu ID qua Script Properties như
 * các link khác. */
function _resolveLinkId_(def) {
  if (!def.key) return SpreadsheetApp.getActive().getId(); // File Nháp = chính file đang chạy
  return PropertiesService.getScriptProperties().getProperty(def.key) || def.fallback;
}
/** Mở đối tượng thật (Spreadsheet hoặc Drive Folder) của 1 def - dùng
 * chung cho webShareConfigLink_()/getSharedUsersForLink_()/
 * webRevokeConfigLinkAccess_() để không lặp lại nhánh if(type==="folder")
 * ở nhiều nơi. */
function _openLinkHandle_(def, id) {
  return def.type === "folder" ? DriveApp.getFolderById(id) : SpreadsheetApp.openById(id);
}

/**
 * SỬA (theo yêu cầu - "hiện định dạng cấu hình + cho chọn Google Sheet
 * thay thế để thực hiện ở đơn vị khác"): giờ trả về ĐẦY ĐỦ thông tin
 * cho từng link - key (để đổi qua webSetSwappableLink_), có đổi được
 * không, và trạng thái mở file có thành công không - để giao diện vẽ
 * ngay ô "Đổi" cho MỌI link (trừ File Nháp - vì đó chính là file code
 * đang chạy, không đổi qua ID được).
 */
function getConfigLinksForSettings_() {
  return _swappableLinkDefs_().map(def => {
    let name = "", url = "", ok = false;
    try {
      // SỬA LỖI (rà soát phát hiện): _resolveLinkId_() PHẢI nằm TRONG
      // try này - với def.key null (File Nháp), nó gọi thẳng
      // SpreadsheetApp.getActive().getId() không có bảo vệ riêng (bản cũ
      // trước khi trích thành _resolveLinkId_() có try/catch RIÊNG cho
      // lệnh getActive() này). Để ngoài try sẽ khiến 1 def lỗi làm hỏng
      // luôn CẢ DANH SÁCH 7 link (toàn bộ .map() throw), thay vì chỉ
      // đúng dòng "Không mở được" cho riêng def đó.
      const id = _resolveLinkId_(def);
      if (def.type === "folder") {
        const f = DriveApp.getFolderById(id);
        name = f.getName(); url = _driveFolderUrl_(id); ok = true;
      } else {
        const ss = SpreadsheetApp.openById(id);
        name = ss.getName(); url = ss.getUrl(); ok = true;
      }
    } catch (e) { name = "⚠️ Không mở được (kiểm tra ID/quyền truy cập)"; }
    if (!def.key) return { key: null, label: def.label, name, url, ok, changeable: false, shareable: ok, type: def.type };
    return { key: def.key, label: def.label, name, url, ok, changeable: true, shareable: ok, type: def.type };
  });
}

/** MỚI: đổi 1 link bất kỳ trong danh sách "Link các file liên quan" -
 * dùng CHUNG 1 hàm cho mọi loại (Sheet hoặc Thư mục Drive) để "thực hiện
 * ở đơn vị khác" chỉ cần đổi đúng link tương ứng, không cần sửa code. */
function webSetSwappableLink_(key, idOrUrl, type) {
  try {
    const clean = String(idOrUrl || "").trim();
    if (!clean) return { success: false, message: "❌ Vui lòng nhập ID hoặc URL." };
    const m = type === "folder" ? clean.match(/\/folders\/([a-zA-Z0-9_-]+)/) : clean.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const finalId = m ? m[1] : clean;
    const name = type === "folder" ? DriveApp.getFolderById(finalId).getName() : SpreadsheetApp.openById(finalId).getName();
    PropertiesService.getScriptProperties().setProperty(key, finalId);
    return { success: true, message: `✅ Đã đổi sang: "${name}".` };
  } catch (e) {
    return { success: false, message: "❌ Không mở được - kiểm tra lại ID/URL và quyền truy cập: " + _loiChoNguoiDung_(e) };
  }
}

/** MỚI (theo yêu cầu - "nút chia sẻ Google Sheet cho mail khác"): chia
 * sẻ 1 link bất kỳ trong "Link các file liên quan" (Cài Đặt) cho 1 email
 * khác - quyền "view" (Chỉ xem) hoặc "edit" (Chỉnh sửa). Dùng CHUNG danh
 * sách _swappableLinkDefs_() với getConfigLinksForSettings_()/
 * webSetSwappableLink_() để không bao giờ chia sẻ nhầm file. Đây là thao
 * tác CẤP QUYỀN TRUY CẬP dữ liệu (kể cả File Chính - dữ liệu tài chính
 * đã chốt) nên luôn ghi log (người thực hiện, chia sẻ file gì, cho ai,
 * quyền gì) để tra cứu lại khi cần. */
function webShareConfigLink_(key, email, role) {
  try {
    const cleanEmail = String(email || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, message: "❌ Email không hợp lệ." };
    }
    const def = _swappableLinkDefs_().find(d => d.key === (key || null));
    if (!def) return { success: false, message: "❌ Không tìm thấy link tương ứng." };
    const id = _resolveLinkId_(def);
    if (!id) return { success: false, message: `❌ "${def.label}" chưa được cấu hình.` };

    const obj = _openLinkHandle_(def, id);
    const quyenEdit = role === "edit";
    if (quyenEdit) obj.addEditor(cleanEmail); else obj.addViewer(cleanEmail);
    const name = obj.getName();
    const nhanQuyen = quyenEdit ? "Chỉnh sửa" : "Chỉ xem";
    logAction_("CHIA_SE_FILE", "-", `Đã chia sẻ "${def.label}" (${name}) cho ${cleanEmail} - quyền: ${nhanQuyen}.`);
    return { success: true, message: `✅ Đã chia sẻ "${name}" cho ${cleanEmail} (quyền: ${nhanQuyen}).` };
  } catch (e) {
    return { success: false, message: "❌ Không chia sẻ được - kiểm tra lại email và quyền quản trị của bạn trên file này: " + _loiChoNguoiDung_(e) };
  }
}

/** MỚI (theo yêu cầu - "xem những mail đã được cấp quyền?"): liệt kê
 * TOÀN BỘ email đang có quyền truy cập trực tiếp (Xem/Chỉnh sửa) 1 link
 * trong "Link các file liên quan" - để biết đã lỡ chia sẻ cho ai, phục
 * vụ thu hồi qua webRevokeConfigLinkAccess_(). Bỏ qua chủ sở hữu file
 * (không hiện, không cho thu hồi qua đây). */
function getSharedUsersForLink_(key) {
  try {
    const def = _swappableLinkDefs_().find(d => d.key === (key || null));
    if (!def) return { success: false, message: "❌ Không tìm thấy link tương ứng." };
    const id = _resolveLinkId_(def);
    if (!id) return { success: false, message: `❌ "${def.label}" chưa được cấu hình.` };

    const obj = _openLinkHandle_(def, id);
    let ownerEmail = "";
    try { ownerEmail = obj.getOwner().getEmail(); } catch (e) {} // 1 số file (vd Shared Drive) có thể không có chủ sở hữu đơn - bỏ qua nếu lỗi
    const editorEmails = obj.getEditors().map(u => u.getEmail()).filter(e => e && e !== ownerEmail);
    const users = editorEmails.map(email => ({ email, role: "edit" }));
    obj.getViewers().map(u => u.getEmail())
      .filter(e => e && e !== ownerEmail && !editorEmails.includes(e))
      .forEach(email => users.push({ email, role: "view" }));
    return { success: true, users };
  } catch (e) {
    return { success: false, message: "❌ Không đọc được danh sách - kiểm tra quyền quản trị của bạn trên file này: " + _loiChoNguoiDung_(e) };
  }
}

/** MỚI (theo yêu cầu - "thu hồi quyền đã cấp"): gỡ 1 email khỏi cả 2
 * danh sách Editor/Viewer của 1 link (gọi cả 2 removeEditor/removeViewer
 * vì không rõ email đang ở quyền nào - lệnh nào không áp dụng thì Google
 * tự bỏ qua, không lỗi). Không cho thu hồi quyền của chủ sở hữu file. */
function webRevokeConfigLinkAccess_(key, email) {
  try {
    const cleanEmail = String(email || "").trim();
    if (!cleanEmail) return { success: false, message: "❌ Thiếu email cần thu hồi." };
    const def = _swappableLinkDefs_().find(d => d.key === (key || null));
    if (!def) return { success: false, message: "❌ Không tìm thấy link tương ứng." };
    const id = _resolveLinkId_(def);
    if (!id) return { success: false, message: `❌ "${def.label}" chưa được cấu hình.` };

    const obj = _openLinkHandle_(def, id);
    let ownerEmail = "";
    try { ownerEmail = obj.getOwner().getEmail(); } catch (e) {}
    if (ownerEmail && cleanEmail.toLowerCase() === ownerEmail.toLowerCase()) {
      return { success: false, message: "❌ Không thể thu hồi quyền của chủ sở hữu file." };
    }
    try { obj.removeEditor(cleanEmail); } catch (e) {}
    try { obj.removeViewer(cleanEmail); } catch (e) {}
    const name = obj.getName();
    logAction_("THU_HOI_QUYEN_FILE", "-", `Đã thu hồi quyền truy cập "${def.label}" (${name}) của ${cleanEmail}.`);
    return { success: true, message: `✅ Đã thu hồi quyền của ${cleanEmail} trên "${name}".` };
  } catch (e) {
    return { success: false, message: "❌ Không thu hồi được - kiểm tra quyền quản trị của bạn trên file này: " + _loiChoNguoiDung_(e) };
  }
}

// ============================================================
// MỚI (mục AC): SHEET "THÔNG SỐ" - bảng tham chiếu link CFG, tên sheet
// nguồn/Draft tương ứng, và các giá trị mặc định trong code - để dễ
// tra cứu/bảo trì mà không cần mở Apps Script Editor. Tạo/cập nhật bằng
// menu "🚀 QUẢN LÝ HAK" > "📋 Tạo/Cập Nhật Sheet Thông Số" (chạy lại bất
// cứ lúc nào để đồng bộ nếu CFG có thay đổi).
// ============================================================
function generateThongSoSheet_() {
  const ss = getMainSs_();
  let sh = ss.getSheetByName("Thông Số");
  if (!sh) sh = ss.insertSheet("Thông Số");
  sh.clear();

  let draftUrl = "";
  try { draftUrl = SpreadsheetApp.getActive().getUrl(); } catch (e) {} // File Nháp = chính file đang chạy

  let row = 1;
  const setTitle = (text, bg) => {
    sh.getRange(row, 1, 1, 4).merge().setValue(text).setFontWeight("bold").setFontSize(12).setBackground(bg || "#4a6b57").setFontColor("#ffffff");
    row++;
  };
  const setHeader = (cols) => {
    sh.getRange(row, 1, 1, cols.length).setValues([cols]).setFontWeight("bold").setBackground("#e8e2d5");
    row++;
  };
  const setRow = (cols) => {
    sh.getRange(row, 1, 1, cols.length).setValues([cols]);
    row++;
  };
  const setLinkRow = (label, url) => {
    sh.getRange(row, 1).setValue(label);
    if (url) sh.getRange(row, 2).setFormula(`=HYPERLINK("${url}";"Mở link")`);
    else sh.getRange(row, 2).setValue("(chưa cấu hình)");
    row++;
  };

  // --- A. LINK CÁC FILE LIÊN QUAN (từ CFG/LINKS) ---
  setTitle("A. LINK CÁC FILE LIÊN QUAN (đang dùng)");
  setHeader(["Tên", "Link"]);
  setLinkRow("File Nháp (Draft - chính là file này đang chạy)", draftUrl);
  // v2026.9.7: link ĐANG DÙNG (đã đổi ở Cài Đặt nếu có), không phải mặc định trong LINKS.
  setLinkRow("File Phiếu Cân (đổi ở Cài Đặt)", _sheetUrl_(CFG.PC_SS_ID));
  setLinkRow("File Hợp Đồng HD_NCC/HD_STK (đổi ở Cài Đặt)", _sheetUrl_(CFG.HD_SS_ID));
  setLinkRow("File Cập Nhật Ngân Hàng (đổi ở Cài Đặt)", _sheetUrl_(CFG.UPDATE_NH_SS_ID));
  setLinkRow("Thư mục Báo Cáo (Drive - có thể đổi ở Cài Đặt)", _driveFolderUrl_(getReportFolderId_()));
  row++;

  // --- B. TÊN DỮ LIỆU THEO SHEET (nguồn thật <-> Draft/mirror) ---
  setTitle("B. TÊN DỮ LIỆU THEO SHEET (nguồn thật ↔ bản Draft/mirror)");
  setHeader(["Loại dữ liệu", "Sheet NGUỒN (thật)", "Sheet DRAFT (mirror, nếu có)", "Ghi chú"]);
  setRow(["Phiếu Cân", `${CFG.PC_SHEET} (File Phiếu Cân)`, CFG.DRAFT_PC_SHEET, "Mirror CHỈ phiếu CHƯA thanh toán (ID_DNTT rỗng)"]);
  setRow(["Hợp Đồng - NCC", `HD_NCC (File Hợp Đồng)`, CFG.DRAFT_HDNCC_SHEET, `Mirror CHỈ hợp đồng Tình Trạng = "Đang Thực Hiện"`]);
  setRow(["Hợp Đồng - STK", `${CFG.HD_STK_SHEET} (File Hợp Đồng)`, CFG.DRAFT_HDSTK_SHEET, "Mirror theo Số HĐ thuộc tập \"Đang Thực Hiện\" ở trên"]);
  setRow(["Tiến Độ Hợp Đồng + Công Nợ theo HĐ (đã ghép)", "(tính từ " + CFG.DNTT_CT + " + " + CFG.DNTT_112 + " thật)", CFG.DRAFT_HDTIENDO_SHEET, "Mục 7: Công Nợ theo Hợp Đồng ghép thẳng vào đây, không còn sheet riêng"]);
  setRow(["Công Nợ theo Khách Hàng", "(tính từ Phiếu Cân + " + CFG.DNTT_CT + " thật)", CFG.DRAFT_CONGNO_KH_SHEET, "Snapshot khoảng ngày mặc định (xem mục D)"]);
  setRow(["Chi tiết đề nghị (CT)", CFG.DNTT_CT + " (sheet chính)", CFG.DRAFT_CT_SHEET, "Hồ sơ đang chờ xử lý (chưa Đóng Thanh Toán)"]);
  setRow(["Đề nghị thanh toán (112)", CFG.DNTT_112 + " (sheet chính)", CFG.DRAFT_112_SHEET, "+ cột 24 \"Trạng Thái ĐNTT\" (chỉ có ở Draft)"]);
  setRow(["Nguồn đơn đề nghị", CFG.DNTT_SRC + " (sheet chính)", CFG.DRAFT_SRC_SHEET, "Mục AI: hồ sơ tạo qua Web App ghi vào Draft trước, copy sang bản chính khi Đóng Thanh Toán"]);
  setRow(["Cập nhật Ngân hàng (import MISA)", "Update_NganHang_DN (File Cập Nhật Ngân Hàng)", "-", "GHI THÊM (append) mỗi khi Đóng Thanh Toán (tự động) hoặc bấm \"Xuất MISA\" thủ công - không còn xóa/ghi lại toàn bộ"]);
  setRow(["Chi tiết ĐNTT đã tính sẵn", CHITIET_DNTT_SHEET + " (sheet chính - bảng con của " + CFG.DNTT_CT + ")", "-", "Ghi N lúc In Báo Cáo ĐNTT, chuyển Y lúc Đóng Thanh Toán - dùng cho tab \"Báo Cáo Thanh Toán Chi Tiết\", tự dọn theo khi Mở Đóng Thanh Toán"]);
  setRow(["Lịch sử tạo UNC", CHITIET_UNC_SHEET + " (sheet chính - bảng con của " + CFG.DNTT_CT + ")", "-", "Ghi thêm mỗi lần Tạo File UNC - dùng cho tab \"Báo Cáo UNC\", tự dọn theo khi Mở Đóng Thanh Toán"]);
  setRow(["Nhật ký thao tác", CFG.LOG_SHEET + " (sheet chính)", "-", "Log mọi thao tác quan trọng"]);
  setRow(["Phân Tích Nhập/TT theo NG-ĐL", "(tính từ Phiếu Cân + " + CFG.DNTT_CT + " thật, đối chiếu DM_NG)", CFG.DRAFT_PHANTICH_SHEET, "Mục 11: lưu dạng dài (1 dòng/ngày/hạng mục), pivot lúc xuất báo cáo"]);
  setRow(["Chi Tiết Công Nợ theo Phiếu Cân", "(tính từ Phiếu Cân)", CFG.DRAFT_CTCN_SHEET, "Mục 11: snapshot \"hôm qua\" - chọn ngày khác sẽ tự tính lại trực tiếp"]);
  row++;

  // --- C. LỊCH CHẠY NỀN (Trigger) ---
  setTitle("C. LỊCH CHẠY NỀN (Trigger tự động)");
  setHeader(["Loại", "Tần suất", "Dữ liệu được làm mới", "Bật bằng"]);
  setRow(["Nhanh", "Mỗi 10 phút, CHỈ 7:30 - 19:00 hàng ngày", "Phiếu Cân chưa TT + HD_NCC + HD_STK (Đang Thực Hiện)", "Menu \"⏱️ Bật Tự Động 10 Phút (7:30-19:00)\""]);
  setRow(["Đầy đủ", "7:30 sáng & 13:00 chiều hàng ngày", "Tất cả mục trên + Tiến Độ Hợp Đồng + Công Nợ snapshot", "Menu \"⏱️ Bật Tự Động Làm Mới Dữ Liệu (7:30 & 13:00)\""]);
  setRow(["Phân tích NG/ĐL", "15:00 hàng ngày (cho NGÀY HÔM TRƯỚC)", "Phân Tích Nhập/TT theo Nguồn Gốc-Đại Lý + Chi Tiết Công Nợ theo Phiếu Cân", "Menu \"⏱️ Bật Tự Động 15h\""]);
  row++;

  // --- D. GIÁ TRỊ MẶC ĐỊNH TRONG CODE ---
  setTitle("D. GIÁ TRỊ MẶC ĐỊNH TRONG CODE (CFG)");
  setHeader(["Tên", "Giá trị", "Ghi chú"]);
  {
    const bankInfo = getCompanyBankInfo_();
    setRow(["Số TK công ty", bankInfo.account, "Cài Đặt > Giá Trị Mặc Định MISA - dùng khi ghi file Import Ngân Hàng"]);
    setRow(["Ngân hàng công ty", bankInfo.name, "Cài Đặt > Giá Trị Mặc Định MISA"]);
    setRow(["Mã ngân hàng công ty", bankInfo.code, "Cài Đặt > Giá Trị Mặc Định MISA"]);
  }
  setRow(["Quy định khoảng ngày Báo Cáo Thanh Toán (Gỗ Keo, Chi Tiết, MISA, UNC)", KHOANG_BAO_CAO.SO_THANG + " tháng/lần xem, xuất", "KHOANG_BAO_CAO.SO_THANG - chọn quá thì báo và không nhận"]);
  setRow(["Giới hạn khoảng ngày Công Nợ", CFG.MAX_REPORT_RANGE_DAYS + " ngày (~3 tháng)", "CFG.MAX_REPORT_RANGE_DAYS - tự co lại nếu chọn khoảng rộng hơn"]);
  setRow(["Khoảng Công Nợ mặc định (snapshot)", "90 ngày gần nhất", "_defaultCongNoRange_() - tính theo giờ GMT+7"]);
  setRow(["Số dòng/trang (phân trang Web App)", "20 dòng/trang", "PAGE_SIZE trong Index.html"]);
  row++;

  sh.setColumnWidths(1, 4, 260);
  sh.setFrozenRows(0);
  logAction_("TAO_SHEET_THONG_SO", "-", "Đã tạo/cập nhật sheet Thông Số.");
  return "✅ Đã tạo/cập nhật sheet \"Thông Số\".";
}

function showGenerateThongSoDialog() {
  _yeuCauQuyen_(QUYEN.QUAN_TRI);
  const ui = SpreadsheetApp.getUi();
  try {
    ui.alert(generateThongSoSheet_());
  } catch (e) {
    ui.alert("❌ Lỗi: " + _loiChoNguoiDung_(e));
  }
}

const CFG = {
  // SỬA (theo yêu cầu - "đổi link để thực hiện ở đơn vị khác"): 3 ID này
  // giờ ĐỌC TỪ Script Properties trước (nếu đã đổi ở Cài Đặt), CHỈ dùng
  // giá trị "cứng" trong LINKS làm mặc định ban đầu nếu CHƯA từng đổi.
  // Nhờ đọc ở CẤP CFG (dùng chung khắp code), đổi 1 chỗ ở Cài Đặt là áp
  // dụng cho TOÀN BỘ hệ thống, không cần sửa từng hàm riêng lẻ.
  PC_SS_ID: PropertiesService.getScriptProperties().getProperty('PC_SS_ID') || LINKS.PHIEU_CAN_SS_ID,
  HD_SS_ID: PropertiesService.getScriptProperties().getProperty('HD_SS_ID') || LINKS.HOP_DONG_SS_ID,
  UPDATE_NH_SS_ID: PropertiesService.getScriptProperties().getProperty('UPDATE_NH_SS_ID') || LINKS.UPDATE_NGANHANG_SS_ID,
  DNTT_SRC: "DNTT_GK_DN",
  DNTT_CT: "DNTT_GK_DN_CT",
  DNTT_112: "DNTT_GK_DN_112",
  PC_SHEET: "PhieuCan_DN",
  HD_STK_SHEET: "HD_STK",
  SPLIT_COL: "Số phiếu cân",
  LAN_TT: "Lanthanhtoan",
  LOG_SHEET: "NhatKyThaoTac",
  COMPANY_BANK_ACCOUNT: "8619299999",
  COMPANY_BANK_NAME: "BIDV",
  COMPANY_BANK_CODE: 43,

  // ===== MỚI (mục J): FILE NHÁP (DRAFT) =====
  // SỬA (theo yêu cầu - kiến trúc "gắn liền" với File Nháp): File Nháp
  // giờ LÀ chính file đang chạy code này (SpreadsheetApp.getActive()) -
  // không còn cần cấu hình ID gì cho File Nháp nữa. (CFG.DRAFT_SS_ID cũ
  // đã bỏ hẳn - không còn ý nghĩa gì trong kiến trúc mới.)
  DRAFT_CT_SHEET: "DNTT_GK_DN_CT_DRAFT",
  // MỚI (mục AI - theo yêu cầu): "đơn xin" gốc của hồ sơ TẠO QUA WEB APP
  // được ghi vào Draft này TRƯỚC, thay vì ghi thẳng vào sheet CHÍNH
  // (DNTT_GK_DN) ngay khi tạo - đỡ phải ghi/tham chiếu bản chính khi hồ
  // sơ còn đang xử lý. Chỉ copy hẳn sang bản chính khi Đóng Thanh Toán.
  // (Luồng "Tách Phiếu" thủ công từ Sheet - runProcessDetail() - vẫn
  // dùng thẳng DNTT_GK_DN thật như cũ, không liên quan sheet này.)
  DRAFT_SRC_SHEET: "DNTT_GK_DN_DRAFT",
  DRAFT_112_SHEET: "DNTT_GK_DN_112_DRAFT",

  // ===== MỚI (mục P - tối ưu tốc độ): CACHE PHIẾU CÂN CHƯA THANH TOÁN =====
  // Sheet này nằm CHUNG trong File Nháp (chính file đang chạy), được tạo
  // tự động (không cần chạy setup riêng) - xem chi tiết ở khối mục P.
  DRAFT_PC_SHEET: "PhieuCan_DN_CHUA_TT_DRAFT",

  // ===== MỚI (mục Y - tối ưu tốc độ): MIRROR HD_NCC / HD_STK =====
  // HD_NCC/HD_STK có thể vượt ngưỡng CacheService (~95KB) khiến cache
  // KHÔNG BAO GIỜ kích hoạt được -> mỗi lần gõ tìm chủ rừng/hợp đồng đều
  // phải mở lại file ngoài từ đầu, rất chậm. 2 sheet dưới đây mirror
  // TOÀN BỘ dữ liệu (không lọc trạng thái) ngay trong File Nháp để đọc
  // nhanh, không giới hạn dung lượng như CacheService - xem khối mục Y.
  DRAFT_HDNCC_SHEET: "HD_NCC_DRAFT",
  DRAFT_HDSTK_SHEET: "HD_STK_DRAFT",

  // ===== MỚI (mục AA - chạy nền theo giờ cố định): TIẾN ĐỘ HỢP ĐỒNG =====
  // Thay vì quét lại TOÀN BỘ dữ liệu chính thức (CT + 112) mỗi lần đổi
  // Số HĐ/STK ở Bước 2 "Tạo Mới" (rất chậm), tiến độ từng hợp đồng
  // "Đang Thực Hiện" được TÍNH SẴN vào sheet này, làm mới tự động lúc
  // 7:30 sáng và 13:00 chiều hàng ngày (xem dailyRefreshAllCaches_()).
  DRAFT_HDTIENDO_SHEET: "HopDongTienDo_DRAFT",

  // ===== MỚI (mục AB - chạy nền theo giờ cố định): CÔNG NỢ TỔNG HỢP =====
  // Snapshot Công Nợ (theo Khách Hàng & theo Hợp Đồng) cho khoảng ngày
  // MẶC ĐỊNH (3 tháng gần nhất) - làm mới cùng lịch 7:30/13:00. Khi
  // người dùng xem đúng khoảng mặc định này -> đọc snapshot (tức thì).
  // Khi xem khoảng NGÀY KHÁC -> tính trực tiếp (chậm hơn) rồi GHI ĐÈ
  // snapshot này luôn cho lần xem kế tiếp.
  DRAFT_CONGNO_KH_SHEET: "CongNoKhachHang_DRAFT",

  // ===== MỚI (mục 11 - chạy nền 15h hàng ngày): PHÂN TÍCH NHẬP & THANH
  // TOÁN THEO NGUỒN GỐC/ĐẠI LÝ + CHI TIẾT CÔNG NỢ THEO PHIẾU CÂN =====
  // Lưu dạng "dài" (mỗi dòng = 1 ngày + 1 hạng mục) - khi xuất báo cáo sẽ
  // tự PIVOT thành bảng (ngày làm dòng, NG/ĐL làm cột) - dễ bảo trì hơn
  // nhiều so với tự phình thêm cột trong sheet mỗi khi có NG/ĐL mới.
  DRAFT_PHANTICH_SHEET: "PhanTichNhapTT_DRAFT",
  // Chi tiết công nợ theo phiếu cân (CHƯA thanh toán tính đến 1 ngày) -
  // snapshot cho "hôm qua" (làm mới 15h), tính lại trực tiếp nếu người
  // dùng chọn ngày khác.
  DRAFT_CTCN_SHEET: "ChiTietCongNoPhieuCan_DRAFT",

  // ===== MỚI (mục Q/R - tối ưu tốc độ): GIỚI HẠN KHOẢNG NGÀY BÁO CÁO =====
  // Áp cho Báo Cáo / Công Nợ để tránh tải/hiển thị quá nhiều dòng cùng lúc.
  MAX_REPORT_RANGE_DAYS: 95 // ~3 tháng, chừa dư vài ngày
};

// ============================================================
// MỚI (mục U): QUY TRÌNH DUYỆT 3 BƯỚC TRONG DANH SÁCH ĐNTT
// ------------------------------------------------------------
// Draft 112 (DNTT_GK_DN_112_DRAFT) có thêm CỘT THỨ 24 (index 23, 0-based)
// "Trạng Thái ĐNTT" - CHỈ tồn tại trong File Nháp, KHÔNG có ở sheet
// DNTT_GK_DN_112 THẬT (vẫn giữ nguyên 23 cột như cũ).
// Giá trị có thể có: "" (Chờ ĐNTT) hoặc "Đang ĐNTT" (đã Xác Nhận, chờ
// Duyệt/Đóng Thanh Toán). 3 trạng thái hiển thị cho người dùng:
//   1. "Chưa ĐNTT"  - Số tiền (cột 6) <= 0, chưa chạy "Tổng Hợp 112".
//   2. "Chờ ĐNTT"   - Số tiền > 0 (đã tính xong) NHƯNG cột 23 rỗng.
//   3. "Đang ĐNTT"  - Số tiền > 0 VÀ cột 23 = "Đang ĐNTT" (đã bấm "Xác
//      Nhận") - ở bước này mới được phép in Báo Cáo ĐNTT & bấm "Duyệt"
//      để Đóng Thanh Toán (copy Nháp -> sheet chính).
// ============================================================
const COL_TRANG_THAI_DNTT = 23;

/** MỚI (mục W): CHỈ cho phép Sửa/Xóa hồ sơ khi đang ở "Chờ ĐNTT" - tức
 * ĐÃ tính tiền (Số tiền > 0) NHƯNG CHƯA Xác Nhận ("Đang ĐNTT"). Hồ sơ
 * "Chưa ĐNTT" (chưa tính tiền) và "Đang ĐNTT" (đã Xác Nhận) đều bị khóa
 * Sửa/Xóa - phải "Về Chờ ĐNTT" (runHuyXacNhanDNTT_) trước nếu cần sửa. */
function _isRecordEditable_(row112) {
  return utils.parseNum(row112[6]) > 0 && String(row112[COL_TRANG_THAI_DNTT] || "").trim() !== "Đang ĐNTT";
}

const utils = {
  standardize: (v) => {
    if (!v && v !== 0) return "";
    let s = String(v).replace(/'/g, '').replace(/\s+/g, '').toUpperCase().trim();
    if (/^-?\d+\.0+$/.test(s)) s = s.replace(/\.0+$/, '');
    return s;
  },
  formatDate: (d) => (d instanceof Date && d.getFullYear() > 1900) ? Utilities.formatDate(d, "GMT+7", "dd/MM/yyyy") : (d ? String(d) : ""),
  parseNum: (v) => {
    if (typeof v === 'number') return isNaN(v) ? 0 : v;
    if (!v) return 0;
    // v2026.9.11 (R-14): hiểu đúng số dạng CHỮ kiểu Việt Nam. Trước đây mọi
    // dấu phẩy bị bỏ và chỉ đọc tới dấu chấm thứ 2: "1.234.567" -> 1,234;
    // "12,5" -> 125. Quy tắc (chỉ áp dụng cho CHỮ - ô số không đổi):
    //  - có cả "." và ",": dấu xuất hiện SAU CÙNG là dấu thập phân;
    //  - chỉ có ".": từ 2 dấu trở lên là phân cách nghìn; 1 dấu = thập phân (như cũ);
    //  - chỉ có ",": từ 2 dấu trở lên là phân cách nghìn; 1 dấu mà sau nó
    //    đúng 3 chữ số là phân cách nghìn (như cũ, "1,234" = 1234), còn lại là thập phân.
    let s = String(v).replace(/[^0-9.,-]+/g, "");
    const soCham = (s.match(/\./g) || []).length, soPhay = (s.match(/,/g) || []).length;
    if (soCham && soPhay) {
      s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
    } else if (soCham > 1) {
      s = s.replace(/\./g, "");
    } else if (soPhay > 1 || (soPhay === 1 && /,\d{3}$/.test(s))) {
      s = s.replace(/,/g, "");
    } else if (soPhay === 1) {
      s = s.replace(",", ".");
    }
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  },
  timeToSeconds: (d) => (d instanceof Date) ? (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) : null,
  isBlank: (v) => v === "" || v === null || v === undefined || (typeof v === 'string' && v.trim() === ""),
  /**
   * Build Map tra cứu từ 1 mảng 2 chiều, tự động BỎ QUA các dòng có khóa
   * (cột colIdx) rỗng. LƯU Ý: hàm này KHÔNG tự loại dòng tiêu đề - người
   * gọi phải tự truyền mảng đã bỏ header (vd rows.slice(1)).
   */
  buildIndexMap: (rows, colIdx, standardizeKey) => {
    const map = new Map();
    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i][colIdx];
      if (utils.isBlank(raw)) continue;
      const key = standardizeKey ? utils.standardize(raw) : String(raw).trim();
      if (!key) continue;
      map.set(key, standardizeKey ? rows[i] : i);
    }
    return map;
  }
};

const sysLock = {
  acquire: () => {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(30000);
      return lock;
    } catch (e) {
      throw new Error("Hệ thống đang bận do có người khác đang chốt dữ liệu. Vui lòng thử lại sau 1 phút.");
    }
  }
};

/** Chạy fn() trong sysLock và luôn nhả khóa. KHÔNG gọi từ đoạn code đang
 * giữ sysLock (khóa lồng nhau). Dùng cho các đoạn "đọc rồi ghi thêm vào
 * cuối sheet" để 2 người thao tác cùng lúc không ghi đè dòng của nhau. */
function _chayTrongKhoa_(fn) {
  const lock = sysLock.acquire();
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

// ============================================================
// GHI / XÓA AN TOÀN THEO DÒNG (v2026.6 - P1 an toàn dữ liệu)
// ------------------------------------------------------------
// Nguyên tắc: KHÔNG đọc cả sheet rồi ghi đè lại cả sheet. Chỉ chạm đúng
// các ô/dòng cần đổi (gom dòng liền kề thành 1 lệnh để giảm số lần gọi
// API), để không ghi đè thay đổi của người khác và không biến công thức
// thành giá trị. Mọi thao tác XÓA dữ liệu đều sao lưu nguyên dòng trước.
// ============================================================
// Google Sheets giới hạn 50 000 ký tự/ô - chừa dư để ô nhật ký không bị lỗi ghi.
const GIOI_HAN_KY_TU_O_NHAT_KY = 40000;
const SAO_LUU_DONG_XOA_SHEET = "SYS_SaoLuuDongXoa";
const SAO_LUU_DONG_XOA_HEADERS = ["Thời gian", "Người thực hiện", "Hành động", "File", "Sheet", "Dòng gốc", "Dữ liệu (JSON)", "File ID", "Mã thao tác", "Đã khôi phục"];
// Vị trí cột (0-based) trong SYS_SaoLuuDongXoa.
const SLX = { THOI_GIAN: 0, NGUOI: 1, HANH_DONG: 2, FILE: 3, SHEET: 4, DONG: 5, JSON: 6, FILE_ID: 7, MA: 8, DA_KHOI_PHUC: 9 };

/** Số cột (1-based) -> chữ cột A1 (1 -> A, 27 -> AA). */
function _tenCotA1_(col) {
  let s = "";
  let n = col;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** Gom các số dòng thành các đoạn liền kề [[đầu, cuối], ...] tăng dần. */
function _nhomDongLienTiep_(rowNumbers) {
  const sorted = Array.from(new Set(rowNumbers)).sort((a, b) => a - b);
  const groups = [];
  sorted.forEach(r => {
    const last = groups[groups.length - 1];
    if (last && r === last[1] + 1) last[1] = r;
    else groups.push([r, r]);
  });
  return groups;
}

/** Ghi CÙNG 1 giá trị vào cột colStart..colEnd của nhiều dòng - 1 lệnh API duy nhất. */
function _ghiCungGiaTri_(sh, rowNumbers, colStart, colEnd, value) {
  if (!rowNumbers.length) return;
  const c1 = _tenCotA1_(colStart), c2 = _tenCotA1_(colEnd);
  const a1s = _nhomDongLienTiep_(rowNumbers).map(([a, b]) => `${c1}${a}:${c2}${b}`);
  sh.getRangeList(a1s).setValue(_oAnToan_(value));
}

/** Ghi giá trị RIÊNG từng dòng. items: [{row, values}] (cùng số cột), bắt
 * đầu từ cột startCol - mỗi đoạn dòng liền kề là 1 lệnh setValues. */
function _ghiTheoDong_(sh, items, startCol) {
  if (!items.length) return;
  const byRow = new Map(items.map(it => [it.row, it.values]));
  _nhomDongLienTiep_(items.map(it => it.row)).forEach(([a, b]) => {
    const block = [];
    for (let r = a; r <= b; r++) block.push(byRow.get(r));
    sh.getRange(a, startCol, block.length, block[0].length).setValues(_dongAnToan_(block));
  });
}

/** Thay vùng dữ liệu bắt đầu từ startRow (numCols cột, hiện có oldCount
 * dòng) bằng newRows: GHI ĐÈ trước rồi mới xóa phần đuôi thừa - không có
 * thời điểm nào vùng dữ liệu bị trống hoàn toàn (khác clearContent rồi
 * mới setValues). */
function _thayVungDuLieu_(sh, startRow, numCols, oldCount, newRows, cotChu) {
  const rows = _dongAnToan_(newRows, cotChu);
  if (rows.length) sh.getRange(startRow, 1, rows.length, numCols).setValues(rows);
  const du = oldCount - newRows.length;
  if (du > 0) sh.getRange(startRow + newRows.length, 1, du, numCols).clearContent();
}

/** Ghi lại toàn bộ 1 sheet mirror/snapshot (header + rows) mà KHÔNG xóa
 * sạch trước (khác sh.clear()): ghi đè trước, dọn phần dòng/cột thừa sau
 * - người đang đọc (hoặc trigger chạy song song) không bao giờ thấy sheet
 * trống. cotText: các cột (1-based) cần khóa định dạng TEXT trước khi ghi. */
function _ghiLaiMirror_(sh, header, rows, cotText) {
  const width = header.length;
  const oldRows = sh.getLastRow(), oldCols = sh.getLastColumn();
  if (!width) {
    if (oldRows) sh.getRange(1, 1, oldRows, Math.max(1, oldCols)).clearContent();
    return;
  }
  // Dữ liệu y hệt lần ghi trước và sheet còn nguyên kích thước -> KHÔNG ghi lại. Làm mới 10
  // phút/lần trước đây ghi đè ~300 nghìn ô vào File Nháp dù không đổi gì; trong lúc đó mọi
  // thao tác đọc File Nháp (Danh sách ĐNTT...) phải chờ.
  const khoaDau = MIRROR_DAU_VAN_TAY + sh.getName();
  const dauMoi = _dauVanTay_(JSON.stringify([header, rows]));
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty(khoaDau) === dauMoi && oldRows === rows.length + 1 && oldCols === width) return;
  if (cotText && cotText.length) _lockTextCols_(sh, cotText, rows.length + 5);
  sh.getRange(1, 1, 1, width).setValues([header]).setFontWeight("bold").setBackground("#d9d2e9");
  if (rows.length) sh.getRange(2, 1, rows.length, width).setValues(_dongAnToan_(rows));
  const duDong = oldRows - (rows.length + 1);
  if (duDong > 0) sh.getRange(rows.length + 2, 1, duDong, Math.max(width, oldCols)).clearContent();
  if (oldCols > width) sh.getRange(1, width + 1, rows.length + 1, oldCols - width).clearContent();
  sh.setFrozenRows(1);
  props.setProperty(khoaDau, dauMoi);
}
const MIRROR_DAU_VAN_TAY = "MIRROR_DAU_";
/** Dấu vân tay (FNV-1a 2 vòng, 16 ký tự hex) của 1 chuỗi - so nhanh "dữ liệu có đổi không",
 * không gọi dịch vụ Google. */
function _dauVanTay_(chuoi) {
  let a = 0x811c9dc5, b = 0x01000193 ^ chuoi.length;
  for (let i = 0; i < chuoi.length; i++) {
    const c = chuoi.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193) >>> 0;
    b = Math.imul(b ^ c, 0x5bd1e995) >>> 0;
  }
  return a.toString(16).padStart(8, "0") + b.toString(16).padStart(8, "0");
}

/** Giá trị dạng chữ để GHI vào sheet: bỏ các dấu ' có sẵn ở đầu rồi thêm
 * đúng 1 dấu ' (rỗng -> "") - Google Sheets giữ nguyên dạng chữ, không tự
 * đổi "0123" thành số 123. */
function _chu_(v) {
  const s = String(v == null ? "" : v).replace(/^'+/, "");
  return s ? "'" + s : "";
}
/** Như _chu_ nhưng CHỈ áp dụng cho chuỗi - ô đang là số giữ nguyên là số. */
function _giuDangChu_(v) {
  return typeof v === "string" ? _chu_(v) : v;
}

// Cột dạng CHỮ (0-based) phải giữ số 0 đầu mỗi khi ghi lại dòng vào sheet.
// Đọc ra thì "0123" là chuỗi, nhưng ghi lại chuỗi đó (không có dấu ') vào
// ô chưa khóa TEXT thì Google Sheets tự đổi thành số 123.
const COT_CHU = {
  CT: [4, 7, 11, 19],   // DNTT_GK_DN_CT(_DRAFT): CCCD, STK người nhận, Số phiếu cân, Số HĐ
  H112: [5, 8, 22],     // DNTT_GK_DN_112(_DRAFT): STK, Số HĐ, ID_112 (18 chữ số - dạng số sẽ bị làm tròn)
  SRC: [4, 8, 13]       // DNTT_GK_DN(_DRAFT): CCCD, STK người nhận, Số HĐ
};

/** Giá trị 1 ô an toàn để GHI: chuỗi mở đầu bằng = + - @ (không phải số)
 * được thêm dấu ' để Google Sheets/Excel coi là CHỮ, không chạy như công
 * thức (tên khách hàng "=HYPERLINK(...)" nhập từ web, hoặc đọc lại từ ô
 * chữ rồi ghi lại). Ô số, ngày, chuỗi thường giữ nguyên. */
function _oAnToan_(v) {
  return typeof v === "string" && /^[=+\-@]/.test(v) && !/^[+-]?\d+([.,]\d+)?$/.test(v) ? _chu_(v) : v;
}

/** Bản sao các dòng SẴN SÀNG GHI: mọi ô qua _oAnToan_, các cột dạng chữ
 * (cotChu - chỉ số 0-based, xem COT_CHU) giữ số 0 đầu. Dùng cho MỌI lần
 * ghi dữ liệu (không dùng cho header/tiêu đề cố định trong code). */
function _dongAnToan_(rows, cotChu) {
  return rows.map(r => {
    const x = r.map(_oAnToan_);
    (cotChu || []).forEach(i => { if (i < x.length) x[i] = _giuDangChu_(x[i]); });
    return x;
  });
}

/** Chuẩn hóa CCCD/CMND: bỏ dấu ', khoảng trắng; khôi phục ĐÚNG 1 số 0 đầu đã
 * mất khi ô gốc bị lưu dạng số - CCCD luôn 12 số (còn 11 -> thêm "0"), CMND
 * luôn 9 số (còn 8 -> thêm "0"). Độ dài khác giữ nguyên, không đoán. */
function _chuanHoaCCCD_(v) {
  const s = String(v == null ? "" : v).replace(/'/g, "").replace(/\s+/g, "");
  return /^\d{11}$/.test(s) || /^\d{8}$/.test(s) ? "0" + s : s;
}

/** Tập giá trị (đã trim) của cột colKey (1-based) từ dòng 2. Nếu có
 * colCo, chỉ lấy các dòng mà cột colCo đang là "Y" (đã chốt). */
function _tapKhoaTrongCot_(sh, colKey, colCo) {
  const out = new Set();
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return out;
  const keys = sh.getRange(2, colKey, lastRow - 1, 1).getValues();
  const flags = colCo ? sh.getRange(2, colCo, lastRow - 1, 1).getValues() : null;
  keys.forEach((r, i) => {
    const k = String(r[0] || "").trim();
    if (!k) return;
    if (flags && String(flags[i][0] || "").trim().toUpperCase() !== "Y") return;
    out.add(k);
  });
  return out;
}

/** Sao lưu nguyên dòng sắp bị xóa vào SAO_LUU_DONG_XOA_SHEET (File Chính).
 * items: [{row, values}]. Nếu sao lưu lỗi -> ném lỗi để KHÔNG xóa. */
/** Sheet SYS_SaoLuuDongXoa (tạo nếu chưa có; bổ sung tiêu đề cột mới cho sheet tạo bởi bản cũ). */
function _sheetSaoLuuXoa_() {
  const ss = getMainSs_();
  let shBk = ss.getSheetByName(SAO_LUU_DONG_XOA_SHEET);
  if (!shBk) {
    shBk = ss.insertSheet(SAO_LUU_DONG_XOA_SHEET);
    shBk.setFrozenRows(1);
  }
  const header = shBk.getRange(1, 1, 1, SAO_LUU_DONG_XOA_HEADERS.length).getValues()[0];
  if (header.join("|") !== SAO_LUU_DONG_XOA_HEADERS.join("|")) {
    shBk.getRange(1, 1, 1, SAO_LUU_DONG_XOA_HEADERS.length).setValues([SAO_LUU_DONG_XOA_HEADERS]).setFontWeight("bold").setBackground("#d9d9d9");
  }
  return shBk;
}

/** Sao lưu nguyên dòng sắp bị xóa. maThaoTac gom mọi dòng của CÙNG 1 lần
 * thao tác (vd 1 lần Mở Đóng TT xóa ở 6 sheet) để khôi phục cùng lúc. */
function _saoLuuDong_(hanhDong, sh, items, maThaoTac) {
  if (!items.length) return;
  const shBk = _sheetSaoLuuXoa_();
  const user = _emailNguoiThucHien_() || "N/A";
  const now = new Date();
  const file = sh.getParent();
  const tenFile = file ? file.getName() : "";
  const idFile = file ? file.getId() : "";
  const ma = maThaoTac || _maThaoTacMoi_(hanhDong);
  const rows = items.map(it => [now, user, hanhDong, tenFile, sh.getName(), it.row, JSON.stringify(it.values), idFile, ma, ""]);
  shBk.getRange(shBk.getLastRow() + 1, 1, rows.length, SAO_LUU_DONG_XOA_HEADERS.length).setValues(_dongAnToan_(rows));
}
function _maThaoTacMoi_(hanhDong) {
  return hanhDong + "-" + Utilities.getUuid().slice(0, 8);
}

/** Đọc lại dữ liệu MỚI NHẤT ngay lúc xóa, sao lưu rồi xóa mọi dòng (từ
 * dòng 2) thỏa laDongCanXoa(row). Không dùng vị trí dòng đã đọc từ trước
 * (tránh xóa nhầm nếu sheet vừa bị chèn/xóa dòng). Trả về số dòng đã xóa. */
function _saoLuuVaXoaDong_(sh, laDongCanXoa, hanhDong, maThaoTac) {
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return 0;
  const numCols = Math.max(1, sh.getLastColumn());
  const data = sh.getRange(2, 1, lastRow - 1, numCols).getValues();
  const items = [];
  data.forEach((r, i) => { if (laDongCanXoa(r)) items.push({ row: i + 2, values: r }); });
  if (!items.length) return 0;
  _saoLuuDong_(hanhDong, sh, items, maThaoTac);
  _nhomDongLienTiep_(items.map(it => it.row)).reverse().forEach(([a, b]) => sh.deleteRows(a, b - a + 1));
  return items.length;
}

// ============================================================
// KHÔI PHỤC DÒNG ĐÃ XÓA (C-07) - từ SYS_SaoLuuDongXoa, theo từng LẦN XÓA
// ============================================================
/** Khóa gom nhóm: mã thao tác (từ 2026.8.2); bản sao lưu cũ chưa có mã thì
 * gom theo hành động + người + phút thực hiện. */
function _maNhomSaoLuu_(r) {
  const ma = String(r[SLX.MA] || "").trim();
  if (ma) return ma;
  const t = r[SLX.THOI_GIAN] instanceof Date ? Utilities.formatDate(r[SLX.THOI_GIAN], "GMT+7", "yyyyMMddHHmm") : String(r[SLX.THOI_GIAN]);
  return ["CU", r[SLX.HANH_DONG], r[SLX.NGUOI], t].join("-");
}
/** Giá trị trong JSON sao lưu -> giá trị ghi lại: chuỗi ngày ISO thành Date;
 * chuỗi khác giữ dạng CHỮ (không mất số 0 đầu, không thành công thức). */
function _giaTriKhoiPhuc_(v) {
  if (v === null || v === undefined) return "";
  if (typeof v !== "string") return v;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(v)) return new Date(v);
  return _chu_(v);
}
/** Sheet gốc của 1 dòng sao lưu: theo File ID; bản sao lưu cũ thì theo tên file. */
function _sheetGocSaoLuu_(r) {
  const tenSheet = String(r[SLX.SHEET] || "");
  let ss = null;
  const idFile = String(r[SLX.FILE_ID] || "").trim();
  if (idFile) ss = SpreadsheetApp.openById(idFile);
  else {
    const ungVien = [() => getMainSs_(), () => SpreadsheetApp.openById(CFG.UPDATE_NH_SS_ID), () => SpreadsheetApp.getActive()];
    for (const mo of ungVien) {
      try { const x = mo(); if (x && x.getName() === r[SLX.FILE]) { ss = x; break; } } catch (e) { /* file không mở được - thử file khác */ }
    }
  }
  const sh = ss && ss.getSheetByName(tenSheet);
  if (!sh) throw new Error(`Không tìm thấy sheet "${tenSheet}" trong file "${r[SLX.FILE]}".`);
  return sh;
}

/** #Web (Quản trị): các LẦN XÓA đã sao lưu, mới nhất trước (tối đa 200). */
function getDanhSachSaoLuuXoa_() {
  const sh = getMainSs_().getSheetByName(SAO_LUU_DONG_XOA_SHEET);
  if (!sh || sh.getLastRow() < 2) return [];
  const nhom = new Map();
  sh.getRange(2, 1, sh.getLastRow() - 1, SAO_LUU_DONG_XOA_HEADERS.length).getValues().forEach(r => {
    const ma = _maNhomSaoLuu_(r);
    if (!nhom.has(ma)) nhom.set(ma, { ma, thoiGian: r[SLX.THOI_GIAN], nguoi: String(r[SLX.NGUOI] || ""), hanhDong: String(r[SLX.HANH_DONG] || ""), soDong: 0, daKhoiPhuc: 0, theoSheet: {}, maDong: new Set() });
    const g = nhom.get(ma);
    g.soDong++;
    if (String(r[SLX.DA_KHOI_PHUC] || "").trim()) g.daKhoiPhuc++;
    const tenSheet = String(r[SLX.SHEET] || "");
    g.theoSheet[tenSheet] = (g.theoSheet[tenSheet] || 0) + 1;
    try { const v = JSON.parse(r[SLX.JSON])[0]; if (v !== "" && g.maDong.size < 5) g.maDong.add(String(v)); } catch (e) { /* JSON hỏng - vẫn liệt kê */ }
  });
  return Array.from(nhom.values())
    .sort((a, b) => (b.thoiGian instanceof Date ? b.thoiGian.getTime() : 0) - (a.thoiGian instanceof Date ? a.thoiGian.getTime() : 0))
    .slice(0, 200)
    .map(g => ({
      ma: g.ma, thoiGian: g.thoiGian instanceof Date ? Utilities.formatDate(g.thoiGian, "GMT+7", "dd/MM/yyyy HH:mm") : String(g.thoiGian),
      nguoi: g.nguoi, hanhDong: g.hanhDong, soDong: g.soDong, daKhoiPhuc: g.daKhoiPhuc,
      theoSheet: Object.keys(g.theoSheet).map(k => ({ sheet: k, soDong: g.theoSheet[k] })), maDong: Array.from(g.maDong)
    }));
}

/** #Web (Quản trị): ghi lại (cuối sheet gốc) mọi dòng CHƯA khôi phục của 1
 * lần xóa. Dòng về sổ đã chốt (DNTT_GK_DN_CT) thì kiểm tra không trả 2
 * lần và khóa lại phiếu cân như lúc Duyệt. */
function webKhoiPhucSaoLuuXoa_(ma) {
  let lock;
  try {
    lock = sysLock.acquire();
    const ss = getMainSs_();
    const shBk = ss.getSheetByName(SAO_LUU_DONG_XOA_SHEET);
    if (!shBk || shBk.getLastRow() < 2) return { success: false, message: "❌ Chưa có dữ liệu sao lưu." };
    const bk = shBk.getRange(2, 1, shBk.getLastRow() - 1, SAO_LUU_DONG_XOA_HEADERS.length).getValues();
    const cuaNhom = [];
    bk.forEach((r, i) => { if (_maNhomSaoLuu_(r) === ma && !String(r[SLX.DA_KHOI_PHUC] || "").trim()) cuaNhom.push({ r, dongBk: i + 2 }); });
    if (!cuaNhom.length) return { success: false, message: "⚠️ Lần xóa này đã được khôi phục (hoặc không còn trong sao lưu)." };

    const dich = new Map(); // sheet gốc -> { sh, dong: [giá trị] }
    cuaNhom.forEach(({ r }) => {
      const sh = _sheetGocSaoLuu_(r);
      const khoa = sh.getParent().getId() + "|" + sh.getName();
      if (!dich.has(khoa)) dich.set(khoa, { sh, dong: [] });
      dich.get(khoa).dong.push(JSON.parse(r[SLX.JSON]).map(_giaTriKhoiPhuc_));
    });

    // Dòng về sổ đã chốt: phiếu cân không được đang ở sổ chốt / hồ sơ Nháp khác.
    const shCTReal = ss.getSheetByName(CFG.DNTT_CT);
    const veCT = shCTReal ? dich.get(ss.getId() + "|" + shCTReal.getName()) : null;
    const soPhieuVeCT = new Set();
    if (veCT) {
      const ctLr = shCTReal.getLastRow();
      const daTra = _phieuCanDaTraThat_(ctLr > 1 ? shCTReal.getRange(2, 1, ctLr - 1, 22).getValues() : []);
      const { shCT: shDraftCT } = getDraftSheets_();
      const nhapLr = shDraftCT.getLastRow();
      const trongNhap = _phieuCanDaTraThat_(nhapLr > 1 ? shDraftCT.getRange(2, 1, nhapLr - 1, 22).getValues() : []);
      const loi = [];
      veCT.dong.forEach(v => {
        const so = String(v[11] || "").replace(/^'/, "").trim(), k = utils.standardize(so);
        if (!k) return;
        if (daTra.has(k)) loi.push(`phiếu ${so} đã có trong sổ đã chốt (hồ sơ ${daTra.get(k)})`);
        else if (trongNhap.has(k)) loi.push(`phiếu ${so} đang nằm trong hồ sơ Nháp ${trongNhap.get(k)} - xóa hồ sơ Nháp đó trước`);
        soPhieuVeCT.add(k);
      });
      if (loi.length) return { success: false, message: "❌ Không khôi phục được để tránh trả tiền 2 lần: " + loi.join("; ") + "." };
    }

    const tomTat = [];
    dich.forEach(({ sh, dong }) => {
      const rong = Math.max(...dong.map(v => v.length));
      const vung = dong.map(v => v.concat(new Array(rong - v.length).fill("")));
      sh.getRange(sh.getLastRow() + 1, 1, vung.length, rong).setValues(_dongAnToan_(vung));
      tomTat.push(`${sh.getName()}: ${vung.length} dòng`);
    });
    if (soPhieuVeCT.size) _khoaPhieuCanDaTra_(openExternalSheet_(CFG.PC_SS_ID, CFG.PC_SHEET, "Phiếu Cân"), soPhieuVeCT);

    const dau = `${Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm")} - ${_emailNguoiThucHien_() || "N/A"}`;
    _ghiCungGiaTri_(shBk, cuaNhom.map(x => x.dongBk), SLX.DA_KHOI_PHUC + 1, SLX.DA_KHOI_PHUC + 1, dau);
    _invalidateCtSrc112Cache_();
    const hanhDong = String(cuaNhom[0].r[SLX.HANH_DONG] || "");
    logAction_("KHOI_PHUC_DONG_DA_XOA", ma, `Khôi phục lần "${hanhDong}": ${tomTat.join(", ")}${soPhieuVeCT.size ? `; khóa lại ${soPhieuVeCT.size} phiếu cân` : ""}.`);
    return { success: true, message: `✅ Đã khôi phục ${cuaNhom.length} dòng (${tomTat.join(", ")})${soPhieuVeCT.size ? `, khóa lại ${soPhieuVeCT.size} phiếu cân` : ""}.` };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  } finally {
    if (lock) lock.releaseLock();
  }
}

// Lỗi LẬP TRÌNH (không phải lỗi nghiệp vụ do code tự ném bằng new Error("...")
// hay lỗi dịch vụ Google "Exception: ...") - không đưa chi tiết kỹ thuật ra màn hình.
const LOI_LAP_TRINH = ["TypeError", "ReferenceError", "RangeError", "SyntaxError", "EvalError", "URIError"];

/** Thông điệp lỗi để HIỂN THỊ cho người dùng: lỗi nghiệp vụ/dịch vụ giữ
 * nguyên nội dung (bỏ tiền tố "Error: "); lỗi lập trình thì ghi chi tiết +
 * stack vào NhatKyThaoTac (LOI_HE_THONG) và chỉ trả câu chung kèm mã tra cứu.
 * Ghi nhật ký lỗi (logAction_) vẫn dùng _loiChoNguoiDung_(e) đầy đủ. */
function _loiChoNguoiDung_(e) {
  const noiDung = String((e && e.message) || e || "");
  if (!e || LOI_LAP_TRINH.indexOf(e.name) === -1) return noiDung;
  const ma = Utilities.getUuid().slice(0, 8).toUpperCase();
  console.error("LOI_HE_THONG " + ma, e.stack || noiDung);
  logAction_("LOI_HE_THONG", ma, `${e.name}: ${noiDung}\n${String(e.stack || "").slice(0, 1500)}`);
  return `Lỗi hệ thống (mã ${ma}) - đã ghi vào Nhật ký thao tác, vui lòng báo Quản trị kèm mã này.`;
}

function logAction_(actionType, refId, detail) {
  try {
    const ss = getMainSs_();
    let sh = ss.getSheetByName(CFG.LOG_SHEET);
    if (!sh) {
      sh = ss.insertSheet(CFG.LOG_SHEET);
      sh.appendRow(["Thời gian", "Người thực hiện", "Hành động", "Mã hồ sơ", "Chi tiết"]);
      sh.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#d9d9d9");
      sh.setColumnWidths(1, 5, 180);
    }
    // Mã hồ sơ / mã lỗi giữ dạng CHỮ: mã toàn chữ số (vd "01234567") không bị đổi thành số, mất số 0 đầu.
    sh.appendRow(_dongAnToan_([[new Date(), _emailNguoiThucHien_() || "N/A", actionType, refId, detail]], [3])[0]);
  } catch (e) {
    // Không chặn luồng chính nếu ghi log lỗi. v2026.9.11 (R-06): nhưng không
    // để mất âm thầm - ghi vào nhật ký thực thi của Apps Script (Executions)
    // đủ hành động/mã/chi tiết để tra lại.
    try {
      console.error(`LOI_GHI_NHAT_KY ${actionType} ${refId}: ${e && e.message} | ${String(detail || "").slice(0, 1000)}`);
    } catch (e2) { /* console không khả dụng - bỏ qua */ }
  }
}

// ============================================================
// XÁC THỰC & PHÂN QUYỀN (v2026.7 - P2)
// ------------------------------------------------------------
// Web app chạy dưới quyền chủ script (USER_DEPLOYING) nên Google KHÔNG cho
// script biết email của người dùng Gmail khác. Danh tính được xác minh qua
// "Cổng đăng nhập": 1 dự án Apps Script RIÊNG chạy dưới quyền NGƯỜI DÙNG,
// ký HMAC (email + hạn dùng + mã dùng 1 lần) rồi chuyển về web app này qua
// ?sso=... Web app cấp mã phiên (CacheService). Mọi lời gọi từ trình duyệt
// đi qua api(phien, tenHam, thamSo) và bị kiểm tra quyền theo API_ROUTES;
// các hàm nghiệp vụ đều là hàm nội bộ (tên kết thúc "_") nên không gọi
// thẳng được. Menu trong Sheet dùng email thật của người bấm menu.
// Chủ script luôn là Quản trị (không thể tự khóa mình ra ngoài).
// ============================================================
const VAI_TRO = { ADMIN: "ADMIN", KE_TOAN_TONG_HOP: "KE_TOAN_TONG_HOP", KE_TOAN: "KE_TOAN", XEM: "XEM" };
const VAI_TRO_NHAN = { ADMIN: "Quản trị", KE_TOAN_TONG_HOP: "Kế toán tổng hợp", KE_TOAN: "Kế toán", XEM: "Chỉ xem" };
// HE_THONG: toàn bộ trang Hệ Thống (đối soát, bảo trì, Mở Đóng TT, khôi phục,
// khóa sổ năm...). QUAN_TRI: thêm Cài đặt, người dùng, Cổng đăng nhập.
const QUYEN = { XEM: "XEM", NGHIEP_VU: "NGHIEP_VU", HE_THONG: "HE_THONG", QUAN_TRI: "QUAN_TRI" };
const QUYEN_THEO_VAI_TRO = {
  ADMIN: [QUYEN.XEM, QUYEN.NGHIEP_VU, QUYEN.HE_THONG, QUYEN.QUAN_TRI],
  KE_TOAN_TONG_HOP: [QUYEN.XEM, QUYEN.NGHIEP_VU, QUYEN.HE_THONG],
  KE_TOAN: [QUYEN.XEM, QUYEN.NGHIEP_VU],
  XEM: [QUYEN.XEM]
};
// Quản trị cố định (ngoài chủ script): luôn là Quản trị, KHÔNG đổi/khóa được
// từ web app (tránh tự khóa nhầm mình). Thêm/bớt email trực tiếp tại đây.
const QUAN_TRI_CO_DINH = ["saoluucvhak@gmail.com", "phuthuy.apple@gmail.com"];
const TRANG_THAI_NGUOI_DUNG = { HOAT_DONG: "Hoạt động", KHOA: "Khóa" };
const NGUOI_DUNG_SHEET = "SYS_NguoiDung";
const NGUOI_DUNG_HEADERS = ["Email", "Họ tên", "Vai trò", "Trạng thái", "Cập nhật lúc", "Cập nhật bởi"];
const AUTH_CFG = {
  PHIEN_TTL_GIAY: 21600,            // tối đa cho phép của CacheService (6 giờ)
  SSO_HIEU_LUC_MS: 5 * 60 * 1000,   // link từ Cổng đăng nhập chỉ dùng được trong 5 phút
  SSO_NONCE_TTL_GIAY: 900,          // nhớ mã dùng-1-lần lâu hơn hạn link để chặn dùng lại
  CACHE_NGUOI_DUNG_GIAY: 60,        // đổi vai trò/khóa tài khoản có hiệu lực trong ≤ 60 giây
  PROP_SSO_SECRET: "SSO_SECRET",
  PROP_CONG_DANG_NHAP_URL: "SSO_GATEWAY_URL",
  CACHE_KEY_NGUOI_DUNG: "sys_nguoi_dung_v1",
  TIEN_TO_PHIEN: "phien_",
  TIEN_TO_NONCE: "sso_n_",
  // Đăng nhập khi web app nằm trong trang khác (iframe): Cổng mở ở cửa sổ nhỏ,
  // xong thì để phiên ở đây theo mã yêu cầu; khung nhúng hỏi lại bằng mã đó.
  TIEN_TO_YEU_CAU: "dn_yc_",
  YEU_CAU_TTL_GIAY: 600,
  LOI_DANG_NHAP: "[AUTH] ",         // client hiện màn hình đăng nhập
  LOI_QUYEN: "[QUYEN] ",            // client chỉ báo lỗi, không đăng xuất
  LOI_DONG_BO: "[DONG_BO] "         // client chờ đồng bộ (trigger) chạy xong rồi tự gọi lại
};
const MAU_MA_PHIEN = /^[0-9a-f]{64}$/;
const MAU_MA_YEU_CAU = /^[0-9a-f]{32}$/;
const MAU_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MAU_URL_CONG_DANG_NHAP = /^https:\/\/script\.google\.com\/(a\/[^/]+\/)?macros\/s\/[\w-]+\/exec$/;

// Người dùng của lượt gọi hiện tại (mỗi lượt gọi Apps Script là 1 lần chạy riêng).
let _nguoiDungHienTai_ = null;

function _chuanHoaEmail_(v) {
  return String(v || "").trim().toLowerCase();
}
function _emailChuScript_() {
  try { return _chuanHoaEmail_(Session.getEffectiveUser().getEmail()); } catch (e) { return ""; }
}
/** Email người đang thao tác: người đã đăng nhập qua phiên, hoặc người bấm
 * menu trong Sheet. Rỗng nếu không xác định được. */
function _emailNguoiThucHien_() {
  const nd = _xacDinhNguoiDung_();
  return nd ? nd.email : "";
}

function _getNguoiDungSheet_() {
  const ss = getMainSs_();
  let sh = ss.getSheetByName(NGUOI_DUNG_SHEET);
  if (!sh) {
    sh = ss.insertSheet(NGUOI_DUNG_SHEET);
    sh.getRange(1, 1, 1, NGUOI_DUNG_HEADERS.length).setValues([NGUOI_DUNG_HEADERS]).setFontWeight("bold").setBackground("#d9d9d9");
    sh.setFrozenRows(1);
  }
  return sh;
}

/** Danh sách người dùng (cache ngắn). File Chính chưa cấu hình -> rỗng
 * (khi đó chỉ chủ script vào được). */
function _docDanhSachNguoiDung_() {
  const cache = CacheService.getScriptCache();
  const raw = cache.get(AUTH_CFG.CACHE_KEY_NGUOI_DUNG);
  if (raw) return JSON.parse(raw);
  let list = [];
  try {
    const sh = getMainSs_().getSheetByName(NGUOI_DUNG_SHEET);
    if (sh && sh.getLastRow() > 1) {
      list = sh.getRange(2, 1, sh.getLastRow() - 1, NGUOI_DUNG_HEADERS.length).getValues()
        .map((r, i) => ({
          dong: i + 2,
          email: _chuanHoaEmail_(r[0]),
          hoTen: String(r[1] || "").trim(),
          vaiTro: String(r[2] || "").trim().toUpperCase(),
          trangThai: String(r[3] || "").trim()
        }))
        .filter(x => x.email);
    }
  } catch (e) { /* chưa kết nối File Chính */ }
  cache.put(AUTH_CFG.CACHE_KEY_NGUOI_DUNG, JSON.stringify(list), AUTH_CFG.CACHE_NGUOI_DUNG_GIAY);
  return list;
}

/** Chủ script hoặc Quản trị cố định - luôn là Quản trị. */
function _laQuanTriCoDinh_(email) {
  const e = _chuanHoaEmail_(email);
  return !!e && (e === _emailChuScript_() || QUAN_TRI_CO_DINH.some(x => _chuanHoaEmail_(x) === e));
}

/** Vai trò hiệu lực của 1 email, null nếu chưa được cấp quyền / đã khóa. */
function _vaiTroCua_(email) {
  const e = _chuanHoaEmail_(email);
  if (!e) return null;
  if (_laQuanTriCoDinh_(e)) return VAI_TRO.ADMIN;
  const nd = _docDanhSachNguoiDung_().find(x => x.email === e);
  if (!nd || nd.trangThai !== TRANG_THAI_NGUOI_DUNG.HOAT_DONG || !QUYEN_THEO_VAI_TRO[nd.vaiTro]) return null;
  return nd.vaiTro;
}

function _xacDinhNguoiDung_() {
  if (_nguoiDungHienTai_) return _nguoiDungHienTai_;
  let email = "";
  try { email = _chuanHoaEmail_(Session.getActiveUser().getEmail()); } catch (e) {}
  return email ? { email, vaiTro: _vaiTroCua_(email) } : null;
}

/** Chặn nếu người thao tác không có quyền `quyen` (QUYEN.*). */
function _yeuCauQuyen_(quyen) {
  const nd = _xacDinhNguoiDung_();
  if (!nd) throw new Error(AUTH_CFG.LOI_DANG_NHAP + "Chưa đăng nhập - vui lòng đăng nhập bằng tài khoản Google đã được cấp quyền.");
  if (!nd.vaiTro) throw new Error(AUTH_CFG.LOI_DANG_NHAP + `Tài khoản ${nd.email} chưa được cấp quyền hoặc đã bị khóa - liên hệ Quản trị.`);
  if (QUYEN_THEO_VAI_TRO[nd.vaiTro].indexOf(quyen) === -1) {
    throw new Error(AUTH_CFG.LOI_QUYEN + `Tài khoản ${nd.email} (${VAI_TRO_NHAN[nd.vaiTro]}) không có quyền thực hiện thao tác này.`);
  }
  return nd;
}

function _taoMaNgauNhien_() {
  return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, "").toLowerCase();
}
function _taoPhien_(email) {
  const phien = _taoMaNgauNhien_();
  CacheService.getScriptCache().put(AUTH_CFG.TIEN_TO_PHIEN + phien, JSON.stringify({ email, taoLuc: Date.now() }), AUTH_CFG.PHIEN_TTL_GIAY);
  return phien;
}
function _docPhien_(phien) {
  if (!MAU_MA_PHIEN.test(String(phien || ""))) return "";
  const raw = CacheService.getScriptCache().get(AUTH_CFG.TIEN_TO_PHIEN + phien);
  if (!raw) return "";
  try { return _chuanHoaEmail_(JSON.parse(raw).email); } catch (e) { return ""; }
}

function _laySsoSecret_() {
  const props = PropertiesService.getScriptProperties();
  let secret = props.getProperty(AUTH_CFG.PROP_SSO_SECRET);
  if (!secret) {
    secret = _taoMaNgauNhien_();
    props.setProperty(AUTH_CFG.PROP_SSO_SECRET, secret);
  }
  return secret;
}
function _kyHmac_(data, secret) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(data, secret));
}
function _soSanhAnToan_(a, b) {
  if (a.length !== b.length) return false;
  let khac = 0;
  for (let i = 0; i < a.length; i++) khac |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return khac === 0;
}

/** Xác minh mã từ Cổng đăng nhập: đúng chữ ký, còn hạn, chưa dùng. Trả về
 * { email, yeuCau } - yeuCau: mã yêu cầu của khung nhúng (nằm trong phần đã ký). */
function _xacMinhSso_(token) {
  const secret = PropertiesService.getScriptProperties().getProperty(AUTH_CFG.PROP_SSO_SECRET);
  if (!secret) throw new Error("Cổng đăng nhập chưa được cấu hình.");
  const parts = String(token || "").split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) throw new Error("Mã đăng nhập không hợp lệ.");
  if (!_soSanhAnToan_(_kyHmac_(parts[0], secret), parts[1])) throw new Error("Mã đăng nhập không hợp lệ (sai chữ ký).");
  let payload;
  try {
    payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString("UTF-8"));
  } catch (e) {
    throw new Error("Mã đăng nhập không đọc được.");
  }
  if (!payload || typeof payload.exp !== "number" || payload.exp < Date.now()) throw new Error("Link đăng nhập đã hết hạn - vui lòng đăng nhập lại.");
  const nonce = String(payload.n || "");
  const cache = CacheService.getScriptCache();
  if (!nonce || cache.get(AUTH_CFG.TIEN_TO_NONCE + nonce)) throw new Error("Link đăng nhập đã được dùng - vui lòng đăng nhập lại.");
  cache.put(AUTH_CFG.TIEN_TO_NONCE + nonce, "1", AUTH_CFG.SSO_NONCE_TTL_GIAY);
  const email = _chuanHoaEmail_(payload.email);
  if (!MAU_EMAIL.test(email)) throw new Error("Mã đăng nhập không có email hợp lệ.");
  return { email, yeuCau: MAU_MA_YEU_CAU.test(String(payload.yc || "")) ? payload.yc : "" };
}

/** Mã nguồn Cổng đăng nhập (dán vào 1 dự án Apps Script riêng). */
function _maNguonCongDangNhap_(appUrl, secret) {
  const soPhut = AUTH_CFG.SSO_HIEU_LUC_MS / 60000;
  return `// CỔNG ĐĂNG NHẬP - HỆ THỐNG QUẢN LÝ THANH TOÁN HAK
// Dán vào 1 dự án Apps Script MỚI (https://script.new), rồi Deploy > New deployment > Web app:
//   Execute as: User accessing the web app  ·  Who has access: Anyone with Google account
// Mã bí mật bên dưới phải KHỚP với web app chính - không chia sẻ file này cho người khác.
var APP_URL = ${JSON.stringify(appUrl)};
var SSO_SECRET = ${JSON.stringify(secret)};
var SSO_HIEU_LUC_MS = ${AUTH_CFG.SSO_HIEU_LUC_MS};

function doGet(e) {
  var email = String(Session.getActiveUser().getEmail() || "").trim().toLowerCase();
  var trang = String((e && e.parameter && e.parameter.trang) || "");
  var yc = String((e && e.parameter && e.parameter.yc) || "");  // mã yêu cầu khi đăng nhập từ trang nhúng
  if (!email) {
    return HtmlService.createHtmlOutput('<p style="font-family:Arial;padding:24px">Không xác định được tài khoản Google. Hãy đăng nhập Google rồi mở lại link này.</p>');
  }
  var payload = JSON.stringify({ email: email, exp: Date.now() + SSO_HIEU_LUC_MS, n: Utilities.getUuid(), yc: /^[0-9a-f]{32}$/.test(yc) ? yc : "" });
  var p64 = Utilities.base64EncodeWebSafe(payload, Utilities.Charset.UTF_8);
  var sig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(p64, SSO_SECRET));
  var url = APP_URL + "?sso=" + encodeURIComponent(p64 + "." + sig) + (/^[A-Za-z]{1,30}$/.test(trang) ? "&trang=" + trang : "");
  var emailHtml = email.replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; });
  var html = '<div style="font-family:Arial,sans-serif;padding:32px;text-align:center">'
    + '<h2 style="margin:0 0 8px">Hệ Thống Quản Lý Thanh Toán HAK</h2>'
    + '<p>Tài khoản: <b>' + emailHtml + '</b></p>'
    + '<a href="' + url + '" target="_top" style="display:inline-block;margin-top:12px;padding:12px 24px;background:#1f6f43;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Vào hệ thống</a>'
    + '<p style="color:#666;font-size:12px;margin-top:16px">Link có hiệu lực ${soPhut} phút và chỉ dùng được 1 lần.</p></div>';
  return HtmlService.createHtmlOutput(html).setTitle("Đăng nhập HAK");
}
`;
}

/** Màn hình web app mở thẳng được qua ?trang= (menu Sheet; Cổng đăng nhập chuyển tiếp tham số này). */
const TRANG_MO_THANG = ["taoMoi"];

/** CÔNG KHAI (không cần đăng nhập): trạng thái đăng nhập + link Cổng đăng nhập. */
function thongTinDangNhap(phien) {
  const emailPhien = _docPhien_(phien);
  let email = emailPhien;
  if (!email) {
    try { email = _chuanHoaEmail_(Session.getActiveUser().getEmail()); } catch (e) {}
  }
  const vaiTro = email ? _vaiTroCua_(email) : null;
  return {
    daDangNhap: !!vaiTro,
    email,
    vaiTro: vaiTro || "",
    vaiTroNhan: vaiTro ? VAI_TRO_NHAN[vaiTro] : "",
    quyen: vaiTro ? QUYEN_THEO_VAI_TRO[vaiTro].slice() : [],
    quaPhien: !!emailPhien,
    congDangNhapUrl: PropertiesService.getScriptProperties().getProperty(AUTH_CFG.PROP_CONG_DANG_NHAP_URL) || ""
  };
}

// ============================================================
// ĐO HIỆU NĂNG THẬT (2026.9.6): mỗi lần chạy từ HIEU_NANG_NGUONG_MS trở lên
// (chức năng web qua api(), trigger) ghi 1 dòng vào SYS_HieuNang (File Nháp).
// Quá giờ (Google dừng ở 6 phút): lời gọi từ web do trình duyệt báo lại; trigger
// phát hiện ở lần chạy sau nhờ dấu "đang chạy" (mỗi trigger 1 Script Property).
// Lần chạy nhanh không ghi gì - không làm chậm thêm.
// ============================================================
const HIEU_NANG_SHEET = "SYS_HieuNang";
const HIEU_NANG_HEADERS = ["Thời gian", "Chức năng", "Số giây", "Người dùng", "Kết quả", "Ghi chú"];
const HIEU_NANG_NGUONG_MS = 3000;
const HIEU_NANG_TOI_DA_DONG = 5000;          // giữ 5.000 lần gần nhất
const HIEU_NANG_GIOI_HAN_MS = 6 * 60 * 1000;  // giới hạn mỗi lần chạy của Apps Script
const HIEU_NANG_TRIGGER_TIEN_TO = "HN_TRIGGER_DANG_CHAY_";
const HIEU_NANG_KET_QUA = { OK: "OK", LOI: "Lỗi", QUA_GIO: "Quá giờ" };

function _sheetHieuNang_() {
  const { ss } = getDraftSheets_();
  let sh = ss.getSheetByName(HIEU_NANG_SHEET);
  if (!sh) {
    sh = ss.insertSheet(HIEU_NANG_SHEET);
    sh.getRange(1, 1, 1, HIEU_NANG_HEADERS.length).setValues([HIEU_NANG_HEADERS]).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}
function _ghiHieuNang_(chucNang, soMs, ketQua, ghiChu) {
  try {
    const sh = _sheetHieuNang_();
    const nd = _nguoiDungHienTai_ || _xacDinhNguoiDung_();
    sh.getRange(sh.getLastRow() + 1, 1, 1, HIEU_NANG_HEADERS.length).setValues(_dongAnToan_([[
      new Date(), chucNang, Math.round(soMs / 100) / 10, (nd && nd.email) || "", ketQua, String(ghiChu || "").slice(0, 300)
    ]]));
    const du = sh.getLastRow() - 1 - HIEU_NANG_TOI_DA_DONG;
    if (du > 500) sh.deleteRows(2, du); // xóa theo đợt, không phải mỗi lần ghi
  } catch (e) { /* đo hiệu năng không được làm hỏng chức năng chính */ }
}
/** ghiChu: chuỗi, hoặc lỗi (chỉ lấy câu thông báo - nhật ký lỗi đã do nơi xử lý lỗi ghi). */
function _ghiNeuCham_(chucNang, batDau, ketQua, ghiChu) {
  const soMs = Date.now() - batDau;
  if (soMs < HIEU_NANG_NGUONG_MS) return;
  _ghiHieuNang_(chucNang, soMs, ketQua, ghiChu && typeof ghiChu === "object" ? String(ghiChu.message || ghiChu) : ghiChu);
}
/** Chạy 1 trigger có đo thời gian; ghi các lần trước bị Google dừng giữa chừng. */
function _chayTriggerCoDo_(ten, fn) {
  _ghiTriggerQuaGio_();
  const props = PropertiesService.getScriptProperties();
  const batDau = Date.now();
  props.setProperty(HIEU_NANG_TRIGGER_TIEN_TO + ten, String(batDau));
  try {
    const ketQua = fn();
    _ghiNeuCham_("Trigger: " + ten, batDau, HIEU_NANG_KET_QUA.OK, "");
    return ketQua;
  } catch (e) {
    _ghiNeuCham_("Trigger: " + ten, batDau, HIEU_NANG_KET_QUA.LOI, e);
    throw e;
  } finally {
    props.deleteProperty(HIEU_NANG_TRIGGER_TIEN_TO + ten);
  }
}
/** Trigger bắt đầu lúc batDau (ms) còn có thể đang chạy (chưa quá giới hạn 6 phút + 1 phút dư). */
function _triggerConChay_(batDau) {
  return Date.now() - batDau <= HIEU_NANG_GIOI_HAN_MS + 60000;
}
/** Tên dễ hiểu của các lần đồng bộ (trigger) - hiện cho người dùng khi phải chờ. */
const TEN_DONG_BO = {
  dailyRefreshAllCaches_: "Cập nhật 7:30 / 13:00 (phiếu cân, hợp đồng, công nợ)",
  daily15hRefresh_: "Cập nhật 15h (phân tích nhập / thanh toán, công nợ phiếu cân)",
  refreshAllDraftCaches10Min_: "Làm mới 10 phút (phiếu cân chưa thanh toán, hợp đồng)"
};
/** Các lần đồng bộ đang chạy: [{ ten, batDau (dd/MM HH:mm), daChayGiay }] - đọc 1 lần Script
 * Properties (không đọc sheet), gọi ở mọi lời gọi web. */
function _dongBoDangChay_() {
  const tatCa = PropertiesService.getScriptProperties().getProperties();
  return Object.keys(tatCa).filter(k => k.indexOf(HIEU_NANG_TRIGGER_TIEN_TO) === 0)
    .map(k => ({ ma: k.slice(HIEU_NANG_TRIGGER_TIEN_TO.length), batDau: Number(tatCa[k]) }))
    .filter(x => x.batDau && _triggerConChay_(x.batDau))
    .map(x => ({
      ten: TEN_DONG_BO[x.ma] || x.ma,
      batDau: Utilities.formatDate(new Date(x.batDau), "GMT+7", "HH:mm"),
      daChayGiay: Math.max(0, Math.round((Date.now() - x.batDau) / 1000)),
      toiDaGiay: Math.round((HIEU_NANG_GIOI_HAN_MS + 60000) / 1000)
    }));
}
/** #Web: trạng thái đồng bộ - trình duyệt hỏi lại trong lúc chờ. */
function getTrangThaiDongBo_() {
  return _dongBoDangChay_();
}
function _ghiTriggerQuaGio_() {
  const props = PropertiesService.getScriptProperties();
  const tatCa = props.getProperties();
  Object.keys(tatCa).filter(k => k.indexOf(HIEU_NANG_TRIGGER_TIEN_TO) === 0).forEach(k => {
    const batDau = Number(tatCa[k]);
    if (_triggerConChay_(batDau)) return; // còn có thể đang chạy
    _ghiHieuNang_("Trigger: " + k.slice(HIEU_NANG_TRIGGER_TIEN_TO.length), HIEU_NANG_GIOI_HAN_MS, HIEU_NANG_KET_QUA.QUA_GIO,
      "Bị Google dừng ở giới hạn 6 phút, bắt đầu lúc " + Utilities.formatDate(new Date(batDau), "GMT+7", "dd/MM/yyyy HH:mm"));
    props.deleteProperty(k);
  });
}
/** #Web: trình duyệt báo 1 lời gọi bị Google dừng vì quá 6 phút. */
function ghiQuaGioTrinhDuyet_(tenHam, soGiay) {
  if (!Object.prototype.hasOwnProperty.call(API_ROUTES, tenHam)) return { success: false };
  const giay = Math.max(0, Math.min(3600, Number(soGiay) || 0));
  _ghiHieuNang_(tenHam, giay * 1000, HIEU_NANG_KET_QUA.QUA_GIO, "Google dừng lời gọi (quá giới hạn thời gian chạy)");
  return { success: true };
}
/** #Web (Hệ Thống): chức năng chạy chậm / quá giờ trong khoảng ngày, chậm nhất trước. */
function getHieuNangForWeb_(fDate, tDate) {
  _ghiTriggerQuaGio_();
  const sh = _sheetHieuNang_();
  const lr = sh.getLastRow();
  const dong = (lr > 1 ? sh.getRange(2, 1, lr - 1, HIEU_NANG_HEADERS.length).getValues() : [])
    .filter(r => r[0] instanceof Date && _inDateRange_(r[0], fDate, tDate));
  const nhom = new Map();
  dong.forEach(r => {
    const ten = String(r[1]);
    if (!nhom.has(ten)) nhom.set(ten, { chucNang: ten, soLan: 0, tongGiay: 0, lauNhat: 0, quaGio: 0, loi: 0, ganNhat: null });
    const o = nhom.get(ten), giay = utils.parseNum(r[2]);
    o.soLan++; o.tongGiay += giay; o.lauNhat = Math.max(o.lauNhat, giay);
    if (r[4] === HIEU_NANG_KET_QUA.QUA_GIO) o.quaGio++;
    if (r[4] === HIEU_NANG_KET_QUA.LOI) o.loi++;
    if (!o.ganNhat || r[0] > o.ganNhat) o.ganNhat = r[0];
  });
  return {
    nguongGiay: HIEU_NANG_NGUONG_MS / 1000,
    tongHop: Array.from(nhom.values())
      .map(o => ({ chucNang: o.chucNang, soLan: o.soLan, tbGiay: Math.round(o.tongGiay / o.soLan * 10) / 10, lauNhat: o.lauNhat, quaGio: o.quaGio, loi: o.loi,
        ganNhat: Utilities.formatDate(o.ganNhat, "GMT+7", "dd/MM/yyyy HH:mm") }))
      .sort((a, b) => b.quaGio - a.quaGio || b.lauNhat - a.lauNhat),
    ganDay: dong.slice(-50).reverse().map(r => ({ thoiGian: Utilities.formatDate(r[0], "GMT+7", "dd/MM/yyyy HH:mm:ss"), chucNang: String(r[1]),
      giay: utils.parseNum(r[2]), nguoiDung: String(r[3]), ketQua: String(r[4]), ghiChu: String(r[5]) }))
  };
}

/** Đăng nhập từ trang nhúng: cửa sổ nhỏ (Cổng -> web app ?sso) để lại phiên /
 * lỗi theo mã yêu cầu cho khung nhúng lấy, rồi tự đóng. */
function _trangDangNhapNhung_(yeuCau, phien, loi) {
  CacheService.getScriptCache().put(AUTH_CFG.TIEN_TO_YEU_CAU + yeuCau, JSON.stringify(phien ? { phien } : { loi }), AUTH_CFG.YEU_CAU_TTL_GIAY);
  const noiDung = phien
    ? '<h2 style="color:#1f6f43">✅ Đăng nhập thành công</h2><p>Quay lại trang đang dùng - cửa sổ này tự đóng.</p>'
    : '<h2 style="color:#b00">Không đăng nhập được</h2><p>' + String(loi).replace(/[&<>"']/g, c => "&#" + c.charCodeAt(0) + ";") + '</p>';
  return HtmlService.createHtmlOutput('<div style="font-family:Arial,sans-serif;padding:32px;text-align:center">' + noiDung
    + '<button onclick="window.top.close()" style="margin-top:12px;padding:10px 20px">Đóng cửa sổ</button></div>'
    + (phien ? '<script>setTimeout(function () { try { window.top.close(); } catch (e) {} }, 1200);</script>' : ''))
    .setTitle("Đăng nhập HAK");
}
/** CÔNG KHAI: khung nhúng lấy phiên theo mã yêu cầu của mình (dùng 1 lần).
 * Trả {phien}, {loi}, hoặc {} khi chưa đăng nhập xong. */
function nhanPhienDangNhap(yeuCau) {
  if (!MAU_MA_YEU_CAU.test(String(yeuCau || ""))) return {};
  const cache = CacheService.getScriptCache();
  const khoa = AUTH_CFG.TIEN_TO_YEU_CAU + yeuCau;
  const raw = cache.get(khoa);
  if (!raw) return {};
  cache.remove(khoa);
  try { return JSON.parse(raw); } catch (e) { return {}; }
}

/** CÔNG KHAI: hủy phiên (chỉ xóa đúng mã phiên được gửi lên). */
function dangXuat(phien) {
  if (MAU_MA_PHIEN.test(String(phien || ""))) CacheService.getScriptCache().remove(AUTH_CFG.TIEN_TO_PHIEN + phien);
  return { success: true };
}

/** CỬA VÀO DUY NHẤT cho web app: kiểm tra phiên + quyền rồi gọi đúng hàm
 * nghiệp vụ đã đăng ký trong API_ROUTES. */
function api(phien, tenHam, thamSo) {
  const route = Object.prototype.hasOwnProperty.call(API_ROUTES, tenHam) ? API_ROUTES[tenHam] : null;
  if (!route) throw new Error("Chức năng không tồn tại: " + tenHam);
  _nguoiDungHienTai_ = null;
  try {
    if (phien) {
      const email = _docPhien_(phien);
      if (!email) throw new Error(AUTH_CFG.LOI_DANG_NHAP + "Phiên đăng nhập đã hết hạn - vui lòng đăng nhập lại.");
      _nguoiDungHienTai_ = { email, vaiTro: _vaiTroCua_(email) };
    }
    _yeuCauQuyen_(route.quyen);
    // Đang đồng bộ (trigger cập nhật dữ liệu đang chạy): chưa chạy thao tác, báo trình duyệt
    // chờ xong rồi tự gọi lại - tránh chạy chồng lên nhau (chậm, có thể quá 6 phút).
    if (!route.khongChoDongBo) {
      const dangChay = _dongBoDangChay_();
      if (dangChay.length) throw new Error(AUTH_CFG.LOI_DONG_BO + JSON.stringify(dangChay));
    }
    const batDau = Date.now();
    try {
      const ketQua = route.fn.apply(null, Array.isArray(thamSo) ? thamSo : []);
      _ghiNeuCham_(tenHam, batDau, HIEU_NANG_KET_QUA.OK, "");
      return ketQua;
    } catch (e) {
      _ghiNeuCham_(tenHam, batDau, HIEU_NANG_KET_QUA.LOI, e);
      throw e;
    }
  } catch (e) {
    if (e && LOI_LAP_TRINH.indexOf(e.name) !== -1) throw new Error(_loiChoNguoiDung_(e));
    throw e;
  } finally {
    _nguoiDungHienTai_ = null;
  }
}

/** Bảng phân quyền duy nhất: tên chức năng (trình duyệt gọi) -> hàm nội bộ + quyền cần có.
 * Chức năng không có trong bảng này thì KHÔNG gọi được từ web app. */
// ------------------------------------------------------------
// QUY ĐỊNH KHOẢNG NGÀY BÁO CÁO (người dùng 28/09/2026): Báo Cáo Thanh Toán (Gỗ Keo, Chi
// Tiết, MISA, UNC) xem và xuất chỉ trong phạm vi 1 tháng. Trình duyệt chặn khi chọn; cổng
// API kiểm tra lại (hàm nội bộ, trigger không bị giới hạn).
// ------------------------------------------------------------
const KHOANG_BAO_CAO = { SO_THANG: 1 };
/** "Đến ngày" xa nhất được chọn khi bắt đầu từ fDate (yyyy-MM-dd): fDate + SO_THANG tháng
 * - 1 ngày (01/09 -> 30/09, 15/08 -> 14/09); ngày không có ở tháng đích (31/01) -> cuối
 * tháng đích. Cùng quy tắc với _denNgayToiDaBaoCao ở trình duyệt. */
function _denNgayToiDaBaoCao_(fDate) {
  const [y, m, d] = String(fDate).split("-").map(Number);
  const cuoiThangDich = new Date(Date.UTC(y, m - 1 + KHOANG_BAO_CAO.SO_THANG + 1, 0));
  const kq = d > cuoiThangDich.getUTCDate() ? cuoiThangDich : new Date(Date.UTC(y, m - 1 + KHOANG_BAO_CAO.SO_THANG, d - 1));
  return kq.toISOString().slice(0, 10);
}
/** Báo lỗi (dừng) nếu khoảng [fDate, tDate] không hợp lệ hoặc dài quá SO_THANG tháng. */
function _kiemTraKhoangBaoCao_(fDate, tDate) {
  const laNgay = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ""));
  if (!laNgay(fDate) || !laNgay(tDate)) throw new Error("Chọn đủ Từ ngày / Đến ngày.");
  if (tDate < fDate) throw new Error('"Đến ngày" phải sau "Từ ngày".');
  const toiDa = _denNgayToiDaBaoCao_(fDate);
  if (tDate > toiDa) {
    throw new Error(`Quy định: báo cáo chỉ trong phạm vi ${KHOANG_BAO_CAO.SO_THANG} tháng - từ ${_formatNgayXuat_(fDate)} chỉ chọn được đến ${_formatNgayXuat_(toiDa)}.`);
  }
}
/** Bọc hàm báo cáo (fDate, tDate, ...) cho cổng API: kiểm tra khoảng ngày trước khi chạy. */
function _theoKhoangBaoCao_(fn) {
  return (fDate, tDate, ...khac) => { _kiemTraKhoangBaoCao_(fDate, tDate); return fn(fDate, tDate, ...khac); };
}

const API_ROUTES = (() => {
  const X = QUYEN.XEM, N = QUYEN.NGHIEP_VU, H = QUYEN.HE_THONG, Q = QUYEN.QUAN_TRI;
  // khongCho: chức năng rất nhẹ / phục vụ việc chờ - chạy ngay cả khi đang đồng bộ.
  const r = (fn, quyen, khongCho) => ({ fn, quyen, khongChoDongBo: !!khongCho });
  const KHONG_CHO = true;
  return {
    // --- Chung, Trang chủ, Trợ lý AI ---
    getAppSetupStatus: r(getAppSetupStatus_, X, KHONG_CHO),
    getDashboardStats: r(getDashboardStats_, X),
    ghiQuaGioTrinhDuyet: r(ghiQuaGioTrinhDuyet_, X, KHONG_CHO),
    getTrangThaiDongBo: r(getTrangThaiDongBo_, X, KHONG_CHO),
    getDraftBadgeCount: r(getDraftBadgeCount_, X),
    TRA_LOI_CHATBOT: r(TRA_LOI_CHATBOT_, X),

    // --- Báo cáo thanh toán (xem + xuất Excel) ---
    getReportList: r(_theoKhoangBaoCao_(getReportList_), X),
    webExportReport: r(webExportReport_, X),
    getChiTietDNTTDaChot: r(_theoKhoangBaoCao_(getChiTietDNTTDaChot_), X),
    exportChiTietDNTTDaChotExcel: r(_theoKhoangBaoCao_(exportChiTietDNTTDaChotExcel_), X),
    getMisaDataTheoNgay: r(_theoKhoangBaoCao_(getMisaDataTheoNgay_), X),
    exportMisaTheoNgayExcel: r(_theoKhoangBaoCao_(exportMisaTheoNgayExcel_), X),
    getLichSuUNC: r(_theoKhoangBaoCao_(getLichSuUNC_), X),
    exportLichSuUNCExcel: r(_theoKhoangBaoCao_(exportLichSuUNCExcel_), X),

    // --- Công nợ & phân tích (xem, xuất, tính lại số liệu báo cáo) ---
    getDebtByCustomer: r(getDebtByCustomer_, X),
    getDebtByContract: r(getDebtByContract_, X),
    getCongNoTrangThai: r(getCongNoTrangThai_, X, KHONG_CHO),
    getDebtLedgerDetail: r(getDebtLedgerDetail_, X),
    getDoiChieuCongNoCccd: r(getDoiChieuCongNoCccd_, X),
    getPaymentAnalysis: r(getPaymentAnalysis_, X),
    getPhanTichNhapTTReport: r(getPhanTichNhapTTReport_, X),
    exportPhanTichNhapTTBaoCao: r(exportPhanTichNhapTTBaoCao_, X),
    getChiTietCongNoPhieuCanWeb: r(getChiTietCongNoPhieuCanWeb_, X),
    exportChiTietCongNoPhieuCanExcel: r(exportChiTietCongNoPhieuCanExcel_, X),
    getTinhHinhThanhToanHangNgayWeb: r(getTinhHinhThanhToanHangNgayWeb_, X),
    exportTinhHinhThanhToanExcel: r(exportTinhHinhThanhToanExcel_, X),
    webRunCongNoRefreshNow: r(webRunCongNoRefreshNow_, X),
    webRunDaily15hRefreshNow: r(webRunDaily15hRefreshNow_, X),
    // Chỉ đọc vùng định dạng (màn Duyệt cần để ghi đúng định dạng ngày/số).
    getRegionInfoForWeb: r(getRegionInfoForWeb_, X),

    // --- Tạo mới ĐNTT (Kế toán) ---
    getBulkReferenceData: r(getBulkReferenceData_, N),
    getAvailablePhieuCanForChuRung: r(getAvailablePhieuCanForChuRung_, N),
    getHopDongSummary: r(getHopDongSummary_, N),
    webRefreshCreateFlowData: r(webRefreshCreateFlowData_, N),
    // Nút "↻ Làm mới" trên thanh trên cùng: chỉ dựng lại cache, không sửa dữ liệu gốc.
    webRefreshPhieuCanCache: r(webRefreshPhieuCanCache_, N),
    webSuaTenKhachHangPhieuCan: r(webSuaTenKhachHangPhieuCan_, N),
    createNewPaymentRequest: r(createNewPaymentRequest_, N),

    // --- Danh sách ĐNTT / Nháp / Duyệt (Kế toán) ---
    getDraftListSummary: r(getDraftListSummary_, N),
    getDraftRecordDetail: r(getDraftRecordDetail_, N),
    webInPhieuChiTietThanhToan: r(webInPhieuChiTietThanhToan_, N),
    webInPhieuHoanThanhThanhToan: r(webInPhieuHoanThanhThanhToan_, X),
    getPhieuHoanThanh: r(getPhieuHoanThanh_, X),
    updateDraft112Info: r(updateDraft112Info_, N),
    addPhieuCanToDraft: r(addPhieuCanToDraft_, N),
    removePhieuCanFromDraft: r(removePhieuCanFromDraft_, N),
    runDeleteDraftRecord: r(runDeleteDraftRecord_, N),
    webRunCreate112: r(webRunCreate112_, N),
    runXacNhanDNTT: r(runXacNhanDNTT_, N),
    runHuyXacNhanDNTT: r(runHuyXacNhanDNTT_, N),
    exportBaoCaoDNTTFromDraft: r(exportBaoCaoDNTTFromDraft_, N),
    getUncConfigForWeb: r(getUncConfigForWeb_, N),
    webCreateUNCFromDraft: r(webCreateUNCFromDraft_, N),
    webConfirmPayment: r(webConfirmPayment_, N),

    // --- Hệ thống: đối soát, bảo trì, sửa dữ liệu đã chốt (Quản trị + Kế toán tổng hợp) ---
    getDoiSoatTenKhachHang: r(getDoiSoatTenKhachHang_, H),
    webDongBoTenKhachHang: r(webDongBoTenKhachHang_, H),
    exportDoiSoatTenKhachHangExcel: r(exportDoiSoatTenKhachHangExcel_, H),
    getKiemTraDoiChieuBaoTri: r(getKiemTraDoiChieuBaoTri_, H),
    webXoaCTMoCoi: r(webXoaCTMoCoi_, H),
    webXoaSrcMoCoi: r(webXoaSrcMoCoi_, H),
    webXoaMoCoiChiTietDNTT: r(webXoaMoCoiChiTietDNTT_, H),
    webXoaMoCoiChiTietUNC: r(webXoaMoCoiChiTietUNC_, H),
    runFillMissingBankOnly: r(runFillMissingBankOnly, H),
    timChuRungDaChot: r(timChuRungDaChot_, H),
    webMoDongThanhToanTheoHoSo: r(webMoDongThanhToanTheoHoSo_, H),
    getLichSuSuaDoi: r(getLichSuSuaDoi_, H),
    getDanhSachSaoLuuXoa: r(getDanhSachSaoLuuXoa_, H),
    webKhoiPhucSaoLuuXoa: r(webKhoiPhucSaoLuuXoa_, H),
    dongBoChiTietDNTTTuDauLichSu: r(dongBoChiTietDNTTTuDauLichSu_, H),
    webTaoLaiMisaTheoNgay: r(webTaoLaiMisaTheoNgay_, H),
    webDonDepMisa: r(webDonDepMisa_, H),
    webDonDepUnc: r(webDonDepUnc_, H),
    webTaoBoSungMisa: r(webTaoBoSungMisa_, N),
    webTaoLaiUNCTheoNgay: r(webTaoLaiUNCTheoNgay_, H),
    webKhoaSoNam: r(webKhoaSoNam_, H),
    getHieuNangForWeb: r(getHieuNangForWeb_, H),

    // --- Cài đặt (Quản trị) ---
    getMainSsInfoForWeb: r(getMainSsInfoForWeb_, Q),
    webSetMainSsId: r(webSetMainSsId_, Q),
    getLuuTruNamForWeb: r(getLuuTruNamForWeb_, Q),
    webSetLuuTruNam: r(webSetLuuTruNam_, Q),
    setupDraftSpreadsheet: r(setupDraftSpreadsheet_, Q),
    getConfigLinksForSettings: r(getConfigLinksForSettings_, Q),
    webSetSwappableLink: r(webSetSwappableLink_, Q),
    getSharedUsersForLink: r(getSharedUsersForLink_, Q),
    webShareConfigLink: r(webShareConfigLink_, Q),
    webRevokeConfigLinkAccess: r(webRevokeConfigLinkAccess_, Q),
    getTriggerStatusForWeb: r(getTriggerStatusForWeb_, Q),
    webXacNhanHeaderPhieuCanMoi: r(webXacNhanHeaderPhieuCanMoi_, Q),
    getFormatLockStatusForWeb: r(getFormatLockStatusForWeb_, Q),
    webKhoaDinhDangTextTatCa: r(webKhoaDinhDangTextTatCa_, Q),
    webSetupPcCacheAutoRefreshTrigger: r(webSetupPcCacheAutoRefreshTrigger_, Q),
    setup10MinRefreshTrigger: r(setup10MinRefreshTrigger_, Q),
    setupDaily15hTrigger: r(setupDaily15hTrigger_, Q),
    webResetPhanTichNhapTTSheet: r(webResetPhanTichNhapTTSheet_, Q),
    webResetChiTietCongNoSheet: r(webResetChiTietCongNoSheet_, Q),
    getSheetLocaleInfoForWeb: r(getSheetLocaleInfoForWeb_, Q),
    webSetRegion: r(webSetRegion_, Q),
    getExportRegionInfoForWeb: r(getExportRegionInfoForWeb_, Q),
    webSetExportRegion: r(webSetExportRegion_, Q),
    getMisaDefaultsForWeb: r(getMisaDefaultsForWeb_, Q),
    webSetMisaDefaults: r(webSetMisaDefaults_, Q),
    webSetUncConfig: r(webSetUncConfig_, Q),
    getChatbotSettingsForWeb: r(getChatbotSettingsForWeb_, Q),
    webSetChatbotApiKey: r(webSetChatbotApiKey_, Q),
    webSetGeminiModels: r(webSetGeminiModels_, Q),
    webDoModelGemini: r(webDoModelGemini_, Q),
    generateThongSoSheet: r(generateThongSoSheet_, Q),

    // --- Người dùng & Cổng đăng nhập (Quản trị) ---
    getDanhSachNguoiDungForWeb: r(getDanhSachNguoiDungForWeb_, Q),
    webLuuNguoiDung: r(webLuuNguoiDung_, Q),
    getCauHinhDangNhapForWeb: r(getCauHinhDangNhapForWeb_, Q),
    webSetCongDangNhapUrl: r(webSetCongDangNhapUrl_, Q),
    webTaoLaiSsoSecret: r(webTaoLaiSsoSecret_, Q)
  };
})();

// ----- Quản trị người dùng & Cổng đăng nhập (chỉ Quản trị, qua api) -----

function getDanhSachNguoiDungForWeb_() {
  _getNguoiDungSheet_();
  CacheService.getScriptCache().remove(AUTH_CFG.CACHE_KEY_NGUOI_DUNG);
  return {
    chuScript: _emailChuScript_(),
    quanTriCoDinh: QUAN_TRI_CO_DINH.map(_chuanHoaEmail_),
    vaiTro: Object.keys(VAI_TRO).map(ma => ({ ma, nhan: VAI_TRO_NHAN[ma] })),
    trangThai: Object.values(TRANG_THAI_NGUOI_DUNG),
    nguoiDung: _docDanhSachNguoiDung_().map(x => ({ email: x.email, hoTen: x.hoTen, vaiTro: x.vaiTro, trangThai: x.trangThai }))
  };
}

/** Thêm mới hoặc cập nhật 1 người dùng (theo email). Không xóa - dùng trạng thái "Khóa". */
function webLuuNguoiDung_(duLieu) {
  try {
    const email = _chuanHoaEmail_(duLieu && duLieu.email);
    const vaiTro = String((duLieu && duLieu.vaiTro) || "").trim().toUpperCase();
    const trangThai = (duLieu && duLieu.trangThai) === TRANG_THAI_NGUOI_DUNG.KHOA ? TRANG_THAI_NGUOI_DUNG.KHOA : TRANG_THAI_NGUOI_DUNG.HOAT_DONG;
    const hoTen = String((duLieu && duLieu.hoTen) || "").trim();
    if (!MAU_EMAIL.test(email)) return { success: false, message: "❌ Email không hợp lệ." };
    if (!QUYEN_THEO_VAI_TRO[vaiTro]) return { success: false, message: "❌ Vai trò không hợp lệ." };
    if (_laQuanTriCoDinh_(email)) return { success: false, message: "⚠️ Email này là Quản trị cố định (chủ script hoặc khai báo trong code) - không cần thêm/không thể đổi từ web app." };

    const ketQua = _chayTrongKhoa_(() => {
      const sh = _getNguoiDungSheet_();
      CacheService.getScriptCache().remove(AUTH_CFG.CACHE_KEY_NGUOI_DUNG);
      const cu = _docDanhSachNguoiDung_().find(x => x.email === email);
      const dong = [email, hoTen, vaiTro, trangThai, new Date(), _emailNguoiThucHien_() || "N/A"];
      if (cu) _ghiTheoDong_(sh, [{ row: cu.dong, values: dong }], 1);
      else sh.getRange(sh.getLastRow() + 1, 1, 1, dong.length).setValues(_dongAnToan_([dong]));
      CacheService.getScriptCache().remove(AUTH_CFG.CACHE_KEY_NGUOI_DUNG);
      return cu;
    });
    const chiTiet = ketQua
      ? `${email}: vai trò ${ketQua.vaiTro} → ${vaiTro}, trạng thái ${ketQua.trangThai} → ${trangThai}`
      : `Thêm ${email}: vai trò ${vaiTro}, trạng thái ${trangThai}`;
    logAction_("PHAN_QUYEN", email, chiTiet);
    return { success: true, message: `✅ Đã lưu người dùng ${email} (${VAI_TRO_NHAN[vaiTro]}, ${trangThai}).` };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  }
}

function getCauHinhDangNhapForWeb_() {
  const appUrl = ScriptApp.getService().getUrl() || "";
  return {
    appUrl,
    congDangNhapUrl: PropertiesService.getScriptProperties().getProperty(AUTH_CFG.PROP_CONG_DANG_NHAP_URL) || "",
    maNguon: _maNguonCongDangNhap_(appUrl, _laySsoSecret_())
  };
}

function webSetCongDangNhapUrl_(url) {
  const u = String(url || "").trim();
  if (!MAU_URL_CONG_DANG_NHAP.test(u)) {
    return { success: false, message: "❌ Link Cổng đăng nhập phải có dạng https://script.google.com/macros/s/.../exec" };
  }
  PropertiesService.getScriptProperties().setProperty(AUTH_CFG.PROP_CONG_DANG_NHAP_URL, u);
  logAction_("CAU_HINH_DANG_NHAP", "-", "Đổi link Cổng đăng nhập: " + u);
  return { success: true, message: "✅ Đã lưu link Cổng đăng nhập." };
}

/** Đổi mã bí mật (khi nghi bị lộ). Phải dán lại mã nguồn mới vào Cổng đăng nhập. */
function webTaoLaiSsoSecret_() {
  PropertiesService.getScriptProperties().setProperty(AUTH_CFG.PROP_SSO_SECRET, _taoMaNgauNhien_());
  logAction_("CAU_HINH_DANG_NHAP", "-", "Tạo lại mã bí mật Cổng đăng nhập - cần dán lại mã nguồn Cổng đăng nhập.");
  return { success: true, message: "✅ Đã tạo mã bí mật mới. Hãy dán lại mã nguồn mới vào dự án Cổng đăng nhập và Deploy lại (Manage deployments > Edit > New version)." };
}

function doGet(e) {
  const thamSo = (e && e.parameter) || {};
  if (thamSo.action) {
    // Không còn hành động nào qua link ?action= : v2026.7 bỏ tach_phieu /
    // lap_de_nghi / tim_phieu_can / tra_cuu_hop_dong, v2026.9.9 bỏ webhook
    // lam_moi_cache (người dùng yêu cầu). Đoạn mã onChange cũ còn cài ở file
    // Phiếu Cân / HD_NCC chỉ nhận lỗi này, không làm gì thêm.
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Hành động không hợp lệ." })).setMimeType(ContentService.MimeType.JSON);
  }
  const tpl = HtmlService.createTemplateFromFile('Index');
  tpl.phien = "";
  tpl.loiDangNhap = "";
  tpl.soThangBaoCao = KHOANG_BAO_CAO.SO_THANG;
  tpl.trangDau = TRANG_MO_THANG.indexOf(String(thamSo.trang || "")) !== -1 ? String(thamSo.trang) : "";
  if (thamSo.sso) {
    let yeuCau = "";
    try {
      const xacMinh = _xacMinhSso_(thamSo.sso);
      const email = xacMinh.email;
      yeuCau = xacMinh.yeuCau;
      const vaiTro = _vaiTroCua_(email);
      _nguoiDungHienTai_ = { email, vaiTro };
      if (vaiTro) {
        tpl.phien = _taoPhien_(email);
        logAction_("DANG_NHAP", email, "Đăng nhập qua Cổng đăng nhập Gmail" + (yeuCau ? " (từ trang nhúng)." : "."));
      } else {
        tpl.loiDangNhap = `Tài khoản ${email} chưa được cấp quyền hoặc đã bị khóa - liên hệ Quản trị để được thêm vào hệ thống.`;
        logAction_("DANG_NHAP_BI_TU_CHOI", email, "Email chưa được cấp quyền / đã khóa.");
      }
    } catch (err) {
      tpl.loiDangNhap = String((err && err.message) || err);
    } finally {
      _nguoiDungHienTai_ = null;
    }
    if (yeuCau) return _trangDangNhapNhung_(yeuCau, tpl.phien, tpl.loiDangNhap);
  }
  return tpl.evaluate()
      .setTitle("QUẢN LÝ THANH TOÁN HAK")
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ============================================================
// TRUY VẤN NGOẠI VI (mở an toàn có try/catch dùng chung)
// ============================================================
function openExternalSheet_(ssId, sheetName, labelForError) {
  try {
    const ss = SpreadsheetApp.openById(ssId);
    const sh = ss.getSheetByName(sheetName);
    if (!sh) throw new Error(`Không tìm thấy sheet "${sheetName}" trong file ${labelForError}.`);
    return sh;
  } catch (e) {
    throw new Error(`Không thể kết nối File ${labelForError}: ` + _loiChoNguoiDung_(e));
  }
}

// ============================================================
// MỚI (mục J): TRUY CẬP FILE NHÁP
// ============================================================
// ============================================================
// MỚI (theo yêu cầu - quay lại kiến trúc "gắn liền", nhưng gắn với FILE
// NHÁP thay vì File Chính): code này giờ CHẠY BÊN TRONG chính File Nháp
// (dùng SpreadsheetApp.getActive() trực tiếp cho Draft - xem
// getDraftSheets_() ở dưới, không cần cấu hình ID gì cho File Nháp cả).
// Còn "File Chính" (DNTT_GK_DN/CT/112/Nhật Ký) là file KHÁC, nên vẫn
// phải biết CHÍNH XÁC ID của nó qua cấu hình (giống hệt cơ chế cũ dùng
// cho File Nháp trước đây, giờ chỉ đổi vai trò cho nhau).
// CHẠY 1 LẦN DUY NHẤT (menu Sheet "🚀 QUẢN LÝ HAK" > "🔗 Kết Nối File
// Chính", hoặc mục Cài Đặt trên Web App) để dán ID/URL File Chính.
// ============================================================
function getMainSsId_() {
  const id = PropertiesService.getScriptProperties().getProperty('MAIN_SS_ID');
  if (!id) throw new Error("CHƯA cấu hình ID File Chính. Vào menu \"🚀 QUẢN LÝ HAK\" > \"🔗 Kết Nối File Chính\" (hoặc mục Cài Đặt trên Web App) để cấu hình.");
  return id;
}
function setMainSsId_(id) {
  PropertiesService.getScriptProperties().setProperty('MAIN_SS_ID', id);
}
/** Trả về đối tượng Spreadsheet của "File Chính" (DNTT_GK_DN/CT/112/
 * Nhật Ký...) - file này KHÁC với File Nháp (nơi code đang chạy), nên
 * phải mở qua ID đã cấu hình, không dùng SpreadsheetApp.getActive(). */
// File Chính đã mở trong LƯỢT CHẠY này (mỗi lời gọi web / trigger là 1 lượt
// riêng, biến toàn cục khởi tạo lại). openById tốn ~0,1-0,5 giây mà 1 lượt
// Duyệt/báo cáo gọi getMainSs_() hàng chục lần (mỗi logAction_...). Khóa
// theo ID: đổi File Chính giữa chừng vẫn mở đúng file mới.
let _fileChinhDaMo_ = null;
function getMainSs_() {
  const id = getMainSsId_();
  if (!_fileChinhDaMo_ || _fileChinhDaMo_.id !== id) _fileChinhDaMo_ = { id, ss: SpreadsheetApp.openById(id) };
  return _fileChinhDaMo_.ss;
}
// ============================================================
// LƯU TRỮ THEO NĂM (khóa sổ theo NGÀY THANH TOÁN - quy trình người dùng)
// Khóa sổ năm N: dữ liệu ĐNTT năm N chuyển sang file DATA<N> (GIỮ NGUYÊN tên
// sheet như File Chính), đăng ký ở Cài đặt; phiếu cân đã trả của các hồ sơ
// đó chuyển sang sheet PhieuCan_DN_<năm cân> trong file Phiếu Cân (cùng quy
// ước QL_NHAPKHO). Báo cáo chỉ mở các nguồn này khi khoảng ngày chạm năm
// đã khóa sổ - báo cáo năm đang mở không đọc thêm gì.
// ============================================================
const LUU_TRU_NAM_PROP = "LUU_TRU_NAM";   // {"2026": "<ID file DATA2026>"}
const LUU_TRU_CACHE_TTL = 21600;          // dữ liệu đã khóa sổ không đổi - giữ 6 giờ
const PC_SHEET_LUU_TRU_RE = /^PhieuCan_DN_(\d{4})$/;

function _docJsonProp_(ten) {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty(ten) || "{}"); }
  catch (e) { return {}; }
}
function _ghiJsonProp_(ten, giaTri) {
  PropertiesService.getScriptProperties().setProperty(ten, JSON.stringify(giaTri));
}
/** {năm: ID file DATA<năm>} đã khóa sổ (tự đăng ký khi Khóa sổ năm, hoặc trỏ lại ở Cài đặt). */
function _fileLuuTruTheoNam_() {
  return _docJsonProp_(LUU_TRU_NAM_PROP);
}
/** Năm đã khóa sổ (có file DATA) thuộc [fDate, tDate] ("yyyy-MM-dd", rỗng = không giới hạn), tăng dần. */
function _namLuuTruTrongKhoang_(fDate, tDate) {
  const tu = fDate ? Number(String(fDate).slice(0, 4)) : 0;
  const den = tDate ? Number(String(tDate).slice(0, 4)) : 9999;
  return Object.keys(_fileLuuTruTheoNam_()).map(Number).filter(n => n >= tu && n <= den).sort((a, b) => a - b);
}
/** Dòng dữ liệu (từ dòng 2, `soCot` cột) của sheet `tenSheet` trong file DATA<nam>.
 * Khóa cache gắn ID file: đăng ký lại file khác cho cùng năm không đọc nhầm dữ liệu cũ. */
function _docSheetLuuTru_(nam, tenSheet, soCot) {
  const id = _fileLuuTruTheoNam_()[nam];
  if (!id) return [];
  return _getCachedRefData_(`luutru_${id}_${tenSheet}_${soCot}`, () => {
    const sh = SpreadsheetApp.openById(id).getSheetByName(tenSheet);
    const lr = sh ? sh.getLastRow() : 0;
    return lr > 1 ? sh.getRange(2, 1, lr - 1, soCot).getValues() : [];
  }, LUU_TRU_CACHE_TTL);
}
/** Dòng của `tenSheet` trong các file DATA có năm thuộc khoảng (năm cũ trước). */
function _docLuuTruTrongKhoang_(tenSheet, soCot, fDate, tDate) {
  return _namLuuTruTrongKhoang_(fDate, tDate).reduce((acc, nam) => acc.concat(_docSheetLuuTru_(nam, tenSheet, soCot)), []);
}
/** Sổ đã chốt (DNTT_GK_DN_CT): năm đã khóa sổ thuộc khoảng + sổ đang mở.
 * docThang = true: sổ đang mở đọc thẳng sheet (báo cáo/trigger cần số mới nhất). */
function _ctGopLuuTru_(fDate, tDate, docThang) {
  return _docLuuTruTrongKhoang_(CFG.DNTT_CT, 22, fDate, tDate).concat(docThang ? _ctThatDocThang_() : _ctThatDataCache_());
}
/** Như _ctGopLuuTru_(…, docThang) nhưng sổ đang mở chỉ đọc các cột `cot` (0-based) - dòng
 * vẫn đủ 22 cột, cột không đọc để "". Dùng khi chỉ cần vài cột (vd Số phiếu cân, Ngày CK). */
function _ctCacCot_(fDate, tDate, cot) {
  const sh = _shCtThat_();
  return _docLuuTruTrongKhoang_(CFG.DNTT_CT, 22, fDate, tDate).concat(sh ? _docCacCot_(sh, cot, 22) : []);
}
/** DNTT_GK_DN_112 (23 cột): năm đã khóa sổ thuộc khoảng + sổ đang mở (đọc thẳng). */
function _h112GopLuuTru_(fDate, tDate) {
  const sh = getMainSs_().getSheetByName(CFG.DNTT_112);
  const lr = sh ? sh.getLastRow() : 0;
  return _docLuuTruTrongKhoang_(CFG.DNTT_112, 23, fDate, tDate).concat(lr > 1 ? sh.getRange(2, 1, lr - 1, 23).getValues() : []);
}
/** Các sheet PhieuCan_DN_<năm> trong file Phiếu Cân, năm tăng dần. */
function _pcSheetLuuTru_(ssPC) {
  return (ssPC || SpreadsheetApp.openById(CFG.PC_SS_ID)).getSheets()
    .map(sh => ({ sh, nam: Number((PC_SHEET_LUU_TRU_RE.exec(sh.getName()) || [])[1]) }))
    .filter(x => x.nam)
    .sort((a, b) => a.nam - b.nam);
}
function _khoaCachePcLuuTru_(nam) { return "luutru_pc_" + nam; }
/** Phiếu cân: sheet đang dùng + phiếu đã chuyển sang PhieuCan_DN_<năm> được
 * TRẢ trong năm đã khóa sổ thuộc [fDate, tDate]. Phiếu trả ở năm khóa sổ
 * trước khoảng không cộng lại - cùng quy tắc "công nợ đầu năm = phiếu chưa
 * trả mang sang". Khoảng không chạm năm đã khóa sổ -> chỉ đọc sheet đang dùng. */
function _pcGopLuuTru_(fDate, tDate) {
  const namDong = _namLuuTruTrongKhoang_(fDate, tDate);
  if (!namDong.length) return _pcData_();
  const traNamDong = new Set(_docLuuTruTrongKhoang_(CFG.DNTT_CT, 22, fDate, tDate).map(r => utils.standardize(r[11])).filter(Boolean));
  return _pcLuuTruDenNam_(namDong[namDong.length - 1])
    .filter(r => traNamDong.has(utils.standardize(r[PC_COL.SO_CT])))
    .concat(_pcData_());
}
/** Phiếu cân đã chuyển sang các sheet PhieuCan_DN_<năm> (năm <= namMax), có cache. */
function _pcLuuTruDenNam_(namMax) {
  return _pcSheetLuuTru_()
    .filter(x => x.nam <= namMax)
    .reduce((acc, x) => acc.concat(_getCachedRefData_(_khoaCachePcLuuTru_(x.nam), () => _docCacCot_(x.sh, PC_COT_CAN_DOC, PC_MIRROR_COLS), LUU_TRU_CACHE_TTL)), []);
}
/** Phiếu cân của các Số phiếu `soPhieu` (Set, đã utils.standardize) - KHÔNG đọc cả sheet:
 * sheet đang dùng chỉ đọc các dòng có Số phiếu cần (_docDongTheoKhoa_); khoảng [fDate, tDate]
 * chạm năm đã khóa sổ thì thêm phiếu đã chuyển sang PhieuCan_DN_<năm>. Cùng thứ tự với
 * _pcGopLuuTru_ (lưu trữ trước, sheet đang dùng sau). */
function _pcTheoSoPhieu_(soPhieu, fDate, tDate) {
  const khop = v => soPhieu.has(utils.standardize(v));
  const namDong = fDate ? _namLuuTruTrongKhoang_(fDate, tDate) : [];
  const cu = namDong.length ? _pcLuuTruDenNam_(namDong[namDong.length - 1]).filter(r => khop(r[PC_COL.SO_CT])) : [];
  return cu.concat(_docDongTheoKhoa_(openExternalSheet_(CFG.PC_SS_ID, CFG.PC_SHEET, "Phiếu Cân"), PC_COL.SO_CT, PC_MIRROR_COLS, khop));
}

/** #Web (Quản trị): danh sách file lưu trữ theo năm. */
function getLuuTruNamForWeb_() {
  const ds = _fileLuuTruTheoNam_();
  return Object.keys(ds).sort().map(nam => {
    try { const ss = SpreadsheetApp.openById(ds[nam]); return { nam, ten: ss.getName(), url: ss.getUrl(), ok: true }; }
    catch (e) { return { nam, ten: "", url: "", ok: false, loi: _loiChoNguoiDung_(e) }; }
  });
}
/** #Web (Quản trị): trỏ lại (hoặc bỏ, khi link rỗng) file DATA<năm> - dùng khi file
 * lưu trữ bị di chuyển/sao chép; bình thường Khóa sổ năm tự đăng ký. Kiểm tra
 * file có đủ các sheet sổ đã chốt trước khi lưu. */
function webSetLuuTruNam_(nam, link) {
  try {
    const n = Number(nam);
    if (!/^\d{4}$/.test(String(nam)) || n < 2000 || n > 2100) return { success: false, message: "❌ Năm không hợp lệ." };
    const ds = _fileLuuTruTheoNam_();
    const clean = String(link || "").trim();
    if (!clean) {
      delete ds[n];
      _ghiJsonProp_(LUU_TRU_NAM_PROP, ds);
      logAction_("CAU_HINH_LUU_TRU_NAM", String(n), "Bỏ đăng ký file lưu trữ năm " + n);
      return { success: true, message: `✅ Đã bỏ file lưu trữ năm ${n}.` };
    }
    const m = clean.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const id = m ? m[1] : clean;
    if (id === getMainSsId_()) return { success: false, message: "❌ Đây là File Chính đang dùng, không phải file lưu trữ." };
    const ss = SpreadsheetApp.openById(id);
    const thieu = [CFG.DNTT_SRC, CFG.DNTT_CT, CFG.DNTT_112].filter(t => !ss.getSheetByName(t));
    if (thieu.length) return { success: false, message: `❌ File "${ss.getName()}" thiếu sheet: ${thieu.join(", ")} (phải giữ nguyên tên sheet như File Chính).` };
    // Dòng còn nằm ở cả 2 nơi sẽ bị báo cáo cộng 2 lần -> chỉ nhận khi đã xóa khỏi File Chính.
    const shCTLT = ss.getSheetByName(CFG.DNTT_CT);
    const idLuuTru = new Set(shCTLT.getLastRow() > 1 ? shCTLT.getRange(2, 1, shCTLT.getLastRow() - 1, 1).getValues().map(r => String(r[0]).trim()).filter(Boolean) : []);
    const conTrongFileChinh = _ctThatDocThang_().filter(r => idLuuTru.has(String(r[0]).trim()));
    if (conTrongFileChinh.length) return { success: false, message: `❌ File Chính vẫn còn ${conTrongFileChinh.length} dòng ${CFG.DNTT_CT} có trong "${ss.getName()}" (vd ID ${conTrongFileChinh[0][0]}). Xóa các dòng năm ${n} khỏi File Chính rồi đăng ký lại - tránh báo cáo cộng trùng.` };
    ds[n] = id;
    _ghiJsonProp_(LUU_TRU_NAM_PROP, ds);
    logAction_("CAU_HINH_LUU_TRU_NAM", String(n), `Đăng ký file lưu trữ năm ${n}: ${ss.getName()} (${id})`);
    return { success: true, message: `✅ Đã trỏ năm ${n} tới "${ss.getName()}".` };
  } catch (e) {
    return { success: false, message: "❌ Không mở được file - kiểm tra lại link và quyền truy cập: " + _loiChoNguoiDung_(e) };
  }
}

// ------------------------------------------------------------
// KHÓA SỔ NĂM N - 1 thao tác, trong khóa hệ thống, Phiếu Cân và ĐNTT cùng lúc:
//  1. Hồ sơ của năm = hồ sơ có Ngày CK/TT (CT cột U) thuộc năm N.
//  2. Các dòng của những hồ sơ đó ở 5 sheet sổ (DNTT_GK_DN, _CT, _112,
//     ChiTietDNTT, ChiTietUNC) chép sang file DATA<N> (tự tạo cùng thư mục
//     File Chính, giữ nguyên tên sheet) -> xóa khỏi File Chính -> đăng ký file.
//  3. Phiếu cân đã trả trong năm đã khóa sổ -> PhieuCan_DN_<năm NGÀY CÂN>
//     trong file Phiếu Cân. Phiếu chưa trả ở lại = công nợ mang sang năm mới.
// Chép xong mới xóa; dòng đã có ở đích không chép lại -> bị dừng giữa chừng
// thì bấm lại để làm tiếp.
// ------------------------------------------------------------
const KHOA_SO_DANG_LAM_PROP = "KHOA_SO_DANG_LAM"; // {"2026": "<ID file DATA2026 tạo ở lần chạy chưa xong>"}
const KHOA_SO_GIOI_HAN_MS = 240000;               // dừng an toàn trước giới hạn 6 phút của Apps Script
const CHUYEN_PC_LO = 500;                         // số phiếu mỗi lượt chép + xóa

/** 5 sheet sổ chuyển sang file DATA: tên, số cột tối thiểu, cột (0-based) mã hồ sơ. */
function _sheetSoKhoaSo_() {
  return [
    { ten: CFG.DNTT_SRC, soCot: 18, cotHoSo: 0 },
    { ten: CFG.DNTT_CT, soCot: 22, cotHoSo: 1 },
    { ten: CFG.DNTT_112, soCot: 23, cotHoSo: 0 },
    { ten: CHITIET_DNTT_SHEET, soCot: CHITIET_DNTT_HEADERS.length, cotHoSo: 0 },
    { ten: CHITIET_UNC_SHEET, soCot: CHITIET_UNC_HEADERS.length, cotHoSo: 0 }
  ];
}
function _maHoSo_(v) { return String(v == null ? "" : v).trim(); }

/** Toàn bộ dòng (từ dòng 2) với đủ số cột thật của sheet. */
function _docHetDong_(sh, soCotToiThieu) {
  const soCot = Math.max(sh.getLastColumn(), soCotToiThieu);
  const lr = sh.getLastRow();
  return { soCot, rows: lr > 1 ? sh.getRange(2, 1, lr - 1, soCot).getValues() : [] };
}
/** Sheet `ten` trong file đích; tạo mới với dòng tiêu đề của sheet nguồn. */
function _sheetDichCungTieuDe_(ssDich, ten, shNguon, soCot) {
  let sh = ssDich.getSheetByName(ten);
  if (!sh) {
    sh = ssDich.insertSheet(ten);
    sh.getRange(1, 1, 1, soCot).setValues(shNguon.getRange(1, 1, 1, soCot).getValues()).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}
/** Ghi thêm dòng vào cuối sheet, GIỮ NGUYÊN giá trị: định dạng số theo dòng 2 của
 * sheet nguồn; ô chữ vẫn là chữ (không mất số 0 đầu, không thành công thức). */
function _ghiThemGiuNguyen_(shDich, rows, soCot, shNguon) {
  if (!rows.length) return;
  const vung = shDich.getRange(shDich.getLastRow() + 1, 1, rows.length, soCot);
  if (shNguon.getLastRow() > 1) {
    const dinhDang = shNguon.getRange(2, 1, 1, soCot).getNumberFormats()[0];
    vung.setNumberFormats(rows.map(() => dinhDang));
  }
  vung.setValues(_dongAnToan_(rows, Array.from({ length: soCot }, (_, i) => i)));
}
/** Tập giá trị (đã chuẩn hóa) của cột `cot` (0-based) từ dòng 2. */
function _tapGiaTriCot_(sh, cot, chuanHoa) {
  const lr = sh.getLastRow();
  return new Set(lr > 1 ? sh.getRange(2, cot + 1, lr - 1, 1).getValues().map(r => chuanHoa(r[0])).filter(Boolean) : []);
}
/** Xóa mọi dòng có cột `cot` (0-based, sau chuẩn hóa) thuộc tapKhoa - đọc lại cột ngay lúc xóa. */
function _xoaDongTheoKhoa_(sh, cot, tapKhoa, chuanHoa) {
  const lr = sh.getLastRow();
  if (lr < 2 || !tapKhoa.size) return 0;
  const dong = [];
  sh.getRange(2, cot + 1, lr - 1, 1).getValues().forEach((r, i) => { if (tapKhoa.has(chuanHoa(r[0]))) dong.push(i + 2); });
  _nhomDongLienTiep_(dong).reverse().forEach(([a, b]) => sh.deleteRows(a, b - a + 1));
  return dong.length;
}

/** Mã hồ sơ năm `nam`: trong sổ đang mở (Ngày CK/TT thuộc năm) + đã chép sang
 * file DATA ở lần chạy trước. cuHon: hồ sơ các năm trước còn trong sổ đang mở. */
function _hoSoCuaNam_(ctMo, ssData, nam) {
  const K = new Set(), cuHon = new Set();
  ctMo.forEach(r => {
    const ma = _maHoSo_(r[1]);
    if (!ma || !(r[20] instanceof Date)) return;
    const y = Number(Utilities.formatDate(r[20], "GMT+7", "yyyy"));
    if (y === nam) K.add(ma); else if (y < nam) cuHon.add(ma);
  });
  const shCT = ssData && ssData.getSheetByName(CFG.DNTT_CT);
  if (shCT) _tapGiaTriCot_(shCT, 1, _maHoSo_).forEach(ma => K.add(ma));
  return { K, cuHon };
}
/** File DATA<nam> mới, cùng thư mục + múi giờ/locale với File Chính. */
function _taoFileData_(nam, ssMain) {
  const ss = SpreadsheetApp.create("DATA" + nam);
  ss.setSpreadsheetTimeZone(ssMain.getSpreadsheetTimeZone());
  ss.setSpreadsheetLocale(ssMain.getSpreadsheetLocale());
  const cha = DriveApp.getFileById(ssMain.getId()).getParents();
  if (cha.hasNext()) DriveApp.getFileById(ss.getId()).moveTo(cha.next());
  const dangLam = _docJsonProp_(KHOA_SO_DANG_LAM_PROP);
  dangLam[nam] = ss.getId();
  _ghiJsonProp_(KHOA_SO_DANG_LAM_PROP, dangLam);
  return ss;
}

/** Phiếu cần chuyển - sổ đã khóa là căn cứ "đã trả". namTra: Số phiếu -> năm
 * khóa sổ đã trả; conMo: Số phiếu còn trong sổ đang mở. Mọi dòng cùng Số phiếu
 * đi cùng nhau: 1 dòng không đủ điều kiện thì cả số phiếu ở lại. */
function _phieuCanCanChuyenLuuTru_(shPC, namTra, conMo) {
  const { soCot, rows } = _docHetDong_(shPC, PC_MIRROR_COLS);
  const theoSo = new Map();
  rows.forEach(r => {
    const so = utils.standardize(r[PC_COL.SO_CT]);
    if (!so || !namTra.has(so)) return;
    if (!theoSo.has(so)) theoSo.set(so, []);
    theoSo.get(so).push(r);
  });
  const chuyen = [], boQua = [];
  theoSo.forEach((dong, so) => {
    const lyDo = conMo.has(so) ? "Vẫn còn trong sổ ĐNTT đang mở"
      : dong.some(r => !(r[PC_COL.NGAY_CAN_1] instanceof Date)) ? "Không có ngày cân (không biết chuyển sang sheet năm nào)"
      : "";
    if (lyDo) { boQua.push({ soPhieu: String(dong[0][PC_COL.SO_CT]).replace(/^'/, ""), lyDo }); return; }
    dong.forEach(r => chuyen.push({ so, values: r, nam: Number(Utilities.formatDate(r[PC_COL.NGAY_CAN_1], "GMT+7", "yyyy")) }));
  });
  return { chuyen, boQua, soCot };
}
/** Chuyển theo lô CHUYEN_PC_LO Số phiếu: chép phần còn thiếu (đếm theo Số phiếu
 * ở sheet đích) -> flush -> xóa đúng các Số phiếu đó. Dừng khi hết giờ. */
function _chuyenPhieuCanLuuTru_(shPC, pc, batDau) {
  const theoSo = new Map();
  pc.chuyen.forEach(x => { if (!theoSo.has(x.so)) theoSo.set(x.so, []); theoSo.get(x.so).push(x); });
  const dsSo = Array.from(theoSo.keys());
  const daChuyen = [];
  const sheetLT = new Map(); // năm -> { sh, dem: Số phiếu -> số dòng đã có }
  const demTheoSo = sh => {
    const dem = new Map();
    const lr = sh.getLastRow();
    if (lr > 1) sh.getRange(2, PC_COL.SO_CT + 1, lr - 1, 1).getValues().forEach(r => { const so = utils.standardize(r[0]); if (so) dem.set(so, (dem.get(so) || 0) + 1); });
    return dem;
  };
  for (let i = 0; i < dsSo.length && Date.now() - batDau <= KHOA_SO_GIOI_HAN_MS; i += CHUYEN_PC_LO) {
    const soLo = dsSo.slice(i, i + CHUYEN_PC_LO);
    const dongLo = soLo.flatMap(so => theoSo.get(so));
    Array.from(new Set(dongLo.map(x => x.nam))).forEach(nam => {
      if (!sheetLT.has(nam)) { const sh = _sheetDichCungTieuDe_(shPC.getParent(), "PhieuCan_DN_" + nam, shPC, pc.soCot); sheetLT.set(nam, { sh, dem: demTheoSo(sh) }); }
      const { sh, dem } = sheetLT.get(nam);
      const cuaNam = dongLo.filter(x => x.nam === nam);
      const ghi = [];
      cuaNam.reduce((m, x) => m.set(x.so, (m.get(x.so) || 0) + 1), new Map()).forEach((can, so) => {
        const thieu = can - (dem.get(so) || 0);
        if (thieu > 0) ghi.push(...cuaNam.filter(x => x.so === so).slice(-thieu));
      });
      _ghiThemGiuNguyen_(sh, ghi.map(x => x.values), pc.soCot, shPC);
      ghi.forEach(x => dem.set(x.so, (dem.get(x.so) || 0) + 1));
    });
    SpreadsheetApp.flush(); // chép xong hẳn rồi mới xóa
    _xoaDongTheoKhoa_(shPC, PC_COL.SO_CT, new Set(soLo), v => utils.standardize(v));
    daChuyen.push(...dongLo);
  }
  _invalidatePcCache_();
  sheetLT.forEach((v, nam) => _invalidateChunkedCache_(_khoaCachePcLuuTru_(nam)));
  return daChuyen;
}
function _demTheoSheetPc_(ds) {
  return Array.from(ds.reduce((m, x) => m.set(x.nam, (m.get(x.nam) || 0) + 1), new Map()))
    .sort((a, b) => a[0] - b[0]).map(([nam, soDong]) => ({ tenSheet: "PhieuCan_DN_" + nam, soDong }));
}

/** #Web (Quản trị): Khóa sổ năm `nam`. chayThat = false -> chỉ xem trước. */
function webKhoaSoNam_(namInput, chayThat) {
  try {
    const nam = Number(namInput);
    const namNay = Number(Utilities.formatDate(new Date(), "GMT+7", "yyyy"));
    if (!/^\d{4}$/.test(String(namInput).trim()) || nam < 2000 || nam >= namNay) return { success: false, message: `❌ Chỉ khóa sổ được năm đã kết thúc (trước năm ${namNay}).` };
    // Chạy thật: gắn cờ "đang khóa sổ" lên file Phiếu Cân suốt lúc chạy. Xem trước: không gắn.
    if (!chayThat) return _chayTrongKhoa_(() => _khoaSoNamNoLock_(nam, false, Date.now()));
    return _chayTrongKhoa_(() => _voiCoKhoaSo_(nam, () => _khoaSoNamNoLock_(nam, true, Date.now())));
  } catch (e) {
    return { success: false, message: "❌ " + _loiChoNguoiDung_(e) };
  }
}

// ------------------------------------------------------------
// CỜ "ĐANG KHÓA SỔ" (2026.9.10) - báo cho webapp nhập kho (QL_NHAPKHO, dự án
// Apps Script khác) tạm dừng import / nhập tay / tính giá phiếu cân trong lúc
// khóa sổ đang xóa dòng khỏi PhieuCan_DN (tránh ghi lệch dòng).
// QUY ƯỚC DÙNG CHUNG - QL_NHAPKHO đã đọc đúng như sau, KHÔNG được đổi:
//  - Developer Metadata cấp SPREADSHEET của file Phiếu Cân (CFG.PC_SS_ID).
//  - Khóa KHOA_SO_CO_KEY; hiển thị DOCUMENT (PROJECT thì dự án khác không thấy).
//  - Giá trị JSON {nam, batDau: Date.now(), ung: "DNTT"}. Bên đọc coi cờ hết
//    hiệu lực sau 10 phút (phòng trường hợp cờ sót lại khi script bị ngắt đột ngột).
// Đặt/gỡ cờ lỗi -> chỉ ghi log, KHÔNG chặn khóa sổ. Cờ gỡ trong finally nên
// khóa sổ lỗi giữa chừng cũng không để cờ lại.
// ------------------------------------------------------------
const KHOA_SO_CO_KEY = "HAK_KHOA_SO_NAM_DANG_CHAY";

/** Xóa mọi Developer Metadata có khóa KHOA_SO_CO_KEY trên spreadsheet `ss`. */
function _goCoKhoaSo_(ss) {
  ss.createDeveloperMetadataFinder().withKey(KHOA_SO_CO_KEY).find().forEach(md => md.remove());
}

/** Chạy fn() trong lúc file Phiếu Cân mang cờ "đang khóa sổ" năm `nam`; luôn gỡ cờ khi xong. */
function _voiCoKhoaSo_(nam, fn) {
  let ssPC = null;
  try {
    ssPC = SpreadsheetApp.openById(CFG.PC_SS_ID);
    _goCoKhoaSo_(ssPC); // bỏ cờ cũ sót lại -> luôn chỉ có đúng 1 cờ
    ssPC.addDeveloperMetadata(KHOA_SO_CO_KEY, JSON.stringify({ nam: Number(nam), batDau: Date.now(), ung: "DNTT" }),
      SpreadsheetApp.DeveloperMetadataVisibility.DOCUMENT);
  } catch (e) {
    console.warn("Không đặt được cờ khóa sổ trên file Phiếu Cân: " + (e && e.message));
  }
  try {
    return fn();
  } finally {
    try {
      if (ssPC) _goCoKhoaSo_(ssPC);
    } catch (e) {
      console.warn("Không gỡ được cờ khóa sổ trên file Phiếu Cân: " + (e && e.message));
    }
  }
}
function _khoaSoNamNoLock_(nam, chayThat, batDau) {
  const ssMain = getMainSs_();
  const idData = _fileLuuTruTheoNam_()[nam] || _docJsonProp_(KHOA_SO_DANG_LAM_PROP)[nam] || "";
  let ssData = idData ? SpreadsheetApp.openById(idData) : null;
  const ctMo = _ctThatDocThang_();
  const { K, cuHon } = _hoSoCuaNam_(ctMo, ssData, nam);
  if (cuHon.size) return { success: false, message: `❌ Sổ đang mở còn ${cuHon.size} hồ sơ thanh toán trước năm ${nam} - khóa sổ các năm đó trước.` };

  const soSach = _sheetSoKhoaSo_().map(d => {
    const sh = ssMain.getSheetByName(d.ten);
    const doc = sh ? _docHetDong_(sh, d.soCot) : { soCot: d.soCot, rows: [] };
    return Object.assign({}, d, { sh, soCot: doc.soCot, dong: doc.rows.filter(r => K.has(_maHoSo_(r[d.cotHoSo]))) });
  });

  // Số phiếu -> năm khóa sổ đã trả: các năm đã đăng ký khác + CT năm này (còn ở sổ + đã chép lần trước).
  const namTra = new Map();
  Object.keys(_fileLuuTruTheoNam_()).filter(n => Number(n) !== nam)
    .forEach(n => _docSheetLuuTru_(n, CFG.DNTT_CT, 22).forEach(r => { const so = utils.standardize(r[11]); if (so) namTra.set(so, n); }));
  const shCTData = ssData && ssData.getSheetByName(CFG.DNTT_CT);
  soSach.find(d => d.ten === CFG.DNTT_CT).dong.concat(shCTData ? _docHetDong_(shCTData, 22).rows : [])
    .forEach(r => { const so = utils.standardize(r[11]); if (so) namTra.set(so, String(nam)); });
  const conMo = new Set(ctMo.filter(r => !K.has(_maHoSo_(r[1]))).map(r => utils.standardize(r[11])).filter(Boolean));
  const shPC = openExternalSheet_(CFG.PC_SS_ID, CFG.PC_SHEET, "Phiếu Cân");
  const pc = _phieuCanCanChuyenLuuTru_(shPC, namTra, conMo);

  const ketQua = {
    success: true, nam, soHoSo: K.size,
    soSach: soSach.map(d => ({ ten: d.ten, soDong: d.dong.length })),
    tongPhieu: pc.chuyen.length, theoSheet: _demTheoSheetPc_(pc.chuyen),
    boQua: pc.boQua.slice(0, 50), soBoQua: pc.boQua.length,
    fileData: ssData ? { ten: ssData.getName(), url: ssData.getUrl() } : null
  };
  const conSoSach = soSach.some(d => d.dong.length);
  if (!chayThat || (!conSoSach && !pc.chuyen.length && _fileLuuTruTheoNam_()[nam])) {
    ketQua.xemTruoc = true;
    ketQua.canLam = conSoSach || pc.chuyen.length > 0;
    ketQua.message = !K.size ? `Không có hồ sơ thanh toán nào của năm ${nam}.`
      : ketQua.canLam ? `Khóa sổ năm ${nam}: ${K.size} hồ sơ, ${pc.chuyen.length} dòng phiếu cân đã trả sẽ chuyển.`
      : `Năm ${nam} đã khóa sổ xong.`;
    return ketQua;
  }
  if (!K.size) return Object.assign(ketQua, { success: false, message: `❌ Không có hồ sơ thanh toán nào của năm ${nam}.` });

  // 1. Sổ ĐNTT -> file DATA<nam> (đủ 5 sheet, kể cả sheet không có dòng nào của năm).
  const taoMoi = !ssData;
  if (taoMoi) ssData = _taoFileData_(nam, ssMain);
  soSach.forEach(d => {
    if (!d.sh) return;
    const shD = _sheetDichCungTieuDe_(ssData, d.ten, d.sh, d.soCot);
    const daCo = _tapGiaTriCot_(shD, d.cotHoSo, _maHoSo_);
    _ghiThemGiuNguyen_(shD, d.dong.filter(r => !daCo.has(_maHoSo_(r[d.cotHoSo]))), d.soCot, d.sh);
  });
  if (taoMoi) {
    const tenSo = new Set(soSach.map(d => d.ten));
    ssData.getSheets().filter(sh => !tenSo.has(sh.getName())).forEach(sh => ssData.deleteSheet(sh)); // sheet trống mặc định
  }
  SpreadsheetApp.flush(); // chép xong hẳn rồi mới xóa khỏi File Chính
  soSach.forEach(d => { if (d.sh) _xoaDongTheoKhoa_(d.sh, d.cotHoSo, K, _maHoSo_); });
  _invalidateCtSrc112Cache_();

  // 2. Đăng ký file DATA - từ đây báo cáo của năm này đọc file DATA.
  const ds = _fileLuuTruTheoNam_();
  ds[nam] = ssData.getId();
  _ghiJsonProp_(LUU_TRU_NAM_PROP, ds);
  const dangLam = _docJsonProp_(KHOA_SO_DANG_LAM_PROP);
  delete dangLam[nam];
  _ghiJsonProp_(KHOA_SO_DANG_LAM_PROP, dangLam);

  // 3. Phiếu cân đã trả -> PhieuCan_DN_<năm cân>.
  const daChuyen = _chuyenPhieuCanLuuTru_(shPC, pc, batDau);
  const conLai = pc.chuyen.length - daChuyen.length;
  const chiTietSo = soSach.map(d => `${d.ten}: ${d.dong.length}`).join(", ");
  const chiTietPc = _demTheoSheetPc_(daChuyen).map(x => `${x.tenSheet}: ${x.soDong}`).join(", ");
  logAction_("KHOA_SO_NAM", String(nam), `Khóa sổ năm ${nam} -> ${ssData.getName()} (${ssData.getId()}): ${K.size} hồ sơ (${chiTietSo}); chuyển ${daChuyen.length} dòng phiếu cân (${chiTietPc || "không có"})` + (conLai ? `, còn ${conLai} dòng chưa chuyển` : ""));
  return Object.assign(ketQua, {
    daChuyen: daChuyen.length, conLai, fileData: { ten: ssData.getName(), url: ssData.getUrl() },
    message: `✅ Đã khóa sổ năm ${nam}: ${K.size} hồ sơ sang "${ssData.getName()}", ${daChuyen.length} dòng phiếu cân đã trả sang sheet lưu trữ.`
      + (conLai ? ` ⏳ Còn ${conLai} dòng phiếu cân - bấm Khóa sổ lần nữa để chuyển tiếp (công nợ chỉ đúng khi chuyển hết).` : "")
  });
}

/** #Web: kiểm tra đã cấu hình File Chính chưa - dùng cho trang Cài Đặt. */
function getMainSsInfoForWeb_() {
  try {
    const id = PropertiesService.getScriptProperties().getProperty('MAIN_SS_ID');
    if (!id) return { configured: false };
    const ss = SpreadsheetApp.openById(id);
    return { configured: true, name: ss.getName(), url: ss.getUrl() };
  } catch (e) {
    return { configured: false, error: _loiChoNguoiDung_(e) };
  }
}

/**
 * MỚI (theo yêu cầu - "sao biết đã bật/đã khóa hay chưa"): kiểm tra
 * TRẠNG THÁI THẬT của các Trigger đang chạy (không chỉ hiện nút bấm mà
 * không biết đã bật hay chưa) - dùng cho trang Cài Đặt hiện huy hiệu
 * "✅ Đã bật" / "⭕ Chưa bật" cạnh từng nút.
 */
function getTriggerStatusForWeb_() {
  const handlers = new Set(ScriptApp.getProjectTriggers().map(t => t.getHandlerFunction()));
  const gioPhut15h = _trigger15hGioPhutHienTai_();
  return {
    trigger10Min: handlers.has('refreshAllDraftCaches10Min_'),
    triggerDaily: handlers.has('dailyRefreshAllCaches_'),
    trigger15h: handlers.has('daily15hRefresh_'),
    trigger15hGio: gioPhut15h.gio,
    trigger15hPhut: gioPhut15h.phut,
    pcHeaderCanhBao: _pcHeaderDaThayDoi_()
  };
}

// ============================================================
// CẢNH BÁO CẤU TRÚC CỘT PhieuCan_DN THAY ĐỔI (v2026.7)
// Mọi chỗ đọc Phiếu Cân dùng vị trí cột cố định (PC_COL) - ai đó chèn/xóa/
// đổi thứ tự cột trong file gốc sẽ làm hệ thống đọc SAI cột âm thầm. Mỗi
// lần làm mới cache, so dòng tiêu đề với "chuẩn" đã xác nhận; lệch thì
// báo ở Cài Đặt cho tới khi Quản trị kiểm tra và xác nhận chuẩn mới.
// ============================================================
const PC_HEADER_PROP = { CHUAN: "PC_HEADER_CHUAN", MOI: "PC_HEADER_MOI" };

function _chuKyHeaderPc_(header) {
  return header.map(h => utils.standardize(h)).join("|");
}
/** Ghi nhận tiêu đề vừa đọc: lần đầu lấy làm chuẩn; về sau khác chuẩn thì lưu để cảnh báo. */
function _ghiNhanHeaderPc_(header) {
  if (!header || !header.length) return;
  const props = PropertiesService.getScriptProperties();
  const chuKy = _chuKyHeaderPc_(header);
  const chuan = props.getProperty(PC_HEADER_PROP.CHUAN);
  if (!chuan) { props.setProperty(PC_HEADER_PROP.CHUAN, chuKy); return; }
  if (chuKy === chuan) { props.deleteProperty(PC_HEADER_PROP.MOI); return; }
  // Chỉ ghi nhật ký khi phát hiện 1 thay đổi MỚI (không lặp lại mỗi 10 phút).
  if (props.getProperty(PC_HEADER_PROP.MOI) !== chuKy) {
    logAction_("CANH_BAO_HEADER_PC", "-", `Cấu trúc cột PhieuCan_DN khác chuẩn đã xác nhận - kiểm tra có ai chèn/xóa/đổi thứ tự cột không. Chuẩn: ${chuan}. Hiện tại: ${chuKy}.`.slice(0, GIOI_HAN_KY_TU_O_NHAT_KY));
  }
  props.setProperty(PC_HEADER_PROP.MOI, chuKy);
}
function _pcHeaderDaThayDoi_() {
  return !!PropertiesService.getScriptProperties().getProperty(PC_HEADER_PROP.MOI);
}
/** Quản trị xác nhận cấu trúc cột hiện tại là đúng (đổi có chủ đích). */
function webXacNhanHeaderPhieuCanMoi_() {
  const props = PropertiesService.getScriptProperties();
  const moi = props.getProperty(PC_HEADER_PROP.MOI);
  if (!moi) return { success: true, message: "✅ Cấu trúc cột Phiếu Cân không có thay đổi cần xác nhận." };
  props.setProperty(PC_HEADER_PROP.CHUAN, moi);
  props.deleteProperty(PC_HEADER_PROP.MOI);
  logAction_("XAC_NHAN_HEADER_PHIEU_CAN", "-", "Xác nhận cấu trúc cột mới của PhieuCan_DN: " + moi.slice(0, GIOI_HAN_KY_TU_O_NHAT_KY));
  return { success: true, message: "✅ Đã xác nhận cấu trúc cột hiện tại của Phiếu Cân là chuẩn." };
}

/**
 * MỚI (theo yêu cầu): kiểm tra đã "Khóa Định Dạng TEXT/Ngày" chưa - đọc
 * ĐÚNG định dạng THẬT của 1 ô đại diện (cột CCCD ở Draft CT) - nếu đang
 * là "@" (Text thuần) tức là ĐÃ khóa, còn "General"/khác tức là CHƯA.
 */
/**
 * SỬA (theo yêu cầu - "đã khóa bao nhiêu cột rồi, không thấy hiển thị"):
 * trước đây chỉ kiểm tra 1 cột đại diện (CCCD ở Draft CT), không cho
 * biết cụ thể đã khóa được BAO NHIÊU cột / còn thiếu cột nào. Giờ kiểm
 * tra ĐÚNG TỪNG CỘT mà khoaDinhDangTextTatCa_() khóa, trên CẢ 6 sheet -
 * trả về danh sách chi tiết (sheet, cột, tên trường, đã khóa hay chưa)
 * để hiện đầy đủ ở Cài Đặt, không còn phải đoán qua 1 huy hiệu chung.
 */
function getFormatLockStatusForWeb_() {
  const items = [];
  const checkSheet = (sh, sheetLabel, colsWithNames) => {
    colsWithNames.forEach(([col, name]) => {
      let fmt = "", ok = false, err = "";
      try {
        fmt = sh.getRange(1, col).getNumberFormat();
        ok = (fmt === "@");
      } catch (e) { err = _loiChoNguoiDung_(e); }
      items.push({ sheet: sheetLabel, col, name, ok, fmt, err });
    });
  };

  try {
    const { shCT: shDraftCT, sh112: shDraft112, shSrc: shDraftSrc } = getDraftSheets_();
    checkSheet(shDraftCT, "Draft CT", [[1, "ID_CT"], [2, "ID_CHA"], [5, "CCCD"], [8, "STK"], [12, "Số Phiếu Cân"], [20, "Số HĐ"]]);
    checkSheet(shDraft112, "Draft 112", [[1, "ID_KEY"], [6, "STK"], [9, "Số HĐ"]]);
    checkSheet(shDraftSrc, "Draft Nguồn", [[1, "ID_KEY"], [5, "CCCD"], [9, "STK"], [13, "ID_112"], [14, "Số HĐ"]]);
  } catch (e) {
    items.push({ sheet: "Draft (tất cả)", col: "-", name: "-", ok: false, err: _loiChoNguoiDung_(e) });
  }

  try {
    const ss = getMainSs_();
    const shCTReal = ss.getSheetByName(CFG.DNTT_CT);
    if (shCTReal) checkSheet(shCTReal, "CT thật", [[1, "ID_CT"], [2, "ID_CHA"], [5, "CCCD"], [8, "STK"], [12, "Số Phiếu Cân"], [20, "Số HĐ"]]);
    const sh112Real = ss.getSheetByName(CFG.DNTT_112);
    if (sh112Real) checkSheet(sh112Real, "112 thật", [[1, "ID_KEY"], [6, "STK"], [9, "Số HĐ"]]);
    const shSrcReal = ss.getSheetByName(CFG.DNTT_SRC);
    if (shSrcReal) checkSheet(shSrcReal, "Nguồn thật", [[1, "ID_KEY"], [5, "CCCD"], [9, "STK"], [13, "ID_112"], [14, "Số HĐ"]]);
  } catch (e) {
    items.push({ sheet: "Bản chính (tất cả)", col: "-", name: "-", ok: false, err: "Chưa kết nối File Chính hoặc lỗi: " + _loiChoNguoiDung_(e) });
  }

  const total = items.filter(i => i.col !== "-").length;
  const lockedCount = items.filter(i => i.ok).length;
  return { locked: total > 0 && lockedCount === total, total, lockedCount, items };
}
/** #Web: cấu hình ID File Chính (dán từ URL Google Sheet). */
function webSetMainSsId_(id) {
  try {
    const clean = String(id || "").trim();
    if (!clean) return { success: false, message: "❌ Vui lòng nhập ID hoặc URL File Chính." };
    // Cho phép dán cả URL đầy đủ - tự trích ID nếu cần.
    const m = clean.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const finalId = m ? m[1] : clean;
    const ss = SpreadsheetApp.openById(finalId); // thử mở để xác nhận hợp lệ + có quyền truy cập
    setMainSsId_(finalId);
    return { success: true, message: `✅ Đã kết nối File Chính: "${ss.getName()}".` };
  } catch (e) {
    return { success: false, message: "❌ Không mở được file - kiểm tra lại ID/URL và quyền truy cập: " + _loiChoNguoiDung_(e) };
  }
}

// ============================================================
// MỚI (theo yêu cầu): THƯ MỤC BÁO CÁO XUẤT RA - CÓ THỂ ĐỔI (đơn vị khác/
// năm khác) - trước đây "cứng" 1 ID trong LINKS.BAOCAO_FOLDER_ID, giờ
// đọc/ghi qua Script Properties (giống hệt cơ chế MAIN_SS_ID) để đổi
// được ngay trên Web App, không cần sửa code.
// ============================================================
function getReportFolderId_() {
  const id = PropertiesService.getScriptProperties().getProperty('REPORT_FOLDER_ID');
  return id || LINKS.BAOCAO_FOLDER_ID; // chưa từng đổi -> dùng mặc định gốc trong code
}
// ============================================================
// MỚI (theo yêu cầu): GIÁ TRỊ MẶC ĐỊNH DÙNG KHI XUẤT BÁO CÁO CHO NGÂN
// HÀNG/MISA - trước đây "cứng" trong CFG (COMPANY_BANK_ACCOUNT/NAME/
// CODE), giờ đọc/ghi qua Script Properties - sửa được ngay ở Cài Đặt,
// không cần sửa code mỗi khi công ty đổi số TK/ngân hàng.
// ============================================================
function _getMisaDefault_(key, fallback) {
  const v = PropertiesService.getScriptProperties().getProperty('MISA_' + key);
  return (v === null || v === undefined || v === "") ? fallback : v;
}
function _setMisaDefault_(key, value) {
  PropertiesService.getScriptProperties().setProperty('MISA_' + key, String(value));
}
/** Số TK/Ngân hàng/Mã NH công ty - dùng khi ghi file Import Ngân Hàng/MISA. */
function getCompanyBankInfo_() {
  return {
    account: _getMisaDefault_("COMPANY_BANK_ACCOUNT", CFG.COMPANY_BANK_ACCOUNT),
    name: _getMisaDefault_("COMPANY_BANK_NAME", CFG.COMPANY_BANK_NAME),
    code: _getMisaDefault_("COMPANY_BANK_CODE", CFG.COMPANY_BANK_CODE)
  };
}
function getMisaDefaultsForWeb_() {
  return getCompanyBankInfo_();
}
function webSetMisaDefaults_(values) {
  try {
    values = values || {};
    if (values.account !== undefined) _setMisaDefault_("COMPANY_BANK_ACCOUNT", values.account);
    if (values.name !== undefined) _setMisaDefault_("COMPANY_BANK_NAME", values.name);
    if (values.code !== undefined) _setMisaDefault_("COMPANY_BANK_CODE", values.code);
    return { success: true, message: "✅ Đã lưu giá trị mặc định xuất báo cáo MISA." };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  }
}

// ============================================================
// MỚI (theo yêu cầu): VÙNG ĐỊNH DẠNG RIÊNG CHO BÁO CÁO XUẤT EXCEL -
// TÁCH BIỆT với "Vùng Lãnh Thổ" chung (ảnh hưởng khóa cột Draft/bản
// chính + phân tích "Ngày thanh toán"). Vùng NÀY chỉ ảnh hưởng tới định
// dạng ngày/số hiển thị trong CÁC FILE EXCEL XUẤT RA (vd cho MISA hoặc
// đơn vị khác có thể cần định dạng khác với hệ thống nội bộ).
// ============================================================
function _getExportRegion_() {
  const r = PropertiesService.getScriptProperties().getProperty('EXPORT_REGION_LOCALE');
  // Chưa cấu hình riêng -> VUNG_MAC_DINH.XUAT (VN), không theo vùng hệ thống (US):
  // trước đây đi theo vùng hệ thống nên file MISA ra ngày mm/dd/yyyy.
  return REGION_PRESETS[r] ? r : VUNG_MAC_DINH.XUAT;
}
function _setExportRegion_(region) {
  if (!REGION_PRESETS[region]) throw new Error("Vùng không hợp lệ: " + region);
  PropertiesService.getScriptProperties().setProperty('EXPORT_REGION_LOCALE', region);
}
function _getExportRegionPreset_() {
  return REGION_PRESETS[_getExportRegion_()];
}
/**
 * SỬA LỖI (theo yêu cầu - "chọn dd/mm/yyyy nhưng vẫn ra mm/dd/yyyy"):
 * utils.formatDate() dùng cho hiển thị NỘI BỘ Web App, LUÔN cố định
 * "dd/MM/yyyy" - không theo Vùng Định Dạng Báo Cáo Xuất Excel đã chọn.
 * Khi ghi các chuỗi "dd/MM/yyyy" này vào sheet XUẤT RA MỚI TẠO (chưa
 * khóa định dạng cột), Google Sheets tự "đoán" lại theo locale RIÊNG
 * của file mới đó (có thể là mm/dd/yyyy) - gây sai lệch. Hàm này định
 * dạng ĐÚNG theo Vùng Xuất đã chọn, dùng THAY utils.formatDate() ở MỌI
 * nơi ghi "Ngày" vào sheet xuất Excel - PHẢI đi kèm khóa cột TEXT (xem
 * _lockTextCols_) để tránh Sheets tự diễn giải lại lần nữa.
 */
function _formatNgayXuat_(v) {
  let d = null;
  if (v instanceof Date && v.getFullYear() > 1900) {
    d = v;
  } else if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const p = v.split('-');
    d = new Date(Date.UTC(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10), 12, 0, 0));
  } else if (typeof v === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v)) {
    // Chuỗi "dd/MM/yyyy" (đầu ra của utils.formatDate() - hiển thị nội bộ) - tách lại đúng dd/MM/yyyy rồi định dạng theo Vùng Xuất.
    const p = v.split('/');
    d = new Date(Date.UTC(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10), 12, 0, 0));
  }
  if (!d) return v ? String(v) : "";
  return Utilities.formatDate(d, "GMT+7", _getExportRegionPreset_().dateFmt);
}

function getExportRegionInfoForWeb_() {
  return { current: _getExportRegion_(), presets: Object.keys(REGION_PRESETS).map(k => ({ code: k, label: REGION_PRESETS[k].label })) };
}
function webSetExportRegion_(region) {
  try {
    _setExportRegion_(region);
    return { success: true, message: `✅ Đã đổi Vùng Định Dạng Báo Cáo Xuất sang "${region}".` };
  } catch (e) {
    return { success: false, message: "❌ " + _loiChoNguoiDung_(e) };
  }
}

// ============================================================
// MỚI (theo yêu cầu): TẠO FILE UNC (ỦY NHIỆM CHI) NGÂN HÀNG - cho hồ sơ
// "Đang ĐNTT" (đã đề nghị thanh toán nhưng CHƯA chốt) - đặt cạnh nút
// "In Báo Cáo ĐNTT". Toàn bộ tham số trước đây "cứng" trong code (TK
// trích nợ, TK thu phí, Bên chịu phí, Loại tiền, file/sheet Danh Mục
// Ngân Hàng) giờ đọc/ghi qua Script Properties - sửa được ở Cài Đặt.
// ============================================================
function getDmNhSsId_() {
  return PropertiesService.getScriptProperties().getProperty('DM_NH_SS_ID') || "1v6MlQaMF4N8BoTUqaraInxJFPUKcA7u3z_zVle8cXw8";
}
function _getUncDefault_(key, fallback) {
  const v = PropertiesService.getScriptProperties().getProperty('UNC_' + key);
  return (v === null || v === undefined || v === "") ? fallback : v;
}
function _setUncDefault_(key, value) {
  PropertiesService.getScriptProperties().setProperty('UNC_' + key, String(value));
}
/** Toàn bộ tham số UNC hiện hành - TK Trích Nợ mặc định LẤY THEO Số TK
 * công ty đã cấu hình ở mục MISA (getCompanyBankInfo_()) nếu chưa từng
 * đổi riêng cho UNC - tránh phải nhập trùng 2 nơi. */
function getUncConfig_() {
  const bankInfo = getCompanyBankInfo_();
  return {
    tkTrichNo: _getUncDefault_("TK_TRICH_NO", bankInfo.account),
    tkThuPhi: _getUncDefault_("TK_THU_PHI", bankInfo.account),
    benChiuPhi: _getUncDefault_("BEN_CHIU_PHI", "O - Bên chuyển"),
    loaiTien: _getUncDefault_("LOAI_TIEN", "VND"),
    sheetDmNH: _getUncDefault_("SHEET_DM_NH", "UNC_NGANHANG_HAK")
  };
}
function getUncConfigForWeb_() {
  return getUncConfig_();
}
function webSetUncConfig_(values) {
  try {
    values = values || {};
    if (values.tkTrichNo !== undefined) _setUncDefault_("TK_TRICH_NO", values.tkTrichNo);
    if (values.tkThuPhi !== undefined) _setUncDefault_("TK_THU_PHI", values.tkThuPhi);
    if (values.benChiuPhi !== undefined) _setUncDefault_("BEN_CHIU_PHI", values.benChiuPhi);
    if (values.loaiTien !== undefined) _setUncDefault_("LOAI_TIEN", values.loaiTien);
    if (values.sheetDmNH !== undefined) _setUncDefault_("SHEET_DM_NH", values.sheetDmNH);
    return { success: true, message: "✅ Đã lưu cấu hình UNC." };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  }
}

/** Tạo file UNC (Ủy Nhiệm Chi) cho các hồ sơ "Đang ĐNTT" đã chọn - CHƯA
 * chốt thanh toán chính thức, chỉ để nộp ngân hàng chuyển tiền trước.
 * selectedIds: mảng ID_112 đã chọn (giống hệt "In Báo Cáo ĐNTT").
 * ngayHieuLuc: chuỗi ngày hiệu lực UNC do người dùng nhập (yyyy-MM-dd). */
// ============================================================
// MỚI (theo yêu cầu): MỞ "ĐÓNG" THANH TOÁN CHO 1 PHIẾU CÂN CỤ THỂ
// ------------------------------------------------------------
// Gõ đúng Số phiếu cân đã ĐÓNG THANH TOÁN (đã chốt) -> hệ thống sẽ:
//   1. Tách phiếu cân đó thành 1 "đơn xin" MỚI trong File Nháp (Chờ
//      ĐNTT) - giữ nguyên Chủ rừng/Người nhận/STK/Số HĐ như hồ sơ gốc,
//      để người dùng ĐIỀU CHỈNH LẠI rồi xử lý qua quy trình bình thường.
//   2. XÓA dòng CT tương ứng khỏi CT thật (bản chính). Nếu đó là phiếu
//      cân DUY NHẤT của hồ sơ (không còn CT nào khác cùng ID_CHA), XÓA
//      LUÔN dòng DNTT_GK_DN + 112 thật (tránh để lại hồ sơ "rỗng").
//   3. Bỏ "Đóng TT"/"Y" (ID_DNTT, Chọn TT) ở PhieuCan_DN - coi như phiếu
//      cân đó CHƯA từng thanh toán.
// KHÔNG tự động sửa "Số tiền" của hồ sơ 112 gốc (nếu hồ sơ còn CT khác)
// - cần TỰ KIỂM TRA LẠI thủ công nếu số tiền đã nộp ngân hàng/MISA.
// ============================================================
// ============================================================
// MỚI (theo yêu cầu): TAB "LỊCH SỬ SỬA ĐỔI" - đọc lại Nhật Ký Thao Tác,
// LỌC riêng các hành động "nhạy cảm" (Mở Đóng Thanh Toán, Đồng Bộ Tên
// Khách Hàng) để theo dõi RIÊNG, kèm rõ user Gmail đã thực hiện (đã có
// sẵn trong logAction_() - Session.getActiveUser().getEmail()).
// ============================================================
// SỬA (rà soát phát hiện): bổ sung 4 hành động xóa "mồ côi" mới (mục Bảo
// Trì) vào danh sách hiển thị ở "Lịch Sử Sửa Đổi" - 2 trong số đó
// (XOA_MO_COI_CT_THAT/XOA_MO_COI_SRC_THAT) tự gắn cờ "⚠️ ĐỘNG TỚI DỮ
// LIỆU TÀI CHÍNH ĐÃ CHỐT" khi ghi log nhưng trước đây KHÔNG hiện ra ở
// trang audit trail này - vẫn nằm trong sheet log nhưng vô hình với
// người xem trang "Lịch Sử Sửa Đổi".
const LICH_SU_SUA_DOI_ACTIONS = new Set(["MO_DONG_THANH_TOAN", "DOI_SOAT_DONG_BO_TEN", "VA_NGAN_HANG_112", "XOA_MO_COI_CHITIET_DNTT", "XOA_MO_COI_CHITIET_UNC", "XOA_MO_COI_CT_THAT", "XOA_MO_COI_SRC_THAT", "SUA_TEN_KH_PHIEU_CAN", "PHAN_QUYEN", "CAU_HINH_DANG_NHAP", "CANH_BAO_HEADER_PC", "XAC_NHAN_HEADER_PHIEU_CAN", "CHAN_TRA_HAI_LAN", "KHOI_PHUC_DONG_DA_XOA", "CAU_HINH_LUU_TRU_NAM", "KHOA_SO_NAM", "XOA_MISA", "XOA_UNC",
  // Thao tác trên hồ sơ (người dùng yêu cầu 28/09/2026 - kèm "trước → sau" khi sửa):
  "SUA_NHAP", "THEM_PHIEU_NHAP", "XOA_PHIEU_NHAP", "XOA_NHAP", "XAC_NHAN_DNTT", "HUY_XAC_NHAN_DNTT", "CHOT_THANH_TOAN"]);
/**
 * SỬA (theo yêu cầu - "cho xem theo ngày, không phải cứ nối dài"): giờ
 * lọc theo khoảng ngày (fDate/tDate, dạng yyyy-MM-dd) thay vì luôn hiện
 * 500 dòng gần nhất bất kể ngày nào. Nhật Ký Thao Tác được GHI THEO THỨ
 * TỰ THỜI GIAN TĂNG DẦN (luôn appendRow ở cuối) - nên đọc từ CUỐI sheet
 * lên, DỪNG NGAY khi gặp dòng cũ hơn "Từ ngày" là chắc chắn đủ, không
 * cần đọc hết toàn bộ log (có thể rất dài qua nhiều năm).
 */
function getLichSuSuaDoi_(fDate, tDate) {
  const ss = getMainSs_();
  const sh = ss.getSheetByName(CFG.LOG_SHEET);
  if (!sh || sh.getLastRow() < 2) return [];
  const lastRow = sh.getLastRow();

  const CHUNK = 1000;
  const GIOI_HAN_KET_QUA = 1000;
  const results = [];
  let endRow = lastRow;
  let daQuaXaFDate = false;

  while (endRow > 1 && !daQuaXaFDate && results.length < GIOI_HAN_KET_QUA) {
    const startRow = Math.max(2, endRow - CHUNK + 1);
    const soDong = endRow - startRow + 1;
    const chunk = sh.getRange(startRow, 1, soDong, 5).getValues();
    for (let i = chunk.length - 1; i >= 0; i--) {
      const r = chunk[i];
      const d = r[0];
      if (!(d instanceof Date)) continue;
      const iso = Utilities.formatDate(d, "GMT+7", "yyyy-MM-dd");
      if (fDate && iso < fDate) { daQuaXaFDate = true; break; } // log theo thứ tự thời gian tăng dần chắc chắn - đọc đủ rồi, dừng luôn
      if (tDate && iso > tDate) continue; // chưa tới khoảng cần - bỏ qua dòng này, đọc tiếp lên trên
      const actionType = String(r[2] || "").trim();
      if (!LICH_SU_SUA_DOI_ACTIONS.has(actionType)) continue;
      results.push({
        thoiGian: Utilities.formatDate(d, "GMT+7", "dd/MM/yyyy HH:mm:ss"),
        nguoiThucHien: String(r[1] || ""),
        hanhDong: actionType,
        maHoSo: String(r[3] || ""),
        chiTiet: String(r[4] || "")
      });
      if (results.length >= GIOI_HAN_KET_QUA) break;
    }
    endRow = startRow - 1;
  }
  return results; // đã ở thứ tự mới -> cũ (do đọc ngược từ cuối lên) - đúng ý "mới nhất lên đầu"
}

/**
 * MỚI (theo yêu cầu - "gõ Họ tên/Phiếu cân không có dropdown"): gợi ý
 * TỰ ĐỘNG khi gõ, tìm trong dữ liệu ĐÃ CHỐT (bản chính) - dùng cho 2 ô
 * "Mở Đóng Thanh Toán". Giới hạn 20 kết quả/lần gõ để tránh trả về quá
 * nhiều (frontend nên debounce, không gọi liên tục từng phím).
 */
function timChuRungDaChot_(query) {
  const q = utils.standardize(String(query || "").trim());
  if (!q) return [];
  try {
    // SỬA (tối ưu tốc độ): dùng cache dùng chung (an toàn cho gợi ý/tìm
    // kiếm) thay vì đọc trực tiếp mỗi lần gõ phím.
    const data = _srcThatDataCache_();
    if (!data.length) return [];

    const h112ById = new Map();
    _h112ThatDataCache_().forEach(r => {
      const id = String(r[0] || "").trim();
      if (id) h112ById.set(id, r);
    });

    const seen = new Set();
    const results = [];
  for (let i = 0; i < data.length && results.length < 20; i++) {
    const r = data[i];
    const chuRung = String(r[3] || "").trim();
    if (!chuRung || !utils.standardize(chuRung).includes(q)) continue;
    const ngayDong = r[16];
    if (!(ngayDong instanceof Date)) continue; // chưa thật sự chốt (chưa có Ngày Đóng TT) -> bỏ qua
    const id112 = String(r[12] || "").trim();
    const h112Row = h112ById.get(id112);
    const lanTT = h112Row ? String(h112Row[18] || "").trim() : "";
    const ngayISO = Utilities.formatDate(ngayDong, "GMT+7", "yyyy-MM-dd");
    const key = utils.standardize(chuRung) + "|" + ngayISO + "|" + utils.standardize(lanTT);
    if (seen.has(key)) continue; // bỏ trùng (nếu vô tình có 2 dòng Src giống hệt)
    seen.add(key);
      results.push({
        chuRung, ngayISO,
        ngayHienThi: Utilities.formatDate(ngayDong, "GMT+7", "dd/MM/yyyy"),
        lanTT, soHD: String(r[13] || "").replace(/'/g, "").trim()
      });
    }
    return results;
  } catch (e) {
    return []; // MỚI (rà soát bổ sung): chưa kết nối File Chính hoặc lỗi khác -> trả về rỗng thay vì lỗi thô (đây là gợi ý tự động, không nên hiện lỗi mỗi lần gõ phím)
  }
}

/**
 * MỚI (theo yêu cầu - mở rộng từ "mở theo phiếu cân"): MỞ "ĐÓNG" THANH
 * TOÁN CHO CẢ 1 HỒ SƠ - tìm theo Chủ rừng + Ngày Đóng TT + Lần Thanh
 * Toán (không phải từng phiếu cân lẻ). Xóa TOÀN BỘ dòng liên quan
 * (DNTT_GK_DN + TẤT CẢ CT con + 112) khỏi bản chính, copy lại y hệt
 * sang File Nháp (Chờ ĐNTT) để điều chỉnh, và MỞ KHÓA TẤT CẢ Phiếu Cân
 * thuộc hồ sơ đó (không chỉ 1 phiếu).
 */
function webMoDongThanhToanTheoHoSo_(chuRungInput, ngayDongTTInput, lanTTInput) {
  let lock;
  try {
    lock = sysLock.acquire(); // MỚI (rà soát bổ sung): khóa đồng thời - tránh xung đột nếu 2 người cùng thao tác dữ liệu tài chính lúc này
    const chuRung = String(chuRungInput || "").trim();
    const ngayISO = String(ngayDongTTInput || "").trim(); // yyyy-MM-dd từ <input type="date">
    const lanTT = String(lanTTInput || "").trim();
    if (!chuRung || !ngayISO || !lanTT) {
      return { success: false, message: "❌ Vui lòng nhập đủ Chủ rừng, Ngày Đóng TT và Lần Thanh Toán." };
    }
    const namDongTT = ngayISO.slice(0, 4);
    if (_fileLuuTruTheoNam_()[namDongTT]) {
      return { success: false, message: `❌ Năm ${namDongTT} đã khóa sổ (dữ liệu đã chuyển sang file lưu trữ) - không mở lại thanh toán của năm đã khóa sổ.` };
    }
    const chuRungKey = utils.standardize(chuRung);

    const ss = getMainSs_();
    const shCT = ss.getSheetByName(CFG.DNTT_CT);
    const shSrc = ss.getSheetByName(CFG.DNTT_SRC);
    const sh112 = ss.getSheetByName(CFG.DNTT_112);
    if (!shCT || !shSrc || !sh112) return { success: false, message: "❌ Chưa kết nối đủ File Chính." };

    // ===== 1. Tìm ĐÚNG 1 dòng DNTT_GK_DN (Src) khớp Chủ rừng + Ngày Đóng
    // TT, rồi tra qua 112 để so khớp "Lần TT" =====
    // SỬA LỖI (rà soát phát hiện): "Mã Lần TT" ở Src (cột P, index 15)
    // thực ra là MÃ GHÉP PHỨC TẠP (vd "20260714_1" - ngày+số lần), KHÔNG
    // PHẢI số đơn giản như "1" mà người dùng sẽ gõ vào ô "Lần Thanh
    // Toán". Số "Lần TT" ĐƠN GIẢN (1, 2, 3...) thật ra nằm ở sheet 112
    // (cột S, index 18) - phải tra QUA 112 mới so khớp đúng.
    const srcLastRow = shSrc.getLastRow();
    if (srcLastRow < 2) return { success: false, message: "⚠️ Không có dữ liệu DNTT_GK_DN." };
    const srcAll = shSrc.getRange(2, 1, srcLastRow - 1, 18).getValues();

    const h112LastRow = sh112.getLastRow();
    const h112All = h112LastRow > 1 ? sh112.getRange(2, 1, h112LastRow - 1, 23).getValues() : [];
    const h112ByIdKey = new Map();
    h112All.forEach(r => { const id = String(r[0] || "").trim(); if (id) h112ByIdKey.set(id, { row: r }); });

    const ungVien = [];
    for (let i = 0; i < srcAll.length; i++) {
      const r = srcAll[i];
      const rChuRung = utils.standardize(String(r[3] || ""));
      const rNgayDong = r[16];
      if (rChuRung !== chuRungKey) continue;
      if (!(rNgayDong instanceof Date)) continue;
      const rNgayISO = Utilities.formatDate(rNgayDong, "GMT+7", "yyyy-MM-dd");
      if (rNgayISO !== ngayISO) continue;
      const id112Cua = String(r[12] || "").trim();
      const h112Match = h112ByIdKey.get(id112Cua);
      if (!h112Match) continue; // không tra được 112 tương ứng -> bỏ qua, không đoán mò
      const rLanTT = String(h112Match.row[18] || "").trim();
      if (utils.standardize(rLanTT) !== utils.standardize(lanTT)) continue;
      ungVien.push({ row: r, h112Row: h112Match.row });
    }
    if (ungVien.length === 0) {
      return { success: false, message: `❌ Không tìm thấy hồ sơ nào khớp đúng Chủ rừng "${chuRung}" + Ngày Đóng TT ${ngayISO} + Lần TT "${lanTT}" trong dữ liệu ĐÃ CHỐT. Lưu ý: "Lần TT" là số đơn giản (1, 2, 3...) - xem ở Báo Cáo Thanh Toán cột "Lần TT".` };
    }
    if (ungVien.length > 1) {
      return { success: false, message: `⚠️ Tìm thấy ${ungVien.length} hồ sơ CÙNG khớp Chủ rừng/Ngày/Lần TT - không xử lý tự động để tránh nhầm lẫn. Cần bạn kiểm tra tay lại trong DNTT_GK_DN (có thể do trùng tên chủ rừng khác nhau, hoặc dữ liệu bị lặp).` };
    }
    const srcRow = ungVien[0].row;
    const h112Row = ungVien[0].h112Row;
    const idCha = String(srcRow[0] || "").trim();
    const soHD = String(srcRow[13] || "").replace(/'/g, "").trim();

    // ===== 3. Tìm TẤT CẢ dòng CT con (ID_CHA = idCha) =====
    const ctLastRow = shCT.getLastRow();
    const ctAll = ctLastRow > 1 ? shCT.getRange(2, 1, ctLastRow - 1, 22).getValues() : [];
    const ctConIdx = [];
    ctAll.forEach((r, i) => { if (String(r[1] || "").trim() === idCha) ctConIdx.push(i); });
    if (ctConIdx.length === 0) {
      return { success: false, message: "❌ Không tìm thấy dòng CT nào thuộc hồ sơ này - dữ liệu có thể không nhất quán, chạy Bảo Trì để kiểm tra trước." };
    }

    // ===== 4. DỰNG SẴN (trong bộ nhớ) hồ sơ mới cho File Nháp =====
    // v2026.9.12 (R-05): trước đây ghi Nháp TRƯỚC rồi mới xóa khỏi sổ chính -
    // lỗi giữa chừng để hồ sơ nằm ở CẢ Nháp lẫn sổ chính. Nay: dựng sẵn mọi
    // dòng -> XÓA khỏi sổ chính (có sao lưu) -> rồi mới GHI Nháp (bước 5b).
    const newId = Utilities.getUuid().split('-')[0];
    const now = new Date();
    const { shCT: shDraftCT, sh112: shDraft112, shSrc: shDraftSrc } = getDraftSheets_();

    const newSrcRow = srcRow.slice(); // copy y hệt toàn bộ Src cũ
    newSrcRow[0] = newId; newSrcRow[1] = now;
    newSrcRow[12] = newId; // ID_112 trỏ tới 112 mới
    newSrcRow[14] = ""; newSrcRow[15] = ""; newSrcRow[16] = ""; newSrcRow[17] = ""; // Trạng thái/Mã Lần TT/Ngày Đóng TT/Đã Xử Lý -> để trống (Chờ ĐNTT)

    const id112Moi = Utilities.formatDate(now, "GMT+7", "yyyyMMddHHmmss") + ("0000" + Math.floor(Math.random() * 10000)).slice(-4);
    let new112Row;
    if (h112Row) {
      new112Row = h112Row.slice(); // copy y hệt 112 cũ (giữ Ngân hàng/STK/Ngày HĐ/Ủy quyền...)
      // SỬA LỖI (rà soát phát hiện): dùng .length = 24 tạo ra các Ô RỖNG
      // (sparse holes) khác với chuỗi "" thật - .map()/.forEach() sẽ BỎ
      // QUA các ô này, và Google Sheets có thể ghi sai/lỗi khi gặp ô
      // rỗng kiểu này. Dùng push("") tường minh để đảm bảo đủ 24 phần
      // tử THẬT SỰ là chuỗi rỗng, không phải "lỗ hổng" trong mảng.
      while (new112Row.length < 24) new112Row.push("");
    } else {
      new112Row = new Array(24).fill("");
      new112Row[2] = chuRung; new112Row[8] = _chu_(soHD);
    }
    new112Row[0] = newId; new112Row[1] = now;
    new112Row[16] = now; // Ngày ĐN mới
    new112Row[18] = ""; new112Row[19] = ""; new112Row[20] = ""; new112Row[21] = ""; new112Row[23] = ""; // Lần TT/Ngày dự kiến/Đã chốt/Đủ ĐK/Trạng Thái -> để trống
    new112Row[22] = id112Moi;

    const pcMap = utils.buildIndexMap(_pcData_(), PC_COL.SO_CT, true);
    const dsPhieuCanGoc = [];
    const soPhieuCanLienQuan = [];
    const draftCtRowsMoi = [];
    ctConIdx.forEach((idx, stt) => {
      const ctRow = ctAll[idx];
      const soP = String(ctRow[11] || "").replace(/'/g, "").trim();
      soPhieuCanLienQuan.push(soP);
      dsPhieuCanGoc.push(soP);
      const srcInfoChoCt = {
        timestamp: now, chuRung: ctRow[3], cccd: String(ctRow[4] || "").replace(/'/g, ""),
        nguoiDN: srcRow[5], nguoiNhan: ctRow[6], stkNguoiNhan: String(ctRow[7] || "").replace(/'/g, ""),
        klTongNguon: utils.parseNum(newSrcRow[9]), dsPhieuCanGoc: dsPhieuCanGoc.join(", "), soHD: soHD, ngayTT: "", ngayDeNghi: now
      };
      const { row: draftCtRow } = buildDraftCtRow_(newId, stt + 1, soP, srcInfoChoCt, pcMap);
      draftCtRowsMoi.push(draftCtRow);
    });

    // ===== 5a. XÓA KHỎI BẢN CHÍNH (trước khi ghi Nháp - R-05) =====
    // v2026.6: đọc lại dữ liệu MỚI NHẤT ngay lúc xóa và xóa theo ĐÚNG ID
    // (không dùng vị trí dòng đã đọc từ trước - tránh xóa nhầm dòng nếu
    // sheet vừa bị chèn/xóa dòng), sao lưu nguyên dòng trước khi xóa.
    const id112Cha = String(h112Row[0] || "").trim();
    const maThaoTac = _maThaoTacMoi_("MO_DONG_THANH_TOAN");
    let daXoaSoChinh = 0;
    try {
      daXoaSoChinh += _saoLuuVaXoaDong_(shCT, r => String(r[1] || "").trim() === idCha, "MO_DONG_THANH_TOAN", maThaoTac);
      daXoaSoChinh += _saoLuuVaXoaDong_(shSrc, r => String(r[0] || "").trim() === idCha, "MO_DONG_THANH_TOAN", maThaoTac);
      if (id112Cha) _saoLuuVaXoaDong_(sh112, r => String(r[0] || "").trim() === id112Cha, "MO_DONG_THANH_TOAN", maThaoTac);
    } catch (eXoa) {
      // Chưa ghi gì vào Nháp. Đã xóa được 1 phần -> chỉ đường Khôi phục.
      _invalidateCtSrc112Cache_();
      const huongDan = daXoaSoChinh ? ` Một phần hồ sơ đã bị xóa (đã sao lưu) → Hệ Thống › Khôi phục, chọn lần xóa mã ${maThaoTac} để trả về như cũ.` : " Sổ chính chưa bị thay đổi.";
      return { success: false, message: `❌ Không xóa được hồ sơ khỏi sổ chính: ${_loiChoNguoiDung_(eXoa)}. Chưa tạo hồ sơ Nháp.${huongDan}` };
    }

    // MỚI (theo yêu cầu - "3 bảng con phải thay đổi theo bảng mẹ"):
    // ChiTietDNTT, ChiTietUNC, Update_NganHang_DN đều là BẢNG CON của
    // DNTT_GK_DN_CT - khi mở lại (bảng mẹ mất đi), cả 3 bảng con liên
    // quan tới hồ sơ này cũng phải dọn theo, không được để sót dữ liệu
    // "mồ côi" (đã Mở Đóng nhưng vẫn còn hiện trong báo cáo/lịch sử như
    // thể vẫn đang chốt).
    const ketQuaDonDep = _donDep3BangConKhiMoDong_(idCha, soPhieuCanLienQuan, maThaoTac);

    // ===== 5b. GHI hồ sơ mới vào File Nháp (sau khi đã xóa khỏi sổ chính) =====
    // Lỗi ở bước này: hồ sơ chỉ còn trong sao lưu -> dọn phần Nháp ghi dở rồi
    // báo mã thao tác để Khôi phục (Hệ Thống › Khôi phục) trả lại như cũ.
    try {
      shDraftSrc.appendRow(_dongAnToan_([newSrcRow], COT_CHU.SRC)[0]);
      shDraft112.appendRow(_dongAnToan_([new112Row], COT_CHU.H112)[0]);
      // Ghi toàn bộ CT con bằng 1 lệnh (không để hồ sơ Nháp thiếu phiếu cân).
      shDraftCT.getRange(shDraftCT.getLastRow() + 1, 1, draftCtRowsMoi.length, draftCtRowsMoi[0].length).setValues(_dongAnToan_(draftCtRowsMoi, COT_CHU.CT));
    } catch (eNhap) {
      [[shDraftCT, 1], [shDraft112, 0], [shDraftSrc, 0]].forEach(([sh, cot]) => {
        try {
          const lr = sh.getLastRow();
          if (lr < 2) return;
          const dong = [];
          sh.getRange(2, cot + 1, lr - 1, 1).getValues().forEach((r, k) => { if (String(r[0] || "").trim() === newId) dong.push(k + 2); });
          _nhomDongLienTiep_(dong).reverse().forEach(([a, b]) => sh.deleteRows(a, b - a + 1));
        } catch (eDon) { /* dọn Nháp ghi dở lỗi - hồ sơ Nháp dở (nếu còn) xóa tay được */ }
      });
      logAction_("LOI_MO_DONG_THANH_TOAN", idCha, `Đã xóa khỏi sổ chính (sao lưu mã ${maThaoTac}) nhưng ghi File Nháp lỗi: ${eNhap && eNhap.message}`);
      _invalidateCtSrc112Cache_();
      return { success: false, message: `❌ Đã xóa hồ sơ khỏi sổ chính (đã sao lưu) nhưng KHÔNG ghi được vào File Nháp: ${_loiChoNguoiDung_(eNhap)} → Vào Hệ Thống › Khôi phục, chọn lần xóa mã ${maThaoTac} để trả hồ sơ về như cũ, rồi thử Mở Đóng TT lại.` };
    }

    // ===== 6. MỞ KHÓA TẤT CẢ Phiếu Cân liên quan =====
    let soDaMoKhoa = 0;
    const khongMoDuoc = [];
    try {
      const shPC = openExternalSheet_(CFG.PC_SS_ID, CFG.PC_SHEET, "Phiếu Cân");
      // v2026.9.7: tìm theo cột SO_CT - đúng cột Duyệt đã khóa (trước đây tìm
      // theo cột A "Số phiếu" và chỉ 1 dòng/số -> có thể bỏ sót phiếu).
      const soPKeySet = new Set(soPhieuCanLienQuan.map(sp => utils.standardize(sp)).filter(Boolean));
      const { dong: dongMoKhoa, khongThay } = _dongPhieuCanTheoSo_(shPC, soPKeySet);
      khongMoDuoc.push(...khongThay);
      _ghiCungGiaTri_(shPC, dongMoKhoa, PC_COL.ID_DNTT + 1, PC_COL.CHON_TT + 1, "");
      // SỬA (theo yêu cầu): đổi "Trạng Thái" từ "OK" sang "Test giá"
      // cho MỌI phiếu cân được mở lại trong hồ sơ này.
      _ghiCungGiaTri_(shPC, dongMoKhoa, PC_COL.TRANG_THAI + 1, PC_COL.TRANG_THAI + 1, "Test giá");
      soDaMoKhoa = soPKeySet.size - khongThay.length;
      _invalidatePcCache_();
    } catch (e) { /* không chặn luồng chính nếu lỗi mở khóa - vẫn báo rõ ở kết quả */ }

    const chiTiet = `Mở Đóng TT cả hồ sơ - Chủ rừng "${chuRung}", Ngày Đóng TT ${ngayISO}, Lần TT "${lanTT}", Số HĐ ${soHD}, ${ctConIdx.length} phiếu cân (${soPhieuCanLienQuan.join(", ")}) - đã tạo lại đơn xin mới ID ${newId} trong File Nháp, xóa Src+112+${ctConIdx.length} CT khỏi bản chính, mở khóa ${soDaMoKhoa}/${soPhieuCanLienQuan.length} Phiếu Cân. Đã dọn 3 bảng con: ChiTietDNTT (${ketQuaDonDep.chiTietDnttXoa} dòng), ChiTietUNC (${ketQuaDonDep.chiTietUncXoa} dòng), Update_NganHang_DN (${ketQuaDonDep.misaXoa} dòng).`;
    logAction_("MO_DONG_THANH_TOAN", newId, chiTiet);
    _invalidateCtSrc112Cache_(); // MỚI (rà soát bổ sung): CT/Src/112 thật vừa thay đổi - xóa cache ngay
    _invalidateCongNoCache_(); // MỚI (rà soát bổ sung): buộc Báo Cáo Công Nợ tính lại, tránh hiện snapshot cũ
    // MỚI (rà soát phát hiện - "báo cáo công nợ ok chưa"): "Chi Tiết
    // Công Nợ theo Phiếu Cân" (snapshot theo ngày) và "Phân Tích Nhập/TT
    // theo NG-ĐL" (snapshot theo TỪNG NGÀY) CŨNG có nguy cơ hiện dữ liệu
    // cũ sau khi mở lại - làm mới đúng các ngày bị ảnh hưởng (theo
    // "Ngày CK" của các dòng CT vừa xóa), không cần tính lại TOÀN BỘ.
    try {
      PropertiesService.getScriptProperties().deleteProperty('CTCN_SNAPSHOT_DATE');
      const ngayBiAnhHuong = new Set();
      ctConIdx.forEach(idx => {
        const d = ctAll[idx][20];
        if (d instanceof Date) ngayBiAnhHuong.add(Utilities.formatDate(d, "GMT+7", "yyyy-MM-dd"));
      });
      if (ngayBiAnhHuong.size) _refreshPhanTichNhapTTChoDanhSachNgayNoLock_(Array.from(ngayBiAnhHuong)); // dùng bản KHÔNG khóa - hàm này đang chạy TRONG lượt đã giữ sysLock rồi, tránh khóa lồng nhau
    } catch (e) { /* không chặn luồng chính nếu làm mới báo cáo công nợ lỗi */ }

    let msg = `✅ Đã mở Đóng Thanh Toán cho cả hồ sơ (${ctConIdx.length} phiếu cân). Đơn xin mới đã vào File Nháp (Chờ ĐNTT). Đã dọn theo bảng con: ChiTietDNTT (${ketQuaDonDep.chiTietDnttXoa}), ChiTietUNC (${ketQuaDonDep.chiTietUncXoa}), Update_NganHang_DN (${ketQuaDonDep.misaXoa}).`;
    if (khongMoDuoc.length) msg += ` ⚠️ Không mở khóa được ${khongMoDuoc.length} phiếu cân: ${khongMoDuoc.join(", ")} - kiểm tra tay.`;
    return { success: true, message: msg };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  } finally {
    if (lock) lock.releaseLock();
  }
}

/**
 * MỚI (theo yêu cầu - "chốt xong nhưng UNC lỗi, muốn làm lại thì vào
 * đâu"): trước đây "Tạo File UNC" CHỈ có ở Danh Sách ĐNTT (làm việc
 * trên File Nháp, TRƯỚC khi Đóng Thanh Toán) - sau khi chốt, hồ sơ rời
 * khỏi Nháp, không còn chỗ nào tạo lại UNC nếu phát hiện sai/lỗi. Hàm
 * này nhận thẳng rows từ "Báo Cáo Thanh Toán Gỗ Keo" (đã chốt, đọc từ
 * get112ViewData_() - CÙNG cấu trúc {idHeThong, chuRung, nguoiNhan, stk,
 * nganHang, soHD, soTien, noiDungCK} mà runCreateUNCOnly_() cần) - tái
 * sử dụng LẠI ĐÚNG hàm tạo UNC, không viết lại logic.
 */
function webCreateUNCFromDraft_(selectedIds, ngayHieuLuc, tkTrichNoOverride, tkThuPhiOverride) {
  try {
    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
      return { success: false, message: "❌ Lỗi: Không có hồ sơ nào được chọn để tạo UNC." };
    }
    const idSet = new Set(selectedIds.map(id => String(id).trim()).filter(Boolean));
    const { sh112 } = getDraftSheets_();
    const lastRow = sh112.getLastRow();
    if (lastRow < 2) return { success: false, message: "⚠️ File Nháp trống." };
    const data = sh112.getRange(2, 1, lastRow - 1, 24).getValues();

    const filteredRows = [];
    const skippedNotConfirmed = [];
    data.forEach(r => {
      const id = String(r[0] || "").trim();
      if (!id || !idSet.has(id)) return;
      if (String(r[COL_TRANG_THAI_DNTT] || "").trim() !== "Đang ĐNTT") { skippedNotConfirmed.push(id); return; }
      filteredRows.push({
        idHeThong: id,
        chuRung: String(r[2] || ""),
        soHD: String(r[8] || "").replace(/'/g, ""),
        nguoiNhan: String(r[3] || ""),
        stk: String(r[5] || "").replace(/'/g, ""),
        nganHang: String(r[4] || ""),
        soTien: utils.parseNum(r[6]),
        noiDungCK: String(r[7] || "")
      });
    });

    if (filteredRows.length === 0) {
      let msg = "❌ Không có hồ sơ nào ở trạng thái 'Đang ĐNTT' để tạo UNC (phải bấm 'Xác Nhận' trước).";
      if (skippedNotConfirmed.length) msg += ` Hồ sơ chưa Xác Nhận: ${skippedNotConfirmed.join(", ")}.`;
      return { success: false, message: msg };
    }

    const toDate = String(ngayHieuLuc || "").trim() || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
    // MỚI (theo yêu cầu): cho phép gõ TK Trích Nợ/TK Thu Phí KHÁC với
    // cấu hình mặc định NGAY LÚC TẠO - chỉ áp dụng cho lần tạo NÀY,
    // không lưu lại cấu hình gốc ở Cài Đặt.
    return runCreateUNCOnly_(filteredRows, toDate, String(tkTrichNoOverride || "").trim(), String(tkThuPhiOverride || "").trim());
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  }
}

/**
 * Tạo file Excel UNC (Ủy Nhiệm Chi) theo mẫu ngân hàng - SỬA (theo yêu
 * cầu): thay toàn bộ tham số "cứng" trong code gốc bằng cấu hình lấy từ
 * getUncConfig_()/getCompanyBankInfo_() - sửa được ở Cài Đặt, không cần
 * sửa code. Cũng khóa TEXT thuần cho TkNo/SoTK/TkPhi (tránh mất số 0
 * đầu) và khóa định dạng ngày theo Vùng Định Dạng Báo Cáo Xuất Excel.
 */
/**
 * MỚI (theo yêu cầu - "sao không cho ghi để xem lại"): mỗi lần "Tạo File
 * UNC" trước đây CHỈ tạo 1 file Excel rời, không lưu vết gì lại trong
 * hệ thống - không xem lại lịch sử được. Giờ MỖI LẦN tạo UNC, GHI THÊM
 * (append) toàn bộ dòng vào sheet "ChiTietUNC" (File Chính) để xem lại
 * bất cứ lúc nào (mục Hệ Thống > Lịch Sử UNC), kèm rõ ai tạo, lúc nào,
 * cho hồ sơ nào - không ảnh hưởng gì tới việc vẫn tạo file Excel rời
 * như cũ để nộp ngân hàng.
 */
const CHITIET_UNC_SHEET = "ChiTietUNC";
const CHITIET_UNC_COT_NGAY = [13]; // 1-based: Ngày hiệu lực - ghi Date, định dạng theo Vùng Lãnh Thổ
const CHITIET_UNC_HEADERS = ["ID Hệ Thống", "STT", "Phương thức", "TK Trích Nợ", "Tên người nhận", "Số TK", "Ngân hàng", "Số tiền", "Loại tiền", "Nội dung", "Bên chịu phí", "TK Thu phí", "Ngày hiệu lực", "Người tạo", "Thời gian tạo", "Link file UNC", "Chủ rừng", "Số hợp đồng"];

function _getChiTietUncSheet_() {
  const ss = getMainSs_();
  let sh = ss.getSheetByName(CHITIET_UNC_SHEET);
  if (!sh) {
    sh = ss.insertSheet(CHITIET_UNC_SHEET);
    sh.getRange(1, 1, 1, CHITIET_UNC_HEADERS.length).setValues([CHITIET_UNC_HEADERS]).setFontWeight("bold").setBackground("#d9d2e9");
    sh.setFrozenRows(1);
    _lockTextCols_(sh, [1, 4, 6, 12, 18], 3000); // ID Hệ Thống, TK Trích Nợ, Số TK, TK Thu phí, Số hợp đồng
  }
  _damBaoCotNgaySo_(sh, CHITIET_UNC_COT_NGAY); // Ngày hiệu lực: Date thật theo Vùng Lãnh Thổ (từ 2026.9.23)
  return sh;
}

/** Ghi lại lịch sử 1 lần tạo UNC vào ChiTietUNC - KHÔNG ảnh hưởng tới
 * việc tạo file Excel rời (vẫn giữ nguyên như cũ). */
function _ghiLichSuUNC_(filteredRows, uncCfg, toDate, fileUrl) {
  try {
    const sh = _getChiTietUncSheet_();
    // Ghi sổ theo Vùng Lãnh Thổ: Date thật (trước 2026.9.23 ghi CHỮ theo Vùng xuất vào
    // cột không khóa TEXT - sheet locale US tự đọc "05/09/2026" thành 09/05).
    const ngayHieuLuc = _docNgaySo_(toDate) || toDate;
    const user = _emailNguoiThucHien_() || "N/A";
    const now = new Date();

    const bankInfo = getCompanyBankInfo_(); // đọc Script Properties 1 lần, không lặp theo từng dòng
    const stdCongTyNH = utils.standardize(bankInfo.name);
    const rows = filteredRows.map((r, i) => {
      const stdNH = utils.standardize(r.nganHang);
      let phuongThucChuyen = "O - Chuyển ngoài " + bankInfo.name;
      if (stdCongTyNH && stdNH.includes(stdCongTyNH)) phuongThucChuyen = "I - Chuyển trong " + bankInfo.name;
      return [
        r.idHeThong || "", i + 1, phuongThucChuyen, _chu_(uncCfg.tkTrichNo), r.nguoiNhan,
        _chu_(r.stk), r.nganHang, utils.parseNum(r.soTien), uncCfg.loaiTien, r.noiDungCK,
        uncCfg.benChiuPhi, _chu_(uncCfg.tkThuPhi), ngayHieuLuc, user, now, fileUrl,
        r.chuRung || "", _chu_(r.soHD || "")
      ];
    });
    if (rows.length) {
      _chayTrongKhoa_(() => {
        // Tạo lại UNC cho hồ sơ đã có: THAY dòng cũ của đúng các hồ sơ đó (sao lưu
        // trước, khôi phục được) - Báo Cáo UNC mỗi hồ sơ 1 dòng, như ChiTietDNTT.
        const idTaoLai = new Set(rows.map(r => String(r[0] || "").trim()).filter(Boolean));
        if (idTaoLai.size) _saoLuuVaXoaDong_(sh, r => idTaoLai.has(String(r[0] || "").trim()), "TAO_LAI_UNC", _maThaoTacMoi_("TAO_LAI_UNC"));
        const startRow = sh.getLastRow() + 1;
        _dinhDangCotNgaySo_(sh, CHITIET_UNC_COT_NGAY, startRow, rows.length);
        sh.getRange(startRow, 1, rows.length, CHITIET_UNC_HEADERS.length).setValues(_dongAnToan_(rows));
      });
    }
  } catch (e) {
    // Không chặn luồng chính "Tạo File UNC" nếu lỗi ghi lịch sử - file
    // Excel vẫn tạo thành công như bình thường, chỉ mất phần lưu vết.
    logAction_("LOI_GHI_LICH_SU_UNC", "-", "Lỗi khi ghi lịch sử UNC: " + e.toString());
  }
}

/** Đọc lại lịch sử UNC theo khoảng ngày (dựa vào Thời gian tạo) - dùng
 * chung kiểu đọc "từ cuối lên, dừng sớm" như getLichSuSuaDoi_() vì
 * ChiTietUNC cũng luôn ghi thêm vào cuối theo thứ tự thời gian. */
/** Chuyển chuỗi ngày đã xuất (theo đúng Vùng Định Dạng Báo Cáo Xuất
 * Excel đang cấu hình - có thể dd/MM/yyyy hoặc MM/dd/yyyy) về lại
 * yyyy-MM-dd để so sánh lọc theo khoảng ngày - dùng cho việc XEM/LỌC
 * lại Update_NganHang_DN theo ngày (không phải ghi mới). */
function _parseNgayXuatVeIso_(str) {
  const s = String(str || "").trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return "";
  const fmt = (_getExportRegionPreset_().dateFmt || "dd/MM/yyyy").toLowerCase();
  let day, month;
  if (fmt.startsWith("mm")) { month = m[1]; day = m[2]; } else { day = m[1]; month = m[2]; }
  return `${m[3]}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}
// ------------------------------------------------------------
// QUY ĐỊNH ĐỊNH DẠNG NGÀY (người dùng chốt 28/09/2026): web app dd/MM/yyyy;
// GHI SỔ (Google Sheet) theo Vùng Lãnh Thổ = ghi Date thật, cột ngày định dạng
// theo _getRegionPreset_(); XUẤT FILE theo Vùng xuất = _formatNgayXuat_().
// ------------------------------------------------------------
/** Giá trị ngày đọc từ sổ -> Date ("" nếu không đọc được). Sổ ghi Date thật; dòng
 * do bản cũ ghi dạng CHỮ (theo Vùng xuất lúc đó, hoặc yyyy-MM-dd) vẫn đọc được. */
function _docNgaySo_(v) {
  if (v instanceof Date) return isNaN(v.getTime()) ? "" : v;
  const s = String(v || "").trim();
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : _parseNgayXuatVeIso_(s);
  return iso ? _ngayVNTruaThat_(+iso.slice(0, 4), +iso.slice(5, 7), +iso.slice(8, 10)) : "";
}
/** Ngày trong sổ -> chuỗi hiện trên web (dd/MM/yyyy); không đọc được thì giữ nguyên. */
function _ngayWeb_(v) {
  const d = _docNgaySo_(v);
  return d ? utils.formatDate(d) : String(v || "");
}
/** Ngày trong sổ -> chuỗi cho FILE XUẤT (theo Vùng xuất). */
function _ngayXuat_(v) {
  const d = _docNgaySo_(v);
  return d ? _formatNgayXuat_(d) : String(v || "");
}
/** Ngày giờ -> chuỗi cho FILE XUẤT (theo Vùng xuất, có giờ). */
function _ngayGioXuat_(d) {
  return d instanceof Date ? Utilities.formatDate(d, "GMT+7", _getExportRegionPreset_().dateTimeFmt) : String(d || "");
}
/** 1 lần cho mỗi sổ + mỗi Vùng Lãnh Thổ: định dạng cả cột ngày theo vùng (bản cũ để
 * các cột này dạng TEXT). Ô đang chứa chữ vẫn là chữ - _docNgaySo_ đọc được cả 2. */
function _damBaoCotNgaySo_(sh, cots) {
  const khoa = "DINH_DANG_NGAY_SO_" + sh.getName() + "_" + _getRegion_();
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty(khoa)) return;
  _lockDateCols_(sh, cots.map(c => [c, _getRegionPreset_().dateFmt]));
  props.setProperty(khoa, "1");
}
/** Định dạng các cột ngày (1-based) của đúng các dòng vừa ghi vào sổ theo Vùng Lãnh Thổ. */
function _dinhDangCotNgaySo_(sh, cots, dongDau, soDong) {
  if (!soDong) return;
  const fmt = _getRegionPreset_().dateFmt;
  cots.forEach(c => sh.getRange(dongDau, c, soDong, 1).setNumberFormat(fmt));
}

/**
 * MỚI (theo yêu cầu - "báo cáo MISA phải lọc, không phải lấy nguyên cả
 * file"): xem/lọc TRỰC TIẾP dữ liệu Update_NganHang_DN theo khoảng ngày
 * (Ngày hạch toán) - giống hệt cách "Báo Cáo UNC" đang làm - KHÔNG cần
 * mở nguyên file để tự lọc bằng mắt nữa.
 */
// Update_NganHang_DN = mẫu nhập MISA (33 cột). Cột dạng CHỮ (0-based): Ngày hạch
// toán, Ngày chứng từ, Số phiếu cân, TK công ty, CCCD, STK, CCCD thụ hưởng, Số HĐ.
const MISA_SO_COT = 33;
const MISA_COT_CHU = [2, 3, 4, 5, 9, 12, 15, 32];
const MISA_GIOI_HAN_DONG = 2000;

/** Hàm (dòng Update_NganHang_DN) -> Ngày CK thuộc [fDate, tDate] hay không. Dùng
 * chung cho màn Báo Cáo MISA, file xuất và dọn dẹp - cùng 1 cách hiểu ngày.
 * SỬA LỖI (rà soát phát hiện): trước đây lọc theo ngày bằng cách parse LẠI
 * chuỗi "Ngày hạch toán" (cột C, TEXT theo Vùng Định Dạng Báo Cáo Xuất Excel
 * LÚC GHI) theo Vùng Định Dạng HIỆN TẠI - đổi Vùng Xuất sau khi đã có dữ liệu
 * thì dòng cũ bị đọc nhầm ngày/tháng hoặc rơi khỏi báo cáo. Giờ tra "Ngày CK"
 * THẬT từ CT (kể cả năm đã khóa sổ) theo Số phiếu cân; chỉ dòng không tra được
 * (nhập tay ngoài luồng app) mới parse chuỗi cũ làm phương án dự phòng. */
function _boLocNgayMisa_(fDate, tDate) {
  const ngayCkBySoPhieuCan = new Map();
  _ctCacCot_(fDate, tDate, [11, 20]).forEach(ctRow => {
    const soP = String(ctRow[11] || "").replace(/'/g, "").trim();
    if (soP && ctRow[20] instanceof Date) ngayCkBySoPhieuCan.set(utils.standardize(soP), ctRow[20]);
  });
  return r => {
    const ngayCkThat = ngayCkBySoPhieuCan.get(utils.standardize(String(r[4] || "").replace(/^'/, "").trim()));
    const iso = ngayCkThat ? Utilities.formatDate(ngayCkThat, "GMT+7", "yyyy-MM-dd") : _parseNgayXuatVeIso_(r[2]);
    return !!iso && (!fDate || iso >= fDate) && (!tDate || iso <= tDate);
  };
}
/** Dòng Update_NganHang_DN (đủ 33 cột, như trong file) có Ngày CK thuộc
 * [fDate, tDate] - dùng chung cho màn Báo Cáo MISA và file xuất. */
function _locMisaTheoNgay_(fDate, tDate) {
  const ssNH = SpreadsheetApp.openById(CFG.UPDATE_NH_SS_ID);
  const shUpdateNH = ssNH.getSheetByName("Update_NganHang_DN");
  if (!shUpdateNH || shUpdateNH.getLastRow() < 2) return { tieuDe: [], dong: [], total: 0, truncated: false };
  const data = shUpdateNH.getRange(2, 1, shUpdateNH.getLastRow() - 1, MISA_SO_COT).getValues();
  const trongKhoang = _boLocNgayMisa_(fDate, tDate);
  const dong = [];
  let tongKhop = 0;
  data.forEach(r => {
    if (!trongKhoang(r)) return;
    tongKhop++;
    if (dong.length < MISA_GIOI_HAN_DONG) dong.push(r);
  });
  return {
    tieuDe: shUpdateNH.getRange(1, 1, 1, MISA_SO_COT).getValues()[0],
    dong, total: tongKhop, truncated: tongKhop > MISA_GIOI_HAN_DONG
  };
}
// ------------------------------------------------------------
// DỌN DẸP MISA / UNC (Hệ Thống, cạnh "Tạo Lại MISA" / "Tạo Lại UNC") - luôn
// xem trước, sao lưu trước khi xóa (Hệ Thống › Khôi Phục), chỉ trong khoảng
// ngày đã chọn. Khung chung _donDep_, mỗi sổ chỉ khác cách chọn dòng.
// ------------------------------------------------------------
const DON_DEP = { TRUNG: "trung", MO_COI: "moCoi", TAT_CA: "tatCa" };
const DON_DEP_XEM_TOI_DA = 200;

function _kiemTraCheDonDep_(che) {
  if (!Object.values(DON_DEP).includes(che)) throw new Error("Chế độ dọn dẹp không hợp lệ.");
}
/** Khung dọn dẹp: chayThat = false -> chỉ liệt kê dòng sẽ xóa; true -> trong khóa hệ
 * thống quét lại dữ liệu mới nhất, sao lưu rồi xóa. cf: { sh, soCot, ten, hanhDong,
 * boChon() -> (dòng -> lý do xóa, "" = giữ), tomTat(dòng) -> đối tượng hiển thị,
 * moTa(soXoa) -> nội dung nhật ký }. */
function _donDep_(cf, chayThat) {
  if (!chayThat) {
    const lyDoCua = cf.boChon();
    const lr = cf.sh.getLastRow();
    const dong = [];
    (lr > 1 ? cf.sh.getRange(2, 1, lr - 1, cf.soCot).getValues() : []).forEach(r => {
      const lyDo = lyDoCua(r);
      if (lyDo) dong.push(Object.assign(cf.tomTat(r), { lyDo }));
    });
    return { success: true, xemTruoc: true, soDong: dong.length, dong: dong.slice(0, DON_DEP_XEM_TOI_DA),
      message: dong.length ? `Sẽ xóa ${dong.length} dòng ${cf.ten} (có sao lưu).` : "Không có dòng nào cần xóa." };
  }
  const maThaoTac = _maThaoTacMoi_(cf.hanhDong);
  const soXoa = _chayTrongKhoa_(() => {
    const lyDoCua = cf.boChon(); // quét lại dữ liệu mới nhất ngay lúc xóa
    return _saoLuuVaXoaDong_(cf.sh, r => !!lyDoCua(r), cf.hanhDong, maThaoTac);
  });
  logAction_(cf.hanhDong, maThaoTac, cf.moTa(soXoa));
  return { success: true, soDong: soXoa, message: `✅ Đã xóa ${soXoa} dòng ${cf.ten}. Khôi phục được ở Hệ Thống › Khôi Phục Dữ Liệu Đã Xóa.` };
}

/** Hàm (dòng) -> lý do xóa ("" = giữ), đi theo thứ tự dòng trong file (dòng
 * trùng: giữ lần xuất hiện ĐẦU TIÊN trong cả file). Tạo mới cho mỗi lượt quét. */
function _boChonMisaDonDep_(che, fDate, tDate) {
  const trongKhoang = _boLocNgayMisa_(fDate, tDate);
  const soCua = r => utils.standardize(String(r[4] || "").replace(/'/g, "").trim());
  if (che === DON_DEP.TAT_CA) return r => trongKhoang(r) ? "Trong khoảng ngày đã chọn" : "";
  if (che === DON_DEP.MO_COI) {
    // Đọc thẳng sổ đang mở (không qua cache): hồ sơ vừa Duyệt không bị coi là mồ côi.
    const daChot = new Set(_ctCacCot_("", "", [11]).map(r => utils.standardize(String(r[11] || "").replace(/'/g, "").trim())).filter(Boolean));
    // Dòng không có Số phiếu cân (nhập tay ngoài app) không coi là mồ côi.
    return r => soCua(r) && trongKhoang(r) && !daChot.has(soCua(r)) ? "Số phiếu cân không còn trong sổ đã chốt" : "";
  }
  if (che === DON_DEP.TRUNG) {
    const daGap = new Set();
    return r => {
      const so = soCua(r);
      if (!so) return "";
      const trung = daGap.has(so);
      daGap.add(so);
      return trung && trongKhoang(r) ? "Trùng Số phiếu cân (giữ dòng đầu)" : "";
    };
  }
  throw new Error("Chế độ dọn dẹp không hợp lệ.");
}
/** #Web (Hệ Thống): dọn Update_NganHang_DN. chayThat = false -> chỉ xem trước. */
function webDonDepMisa_(che, fDate, tDate, chayThat) {
  try {
    if (!fDate || !tDate) return { success: false, message: "❌ Chọn đủ Từ ngày / Đến ngày." };
    _kiemTraCheDonDep_(che);
    return _donDep_({
      sh: _sheetMisa_(), soCot: MISA_SO_COT, ten: "MISA", hanhDong: "XOA_MISA",
      boChon: () => _boChonMisaDonDep_(che, fDate, tDate),
      tomTat: r => Object.assign(_tomTatDongMisa_(r), { ngayHachToan: _ngayWeb_(r[2]) }),
      moTa: soXoa => `Dọn MISA (${che}) Ngày CK ${fDate} → ${tDate}: xóa ${soXoa} dòng Update_NganHang_DN (đã sao lưu).`
    }, chayThat);
  } catch (e) {
    return { success: false, message: "❌ " + _loiChoNguoiDung_(e) };
  }
}

/** Mã hồ sơ còn tồn tại: sổ 112 đang mở (File Chính) + 112 Nháp - chỉ đọc cột mã. */
function _idHoSoConTon_() {
  const ids = new Set();
  [getMainSs_().getSheetByName(CFG.DNTT_112), getDraftSheets_().sh112].forEach(sh => {
    const lr = sh ? sh.getLastRow() : 0;
    if (lr > 1) sh.getRange(2, 1, lr - 1, 1).getValues().forEach(v => { const id = String(v[0] || "").trim(); if (id) ids.add(id); });
  });
  return ids;
}
/** Chọn dòng ChiTietUNC cần dọn, theo Thời gian tạo (cùng ngày với Báo Cáo UNC).
 * Trùng: 1 hồ sơ có nhiều lần tạo UNC -> giữ lần MỚI NHẤT (dòng cuối, như Báo Cáo
 * UNC hiển thị), xóa các lần cũ. Mồ côi: hồ sơ không còn trong sổ 112 / Nháp. */
function _boChonUncDonDep_(che, fDate, tDate, sh) {
  const trongKhoang = r => {
    if (!(r[14] instanceof Date)) return false;
    const iso = Utilities.formatDate(r[14], "GMT+7", "yyyy-MM-dd");
    return iso >= fDate && iso <= tDate;
  };
  const idCua = r => String(r[0] || "").trim();
  if (che === DON_DEP.TAT_CA) return r => trongKhoang(r) ? "Trong khoảng ngày đã chọn" : "";
  if (che === DON_DEP.MO_COI) {
    const conTon = _idHoSoConTon_();
    return r => idCua(r) && trongKhoang(r) && !conTon.has(idCua(r)) ? "Hồ sơ không còn trong sổ 112 / Nháp" : "";
  }
  if (che === DON_DEP.TRUNG) {
    const lr = sh.getLastRow();
    const conSau = new Map(); // mã hồ sơ -> số dòng của hồ sơ đó chưa duyệt tới
    (lr > 1 ? sh.getRange(2, 1, lr - 1, 1).getValues() : []).forEach(v => {
      const id = String(v[0] || "").trim();
      if (id) conSau.set(id, (conSau.get(id) || 0) + 1);
    });
    return r => {
      const id = idCua(r);
      if (!id || !conSau.has(id)) return "";
      const n = conSau.get(id) - 1;
      conSau.set(id, n);
      return n > 0 && trongKhoang(r) ? "Trùng hồ sơ (giữ lần tạo UNC mới nhất)" : "";
    };
  }
  throw new Error("Chế độ dọn dẹp không hợp lệ.");
}
/** #Web (Hệ Thống): dọn ChiTietUNC (lịch sử tạo UNC - Báo Cáo UNC). chayThat = false -> xem trước. */
function webDonDepUnc_(che, fDate, tDate, chayThat) {
  try {
    if (!fDate || !tDate) return { success: false, message: "❌ Chọn đủ Từ ngày / Đến ngày." };
    _kiemTraCheDonDep_(che);
    const sh = _getChiTietUncSheet_();
    return _donDep_({
      sh, soCot: CHITIET_UNC_HEADERS.length, ten: "UNC", hanhDong: "XOA_UNC",
      boChon: () => _boChonUncDonDep_(che, fDate, tDate, sh),
      tomTat: r => ({
        idHeThong: String(r[0] || ""), tenNguoiNhan: String(r[4] || ""), chuRung: String(r[16] || ""),
        soTien: utils.parseNum(r[7]), thoiGianTao: r[14] instanceof Date ? Utilities.formatDate(r[14], "GMT+7", "dd/MM/yyyy HH:mm") : String(r[14] || "")
      }),
      moTa: soXoa => `Dọn UNC (${che}) Thời gian tạo ${fDate} → ${tDate}: xóa ${soXoa} dòng ${CHITIET_UNC_SHEET} (đã sao lưu).`
    }, chayThat);
  } catch (e) {
    return { success: false, message: "❌ " + _loiChoNguoiDung_(e) };
  }
}
/** Dòng MISA (33 cột) -> dòng tóm tắt cho màn hình / sheet Tóm tắt. */
function _tomTatDongMisa_(r) {
  return {
    ngayHachToan: String(r[2] || ""),
    soPhieuCan: String(r[4] || "").replace(/^'/, "").trim(),
    hoTenChuRung: String(r[10] || ""),
    tenThuHuong: String(r[14] || ""),
    soTK: String(r[12] || "").replace(/^'/, "").trim(),
    nganHang: String(r[13] || ""),
    thanhTien: utils.parseNum(r[24]),
    noiDung: String(r[8] || ""),
    soHD: String(r[32] || "").replace(/^'/, "").trim()
  };
}
// ------------------------------------------------------------
// HỒ SƠ ĐÃ CHỐT CHƯA CÓ DÒNG MISA (Báo Cáo MISA › Tạo bổ sung) - vd lần tự
// động ghi lúc Duyệt bị lỗi, hoặc dòng MISA đã bị xóa tay.
// ------------------------------------------------------------
const MISA_THIEU_XEM_TOI_DA = 50;
const MISA_BO_SUNG_HO_SO_MOI_LAN = 150;

/** Dòng sổ đã chốt (CT, kể cả năm đã khóa sổ) có Ngày CK (ngày thanh toán) trong
 * [fDate, tDate]. Mọi chức năng MISA (xem, xuất, tạo lại, tạo bổ sung, dọn dẹp)
 * chọn theo NGÀY CK - dòng MISA cũng mang Ngày CK làm Ngày hạch toán. */
function _ctTheoNgayCK_(fDate, tDate) {
  const trongKhoang = v => {
    if (!(v instanceof Date)) return false;
    const iso = Utilities.formatDate(v, "GMT+7", "yyyy-MM-dd");
    return (!fDate || iso >= fDate) && (!tDate || iso <= tDate);
  };
  // Sổ đang mở: chỉ đọc dòng có Ngày CK trong khoảng (trước đây đọc cả sổ CT).
  return _docLuuTruTrongKhoang_(CFG.DNTT_CT, 22, fDate, tDate)
    .concat(_docDongTheoKhoa_(_shCtThat_(), 20, 22, trongKhoang))
    .filter(ct => !utils.isBlank(ct[0]) && !utils.isBlank(ct[1]) && trongKhoang(ct[20]));
}
/** Hồ sơ đã chốt (dòng get112ViewData_) theo mã, không lọc ngày: Ngày ĐN (cột ngày
 * của sổ 112) khác Ngày CK, lọc theo Ngày ĐN sẽ chọn sai hồ sơ. Giữ thứ tự sổ 112. */
function _hoSoDaChotTheoMa_(idSet) {
  return idSet.size ? get112ViewData_("", "").filter(h => idSet.has(h.idHeThong)) : [];
}

/** Phiếu cân đã chốt có Ngày CK trong [fDate, tDate] mà Số phiếu cân chưa có ở
 * bất kỳ dòng nào của Update_NganHang_DN (cùng cách so trùng với lúc ghi). */
function _misaThieu_(shUpdateNH, fDate, tDate) {
  const daCo = _laySoPhieuCanDaCoTrongMisa_(shUpdateNH);
  const phieu = [];
  _ctTheoNgayCK_(fDate, tDate).forEach(ct => {
    const k = utils.standardize(ct[11]);
    if (!k || daCo.has(k)) return;
    phieu.push({ idHeThong: String(ct[1]).trim(), soPhieuCan: String(ct[11]).replace(/'/g, "").trim(), ngayTT: utils.formatDate(ct[20]), chuRung: String(ct[3] || ""), thanhTien: utils.parseNum(ct[16]) });
  });
  return { phieu, idHoSo: new Set(phieu.map(x => x.idHeThong)) };
}
function _sheetMisa_() {
  const sh = SpreadsheetApp.openById(CFG.UPDATE_NH_SS_ID).getSheetByName("Update_NganHang_DN");
  if (!sh) throw new Error("Không tìm thấy sheet Update_NganHang_DN.");
  return sh;
}
/** #Web (Nghiệp vụ): ghi dòng MISA còn thiếu cho hồ sơ đã chốt trong khoảng ngày.
 * Mỗi lần tối đa MISA_BO_SUNG_HO_SO_MOI_LAN hồ sơ; conLai > 0 thì trình duyệt gọi
 * tiếp (mỗi lần tính lại từ đầu nên không cần vị trí lô). */
function webTaoBoSungMisa_(fDate, tDate) {
  try {
    if (!fDate || !tDate) return { success: false, message: "❌ Chọn đủ Từ ngày / Đến ngày." };
    const shNH = _sheetMisa_();
    const { idHoSo } = _misaThieu_(shNH, fDate, tDate);
    if (!idHoSo.size) return { success: true, count: 0, conLai: 0, xong: true, message: "✅ Không còn hồ sơ đã chốt nào thiếu dòng MISA." };
    const hoSo = _hoSoDaChotTheoMa_(idHoSo); // người nhận (kể cả sửa tay) lấy từ sổ 112
    if (!hoSo.length) return { success: false, message: `❌ Không tìm thấy hồ sơ ${Array.from(idHoSo).join(", ")} trong sổ 112 - không đủ thông tin người nhận để ghi MISA.` };
    const loNay = hoSo.slice(0, MISA_BO_SUNG_HO_SO_MOI_LAN);
    const daGhi = _ghiMisaChuaCo_(shNH, _gomChiTietChuyenKhoan_(loNay));
    const conLai = hoSo.length - loNay.length;
    logAction_("TAO_BO_SUNG_MISA", "-", `Tạo bổ sung MISA (${fDate} - ${tDate}): ${loNay.length} hồ sơ, ghi ${daGhi.length} dòng.`);
    return {
      success: true, count: daGhi.length, conLai, xong: conLai === 0,
      message: conLai ? `Đã ghi ${daGhi.length} dòng, còn ${conLai} hồ sơ - đang làm tiếp...` : `✅ Đã tạo bổ sung ${daGhi.length} dòng MISA.`
    };
  } catch (e) {
    return { success: false, message: "❌ " + _loiChoNguoiDung_(e) };
  }
}

function getMisaDataTheoNgay_(fDate, tDate) {
  try {
    const kq = _locMisaTheoNgay_(fDate, tDate);
    // Kiểm tra thiếu lỗi thì vẫn trả dữ liệu MISA (chỉ không có cảnh báo).
    let thieu = null;
    try {
      const t = _misaThieu_(_sheetMisa_(), fDate, tDate);
      thieu = { soPhieu: t.phieu.length, soHoSo: t.idHoSo.size, phieu: t.phieu.slice(0, MISA_THIEU_XEM_TOI_DA) };
    } catch (e) {
      thieu = { loi: _loiChoNguoiDung_(e) };
    }
    const items = kq.dong.map(r => Object.assign(_tomTatDongMisa_(r), { ngayHachToan: _ngayWeb_(r[2]) }));
    return { items, total: kq.total, truncated: kq.truncated, thieu };
  } catch (e) {
    return { items: [], total: 0, truncated: false, error: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  }
}

/** Xuất Excel MISA đã LỌC theo ngày - file RIÊNG "XUAT MISA (...)", KHÔNG đụng
 * gì tới Update_NganHang_DN gốc. Sheet 1 đúng mẫu nhập MISA (33 cột, như bản
 * 2026.8 - người dùng yêu cầu giữ như cũ), sheet 2 bảng tóm tắt 9 cột. */
function exportMisaTheoNgayExcel_(fDate, tDate) {
  try {
    const kq = _locMisaTheoNgay_(fDate, tDate);
    if (!kq.dong.length) return { success: false, message: "⚠️ Không có dữ liệu MISA nào trong khoảng ngày đã chọn." };

    const folder = DriveApp.getFolderById(getReportFolderId_());
    const fileName = `XUAT MISA (${(fDate || '').replace(/-/g, '')}_${(tDate || '').replace(/-/g, '')})`;
    const ss = _taoFileBaoCao_(fileName, folder);

    // Sheet 1 - ĐÚNG MẪU NHẬP MISA như trước (bản 2026.8): đủ 33 cột, dòng tiêu
    // đề chép nguyên từ Update_NganHang_DN, cột chữ giữ số 0 đầu.
    const sheet = ss.getSheets()[0];
    sheet.setName("XuatMISA");
    _lockTextCols_(sheet, MISA_COT_CHU.map(i => i + 1), kq.dong.length + 5);
    sheet.getRange(1, 1, 1, MISA_SO_COT).setValues(_dongAnToan_([kq.tieuDe])).setFontWeight("bold").setBackground("#d9d2e9");
    _canhLeTheoKieu_(sheet, 2, kq.dong);
    sheet.getRange(2, 1, kq.dong.length, MISA_SO_COT).setValues(_dongAnToan_(kq.dong, MISA_COT_CHU));
    sheet.setFrozenRows(1);

    // Sheet 2 - bảng tóm tắt 9 cột (dễ đọc, như màn hình Báo Cáo MISA).
    const tomTat = ss.insertSheet("TomTat");
    _lockTextCols_(tomTat, [2, 5, 9], kq.dong.length + 5); // Số phiếu cân, Số TK, Số HĐ
    const headers = ["Ngày hạch toán", "Số phiếu cân", "Họ tên chủ rừng", "Tên người thụ hưởng", "Số TK", "Ngân hàng", "Thành tiền", "Nội dung", "Số hợp đồng"];
    tomTat.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#d9d2e9");
    const body = kq.dong.map(_tomTatDongMisa_).map(r => [r.ngayHachToan, _chu_(r.soPhieuCan), r.hoTenChuRung, r.tenThuHuong, _chu_(r.soTK), r.nganHang, r.thanhTien, r.noiDung, _chu_(r.soHD)]);
    tomTat.getRange(2, 1, body.length, headers.length).setValues(_dongAnToan_(body));
    _canhLeTheoKieu_(tomTat, 2, body);
    tomTat.getRange(2, 7, body.length, 1).setNumberFormat("#,##0");
    tomTat.setFrozenRows(1);

    logAction_("XUAT_BAO_CAO_MISA", "-", `Xuất MISA (${fDate} - ${tDate}), ${kq.dong.length} dòng - ${ss.getUrl()}`);
    let msg = `✅ Đã xuất ${kq.dong.length} dòng theo mẫu nhập MISA (sheet XuatMISA) + bảng tóm tắt (sheet TomTat).`;
    if (kq.truncated) msg += ` ⚠️ Tổng khớp khoảng ngày là ${kq.total} dòng, đã đạt giới hạn ${MISA_GIOI_HAN_DONG} - thu hẹp khoảng ngày để xuất đầy đủ hơn.`;
    return { success: true, url: ss.getUrl(), count: kq.dong.length, message: msg };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  }
}

/** choXuat = true: ngày theo Vùng xuất (file Báo Cáo UNC); mặc định kiểu VN cho web. */
function getLichSuUNC_(fDate, tDate, choXuat) {
  const CHUNK = 1000;
  const GIOI_HAN_KET_QUA = 1000;
  const results = [];
  let daQuaXaFDate = false;
  // Mỗi hồ sơ chỉ lấy lần tạo UNC MỚI NHẤT (dữ liệu do bản cũ ghi có thể còn
  // nhiều dòng cho 1 hồ sơ vì mỗi lần tạo lại đều ghi thêm).
  const daCoHoSo = new Set();
  // Xét 1 dòng (duyệt từ mới về cũ); trả về false khi phải dừng.
  const xet = r => {
    const d = r[14]; // Thời gian tạo
    if (!(d instanceof Date)) return true;
    const iso = Utilities.formatDate(d, "GMT+7", "yyyy-MM-dd");
    if (fDate && iso < fDate) { daQuaXaFDate = true; return false; }
    if (tDate && iso > tDate) return true;
    const idHoSo = String(r[0] || "").trim();
    if (idHoSo) {
      if (daCoHoSo.has(idHoSo)) return true;
      daCoHoSo.add(idHoSo);
    }
    results.push({
      idHeThong: String(r[0] || ""), soTT: r[1], phuongThuc: String(r[2] || ""),
      tenNguoiNhan: String(r[4] || ""), soTK: String(r[5] || "").replace(/'/g, ""),
      nganHang: String(r[6] || ""), soTien: utils.parseNum(r[7]), noiDung: String(r[9] || ""),
      ngayHieuLuc: choXuat ? _ngayXuat_(r[12]) : _ngayWeb_(r[12]), nguoiTao: String(r[13] || ""),
      thoiGianTao: choXuat ? _ngayGioXuat_(d) : Utilities.formatDate(d, "GMT+7", "dd/MM/yyyy HH:mm:ss"),
      linkFile: String(r[15] || ""),
      chuRung: String(r[16] || ""), soHD: String(r[17] || "").replace(/'/g, "")
    });
    return results.length < GIOI_HAN_KET_QUA;
  };

  const sh = getMainSs_().getSheetByName(CHITIET_UNC_SHEET);
  let endRow = sh ? sh.getLastRow() : 0;
  let tiep = true;
  while (tiep && endRow > 1) {
    const startRow = Math.max(2, endRow - CHUNK + 1);
    const chunk = sh.getRange(startRow, 1, endRow - startRow + 1, CHITIET_UNC_HEADERS.length).getValues();
    for (let i = chunk.length - 1; i >= 0 && tiep; i--) tiep = xet(chunk[i]);
    endRow = startRow - 1;
  }
  // Còn chỗ và chưa qua "Từ ngày" -> đọc tiếp các năm đã khóa sổ (mới trước).
  _namLuuTruTrongKhoang_(fDate, tDate).reverse().forEach(nam => {
    if (!tiep || daQuaXaFDate) return;
    const rows = _docSheetLuuTru_(nam, CHITIET_UNC_SHEET, CHITIET_UNC_HEADERS.length);
    for (let i = rows.length - 1; i >= 0 && tiep; i--) tiep = xet(rows[i]);
  });
  return results;
}

/** MỚI (theo yêu cầu - "quên in thì không có chỗ kết xuất lại UNC"):
 * xuất lại thành file Excel MỚI từ đúng dữ liệu Lịch Sử UNC theo khoảng
 * ngày đã chọn - dùng khi file gốc bị mất/quên tải, hoặc cần gộp lại
 * nhiều lần tạo UNC trong 1 khoảng ngày thành 1 file duy nhất. */
function exportLichSuUNCExcel_(fDate, tDate) {
  try {
    const rows = getLichSuUNC_(fDate, tDate, true);
    if (!rows.length) return { success: false, message: "⚠️ Không có dữ liệu UNC nào trong khoảng ngày đã chọn." };

    const folder = DriveApp.getFolderById(getReportFolderId_());
    const fileName = `BAO CAO UNC (${(fDate||'').replace(/-/g,'')}_${(tDate||'').replace(/-/g,'')})`;
    const ss = _taoFileBaoCao_(fileName, folder);

    const sheet = ss.getSheets()[0];
    sheet.setName("BaoCaoUNC");
    // SỬA LỖI: trước khóa cột 3,4,11 - Ngày hiệu lực (cột 1) và Thời gian tạo (cột 8) không được khóa.
    _lockTextCols_(sheet, [1, 3, 8, 11], rows.length + 5); // Ngày hiệu lực, Số TK, Thời gian tạo, Số HĐ
    const headers = ["Ngày hiệu lực", "Tên người nhận", "Số TK", "Ngân hàng", "Số tiền", "Nội dung", "Người tạo", "Thời gian tạo", "Link file gốc", "Chủ rừng", "Số hợp đồng"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#d9d2e9");
    const body = rows.map(r => [r.ngayHieuLuc, r.tenNguoiNhan, _chu_(r.soTK), r.nganHang, r.soTien, r.noiDung, r.nguoiTao, r.thoiGianTao, r.linkFile, r.chuRung, _chu_(r.soHD)]);
    sheet.getRange(2, 1, body.length, headers.length).setValues(_dongAnToan_(body));
    _canhLeTheoKieu_(sheet, 2, body);
    sheet.getRange(2, 5, body.length, 1).setNumberFormat("#,##0");
    sheet.setFrozenRows(1);

    logAction_("XUAT_BAO_CAO_UNC", "-", `Xuất lại Báo Cáo UNC (${fDate} - ${tDate}), ${rows.length} dòng - ${ss.getUrl()}`);
    return { success: true, url: ss.getUrl(), count: rows.length };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  }
}

// ============================================================
// MỚI (theo yêu cầu): "BÁO CÁO THANH TOÁN CHI TIẾT" - xem/xuất lại
// TRỰC TIẾP từ ChiTietDNTT (Trạng thái = Y, đã tính sẵn) - KHÔNG cần
// join lại CT+PhieuCan_DN+HD_NCC như "Xuất Báo Cáo" ở tab Gỗ Keo, nên
// nhanh hơn nhiều. Lọc theo Ngày CK (từ 2026.9.30).
// ============================================================
/** Số dòng tối đa mỗi lần: xem trên web (trình duyệt vẽ bảng) / xuất Excel (file). */
const CHI_TIET_DNTT_GIOI_HAN = { XEM: 2000, XUAT: 30000 };
/**
 * SỬA (rà soát phát hiện - "xử lý tải báo cáo quá giới hạn"): trước đây
 * KHÔNG giới hạn số dòng trả về - khác với các báo cáo khác (Lịch Sử
 * Sửa Đổi, Lịch Sử UNC đều giới hạn 1000) - ChiTietDNTT tích lũy theo
 * thời gian (mỗi lần In Báo Cáo ĐNTT/Đóng Thanh Toán), nếu dùng lâu dài
 * không giới hạn có thể trả về quá nhiều dòng, làm chậm cả server lẫn
 * trình duyệt khi vẽ bảng. Giờ giới hạn 2000 dòng/lần xem, báo rõ khi
 * đạt giới hạn để người dùng thu hẹp khoảng ngày.
 */
function _docChiTietDNTTDaChot_(fDate, tDate, gioiHan) {
  // Lọc theo NGÀY CK (ngày thanh toán - cùng ngày với Báo Cáo MISA; người dùng chọn
  // 28/09/2026, trước đây lọc theo Ngày ghi). Sổ đang mở chỉ đọc dòng có Ngày CK trong khoảng.
  const isoNgayCK = v => { const d = _docNgaySo_(v); return d ? Utilities.formatDate(d, "GMT+7", "yyyy-MM-dd") : ""; };
  const trongKhoang = v => { const iso = isoNgayCK(v); return !!iso && (!fDate || iso >= fDate) && (!tDate || iso <= tDate); };
  const data = _docLuuTruTrongKhoang_(CHITIET_DNTT_SHEET, CHITIET_DNTT_HEADERS.length, fDate, tDate)
    .concat(_docDongTheoKhoa_(getMainSs_().getSheetByName(CHITIET_DNTT_SHEET), 3, CHITIET_DNTT_HEADERS.length, trongKhoang))
    .filter(r => String(r[26] || "").trim() === "Y" && trongKhoang(r[3]))
    .map((r, i) => ({ r, i, iso: isoNgayCK(r[3]) }))
    .sort((a, b) => a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : a.i - b.i) // Ngày CK tăng dần, cùng ngày giữ thứ tự sổ
    .map(x => x.r);
  const GIOI_HAN = gioiHan || CHI_TIET_DNTT_GIOI_HAN.XEM;
  const results = [];
  let tongKhopLoc = 0;
  data.forEach(r => {
    const ngayGhi = r[27];
    tongKhopLoc++;
    if (results.length >= GIOI_HAN) return; // vẫn đếm tongKhopLoc để báo đúng tổng, chỉ dừng thêm vào mảng trả về
    results.push({
      idHeThong: String(r[0] || ""), lanTT: String(r[1] || ""), soPhieuCan: String(r[2] || "").replace(/'/g, ""),
      ngayCK: r[3], ngayNhap: r[4], daiLy: String(r[5] || ""), // giá trị gốc trong sổ - web/xuất tự định dạng
      soHD: String(r[6] || "").replace(/'/g, ""), hoTenChuRung: String(r[8] || ""),
      tenThuHuong: String(r[10] || ""), diaChi: String(r[12] || ""),
      klKg: utils.parseNum(r[18]), klTan: utils.parseNum(r[19]), donGia: utils.parseNum(r[20]),
      thanhTien: utils.parseNum(r[21]), nguonGoc: String(r[22] || ""),
      nganHang: String(r[23] || ""), soTaiKhoan: String(r[24] || "").replace(/'/g, ""),
      ngayGhi
    });
  });
  return { items: results.reverse(), total: tongKhopLoc, truncated: tongKhopLoc > GIOI_HAN };
}
/** #Web: như _docChiTietDNTTDaChot_, ngày hiển thị kiểu VN (file xuất theo Vùng xuất). */
function getChiTietDNTTDaChot_(fDate, tDate) {
  const kq = _docChiTietDNTTDaChot_(fDate, tDate);
  kq.items.forEach(x => {
    x.ngayCK = _ngayWeb_(x.ngayCK); x.ngayNhap = _ngayWeb_(x.ngayNhap);
    x.ngayGhi = x.ngayGhi instanceof Date ? Utilities.formatDate(x.ngayGhi, "GMT+7", "dd/MM/yyyy HH:mm:ss") : String(x.ngayGhi || "");
  });
  return kq;
}

/** Xuất Excel "Báo Cáo Thanh Toán Chi Tiết" - nhanh vì đọc thẳng từ
 * ChiTietDNTT đã tính sẵn, không phải join lại từ đầu. */
function exportChiTietDNTTDaChotExcel_(fDate, tDate) {
  try {
    const ketQua = _docChiTietDNTTDaChot_(fDate, tDate, CHI_TIET_DNTT_GIOI_HAN.XUAT);
    const rows = ketQua.items;
    if (!rows.length) return { success: false, message: "⚠️ Không có dữ liệu nào trong khoảng ngày đã chọn." };

    const folder = DriveApp.getFolderById(getReportFolderId_());
    const fileName = `BAO CAO THANH TOAN CHI TIET (${(fDate||'').replace(/-/g,'')}_${(tDate||'').replace(/-/g,'')})`;
    const ss = _taoFileBaoCao_(fileName, folder);

    const sheet = ss.getSheets()[0];
    sheet.setName("ChiTiet");
    // SỬA LỖI: trước khóa nhầm cột 3,4,5,7,17 (lệch với tiêu đề bên dưới).
    _lockTextCols_(sheet, [1, 2, 3, 5, 15, 16], rows.length + 5); // Số phiếu cân, Ngày CK, Ngày nhập, Số HĐ, Số TK, Ngày ghi
    const headers = ["Số phiếu cân", "Ngày CK", "Ngày nhập", "Đại lý", "Số hợp đồng", "Họ tên chủ rừng", "Tên người thụ hưởng", "Địa chỉ", "KL (kg)", "KL (tấn)", "Đơn giá", "Thành tiền", "Nguồn gốc", "Ngân hàng", "Số tài khoản", "Ngày ghi"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#d9d2e9");
    const body = rows.map(r => [
      _chu_(r.soPhieuCan), _ngayXuat_(r.ngayCK), _ngayXuat_(r.ngayNhap), r.daiLy, _chu_(r.soHD), r.hoTenChuRung, r.tenThuHuong, r.diaChi,
      r.klKg, r.klTan, r.donGia, r.thanhTien, r.nguonGoc, r.nganHang, _chu_(r.soTaiKhoan), _ngayGioXuat_(r.ngayGhi)
    ]);
    sheet.getRange(2, 1, body.length, headers.length).setValues(_dongAnToan_(body));
    _canhLeTheoKieu_(sheet, 2, body);
    sheet.getRange(2, 9, body.length, 1).setNumberFormat("#,##0");
    sheet.getRange(2, 10, body.length, 1).setNumberFormat("#,##0.000");
    sheet.getRange(2, 11, body.length, 2).setNumberFormat("#,##0");
    sheet.setFrozenRows(1);

    logAction_("XUAT_BAO_CAO_CHITIET_DNTT", "-", `Xuất Báo Cáo Thanh Toán Chi Tiết (${fDate} - ${tDate}), ${rows.length} dòng - ${ss.getUrl()}`);
    let msgKq = `✅ Đã xuất ${rows.length} dòng.`;
    if (ketQua.truncated) msgKq += ` ⚠️ Tổng khớp bộ lọc là ${ketQua.total} dòng, đã đạt giới hạn ${CHI_TIET_DNTT_GIOI_HAN.XUAT} dòng/lần xuất - thu hẹp khoảng ngày để xuất đầy đủ hơn.`;
    return { success: true, url: ss.getUrl(), count: rows.length, message: msgKq };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  }
}

/** MỚI (theo yêu cầu - loại trùng cho UNC, dạng CẢNH BÁO không chặn):
 * kiểm tra các idHeThong trong filteredRows đã từng xuất hiện trong
 * ChiTietUNC (lịch sử tạo UNC) chưa - trả về chuỗi cảnh báo (rỗng nếu
 * không có gì trùng). */
function _kiemTraTrungUNC_(filteredRows) {
  try {
    const sh = _getChiTietUncSheet_();
    if (sh.getLastRow() < 2) return "";
    const idSetCanTao = new Set(filteredRows.map(r => r.idHeThong).filter(Boolean));
    const idDaCoUNC = new Set();
    sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().forEach(r => {
      const id = String(r[0] || "").trim();
      if (id && idSetCanTao.has(id)) idDaCoUNC.add(id);
    });
    if (idDaCoUNC.size === 0) return "";
    const soLuong = idDaCoUNC.size;
    return `⚠️ ${soLuong} hồ sơ trong lần tạo này ĐÃ TỪNG có UNC trước đó - Báo Cáo UNC giữ bản mới này thay cho bản cũ (bản cũ được sao lưu ở Hệ Thống › Khôi Phục). Kiểm tra kỹ tránh nộp ngân hàng trùng lặp nếu đây không phải là tạo lại có chủ ý.`;
  } catch (e) {
    return ""; // Không chặn tạo UNC nếu kiểm tra trùng lỗi
  }
}

function runCreateUNCOnly_(filteredRows, toDate, tkTrichNoOverride, tkThuPhiOverride) {
  try {
    // MỚI (theo yêu cầu - "có chức năng loại trùng không"): UNC là hành
    // động CÓ CHỦ Ý (có thể cố tình tạo lại nếu file trước lỗi - xem
    // "Tạo Lại File UNC Cho Hồ Sơ Đã Chốt") nên KHÔNG chặn tạo trùng,
    // chỉ CẢNH BÁO rõ nếu hồ sơ này đã từng có UNC trước đó, để người
    // dùng tự biết và cân nhắc (tránh vô tình nộp ngân hàng 2 lần).
    const canhBaoTrungUNC = _kiemTraTrungUNC_(filteredRows);

    const uncCfg = getUncConfig_();
    // MỚI (theo yêu cầu - "có thể gõ tài khoản chuyển tiền và tài khoản
    // chịu phí khác"): dùng giá trị GÕ RIÊNG cho lần tạo này nếu có,
    // mặc định vẫn lấy từ cấu hình chung (Cài Đặt > Cấu Hình UNC).
    if (tkTrichNoOverride) uncCfg.tkTrichNo = tkTrichNoOverride;
    if (tkThuPhiOverride) uncCfg.tkThuPhi = tkThuPhiOverride;
    const bankInfo = getCompanyBankInfo_();

    let mapDM = new Map();
    try {
      const ssDM = SpreadsheetApp.openById(getDmNhSsId_());
      let shDM = ssDM.getSheetByName(uncCfg.sheetDmNH) || ssDM.getSheetByName("DM_TKNH"); // tương thích ngược nếu sheet còn tên cũ
      if (shDM && shDM.getLastRow() > 1) {
        const dmData = shDM.getRange(2, 2, shDM.getLastRow() - 1, 2).getValues();
        dmData.forEach(r => { if (r[1]) mapDM.set(utils.standardize(r[1]), String(r[0]).trim()); });
      }
    } catch (e) { /* Không chặn tạo UNC nếu file Danh Mục Ngân Hàng lỗi - chỉ mất phần tên đầy đủ */ }

    const fileName = `UNC_Ngay${toDate.replace(/-/g, '')}`;
    const folder = DriveApp.getFolderById(getReportFolderId_());
    const newSS = _taoFileBaoCao_(fileName, folder);

    const sheet = newSS.getSheets()[0];
    // Khóa TEXT thuần: TkNo(3), SoTK(5), TkPhi(15) - tránh mất số 0 đầu.
    // SỬA (tối ưu tốc độ - theo yêu cầu "xuất báo cáo hay bị timeout"):
    // trước đây khóa mặc định 2000 dòng/cột dù báo cáo chỉ có vài chục
    // dòng - mỗi cột là 1 lượt gọi API riêng, cộng dồn gây chậm. Giờ chỉ
    // khóa ĐÚNG số dòng thực tế cần (+ ít dòng dư an toàn).
    const soDongUNC = filteredRows.length + 5;
    _lockTextCols_(sheet, [3, 5, 15, 16], soDongUNC);
    const toDateXuat = _formatNgayXuat_(toDate);

    const rows = filteredRows.map((r, i) => {
      const tenFull = mapDM.get(utils.standardize(r.nganHang)) || r.nganHang;

      // Tự động phân loại: chuyển TRONG hay NGOÀI ngân hàng công ty (so
      // với Ngân hàng công ty đã cấu hình ở mục MISA, KHÔNG hardcode "BIDV").
      const stdNH = utils.standardize(r.nganHang);
      const stdCongTyNH = utils.standardize(bankInfo.name);
      let phuongThucChuyen = "O - Chuyển ngoài " + bankInfo.name;
      if (stdCongTyNH && stdNH.includes(stdCongTyNH)) {
        phuongThucChuyen = "I - Chuyển trong " + bankInfo.name;
      }

      return [
        i + 1,
        phuongThucChuyen,
        _chu_(uncCfg.tkTrichNo),
        r.nguoiNhan,
        _chu_(r.stk),
        tenFull,
        utils.parseNum(r.soTien),
        uncCfg.loaiTien,
        r.noiDungCK,
        "", "", "", "",
        uncCfg.benChiuPhi,
        _chu_(uncCfg.tkThuPhi),
        toDateXuat
      ];
    });

    const headers = ["STT", "PT", "TkNo", "Ten", "SoTK", "NH", "Tien", "Loai", "NoiDung", "A", "B", "C", "D", "Phi", "TkPhi", "Ngay"];
    sheet.getRange(1, 1, 1, 16).setValues([headers]).setFontWeight("bold");

    if (rows.length > 0) {
      sheet.getRange(4, 1, rows.length, 16).setValues(_dongAnToan_(rows));
      _canhLeTheoKieu_(sheet, 4, rows);
    }

    logAction_("TAO_UNC", filteredRows.map(r => r.idHeThong).join(","), `Tạo file UNC ngày ${toDate}, ${rows.length} dòng - ${newSS.getUrl()}`);
    _ghiLichSuUNC_(filteredRows, uncCfg, toDate, newSS.getUrl()); // MỚI (theo yêu cầu): lưu vết để xem lại sau này
    return { success: true, url: newSS.getUrl(), count: rows.length, canhBaoTrung: canhBaoTrungUNC };
  } catch (e) {
    return { success: false, message: _loiChoNguoiDung_(e) };
  }
}

// MỚI (theo yêu cầu): hộp thoại menu Sheet để dán URL/ID File Chính (bản Sheet-UI của webSetMainSsId_()).
function showKetNoiFileChinhDialog() {
  _yeuCauQuyen_(QUYEN.QUAN_TRI);
  const ui = SpreadsheetApp.getUi();
  const cur = PropertiesService.getScriptProperties().getProperty('MAIN_SS_ID');
  const goiY = cur ? `Đang kết nối: ${cur}\n\n` : "";
  const res = ui.prompt("Kết Nối File Chính", `${goiY}Dán URL hoặc ID Google Sheet của File Chính (chứa DNTT_GK_DN/CT/112/Nhật Ký):`, ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  const r = webSetMainSsId_(res.getResponseText());
  ui.alert(r.message);
}

/**
 * SỬA LỖI NGHIÊM TRỌNG (theo yêu cầu): CCCD/Số Tài Khoản/Số HĐ/Số Phiếu
 * Cân bị Google Sheets tự chuyển thành SỐ (mất số 0 ở đầu, sai lệch dữ
 * liệu) khi COPY từ Draft sang bản chính. Nguyên nhân: dấu nháy đơn `'`
 * (ép kiểu Text) CHỈ có tác dụng tại ĐÚNG lượt ghi đó - khi đọc lại
 * (getValues()) rồi ghi sang sheet KHÁC mà không thêm lại dấu `'`, ô
 * đích (nếu đang ở định dạng "Tự động") sẽ tự hiểu lại thành SỐ. Khóa
 * CỨNG định dạng cột thành TEXT thuần (@) là cách DUY NHẤT đảm bảo chắc
 * chắn, không phụ thuộc vào việc có nhớ thêm dấu `'` mỗi lần ghi hay
 * không - áp dụng CHO CẢ Draft lẫn bản chính.
 *
 * MỚI: cũng khóa luôn cột Timestamp/Ngày về ĐÚNG 1 định dạng cố định
 * (không để "Tự động") - vì nếu để "Tự động", Google Sheets tự diễn
 * giải theo LOCALE của sheet (vd mm/dd/yyyy kiểu Mỹ), trong khi hệ
 * thống này tính toán theo dd/mm/yyyy (Việt Nam) - gây lệch ngày/tháng
 * hoặc hiển thị không đồng nhất giữa các dòng.
 */
function _lockTextCols_(sh, cols1Based, maxRows) {
  const rows = maxRows || Math.max(sh.getMaxRows(), 2000);
  cols1Based.forEach(col => sh.getRange(1, col, rows, 1).setNumberFormat("@"));
}
function _lockDateCols_(sh, colFormatPairs, maxRows) {
  const rows = maxRows || Math.max(sh.getMaxRows(), 2000);
  colFormatPairs.forEach(([col, fmt]) => sh.getRange(1, col, rows, 1).setNumberFormat(fmt));
}

/**
 * Chạy 1 LẦN (menu/Cài Đặt) để khóa định dạng TEXT cho CCCD/STK/Số HĐ/
 * Số Phiếu Cân trên CẢ 6 sheet (Draft CT/112/Nguồn + bản chính CT/112/
 * Nguồn). LƯU Ý QUAN TRỌNG: việc này CHỈ NGĂN lỗi xảy ra THÊM từ bây giờ
 * - KHÔNG tự phục hồi được số 0 đầu đã bị mất ở dữ liệu CŨ (nếu có) -
 * những dòng cũ bị sai cần bạn tự kiểm tra/sửa lại tay.
 */
function khoaDinhDangTextTatCa_() {
  let ketQua = [];
  const preset = _getRegionPreset_(); // MỚI: theo đúng vùng đã chọn (mặc định Việt Nam)
  const FMT_NGAY = preset.dateFmt;
  const FMT_NGAY_GIO = preset.dateTimeFmt;

  try {
    const { shCT: shDraftCT, sh112: shDraft112, shSrc: shDraftSrc } = getDraftSheets_();
    _lockTextCols_(shDraftCT, [1, 2, 5, 8, 12, 20]);    // ID_CT(1), ID_CHA(2), CCCD(5), STK(8), Số Phiếu Cân(12), Số HĐ(20) - Draft CT
    _lockDateCols_(shDraftCT, [[3, FMT_NGAY_GIO], [21, FMT_NGAY], [22, FMT_NGAY]]); // Timestamp(3), Ngày CK/TT(21), Ngày ĐN(22)
    _lockTextCols_(shDraft112, [1, 6, 9]);           // ID_KEY(1), STK(6), Số HĐ(9) - Draft 112
    _lockDateCols_(shDraft112, [[2, FMT_NGAY_GIO], [10, FMT_NGAY], [17, FMT_NGAY], [20, FMT_NGAY]]); // Timestamp(2), Ngày Ký HĐ(10), Ngày ĐN(17), Ngày Dự Kiến(20)
    _lockTextCols_(shDraftSrc, [1, 5, 9, 13, 14]);       // ID_KEY(1), CCCD(5), STK(9), ID_112(13), Số HĐ(14) - Draft Nguồn
    _lockDateCols_(shDraftSrc, [[2, FMT_NGAY_GIO], [12, FMT_NGAY], [17, FMT_NGAY]]); // Timestamp(2), Ngày ĐN(12), Ngày Đóng TT(17)
    ketQua.push("Draft CT/112/Nguồn: OK");
  } catch (e) {
    ketQua.push("Draft: lỗi - " + _loiChoNguoiDung_(e));
  }

  // SỬA (tránh lỗi dây chuyền): tách getMainSs_() vào TRY RIÊNG - nếu
  // File Chính CHƯA được kết nối (getMainSs_() báo lỗi), phần Draft ở
  // trên VẪN được khóa bình thường, chỉ phần "File Chính" báo lỗi rõ
  // ràng thay vì làm hỏng luôn cả lượt chạy.
  let ss;
  try {
    ss = getMainSs_();
  } catch (e) {
    ketQua.push("File Chính: CHƯA kết nối - " + _loiChoNguoiDung_(e));
    logAction_("KHOA_DINH_DANG_TEXT", "-", ketQua.join(" · "));
    return ketQua.join(" · ");
  }

  try {
    const shCTReal = ss.getSheetByName(CFG.DNTT_CT);
    if (shCTReal) {
      _lockTextCols_(shCTReal, [1, 2, 5, 8, 12, 20]);
      _lockDateCols_(shCTReal, [[3, FMT_NGAY_GIO], [21, FMT_NGAY], [22, FMT_NGAY]]);
      ketQua.push("CT thật: OK");
    }
  } catch (e) { ketQua.push("CT thật: lỗi - " + _loiChoNguoiDung_(e)); }

  try {
    const sh112Real = ss.getSheetByName(CFG.DNTT_112);
    if (sh112Real) {
      _lockTextCols_(sh112Real, [1, 6, 9]);
      _lockDateCols_(sh112Real, [[2, FMT_NGAY_GIO], [10, FMT_NGAY], [17, FMT_NGAY]]);
      ketQua.push("112 thật: OK");
    }
  } catch (e) { ketQua.push("112 thật: lỗi - " + _loiChoNguoiDung_(e)); }

  try {
    const shSrcReal = ss.getSheetByName(CFG.DNTT_SRC);
    if (shSrcReal) {
      _lockTextCols_(shSrcReal, [1, 5, 9, 13, 14]);
      _lockDateCols_(shSrcReal, [[2, FMT_NGAY_GIO], [12, FMT_NGAY], [17, FMT_NGAY]]);
      ketQua.push("Nguồn thật: OK");
    }
  } catch (e) { ketQua.push("Nguồn thật: lỗi - " + _loiChoNguoiDung_(e)); }
  // Sổ ChiTietDNTT (Ngày CK, Ngày nhập, Ngày ghi) và ChiTietUNC (Ngày hiệu lực, Thời gian tạo) - 2026.9.23.
  try {
    _lockDateCols_(_getChiTietDnttSheet_(), CHITIET_DNTT_COT_NGAY.map(c => [c, FMT_NGAY]).concat([[28, FMT_NGAY_GIO]]));
    _lockDateCols_(_getChiTietUncSheet_(), CHITIET_UNC_COT_NGAY.map(c => [c, FMT_NGAY]).concat([[15, FMT_NGAY_GIO]]));
    ketQua.push("ChiTietDNTT/ChiTietUNC: OK");
  } catch (e) { ketQua.push("ChiTietDNTT/ChiTietUNC: lỗi - " + _loiChoNguoiDung_(e)); }

  logAction_("KHOA_DINH_DANG_TEXT", "-", ketQua.join(" · "));
  return ketQua.join(" · ");
}

function showKhoaDinhDangTextDialog() {
  _yeuCauQuyen_(QUYEN.QUAN_TRI);
  const ui = SpreadsheetApp.getUi();
  try {
    ui.alert("✅ Đã khóa định dạng cho CCCD/STK/Số HĐ/Số Phiếu Cân (TEXT) và Timestamp/Ngày (dd/MM/yyyy):\n\n" + khoaDinhDangTextTatCa_() +
      "\n\n⚠️ Lưu ý: việc này chỉ ngăn lỗi xảy ra THÊM từ bây giờ, không tự phục hồi dữ liệu cũ đã bị sai (số 0 đầu bị mất, ngày/tháng bị lộn) - cần tự kiểm tra lại các dòng cũ.");
  } catch (e) {
    ui.alert("❌ Lỗi: " + _loiChoNguoiDung_(e));
  }
}

function webKhoaDinhDangTextTatCa_() {
  try {
    const r = khoaDinhDangTextTatCa_();
    return { success: true, message: "✅ Đã khóa định dạng CCCD/STK/Số HĐ/Số Phiếu Cân (TEXT) và Timestamp/Ngày (dd/MM/yyyy): " + r + ". ⚠️ Không tự phục hồi dữ liệu cũ đã bị sai (nếu có)." };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  }
}

/**
 * MỚI (theo yêu cầu): CẤU HÌNH VÙNG LÃNH THỔ - để đồng bộ định dạng
 * ngày/số với ĐÚNG cách Google Sheet đang lưu trữ (có thể khác nhau tùy
 * locale của từng file Sheet, vd Việt Nam dd/mm/yyyy hay Mỹ mm/dd/yyyy).
 * Thay vì "cứng" 1 định dạng trong code, giờ chọn 1 trong các preset
 * bên dưới - MỌI nơi khóa định dạng cột (khoaDinhDangTextTatCa_) và MỌI
 * nơi phân tích/ghép chuỗi ngày (vd "Ngày thanh toán" khi Đóng Thanh
 * Toán) đều tự động dùng ĐÚNG theo lựa chọn này.
 */
// TIÊU CHUẨN VÙNG (người dùng chốt 28/09/2026) - chỉ dùng khi Cài đặt chưa chọn:
//  - HE_THONG: theo định dạng của file Google Sheet (locale US) - khóa định dạng
//    cột ngày trên sheet, đọc ngày gõ tay dạng dd/mm hay mm/dd.
//  - XUAT: file Excel xuất ra, gồm file MISA / Update_NganHang_DN - kiểu VN
//    (dd/mm/yyyy), KHÔNG đi theo vùng hệ thống.
const VUNG_MAC_DINH = { HE_THONG: "US", XUAT: "VN" };
const REGION_PRESETS = {
  VN: { label: "Việt Nam (ngày dd/mm/yyyy, thứ tự nhập dd/mm/yyyy)", dateFmt: "dd/MM/yyyy", dateTimeFmt: "dd/MM/yyyy HH:mm:ss", dateOrder: "dmy", nghin: ".", thapPhan: "," },
  US: { label: "United States (ngày mm/dd/yyyy, thứ tự nhập mm/dd/yyyy)", dateFmt: "MM/dd/yyyy", dateTimeFmt: "MM/dd/yyyy HH:mm:ss", dateOrder: "mdy", nghin: ",", thapPhan: "." }
};
function _getRegion_() {
  const r = PropertiesService.getScriptProperties().getProperty('REGION_LOCALE');
  return REGION_PRESETS[r] ? r : VUNG_MAC_DINH.HE_THONG;
}
function _setRegion_(region) {
  if (!REGION_PRESETS[region]) throw new Error("Vùng không hợp lệ: " + region);
  PropertiesService.getScriptProperties().setProperty('REGION_LOCALE', region);
}
function _getRegionPreset_() {
  return REGION_PRESETS[_getRegion_()];
}
/** Tách 1 chuỗi ngày do người dùng gõ (dd/mm/yyyy HOẶC mm/dd/yyyy tùy
 * vùng đã chọn) thành { d, m, y } (số nguyên) - dùng khi cần Date object
 * thật từ input dạng text (vd "Ngày thanh toán" lúc Đóng Thanh Toán). */
function _parseNgayTheoVung_(str) {
  const s = String(str || "").trim();
  let kq = null;
  // yyyy-MM-dd (ô chọn ngày của trình duyệt) - không mơ hồ, không phụ thuộc vùng.
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (iso) kq = { y: +iso[1], m: +iso[2], d: +iso[3] };
  else {
    const p = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
    if (!p) return null;
    const a = +p[1], b = +p[2], y = +p[3];
    kq = _getRegionPreset_().dateOrder === "mdy" ? { d: b, m: a, y } : { d: a, m: b, y };
  }
  // SỬA LỖI (người dùng báo 28/09/2026 - chọn 26/09/2026 mà Ngày CK ghi 09/02/2028):
  // trước đây không kiểm tra ngày có thật - "26/09/2026" đọc theo mm/dd thành
  // tháng 26 và Date tự cộng dồn sang 09/02/2028. Giờ ngày không có thật -> null.
  const dt = new Date(Date.UTC(kq.y, kq.m - 1, kq.d));
  const thatSu = kq.y >= 2000 && kq.y <= 2100 && dt.getUTCFullYear() === kq.y && dt.getUTCMonth() === kq.m - 1 && dt.getUTCDate() === kq.d;
  return thatSu ? kq : null;
}

/** Parse chuỗi "dd/MM/yyyy" - LUÔN đúng định dạng CỐ ĐỊNH mà
 * utils.formatDate() xuất ra (KHÔNG theo Vùng Lãnh Thổ, khác
 * _parseNgayTheoVung_ ở trên) - dùng khi cần dựng lại Date object thật
 * từ 1 giá trị đã qua utils.formatDate() (vd payload.ngayHopDong lấy từ
 * getBulkReferenceData_()/ngayKy). new Date("dd/MM/yyyy") của V8 hiểu
 * nhầm thành mm/dd/yyyy - gây sai hoặc Invalid Date. */
function _parseNgayVN_(str) {
  const p = String(str || "").trim().split('/');
  if (p.length !== 3) return "";
  const d = parseInt(p[0], 10), m = parseInt(p[1], 10), y = parseInt(p[2], 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return "";
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return isNaN(dt.getTime()) ? "" : dt;
}

function showChonVungDialog() {
  _yeuCauQuyen_(QUYEN.QUAN_TRI);
  const ui = SpreadsheetApp.getUi();
  const cur = _getRegion_();
  const options = Object.keys(REGION_PRESETS).map(k => `${k === cur ? "👉 " : "   "}${k}: ${REGION_PRESETS[k].label}`).join("\n");
  const res = ui.prompt("Chọn Vùng Lãnh Thổ", `Đang dùng: ${cur}\n\n${options}\n\nGõ mã vùng (VN hoặc US) rồi bấm OK:`, ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  const chon = res.getResponseText().trim().toUpperCase();
  try {
    _setRegion_(chon);
    ui.alert(`✅ Đã đổi sang vùng "${chon}". Hãy bấm "🔒 Khóa Định Dạng TEXT/Ngày..." lại 1 lần để áp dụng định dạng mới cho các sheet.`);
  } catch (e) {
    ui.alert("❌ " + _loiChoNguoiDung_(e));
  }
}

function getRegionInfoForWeb_() {
  return { current: _getRegion_(), presets: Object.keys(REGION_PRESETS).map(k => ({ code: k, label: REGION_PRESETS[k].label })) };
}

/**
 * MỚI (theo yêu cầu): đọc ĐỊNH DẠNG THẬT (locale + múi giờ) đang cài đặt
 * trên chính file Google Sheet (File Chính + File Nháp) - để người dùng
 * XEM và so sánh với "Vùng Lãnh Thổ"/"Vùng Định Dạng Báo Cáo Xuất Excel"
 * đang chọn, tránh phải đoán mò locale nào đang thật sự được dùng.
 */
function _suyRaVungTuLocale_(locale) {
  const l = String(locale || "").toLowerCase();
  if (l.startsWith("vi")) return "VN";
  if (l.startsWith("en")) return "US";
  return null; // locale khác (vd fr, zh...) - không tự đoán, để người dùng tự chọn
}
function getSheetLocaleInfoForWeb_() {
  const result = {};
  try {
    const mainSs = getMainSs_();
    const locale = mainSs.getSpreadsheetLocale();
    result.main = { name: mainSs.getName(), locale, timeZone: mainSs.getSpreadsheetTimeZone(), suyRaVung: _suyRaVungTuLocale_(locale) };
  } catch (e) { result.mainError = "Chưa kết nối File Chính hoặc không đọc được."; }
  try {
    const draftSs = SpreadsheetApp.getActive();
    const locale = draftSs.getSpreadsheetLocale();
    result.draft = { name: draftSs.getName(), locale, timeZone: draftSs.getSpreadsheetTimeZone(), suyRaVung: _suyRaVungTuLocale_(locale) };
  } catch (e) { result.draftError = "Không đọc được File Nháp."; }
  return result;
}

function webSetRegion_(region) {
  try {
    _setRegion_(region);
    return { success: true, message: `✅ Đã đổi sang vùng "${region}". Hãy bấm "Khóa Định Dạng TEXT/Ngày..." lại 1 lần để áp dụng.` };
  } catch (e) {
    return { success: false, message: "❌ " + _loiChoNguoiDung_(e) };
  }
}

/** Thoát ký tự đặc biệt HTML (&,<,>,",') - dùng khi nhúng text thô vào
 * HtmlService.createHtmlOutput() để tránh vỡ layout/nội dung hiển thị
 * (vd URL có dấu & sẽ bị trình duyệt hiểu nhầm nếu không thoát trước). */
function _escHtml_(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * SỬA (theo yêu cầu - quay lại kiến trúc "gắn liền" cho ổn định, nhưng
 * gắn với FILE NHÁP thay vì File Chính): code giờ CHẠY BÊN TRONG chính
 * File Nháp - dùng SpreadsheetApp.getActive() trực tiếp, KHÔNG cần cấu
 * hình ID gì cả. Tự động tạo các sheet Draft cần thiết (CT/112/Nguồn)
 * ngay trong file này nếu chưa có (lần đầu dùng) - không cần bước
 * "Khởi Tạo File Nháp" riêng nữa, mọi thứ tự hoạt động.
 */
function getDraftSheets_() {
  const ss = SpreadsheetApp.getActive();

  let shCT = ss.getSheetByName(CFG.DRAFT_CT_SHEET);
  if (!shCT) {
    shCT = ss.insertSheet(CFG.DRAFT_CT_SHEET);
    shCT.getRange(1, 1, 1, 22).setValues([[
      "ID_CT", "ID_KEY", "Timestamp", "Chủ rừng", "CCCD", "Người ĐN", "Người nhận", "STK người nhận",
      "KL Tổng nguồn(kg)", "DS Phiếu cân gốc", "STT", "Số phiếu cân", "KL Tấn", "Cột N(PC)", "Cột O(PC)",
      "Cột P(N+O)", "Thành tiền", "Trạng thái giá", "Đã chốt(Y/N)", "Số HĐ", "Ngày CK/TT", "Ngày Đề Nghị"
    ]]).setFontWeight("bold").setBackground("#fce5cd");
    shCT.setFrozenRows(1);
  }

  let sh112 = ss.getSheetByName(CFG.DRAFT_112_SHEET);
  if (!sh112) {
    sh112 = ss.insertSheet(CFG.DRAFT_112_SHEET);
    sh112.getRange(1, 1, 1, 24).setValues([[
      "ID_KEY", "Timestamp", "Chủ rừng", "Người nhận", "Ngân hàng", "STK", "Số tiền", "Nội dung CK",
      "Số HĐ", "Ngày HĐ", "Ủy quyền", "KL Tổng(kg)", "SL HĐ lũy kế", "Đã trả", "Còn lại", "Ghi chú",
      "Ngày ĐN", "SL HĐ(cột R)", "Lần TT", "Ngày dự kiến TT", "Đã chốt(Y/N)", "Đủ ĐK TT", "ID_112", "Trạng Thái ĐNTT"
    ]]).setFontWeight("bold").setBackground("#fce5cd");
    sh112.setFrozenRows(1);
  }

  _ensureDraft112Schema_(sh112); // mục U: tự thêm cột "Trạng Thái ĐNTT" nếu File Nháp được tạo từ bản cũ (23 cột)
  const shSrc = _ensureDraftSrcSheet_(ss); // mục AI: tự tạo sheet "đơn xin" Draft nếu chưa có
  return { ss, shCT, sh112, shSrc };
}

/** MỚI (mục AI): tự tạo sheet CFG.DRAFT_SRC_SHEET ("đơn xin" gốc, dành
 * riêng cho hồ sơ tạo qua Web App) nếu File Nháp được tạo từ bản trước
 * chưa có sheet này - không cần chạy lại setupDraftSpreadsheet_(). */
function _ensureDraftSrcSheet_(ss) {
  let sh = ss.getSheetByName(CFG.DRAFT_SRC_SHEET);
  if (!sh) {
    sh = ss.insertSheet(CFG.DRAFT_SRC_SHEET);
    sh.getRange(1, 1, 1, 18).setValues([[
      "ID_KEY", "Timestamp", "Email", "Chủ rừng", "CCCD", "Người đề nghị", "Ủy quyền",
      "Người nhận", "STK người nhận", "KL Tổng(kg)", "DS Phiếu cân gốc", "Ngày Đề Nghị",
      "ID_112", "Số HĐ", "Trạng thái", "Mã Lần TT", "Ngày Đóng TT", "Đã Xử Lý(Y/N)"
    ]]).setFontWeight("bold").setBackground("#fce5cd");
    sh.setFrozenRows(1);
  }
  return sh;
}

/** MỚI (mục U): tự vá thêm cột 24 "Trạng Thái ĐNTT" cho File Nháp đã
 * tạo từ bản trước (chỉ có 23 cột) - để không ai phải chạy lại
 * setupDraftSpreadsheet_() hay tạo File Nháp mới khi cập nhật code. */
function _ensureDraft112Schema_(sh112) {
  try {
    if (sh112.getLastColumn() < 24) {
      sh112.getRange(1, 24).setValue("Trạng Thái ĐNTT").setFontWeight("bold").setBackground("#fce5cd");
    }
  } catch (e) {
    // Không chặn luồng chính nếu không thêm được cột (vd thiếu quyền) -
    // các hàm đọc/ghi vẫn hoạt động, chỉ là cột mới có thể trống tiêu đề.
  }
}

/**
 * MỚI (mục J): dựng 1 dòng dữ liệu theo đúng schema DNTT_GK_DN_CT_DRAFT
 * (22 cột) - dùng chung cho "Tách Phiếu" và "Thêm Mới Đề Nghị Thanh Toán".
 */
function buildDraftCtRow_(idKey, stt, soP, srcInfo, pcMap) {
  const newID = idKey + "-" + stt;
  const pcRow = pcMap.get(utils.standardize(soP));

  const row = new Array(22).fill("");
  row[0] = newID;
  row[1] = idKey;
  row[2] = srcInfo.timestamp;
  row[3] = srcInfo.chuRung;
  row[4] = _chu_(srcInfo.cccd || "");
  row[5] = srcInfo.nguoiDN;
  row[6] = srcInfo.nguoiNhan;
  row[7] = _chu_(srcInfo.stkNguoiNhan || "");
  row[8] = srcInfo.klTongNguon;
  row[9] = srcInfo.dsPhieuCanGoc;
  row[10] = stt;
  row[11] = _chu_(soP);

  if (pcRow) {
    row[12] = utils.parseNum(pcRow[PC_COL.KL_KG]) / 1000;
    row[13] = utils.parseNum(pcRow[PC_COL.DON_GIA_AD]);
    row[14] = utils.parseNum(pcRow[PC_COL.GIAM_GIA]);
    row[15] = row[13] + row[14];
    row[16] = utils.parseNum(pcRow[PC_COL.THANH_TIEN]);
    row[17] = "Đã lấy giá từ Phiếu Cân";
  }

  row[18] = "N";
  row[19] = _chu_(srcInfo.soHD || "");
  row[20] = srcInfo.ngayTT || "";
  row[21] = srcInfo.ngayDeNghi || "";

  return { row, found: !!pcRow };
}

// --- DATA VIEW FOR WEB (giữ nguyên như bản gốc) ---
/**
 * SỬA (tối ưu tốc độ - theo yêu cầu "Báo Cáo Thanh Toán hay timeout"):
 * trước đây LUÔN đọc TOÀN BỘ lịch sử sheet 112 thật rồi mới lọc theo
 * ngày - sheet càng tích lũy nhiều tháng/năm càng chậm dần, cuối cùng
 * timeout. Hồ sơ được ghi THÊM VÀO CUỐI sheet theo thứ tự xử lý (gần
 * đúng thứ tự thời gian) - nên khi CÓ "Từ ngày", đọc từ CUỐI SHEET lên,
 * dừng sớm khi đã thấy đủ dư dòng CŨ HƠN "Từ ngày" liên tục - nhanh hơn
 * nhiều cho các khoảng ngày GẦN ĐÂY (trường hợp phổ biến nhất). Nếu
 * sheet chưa quá lớn hoặc KHÔNG có "Từ ngày" (xem toàn bộ lịch sử), vẫn
 * đọc bình thường (toàn bộ) để đảm bảo CHẮC CHẮN đúng.
 */
function get112ViewData_(fDate, tDate) {
  const sh = getMainSs_().getSheetByName(CFG.DNTT_112);
  const hienTai = sh && sh.getLastRow() >= 2 ? _docSheetToiUuTheoNgay_(sh, sh.getLastRow() - 1, 22, fDate, 16) : [];
  const data = _docLuuTruTrongKhoang_(CFG.DNTT_112, 22, fDate, tDate).concat(hienTai);
  const filtered = data.filter(r => {
    if (utils.isBlank(r[0])) return false;
    let d = r[16];
    if (!(d instanceof Date)) return false;
    let iso = Utilities.formatDate(d, "GMT+7", "yyyy-MM-dd");
    return (!fDate || iso >= fDate) && (!tDate || iso <= tDate);
  });
  return filtered.map(r => ({
    idHeThong: String(r[0] || ""),
    ngayDN: utils.formatDate(r[16]),
    ngayISO: Utilities.formatDate(r[16], "GMT+7", "yyyy-MM-dd"),
    soLan: String(r[18] || ""),
    chuRung: String(r[2] || ""),
    nguoiNhan: String(r[3] || ""),
    // v2026.6: bỏ dấu ' như Số HĐ - ô đã khóa TEXT có thể lưu nguyên dấu
    // ', khi tạo UNC/báo cáo (tự thêm ' lần nữa) sẽ ra STK sai dạng ''0123.
    stk: String(r[5] || "").replace(/'/g, ""),
    nganHang: String(r[4] || ""),
    soHD: String(r[8] || "").replace(/'/g, ""),
    klTan: utils.parseNum(r[11]) / 1000,
    soTien: utils.parseNum(r[6]),
    noiDungCK: String(r[7] || ""),
    ghiChu: String(r[15] || "")
  })).reverse();
}

/**
 * Đọc "thông minh" theo ngày cho sheet lớn - nếu sheet nhỏ (<=3000 dòng)
 * hoặc KHÔNG có fDate (xem toàn bộ), đọc bình thường (an toàn tuyệt
 * đối). Nếu sheet lớn VÀ có fDate, đọc theo từng đoạn (chunk) từ CUỐI
 * sheet lên, dừng khi đã gặp đủ dư (300) dòng liên tục CŨ HƠN fDate ở
 * cột ngày chỉ định - trả về đúng thứ tự gốc (cũ -> mới) như đọc toàn
 * bộ, chỉ khác là có thể THIẾU các dòng RẤT CŨ (đã được quyết định bỏ
 * qua có chủ đích vì nằm ngoài khoảng ngày yêu cầu).
 */
function _docSheetToiUuTheoNgay_(sh, totalDataRows, numCols, fDate, colNgayIdx0Based) {
  const NGUONG_TOI_UU = 3000;
  if (totalDataRows <= NGUONG_TOI_UU || !fDate) {
    return sh.getRange(2, 1, totalDataRows, numCols).getValues();
  }
  const CHUNK = 2000;
  const DU_DONG_CU_LIEN_TUC = 300; // số dòng CŨ hơn fDate liên tục cần thấy trước khi dừng (phòng dữ liệu không hoàn toàn theo thứ tự)
  const allRowsNguocLai = []; // tích lũy theo thứ tự mới -> cũ (đảo lại ở cuối)
  let endRow = totalDataRows + 1; // hàng cuối cùng có dữ liệu (1-indexed, dòng 1 là header)
  let dongCuLienTuc = 0;
  while (endRow > 1) {
    const startRow = Math.max(2, endRow - CHUNK + 1);
    const soDong = endRow - startRow + 1;
    const chunk = sh.getRange(startRow, 1, soDong, numCols).getValues();
    for (let i = chunk.length - 1; i >= 0; i--) {
      allRowsNguocLai.push(chunk[i]);
      const d = chunk[i][colNgayIdx0Based];
      if (d instanceof Date) {
        const iso = Utilities.formatDate(d, "GMT+7", "yyyy-MM-dd");
        if (iso < fDate) {
          dongCuLienTuc++;
          if (dongCuLienTuc >= DU_DONG_CU_LIEN_TUC) {
            return allRowsNguocLai.reverse();
          }
        } else {
          dongCuLienTuc = 0; // gặp lại dòng đủ mới -> reset (phòng dữ liệu xen kẽ không hoàn toàn theo thứ tự)
        }
      }
    }
    endRow = startRow - 1;
  }
  return allRowsNguocLai.reverse();
}

// ============================================================
// NÚT 6: TẠO BÁO CÁO & SHEET NGÂN HÀNG (giữ nguyên logic gốc - đọc từ
// dữ liệu CHÍNH THỨC, tức chỉ gồm các hồ sơ ĐÃ CHỐT qua File Nháp)
// ============================================================
/** Chuỗi khoảng ngày cho tiêu đề file xuất: mọi ngày yyyy-MM-dd -> theo Vùng xuất. */
function _khoangNgayXuat_(chuoi) {
  return String(chuoi || "").replace(/\d{4}-\d{2}-\d{2}/g, iso => _formatNgayXuat_(iso));
}
function createFinalReportFromFilteredData_(filteredRows, dateRangeGoc) {
  const dateRange = _khoangNgayXuat_(dateRangeGoc);
  try {
    const folder = DriveApp.getFolderById(getReportFolderId_());
    const fileName = "BÁO CÁO ĐNTT (" + dateRange + ") - " + Utilities.formatDate(new Date(), "GMT+7", "HHmm");
    const newSS = _taoFileBaoCao_(fileName, folder);

    const sheet1 = newSS.getSheets()[0];
    sheet1.setName("DeNghiThanhToanCK");
    renderSheet1Full_(sheet1, filteredRows, dateRange);

    const sheet2 = newSS.insertSheet("BangKeChiTietCK");
    renderSheet2Detail_(sheet2, filteredRows, dateRange);

    logAction_("XUAT_BAO_CAO", dateRange, `Đã xuất báo cáo ${filteredRows.length} hồ sơ - ${newSS.getUrl()}`);

    // SỬA (theo yêu cầu - tách "Báo Cáo Kết Xuất MISA" thành tab riêng):
    // KHÔNG còn tự động ghi Update_NganHang_DN kèm theo nữa - dùng nút
    // "Tạo Lại MISA" riêng ở Hệ Thống (webTaoLaiMisaTheoNgay_()).
    return {
      success: true,
      url: newSS.getUrl()
    };
  } catch (e) {
    return { success: false, message: _loiChoNguoiDung_(e) };
  }
}

// ============================================================
// SHEET 1: TỐI ƯU GIAO DIỆN IN ẤN (giữ nguyên logic gốc)
// ============================================================
// Bảng Đề Xuất (sheet 1 Báo Cáo ĐNTT) - bố cục. Người dùng 28/09/2026: chữ không dính,
// cột vừa phải, xuống dòng cân đối, Nội dung CK 2 dòng, 1 cỡ chữ cho cả bảng, cột tên
// đủ rộng, cột "Lần" hẹp. Độ rộng chữ đo thực tế (Arial) theo từng loại ký tự.
/** Tên đơn vị in đầu báo cáo / phiếu (1 nơi dùng chung). */
const TEN_DON_VI_BAO_CAO = "HOÀNG ANH KHÔI ĐÀ NẴNG";

const BANG_DE_XUAT = {
  CO_CHU: 11,                                                    // 1 cỡ chữ cho cả bảng (tiêu đề cột, dữ liệu, dòng tổng)
  EM: { HOA: 0.72, THUONG: 0.505, SO: 0.556, HEP: 0.28, KHAC: 0.6 }, // bề rộng ký tự / cỡ chữ
  DAM: 1.08,                                                     // chữ đậm (tiêu đề cột) rộng hơn
  PX_LE_O: 14,                                                   // lề trong ô + dư phòng
  RONG_MIN: 32,
  RONG_MAX: { MAC_DINH: 260, NOI_DUNG: 420, GHI_CHU: 340 },
  MUC_MOI_DONG: 2,                                               // Ghi chú: tối đa 2 mục mỗi dòng
  HE_SO_DONG: 1.45, PX_LE_DONG: 8,                               // cao 1 dòng chữ = cỡ chữ (px) × hệ số
  NHOM_CAO_TOI_DA: 30                                            // quá số nhóm chiều cao -> 1 chiều cao chung
};
function _pxCoChu_() { return BANG_DE_XUAT.CO_CHU * 96 / 72; }
/** Bề rộng (px) ước tính của 1 dòng chữ ở cỡ BANG_DE_XUAT.CO_CHU. */
function _doRongChu_(chuoi, dam) {
  const E = BANG_DE_XUAT.EM;
  let em = 0;
  for (const ch of String(chuoi || "")) {
    em += /[0-9]/.test(ch) ? E.SO
      : /[\s.,:;'|\/()\-·\u00A0]/.test(ch) ? E.HEP
      : ch !== ch.toLowerCase() ? E.HOA
      : ch !== ch.toUpperCase() ? E.THUONG : E.KHAC;
  }
  return em * _pxCoChu_() * (dam ? BANG_DE_XUAT.DAM : 1);
}
/** Bề rộng dòng dài nhất của 1 ô nhiều dòng. */
function _rongNhieuDong_(o) {
  return Math.max(0, ...String(o == null ? "" : o).split("\n").map(d => _doRongChu_(d.trim())));
}
/** Độ rộng cột vừa nội dung: dòng dài nhất (kể cả tiêu đề đậm) + lề, trong [RONG_MIN, toiDa]. */
function _rongCotVua_(cacO, tieuDe, toiDa) {
  const can = Math.max(_doRongChu_(tieuDe, true), ...cacO.map(_rongNhieuDong_)) + BANG_DE_XUAT.PX_LE_O;
  return Math.round(Math.min(toiDa || BANG_DE_XUAT.RONG_MAX.MAC_DINH, Math.max(BANG_DE_XUAT.RONG_MIN, can)));
}
/** Số có phân cách nghìn như định dạng ô ("#,##0" / "#,##0.00") - để đo bề rộng. */
function _soHienThi_(n, soLe, vung) {
  const p = vung || REGION_PRESETS[VUNG_MAC_DINH.HE_THONG];
  const [nguyen, le] = Number(n || 0).toFixed(soLe).split(".");
  return nguyen.replace(/\B(?=(\d{3})+(?!\d))/g, p.nghin) + (le ? p.thapPhan + le : "");
}
/** Ghi chú "Tổng KL: a | Đã trả: b | Còn lại: c | Đề nghị đợt này: d | Phiếu: e" -> các
 * dòng cân đối: tối đa MUC_MOI_DONG mục mỗi dòng, cách nhau " · "; 2 mục không vừa cột
 * thì mỗi mục 1 dòng (không để dấu "·" lẻ). Trong 1 mục dùng khoảng trắng KHÔNG NGẮT
 * (trừ sau dấu phẩy danh sách phiếu) - chỉ xuống dòng giữa các mục; trình xem nào bỏ
 * qua xuống dòng thì các mục vẫn cách nhau, không dính chữ. */
function _ghiChuBangDeXuat_(ghiChu) {
  const toiDaPx = BANG_DE_XUAT.RONG_MAX.GHI_CHU - BANG_DE_XUAT.PX_LE_O;
  const muc = String(ghiChu || "").split("|").map(x => x.trim()).filter(Boolean)
    .map(x => x.replace(/(?<!,) /g, "\u00A0"));
  const dong = [];
  for (let i = 0; i < muc.length; i += BANG_DE_XUAT.MUC_MOI_DONG) {
    const nhom = muc.slice(i, i + BANG_DE_XUAT.MUC_MOI_DONG), ghep = nhom.join(" · ");
    if (_doRongChu_(ghep) <= toiDaPx) dong.push(ghep); else dong.push(...nhom);
  }
  return dong.join(" \n"); // khoảng trắng trước xuống dòng: trình xem không xuống dòng vẫn không dính chữ
}
/** Nội dung chuyển khoản -> LUÔN 2 dòng (người dùng yêu cầu 28/09/2026), ngắt ở khoảng
 * trắng làm 2 dòng rộng gần bằng nhau nhất, KHÔNG ngắt ngay sau từ 1-2 ký tự ("HĐ", "số",
 * "gỗ" đi liền từ sau: "HĐ số 20260901002"). Chỉ đổi cách hiển thị trong file xuất - nội
 * dung CK gửi ngân hàng / UNC / MISA giữ nguyên 1 dòng. */
function _noiDungHaiDong_(noiDung) {
  const s = String(noiDung || "").trim().replace(/\s+/g, " ");
  let tot = -1, lechTot = Infinity;
  for (let i = s.indexOf(" "); i > 0; i = s.indexOf(" ", i + 1)) {
    if (s.slice(s.lastIndexOf(" ", i - 1) + 1, i).length <= 2) continue;
    const lech = Math.max(_doRongChu_(s.slice(0, i)), _doRongChu_(s.slice(i + 1)));
    if (lech < lechTot) { lechTot = lech; tot = i; }
  }
  return tot < 0 ? s : s.slice(0, tot) + " \n" + s.slice(tot + 1);
}
/** Ước số dòng hiển thị của 1 ô tự xuống dòng rộng `rongPx`: ngắt theo TỪ (khoảng trắng
 * thường; khoảng trắng không ngắt giữ nguyên cụm), đúng cách Sheets/Excel xuống dòng. */
function _uocSoDongO_(text, rongPx) {
  const toiDa = rongPx - BANG_DE_XUAT.PX_LE_O, cach = _doRongChu_(" ");
  return String(text || "").split("\n").reduce((tong, doan) => {
    let soDong = 1, dai = 0;
    doan.trim().split(" ").forEach(tu => {
      const w = _doRongChu_(tu), can = dai ? dai + cach + w : w;
      if (can <= toiDa || !dai) dai = can; else { soDong++; dai = w; }
      while (dai > toiDa) { soDong++; dai -= toiDa; } // 1 từ dài hơn cả dòng
    });
    return tong + soDong;
  }, 0);
}
/** Đặt chiều cao các dòng dữ liệu (từ dongDau) theo mảng caoPx với ÍT lệnh nhất: gom các
 * dòng liền nhau cùng chiều cao (setRowHeights); quá NHOM_CAO_TOI_DA nhóm thì dùng 1 chiều
 * cao chung (cao nhất). Trước đây đặt từng dòng một -> 2.000 hồ sơ mất hơn 4 phút. */
function _datChieuCaoDong_(sh, dongDau, caoPx) {
  const nhom = [];
  caoPx.forEach((h, i) => { const cuoi = nhom[nhom.length - 1]; if (cuoi && cuoi.h === h) cuoi.n++; else nhom.push({ tu: i, n: 1, h }); });
  if (nhom.length > BANG_DE_XUAT.NHOM_CAO_TOI_DA) { sh.setRowHeights(dongDau, caoPx.length, Math.max(...caoPx)); return; }
  nhom.forEach(g => sh.setRowHeights(dongDau + g.tu, g.n, g.h));
}
/** Căn lề theo KIỂU dữ liệu (người dùng yêu cầu 28/09/2026): cột toàn số -> phải; tên,
 * chuỗi (kể cả Số TK/Số phiếu/Số HĐ dạng chữ, ngày dạng chữ) -> trái. Áp cho vùng dữ liệu
 * bắt đầu từ dòng `dongDau` (tiêu đề giữ căn giữa). Đặt theo CỘT (gom các cột liền nhau
 * cùng kiểu) - không gửi ma trận căn lề từng ô (nặng khi hàng nghìn dòng). */
function _canhLeTheoKieu_(sh, dongDau, rows) {
  if (!rows.length) return;
  const soCot = rows[0].length;
  // Chuỗi Sheets tự đổi thành số khi ghi ("1", "14.83") cũng là số; chuỗi có dấu ' hoặc
  // số 0 đầu (STK, CCCD, Số HĐ - đã giữ dạng chữ) vẫn là chữ.
  const laSo = v => typeof v === "number" || (typeof v === "string" && /^-?(0|[1-9]\d*)(\.\d+)?$/.test(v.trim()));
  const canh = Array.from({ length: soCot }, (_, c) => {
    const coGiaTri = rows.map(r => r[c]).filter(v => v !== "" && v !== null && v !== undefined);
    return coGiaTri.length && coGiaTri.every(laSo) ? "right" : "left";
  });
  for (let c = 0; c < soCot;) {
    let d = c;
    while (d + 1 < soCot && canh[d + 1] === canh[c]) d++;
    sh.getRange(dongDau, c + 1, rows.length, d - c + 1).setHorizontalAlignment(canh[c]);
    c = d + 1;
  }
}
function renderSheet1Full_(sheet, filteredRows, dateRange) {
  sheet.clear();
  // SỬA (theo yêu cầu - file xuất ra cũng phải khóa, không chỉ Draft/bản
  // chính): "Số tài khoản" (cột 6) khóa TEXT thuần - dấu ' chỉ đảm bảo
  // lúc ghi lần đầu, khóa cột mới chắc chắn 100% không bị Sheets tự
  // chuyển thành số (mất số 0 đầu) trong MỌI trường hợp.
  // "Số tài khoản" (cột 6): khóa TEXT thuần - tránh mất số 0 đầu. "Ngày
  // đề nghị" (cột 2): CŨNG khóa TEXT thuần - vì giá trị ghi vào là CHUỖI
  // ngày đã định dạng (không phải Date object thật), nếu không khóa,
  // Google Sheets sẽ tự "đoán" lại theo locale riêng của file mới tạo,
  // có thể ra sai thứ tự ngày/tháng so với Vùng Định Dạng đã chọn.
  _lockTextCols_(sheet, [2, 6], filteredRows.length + 5); // SỬA (tối ưu tốc độ): dùng đúng số dòng thực tế thay vì mặc định 2000
  sheet.getRange("A1").setValue(TEN_DON_VI_BAO_CAO).setFontSize(10).setFontWeight("bold");
  sheet.getRange("A2:K2").merge().setValue("BẢNG ĐỀ XUẤT THANH TOÁN CHUYỂN KHOẢN CÔNG NỢ")
        .setFontSize(15).setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange("A3:K3").merge().setValue(dateRange).setFontStyle("italic").setHorizontalAlignment("center");

  const headers = ["STT", "Ngày đề nghị", "Lần", "Họ tên Chủ rừng", "Người nhận tiền", "Số tài khoản", "Tên ngân hàng", "KL (Tấn)", "Số tiền", "Nội dung chuyển khoản", "Ghi chú"];
  sheet.getRange(4, 1, 1, 11).setValues([headers]).setBackground("#d9ead3").setFontWeight("bold").setBorder(true, true, true, true, true, true).setHorizontalAlignment("center");

  const body = filteredRows.map((r, i) => [
    // Lần TT là SỐ (căn phải như các cột số); giá trị không phải số thì giữ nguyên chữ.
    i + 1, _formatNgayXuat_(r.ngayISO || r.ngayDN), /^\d+$/.test(String(r.soLan).trim()) ? Number(r.soLan) : r.soLan, r.chuRung, r.nguoiNhan, _chu_(r.stk), r.nganHang,
    // v2026.7.2: diễn giải "Tổng KL: .. | Đã trả: .. | ..." xuống dòng từng phần cho dễ đọc.
    utils.parseNum(r.klTan), utils.parseNum(r.soTien), _noiDungHaiDong_(r.noiDungCK), _ghiChuBangDeXuat_(r.ghiChu)
  ]);

  if (body.length > 0) {
    sheet.getRange(5, 1, body.length, 11).setValues(_dongAnToan_(body)).setBorder(true, true, true, true, true, true).setVerticalAlignment("middle");

    const M = BANG_DE_XUAT.RONG_MAX;
    // Dòng tổng cũng tính vào độ rộng cột số (số tổng dài hơn từng dòng).
    const tongKl = body.reduce((t, r) => t + r[7], 0), tongTien = body.reduce((t, r) => t + r[8], 0);
    const cot = c => body.map(r => r[c]);
    const rong = [
      _rongCotVua_(cot(0).map(String), headers[0]),
      _rongCotVua_(cot(1), headers[1]),
      _rongCotVua_(cot(2).map(String), headers[2]),
      _rongCotVua_(cot(3), headers[3]),
      _rongCotVua_(cot(4), headers[4]),
      _rongCotVua_(cot(5).map(v => String(v).replace(/^'/, "")), headers[5]),
      _rongCotVua_(cot(6), headers[6]),
      _rongCotVua_(cot(7).concat(tongKl).map(v => _soHienThi_(v, 2)), headers[7]),
      _rongCotVua_(cot(8).concat(tongTien).map(v => _soHienThi_(v, 0)), headers[8]),
      _rongCotVua_(cot(9), headers[9], M.NOI_DUNG),
      _rongCotVua_(cot(10), headers[10], M.GHI_CHU)
    ];
    rong.forEach((w, i) => sheet.setColumnWidth(i + 1, w));
    // Nội dung CK + Ghi chú tự xuống dòng (cả WrapStrategy lẫn setWrap để file tải về
    // Excel/PDF cũng giữ); cả bảng (tiêu đề cột -> dòng tổng) cùng 1 cỡ chữ.
    sheet.getRange(5, 10, body.length, 2).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP).setWrap(true);
    sheet.getRange(4, 1, body.length + 2, 11).setFontSize(BANG_DE_XUAT.CO_CHU);
    _canhLeTheoKieu_(sheet, 5, body);

    sheet.getRange(5, 8, body.length, 1).setNumberFormat("#,##0.00");
    sheet.getRange(5, 9, body.length, 1).setNumberFormat("#,##0");

    const lastR = 5 + body.length;
    sheet.getRange(lastR, 1, 1, 7).merge().setValue("TỔNG CỘNG").setFontWeight("bold").setHorizontalAlignment("right");
    sheet.getRange(lastR, 8, 1, 2).setFormulaR1C1(`=SUM(R5C:R[-1]C)`).setFontWeight("bold");
    sheet.getRange(lastR, 1, 1, 11).setBackground("#FFF2CC").setBorder(true, true, true, true, true, true);

    // Chiều cao dòng theo số dòng chữ của ô cao nhất (tự co của Sheets bỏ sót ô tự xuống
    // dòng khi tải về Excel/PDF -> chữ bị cắt); đặt theo nhóm, không từng dòng.
    const caoDong = Math.round(_pxCoChu_() * BANG_DE_XUAT.HE_SO_DONG);
    _datChieuCaoDong_(sheet, 5, body.map(r =>
      Math.max(_uocSoDongO_(r[9], rong[9]), _uocSoDongO_(r[10], rong[10]), 1) * caoDong + BANG_DE_XUAT.PX_LE_DONG));
  }
}

// ============================================================
// SHEET 2: CHI TIẾT VÀ ĐỊNH DẠNG TIME/NUMBER
// ============================================================
/**
 * MỚI (theo yêu cầu - tách riêng nút Xuất MISA khỏi Báo Cáo Thanh
 * Toán): gom logic ĐỌC + GHÉP dữ liệu chi tiết (CT thật + PhieuCan_DN +
 * HD_NCC) thành 1 hàm DÙNG CHUNG cho cả "Bảng Kê Chi Tiết CK" (tab Excel)
 * VÀ "Xuất MISA" (ghi Update_NganHang_DN) - tránh phải đọc PC/HD/CT 2
 * LẦN RIÊNG BIỆT cho 2 việc gần như giống hệt nhau.
 */
// ============================================================
// MỚI (theo yêu cầu): SHEET "ChiTietDNTT" (File Chính) - GHI SẴN chi
// tiết từng phiếu cân (đã join CT+PhieuCan_DN+HD_NCC) NGAY LÚC "In Báo
// Cáo ĐNTT" (Trạng thái = N, chưa chốt), thay vì phải join lại MỖI LẦN
// xem Báo Cáo Thanh Toán. Khi "Đóng Thanh Toán": các dòng N tương ứng
// chuyển thành Y, ĐỒNG THỜI tự động ghi vào Update_NganHang_DN (MISA)
// ngay - và Update_NganHang_DN giờ CHỈ GHI THÊM (append), không còn
// xóa/ghi lại toàn bộ mỗi lần như trước - vì vậy Báo Cáo Thanh Toán và
// việc Đóng Thanh Toán sẽ nhanh và ổn định hơn nhiều.
// ============================================================
const CHITIET_DNTT_SHEET = "ChiTietDNTT";
const CHITIET_DNTT_COT_NGAY = [4, 5]; // 1-based: Ngày CK, Ngày nhập - ghi Date, định dạng theo Vùng Lãnh Thổ
const CHITIET_DNTT_HEADERS = ["ID Hệ Thống", "Lần TT", "Số phiếu cân", "Ngày CK", "Ngày nhập", "Đại lý", "Số hợp đồng", "Số xe", "Họ tên chủ rừng", "CCCD Chủ rừng", "Tên người thụ hưởng", "CCCD Người thụ hưởng", "Địa chỉ Chủ rừng", "Địa chỉ rừng", "Giờ vào", "Giờ ra", "KL hàng + xe", "Bì", "KL_KG", "KL_Tấn", "Đơn giá", "Thành tiền", "Nguồn gốc", "Ngân hàng", "Số tài khoản", "Thời gian nhập liệu", "Trạng thái (Y/N)", "Ngày ghi"];

function _getChiTietDnttSheet_() {
  const ss = getMainSs_();
  let sh = ss.getSheetByName(CHITIET_DNTT_SHEET);
  if (!sh) {
    sh = ss.insertSheet(CHITIET_DNTT_SHEET);
    sh.getRange(1, 1, 1, CHITIET_DNTT_HEADERS.length).setValues([CHITIET_DNTT_HEADERS]).setFontWeight("bold").setBackground("#d9d2e9");
    sh.setFrozenRows(1);
    _lockTextCols_(sh, [1, 3, 7, 10, 12, 25, 27], 3000); // ID, Số phiếu cân, Số HĐ, CCCD Chủ rừng, CCCD Thụ hưởng, STK, Trạng thái
  }
  _damBaoCotNgaySo_(sh, CHITIET_DNTT_COT_NGAY); // Ngày CK, Ngày nhập: Date thật theo Vùng Lãnh Thổ (từ 2026.9.23)
  return sh;
}

/** Gộp logic lấy Tên người thụ hưởng/Ngân hàng/STK: ưu tiên override (đã
 * có thể SỬA TAY khác mặc định hợp đồng - vd tt112 từ get112ViewData_()
 * hoặc parentInfo từ getSheet2DraftData()), chỉ rơi về mặc định HD_NCC
 * (hd[10]/hd[16]/hd[15]) khi không có override. Dùng chung cho
 * _xayChiTietDNTTRows_, _gomChiTietChuyenKhoan_, renderSheet2DetailFromDraft_
 * để tránh lệch quy tắc fallback giữa các nơi ghi ChiTietDNTT/MISA. */
function _resolveNguoiNhanTien_(override, hd) {
  return {
    tenThuHuong: (override && override.nguoiNhan) || hd[10],
    nganHangThat: (override && override.nganHang) || hd[16],
    stkThat: (override && override.stk) ? String(override.stk).replace(/'/g, "") : (hd[15] || "")
  };
}

/** Xây mảng 28 cột ChiTietDNTT (Trạng thái mặc định "N") từ 1 tập dòng
 * CT (Draft, TRƯỚC khi chốt) + hàm tra "Lần TT" theo idHeThong - dùng
 * chung cho cả "In Báo Cáo ĐNTT" và phần tính bù lúc "Đóng Thanh Toán"
 * (nếu hồ sơ chưa từng In Báo Cáo ĐNTT trước đó).
 * layThongTinNhanTien (tùy chọn): hàm tra idHeThong ->
 * {nguoiNhan, nganHang, stk} lấy từ ĐÚNG dòng 112 (Draft/thật) của hồ
 * sơ đó - đây là nguồn "cuối cùng" đã có thể bị SỬA TAY khác với mặc
 * định hợp đồng (nút "Sửa" ở Draft 112, dùng cho cả File UNC/lệnh
 * chuyển tiền thật). SỬA LỖI (rà soát phát hiện): trước đây hàm này
 * LUÔN lấy Tên người thụ hưởng/Ngân hàng/STK từ HD_NCC (mặc định hợp
 * đồng) - nếu hồ sơ có sửa tay người nhận/STK khác mặc định, UNC (tiền
 * chuyển thật) dùng đúng người đã sửa, nhưng ChiTietDNTT/MISA tự động
 * ghi (từ khi "Đóng Thanh Toán" tự ghi MISA luôn, không còn bước rà lại
 * bằng tay) lại ghi NHẦM theo mặc định hợp đồng - sổ sách kế toán lệch
 * với tiền đã chuyển thật. Thiếu layThongTinNhanTien hoặc hồ sơ không
 * tra được (gọi hàm cũ không truyền) vẫn dùng mặc định HD_NCC như cũ. */
function _xayChiTietDNTTRows_(ctRowsDaLoc, layLanTT, layThongTinNhanTien) {
  // Chỉ đọc đúng các phiếu cân cần ghép (trước đây đọc cả file Phiếu Cân).
  const soPhieu = new Set(ctRowsDaLoc.map(r => utils.standardize(String(r[11] || "").replace(/'/g, ""))).filter(Boolean));
  const pcMap = utils.buildIndexMap(_pcTheoSoPhieu_(soPhieu, "", ""), PC_COL.SO_CT, true);
  const hdMap = utils.buildIndexMap(_hdNccFullData_(), 2, true);
  const now = new Date();
  return ctRowsDaLoc.map(ctRow => {
    const idHeThong = String(ctRow[1] || "").trim();
    const soP = String(ctRow[11] || "").replace(/'/g, "");
    const soHD = String(ctRow[19] || "").replace(/'/g, "");
    const pc = pcMap.get(utils.standardize(soP)) || new Array(30).fill("");
    const hd = hdMap.get(utils.standardize(soHD)) || new Array(30).fill("");
    const tt112 = (layThongTinNhanTien && layThongTinNhanTien(idHeThong)) || null;
    const { tenThuHuong, nganHangThat, stkThat } = _resolveNguoiNhanTien_(tt112, hd);
    return [
      idHeThong, layLanTT(idHeThong) || "", _chu_(soP), _docNgaySo_(ctRow[20]), _docNgaySo_(pc[PC_COL.NGAY_CAN_1]),
      pc[PC_COL.DAI_LY], _chu_(soHD), pc[PC_COL.BIEN_SO_1], ctRow[3], _chu_(_chuanHoaCCCD_(hd[6])), tenThuHuong, _chu_(_chuanHoaCCCD_(hd[11])),
      hd[5], hd[18], pc[PC_COL.GIO_CAN_1], pc[PC_COL.GIO_CAN_2], utils.parseNum(pc[PC_COL.CAN_LAN_1]), utils.parseNum(pc[PC_COL.CAN_LAN_2]),
      utils.parseNum(pc[PC_COL.KL_KG]), utils.parseNum(pc[PC_COL.KL_KG]) / 1000, utils.parseNum(pc[PC_COL.DON_GIA_TC]),
      utils.parseNum(pc[PC_COL.THANH_TIEN]), pc[PC_COL.NGUON_GOC], nganHangThat, _chu_(stkThat), ctRow[2],
      "N", now
    ];
  });
}

/** Ghi các dòng N vào ChiTietDNTT lúc "In Báo Cáo ĐNTT" - nếu hồ sơ đã
 * có sẵn dòng N từ lần in trước (đang sửa lại rồi in lại), XÓA dòng N
 * CŨ trước khi ghi dòng MỚI (tránh trùng lặp/dữ liệu cũ còn sót). */
function _ghiChiTietDNTT_N_(idHeThongList, ctRowsDaLoc, layLanTT, layThongTinNhanTien) {
  try {
    const rows = _xayChiTietDNTTRows_(ctRowsDaLoc, layLanTT, layThongTinNhanTien);
    // v2026.6: xóa dòng N cũ + ghi dòng N mới trong cùng 1 khóa - tránh 2
    // người cùng In Báo Cáo ĐNTT ghi đè dòng của nhau.
    _chayTrongKhoa_(() => {
      const sh = _getChiTietDnttSheet_();
      const idSetToRemove = new Set(idHeThongList);
      // Chỉ đọc dòng của các hồ sơ đang in (trước đây đọc cả ChiTietDNTT).
      const rowsToDelete = _doanDongTheoKhoa_(sh, 0, 27, v => idSetToRemove.has(String(v || "").trim()))
        .filter(x => String(x.values[26] || "").trim() === "N").map(x => x.dong);
      _nhomDongLienTiep_(rowsToDelete).reverse().forEach(([a, b]) => sh.deleteRows(a, b - a + 1));
      if (rows.length) {
        const startRow = sh.getLastRow() + 1;
        _dinhDangCotNgaySo_(sh, CHITIET_DNTT_COT_NGAY, startRow, rows.length);
        sh.getRange(startRow, 1, rows.length, CHITIET_DNTT_HEADERS.length).setValues(_dongAnToan_(rows));
      }
    });
  } catch (e) {
    // Không chặn luồng chính "In Báo Cáo ĐNTT" nếu lỗi ghi ChiTietDNTT -
    // báo cáo Excel vẫn xuất bình thường, chỉ mất phần tăng tốc sau này.
    logAction_("LOI_GHI_CHITIET_DNTT", idHeThongList.join(","), "Lỗi khi ghi ChiTietDNTT lúc In Báo Cáo ĐNTT: " + e.toString());
  }
}

/** Lúc "Đóng Thanh Toán": chuyển các dòng N (đã có sẵn từ "In Báo Cáo
 * ĐNTT") thành Y cho các hồ sơ vừa chốt. Nếu hồ sơ NÀO chưa từng "In
 * Báo Cáo ĐNTT" (không có dòng N sẵn) - tính bù trực tiếp từ dữ liệu CT
 * vừa chốt (ctToCommit), ghi thẳng là Y. Trả về TOÀN BỘ dòng Y vừa xử
 * lý (28 cột) để dùng tự động tạo MISA ngay - không cần đọc lại. */
/**
 * MỚI (theo yêu cầu - "Chi Tiết Chuyển Khoản không có đầy đủ ngày -
 * hàm chạy đồng bộ từ đầu"): ChiTietDNTT chỉ được ghi TỪ KHI tính năng
 * này ra đời (lúc In Báo Cáo ĐNTT / Đóng Thanh Toán) - các hồ sơ ĐÃ
 * CHỐT TỪ TRƯỚC ĐÓ không có mặt, khiến "Báo Cáo Thanh Toán Chi Tiết"
 * thiếu dữ liệu lịch sử. Hàm này quét TOÀN BỘ CT thật, tìm các dòng
 * CHƯA có trong ChiTietDNTT (theo ID Hệ Thống + Số phiếu cân), tính bù
 * và ghi thẳng là Y - "Ngày ghi" lấy ĐÚNG "Ngày CK" lịch sử của từng
 * dòng (không phải ngày chạy hàm này) để lọc theo ngày vẫn đúng ý nghĩa.
 * Chạy 1 lần duy nhất khi mới triển khai tính năng - chạy lại sau đó
 * cũng an toàn (tự bỏ qua dòng đã có, không tạo trùng).
 */
/**
 * SỬA (theo yêu cầu - "bị timeout, cứ 100 bản ghi thì dừng và chạy
 * lại"): trước đây xử lý TOÀN BỘ CT thật thiếu trong 1 LƯỢT DUY NHẤT -
 * với hệ thống dùng lâu, dữ liệu lớn, dễ vượt quá giới hạn 6 phút/lượt
 * chạy của Apps Script. Giờ xử lý THEO LÔ (mặc định 300 dòng/lượt gọi -
 * dư an toàn so với 100, Apps Script thường xử lý được nhanh hơn nhiều
 * so với giới hạn 6 phút với khối lượng này) - trả về "conLai" (số dòng
 * còn thiếu SAU lượt này) để trình duyệt tự động gọi lại cho tới khi
 * hết, không cần bạn tự bấm nút nhiều lần.
 */
function dongBoChiTietDNTTTuDauLichSu_(gioiHanMoiLan) {
  let lock;
  try {
    lock = sysLock.acquire();
    const GIOI_HAN = Math.max(50, Math.min(1000, parseInt(gioiHanMoiLan, 10) || 300));

    const ss = getMainSs_();
    const shCT = ss.getSheetByName(CFG.DNTT_CT);
    const sh112 = ss.getSheetByName(CFG.DNTT_112);
    if (!shCT || shCT.getLastRow() < 2) return { success: false, message: "⚠️ Không có dữ liệu CT thật." };
    const ctAll = shCT.getRange(2, 1, shCT.getLastRow() - 1, 22).getValues();

    // "Lần TT" tra theo ID_CHA (= ID_KEY của 112 thật, cột A) - dùng cho
    // đúng cột "Lần TT" trong ChiTietDNTT (xem _xayChiTietDNTTRows_()).
    // SỬA (rà soát phát hiện): tra luôn người nhận/ngân hàng/STK THẬT
    // của dòng 112 (có thể đã sửa tay khác mặc định HD_NCC) cùng lượt
    // đọc này - tránh đồng bộ lịch sử ra sai người thụ hưởng cho các hồ
    // sơ cũ có sửa tay.
    const lanTTById = new Map();
    const nhanTienById = new Map();
    if (sh112 && sh112.getLastRow() > 1) {
      sh112.getRange(2, 1, sh112.getLastRow() - 1, 23).getValues().forEach(r => {
        const id = String(r[0] || "").trim();
        if (!id) return;
        lanTTById.set(id, String(r[18] || ""));
        nhanTienById.set(id, { nguoiNhan: r[3], nganHang: r[4], stk: r[5] });
      });
    }

    const sh = _getChiTietDnttSheet_();
    const daCoKeySet = new Set();
    const soDongHienTai = sh.getLastRow();
    if (soDongHienTai > 1) {
      sh.getRange(2, 1, soDongHienTai - 1, 3).getValues().forEach(r => {
        const idHeThong = String(r[0] || "").trim();
        const soP = String(r[2] || "").replace(/'/g, "").trim();
        if (idHeThong && soP) daCoKeySet.add(idHeThong + "|" + utils.standardize(soP));
      });
    }

    const ctThieuTatCa = ctAll.filter(r => {
      const idHeThong = String(r[1] || "").trim();
      const soP = String(r[11] || "").replace(/'/g, "").trim();
      if (!idHeThong || !soP) return false;
      return !daCoKeySet.has(idHeThong + "|" + utils.standardize(soP));
    });

    if (ctThieuTatCa.length === 0) {
      return { success: true, message: "✅ ChiTietDNTT đã đầy đủ - không có dòng CT thật nào cần đồng bộ thêm.", count: 0, conLai: 0, xong: true };
    }

    // CHỈ xử lý ĐÚNG 1 LÔ (GIỚI HẠN dòng) trong lượt gọi này - phần còn
    // lại (nếu có) trả về "conLai" để lượt gọi TIẾP THEO xử lý tiếp.
    const ctThieuLoNay = ctThieuTatCa.slice(0, GIOI_HAN);
    const conLaiSauLoNay = ctThieuTatCa.length - ctThieuLoNay.length;

    const rowsMoi = _xayChiTietDNTTRows_(ctThieuLoNay, id => lanTTById.get(id) || "", id => nhanTienById.get(id));
    rowsMoi.forEach((r, i) => {
      r[26] = "Y"; // Trạng thái = Y (đã chốt từ trước)
      const ngayCK = ctThieuLoNay[i][20];
      r[27] = (ngayCK instanceof Date) ? ngayCK : new Date(); // Ngày ghi = ĐÚNG Ngày CK lịch sử, không phải lúc chạy hàm
    });
    const startRow = sh.getLastRow() + 1;
    _dinhDangCotNgaySo_(sh, CHITIET_DNTT_COT_NGAY, startRow, rowsMoi.length);
    sh.getRange(startRow, 1, rowsMoi.length, CHITIET_DNTT_HEADERS.length).setValues(_dongAnToan_(rowsMoi));

    logAction_("DONG_BO_CHITIET_DNTT_LICH_SU", "-", `Đồng bộ lịch sử ChiTietDNTT: đã bổ sung ${rowsMoi.length} dòng từ CT thật (còn lại ${conLaiSauLoNay} dòng).`);
    const xong = conLaiSauLoNay === 0;
    return {
      success: true,
      message: xong
        ? `✅ HOÀN TẤT - đã đồng bộ đủ ${rowsMoi.length} dòng (lô cuối). Tổng ${ctAll.length} dòng CT thật.`
        : `✅ Đã đồng bộ ${rowsMoi.length} dòng (còn ${conLaiSauLoNay} dòng - tiếp tục lô sau)...`,
      count: rowsMoi.length,
      conLai: conLaiSauLoNay,
      xong: xong
    };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  } finally {
    if (lock) lock.releaseLock();
  }
}

function _chuyenChiTietDNTTSangYVaTinhBu_(validIds, ctToCommit, mapSoLan, mapNhanTien112) {
  const sh = _getChiTietDnttSheet_();
  const idSet = new Set(validIds);
  const idsFoundN = new Set();
  const rowsDaChuyenY = [];

  // SỬA LỖI NGHIÊM TRỌNG (rà soát phát hiện): dòng N ghi lúc "In Báo
  // Cáo ĐNTT" luôn có "Ngày CK" (cột D) RỖNG - tại thời điểm đó Draft CT
  // (row[20]) CHƯA được set (chỉ set ở runConfirmPayment_ ngay phía
  // trên). Nếu chỉ đổi N -> Y mà không bù lại "Ngày CK" thật, mọi hồ sơ
  // đi qua luồng chuẩn (In Báo Cáo ĐNTT rồi mới Đóng Thanh Toán) sẽ có
  // ChiTietDNTT/MISA bị TRỐNG NGÀY CHỨNG TỪ VĨNH VIỄN - biến mất khỏi
  // mọi báo cáo/lọc theo ngày. Tra lại "Ngày CK" thật từ ctToCommit
  // (đã có row[20] = dateForSheet) theo khóa ID Hệ Thống + Số phiếu cân.
  const ngayCkByKey = new Map();
  ctToCommit.forEach(row => {
    const id = String(row[1] || "").trim();
    const soP = String(row[11] || "").replace(/'/g, "").trim();
    if (id && soP) ngayCkByKey.set(id + "|" + utils.standardize(soP), row[20]);
  });

  // v2026.6: chỉ ghi đúng ô "Ngày CK" (D) và "Trạng thái/Ngày ghi" (AA:AB)
  // của đúng các dòng chuyển N -> Y, không ghi đè cả sheet. Hồ sơ đã có
  // sẵn dòng Y (lần chốt trước bị ngắt giữa chừng) được coi là đã xử lý:
  // KHÔNG tính bù thêm lần nữa, chỉ trả lại để bước MISA tự loại trùng.
  const idsDaCoY = new Set();
  {
    // Chỉ đọc dòng của các hồ sơ đang Duyệt (trước đây đọc cả ChiTietDNTT).
    const data = _doanDongTheoKhoa_(sh, 0, CHITIET_DNTT_HEADERS.length, v => idSet.has(String(v || "").trim()));
    const now = new Date();
    const dongChuyenY = [], capNhatNgayCk = [];
    data.forEach(({ dong, values: r }) => {
      const id = String(r[0] || "").trim();
      const tt = String(r[26] || "").trim();
      if (tt === "Y") {
        idsDaCoY.add(id);
        rowsDaChuyenY.push(r);
        return;
      }
      if (tt !== "N") return;
      const soP = String(r[2] || "").replace(/'/g, "").trim();
      const ngayCK = ngayCkByKey.get(id + "|" + utils.standardize(soP));
      if (ngayCK) {
        r[3] = _docNgaySo_(ngayCK);
        capNhatNgayCk.push({ row: dong, values: [r[3]] });
      }
      r[26] = "Y"; r[27] = now;
      dongChuyenY.push(dong);
      idsFoundN.add(id);
      rowsDaChuyenY.push(r);
    });
    _ghiTheoDong_(sh, capNhatNgayCk, 4);
    _ghiCungGiaTri_(sh, dongChuyenY, 27, 27, "Y");
    _ghiCungGiaTri_(sh, dongChuyenY, 28, 28, now);
  }

  // Tính bù cho các hồ sơ CHƯA từng "In Báo Cáo ĐNTT" (không có dòng N sẵn)
  const idsThieu = validIds.filter(id => !idsFoundN.has(id) && !idsDaCoY.has(id));
  if (idsThieu.length) {
    const idsThieuSet = new Set(idsThieu);
    const ctCanBu = ctToCommit.filter(r => idsThieuSet.has(String(r[1] || "").trim()));
    if (ctCanBu.length) {
      // SỬA LỖI (rà soát phát hiện): dùng ĐÚNG người nhận/ngân hàng/STK
      // của dòng 112 vừa chốt (có thể đã sửa tay khác mặc định HD_NCC,
      // giống hệt dữ liệu dùng cho UNC) thay vì để _xayChiTietDNTTRows_
      // tự rơi về mặc định hợp đồng.
      const rowsMoi = _xayChiTietDNTTRows_(ctCanBu, id => mapSoLan.get(id) || "", id => mapNhanTien112 && mapNhanTien112.get(id));
      const now = new Date();
      rowsMoi.forEach(r => { r[26] = "Y"; r[27] = now; });
      const startRow = sh.getLastRow() + 1;
      _dinhDangCotNgaySo_(sh, CHITIET_DNTT_COT_NGAY, startRow, rowsMoi.length);
      sh.getRange(startRow, 1, rowsMoi.length, CHITIET_DNTT_HEADERS.length).setValues(_dongAnToan_(rowsMoi));
      rowsDaChuyenY.push(...rowsMoi);
    }
  }

  return rowsDaChuyenY;
}

/** Tự động ghi MISA (Update_NganHang_DN) NGAY lúc "Đóng Thanh Toán" -
 * SỬA (theo yêu cầu): CHỈ GHI THÊM (append) vào cuối, KHÔNG còn xóa/ghi
 * lại TOÀN BỘ sheet mỗi lần như trước - Đóng Thanh Toán vì vậy nhanh và
 * ổn định hơn (không phụ thuộc kích thước lịch sử Update_NganHang_DN). */
/**
 * MỚI (theo yêu cầu - "3 bảng con phải thay đổi theo bảng mẹ"):
 * ChiTietDNTT, ChiTietUNC, Update_NganHang_DN đều là BẢNG CON của
 * DNTT_GK_DN_CT - khi "Mở Đóng Thanh Toán" (bảng mẹ bị xóa khỏi bản
 * chính), cả 3 bảng con liên quan tới hồ sơ đó PHẢI được dọn theo,
 * tránh để sót dữ liệu "mồ côi" (trông như vẫn đang chốt dù thực tế đã
 * mở lại). XÓA (không phải chỉ đánh dấu) để đảm bảo báo cáo/lịch sử
 * luôn khớp đúng thực tế.
 * ⚠️ Update_NganHang_DN là file NỘP NGÂN HÀNG THẬT - nếu tiền đã thực
 * sự chuyển đi trước khi mở lại, việc xóa dòng này KHÔNG hoàn tác được
 * giao dịch ngân hàng, chỉ xóa bản ghi trong hệ thống - cần tự kiểm tra
 * lại thực tế ngân hàng nếu nghi ngờ.
 */
function _donDep3BangConKhiMoDong_(idCha, soPhieuCanLienQuan, maThaoTac) {
  const ss = getMainSs_();
  let chiTietDnttXoa = 0, chiTietUncXoa = 0, misaXoa = 0;

  // v2026.6: mọi dòng bị xóa đều được sao lưu nguyên dòng trước (xem
  // _saoLuuVaXoaDong_) và xóa theo khối dòng liền kề.
  // 1. ChiTietDNTT - xóa mọi dòng khớp ID Hệ Thống (idCha) - dù đang Y hay N
  try {
    const sh = ss.getSheetByName(CHITIET_DNTT_SHEET);
    if (sh) chiTietDnttXoa = _saoLuuVaXoaDong_(sh, r => String(r[0] || "").trim() === idCha, "MO_DONG_THANH_TOAN", maThaoTac);
  } catch (e) { /* không chặn luồng chính Mở Đóng Thanh Toán nếu dọn ChiTietDNTT lỗi */ }

  // 2. ChiTietUNC - xóa mọi dòng khớp ID Hệ Thống (idCha)
  try {
    const sh = ss.getSheetByName(CHITIET_UNC_SHEET);
    if (sh) chiTietUncXoa = _saoLuuVaXoaDong_(sh, r => String(r[0] || "").trim() === idCha, "MO_DONG_THANH_TOAN", maThaoTac);
  } catch (e) { /* không chặn luồng chính nếu dọn ChiTietUNC lỗi */ }

  // 3. Update_NganHang_DN - xóa dòng khớp Số phiếu cân (cột E/5) - sheet
  // này không lưu ID Hệ Thống trực tiếp, chỉ tra được qua Số phiếu cân.
  try {
    const ssNH = SpreadsheetApp.openById(CFG.UPDATE_NH_SS_ID);
    const shUpdateNH = ssNH.getSheetByName("Update_NganHang_DN");
    if (shUpdateNH && soPhieuCanLienQuan.length) {
      const soPKeySet = new Set(soPhieuCanLienQuan.map(sp => utils.standardize(sp)));
      misaXoa = _saoLuuVaXoaDong_(shUpdateNH, r => {
        const sp = String(r[4] || "").replace(/^'/, "").trim();
        return !!sp && soPKeySet.has(utils.standardize(sp));
      }, "MO_DONG_THANH_TOAN", maThaoTac);
    }
  } catch (e) {
    logAction_("LOI_DON_DEP_MISA_KHI_MO_DONG", idCha, "Lỗi khi dọn Update_NganHang_DN lúc Mở Đóng Thanh Toán: " + e.toString());
  }

  return { chiTietDnttXoa, chiTietUncXoa, misaXoa };
}

/** MỚI (theo yêu cầu - loại trùng cho MISA): đọc TOÀN BỘ "Số phiếu cân"
 * đã có sẵn trong Update_NganHang_DN (cột E) - dùng để lọc bỏ trùng
 * trước khi ghi thêm (cả đường tự động lẫn nút "Xuất MISA" thủ công). */
function _laySoPhieuCanDaCoTrongMisa_(shUpdateNH) {
  const soPDaCo = new Set();
  const lastRow = shUpdateNH.getLastRow();
  if (lastRow > 1) {
    shUpdateNH.getRange(2, 5, lastRow - 1, 1).getValues().forEach(r => {
      const sp = String(r[0] || "").replace(/^'/, "").trim();
      if (sp) soPDaCo.add(utils.standardize(sp));
    });
  }
  return soPDaCo;
}

/**
 * MỚI (theo yêu cầu - "đưa vào Hệ Thống, dùng batch 150 hồ sơ/lượt"):
 * bản DỰ PHÒNG của "Xuất MISA" - dùng cho khoảng NGÀY (không cần chọn
 * tay từng hồ sơ) - xử lý THEO LÔ (offset), trình duyệt tự gọi lại tới
 * khi xong, tránh timeout với khoảng ngày rộng/nhiều hồ sơ. Dùng lại
 * ĐÚNG logic _gomChiTietChuyenKhoan_() + loại trùng đã có.
 */
/** Ghi vào Update_NganHang_DN các dòng (từ _gomChiTietChuyenKhoan_) có Số
 * phiếu cân CHƯA có trong file - kiểm tra trùng + ghi trong cùng 1 khóa (v2026.6:
 * 2 lượt chạy song song không thể cùng thấy "chưa có" rồi cùng ghi trùng).
 * Dùng chung cho Tạo lại MISA (Hệ Thống) và Tạo bổ sung (Báo Cáo MISA). */
function _ghiMisaChuaCo_(shUpdateNH, tempRows) {
  return _chayTrongKhoa_(() => {
    const soPDaCo = _laySoPhieuCanDaCoTrongMisa_(shUpdateNH);
    const chuaCo = tempRows.filter(item => !soPDaCo.has(utils.standardize(item.bank.soPhieuCan)));
    if (chuaCo.length > 0) {
      const bankInfo = getCompanyBankInfo_();
      const bankUpdateRows = chuaCo.map(item => {
        const b = item.bank;
        const row = new Array(33).fill("");
        row[0] = ""; row[1] = 0;
        row[2] = b.ngayCK; row[3] = b.ngayCK;
        row[4] = _chu_(b.soPhieuCan);
        row[5] = _chu_(bankInfo.account); row[6] = bankInfo.name; row[7] = bankInfo.code;
        row[8] = b.noiDung || ("Thanh toán phiếu cân " + b.soPhieuCan);
        // SỬA LỖI (rà soát phát hiện): STK/Ngân hàng/Tên thụ hưởng (cột
        // 12/13/14) trước đây LUÔN lấy mặc định hợp đồng (b.hd[15/16/10])
        // - dùng b.stk/b.nganHang/b.tenThuHuong (đã ưu tiên giá trị SỬA
        // TAY nếu có - xem _gomChiTietChuyenKhoan_()) để khớp đúng với
        // tiền đã chuyển thật (UNC).
        row[9] = _chu_(_chuanHoaCCCD_(b.hd[6])); row[10] = b.hd[4]; row[11] = b.hd[5];
        row[12] = _chu_(b.stk || ""); row[13] = b.nganHang; row[14] = b.tenThuHuong;
        row[15] = _chu_(_chuanHoaCCCD_(b.hd[11])); row[19] = "VND"; row[21] = b.noiDung;
        row[22] = "33111"; row[23] = "1121"; row[24] = b.thanhTien; row[32] = _chu_(b.soHD);
        return row;
      });
      const startRow = Math.max(2, shUpdateNH.getLastRow() + 1);
      shUpdateNH.getRange(startRow, 1, bankUpdateRows.length, 33).setValues(_dongAnToan_(bankUpdateRows));
      _lockTextCols_(shUpdateNH, MISA_COT_CHU.map(i => i + 1), startRow + bankUpdateRows.length + 5);
    }
    return chuaCo;
  });
}
function webTaoLaiMisaTheoNgay_(fDate, tDate, offset, gioiHanMoiLan) {
  try {
    const GIOI_HAN = Math.max(20, Math.min(300, parseInt(gioiHanMoiLan, 10) || 150));
    offset = parseInt(offset, 10) || 0;
    // SỬA LỖI (người dùng báo 28/09/2026 - "tạo MISA chạy ngày không đúng"): trước
    // đây chọn hồ sơ theo Ngày ĐN (get112ViewData_(fDate, tDate)) trong khi Báo Cáo
    // MISA / Tạo bổ sung / Dọn dẹp và chính dòng MISA dùng Ngày CK -> chọn đúng
    // ngày thanh toán thì báo "không có hồ sơ", chọn ngày lập ĐN thì ra dòng MISA
    // mang ngày khác. Giờ chọn theo Ngày CK như mọi chức năng MISA khác.
    const dsHoSo = _hoSoDaChotTheoMa_(new Set(_ctTheoNgayCK_(fDate, tDate).map(ct => String(ct[1]).trim())));
    if (!dsHoSo.length) return { success: true, message: "⚠️ Không có hồ sơ nào thanh toán (Ngày CK) trong khoảng ngày đã chọn.", count: 0, conLai: 0, xong: true };
    const loNay = dsHoSo.slice(offset, offset + GIOI_HAN);
    if (loNay.length === 0) return { success: true, message: `✅ HOÀN TẤT - đã xử lý toàn bộ ${dsHoSo.length} hồ sơ.`, count: 0, conLai: 0, xong: true };

    const tempRows = _gomChiTietChuyenKhoan_(loNay);
    const ssNH = SpreadsheetApp.openById(CFG.UPDATE_NH_SS_ID);
    const shUpdateNH = ssNH.getSheetByName("Update_NganHang_DN");
    if (!shUpdateNH) return { success: false, message: "❌ Không tìm thấy sheet Update_NganHang_DN." };

    const tempRowsChuaCo = _ghiMisaChuaCo_(shUpdateNH, tempRows);

    const offsetMoi = offset + loNay.length;
    const conLai = Math.max(0, dsHoSo.length - offsetMoi);
    const xong = conLai === 0;
    const soTrung = tempRows.length - tempRowsChuaCo.length;
    logAction_("TAO_LAI_MISA_THEO_NGAY", "-", `Tạo lại MISA theo ngày (${fDate} - ${tDate}): lô offset ${offset}, ghi ${tempRowsChuaCo.length} dòng, bỏ qua ${soTrung} dòng trùng.`);
    return {
      success: true,
      message: xong
        ? `✅ HOÀN TẤT - đã xử lý ${dsHoSo.length} hồ sơ.`
        : `Đang xử lý... đã xong ${offsetMoi}/${dsHoSo.length} hồ sơ (ghi ${tempRowsChuaCo.length}, bỏ qua ${soTrung} trùng)...`,
      count: tempRowsChuaCo.length, offsetMoi, conLai, xong
    };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  }
}

/**
 * MỚI (theo yêu cầu - cùng lý do trên): bản DỰ PHÒNG của "Tạo File UNC"
 * cho khoảng NGÀY - xử lý THEO LÔ. Mỗi lô tạo 1 file Excel UNC riêng
 * (không gộp lại thành 1 file duy nhất) - với khoảng ngày rộng, có thể
 * ra NHIỀU file, mỗi file ứng với 1 lô tối đa 150 hồ sơ.
 */
function webTaoLaiUNCTheoNgay_(fDate, tDate, ngayHieuLuc, offset, gioiHanMoiLan, tkTrichNoOverride, tkThuPhiOverride) {
  try {
    const GIOI_HAN = Math.max(20, Math.min(300, parseInt(gioiHanMoiLan, 10) || 150));
    offset = parseInt(offset, 10) || 0;
    const dsHoSo = get112ViewData_(fDate, tDate);
    if (!dsHoSo.length) return { success: true, message: "⚠️ Không có hồ sơ nào đã chốt trong khoảng ngày đã chọn.", count: 0, conLai: 0, xong: true };
    const loNay = dsHoSo.slice(offset, offset + GIOI_HAN);
    if (loNay.length === 0) return { success: true, message: `✅ HOÀN TẤT - đã xử lý toàn bộ ${dsHoSo.length} hồ sơ.`, count: 0, conLai: 0, xong: true };

    const toDate = String(ngayHieuLuc || "").trim() || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
    const ketQua = runCreateUNCOnly_(loNay, toDate, tkTrichNoOverride, tkThuPhiOverride);
    if (!ketQua.success) return ketQua;

    const offsetMoi = offset + loNay.length;
    const conLai = Math.max(0, dsHoSo.length - offsetMoi);
    const xong = conLai === 0;
    return {
      success: true,
      message: (xong ? `✅ HOÀN TẤT - đã tạo UNC cho ${dsHoSo.length} hồ sơ (nhiều file, mỗi lô 1 file).` : `Đang xử lý... đã xong ${offsetMoi}/${dsHoSo.length} hồ sơ (lô này: ${ketQua.count} dòng)...`) +
        (ketQua.canhBaoTrung ? ` ${ketQua.canhBaoTrung}` : ''),
      count: ketQua.count, offsetMoi, conLai, xong, url: ketQua.url
    };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  }
}

function _tuDongXuatMisaKhiDong_(rowsChiTietY) {
  try {
    if (!rowsChiTietY || !rowsChiTietY.length) return;
    const ssNH = SpreadsheetApp.openById(CFG.UPDATE_NH_SS_ID);
    const shUpdateNH = ssNH.getSheetByName("Update_NganHang_DN");
    if (!shUpdateNH) return;
    const bankInfo = getCompanyBankInfo_();

    // MỚI (theo yêu cầu - "có chức năng loại trùng không"): file này
    // GHI THÊM (append), nên phải TỰ kiểm tra trùng theo "Số phiếu cân"
    // đã có sẵn trong file - tránh ghi 2 lần cùng 1 phiếu cân (rủi ro
    // NỘP NGÂN HÀNG TRÙNG LẶP nếu ai đó import cả file không để ý).
    const soPDaCo = _laySoPhieuCanDaCoTrongMisa_(shUpdateNH);
    const rowsChuaCo = rowsChiTietY.filter(r => !soPDaCo.has(utils.standardize(String(r[2] || "").replace(/^'/, ""))));
    if (!rowsChuaCo.length) return; // tất cả đã có sẵn - không ghi thêm gì

    const bankRows = rowsChuaCo.map(r => {
      // Vị trí theo _xayChiTietDNTTRows_(): [0]idHeThong [1]lanTT [2]soPhieuCan
      // [3]ngayCK [8]hoTenChuRung [9]cccdChuRung [10]tenThuHuong [11]cccdThuHuong
      // [12]diaChi [23]nganHang [24]soTK [21]thanhTien [6]soHD
      const soPClean = String(r[2] || "").replace(/^'/, "");
      const soHDClean = String(r[6] || "").replace(/^'/, "");
      const noiDung = `Thanh toán phiếu cân ${soPClean}`;
      const row = new Array(33).fill("");
      row[0] = ""; row[1] = 0;
      row[2] = _ngayXuat_(r[3]); row[3] = row[2]; // Ngày hạch toán, Ngày chứng từ = Ngày CK - file MISA theo Vùng xuất
      row[4] = _chu_(soPClean);
      row[5] = _chu_(bankInfo.account); row[6] = bankInfo.name; row[7] = bankInfo.code;
      row[8] = noiDung;
      row[9] = r[9]; row[10] = r[8]; row[11] = r[12]; // CCCD chủ rừng, Họ tên chủ rừng (nguồn CT - đã đối soát), Địa chỉ
      row[12] = r[24]; row[13] = r[23]; row[14] = r[10]; // STK, Ngân hàng, Tên người thụ hưởng
      row[15] = r[11]; // CCCD người thụ hưởng
      row[19] = "VND"; row[21] = noiDung;
      row[22] = "33111"; row[23] = "1121"; row[24] = utils.parseNum(r[21]); row[32] = _chu_(soHDClean);
      return row;
    });

    const startRow = Math.max(2, shUpdateNH.getLastRow() + 1);
    shUpdateNH.getRange(startRow, 1, bankRows.length, 33).setValues(_dongAnToan_(bankRows));
    _lockTextCols_(shUpdateNH, MISA_COT_CHU.map(i => i + 1), startRow + bankRows.length + 5);
    if (rowsChiTietY.length > rowsChuaCo.length) {
      logAction_("MISA_BO_QUA_TRUNG", "-", `Tự động ghi MISA: bỏ qua ${rowsChiTietY.length - rowsChuaCo.length} dòng đã có sẵn Số phiếu cân trùng trong Update_NganHang_DN.`);
    }
  } catch (e) {
    // Không chặn luồng chính "Đóng Thanh Toán" nếu lỗi tự động ghi MISA -
    // ghi log để biết và có thể xử lý tay (Xuất MISA thủ công vẫn dùng được).
    logAction_("LOI_TU_DONG_MISA", "-", "Lỗi khi tự động ghi MISA lúc Đóng Thanh Toán: " + e.toString());
  }
}

/** Dòng sổ đã chốt (CT, kể cả năm đã khóa sổ) của các hồ sơ `filteredRows`
 * (từ get112ViewData_) - dùng chung cho Tạo lại MISA / báo cáo và kiểm tra
 * "hồ sơ đã chốt chưa có dòng MISA". */
function _ctDongCuaHoSo_(filteredRows) {
  const idSet = new Set(filteredRows.map(r => r.idHeThong));
  const ngayTT = filteredRows.map(r => r.ngayISO).filter(Boolean).sort();
  const tuNgay = ngayTT[0], denNgay = ngayTT[ngayTT.length - 1];
  const khop = v => !utils.isBlank(v) && idSet.has(String(v).trim());
  // Sổ đang mở: chỉ đọc dòng của các hồ sơ đã chọn (trước đây đọc cả sổ CT mỗi lần xuất).
  const luuTru = tuNgay ? _docLuuTruTrongKhoang_(CFG.DNTT_CT, 22, tuNgay, denNgay) : [];
  return luuTru.concat(_docDongTheoKhoa_(_shCtThat_(), 1, 22, khop))
    .filter(ctRow => !utils.isBlank(ctRow[0]) && khop(ctRow[1]));
}

function _gomChiTietChuyenKhoan_(filteredRows, ctDaDoc) {
  const hoSoTheoId = new Map(filteredRows.map(f => [f.idHeThong, f]));
  // SỬA (tối ưu tốc độ - theo yêu cầu "Xuất Báo Cáo Gỗ Keo chạy rất
  // chậm"): trước đây đọc TRỰC TIẾP KHÔNG CACHE toàn bộ CT thật mỗi lần
  // xuất - đây là nguyên nhân chính gây chậm khi CT thật đã tích lũy
  // nhiều (sheet lớn dần theo thời gian sử dụng). Giờ dùng
  // _ctThatDataCache_() (cache dùng chung 90 giây, ĐÃ được xóa NGAY sau
  // khi Đóng/Mở Thanh Toán - xem _invalidateCtSrc112Cache_()) - AN TOÀN
  // vì lúc xuất báo cáo, hồ sơ đã ở trạng thái "đã chốt" từ TRƯỚC đó
  // (không phải vừa chốt trong CÙNG lượt xuất), nên dữ liệu luôn đúng.
  // Hồ sơ thuộc năm đã khóa sổ (xuất lại báo cáo cũ): đọc thêm sổ lưu trữ
  // của đúng các năm đó; hồ sơ năm đang mở thì chỉ đọc sổ đang mở như cũ.
  const ngayTT = filteredRows.map(r => r.ngayISO).filter(Boolean).sort();
  const tuNgay = ngayTT[0], denNgay = ngayTT[ngayTT.length - 1];
  // ctDaDoc: dòng sổ CT đã đọc sẵn (Bảng Kê dùng lại, không đọc sổ lần 2).
  const ctData = ctDaDoc ? ctDaDoc.filter(r => hoSoTheoId.has(String(r[1]).trim())) : _ctDongCuaHoSo_(filteredRows);

  // SỬA (tối ưu tốc độ): dùng cache chung _pcData_()/_hdNccFullData_()
  // thay vì đọc trực tiếp không cache mỗi lần.
  // Chỉ đọc phiếu cân của các dòng CT trên (trước đây đọc cả file Phiếu Cân).
  const pcDataNoHeader = _pcTheoSoPhieu_(new Set(ctData.map(r => utils.standardize(r[11])).filter(Boolean)), tuNgay, denNgay);
  const hdDataNoHeader = _hdNccFullData_();
  const mapPC = utils.buildIndexMap(pcDataNoHeader, PC_COL.SO_CT, true);
  const mapHD = utils.buildIndexMap(hdDataNoHeader, 2, true);

  let tempRows = [];
  ctData.forEach(ctRow => {
    let parentId = String(ctRow[1]).trim();
    let pc = mapPC.get(utils.standardize(ctRow[11])) || new Array(30).fill("");
    let hd = mapHD.get(utils.standardize(ctRow[19])) || new Array(30).fill("");
    let parentInfo = hoSoTheoId.get(parentId); // tra thẳng theo mã, không dò lại cả danh sách cho từng phiếu
    // SỬA LỖI (rà soát phát hiện): trước đây "Tên người thụ hưởng"/
    // "Ngân hàng"/"Số tài khoản" LUÔN lấy mặc định hợp đồng (hd[10]/
    // hd[16]/hd[15]) - nếu hồ sơ có sửa tay người nhận/STK/ngân hàng
    // khác mặc định (nút "Sửa" ở Draft 112), UNC (tiền chuyển thật)
    // dùng đúng giá trị đã sửa (parentInfo, lấy từ get112ViewData_()),
    // nhưng báo cáo/MISA ở đây lại ghi theo mặc định hợp đồng - lệch
    // với tiền đã chuyển thật. Ưu tiên parentInfo (đã có thể sửa tay),
    // chỉ rơi về mặc định HD_NCC khi không có parentInfo.
    const { tenThuHuong, nganHangThat, stkThat } = _resolveNguoiNhanTien_(parentInfo, hd);

    tempRows.push({
      idHoSo: parentId,
      data: [
        0, parentInfo?.soLan, _chu_(ctRow[11]), _formatNgayXuat_(ctRow[20]), _formatNgayXuat_(pc[PC_COL.NGAY_CAN_1]),
        pc[PC_COL.DAI_LY], _chu_(ctRow[19]), pc[PC_COL.BIEN_SO_1], ctRow[3], _chu_(_chuanHoaCCCD_(hd[6])), tenThuHuong, _chu_(_chuanHoaCCCD_(hd[11])),
        hd[5], hd[18], pc[PC_COL.GIO_CAN_1], pc[PC_COL.GIO_CAN_2], utils.parseNum(pc[PC_COL.CAN_LAN_1]), utils.parseNum(pc[PC_COL.CAN_LAN_2]),
        utils.parseNum(pc[PC_COL.KL_KG]), utils.parseNum(pc[PC_COL.KL_KG])/1000, utils.parseNum(pc[PC_COL.DON_GIA_TC]),
        utils.parseNum(pc[PC_COL.THANH_TIEN]), pc[PC_COL.NGUON_GOC], nganHangThat, _chu_(stkThat), ctRow[2]
      ],
      bank: { ngayCK: _formatNgayXuat_(ctRow[20]), soPhieuCan: ctRow[11], noiDung: parentInfo?.noiDungCK, thanhTien: ctRow[16], soHD: ctRow[19], hd: hd, tenThuHuong: tenThuHuong, nganHang: nganHangThat, stk: stkThat }
    });
  });
  return tempRows;
}

/** Dòng ChiTietDNTT đã chốt (Y) của các hồ sơ `filteredRows` - sổ đang mở chỉ đọc dòng
 * của các hồ sơ này; năm đã khóa sổ đọc file DATA<năm> như _ctDongCuaHoSo_. */
function _chiTietDnttCuaHoSo_(filteredRows) {
  const idSet = new Set(filteredRows.map(r => r.idHeThong));
  const ngayTT = filteredRows.map(r => r.ngayISO).filter(Boolean).sort();
  const khop = v => idSet.has(String(v || "").trim());
  const luuTru = ngayTT.length ? _docLuuTruTrongKhoang_(CHITIET_DNTT_SHEET, CHITIET_DNTT_HEADERS.length, ngayTT[0], ngayTT[ngayTT.length - 1]) : [];
  return luuTru.concat(_docDongTheoKhoa_(getMainSs_().getSheetByName(CHITIET_DNTT_SHEET), 0, CHITIET_DNTT_HEADERS.length, khop))
    .filter(r => khop(r[0]) && String(r[26] || "").trim() === "Y");
}
/** Dòng Bảng Kê Chi Tiết CK (26 cột, cột 0 = STT điền sau) của các hồ sơ đã chọn, theo
 * thứ tự hồ sơ trên màn hình, trong 1 hồ sơ theo thứ tự sổ CT. Lấy thẳng ChiTietDNTT (đã
 * ghép sẵn lúc Đóng TT, cùng bố cục cột); hồ sơ nào ChiTietDNTT thiếu phiếu so với sổ CT
 * (chốt trước khi có ChiTietDNTT, chưa đồng bộ) thì ghép lại từ CT + Phiếu Cân + HĐ. */
function _dongBangKeChiTiet_(filteredRows) {
  const ctData = _ctDongCuaHoSo_(filteredRows);
  const phieuCT = new Map(); // mã hồ sơ -> [số phiếu] theo thứ tự sổ CT
  ctData.forEach(ct => {
    const id = String(ct[1]).trim();
    if (!phieuCT.has(id)) phieuCT.set(id, []);
    phieuCT.get(id).push(utils.standardize(ct[11]));
  });
  const daGhep = new Map(); // mã hồ sơ -> (số phiếu -> dòng ChiTietDNTT), dòng sau thay dòng trước
  _chiTietDnttCuaHoSo_(filteredRows).forEach(r => {
    const id = String(r[0]).trim();
    if (!daGhep.has(id)) daGhep.set(id, new Map());
    daGhep.get(id).set(utils.standardize(r[2]), r);
  });
  const du = id => phieuCT.has(id) && daGhep.has(id) && phieuCT.get(id).every(p => daGhep.get(id).has(p));
  const canGhep = filteredRows.filter(f => !du(f.idHeThong));
  const ghepLai = new Map();
  (canGhep.length ? _gomChiTietChuyenKhoan_(canGhep, ctData) : []).forEach(x => {
    if (!ghepLai.has(x.idHoSo)) ghepLai.set(x.idHoSo, []);
    ghepLai.get(x.idHoSo).push(x.data);
  });
  const tuChiTiet = (r, hoSo) => [
    0, hoSo.soLan || r[1], _chu_(r[2]), _ngayXuat_(r[3]), _ngayXuat_(r[4]), r[5], _chu_(r[6]), r[7], r[8], _chu_(r[9]), r[10], _chu_(r[11]),
    r[12], r[13], r[14], r[15], utils.parseNum(r[16]), utils.parseNum(r[17]), utils.parseNum(r[18]), utils.parseNum(r[19]), utils.parseNum(r[20]),
    utils.parseNum(r[21]), r[22], r[23], _chu_(r[24]), r[25]
  ];
  const kq = [];
  filteredRows.forEach(f => {
    if (du(f.idHeThong)) phieuCT.get(f.idHeThong).forEach(p => kq.push(tuChiTiet(daGhep.get(f.idHeThong).get(p), f)));
    else (ghepLai.get(f.idHeThong) || []).forEach(d => kq.push(d));
  });
  return kq;
}

/** MỚI (theo yêu cầu - tách riêng khỏi Xuất Báo Cáo): CHỈ ghi vào
 * "Update_NganHang_DN" (file kết xuất MISA/ngân hàng) - dùng cho tab
 * "Báo Cáo Kết Xuất MISA" riêng biệt, KHÔNG còn kèm theo mỗi lần Xuất
 * Báo Cáo Thanh Toán Gỗ Keo nữa. */
function renderSheet2Detail_(sheet, filteredRows, dateRange) {
  const tempRows = _dongBangKeChiTiet_(filteredRows);

  sheet.clear();
  // SỬA (theo yêu cầu - file xuất ra cũng phải khóa): Số phiếu cân(3),
  // Số hợp đồng(7), CCCD Chủ rừng(10), CCCD Người thụ hưởng(12), Số tài
  // khoản(25) - khóa TEXT thuần, chắc chắn không bị Sheets tự chuyển
  // thành số (mất số 0 đầu) dù dấu ' có được ghi kèm hay không.
  _lockTextCols_(sheet, [3, 4, 5, 7, 10, 12, 25], tempRows.length + 5); // đúng số dòng phiếu cân của bảng (trước đây số hồ sơ)
  sheet.getRange("A1:Z1").merge().setValue("BẢNG KÊ CHI TIẾT CHUYỂN KHOẢN").setFontSize(16).setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange("A2:Z2").merge().setValue("Thời gian: " + dateRange).setFontStyle("italic").setHorizontalAlignment("center");

  const headers = ["STT", "Lần TT", "Số phiếu cân", "Ngày CK", "Ngày nhập", "Đại lý", "Số hợp đồng", "Số xe", "Họ tên chủ rừng", "CCCD Chủ rừng", "Tên người thụ hưởng", "CCCD Người thụ hưởng", "Địa chỉ Chủ rừng", "Địa chỉ rừng", "Giờ vào", "Giờ ra", "KL hàng + xe", "Bì", "KL_KG", "KL_Tấn", "Đơn giá", "Thành tiền", "Nguồn gốc", "Ngân hàng", "Số tài khoản", "Thời gian nhập liệu"];
  sheet.getRange(4, 1, 1, headers.length).setValues([headers]).setBackground("#cfe2f3").setFontWeight("bold").setBorder(true, true, true, true, true, true).setHorizontalAlignment("center");

  if (tempRows.length > 0) {
    const finalRows = tempRows.map((dong, index) => { dong[0] = index + 1; return dong; });
    const lastR = 5 + finalRows.length - 1;
    sheet.getRange(5, 1, finalRows.length, headers.length).setValues(_dongAnToan_(finalRows)).setBorder(true, true, true, true, true, true).setVerticalAlignment("middle");
    _canhLeTheoKieu_(sheet, 5, finalRows);

    sheet.getRange(5, 15, finalRows.length, 2).setNumberFormat("HH:mm");
    sheet.getRange(5, 17, finalRows.length, 3).setNumberFormat("#,##0");
    sheet.getRange(5, 20, finalRows.length, 1).setNumberFormat("#,##0.000");
    sheet.getRange(5, 21, finalRows.length, 2).setNumberFormat("#,##0");

    const totalRow = lastR + 1;
    sheet.getRange(totalRow, 1, 1, 16).merge().setValue("TỔNG CỘNG").setFontWeight("bold").setHorizontalAlignment("right");
    sheet.getRange(totalRow, 17, 1, 3).setFormulaR1C1(`=SUM(R5C:R[-1]C)`);
    sheet.getRange(totalRow, 20).setFormulaR1C1(`=SUM(R5C:R[-1]C)`);
    sheet.getRange(totalRow, 22).setFormulaR1C1(`=SUM(R5C:R[-1]C)`);
    sheet.getRange(totalRow, 1, 1, headers.length).setBackground("#fff2cc").setBorder(true, true, true, true, true, true);
  }
  // SỬA (theo yêu cầu - tách riêng "Báo Cáo Kết Xuất MISA" thành tab
  // riêng): KHÔNG còn tự động ghi vào "Update_NganHang_DN" ở đây nữa -
  // xem hàm webTaoLaiMisaTheoNgay_() riêng, gọi từ Hệ Thống.
}

/**
 * MỚI (theo yêu cầu): tương tự renderSheet2Detail_() nhưng đọc CT từ
 * DRAFT (chưa chốt) thay vì CT thật - dùng cho "In Báo Cáo ĐNTT" ở
 * trạng thái "Đang ĐNTT" (chưa Duyệt/Đóng Thanh Toán). KHÔNG ghi vào
 * "Update_NganHang_DN" (file đó chỉ dành cho hồ sơ đã CHỐT THẬT, tránh
 * lẫn dữ liệu chưa được duyệt vào file thanh toán ngân hàng thật).
 */
function renderSheet2DetailFromDraft_(sheet, filteredRows, dateRange) {
  const hoSoTheoId = new Map(filteredRows.map(f => [f.idHeThong, f]));
  const idSet = new Set(filteredRows.map(r => r.idHeThong));
  const { shCT: shDraftCT } = getDraftSheets_();
  const ctData = shDraftCT.getDataRange().getValues();

  // Chỉ đọc phiếu cân của các hồ sơ đã chọn (hồ sơ nháp: phiếu còn ở sheet đang dùng).
  const pcDataNoHeader = _pcTheoSoPhieu_(new Set(ctData.slice(1)
    .filter(r => idSet.has(String(r[1] || "").trim())).map(r => utils.standardize(r[11])).filter(Boolean)), "", "");
  const hdDataNoHeader = _hdNccFullData_();

  const mapPC = utils.buildIndexMap(pcDataNoHeader, PC_COL.SO_CT, true);
  const mapHD = utils.buildIndexMap(hdDataNoHeader, 2, true);

  sheet.clear();
  // SỬA (theo yêu cầu - file xuất ra cũng phải khóa): giống hệt
  // renderSheet2Detail_() - Số phiếu cân(3), Số hợp đồng(7), CCCD Chủ
  // rừng(10), CCCD Người thụ hưởng(12), Số tài khoản(25).
  _lockTextCols_(sheet, [3, 4, 5, 7, 10, 12, 25], filteredRows.length + 5); // SỬA (tối ưu tốc độ): dùng đúng số dòng thực tế thay vì mặc định 2000
  sheet.getRange("A1:Z1").merge().setValue("BẢNG KÊ CHI TIẾT CHUYỂN KHOẢN (CHỜ DUYỆT - CHƯA CHỐT)").setFontSize(16).setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange("A2:Z2").merge().setValue("Thời gian: " + dateRange).setFontStyle("italic").setHorizontalAlignment("center");

  const headers = ["STT", "Lần TT", "Số phiếu cân", "Ngày CK (dự kiến)", "Ngày nhập", "Đại lý", "Số hợp đồng", "Số xe", "Họ tên chủ rừng", "CCCD Chủ rừng", "Tên người thụ hưởng", "CCCD Người thụ hưởng", "Địa chỉ Chủ rừng", "Địa chỉ rừng", "Giờ vào", "Giờ ra", "KL hàng + xe", "Bì", "KL_KG", "KL_Tấn", "Đơn giá", "Thành tiền", "Nguồn gốc", "Ngân hàng", "Số tài khoản", "Thời gian nhập liệu"];
  sheet.getRange(4, 1, 1, headers.length).setValues([headers]).setBackground("#cfe2f3").setFontWeight("bold").setBorder(true, true, true, true, true, true).setHorizontalAlignment("center");

  let tempRows = [];
  ctData.slice(1).forEach(ctRow => {
    if (utils.isBlank(ctRow[0]) || utils.isBlank(ctRow[1])) return;
    let parentId = String(ctRow[1]).trim();
    if (idSet.has(parentId)) {
      let pc = mapPC.get(utils.standardize(ctRow[11])) || new Array(30).fill("");
      let hd = mapHD.get(utils.standardize(ctRow[19])) || new Array(30).fill("");
      let parentInfo = hoSoTheoId.get(parentId); // tra thẳng theo mã, không dò lại cả danh sách cho từng phiếu
      // SỬA LỖI (rà soát phát hiện - đồng bộ với _gomChiTietChuyenKhoan_()):
      // ưu tiên người nhận/ngân hàng/STK đã có thể SỬA TAY (parentInfo,
      // từ get112ViewData_()/rows) thay vì luôn lấy mặc định hợp đồng -
      // báo cáo in ra phải khớp đúng với hồ sơ đang chờ duyệt.
      const { tenThuHuong, nganHangThat, stkThat } = _resolveNguoiNhanTien_(parentInfo, hd);

      const dong = [
        0, parentInfo && parentInfo.soLan, _chu_(ctRow[11]), _formatNgayXuat_(ctRow[20]), _formatNgayXuat_(pc[PC_COL.NGAY_CAN_1]),
        pc[PC_COL.DAI_LY], _chu_(ctRow[19]), pc[PC_COL.BIEN_SO_1], ctRow[3], _chu_(_chuanHoaCCCD_(hd[6])), tenThuHuong, _chu_(_chuanHoaCCCD_(hd[11])),
        hd[5], hd[18], pc[PC_COL.GIO_CAN_1], pc[PC_COL.GIO_CAN_2], utils.parseNum(pc[PC_COL.CAN_LAN_1]), utils.parseNum(pc[PC_COL.CAN_LAN_2]),
        utils.parseNum(pc[PC_COL.KL_KG]), utils.parseNum(pc[PC_COL.KL_KG])/1000, utils.parseNum(pc[PC_COL.DON_GIA_TC]),
        utils.parseNum(pc[PC_COL.THANH_TIEN]), pc[PC_COL.NGUON_GOC], nganHangThat, _chu_(stkThat), ctRow[2]
      ];
      dong.idHoSo = parentId;
      tempRows.push(dong);
    }
  });

  if (tempRows.length > 0) {
    // v2026.9.8: cùng thứ tự hồ sơ với Sheet 1 (filteredRows - theo thời gian lập),
    // trong 1 hồ sơ theo thứ tự dòng Nháp (STT phiếu cân). Sắp ổn định.
    const thuTuHoSo = new Map(filteredRows.map((r, i) => [r.idHeThong, i]));
    tempRows.forEach((row, i) => { row.viTri = i; });
    tempRows.sort((a, b) => thuTuHoSo.get(a.idHoSo) - thuTuHoSo.get(b.idHoSo) || a.viTri - b.viTri);
    let finalRows = tempRows.map((row, index) => { const out = row.slice(); out[0] = index + 1; return out; });
    const lastR = 5 + finalRows.length - 1;
    sheet.getRange(5, 1, finalRows.length, headers.length).setValues(_dongAnToan_(finalRows)).setBorder(true, true, true, true, true, true).setVerticalAlignment("middle");
    _canhLeTheoKieu_(sheet, 5, finalRows);

    sheet.getRange(5, 15, finalRows.length, 2).setNumberFormat("HH:mm");
    sheet.getRange(5, 17, finalRows.length, 3).setNumberFormat("#,##0");
    sheet.getRange(5, 20, finalRows.length, 1).setNumberFormat("#,##0.000");
    sheet.getRange(5, 21, finalRows.length, 2).setNumberFormat("#,##0");

    const totalRow = lastR + 1;
    sheet.getRange(totalRow, 1, 1, 16).merge().setValue("TỔNG CỘNG").setFontWeight("bold").setHorizontalAlignment("right");
    sheet.getRange(totalRow, 17, 1, 3).setFormulaR1C1(`=SUM(R5C:R[-1]C)`);
    sheet.getRange(totalRow, 20).setFormulaR1C1(`=SUM(R5C:R[-1]C)`);
    sheet.getRange(totalRow, 22).setFormulaR1C1(`=SUM(R5C:R[-1]C)`);
    sheet.getRange(totalRow, 1, 1, headers.length).setBackground("#fff2cc").setBorder(true, true, true, true, true, true);
  }
}


/** useFull=true: dùng dữ liệu HD_STK ĐẦY ĐỦ (mọi hợp đồng, kể cả đã
 * xong) - BẮT BUỘC cho runFillMissingBankOnly (vá dữ liệu LỊCH SỬ, có
 * thể thuộc hợp đồng đã "Đã Thanh lý"). Mặc định (false) dùng mirror đã
 * lọc "Đang Thực Hiện" - nhanh hơn, đủ dùng cho luồng "Tạo Mới". */
function buildBankLookupFromHDSTK_(useFull) {
  const map = new Map();
  try {
    // SỬA GẤP: dùng ĐÚNG bộ cột tương ứng với nguồn dữ liệu - dữ liệu
    // ĐẦY ĐỦ (_hdStkFullData_) dùng vị trí cột THẬT (HDSTK_SRC_COL), còn
    // mirror đã cắt gọn (_hdStkData_) dùng vị trí đã gọn (HDSTK_COL) -
    // 2 bộ vị trí KHÁC NHAU, không được lẫn.
    const col = useFull ? HDSTK_SRC_COL : HDSTK_COL;
    (useFull ? _hdStkFullData_() : _hdStkData_()).forEach(row => {
      const soHD = utils.standardize(row[col.SO_HD]);
      const soTK = utils.standardize(row[col.STK]);
      const nganHang = String(row[col.NGAN_HANG] || "").trim();
      if (!soHD || !soTK || !nganHang) return;
      map.set(soHD + "|" + soTK, nganHang);
    });
  } catch (e) {
    // Không có sheet HD_STK hoặc không truy cập được -> bỏ qua, không chặn luồng chính
  }
  return map;
}

// ============================================================
// NÚT 8: CHỐT THANH TOÁN
// SỬA (mục J): giờ đọc từ FILE NHÁP, đẩy dữ liệu về sheet chính thức,
// rồi XÓA phần vừa chốt khỏi Nháp. Chỉ chốt được hồ sơ đã đủ điều kiện
// (đã có Số tiền > 0 trong Draft 112, tức đã chạy xong "Tổng Hợp 112").
// ============================================================
function runConfirmPayment_(selectedIds, payDateStr) {
  let lock;
  try {
    lock = sysLock.acquire();
    const ss = getMainSs_();
    const shSrc = ss.getSheetByName(CFG.DNTT_SRC); // bản CHÍNH - chỉ ghi vào đây lúc Đóng Thanh Toán
    const shCTReal = ss.getSheetByName(CFG.DNTT_CT);
    const sh112Real = ss.getSheetByName(CFG.DNTT_112);
    const shPC = openExternalSheet_(CFG.PC_SS_ID, CFG.PC_SHEET, "Phiếu Cân");
    const { shCT: shDraftCT, sh112: shDraft112, shSrc: shDraftSrc } = getDraftSheets_();

    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
      return "❌ Lỗi: Không có hồ sơ nào được chọn để chốt thanh toán.";
    }

    // SỬA (theo yêu cầu - đồng bộ với vùng lãnh thổ đã chọn): trước đây
    // "cứng" thứ tự dd/mm/yyyy - giờ dùng _parseNgayTheoVung_() để tự
    // hiểu đúng theo vùng đang cấu hình (Việt Nam: dd/mm/yyyy, United
    // States: mm/dd/yyyy...).
    const ngayTT = _parseNgayTheoVung_(payDateStr);
    if (!ngayTT) {
      const vd = _getRegionPreset_().dateOrder === "mdy" ? "mm/dd/yyyy" : "dd/mm/yyyy";
      return `❌ Lỗi: Ngày thanh toán "${payDateStr}" không phải ngày có thật. Chọn ngày bằng lịch, hoặc gõ đúng ${vd} (theo vùng lãnh thổ đang cấu hình).`;
    }
    const p = [String(ngayTT.d).padStart(2, '0'), String(ngayTT.m).padStart(2, '0'), String(ngayTT.y)];
    const prefixP = p[2] + p[1] + p[0];
    // SỬA LỖI NGHIÊM TRỌNG: trước đây ghép thành CHUỖI TEXT "dd/mm/yyyy"
    // rồi ghi thẳng vào ô "Ngày CK/TT" - nếu định dạng cột đang "Tự
    // động" và Google Sheet đang ở locale mm/dd/yyyy (Mỹ), chuỗi
    // "dd/mm/yyyy" (kiểu Việt Nam) bị hiểu SAI ngày/tháng, hoặc bị lưu
    // thành TEXT không đồng nhất giữa các dòng. Giờ dùng Date OBJECT
    // THẬT - Google Sheets sẽ luôn hiển thị đúng theo định dạng cột đã
    // khóa (xem khoaDinhDangTextTatCa_()), không còn phụ thuộc cách hiểu
    // chuỗi mơ hồ nữa.
    // SỬA THÊM (theo yêu cầu làm rõ): new Date(y, m, d) sẽ hiểu y/m/d
    // theo múi giờ CỦA PROJECT (Project Settings > Time zone) - nếu
    // project lỡ CHƯA cấu hình đúng giờ Việt Nam, ngày ghi vào sheet có
    // thể bị LỆCH. Dùng _ngayVNTruaThat_() (tính qua UTC, neo cứng
    // GMT+7) để LUÔN ra đúng ngày dự định, KHÔNG phụ thuộc múi giờ
    // project có cấu hình đúng hay chưa - an toàn ngay cả khi bạn quên
    // chỉnh Time Zone.
    const dateForSheet = _ngayVNTruaThat_(ngayTT.y, ngayTT.m, ngayTT.d);
    const dateForSheetStr = p[0] + "/" + p[1] + "/" + p[2]; // chỉ dùng cho log/thông báo, KHÔNG ghi vào sheet

    const idSet = new Set(selectedIds.map(id => String(id).trim()).filter(id => id !== ""));
    if (idSet.size === 0) return "❌ Lỗi: Danh sách hồ sơ được chọn không hợp lệ (rỗng).";

    // 1. ĐỌC TOÀN BỘ FILE NHÁP
    const draftCTLastRow = shDraftCT.getLastRow();
    const draftCTAll = draftCTLastRow > 1 ? shDraftCT.getRange(2, 1, draftCTLastRow - 1, 22).getValues() : [];
    const draft112LastRow = shDraft112.getLastRow();
    // SỬA (mục U): Draft 112 giờ có 24 cột (thêm cột "Trạng Thái ĐNTT" ở
    // cuối) - sheet DNTT_GK_DN_112 THẬT vẫn giữ nguyên 23 cột như cũ.
    const draft112All = draft112LastRow > 1 ? shDraft112.getRange(2, 1, draft112LastRow - 1, 24).getValues() : [];

    // 2. CHỈ CHỐT HỒ SƠ ĐÃ CÓ Draft 112 VỚI SỐ TIỀN > 0 (đã Tổng Hợp 112
    // đầy đủ) VÀ ĐÃ QUA BƯỚC "Xác Nhận" (Trạng Thái ĐNTT = "Đang ĐNTT") -
    // hồ sơ chưa đủ điều kiện bị BỎ QUA kèm cảnh báo, không chốt dữ liệu
    // nửa vời.
    const draft112ById = new Map();
    draft112All.forEach(r => { const id = String(r[0] || "").trim(); if (id) draft112ById.set(id, r); });

    const validIds = [], skippedNoData = [], skippedNotCalculated = [], skippedNotConfirmed = [];
    idSet.forEach(id => {
      const r112 = draft112ById.get(id);
      if (!r112) { skippedNoData.push(id); return; }
      if (utils.parseNum(r112[6]) <= 0) { skippedNotCalculated.push(id); return; }
      if (String(r112[COL_TRANG_THAI_DNTT] || "").trim() !== "Đang ĐNTT") { skippedNotConfirmed.push(id); return; }
      validIds.push(id);
    });

    // Chặn TRẢ 2 LẦN (đọc thẳng CT thật, không qua cache): hồ sơ có phiếu cân
    // đã chốt ở 1 hồ sơ KHÁC thì không chốt - cả hồ sơ, không chốt nửa vời.
    const skippedDaTra = [];
    const ctLr = shCTReal.getLastRow();
    const ctThatLucDau = ctLr > 1 ? shCTReal.getRange(2, 1, ctLr - 1, 22).getValues() : []; // dùng lại khi cập nhật Phân Tích cuối lượt
    {
      const daTra = _phieuCanDaTraThat_(ctThatLucDau);
      validIds.slice().forEach(id => {
        const trung = draftCTAll.filter(r => String(r[1] || "").trim() === id).map(r => String(r[11] || "").trim())
          .filter(so => { const idDaTra = daTra.get(utils.standardize(so)); return idDaTra && idDaTra !== id; });
        if (!trung.length) return;
        skippedDaTra.push(`${id} (phiếu ${trung.join(", ")})`);
        validIds.splice(validIds.indexOf(id), 1);
      });
      // Cùng 1 phiếu cân nằm ở 2 dòng Nháp trong CÙNG lượt Duyệt (2 hồ sơ, hoặc
      // 2 lần trong 1 hồ sơ - vd sửa tay trực tiếp File Nháp): sổ chốt chưa có
      // nên kiểm tra trên không bắt được -> bỏ qua MỌI hồ sơ liên quan.
      const hoSoTheoPhieu = new Map(); // Số phiếu (chuẩn hóa) -> [ID hồ sơ theo từng dòng]
      draftCTAll.forEach(r => {
        const id = String(r[1] || "").trim(), so = utils.standardize(r[11]);
        if (!so || validIds.indexOf(id) === -1) return;
        if (!hoSoTheoPhieu.has(so)) hoSoTheoPhieu.set(so, []);
        hoSoTheoPhieu.get(so).push(id);
      });
      const idTrungLo = new Set();
      hoSoTheoPhieu.forEach((ds, so) => {
        if (ds.length < 2) return;
        ds.forEach(id => idTrungLo.add(id));
        skippedDaTra.push(`phiếu ${so} có ${ds.length} lần trong hồ sơ ${Array.from(new Set(ds)).join(", ")}`);
      });
      idTrungLo.forEach(id => validIds.splice(validIds.indexOf(id), 1));
      if (skippedDaTra.length) logAction_("CHAN_TRA_HAI_LAN", skippedDaTra.join("; ").slice(0, 200), "Không chốt vì có phiếu cân đã được thanh toán ở hồ sơ khác hoặc trùng trong lượt Duyệt: " + skippedDaTra.join("; "));
    }

    if (validIds.length === 0) {
      let msg = "❌ Không có hồ sơ nào đủ điều kiện để chốt.";
      if (skippedDaTra.length) msg += ` ⛔ Có phiếu cân ĐÃ ĐƯỢC THANH TOÁN ở hồ sơ khác hoặc bị TRÙNG trong lượt Duyệt (bỏ phiếu đó khỏi hồ sơ rồi Duyệt lại): ${skippedDaTra.join("; ")}.`;
      if (skippedNoData.length) msg += ` Không tìm thấy trong File Nháp: ${skippedNoData.join(", ")}.`;
      if (skippedNotCalculated.length) msg += ` Chưa chạy "Tổng Hợp 112": ${skippedNotCalculated.join(", ")}.`;
      if (skippedNotConfirmed.length) msg += ` Chưa "Xác Nhận" ĐNTT: ${skippedNotConfirmed.join(", ")}.`;
      return msg;
    }
    const validIdSet = new Set(validIds);

    // v2026.6 (an toàn khi chạy lại): hồ sơ đã có sẵn trong bản chính do
    // lần chốt trước bị ngắt giữa chừng thì KHÔNG ghi thêm lần nữa - chỉ
    // hoàn tất nốt các bước còn lại (khóa phiếu cân, dọn Nháp...).
    const ctDaChot = _tapKhoaTrongCot_(shCTReal, 2, 19);      // ID_KEY (B) + Đã chốt (S)
    const h112DaChot = _tapKhoaTrongCot_(sh112Real, 1, 21);   // ID_KEY (A) + Đã chốt (U)
    const srcDaCo = _tapKhoaTrongCot_(shSrc, 1);              // ID_KEY (A)
    const idsDaCoTruoc = validIds.filter(id => h112DaChot.has(id) || ctDaChot.has(id));

    // 3. TÁCH DÒNG NHÁP: dòng thuộc hồ sơ được chốt (đẩy về THẬT) và
    // dòng còn lại (giữ nguyên trong Nháp)
    const ctToCommit = [], ctToKeepInDraft = [];
    draftCTAll.forEach(row => {
      const id = String(row[1] || "").trim();
      if (id && validIdSet.has(id)) {
        row[18] = "Y";
        row[20] = dateForSheet;
        ctToCommit.push(row);
      } else {
        ctToKeepInDraft.push(row);
      }
    });

    const the112ToCommit = [], the112ToKeepInDraft = [];
    const mapSoLan = new Map();
    draft112All.forEach(row => {
      const id = String(row[0] || "").trim();
      if (id && validIdSet.has(id)) {
        row[20] = "Y";
        mapSoLan.set(id, String(row[18]).trim());
        the112ToCommit.push(row);
      } else {
        the112ToKeepInDraft.push(row);
      }
    });

    // 4. GHI VÀO DỮ LIỆU THẬT (APPEND) - bỏ qua hồ sơ đã có sẵn (xem trên)
    const ctCanGhi = ctToCommit.filter(row => !ctDaChot.has(String(row[1] || "").trim()));
    if (ctCanGhi.length > 0) {
      const startRow = shCTReal.getLastRow() + 1;
      shCTReal.getRange(startRow, 1, ctCanGhi.length, 22).setValues(_dongAnToan_(ctCanGhi, COT_CHU.CT));
    }
    const h112CanGhi = the112ToCommit.filter(row => !h112DaChot.has(String(row[0] || "").trim()));
    if (h112CanGhi.length > 0) {
      // Sheet 112 THẬT chỉ có 23 cột - cắt bỏ cột "Trạng Thái ĐNTT" (chỉ
      // có ý nghĩa trong lúc còn ở Nháp) trước khi ghi vào THẬT.
      const startRow112 = sh112Real.getLastRow() + 1;
      sh112Real.getRange(startRow112, 1, h112CanGhi.length, 23).setValues(_dongAnToan_(h112CanGhi.map(r => r.slice(0, 23)), COT_CHU.H112));
    }

    // MỚI (theo yêu cầu - "Báo Cáo Thanh Toán chạy nhanh và ổn định
    // hơn"): chuyển các dòng N (ghi sẵn từ "In Báo Cáo ĐNTT") thành Y
    // trong ChiTietDNTT - nếu hồ sơ chưa từng In Báo Cáo ĐNTT (bỏ qua
    // bước 4 của quy trình), tính bù trực tiếp ngay tại đây. Sau đó tự
    // động ghi MISA (Update_NganHang_DN) NGAY - append thêm, không cần
    // bấm "Xuất MISA" thủ công nữa.
    try {
      // SỬA LỖI (rà soát phát hiện): dùng ĐÚNG người nhận/ngân hàng/STK
      // của dòng 112 vừa chốt (the112ToCommit - có thể đã sửa tay khác
      // mặc định HD_NCC qua nút "Sửa", giống hệt dữ liệu dùng để tạo
      // UNC) cho phần "tính bù" (hồ sơ chưa từng In Báo Cáo ĐNTT trước
      // khi Đóng Thanh Toán) - tránh ChiTietDNTT/MISA tự động ghi lệch
      // với tiền đã chuyển thật.
      const mapNhanTien112 = new Map();
      the112ToCommit.forEach(row => {
        const id = String(row[0] || "").trim();
        if (id) mapNhanTien112.set(id, { nguoiNhan: row[3], nganHang: row[4], stk: row[5] });
      });
      const rowsChiTietY = _chuyenChiTietDNTTSangYVaTinhBu_(validIds, ctToCommit, mapSoLan, mapNhanTien112);
      _tuDongXuatMisaKhiDong_(rowsChiTietY);
    } catch (e) {
      logAction_("LOI_CHITIET_DNTT_LUC_CHOT", validIds.join(","), "Lỗi khi xử lý ChiTietDNTT/MISA tự động lúc Đóng Thanh Toán: " + e.toString());
    }

    // 5. COPY "ĐƠN XIN" TỪ DRAFT SANG BẢN CHÍNH (mục AI) - trước đây các
    // hồ sơ tạo qua Web App đã nằm sẵn trong DNTT_GK_DN thật ngay từ lúc
    // tạo; giờ chúng nằm trong Draft (DNTT_GK_DN_DRAFT) - CHỈ copy hẳn
    // sang bản chính (kèm cập nhật trạng thái Đóng TT) đúng lúc này, rồi
    // dọn khỏi Draft.
    const draftSrcLastRow = shDraftSrc.getLastRow();
    const draftSrcAll = draftSrcLastRow > 1 ? shDraftSrc.getRange(2, 1, draftSrcLastRow - 1, 18).getValues() : [];
    const srcToCommit = [], srcToKeepInDraft = [];
    draftSrcAll.forEach(row => {
      const key = String(row[0] || "").trim();
      if (key && validIdSet.has(key)) {
        row[14] = "Đóng TT";
        row[15] = prefixP + "_" + (mapSoLan.get(key) || "1");
        row[16] = dateForSheet;
        row[17] = "Y";
        srcToCommit.push(row);
      } else {
        srcToKeepInDraft.push(row);
      }
    });
    const srcCanGhi = srcToCommit.filter(row => !srcDaCo.has(String(row[0] || "").trim()));
    if (srcCanGhi.length > 0) {
      const startRowSrc = shSrc.getLastRow() + 1;
      shSrc.getRange(startRowSrc, 1, srcCanGhi.length, 18).setValues(_dongAnToan_(srcCanGhi, COT_CHU.SRC));
    }
    _thayVungDuLieu_(shDraftSrc, 2, 18, draftSrcAll.length, srcToKeepInDraft, COT_CHU.SRC);

    // Tương thích ngược: nếu hồ sơ nào (hiếm - tạo từ bản cũ trước khi
    // có mục AI) vẫn đang nằm SẴN trong DNTT_GK_DN thật (vd do "Tách
    // Phiếu" thủ công từ Sheet - runProcessDetail()), vẫn cập nhật trạng
    // thái tại chỗ như cũ, không bỏ sót. v2026.6: chỉ ghi đúng 4 ô trạng
    // thái (cột O..R) của đúng các dòng đó, không ghi đè cả sheet.
    if (shSrc.getLastRow() > 1) {
      const dataSrc = shSrc.getRange(2, 1, shSrc.getLastRow() - 1, 18).getValues();
      const capNhatSrc = [];
      dataSrc.forEach((r, i) => {
        const key = String(r[0]).trim();
        if (!key || !validIdSet.has(key) || r[17] === "Y") return;
        capNhatSrc.push({ row: i + 2, values: ["Đóng TT", prefixP + "_" + (mapSoLan.get(key) || "1"), dateForSheet, "Y"] });
      });
      _ghiTheoDong_(shSrc, capNhatSrc, 15);
    }

    // 6. KHÓA VĨNH VIỄN PHIẾU CÂN LIÊN QUAN - v2026.6: chỉ đọc cột Số
    // phiếu cân và chỉ ghi đúng 3 ô khóa của đúng các dòng liên quan (file
    // PhieuCan_DN có người khác cùng nhập liệu - không được ghi đè cả sheet).
    const pcKeySet = new Set();
    ctToCommit.forEach(row => { if (row[11]) pcKeySet.add(utils.standardize(row[11])); });
    // Giữ dòng Phiếu Cân trước khi khóa (bộ nhớ đệm bị xóa ngay sau đó): khóa chỉ
    // đổi 3 ô trạng thái, Phân Tích Nhập/TT cuối lượt không dùng các ô này.
    const pcTruocKhoa = _pcData_();
    _khoaPhieuCanDaTra_(shPC, pcKeySet);

    // 7. DỌN DẸP FILE NHÁP - chỉ giữ lại các hồ sơ CHƯA chốt (ghi đè
    // trước, xóa đuôi sau - không có lúc Nháp bị trống hoàn toàn)
    _thayVungDuLieu_(shDraftCT, 2, 22, draftCTAll.length, ctToKeepInDraft, COT_CHU.CT);
    _thayVungDuLieu_(shDraft112, 2, 24, draft112All.length, the112ToKeepInDraft, COT_CHU.H112);

    SpreadsheetApp.flush();

    let msg = `✅ Đã chốt thành công ${validIds.length} hồ sơ, đẩy dữ liệu về sheet chính, khóa Phiếu Cân, dọn khỏi File Nháp và đã tự động ghi vào Update_NganHang_DN (MISA)!`;
    if (idsDaCoTruoc.length) msg += ` ℹ️ Đã có sẵn trong bản chính từ lần chốt trước (chỉ hoàn tất phần còn thiếu, không ghi trùng): ${idsDaCoTruoc.join(", ")}.`;
    if (skippedNoData.length) msg += ` ⚠️ Không tìm thấy trong Nháp (bỏ qua): ${skippedNoData.join(", ")}.`;
    if (skippedNotCalculated.length) msg += ` ⚠️ Chưa chạy Tổng Hợp 112 (bỏ qua): ${skippedNotCalculated.join(", ")}.`;
    if (skippedNotConfirmed.length) msg += ` ⚠️ Chưa "Xác Nhận" ĐNTT (bỏ qua): ${skippedNotConfirmed.join(", ")}.`;
    if (skippedDaTra.length) msg += ` ⛔ KHÔNG chốt vì có phiếu cân ĐÃ ĐƯỢC THANH TOÁN ở hồ sơ khác hoặc bị TRÙNG trong lượt Duyệt (bỏ phiếu đó khỏi hồ sơ rồi Duyệt lại): ${skippedDaTra.join("; ")}.`;

    const tongTienChot = the112ToCommit.reduce((t, r) => t + utils.parseNum(r[6]), 0);
    logAction_("CHOT_THANH_TOAN", validIds.join(","), `Duyệt (Đóng Thanh Toán) ${validIds.length} hồ sơ, ${ctToCommit.length} phiếu cân, tổng ${tongTienChot.toLocaleString("vi-VN")} đ, ngày TT ${dateForSheetStr}.`);
    _invalidateCtSrc112Cache_(); // MỚI (rà soát bổ sung): CT/Src/112 thật vừa thay đổi - xóa cache để lần đọc tiếp theo (gợi ý, chẩn đoán) thấy dữ liệu mới ngay
    _invalidateCongNoCache_(); // MỚI (rà soát bổ sung): buộc Báo Cáo Công Nợ tính lại, tránh hiện snapshot cũ
    // MỚI (rà soát phát hiện - "báo cáo công nợ ok chưa"): làm mới NGAY
    // "Chi Tiết Công Nợ theo Phiếu Cân" + đúng các ngày "Ngày CK" vừa
    // chốt trong "Phân Tích Nhập/TT theo NG-ĐL" - không đợi tới lần làm
    // mới định kỳ mới thấy đúng số liệu vừa Đóng Thanh Toán.
    try {
      PropertiesService.getScriptProperties().deleteProperty('CTCN_SNAPSHOT_DATE');
      const ngayBiAnhHuong = new Set();
      ctToCommit.forEach(row => {
        const d = row[20];
        if (d instanceof Date) ngayBiAnhHuong.add(Utilities.formatDate(d, "GMT+7", "yyyy-MM-dd"));
      });
      if (ngayBiAnhHuong.size) _refreshPhanTichNhapTTChoDanhSachNgayNoLock_(Array.from(ngayBiAnhHuong), { pc: pcTruocKhoa, ct: ctThatLucDau.concat(ctCanGhi) }); // dùng bản KHÔNG khóa - hàm này đang chạy TRONG lượt đã giữ sysLock rồi, tránh khóa lồng nhau
    } catch (e) { /* không chặn luồng chính nếu làm mới báo cáo công nợ lỗi */ }
    return msg;
  } catch (e) {
    logAction_("LOI_CHOT_THANH_TOAN", Array.isArray(selectedIds) ? selectedIds.join(",") : "-", e.toString());
    return "❌ Lỗi: " + _loiChoNguoiDung_(e) + " - Có thể bấm Duyệt lại cho CÙNG các hồ sơ này: hệ thống tự bỏ qua phần đã ghi, không tạo dữ liệu trùng.";
  } finally { if (lock) lock.releaseLock(); }
}

/**
 * NÚT 1: TÁCH PHIẾU CHI TIẾT
 * SỬA (mục J): giờ ghi vào FILE NHÁP thay vì DNTT_GK_DN_CT thật, và
 * KHÔNG khóa Phiếu Cân thật nữa. Chỉ xử lý các hồ sơ CHƯA có trong Draft
 * CT (tránh tạo trùng / đè lên dòng đã sửa tay trong Nháp).
 */
function runProcessDetail() {
  _yeuCauQuyen_(QUYEN.NGHIEP_VU);
  let lock;
  try {
    lock = sysLock.acquire();
    const ss = getMainSs_();
    const shSrc = ss.getSheetByName(CFG.DNTT_SRC);
    const { shCT: shDraftCT } = getDraftSheets_();

    const srcData = shSrc.getDataRange().getValues();
    // SỬA (mục P - tối ưu tốc độ): pcMap chỉ cần tra cứu phiếu cân CHƯA
    // thanh toán (đúng đối tượng được phép tách) -> dùng cache nhỏ, nhanh.
    const pcMap = utils.buildIndexMap(_pcUnpaidData_(), PC_COL.SO_CT, true);

    // Hồ sơ đã có trong Draft CT -> đã tách rồi, bỏ qua (tránh tạo
    // trùng / đè lên dòng có thể đã bị sửa tay). Cũng lấy luôn danh sách
    // Số phiếu cân đang "bị giữ" bởi BẤT KỲ hồ sơ nào trong Nháp.
    const draftLastRow = shDraftCT.getLastRow();
    const draftIdSet = new Set();
    const heldPhieuCan = new Set();
    if (draftLastRow > 1) {
      shDraftCT.getRange(2, 1, draftLastRow - 1, 12).getValues().forEach(r => {
        if (!utils.isBlank(r[1])) draftIdSet.add(String(r[1]).trim());
        if (!utils.isBlank(r[11])) heldPhieuCan.add(utils.standardize(r[11]));
      });
    }

    const splitColIdx = srcData[0].indexOf(CFG.SPLIT_COL);
    if (splitColIdx === -1) {
      throw new Error(`Không tìm thấy cột "${CFG.SPLIT_COL}" trong sheet ${CFG.DNTT_SRC}. Vui lòng kiểm tra lại tiêu đề cột.`);
    }

    let newDraftRows = [];
    const dongSrcDangXuLy = [];
    let countNewIds = 0;
    let countSkippedEmptyPC = 0, skippedIds = [];
    let countSkippedHeld = 0, heldWarnings = [];

    for (let i = 1; i < srcData.length; i++) {
      let r = srcData[i];
      let idKey = String(r[0]).trim();
      if (!idKey) continue;
      if (String(r[17]).toUpperCase() === "Y" || String(r[14]) === "Đóng TT") continue; // đã chốt thật rồi
      if (draftIdSet.has(idKey)) continue; // đã có trong Nháp, bỏ qua

      let listPC = String(r[splitColIdx] || "").split(/[,;|]/).map(x => x.trim()).filter(Boolean);
      if (listPC.length === 0) {
        countSkippedEmptyPC++;
        if (skippedIds.length < 20) skippedIds.push(idKey);
        continue;
      }

      const srcInfo = {
        timestamp: r[1], chuRung: r[3], cccd: r[4], nguoiDN: r[5], nguoiNhan: r[7],
        stkNguoiNhan: r[8], klTongNguon: r[9], dsPhieuCanGoc: r[10], soHD: r[13],
        ngayTT: r[16], ngayDeNghi: r[11]
      };

      let anyAdded = false;
      listPC.forEach((soP, idx) => {
        const key = utils.standardize(soP);
        if (heldPhieuCan.has(key)) {
          countSkippedHeld++;
          if (heldWarnings.length < 20) heldWarnings.push(`${soP} (hồ sơ ${idKey})`);
          return;
        }
        const { row } = buildDraftCtRow_(idKey, idx + 1, soP, srcInfo, pcMap);
        newDraftRows.push(row);
        heldPhieuCan.add(key); // giữ ngay trong phạm vi lượt chạy này, tránh tự trùng giữa các hồ sơ đang xử lý cùng lượt
        anyAdded = true;
      });

      if (anyAdded) {
        countNewIds++;
        // Thông tin (KHÔNG dùng để xét điều kiện xử lý - chỉ để dễ nhận
        // biết trạng thái khi xem sheet nguồn).
        dongSrcDangXuLy.push(i + 1);
      }
    }

    if (newDraftRows.length > 0) {
      const startRow = shDraftCT.getLastRow() + 1;
      shDraftCT.getRange(startRow, 1, newDraftRows.length, 22).setValues(_dongAnToan_(newDraftRows, COT_CHU.CT));
      // v2026.6: chỉ ghi đúng ô trạng thái (cột O) của các hồ sơ vừa tách,
      // không ghi đè lại toàn bộ DNTT_GK_DN.
      _ghiCungGiaTri_(shSrc, dongSrcDangXuLy, 15, 15, "Đang xử lý (Nháp)");
      SpreadsheetApp.flush();

      let logDetail = `Đã đưa ${countNewIds} hồ sơ (${newDraftRows.length} dòng chi tiết) vào File Nháp.`;
      if (countSkippedEmptyPC > 0) logDetail += ` Bỏ qua ${countSkippedEmptyPC} hồ sơ thiếu Số phiếu cân.`;
      if (countSkippedHeld > 0) logDetail += ` Bỏ qua ${countSkippedHeld} phiếu cân đang bị giữ bởi hồ sơ Nháp khác.`;
      logAction_("TACH_PHIEU_NHAP", "-", logDetail);

      let msg = `✅ Đã đưa ${countNewIds} hồ sơ (${newDraftRows.length} dòng) vào File Nháp để kiểm tra/chỉnh sửa trước khi Tổng Hợp 112.`;
      if (countSkippedEmptyPC > 0) msg += ` ⚠️ Bỏ qua ${countSkippedEmptyPC} hồ sơ thiếu "Số phiếu cân" (ID: ${skippedIds.join(", ")}${countSkippedEmptyPC > skippedIds.length ? "..." : ""}).`;
      if (countSkippedHeld > 0) msg += ` ⚠️ Bỏ qua ${countSkippedHeld} phiếu cân đang bị giữ bởi hồ sơ Nháp khác: ${heldWarnings.join(", ")}${countSkippedHeld > heldWarnings.length ? "..." : ""}.`;
      return msg;
    } else if (countSkippedEmptyPC > 0 || countSkippedHeld > 0) {
      return `⚠️ Không có hồ sơ mới nào được đưa vào Nháp. (Thiếu Số phiếu cân: ${countSkippedEmptyPC}, đang bị giữ bởi Nháp khác: ${countSkippedHeld})`;
    } else {
      return `⚠️ Không có hồ sơ mới cần xử lý (mọi hồ sơ hợp lệ đã có trong File Nháp hoặc đã chốt).`;
    }
  } catch (e) {
    return "❌ Lỗi: " + _loiChoNguoiDung_(e);
  } finally { if (lock) lock.releaseLock(); }
}

/**
 * NÚT 2: TỔNG HỢP 112
 * SỬA (mục J): giờ đọc/ghi hoàn toàn trong FILE NHÁP (Draft CT -> Draft
 * 112). Lũy kế theo hợp đồng gộp cả CT THẬT (lịch sử đã chốt) lẫn CT
 * NHÁP hiện tại (các hồ sơ khác đang chờ xử lý cho cùng hợp đồng).
 * Không đụng đến dữ liệu chính thức hay khóa Phiếu Cân.
 */
function runCreate112() {
  _yeuCauQuyen_(QUYEN.NGHIEP_VU);
  let lock;
  try {
    lock = sysLock.acquire();
    const ss = getMainSs_();
    const shCTReal = ss.getSheetByName(CFG.DNTT_CT); // chỉ ĐỌC - lấy lịch sử "Đã trả"
    const { shCT: shDraftCT, sh112: shDraft112 } = getDraftSheets_();

    const fmt = (num) => utils.parseNum(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const readSheet = (sh) => {
      const lr = sh.getLastRow();
      return lr > 1 ? sh.getRange(1, 1, lr, sh.getLastColumn()).getValues() : [];
    };

    const draftCTData = readSheet(shDraftCT);
    const draftCTRows = draftCTData.length ? draftCTData.slice(1) : [];
    if (draftCTRows.length === 0) {
      return "⚠️ File Nháp chưa có dòng chi tiết nào (chưa chạy 'Tách Phiếu' hoặc chưa 'Thêm Mới Đề Nghị Thanh Toán').";
    }

    const realCTData = shCTReal ? readSheet(shCTReal) : [];
    const realCTRows = realCTData.length ? realCTData.slice(1) : [];

    const draft112Data = readSheet(shDraft112);
    let draft112Rows = draft112Data.length ? draft112Data.slice(1) : [];

    const draft112MapIdx = new Map();
    draft112Rows.forEach((r, idx) => {
      const id = String(r[0] || "").trim();
      if (id) draft112MapIdx.set(id, idx);
    });

    // Nhóm CT NHÁP theo ID_KEY
    const ctGroupedById = draftCTRows.reduce((acc, row) => {
      const id = String(row[1] || "").trim();
      if (!id) return acc;
      if (!acc[id]) acc[id] = [];
      acc[id].push(row);
      return acc;
    }, {});

    // Nhóm CT theo Số HĐ để tính lũy kế - GỘP CẢ dữ liệu THẬT (lịch sử
    // đã chốt) VÀ dữ liệu NHÁP hiện tại (mục J), tránh tính sai "Còn lại"
    // khi có nhiều hồ sơ đang cùng chờ xử lý cho 1 hợp đồng.
    const ctGroupedByHD = {};
    const addToGroup = (row) => {
      const hdKey = utils.standardize(row[19]);
      if (!hdKey) return;
      if (!ctGroupedByHD[hdKey]) ctGroupedByHD[hdKey] = [];
      ctGroupedByHD[hdKey].push(row);
    };
    realCTRows.forEach(addToGroup);
    draftCTRows.forEach(addToGroup);

    const bankMap = buildBankLookupFromHDSTK_();

    // Tự tạo Draft 112 placeholder cho các ID_KEY có trong Draft CT
    // nhưng chưa có dòng 112 tương ứng (vd vừa "Tách Phiếu" xong)
    let session = null; // tính 1 lần cho cả lượt (mở File Chính + đọc sheet Lần TT), chỉ khi cần
    Object.keys(ctGroupedById).forEach(id => {
      if (draft112MapIdx.has(id)) return;
      const first = ctGroupedById[id][0];
      session = session || getSessionInfo_();
      const newRow = new Array(24).fill(""); // mục U: +1 cột "Trạng Thái ĐNTT" (mặc định rỗng = Chờ ĐNTT)
      newRow[0] = id;
      newRow[1] = first[2];
      newRow[2] = first[3];
      newRow[3] = first[6];
      newRow[4] = "";
      newRow[5] = String(first[7] || "").replace(/'/g, "");
      newRow[8] = String(first[19] || "").replace(/'/g, "");
      newRow[16] = first[21];
      newRow[18] = session.lan;
      newRow[19] = session.ngayDuKien;
      newRow[22] = id + "_112";
      draft112Rows.push(newRow);
      draft112MapIdx.set(id, draft112Rows.length - 1);
    });

    let count = 0, filledBankCount = 0;
    // Tra HD_NCC theo Số HĐ 1 lần trước vòng lặp (giữ dòng ĐẦU TIÊN như .find() cũ)
    // thay vì quét lại cả mirror cho từng hồ sơ.
    const hdNccTheoSoHD = new Map();
    _hdNccData_().forEach(r => {
      const k = utils.standardize(r[HDNCC_COL.SO_HD]);
      if (k && !hdNccTheoSoHD.has(k)) hdNccTheoSoHD.set(k, r);
    });

    Object.keys(ctGroupedById).forEach(id => {
      const idx = draft112MapIdx.get(id);
      const row112 = draft112Rows[idx];

      // Tự động điền Ngân hàng NẾU ĐANG TRỐNG - không ghi đè giá trị đã
      // có sẵn (kể cả do người dùng tự sửa tay trong Nháp).
      if (utils.isBlank(row112[4])) {
        const hdKeyLookup = utils.standardize(String(row112[8] || ""));
        const stkKeyLookup = utils.standardize(row112[5]);
        if (hdKeyLookup && stkKeyLookup) {
          const bankFound = bankMap.get(hdKeyLookup + "|" + stkKeyLookup);
          if (bankFound) { row112[4] = bankFound; filledBankCount++; }
        }
      }

      const currentDetails = ctGroupedById[id];
      const soHD = String(row112[8] || "").replace(/'/g, "");
      const hdKey = utils.standardize(soHD);

      // SỬA LỖI (theo yêu cầu): "SL HĐ Dự Kiến" (cột 17) trước đây KHÔNG
      // BAO GIỜ được gán khi tạo hồ sơ - tự bù đắp NẾU ĐANG TRỐNG/BẰNG 0
      // cho các hồ sơ ĐÃ TẠO TỪ TRƯỚC (không ghi đè nếu đã có giá trị).
      if (!row112[17] || utils.parseNum(row112[17]) === 0) {
        const hdRowChoSL = hdNccTheoSoHD.get(hdKey);
        if (hdRowChoSL) row112[17] = utils.parseNum(hdRowChoSL[HDNCC_COL.SL_DU_KIEN]);
      }
      const time112 = (row112[1] instanceof Date) ? row112[1].getTime()
        : ((currentDetails[0][2] instanceof Date) ? currentDetails[0][2].getTime() : Date.now());

      const relate = (ctGroupedByHD[hdKey] || []).filter(c => {
        const timeCT = (c[2] instanceof Date) ? c[2].getTime() : 0;
        return timeCT > 0 && timeCT <= time112;
      });

      let slHD_TuDong = 0, daTra_N = 0, kyNay_O = 0, listP = [];
      relate.forEach(c => {
        const kl = utils.parseNum(c[12]);
        slHD_TuDong += kl;
        if (String(c[18]).trim().toUpperCase() === "Y") {
          daTra_N += kl;
        } else {
          kyNay_O += kl;
          listP.push(String(c[11]).replace(/'/g, "").split('/')[0]);
        }
      });

      const tongTien = currentDetails.reduce((sum, d) => sum + utils.parseNum(d[16]), 0);
      const valL_Tan = currentDetails.reduce((sum, d) => sum + utils.parseNum(d[12]), 0);
      const phieuStr = listP.length > 0 ? listP.join(", ") : "Trống";

      row112[6] = tongTien;
      // SỬA (theo yêu cầu): thêm "ngày" vào Nội dung CK, định dạng
      // dd.mm.yyyy (dấu chấm) - lấy theo Ngày Đề Nghị của hồ sơ.
      // SỬA (theo yêu cầu làm rõ): "ngày" trong Nội dung CK là NGÀY HỢP
      // ĐỒNG (row112[9] - Ngày Ký HĐ), KHÔNG PHẢI Ngày Đề Nghị (row112[16]).
      row112[7] = _noiDungCK_(soHD, row112[9]);
      row112[11] = valL_Tan * 1000; // KL Tổng (kg)
      row112[12] = slHD_TuDong;
      row112[13] = daTra_N;
      row112[14] = kyNay_O;
      row112[15] = `Tổng KL: ${fmt(slHD_TuDong)} | Đã trả: ${fmt(daTra_N)} | Còn lại: ${fmt(kyNay_O)} | Đề nghị đợt này: ${fmt(valL_Tan)} | Phiếu: ${phieuStr}`;
      row112[21] = (soHD !== "" && tongTien > 0) ? "Đủ ĐK TT" : "Không đủ ĐK TT";

      count++;
    });

    if (draft112Rows.length > 0) {
      _thayVungDuLieu_(shDraft112, 2, 24, Math.max(0, shDraft112.getLastRow() - 1), draft112Rows, COT_CHU.H112);
      SpreadsheetApp.flush();
    }

    const parts = [];
    if (count > 0) parts.push(`Đã tính toán/cập nhật ${count} hồ sơ trong File Nháp`);
    if (filledBankCount > 0) parts.push(`tự động điền Ngân hàng cho ${filledBankCount} hồ sơ`);
    const detailMsg = (parts.join(", ") || "Không có gì thay đổi") + ".";
    logAction_("TONG_HOP_112_NHAP", "-", detailMsg);
    return "✅ " + detailMsg + " Vào File Nháp để kiểm tra/chỉnh sửa trước khi Chốt Thanh Toán.";
  } catch (e) {
    return "❌ Lỗi: " + _loiChoNguoiDung_(e);
  } finally { if (lock) lock.releaseLock(); }
}

// ============================================================
// TÍNH LẦN THANH TOÁN + NGÀY DỰ KIẾN THEO KHUNG GIỜ
// ============================================================
function getSessionInfo_() {
  const now = new Date();
  const fallback = () => {
    const ngayDuKien = new Date(now);
    ngayDuKien.setDate(ngayDuKien.getDate() + 1);
    return { maPhien: "N/A", lan: 1, ngayDuKien };
  };
  try {
    const sh = getMainSs_().getSheetByName(CFG.LAN_TT);
    if (!sh || sh.getLastRow() < 2) return fallback();
    const data = sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues();
    const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    for (const row of data) {
      const [maPhien, tuGio, denGio, lan, ngayOffset] = row;
      if (!maPhien) continue;
      const tuSec = utils.timeToSeconds(tuGio);
      const denSec = utils.timeToSeconds(denGio);
      if (tuSec === null || denSec === null) continue;
      if (nowSec >= tuSec && nowSec <= denSec) {
        const ngayDuKien = new Date(now);
        ngayDuKien.setDate(ngayDuKien.getDate() + utils.parseNum(ngayOffset));
        return { maPhien: String(maPhien).trim(), lan: utils.parseNum(lan) || 1, ngayDuKien };
      }
    }
    return fallback();
  } catch (e) {
    return fallback();
  }
}

// ============================================================
// MỚI (mục M): CÁC HÀM TRA CỨU THEO CHUỖI PHỤ THUỘC CHO "TẠO ĐỀ NGHỊ
// THANH TOÁN" (Họ tên Chủ rừng -> CCCD -> Người đề nghị/Ủy quyền ->
// Số hợp đồng -> Số phiếu cân -> Người nhận tiền -> Số tài khoản).
// CHỈ SỐ CỘT dưới đây lấy CHÍNH XÁC theo dòng tiêu đề thật của 3 sheet
// (do người dùng cung cấp) - không suy đoán.
// ============================================================
// SỬA (tối ưu sâu hơn - theo yêu cầu): trước đây HDNCC_COL trỏ ĐÚNG vị
// trí cột trong sheet HD_NCC/HD_STK THẬT, nên dù chỉ 8/31 (HD_NCC) và
// 6/10 (HD_STK) trường thực sự được code dùng, mirror vẫn phải "cõng"
// theo TOÀN BỘ dải liên tục vì Google Sheets chỉ copy được dải liên
// tục. Giờ tách riêng:
//  - HDNCC_SRC_COL/HDSTK_SRC_COL: vị trí THẬT trong sheet gốc (dùng lúc
//    refreshHdNccCache_()/refreshHdStkCache_() trích xuất) - GIỮ NGUYÊN
//    như code cũ, không đổi.
//  - HDNCC_COL/HDSTK_COL: vị trí TRONG MIRROR đã cắt gọn (chỉ đúng số
//    cột thật sự cần) - mọi nơi khác trong code vẫn gọi
//    HDNCC_COL.TEN_TRUONG y hệt như cũ, không cần sửa gì thêm, chỉ số
//    bên dưới tự trỏ đúng cột mới gọn hơn.
const HDNCC_SRC_COL = { SO_HD: 2, NGAY_KY: 3, HO_TEN: 4, CCCD: 6, NGUOI_UQ: 10, UY_QUYEN_TT: 24, SL_DU_KIEN: 25, ID_HD: 29, TINH_TRANG: 30 };
// Sheet HD_RUNG (file Hợp Đồng, do app Hợp Đồng HDMB_HAK quản lý): mỗi dòng 1 lô rừng.
// Tìm cột theo TIÊU ĐỀ (không cố định vị trí) - app Hợp Đồng có thể thêm cột.
const HD_RUNG_SHEET = "HD_RUNG";
const HD_RUNG_TIEU_DE = { ID_HD: "ID_KEY_HD", KL_DU_KIEN: "KhoiLuongDuKien" };
const HDNCC_COL = { SO_HD: 0, NGAY_KY: 1, HO_TEN: 2, CCCD: 3, NGUOI_UQ: 4, UY_QUYEN_TT: 5, SL_DU_KIEN: 6, TINH_TRANG: 7 };
const HDNCC_MIRROR_HEADER = ["Số HĐ", "Ngày Ký", "Họ Tên", "CCCD", "Người Được Ủy Quyền", "Ủy Quyền TT", "SL Dự Kiến", "Tình Trạng"];

const HDSTK_SRC_COL = { HO_TEN: 2, CCCD: 3, NGUOI_UQ: 4, STK: 5, NGAN_HANG: 6, SO_HD: 8 };
const HDSTK_COL = { HO_TEN: 0, CCCD: 1, NGUOI_UQ: 2, STK: 3, NGAN_HANG: 4, SO_HD: 5 };
const HDSTK_MIRROR_HEADER = ["Họ Tên", "CCCD", "Người Được Ủy Quyền", "STK", "Ngân Hàng", "Số HĐ"];
// SỬA (mục 11 - xác nhận từ người dùng): "Nguồn Gốc" đúng là CỘT O
// (index 14), không phải 10 như code cũ - đã sửa lại đúng.
// MỚI (mục 11): các cột GIO_CAN_1/CAN_LAN_1/NGAY_CAN_2/GIO_CAN_2/
// CAN_LAN_2/MAT_HANG là SUY ĐOÁN dựa theo cấu trúc phiếu cân điển hình
// (chưa được xác nhận trực tiếp như NGUON_GOC/DAI_LY) - NẾU báo cáo
// "Chi Tiết Công Nợ theo Phiếu Cân" hiển thị sai giờ cân/mặt hàng, cho
// tôi biết đúng số cột (đếm từ A=0) để sửa lại chỉ 1 dòng này.
// SỬA (XÁC NHẬN TỪ NGƯỜI DÙNG): Cân lần 1 = cột H (index 7), Cân lần 2
// = cột I (index 8) - ĐÃ ĐÚNG. Việc này làm vỡ giả định thứ tự cột ban
// đầu của tôi (Giờ cân 1/2, Ngày cân 2, Mặt hàng) - các cột đó VẪN CÒN
// LÀ SUY ĐOÁN CHƯA XÁC NHẬN, có thể đang sai (không ảnh hưởng số tiền,
// chỉ ảnh hưởng hiển thị Giờ cân/Mặt hàng) - báo tôi đúng vị trí (đếm
// từ A=0) nếu thấy hiển thị sai, để sửa lại chỉ 1 dòng.
// XÁC NHẬN TỪ NGƯỜI DÙNG (ảnh chụp thật PhieuCan_DN): A=Số phiếu(0),
// B=Ngày cân 1(1), C=Giờ cân 1(2), D=Ngày cân 2(3), E=Giờ cân 2(4),
// F=Biển số 1(5), G=Biển số 2(6), H=Cân lần 1(7), I=Cân lần 2(8),
// J=KL hàng/KL_KG(9). Mặt hàng/Khách hàng/Đại lý/Nguồn gốc vẫn theo vị
// trí cũ (11,12,13,14 - Đại lý/Nguồn gốc đã xác nhận đúng qua báo cáo
// đang chạy tốt; Mặt hàng/Khách hàng CHƯA xác nhận, báo tôi nếu sai).
// Chỉ khai báo cột code THẬT SỰ dùng: hệ thống chỉ đọc các cột này (xem
// PC_COT_CAN_DOC) - dùng cột mới thì thêm vào đây, không viết số cột trần.
const PC_COL = {
  SO_PHIEU: 0, NGAY_CAN_1: 1, GIO_CAN_1: 2, GIO_CAN_2: 4,
  BIEN_SO_1: 5, CAN_LAN_1: 7, CAN_LAN_2: 8, KL_KG: 9, MAT_HANG: 12,
  KHACH_HANG: 11, DAI_LY: 13, NGUON_GOC: 14, GIAM_GIA: 17, DON_GIA_AD: 19,
  SO_CT: 22, DON_GIA_TC: 23, TRANG_THAI: 24, THANH_TIEN: 25, ID_DNTT: 26, CHON_TT: 27
};

// MỚI (mục AH - tối ưu tốc độ): giới hạn số CỘT thật sự cần dùng khi
// mirror Phiếu Cân vào File Nháp - nguồn PhieuCan_DN có thể có thêm cột
// về sau không dùng tới, mirror TOÀN BỘ cột đó là tải/lưu dư thừa không
// cần thiết. Lấy đúng bằng (chỉ số CỘT LỚN NHẤT tham chiếu ở PC_COL) + 1.
// (HD_NCC/HD_STK giờ dùng cách trích xuất CHÍNH XÁC từng cột cần - xem
// HDNCC_SRC_COL/HDSTK_SRC_COL ở trên - gọn hơn nữa vì không cần "cõng"
// theo các cột nằm GIỮA những cột cần dùng.)
// Tên khách hàng CHUNG trên phiếu cân (không phải 1 chủ rừng cụ thể), đã qua utils.standardize().
// standardize() giữ nguyên dấu tiếng Việt ("Khách lẻ" -> "KHÁCHLẺ") nên phải có cả dạng có dấu.
const TEN_KHACH_CHUNG = new Set(["KH", "KL", "KHACHLE", "KHÁCHLẺ"]);
const PC_MIRROR_COLS = 28;    // 0..27 (PC_COL.CHON_TT)
const PC_ID_DNTT_DA_TRA = "Đóng TT"; // giá trị cột ID_DNTT khi phiếu cân đã được Duyệt thanh toán
// Cột PhieuCan_DN được đọc (0-based, tăng dần); cột không dùng để trống.
const PC_COT_CAN_DOC = Array.from(new Set(Object.values(PC_COL))).sort((a, b) => a - b);

// ============================================================
// MỚI (mục N - tối ưu tốc độ): LỚP CACHE cho 3 sheet tham chiếu
// (HD_NCC, HD_STK, PhieuCan_DN) - vốn được đọc lại RẤT NHIỀU LẦN trong
// cùng 1 phiên làm việc (mỗi bước chọn ở "Tạo ĐNTT" đều cần tra cứu)
// nhưng dữ liệu thay đổi không thường xuyên.
//
// AN TOÀN VỚI KIỂU DATE: CacheService chỉ lưu được chuỗi (string), nếu
// JSON.stringify trực tiếp thì các ô kiểu Date sẽ bị biến thành chuỗi
// ISO và MẤT kiểu Date khi đọc lại (làm hỏng mọi chỗ dùng `instanceof
// Date` trong code, vd lọc theo thời gian). Vì vậy trước khi lưu cache,
// mỗi ô Date được bọc thành {__d: <timestamp>}, và khi đọc lại từ cache
// sẽ được dựng lại đúng thành đối tượng Date như ban đầu.
//
// AN TOÀN VỚI SHEET LỚN: CacheService giới hạn ~100KB/khóa. Nếu dữ liệu
// vượt ngưỡng, hàm chỉ đơn giản BỎ QUA việc lưu cache (không throw lỗi,
// không chặn luồng chính) - hệ thống vẫn chạy đúng, chỉ là không được
// tăng tốc cho riêng sheet đó.
//
// THỜI GIAN SỐNG (TTL) ngắn (90 giây) để hạn chế độ trễ dữ liệu nếu ai
// đó sửa tay trực tiếp trong HD_NCC/HD_STK/PhieuCan_DN ở nơi khác.
// ============================================================
const REF_CACHE_TTL_SECONDS = 90;
// SỬA LỖI NGHIÊM TRỌNG (theo yêu cầu - "hơn 10K dòng"): CacheService của
// Google Apps Script giới hạn MỖI GIÁ TRỊ tối đa ~100KB - với dữ liệu
// lớn (PhieuCan_DN >10.000 dòng), bản JSON serialize CHẮC CHẮN vượt xa
// giới hạn này, khiến cache CŨ (1 khối duy nhất) LUÔN thất bại ÂM THẦM
// (bỏ qua không lưu) - nghĩa là với dữ liệu lớn, cache CHƯA TỪNG THỰC SỰ
// hoạt động, mọi lệnh gọi đều phải đọc lại từ đầu file ngoài dù có "cơ
// chế cache". Giờ CHIA NHỎ dữ liệu thành nhiều "mảnh" (mỗi mảnh dưới
// giới hạn), lưu qua cache.putAll() (nhiều key cùng lúc) - đọc lại bằng
// cache.getAll() rồi ghép nối. Giới hạn tối đa MAX_CHUNKS mảnh (đủ cho
// ~vài chục nghìn dòng) - nếu VẪN vượt quá, bỏ qua cache như cũ (không
// chặn luồng chính, chỉ mất phần tăng tốc).
const REF_CACHE_CHUNK_BYTES = 90000; // mỗi mảnh tối đa 90KB (chừa margin dưới giới hạn ~100KB của CacheService)
const REF_CACHE_MAX_CHUNKS = 40; // ~3.6MB dữ liệu thô tối đa - đủ cho vài chục nghìn dòng Phiếu Cân

function _serializeRowsForCache_(rows) {
  return rows.map(row => row.map(cell => (cell instanceof Date) ? { __d: cell.getTime() } : cell));
}
function _deserializeRowsFromCache_(rows) {
  return rows.map(row => row.map(cell =>
    (cell && typeof cell === "object" && cell.__d !== undefined) ? new Date(cell.__d) : cell
  ));
}

/** Dữ liệu tham chiếu đã đọc trong LƯỢT CHẠY hiện tại (1 lần bấm trên web / 1 lần trigger
 * chạy = 1 lượt, biến toàn cục mới). Sổ lớn hơn giới hạn bộ nhớ đệm của Google (~3,6 MB,
 * vd Phiếu Cân 1 năm) trước đây bị đọc lại ở mỗi bước của cùng 1 lượt. Xóa cùng lúc với
 * bộ nhớ đệm (_invalidateChunkedCache_) khi sổ được ghi; trả bản sao từng dòng để nơi gọi
 * sửa dòng không ảnh hưởng nơi khác. */
const _DA_DOC_TRONG_LUOT_ = new Map();
function _banSaoDong_(data) {
  return Array.isArray(data) ? data.map(r => Array.isArray(r) ? r.slice() : r) : data;
}
/** Đọc 1 lần trong lượt chạy: đã có thì trả bản sao, chưa có thì gọi docFn rồi nhớ lại. */
function _docTrongLuot_(khoa, docFn) {
  if (!_DA_DOC_TRONG_LUOT_.has(khoa)) _DA_DOC_TRONG_LUOT_.set(khoa, docFn());
  return _banSaoDong_(_DA_DOC_TRONG_LUOT_.get(khoa));
}
/** Nhớ dữ liệu vừa đọc thẳng sổ (bản mới nhất) cho các bước sau của cùng lượt chạy. */
function _ghiNhoTrongLuot_(khoa, data) {
  _DA_DOC_TRONG_LUOT_.set(khoa, _banSaoDong_(data));
}
function _getCachedRefData_(cacheKey, fetchFn, ttlGiay) {
  return _docTrongLuot_(cacheKey, () => _getCachedRefDataQuaBoNhoDem_(cacheKey, fetchFn, ttlGiay));
}
function _getCachedRefDataQuaBoNhoDem_(cacheKey, fetchFn, ttlGiay) {
  const cache = CacheService.getScriptCache();
  try {
    const metaRaw = cache.get(cacheKey + "_meta");
    if (metaRaw) {
      const meta = JSON.parse(metaRaw);
      const chunkKeys = [];
      for (let i = 0; i < meta.n; i++) chunkKeys.push(cacheKey + "_c" + i);
      const chunkMap = cache.getAll(chunkKeys); // 1 lượt gọi lấy TẤT CẢ mảnh cùng lúc, không phải N lượt riêng lẻ
      let full = "";
      let du = true;
      for (let i = 0; i < meta.n; i++) {
        const c = chunkMap[cacheKey + "_c" + i];
        if (c === null || c === undefined) { du = false; break; } // thiếu mảnh (hết hạn giữa chừng...) -> coi như cache miss, đọc lại
        full += c;
      }
      if (du && full) return _deserializeRowsFromCache_(JSON.parse(full));
    }
  } catch (e) {
    // Lỗi đọc cache (hỏng dữ liệu, hết hạn giữa chừng...) -> đọc trực
    // tiếp từ sheet, không chặn luồng chính.
  }

  const data = fetchFn();

  try {
    const serialized = JSON.stringify(_serializeRowsForCache_(data));
    const n = Math.ceil(serialized.length / REF_CACHE_CHUNK_BYTES);
    if (n > 0 && n <= REF_CACHE_MAX_CHUNKS) {
      const toPut = {};
      for (let i = 0; i < n; i++) {
        toPut[cacheKey + "_c" + i] = serialized.substr(i * REF_CACHE_CHUNK_BYTES, REF_CACHE_CHUNK_BYTES);
      }
      cache.putAll(toPut, ttlGiay || REF_CACHE_TTL_SECONDS);
      cache.put(cacheKey + "_meta", JSON.stringify({ n }), ttlGiay || REF_CACHE_TTL_SECONDS);
    }
    // Nếu vượt cả ngưỡng chia mảnh (dữ liệu QUÁ lớn): bỏ qua cache cho
    // lượt này, vẫn trả dữ liệu vừa đọc - không chặn luồng chính.
  } catch (e) {
    // Lỗi serialize (hiếm) -> bỏ qua cache, không chặn luồng chính.
  }

  return data;
}

/** Xóa cache PhieuCan_DN ngay sau khi hệ thống ghi đè trạng thái/khóa
 * phiếu cân (vd khi Chốt Thanh Toán) - tránh hiển thị "còn khả dụng"
 * cho phiếu cân vừa bị khóa trong lúc cache còn hạn. */
/** Xóa TOÀN BỘ các mảnh cache của 1 cacheKey (không chỉ 1 key như bản
 * cũ - vì giờ dữ liệu lớn được chia thành nhiều mảnh, xem
 * _getCachedRefData_()). Đọc "_meta" để biết số mảnh cần xóa; nếu
 * không có meta (dữ liệu nhỏ, hoặc cache đã hết hạn), vẫn thử xóa key
 * gốc (tương thích ngược) - không gây lỗi nếu key không tồn tại. */
function _invalidateChunkedCache_(cacheKey) {
  _DA_DOC_TRONG_LUOT_.delete(cacheKey);
  try {
    const cache = CacheService.getScriptCache();
    const metaRaw = cache.get(cacheKey + "_meta");
    const keysToRemove = [cacheKey, cacheKey + "_meta"];
    if (metaRaw) {
      const meta = JSON.parse(metaRaw);
      for (let i = 0; i < meta.n; i++) keysToRemove.push(cacheKey + "_c" + i);
    }
    cache.removeAll(keysToRemove);
  } catch (e) { /* không chặn luồng chính nếu xóa cache lỗi */ }
}
function _invalidatePcCache_() {
  _invalidateChunkedCache_("pc_data_v1");
}

// ============================================================
// MỚI (mục Y - tối ưu tốc độ): MIRROR HD_NCC / HD_STK vào File Nháp
// ------------------------------------------------------------
// Trước đây _hdNccData_()/_hdStkData_() dùng CacheService (giới hạn
// ~95KB/khóa) - nếu HD_NCC/HD_STK có nhiều dòng, dữ liệu serialize vượt
// ngưỡng này thì CACHE KHÔNG BAO GIỜ KÍCH HOẠT ĐƯỢC, khiến MỌI lần gọi
// (kể cả gõ từng ký tự ở ô "Họ tên chủ rừng") đều phải mở lại file HD_NCC
// ngoài từ đầu - đây là nguyên nhân chính gây chậm khi chọn hợp đồng.
// GIẢI PHÁP: mirror TOÀN BỘ (không lọc trạng thái, giữ đủ dữ liệu cho các
// hàm cần lịch sử/công nợ) HD_NCC và HD_STK vào 2 sheet ngay trong File
// Nháp (CFG.DRAFT_HDNCC_SHEET / CFG.DRAFT_HDSTK_SHEET) - không bị giới
// hạn dung lượng như CacheService. Làm mới bằng nút "↻ Làm mới" (Danh
// Sách ĐNTT), mục Cài Đặt, hoặc tự động mỗi ngày 7:30 & 13:00 (mục AA/AB).
// ============================================================
function getHdNccCacheSheet_() {
  const { ss } = getDraftSheets_();
  let sh = ss.getSheetByName(CFG.DRAFT_HDNCC_SHEET);
  if (!sh) sh = ss.insertSheet(CFG.DRAFT_HDNCC_SHEET);
  return sh;
}
function getHdStkCacheSheet_() {
  const { ss } = getDraftSheets_();
  let sh = ss.getSheetByName(CFG.DRAFT_HDSTK_SHEET);
  if (!sh) sh = ss.insertSheet(CFG.DRAFT_HDSTK_SHEET);
  return sh;
}

/** Quét TOÀN BỘ HD_NCC thật, CHỈ giữ lại hợp đồng "Đang Thực Hiện" rồi
 * ghi đè mirror trong File Nháp (theo đúng yêu cầu: HD_NCC/HD_STK CHỈ
 * tải lên Draft những hợp đồng "Đang Thực Hiện" - gọn & nhanh hơn cho
 * bước chọn ở "Tạo Mới"). Trả về cả Set "Số HĐ" đang hoạt động để lọc
 * HD_STK tương ứng (HD_STK không có cột trạng thái riêng, phải suy ra
 * từ HD_NCC qua Số HĐ). */
const HD_TRANG_THAI_DANG_THUC_HIEN = utils.standardize("Đang Thực Hiện");

/** Khối lượng dự kiến theo hợp đồng = tổng KhoiLuongDuKien các lô rừng (HD_RUNG), khóa
 * ID_HD. SỬA LỖI (người dùng báo 28/09/2026 - HĐ ông Bình mới tạo không có khối lượng
 * dự kiến khi làm thanh toán): app Hợp Đồng chỉ ghi KL dự kiến vào các lô rừng (+ bảng
 * ct_hopdong), cột Z "SL_Dự kiến" của HD_NCC để 0 với hợp đồng tạo trên app; chính
 * app Hợp Đồng cũng lấy tổng lô rừng trước, cột Z sau. Không có sheet -> Map rỗng. */
function _klDuKienTheoIdHD_() {
  const dong = _getCachedRefData_("hdrung_kl_v1", () => {
    const sh = SpreadsheetApp.openById(CFG.HD_SS_ID).getSheetByName(HD_RUNG_SHEET);
    if (!sh || sh.getLastRow() < 2) return [];
    const data = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn()).getValues();
    const tieuDe = data[0].map(v => String(v || "").trim());
    const cId = tieuDe.indexOf(HD_RUNG_TIEU_DE.ID_HD), cKl = tieuDe.indexOf(HD_RUNG_TIEU_DE.KL_DU_KIEN);
    if (cId < 0 || cKl < 0) return [];
    return data.slice(1).map(r => [String(r[cId] || "").trim(), utils.parseNum(r[cKl])]).filter(r => r[0]);
  });
  const tong = new Map();
  dong.forEach(([id, kl]) => { const k = utils.standardize(id); tong.set(k, (tong.get(k) || 0) + kl); });
  return tong;
}
/** SL dự kiến của 1 dòng HD_NCC GỐC: tổng lô rừng nếu có (> 0), không thì cột Z. */
function _slDuKienHopDong_(rGoc, klTheoIdHD) {
  const tongLo = klTheoIdHD.get(utils.standardize(rGoc[HDNCC_SRC_COL.ID_HD])) || 0;
  return tongLo > 0 ? tongLo : utils.parseNum(rGoc[HDNCC_SRC_COL.SL_DU_KIEN]);
}
function refreshHdNccCache_() {
  const shSrc = openExternalSheet_(CFG.HD_SS_ID, "HD_NCC", "Hợp Đồng NCC");
  const lastRow = shSrc.getLastRow();
  const lastColSrc = shSrc.getLastColumn();
  // Đọc TOÀN BỘ 1 lần (1 lượt gọi API duy nhất, rẻ hơn nhiều lần gọi rời
  // rạc), rồi chỉ TRÍCH XUẤT đúng 8 cột cần dùng ở bước dưới - giảm mirror
  // từ 31 cột xuống còn 8 cột thật sự dùng tới.
  const allRaw = lastRow > 1 ? shSrc.getRange(2, 1, lastRow - 1, lastColSrc).getValues() : [];
  _invalidateChunkedCache_("hdrung_kl_v1"); // làm mới cùng lúc với HD_NCC
  const klTheoIdHD = _klDuKienTheoIdHD_();
  // SỬA LỖI NGHIÊM TRỌNG (rà soát phát hiện - "Số tài khoản/CCCD/Số HĐ
  // mất số 0 đầu"): "Số HĐ"/"CCCD" đọc thẳng từ HD_NCC gốc rồi ghi vào
  // mirror KHÔNG có dấu ' bảo vệ - nếu giá trị gốc là chuỗi số có số 0
  // đầu, ghi vào ô đang ở định dạng "Tự động" sẽ bị Google Sheets tự
  // hiểu lại thành SỐ, mất số 0 đầu NGAY TẠI ĐÂY. Thêm dấu ' + khóa định
  // dạng TEXT trước khi ghi (xem _ghiLaiMirror_) để chặn đứt tại khâu này.
  const allCompact = allRaw.map(r => [
    "'" + String(r[HDNCC_SRC_COL.SO_HD] || "").replace(/'/g, ""), r[HDNCC_SRC_COL.NGAY_KY], r[HDNCC_SRC_COL.HO_TEN],
    _chu_(_chuanHoaCCCD_(r[HDNCC_SRC_COL.CCCD])),
    r[HDNCC_SRC_COL.NGUOI_UQ], r[HDNCC_SRC_COL.UY_QUYEN_TT], _slDuKienHopDong_(r, klTheoIdHD), r[HDNCC_SRC_COL.TINH_TRANG]
  ]);

  const active = allCompact.filter(r => utils.standardize(String(r[HDNCC_COL.TINH_TRANG] || "")) === HD_TRANG_THAI_DANG_THUC_HIEN);

  _ghiLaiMirror_(getHdNccCacheSheet_(), HDNCC_MIRROR_HEADER, active, [1, 4]); // Số HĐ(1), CCCD(4)
  CacheService.getScriptCache().remove("hdncc_data_v1"); // dọn cache kiểu cũ (tên khác) nếu còn sót
  _invalidateChunkedCache_("hdncc_full_data_v1"); // SỬA: dữ liệu HD_NCC vừa làm mới - xóa luôn cache "đầy đủ" (dùng cho export/UNC) để không hiển thị dữ liệu cũ

  const activeSoHDSet = new Set(active.map(r => utils.standardize(r[HDNCC_COL.SO_HD])));
  return { count: active.length, total: allRaw.length, activeSoHDSet };
}

/** Tương tự cho HD_STK - CHỈ giữ dòng có "Số HĐ" thuộc tập hợp đồng
 * "Đang Thực Hiện" (activeSoHDSet lấy từ refreshHdNccCache_() - nếu
 * không truyền vào, tự tính lại từ mirror HD_NCC hiện có). */
function refreshHdStkCache_(activeSoHDSet) {
  const shSrc = openExternalSheet_(CFG.HD_SS_ID, CFG.HD_STK_SHEET, "Hợp Đồng NCC (HD_STK)");
  const lastRow = shSrc.getLastRow();
  const lastColSrc = shSrc.getLastColumn();
  const allRaw = lastRow > 1 ? shSrc.getRange(2, 1, lastRow - 1, lastColSrc).getValues() : [];
  // SỬA LỖI NGHIÊM TRỌNG (rà soát phát hiện - "Số tài khoản mất số 0
  // đầu khi tạo UNC"): giống hệt lý do ở refreshHdNccCache_() - "STK"/
  // "CCCD"/"Số HĐ" ghi vào mirror KHÔNG có dấu ' bảo vệ - ô
  // đang "Tự động" sẽ tự hiểu STK trông giống số thành SỐ THẬT, mất số
  // 0 đầu NGAY TẠI ĐÂY. Đây CHÍNH LÀ nguồn STK cho gợi ý tự động lúc
  // "Tạo Mới"/"Sửa" 112 - 1 khi đã mất số 0 ở mirror này, mọi hồ sơ chọn
  // theo gợi ý đó (và UNC tạo ra sau đó) đều mang theo số đã sai, KHÔNG
  // liên quan gì tới cách HD_STK gốc lưu đúng hay sai.
  const allCompact = allRaw.map(r => [
    r[HDSTK_SRC_COL.HO_TEN], _chu_(_chuanHoaCCCD_(r[HDSTK_SRC_COL.CCCD])), r[HDSTK_SRC_COL.NGUOI_UQ],
    "'" + String(r[HDSTK_SRC_COL.STK] || "").replace(/'/g, ""), r[HDSTK_SRC_COL.NGAN_HANG],
    "'" + String(r[HDSTK_SRC_COL.SO_HD] || "").replace(/'/g, "")
  ]);

  const soHDSet = activeSoHDSet || new Set(_hdNccData_().map(r => utils.standardize(r[HDNCC_COL.SO_HD])));
  const active = allCompact.filter(r => soHDSet.has(utils.standardize(r[HDSTK_COL.SO_HD])));

  _ghiLaiMirror_(getHdStkCacheSheet_(), HDSTK_MIRROR_HEADER, active, [2, 4, 6]); // CCCD(2), STK(4), Số HĐ(6)
  CacheService.getScriptCache().remove("hdstk_data_v1");
  _invalidateChunkedCache_("hdstk_full_data_v1"); // SỬA: tương tự HD_NCC ở trên
  return { count: active.length, total: allRaw.length };
}

/** Dữ liệu HD_NCC ĐÃ LỌC "Đang Thực Hiện" (đọc từ mirror - nhanh) - dùng
 * cho MỌI thao tác thuộc luồng "Tạo Mới" (gợi ý Chủ rừng/Số HĐ/Người
 * nhận, tóm lược hợp đồng cho hợp đồng ĐANG chọn...). */
function _hdNccData_() {
  const sh = getHdNccCacheSheet_();
  let lastRow = sh.getLastRow();
  if (lastRow < 2) { refreshHdNccCache_(); lastRow = sh.getLastRow(); } // trống -> tự làm mới 1 lần
  return lastRow > 1 ? sh.getRange(2, 1, lastRow - 1, sh.getLastColumn()).getValues() : [];
}
/** Tương tự cho HD_STK (đã lọc theo hợp đồng "Đang Thực Hiện"). */
function _hdStkData_() {
  const sh = getHdStkCacheSheet_();
  let lastRow = sh.getLastRow();
  if (lastRow < 2) { refreshHdStkCache_(); lastRow = sh.getLastRow(); }
  return lastRow > 1 ? sh.getRange(2, 1, lastRow - 1, sh.getLastColumn()).getValues() : [];
}

// ============================================================
// MỚI (mục Z): DỮ LIỆU HD_NCC/HD_STK ĐẦY ĐỦ (KHÔNG lọc trạng thái)
// ------------------------------------------------------------
// _hdNccData_()/_hdStkData_() ở trên giờ CHỈ còn hợp đồng "Đang Thực
// Hiện" (để luồng "Tạo Mới" nhanh) - nhưng Công Nợ/Báo Cáo
// (getDebtByContract_) và các thao tác vá dữ liệu LỊCH SỬ
// (runFillMissingBankOnly) BẮT BUỘC cần TOÀN BỘ hợp đồng, kể cả "Đã
// Thanh lý"/"Đã Hủy" - nếu không sẽ MẤT hợp đồng đã xong khỏi báo cáo.
// 2 hàm dưới đây đọc TRỰC TIẾP từ file ngoài (không qua mirror) - CHẤP
// NHẬN chậm hơn cho các thao tác không thường xuyên này (đúng như đã
// thống nhất: "báo cáo lâu cũng được").
// ============================================================
/**
 * MỚI (rà soát bổ sung - tối ưu tốc độ): CT/DNTT_GK_DN/112 THẬT đang bị
 * đọc TRỰC TIẾP KHÔNG CACHE ở NHIỀU nơi (gợi ý tự động Mở Đóng Thanh
 * Toán, Đối Soát, Bảo Trì) - mỗi nơi tự đọc lại từ đầu dù dữ liệu y hệt
 * vừa đọc vài giây trước. Thêm cache DÙNG CHUNG (90 giây) CHỈ áp dụng
 * cho các chỗ THUẦN ĐỌC/TÌM KIẾM (gợi ý, chẩn đoán) - các hàm THỰC THI
 * xóa/sửa dữ liệu (webMoDongThanhToanTheoHoSo_, webDongBoTenKhachHang_...) vẫn
 * đọc TRỰC TIẾP KHÔNG QUA CACHE như cũ, đảm bảo luôn thao tác trên dữ
 * liệu MỚI NHẤT, không bị lệch do cache.
 */
function _ctThatDataCache_() {
  return _getCachedRefData_("ct_that_data_v1", _ctThatDocThang_);
}
/** Sheet sổ đã chốt đang mở (DNTT_GK_DN_CT, File Chính). */
function _shCtThat_() {
  return getMainSs_().getSheetByName(CFG.DNTT_CT);
}
/** CT thật đọc thẳng sheet (không qua cache). */
function _ctThatDocThang_() {
  // "Đọc thẳng" = không dùng bộ nhớ đệm giữa các lượt; trong CÙNG lượt, bản đã đọc là bản
  // mới nhất (mọi chỗ ghi sổ CT đều xóa bản nhớ ngay sau khi ghi) -> dùng lại, không đọc lần 2.
  return _docTrongLuot_("ct_that_data_v1", () => {
    const shCT = _shCtThat_();
    const lr = shCT ? shCT.getLastRow() : 0;
    return lr > 1 ? shCT.getRange(2, 1, lr - 1, 22).getValues() : [];
  });
}
function _srcThatDataCache_() {
  return _getCachedRefData_("src_that_data_v1", () => {
    const ss = getMainSs_();
    const shSrc = ss.getSheetByName(CFG.DNTT_SRC);
    if (!shSrc) return [];
    const lr = shSrc.getLastRow();
    return lr > 1 ? shSrc.getRange(2, 1, lr - 1, 18).getValues() : [];
  });
}
function _h112ThatDataCache_() {
  return _getCachedRefData_("h112_that_data_v1", () => {
    const ss = getMainSs_();
    const sh112 = ss.getSheetByName(CFG.DNTT_112);
    if (!sh112) return [];
    const lr = sh112.getLastRow();
    return lr > 1 ? sh112.getRange(2, 1, lr - 1, 23).getValues() : [];
  });
}
/** Xóa cả 3 cache trên - gọi ngay sau khi Đóng Thanh Toán / Mở Đóng
 * Thanh Toán (bất cứ thao tác nào làm THAY ĐỔI CT/Src/112 thật) để lần
 * đọc tiếp theo (gợi ý, chẩn đoán) không hiện dữ liệu cũ. */
function _invalidateCtSrc112Cache_() {
  _invalidateChunkedCache_("ct_that_data_v1");
  _invalidateChunkedCache_("src_that_data_v1");
  _invalidateChunkedCache_("h112_that_data_v1");
}

function _hdNccFullData_() {
  return _getCachedRefData_("hdncc_full_data_v1", () => {
    const sh = openExternalSheet_(CFG.HD_SS_ID, "HD_NCC", "Hợp Đồng NCC");
    const lr = sh.getLastRow();
    return lr > 1 ? sh.getRange(2, 1, lr - 1, sh.getLastColumn()).getValues() : [];
  });
}
function _hdStkFullData_() {
  return _getCachedRefData_("hdstk_full_data_v1", () => {
    const sh = openExternalSheet_(CFG.HD_SS_ID, CFG.HD_STK_SHEET, "Hợp Đồng NCC (HD_STK)");
    const lr = sh.getLastRow();
    return lr > 1 ? sh.getRange(2, 1, lr - 1, sh.getLastColumn()).getValues() : [];
  });
}

/** Làm mới CẢ 3 cache (Phiếu Cân chưa TT + HD_NCC + HD_STK, đã lọc
 * "Đang Thực Hiện") trong 1 lần gọi - dùng cho nút "Làm mới" và Trigger
 * tự động. */
function refreshAllDraftCaches_() {
  const pc = refreshPhieuCanUnpaidCache_();
  const hdNccRes = refreshHdNccCache_();
  const hdStkRes = refreshHdStkCache_(hdNccRes.activeSoHDSet);
  logAction_("REFRESH_ALL_CACHE", "-",
    `PC chưa TT: ${pc} · HD_NCC: ${hdNccRes.count}/${hdNccRes.total} (Đang Thực Hiện) · HD_STK: ${hdStkRes.count}/${hdStkRes.total}.`);
  return { pc, hdNcc: hdNccRes.count, hdNccTotal: hdNccRes.total, hdStk: hdStkRes.count, hdStkTotal: hdStkRes.total };
}


/**
 * MỚI (mục AA/AB): hàm chạy nền DUY NHẤT theo lịch cố định 7:30 sáng &
 * 13:00 chiều hàng ngày (setupPcCacheAutoRefreshTrigger_()) - làm mới
 * TẤT CẢ: cache Phiếu Cân/HD_NCC/HD_STK (mục Y), tiến độ hợp đồng (mục
 * AA), và snapshot Công Nợ theo khoảng mặc định 3 tháng (mục AB).
 */
// ============================================================
// MỚI (mục 11 - chạy nền 15h hàng ngày): PHÂN TÍCH NHẬP & THANH TOÁN
// THEO NGUỒN GỐC / ĐẠI LÝ
// ------------------------------------------------------------
// Lưu dạng DÀI (mỗi dòng = 1 ngày + 1 hạng mục) vào CFG.DRAFT_PHANTICH_SHEET.
// Khi xuất báo cáo (getPhanTichNhapTTReport_/exportPhanTichNhapTTExcel),
// dữ liệu được PIVOT thành bảng (ngày làm dòng, NG/ĐL làm cột) - dễ bảo
// trì hơn nhiều so với tự phình cột trong sheet mỗi khi có NG/ĐL mới.
// ============================================================
const PHANTICH_HEADERS = ["Ngày", "Loại", "PhanLoai", "Ten", "KhoiLuongKg", "GiaTri"];

/** Khóa cứng 1 hoặc nhiều cột thành định dạng TEXT thuần (@) - chống
 * Google Sheets tự "thông minh hóa" chuỗi giống ngày/giờ thành Date/Time
 * thật. Dùng chung cho cả lúc TẠO sheet mới lẫn lúc CHỦ ĐỘNG SỬA LẠI
 * định dạng cho sheet ĐÃ TỒN TẠI trước đó (qua các hàm "Xóa Sạch & Nạp
 * Lại" - vì sheet cũ có thể đã bị Sheets tự chuyển sai định dạng từ
 * trước khi có sửa lỗi này). */
function _forcePlainTextCols_(sh, startCol, numCols) {
  sh.getRange(1, startCol, Math.max(sh.getMaxRows(), 1000), numCols || 1).setNumberFormat("@");
}

function getPhanTichCacheSheet_() {
  const { ss } = getDraftSheets_();
  let sh = ss.getSheetByName(CFG.DRAFT_PHANTICH_SHEET);
  if (!sh) {
    sh = ss.insertSheet(CFG.DRAFT_PHANTICH_SHEET);
    sh.getRange(1, 1, 1, PHANTICH_HEADERS.length).setValues([PHANTICH_HEADERS]).setFontWeight("bold").setBackground("#d9d2e9");
    sh.setFrozenRows(1);
    // SỬA LỖI (định dạng ngày sai): Google Sheets TỰ ĐỘNG "thông minh hóa"
    // chuỗi text kiểu ngày ("2026-07-14") thành Date THẬT khi ghi qua
    // setValues() nếu cột đang ở định dạng "Tự động" - làm lộn xộn định
    // dạng hiển thị (vd "7/14/2026") và khiến các lần đọc/ghi lại sau đó
    // (dedupe, tổng hợp thêm...) vô tình lấy về Date object thay vì chuỗi
    // gốc, gây ra các dòng rác toàn số 0. Khóa CỨNG cột A thành TEXT thuần
    // - định dạng vẫn giữ nguyên về sau vì mọi chỗ ghi dữ liệu đều dùng
    // clearContent() (chỉ xóa giá trị) thay vì clear() (xóa cả định dạng).
    _forcePlainTextCols_(sh, 1, 1);
  }
  return sh;
}

/** Đọc an toàn giá trị cột "Ngày" từ sheet - nếu dữ liệu CŨ đã lỡ bị
 * Google Sheets tự chuyển thành Date (trước khi có sửa lỗi ở trên), tự
 * định dạng lại đúng "yyyy-MM-dd" thay vì String() thô (String() trên
 * Date object ra chuỗi rác kiểu "Fri Jul 03 2026 00:00:00 GMT+..."). */
function _ngayCellToStr_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, "GMT+7", "yyyy-MM-dd");
  return String(v || "").trim();
}

/** Tính Nhập Gỗ Keo + Thanh Toán theo Nguồn Gốc/Đại Lý cho ĐÚNG 1 ngày
 * (ngayStr: "yyyy-MM-dd") - xóa dòng cũ của ngày đó (nếu chạy lại) rồi
 * ghi mới, đảm bảo idempotent (chạy lại nhiều lần không bị trùng).
 * SỬA (lỗi trùng lặp): trước đây KHÔNG khóa (lock) - nếu 2 người cùng
 * xem báo cáo (hoặc Trigger 15h trùng lúc ai đó đang xem) cùng lúc gọi
 * hàm này cho CÙNG 1 ngày, cả 2 đều đọc "chưa có dòng nào" rồi CÙNG ghi
 * thêm -> ra 2 bộ dòng trùng nhau cho đúng 1 ngày. Giờ khóa lại (chỉ 1
 * lượt ghi tại 1 thời điểm) để đảm bảo không trùng. */
/**
 * SỬA (tối ưu tốc độ - theo yêu cầu): trước đây tính TỪNG NGÀY MỘT, mỗi
 * ngày quét lại TOÀN BỘ Phiếu Cân + CT thật riêng - nếu thiếu 20-30 ngày
 * (đầu tháng) thì quét 20-30 lần, RẤT CHẬM. Giờ tính GỘP 1 LẦN DUY NHẤT
 * cho cả khoảng [fDate, tDate]: quét Phiếu Cân + CT thật ĐÚNG 1 LƯỢT,
 * gom theo TỪNG NGÀY trong lúc quét, rồi ghi tất cả các ngày cùng lúc.
 * Xóa dòng CŨ của TOÀN BỘ các ngày trong khoảng này trước khi ghi mới
 * (idempotent - chạy lại nhiều lần không trùng), KHÔNG đụng tới dữ liệu
 * của các ngày NGOÀI khoảng đang tính (đúng yêu cầu "chạy lại thì chỉ
 * chạy từ ngày đến ngày, không chạy lại hết").
 */
/**
 * SỬA (chính xác hơn theo yêu cầu "chỉ chạy đúng phần cần, không chạy
 * lại hết"): trước đây nhận vào [fDate, tDate] rồi tính lại NGUYÊN
 * KHOẢNG đó - nếu các ngày thiếu KHÔNG LIÊN TỤC (vd thiếu ngày 5,6 và
 * 10 nhưng ngày 7-9 đã có sẵn, đúng), hàm vẫn tính lại LUÔN CẢ ngày 7-9
 * dù không cần (vì [5,10] bao trùm). Giờ nhận vào ĐÚNG DANH SÁCH các
 * ngày cần tính (ngayList - không cần liên tục), vẫn CHỈ 1 lượt quét
 * Phiếu Cân + CT thật duy nhất (giữ nguyên lợi ích tốc độ), nhưng CHỈ
 * xóa/ghi đè ĐÚNG các ngày trong danh sách đó - các ngày khác (kể cả
 * nằm giữa) được giữ nguyên, không bị tính lại oan.
 */
function refreshPhanTichNhapTTChoDanhSachNgay_(ngayList) {
  let lock;
  try {
    lock = sysLock.acquire();
    return _refreshPhanTichNhapTTChoDanhSachNgayNoLock_(ngayList);
  } finally {
    if (lock) lock.releaseLock();
  }
}

/** Wrapper tiện dụng: tính cho CẢ 1 khoảng liên tục [fDate,tDate] (dùng
 * cho Trigger 15h - luôn muốn làm mới nguyên tháng - và cho "Xóa Sạch &
 * Nạp Lại" - không có khái niệm "ngày thiếu" để phân biệt). */
function refreshPhanTichNhapTTChoKhoang_(fDate, tDate) {
  const ngayList = [];
  const d = new Date(fDate + "T00:00:00");
  const end = new Date(tDate + "T00:00:00");
  while (d.getTime() <= end.getTime()) {
    ngayList.push(Utilities.formatDate(d, "GMT+7", "yyyy-MM-dd"));
    d.setDate(d.getDate() + 1);
  }
  return refreshPhanTichNhapTTChoDanhSachNgay_(ngayList);
}

/** duLieu (tùy chọn) = { pc, ct }: dòng PhieuCan_DN và CT thật nơi gọi đã có
 * sẵn (vd Duyệt vừa đọc) - không đọc lại lần 2. Chỉ dùng khi các ngày không
 * thuộc năm đã khóa sổ (khi đó phải đọc thêm file lưu trữ). */
function _refreshPhanTichNhapTTChoDanhSachNgayNoLock_(ngayList, duLieu) {
  const ngaySet = new Set(ngayList);
  const dsNgay = Array.from(ngaySet).sort();
  const tuNgay = dsNgay[0] || "", denNgay = dsNgay[dsNgay.length - 1] || "";
  const dungDuLieuSan = !!duLieu && !_namLuuTruTrongKhoang_(tuNgay, "").length;
  const dmNgMap = _getDmNgMap_();
  const pcMap = new Map(); // SO_CT -> {tenNG, tenDL} (dùng để tra khi gộp phần Thanh Toán)
  const byNgay = new Map(); // ngayStr -> { ngNhap:Map, dlNhap:Map, ngTT:Map, dlTT:Map, tongKLNhap, tongGiaTriNhap, tongKLTT, tongGiaTriTT }
  const ensureNgay = (ngay) => {
    if (!byNgay.has(ngay)) byNgay.set(ngay, {
      ngNhap: new Map(), dlNhap: new Map(), ngTT: new Map(), dlTT: new Map(),
      tongKLNhap: 0, tongGiaTriNhap: 0, tongKLTT: 0, tongGiaTriTT: 0
    });
    return byNgay.get(ngay);
  };
  const congDon = (map, key, kl, giaTri) => {
    const cur = map.get(key) || { kl: 0, giaTri: 0 };
    cur.kl += kl; cur.giaTri += giaTri;
    map.set(key, cur);
  };

  // 1 LƯỢT quét PhieuCan_DN cho ĐÚNG danh sách ngày cần (phần "Nhập")
  (dungDuLieuSan ? duLieu.pc : _pcGopLuuTru_(tuNgay, "")).forEach(r => {
    const soCT = String(r[PC_COL.SO_CT] || "").trim();
    const tenNG = _tenNguonGoc_(r[PC_COL.NGUON_GOC], dmNgMap);
    const tenDL = String(r[PC_COL.DAI_LY] || "").trim() || "(Chưa rõ ĐL)";
    if (soCT) pcMap.set(utils.standardize(soCT), { tenNG, tenDL });

    const ngayCan = r[PC_COL.NGAY_CAN_1];
    if (!(ngayCan instanceof Date)) return;
    const ngayStr = Utilities.formatDate(ngayCan, "GMT+7", "yyyy-MM-dd");
    if (!ngaySet.has(ngayStr)) return;

    const kl = utils.parseNum(r[PC_COL.KL_KG]);
    const giaTri = utils.parseNum(r[PC_COL.THANH_TIEN]);
    if (giaTri <= 0 && kl <= 0) return;

    const o = ensureNgay(ngayStr);
    congDon(o.ngNhap, tenNG, kl, giaTri);
    congDon(o.dlNhap, tenDL, kl, giaTri);
    o.tongKLNhap += kl; o.tongGiaTriNhap += giaTri;
  });

  // 1 LƯỢT quét CT thật cho ĐÚNG danh sách ngày cần (phần "Thanh Toán")
  try {
    (dungDuLieuSan ? duLieu.ct : _ctGopLuuTru_(tuNgay, denNgay, true)).forEach(r => {
      const ngayTT = r[20];
      if (!(ngayTT instanceof Date)) return;
      const ngayStr = Utilities.formatDate(ngayTT, "GMT+7", "yyyy-MM-dd");
      if (!ngaySet.has(ngayStr)) return;

      const key = utils.standardize(r[11]);
      const info = pcMap.get(key) || { tenNG: "(Chưa rõ NG)", tenDL: "(Chưa rõ ĐL)" };
      const kl = utils.parseNum(r[12]), giaTri = utils.parseNum(r[16]);

      const o = ensureNgay(ngayStr);
      congDon(o.ngTT, info.tenNG, kl, giaTri);
      congDon(o.dlTT, info.tenDL, kl, giaTri);
      o.tongKLTT += kl; o.tongGiaTriTT += giaTri;
    });
  } catch (e) {}

  // Đảm bảo MỌI ngày trong danh sách đều có ít nhất dòng "Tổng cộng" = 0
  // (kể cả ngày không có phát sinh gì) - để lần sau biết ngày đó ĐÃ tính
  // rồi, không phải tính lại (đúng ý "chạy lại chỉ chạy đúng phần cần").
  ngayList.forEach(ngay => ensureNgay(ngay));

  const rowsOut = [];
  byNgay.forEach((o, ngayStr) => {
    const pushGroup = (map, loai, phanLoai) => {
      map.forEach((v, ten) => rowsOut.push([ngayStr, loai, phanLoai, ten, v.kl, v.giaTri]));
    };
    pushGroup(o.ngNhap, "NHAP", "NG");
    pushGroup(o.dlNhap, "NHAP", "DL");
    rowsOut.push([ngayStr, "NHAP", "TONG", "Tổng cộng", o.tongKLNhap, o.tongGiaTriNhap]);
    pushGroup(o.ngTT, "THANHTOAN", "NG");
    pushGroup(o.dlTT, "THANHTOAN", "DL");
    rowsOut.push([ngayStr, "THANHTOAN", "TONG", "Tổng cộng", o.tongKLTT, o.tongGiaTriTT]);
  });

  const sh = getPhanTichCacheSheet_();
  const lastRow = sh.getLastRow();
  if (lastRow > 1) {
    const all = sh.getRange(2, 1, lastRow - 1, PHANTICH_HEADERS.length).getValues();
    // Bỏ dòng CŨ của ĐÚNG các ngày trong danh sách - GIỮ NGUYÊN dữ liệu
    // các ngày KHÁC (kể cả nằm xen giữa) - không chạy lại hết.
    const kept = all.filter(r => !ngaySet.has(_ngayCellToStr_(r[0])));
    _thayVungDuLieu_(sh, 2, PHANTICH_HEADERS.length, all.length, kept);
  }
  const startRow = sh.getLastRow() + 1;
  if (rowsOut.length) sh.getRange(startRow, 1, rowsOut.length, PHANTICH_HEADERS.length).setValues(_dongAnToan_(rowsOut));
  return { soNgay: byNgay.size, soDong: rowsOut.length };
}

/** Đọc + PIVOT dữ liệu đã tổng hợp trong khoảng [fDate,tDate] thành 4
 * bảng: Nhập theo NG, Nhập theo ĐL, Thanh Toán theo NG, Thanh Toán theo ĐL. */
/** Dòng PhanTichNhapTT_DRAFT trong [fDate, tDate]; ngày nào chưa từng tổng
 * hợp thì tính bù (1 lượt quét) rồi đọc lại. Dùng cho báo cáo Phân tích và
 * "tháng này" ở Trang chủ. */
function _docPhanTichTheoKhoang_(fDate, tDate) {
  const sh = getPhanTichCacheSheet_();
  let lastRow = sh.getLastRow();
  let all = lastRow > 1 ? sh.getRange(2, 1, lastRow - 1, PHANTICH_HEADERS.length).getValues() : [];

  // SỬA (tối ưu tốc độ - theo yêu cầu): nếu khoảng ngày đang xem có NGÀY
  // CHƯA từng được tổng hợp (vd đầu tháng tới hôm nay) -> tính bù CHỈ 1
  // LẦN cho GỘP CẢ KHOẢNG NGÀY THIẾU (không lặp lại từng ngày một như
  // trước - đây là nguyên nhân chính gây chậm khi thiếu nhiều ngày liền).
  const ngayDaCo = new Set(all.map(r => _ngayCellToStr_(r[0])));
  const tatCaNgayTrongKhoang = [];
  {
    const d = new Date(fDate + "T00:00:00");
    const end = new Date(tDate + "T00:00:00");
    while (d.getTime() <= end.getTime()) {
      tatCaNgayTrongKhoang.push(Utilities.formatDate(d, "GMT+7", "yyyy-MM-dd"));
      d.setDate(d.getDate() + 1);
    }
  }
  let ngayThieu = tatCaNgayTrongKhoang.filter(n => !ngayDaCo.has(n));
  // Giới hạn tối đa 90 ngày tính bù/lần xem (phòng khi chọn khoảng quá
  // rộng chưa từng có snapshot - vd lần đầu dùng) - ưu tiên các ngày GẦN
  // "Đến ngày" nhất vì thường quan trọng hơn. 90 ngày ở đây AN TOÀN hơn
  // giới hạn cũ (31) vì giờ chỉ tốn ĐÚNG 1 lượt quét dù bù bao nhiêu ngày.
  const MAX_LIVE_DAYS = 90;
  if (ngayThieu.length > MAX_LIVE_DAYS) ngayThieu = ngayThieu.slice(-MAX_LIVE_DAYS);
  if (ngayThieu.length) {
    // Tính bù ĐÚNG các ngày còn thiếu (không nhất thiết liên tục) trong 1
    // lượt quét duy nhất - KHÔNG đụng tới các ngày KHÁC (kể cả nằm xen
    // giữa các ngày thiếu) - đúng ý "chạy lại chỉ chạy đúng phần cần,
    // không chạy lại hết".
    try { refreshPhanTichNhapTTChoDanhSachNgay_(ngayThieu); } catch (e) { /* không chặn cả báo cáo nếu lỗi */ }
    lastRow = sh.getLastRow();
    all = lastRow > 1 ? sh.getRange(2, 1, lastRow - 1, PHANTICH_HEADERS.length).getValues() : [];
  }

  const inRange = all.filter(r => {
    const ngay = _ngayCellToStr_(r[0]);
    return ngay >= fDate && ngay <= tDate;
  });
  return inRange;
}

function getPhanTichNhapTTReport_(fDate, tDate) {
  const inRange = _docPhanTichTheoKhoang_(fDate, tDate);
  const ngayList = Array.from(new Set(inRange.map(r => _ngayCellToStr_(r[0])))).sort();

  function buildPivot(loai, phanLoai) {
    const tenSet = new Set();
    const byNgay = new Map(); // ngay -> Map(ten -> {kl,giaTri})
    inRange.forEach(r => {
      if (String(r[1]) !== loai || String(r[2]) !== phanLoai) return;
      const ngay = _ngayCellToStr_(r[0]), ten = String(r[3]);
      tenSet.add(ten);
      if (!byNgay.has(ngay)) byNgay.set(ngay, new Map());
      byNgay.get(ngay).set(ten, { kl: utils.parseNum(r[4]), giaTri: utils.parseNum(r[5]) });
    });
    const tenList = Array.from(tenSet).sort();
    const rows = ngayList.map(ngay => {
      const m = byNgay.get(ngay) || new Map();
      let tongKl = 0, tongGiaTri = 0;
      const values = tenList.map(ten => {
        const v = m.get(ten) || { kl: 0, giaTri: 0 };
        tongKl += v.kl; tongGiaTri += v.giaTri;
        return v.kl;
      });
      return { ngay, values, tongKl, tongGiaTri };
    });
    return { tenList, rows };
  }

  return {
    ngayList,
    nhapTheoNG: buildPivot("NHAP", "NG"),
    nhapTheoDL: buildPivot("NHAP", "DL"),
    ttTheoNG: buildPivot("THANHTOAN", "NG"),
    ttTheoDL: buildPivot("THANHTOAN", "DL")
  };
}

// ============================================================
// MỚI (mục 11 - chạy nền 15h hàng ngày): CHI TIẾT CÔNG NỢ THEO PHIẾU CÂN
// ------------------------------------------------------------
// Liệt kê các phiếu cân CHƯA thanh toán, tính ĐẾN 1 ngày cụ thể (chỉ
// tính phiếu có Ngày Cân 1 <= ngày chọn, và HIỆN vẫn chưa thanh toán) -
// đúng kiểu báo cáo "công nợ phải trả theo tuổi nợ". Snapshot "hôm qua"
// làm mới lúc 15h; chọn ngày khác sẽ tính trực tiếp NGAY LÚC ĐÓ.
// ============================================================
function _formatGioCan_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, "GMT+7", "HH:mm");
  return v ? String(v) : "";
}

function getChiTietCongNoPhieuCan_(ngayStr) {
  const ngayMoc = new Date(ngayStr + "T00:00:00");
  const rows = [];
  const dmNgMap = _getDmNgMap_(); // SỬA (tối ưu): tra DM_NG 1 LẦN, không tra lại từng dòng trong vòng lặp bên dưới

  // SỬA LỖI (xem NGÀY TRONG QUÁ KHỨ bị sai): trước đây dùng ID_DNTT của
  // PhieuCan_DN - đây là trạng thái THANH TOÁN HAY CHƯA tính tại THỜI
  // ĐIỂM HIỆN TẠI (hôm nay), không phải tại "ngày đang xem". Vd: phiếu
  // cân đã được thanh toán 2 ngày trước, nhưng người dùng xem báo cáo
  // "tính đến 10 ngày trước" -> đáng lẽ phiếu đó PHẢI hiện là "chưa
  // thanh toán" tại thời điểm đó, nhưng bị ẩn đi vì ID_DNTT ĐÃ có giá
  // trị (ở hiện tại). Giờ tra CHÍNH XÁC "Ngày CK/TT" của từng phiếu cân
  // từ CT thật - chỉ coi là "đã thanh toán" nếu ngày đó <= ngày đang xem.
  const ngayTTBySoPC = new Map();
  try {
    _ctGopLuuTru_(ngayStr, "", true).forEach(r => {
      const soPC = utils.standardize(r[11]); // Số phiếu cân
      const ngayTT = r[20]; // Ngày CK/TT
      if (soPC && ngayTT instanceof Date) ngayTTBySoPC.set(soPC, ngayTT);
    });
  } catch (e) {}

  _pcGopLuuTru_(ngayStr, "").forEach(r => {
    const soCT = String(r[PC_COL.SO_CT] || "").trim();
    if (!soCT) return;
    const key = utils.standardize(soCT);

    // Đã thanh toán TRƯỚC hoặc ĐÚNG ngày đang xem -> không còn là công
    // nợ nữa tại thời điểm đó. Đã thanh toán SAU ngày đang xem (hoặc
    // chưa từng thanh toán) -> VẪN tính là công nợ tại thời điểm đó.
    // v2026.9.7: so theo NGÀY (giờ VN), không theo mốc 00:00 - Ngày TT lưu lúc
    // 12:00 trưa nên phiếu trả ĐÚNG ngày đang xem trước đây vẫn bị tính là nợ.
    const ngayTT = ngayTTBySoPC.get(key);
    if (ngayTT && _onOrBefore_(ngayTT, ngayStr)) return;

    const ngayNhap = r[PC_COL.NGAY_CAN_1];
    if (!(ngayNhap instanceof Date)) return;
    if (!_onOrBefore_(ngayNhap, ngayStr)) return; // chỉ tính phiếu nhập ĐẾN ngày chọn

    const klKg = utils.parseNum(r[PC_COL.KL_KG]);
    const soNgayTre = Math.floor((ngayMoc.getTime() - ngayNhap.getTime()) / 86400000);

    rows.push({
      soPhieuCan: soCT,
      ngayNhap1: utils.formatDate(ngayNhap),
      gioCan1: _formatGioCan_(r[PC_COL.GIO_CAN_1]),
      gioCan2: _formatGioCan_(r[PC_COL.GIO_CAN_2]),
      canLan1: utils.parseNum(r[PC_COL.CAN_LAN_1]),
      canLan2: utils.parseNum(r[PC_COL.CAN_LAN_2]),
      matHang: String(r[PC_COL.MAT_HANG] || "").trim() || "Gỗ Keo",
      khachHang: String(r[PC_COL.KHACH_HANG] || "").trim(),
      klKg: klKg,
      klTan: klKg / 1000,
      donGia: utils.parseNum(r[PC_COL.DON_GIA_TC]),
      thanhTien: utils.parseNum(r[PC_COL.THANH_TIEN]),
      dl: String(r[PC_COL.DAI_LY] || "").trim() || "(Chưa rõ ĐL)",
      ng: _tenNguonGoc_(r[PC_COL.NGUON_GOC], dmNgMap),
      chenhLechNgay: soNgayTre
    });
  });
  return rows.sort((a, b) => b.chenhLechNgay - a.chenhLechNgay);
}

const CTCN_HEADERS = ["soPhieuCan", "ngayNhap1", "gioCan1", "gioCan2", "canLan1", "canLan2", "matHang", "khachHang", "klKg", "klTan", "donGia", "thanhTien", "dl", "ng", "chenhLechNgay"];

function getChiTietCongNoCacheSheet_() {
  const { ss } = getDraftSheets_();
  let sh = ss.getSheetByName(CFG.DRAFT_CTCN_SHEET);
  if (!sh) {
    sh = ss.insertSheet(CFG.DRAFT_CTCN_SHEET);
    // SỬA LỖI (cùng loại lỗi ở Phân Tích Nhập/TT): cột "Ngày nhập 1"
    // (2), "Giờ cân 1" (3), "Giờ cân 2" (4) lưu dạng CHUỖI TEXT - khóa
    // cứng thành TEXT thuần để Google Sheets không tự chuyển thành
    // Ngày/Giờ thật (làm sai bộ lọc "Ngày nhập" và hiển thị lộn xộn).
    _forcePlainTextCols_(sh, 2, 3);
  }
  return sh;
}

/** Đọc an toàn "Ngày nhập 1"/"Giờ cân" - nếu dữ liệu CŨ đã lỡ bị Google
 * Sheets tự chuyển thành Date/Time (trước khi có sửa lỗi ở trên), tự
 * định dạng lại đúng dạng chuỗi mong đợi thay vì để nguyên Date object. */
function _ctcnNgayGioToStr_(v, kieu) {
  if (v instanceof Date) {
    return kieu === 'gio' ? Utilities.formatDate(v, "GMT+7", "HH:mm") : Utilities.formatDate(v, "GMT+7", "dd/MM/yyyy");
  }
  return String(v || "").trim();
}

/** Tính + lưu snapshot cho ĐÚNG 1 ngày (dùng cho Trigger 15h). SỬA (tối
 * ưu): nhận thêm precomputedRows (tùy chọn) để không phải tính lại nếu
 * nơi gọi (getChiTietCongNoPhieuCanWeb_) đã tính rồi. */
function refreshChiTietCongNoPhieuCanChoNgay_(ngayStr, precomputedRows) {
  let lock;
  try {
    lock = sysLock.acquire();
    const rows = precomputedRows || getChiTietCongNoPhieuCan_(ngayStr);
    const sh = getChiTietCongNoCacheSheet_();
    // SỬA LỖI: dùng clearContents() thay vì clear() - clear() xóa luôn cả
    // ĐỊNH DẠNG cột (kể cả định dạng TEXT thuần vừa khóa ở
    // getChiTietCongNoCacheSheet_() để chống Google Sheets tự chuyển
    // Ngày/Giờ) - clearContents() chỉ xóa GIÁ TRỊ, giữ nguyên định dạng.
    // SỬA LỖI (rà soát phát hiện - "sh.clearContent is not a function"):
    // clearContent() (không "s") là hàm của Range, KHÔNG tồn tại trên
    // Sheet - sh ở đây là Sheet (từ getChiTietCongNoCacheSheet_()), phải
    // dùng clearContents() (có "s") mới đúng API của Sheet. Lỗi này khiến
    // Trigger 15h (daily15hRefresh_) thất bại mỗi ngày ngay từ bước này.
    sh.clearContents();
    sh.getRange(1, 1, 1, CTCN_HEADERS.length).setValues([CTCN_HEADERS]).setFontWeight("bold").setBackground("#d9d2e9");
    if (rows.length) sh.getRange(2, 1, rows.length, CTCN_HEADERS.length).setValues(_dongAnToan_(rows.map(o => CTCN_HEADERS.map(k => o[k]))));
    sh.setFrozenRows(1);
    PropertiesService.getScriptProperties().setProperty('CTCN_SNAPSHOT_DATE', ngayStr);
    return rows.length;
  } finally {
    if (lock) lock.releaseLock();
  }
}

function _readChiTietCongNoCacheAll_() {
  const sh = getChiTietCongNoCacheSheet_();
  const lr = sh.getLastRow();
  if (lr < 2) return [];
  return sh.getRange(2, 1, lr - 1, CTCN_HEADERS.length).getValues().map(r => {
    const o = {}; CTCN_HEADERS.forEach((k, i) => o[k] = r[i]); return o;
  }).map(o => ({
    ...o,
    ngayNhap1: _ctcnNgayGioToStr_(o.ngayNhap1, 'ngay'),
    gioCan1: _ctcnNgayGioToStr_(o.gioCan1, 'gio'),
    gioCan2: _ctcnNgayGioToStr_(o.gioCan2, 'gio')
  }));
}

function _applyCtcnFilters_(rows, filters) {
  filters = filters || {};
  return rows.filter(r =>
    (!filters.dl || r.dl === filters.dl) &&
    (!filters.ng || r.ng === filters.ng) &&
    (!filters.khachHang || r.khachHang === filters.khachHang) &&
    (!filters.ngayNhap || r.ngayNhap1 === filters.ngayNhap)
  );
}

/** #Web: đọc snapshot nếu ĐÚNG ngày đã làm mới (15h) - nhanh; ngược lại
 * tính trực tiếp NGAY (đúng yêu cầu "chọn ngày khác tự tải lại và
 * tính"), đồng thời tự cập nhật snapshot cho ngày đó luôn cho lần sau. */
function getChiTietCongNoPhieuCanWeb_(ngayStr, filters) {
  const snapDate = PropertiesService.getScriptProperties().getProperty('CTCN_SNAPSHOT_DATE') || '';
  let rows;
  if (ngayStr === snapDate) {
    try { rows = _readChiTietCongNoCacheAll_(); } catch (e) { rows = null; }
  }
  if (!rows) {
    rows = getChiTietCongNoPhieuCan_(ngayStr);
    try { refreshChiTietCongNoPhieuCanChoNgay_(ngayStr, rows); } catch (e) { /* không chặn luồng chính nếu ghi cache lỗi */ }
  }
  return _applyCtcnFilters_(rows, filters);
}

// ============================================================
// MỚI (theo yêu cầu): "TÌNH HÌNH THANH TOÁN GỖ KEO HÀNG NGÀY"
// ------------------------------------------------------------
// Liệt kê các phiếu cân ĐÃ thanh toán (tra từ CT thật, theo "Ngày CK/TT")
// trong khoảng ngày chọn - ngược lại với "Chi Tiết Công Nợ theo Phiếu
// Cân" (liệt kê phiếu CHƯA thanh toán). Tính TRỰC TIẾP mỗi lần xem
// (không qua cache/snapshot) - vì mặc định chỉ xem 1 ngày (hôm nay),
// khối lượng tính toán nhỏ, không cần tối ưu thêm.
// ============================================================
function getTinhHinhThanhToanHangNgay_(fDate, tDate) {
  const dmNgMap = _getDmNgMap_();
  const pcMap = new Map(); // SO_CT (đã standardize) -> dòng Phiếu Cân đầy đủ
  _pcGopLuuTru_(fDate, tDate).forEach(r => {
    const soCT = String(r[PC_COL.SO_CT] || "").trim();
    if (soCT) pcMap.set(utils.standardize(soCT), r);
  });

  const rows = [];
  try {
    _ctGopLuuTru_(fDate, tDate, true).forEach(ctRow => {
      const ngayTT = ctRow[20];
      if (!(ngayTT instanceof Date)) return;
      const ngayTTStr = Utilities.formatDate(ngayTT, "GMT+7", "yyyy-MM-dd");
      if (ngayTTStr < fDate || ngayTTStr > tDate) return;

      const soPhieuCan = String(ctRow[11] || "").replace(/'/g, "").trim();
      const pcRow = pcMap.get(utils.standardize(soPhieuCan));
      if (!pcRow) return;

      const ngayNhap = pcRow[PC_COL.NGAY_CAN_1];
      const klKg = utils.parseNum(pcRow[PC_COL.KL_KG]);

      rows.push({
        soPhieuCan: soPhieuCan,
        ngayThanhToan: utils.formatDate(ngayTT),
        ngayNhap1: ngayNhap instanceof Date ? utils.formatDate(ngayNhap) : "",
        gioCan1: _formatGioCan_(pcRow[PC_COL.GIO_CAN_1]),
        gioCan2: _formatGioCan_(pcRow[PC_COL.GIO_CAN_2]),
        canLan1: utils.parseNum(pcRow[PC_COL.CAN_LAN_1]),
        canLan2: utils.parseNum(pcRow[PC_COL.CAN_LAN_2]),
        matHang: String(pcRow[PC_COL.MAT_HANG] || "").trim() || "Gỗ Keo",
        khachHang: String(pcRow[PC_COL.KHACH_HANG] || "").trim(),
        klKg: klKg,
        klTan: klKg / 1000,
        donGia: utils.parseNum(pcRow[PC_COL.DON_GIA_TC]),
        thanhTien: utils.parseNum(pcRow[PC_COL.THANH_TIEN]),
        dl: String(pcRow[PC_COL.DAI_LY] || "").trim() || "(Chưa rõ ĐL)",
        ng: _tenNguonGoc_(pcRow[PC_COL.NGUON_GOC], dmNgMap)
      });
    });
  } catch (e) {}
  // Sắp theo ngày thật (dd/MM/yyyy so chuỗi sẽ xếp sai khi khoảng ngày qua nhiều tháng).
  const iso = s => s.split("/").reverse().join("-");
  return rows.sort((a, b) => iso(b.ngayThanhToan).localeCompare(iso(a.ngayThanhToan)) || a.soPhieuCan.localeCompare(b.soPhieuCan));
}

function _applyThtFilters_(rows, filters) {
  filters = filters || {};
  return rows.filter(r =>
    (!filters.soPhieuCan || r.soPhieuCan === filters.soPhieuCan) &&
    (!filters.dl || r.dl === filters.dl) &&
    (!filters.ng || r.ng === filters.ng) &&
    (!filters.khachHang || r.khachHang === filters.khachHang) &&
    (!filters.ngayNhap || r.ngayNhap1 === filters.ngayNhap)
  );
}

function getTinhHinhThanhToanHangNgayWeb_(fDate, tDate, filters) {
  const rows = getTinhHinhThanhToanHangNgay_(fDate, tDate);
  return _applyThtFilters_(rows, filters);
}

function exportTinhHinhThanhToanExcel_(fDate, tDate, filters) {
  try {
    const rows = getTinhHinhThanhToanHangNgayWeb_(fDate, tDate, filters || {});
    const folder = DriveApp.getFolderById(getReportFolderId_());
    const fileName = `TINH HINH THANH TOAN GO KEO (${fDate} den ${tDate})`;
    const ss = _taoFileBaoCao_(fileName, folder);

    const sheet = ss.getSheets()[0];
    sheet.setName("TinhHinhThanhToan");
    // SỬA (theo yêu cầu - file xuất ra cũng phải khóa): Số phiếu cân(1),
    // Ngày thanh toán/Ngày nhập/Giờ cân(2,3,4,5) - khóa TEXT thuần.
    _lockTextCols_(sheet, [1, 2, 3, 4, 5], rows.length + 5); // SỬA (tối ưu tốc độ): dùng đúng số dòng thực tế thay vì mặc định 2000
    const headers = ["Số phiếu cân", "Ngày thanh toán", "Ngày nhập", "Giờ cân 1", "Giờ cân 2", "Cân lần 1", "Cân lần 2", "Mặt hàng", "Khách hàng", "KL (kg)", "KL (tấn)", "Đơn giá", "Thành tiền", "Đại lý", "Nguồn gốc"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#d9d2e9");
    if (rows.length) {
      const body = rows.map(r => [r.soPhieuCan, _formatNgayXuat_(r.ngayThanhToan), _formatNgayXuat_(r.ngayNhap1), r.gioCan1, r.gioCan2, r.canLan1, r.canLan2, r.matHang, r.khachHang, r.klKg, r.klTan, r.donGia, r.thanhTien, r.dl, r.ng]);
      sheet.getRange(2, 1, body.length, headers.length).setValues(_dongAnToan_(body));
      _canhLeTheoKieu_(sheet, 2, body);
    }
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);

    logAction_("XUAT_TINH_HINH_TT", "-", `Xuất Tình Hình Thanh Toán (${fDate} - ${tDate}), ${rows.length} dòng - ${ss.getUrl()}`);
    return { success: true, url: ss.getUrl(), count: rows.length };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  }
}

/** Trigger "Làm mới dữ liệu 7:30/13:00" - đo thời gian chạy (xem _chayTriggerCoDo_). */
function dailyRefreshAllCaches_() {
  return _chayTriggerCoDo_("dailyRefreshAllCaches_", _dailyRefreshAllCachesThucHien_);
}
function _dailyRefreshAllCachesThucHien_() {
  const cache = refreshAllDraftCaches_();
  const range = _defaultCongNoRange_();
  // mục 7: Tiến Độ Hợp Đồng giờ TÍNH LUÔN Công Nợ theo Hợp Đồng trong
  // cùng 1 lượt quét - truyền chung khoảng ngày với Công Nợ Khách Hàng.
  const tienDoCount = refreshHopDongTienDoCache_(range.fDate, range.tDate);
  const congNo = refreshCongNoCache_(range.fDate, range.tDate);
  logAction_("DAILY_REFRESH_ALL", "-",
    `Tiến độ HĐ (+ Công Nợ HĐ): ${tienDoCount} · Công nợ KH: ${congNo.kh} (${range.fDate} - ${range.tDate}).`);
  return { cache, tienDoCount, congNo, range };
}

/**
 * MỚI (mục 11): hàm chạy nền lúc 15h HÀNG NGÀY - tổng hợp cho ĐÚNG "ngày
 * hôm qua" (so với lúc trigger chạy): Phân Tích Nhập/Thanh Toán theo
 * NG & ĐL + Chi Tiết Công Nợ theo Phiếu Cân. Bật bằng
 * setupDaily15hTrigger_() (menu/Cài Đặt) - chạy 1 lần.
 */
/** Xuất PDF từ 1 Google Sheet (dùng endpoint export chính thức của
 * Google) - trả về Blob PDF. */
function _exportSheetAsPdf_(ssId) {
  const url = `https://docs.google.com/spreadsheets/d/${ssId}/export?format=pdf&size=A4&portrait=false&fitw=true&gridlines=false&printtitle=false&sheetnames=false&pagenum=CENTER&attachment=true`;
  const token = ScriptApp.getOAuthToken();
  const res = UrlFetchApp.fetch(url, { headers: { Authorization: "Bearer " + token }, muteHttpExceptions: true });
  // v2026.9.11 (R-18): Google trả lỗi (hết quota, không có quyền...) thì
  // KHÔNG lưu trang lỗi thành file .pdf.
  const ma = res.getResponseCode();
  if (ma !== 200) throw new Error(`Google không xuất được PDF (mã HTTP ${ma}).`);
  return res.getBlob().setName("bao_cao.pdf");
}

function _renderPhanTichSheet_(sheet, report, fDate, tDate) {
  sheet.clear();
  let row = 1;
  sheet.getRange(row, 1, 1, 12).merge().setValue("BÁO CÁO TỔNG HỢP NHẬP & THANH TOÁN GỖ KEO")
    .setFontSize(16).setFontWeight("bold").setHorizontalAlignment("center").setBackground("#4a6b57").setFontColor("#ffffff");
  row++;
  sheet.getRange(row, 1, 1, 12).merge().setValue(`Từ ngày ${fDate} đến ngày ${tDate}`).setFontStyle("italic").setHorizontalAlignment("center");
  row += 2;

  const renderTable = (title, pivot) => {
    sheet.getRange(row, 1).setValue(title).setFontWeight("bold").setFontSize(13).setBackground("#d9d2e9");
    row++;
    if (!pivot.rows.length) {
      sheet.getRange(row, 1).setValue("(Không có phát sinh trong khoảng ngày này)").setFontStyle("italic");
      row += 2;
      return;
    }
    const headerRow = ["Ngày", ...pivot.tenList, "Tổng KL (kg)", "Tổng Giá Trị"];
    sheet.getRange(row, 1, 1, headerRow.length).setValues(_dongAnToan_([headerRow])).setFontWeight("bold").setBackground("#e8e2d5");
    row++;
    // 1 lệnh ghi cho cả bảng (trước đây 1 lệnh/ngày).
    const lines = pivot.rows.map(r => [r.ngay, ...r.values, r.tongKl, r.tongGiaTri]);
    sheet.getRange(row, 1, lines.length, headerRow.length).setValues(_dongAnToan_(lines));
    _canhLeTheoKieu_(sheet, row, lines);
    row += lines.length;
    const grandKl = pivot.rows.reduce((s, r) => s + r.tongKl, 0);
    const grandGiaTri = pivot.rows.reduce((s, r) => s + r.tongGiaTri, 0);
    const totalLine = ["TỔNG CỘNG", ...pivot.tenList.map((_, i) => pivot.rows.reduce((s, r) => s + (r.values[i] || 0), 0)), grandKl, grandGiaTri];
    sheet.getRange(row, 1, 1, totalLine.length).setValues([totalLine]).setFontWeight("bold").setBackground("#f3f0e8");
    _canhLeTheoKieu_(sheet, row, [totalLine]);
    row += 2;
  };

  renderTable("1. NHẬP GỖ KEO THEO NGUỒN GỐC", report.nhapTheoNG);
  renderTable("2. NHẬP GỖ KEO THEO ĐẠI LÝ", report.nhapTheoDL);
  renderTable("3. THANH TOÁN THEO NGUỒN GỐC", report.ttTheoNG);
  renderTable("4. THANH TOÁN THEO ĐẠI LÝ", report.ttTheoDL);

  sheet.autoResizeColumns(1, 20);
}

/** #Web: xuất "Báo cáo tổng hợp từ ngày đến ngày" - vừa Excel (Google
 * Sheet trong Drive) vừa PDF. */
function exportPhanTichNhapTTBaoCao_(fDate, tDate) {
  try {
    const report = getPhanTichNhapTTReport_(fDate, tDate);
    const folder = DriveApp.getFolderById(getReportFolderId_());
    const fileName = `BAO CAO TONG HOP TU ${fDate} DEN ${tDate}`;
    const ss = _taoFileBaoCao_(fileName, folder);

    const sh1 = ss.getSheets()[0];
    sh1.setName("TongHop");
    _renderPhanTichSheet_(sh1, report, fDate, tDate);
    SpreadsheetApp.flush();

    // PDF lỗi -> vẫn trả file Excel đã tạo, kèm cảnh báo (trước đây báo lỗi
    // cả thao tác, người dùng mất link Excel dù file đã nằm trong thư mục).
    let pdfUrl = "", canhBao = "";
    try {
      pdfUrl = folder.createFile(_exportSheetAsPdf_(ss.getId())).setName(fileName + ".pdf").getUrl();
    } catch (ePdf) {
      canhBao = "Không tạo được file PDF: " + (ePdf && ePdf.message) + " Mở file Excel rồi File › Tải xuống › PDF.";
    }

    logAction_("XUAT_PHAN_TICH_NG_DL", "-", `Xuất báo cáo tổng hợp ${fDate} - ${tDate} - ${ss.getUrl()}${canhBao ? " - " + canhBao : ""}`);
    return { success: true, excelUrl: ss.getUrl(), pdfUrl, canhBao };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  }
}

/** #Web: xuất Excel "Chi Tiết Công Nợ theo Phiếu Cân" (áp dụng bộ lọc
 * hiện tại nếu có). */
function exportChiTietCongNoPhieuCanExcel_(ngayStr, filters) {
  try {
    const rows = getChiTietCongNoPhieuCanWeb_(ngayStr, filters || {});
    const folder = DriveApp.getFolderById(getReportFolderId_());
    const fileName = `CHI TIET CONG NO THEO PHIEU CAN (den ${ngayStr})`;
    const ss = _taoFileBaoCao_(fileName, folder);

    const sheet = ss.getSheets()[0];
    sheet.setName("ChiTietCongNo");
    // SỬA (theo yêu cầu - file xuất ra cũng phải khóa): Số phiếu cân(1)
    // có thể toàn số (mất số 0 đầu), Ngày nhập/Giờ cân(2,3,4) có nguy cơ
    // bị Sheets tự chuyển thành Ngày/Giờ thật (cùng loại lỗi đã sửa ở
    // sheet Draft) - khóa TEXT thuần cho chắc chắn.
    _lockTextCols_(sheet, [1, 2, 3, 4], rows.length + 5); // SỬA (tối ưu tốc độ): dùng đúng số dòng thực tế thay vì mặc định 2000
    const headers = ["Số phiếu cân", "Ngày nhập 1", "Giờ cân 1", "Giờ cân 2", "Cân lần 1", "Cân lần 2", "Mặt hàng", "Khách hàng", "KL (kg)", "KL (tấn)", "Đơn giá", "Thành tiền", "Đại lý", "Nguồn gốc", "Chênh lệch ngày"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#d9d2e9");
    if (rows.length) {
      const body = rows.map(r => [r.soPhieuCan, _formatNgayXuat_(r.ngayNhap1), r.gioCan1, r.gioCan2, r.canLan1, r.canLan2, r.matHang, r.khachHang, r.klKg, r.klTan, r.donGia, r.thanhTien, r.dl, r.ng, r.chenhLechNgay]);
      sheet.getRange(2, 1, body.length, headers.length).setValues(_dongAnToan_(body));
      _canhLeTheoKieu_(sheet, 2, body);
    }
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);

    logAction_("XUAT_CHITIET_CONGNO_PC", "-", `Xuất Chi Tiết Công Nợ theo Phiếu Cân (đến ${ngayStr}), ${rows.length} dòng - ${ss.getUrl()}`);
    return { success: true, url: ss.getUrl(), count: rows.length };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  }
}

/**
 * MỚI (dọn dữ liệu rác đã lỡ phát sinh): dedupe chỉ cứu được các dòng mà
 * cột Ngày CÒN LÀ Date object (do Google Sheets tự chuyển) - nếu đã bị
 * ghi thành TEXT RÁC (vd "Fri Jul 03 2026 00:00:00 GMT+...") thì KHÔNG
 * còn cách nào đọc lại đúng ngày gốc để tính bù. Cách CHẮC CHẮN nhất:
 * xóa sạch toàn bộ dữ liệu (giữ lại header) - sheet sẽ tự nạp lại SẠCH
 * dần qua Trigger 15h hoặc ngay khi có người xem báo cáo (tự tính bù
 * ngày thiếu - xem getPhanTichNhapTTReport_()). Chạy 1 LẦN nếu thấy báo
 * cáo có dòng ngày hiển thị sai/rác.
 */
function resetPhanTichNhapTTSheet_() {
  const sh = getPhanTichCacheSheet_();
  const lastRow = sh.getLastRow();
  const soDongXoa = Math.max(0, lastRow - 1);
  if (lastRow > 1) sh.getRange(2, 1, lastRow - 1, PHANTICH_HEADERS.length).clearContent();
  // Áp lại định dạng TEXT thuần - PHÒNG trường hợp sheet này đã tồn tại
  // từ TRƯỚC khi có sửa lỗi định dạng (getPhanTichCacheSheet_() chỉ tự
  // khóa định dạng lúc TẠO MỚI, không áp lại cho sheet cũ đã có).
  _forcePlainTextCols_(sh, 1, 1);
  logAction_("RESET_PHAN_TICH", "-", `Đã xóa sạch ${soDongXoa} dòng Phân Tích Nhập/TT (giữ header) để nạp lại từ đầu.`);
  return soDongXoa;
}

/** MỚI: tương tự resetPhanTichNhapTTSheet_() nhưng cho Chi Tiết Công Nợ
 * theo Phiếu Cân - phòng khi sheet này cũng đã bị Google Sheets tự
 * chuyển sai định dạng Ngày/Giờ từ trước (cùng loại lỗi, có thể chưa lộ
 * ra vì chỉ làm sai bộ lọc "Ngày nhập" chứ không tạo dòng rác 0/0). */
function resetChiTietCongNoSheet_() {
  const sh = getChiTietCongNoCacheSheet_();
  const lastRow = sh.getLastRow();
  const soDongXoa = Math.max(0, lastRow - 1);
  if (lastRow > 1) sh.getRange(2, 1, lastRow - 1, CTCN_HEADERS.length).clearContent();
  _forcePlainTextCols_(sh, 2, 3);
  PropertiesService.getScriptProperties().deleteProperty('CTCN_SNAPSHOT_DATE'); // buộc tính lại ngày gần nhất khi xem lần sau
  logAction_("RESET_CTCN", "-", `Đã xóa sạch ${soDongXoa} dòng Chi Tiết Công Nợ theo Phiếu Cân (giữ header) để nạp lại từ đầu.`);
  return soDongXoa;
}

function webResetChiTietCongNoSheet_() {
  try {
    const n = resetChiTietCongNoSheet_();
    return { success: true, message: `✅ Đã xóa sạch ${n} dòng dữ liệu cũ (có thể đã bị lỗi định dạng Ngày/Giờ). Dữ liệu sẽ tự nạp lại SẠCH qua Trigger 15h, hoặc ngay khi bạn xem báo cáo.` };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  }
}

function showResetChiTietCongNoDialog() {
  _yeuCauQuyen_(QUYEN.QUAN_TRI);
  const ui = SpreadsheetApp.getUi();
  try {
    const n = resetChiTietCongNoSheet_();
    ui.alert(`✅ Đã xóa sạch ${n} dòng dữ liệu cũ. Dữ liệu sẽ tự nạp lại SẠCH qua Trigger 15h hoặc khi có người xem báo cáo.`);
  } catch (e) {
    ui.alert("❌ Lỗi: " + _loiChoNguoiDung_(e));
  }
}

function webResetPhanTichNhapTTSheet_() {
  try {
    const n = resetPhanTichNhapTTSheet_();
    return { success: true, message: `✅ Đã xóa sạch ${n} dòng dữ liệu cũ (có thể đã bị lỗi định dạng). Dữ liệu sẽ tự nạp lại SẠCH qua Trigger 15h, hoặc ngay khi bạn xem báo cáo (tự tính bù ngày thiếu).` };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  }
}

function showResetPhanTichDialog() {
  _yeuCauQuyen_(QUYEN.QUAN_TRI);
  const ui = SpreadsheetApp.getUi();
  try {
    const n = resetPhanTichNhapTTSheet_();
    ui.alert(`✅ Đã xóa sạch ${n} dòng dữ liệu cũ. Dữ liệu sẽ tự nạp lại SẠCH qua Trigger 15h hoặc khi có người xem báo cáo.`);
  } catch (e) {
    ui.alert("❌ Lỗi: " + _loiChoNguoiDung_(e));
  }
}

/**
 * SỬA (theo yêu cầu): Phân Tích Nhập/TT giờ tính cho CẢ THÁNG HIỆN HÀNH
 * (từ ngày 1 đầu tháng đến NGÀY HIỆN HÀNH - hôm nay), khớp đúng với
 * khoảng mặc định của báo cáo (xem renderPhanTichTab() ở Index.html) -
 * để người dùng mở báo cáo mặc định luôn thấy dữ liệu có sẵn, không phải
 * chờ tính bù. Nhờ hàm gộp 1-lượt-quét (refreshPhanTichNhapTTChoKhoang_),
 * dù tính cả tháng (~30 ngày) vẫn CHỈ tốn đúng 1 lượt quét Phiếu Cân + 1
 * lượt quét CT thật - không chậm dù nhiều ngày. Chi Tiết Công Nợ theo
 * Phiếu Cân vẫn giữ nguyên snapshot 1 ngày (hôm qua) như cũ.
 */
const PHANTICH_CAP_NHAT_LUC_PROP = "PHANTICH_CAP_NHAT_LUC";
/** Ngày bắt đầu tổng hợp lúc 15h: đầu tháng, nhưng ngày 1 thì lùi về hôm
 * qua - phiếu cân nhập sau 15h ngày cuối tháng trước vẫn được tính. */
function _tuNgayTongHop15h_(ngayHomQua, homNay) {
  const dauThang = homNay.slice(0, 8) + "01";
  return ngayHomQua < dauThang ? ngayHomQua : dauThang;
}

/** Trigger "Tổng hợp 15h" - đo thời gian chạy (xem _chayTriggerCoDo_). */
function daily15hRefresh_() {
  return _chayTriggerCoDo_("daily15hRefresh_", _daily15hRefreshThucHien_);
}
function _daily15hRefreshThucHien_() {
  const now = new Date();
  // SỬA THÊM (an toàn hơn với múi giờ Project): trước đây dùng
  // homQua.setDate(homQua.getDate()-1) - .getDate()/.setDate() diễn giải
  // theo múi giờ CỦA PROJECT, có thể sai nếu Project chưa cấu hình đúng
  // giờ Việt Nam. Giờ trừ THẲNG 24 giờ bằng mốc thời gian tuyệt đối
  // (getTime()) - không phụ thuộc cách diễn giải lịch theo múi giờ nào
  // cả, luôn ra đúng "hôm qua" theo đúng 24 giờ trước.
  const homQua = new Date(now.getTime() - 24 * 3600 * 1000);
  const ngayHomQua = Utilities.formatDate(homQua, "GMT+7", "yyyy-MM-dd");
  const homNay = Utilities.formatDate(now, "GMT+7", "yyyy-MM-dd");
  const tuNgay = _tuNgayTongHop15h_(ngayHomQua, homNay);

  const r1 = refreshPhanTichNhapTTChoKhoang_(tuNgay, homNay);
  PropertiesService.getScriptProperties().setProperty(PHANTICH_CAP_NHAT_LUC_PROP, Utilities.formatDate(now, "GMT+7", "HH:mm dd/MM/yyyy"));
  const n2 = refreshChiTietCongNoPhieuCanChoNgay_(ngayHomQua);
  logAction_("DAILY_15H_REFRESH", "-", `Phân tích NG/ĐL: ${tuNgay} - ${homNay} (${r1.soNgay} ngày, ${r1.soDong} dòng) · Chi tiết công nợ phiếu cân (ngày ${ngayHomQua}): ${n2} dòng.`);
  return { tuNgay, homNay, r1, ngayHomQua, n2 };
}

/** MỚI (theo yêu cầu - "nút đồng bộ song song với trigger 15h"): chạy
 * NGAY nội dung của trigger 15h (Phân Tích Nhập/TT theo NG-ĐL + Chi Tiết
 * Công Nợ theo Phiếu Cân) - KHÔNG cần chờ tới giờ đã hẹn, và KHÔNG đụng
 * gì tới lịch tự động đang chạy (trigger vẫn giữ nguyên, vẫn tự chạy
 * đúng giờ như bình thường). Dùng khi mới đổi giờ trigger muốn xem ngay
 * kết quả, hoặc nghi ngờ số liệu đang cũ mà chưa muốn chờ tới giờ hẹn. */
function webRunDaily15hRefreshNow_() {
  try {
    const r = daily15hRefresh_();
    return `✅ Đã đồng bộ xong: Phân tích NG/ĐL ${r.tuNgay} → ${r.homNay} (${r.r1.soNgay} ngày, ${r.r1.soDong} dòng) · Chi tiết công nợ phiếu cân ngày ${r.ngayHomQua} (${r.n2} dòng).`;
  } catch (e) {
    return "❌ Đồng bộ lỗi: " + _loiChoNguoiDung_(e);
  }
}

/** MỚI (theo yêu cầu - "chỉnh giờ trigger trên webapp"): giờ/phút mặc
 * định 15:00 như cũ nếu chưa từng đổi qua Cài Đặt. */
const TRIGGER_15H_HOUR_MAC_DINH = 15;
const TRIGGER_15H_MINUTE_MAC_DINH = 0;

/** Giờ/phút ĐANG cấu hình cho Trigger 15h (đọc từ Script Properties, rơi
 * về mặc định 15:00 nếu chưa từng đổi) - dùng cho getTriggerStatusForWeb_()
 * để giao diện tự điền đúng giờ hiện tại vào ô nhập. */
function _trigger15hGioPhutHienTai_() {
  const props = PropertiesService.getScriptProperties();
  const h = parseInt(props.getProperty('TRIGGER_15H_HOUR'), 10);
  const m = parseInt(props.getProperty('TRIGGER_15H_MINUTE'), 10);
  return {
    gio: (Number.isInteger(h) && h >= 0 && h <= 23) ? h : TRIGGER_15H_HOUR_MAC_DINH,
    phut: (Number.isInteger(m) && m >= 0 && m <= 59) ? m : TRIGGER_15H_MINUTE_MAC_DINH
  };
}

/** Chạy để bật/ĐỔI giờ Trigger 15h hàng ngày (mục 11). Nhận thêm
 * gio/phut (tùy chọn - theo yêu cầu "chỉnh giờ trigger trên webapp"):
 * không truyền thì giữ NGUYÊN giờ đang cấu hình (mặc định 15:00 nếu
 * chưa từng đổi) - KHÔNG được rơi về mặc định cứng, vì menu Google
 * Sheet "⏱️ Bật Tự Động 15h" (showSetupDaily15hTriggerDialog()) vẫn gọi
 * hàm này KHÔNG truyền gio/phut - nếu rơi về mặc định sẽ âm thầm XÓA
 * giờ tùy chỉnh người dùng vừa đặt qua Web App mỗi khi ai đó lỡ bấm
 * đúng menu đó trong Google Sheet. Luôn xóa trigger cũ trước khi tạo
 * lại - vừa để đổi giờ, vừa tránh trigger bị "kẹt" chạy code cũ (xem sự
 * cố Version 6 đã rà soát trước đó). */
function setupDaily15hTrigger_(gio, phut) {
  const hienTai = _trigger15hGioPhutHienTai_();
  const h = (gio === undefined || gio === null || gio === "") ? hienTai.gio : parseInt(gio, 10);
  const m = (phut === undefined || phut === null || phut === "") ? hienTai.phut : parseInt(phut, 10);
  if (!Number.isInteger(h) || h < 0 || h > 23 || !Number.isInteger(m) || m < 0 || m > 59) {
    return "❌ Giờ/phút không hợp lệ (giờ 0-23, phút 0-59).";
  }
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'daily15hRefresh_') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('daily15hRefresh_').timeBased().atHour(h).nearMinute(m).everyDays(1).create();
  PropertiesService.getScriptProperties().setProperty('TRIGGER_15H_HOUR', String(h));
  PropertiesService.getScriptProperties().setProperty('TRIGGER_15H_MINUTE', String(m));
  const gioText = (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m);
  const msg = `✅ Đã bật tự động tổng hợp lúc ${gioText} hàng ngày (Phân Tích Nhập/TT theo NG-ĐL + Chi Tiết Công Nợ theo Phiếu Cân, cho ngày hôm trước).`;
  logAction_("SETUP_TRIGGER_15H", "-", msg);
  return msg;
}

// ============================================================
// MỚI (mục AA - chạy nền theo giờ cố định): CACHE TIẾN ĐỘ HỢP ĐỒNG
// ------------------------------------------------------------
// getHopDongSummary_() (Bước 2 "Tạo Mới") trước đây quét lại TOÀN BỘ
// DNTT_CT + DNTT_112 THẬT mỗi lần đổi Số HĐ/STK - rất chậm. Giờ tiến độ
// từng hợp đồng "Đang Thực Hiện" được TÍNH SẴN 1 LẦN (quét CT/112 thật
// đúng 1 lượt cho TẤT CẢ hợp đồng, không phải từng hợp đồng 1 lượt) và
// lưu vào sheet CFG.DRAFT_HDTIENDO_SHEET trong File Nháp. Làm mới bằng:
//  a. Trigger cố định 7:30 sáng & 13:00 chiều hàng ngày (dailyRefreshAllCaches_).
//  b. Nút "🔄 Tải & Tính Lại" ngay trong màn "Tạo Mới" (webRefreshCreateFlowData_).
//  c. Tự động 1 lần nếu 1 hợp đồng CHƯA có trong cache (hợp đồng vừa
//     thêm, chưa tới giờ làm mới định kỳ) - xem getHopDongSummary_().
// ============================================================
function getHdTienDoCacheSheet_() {
  const { ss } = getDraftSheets_();
  let sh = ss.getSheetByName(CFG.DRAFT_HDTIENDO_SHEET);
  if (!sh) sh = ss.insertSheet(CFG.DRAFT_HDTIENDO_SHEET);
  return sh;
}

/** Quét CT thật + 112 thật ĐÚNG 1 LƯỢT (không phải lặp lại cho từng hợp
 * đồng) và ghi tiến độ của TẤT CẢ hợp đồng "Đang Thực Hiện" vào mirror. */
/** MỚI (mục 7 - theo yêu cầu): tính tiến độ + CÔNG NỢ THEO HỢP ĐỒNG
 * LUÔN TRONG 1 LẦN QUÉT, ghép thẳng vào CÙNG sheet HopDongTienDo_DRAFT -
 * KHÔNG cần sheet CongNoHopDong_DRAFT riêng nữa (giảm 1 lượt quét CT
 * thật trùng lặp trước đây). "Chi tiết công nợ" (sổ chi tiết từng lần
 * TT) vẫn tính riêng theo yêu cầu xem (getDebtLedgerDetail_), không gộp
 * vào đây. fDate/tDate mặc định = khoảng Công Nợ mặc định (3 tháng). */
function refreshHopDongTienDoCache_(fDate, tDate) {
  const range = (fDate && tDate) ? { fDate, tDate } : _defaultCongNoRange_();
  fDate = range.fDate; tDate = range.tDate;

  const activeContracts = _hdNccData_(); // đã lọc "Đang Thực Hiện" (mục Y)
  const ss = getMainSs_();

  const agg = new Map(); // key -> {slThucHien, giaTriThucHien, giaTriTrongKy, giaTriDangCho}
  const ensureAgg = key => {
    if (!agg.has(key)) agg.set(key, { slThucHien: 0, giaTriThucHien: 0, giaTriTrongKy: 0, giaTriDangCho: 0 });
    return agg.get(key);
  };

  try {
    _ctGopLuuTru_("", "", true).forEach(r => {
      const k = utils.standardize(r[19]);
      if (!k) return;
      const o = ensureAgg(k);
      o.slThucHien += utils.parseNum(r[12]);
      o.giaTriThucHien += utils.parseNum(r[16]);
      if (_inDateRange_(r[20], fDate, tDate)) o.giaTriTrongKy += utils.parseNum(r[16]);
    });
  } catch (e) {}

  try {
    const { shCT: shDraftCT } = getDraftSheets_();
    const lr = shDraftCT.getLastRow();
    if (lr > 1) {
      shDraftCT.getRange(2, 1, lr - 1, 22).getValues().forEach(r => {
        const k = utils.standardize(r[19]);
        if (!k) return;
        ensureAgg(k).giaTriDangCho += utils.parseNum(r[16]);
      });
    }
  } catch (e) {}

  const lanTTBySoHD = new Map();
  try {
    _h112GopLuuTru_("", "").forEach(r => {
      if (String(r[20]).toUpperCase() !== "Y") return;
      const k = utils.standardize(String(r[8] || "").replace(/'/g, ""));
      if (!k) return;
      if (!lanTTBySoHD.has(k)) lanTTBySoHD.set(k, []);
      lanTTBySoHD.get(k).push({
        ngay: utils.formatDate(r[16]),
        stk: String(r[5] || "").replace(/'/g, ""),
        nganHang: String(r[4] || ""),
        soTien: utils.parseNum(r[6])
      });
    });
  } catch (e) {}

  const now = new Date();
  const rows = activeContracts.map(hdRow => {
    const soHD = String(hdRow[HDNCC_COL.SO_HD] || "").trim();
    if (!soHD) return null;
    const key = utils.standardize(soHD);
    const danhSachLanTT = lanTTBySoHD.get(key) || [];
    const a = agg.get(key) || { slThucHien: 0, giaTriThucHien: 0, giaTriTrongKy: 0, giaTriDangCho: 0 };
    const slDuKien = utils.parseNum(hdRow[HDNCC_COL.SL_DU_KIEN]);
    return [
      soHD, String(hdRow[HDNCC_COL.HO_TEN] || ""), hdRow[HDNCC_COL.NGAY_KY] || "",
      slDuKien, a.slThucHien, danhSachLanTT.length, JSON.stringify(danhSachLanTT), now,
      // mục 7: cột Công Nợ theo Hợp Đồng - ghép thẳng, không cần sheet riêng
      a.giaTriThucHien, a.giaTriTrongKy, a.giaTriDangCho, slDuKien - a.slThucHien
    ];
  }).filter(Boolean);

  const header = [
    "Số HĐ", "Chủ rừng", "Ngày ký", "SL Dự Kiến", "SL Thực Hiện", "Số Lần Đã TT", "Chi Tiết Lần TT (JSON)", "Làm mới lúc",
    "Giá Trị Thực Hiện Lũy Kế", "Giá Trị Trong Kỳ", "Đang Chờ TT (Công Nợ)", "Còn Lại SL"
  ];
  _ghiLaiMirror_(getHdTienDoCacheSheet_(), header, rows);
  _setHdTienDoCongNoMeta_(fDate, tDate);
  return rows.length;
}

function _hdTienDoData_() {
  const sh = getHdTienDoCacheSheet_();
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return []; // trống (chưa tới giờ làm mới đầu tiên) -> getHopDongSummary_() tự tính bù trực tiếp
  return sh.getRange(2, 1, lastRow - 1, sh.getLastColumn()).getValues();
}

/** Tính trực tiếp (không qua cache) tiến độ 1 hợp đồng - dùng làm phương
 * án dự phòng khi hợp đồng chưa kịp có trong cache định kỳ. */
function _computeHopDongTienDoLiveSingle_(key) {
  let slThucHien = 0;
  try {
    _ctGopLuuTru_("", "", true).forEach(r => {
      if (utils.standardize(r[19]) === key) slThucHien += utils.parseNum(r[12]);
    });
  } catch (e) {}

  const danhSachLanTT = [];
  try {
    _h112GopLuuTru_("", "").forEach(r => {
      if (utils.standardize(String(r[8] || "").replace(/'/g, "")) !== key) return;
      if (String(r[20]).toUpperCase() !== "Y") return;
      danhSachLanTT.push({
        ngay: utils.formatDate(r[16]),
        stk: String(r[5] || "").replace(/'/g, ""),
        nganHang: String(r[4] || ""),
        soTien: utils.parseNum(r[6])
      });
    });
  } catch (e) {}

  return { slThucHien, danhSachLanTT };
}
/**
 * MỚI (mục 11): tra cứu Tên Nguồn Gốc theo Mã NG - đọc sheet "DM_NG"
 * trong File Hợp Đồng (LINKS.HOP_DONG_SS_ID), cột B = Mã NG, cột C = Tên
 * NG (đã xác nhận). Trả về Map(Mã NG đã standardize -> Tên NG).
 */
function _getDmNgMap_() {
  const pairs = _getCachedRefData_("dm_ng_map_v1", () => {
    const out = [];
    try {
      const sh = openExternalSheet_(CFG.HD_SS_ID, "DM_NG", "Danh Mục Nguồn Gốc");
      const lr = sh.getLastRow();
      if (lr > 1) {
        sh.getRange(2, 2, lr - 1, 2).getValues().forEach(r => { // cột B,C
          const ma = utils.standardize(r[0]);
          const ten = String(r[1] || "").trim();
          if (ma && ten) out.push([ma, ten]);
        });
      }
    } catch (e) { /* không có sheet DM_NG -> trả rỗng, dùng mã gốc làm tên */ }
    return out;
  });
  const map = {};
  (pairs || []).forEach(([ma, ten]) => { map[ma] = ten; });
  return map;
}
/** Tên Nguồn Gốc hiển thị từ Mã NG (cột O PhieuCan_DN) - nếu không tra
 * được, hiển thị đúng mã gốc thay vì để trống (dễ phát hiện thiếu).
 * SỬA (mục tối ưu): nhận thêm dmNgMap (tùy chọn) để KHÔNG phải tra lại
 * cache mỗi lần gọi trong vòng lặp hàng nghìn dòng - nơi gọi trong 1
 * vòng lặp nên tự lấy `_getDmNgMap_()` MỘT LẦN trước vòng lặp rồi
 * truyền vào đây. */
function _tenNguonGoc_(maNG, dmNgMap) {
  const ma = String(maNG || "").trim();
  if (!ma) return "(Chưa rõ NG)";
  const map = dmNgMap || _getDmNgMap_();
  return map[utils.standardize(ma)] || ma;
}

/** Đọc theo khóa: số dòng liền nhau gộp 1 lần đọc, số lần đọc tối đa. */
const DOC_THEO_KHOA = { GOP_DONG: 30, TOI_DA_LENH: 40 };
/** Đọc (từ dòng 2) CHỈ các dòng có ô cột `cotKhoa` (0-based) thỏa `khop(giáTrị)`, mỗi
 * dòng `rong` cột - thay cho đọc cả sheet khi chỉ cần vài trăm dòng. Đọc 1 cột khóa,
 * rồi đọc các đoạn dòng khớp (cách nhau <= GOP_DONG dòng thì gộp); quá TOI_DA_LENH đoạn
 * thì đọc 1 khối từ dòng khớp đầu tới dòng khớp cuối. Giữ thứ tự dòng trong sheet. */
function _docDongTheoKhoa_(sh, cotKhoa, rong, khop) {
  return _doanDongTheoKhoa_(sh, cotKhoa, rong, khop).map(x => x.values);
}
/** Như _docDongTheoKhoa_ nhưng kèm số dòng trong sheet: [{ dong, values }] - dùng khi cần
 * ghi lại đúng ô của các dòng đã đọc (không đọc cả sheet chỉ để tìm vị trí). */
function _doanDongTheoKhoa_(sh, cotKhoa, rong, khop) {
  const lr = sh ? sh.getLastRow() : 0;
  if (lr < 2) return [];
  const viTri = [];
  sh.getRange(2, cotKhoa + 1, lr - 1, 1).getValues().forEach((v, i) => { if (khop(v[0])) viTri.push(i); });
  if (!viTri.length) return [];
  let doan = [];
  viTri.forEach(i => { const d = doan[doan.length - 1]; if (d && i - d[1] <= DOC_THEO_KHOA.GOP_DONG) d[1] = i; else doan.push([i, i]); });
  if (doan.length > DOC_THEO_KHOA.TOI_DA_LENH) doan = [[viTri[0], viTri[viTri.length - 1]]];
  const soCot = Math.min(rong, sh.getLastColumn());
  const kq = [];
  doan.forEach(([dau, cuoi]) => sh.getRange(2 + dau, 1, cuoi - dau + 1, soCot).getValues().forEach((r, k) => {
    if (!khop(r[cotKhoa])) return;
    while (r.length < rong) r.push("");
    kq.push({ dong: 2 + dau + k, values: r });
  }));
  return kq;
}

/** Đọc (từ dòng 2) CHỈ các cột `cot` (0-based, tăng dần) của sheet, trả về
 * dòng đủ `rong` cột - cột không đọc để "". Các cột cách nhau không quá 2
 * cột được gộp vào 1 lần đọc (ít lệnh gọi hơn, chỉ thêm vài ô). */
function _docCacCot_(sh, cot, rong) {
  const lr = sh.getLastRow();
  if (lr < 2) return [];
  const soDong = lr - 1;
  const doan = [];
  cot.forEach(c => { const d = doan[doan.length - 1]; if (d && c - d[1] <= 2) d[1] = c; else doan.push([c, c]); });
  const rows = [];
  for (let i = 0; i < soDong; i++) rows.push(new Array(rong).fill(""));
  doan.forEach(([dau, cuoi]) => {
    const cotTrongDoan = cot.filter(c => c >= dau && c <= cuoi);
    sh.getRange(2, dau + 1, soDong, cuoi - dau + 1).getValues().forEach((v, i) => {
      cotTrongDoan.forEach(c => { rows[i][c] = v[c - dau]; });
    });
  });
  return rows;
}

function _pcData_() {
  return _getCachedRefData_("pc_data_v1", () =>
    _docCacCot_(openExternalSheet_(CFG.PC_SS_ID, CFG.PC_SHEET, "Phiếu Cân"), PC_COT_CAN_DOC, PC_MIRROR_COLS));
}

// ============================================================
// MỚI (mục P - tối ưu tốc độ): CACHE "PHIẾU CÂN CHƯA THANH TOÁN"
// ------------------------------------------------------------
// LÝ DO: PhieuCan_DN (nguồn) càng ngày càng nhiều dòng (tích lũy nhiều
// năm), nhưng các thao tác "CHỌN phiếu cân" (Tạo Đề Nghị Thanh Toán,
// Tách Phiếu, Thêm phiếu vào 1 hồ sơ Nháp...) CHỈ cần các dòng CHƯA
// thanh toán (ID_DNTT trống, Chọn TT khác Y/N). Quét lại TOÀN BỘ
// PhieuCan_DN mỗi lần (kể cả các dòng đã trả từ nhiều năm trước) là
// nguyên nhân chính khiến Web App tải chậm.
// GIẢI PHÁP: duy trì 1 BẢN SAO thu gọn - CHỈ gồm các dòng CHƯA thanh
// toán - ngay trong File Nháp (sheet CFG.DRAFT_PC_SHEET). Các hàm chọn
// phiếu cân (findAvailablePhieuCan_, getAvailablePhieuCanForChuRung_,
// pcMap trong runProcessDetail/createNewPaymentRequest_/
// addPhieuCanToDraft_) đọc từ bản sao NHỎ này thay vì PhieuCan_DN thật.
// QUAN TRỌNG: Công nợ/Báo cáo/Phân tích (getDebtByCustomer_,
// getPaymentAnalysis_...) CẦN dữ liệu ĐẦY ĐỦ (kể cả
// đã trả) để tính đúng lũy kế - các hàm đó VẪN dùng _pcData_() như cũ,
// KHÔNG đụng tới bản sao này.
// LÀM MỚI (refresh) bản sao:
//  a. Tự động làm mới 1 lần nếu bản sao đang TRỐNG (vd lần đầu dùng).
//  b. Bấm menu "🔄 Làm Mới Cache Phiếu Cân (chưa TT)" trong Google Sheet,
//     hoặc nút tương ứng trong mục Cài Đặt của Web App.
//  c. (Khuyến khích) chạy 1 lần hàm setupPcCacheAutoRefreshTrigger_() để
//     hệ thống tự làm mới mỗi ngày lúc 7:30 & 13:00 (Trigger theo giờ cố
//     định) - dữ liệu "chưa thanh toán" luôn mới trong ngày.
// Ngoài ra, ngay sau khi "Chốt Thanh Toán" (runConfirmPayment_), các
// phiếu cân vừa dùng được XÓA NGAY khỏi bản sao (không cần đợi tới lần
// làm mới định kỳ) - đúng yêu cầu "đóng thanh toán xong thì xóa khỏi
// Nháp".
// ============================================================

function getPcCacheSheet_() {
  const { ss } = getDraftSheets_(); // vẫn yêu cầu File Nháp (CT/112) đã thiết lập
  let sh = ss.getSheetByName(CFG.DRAFT_PC_SHEET);
  if (!sh) sh = ss.insertSheet(CFG.DRAFT_PC_SHEET);
  return sh;
}

/** Quét TOÀN BỘ PhieuCan_DN thật (thao tác nặng - chỉ nên chạy định kỳ,
 * không nên gọi trong luồng xử lý nhanh) và ghi đè bản sao "chưa TT". */
function refreshPhieuCanUnpaidCache_() {
  const shSrcPC = openExternalSheet_(CFG.PC_SS_ID, CFG.PC_SHEET, "Phiếu Cân");
  const lastRow = shSrcPC.getLastRow();
  // Chỉ đọc các cột code dùng (PC_COT_CAN_DOC); dòng tiêu đề đọc đủ để giữ
  // nguyên bố cục cột của bản sao.
  const lastCol = Math.min(shSrcPC.getLastColumn(), PC_MIRROR_COLS);
  const header = lastRow >= 1 ? shSrcPC.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  const all = _docCacCot_(shSrcPC, PC_COT_CAN_DOC, lastCol);
  if (lastCol === PC_MIRROR_COLS) _ghiNhoTrongLuot_("pc_data_v1", all); // cùng dạng _pcData_(): bước sau trong lượt dùng lại
  _ghiNhanHeaderPc_(header);

  const unpaid = all.filter(r => {
    const soP = String(r[PC_COL.SO_CT] || "").trim();
    if (!soP) return false;
    const idDNTT = String(r[PC_COL.ID_DNTT] || "").trim();
    const chonTT = String(r[PC_COL.CHON_TT] || "").trim().toUpperCase();
    return !idDNTT && chonTT !== "Y" && chonTT !== "N";
  });

  // v2026.6: giữ dạng chữ cho Số phiếu / Số phiếu cân (tránh mất số 0 đầu
  // khi ghi vào mirror - cùng lỗi đã sửa cho HD_NCC/HD_STK) và không xóa
  // trắng mirror trước khi ghi.
  unpaid.forEach(r => {
    r[PC_COL.SO_PHIEU] = _giuDangChu_(r[PC_COL.SO_PHIEU]);
    if (PC_COL.SO_CT < r.length) r[PC_COL.SO_CT] = _giuDangChu_(r[PC_COL.SO_CT]);
  });
  _ghiLaiMirror_(getPcCacheSheet_(), header, unpaid);
  _invalidateChunkedCache_("pc_unpaid_data_v1"); // SỬA: dùng helper xóa hết các mảnh (dữ liệu có thể đã bị chia mảnh nếu lớn)
  logAction_("REFRESH_CACHE_PC_CHUA_TT", "-", `Đã làm mới cache Phiếu Cân chưa TT: ${unpaid.length}/${all.length} dòng.`);
  return unpaid.length;
}

/** Dữ liệu Phiếu Cân CHƯA thanh toán - dùng cho mọi chức năng "chọn
 * phiếu cân" để tạo/tách hồ sơ mới (KHÔNG dùng cho công nợ/báo cáo). */
function _pcUnpaidData_() {
  return _getCachedRefData_("pc_unpaid_data_v1", () => {
    const sh = getPcCacheSheet_();
    let lastRow = sh.getLastRow();
    if (lastRow < 2) {
      // Bản sao đang trống (chưa từng làm mới) -> tự động làm mới 1 lần
      // để không trả về rỗng oan cho người dùng đầu tiên trong ngày.
      refreshPhieuCanUnpaidCache_();
      lastRow = sh.getLastRow();
    }
    return lastRow > 1 ? sh.getRange(2, 1, lastRow - 1, sh.getLastColumn()).getValues() : [];
  });
}

/** Xóa NGAY các phiếu cân vừa được Chốt Thanh Toán khỏi bản sao "chưa
 * TT" (soCTKeySet: Set các "Số phiếu cân" đã utils.standardize()). */
function _removeFromPcUnpaidCache_(soCTKeySet) {
  if (!soCTKeySet || soCTKeySet.size === 0) return;
  try {
    const sh = getPcCacheSheet_();
    // Chỉ tìm đúng các dòng vừa trả rồi xóa (trước đây đọc + ghi đè cả bản sao).
    const dong = _doanDongTheoKhoa_(sh, PC_COL.SO_CT, PC_COL.SO_CT + 1, v => soCTKeySet.has(utils.standardize(v))).map(x => x.dong);
    if (!dong.length) return; // không có gì cần xóa
    _nhomDongLienTiep_(dong).reverse().forEach(([a, b]) => sh.deleteRows(a, b - a + 1));
    _invalidateChunkedCache_("pc_unpaid_data_v1"); // SỬA: dùng helper xóa hết các mảnh (dữ liệu có thể đã bị chia mảnh nếu lớn)
  } catch (e) {
    // Không chặn luồng chính nếu dọn cache lỗi - lần làm mới định kỳ kế
    // tiếp (hoặc thủ công) sẽ tự sửa lại đúng.
  }
}

/** Wrapper cho Web App (mục Cài Đặt) - làm mới cache thủ công. */
/** Wrapper cho Web App - làm mới CẢ 3 cache (Phiếu Cân chưa TT, HD_NCC,
 * HD_STK) trong 1 lần bấm (mục Y). */
function webRefreshPhieuCanCache_() {
  try {
    const r = refreshAllDraftCaches_();
    const tienDoCount = refreshHopDongTienDoCache_();
    return { success: true, message: `✅ Đã làm mới toàn bộ cache: ${r.pc} phiếu cân chưa TT · ${r.hdNcc}/${r.hdNccTotal} hợp đồng "Đang Thực Hiện" (HD_NCC) · ${r.hdStk}/${r.hdStkTotal} dòng HD_STK · ${tienDoCount} hợp đồng đã cập nhật tiến độ - sẵn sàng chọn nhanh.` };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  }
}

/**
 * MỚI (mục AA): nút "🔄 Tải & Tính Lại" NGAY TRONG màn "Tạo Mới" (Bước
 * 2 - Hợp đồng & Phiếu cân) - phòng khi vừa thêm phiếu cân/hợp đồng mới
 * mà chưa tới giờ làm mới định kỳ (7:30/13:00). Chỉ làm mới đúng những
 * gì cần cho luồng tạo mới (KHÔNG đụng tới snapshot Công Nợ - không cần
 * thiết ở màn này, làm mới sẽ chậm hơn không cần thiết).
 */
function webRefreshCreateFlowData_() {
  try {
    const r = refreshAllDraftCaches_();
    const tienDoCount = refreshHopDongTienDoCache_();
    return { success: true, message: `✅ Đã tải & tính lại: ${r.pc} phiếu cân chưa TT · ${r.hdNcc}/${r.hdNccTotal} hợp đồng "Đang Thực Hiện" · ${tienDoCount} hợp đồng đã cập nhật tiến độ.` };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  }
}

/** Chạy 1 LẦN (menu, hoặc Apps Script Editor) để bật tự động làm mới cả
 * 3 cache (Phiếu Cân chưa TT, HD_NCC, HD_STK) mỗi ngày (7:30, 13:00) bằng Trigger
 * theo thời gian. */
/**
 * MỚI (mục AA/AB): chạy 1 LẦN (menu, mục Cài Đặt, hoặc Apps Script
 * Editor) để bật tự động làm mới TOÀN BỘ dữ liệu nền (Phiếu Cân chưa TT,
 * HD_NCC, HD_STK, Tiến Độ Hợp Đồng, Công Nợ mặc định) vào 2 mốc giờ CỐ
 * ĐỊNH mỗi ngày: 7:30 sáng và 13:00 chiều (thay vì mỗi 10 phút như bản
 * cũ) - đúng theo yêu cầu chạy nền theo giờ hành chính cố định.
 */
function setupPcCacheAutoRefreshTrigger_() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'dailyRefreshAllCaches_') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('dailyRefreshAllCaches_').timeBased().atHour(7).nearMinute(30).everyDays(1).create();
  ScriptApp.newTrigger('dailyRefreshAllCaches_').timeBased().atHour(13).nearMinute(0).everyDays(1).create();
  const msg = "✅ Đã bật tự động làm mới TOÀN BỘ dữ liệu (Phiếu Cân, HD_NCC, HD_STK, Tiến Độ Hợp Đồng, Công Nợ) mỗi ngày lúc 7:30 và 13:00.";
  logAction_("SETUP_TRIGGER_CACHE_PC", "-", msg);
  return msg;
}

// MỚI (theo yêu cầu - trước đây THIẾU, chỉ có ở menu Sheet): bản Web App cho trigger 7:30/13:00.
function webSetupPcCacheAutoRefreshTrigger_() {
  try {
    return { success: true, message: setupPcCacheAutoRefreshTrigger_() };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  }
}

/**
 * MỚI (mục AD): Trigger RIÊNG, NHẸ HƠN - chỉ làm mới Phiếu Cân chưa TT +
 * HD_NCC + HD_STK (Đang Thực Hiện) mỗi 10 phút, KHÔNG đụng tới Tiến Độ
 * Hợp Đồng hay Công Nợ (2 mục đó vẫn chỉ chạy theo lịch 7:30/13:00 ở
 * setupPcCacheAutoRefreshTrigger_() - nặng hơn, không cần chạy mỗi 10
 * phút). Dùng khi cần Phiếu Cân/Hợp Đồng/Số Tài Khoản cập nhật KỊP THỜI
 * hơn (giữa 2 mốc 7:30/13:00) mà không tốn thêm chi phí tính Tiến Độ HĐ
 * + Công Nợ. Chạy 1 LẦN để bật (menu, mục Cài Đặt, hoặc Apps Script
 * Editor).
 */
/**
 * MỚI (theo yêu cầu): Apps Script KHÔNG hỗ trợ trigger "mỗi N phút NHƯNG
 * chỉ trong khung giờ" trực tiếp - trigger vẫn phải chạy mỗi 10 phút cả
 * ngày, nhưng hàm XỬ LÝ tự kiểm tra giờ hiện tại, NGOÀI khung 7:30-19:00
 * thì bỏ qua ngay (không quét/ghi gì cả) - vẫn đạt hiệu quả tương đương
 * "chỉ chạy trong giờ hành chính". Đây là hàm RIÊNG dùng làm handler cho
 * Trigger 10 phút - các lượt gọi THỦ CÔNG (nút "Làm Mới", "Tải & Tính
 * Lại"...) vẫn gọi thẳng refreshAllDraftCaches_() như cũ, không bị giới
 * hạn giờ.
 */
/** Trigger "Làm mới 10 phút" - đo thời gian chạy (xem _chayTriggerCoDo_). */
function refreshAllDraftCaches10Min_() {
  return _chayTriggerCoDo_("refreshAllDraftCaches10Min_", _refreshAllDraftCaches10MinThucHien_);
}
function _refreshAllDraftCaches10MinThucHien_() {
  const now = new Date();
  const h = now.getHours(), m = now.getMinutes();
  const tuGioTro = (h > 7) || (h === 7 && m >= 30);   // từ 7:30 trở đi
  const truocGioKetThuc = (h < 19);                    // trước 19:00
  if (!tuGioTro || !truocGioKetThuc) return;           // ngoài khung giờ -> bỏ qua, không làm gì
  refreshAllDraftCaches_();
}

function setup10MinRefreshTrigger_() {
  ScriptApp.getProjectTriggers().forEach(t => {
    const fn = t.getHandlerFunction();
    if (fn === 'refreshAllDraftCaches_' || fn === 'refreshAllDraftCaches10Min_') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('refreshAllDraftCaches10Min_').timeBased().everyMinutes(10).create();
  const msg = "✅ Đã bật tự động làm mới Phiếu Cân chưa TT + HD_NCC + HD_STK (Đang Thực Hiện) mỗi 10 phút, CHỈ trong khung giờ 7:30 - 19:00 hàng ngày.";
  logAction_("SETUP_TRIGGER_10MIN", "-", msg);
  return msg;
}

// ============================================================
// MỚI (mục O): BÁO CÁO CÔNG NỢ
// ------------------------------------------------------------
// NGUYÊN TẮC TÍNH:
//  - "Giá trị NHẬP" (phát sinh nợ) = Thành tiền trong PhieuCan_DN, tính
//    cho MỌI phiếu cân đã cân xong (Thành tiền > 0), KHÔNG phụ thuộc đã
//    lập ĐNTT hay chưa - vì công nợ phát sinh ngay khi nhận gỗ.
//  - "Đã THANH TOÁN" = tổng Thành tiền (cột 16) của các dòng
//    DNTT_GK_DN_CT THẬT. Trong kiến trúc File Nháp hiện tại, dòng CT
//    THẬT chỉ được tạo ra ĐỒNG THỜI với lúc Chốt Thanh Toán (luôn ở
//    trạng thái đã chốt) - nên tổng CT thật CHÍNH LÀ số đã trả thực tế,
//    dùng đúng "Ngày CK" (ngày chốt) làm mốc thời gian.
//  - "Đang chờ thanh toán" = giá trị đang nằm trong Draft CT (File
//    Nháp) - đã cân, đã gán hồ sơ/hợp đồng, nhưng CHƯA chốt.
//  - "Công nợ" = Giá trị nhập LŨY KẾ (đến hết kỳ) - Đã thanh toán LŨY
//    KẾ (đến hết kỳ). "Phát sinh trong kỳ" chỉ để tham khảo biến động,
//    không dùng để suy ra số dư (vì có thể có nợ tồn từ trước kỳ).
// ============================================================

function _inDateRange_(d, fDate, tDate) {
  if (!(d instanceof Date)) return false;
  const iso = Utilities.formatDate(d, "GMT+7", "yyyy-MM-dd");
  return (!fDate || iso >= fDate) && (!tDate || iso <= tDate);
}
function _onOrBefore_(d, tDate) {
  if (!(d instanceof Date)) return false;
  if (!tDate) return true;
  const iso = Utilities.formatDate(d, "GMT+7", "yyyy-MM-dd");
  return iso <= tDate;
}

/**
 * MỚI (mục R - tối ưu tốc độ): giới hạn khoảng "Từ ngày - Đến ngày" tối
 * đa CFG.MAX_REPORT_RANGE_DAYS (~3 tháng) để Báo Cáo/Công Nợ tải nhanh
 * hơn (đỡ phải trả về + hiển thị quá nhiều dòng cùng lúc). Đây là lớp
 * phòng vệ phía server - giao diện Web App đã tự giới hạn/co dãn khoảng
 * ngày ở phía trình duyệt trước khi gọi lên, hàm này chỉ đảm bảo hành vi
 * đúng dù có gọi thẳng API (vd qua doGet) hay không.
 * LƯU Ý: KHÔNG áp cho các chỉ số LŨY KẾ (klLuyKe/giaTriLuyKe/duCuoiKy...)
 * - các chỉ số đó tính theo "Đến ngày" (tDate) và cần TOÀN BỘ lịch sử
 * trước đó để đúng số liệu công nợ, không phụ thuộc "Từ ngày" (fDate).
 */
function _clampReportRange_(fDate, tDate) {
  if (!fDate || !tDate) return fDate;
  try {
    const f = new Date(fDate + "T00:00:00"), t = new Date(tDate + "T00:00:00");
    const diffDays = Math.round((t - f) / 86400000);
    if (diffDays <= CFG.MAX_REPORT_RANGE_DAYS) return fDate;
    const newF = new Date(t.getTime() - CFG.MAX_REPORT_RANGE_DAYS * 86400000);
    return Utilities.formatDate(newF, "GMT+7", "yyyy-MM-dd");
  } catch (e) {
    return fDate; // ngày không hợp lệ -> để nguyên, các hàm gọi tự xử lý
  }
}

/** #1 + #3: Công nợ theo Khách hàng mua gỗ keo, trong khoảng ngày - TÍNH
 * TRỰC TIẾP (không qua cache). Dùng nội bộ bởi getDebtByCustomer_() (mục
 * AB) và bởi refreshCongNoCache_() (chạy nền định kỳ). */
// ------------------------------------------------------------
// NHẬN DIỆN KHÁCH HÀNG CÔNG NỢ (M-04 - người dùng đồng ý 26/09/2026)
// Khách hàng = CCCD + Tên. PhieuCan_DN KHÔNG có cột CCCD nên mỗi phiếu
// cân được gán CCCD theo thứ tự:
//   1. Phiếu đã nằm trong hồ sơ ĐNTT (CT thật hoặc Nháp): CCCD + tên của
//      hồ sơ đó (Nợ và Có của phiếu luôn cùng 1 khách hàng).
//   2. Chưa vào hồ sơ: tên phiếu tra HD_NCC - đúng 1 CCCD thì dùng; từ 2
//      CCCD trở lên thì xếp riêng "trùng tên - chưa rõ CCCD"; không có
//      thì để trống CCCD.
// ------------------------------------------------------------
const CONG_NO_TRUNG_TEN = "TRUNG_TEN";

/** Khóa 1 khách hàng công nợ (dùng cho gom nhóm + mở Sổ chi tiết). */
function _khoaCongNo_(cccd, ten) {
  return String(cccd || "") + "|" + utils.standardize(ten);
}

/** Bộ nhận diện theo CCCD + Tên. Trả 2 hàm: choPhieu(dòng PhieuCan_DN) và
 * choThanhToan(dòng CT thật) -> { khoa, ten, cccd, trungTen }. ctRows: sổ đã
 * chốt dùng để tra (mặc định sổ đang mở; báo cáo chạm năm đã khóa sổ truyền
 * sổ gộp để phiếu đã lưu trữ vẫn cùng khách hàng với lần thanh toán của nó). */
function _nhanDienKhachCongNo_(ctRows) {
  const theoPhieu = new Map();
  const ghiPhieu = r => {
    const so = utils.standardize(r[11]);
    if (so && !theoPhieu.has(so)) theoPhieu.set(so, { cccd: _chuanHoaCCCD_(r[4]), ten: String(r[3] || "").trim() });
  };
  try { (ctRows || _ctThatDataCache_()).forEach(ghiPhieu); } catch (e) { /* chưa kết nối File Chính */ }
  try {
    const { shCT } = getDraftSheets_();
    const lr = shCT.getLastRow();
    if (lr > 1) shCT.getRange(2, 1, lr - 1, 22).getValues().forEach(ghiPhieu);
  } catch (e) { /* File Nháp chưa thiết lập */ }

  const cccdTheoTen = new Map();
  try {
    _hdNccFullData_().forEach(r => {
      const t = utils.standardize(r[HDNCC_SRC_COL.HO_TEN]), c = _chuanHoaCCCD_(r[HDNCC_SRC_COL.CCCD]);
      if (!t || !c) return;
      if (!cccdTheoTen.has(t)) cccdTheoTen.set(t, new Set());
      cccdTheoTen.get(t).add(c);
    });
  } catch (e) { /* không đọc được HD_NCC -> các phiếu chưa vào hồ sơ để trống CCCD */ }

  const ket = (cccd, ten, trungTen) => ({ khoa: trungTen ? CONG_NO_TRUNG_TEN + "|" + utils.standardize(ten) : _khoaCongNo_(cccd, ten), ten, cccd: trungTen ? "" : cccd, trungTen });
  return {
    choPhieu(r) {
      const daVaoHoSo = theoPhieu.get(utils.standardize(r[PC_COL.SO_CT]));
      if (daVaoHoSo && (daVaoHoSo.cccd || daVaoHoSo.ten)) return ket(daVaoHoSo.cccd, daVaoHoSo.ten || String(r[PC_COL.KHACH_HANG] || "").trim(), false);
      const ten = String(r[PC_COL.KHACH_HANG] || "").trim();
      const ds = cccdTheoTen.get(utils.standardize(ten));
      if (ds && ds.size > 1) return ket("", ten, true);
      return ket(ds ? Array.from(ds)[0] : "", ten, false);
    },
    choThanhToan(r) {
      return ket(_chuanHoaCCCD_(r[4]), String(r[3] || "").trim(), false);
    }
  };
}

/** Cách gom CŨ (trước 2026.7.5 - chỉ theo tên), giữ lại để đối chiếu số liệu. */
function _nhanDienKhachTheoTen_() {
  const ket = ten => ({ khoa: utils.standardize(ten), ten, cccd: "", trungTen: false });
  return {
    choPhieu: r => ket(String(r[PC_COL.KHACH_HANG] || "").trim()),
    choThanhToan: r => ket(String(r[3] || "").trim())
  };
}

/** #1: Công nợ theo Khách hàng - TÍNH TRỰC TIẾP (không qua cache). Dùng
 * bởi getDebtByCustomer_() và refreshCongNoCache_(). nhanDien mặc định là
 * CCCD + Tên; truyền _nhanDienKhachTheoTen_() để ra số liệu theo cách cũ. */
function _computeDebtByCustomerLive_(fDate, tDate, nhanDien) {
  fDate = _clampReportRange_(fDate, tDate); // mục R - xem ghi chú tại _clampReportRange_
  // Lũy kế tính từ năm của "Từ ngày": năm đã khóa sổ trước đó chỉ mang sang phiếu chưa trả.
  const ctRows = _ctGopLuuTru_(fDate, "");
  const nd = nhanDien || _nhanDienKhachCongNo_(ctRows);
  const byCustomer = new Map();
  const nhom = kh => {
    if (!byCustomer.has(kh.khoa)) byCustomer.set(kh.khoa, { kh, klTrongKy:0, giaTriTrongKy:0, klLuyKe:0, giaTriLuyKe:0, daTTTrongKy:0, daTTLuyKe:0 });
    return byCustomer.get(kh.khoa);
  };

  _pcGopLuuTru_(fDate, "").forEach(r => {
    const thanhTien = utils.parseNum(r[PC_COL.THANH_TIEN]);
    if (thanhTien <= 0) return;
    const kh = nd.choPhieu(r);
    if (!kh.ten) return;
    const ngay = r[PC_COL.NGAY_CAN_1];
    const kl = utils.parseNum(r[PC_COL.KL_KG]) / 1000;
    const o = nhom(kh);
    if (_onOrBefore_(ngay, tDate)) { o.klLuyKe += kl; o.giaTriLuyKe += thanhTien; }
    if (_inDateRange_(ngay, fDate, tDate)) { o.klTrongKy += kl; o.giaTriTrongKy += thanhTien; }
  });

  try {
    ctRows.forEach(r => {
      const kh = nd.choThanhToan(r);
      if (!kh.ten) return;
      const thanhTien = utils.parseNum(r[16]);
      const ngayCK = r[20];
      const o = nhom(kh);
      if (_onOrBefore_(ngayCK, tDate)) o.daTTLuyKe += thanhTien;
      if (_inDateRange_(ngayCK, fDate, tDate)) o.daTTTrongKy += thanhTien;
    });
  } catch (e) {}

  return Array.from(byCustomer.values())
    .map(o => ({
      khachHang: o.kh.ten, cccd: o.kh.cccd, trungTen: o.kh.trungTen, khoa: o.kh.khoa,
      klNhapTrongKy: o.klTrongKy, giaTriNhapTrongKy: o.giaTriTrongKy, daTTTrongKy: o.daTTTrongKy,
      klNhapLuyKe: o.klLuyKe, giaTriNhapLuyKe: o.giaTriLuyKe, daTTLuyKe: o.daTTLuyKe,
      congNo: o.giaTriLuyKe - o.daTTLuyKe
    }))
    .filter(o => o.giaTriNhapTrongKy > 0 || o.daTTTrongKy > 0 || Math.abs(o.congNo) > 0.01)
    .sort((a, b) => b.congNo - a.congNo);
}

/** #Web: đối chiếu Công nợ theo cách cũ (chỉ theo tên) với cách mới (CCCD +
 * Tên) cho cùng khoảng ngày - chỉ trả các tên có khác biệt. Chỉ đọc. */
function getDoiChieuCongNoCccd_(fDate, tDate) {
  const moi = _computeDebtByCustomerLive_(fDate, tDate);
  const cu = _computeDebtByCustomerLive_(fDate, tDate, _nhanDienKhachTheoTen_());
  const theoTen = new Map();
  const lay = ten => {
    const k = utils.standardize(ten);
    if (!theoTen.has(k)) theoTen.set(k, { ten, congNoCu: 0, congNoMoi: 0, dongMoi: [] });
    return theoTen.get(k);
  };
  cu.forEach(r => { lay(r.khachHang).congNoCu += r.congNo; });
  moi.forEach(r => { const o = lay(r.khachHang); o.congNoMoi += r.congNo; o.dongMoi.push({ cccd: r.cccd, trungTen: r.trungTen, khoa: r.khoa, congNo: r.congNo }); });
  const khacBiet = Array.from(theoTen.values())
    .filter(o => Math.abs(o.congNoCu - o.congNoMoi) > 0.01 || o.dongMoi.length > 1 || o.dongMoi.some(d => d.trungTen))
    .sort((a, b) => Math.abs(b.congNoCu - b.congNoMoi) - Math.abs(a.congNoCu - a.congNoMoi) || b.dongMoi.length - a.dongMoi.length);
  return {
    tongCu: cu.reduce((s, r) => s + r.congNo, 0),
    tongMoi: moi.reduce((s, r) => s + r.congNo, 0),
    soKhachCu: cu.length, soKhachMoi: moi.length,
    khacBiet
  };
}

/** #2: Công nợ theo Hợp đồng mua gỗ keo - TÍNH TRỰC TIẾP (không qua
 * cache). Dùng nội bộ bởi getDebtByContract_() (mục AB) và bởi
 * refreshCongNoCache_() (chạy nền định kỳ). */
function _computeDebtByContractLive_(fDate, tDate) {
  fDate = _clampReportRange_(fDate, tDate); // mục R - xem ghi chú tại _clampReportRange_
  const byHD = new Map();
  const klTheoIdHD = _klDuKienTheoIdHD_();
  // mục Z: cần TOÀN BỘ hợp đồng (kể cả Đã Thanh lý/Đã Hủy) để không mất
  // hợp đồng đã xong khỏi báo cáo công nợ.
  _hdNccFullData_().forEach(r => {
    // SỬA GẤP: dữ liệu ở đây đọc THẲNG từ sheet HD_NCC gốc (đầy đủ, chưa
    // cắt gọn) - PHẢI dùng HDNCC_SRC_COL (vị trí cột THẬT), KHÔNG được
    // dùng HDNCC_COL (giờ là vị trí trong mirror đã cắt gọn, khác hẳn).
    const soHD = String(r[HDNCC_SRC_COL.SO_HD] || "").trim();
    if (!soHD) return;
    const key = utils.standardize(soHD);
    if (byHD.has(key)) return;
    byHD.set(key, {
      soHD, chuRung: String(r[HDNCC_SRC_COL.HO_TEN] || ""), ngayKy: utils.formatDate(r[HDNCC_SRC_COL.NGAY_KY]),
      slDuKien: _slDuKienHopDong_(r, klTheoIdHD),
      klThucHienLuyKe: 0, giaTriThucHienLuyKe: 0, giaTriTrongKy: 0, giaTriDangCho: 0
    });
  });

  try {
    _ctGopLuuTru_("", "", true).forEach(r => {
      const key = utils.standardize(r[19]);
      if (!key || !byHD.has(key)) return;
      const o = byHD.get(key);
      o.klThucHienLuyKe += utils.parseNum(r[12]);
      o.giaTriThucHienLuyKe += utils.parseNum(r[16]);
      if (_inDateRange_(r[20], fDate, tDate)) o.giaTriTrongKy += utils.parseNum(r[16]);
    });
  } catch (e) {}

  try {
    const { shCT: shDraftCT } = getDraftSheets_();
    const lr = shDraftCT.getLastRow();
    if (lr > 1) {
      shDraftCT.getRange(2, 1, lr - 1, 22).getValues().forEach(r => {
        const key = utils.standardize(r[19]);
        if (!key || !byHD.has(key)) return;
        byHD.get(key).giaTriDangCho += utils.parseNum(r[16]);
      });
    }
  } catch (e) {}

  return Array.from(byHD.values())
    .map(o => ({ ...o, conLaiSanLuong: o.slDuKien - o.klThucHienLuyKe, congNo: o.giaTriDangCho }))
    .filter(o => o.klThucHienLuyKe > 0 || o.giaTriDangCho > 0)
    .sort((a, b) => b.congNo - a.congNo);
}

// ============================================================
// MỚI (mục AB - chạy nền theo giờ cố định): CACHE CÔNG NỢ TỔNG HỢP
// ------------------------------------------------------------
// Công Nợ (theo Khách Hàng & theo Hợp Đồng) cho khoảng ngày MẶC ĐỊNH (3
// tháng gần nhất - _defaultCongNoRange_()) được TÍNH SẴN vào 2 sheet
// trong File Nháp, làm mới lúc 7:30 & 13:00 hàng ngày cùng lịch với mục
// AA. Khi người dùng xem ĐÚNG khoảng mặc định này -> đọc snapshot (tức
// thì, khỏi quét lại PhieuCan_DN). Khi xem khoảng NGÀY KHÁC -> tính trực
// tiếp (chậm hơn, chấp nhận được) rồi GHI ĐÈ snapshot này luôn cho lần
// xem kế tiếp (kể cả nếu người khác đang xem khoảng mặc định - lần sau
// họ mở lại sẽ tự tính lại đúng vì fDate/tDate không khớp cache nữa).
// ============================================================
const CONGNO_KH_HEADERS = ["khachHang", "klNhapTrongKy", "giaTriNhapTrongKy", "daTTTrongKy", "klNhapLuyKe", "giaTriNhapLuyKe", "daTTLuyKe", "congNo", "cccd", "trungTen", "khoa"];
const CONGNO_KH_COT_CHU = [CONGNO_KH_HEADERS.indexOf("cccd"), CONGNO_KH_HEADERS.indexOf("khoa")];

function _defaultCongNoRange_() {
  const t = new Date();
  const tDate = Utilities.formatDate(t, "GMT+7", "yyyy-MM-dd");
  const f = new Date(t.getTime() - 90 * 86400000);
  const fDate = Utilities.formatDate(f, "GMT+7", "yyyy-MM-dd");
  return { fDate, tDate };
}

/**
 * MỚI (rà soát phát hiện - "báo cáo công nợ ok chưa"): sau khi Mở Đóng
 * Thanh Toán / Đóng Thanh Toán (làm CT thật thay đổi), snapshot Công Nợ
 * (cache RIÊNG, làm mới theo giờ 7:30/13:00) sẽ hiện SAI (dữ liệu cũ)
 * cho tới lần làm mới định kỳ tiếp theo nếu người dùng xem ĐÚNG khoảng
 * ngày đang khớp cache. Xóa "meta" ở đây để BẮT BUỘC lần xem tiếp theo
 * (dù đúng khoảng ngày cache cũ) phải tính lại trực tiếp, không đọc
 * nhầm snapshot cũ.
 */
function _invalidateCongNoCache_() {
  // Người dùng chọn 28/09/2026: KHÔNG xóa bản tổng hợp (lần xem sau phải tính lại ~1 phút)
  // mà chỉ ghi lúc có thay đổi - màn Công Nợ vẫn mở nhanh bằng bản tổng hợp, kèm nhắc
  // "có thay đổi sau lần tổng hợp - bấm Làm mới". Trigger 7:30/13:00 và nút Làm mới cập nhật.
  try {
    PropertiesService.getScriptProperties().setProperty(CONGNO_LUC.THAY_DOI, String(Date.now()));
  } catch (e) { /* không chặn luồng chính */ }
}
/** Thời điểm (ms) tổng hợp Công nợ KH / theo HĐ và lúc có thay đổi sổ sau đó. */
const CONGNO_LUC = { KH: "CONGNO_CACHE_LUC", HD: "HDTIENDO_CONGNO_LUC", THAY_DOI: "CONGNO_THAY_DOI_LUC" };
/** Khoảng ngày mặc định (90 ngày gần nhất) - khoảng duy nhất có bản tổng hợp sẵn. */
function _laKhoangCongNoMacDinh_(fDate, tDate) {
  const m = _defaultCongNoRange_();
  return fDate === _clampReportRange_(m.fDate, m.tDate) && tDate === m.tDate;
}
/** #Web: trạng thái bản tổng hợp Công nợ (loai "kh" | "hd") cho khoảng [fDate, tDate]:
 * { tongHop: đang đọc bản tổng hợp?, capNhatLuc, coThayDoi, thayDoiLuc }. Chỉ đọc Script Properties. */
function getCongNoTrangThai_(loai, fDate, tDate) {
  const props = PropertiesService.getScriptProperties();
  const f = _clampReportRange_(fDate, tDate);
  const meta = loai === "hd" ? _hdTienDoCongNoMeta_() : _congNoCacheMeta_();
  const luc = Number(props.getProperty(loai === "hd" ? CONGNO_LUC.HD : CONGNO_LUC.KH)) || 0;
  const thayDoi = Number(props.getProperty(CONGNO_LUC.THAY_DOI)) || 0;
  const gio = ms => ms ? Utilities.formatDate(new Date(ms), "GMT+7", "HH:mm dd/MM/yyyy") : "";
  return {
    tongHop: _laKhoangCongNoMacDinh_(f, tDate) && meta.fDate === f && meta.tDate === tDate,
    capNhatLuc: gio(luc), coThayDoi: thayDoi > luc, thayDoiLuc: gio(thayDoi)
  };
}

function _congNoCacheMeta_() {
  const props = PropertiesService.getScriptProperties();
  return { fDate: props.getProperty('CONGNO_CACHE_FDATE') || '', tDate: props.getProperty('CONGNO_CACHE_TDATE') || '' };
}
function _setCongNoCacheMeta_(fDate, tDate) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('CONGNO_CACHE_FDATE', fDate);
  props.setProperty('CONGNO_CACHE_TDATE', tDate);
  props.setProperty(CONGNO_LUC.KH, String(Date.now()));
}

/** MỚI (mục 7): meta RIÊNG cho khoảng ngày mà cột Công Nợ (ghép trong
 * HopDongTienDo_DRAFT) đang phản ánh - độc lập với meta Công Nợ Khách
 * Hàng ở trên (2 sheet giờ làm mới độc lập nhau, dù thường trùng lịch). */
function _hdTienDoCongNoMeta_() {
  const props = PropertiesService.getScriptProperties();
  return { fDate: props.getProperty('HDTIENDO_CONGNO_FDATE') || '', tDate: props.getProperty('HDTIENDO_CONGNO_TDATE') || '' };
}
function _setHdTienDoCongNoMeta_(fDate, tDate) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('HDTIENDO_CONGNO_FDATE', fDate);
  props.setProperty('HDTIENDO_CONGNO_TDATE', tDate);
  props.setProperty(CONGNO_LUC.HD, String(Date.now()));
}

function getCongNoKhCacheSheet_() {
  const { ss } = getDraftSheets_();
  let sh = ss.getSheetByName(CFG.DRAFT_CONGNO_KH_SHEET);
  if (!sh) sh = ss.insertSheet(CFG.DRAFT_CONGNO_KH_SHEET);
  return sh;
}

function _writeCongNoKhSheet_(rows) {
  const dong = _dongAnToan_(rows.map(o => CONGNO_KH_HEADERS.map(k => o[k])), CONGNO_KH_COT_CHU);
  _ghiLaiMirror_(getCongNoKhCacheSheet_(), CONGNO_KH_HEADERS, dong, CONGNO_KH_COT_CHU.map(i => i + 1));
}
function _readCongNoKhSheet_() {
  const sh = getCongNoKhCacheSheet_();
  const lr = sh.getLastRow();
  const header = sh.getRange(1, 1, 1, CONGNO_KH_HEADERS.length).getValues()[0];
  // Snapshot tạo bởi bản cũ (chưa có CCCD/khóa) -> báo lỗi để nơi gọi tính lại.
  if (header.join("|") !== CONGNO_KH_HEADERS.join("|")) throw new Error("Snapshot Công Nợ theo định dạng cũ.");
  if (lr < 2) return [];
  return sh.getRange(2, 1, lr - 1, CONGNO_KH_HEADERS.length).getValues().map(r => {
    const o = {}; CONGNO_KH_HEADERS.forEach((k, i) => o[k] = r[i]);
    o.cccd = String(o.cccd || ""); o.khoa = String(o.khoa || ""); o.trungTen = o.trungTen === true;
    return o;
  });
}

/** Tính (trực tiếp) + ghi snapshot Công Nợ cho 1 khoảng ngày cụ thể -
 * dùng cho cả Trigger định kỳ lẫn khi cache "trượt" (xem khoảng khác). */
/** MỚI (mục 7): giờ CHỈ tính/ghi Công Nợ theo KHÁCH HÀNG - Công Nợ theo
 * HỢP ĐỒNG đã ghép thẳng vào refreshHopDongTienDoCache_() (không cần
 * sheet riêng nữa, xem mục 7 ở đó). */
/** SỬA (tối ưu): nhận thêm khRows (tùy chọn, đã tính sẵn) để KHÔNG phải
 * tính lại _computeDebtByCustomerLive_() một lần nữa khi nơi gọi
 * (getDebtByCustomer_) đã tính rồi - tránh quét PhieuCan_DN/CT 2 lần liên
 * tiếp cho cùng 1 khoảng ngày. */
function refreshCongNoCache_(fDate, tDate, khRows) {
  const rows = khRows || _computeDebtByCustomerLive_(fDate, tDate);
  _writeCongNoKhSheet_(rows);
  _setCongNoCacheMeta_(fDate, tDate);
  const macDinh = _defaultCongNoRange_();
  if (fDate === _clampReportRange_(macDinh.fDate, macDinh.tDate) && tDate === macDinh.tDate) _luuCongNoTrangChu_(rows);
  return { kh: rows.length };
}

// Trang chủ chỉ cần Tổng nợ + Top 5: lưu gọn (vài trăm byte) mỗi khi công nợ
// khoảng mặc định được tính (trigger 7:30/13:00, nút Cập nhật, Báo cáo Công
// nợ khoảng mặc định) -> mở Trang chủ không phải tính lại công nợ.
const TRANG_CHU_CONG_NO_PROP = "TRANG_CHU_CONG_NO";
function _luuCongNoTrangChu_(rows) {
  const dangNo = rows.filter(r => r.congNo > 0);
  _ghiJsonProp_(TRANG_CHU_CONG_NO_PROP, {
    tongNo: dangNo.reduce((s, r) => s + r.congNo, 0),
    top5: dangNo.slice(0, 5).map(r => ({ khachHang: r.khachHang, khoa: r.khoa, congNo: r.congNo })),
    capNhatLuc: Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm")
  });
}
/** Số "đơn xin" cũ (nhập tay ở DNTT_GK_DN) chưa xử lý - dùng cho Trợ lý AI. */
function _demNguonChoXuLy_() {
  try {
    return _srcThatDataCache_().filter(r => !utils.isBlank(r[0]) && String(r[17]).toUpperCase() !== "Y" && String(r[14]) !== "Đóng TT").length;
  } catch (e) { return 0; }
}
/** Tổng nợ + Top 5 cho Trang chủ; chưa có thì tính 1 lần (khoảng mặc định). */
function _congNoTrangChu_() {
  const daLuu = _docJsonProp_(TRANG_CHU_CONG_NO_PROP);
  if (daLuu.capNhatLuc) return daLuu;
  const range = _defaultCongNoRange_();
  getDebtByCustomer_(range.fDate, range.tDate);
  return _docJsonProp_(TRANG_CHU_CONG_NO_PROP);
}

/** #1+#3 (bản CÔNG KHAI cho Web App): đọc snapshot nếu khoảng ngày khớp
 * cache hiện tại (nhanh), ngược lại tính trực tiếp rồi ghi đè cache. */
function getDebtByCustomer_(fDate, tDate) {
  fDate = _clampReportRange_(fDate, tDate);
  // Chỉ khoảng mặc định có bản tổng hợp; khoảng khác tính trực tiếp và KHÔNG ghi đè bản
  // tổng hợp (trước đây xem khoảng khác làm người sau xem mặc định phải tính lại).
  const macDinh = _laKhoangCongNoMacDinh_(fDate, tDate);
  const meta = _congNoCacheMeta_();
  if (macDinh && meta.fDate === fDate && meta.tDate === tDate) {
    try { return _readCongNoKhSheet_(); } catch (e) { /* rơi xuống tính trực tiếp */ }
  }
  const rows = _computeDebtByCustomerLive_(fDate, tDate);
  if (macDinh) try { refreshCongNoCache_(fDate, tDate, rows); } catch (e) { /* không chặn luồng chính nếu ghi cache lỗi */ }
  return rows;
}

/** MỚI (theo yêu cầu - "còn báo cáo nào cần làm mới không"): Công Nợ
 * theo Khách Hàng/Hợp Đồng CÙNG dùng 1 cache theo khoảng ngày (làm mới
 * bởi trigger 7:30/13:00 - dailyRefreshAllCaches_()) giống hệt kiểu
 * Phân Tích Nhập/TT theo NG-ĐL - nếu đang xem ĐÚNG khoảng ngày đã có
 * cache mà vừa phát sinh thêm (nhập/thanh toán), số liệu sẽ cũ cho tới
 * lần trigger kế tiếp. Hàm này tính lại NGAY cho đúng khoảng đang xem
 * (không phải khoảng mặc định của trigger) rồi ghi đè cả 2 cache -
 * getDebtByCustomer_()/getDebtByContract_() gọi lại ngay sau đó sẽ thấy
 * khoảng ngày khớp và đọc được đúng số liệu vừa làm mới. */
function webRunCongNoRefreshNow_(fDate, tDate) {
  try {
    if (!fDate || !tDate) ({ fDate, tDate } = _defaultCongNoRange_()); // Trang chủ: khoảng mặc định
    const fClamped = _clampReportRange_(fDate, tDate);
    if (!_laKhoangCongNoMacDinh_(fClamped, tDate)) return "✅ Khoảng ngày này luôn được tính trực tiếp khi xem (số liệu mới nhất) - đã tải lại.";
    const rows = _computeDebtByCustomerLive_(fClamped, tDate);
    refreshCongNoCache_(fClamped, tDate, rows);
    refreshHopDongTienDoCache_(fClamped, tDate);
    return `✅ Đã làm mới Công Nợ theo Khách Hàng & Hợp Đồng cho khoảng ${fClamped} → ${tDate}.`;
  } catch (e) {
    return "❌ Làm mới lỗi: " + _loiChoNguoiDung_(e);
  }
}

/** #2 (bản CÔNG KHAI cho Web App): tương tự getDebtByCustomer_(). */
/** MỚI (mục 7): đọc Công Nợ theo Hợp Đồng TỪ CHÍNH sheet
 * HopDongTienDo_DRAFT (đã ghép sẵn cột Công Nợ - xem
 * refreshHopDongTienDoCache_()) nếu khoảng ngày khớp cache hiện tại;
 * ngược lại tính trực tiếp rồi làm mới lại (ghép luôn Tiến Độ HĐ). */
/** SỬA (tối ưu): trước đây khi cache LỆCH khoảng ngày, hàm này vừa gọi
 * _computeDebtByContractLive_() (tự quét CT/112) VỪA gọi
 * refreshHopDongTienDoCache_() (quét CT/112 MỘT LẦN NỮA cho cùng dữ
 * liệu) - lãng phí gấp đôi. Giờ CHỈ làm mới cache 1 lần rồi ĐỌC LẠI từ
 * chính cache đó (dùng chung 1 đường đọc cho cả 2 trường hợp trùng/lệch
 * khoảng ngày) - chỉ quét CT/112 đúng 1 lần trong mọi trường hợp. */
function getDebtByContract_(fDate, tDate) {
  fDate = _clampReportRange_(fDate, tDate);
  // Khoảng khác mặc định: tính trực tiếp, không ghi đè bản tổng hợp / Tiến độ HĐ (Tạo mới dùng).
  if (!_laKhoangCongNoMacDinh_(fDate, tDate)) return _computeDebtByContractLive_(fDate, tDate);
  const meta = _hdTienDoCongNoMeta_();
  if (meta.fDate !== fDate || meta.tDate !== tDate) {
    try {
      refreshHopDongTienDoCache_(fDate, tDate);
    } catch (e) {
      return _computeDebtByContractLive_(fDate, tDate); // Draft lỗi/chưa thiết lập -> tính trực tiếp kiểu cũ
    }
  }
  try {
    return _hdTienDoData_().map(r => ({
      soHD: String(r[0] || ""), chuRung: String(r[1] || ""), ngayKy: utils.formatDate(r[2]),
      slDuKien: utils.parseNum(r[3]), klThucHienLuyKe: utils.parseNum(r[4]),
      giaTriThucHienLuyKe: utils.parseNum(r[8]), giaTriTrongKy: utils.parseNum(r[9]),
      giaTriDangCho: utils.parseNum(r[10]), conLaiSanLuong: utils.parseNum(r[11]),
      congNo: utils.parseNum(r[10])
    })).filter(o => o.klThucHienLuyKe > 0 || o.giaTriDangCho > 0)
      .sort((a, b) => b.congNo - a.congNo);
  } catch (e) {
    return _computeDebtByContractLive_(fDate, tDate);
  }
}

/**
 * #4: Sổ chi tiết công nợ.
 * type = 'customer': sổ cái Nợ/Có/Số dư lũy kế theo thời gian (chuẩn
 *   kế toán) - Nợ = giá trị nhập (PhieuCan_DN), Có = đã thanh toán (CT
 *   thật).
 * type = 'contract': danh sách tiến độ từng phiếu cân đã gán vào hợp
 *   đồng (CT thật = "Đã thanh toán", Draft CT = "Đang chờ (Nháp)") - vì
 *   CT thật luôn phát sinh Nợ/Có cùng lúc (không có độ trễ), nên trình
 *   bày dạng theo dõi tiến độ dễ hiểu hơn dạng sổ cái thuần túy.
 */
function getDebtLedgerDetail_(type, key, tDate) {
  const keyStd = utils.standardize(key);
  if (!keyStd) return { success: false, message: "Thiếu tên khách hàng / số hợp đồng." };

  if (type === 'contract') {
    const rows = [];
    try {
      _ctGopLuuTru_("", "", true).forEach(r => {
        if (utils.standardize(r[19]) !== keyStd) return;
        rows.push({
          ngay: utils.formatDate(r[20]), soPhieuCan: String(r[11] || "").replace(/'/g, ""),
          klTan: utils.parseNum(r[12]), thanhTien: utils.parseNum(r[16]), trangThai: "Đã thanh toán"
        });
      });
    } catch (e) {}
    try {
      const { shCT: shDraftCT } = getDraftSheets_();
      const lr = shDraftCT.getLastRow();
      if (lr > 1) {
        shDraftCT.getRange(2, 1, lr - 1, 22).getValues().forEach(r => {
          if (utils.standardize(r[19]) !== keyStd) return;
          rows.push({
            ngay: utils.formatDate(r[2]), soPhieuCan: String(r[11] || "").replace(/'/g, ""),
            klTan: utils.parseNum(r[12]), thanhTien: utils.parseNum(r[16]), trangThai: "Đang chờ (Nháp)"
          });
        });
      }
    } catch (e) {}
    const tongDaTT = rows.filter(r => r.trangThai === "Đã thanh toán").reduce((s, r) => s + r.thanhTien, 0);
    const tongDangCho = rows.filter(r => r.trangThai === "Đang chờ (Nháp)").reduce((s, r) => s + r.thanhTien, 0);
    return { success: true, mode: "contract", key, rows, tongDaTT, tongDangCho, congNo: tongDangCho };
  }

  if (type === 'customer') {
    // key = khóa "CCCD|TÊN" (từ 2026.7.5); key cũ chỉ có tên vẫn mở được theo cách gom cũ.
    const ctRows = _ctGopLuuTru_(tDate, "");
    const nd = String(key).indexOf("|") >= 0 ? _nhanDienKhachCongNo_(ctRows) : _nhanDienKhachTheoTen_();
    const khoa = String(key).indexOf("|") >= 0 ? String(key) : keyStd;
    let tenHienThi = "", cccd = "";
    const cuaKhach = kh => { if (kh.khoa !== khoa) return false; tenHienThi = tenHienThi || kh.ten; cccd = cccd || kh.cccd; return true; };
    const entries = [];
    _pcGopLuuTru_(tDate, "").forEach(r => {
      if (!cuaKhach(nd.choPhieu(r))) return;
      const tien = utils.parseNum(r[PC_COL.THANH_TIEN]);
      if (tien <= 0) return;
      const ngay = r[PC_COL.NGAY_CAN_1];
      if (!_onOrBefore_(ngay, tDate)) return;
      entries.push({ ngay, dienGiai: `Nhập gỗ - Phiếu cân ${String(r[PC_COL.SO_CT] || "").trim()}`, no: tien, co: 0 });
    });
    try {
      ctRows.forEach(r => {
        if (!cuaKhach(nd.choThanhToan(r))) return;
        const ngay = r[20];
        if (!_onOrBefore_(ngay, tDate)) return;
        entries.push({
          ngay, dienGiai: `Thanh toán - HĐ ${String(r[19] || "").replace(/'/g, "")} - Phiếu ${String(r[11] || "").replace(/'/g, "")}`,
          no: 0, co: utils.parseNum(r[16])
        });
      });
    } catch (e) {}

    entries.sort((a, b) => {
      const ta = a.ngay instanceof Date ? a.ngay.getTime() : 0;
      const tb = b.ngay instanceof Date ? b.ngay.getTime() : 0;
      return ta - tb;
    });

    let du = 0;
    const rows = entries.map(e => {
      du += e.no - e.co;
      return { ngay: utils.formatDate(e.ngay), dienGiai: e.dienGiai, no: e.no, co: e.co, du };
    });

    return {
      success: true, mode: "customer", key, tenHienThi: tenHienThi || key, cccd, rows,
      tongNo: rows.reduce((s, r) => s + r.no, 0),
      tongCo: rows.reduce((s, r) => s + r.co, 0),
      duCuoiKy: du
    };
  }

  return { success: false, message: "Loại sổ chi tiết không hợp lệ (phải là 'customer' hoặc 'contract')." };
}

/** #5: Bảng phân tích tình hình thanh toán trong khoảng ngày. */
function getPaymentAnalysis_(fDate, tDate) {
  fDate = _clampReportRange_(fDate, tDate); // mục R - xem ghi chú tại _clampReportRange_
  let tongKL = 0, tongGiaTri = 0;
  const byNguonGoc = new Map(), byDaiLy = new Map();
  const dmNgMap = _getDmNgMap_(); // SỬA (tối ưu + mục 11): tra DM_NG 1 LẦN, và hiện TÊN NG thay vì mã thô

  _pcGopLuuTru_(fDate, "").forEach(r => {
    const tien = utils.parseNum(r[PC_COL.THANH_TIEN]);
    if (tien <= 0) return;
    if (!_inDateRange_(r[PC_COL.NGAY_CAN_1], fDate, tDate)) return;
    const kl = utils.parseNum(r[PC_COL.KL_KG]) / 1000;
    tongKL += kl; tongGiaTri += tien;

    const ng = _tenNguonGoc_(r[PC_COL.NGUON_GOC], dmNgMap);
    if (!byNguonGoc.has(ng)) byNguonGoc.set(ng, { nhan: ng, klTan: 0, giaTri: 0 });
    const og = byNguonGoc.get(ng); og.klTan += kl; og.giaTri += tien;

    const dl = String(r[PC_COL.DAI_LY] || "").trim() || "(Chưa rõ)";
    if (!byDaiLy.has(dl)) byDaiLy.set(dl, { nhan: dl, klTan: 0, giaTri: 0 });
    const od = byDaiLy.get(dl); od.klTan += kl; od.giaTri += tien;
  });

  let tongDaTT = 0;
  const hopDongDuocTT = new Set();
  try {
    _ctGopLuuTru_(fDate, tDate, true).forEach(r => {
      if (!_inDateRange_(r[20], fDate, tDate)) return;
      tongDaTT += utils.parseNum(r[16]);
      const hd = utils.standardize(r[19]);
      if (hd) hopDongDuocTT.add(hd);
    });
  } catch (e) {}

  return {
    tongKLNhap: tongKL,
    tongGiaTriNhap: tongGiaTri,
    tongGiaTriDaTT: tongDaTT,
    soLuongHopDongDuocTT: hopDongDuocTT.size,
    theoNguonGoc: Array.from(byNguonGoc.values()).sort((a, b) => b.giaTri - a.giaTri),
    theoDaiLy: Array.from(byDaiLy.values()).sort((a, b) => b.giaTri - a.giaTri)
  };
}


/**
 * #5: Số phiếu cân khả dụng cho 1 Chủ rừng. Điều kiện:
 *  - Khách hàng (PhieuCan_DN) khớp đúng Họ tên Chủ rừng ĐÃ CHỌN, HOẶC là
 *    tên chung "KH"/"KL"/"Khách lẻ"/"Khách Lẻ".
 *  - Thành tiền > 0.
 *  - CHƯA có trong DNTT_GK_DN_CT THẬT (đã chốt) và CHƯA có trong Draft
 *    CT (File Nháp) - đối chiếu theo "So_CT".
 *  - Chưa bị khóa ngay trong PhieuCan_DN (như findAvailablePhieuCan_ cũ).
 */
function getAvailablePhieuCanForChuRung_(hoTen, query) {
  const nameStd = utils.standardize(hoTen);
  // SỬA (mục X): hỗ trợ nhập NHIỀU số phiếu cân cùng lúc, ngăn cách bởi
  // dấu PHẨY **hoặc** dấu CÁCH (khớp CHÍNH XÁC từng số) - để trống vẫn
  // tìm hết như cũ. (Trước đây CHỈ nhận dấu phẩy - gõ cách nhau bằng dấu
  // cách bị standardize() xóa hết khoảng trắng, dính thành 1 chuỗi vô
  // nghĩa, không khớp được số nào.)
  const rawQuery = String(query || "").trim();
  const tokens = rawQuery.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
  const isMultiList = tokens.length > 1;
  const multiTerms = isMultiList ? new Set(tokens.map(t => utils.standardize(t))) : null;
  const q = utils.standardize(rawQuery);
  const MAX_RESULTS = isMultiList ? Math.max(200, multiTerms.size + 20) : 60;

  const usedReal = new Set();
  try {
    const shCTReal = getMainSs_().getSheetByName(CFG.DNTT_CT);
    if (shCTReal && shCTReal.getLastRow() > 1) {
      shCTReal.getRange(2, 12, shCTReal.getLastRow() - 1, 1).getValues().forEach(r => {
        const k = utils.standardize(r[0]); if (k) usedReal.add(k);
      });
    }
  } catch (e) {}

  const heldByDraft = new Set();
  try {
    const { shCT } = getDraftSheets_();
    const lr = shCT.getLastRow();
    if (lr > 1) {
      shCT.getRange(2, 12, lr - 1, 1).getValues().forEach(r => {
        const k = utils.standardize(r[0]); if (k) heldByDraft.add(k);
      });
    }
  } catch (e) {}

  // v2026.7.2: phiếu cân của ĐÚNG chủ rừng luôn được trả về ĐẦY ĐỦ; chỉ các
  // phiếu "Khách lẻ"/tên khác mới bị giới hạn MAX_RESULTS. Trước đây giới
  // hạn chung 60 phiếu đầu tiên (cũ nhất) - phiếu "Khách lẻ" chiếm chỗ làm
  // mất phiếu mới của chính chủ rừng (nhất là ở màn Sửa hồ sơ).
  const dungTen = [], phieuKhac = [];
  // SỬA (mục P - tối ưu tốc độ): đọc từ cache "chưa thanh toán" (nhỏ,
  // nhanh) thay vì quét toàn bộ PhieuCan_DN thật.
  const data = _pcUnpaidData_();
  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    const soCT = String(r[PC_COL.SO_CT] || "").trim();
    if (!soCT) continue;

    const trangThai = String(r[PC_COL.ID_DNTT] || "").trim();
    const daKhoa = String(r[PC_COL.CHON_TT] || "").trim().toUpperCase();
    if (trangThai || daKhoa === "Y" || daKhoa === "N") continue;

    const key = utils.standardize(soCT);
    if (usedReal.has(key) || heldByDraft.has(key)) continue;

    const khach = utils.standardize(r[PC_COL.KHACH_HANG]);
    const khopTen = !!nameStd && khach === nameStd;
    const khopKhachLe = TEN_KHACH_CHUNG.has(khach);
    const coTuKhoa = isMultiList || !!q; // người dùng đã gõ 1 số/danh sách số cụ thể
    // MỚI (mục AF): mặc định (để trống ô tìm) CHỈ hiện phiếu cân của
    // đúng Chủ rừng đang chọn (hoặc "Khách lẻ") - như cũ. NHƯNG nếu
    // người dùng đã gõ CỤ THỂ 1 số/danh sách số phiếu cân, CHO PHÉP hiện
    // cả phiếu cân của khách hàng KHÁC (kèm cờ khopTen=false để giao
    // diện cảnh báo) - đúng yêu cầu "cho chọn phiếu cân khác chủ rừng,
    // cảnh báo khi lưu".
    if (!khopTen && !khopKhachLe && !coTuKhoa) continue;

    if (utils.parseNum(r[PC_COL.THANH_TIEN]) <= 0) continue;
    // MỚI (mục X): danh sách nhiều số (phẩy) -> khớp CHÍNH XÁC 1 trong
    // các số đã nhập; không có phẩy -> giữ hành vi cũ (chứa chuỗi con,
    // để trống = tìm hết).
    if (isMultiList) {
      if (!multiTerms.has(key)) continue;
    } else if (q && !key.includes(q)) continue;

    (khopTen ? dungTen : phieuKhac).push({
      soPhieuCan: soCT,
      ngayNhap: utils.formatDate(r[PC_COL.NGAY_CAN_1]),
      soXe: String(r[PC_COL.BIEN_SO_1] || ""),
      klKg: utils.parseNum(r[PC_COL.KL_KG]),
      donGia: utils.parseNum(r[PC_COL.DON_GIA_TC]),
      thanhTien: utils.parseNum(r[PC_COL.THANH_TIEN]),
      khachHang: String(r[PC_COL.KHACH_HANG] || ""),
      khopTen: khopTen || khopKhachLe, // mục AF: false = tên khách hàng KHÁC chủ rừng đang chọn
      laKhachLe: khopKhachLe && !khopTen // tên chung ("Khách lẻ"...) - cho phép sửa về đúng tên chủ rừng
    });
  }
  return dungTen.concat(phieuKhac.slice(0, MAX_RESULTS));
}

/**
 * MỚI (mục N - tối ưu tốc độ): gộp 3 lượt tra cứu (Người đề nghị/Ủy
 * quyền, Danh sách Số hợp đồng, Danh sách Người nhận tiền) thành 1 lượt
 * gọi google.script.run DUY NHẤT, đọc HD_NCC và HD_STK MỖI SHEET CHỈ 1
 * LẦN thay vì 3 lần riêng rẽ như trước (mỗi hàm getNguoiDeNghiInfo_/
 * getSoHopDongOptions_/getNguoiNhanTienOptions_ gọi riêng đều tự mở lại
 * HD_NCC/HD_STK từ đầu). Gọi ngay khi người dùng vừa chọn CCCD, để khi
 * sang Bước 2 dữ liệu đã có sẵn, không phải chờ tải lại.
 */
/**
 * MỚI (mục AG - theo yêu cầu): "Danh sách tên chủ rừng, hợp đồng" ít
 * thay đổi -> thay vì gọi server (google.script.run, luôn mất 1-3 giây/
 * lượt dù cache phía server nhanh cỡ nào) mỗi lần gõ tìm/chọn CCCD/chọn
 * hợp đồng, Web App tải NGUYÊN CỤM dữ liệu này 1 LẦN, lưu vào bộ nhớ
 * cache của TRÌNH DUYỆT (localStorage), rồi tự tìm/lọc ngay trên máy —
 * KHÔNG round-trip server nữa cho các thao tác này. Làm mới lại theo
 * đúng lịch 7:30 & 13:00 (khớp lịch làm mới cache phía server - xem
 * ensureBulkRef()/getBulkRefBoundary_ ở Index.html).
 * Trả về TOÀN BỘ hợp đồng "Đang Thực Hiện" (HD_NCC) + toàn bộ STK tương
 * ứng (HD_STK) - đã đủ dữ liệu để Bước 1 & 2 tra cứu HOÀN TOÀN cục bộ,
 * trừ "Tiến Độ Hợp Đồng" (đổi liên tục theo thanh toán, vẫn tính ở
 * server) và "Phiếu Cân" (theo yêu cầu vẫn giữ nguyên trên server).
 */
function getBulkReferenceData_() {
  const hopDong = _hdNccData_().map(r => ({
    hoTen: String(r[HDNCC_COL.HO_TEN] || "").trim(),
    cccd: String(r[HDNCC_COL.CCCD] || "").trim(),
    soHD: String(r[HDNCC_COL.SO_HD] || "").trim(),
    ngayKy: utils.formatDate(r[HDNCC_COL.NGAY_KY]),
    ngayKyRaw: r[HDNCC_COL.NGAY_KY] instanceof Date ? r[HDNCC_COL.NGAY_KY].getTime() : 0,
    slDuKien: utils.parseNum(r[HDNCC_COL.SL_DU_KIEN]),
    nguoiUQ: String(r[HDNCC_COL.NGUOI_UQ] || "").trim(),
    uyQuyenTT: String(r[HDNCC_COL.UY_QUYEN_TT] || "").trim() || "Không"
  })).filter(x => x.hoTen && x.cccd && x.soHD);

  const taiKhoan = _hdStkData_().map(r => ({
    hoTen: String(r[HDSTK_COL.HO_TEN] || "").trim(),
    cccd: String(r[HDSTK_COL.CCCD] || "").trim(),
    nguoiUQ: String(r[HDSTK_COL.NGUOI_UQ] || "").trim(),
    stk: String(r[HDSTK_COL.STK] || "").trim(),
    nganHang: String(r[HDSTK_COL.NGAN_HANG] || "").trim(),
    soHD: String(r[HDSTK_COL.SO_HD] || "").trim()
  })).filter(x => x.hoTen && x.cccd && x.stk);

  return { hopDong, taiKhoan, generatedAt: new Date().getTime() };
}

/**
 * #13: Tóm lược hợp đồng - Ngày ký / SL dự kiến / SL đã thực hiện (tổng
 * hợp từ DNTT_GK_DN_CT THẬT) / Còn lại hoặc Đã vượt / các lần đã thanh
 * toán (ngày, STK, ngân hàng, số tiền) từ DNTT_GK_DN_112 THẬT đã chốt.
 * stkDangDeNghi (tùy chọn): nếu truyền vào, tính thêm số lần đã chuyển
 * riêng cho đúng tài khoản đang đề nghị lần này.
 */
function getHopDongSummary_(soHD, stkDangDeNghi) {
  const key = utils.standardize(soHD);
  if (!key) return null;

  const hdRow = _hdNccData_().find(r => utils.standardize(r[HDNCC_COL.SO_HD]) === key);

  // MỚI (mục AA): đọc từ cache tiến độ (làm mới định kỳ 7:30/13:00) thay
  // vì quét lại CT thật + 112 thật mỗi lần - nhanh hơn nhiều lần vì hàm
  // này được gọi liên tục khi đổi Số HĐ/STK ở Bước 2.
  const cacheRow = _hdTienDoData_().find(r => utils.standardize(r[0]) === key);

  let slThucHien = 0, danhSachLanTT = [];
  if (cacheRow) {
    slThucHien = utils.parseNum(cacheRow[4]);
    try { danhSachLanTT = JSON.parse(cacheRow[6] || "[]"); } catch (e) { danhSachLanTT = []; }
  } else {
    // Hợp đồng chưa có trong cache (mới thêm, chưa tới giờ làm mới định
    // kỳ) -> tính bù trực tiếp 1 lần cho riêng hợp đồng này (chậm hơn
    // nhưng không sai/thiếu dữ liệu).
    const live = _computeHopDongTienDoLiveSingle_(key);
    slThucHien = live.slThucHien;
    danhSachLanTT = live.danhSachLanTT;
  }

  const slDuKien = hdRow ? utils.parseNum(hdRow[HDNCC_COL.SL_DU_KIEN]) : 0;
  const stkKey = utils.standardize(stkDangDeNghi);
  const soLanChoTKDangDeNghi = stkKey ? danhSachLanTT.filter(x => utils.standardize(x.stk) === stkKey).length : 0;

  return {
    soHD: soHD,
    ngayKy: hdRow ? utils.formatDate(hdRow[HDNCC_COL.NGAY_KY]) : "",
    slDuKien: slDuKien,
    slThucHien: slThucHien,
    conLaiHayVuot: slDuKien - slThucHien, // >=0: còn lại; <0: đã vượt |giá trị|
    soLanDaThanhToan: danhSachLanTT.length,
    danhSachLanThanhToan: danhSachLanTT,
    soLanChoTKDangDeNghi: soLanChoTKDangDeNghi
  };
}

// ============================================================
// THÊM MỚI ĐỀ NGHỊ THANH TOÁN
// SỬA (mục J): nguồn (DNTT_GK_DN) vẫn ghi thẳng vào dữ liệu THẬT (chỉ là
// "đơn xin"), nhưng phần chi tiết (Draft CT) và placeholder (Draft 112)
// giờ tạo THẲNG vào File Nháp - tương đương tự chạy "Tách Phiếu" cho
// riêng hồ sơ này, đồng thời giữ tạm Số phiếu cân ngay lập tức.
// SỬA (mục M): thêm "Ngày đề nghị" là trường BẮT BUỘC do người dùng
// nhập (khác với Timestamp = giờ hệ thống tự động).
// ============================================================
/** Khóa các phiếu cân đã thanh toán trong PhieuCan_DN (Trạng thái OK, ID_DNTT
 * "Đóng TT", Chọn TT "Y" - chỉ ghi đúng các ô) và bỏ khỏi cache "chưa TT"
 * ngay, không chờ lần làm mới định kỳ. Dùng cho Duyệt và Khôi phục. */
function _khoaPhieuCanDaTra_(shPC, soKeySet) {
  if (!soKeySet.size) return;
  const { dong } = _dongPhieuCanTheoSo_(shPC, soKeySet);
  _ghiCungGiaTri_(shPC, dong, PC_COL.TRANG_THAI + 1, PC_COL.TRANG_THAI + 1, "OK");
  _ghiCungGiaTri_(shPC, dong, PC_COL.ID_DNTT + 1, PC_COL.ID_DNTT + 1, PC_ID_DNTT_DA_TRA);
  _ghiCungGiaTri_(shPC, dong, PC_COL.CHON_TT + 1, PC_COL.CHON_TT + 1, "Y");
  _invalidatePcCache_();
  _removeFromPcUnpaidCache_(soKeySet);
}

/** Mọi dòng (1-based) của PhieuCan_DN có Số phiếu cân (cột SO_CT - đúng cột
 * CT/Nháp lưu) thuộc soKeySet (đã chuẩn hóa), đọc lại cột ngay lúc gọi.
 * khongThay: các số không có dòng nào. Dùng chung cho khóa (Duyệt, Khôi phục),
 * mở khóa (Mở Đóng TT) và sửa tên khách hàng - để cả 3 luôn tìm cùng 1 cột. */
function _dongPhieuCanTheoSo_(shPC, soKeySet) {
  const dong = [], thay = new Set();
  const lr = shPC.getLastRow();
  if (lr > 1) {
    shPC.getRange(2, PC_COL.SO_CT + 1, lr - 1, 1).getValues().forEach((r, i) => {
      const k = utils.isBlank(r[0]) ? "" : utils.standardize(r[0]);
      if (k && soKeySet.has(k)) { dong.push(i + 2); thay.add(k); }
    });
  }
  return { dong, khongThay: Array.from(soKeySet).filter(k => !thay.has(k)) };
}

/** Số phiếu cân (đã chuẩn hóa) ĐÃ CHỐT THANH TOÁN trong CT thật -> ID hồ sơ
 * đã trả. Đây là nguồn chắc chắn: cache "phiếu cân chưa TT" có thể còn
 * cũ vài phút (lượt tự làm mới chạy trùng lúc Duyệt) nên KHÔNG được dùng
 * một mình để quyết định phiếu cân còn trả được hay không. */
function _phieuCanDaTraThat_(ctThatRows) {
  const m = new Map();
  ctThatRows.forEach(r => { const so = utils.standardize(r[11]); if (so) m.set(so, String(r[1] || "").trim()); });
  return m;
}
/** Chặn trả 2 lần khi lập/sửa hồ sơ: lỗi nếu có phiếu cân đã chốt trong CT thật. */
function _chanPhieuCanDaTra_(dsSoPhieu) {
  const daTra = _phieuCanDaTraThat_(_ctThatDataCache_());
  const trung = dsSoPhieu.filter(so => daTra.has(utils.standardize(so)));
  if (trung.length) throw new Error(`Số phiếu cân ${trung.map(so => `"${so}"`).join(", ")} ĐÃ ĐƯỢC THANH TOÁN (hồ sơ ${trung.map(so => daTra.get(utils.standardize(so))).join(", ")}) - không thể thanh toán lần nữa.`);
}

function createNewPaymentRequest_(payload) {
  let lock;
  try {
    lock = sysLock.acquire();
    if (!payload) throw new Error("Không nhận được dữ liệu đầu vào.");

    const required = ['hoTenChuRung', 'cccdChuRung', 'nguoiDeNghi', 'nguoiNhanTien', 'soTKNhanTien', 'nganHang', 'soHopDong', 'ngayDeNghi'];
    for (const f of required) {
      if (!payload[f] || String(payload[f]).trim() === "") throw new Error("Thiếu thông tin bắt buộc: " + f);
    }
    const ngayDeNghiDate = new Date(payload.ngayDeNghi);
    if (isNaN(ngayDeNghiDate.getTime())) throw new Error("Ngày đề nghị không hợp lệ.");
    const dsPC = (payload.danhSachPhieuCan || []).map(x => String(x).trim()).filter(Boolean);
    if (dsPC.length === 0) throw new Error("Vui lòng chọn ít nhất 1 số phiếu cân.");
    _chanPhieuCanDaTra_(dsPC);

    const ss = getMainSs_();
    // MỚI (mục AI): "đơn xin" gốc ghi vào Draft (shSrc từ getDraftSheets_)
    // thay vì ghi thẳng bản CHÍNH - chỉ copy sang bản chính khi Đóng
    // Thanh Toán (xem runConfirmPayment_).
    const { shCT: shDraftCT, sh112: shDraft112, shSrc: shDraftSrc } = getDraftSheets_();

    // SỬA (mục P - tối ưu tốc độ): chỉ cần tra cứu trong các phiếu cân
    // CHƯA thanh toán (đúng đối tượng được phép chọn) -> dùng cache nhỏ.
    const pcMap = utils.buildIndexMap(_pcUnpaidData_(), PC_COL.SO_CT, true);

    const heldByDraft = new Set();
    const draftLastRow = shDraftCT.getLastRow();
    if (draftLastRow > 1) {
      shDraftCT.getRange(2, 12, draftLastRow - 1, 1).getValues().forEach(r => {
        const k = utils.standardize(r[0]);
        if (k) heldByDraft.add(k);
      });
    }

    // 1. Kiểm tra từng phiếu cân được chọn
    let tongKLKg = 0;
    for (const soP of dsPC) {
      const key = utils.standardize(soP);
      const pcRow = pcMap.get(key);
      if (!pcRow) throw new Error(`Số phiếu cân "${soP}" không tồn tại trong hệ thống Phiếu Cân.`);
      const trangThai = String(pcRow[PC_COL.ID_DNTT] || "").trim();
      const daKhoa = String(pcRow[PC_COL.CHON_TT] || "").trim().toUpperCase();
      if (trangThai || daKhoa === "Y" || daKhoa === "N") {
        throw new Error(`Số phiếu cân "${soP}" đã được sử dụng cho một đề nghị thanh toán CHÍNH THỨC khác.`);
      }
      if (heldByDraft.has(key)) {
        throw new Error(`Số phiếu cân "${soP}" đang được giữ tạm bởi 1 hồ sơ NHÁP khác chưa chốt.`);
      }
      tongKLKg += utils.parseNum(pcRow[PC_COL.KL_KG]);
    }

    // 2. Tính Lần thanh toán + Ngày dự kiến TT
    const session = getSessionInfo_();
    const now = new Date();

    // 3. Sinh ID_KEY duy nhất - kiểm tra CẢ Draft lẫn bản CHÍNH (phòng
    // trường hợp ID cũ đã copy sang bản chính từ trước) để không trùng.
    const shSrcReal = ss.getSheetByName(CFG.DNTT_SRC);
    const existingIds = new Set();
    if (shDraftSrc.getLastRow() > 1) {
      shDraftSrc.getRange(2, 1, shDraftSrc.getLastRow() - 1, 1).getValues().flat()
        .forEach(v => { const s = String(v).trim(); if (s) existingIds.add(s); });
    }
    if (shSrcReal && shSrcReal.getLastRow() > 1) {
      shSrcReal.getRange(2, 1, shSrcReal.getLastRow() - 1, 1).getValues().flat()
        .forEach(v => { const s = String(v).trim(); if (s) existingIds.add(s); });
    }
    let newId;
    do { newId = Utilities.getUuid().split('-')[0]; } while (existingIds.has(newId));

    const userEmail = _emailNguoiThucHien_();

    // 4. Ghi "đơn xin" gốc vào DRAFT (mục AI) - KHÔNG ghi thẳng bản
    // chính nữa. Chỉ copy sang DNTT_GK_DN thật khi Đóng Thanh Toán.
    const newSrcRow = new Array(18).fill("");
    newSrcRow[0] = newId; newSrcRow[1] = now; newSrcRow[2] = userEmail;
    newSrcRow[3] = payload.hoTenChuRung; newSrcRow[4] = _chu_(payload.cccdChuRung || "");
    newSrcRow[5] = payload.nguoiDeNghi; newSrcRow[6] = payload.chuRungUyQuyen || "Không";
    newSrcRow[7] = payload.nguoiNhanTien; newSrcRow[8] = _chu_(payload.soTKNhanTien);
    newSrcRow[9] = tongKLKg; newSrcRow[10] = dsPC.join(", "); newSrcRow[11] = ngayDeNghiDate;
    newSrcRow[12] = newId; newSrcRow[13] = _chu_(payload.soHopDong);
    newSrcRow[14] = "Đang xử lý (Nháp)"; newSrcRow[15] = ""; newSrcRow[16] = ""; newSrcRow[17] = "";
    shDraftSrc.appendRow(_dongAnToan_([newSrcRow], COT_CHU.SRC)[0]);

    // 5. Tạo trực tiếp các dòng Draft CT (tương đương "Tách Phiếu" cho
    // riêng hồ sơ này) - đẩy ngay vào File Nháp, giữ tạm Phiếu Cân luôn.
    const srcInfo = {
      timestamp: now, chuRung: payload.hoTenChuRung, cccd: payload.cccdChuRung,
      nguoiDN: payload.nguoiDeNghi, nguoiNhan: payload.nguoiNhanTien,
      stkNguoiNhan: payload.soTKNhanTien, klTongNguon: tongKLKg, dsPhieuCanGoc: dsPC.join(", "),
      soHD: payload.soHopDong, ngayTT: "", ngayDeNghi: ngayDeNghiDate
    };
    const draftRows = dsPC.map((soP, idx) => buildDraftCtRow_(newId, idx + 1, soP, srcInfo, pcMap).row);
    shDraftCT.getRange(shDraftCT.getLastRow() + 1, 1, draftRows.length, 22).setValues(_dongAnToan_(draftRows, COT_CHU.CT));

    // 6. Tạo placeholder Draft 112 (Số tiền/Nội dung CK sẽ được tính khi
    // chạy "Tổng Hợp 112")
    const id112 = Utilities.formatDate(now, "GMT+7", "yyyyMMddHHmmss") + ("0000" + Math.floor(Math.random() * 10000)).slice(-4);
    const new112Row = new Array(24).fill(""); // mục U: +1 cột "Trạng Thái ĐNTT" (mặc định rỗng = Chờ ĐNTT)
    new112Row[0] = newId; new112Row[1] = now; new112Row[2] = payload.hoTenChuRung;
    new112Row[3] = payload.nguoiNhanTien; new112Row[4] = payload.nganHang;
    new112Row[5] = _chu_(payload.soTKNhanTien); new112Row[6] = ""; new112Row[7] = "";
    new112Row[8] = _chu_(payload.soHopDong);
    new112Row[9] = _parseNgayVN_(payload.ngayHopDong);
    new112Row[10] = payload.chuRungUyQuyen || "Không"; new112Row[11] = tongKLKg;
    // SỬA LỖI (theo yêu cầu): "SL HĐ Dự Kiến" (cột 17) trước đây KHÔNG
    // BAO GIỜ được gán giá trị - tra lại đúng hợp đồng trong HD_NCC (đã
    // lọc "Đang Thực Hiện") để lấy Sản Lượng Dự Kiến đúng của hợp đồng.
    const hdRowChoSL = _hdNccData_().find(r => utils.standardize(r[HDNCC_COL.SO_HD]) === utils.standardize(payload.soHopDong));
    new112Row[17] = hdRowChoSL ? utils.parseNum(hdRowChoSL[HDNCC_COL.SL_DU_KIEN]) : 0;
    new112Row[16] = ngayDeNghiDate; new112Row[18] = session.lan; new112Row[19] = session.ngayDuKien;
    new112Row[22] = _chu_(id112);
    shDraft112.getRange(shDraft112.getLastRow() + 1, 1, 1, 24).setValues(_dongAnToan_([new112Row], COT_CHU.H112));

    SpreadsheetApp.flush();
    logAction_("TAO_MOI_DNTT_NHAP", newId, `Tạo mới (vào File Nháp) cho ${payload.hoTenChuRung}, HĐ ${payload.soHopDong}, ${dsPC.length} phiếu cân, KL ${tongKLKg}kg, Lần ${session.lan}`);

    return {
      success: true,
      idKey: newId,
      lan: session.lan,
      ngayDuKien: utils.formatDate(session.ngayDuKien),
      tongKLKg: tongKLKg,
      soLuongPhieu: dsPC.length
    };
  } catch (e) {
    return { success: false, message: _loiChoNguoiDung_(e) };
  } finally {
    if (lock) lock.releaseLock();
  }
}

// ============================================================
// MỚI (mục J): XÓA 1 HỒ SƠ KHỎI FILE NHÁP
// Xóa toàn bộ Draft CT + Draft 112 của 1 ID_KEY. Vì "giữ tạm" Số phiếu
// cân được suy ra TRỰC TIẾP từ nội dung Draft CT, xóa xong thì các Số
// phiếu cân của hồ sơ đó TỰ ĐỘNG được giải phóng - không cần bước "mở
// khóa" riêng. KHÔNG đụng đến dữ liệu CHÍNH THỨC.
// ============================================================
function runDeleteDraftRecord_(idKey) {
  let lock;
  try {
    lock = sysLock.acquire();
    const id = String(idKey || "").trim();
    if (!id) return "❌ Lỗi: Vui lòng nhập ID hồ sơ cần xóa khỏi Nháp.";

    const { shCT: shDraftCT, sh112: shDraft112, shSrc: shDraftSrc } = getDraftSheets_();

    // SỬA (tối ưu): trước đây đọc sheet Draft112 2 LẦN (1 lần kiểm tra
    // "Chờ ĐNTT" - mục W, 1 lần để xóa) - giờ gộp lại ĐỌC 1 LẦN DUY NHẤT,
    // dùng chung cho cả kiểm tra lẫn xóa.
    const c112LastRow = shDraft112.getLastRow();
    const all112 = c112LastRow > 1 ? shDraft112.getRange(2, 1, c112LastRow - 1, 24).getValues() : [];
    const row112Check = all112.find(r => String(r[0] || "").trim() === id);
    if (row112Check && !_isRecordEditable_(row112Check)) {
      return `❌ Không thể xóa: hồ sơ "${id}" chưa/đã qua trạng thái "Chờ ĐNTT". Hãy bấm "Về Chờ ĐNTT" trước nếu đang ở "Đang ĐNTT".`;
    }

    const ctLastRow = shDraftCT.getLastRow();
    let ctRemoved = 0;
    if (ctLastRow > 1) {
      const ctAll = shDraftCT.getRange(2, 1, ctLastRow - 1, 22).getValues();
      const kept = ctAll.filter(r => String(r[1] || "").trim() !== id);
      ctRemoved = ctAll.length - kept.length;
      if (ctRemoved > 0) _thayVungDuLieu_(shDraftCT, 2, 22, ctAll.length, kept, COT_CHU.CT);
    }

    let c112Removed = 0;
    if (all112.length > 0) {
      const kept112 = all112.filter(r => String(r[0] || "").trim() !== id);
      c112Removed = all112.length - kept112.length;
      if (c112Removed > 0) _thayVungDuLieu_(shDraft112, 2, 24, all112.length, kept112, COT_CHU.H112);
    }

    // MỚI (mục AI): xóa luôn dòng "đơn xin" tương ứng khỏi Draft
    // (DNTT_GK_DN_DRAFT) - vì giờ hồ sơ tạo qua Web App chỉ nằm ở Draft
    // cho tới khi Đóng Thanh Toán, không còn ở bản chính để phải "reset
    // trạng thái" như trước.
    let srcRemoved = 0;
    try {
      const srcLastRow = shDraftSrc.getLastRow();
      if (srcLastRow > 1) {
        const srcAll = shDraftSrc.getRange(2, 1, srcLastRow - 1, 18).getValues();
        const srcKept = srcAll.filter(r => String(r[0] || "").trim() !== id);
        srcRemoved = srcAll.length - srcKept.length;
        if (srcRemoved > 0) _thayVungDuLieu_(shDraftSrc, 2, 18, srcAll.length, srcKept, COT_CHU.SRC);
      }
    } catch (e) { /* không chặn luồng chính */ }

    // Tương thích ngược: hồ sơ hiếm được "Tách Phiếu" thủ công từ Sheet
    // (runProcessDetail(), vẫn dùng thẳng bản chính) - reset trạng thái
    // tại chỗ như cũ để có thể "Tách Phiếu" lại.
    try {
      const shSrcReal = getMainSs_().getSheetByName(CFG.DNTT_SRC);
      if (shSrcReal) {
        const lastRow = shSrcReal.getLastRow();
        if (lastRow > 1) {
          const idsCol = shSrcReal.getRange(2, 1, lastRow - 1, 1).getValues();
          for (let i = 0; i < idsCol.length; i++) {
            if (String(idsCol[i][0]).trim() === id) {
              const cell = shSrcReal.getRange(i + 2, 15);
              if (cell.getValue() === "Đang xử lý (Nháp)") cell.setValue("");
              break;
            }
          }
        }
      }
    } catch (e) { /* không chặn luồng chính */ }

    SpreadsheetApp.flush();

    if (ctRemoved === 0 && c112Removed === 0 && srcRemoved === 0) {
      return `⚠️ Không tìm thấy hồ sơ "${id}" trong File Nháp.`;
    }

    // MỚI (theo yêu cầu - "xóa dòng thì Chi Tiết Chuyển Khoản/UNC vẫn
    // tồn tại"): hồ sơ vừa bị xóa khỏi Nháp TRƯỚC KHI từng Đóng Thanh
    // Toán - nếu trước đó đã "In Báo Cáo ĐNTT" (ghi N vào ChiTietDNTT)
    // hoặc "Tạo File UNC" (ghi vào ChiTietUNC) cho hồ sơ này, các dòng
    // đó giờ MỒ CÔI (hồ sơ không còn tồn tại ở đâu cả) - dọn theo, tránh
    // sót dữ liệu sai lệch trong "Báo Cáo Thanh Toán Chi Tiết"/"Báo Cáo UNC".
    // v2026.9.7: sao lưu trước khi xóa (SYS_SaoLuuDongXoa, khôi phục được ở
    // Hệ Thống) và xóa theo khối - trước đây xóa từng dòng, không sao lưu (mất
    // cả lịch sử UNC có thể đã nộp ngân hàng).
    let chiTietDnttXoa = 0, chiTietUncXoa = 0;
    const maThaoTac = _maThaoTacMoi_("XOA_NHAP");
    const laCuaHoSo = r => String(r[0] || "").trim() === id;
    try {
      const shCTietDntt = getMainSs_().getSheetByName(CHITIET_DNTT_SHEET);
      if (shCTietDntt) chiTietDnttXoa = _saoLuuVaXoaDong_(shCTietDntt, laCuaHoSo, "XOA_NHAP", maThaoTac);
    } catch (e) { logAction_("LOI_DON_DEP_KHI_XOA_NHAP", id, "ChiTietDNTT: " + _loiChoNguoiDung_(e)); }
    try {
      const shCTietUnc = getMainSs_().getSheetByName(CHITIET_UNC_SHEET);
      if (shCTietUnc) chiTietUncXoa = _saoLuuVaXoaDong_(shCTietUnc, laCuaHoSo, "XOA_NHAP", maThaoTac);
    } catch (e) { logAction_("LOI_DON_DEP_KHI_XOA_NHAP", id, "ChiTietUNC: " + _loiChoNguoiDung_(e)); }

    logAction_("XOA_NHAP", id, `Đã xóa ${ctRemoved} dòng CT nháp, ${c112Removed} dòng 112 nháp, ${srcRemoved} dòng nguồn nháp, ${chiTietDnttXoa} dòng ChiTietDNTT, ${chiTietUncXoa} dòng ChiTietUNC.`);
    let ketQuaTraVe = `✅ Đã xóa hồ sơ "${id}" khỏi File Nháp (${ctRemoved} dòng chi tiết, ${c112Removed} dòng tổng hợp). Các Số phiếu cân liên quan đã được giải phóng.`;
    if (chiTietDnttXoa || chiTietUncXoa) ketQuaTraVe += ` Đã dọn theo ${chiTietDnttXoa} dòng ChiTietDNTT + ${chiTietUncXoa} dòng ChiTietUNC (nếu đã từng In Báo Cáo ĐNTT/Tạo UNC cho hồ sơ này).`;
    return ketQuaTraVe;
  } catch (e) {
    return "❌ Lỗi: " + _loiChoNguoiDung_(e);
  } finally { if (lock) lock.releaseLock(); }
}

// ============================================================
// MỚI (mục K): CÁC HÀM PHỤC VỤ WEB APP (menu từng bước)
// ============================================================

/**
 * Số liệu tổng quan cho Trang chủ.
 */
/**
 * MỚI (theo yêu cầu - code chạy độc lập): kiểm tra múi giờ của PROJECT
 * Apps Script này - CỰC KỲ QUAN TRỌNG vì mọi lịch chạy nền (7:30, 13:00,
 * 15:00, cửa sổ 7:30-19:00) và cả cách tính "Lần Thanh Toán" theo giờ
 * trong ngày (getSessionInfo_()) đều dựa vào múi giờ NÀY - không phải
 * GMT+7 hardcode. Trước đây code gắn liền với file Sheet (thường tự kế
 * thừa múi giờ Việt Nam từ file đó); giờ code độc lập, project MỚI có
 * thể mặc định múi giờ KHÁC (vd UTC) nếu không chỉnh tay trong Project
 * Settings > Time zone.
 */
function _kiemTraMuiGio_() {
  const tz = Session.getScriptTimeZone();
  const dungVN = tz === "Asia/Ho_Chi_Minh" || tz === "Asia/Bangkok" || tz === "Asia/Jakarta" || tz === "GMT+7" || tz === "Etc/GMT-7";
  return { timezone: tz, dungVN };
}

/**
 * MỚI (theo yêu cầu làm rõ - "ngày giờ ghi vào Sheet có bị lỗi không?"):
 * new Date(y, m, d) hiểu y/m/d theo múi giờ CỦA PROJECT (Project
 * Settings > Time zone) - nếu project CHƯA cấu hình đúng giờ Việt Nam
 * (xem _kiemTraMuiGio_()), ngày dựng ra có thể lệch 1 ngày so với ý
 * định. Hàm này tính qua UTC + neo CỨNG vào 12:00 trưa giờ Việt Nam
 * (GMT+7) - LUÔN ra đúng ngày dự định bất kể Project đã cấu hình đúng
 * múi giờ hay chưa. Dùng thay cho new Date(y, m-1, d) ở MỌI nơi cần
 * dựng Date từ ngày/tháng/năm do người dùng NHẬP (vd "Ngày thanh toán"
 * khi Đóng Thanh Toán) - không dùng cho "Timestamp" (đó là new Date()
 * - "bây giờ", luôn đúng vì không có bước diễn giải y/m/d nào cả.
 */
function _ngayVNTruaThat_(y, m, d) {
  return new Date(Date.UTC(y, m - 1, d, 5, 0, 0)); // 05:00 UTC = 12:00 GMT+7 cùng ngày
}

/** MỚI (tối ưu tốc độ - "webapp load rất chậm"): CHỈ trả 2 giá trị RẺ
 * (không đọc sheet nào) - dùng cho 2 chỗ TRƯỚC ĐÂY lỡ gọi thẳng
 * getDashboardStats_() (giờ đã tính RẤT NHIỀU thứ: Mua/Thanh Toán tháng
 * này, Nguồn Gốc/Đại Lý, Công Nợ Top 5...) chỉ để đọc đúng 2 trường
 * mainSetup/muiGio: (1) bước điều hướng lúc khởi động trang (kiểm tra đã
 * cấu hình File Chính chưa để vào Dashboard hay Cài Đặt), (2) mở trang
 * Cài Đặt. Cả 2 chỗ này chạy TRƯỚC KHI trang thật sự hiện ra - gọi nhầm
 * hàm nặng ở đây khiến toàn bộ trang phải chờ tính xong Trang chủ dù
 * chưa cần hiển thị gì từ đó cả. */
function getAppSetupStatus_() {
  return {
    mainSetup: !!PropertiesService.getScriptProperties().getProperty('MAIN_SS_ID'),
    muiGio: _kiemTraMuiGio_()
  };
}

/** MỚI (tối ưu tốc độ): CHỈ đếm số hồ sơ đang ở File Nháp - dùng cho huy
 * hiệu (badge) trên thanh điều hướng, vốn TRƯỚC ĐÂY gọi thẳng
 * getDashboardStats_() (rất nặng, xem trên) chỉ để lấy 1 con số này. Huy
 * hiệu này được làm mới liên tục (sau mỗi thao tác ở Danh Sách ĐNTT) nên
 * càng cần nhẹ - getDraftListSummary_() chỉ đọc 2 sheet Nháp (CT+112),
 * không đụng tới Phiếu Cân/CT thật/Công Nợ như getDashboardStats_(). */
function getDraftBadgeCount_() {
  try {
    return getDraftListSummary_().length;
  } catch (e) {
    return 0;
  }
}

function getDashboardStats_() {
  const result = {
    draftSetup: true, // MỚI: File Nháp giờ LÀ chính file đang chạy - luôn sẵn sàng, tự tạo sheet nếu thiếu (xem getDraftSheets_())
    mainSetup: !!PropertiesService.getScriptProperties().getProperty('MAIN_SS_ID'), // MỚI: để Web App biết hiện form cấu hình File Chính nếu chưa có
    muiGio: _kiemTraMuiGio_(), // MỚI: cảnh báo nếu múi giờ project sai (ảnh hưởng toàn bộ lịch chạy nền)
    draftCount: 0, draftReady: 0, draftPending: 0, draftTotalTien: 0,
    klMuaThangKg: 0, tienMuaThang: 0, klThanhToanThangTan: 0, tienThanhToanThang: 0,
    muaTheoNguonGoc: [], muaTheoDaiLy: [],
    tongNoGoKeo: 0, top5KhachHangNo: [], congNoCapNhatLuc: ""
  };
  try {
    const list = getDraftListSummary_();
    result.draftCount = list.length;
    result.draftReady = list.filter(x => x.sanSangChot).length;
    result.draftPending = result.draftCount - result.draftReady;
    result.draftTotalTien = list.reduce((s, x) => s + (x.sanSangChot ? x.soTien : 0), 0);
  } catch (e) { /* File Nháp chưa thiết lập -> giữ giá trị mặc định */ }

  // Tổng nợ + Top 5: số đã tổng hợp (xem _luuCongNoTrangChu_), không tính lại công nợ khi mở trang.
  try {
    const cn = _congNoTrangChu_();
    result.tongNoGoKeo = cn.tongNo || 0;
    result.top5KhachHangNo = cn.top5 || [];
    result.congNoCapNhatLuc = cn.capNhatLuc || "";
  } catch (e) {}

  // "Tháng này" (mua, thanh toán, theo Nguồn gốc / Đại lý) lấy từ
  // PhanTichNhapTT_DRAFT do trigger 15h tổng hợp (cùng quy tắc: mua theo
  // ngày cân, thanh toán theo ngày CK, tên NG qua DM_NG) - Trang chủ không
  // quét PhieuCan_DN mỗi lần mở. Ngày chưa có trong bảng (vd hôm nay trước
  // 15h) được tính bù 1 lần rồi dùng lại.
  try {
    const homNay = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
    const dong = _docPhanTichTheoKhoang_(homNay.slice(0, 8) + "01", homNay);
    const gom = (loai, phanLoai) => {
      const m = new Map();
      dong.forEach(r => {
        if (String(r[1]) !== loai || String(r[2]) !== phanLoai) return;
        const ten = String(r[3]);
        const o = m.get(ten) || { ten, klKg: 0, tien: 0 };
        o.klKg += utils.parseNum(r[4]); o.tien += utils.parseNum(r[5]);
        m.set(ten, o);
      });
      return Array.from(m.values()).sort((a, b) => b.klKg - a.klKg);
    };
    const tong = loai => gom(loai, "TONG").reduce((s, o) => ({ klKg: s.klKg + o.klKg, tien: s.tien + o.tien }), { klKg: 0, tien: 0 });
    const nhap = tong("NHAP"), tt = tong("THANHTOAN");
    result.klMuaThangKg = nhap.klKg;
    result.tienMuaThang = nhap.tien;
    result.klThanhToanThangTan = tt.klKg; // phần Thanh toán lưu KL theo tấn (cột "KL Tấn" của CT)
    result.tienThanhToanThang = tt.tien;
    result.muaTheoNguonGoc = gom("NHAP", "NG");
    result.muaTheoDaiLy = gom("NHAP", "DL");
    result.thangNayCapNhatLuc = PropertiesService.getScriptProperties().getProperty(PHANTICH_CAP_NHAT_LUC_PROP) || "";
  } catch (e) {}

  return result;
}

/**
 * Danh sách hồ sơ đang có trong File Nháp (gộp CT + 112), dùng cho màn
 * "Danh Sách Nháp" của Web App.
 */
function getDraftListSummary_() {
  const { shCT, sh112 } = getDraftSheets_();
  const ctLastRow = shCT.getLastRow();
  const ctAll = ctLastRow > 1 ? shCT.getRange(2, 1, ctLastRow - 1, 22).getValues() : [];
  const the112LastRow = sh112.getLastRow();
  const the112All = the112LastRow > 1 ? sh112.getRange(2, 1, the112LastRow - 1, 24).getValues() : [];

  const ctGrouped = {};
  ctAll.forEach(r => {
    const id = String(r[1] || "").trim();
    if (!id) return;
    if (!ctGrouped[id]) ctGrouped[id] = [];
    ctGrouped[id].push(r);
  });

  return the112All.filter(r => !utils.isBlank(r[0])).map(r => {
    const id = String(r[0]).trim();
    const details = ctGrouped[id] || [];
    const soTien = utils.parseNum(r[6]);
    const sanSangChot = soTien > 0;
    const daXacNhan = String(r[COL_TRANG_THAI_DNTT] || "").trim() === "Đang ĐNTT";
    // mục U: 3 trạng thái - "cho_tinh" (chưa tính tiền) / "cho_dntt" (đã
    // tính tiền, chưa Xác Nhận) / "dang_dntt" (đã Xác Nhận, chờ Duyệt).
    const trangThaiKey = !sanSangChot ? "cho_tinh" : (daXacNhan ? "dang_dntt" : "cho_dntt");
    const trangThaiLabel = !sanSangChot ? "Chưa ĐNTT" : (daXacNhan ? "Đang ĐNTT" : "Chờ ĐNTT");
    // Ngày đề nghị: cột Q của 112 Nháp; hồ sơ tạo từ bản cũ lấy ở cột V của CT Nháp.
    const ngayDN = r[16] instanceof Date ? r[16] : (details.find(d => d[21] instanceof Date) || [])[21];
    return {
      idKey: id,
      timestamp: utils.formatDate(r[1]),
      ngayDeNghi: ngayDN instanceof Date ? utils.formatDate(ngayDN) : "",
      ngayDeNghiISO: ngayDN instanceof Date ? Utilities.formatDate(ngayDN, "GMT+7", "yyyy-MM-dd") : "",
      chuRung: String(r[2] || ""),
      nguoiNhan: String(r[3] || ""),
      nganHang: String(r[4] || ""),
      stk: String(r[5] || "").replace(/'/g, ""),
      soTien: soTien,
      noiDungCK: String(r[7] || ""),
      soHD: String(r[8] || "").replace(/'/g, ""),
      klTongKg: utils.parseNum(r[11]),
      soLuongPhieu: details.length,
      danhSachPhieuCan: details.map(d => String(d[11] || "").replace(/'/g, "")),
      ghiChu: String(r[15] || ""),
      sanSangChot: sanSangChot,
      daXacNhan: daXacNhan,
      trangThaiKey: trangThaiKey,
      trangThaiLabel: trangThaiLabel
    };
  }).sort((a, b) => (a.chuRung || "").localeCompare(b.chuRung || ""));
}

/**
 * Chi tiết 1 hồ sơ trong Nháp (dùng cho modal Xem/Sửa).
 */
function getDraftRecordDetail_(idKey) {
  const id = String(idKey || "").trim();
  if (!id) return null;
  const { shCT, sh112 } = getDraftSheets_();

  const ctLastRow = shCT.getLastRow();
  const ctAll = ctLastRow > 1 ? shCT.getRange(2, 1, ctLastRow - 1, 22).getValues() : [];
  const the112LastRow = sh112.getLastRow();
  const all112 = the112LastRow > 1 ? sh112.getRange(2, 1, the112LastRow - 1, 24).getValues() : [];
  const row = all112.find(r => String(r[0] || "").trim() === id);
  if (!row) return null;
  return Object.assign(_chiTietHoSo_(row, ctAll.filter(r => String(r[1] || "").trim() === id)), {
    daXacNhan: String(row[COL_TRANG_THAI_DNTT] || "").trim() === "Đang ĐNTT"
  });
}

/** Nội dung chuyển khoản của hồ sơ: "Thanh toán tiền mua gỗ keo HĐ số <Số HĐ> ngày <Ngày ký
 * HĐ dd.MM.yyyy>" (Tổng Hợp 112 ghi vào sổ; phiếu PDF dùng khi ô trong sổ trống). */
function _noiDungCK_(soHD, ngayHD) {
  const so = String(soHD || "").replace(/'/g, "").trim();
  if (!so) return "";
  const ngay = _docNgaySo_(ngayHD);
  return `Thanh toán tiền mua gỗ keo HĐ số ${so}${ngay ? " ngày " + Utilities.formatDate(ngay, "GMT+7", "dd.MM.yyyy") : ""}`;
}

/** 1 hồ sơ (dòng sổ 112 - Nháp hoặc đã chốt, cùng bố cục cột) + các dòng sổ CT của nó
 * (cùng bố cục ở Nháp và đã chốt) -> dữ liệu cho modal Chi tiết và phiếu PDF. */
function _chiTietHoSo_(row, ctRows) {
  const chiTiet = ctRows.map(r => ({
    idCT: String(r[0] || ""),
    soPhieuCan: String(r[11] || "").replace(/'/g, ""),
    klTan: utils.parseNum(r[12]),
    thanhTien: utils.parseNum(r[16])
  }));
  return {
    idKey: String(row[0] || "").trim(),
    chuRung: String(row[2] || ""),
    nguoiNhan: String(row[3] || ""),
    nganHang: String(row[4] || ""),
    stk: String(row[5] || "").replace(/'/g, ""),
    soTien: utils.parseNum(row[6]),
    noiDungCK: String(row[7] || "").trim() || _noiDungCK_(row[8], row[9]),
    soHD: String(row[8] || "").replace(/'/g, ""),
    klTongKg: utils.parseNum(row[11]),
    // MỚI (theo yêu cầu - trước đây thiếu, luôn hiện rỗng): Sản Lượng HĐ
    // Dự Kiến (từ HD_NCC), Sản Lượng HĐ Lũy Kế (đã thực hiện), Còn Lại.
    slDuKien: utils.parseNum(row[17]),
    slLuyKe: utils.parseNum(row[12]),
    conLai: utils.parseNum(row[14]),
    ghiChu: String(row[15] || ""),
    chiTiet: chiTiet
  };
}

/** Phiếu chi tiết thanh toán (PDF): 2 loại phiếu, chữ ký cuối phiếu theo thứ tự trái -> phải. */
const PHIEU_CT_TT = {
  DE_NGHI: { TIEU_DE: "PHIẾU CHI TIẾT THANH TOÁN", TEN_FILE: "PHIEU CHI TIET THANH TOAN", NHAT_KY: "IN_PHIEU_CT_TT" },
  HOAN_THANH: { TIEU_DE: "PHIẾU CHI TIẾT HOÀN THÀNH THANH TOÁN", TEN_FILE: "PHIEU HOAN THANH THANH TOAN", NHAT_KY: "IN_PHIEU_HOAN_THANH_TT" },
  CHU_KY: ["Người lập phiếu", "Kế toán trưởng", "Giám đốc"],
  SO_LE_KL: 3
};

/** Dựng phiếu PDF của hồ sơ `r` theo `loai` (PHIEU_CT_TT.DE_NGHI / HOAN_THANH), lưu vào
 * thư mục Báo cáo, ghi nhật ký, trả link. */
function _luuPhieuPdf_(r, loai) {
  const tenFile = loai.TEN_FILE + " " + r.idKey;
  const pdf = Utilities.newBlob(_htmlPhieuChiTietThanhToan_(r, new Date(), loai.TIEU_DE), "text/html", tenFile + ".html")
    .getAs("application/pdf").setName(tenFile + ".pdf");
  const pdfUrl = DriveApp.getFolderById(getReportFolderId_()).createFile(pdf).getUrl();
  logAction_(loai.NHAT_KY, r.idKey, `In ${loai.TIEU_DE.toLowerCase()} PDF - ${pdfUrl}`);
  return { success: true, pdfUrl, message: `✅ Đã tạo ${loai.TIEU_DE.toLowerCase()} (PDF).` };
}

/** #Web: in "Phiếu chi tiết thanh toán" của 1 hồ sơ ĐNTT (Nháp) ra PDF. Số liệu lấy từ
 * getDraftRecordDetail_ (cùng nguồn với modal). */
function webInPhieuChiTietThanhToan_(idKey) {
  try {
    const r = getDraftRecordDetail_(idKey);
    if (!r) return { success: false, message: "❌ Không tìm thấy hồ sơ " + String(idKey || "") + "." };
    return _luuPhieuPdf_(r, PHIEU_CT_TT.DE_NGHI);
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  }
}

/** #Web (Báo Cáo Thanh Toán): "Phiếu chi tiết hoàn thành thanh toán" của 1 hồ sơ ĐÃ CHỐT,
 * có Ngày thanh toán = Ngày CK của sổ CT. ngayISO (Ngày ĐN trên màn hình) để tìm cả hồ sơ
 * thuộc năm đã khóa sổ. Chỉ đọc dòng của hồ sơ này. */
function webInPhieuHoanThanhThanhToan_(idKey, ngayISO) {
  try {
    const r = _hoSoHoanThanh_(idKey, ngayISO);
    if (!r) return { success: false, message: "❌ Không tìm thấy hồ sơ đã chốt " + String(idKey || "") + "." };
    return _luuPhieuPdf_(r, PHIEU_CT_TT.HOAN_THANH);
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  }
}

/** #Web (Báo Cáo Thanh Toán, bấm vào dòng hồ sơ): xem trước phiếu hoàn thành thanh toán -
 * trả đúng HTML của phiếu PDF (cùng hàm dựng) để xem trước khi in. */
function getPhieuHoanThanh_(idKey, ngayISO) {
  try {
    const r = _hoSoHoanThanh_(idKey, ngayISO);
    if (!r) return { success: false, message: "❌ Không tìm thấy hồ sơ đã chốt " + String(idKey || "") + "." };
    return { success: true, idKey: r.idKey, chuRung: r.chuRung, ngayCK: r.ngayCK,
      html: _htmlPhieuChiTietThanhToan_(r, new Date(), PHIEU_CT_TT.HOAN_THANH.TIEU_DE) };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  }
}

/** Hồ sơ ĐÃ CHỐT (sổ 112 + CT, có Ngày CK) cho phiếu hoàn thành thanh toán; null nếu không có.
 * ngayISO (Ngày ĐN trên màn hình) để tìm cả hồ sơ thuộc năm đã khóa sổ. Chỉ đọc dòng của hồ sơ này. */
function _hoSoHoanThanh_(idKey, ngayISO) {
  const id = String(idKey || "").trim();
  if (!id) return null;
  const khop = v => String(v || "").trim() === id;
  const nam = String(ngayISO || "").trim();
  const row = _docDongTheoKhoa_(getMainSs_().getSheetByName(CFG.DNTT_112), 0, 23, khop)
    .concat(nam ? _docLuuTruTrongKhoang_(CFG.DNTT_112, 23, nam, nam).filter(r => khop(r[0])) : [])[0];
  if (!row) return null;
  const ct = _ctDongCuaHoSo_([{ idHeThong: id, ngayISO: nam }]);
  const r = _chiTietHoSo_(row, ct);
  r.ngayCK = Array.from(new Set(ct.map(c => _ngayXuat_(c[20])).filter(Boolean))).join(", ");
  return r;
}

/** HTML của phiếu (file xuất: ngày giờ và số theo Vùng xuất; số căn phải, chữ căn trái;
 * 1 font, cỡ chữ như Bảng đề xuất). */
function _htmlPhieuChiTietThanhToan_(r, luc, tieuDe) {
  const vung = _getExportRegionPreset_();
  const so = (n, soLe) => _soHienThi_(n, soLe, vung);
  const e = _escHtml_;
  const dong = (nhan, giaTri, laSo) => `<tr><th>${e(nhan)}</th><td class="${laSo ? "so" : ""}">${giaTri}</td></tr>`;
  const dienGiai = String(r.ghiChu || "").split("|").map(x => x.trim()).filter(Boolean);
  const tongKl = r.chiTiet.reduce((t, d) => t + d.klTan, 0);
  const tongTien = r.chiTiet.reduce((t, d) => t + d.thanhTien, 0);
  const soLeKl = PHIEU_CT_TT.SO_LE_KL;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:Arial,sans-serif;font-size:${BANG_DE_XUAT.CO_CHU}pt;color:#000;margin:24px;}
    h1{font-size:${BANG_DE_XUAT.CO_CHU + 4}pt;text-align:center;margin:8px 0 2px;}
    .phu{text-align:center;font-style:italic;margin-bottom:14px;}
    table{width:100%;border-collapse:collapse;margin-bottom:12px;}
    th,td{border:1px solid #444;padding:4px 6px;text-align:left;vertical-align:top;}
    .tt th{width:34%;background:#f2f2f2;}
    .pc th{background:#d9ead3;text-align:center;}
    .so{text-align:right;white-space:nowrap;}
    .tong td{font-weight:bold;}
    .ky{border:none;margin-top:20px;} .ky td{border:none;text-align:center;font-weight:bold;height:90px;}
  </style></head><body>
    <div><b>${e(TEN_DON_VI_BAO_CAO)}</b></div>
    <h1>${e(tieuDe)}</h1>
    <div class="phu">Mã hồ sơ: ${e(r.idKey)} · In lúc: ${e(_ngayGioXuat_(luc))}</div>
    <table class="tt">
      ${r.ngayCK ? dong("Ngày thanh toán (Ngày CK)", `<b>${e(r.ngayCK)}</b>`) : ""}
      ${dong("Họ tên Chủ rừng", e(r.chuRung))}
      ${dong("Người nhận tiền", e(r.nguoiNhan))}
      ${dong("Ngân hàng", e(r.nganHang))}
      ${dong("Số tài khoản", e(r.stk))}
      ${dong("Số hợp đồng", e(r.soHD))}
      ${dong("SL HĐ Dự kiến / Lũy kế / Còn lại (tấn)", [r.slDuKien, r.slLuyKe, r.conLai].map(x => so(x, soLeKl)).join(" / "), true)}
      ${dong(r.ngayCK ? "Số tiền đã thanh toán (đ)" : "Số tiền đề nghị (đ)", so(r.soTien, 0), true)}
      ${dong("Nội dung chuyển khoản", e(r.noiDungCK) || "—")}
      ${dong("Ghi chú", dienGiai.length ? dienGiai.map(e).join("<br>") : "—")}
    </table>
    <table class="pc">
      <tr><th>STT</th><th>Số phiếu cân</th><th>KL (Tấn)</th><th>Thành tiền (đ)</th></tr>
      ${r.chiTiet.map((d, i) => `<tr><td class="so">${i + 1}</td><td>${e(d.soPhieuCan)}</td><td class="so">${so(d.klTan, soLeKl)}</td><td class="so">${so(d.thanhTien, 0)}</td></tr>`).join("")}
      <tr class="tong"><td colspan="2">Tổng cộng (${r.chiTiet.length} phiếu)</td><td class="so">${so(tongKl, soLeKl)}</td><td class="so">${so(tongTien, 0)}</td></tr>
    </table>
    <table class="ky"><tr>${PHIEU_CT_TT.CHU_KY.map(k => `<td>${e(k)}<br><i style="font-weight:normal">(Ký, ghi rõ họ tên)</i></td>`).join("")}</tr></table>
  </body></html>`;
}

/**
 * Sửa thông tin 1 hồ sơ Nháp (các trường cho phép sửa tay: Chủ rừng,
 * Người nhận, Ngân hàng, STK, Số HĐ, Nội dung CK). Số tiền/lũy kế vẫn
 * do "Tổng Hợp 112" tính - không sửa tay ở đây để tránh sai lệch.
 * SỬA (mục L): Draft CT lưu bản sao RIÊNG của Chủ rừng/Người nhận/STK/
 * Số HĐ cho từng dòng chi tiết (không tham chiếu chéo tới Draft 112).
 * "Đề Nghị Thanh Toán" (runCreate112) dùng CHÍNH Số HĐ trong Draft CT để
 * gộp nhóm tính lũy kế - nếu chỉ sửa ở Draft 112 mà không đồng bộ xuống
 * Draft CT, lũy kế "Còn lại" sẽ bị tính SAI theo Số HĐ cũ. Vì vậy hàm
 * này giờ đồng bộ các trường liên quan xuống MỌI dòng Draft CT của
 * cùng ID_KEY.
 */
/** Tên hiển thị các trường hồ sơ Nháp (nhật ký "trước → sau"). */
const TRUONG_HO_SO = { chuRung: "Chủ rừng", nguoiNhan: "Người nhận", nganHang: "Ngân hàng", stk: "STK", noiDungCK: "Nội dung CK", soHD: "Số HĐ", slDuKien: "SL HĐ dự kiến" };
/** Các trường của 1 dòng 112 Nháp theo TRUONG_HO_SO (chuỗi, bỏ dấu ' đầu). */
function _truongHoSo_(row) {
  const chu = v => String(v == null ? "" : v).replace(/^'+/, "").trim();
  return { chuRung: chu(row[2]), nguoiNhan: chu(row[3]), nganHang: chu(row[4]), stk: chu(row[5]), noiDungCK: chu(row[7]), soHD: chu(row[8]), slDuKien: chu(row[17]) };
}
/** Nhật ký "trước → sau": chỉ các trường thật sự đổi, vd `Người nhận: "A" → "B"; STK: "1" → "2"`. */
function _moTaThayDoi_(truoc, sau, nhan) {
  return Object.keys(nhan).filter(k => truoc[k] !== sau[k]).map(k => `${nhan[k]}: "${truoc[k]}" → "${sau[k]}"`).join("; ");
}
function updateDraft112Info_(idKey, updates) {
  let lock;
  try {
    lock = sysLock.acquire();
    const id = String(idKey || "").trim();
    if (!id) throw new Error("Thiếu ID hồ sơ.");
    updates = updates || {};

    const { shCT, sh112 } = getDraftSheets_();
    const lastRow = sh112.getLastRow();
    if (lastRow < 2) throw new Error("File Nháp trống.");
    const data = sh112.getRange(2, 1, lastRow - 1, 24).getValues();
    const idx = data.findIndex(r => String(r[0] || "").trim() === id);
    if (idx === -1) throw new Error(`Không tìm thấy hồ sơ "${id}" trong Nháp.`);

    const row = data[idx];
    // MỚI (mục W): CHỈ được sửa khi hồ sơ đang ở "Chờ ĐNTT".
    if (!_isRecordEditable_(row)) {
      throw new Error(`Không thể sửa: hồ sơ "${id}" chưa/đã qua trạng thái "Chờ ĐNTT". Hãy bấm "Về Chờ ĐNTT" trước nếu đang ở "Đang ĐNTT".`);
    }
    const truoc = _truongHoSo_(row);
    if (updates.chuRung !== undefined) row[2] = updates.chuRung;
    if (updates.nguoiNhan !== undefined) row[3] = updates.nguoiNhan;
    if (updates.nganHang !== undefined) row[4] = updates.nganHang;
    if (updates.stk !== undefined) row[5] = "'" + String(updates.stk).replace(/'/g, "");
    if (updates.noiDungCK !== undefined) row[7] = updates.noiDungCK;
    if (updates.soHD !== undefined) {
      row[8] = "'" + String(updates.soHD).replace(/'/g, "");
      // SỬA LỖI (theo yêu cầu): đổi Số HĐ thì "SL HĐ Dự Kiến" (cột 17)
      // cũng phải cập nhật lại theo ĐÚNG hợp đồng mới, không giữ số cũ.
      const hdRowChoSL = _hdNccData_().find(r => utils.standardize(r[HDNCC_COL.SO_HD]) === utils.standardize(updates.soHD));
      row[17] = hdRowChoSL ? utils.parseNum(hdRowChoSL[HDNCC_COL.SL_DU_KIEN]) : 0;
    }

    sh112.getRange(idx + 2, 1, 1, 24).setValues(_dongAnToan_([row], COT_CHU.H112));

    // MỚI (mục L): đồng bộ xuống Draft CT - v2026.7.2: chỉ ghi lại đúng các
    // dòng của hồ sơ này (trước đây ghi lại cả sheet, làm mất số 0 đầu của
    // hồ sơ khác nếu cột chưa khóa TEXT).
    const ctLastRow = shCT.getLastRow();
    if (ctLastRow > 1) {
      const ctAll = shCT.getRange(2, 1, ctLastRow - 1, 22).getValues();
      const capNhatCt = [];
      ctAll.forEach((r, i) => {
        if (String(r[1] || "").trim() !== id) return;
        if (updates.chuRung !== undefined) r[3] = updates.chuRung;
        if (updates.nguoiNhan !== undefined) r[6] = updates.nguoiNhan;
        if (updates.stk !== undefined) r[7] = String(updates.stk).replace(/'/g, "");
        if (updates.soHD !== undefined) r[19] = String(updates.soHD).replace(/'/g, "");
        capNhatCt.push({ row: i + 2, values: _dongAnToan_([r], COT_CHU.CT)[0] });
      });
      const coThayDoi = ["chuRung", "nguoiNhan", "stk", "soHD"].some(k => updates[k] !== undefined);
      if (coThayDoi) _ghiTheoDong_(shCT, capNhatCt, 1);
    }

    SpreadsheetApp.flush();
    logAction_("SUA_NHAP", id, "Sửa hồ sơ Nháp: " + (_moTaThayDoi_(truoc, _truongHoSo_(row), TRUONG_HO_SO) || "không đổi giá trị nào"));
    return { success: true, message: `✅ Đã cập nhật hồ sơ "${id}" (đã đồng bộ xuống dòng chi tiết).` };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  } finally { if (lock) lock.releaseLock(); }
}

/**
 * Thêm 1 Số phiếu cân vào 1 hồ sơ đang có trong Nháp (mở rộng Draft CT).
 * Sau khi thêm, cần chạy lại "Tổng Hợp 112" để tính lại Số tiền.
 */
function addPhieuCanToDraft_(idKey, soPhieuCan) {
  let lock;
  try {
    lock = sysLock.acquire();
    const id = String(idKey || "").trim();
    const soP = String(soPhieuCan || "").trim();
    if (!id || !soP) throw new Error("Thiếu thông tin.");

    const { shCT, sh112 } = getDraftSheets_();

    // MỚI (mục W): CHỈ được thêm phiếu cân khi hồ sơ đang ở "Chờ ĐNTT".
    const c112LastRowChk = sh112.getLastRow();
    if (c112LastRowChk > 1) {
      const all112Chk = sh112.getRange(2, 1, c112LastRowChk - 1, 24).getValues();
      const row112Chk = all112Chk.find(r => String(r[0] || "").trim() === id);
      if (row112Chk && !_isRecordEditable_(row112Chk)) {
        throw new Error(`Không thể sửa: hồ sơ "${id}" chưa/đã qua trạng thái "Chờ ĐNTT". Hãy bấm "Về Chờ ĐNTT" trước nếu đang ở "Đang ĐNTT".`);
      }
    }

    const lastRow = shCT.getLastRow();
    const ctAll = lastRow > 1 ? shCT.getRange(2, 1, lastRow - 1, 22).getValues() : [];

    const key = utils.standardize(soP);
    if (ctAll.some(r => utils.standardize(r[11]) === key)) {
      throw new Error(`Số phiếu cân "${soP}" đang được dùng bởi 1 hồ sơ trong Nháp rồi.`);
    }
    _chanPhieuCanDaTra_([soP]);

    // SỬA (mục P - tối ưu tốc độ): dùng cache "chưa thanh toán" (nhỏ, nhanh).
    const pcMap = utils.buildIndexMap(_pcUnpaidData_(), PC_COL.SO_CT, true);
    const pcRow = pcMap.get(key);
    if (!pcRow) throw new Error(`Số phiếu cân "${soP}" không tồn tại trong hệ thống Phiếu Cân (hoặc đã được thanh toán).`);
    const trangThai = String(pcRow[PC_COL.ID_DNTT] || "").trim();
    const daKhoa = String(pcRow[PC_COL.CHON_TT] || "").trim().toUpperCase();
    if (trangThai || daKhoa === "Y" || daKhoa === "N") throw new Error(`Số phiếu cân "${soP}" đã được sử dụng CHÍNH THỨC.`);

    const own = ctAll.filter(r => String(r[1] || "").trim() === id);
    if (own.length === 0) throw new Error(`Không tìm thấy hồ sơ "${id}" trong Nháp.`);
    const first = own[0];
    const srcInfo = {
      timestamp: first[2], chuRung: first[3], cccd: String(first[4] || "").replace(/'/g, ""),
      nguoiDN: first[5], nguoiNhan: first[6], stkNguoiNhan: String(first[7] || "").replace(/'/g, ""),
      klTongNguon: first[8], dsPhieuCanGoc: first[9], soHD: String(first[19] || "").replace(/'/g, ""),
      ngayTT: first[20], ngayDeNghi: first[21]
    };
    const stt = own.length + 1;
    const { row } = buildDraftCtRow_(id, stt, soP, srcInfo, pcMap);
    shCT.getRange(shCT.getLastRow() + 1, 1, 1, 22).setValues(_dongAnToan_([row], COT_CHU.CT));
    SpreadsheetApp.flush();
    logAction_("THEM_PHIEU_NHAP", id, `Thêm phiếu cân ${soP}`);
    return { success: true, message: `✅ Đã thêm phiếu cân "${soP}" vào hồ sơ "${id}". Hãy chạy lại "Đề Nghị Thanh Toán" để tính lại số tiền.` };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  } finally { if (lock) lock.releaseLock(); }
}

/**
 * Xóa 1 dòng phiếu cân (1 dòng chi tiết) khỏi 1 hồ sơ trong Nháp - vẫn
 * giữ lại các phiếu cân khác của hồ sơ đó. idCT = "ID_KEY-STT".
 * SỬA (mục L): nếu đây là phiếu cân CUỐI CÙNG của hồ sơ, tự động xóa
 * luôn dòng Draft 112 tương ứng - tránh để sót hồ sơ "mồ côi" (còn dòng
 * 112 nhưng 0 phiếu cân, không thể chốt cũng không hiển thị đúng).
 */
function removePhieuCanFromDraft_(idCT) {
  let lock;
  try {
    lock = sysLock.acquire();
    const idct = String(idCT || "").trim();
    if (!idct) throw new Error("Thiếu ID dòng chi tiết.");
    const { shCT, sh112 } = getDraftSheets_();
    const lastRow = shCT.getLastRow();
    if (lastRow < 2) throw new Error("File Nháp trống.");
    const ctAll = shCT.getRange(2, 1, lastRow - 1, 22).getValues();
    const removedRow = ctAll.find(r => String(r[0] || "").trim() === idct);
    if (!removedRow) throw new Error(`Không tìm thấy dòng "${idct}".`);
    const ownerId = String(removedRow[1] || "").trim();

    // MỚI (mục W): CHỈ được xóa phiếu cân khi hồ sơ CHỦ đang ở "Chờ ĐNTT".
    const c112LastRowChk = sh112.getLastRow();
    if (c112LastRowChk > 1 && ownerId) {
      const all112Chk = sh112.getRange(2, 1, c112LastRowChk - 1, 24).getValues();
      const row112Chk = all112Chk.find(r => String(r[0] || "").trim() === ownerId);
      if (row112Chk && !_isRecordEditable_(row112Chk)) {
        throw new Error(`Không thể sửa: hồ sơ "${ownerId}" chưa/đã qua trạng thái "Chờ ĐNTT". Hãy bấm "Về Chờ ĐNTT" trước nếu đang ở "Đang ĐNTT".`);
      }
    }

    const kept = ctAll.filter(r => String(r[0] || "").trim() !== idct);
    _thayVungDuLieu_(shCT, 2, 22, ctAll.length, kept, COT_CHU.CT);

    // Còn phiếu cân nào khác của cùng hồ sơ này không?
    const stillHasOther = kept.some(r => String(r[1] || "").trim() === ownerId);
    let alsoRemoved112 = false;
    if (!stillHasOther && ownerId) {
      const c112LastRow = sh112.getLastRow();
      if (c112LastRow > 1) {
        const all112 = sh112.getRange(2, 1, c112LastRow - 1, 24).getValues();
        const kept112 = all112.filter(r => String(r[0] || "").trim() !== ownerId);
        if (kept112.length !== all112.length) {
          _thayVungDuLieu_(sh112, 2, 24, all112.length, kept112, COT_CHU.H112);
          alsoRemoved112 = true;
        }
      }
    }

    SpreadsheetApp.flush();
    logAction_("XOA_PHIEU_NHAP", ownerId || "-", `Xóa phiếu cân ${String(removedRow[11] || "").replace(/'/g, "")} (dòng ${idct}, ${utils.parseNum(removedRow[12])} tấn, ${utils.parseNum(removedRow[16]).toLocaleString("vi-VN")} đ) khỏi hồ sơ Nháp` + (alsoRemoved112 ? ` - hồ sơ hết phiếu cân, đã xóa luôn dòng tổng hợp` : ""));
    const msg = alsoRemoved112
      ? `✅ Đã xóa phiếu cân cuối cùng - hồ sơ "${ownerId}" đã hết dữ liệu và được xóa luôn khỏi Nháp.`
      : `✅ Đã xóa dòng "${idct}" khỏi Nháp. Hãy chạy lại "Đề Nghị Thanh Toán" để tính lại số tiền.`;
    return { success: true, message: msg, recordRemoved: alsoRemoved112 };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  } finally { if (lock) lock.releaseLock(); }
}

/**
 * Wrapper cho Web App: chốt thanh toán cho danh sách ID được chọn từ
 * màn "Danh Sách Nháp", trả về object thay vì chuỗi để JS dễ xử lý.
 */
/**
 * MỚI (mục U): "Xác Nhận" - chuyển các hồ sơ đã CÓ Số tiền (Chờ ĐNTT)
 * sang trạng thái "Đang ĐNTT" (đã Xác Nhận, chờ Duyệt). Chỉ sau bước
 * này mới được phép in Báo Cáo ĐNTT (mẫu excel) và bấm "Duyệt" (Đóng
 * Thanh Toán). Hồ sơ chưa tính tiền (Số tiền <= 0) bị bỏ qua kèm cảnh báo.
 */
/** MỚI (theo yêu cầu): kiểm tra CHÉO tên Khách hàng của từng phiếu cân
 * (tra từ PhieuCan_DN) so với Chủ rừng của hồ sơ - dùng để cảnh báo
 * trước khi Xác Nhận chuyển ĐNTT (đúng bước "sau khi chọn chuyển sang
 * ĐNTT" theo yêu cầu). */
// ============================================================
// MỚI (theo yêu cầu): ĐỐI SOÁT TÊN KHÁCH HÀNG - so sánh "Chủ rừng" ở
// DNTT_GK_DN_CT (bản CHÍNH, đã chốt) với "Khách hàng" tương ứng ở
// PhieuCan_DN (tra theo Số phiếu cân) - hiện danh sách lệch tên, cho
// chọn đồng bộ TẤT CẢ hoặc TỪNG DÒNG. SỬA (theo xác nhận): đồng bộ =
// cập nhật PHIẾU CÂN theo ĐÚNG "Chủ rừng" ở CT (CT đã đối chiếu hợp
// đồng nên là nguồn ĐÚNG, không phải Phiếu Cân).
// ============================================================
function getDoiSoatTenKhachHang_() {
  try {
    // SỬA (tối ưu tốc độ): dùng cache dùng chung - an toàn vì đây chỉ là
    // PHÁT HIỆN/hiển thị (bấm "Đồng Bộ" sau đó vẫn đọc PhieuCan_DN THẬT
    // mới nhất để ghi, không phụ thuộc cache này).
    const ctAll = _ctThatDataCache_();
    if (!ctAll.length) return [];
    const pcMap = utils.buildIndexMap(_pcData_(), PC_COL.SO_CT, true);

    const mismatches = [];
    ctAll.forEach((row, idx) => {
      const idCT = String(row[0] || "").trim();
      const chuRung = String(row[3] || "").trim();
      const soP = String(row[11] || "").replace(/'/g, "").trim();
      const soHD = String(row[19] || "").replace(/'/g, "").trim();
      if (!idCT || !soP) return;
      const pcRow = pcMap.get(utils.standardize(soP));
      if (!pcRow) return;
      const khachHang = String(pcRow[PC_COL.KHACH_HANG] || "").trim();
      const khachStd = utils.standardize(khachHang);
      if (!khachHang || TEN_KHACH_CHUNG.has(khachStd)) return;
      if (khachStd !== utils.standardize(chuRung)) {
        mismatches.push({ idCT, rowIndex: idx + 2, soPhieuCan: soP, soHD, chuRungCT: chuRung, khachHangPC: khachHang });
      }
    });
    return mismatches;
  } catch (e) {
    return []; // MỚI (rà soát bổ sung): chưa kết nối File Chính hoặc lỗi khác -> trả về rỗng (frontend hiện "không có dòng lệch" - chấp nhận được vì đây là chẩn đoán, không phải thao tác ghi)
  }
}

/**
 * SỬA (theo yêu cầu làm rõ - "cập nhật Phiếu Cân theo CT, nhầm rồi"):
 * ĐÚNG chiều đồng bộ là ngược lại với bản trước - CT (ĐNTT, đã đối
 * chiếu với hợp đồng) là nguồn ĐÚNG, PhieuCan_DN (do người vận hành cân
 * gõ tay lúc cân) mới là bên cần SỬA LẠI theo CT. Hàm này cập nhật cột
 * "Khách hàng" trong PhieuCan_DN (file GỐC, ngoài hệ thống) theo đúng
 * "Chủ rừng" ở CT, tra theo Số phiếu cân. Đọc + ghi gộp 1 lượt (không
 * cập nhật từng ô lẻ) để nhanh dù chọn nhiều dòng; xóa cache Phiếu Cân
 * sau khi ghi để lần đọc tiếp theo lấy đúng dữ liệu mới.
 */
function webDongBoTenKhachHang_(items) {
  let lock;
  try {
    if (!Array.isArray(items) || !items.length) return { success: false, message: "❌ Không có dòng nào được chọn." };
    lock = sysLock.acquire();
    const shPC = openExternalSheet_(CFG.PC_SS_ID, CFG.PC_SHEET, "Phiếu Cân");
    const lastRow = shPC.getLastRow();
    if (lastRow < 2) return { success: false, message: "⚠️ Sheet Phiếu Cân trống." };

    // v2026.9.7: tra theo cột SO_CT (danh sách Đối soát lấy Số phiếu cân từ
    // cột này) và sửa MỌI dòng cùng số - trước đây tra cột A, chỉ 1 dòng/số.
    const soPhieuCol = shPC.getRange(2, PC_COL.SO_CT + 1, lastRow - 1, 1).getValues();
    const khachHangCol = shPC.getRange(2, PC_COL.KHACH_HANG + 1, lastRow - 1, 1).getValues();

    const idxMap = new Map(); // Số phiếu cân (đã standardize) -> [vị trí dòng trong mảng (0-based)]
    soPhieuCol.forEach((r, i) => {
      const sp = String(r[0] || "").trim();
      if (!sp) return;
      const k = utils.standardize(sp);
      if (!idxMap.has(k)) idxMap.set(k, []);
      idxMap.get(k).push(i);
    });

    // v2026.6: chỉ ghi đúng ô Khách hàng của các dòng được chọn (trước
    // đây ghi lại CẢ CỘT - đè mất tên người khác vừa sửa cùng lúc), và
    // lưu tên cũ -> mới vào nhật ký để truy vết.
    const capNhat = [];
    const khongTim = [];
    const vet = [];
    items.forEach(item => {
      const dsIdx = idxMap.get(utils.standardize(item.soPhieuCan));
      if (dsIdx && item.chuRungCT) {
        vet.push(`${item.soPhieuCan}: "${khachHangCol[dsIdx[0]][0]}" → "${item.chuRungCT}"`);
        dsIdx.forEach(idx => capNhat.push({ row: idx + 2, values: [item.chuRungCT] }));
      } else {
        khongTim.push(item.soPhieuCan);
      }
    });
    const count = capNhat.length;

    if (count === 0) return { success: false, message: "❌ Không đồng bộ được dòng nào - không tìm thấy Số phiếu cân tương ứng trong Phiếu Cân (có thể đã đổi số)." };
    _ghiTheoDong_(shPC, capNhat, PC_COL.KHACH_HANG + 1);
    _invalidatePcCache_(); // BẮT BUỘC: xóa cache để lần đọc tiếp theo (Đối Soát lại, báo cáo...) lấy đúng dữ liệu vừa sửa

    let msg = `✅ Đã đồng bộ ${count} dòng vào Phiếu Cân (theo CT).`;
    if (khongTim.length) msg += ` ⚠️ Không tìm thấy ${khongTim.length} số phiếu cân: ${khongTim.join(", ")}.`;
    logAction_("DOI_SOAT_DONG_BO_TEN", "-", `Đã đồng bộ tên khách hàng cho ${count} dòng trong Phiếu Cân (theo CT): ${vet.join("; ").slice(0, GIOI_HAN_KY_TU_O_NHAT_KY)}`);
    return { success: true, message: msg, count };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  } finally {
    if (lock) lock.releaseLock();
  }
}

/** Số dòng (1-based) đầu tiên có cột `col` khớp khóa đã chuẩn hóa, 0 nếu không có. */
function _timDongTheoKhoa_(sh, col, khoaChuan) {
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return 0;
  const i = sh.getRange(2, col, lastRow - 1, 1).getValues().findIndex(r => utils.standardize(r[0]) === khoaChuan);
  return i === -1 ? 0 : i + 2;
}

/** Sửa tên Khách hàng của 1 phiếu cân ngay ở bước chọn phiếu cân (Tạo Mới /
 * Sửa hồ sơ). Tra theo Số phiếu cân (cột SO_CT - đúng cột danh sách chọn
 * phiếu cân dùng), ghi đúng 1 ô trong PhieuCan_DN và trong bản mirror
 * "chưa thanh toán" để danh sách hiện tên mới ngay. */
function webSuaTenKhachHangPhieuCan_(soPhieuCan, tenMoi) {
  const ten = String(tenMoi || "").trim();
  const khoa = utils.standardize(soPhieuCan);
  if (!khoa || !ten) return { success: false, message: "❌ Thiếu Số phiếu cân hoặc tên khách hàng." };
  try {
    return _chayTrongKhoa_(() => {
      const shPC = openExternalSheet_(CFG.PC_SS_ID, CFG.PC_SHEET, "Phiếu Cân");
      const dong = _timDongTheoKhoa_(shPC, PC_COL.SO_CT + 1, khoa);
      if (!dong) return { success: false, message: `❌ Không tìm thấy phiếu cân "${soPhieuCan}" trong PhieuCan_DN.` };
      const tenCu = shPC.getRange(dong, PC_COL.KHACH_HANG + 1).getValue();
      shPC.getRange(dong, PC_COL.KHACH_HANG + 1).setValue(_oAnToan_(ten));
      _invalidatePcCache_();
      const shMirror = getPcCacheSheet_();
      const dongMirror = _timDongTheoKhoa_(shMirror, PC_COL.SO_CT + 1, khoa);
      if (dongMirror) shMirror.getRange(dongMirror, PC_COL.KHACH_HANG + 1).setValue(_oAnToan_(ten));
      _invalidateChunkedCache_("pc_unpaid_data_v1");
      logAction_("SUA_TEN_KH_PHIEU_CAN", String(soPhieuCan), `"${tenCu}" → "${ten}"`);
      return { success: true, message: `✅ Đã sửa tên khách hàng của phiếu cân ${soPhieuCan} thành "${ten}".` };
    });
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  }
}

/** MỚI (theo yêu cầu): xuất danh sách Đối Soát Tên Khách Hàng ra Excel -
 * để lưu trữ/in ra trước khi đồng bộ, hoặc gửi người khác kiểm tra lại.
 * SỬA (tối ưu tốc độ - theo yêu cầu "sao không nhẹ nhàng hơn"): NHẬN
 * SẴN danh sách đã đối soát (rowsCoSan - lấy từ lần "Kiểm Tra Đối Soát"
 * gần nhất ở trình duyệt) thay vì quét lại CT + Phiếu Cân từ đầu MỘT
 * LẦN NỮA (dữ liệu y hệt, quét lại là thừa) - chỉ khi KHÔNG có sẵn (vd
 * gọi từ nơi khác) mới tự quét lại như cũ.
 */
function exportDoiSoatTenKhachHangExcel_(rowsCoSan) {
  try {
    const rows = (Array.isArray(rowsCoSan) && rowsCoSan.length) ? rowsCoSan : getDoiSoatTenKhachHang_();
    const folder = DriveApp.getFolderById(getReportFolderId_());
    const fileName = `DOI SOAT TEN KHACH HANG (${Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmm")})`;
    const ss = _taoFileBaoCao_(fileName, folder);

    const sheet = ss.getSheets()[0];
    sheet.setName("DoiSoatTenKhachHang");
    _lockTextCols_(sheet, [1, 2], rows.length + 5); // SỬA (tối ưu tốc độ): dùng đúng số dòng thực tế thay vì mặc định 2000
    const headers = ["Số phiếu cân", "Số HĐ", "Tên trong CT (ĐNTT) - đúng", "Tên hiện tại trong Phiếu Cân - sẽ sửa lại"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#d9d2e9");
    if (rows.length) {
      const body = rows.map(r => [r.soPhieuCan, r.soHD, r.chuRungCT, r.khachHangPC]);
      sheet.getRange(2, 1, body.length, headers.length).setValues(_dongAnToan_(body));
      _canhLeTheoKieu_(sheet, 2, body);
    }
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);

    logAction_("XUAT_DOI_SOAT_TEN", "-", `Xuất Đối Soát Tên Khách Hàng, ${rows.length} dòng - ${ss.getUrl()}`);
    return { success: true, url: ss.getUrl(), count: rows.length };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  }
}

// ============================================================
// MỚI (theo yêu cầu): CHỨC NĂNG BẢO TRÌ - kiểm tra đối chiếu chéo 4
// sheet (DNTT_GK_DN, DNTT_GK_DN_CT, DNTT_GK_DN_112, PhieuCan_DN) xem có
// sai lệch/mồ côi/chưa đồng bộ không - trả về báo cáo tổng hợp + danh
// sách chi tiết (giới hạn 50 dòng/mục để tránh payload quá lớn).
// ============================================================
function _gioiHan50_(arr) {
  return { total: arr.length, items: arr.slice(0, 50), truncated: arr.length > 50 };
}
// ============================================================
// MỚI (theo yêu cầu - "không có chức năng xóa dòng mồ côi"): XỬ LÝ các
// dòng mồ côi phát hiện được ở Bảo Trì. Chia 2 mức rủi ro:
//   - AN TOÀN (ChiTietDNTT, ChiTietUNC): chỉ là bảng con/lịch sử, xóa
//     không ảnh hưởng dữ liệu tài chính gốc.
//   - RỦI RO CAO (CT thật, DNTT_GK_DN thật): xóa TRỰC TIẾP dữ liệu tài
//     chính đã chốt - luôn đọc lại MỚI NHẤT ngay lúc xóa (không dùng
//     lại vị trí dòng cũ từ lúc quét, đề phòng dữ liệu đã đổi) và tìm
//     đúng theo ID duy nhất, không theo số thứ tự dòng.
// ============================================================

/** Xóa dòng mồ côi khỏi ChiTietDNTT - AN TOÀN (chỉ bảng phụ). items:
 * mảng {idHeThong, soPhieuCan} (lấy từ chiTietDnttYMoCoi/chiTietDnttNMoCoi). */
function webXoaMoCoiChiTietDNTT_(items) {
  let lock;
  try {
    if (!Array.isArray(items) || !items.length) return { success: false, message: "❌ Không có dòng nào được chọn." };
    lock = sysLock.acquire();
    const sh = getMainSs_().getSheetByName(CHITIET_DNTT_SHEET);
    if (!sh || sh.getLastRow() < 2) return { success: false, message: "⚠️ Sheet ChiTietDNTT trống." };
    const keySetCanXoa = new Set(items.map(it => String(it.idHeThong || "").trim() + "|" + utils.standardize(String(it.soPhieuCan || "").trim())));
    const soXoa = _saoLuuVaXoaDong_(sh,
      r => keySetCanXoa.has(String(r[0] || "").trim() + "|" + utils.standardize(String(r[2] || "").replace(/'/g, "").trim())),
      "XOA_MO_COI_CHITIET_DNTT");
    logAction_("XOA_MO_COI_CHITIET_DNTT", "-", `Đã xóa ${soXoa} dòng mồ côi khỏi ChiTietDNTT (từ Bảo Trì) - đã sao lưu vào ${SAO_LUU_DONG_XOA_SHEET}.`);
    return { success: true, message: `✅ Đã xóa ${soXoa} dòng mồ côi khỏi ChiTietDNTT.`, count: soXoa };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  } finally {
    if (lock) lock.releaseLock();
  }
}

/** Xóa dòng mồ côi khỏi ChiTietUNC - AN TOÀN (chỉ lịch sử). items: mảng
 * {idHeThong} (lấy từ chiTietUncMoCoi). */
function webXoaMoCoiChiTietUNC_(items) {
  let lock;
  try {
    if (!Array.isArray(items) || !items.length) return { success: false, message: "❌ Không có dòng nào được chọn." };
    lock = sysLock.acquire();
    const sh = getMainSs_().getSheetByName(CHITIET_UNC_SHEET);
    if (!sh || sh.getLastRow() < 2) return { success: false, message: "⚠️ Sheet ChiTietUNC trống." };
    const idSetCanXoa = new Set(items.map(it => String(it.idHeThong || "").trim()));
    const soXoa = _saoLuuVaXoaDong_(sh, r => idSetCanXoa.has(String(r[0] || "").trim()), "XOA_MO_COI_CHITIET_UNC");
    logAction_("XOA_MO_COI_CHITIET_UNC", "-", `Đã xóa ${soXoa} dòng mồ côi khỏi ChiTietUNC (từ Bảo Trì) - đã sao lưu vào ${SAO_LUU_DONG_XOA_SHEET}.`);
    return { success: true, message: `✅ Đã xóa ${soXoa} dòng mồ côi khỏi ChiTietUNC.`, count: soXoa };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  } finally {
    if (lock) lock.releaseLock();
  }
}

/** Xóa dòng mồ côi khỏi CT THẬT - RỦI RO CAO (dữ liệu tài chính đã
 * chốt). items: mảng {idCT} (lấy từ ctMoCoi hoặc soPhieuCanKhongTonTai).
 * Luôn đọc lại CT MỚI NHẤT ngay lúc xóa, tìm theo idCT (cột A, duy nhất
 * tuyệt đối) - không dùng vị trí dòng cũ từ lúc quét Bảo Trì. */
function webXoaCTMoCoi_(items) {
  let lock;
  try {
    lock = sysLock.acquire();
    if (!Array.isArray(items) || !items.length) return { success: false, message: "❌ Không có dòng nào được chọn." };
    const shCT = getMainSs_().getSheetByName(CFG.DNTT_CT);
    if (!shCT || shCT.getLastRow() < 2) return { success: false, message: "⚠️ Sheet CT thật trống." };
    const idSetCanXoa = new Set(items.map(it => String(it.idCT || "").trim()));
    const soXoa = _saoLuuVaXoaDong_(shCT, r => idSetCanXoa.has(String(r[0] || "").trim()), "XOA_MO_COI_CT_THAT");
    _invalidateCtSrc112Cache_();
    _invalidateCongNoCache_();
    logAction_("XOA_MO_COI_CT_THAT", "-", `⚠️ Đã xóa ${soXoa} dòng CT thật mồ côi (từ Bảo Trì) - ĐỘNG TỚI DỮ LIỆU TÀI CHÍNH ĐÃ CHỐT (đã sao lưu vào ${SAO_LUU_DONG_XOA_SHEET}): ${items.map(it => it.idCT).join(", ")}.`);
    return { success: true, message: `✅ Đã xóa ${soXoa} dòng CT thật mồ côi.`, count: soXoa };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  } finally {
    if (lock) lock.releaseLock();
  }
}

/** Xóa dòng mồ côi khỏi DNTT_GK_DN THẬT - RỦI RO CAO. items: mảng
 * {idSrc} (lấy từ srcMoCoi112). */
function webXoaSrcMoCoi_(items) {
  let lock;
  try {
    lock = sysLock.acquire();
    if (!Array.isArray(items) || !items.length) return { success: false, message: "❌ Không có dòng nào được chọn." };
    const shSrc = getMainSs_().getSheetByName(CFG.DNTT_SRC);
    if (!shSrc || shSrc.getLastRow() < 2) return { success: false, message: "⚠️ Sheet DNTT_GK_DN thật trống." };
    const idSetCanXoa = new Set(items.map(it => String(it.idSrc || "").trim()));
    const soXoa = _saoLuuVaXoaDong_(shSrc, r => idSetCanXoa.has(String(r[0] || "").trim()), "XOA_MO_COI_SRC_THAT");
    _invalidateCtSrc112Cache_();
    _invalidateCongNoCache_();
    logAction_("XOA_MO_COI_SRC_THAT", "-", `⚠️ Đã xóa ${soXoa} dòng DNTT_GK_DN thật mồ côi (từ Bảo Trì) - ĐỘNG TỚI DỮ LIỆU TÀI CHÍNH ĐÃ CHỐT (đã sao lưu vào ${SAO_LUU_DONG_XOA_SHEET}): ${items.map(it => it.idSrc).join(", ")}.`);
    return { success: true, message: `✅ Đã xóa ${soXoa} dòng DNTT_GK_DN thật mồ côi.`, count: soXoa };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  } finally {
    if (lock) lock.releaseLock();
  }
}

function getKiemTraDoiChieuBaoTri_() {
  try {
    const ss = getMainSs_();
    const shSrc = ss.getSheetByName(CFG.DNTT_SRC);
    const shCT = ss.getSheetByName(CFG.DNTT_CT);
    const sh112 = ss.getSheetByName(CFG.DNTT_112);
    if (!shSrc || !shCT || !sh112) {
      return { error: "❌ Chưa kết nối đủ File Chính (thiếu sheet DNTT_GK_DN/CT/112) - kiểm tra lại mục Cài Đặt." };
    }

  // SỬA (tối ưu tốc độ): dùng cache dùng chung - Bảo Trì là công cụ CHẨN
  // ĐOÁN/hiển thị, không cần dữ liệu tuyệt đối tức thời (chậm nhất 90
  // giây), an toàn để dùng cache.
  const srcAll = _srcThatDataCache_();
  const ctAll = _ctThatDataCache_();
  const h112All = _h112ThatDataCache_();
  const pcData = _pcData_();
  const pcMap = utils.buildIndexMap(pcData, PC_COL.SO_CT, true);

  const srcById = new Map(); srcAll.forEach(r => { const id = String(r[0] || "").trim(); if (id) srcById.set(id, r); });
  const h112ById = new Map(); h112All.forEach(r => { const id = String(r[0] || "").trim(); if (id) h112ById.set(id, r); }); // SỬA (theo xác nhận): khớp với cột A (ID_KEY) của 112, KHÔNG phải cột cuối "ID_112" (mã khác, sinh riêng)
  const congTienTheoSrc = new Map(); // idCha (Src) -> tổng Thành tiền các dòng CT con

  const soPhieuCanKhongTonTai = [];
  const ctMoCoi = [];
  const tenKhachHangLech = [];

  ctAll.forEach(row => {
    const idCT = String(row[0] || "").trim();
    const idCha = String(row[1] || "").trim();
    const chuRung = String(row[3] || "").trim();
    const soP = String(row[11] || "").replace(/'/g, "").trim();
    const soHD = String(row[19] || "").replace(/'/g, "").trim();
    const thanhTien = utils.parseNum(row[16]);

    if (soP && !pcMap.has(utils.standardize(soP))) {
      soPhieuCanKhongTonTai.push({ idCT, soPhieuCan: soP, chuRung, soHD });
    }
    if (idCha && !srcById.has(idCha)) {
      ctMoCoi.push({ idCT, idCha, soPhieuCan: soP, chuRung, soHD });
    }
    if (idCha) congTienTheoSrc.set(idCha, (congTienTheoSrc.get(idCha) || 0) + thanhTien);

    if (soP) {
      const pcRow = pcMap.get(utils.standardize(soP));
      if (pcRow) {
        const khachHang = String(pcRow[PC_COL.KHACH_HANG] || "").trim();
        const khachStd = utils.standardize(khachHang);
        if (khachHang && !TEN_KHACH_CHUNG.has(khachStd) && khachStd !== utils.standardize(chuRung)) {
          tenKhachHangLech.push({ idCT, soPhieuCan: soP, chuRung, khachHang, soHD });
        }
      }
    }
  });

  const srcMoCoi112 = [];
  const tongTienLech = [];
  srcAll.forEach(r => {
    // SỬA (theo xác nhận): dùng ID_KEY (cột A) của CHÍNH DNTT_GK_DN để
    // đối chiếu với ID_KEY (cột A) của 112 - KHÔNG dùng cột M "ID_112"
    // của DNTT_GK_DN nữa (2 cột A đều được gán CÙNG giá trị lúc tạo hồ
    // sơ, chắc chắn hơn - không phụ thuộc cột "ID_112" có thể có
    // trường hợp lẻ chưa được ghi đủ).
    const idSrc = String(r[0] || "").trim();
    const chuRung = String(r[3] || "");
    if (idSrc && !h112ById.has(idSrc)) {
      srcMoCoi112.push({ idSrc, chuRung });
    }
    if (idSrc && h112ById.has(idSrc)) {
      const h112Row = h112ById.get(idSrc);
      const soTien112 = utils.parseNum(h112Row[6]);
      const tongCT = congTienTheoSrc.get(idSrc) || 0;
      if (Math.abs(soTien112 - tongCT) > 1) {
        tongTienLech.push({ idSrc, chuRung, soTien112, tongCT, lech: soTien112 - tongCT });
      }
    }
  });

  // ===== MỚI (theo yêu cầu): đối chiếu thêm ChiTietDNTT và ChiTietUNC =====
  const { sh112: shDraft112ChoBaoTri } = getDraftSheets_();
  const draft112LastRowChoBaoTri = shDraft112ChoBaoTri.getLastRow();
  const draft112IdSet = new Set();
  if (draft112LastRowChoBaoTri > 1) {
    shDraft112ChoBaoTri.getRange(2, 1, draft112LastRowChoBaoTri - 1, 1).getValues().forEach(r => {
      const id = String(r[0] || "").trim(); if (id) draft112IdSet.add(id);
    });
  }
  const ctKeySet = new Set(); // idHeThong + "|" + soPhieuCan - để đối chiếu ChiTietDNTT Y
  ctAll.forEach(row => {
    const idCha = String(row[1] || "").trim();
    const soP = String(row[11] || "").replace(/'/g, "").trim();
    if (idCha && soP) ctKeySet.add(idCha + "|" + utils.standardize(soP));
  });

  const chiTietDnttYMoCoi = [];
  const chiTietDnttNMoCoi = [];
  const shChiTietDNTT = ss.getSheetByName(CHITIET_DNTT_SHEET);
  if (shChiTietDNTT && shChiTietDNTT.getLastRow() > 1) {
    const dataChiTiet = shChiTietDNTT.getRange(2, 1, shChiTietDNTT.getLastRow() - 1, CHITIET_DNTT_HEADERS.length).getValues();
    dataChiTiet.forEach(r => {
      const idHeThong = String(r[0] || "").trim();
      const soP = String(r[2] || "").replace(/'/g, "").trim();
      const tt = String(r[26] || "").trim();
      if (!idHeThong) return;
      if (tt === "Y") {
        const key = idHeThong + "|" + utils.standardize(soP);
        if (!ctKeySet.has(key)) {
          chiTietDnttYMoCoi.push({ idHeThong, soPhieuCan: soP, chuRung: String(r[8] || "") });
        }
      } else if (tt === "N") {
        if (!draft112IdSet.has(idHeThong)) {
          chiTietDnttNMoCoi.push({ idHeThong, soPhieuCan: soP, chuRung: String(r[8] || "") });
        }
      }
    });
  }

  const chiTietUncMoCoi = [];
  const shChiTietUNC = ss.getSheetByName(CHITIET_UNC_SHEET);
  if (shChiTietUNC && shChiTietUNC.getLastRow() > 1) {
    const dataUnc = shChiTietUNC.getRange(2, 1, shChiTietUNC.getLastRow() - 1, CHITIET_UNC_HEADERS.length).getValues();
    dataUnc.forEach(r => {
      const idHeThong = String(r[0] || "").trim();
      if (!idHeThong) return;
      if (!draft112IdSet.has(idHeThong) && !h112ById.has(idHeThong)) {
        chiTietUncMoCoi.push({ idHeThong, chuRung: String(r[16] || ""), soHD: String(r[17] || "").replace(/'/g, "") });
      }
    });
  }

    return {
      tongQuan: { tongSrc: srcAll.length, tongCT: ctAll.length, tong112: h112All.length, tongPC: pcData.length },
      soPhieuCanKhongTonTai: _gioiHan50_(soPhieuCanKhongTonTai),
      ctMoCoi: _gioiHan50_(ctMoCoi),
      srcMoCoi112: _gioiHan50_(srcMoCoi112),
      tongTienLech: _gioiHan50_(tongTienLech),
      tenKhachHangLech: _gioiHan50_(tenKhachHangLech),
      chiTietDnttYMoCoi: _gioiHan50_(chiTietDnttYMoCoi),
      chiTietDnttNMoCoi: _gioiHan50_(chiTietDnttNMoCoi),
      chiTietUncMoCoi: _gioiHan50_(chiTietUncMoCoi)
    };
  } catch (e) {
    return { error: "❌ Lỗi: " + _loiChoNguoiDung_(e) }; // MỚI (rà soát bổ sung): trả về dạng lỗi thân thiện thay vì lỗi thô
  }
}

function _timPhieuCanKhacTenChuRung_(idSet) {
  const { shCT } = getDraftSheets_();
  const lastRow = shCT.getLastRow();
  if (lastRow < 2) return [];
  const ctAll = shCT.getRange(2, 1, lastRow - 1, 22).getValues();

  const pcMap = utils.buildIndexMap(_pcData_(), PC_COL.SO_CT, true); // đầy đủ lịch sử, đủ để tra Khách hàng
  const mismatches = [];
  ctAll.forEach(row => {
    const idCha = String(row[1] || "").trim();
    if (!idCha || !idSet.has(idCha)) return;
    const chuRung = String(row[3] || "").trim();
    const soP = String(row[11] || "").replace(/'/g, "").trim();
    const pcRow = pcMap.get(utils.standardize(soP));
    if (!pcRow) return;
    const khachHang = String(pcRow[PC_COL.KHACH_HANG] || "").trim();
    const khachStd = utils.standardize(khachHang);
    if (!khachHang || TEN_KHACH_CHUNG.has(khachStd)) return;
    if (khachStd !== utils.standardize(chuRung)) {
      mismatches.push({ idKey: idCha, chuRung, soPhieuCan: soP, khachHang });
    }
  });
  return mismatches;
}

function runXacNhanDNTT_(selectedIds, forceConfirm) {
  let lock;
  try {
    lock = sysLock.acquire();
    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
      return { success: false, message: "❌ Lỗi: Không có hồ sơ nào được chọn để Xác Nhận." };
    }
    const idSet = new Set(selectedIds.map(id => String(id).trim()).filter(Boolean));
    if (idSet.size === 0) return { success: false, message: "❌ Lỗi: Danh sách hồ sơ được chọn không hợp lệ." };

    // MỚI: nếu có phiếu cân tên Khách hàng KHÁC Chủ rừng của hồ sơ, và
    // người dùng CHƯA xác nhận muốn tiếp tục (forceConfirm) -> dừng lại,
    // trả về danh sách để Web App hỏi xác nhận trước.
    if (!forceConfirm) {
      const mismatches = _timPhieuCanKhacTenChuRung_(idSet);
      if (mismatches.length > 0) {
        const danhSach = mismatches.map(m => `${m.soPhieuCan} (KH: ${m.khachHang}, Chủ rừng: ${m.chuRung})`).join("; ");
        return {
          success: false,
          needConfirm: true,
          message: `⚠️ Có ${mismatches.length} phiếu cân với tên Khách hàng KHÁC Chủ rừng của hồ sơ: ${danhSach}. Bạn có chắc muốn tiếp tục chuyển ĐNTT không?`
        };
      }
    }

    const { sh112 } = getDraftSheets_();
    const lastRow = sh112.getLastRow();
    if (lastRow < 2) return { success: false, message: "⚠️ File Nháp trống." };
    const data = sh112.getRange(2, 1, lastRow - 1, 24).getValues();

    const skippedNotCalculated = [], skippedNoData = [];
    const foundIds = new Set();
    const dongXacNhan = [];
    data.forEach((row, i) => {
      const id = String(row[0] || "").trim();
      if (!id || !idSet.has(id)) return;
      foundIds.add(id);
      if (utils.parseNum(row[6]) <= 0) { skippedNotCalculated.push(id); return; }
      dongXacNhan.push(i + 2);
    });
    idSet.forEach(id => { if (!foundIds.has(id)) skippedNoData.push(id); });
    const count = dongXacNhan.length;

    if (count > 0) {
      // v2026.6: chỉ ghi đúng ô "Trạng Thái ĐNTT" của các hồ sơ được xác nhận.
      _ghiCungGiaTri_(sh112, dongXacNhan, COL_TRANG_THAI_DNTT + 1, COL_TRANG_THAI_DNTT + 1, "Đang ĐNTT");
      SpreadsheetApp.flush();
    }

    let msg;
    if (count === 0) {
      msg = "❌ Không có hồ sơ nào đủ điều kiện Xác Nhận (phải đã có Số tiền > 0, tức đã chạy 'Tổng Hợp 112').";
    } else {
      msg = `✅ Đã Xác Nhận ${count} hồ sơ - chuyển sang trạng thái "Đang ĐNTT", có thể in Báo Cáo ĐNTT và chờ Duyệt để Đóng Thanh Toán.`;
    }
    if (skippedNotCalculated.length) msg += ` ⚠️ Chưa tính tiền (bỏ qua): ${skippedNotCalculated.join(", ")}.`;
    if (skippedNoData.length) msg += ` ⚠️ Không tìm thấy trong Nháp: ${skippedNoData.join(", ")}.`;
    logAction_("XAC_NHAN_DNTT", Array.from(idSet).join(","), `Xác Nhận ${count} hồ sơ.`);
    return { success: count > 0, message: msg };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  } finally { if (lock) lock.releaseLock(); }
}

/**
 * MỚI (mục W): "Về Chờ ĐNTT" - chuyển 1 hồ sơ đang "Đang ĐNTT" (đã Xác
 * Nhận) NGƯỢC LẠI về "Chờ ĐNTT" - vì Sửa/Xóa CHỈ được phép thực hiện ở
 * trạng thái "Chờ ĐNTT" (mục W: khóa Sửa/Xóa ở "Chưa ĐNTT" và "Đang
 * ĐNTT" để tránh sửa nhầm hồ sơ đã tính tiền/đã xác nhận).
 */
function runHuyXacNhanDNTT_(idKey) {
  let lock;
  try {
    lock = sysLock.acquire();
    const id = String(idKey || "").trim();
    if (!id) return { success: false, message: "❌ Lỗi: Thiếu ID hồ sơ." };

    const { sh112 } = getDraftSheets_();
    const lastRow = sh112.getLastRow();
    if (lastRow < 2) return { success: false, message: "⚠️ File Nháp trống." };
    const data = sh112.getRange(2, 1, lastRow - 1, 24).getValues();
    const idx = data.findIndex(r => String(r[0] || "").trim() === id);
    if (idx === -1) return { success: false, message: `❌ Không tìm thấy hồ sơ "${id}" trong Nháp.` };

    sh112.getRange(idx + 2, COL_TRANG_THAI_DNTT + 1).setValue("");
    SpreadsheetApp.flush();

    logAction_("HUY_XAC_NHAN_DNTT", id, `Chuyển hồ sơ "${id}" về "Chờ ĐNTT" để cho phép Sửa/Xóa.`);
    return { success: true, message: `✅ Đã chuyển hồ sơ "${id}" về trạng thái "Chờ ĐNTT" - giờ có thể Sửa/Xóa.` };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  } finally { if (lock) lock.releaseLock(); }
}

function webConfirmPayment_(selectedIds, payDateStr) {
  const msg = runConfirmPayment_(selectedIds, payDateStr);
  return { success: msg.indexOf("✅") === 0, message: msg };
}

/**
 * Wrapper cho Web App: chạy "Đề Nghị Thanh Toán" (Tổng Hợp 112).
 */
function webRunCreate112_() {
  const msg = runCreate112();
  return { success: msg.indexOf("✅") === 0, message: msg };
}

/**
 * Báo cáo: danh sách hồ sơ CHÍNH THỨC (đã chốt) trong khoảng ngày, dùng
 * cho màn "Báo Cáo" của Web App. fDate/tDate dạng "yyyy-MM-dd" hoặc rỗng.
 */
function getReportList_(fDate, tDate) {
  fDate = _clampReportRange_(fDate, tDate); // mục R - xem ghi chú tại _clampReportRange_
  return get112ViewData_(fDate, tDate);
}

/**
 * Xuất báo cáo (tạo file Google Sheet mới) cho các dòng đã chọn trên
 * màn Báo Cáo của Web App.
 */
function webExportReport_(rows, dateRange) {
  const khoang = /^(\d{4}-\d{2}-\d{2}) - (\d{4}-\d{2}-\d{2})$/.exec(String(dateRange || ""));
  try {
    if (!khoang) throw new Error("Chọn đủ Từ ngày / Đến ngày.");
    _kiemTraKhoangBaoCao_(khoang[1], khoang[2]);
  } catch (e) {
    return { success: false, message: e.message };
  }
  return createFinalReportFromFilteredData_(rows, dateRange);
}

/**
 * MỚI (mục U): "in Báo cáo ĐNTT theo mẫu excel" - xuất Bảng Đề Xuất
 * Thanh Toán (cùng mẫu Sheet1 với Báo Cáo chính thức) NHƯNG lấy dữ liệu
 * từ File Nháp, CHỈ cho các hồ sơ đã "Đang ĐNTT" (đã Xác Nhận). Dùng để
 * in/trình ký TRƯỚC KHI Duyệt/Đóng Thanh Toán - vì vậy KHÔNG kèm sheet
 * "Bảng Kê Chi Tiết CK" (sheet đó cần dữ liệu đã chốt ở sheet chính thức
 * thật, chưa có ở giai đoạn này).
 */
function exportBaoCaoDNTTFromDraft_(selectedIds) {
  try {
    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
      return { success: false, message: "❌ Lỗi: Không có hồ sơ nào được chọn để xuất Báo Cáo ĐNTT." };
    }
    const idSet = new Set(selectedIds.map(id => String(id).trim()).filter(Boolean));
    const { sh112 } = getDraftSheets_();
    const lastRow = sh112.getLastRow();
    if (lastRow < 2) return { success: false, message: "⚠️ File Nháp trống." };
    const data = sh112.getRange(2, 1, lastRow - 1, 24).getValues();

    const rows = [];
    const skippedNotConfirmed = [];
    data.forEach(r => {
      const id = String(r[0] || "").trim();
      if (!id || !idSet.has(id)) return;
      if (String(r[COL_TRANG_THAI_DNTT] || "").trim() !== "Đang ĐNTT") { skippedNotConfirmed.push(id); return; }
      rows.push({
        idHeThong: id,
        ngayDN: utils.formatDate(r[16]),
        soLan: String(r[18] || ""),
        chuRung: String(r[2] || ""),
        nguoiNhan: String(r[3] || ""),
        stk: String(r[5] || "").replace(/'/g, ""),
        nganHang: String(r[4] || ""),
        klTan: utils.parseNum(r[11]) / 1000,
        soTien: utils.parseNum(r[6]),
        noiDungCK: String(r[7] || ""),
        ghiChu: String(r[15] || ""),
        thoiGianLap: r[1] instanceof Date ? r[1].getTime() : 0 // Timestamp lúc tạo hồ sơ - để sắp xếp
      });
    });
    // v2026.9.8: Báo cáo ĐNTT in theo THỜI GIAN LẬP hồ sơ (cũ trước), không phụ
    // thuộc thứ tự dòng trong sheet Nháp (có thể đã bị sắp lại theo tên).
    // Cùng thời điểm (hoặc thiếu Timestamp) -> theo Ngày đề nghị -> giữ thứ tự sheet.
    rows.forEach((r, i) => { r.viTri = i; });
    const ngayDNSo = r => { const p = String(r.ngayDN || "").split("/"); return p.length === 3 ? p[2] + p[1] + p[0] : ""; };
    rows.sort((a, b) => (a.thoiGianLap || Infinity) - (b.thoiGianLap || Infinity)
      || ngayDNSo(a).localeCompare(ngayDNSo(b)) || a.viTri - b.viTri);

    if (rows.length === 0) {
      let msg = "❌ Không có hồ sơ nào ở trạng thái 'Đang ĐNTT' để xuất báo cáo (phải bấm 'Xác Nhận' trước).";
      if (skippedNotConfirmed.length) msg += ` Hồ sơ chưa Xác Nhận: ${skippedNotConfirmed.join(", ")}.`;
      return { success: false, message: msg };
    }

    const dateRange = "CHỜ DUYỆT - " + _formatNgayXuat_(new Date());
    const folder = DriveApp.getFolderById(getReportFolderId_());
    const fileName = "BÁO CÁO ĐNTT (chờ duyệt) - " + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmm");
    const newSS = _taoFileBaoCao_(fileName, folder);

    const sheet1 = newSS.getSheets()[0];
    sheet1.setName("DeNghiThanhToanCK");
    renderSheet1Full_(sheet1, rows, dateRange);

    // MỚI (theo yêu cầu): bổ sung sheet "Bảng Kê Chi Tiết CK" còn thiếu -
    // đọc từ Draft CT (chưa chốt), KHÔNG ghi vào Update_NganHang_DN.
    const sheet2 = newSS.insertSheet("BangKeChiTietCK");
    renderSheet2DetailFromDraft_(sheet2, rows, dateRange);

    // MỚI (theo yêu cầu - Báo Cáo Thanh Toán chạy nhanh hơn): ghi sẵn
    // chi tiết từng phiếu cân (Trạng thái = N) vào sheet "ChiTietDNTT"
    // (File Chính) NGAY LÚC IN - để lúc Đóng Thanh Toán chỉ cần chuyển
    // N -> Y (không phải join lại CT+PhieuCan_DN+HD_NCC từ đầu).
    // SỬA LỖI (rà soát phát hiện): dùng ĐÚNG danh sách id đã XÁC NHẬN
    // thành công (rows) - KHÔNG dùng idSet gốc (có thể lẫn cả hồ sơ
    // "Chờ ĐNTT" bị bỏ qua nếu người dùng chọn lẫn cả 2 trạng thái cùng
    // lúc ở tab "Tất cả") - nếu không sẽ ghi nhầm ChiTietDNTT cho hồ sơ
    // CHƯA từng được Xác Nhận/In báo cáo thật sự.
    const idDaXacNhan = new Set(rows.map(r => r.idHeThong));
    const { shCT: shDraftCTChoChiTiet } = getDraftSheets_();
    const draftCTLastRowChoChiTiet = shDraftCTChoChiTiet.getLastRow();
    if (draftCTLastRowChoChiTiet > 1) {
      const draftCTAllChoChiTiet = shDraftCTChoChiTiet.getRange(2, 1, draftCTLastRowChoChiTiet - 1, 22).getValues();
      const ctRowsDaLoc = draftCTAllChoChiTiet.filter(r => idDaXacNhan.has(String(r[1] || "").trim()));
      const mapLanTT = new Map(rows.map(r => [r.idHeThong, r.soLan]));
      // SỬA LỖI (rà soát phát hiện): "rows" ở trên đã có ĐÚNG người
      // nhận/ngân hàng/STK theo dòng 112 (đã qua "Sửa" nếu có, giống
      // hệt dữ liệu dùng cho UNC) - truyền xuống để ChiTietDNTT/MISA tự
      // động ghi khớp với tiền chuyển thật, không lấy nhầm mặc định
      // HD_NCC khi hồ sơ có sửa tay người nhận/STK khác mặc định.
      const mapNhanTien112 = new Map(rows.map(r => [r.idHeThong, { nguoiNhan: r.nguoiNhan, nganHang: r.nganHang, stk: r.stk }]));
      _ghiChiTietDNTT_N_(Array.from(idDaXacNhan), ctRowsDaLoc, id => mapLanTT.get(id), id => mapNhanTien112.get(id));
    }

    let msg = `✅ Đã xuất Báo Cáo ĐNTT (${rows.length} hồ sơ - CHƯA chốt thanh toán chính thức, chỉ để in/trình duyệt).`;
    if (skippedNotConfirmed.length) msg += ` ⚠️ Bỏ qua (chưa Xác Nhận): ${skippedNotConfirmed.join(", ")}.`;
    logAction_("XUAT_BAO_CAO_DNTT_NHAP", Array.from(idSet).join(","), `Xuất Báo Cáo ĐNTT nháp ${rows.length} hồ sơ - ${newSS.getUrl()}`);
    return { success: true, url: newSS.getUrl(), message: msg };
  } catch (e) {
    return { success: false, message: "❌ Lỗi: " + _loiChoNguoiDung_(e) };
  }
}

// ============================================================
// SỬA (theo yêu cầu - File Nháp giờ LÀ chính file đang chạy): không còn
// cần "tạo file mới" - getDraftSheets_() đã TỰ tạo sẵn các sheet cần
// thiết ngay trong file này nếu thiếu. Hàm này giữ lại chỉ để CHỦ ĐỘNG
// chạy 1 lần cho chắc (vd sau khi dán code mới), thực chất chỉ gọi lại
// getDraftSheets_().
// ============================================================
function setupDraftSpreadsheet_() {
  const { ss } = getDraftSheets_(); // tự tạo sheet nếu thiếu
  const url = ss.getUrl();
  const msg = `✅ File Nháp đã sẵn sàng (chính là file này đang chạy).\n\nURL: ${url}`;
  Logger.log(msg);
  return { success: true, alreadySetup: true, message: msg, url };
}

function showOpenDraftDialog() {
  _yeuCauQuyen_(QUYEN.XEM);
  const ui = SpreadsheetApp.getUi();
  try {
    const { ss } = getDraftSheets_();
    const html = HtmlService.createHtmlOutput(
      `<div style="font-family:Arial;padding:10px"><a href="${ss.getUrl()}" target="_blank">Mở File Nháp trong tab mới</a></div>`
    ).setWidth(360).setHeight(80);
    ui.showModalDialog(html, "File Nháp");
  } catch (e) {
    ui.alert(_loiChoNguoiDung_(e));
  }
}

function showDeleteDraftDialog() {
  _yeuCauQuyen_(QUYEN.NGHIEP_VU);
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt('Xóa Hồ Sơ Nháp', 'Nhập ID hồ sơ (ID_KEY) cần xóa khỏi File Nháp:', ui.ButtonSet.OK_CANCEL);
  if (result.getSelectedButton() != ui.Button.OK) return;
  const msg = runDeleteDraftRecord_(result.getResponseText().trim());
  ui.alert(msg);
}

// MỚI (mục Y): làm mới thủ công cả 3 cache (Phiếu Cân chưa TT, HD_NCC, HD_STK).
function showRefreshPcCacheDialog() {
  _yeuCauQuyen_(QUYEN.QUAN_TRI);
  const ui = SpreadsheetApp.getUi();
  try {
    const r = refreshAllDraftCaches_();
    ui.alert(`✅ Đã làm mới toàn bộ cache: ${r.pc} phiếu cân chưa TT · ${r.hdNcc}/${r.hdNccTotal} hợp đồng "Đang Thực Hiện" (HD_NCC) · ${r.hdStk}/${r.hdStkTotal} dòng HD_STK.`);
  } catch (e) {
    ui.alert("❌ Lỗi: " + _loiChoNguoiDung_(e));
  }
}

// MỚI (mục AA/AB): bật Trigger tự động làm mới TOÀN BỘ dữ liệu nền mỗi ngày lúc 7:30 & 13:00 (chỉ cần chạy 1 lần).
function showSetupPcCacheTriggerDialog() {
  _yeuCauQuyen_(QUYEN.QUAN_TRI);
  const ui = SpreadsheetApp.getUi();
  try {
    ui.alert(setupPcCacheAutoRefreshTrigger_());
  } catch (e) {
    ui.alert("❌ Lỗi: " + _loiChoNguoiDung_(e));
  }
}

// MỚI (mục AD): bật riêng Trigger 10 phút cho Phiếu Cân + Hợp Đồng + Số Tài Khoản.
function showSetup10MinTriggerDialog() {
  _yeuCauQuyen_(QUYEN.QUAN_TRI);
  const ui = SpreadsheetApp.getUi();
  try {
    ui.alert(setup10MinRefreshTrigger_());
  } catch (e) {
    ui.alert("❌ Lỗi: " + _loiChoNguoiDung_(e));
  }
}

// MỚI (mục 11): bật Trigger 15h cho Phân Tích Nhập/TT theo NG-ĐL + Chi Tiết Công Nợ theo Phiếu Cân.
function showSetupDaily15hTriggerDialog() {
  _yeuCauQuyen_(QUYEN.QUAN_TRI);
  const ui = SpreadsheetApp.getUi();
  try {
    ui.alert(setupDaily15hTrigger_());
  } catch (e) {
    ui.alert("❌ Lỗi: " + _loiChoNguoiDung_(e));
  }
}

// ============================================================
// ĐIỀN LẠI HÀNG LOẠT NGÂN HÀNG CÒN TRỐNG TRONG DỮ LIỆU CHÍNH THỨC
// (không đổi so với 2026.3 - vẫn dùng để vá dữ liệu LỊCH SỬ đã chốt)
// ============================================================
function runFillMissingBankOnly() {
  _yeuCauQuyen_(QUYEN.HE_THONG);
  let lock;
  try {
    lock = sysLock.acquire();
    const sh112 = getMainSs_().getSheetByName(CFG.DNTT_112);
    if (!sh112 || sh112.getLastRow() < 2) return "⚠️ Sheet 112 trống.";

    const data112 = sh112.getRange(1, 1, sh112.getLastRow(), sh112.getLastColumn()).getValues();
    // mục Z: vá dữ liệu LỊCH SỬ có thể thuộc hợp đồng đã "Đã Thanh lý" -> cần dữ liệu ĐẦY ĐỦ.
    const bankMap = buildBankLookupFromHDSTK_(true);

    // v2026.6: chỉ ghi đúng ô Ngân hàng (cột E) của các dòng đang trống,
    // không ghi đè lại toàn bộ sheet 112 đã chốt.
    const capNhatNganHang = [];
    for (let i = 1; i < data112.length; i++) {
      const id = String(data112[i][0]).trim();
      if (!id) continue;
      if (!utils.isBlank(data112[i][4])) continue;

      const soHDRaw = String(data112[i][8] || "");
      const hdKeyLookup = utils.standardize(soHDRaw);
      const stkKeyLookup = utils.standardize(data112[i][5]);
      if (!hdKeyLookup || !stkKeyLookup) continue;

      const bankFound = bankMap.get(hdKeyLookup + "|" + stkKeyLookup);
      if (bankFound) capNhatNganHang.push({ row: i + 1, values: [bankFound] });
    }
    const filledBankCount = capNhatNganHang.length;

    if (filledBankCount > 0) {
      _ghiTheoDong_(sh112, capNhatNganHang, 5);
      SpreadsheetApp.flush();
      logAction_("VA_NGAN_HANG_112", "-", `Đã tự động điền Ngân hàng cho ${filledBankCount} dòng đang trống.`);
      _invalidateChunkedCache_("h112_that_data_v1"); // MỚI (rà soát bổ sung): 112 thật vừa thay đổi - xóa cache ngay
      return `✅ Đã tự động điền Ngân hàng cho ${filledBankCount} dòng đang trống (tham chiếu HD_STK).`;
    }
    return "⚠️ Không có dòng nào cần điền Ngân hàng (đã đầy đủ hoặc không khớp được với HD_STK).";
  } catch (e) {
    return "❌ Lỗi: " + _loiChoNguoiDung_(e);
  } finally { if (lock) lock.releaseLock(); }
}

// ============================================================
// MENU SHEET
// SỬA (theo yêu cầu - kiến trúc "gắn liền" với File Nháp): menu này tự
// hiện khi mở File Nháp (nơi code này đang gắn liền). Menu "Kết Nối File
// Chính" chỉ hiện thêm khi CHƯA cấu hình MAIN_SS_ID.
// ============================================================
/**
 * Code này PHẢI được dán vào Apps Script gắn liền với File Nháp (không
 * phải File Chính hay 1 file trống nào khác) - hàm này tự động chạy mỗi
 * khi mở File Nháp, hiện menu "🚀 QUẢN LÝ HAK" như bình thường.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  var menu = ui.createMenu('🚀 QUẢN LÝ HAK')
      .addItem('1. Tách Phiếu (vào File Nháp)', 'runProcessDetail')
      .addItem('2. Tổng Hợp 112 (trong File Nháp)', 'runCreate112')
      .addSeparator()
      .addItem('3. Chốt Thanh Toán (đẩy Nháp -> Chính thức)', 'showPayDialog')
      .addSeparator()
      .addItem('4. Thêm Mới Đề Nghị Thanh Toán', 'showAddPaymentDialog')
      .addSeparator()
      .addItem('📂 Mở File Nháp', 'showOpenDraftDialog')
      .addItem('🗑️ Xóa 1 Hồ Sơ Khỏi Nháp', 'showDeleteDraftDialog')
      .addSeparator()
      .addItem('5. Vá Ngân Hàng Còn Trống (dữ liệu Chính thức)', 'runFillMissingBankOnly')
      .addSeparator()
      .addItem('🔄 Làm Mới Toàn Bộ Cache (Phiếu Cân, HD_NCC, HD_STK)', 'showRefreshPcCacheDialog')
      .addItem('⏱️ Bật Tự Động Làm Mới Dữ Liệu (7:30 & 13:00 hàng ngày)', 'showSetupPcCacheTriggerDialog')
      .addItem('⏱️ Bật Tự Động 10 Phút (Phiếu Cân, Hợp Đồng, 7:30-19:00)', 'showSetup10MinTriggerDialog')
      .addItem('⏱️ Bật Tự Động 15h (Phân Tích NG-ĐL + Chi Tiết Công Nợ PC)', 'showSetupDaily15hTriggerDialog')
      .addItem('🧹 Xóa Sạch & Nạp Lại Phân Tích NG-ĐL', 'showResetPhanTichDialog')
      .addItem('🧹 Xóa Sạch & Nạp Lại Chi Tiết Công Nợ PC', 'showResetChiTietCongNoDialog')
      .addSeparator()
      .addItem('🔒 Khóa Định Dạng TEXT/Ngày (CCCD/STK/Số HĐ/Timestamp...)', 'showKhoaDinhDangTextDialog')
      .addItem('🌐 Chọn Vùng Lãnh Thổ (Việt Nam / United States)', 'showChonVungDialog')
      .addSeparator()
      .addItem('📋 Tạo/Cập Nhật Sheet Thông Số', 'showGenerateThongSoDialog')
      .addSeparator()
      .addItem('🔗 Kết Nối / Đổi File Chính', 'showKetNoiFileChinhDialog');

  if (!PropertiesService.getScriptProperties().getProperty('MAIN_SS_ID')) {
    menu.addSeparator().addItem('⚠️ CHƯA Kết Nối File Chính - Bấm Vào Đây', 'showKetNoiFileChinhDialog');
  }
  menu.addToUi();
}

// SỬA (mục J): chọn danh sách hồ sơ để chốt dựa trên FILE NHÁP (Draft
// 112 đã có Số tiền > 0), không còn dựa vào cột trạng thái của nguồn.
function showPayDialog() {
  _yeuCauQuyen_(QUYEN.NGHIEP_VU);
  var ui = SpreadsheetApp.getUi();
  var result = ui.prompt('Xác nhận chốt', 'Nhập ngày thanh toán (dd/mm/yyyy):', ui.ButtonSet.OK_CANCEL);
  if (result.getSelectedButton() != ui.Button.OK) return;

  var payDateStr = result.getResponseText().trim();

  var selectedIds;
  try {
    var draft = getDraftSheets_();
    var lastRow = draft.sh112.getLastRow();
    if (lastRow < 2) { ui.alert("File Nháp chưa có hồ sơ nào sẵn sàng để chốt."); return; }
    var data = draft.sh112.getRange(2, 1, lastRow - 1, 7).getValues();
    selectedIds = data
      .filter(r => !utils.isBlank(r[0]) && utils.parseNum(r[6]) > 0)
      .map(r => String(r[0]).trim());
  } catch (e) {
    ui.alert("Lỗi khi đọc File Nháp: " + _loiChoNguoiDung_(e));
    return;
  }

  if (selectedIds.length === 0) {
    ui.alert("Không có hồ sơ nào trong File Nháp đã sẵn sàng (đã chạy Tổng Hợp 112) để chốt thanh toán.");
    return;
  }

  var confirm = ui.alert('Xác nhận', `Sẽ chốt thanh toán cho ${selectedIds.length} hồ sơ đang có trong File Nháp. Tiếp tục?`, ui.ButtonSet.YES_NO);
  if (confirm != ui.Button.YES) return;

  var msg = runConfirmPayment_(selectedIds, payDateStr);
  ui.alert(msg);
}

// Mở hộp thoại "Thêm Mới Đề Nghị Thanh Toán" ngay trong Google Sheet.
// Tạo Mới ĐNTT làm trên Web App (đủ bước chọn phiếu cân, hợp đồng, kiểm tra
// trùng) - menu chỉ mở thẳng màn Tạo Mới, không có form riêng trong Sheet.
function showAddPaymentDialog() {
  _yeuCauQuyen_(QUYEN.NGHIEP_VU);
  const ui = SpreadsheetApp.getUi();
  const webAppUrl = ScriptApp.getService().getUrl();
  if (!webAppUrl) {
    ui.alert("⚠️ Chưa triển khai Web App (Deploy > New deployment > Web app) nên chưa mở được màn Tạo Mới.");
    return;
  }
  const url = _escHtml_(webAppUrl + "?trang=taoMoi");
  const html = HtmlService.createHtmlOutput(
    `<div style="font-family:Arial;padding:12px;line-height:1.6;font-size:14px;text-align:center">
      <p>Tạo Mới Đề Nghị Thanh Toán được thực hiện trên <b>Web App</b>.</p>
      <a href="${url}" target="_blank" onclick="google.script.host.close()"
         style="display:inline-block;margin-top:8px;padding:10px 22px;background:#1f6f43;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">➕ Mở màn Tạo Mới</a>
    </div>`
  ).setWidth(420).setHeight(170);
  ui.showModalDialog(html, "Thêm Mới Đề Nghị Thanh Toán");
}

// ============================================================
// ============================================================
// MỚI (theo yêu cầu): CHATBOT TRỢ LÝ AI TỰ DO (Gemini) - WIDGET WEBAPP
// ------------------------------------------------------------
// Đây là chế độ "trợ lý AI tự do" (không giới hạn phải tra dữ liệu Sheet
// thật) - trả lời MỌI câu hỏi, nhưng vẫn được cấp sẵn NGỮ CẢNH về hệ
// thống HAK (quy trình, thuật ngữ) để trả lời tốt các câu hỏi liên quan
// tới cách dùng webapp này. KHÔNG lưu API key trong code - đọc từ Script
// Properties (dán ở Cài Đặt), có model dự phòng + chế độ dự phòng khi
// không có API key hoặc Gemini lỗi, theo đúng nguyên tắc:
//   - KHÔNG hard-code cứng 1 model - có mặc định + danh sách dự phòng.
//   - KHÔNG dùng Utilities.sleep() chờ - lỗi là thử NGAY model khác.
//   - Luôn hoạt động được (trả lời tạm) dù chưa có API key.
// Tên model KHÔNG sửa trong code: Quản trị cấu hình ở Cài đặt › Trợ Lý AI
// (Script Property GEMINI_MODELS, nút "Dò model khả dụng" hỏi thẳng Google).
// Khi MỌI model đã cấu hình đều lỗi (Google ngừng hỗ trợ), hệ thống tự dò
// model còn dùng được qua ListModels rồi thử tiếp - không phải chờ sửa code.
// ============================================================
/** Dùng khi Quản trị chưa cấu hình danh sách (thứ tự = thứ tự thử). */
const GEMINI_MODELS_MAC_DINH_ = ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.7-flash', 'gemini-2.5-flash'];
const GEMINI_API_URL_ = 'https://generativelanguage.googleapis.com/v1beta/models';
// Model đặc thù (không dùng cho hội thoại văn bản) - bỏ qua khi tự dò.
const GEMINI_MODEL_BO_QUA_KHI_DO_ = /(preview|exp|tts|image|live|audio|embedding|thinking|robotics)/;

/** Ngữ cảnh cố định về hệ thống - giúp chatbot trả lời tốt các câu hỏi
 * liên quan tới cách dùng webapp này, dù đang ở chế độ "trợ lý tự do". */
const CHATBOT_HE_THONG_PROMPT_ = `Bạn là trợ lý AI tích hợp trong webapp "Hệ Thống Quản Lý Thanh Toán HAK" của công ty Hoàng Anh Khôi Đà Nẵng - hệ thống quản lý đề nghị thanh toán tiền mua gỗ keo cho các chủ rừng.

Quy trình chính của hệ thống (5 bước): Tạo Mới (chọn Chủ rừng, Hợp đồng, Phiếu cân) → Đề Nghị Thanh Toán (hệ thống tự tính tiền) → Xác Nhận chuyển ĐNTT → In Báo Cáo ĐNTT / Tạo File UNC (nộp ngân hàng trước) → Duyệt (Đóng Thanh Toán, chốt chính thức).

Các trang chính: Trang chủ (tổng quan), Danh Sách ĐNTT (quy trình 5 bước), Báo Cáo Thanh Toán (Gỗ Keo/Chi Tiết/MISA/UNC), Báo Cáo Công Nợ Khách Hàng, Hệ Thống (Đối Soát Tên Khách Hàng, Bảo Trì đối chiếu dữ liệu, Mở Đóng Thanh Toán, Lịch Sử Sửa Đổi, Lịch Sử UNC), Cài Đặt.

Thuật ngữ quan trọng: "Phiếu cân" = phiếu ghi khối lượng gỗ tại bàn cân; "ĐNTT" = Đề Nghị Thanh Toán; "Hợp đồng" (HĐ) = hợp đồng thu mua gỗ với chủ rừng; "112" = hồ sơ tổng hợp thanh toán theo hợp đồng; "UNC" = Ủy Nhiệm Chi (lệnh chuyển tiền ngân hàng); "MISA" = phần mềm kế toán, file Update_NganHang_DN dùng để nhập vào MISA/ngân hàng; "File Nháp" = nơi lưu hồ sơ CHƯA chốt, có thể sửa/xóa tự do; "Đóng Thanh Toán"/"Chốt" = ghi chính thức, khóa dữ liệu.

Bạn có thể trả lời MỌI câu hỏi (không giới hạn chỉ về hệ thống này) - nhưng khi người dùng hỏi về cách dùng webapp, quy trình, hoặc thuật ngữ trong hệ thống, hãy dùng đúng ngữ cảnh trên. Trả lời ngắn gọn, rõ ràng, bằng tiếng Việt trừ khi người dùng hỏi bằng ngôn ngữ khác. Bạn CÓ được cấp một số liệu tổng quan THẬT (nếu có, sẽ đính kèm ngay bên dưới phần này) - CHỈ được dùng đúng những con số đó khi trả lời, không tự bịa/suy diễn số liệu khác. Với câu hỏi cần số liệu CHI TIẾT hơn (tên khách hàng cụ thể, số tiền 1 hồ sơ, dữ liệu Báo Cáo Công Nợ...) mà không có trong số liệu được cấp, hãy nói rõ bạn chỉ có số liệu tổng quan và hướng dẫn người dùng vào đúng trang trong webapp để tự xem.`;

function getChatbotSettings_() {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') || '';
  return { apiKey, coApiKey: !!apiKey };
}
/** #Web: lưu API key Gemini - gọi từ Cài Đặt. */
function webSetChatbotApiKey_(apiKey) {
  try {
    const clean = String(apiKey || '').trim();
    if (!clean) {
      PropertiesService.getScriptProperties().deleteProperty('GEMINI_API_KEY');
      return { success: true, message: '✅ Đã xóa API key - chatbot sẽ dùng chế độ dự phòng (không AI).' };
    }
    PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', clean);
    return { success: true, message: '✅ Đã lưu API key Gemini.' };
  } catch (e) {
    return { success: false, message: '❌ Lỗi: ' + _loiChoNguoiDung_(e) };
  }
}
/** #Web: cho Cài Đặt biết ĐÃ có API key chưa (không trả về chính key ra
 * ngoài để tránh lộ) + danh sách model đang cấu hình / đang dùng. */
function getChatbotSettingsForWeb_() {
  const s = getChatbotSettings_();
  const props = PropertiesService.getScriptProperties();
  return {
    coApiKey: s.coApiKey,
    models: _tachDsModel_(props.getProperty('GEMINI_MODELS')),
    modelsMacDinh: GEMINI_MODELS_MAC_DINH_,
    modelDangDung: props.getProperty('GEMINI_MODEL') || ''
  };
}

/** "gemini-a, models/gemini-b; x y" -> ["gemini-a", "gemini-b", ...] (chỉ nhận tên hợp lệ). */
function _tachDsModel_(chuoi) {
  const ds = String(chuoi || '').split(/[\s,;]+/).map(x => x.replace(/^models\//, '')).filter(x => /^[a-z0-9][a-z0-9.\-]*$/i.test(x));
  return Array.from(new Set(ds));
}

/** Thứ tự thử: model chạy được gần nhất (GEMINI_MODEL) -> danh sách cấu hình (hoặc mặc định). */
function _dsModelGemini_() {
  const props = PropertiesService.getScriptProperties();
  const cauHinh = _tachDsModel_(props.getProperty('GEMINI_MODELS'));
  const ds = cauHinh.length ? cauHinh : GEMINI_MODELS_MAC_DINH_;
  const ganNhat = props.getProperty('GEMINI_MODEL');
  return ganNhat ? [ganNhat].concat(ds.filter(m => m !== ganNhat)) : ds.slice();
}

/** Hỏi Google các model ĐANG dùng được với API key này cho hội thoại văn
 * bản (generateContent, dòng "flash"), phiên bản mới nhất trước. */
function _timModelGeminiKhaDung_(apiKey) {
  const res = UrlFetchApp.fetch(GEMINI_API_URL_ + '?pageSize=200&key=' + encodeURIComponent(apiKey), { muteHttpExceptions: true });
  const json = JSON.parse(res.getContentText());
  if (json.error) throw new Error('Không lấy được danh sách model từ Google: ' + json.error.message);
  const phienBan = t => Number((/^gemini-(\d+(?:\.\d+)?)/.exec(t) || [])[1] || 0);
  return (json.models || [])
    .filter(m => (m.supportedGenerationMethods || []).indexOf('generateContent') !== -1)
    .map(m => String(m.name || '').replace(/^models\//, ''))
    .filter(t => /^gemini-/.test(t) && /flash/.test(t) && !GEMINI_MODEL_BO_QUA_KHI_DO_.test(t))
    .sort((a, b) => phienBan(b) - phienBan(a) || a.length - b.length || a.localeCompare(b));
}

/** #Web (Quản trị): lưu danh sách model (thứ tự ưu tiên). Để trống = dùng mặc định. */
function webSetGeminiModels_(chuoi) {
  try {
    const ds = _tachDsModel_(chuoi);
    const props = PropertiesService.getScriptProperties();
    if (ds.length) props.setProperty('GEMINI_MODELS', ds.join(', '));
    else props.deleteProperty('GEMINI_MODELS');
    // Thứ tự vừa chọn phải được thử trước model "chạy được gần nhất" cũ.
    props.deleteProperty('GEMINI_MODEL');
    logAction_('CAU_HINH_MODEL_AI', '-', ds.length ? ds.join(', ') : '(mặc định)');
    return { success: true, message: ds.length ? '✅ Đã lưu ' + ds.length + ' model: ' + ds.join(', ') : '✅ Đã chuyển về danh sách model mặc định.' };
  } catch (e) {
    return { success: false, message: '❌ Lỗi: ' + _loiChoNguoiDung_(e) };
  }
}

/** #Web (Quản trị): dò model khả dụng để điền vào ô cấu hình. */
function webDoModelGemini_() {
  try {
    const { apiKey } = getChatbotSettings_();
    if (!apiKey) return { success: false, message: '❌ Cần lưu API key Gemini trước khi dò model.' };
    const models = _timModelGeminiKhaDung_(apiKey);
    if (!models.length) return { success: false, message: '⚠️ Google không trả về model "flash" nào dùng được với API key này.' };
    return { success: true, models, message: '✅ Tìm thấy ' + models.length + ' model khả dụng - kiểm tra thứ tự rồi bấm Lưu.' };
  } catch (e) {
    return { success: false, message: '❌ ' + _loiChoNguoiDung_(e) };
  }
}

function _goiGeminiCoDuPhong_(contents, apiKey, systemInstructionText) {
  function goi_(m) {
    const url = GEMINI_API_URL_ + '/' + m + ':generateContent?key=' + encodeURIComponent(apiKey);
    // Trường "systemInstruction" chuẩn của Gemini API (không giả lập bằng 1 lượt hội thoại).
    const payload = { contents };
    if (systemInstructionText) payload.systemInstruction = { parts: [{ text: systemInstructionText }] };
    return JSON.parse(UrlFetchApp.fetch(url, {
      method: 'post', contentType: 'application/json',
      payload: JSON.stringify(payload), muteHttpExceptions: true
    }).getContentText());
  }

  // BẤT KỲ lỗi nào (hết hạn, quá tải, không tìm thấy...) đều thử NGAY model
  // kế tiếp, mỗi model tối đa 1 lần, không Utilities.sleep().
  const daThu = new Set();
  let model = '', json = { error: { message: 'Chưa cấu hình model Gemini nào.' } };
  const thuLanLuot = ds => ds.forEach(m => {
    if (!json.error || daThu.has(m)) return;
    daThu.add(m); model = m; json = goi_(m);
  });

  thuLanLuot(_dsModelGemini_());
  if (json.error) {
    // Mọi model đã cấu hình đều lỗi (thường do Google ngừng hỗ trợ) -> hỏi
    // Google model nào còn dùng được, thử tối đa 3 model mới nhất.
    try { thuLanLuot(_timModelGeminiKhaDung_(apiKey).filter(m => !daThu.has(m)).slice(0, 3)); } catch (e) { /* giữ lỗi của lần gọi cuối */ }
  }

  const props = PropertiesService.getScriptProperties();
  if (!json.error && props.getProperty('GEMINI_MODEL') !== model) props.setProperty('GEMINI_MODEL', model);
  return { json, model };
}

/** Trả lời dự phòng KHÔNG cần AI - dùng khi chưa có API key hoặc Gemini lỗi. */
function _chatbotTraLoiDuPhong_(cauHoi) {
  return 'Chatbot AI hiện chưa sẵn sàng (chưa cấu hình API key hoặc Gemini đang lỗi). ' +
    'Bạn có thể xem "📖 Hướng Dẫn Sử Dụng" trong menu để biết quy trình 5 bước và hướng dẫn từng màn hình, ' +
    'hoặc vào Cài Đặt để dán API key Gemini (Google AI Studio) cho chatbot.';
}

/**
 * #Web: hàm chính chatbot - gọi từ widget. cauHoi: chuỗi câu hỏi.
 * lichSuHoiDap: mảng {vaiTro:'nguoi'|'bot', noiDung} - vài lượt gần nhất
 * để hiểu câu hỏi nối tiếp (không cần idGoiY vì đây là trợ lý tự do,
 * không tra cứu đối tượng dữ liệu cụ thể theo ID).
 */
/**
 * MỚI (theo yêu cầu - "sao nó không truy cập được"): TRA DỮ LIỆU THẬT
 * TRƯỚC (đúng nguyên tắc "không để AI tự bịa số liệu") - lấy nhanh số
 * liệu tổng quan hiện tại (giống Trang Chủ), đưa vào ngữ cảnh cho AI
 * diễn giải câu trả lời tự nhiên. CHỈ lấy số liệu TỔNG QUAN (không phải
 * chi tiết từng hồ sơ/số tiền cá nhân) - đủ để trả lời "hôm nay thế
 * nào", "còn bao nhiêu hồ sơ chờ duyệt"... Nếu lỗi (chưa kết nối File
 * Chính...), trả về null - chatbot vẫn hoạt động ở chế độ không có số
 * liệu (như trước).
 */
/**
 * SỬA (theo yêu cầu - "trả lời được tên khách hàng cụ thể, số tiền 1 hồ
 * sơ, công nợ, tổng hợp theo Đại Lý/Nguồn Gốc"): mở rộng thêm dữ liệu
 * THẬT được cấp cho AI - vẫn đúng nguyên tắc "dữ liệu thật trước, AI chỉ
 * diễn giải". Giới hạn số dòng hợp lý (KH/HĐ) để không vượt quá payload,
 * ưu tiên hồ sơ/khách hàng có công nợ LỚN NHẤT trước - đây thường là
 * điều người dùng quan tâm nhất khi hỏi.
 */
function _layNgayVaSoLieuThatChoChatbot_() {
  try {
    const stats = getDashboardStats_();
    stats.nguonChoXuLy = _demNguonChoXuLy_();
    const list = getDraftListSummary_();
    const dem = { cho_tinh: 0, cho_dntt: 0, dang_dntt: 0 };
    list.forEach(r => { if (dem[r.trangThaiKey] !== undefined) dem[r.trangThaiKey]++; });
    const homNay = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy");
    const tuNgay90Ngay = Utilities.formatDate(new Date(Date.now() - 90 * 86400000), "GMT+7", "yyyy-MM-dd");

    let phanCongNoKH = "", phanCongNoHD = "", phanDaiLyNguonGoc = "", phanHoSoNhap = "", phanCongNoPhieuCan = "";
    try {
      const homQua = Utilities.formatDate(new Date(Date.now() - 86400000), "GMT+7", "yyyy-MM-dd");
      const ctcn = getChiTietCongNoPhieuCanWeb_(homQua, {});
      const top = ctcn.slice().sort((a, b) => (b.chenhLechNgay || 0) - (a.chenhLechNgay || 0)).slice(0, 100);
      const tongChuaTT = ctcn.reduce((s, r) => s + (r.thanhTien || 0), 0);
      phanCongNoPhieuCan = `\n\nCHI TIẾT CÔNG NỢ THEO PHIẾU CÂN (phiếu cân CHƯA thanh toán tính đến ${homQua}, tổng ${ctcn.length} phiếu, tổng tiền chưa TT ${tongChuaTT.toLocaleString('vi-VN')}đ - liệt kê tối đa 100 phiếu TREO LÂU NHẤT trước):\n` +
        top.map(r => `- Phiếu ${r.soPhieuCan} (${r.khachHang}, ĐL ${r.dl}): ${(r.thanhTien||0).toLocaleString('vi-VN')}đ, nhập ngày ${r.ngayNhap1}, treo ${r.chenhLechNgay} ngày`).join("\n");
    } catch (e) {}
    try {
      const congNoKH = getDebtByCustomer_(tuNgay90Ngay, homNay.split('/').reverse().join('-'));
      const top = congNoKH.slice(0, 100);
      phanCongNoKH = "\n\nCÔNG NỢ THEO KHÁCH HÀNG (90 ngày gần nhất, sắp xếp công nợ giảm dần, tối đa 100 khách hàng lớn nhất - nếu khách hàng cần tìm KHÔNG có trong danh sách này, khả năng công nợ = 0 hoặc ngoài 90 ngày gần đây):\n" +
        top.map(o => `- ${o.khachHang}: nhập ${o.giaTriNhapLuyKe.toLocaleString('vi-VN')}đ, đã TT ${o.daTTLuyKe.toLocaleString('vi-VN')}đ, còn nợ ${o.congNo.toLocaleString('vi-VN')}đ`).join("\n");
    } catch (e) {}
    try {
      const congNoHD = getDebtByContract_(tuNgay90Ngay, homNay.split('/').reverse().join('-'));
      const top = congNoHD.slice(0, 100);
      phanCongNoHD = "\n\nCÔNG NỢ THEO HỢP ĐỒNG (90 ngày gần nhất, tối đa 100 hợp đồng công nợ lớn nhất):\n" +
        top.map(o => `- HĐ ${o.soHD} (${o.chuRung}): SL dự kiến ${o.slDuKien}, đã thực hiện ${o.klThucHienLuyKe}, còn nợ ${o.congNo.toLocaleString('vi-VN')}đ`).join("\n");
    } catch (e) {}
    try {
      const pt = getPaymentAnalysis_(tuNgay90Ngay, homNay.split('/').reverse().join('-'));
      const dsDaiLy = (pt.theoDaiLy || []).map(o => `${o.nhan}: ${o.klTan.toFixed(1)} tấn, ${o.giaTri.toLocaleString('vi-VN')}đ`).join("; ");
      const dsNguonGoc = (pt.theoNguonGoc || []).map(o => `${o.nhan}: ${o.klTan.toFixed(1)} tấn, ${o.giaTri.toLocaleString('vi-VN')}đ`).join("; ");
      phanDaiLyNguonGoc = `\n\nTỔNG HỢP THEO ĐẠI LÝ (90 ngày gần nhất): ${dsDaiLy || "(không có dữ liệu)"}\nTỔNG HỢP THEO NGUỒN GỐC (90 ngày gần nhất): ${dsNguonGoc || "(không có dữ liệu)"}`;
    } catch (e) {}
    try {
      phanHoSoNhap = "\n\nDANH SÁCH HỒ SƠ ĐANG CHỜ XỬ LÝ (File Nháp, chưa chốt - đây là số tiền TỪNG HỒ SƠ cụ thể):\n" +
        list.slice(0, 100).map(r => `- ${r.chuRung || r.hoTenChuRung || ''} (Số HĐ ${r.soHD || ''}): ${(r.soTien||0).toLocaleString('vi-VN')}đ, trạng thái ${r.trangThaiKey === 'cho_tinh' ? 'Chưa ĐNTT' : r.trangThaiKey === 'cho_dntt' ? 'Chờ ĐNTT' : 'Đang ĐNTT'}`).join("\n");
    } catch (e) {}

    return `Thời điểm hiện tại: ${homNay}.
Số liệu THẬT đang có trong hệ thống (đọc trực tiếp lúc trả lời):
- Hồ sơ "Chưa ĐNTT" (mới tạo, chưa tính tiền): ${dem.cho_tinh}
- Hồ sơ "Chờ ĐNTT" (đã tính tiền, chờ Xác Nhận): ${dem.cho_dntt}
- Hồ sơ "Đang ĐNTT" (đã xác nhận, chờ Duyệt/Đóng Thanh Toán): ${dem.dang_dntt}
- Tổng hồ sơ trong File Nháp: ${stats.draftCount}
- Tổng tiền các hồ sơ đã sẵn sàng chốt (đang chờ): ${stats.draftTotalTien.toLocaleString('vi-VN')} đ
- Số "đơn xin" cũ (quy trình nhập liệu thủ công) chưa xử lý: ${stats.nguonChoXuLy}${phanHoSoNhap}${phanCongNoKH}${phanCongNoHD}${phanDaiLyNguonGoc}${phanCongNoPhieuCan}

Đây là số liệu THẬT tính đến thời điểm trả lời - hãy dùng ĐÚNG các số này khi trả lời, KHÔNG tự đoán/làm tròn/suy diễn thêm số liệu KHÔNG có trong danh sách trên. Nếu khách hàng/hợp đồng được hỏi KHÔNG xuất hiện trong danh sách trên (đã giới hạn top 100 theo công nợ/90 ngày gần nhất), nói rõ KHÔNG tìm thấy trong dữ liệu được cấp (có thể do công nợ = 0, ngoài 90 ngày gần đây, hoặc sai tên) - hướng dẫn vào đúng trang Báo Cáo Công Nợ để tìm kiếm đầy đủ hơn, KHÔNG bịa số liệu.`;
  } catch (e) {
    return null; // Chưa kết nối File Chính hoặc lỗi khác - chatbot vẫn trả lời được, chỉ không có số liệu thật
  }
}

function TRA_LOI_CHATBOT_(cauHoi, lichSuHoiDap) {
  try {
    cauHoi = String(cauHoi || '').trim();
    if (!cauHoi) return { thanhCong: false, loi: 'Câu hỏi trống.' };

    const { apiKey } = getChatbotSettings_();
    if (!apiKey) {
      return { thanhCong: true, traLoi: _chatbotTraLoiDuPhong_(cauHoi), khongDungAI: true };
    }

    const contents = [];
    (Array.isArray(lichSuHoiDap) ? lichSuHoiDap.slice(-8) : []).forEach(luot => {
      contents.push({ role: luot.vaiTro === 'nguoi' ? 'user' : 'model', parts: [{ text: String(luot.noiDung || '') }] });
    });
    contents.push({ role: 'user', parts: [{ text: cauHoi }] });

    // MỚI (theo yêu cầu - "thêm quyền đọc số liệu thật"): tra số liệu
    // tổng quan THẬT trước, gắn thêm vào system prompt - đúng nguyên
    // tắc "dữ liệu thật trước, AI chỉ diễn giải" (không tự bịa số).
    const soLieuThat = _layNgayVaSoLieuThatChoChatbot_();
    const promptDayDu = soLieuThat ? (CHATBOT_HE_THONG_PROMPT_ + '\n\n' + soLieuThat) : CHATBOT_HE_THONG_PROMPT_;

    const { json } = _goiGeminiCoDuPhong_(contents, apiKey, promptDayDu);

    if (json.error) {
      return {
        thanhCong: true,
        traLoi: '⚠️ (AI đang lỗi: ' + json.error.message + ' — dùng tạm chế độ dự phòng)\n\n' + _chatbotTraLoiDuPhong_(cauHoi),
        khongDungAI: true
      };
    }

    const traLoi = (json.candidates && json.candidates[0] && json.candidates[0].content &&
      json.candidates[0].content.parts && json.candidates[0].content.parts[0] && json.candidates[0].content.parts[0].text) || '';
    if (!traLoi) {
      return { thanhCong: true, traLoi: '⚠️ AI không trả về nội dung — dùng tạm chế độ dự phòng.\n\n' + _chatbotTraLoiDuPhong_(cauHoi), khongDungAI: true };
    }

    return { thanhCong: true, traLoi: traLoi.trim(), khongDungAI: false };
  } catch (e) {
    return { thanhCong: true, traLoi: '⚠️ (Lỗi hệ thống: ' + _loiChoNguoiDung_(e) + ' — dùng tạm chế độ dự phòng)\n\n' + _chatbotTraLoiDuPhong_(cauHoi), khongDungAI: true };
  }
}

