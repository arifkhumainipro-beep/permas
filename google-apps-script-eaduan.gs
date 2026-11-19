/**
 * ==============================================================================
 * SISTEM E-ADUAN RASMI PERMAS NASIONAL (GOOGLE APPS SCRIPT WEBHOOK)
 * ==============================================================================
 * Akaun Sasaran   : permasnasionalofficial@gmail.com
 * Fungsi Utama    :
 *   1. Menerima payload aduan JSON daripada borang e-aduan (aduan.html).
 *   2. Merekodkan setiap aduan secara automatik ke dalam tab Google Sheet
 *      "Rekod E-Aduan PERMAS".
 *   3. Menghantar Emel Laporan Rasmi AI (format HTML) terus kepada
 *      permasnasionalofficial@gmail.com dengan Reply-To ditetapkan kepada
 *      alamat emel pengadu.
 *   4. Menghantar Emel Resit Pengesahan Rasmi (format HTML) secara automatik
 *      kepada alamat emel mahasiswa (pengadu).
 * ==============================================================================
 */

const PERMAS_OFFICIAL_EMAIL = "permasnasionalofficial@gmail.com";
const PERMAS_SHEET_NAME = "Rekod E-Aduan PERMAS";

/**
 * Titik masuk HTTP POST apabila pengguna menekan butang Submit di aduan.html.
 * Menghasilkan respons JSON selepas memproses Sheet & Emel.
 */
function doPost(e) {
  try {
    const rawContents = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    const data = JSON.parse(rawContents);

    const payload = normalizePayload_(data);

    // 1. Rekod ke Google Sheet
    const sheetResult = logAduanToSheet_(payload);

    // 2. Hantar Emel Laporan Rasmi HTML ke permasnasionalofficial@gmail.com
    sendOfficialEmailToPermas_(payload);

    // 3. Hantar Emel Resit Pengesahan Rasmi HTML kepada pengadu (jika emel sah)
    const receiptSent = sendReceiptEmailToStudent_(payload);

    return jsonResponse_({
      ok: true,
      refNo: payload.refNo,
      sheetLogged: sheetResult.logged,
      rowNumber: sheetResult.rowNumber,
      receiptSent: receiptSent,
      message: "Aduan berjaya direkod dan emel rasmi telah dihantar."
    });
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: err && err.message ? err.message : String(err)
    });
  }
}

/**
 * Titik masuk HTTP GET untuk menyemak status aktif Web App.
 */
function doGet() {
  return jsonResponse_({
    ok: true,
    service: "PERMAS Nasional E-Aduan Google Apps Script Webhook",
    targetEmail: PERMAS_OFFICIAL_EMAIL,
    sheetTab: PERMAS_SHEET_NAME,
    timestamp: new Date().toISOString()
  });
}

/**
 * Fungsi ujian sekali klik di Editor Google Apps Script.
 * Jalankan fungsi ini SEKALI selepas menampal kod untuk mengesahkan
 * kebenaran (Authorize) Google Sheets dan Gmail/MailApp.
 */
function testHantarEmelDanSheet() {
  const samplePayload = normalizePayload_({
    refNo: "PERMAS-TEST-" + Utilities.formatDate(new Date(), "Asia/Kuala_Lumpur", "yyyyMMdd-HHmm"),
    priority: "TINGGI (Ujian Sistem)",
    bureau: "Biro Kebajikan & Aduan Mahasiswa",
    timestampDisplay: Utilities.formatDate(new Date(), "Asia/Kuala_Lumpur", "dd/MM/yyyy HH:mm:ss") + " MYT",
    nama: "Muhammad Danish Haikal (Ujian Sistem)",
    ic: "020514-10-0000",
    emel: PERMAS_OFFICIAL_EMAIL,
    ipt: "Universiti Kebangsaan Malaysia (UKM)",
    tel: "+60123456789",
    kategori: "Penipuan / Penahanan Deposit Rumah Sewa",
    daerah: "Hulu Langat",
    tajuk: "Ujian Sambungan Webhook E-Aduan PERMAS Nasional",
    keterangan: "Ini adalah rekod ujian automatik bagi mengesahkan integrasi Google Sheets dan penghantaran emel HTML rasmi E-Aduan PERMAS Nasional berjalan lancar.",
    aiSummary: "Ringkasan AI (Ujian): Sistem E-Aduan berjaya berhubung dengan Google Sheets dan Gmail PERMAS Nasional.",
    sulitText: "Ya - Rahsiakan Identiti (PDPA)",
    reportBody: "=== UJIAN SISTEM E-ADUAN PERMAS NASIONAL ===\nSambungan berjaya disahkan."
  });

  const sheetResult = logAduanToSheet_(samplePayload);
  sendOfficialEmailToPermas_(samplePayload);
  const receiptSent = sendReceiptEmailToStudent_(samplePayload);

  Logger.log("Ujian selesai! Baris Sheet: %s | Resit Pengadu Dihantar: %s", sheetResult.rowNumber, receiptSent);
}

