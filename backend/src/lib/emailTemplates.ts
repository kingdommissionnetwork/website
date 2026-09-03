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
  const formattedAmount = `${currency} ${Number(amount).toLocaleString("en-KE",{minimumFractionDigits:2})}`;
  const receiptDate = date || new Date().toLocaleDateString("en-KE",{dateStyle:"long"});
  const refNum = reference || `KMN-${Date.now().toString(36).toUpperCase()}`;
  const body = `
    <h2 style="margin:0 0 8px;font-size:24px;color:${BRAND_DARK};">Thank You for Your Gift! 🙏</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#555;font-family:Arial,sans-serif;">Your generosity is transforming lives and advancing God's Kingdom across nations.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5ec;border-radius:12px;border:1px solid #e8dfc5;margin-bottom:24px;">
      <tr><td style="padding:24px;">
        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;color:#888;font-family:Arial,sans-serif;letter-spacing:0.1em;">OFFICIAL DONATION RECEIPT</p>
        <p style="margin:0 0 20px;font-size:28px;font-weight:bold;color:${BRAND_COLOR};">${formattedAmount}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:13px;color:#444;">
          <tr><td style="padding:6px 0;border-bottom:1px solid #e8dfc5;width:40%;"><strong>Donor Name</strong></td><td style="padding:6px 0;border-bottom:1px solid #e8dfc5;">${name||"Anonymous Partner"}</td></tr>
          ${planName?`<tr><td style="padding:6px 0;border-bottom:1px solid #e8dfc5;"><strong>Partnership Tier</strong></td><td style="padding:6px 0;border-bottom:1px solid #e8dfc5;">${planName}</td></tr>`:""}
          <tr><td style="padding:6px 0;border-bottom:1px solid #e8dfc5;"><strong>Receipt No.</strong></td><td style="padding:6px 0;border-bottom:1px solid #e8dfc5;font-family:monospace;">${refNum}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Date</strong></td><td style="padding:6px 0;">${receiptDate}</td></tr>
        </table>
      </td></tr>
    </table>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#555;line-height:1.6;">Hi <strong>${name||"Beloved Partner"}</strong>, your giving is sowing into the harvest fields of God's Kingdom.</p>
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
  const body = `
    <h2 style="margin:0 0 8px;font-size:24px;color:${BRAND_DARK};">RSVP Confirmed! 🎉</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#555;font-family:Arial,sans-serif;">We're excited to have you join us. Here are your event details:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,${BRAND_DARK} 0%,#1a2d4d 100%);border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:28px;">
        <img src="${LOGO_URL}" alt="${BRAND_NAME}" width="48" height="48" style="width:48px;height:48px;border-radius:50%;border:2px solid ${BRAND_COLOR};margin-bottom:16px;object-fit:contain;" />
        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;color:${BRAND_COLOR};font-family:Arial,sans-serif;letter-spacing:0.15em;">EVENT RESERVATION</p>
        <p style="margin:0 0 16px;font-size:22px;font-weight:bold;color:#ffffff;">${eventTitle}</p>
        ${eventDate?`<p style="margin:0 0 8px;font-size:13px;color:#ccc;font-family:Arial,sans-serif;">📅 ${eventDate}</p>`:""}
        ${eventLocation?`<p style="margin:0 0 8px;font-size:13px;color:#ccc;font-family:Arial,sans-serif;">📍 ${eventLocation}</p>`:""}
        ${eventDescription?`<p style="margin:16px 0 0;font-size:13px;color:#aaa;font-family:Arial,sans-serif;line-height:1.5;">${eventDescription}</p>`:""}
      </td></tr>
    </table>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#555;">Hi <strong>${name}</strong>, your seat is reserved. We look forward to experiencing God's presence with you!</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr><td style="background:${BRAND_COLOR};border-radius:8px;padding:14px 28px;">
        <a href="${DOMAIN}/events" style="color:${BRAND_DARK};font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;">View All Events →</a>
      </td></tr>
    </table>`;
  return { subject: `RSVP Confirmed: ${eventTitle} | ${BRAND_NAME}`, html: brandedWrapper(body, `Your RSVP for ${eventTitle} is confirmed!`) };
}

export function adminInvitationEmail(params: { name: string; role: string; inviteLink: string; invitedBy?: string }): { subject: string; html: string } {
  const { name, role, inviteLink, invitedBy } = params;
  const roleLabel = role.replace(/_/g," ").replace(/\b\w/g,(l)=>l.toUpperCase());
  const body = `
    <h2 style="margin:0 0 8px;font-size:24px;color:${BRAND_DARK};">Administrator Invitation 🛡️</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#555;font-family:Arial,sans-serif;">You have been provisioned with administrative access to the ${BRAND_NAME} Operations Platform.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_DARK};border-radius:12px;margin-bottom:24px;border:2px solid ${BRAND_COLOR};">
      <tr><td style="padding:28px;">
        <img src="${LOGO_URL}" alt="${BRAND_NAME}" width="56" height="56" style="width:56px;height:56px;border-radius:50%;border:2px solid ${BRAND_COLOR};margin-bottom:16px;object-fit:contain;" />
        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;color:${BRAND_COLOR};font-family:Arial,sans-serif;letter-spacing:0.15em;">ADMINISTRATIVE ROLE ASSIGNED</p>
        <p style="margin:0 0 4px;font-size:22px;font-weight:bold;color:#ffffff;">${name}</p>
        <p style="margin:0;font-size:14px;color:${BRAND_COLOR};font-family:Arial,sans-serif;">${roleLabel}</p>
        ${invitedBy?`<p style="margin:12px 0 0;font-size:12px;color:#888;font-family:Arial,sans-serif;">Provisioned by: ${invitedBy}</p>`:""}
      </td></tr>
    </table>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#555;line-height:1.6;">Hi <strong>${name}</strong>, click below to accept your invitation and configure Multi-Factor Authentication. This link expires in <strong>48 hours</strong>.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr><td style="background:${BRAND_COLOR};border-radius:8px;padding:14px 28px;">
        <a href="${inviteLink}" style="color:${BRAND_DARK};font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;">Accept Invitation &amp; Activate Account →</a>
      </td></tr>
    </table>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#aaa;line-height:1.5;">All administrative sessions are audited and rate-limited for security governance.</p>
    <p style="font-family:monospace;font-size:11px;color:#ccc;word-break:break-all;">${inviteLink}</p>`;
  return { subject: `You've been invited as ${roleLabel} — ${BRAND_NAME} Operations Portal`, html: brandedWrapper(body, `Accept your ${roleLabel} invitation.`) };
}

