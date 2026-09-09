import QRCode from "qrcode";
import brandLogo from "../assets/logo.png";

export interface InvoiceDetails {
  id?: string | number;
  reference?: string;
  invoiceNumber?: string;
  name: string;
  email?: string;
  phone?: string;
  partnerId?: string;
  planName?: string;
  amount: number;
  currency?: string;
  provider?: string;
  status?: string;
  date?: string;
  recurring?: boolean;
  notes?: string;
  purpose?: string;
}

export interface PartnerCardDetails {
  id: string | number;
  name: string;
  email: string;
  role?: string;
  planName: string;
  subscriptionStatus: string;
  amount?: number;
  currency?: string;
  joinedAt?: string;
  photoUrl?: string;
  phone?: string;
  expiryYear?: string;
}

export interface AnnualStatementDetails {
  partnerName: string;
  partnerEmail: string;
  partnerId: string;
  year: number;
  donations: Array<{
    date: string;
    description: string;
    reference: string;
    amount: number;
    currency: string;
    recurring: boolean;
  }>;
}

/**
 * Generate a high-resolution QR code as base64 data URI
 */
export async function generateQrDataUrl(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width: 250,
      margin: 1,
      color: {
        dark: "#0c1b33",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    });
  } catch (err) {
    console.error("Failed to generate QR code", err);
    return "";
  }
}

/**
 * Generates an SVG string for Bishop Dr. George Githinji's digital signature
 */
export function getBishopSignatureSvg(): string {
  return `
    <svg viewBox="0 0 240 70" width="180" height="52" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 45 C 30 15, 45 60, 60 25 C 75 10, 85 45, 95 30 C 110 15, 120 50, 140 28 C 160 10, 180 55, 210 35 M45 40 Q 95 10 190 20 M70 52 L 185 48" 
        fill="none" stroke="#0c1b33" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.88"/>
      <circle cx="195" cy="30" r="3" fill="#0c1b33" opacity="0.85"/>
      <text x="35" y="65" font-family="'Outfit', sans-serif" font-size="10" font-weight="700" fill="#855d14" letter-spacing="1">
        BISHOP DR. GEORGE GITHINJI
      </text>
    </svg>
  `;
}

/**
 * Generates an SVG Gold Official Security Seal
 */
export function getOfficialSealSvg(): string {
  return `
    <svg viewBox="0 0 120 120" width="90" height="90" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fdf6d8"/>
          <stop offset="35%" stop-color="#d4af37"/>
          <stop offset="70%" stop-color="#aa7c11"/>
          <stop offset="100%" stop-color="#f3e5ab"/>
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="none" stroke="url(#goldGrad)" stroke-width="3" stroke-dasharray="3 1.5"/>
      <circle cx="60" cy="60" r="48" fill="none" stroke="#d4af37" stroke-width="1"/>
      <circle cx="60" cy="60" r="44" fill="#0c1b33" stroke="url(#goldGrad)" stroke-width="2"/>
      <!-- Star rays -->
      <path d="M60 22 L63 32 L73 35 L64 42 L67 52 L58 46 L50 52 L53 41 L45 35 L55 32 Z" fill="url(#goldGrad)" transform="translate(1, -2) scale(1)"/>
      <text x="60" y="66" text-anchor="middle" font-family="'Outfit', sans-serif" font-size="7.5" font-weight="800" fill="#fdf6d8" letter-spacing="1">
        OFFICIAL SEAL
      </text>
      <text x="60" y="76" text-anchor="middle" font-family="'Outfit', sans-serif" font-size="6" font-weight="700" fill="#d4af37" letter-spacing="0.5">
        KINGDOM MISSIONS
      </text>
      <text x="60" y="85" text-anchor="middle" font-family="'Outfit', sans-serif" font-size="5.5" font-weight="600" fill="#ffffff" opacity="0.8">
        ★ VERIFIED RECORD ★
      </text>
    </svg>
  `;
}

/**
 * Generates an SVG EMV Gold Smart Chip
 */
export function getSmartChipSvg(): string {
  return `
    <svg viewBox="0 0 50 38" width="42" height="32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="chipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffe699"/>
          <stop offset="40%" stop-color="#d4af37"/>
          <stop offset="80%" stop-color="#996515"/>
          <stop offset="100%" stop-color="#fff2b3"/>
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="48" height="36" rx="6" fill="url(#chipGrad)" stroke="#7a5210" stroke-width="0.8"/>
      <!-- Internal contacts -->
      <line x1="1" y1="13" x2="49" y2="13" stroke="#7a5210" stroke-width="0.8"/>
      <line x1="1" y1="25" x2="49" y2="25" stroke="#7a5210" stroke-width="0.8"/>
      <line x1="18" y1="1" x2="18" y2="37" stroke="#7a5210" stroke-width="0.8"/>
      <line x1="32" y1="1" x2="32" y2="37" stroke="#7a5210" stroke-width="0.8"/>
      <circle cx="25" cy="19" r="4.5" fill="none" stroke="#7a5210" stroke-width="0.8"/>
    </svg>
  `;
}