/**
 * Menyeragamkan medan payload supaya selamat daripada nilai null/undefined.
 */
function normalizePayload_(data) {
  const d = data || {};
  const nowDisplay = Utilities.formatDate(new Date(), "Asia/Kuala_Lumpur", "dd/MM/yyyy HH:mm:ss") + " MYT";
  return {
    refNo: String(d.refNo || ("PERMAS-" + Date.now())).trim(),
    priority: String(d.priority || "STANDARD (Tindakan 24 Jam)").trim(),
    bureau: String(d.bureau || "Biro Aduan & Kebajikan Mahasiswa PERMAS").trim(),
    timestampDisplay: String(d.timestampDisplay || nowDisplay).trim(),
    nama: String(d.nama || "-").trim(),
    ic: String(d.ic || "-").trim(),
    emel: String(d.emel || "").trim(),
    ipt: String(d.ipt || "-").trim(),
    tel: String(d.tel || "-").trim(),
    kategori: String(d.kategori || "-").trim(),
    daerah: String(d.daerah || "-").trim(),
    tajuk: String(d.tajuk || "Aduan Mahasiswa Selangor").trim(),
    keterangan: String(d.keterangan || "-").trim(),
    aiSummary: String(d.aiSummary || "-").trim(),
    sulitText: String(d.sulitText || "Ya - Rahsiakan Identiti (PDPA)").trim(),
    reportBody: String(d.reportBody || "-").trim()
  };
}

/**
 * Merekodkan baris aduan ke dalam tab "Rekod E-Aduan PERMAS".
 * Jika skrip diikat kepada Google Sheet (container-bound), guna spreadsheet aktif;
 * jika tidak, cuba cipta/buka spreadsheet automatik.
 */
function logAduanToSheet_(payload) {
  let ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    ss = null;
  }

  if (!ss) {
    const props = PropertiesService.getScriptProperties();
    const savedId = props.getProperty("PERMAS_SPREADSHEET_ID");
    if (savedId) {
      try {
        ss = SpreadsheetApp.openById(savedId);
      } catch (e) {
        ss = null;
      }
    }
    if (!ss) {
      ss = SpreadsheetApp.create("Rekod E-Aduan Rasmi PERMAS Nasional");
      props.setProperty("PERMAS_SPREADSHEET_ID", ss.getId());
    }
  }

  let sheet = ss.getSheetByName(PERMAS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(PERMAS_SHEET_NAME);
  }

  const headers = [
    "Tarikh & Masa",
    "No. Rujukan",
    "Tahap Keutamaan AI",
    "Biro Bertanggungjawab",
    "Nama Mahasiswa",
    "No. KP",
    "Emel Mahasiswa",
    "No. Telefon",
    "IPT / Kampus",
    "Daerah Selangor",
    "Kategori Isu",
    "Tajuk Aduan",
    "Keterangan Asal",
    "Ringkasan Eksekutif AI",
    "Status PDPA",
    "Status Tindakan"
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange
      .setBackground("#991B1B")
      .setFontColor("#FDE68A")
      .setFontWeight("bold")
      .setHorizontalAlignment("left")
      .setVerticalAlignment("middle");
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 34);
  }

  const rowValues = [
    payload.timestampDisplay,
    payload.refNo,
    payload.priority,
    payload.bureau,
    payload.nama,
    payload.ic,
    payload.emel || "-",
    payload.tel,
    payload.ipt,
    payload.daerah,
    payload.kategori,
    payload.tajuk,
    payload.keterangan,
    payload.aiSummary,
    payload.sulitText,
    "BARU DITERIMA"
  ];

  sheet.appendRow(rowValues);
  const lastRow = sheet.getLastRow();

  // Warna amaran lembut pada lajur keutamaan jika kecemasan/kritikal
  const priorityUpper = payload.priority.toUpperCase();
  if (priorityUpper.indexOf("KRITIKAL") !== -1 || priorityUpper.indexOf("SOS") !== -1) {
    sheet.getRange(lastRow, 3).setBackground("#FEE2E2").setFontColor("#991B1B").setFontWeight("bold");
  } else if (priorityUpper.indexOf("TINGGI") !== -1) {
    sheet.getRange(lastRow, 3).setBackground("#FEF3C7").setFontColor("#92400E").setFontWeight("bold");
  }

  return {
    logged: true,
    rowNumber: lastRow
  };
}