export function partnerWelcomeEmail(params: { name: string; planName: string; amount: number; currency: string; partnerId?: string }): { subject: string; html: string } {
  const { name, planName, amount, currency, partnerId } = params;
  const formattedAmount = `${currency} ${Number(amount).toLocaleString("en-KE",{minimumFractionDigits:2})}`;
  const pid = partnerId || `KMN-${Date.now().toString(36).toUpperCase().slice(-8)}`;
  const tierEmojis: Record<string,string> = {"Seed Partner":"🌱","Kingdom Ambassador":"🏅","Global Harvest Partner":"🌍","Covenant Pillar":"🏛️"};
  const emoji = tierEmojis[planName]||"👑";
  const body = `
    <h2 style="margin:0 0 8px;font-size:24px;color:${BRAND_DARK};">Welcome to the Kingdom Family! ${emoji}</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#555;font-family:Arial,sans-serif;">Your partnership is now active. Together, we advance God's Kingdom across nations.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,${BRAND_DARK} 0%,#1a2d4d 100%);border-radius:12px;margin-bottom:24px;border:2px solid ${BRAND_COLOR};">
      <tr><td style="padding:28px;">
        <img src="${LOGO_URL}" alt="${BRAND_NAME}" width="64" height="64" style="width:64px;height:64px;border-radius:50%;border:3px solid ${BRAND_COLOR};margin-bottom:16px;object-fit:contain;" />
        <p style="margin:0 0 4px;font-size:10px;text-transform:uppercase;color:${BRAND_COLOR};font-family:Arial,sans-serif;letter-spacing:0.2em;">KINGDOM PARTNER CREDENTIAL</p>
        <p style="margin:0 0 2px;font-size:22px;font-weight:bold;color:#ffffff;">${name}</p>
        <p style="margin:0 0 16px;font-size:14px;color:${BRAND_COLOR};font-family:Arial,sans-serif;">${planName} ${emoji}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:12px;color:#aaa;">
          <tr><td style="padding:4px 0;width:50%;color:#888;">Partner ID</td><td style="padding:4px 0;color:${BRAND_COLOR};font-family:monospace;font-size:13px;font-weight:bold;">${pid}</td></tr>
          <tr><td style="padding:4px 0;color:#888;">Monthly Gift</td><td style="padding:4px 0;color:#ffffff;font-weight:bold;">${formattedAmount}</td></tr>
          <tr><td style="padding:4px 0;color:#888;">Member Since</td><td style="padding:4px 0;">${new Date().toLocaleDateString("en-KE",{dateStyle:"long"})}</td></tr>
        </table>
      </td></tr>
    </table>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#555;line-height:1.6;">As a <strong>${planName}</strong>, you have access to exclusive content, prayer resources, and partner privileges.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr><td style="background:${BRAND_COLOR};border-radius:8px;padding:14px 28px;">
        <a href="${DOMAIN}/subscribe" style="color:${BRAND_DARK};font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;">Access Partner Portal →</a>
      </td></tr>
    </table>`;
  return { subject: `Welcome, ${planName}! Your Kingdom partnership is active — ${BRAND_NAME}`, html: brandedWrapper(body, `Your ${planName} membership is now active. Partner ID: ${pid}`) };
}

export function pastoralBroadcastEmail(params: { recipientName: string; subject: string; body: string; audience?: string }): { subject: string; html: string } {
  const { recipientName, subject, body, audience } = params;
  const htmlBody = `
    <h2 style="margin:0 0 8px;font-size:24px;color:${BRAND_DARK};">📖 Pastoral Message</h2>
    ${audience?`<p style="margin:0 0 20px;font-size:11px;text-transform:uppercase;color:${BRAND_COLOR};font-family:Arial,sans-serif;letter-spacing:0.1em;">${audience}</p>`:""}
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#555;">Dear <strong>${recipientName}</strong>,</p>
    <div style="font-family:'Georgia',serif;font-size:15px;color:#333;line-height:1.8;white-space:pre-line;border-left:3px solid ${BRAND_COLOR};padding-left:16px;margin:16px 0;">${body}</div>
    <p style="font-family:'Georgia',serif;font-size:14px;color:#888;margin-top:24px;">In His Service,<br /><strong>Bishop Dr. George Githinji</strong><br /><em>${BRAND_NAME}</em></p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr><td style="background:${BRAND_COLOR};border-radius:8px;padding:14px 28px;">
        <a href="${DOMAIN}/prayer-wall" style="color:${BRAND_DARK};font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;">Join the Prayer Wall →</a>
      </td></tr>
    </table>`;
  return { subject: `${subject} | ${BRAND_NAME}`, html: brandedWrapper(htmlBody, subject) };
}