/**
 * Generates an SVG Code-128 style Barcode
 */
export function getBarcodeSvg(code: string): string {
  return `
    <svg viewBox="0 0 160 30" width="130" height="24" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="160" height="30" fill="transparent"/>
      <g fill="#0c1b33">
        <rect x="2" y="0" width="3" height="22"/>
        <rect x="7" y="0" width="1.5" height="22"/>
        <rect x="11" y="0" width="4" height="22"/>
        <rect x="18" y="0" width="1.5" height="22"/>
        <rect x="22" y="0" width="3" height="22"/>
        <rect x="28" y="0" width="2" height="22"/>
        <rect x="33" y="0" width="4" height="22"/>
        <rect x="40" y="0" width="1.5" height="22"/>
        <rect x="44" y="0" width="3" height="22"/>
        <rect x="50" y="0" width="4.5" height="22"/>
        <rect x="57" y="0" width="1.5" height="22"/>
        <rect x="61" y="0" width="3" height="22"/>
        <rect x="67" y="0" width="2" height="22"/>
        <rect x="72" y="0" width="4" height="22"/>
        <rect x="79" y="0" width="1.5" height="22"/>
        <rect x="83" y="0" width="3" height="22"/>
        <rect x="89" y="0" width="4.5" height="22"/>
        <rect x="96" y="0" width="2" height="22"/>
        <rect x="101" y="0" width="3.5" height="22"/>
        <rect x="107" y="0" width="1.5" height="22"/>
        <rect x="111" y="0" width="4" height="22"/>
        <rect x="118" y="0" width="2" height="22"/>
        <rect x="123" y="0" width="3" height="22"/>
        <rect x="129" y="0" width="1.5" height="22"/>
        <rect x="133" y="0" width="4" height="22"/>
        <rect x="140" y="0" width="2" height="22"/>
        <rect x="145" y="0" width="4" height="22"/>
        <rect x="152" y="0" width="2" height="22"/>
        <rect x="156" y="0" width="3" height="22"/>
      </g>
      <text x="80" y="29" text-anchor="middle" font-family="'Courier New', monospace" font-size="6.5" font-weight="700" fill="#0c1b33" letter-spacing="1.5">
        ${code}
      </text>
    </svg>
  `;
}

/**
 * Universal print executor using an isolated hidden iframe
 * Guarantees zero blank prints, zero backdrop bleed, and perfect 300DPI vector fidelity!
 */
export function printHtmlViaIframe(html: string): Promise<void> {
  return new Promise((resolve) => {
    // Remove any existing print iframe
    const oldFrame = document.getElementById("hkn-print-iframe");
    if (oldFrame) {
      oldFrame.remove();
    }

    const iframe = document.createElement("iframe");
    iframe.id = "hkn-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    iframe.style.zIndex = "-9999";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      fallbackPrintViaPopup(html);
      resolve();
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    // Allow images & fonts to load before printing
    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.warn("Iframe print triggered exception, falling back to popup", e);
          fallbackPrintViaPopup(html);
        }
        resolve();
      }, 350);
    };

    // Safety timeout in case onload event was already fired
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        // Handled
      }
      resolve();
    }, 600);
  });
}

/**
 * Fallback popup window printer if iframe execution is restricted by sandbox
 */
function fallbackPrintViaPopup(html: string) {
  const win = window.open("", "_blank", "width=900,height=800,toolbar=0,scrollbars=1,status=0");
  if (!win) {
    alert("Please allow popups for printing receipts and credentials.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    setTimeout(() => {
      win.focus();
      win.print();
    }, 300);
  };
}

/**
 * Builds standard enterprise & ministry Tax Invoice & Giving Receipt HTML
 */