/**
 * Menghantar Emel Laporan Rasmi HTML ke permasnasionalofficial@gmail.com
 * dengan Reply-To ditetapkan kepada emel pengadu.
 */
function sendOfficialEmailToPermas_(payload) {
  const subject = "[E-ADUAN PERMAS] " + payload.refNo + " [" + payload.priority + "] - " + payload.tajuk;
  const cleanPhoneDigits = String(payload.tel || "").replace(/[^0-9]/g, "");
  const waNumber = cleanPhoneDigits.startsWith("0") ? ("6" + cleanPhoneDigits) : cleanPhoneDigits;
  const waReplyUrl = waNumber
    ? ("https://wa.me/" + waNumber + "?text=" + encodeURIComponent(
        "Salam Sejahtera " + payload.nama + ", pihak Urusetia E-Aduan PERMAS Nasional telah menerima aduan rasmi anda (" + payload.refNo + ") bertajuk: " + payload.tajuk + ". Kami sedang menyemak tindakan susulan bersama " + payload.bureau + "."
      ))
    : "#";

  const hasValidEmail = isValidEmail_(payload.emel);
  const mailReplyUrl = hasValidEmail
    ? ("mailto:" + encodeURIComponent(payload.emel) + "?subject=" + encodeURIComponent("Maklum Balas Rasmi PERMAS Nasional [" + payload.refNo + "]"))
    : "#";

  const htmlBody = `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #0f172a;">
    <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);">
      <!-- Header Rasmi PERMAS -->
      <div style="background: linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%); padding: 22px 26px; border-bottom: 4px solid #f59e0b;">
        <div style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #fde68a;">
          LAPORAN RASMI E-ADUAN &bull; SISTEM TRIAGE AI
        </div>
        <h1 style="margin: 6px 0 4px; font-size: 20px; color: #ffffff; line-height: 1.3;">
          ${escapeHtml_(payload.tajuk)}
        </h1>
        <div style="font-size: 13px; color: #fecaca; font-weight: 600;">
          No. Rujukan: <span style="color: #ffffff; font-family: monospace;">${escapeHtml_(payload.refNo)}</span> &bull; ${escapeHtml_(payload.timestampDisplay)}
        </div>
      </div>

      <!-- Kad Status Triage AI -->
      <div style="padding: 18px 26px; background-color: #fef2f2; border-bottom: 1px solid #fecaca;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; width: 50%; vertical-align: top;">
              <div style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: #991b1b; letter-spacing: 0.8px;">Tahap Keutamaan AI</div>
              <div style="font-size: 14px; font-weight: 800; color: #b91c1c; margin-top: 2px;">${escapeHtml_(payload.priority)}</div>
            </td>
            <td style="padding: 4px 0; width: 50%; vertical-align: top;">
              <div style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: #991b1b; letter-spacing: 0.8px;">Biro Bertanggungjawab</div>
              <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-top: 2px;">${escapeHtml_(payload.bureau)}</div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Ringkasan Eksekutif AI -->
      <div style="padding: 20px 26px 0;">
        <div style="background-color: #fffbeb; border: 1px solid #fcd34d; border-left: 4px solid #d97706; border-radius: 8px; padding: 14px 16px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #92400e; letter-spacing: 0.8px; margin-bottom: 6px;">
            Ringkasan Eksekutif AI
          </div>
          <div style="font-size: 13px; color: #1e293b; line-height: 1.6;">
            ${escapeHtml_(payload.aiSummary)}
          </div>
        </div>
      </div>

      <!-- Jadual Maklumat Pengadu -->
      <div style="padding: 20px 26px;">
        <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.8px; margin-bottom: 10px;">
          1. Maklumat Mahasiswa / Pengadu
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #e2e8f0;">
          <tr style="background-color: #f8fafc;">
            <td style="padding: 9px 12px; font-weight: 700; width: 34%; border-bottom: 1px solid #e2e8f0; color: #475569;">Nama Penuh</td>
            <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${escapeHtml_(payload.nama)}</td>
          </tr>
          <tr>
            <td style="padding: 9px 12px; font-weight: 700; border-bottom: 1px solid #e2e8f0; color: #475569;">No. Kad Pengenalan</td>
            <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml_(payload.ic)}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 9px 12px; font-weight: 700; border-bottom: 1px solid #e2e8f0; color: #475569;">Emel Mahasiswa</td>
            <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml_(payload.emel || "-")}</td>
          </tr>
          <tr>
            <td style="padding: 9px 12px; font-weight: 700; border-bottom: 1px solid #e2e8f0; color: #475569;">No. Telefon / WhatsApp</td>
            <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${escapeHtml_(payload.tel)}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 9px 12px; font-weight: 700; border-bottom: 1px solid #e2e8f0; color: #475569;">Universiti / Kolej</td>
            <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml_(payload.ipt)}</td>
          </tr>
          <tr>
            <td style="padding: 9px 12px; font-weight: 700; border-bottom: 1px solid #e2e8f0; color: #475569;">Daerah Asal Selangor</td>
            <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml_(payload.daerah)}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 9px 12px; font-weight: 700; border-bottom: 1px solid #e2e8f0; color: #475569;">Kategori Isu</td>
            <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml_(payload.kategori)}</td>
          </tr>
          <tr>
            <td style="padding: 9px 12px; font-weight: 700; color: #475569;">Status Kerahsiaan (PDPA)</td>
            <td style="padding: 9px 12px; font-weight: 700; color: #991b1b;">${escapeHtml_(payload.sulitText)}</td>
          </tr>
        </table>

        <!-- Laporan Rasmi Penuh -->
        <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.8px; margin: 20px 0 8px;">
          2. Teks Laporan Rasmi Penuh (Dijana Automatik Oleh AI)
        </div>
        <pre style="white-space: pre-wrap; font-family: 'Consolas', 'Courier New', monospace; font-size: 12px; line-height: 1.6; background-color: #0f172a; color: #e2e8f0; padding: 16px; border-radius: 10px; border: 1px solid #334155; margin: 0;">${escapeHtml_(payload.reportBody)}</pre>

        <!-- Butang Tindakan Pantas Urusetia -->
        <div style="margin-top: 22px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
          ${hasValidEmail ? `<a href="${mailReplyUrl}" style="display: inline-block; background-color: #991b1b; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 11px 18px; border-radius: 8px; margin-right: 10px; margin-bottom: 8px;">Balas Emel Pengadu</a>` : ""}
          ${waNumber ? `<a href="${waReplyUrl}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 11px 18px; border-radius: 8px; margin-bottom: 8px;">WhatsApp Pengadu (${escapeHtml_(payload.tel)})</a>` : ""}
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f1f5f9; padding: 14px 26px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
        Emel ini dijana secara automatik oleh Sistem E-Aduan AI PERMAS Nasional dan salinan telah direkodkan di dalam Google Sheet <strong>${escapeHtml_(PERMAS_SHEET_NAME)}</strong>.
      </div>
    </div>
  </div>`;

  const emailOptions = {
    to: PERMAS_OFFICIAL_EMAIL,
    subject: subject,
    body: payload.reportBody,
    htmlBody: htmlBody,
    name: "Sistem E-Aduan AI PERMAS Nasional"
  };

  if (hasValidEmail) {
    emailOptions.replyTo = payload.emel;
  }

  MailApp.sendEmail(emailOptions);
}

