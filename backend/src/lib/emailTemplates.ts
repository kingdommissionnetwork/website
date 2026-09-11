/**
 * Kingdom Missions Network — Centralized Branded Email Template Library
 * All system emails use the official KMN logo and brand identity.
 * Logo URL: https://kingdommissionsnetwork.org/logo.png
 */

const LOGO_URL = "https://kingdommissionsnetwork.org/logo.png";
const BRAND_COLOR = "#d4af37";
const BRAND_DARK = "#0c1b33";
const BRAND_NAME = "Kingdom Missions Network";
const DOMAIN = "https://kingdommissionsnetwork.org";
const SUPPORT_EMAIL = "support@kingdommissionsnetwork.org";

function escapeHtml(input: unknown): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function brandedWrapper(bodyHtml: string, previewText = ""): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${BRAND_NAME}</title>
  <style>
    body{margin:0;padding:0;background-color:#f5f0e8;font-family:'Georgia','Times New Roman',serif;}
    table{border-collapse:collapse;}
    img{display:block;max-width:100%;}
    a{color:${BRAND_COLOR};text-decoration:none;}
    .preheader{display:none!important;visibility:hidden;font-size:1px;color:#fff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;}
  </style>
</head>
<body>
  ${previewText ? `<div class="preheader">${previewText}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0e8;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,${BRAND_DARK} 0%,#1a2d4d 100%);padding:32px 40px;text-align:center;">
            <img src="${LOGO_URL}" alt="${BRAND_NAME} Logo" width="80" height="80" style="width:80px;height:80px;border-radius:50%;border:3px solid ${BRAND_COLOR};object-fit:contain;margin:0 auto 16px;" />
            <p style="margin:0;font-family:'Georgia',serif;font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:0.05em;">${BRAND_NAME}</p>
            <p style="margin:4px 0 0;font-size:11px;color:${BRAND_COLOR};text-transform:uppercase;letter-spacing:0.2em;font-family:Arial,sans-serif;">GLOBAL CHRISTIAN COMMUNITY</p>
          </td>
        </tr>
        <tr><td style="background:${BRAND_COLOR};height:3px;"></td></tr>
        <tr>
          <td style="padding:40px 40px 32px;color:#1a1a1a;font-family:'Georgia',serif;font-size:16px;line-height:1.7;">
            ${bodyHtml}
          </td>
        </tr>
        <tr><td style="background:${BRAND_COLOR};height:1px;"></td></tr>
        <tr>
          <td style="background:#f9f5ec;padding:24px 40px;text-align:center;">
            <img src="${LOGO_URL}" alt="${BRAND_NAME}" width="40" height="40" style="width:40px;height:40px;border-radius:50%;margin:0 auto 12px;object-fit:contain;" />
            <p style="margin:0 0 8px;font-size:13px;font-weight:bold;color:${BRAND_DARK};font-family:Arial,sans-serif;">${BRAND_NAME}</p>
            <p style="margin:0 0 4px;font-size:11px;color:#888;font-family:Arial,sans-serif;">Uniting believers worldwide through prayer, scripture, and fellowship</p>
            <p style="margin:0;font-size:11px;color:#aaa;font-family:Arial,sans-serif;">
              <a href="${DOMAIN}" style="color:${BRAND_COLOR};">${DOMAIN.replace("https://","")}</a> &nbsp;·&nbsp;
              <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_COLOR};">${SUPPORT_EMAIL}</a>
            </p>
            <p style="margin:12px 0 0;font-size:10px;color:#ccc;font-family:Arial,sans-serif;">© ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function donationReceiptEmail(params: { name: string; amount: number; currency: string; reference?: string; planName?: string; date?: string }): { subject: string; html: string } {
  const { name, amount, currency, reference, planName, date } = params;
  const safeName = escapeHtml(name) || "Anonymous Partner";
  const safeCurrency = escapeHtml(currency);
  const safePlan = planName ? escapeHtml(planName) : "";
  const safeRef = escapeHtml(reference || `KMN-${Date.now().toString(36).toUpperCase()}`);
  const formattedAmount = `${safeCurrency} ${Number(amount).toLocaleString("en-KE",{minimumFractionDigits:2})}`;
  const receiptDate = escapeHtml(date || new Date().toLocaleDateString("en-KE",{dateStyle:"long"}));
  const refNum = safeRef;
  const body = `
    <h2 style="margin:0 0 8px;font-size:24px;color:${BRAND_DARK};">Thank You for Your Gift! 🙏</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#555;font-family:Arial,sans-serif;">Your generosity is transforming lives and advancing God's Kingdom across nations.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5ec;border-radius:12px;border:1px solid #e8dfc5;margin-bottom:24px;">
      <tr><td style="padding:24px;">
        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;color:#888;font-family:Arial,sans-serif;letter-spacing:0.1em;">OFFICIAL DONATION RECEIPT</p>
        <p style="margin:0 0 20px;font-size:28px;font-weight:bold;color:${BRAND_COLOR};">${formattedAmount}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:13px;color:#444;">
          <tr><td style="padding:6px 0;border-bottom:1px solid #e8dfc5;width:40%;"><strong>Donor Name</strong></td><td style="padding:6px 0;border-bottom:1px solid #e8dfc5;">${safeName}</td></tr>
          ${safePlan?`<tr><td style="padding:6px 0;border-bottom:1px solid #e8dfc5;"><strong>Partnership Tier</strong></td><td style="padding:6px 0;border-bottom:1px solid #e8dfc5;">${safePlan}</td></tr>`:""}
          <tr><td style="padding:6px 0;border-bottom:1px solid #e8dfc5;"><strong>Receipt No.</strong></td><td style="padding:6px 0;border-bottom:1px solid #e8dfc5;font-family:monospace;">${refNum}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Date</strong></td><td style="padding:6px 0;">${receiptDate}</td></tr>
        </table>
      </td></tr>
    </table>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#555;line-height:1.6;">Hi <strong>${safeName}</strong>, your giving is sowing into the harvest fields of God's Kingdom.</p>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#888;margin-top:16px;">📖 <em>"Give, and it will be given to you..."</em> — Luke 6:38</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr><td style="background:${BRAND_COLOR};border-radius:8px;padding:14px 28px;">
        <a href="${DOMAIN}/donations" style="color:${BRAND_DARK};font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;">View Giving History →</a>
      </td></tr>
    </table>`;
  return { subject: `Donation Receipt — ${formattedAmount} | ${BRAND_NAME}`, html: brandedWrapper(body, `Your donation of ${formattedAmount} has been received.`) };
}

export function eventRsvpEmail(params: { name: string; eventTitle: string; eventDate?: string; eventLocation?: string; eventDescription?: string }): { subject: string; html: string } {
  const { name, eventTitle, eventDate, eventLocation, eventDescription } = params;
  const safeName = escapeHtml(name);
  const safeTitle = escapeHtml(eventTitle);
  const safeDate = eventDate ? escapeHtml(eventDate) : "";
  const safeLocation = eventLocation ? escapeHtml(eventLocation) : "";
  const safeDesc = eventDescription ? escapeHtml(eventDescription) : "";
  const body = `
    <h2 style="margin:0 0 8px;font-size:24px;color:${BRAND_DARK};">RSVP Confirmed! 🎉</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#555;font-family:Arial,sans-serif;">We're excited to have you join us. Here are your event details:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,${BRAND_DARK} 0%,#1a2d4d 100%);border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:28px;">
        <img src="${LOGO_URL}" alt="${BRAND_NAME}" width="48" height="48" style="width:48px;height:48px;border-radius:50%;border:2px solid ${BRAND_COLOR};margin-bottom:16px;object-fit:contain;" />
        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;color:${BRAND_COLOR};font-family:Arial,sans-serif;letter-spacing:0.15em;">EVENT RESERVATION</p>
        <p style="margin:0 0 16px;font-size:22px;font-weight:bold;color:#ffffff;">${safeTitle}</p>
        ${safeDate?`<p style="margin:0 0 8px;font-size:13px;color:#ccc;font-family:Arial,sans-serif;">📅 ${safeDate}</p>`:""}
        ${safeLocation?`<p style="margin:0 0 8px;font-size:13px;color:#ccc;font-family:Arial,sans-serif;">📍 ${safeLocation}</p>`:""}
        ${safeDesc?`<p style="margin:16px 0 0;font-size:13px;color:#aaa;font-family:Arial,sans-serif;line-height:1.5;">${safeDesc}</p>`:""}
      </td></tr>
    </table>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#555;">Hi <strong>${safeName}</strong>, your seat is reserved. We look forward to experiencing God's presence with you!</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr><td style="background:${BRAND_COLOR};border-radius:8px;padding:14px 28px;">
        <a href="${DOMAIN}/events" style="color:${BRAND_DARK};font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;">View All Events →</a>
      </td></tr>
    </table>`;
  return { subject: `RSVP Confirmed: ${safeTitle} | ${BRAND_NAME}`, html: brandedWrapper(body, `Your RSVP for ${safeTitle} is confirmed!`) };
}

export function adminInvitationEmail(params: { name: string; role: string; inviteLink: string; invitedBy?: string }): { subject: string; html: string } {
  const { name, role, inviteLink, invitedBy } = params;
  const safeName = escapeHtml(name);
  const safeRole = escapeHtml(role);
  const safeInviter = invitedBy ? escapeHtml(invitedBy) : "";
  // inviteLink is server-generated (fixed admin domain + random token); validate scheme before embedding.
  const safeLink = inviteLink.startsWith("https://admin.kingdommissionsnetwork.org/") ? inviteLink : "https://admin.kingdommissionsnetwork.org/";
  const roleLabel = escapeHtml(safeRole.replace(/_/g," ").replace(/\b\w/g,(l)=>l.toUpperCase()));
  const body = `
    <h2 style="margin:0 0 8px;font-size:24px;color:${BRAND_DARK};">Administrator Invitation 🛡️</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#555;font-family:Arial,sans-serif;">You have been provisioned with administrative access to the ${BRAND_NAME} Operations Platform.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_DARK};border-radius:12px;margin-bottom:24px;border:2px solid ${BRAND_COLOR};">
      <tr><td style="padding:28px;">
        <img src="${LOGO_URL}" alt="${BRAND_NAME}" width="56" height="56" style="width:56px;height:56px;border-radius:50%;border:2px solid ${BRAND_COLOR};margin-bottom:16px;object-fit:contain;" />
        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;color:${BRAND_COLOR};font-family:Arial,sans-serif;letter-spacing:0.15em;">ADMINISTRATIVE ROLE ASSIGNED</p>
        <p style="margin:0 0 4px;font-size:22px;font-weight:bold;color:#ffffff;">${safeName}</p>
        <p style="margin:0;font-size:14px;color:${BRAND_COLOR};font-family:Arial,sans-serif;">${roleLabel}</p>
        ${safeInviter?`<p style="margin:12px 0 0;font-size:12px;color:#888;font-family:Arial,sans-serif;">Provisioned by: ${safeInviter}</p>`:""}
      </td></tr>
    </table>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#555;line-height:1.6;">Hi <strong>${safeName}</strong>, click below to accept your invitation and configure Multi-Factor Authentication. This link expires in <strong>48 hours</strong>.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr><td style="background:${BRAND_COLOR};border-radius:8px;padding:14px 28px;">
        <a href="${safeLink}" style="color:${BRAND_DARK};font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;">Accept Invitation &amp; Activate Account →</a>
      </td></tr>
    </table>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#aaa;line-height:1.5;">All administrative sessions are audited and rate-limited for security governance.</p>
    <p style="font-family:monospace;font-size:11px;color:#ccc;word-break:break-all;">${safeLink}</p>`;
  return { subject: `You've been invited as ${roleLabel} — ${BRAND_NAME} Operations Portal`, html: brandedWrapper(body, `Accept your ${roleLabel} invitation.`) };
}

export function partnerWelcomeEmail(params: { name: string; planName: string; amount: number; currency: string; partnerId?: string }): { subject: string; html: string } {
  const { name, planName, amount, currency, partnerId } = params;
  const safeName = escapeHtml(name) || "Beloved Partner";
  const safePlan = escapeHtml(planName);
  const safeCurrency = escapeHtml(currency);
  const safePid = escapeHtml(partnerId || `KMN-${Date.now().toString(36).toUpperCase().slice(-8)}`);
  const formattedAmount = `${safeCurrency} ${Number(amount).toLocaleString("en-KE",{minimumFractionDigits:2})}`;
  const pid = safePid;
  const tierEmojis: Record<string,string> = {"Seed Partner":"🌱","Kingdom Ambassador":"🏅","Global Harvest Partner":"🌍","Covenant Pillar":"🏛️"};
  const emoji = tierEmojis[planName]||"👑";
  const body = `
    <h2 style="margin:0 0 8px;font-size:24px;color:${BRAND_DARK};">Welcome to the Kingdom Family! ${emoji}</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#555;font-family:Arial,sans-serif;">Your partnership is now active. Together, we advance God's Kingdom across nations.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,${BRAND_DARK} 0%,#1a2d4d 100%);border-radius:12px;margin-bottom:24px;border:2px solid ${BRAND_COLOR};">
      <tr><td style="padding:28px;">
        <img src="${LOGO_URL}" alt="${BRAND_NAME}" width="64" height="64" style="width:64px;height:64px;border-radius:50%;border:3px solid ${BRAND_COLOR};margin-bottom:16px;object-fit:contain;" />
        <p style="margin:0 0 4px;font-size:10px;text-transform:uppercase;color:${BRAND_COLOR};font-family:Arial,sans-serif;letter-spacing:0.2em;">KINGDOM PARTNER CREDENTIAL</p>
        <p style="margin:0 0 2px;font-size:22px;font-weight:bold;color:#ffffff;">${safeName}</p>
        <p style="margin:0 0 16px;font-size:14px;color:${BRAND_COLOR};font-family:Arial,sans-serif;">${safePlan} ${emoji}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:12px;color:#aaa;">
          <tr><td style="padding:4px 0;width:50%;color:#888;">Partner ID</td><td style="padding:4px 0;color:${BRAND_COLOR};font-family:monospace;font-size:13px;font-weight:bold;">${pid}</td></tr>
          <tr><td style="padding:4px 0;color:#888;">Monthly Gift</td><td style="padding:4px 0;color:#ffffff;font-weight:bold;">${formattedAmount}</td></tr>
          <tr><td style="padding:4px 0;color:#888;">Member Since</td><td style="padding:4px 0;">${new Date().toLocaleDateString("en-KE",{dateStyle:"long"})}</td></tr>
        </table>
      </td></tr>
    </table>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#555;line-height:1.6;">As a <strong>${safePlan}</strong>, you have access to exclusive content, prayer resources, and partner privileges.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr><td style="background:${BRAND_COLOR};border-radius:8px;padding:14px 28px;">
        <a href="${DOMAIN}/subscribe" style="color:${BRAND_DARK};font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;">Access Partner Portal →</a>
      </td></tr>
    </table>`;
  return { subject: `Welcome, ${safePlan}! Your Kingdom partnership is active — ${BRAND_NAME}`, html: brandedWrapper(body, `Your ${safePlan} membership is now active. Partner ID: ${pid}`) };
}

export function pastoralBroadcastEmail(params: { recipientName: string; subject: string; body: string; audience?: string; unsubscribeUrl?: string }): { subject: string; html: string } {

  const { recipientName, subject, body, audience, unsubscribeUrl } = params;
  const safeRecipient = escapeHtml(recipientName);
  const safeSubject = escapeHtml(subject);
  const safeAudience = audience ? escapeHtml(audience) : "";
  const safeBody = escapeHtml(body);
  const htmlBody = `
    <h2 style="margin:0 0 8px;font-size:24px;color:${BRAND_DARK};">📖 Pastoral Message</h2>
    ${safeAudience?`<p style="margin:0 0 20px;font-size:11px;text-transform:uppercase;color:${BRAND_COLOR};font-family:Arial,sans-serif;letter-spacing:0.1em;">${safeAudience}</p>`:""}
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#555;">Dear <strong>${safeRecipient}</strong>,</p>
    <div style="font-family:'Georgia',serif;font-size:15px;color:#333;line-height:1.8;white-space:pre-line;border-left:3px solid ${BRAND_COLOR};padding-left:16px;margin:16px 0;">${safeBody}</div>
    <p style="font-family:'Georgia',serif;font-size:14px;color:#888;margin-top:24px;">In His Service,<br /><strong>Bishop Dr. George Githinji</strong><br /><em>${BRAND_NAME}</em></p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr><td style="background:${BRAND_COLOR};border-radius:8px;padding:14px 28px;">
        <a href="${DOMAIN}/prayer-wall" style="color:${BRAND_DARK};font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;">Join the Prayer Wall →</a>
      </td></tr>
    </table>
    <p style="font-family:Arial,sans-serif;font-size:11px;color:#999;margin-top:24px;border-top:1px solid #eee;padding-top:12px;">You receive pastoral updates as a Kingdom Missions Network partner/member. <a href="${unsubscribeUrl ? escapeHtml(unsubscribeUrl) : `${DOMAIN}/unsubscribe`}" style="color:#999;text-decoration:underline;">Unsubscribe</a> · <a href="mailto:${SUPPORT_EMAIL}" style="color:#999;">${SUPPORT_EMAIL}</a></p>`;
  return { subject: `${safeSubject} | ${BRAND_NAME}`, html: brandedWrapper(htmlBody, safeSubject) };
}

export function claimOtpEmail(params: { name: string; code: string }): { subject: string; html: string } {
  const { name, code } = params;
  const safeName = escapeHtml(name) || "Beloved Partner";
  const safeCode = escapeHtml(code).replace(/[^0-9]/g, "").slice(0, 12);
  const spaced = escapeHtml(safeCode.split("").join(" "));
  const body = `
    <h2 style="margin:0 0 8px;font-size:24px;color:${BRAND_DARK};">Secure Your Partner Hub 🔐</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#555;font-family:Arial,sans-serif;">Hi <strong>${safeName}</strong>, use this one-time code to claim your Covenant Partner Hub. It expires in <strong>10 minutes</strong>.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_DARK};border-radius:12px;margin-bottom:24px;border:2px solid ${BRAND_COLOR};">
      <tr><td style="padding:28px;text-align:center;">
        <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;color:${BRAND_COLOR};font-family:Arial,sans-serif;letter-spacing:0.2em;">VERIFICATION CODE</p>
        <p style="margin:0;font-size:36px;font-weight:bold;color:#ffffff;font-family:monospace;letter-spacing:0.3em;">${spaced}</p>
      </td></tr>
    </table>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#888;line-height:1.6;">If you did not make a gift or partnership payment, please ignore this email or contact <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_COLOR};">${SUPPORT_EMAIL}</a>.</p>`;
  return { subject: `Your Partner Hub verification code — ${BRAND_NAME}`, html: brandedWrapper(body, `Your verification code is ${safeCode}.`) };
}

export function dunningReminderEmail(params: {
  name: string;
  planName: string;
  amount: number;
  currency: string;
  renewLink: string;
  attemptNo: number;
  nextRetryDate?: string;
}): { subject: string; html: string } {
  const { name, planName, amount, currency, renewLink, attemptNo, nextRetryDate } = params;
  const safeName = escapeHtml(name) || "Beloved Partner";
  const safePlan = escapeHtml(planName);
  const safeCurrency = escapeHtml(currency);
  const safeRetry = escapeHtml(nextRetryDate || "");
  // renewLink is server-generated (/subscribe?...); only allow relative or our domain.
  const safeLink = renewLink.startsWith("/") || renewLink.startsWith("https://kingdommissionsnetwork.org") ? renewLink : "https://kingdommissionsnetwork.org/subscribe?step=checkout";
  const formattedAmount = `${safeCurrency} ${Number(amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
  const body = `
    <h2 style="margin:0 0 8px;font-size:24px;color:${BRAND_DARK};">Your Covenant Seed Needs Attention 🌱</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#555;font-family:Arial,sans-serif;">Hi <strong>${safeName}</strong>, we could not collect your <strong>${safePlan}</strong> seed of <strong>${formattedAmount}</strong> (attempt ${Number(attemptNo) || 1} of 3). Your partnership stays in grace — no action on your giving history is needed beyond renewing.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr><td style="background:${BRAND_COLOR};border-radius:8px;padding:14px 28px;">
        <a href="${safeLink}" style="color:${BRAND_DARK};font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;">Renew My Partnership →</a>
      </td></tr>
    </table>
    ${safeRetry ? `<p style="font-family:Arial,sans-serif;font-size:12px;color:#888;">We will gently retry on <strong>${safeRetry}</strong>. You can also renew anytime with M-Pesa STK, card, or Paybill.</p>` : `<p style="font-family:Arial,sans-serif;font-size:12px;color:#888;">This was our final automatic retry — renew anytime to restore full Partner Hub access.</p>`}
    <p style="font-family:monospace;font-size:11px;color:#ccc;word-break:break-all;">${safeLink}</p>`;
  return { subject: `Action needed: renew your ${safePlan} seed — ${BRAND_NAME}`, html: brandedWrapper(body, `Renew your ${safePlan} seed of ${formattedAmount}.`) };
}