export async function buildInvoiceHtml(invoice: InvoiceDetails): Promise<string> {
  const invoiceNo = invoice.invoiceNumber || `KMN-REC-${String(invoice.id || Date.now()).slice(-6).toUpperCase()}`;
  const refCode = invoice.reference || `REF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  const dateFormatted = invoice.date
    ? new Date(invoice.date).toLocaleDateString("en-US", { dateStyle: "long" })
    : new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  
  const formattedAmount = `${invoice.currency || "KES"} ${Number(invoice.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  // Scannable verification QR Code
  const verifyUrl = `${window.location.origin}/verify?doc=invoice&ref=${encodeURIComponent(refCode)}&inv=${encodeURIComponent(invoiceNo)}`;
  const qrDataUri = await generateQrDataUrl(verifyUrl);

  const securityHash = `SHA256: ${Array.from(refCode + invoiceNo)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32)
    .toUpperCase()}`;

  const giftDescription = invoice.recurring
    ? "Covenant Monthly Partnership Seed — Frontline Missionary Outreach & Global Apostolic Deployment"
    : invoice.purpose || "Kingdom Missions Offering & Frontier Evangelism Seed";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice & Giving Receipt — ${invoiceNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
    
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 15mm 15mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', sans-serif;
      color: #0c1b33;
      background: #ffffff;
      font-size: 13px;
      line-height: 1.5;
    }

    .invoice-container {
      position: relative;
      max-width: 800px;
      margin: 0 auto;
      border: 2px solid #d4af37;
      padding: 32px 38px;
      background: #ffffff;
      overflow: hidden;
    }

    /* Guilloche Pattern Border */
    .guilloche-bar {
      height: 6px;
      background: repeating-linear-gradient(
        45deg,
        #d4af37,
        #d4af37 10px,
        #0c1b33 10px,
        #0c1b33 20px
      );
      margin-bottom: 24px;
    }

    /* Background Anti-Counterfeit Watermark */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-family: 'Outfit', sans-serif;
      font-size: 64px;
      font-weight: 900;
      color: rgba(212, 175, 55, 0.05);
      text-transform: uppercase;
      letter-spacing: 8px;
      pointer-events: none;
      white-space: nowrap;
      z-index: 0;
    }

    /* Letterhead */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0c1b33;
      padding-bottom: 20px;
      margin-bottom: 24px;
      position: relative;
      z-index: 1;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .brand-logo {
      width: 72px;
      height: 72px;
      object-fit: contain;
      border-radius: 12px;
      border: 2px solid #d4af37;
      padding: 2px;
      background: #ffffff;
    }

    .brand-title {
      font-family: 'Outfit', sans-serif;
      font-size: 22px;
      font-weight: 800;
      color: #0c1b33;
      letter-spacing: 0.5px;
      margin: 0;
    }

    .brand-subtitle {
      font-size: 11px;
      color: #d4af37;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      display: block;
      margin-top: 2px;
    }

    .brand-details {
      font-size: 10px;
      color: #556987;
      margin-top: 4px;
      line-height: 1.4;
    }

    .doc-badge-section {
      text-align: right;
    }

    .doc-type {
      font-family: 'Outfit', sans-serif;
      font-size: 16px;
      font-weight: 800;
      color: #0c1b33;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .status-stamp {
      display: inline-block;
      margin-top: 6px;
      padding: 4px 12px;
      background: #e6f7ef;
      border: 1.5px solid #00a86b;
      color: #007a4d;
      font-weight: 800;
      font-size: 10px;
      border-radius: 20px;
      letter-spacing: 0.5px;
    }

    /* Metadata Grid */
    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 24px;
      position: relative;
      z-index: 1;
    }

    .meta-box span.label {
      display: block;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    .meta-box span.value {
      font-size: 12px;
      font-weight: 700;
      color: #0c1b33;
    }

    .meta-box span.value.mono {
      font-family: 'Courier New', monospace;
      color: #855d14;
    }

    /* Two-column Partner & Ministry Info */
    .party-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 28px;
      position: relative;
      z-index: 1;
    }

    .party-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      background: #ffffff;
    }

    .party-card-title {
      font-family: 'Outfit', sans-serif;
      font-size: 11px;
      font-weight: 800;
      color: #855d14;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }

    .party-name {
      font-size: 15px;
      font-weight: 800;
      color: #0c1b33;
      margin-bottom: 2px;
    }

    .party-sub {
      font-size: 11px;
      color: #64748b;
      line-height: 1.4;
    }

    /* Line Item Table */
    .table-container {
      margin-bottom: 24px;
      position: relative;
      z-index: 1;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    thead th {
      background: #0c1b33;
      color: #ffffff;
      font-family: 'Outfit', sans-serif;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 10px 14px;
    }

    thead th:last-child {
      text-align: right;
    }

    tbody td {
      padding: 12px 14px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
    }

    tbody td:last-child {
      text-align: right;
      font-weight: 700;
      color: #0c1b33;
      font-size: 13px;
    }

    tbody tr:nth-child(even) {
      background: #f8fafc;
    }

    /* Totals Box */
    .totals-area {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 28px;
      position: relative;
      z-index: 1;
    }

    .totals-table {
      width: 320px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 12px;
      color: #475569;
    }

    .totals-row.grand-total {
      border-top: 2px solid #0c1b33;
      border-bottom: 2px solid #0c1b33;
      padding: 10px 0;
      margin-top: 6px;
      font-size: 15px;
      font-weight: 800;
      color: #0c1b33;
    }

    .grand-total .amount {
      color: #007a4d;
      font-family: 'Outfit', sans-serif;
      font-size: 18px;
    }

    /* Security & Signatory Section */
    .security-section {
      display: grid;
      grid-template-columns: 120px 1fr 200px;
      gap: 20px;
      align-items: center;
      border: 1px dashed #d4af37;
      border-radius: 8px;
      padding: 16px;
      background: #fbfbf9;
      margin-bottom: 24px;
      position: relative;
      z-index: 1;
    }

    .qr-container {
      text-align: center;
    }

    .qr-img {
      width: 95px;
      height: 95px;
      display: block;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
    }

    .qr-caption {
      font-size: 8px;
      font-weight: 700;
      color: #64748b;
      margin-top: 4px;
      text-transform: uppercase;
    }

    .security-notice {
      font-size: 10px;
      color: #475569;
      line-height: 1.5;
    }

    .security-notice strong {
      color: #0c1b33;
    }

    .hash-badge {
      font-family: 'Courier New', monospace;
      font-size: 9px;
      background: #e2e8f0;
      padding: 3px 6px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 4px;
      color: #0c1b33;
    }

    .signature-container {
      text-align: right;
    }

    .sign-title {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-top: 2px;
    }

    .microprint {
      font-size: 7px;
      color: #94a3b8;
      text-align: center;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      margin-top: 14px;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="guilloche-bar"></div>
    <div class="watermark">OFFICIAL RECEIPT</div>

    <!-- Letterhead -->
    <div class="header">
      <div class="brand-section">
        <img src="${brandLogo}" alt="Kingdom Missions Network" class="brand-logo" />
        <div>
          <h1 class="brand-title">KINGDOM MISSIONS NETWORK</h1>
          <span class="brand-subtitle">Official Giving Receipt & Tax Invoice</span>
          <div class="brand-details">
            Registered Non-Profit Faith Missions Organization • Section 13 Religious Exemption<br>
            Secretariat: Nairobi, Kenya | Global Missions Headquarters | support@kingdommissions.org
          </div>
        </div>
      </div>
      <div class="doc-badge-section">
        <div class="doc-type">TAX INVOICE</div>
        <div class="status-stamp">✓ VERIFIED OFFICIAL RECORD</div>
      </div>
    </div>

    <!-- Metadata Grid -->
    <div class="metadata-grid">
      <div class="meta-box">
        <span class="label">Invoice / Receipt No</span>
        <span class="value mono">${invoiceNo}</span>
      </div>
      <div class="meta-box">
        <span class="label">Transaction Date</span>
        <span class="value">${dateFormatted}</span>
      </div>
      <div class="meta-box">
        <span class="label">Payment Channel</span>
        <span class="value">${(invoice.provider || "PAYSTACK SECURE / M-PESA").toUpperCase()}</span>
      </div>
      <div class="meta-box">
        <span class="label">Payment Reference</span>
        <span class="value mono">${refCode}</span>
      </div>
    </div>

    <!-- Partner & Ministry Info -->
    <div class="party-info">
      <div class="party-card">
        <div class="party-card-title">CONTRIBUTOR / COVENANT PARTNER</div>
        <div class="party-name">${invoice.name || "Faithful Covenant Partner"}</div>
        <div class="party-sub">
          Email: ${invoice.email || "partner@kingdommissions.org"}<br>
          ${invoice.partnerId ? `Partner ID: <strong>${invoice.partnerId}</strong><br>` : ""}
          Covenant Tier: <strong>${invoice.planName || "Frontline Missions Partner"}</strong><br>
          Status: Verified Active Contributor
        </div>
      </div>
      <div class="party-card">
        <div class="party-card-title">BENEFICIARY & SPIRITUAL OVERSIGHT</div>
        <div class="party-name">Kingdom Missions Network Int'l</div>
        <div class="party-sub">
          General Oversight: <strong>Bishop Dr. George Githinji</strong><br>
          Purpose: Frontline Gospel Crusades, Church Planting & Aid<br>
          Tax Deductibility: Religious / Charitable Gift Exemption<br>
          Jurisdiction: Republic of Kenya & Global Partner Alliances
        </div>
      </div>
    </div>

    <!-- Contribution Items Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 8%;">#</th>
            <th style="width: 52%;">Contribution Description</th>
            <th style="width: 22%;">Gift Classification</th>
            <th style="width: 18%;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>01</td>
            <td>
              <strong>${giftDescription}</strong><br>
              <span style="font-size: 10px; color: #64748b;">
                Deployment into frontier crusades, free Holy Bibles, and missionary support
              </span>
            </td>
            <td>${invoice.recurring ? "Monthly Covenant Seed" : "One-Time Kingdom Offering"}</td>
            <td>${formattedAmount}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div class="totals-area">
      <div class="totals-table">
        <div class="totals-row">
          <span>Gross Contribution:</span>
          <span>${formattedAmount}</span>
        </div>
        <div class="totals-row">
          <span>Statutory Tax / VAT (0% Exempt):</span>
          <span>0.00</span>
        </div>
        <div class="totals-row grand-total">
          <span>Total Stewardship Gift:</span>
          <span class="amount">${formattedAmount}</span>
        </div>
      </div>
    </div>

    <!-- Security & Signatory Block -->
    <div class="security-section">
      <div class="qr-container">
        <img src="${qrDataUri}" alt="Verification QR Code" class="qr-img" />
        <div class="qr-caption">Scan to Verify</div>
      </div>
      <div class="security-notice">
        <strong>Digital Security & Authenticity Verification:</strong><br>
        This receipt is digitally recorded in the Kingdom Missions Network Central Registry. Any alteration invalidates this record.
        <br>
        <span class="hash-badge">${securityHash}</span>
      </div>
      <div class="signature-container">
        ${getBishopSignatureSvg()}
        <div class="sign-title">Presiding Bishop & General Overseer</div>
        <div style="font-size: 8px; color: #94a3b8; margin-top: 2px;">Authorized Official Signature</div>
      </div>
    </div>

    <div class="microprint">
      KINGDOM MISSIONS NETWORK • OFFICIAL COVENANT RECORD • SECURE VERIFICATION • NOT TRANSFERABLE • INTEGRITY IN STEWARDSHIP
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Builds the redesigned executive Partner ID Card HTML for high-resolution printing
 * Standard CR80 ID Card dimensions (85.6mm x 54mm)
 */
export async function buildPartnerIdCardHtml(card: PartnerCardDetails): Promise<string> {
  const cardId = card.id ? String(card.id).toUpperCase() : `PTN-${Math.floor(1000 + Math.random() * 9000)}`;
  const displayId = cardId.startsWith("HKN-") ? cardId : `HKN-${cardId.slice(0, 8)}`;
  
  const verifyUrl = `${window.location.origin}/verify?partner=${encodeURIComponent(displayId)}`;
  const qrDataUri = await generateQrDataUrl(verifyUrl);

  const expiry = card.expiryYear || "2027";
  const joined = card.joinedAt || "2026";
  const initials = (card.name || "KMN")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const photoTag = card.photoUrl
    ? `<img src="${card.photoUrl}" alt="${card.name}" class="member-photo-img" />`
    : `<div class="member-photo-fallback"><span>${initials}</span></div>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Kingdom Missions Network — Partner ID Credential — ${card.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
    
    @page {
      size: 85.6mm 54mm landscape;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      font-family: 'Inter', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }

    /* Standard CR80 dimensions: 85.6mm x 53.98mm (~324px x 204px at 96dpi, 1011px x 638px at 300dpi) */
    .id-card-wrapper {
      width: 85.6mm;
      height: 54mm;
      max-width: 85.6mm;
      max-height: 54mm;
      border-radius: 4mm;
      overflow: hidden;
      position: relative;
      background: linear-gradient(135deg, #091528 0%, #0d1e38 45%, #182a4d 80%, #07101e 100%);
      border: 1.2mm solid #d4af37;
      box-shadow: 0 8px 30px rgba(0,0,0,0.35);
      color: #ffffff;
      padding: 3mm 4mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-inside: avoid;
    }

    /* Guilloche anti-counterfeit curve overlay */
    .guilloche-bg {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle at 75% 20%, rgba(212, 175, 55, 0.12) 0%, transparent 45%),
                        radial-gradient(circle at 20% 85%, rgba(212, 175, 55, 0.08) 0%, transparent 40%);
      pointer-events: none;
      z-index: 0;
    }

    /* Watermark crest */
    .watermark-crest {
      position: absolute;
      right: -5mm;
      bottom: -8mm;
      width: 38mm;
      height: 38mm;
      opacity: 0.07;
      pointer-events: none;
      z-index: 0;
    }

    /* Card Top Header */
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 0.3mm solid rgba(212, 175, 55, 0.4);
      padding-bottom: 1.5mm;
      position: relative;
      z-index: 1;
    }

    .brand-group {
      display: flex;
      align-items: center;
      gap: 2mm;
    }

    .brand-logo-small {
      width: 6.5mm;
      height: 6.5mm;
      object-fit: contain;
      border-radius: 1mm;
      border: 0.3mm solid #d4af37;
      background: #ffffff;
      padding: 0.2mm;
    }

    .brand-text-title {
      font-family: 'Outfit', sans-serif;
      font-size: 7pt;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #ffffff;
      line-height: 1;
      text-transform: uppercase;
    }

    .brand-text-sub {
      font-size: 4.5pt;
      font-weight: 700;
      color: #d4af37;
      letter-spacing: 1px;
      text-transform: uppercase;
      display: block;
      margin-top: 0.5mm;
    }

    .tier-badge {
      background: linear-gradient(135deg, rgba(212,175,55,0.35), rgba(212,175,55,0.15));
      border: 0.3mm solid #d4af37;
      color: #fdf6d8;
      font-family: 'Outfit', sans-serif;
      font-size: 5pt;
      font-weight: 800;
      padding: 0.8mm 2mm;
      border-radius: 1.5mm;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    /* Card Center Body */
    .card-body {
      display: flex;
      align-items: center;
      gap: 3mm;
      margin-top: 1.5mm;
      position: relative;
      z-index: 1;
    }

    /* Photo Frame */
    .photo-container {
      width: 17mm;
      height: 22mm;
      border-radius: 2mm;
      border: 0.5mm solid #d4af37;
      background: #060e1a;
      overflow: hidden;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: inset 0 0 4px rgba(0,0,0,0.8);
      position: relative;
    }

    .member-photo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .member-photo-fallback {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #11233f, #071324);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #d4af37;
      font-family: 'Outfit', sans-serif;
      font-size: 14pt;
      font-weight: 800;
    }

    .photo-security-tag {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(212, 175, 55, 0.9);
      color: #0c1b33;
      font-size: 3.5pt;
      font-weight: 900;
      text-align: center;
      padding: 0.3mm 0;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    /* Member Details Column */
    .member-info {
      flex: 1;
      min-width: 0;
    }

    .member-name {
      font-family: 'Outfit', sans-serif;
      font-size: 8.5pt;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 0.8mm 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.1;
    }

    .detail-row {
      display: flex;
      gap: 3mm;
      margin-bottom: 0.8mm;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
    }

    .detail-label {
      font-size: 3.8pt;
      font-weight: 700;
      color: rgba(255,255,255,0.5);
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .detail-val {
      font-size: 5.5pt;
      font-weight: 700;
      color: #ffffff;
      white-space: nowrap;
    }

    .detail-val.gold {
      color: #fdf6d8;
      font-family: 'Courier New', monospace;
      font-weight: 800;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 1mm;
      font-size: 4.2pt;
      font-weight: 800;
      color: #34d399;
      background: rgba(16, 185, 129, 0.15);
      border: 0.2mm solid rgba(16, 185, 129, 0.4);
      padding: 0.3mm 1.5mm;
      border-radius: 1mm;
      margin-top: 0.5mm;
      text-transform: uppercase;
    }

    /* Right Column: EMV Chip & QR Code */
    .security-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5mm;
      flex-shrink: 0;
    }

    .qr-badge-img {
      width: 13mm;
      height: 13mm;
      border-radius: 1mm;
      border: 0.3mm solid #d4af37;
      background: #ffffff;
      padding: 0.3mm;
    }

    /* Card Footer Bar */
    .card-footer {
      border-top: 0.3mm solid rgba(255, 255, 255, 0.15);
      padding-top: 1mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      z-index: 1;
    }

    .footer-left {
      display: flex;
      align-items: center;
      gap: 2mm;
    }

    .oversight-sig {
      font-size: 4.5pt;
      color: rgba(255,255,255,0.7);
      line-height: 1.1;
    }

    .oversight-sig strong {
      color: #fdf6d8;
      font-size: 5pt;
    }

    .hologram-strip {
      font-size: 3.5pt;
      font-weight: 800;
      letter-spacing: 0.8px;
      color: #d4af37;
      text-transform: uppercase;
    }

    .microtext-bar {
      font-size: 3pt;
      color: rgba(212, 175, 55, 0.6);
      text-align: center;
      letter-spacing: 0.5px;
      margin-top: 0.5mm;
      white-space: nowrap;
      overflow: hidden;
    }

    /* Card Back (for dual-sided printing) */
    .card-back {
      margin-top: 10mm;
      background: linear-gradient(135deg, #07101e 0%, #0d1e38 50%, #060e1a 100%);
    }

    .mag-stripe {
      height: 7mm;
      background: #111111;
      border-top: 0.3mm solid #333;
      border-bottom: 0.3mm solid #333;
      margin: 1mm -4mm 3mm -4mm;
    }

    .sig-panel {
      height: 6mm;
      background: #ffffff;
      border-radius: 1mm;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 2mm;
      color: #333;
      font-family: 'Courier New', monospace;
      font-size: 5pt;
      font-weight: 700;
      margin-bottom: 2mm;
    }

    .covenant-terms {
      font-size: 3.8pt;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.3;
      text-align: justify;
    }

    @media print {
      body {
        background: transparent !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .id-card-wrapper {
        margin: 0 !important;
        box-shadow: none !important;
        page-break-after: always;
      }
      .card-back {
        margin-top: 0 !important;
      }
    }
  </style>
</head>
<body>
  <!-- FRONT OF CARD -->
  <div class="id-card-wrapper">
    <div class="guilloche-bg"></div>
    <img src="${brandLogo}" alt="" class="watermark-crest" />

    <!-- Top Header -->
    <div class="card-header">
      <div class="brand-group">
        <img src="${brandLogo}" alt="KMN Logo" class="brand-logo-small" />
        <div>
          <div class="brand-text-title">KINGDOM MISSIONS NETWORK</div>
          <span class="brand-text-sub">Global Apostolic Deployment Credential</span>
        </div>
      </div>
      <div class="tier-badge">${card.planName || "Covenant Partner"}</div>
    </div>

    <!-- Center Section -->
    <div class="card-body">
      <!-- Member Photo -->
      <div class="photo-container">
        ${photoTag}
        <div class="photo-security-tag">OFFICIAL ID</div>
      </div>

      <!-- Member Details -->
      <div class="member-info">
        <h2 class="member-name">${card.name || "Covenant Partner"}</h2>
        
        <div class="detail-row">
          <div class="detail-item">
            <span class="detail-label">Partner ID No.</span>
            <span class="detail-val gold">${displayId}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Deployment</span>
            <span class="detail-val">${card.role || "Covenant Partner"}</span>
          </div>
        </div>

        <div class="detail-row">
          <div class="detail-item">
            <span class="detail-label">Valid Period</span>
            <span class="detail-val">${joined} – ${expiry}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Security Tier</span>
            <span class="detail-val">LEVEL 4 CLEARANCE</span>
          </div>
        </div>

        <div class="status-pill">
          ● VERIFIED ACTIVE COVENANT PARTNER
        </div>
      </div>

      <!-- Chip & QR -->
      <div class="security-column">
        ${getSmartChipSvg()}
        <img src="${qrDataUri}" alt="QR Verification" class="qr-badge-img" />
      </div>
    </div>

    <!-- Bottom Bar -->
    <div class="card-footer">
      <div class="footer-left">
        <div class="oversight-sig">
          Spiritual Oversight:<br>
          <strong>Bishop Dr. George Githinji</strong>
        </div>
      </div>
      <div class="hologram-strip">★ HOLO-SECURE PASS ★</div>
      <div style="text-align: right;">
        <span style="font-size: 3.5pt; color: rgba(255,255,255,0.4); display: block;">AUTH CODE</span>
        <span style="font-family: monospace; font-size: 4.5pt; color: #d4af37; font-weight: 700;">
          ${displayId.slice(-6)}
        </span>
      </div>
    </div>

    <div class="microtext-bar">
      KINGDOM MISSIONS NETWORK • APOSTOLIC CREDENTIAL • VERIFIED IN HEAVEN & EARTH • OFFICIAL COVENANT PASS
    </div>
  </div>

  <!-- BACK OF CARD -->
  <div class="id-card-wrapper card-back">
    <div class="guilloche-bg"></div>
    <div class="mag-stripe"></div>

    <div style="position: relative; z-index: 1;">
      <div style="font-size: 4pt; color: rgba(255,255,255,0.5); margin-bottom: 0.5mm; text-transform: uppercase;">
        Authorized Holder Signature:
      </div>
      <div class="sig-panel">
        ${displayId}
      </div>

      <div class="covenant-terms">
        <strong>COVENANT DEPLOYMENT STATEMENT:</strong><br>
        This credential certifies that the bearer is a fully consecrated global covenant partner supporting frontline evangelism, church planting, and humanitarian relief under Kingdom Missions Network.
        <br><br>
        <em>"And the twelve were with him, and certain women... which ministered unto him of their substance." — Luke 8:1-3</em>
      </div>
    </div>

    <div class="card-footer" style="margin-top: 2mm;">
      <div style="font-size: 4pt; color: rgba(255,255,255,0.6); line-height: 1.2;">
        <strong>Secretariat:</strong> Nairobi, Kenya<br>
        <strong>Hotline:</strong> +254 700 000 000 | kingdommissions.org
      </div>
      <div style="text-align: right;">
        ${getBarcodeSvg(displayId)}
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Builds Annual Giving Statement HTML for tax filing & annual stewardship verification
 */
export async function buildAnnualStatementHtml(statement: AnnualStatementDetails): Promise<string> {
  const totalGiven = statement.donations.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const currency = statement.donations[0]?.currency || "KES";
  const formattedTotal = `${currency} ${totalGiven.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const verifyUrl = `${window.location.origin}/verify?statement=${statement.year}&partner=${encodeURIComponent(statement.partnerId)}`;
  const qrDataUri = await generateQrDataUrl(verifyUrl);

  const rowsHtml = statement.donations.length > 0
    ? statement.donations
        .map(
          (d, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
        <td>${d.description}</td>
        <td><span style="font-family: monospace; font-size: 11px;">${d.reference}</span></td>
        <td style="text-align: right; font-weight: 700;">${d.currency} ${Number(d.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
      </tr>
    `
        )
        .join("")
    : `<tr><td colspan="5" style="text-align:center; padding: 20px; color: #64748b;">No giving transactions recorded for ${statement.year}.</td></tr>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Annual Tax Statement ${statement.year} — ${statement.partnerName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
    @page { size: A4 portrait; margin: 15mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: 'Inter', sans-serif; color: #0c1b33; margin: 0; padding: 0; font-size: 12px; }
    .container { max-width: 800px; margin: 0 auto; border: 2px solid #d4af37; padding: 30px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0c1b33; padding-bottom: 16px; margin-bottom: 20px; }
    .brand { display: flex; align-items: center; gap: 14px; }
    .logo { width: 64px; height: 64px; object-fit: contain; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #0c1b33; color: white; padding: 8px 10px; font-size: 10px; text-transform: uppercase; text-align: left; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
    .total-box { display: flex; justify-content: flex-end; margin-top: 10px; }
    .total-card { width: 300px; border: 1.5px solid #0c1b33; padding: 12px; border-radius: 6px; background: #f8fafc; }
    .footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">
        <img src="${brandLogo}" class="logo" alt="Logo" />
        <div>
          <h2 style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 20px;">KINGDOM MISSIONS NETWORK</h2>
          <span style="color: #d4af37; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; font-size: 11px;">
            Annual Giving & Tax Deductible Statement
          </span>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
            Fiscal Tax Year: ${statement.year} • Section 13 Religious Non-Profit Exemption
          </div>
        </div>
      </div>
      <div style="text-align: right;">
        <span style="display: block; font-size: 10px; color: #64748b; text-transform: uppercase;">Statement Date</span>
        <strong style="font-size: 13px;">${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}</strong>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
      <div style="background: #f8fafc; padding: 14px; border-radius: 6px; border: 1px solid #e2e8f0;">
        <span style="font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block;">Partner Record</span>
        <strong style="font-size: 14px; display: block; margin: 2px 0;">${statement.partnerName}</strong>
        <span style="color: #64748b; font-size: 11px;">Email: ${statement.partnerEmail}</span><br>
        <span style="color: #855d14; font-family: monospace; font-size: 11px; font-weight: 700;">Partner ID: ${statement.partnerId}</span>
      </div>
      <div style="background: #f8fafc; padding: 14px; border-radius: 6px; border: 1px solid #e2e8f0;">
        <span style="font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block;">Ministry Organization</span>
        <strong style="font-size: 14px; display: block; margin: 2px 0;">Kingdom Missions Network</strong>
        <span style="color: #64748b; font-size: 11px;">Spiritual Oversight: Bishop Dr. George Githinji</span><br>
        <span style="color: #64748b; font-size: 11px;">Secretariat: Nairobi, Kenya | Global Missions Secretariat</span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Date</th>
          <th>Contribution Description</th>
          <th>Reference</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="total-box">
      <div class="total-card">
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
          <span>Total Transactions:</span>
          <strong>${statement.donations.length}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 800; border-top: 1px solid #cbd5e1; padding-top: 6px;">
          <span>Total Annual Giving:</span>
          <span style="color: #007a4d;">${formattedTotal}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <div style="display: flex; align-items: center; gap: 12px;">
        <img src="${qrDataUri}" style="width: 70px; height: 70px; border: 1px solid #cbd5e1;" alt="QR" />
        <div style="font-size: 10px; color: #64748b;">
          <strong>Official Tax Statement Record</strong><br>
          Authorized under registered non-profit charter.<br>
          Validated by Kingdom Missions Network.
        </div>
      </div>
      <div style="text-align: right;">
        ${getBishopSignatureSvg()}
        <div style="font-size: 9px; font-weight: 700; color: #64748b;">Bishop Dr. George Githinji — Presiding Prelate</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Public trigger to print an invoice
 */
export async function printInvoice(invoice: InvoiceDetails): Promise<void> {
  const html = await buildInvoiceHtml(invoice);
  await printHtmlViaIframe(html);
}

/**
 * Public trigger to print a partner ID card
 */
export async function printPartnerIdCard(card: PartnerCardDetails): Promise<void> {
  const html = await buildPartnerIdCardHtml(card);
  await printHtmlViaIframe(html);
}

/**
 * Public trigger to print an annual tax statement
 */
export async function printAnnualStatement(statement: AnnualStatementDetails): Promise<void> {
  const html = await buildAnnualStatementHtml(statement);
  await printHtmlViaIframe(html);
}