/**
 * Menghantar Emel Resit Pengesahan Rasmi HTML kepada mahasiswa (pengadu).
 */
function sendReceiptEmailToStudent_(payload) {
  if (!isValidEmail_(payload.emel)) {
    return false;
  }

  const subject = "[RESIT RASMI E-ADUAN PERMAS] No. Rujukan: " + payload.refNo;
  const htmlBody = `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #0f172a;">
    <div style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #991b1b 100%); padding: 22px 26px; border-bottom: 4px solid #f59e0b;">
        <div style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #fde68a;">
          PERSATUAN MAHASISWA SELANGOR (PERMAS) NASIONAL
        </div>
        <h1 style="margin: 6px 0 4px; font-size: 19px; color: #ffffff;">
          Resit Pengesahan Rasmi E-Aduan Mahasiswa
        </h1>
        <div style="font-size: 12px; color: #e2e8f0;">
          No. Rujukan Kes: <strong style="color: #fde68a; font-family: monospace;">${escapeHtml_(payload.refNo)}</strong>
        </div>
      </div>

      <div style="padding: 22px 26px; font-size: 13px; line-height: 1.65; color: #334155;">
        <p style="margin-top: 0;">Salam Sejahtera <strong>${escapeHtml_(payload.nama)}</strong>,</p>
        <p>Aduan rasmi anda telah <strong>berjaya diterima, dianalisis oleh Sistem Triage AI</strong> dan dihantar terus kepada sekretariat <strong>PERMAS Nasional (${escapeHtml_(PERMAS_OFFICIAL_EMAIL)})</strong>.</p>

        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px 16px; margin: 16px 0;">
          <div><strong>Tajuk Aduan:</strong> ${escapeHtml_(payload.tajuk)}</div>
          <div><strong>Kategori:</strong> ${escapeHtml_(payload.kategori)}</div>
          <div><strong>Tahap Keutamaan AI:</strong> ${escapeHtml_(payload.priority)}</div>
          <div><strong>Biro Bertanggungjawab:</strong> ${escapeHtml_(payload.bureau)}</div>
          <div><strong>Tarikh &amp; Masa Diterima:</strong> ${escapeHtml_(payload.timestampDisplay)}</div>
          <div><strong>Status Kerahsiaan:</strong> ${escapeHtml_(payload.sulitText)}</div>
        </div>

        <p style="margin-bottom: 8px;"><strong>Salinan Laporan Rasmi Anda:</strong></p>
        <pre style="white-space: pre-wrap; font-family: 'Consolas', 'Courier New', monospace; font-size: 11.5px; line-height: 1.55; background-color: #0f172a; color: #e2e8f0; padding: 14px; border-radius: 10px;">${escapeHtml_(payload.reportBody)}</pre>

        <p style="margin-top: 16px; margin-bottom: 0; font-size: 12px; color: #64748b;">
          Jika anda mempunyai dokumen sokongan tambahan (resit, surat atau tangkap layar), sila balas terus emel ini dengan menyertakan No. Rujukan <strong>${escapeHtml_(payload.refNo)}</strong>.
        </p>
      </div>

      <div style="background-color: #f1f5f9; padding: 14px 26px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
        Biro Kebajikan &amp; Aduan Mahasiswa &bull; PERMAS Nasional &bull; ${escapeHtml_(PERMAS_OFFICIAL_EMAIL)}
      </div>
    </div>
  </div>`;

  MailApp.sendEmail({
    to: payload.emel,
    replyTo: PERMAS_OFFICIAL_EMAIL,
    subject: subject,
    body: "Salam Sejahtera " + payload.nama + ",\n\nAduan anda (" + payload.refNo + ") telah diterima oleh PERMAS Nasional.\n\n" + payload.reportBody,
    htmlBody: htmlBody,
    name: "Biro Aduan & Kebajikan PERMAS Nasional"
  });
  return true;
}

function isValidEmail_(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function escapeHtml_(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
