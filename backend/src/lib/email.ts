import { Resend } from "resend";
import { getEnv } from "./env";
import {
  donationReceiptEmail,
  eventRsvpEmail,
  adminInvitationEmail,
  partnerWelcomeEmail,
  pastoralBroadcastEmail,
  claimOtpEmail,
  claimReceivedEmail,
  claimDecisionEmail,
  dunningReminderEmail,
} from "./emailTemplates";

function getSecret(c: { env?: unknown }, key: string): string {
  const env = c.env as Record<string, string> | undefined;
  return env?.[key] || (process.env as Record<string, string>)?.[key] || getEnv(key) || "";
}

function getResendClient(c: { env?: unknown }) {
  const resendKey = getSecret(c, "RESEND_API_KEY");
  if (!resendKey) return null;
  return new Resend(resendKey);
}

export async function sendDonationEmail(
  c: { env?: unknown },
  email: string,
  name: string,
  amount: number,
  currency: string,
  options?: { reference?: string; planName?: string; date?: string }
) {
  if (!email) return;
  const resend = getResendClient(c);
  if (resend) {
    const fromAddress =
      getSecret(c, "RESEND_FROM_EMAIL") ||
      "Kingdom Missions Network <giving@kingdommissionsnetwork.org>";
    const { subject, html } = donationReceiptEmail({
      name,
      amount,
      currency,
      reference: options?.reference,
      planName: options?.planName,
      date: options?.date,
    });
    await resend.emails.send({
      from: fromAddress,
      to: email,
      subject,
      html,
    });
  }
}

export async function sendEventRsvpEmail(
  c: { env?: unknown },
  email: string,
  name: string,
  eventTitle: string,
  details?: { eventDate?: string; eventLocation?: string; eventDescription?: string }
) {
  if (!email) return;
  const resend = getResendClient(c);
  if (resend) {
    const fromAddress =
      getSecret(c, "RESEND_EVENTS_EMAIL") ||
      getSecret(c, "RESEND_FROM_EMAIL") ||
      "Kingdom Missions Network <events@kingdommissionsnetwork.org>";
    const { subject, html } = eventRsvpEmail({
      name,
      eventTitle,
      eventDate: details?.eventDate,
      eventLocation: details?.eventLocation,
      eventDescription: details?.eventDescription,
    });
    await resend.emails.send({
      from: fromAddress,
      to: email,
      subject,
      html,
    });
  }
}

export async function sendAdminInviteEmail(
  c: { env?: unknown },
  email: string,
  name: string,
  role: string,
  inviteLink: string,
  invitedBy?: string
) {
  if (!email) return;
  const resend = getResendClient(c);
  if (resend) {
    const fromAddress =
      getSecret(c, "RESEND_FROM_EMAIL") ||
      "Kingdom Missions Network <security@kingdommissionsnetwork.org>";
    const { subject, html } = adminInvitationEmail({
      name,
      role,
      inviteLink,
      invitedBy,
    });
    await resend.emails.send({
      from: fromAddress,
      to: email,
      subject,
      html,
    });
  }
}

export async function sendPartnerWelcomeEmail(
  c: { env?: unknown },
  email: string,
  name: string,
  planName: string,
  amount: number,
  currency: string,
  partnerId?: string
) {
  if (!email) return;
  const resend = getResendClient(c);
  if (resend) {
    const fromAddress =
      getSecret(c, "RESEND_FROM_EMAIL") ||
      "Kingdom Missions Network <partners@kingdommissionsnetwork.org>";
    const { subject, html } = partnerWelcomeEmail({
      name,
      planName,
      amount,
      currency,
      partnerId,
    });
    await resend.emails.send({
      from: fromAddress,
      to: email,
      subject,
      html,
    });
  }
}

export async function sendPastoralBroadcastEmail(
  c: { env?: unknown },
  email: string,
  recipientName: string,
  subject: string,
  body: string,
  audience?: string
) {
  if (!email) return;
  const resend = getResendClient(c);
  if (!resend) {
    throw new Error("Email dispatcher is not configured: Missing RESEND_API_KEY in Cloudflare Worker secrets.");
  }
  const fromAddress =
    getSecret(c, "RESEND_FROM_EMAIL") ||
    "Kingdom Missions Network <bishop@kingdommissionsnetwork.org>";
  const unsubscribeUrl = `https://kingdommissionsnetwork.org/unsubscribe?email=${encodeURIComponent(email)}`;
  const template = pastoralBroadcastEmail({
    recipientName,
    subject,
    body,
    audience,
    unsubscribeUrl,
  });
  const res = await resend.emails.send({
    from: fromAddress,
    to: email,
    subject: template.subject,
    html: template.html,
    headers: { "List-Unsubscribe": `<${unsubscribeUrl}>, <mailto:unsubscribe@kingdommissionsnetwork.org?subject=unsubscribe>` },
  });
  if (res.error) {
    console.error(`[EMAIL] Resend broadcast delivery error for ${email}:`, res.error);
    throw new Error(res.error.message || "Resend email delivery failed");
  }
  return res.data;
}

/**
 * Batch fan-out for pastoral broadcasts (Resend batch endpoint, 100/recall).
 * Falls back to individual sends when batch is unavailable. Every message
 * carries a List-Unsubscribe header + footer link (mass-email compliance).
 */
export async function sendPastoralBroadcastBatch(
  c: { env?: unknown },
  recipients: { email: string; name: string }[],
  subject: string,
  body: string,
  audience?: string
): Promise<{ sent: number; failed: number; lastError: string | null }> {
  const resend = getResendClient(c);
  if (!resend) throw new Error("Email dispatcher is not configured: Missing RESEND_API_KEY.");
  const fromAddress =
    getSecret(c, "RESEND_FROM_EMAIL") ||
    "Kingdom Missions Network <bishop@kingdommissionsnetwork.org>";
  let sent = 0;
  let failed = 0;
  let lastError: string | null = null;
  const CHUNK = 100;
  for (let i = 0; i < recipients.length; i += CHUNK) {
    const chunk = recipients.slice(i, i + CHUNK);
    const payload = chunk.map((r) => {
      const unsubscribeUrl = `https://kingdommissionsnetwork.org/unsubscribe?email=${encodeURIComponent(r.email)}`;
      const template = pastoralBroadcastEmail({
        recipientName: r.name,
        subject,
        body,
        audience,
        unsubscribeUrl,
      });
      return {
        from: fromAddress,
        to: r.email,
        subject: template.subject,
        html: template.html,
        headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
      };
    });
    try {
      const batchApi = (resend as unknown as { batch?: { send: (p: unknown) => Promise<{ error?: { message?: string } }> } }).batch;
      if (batchApi?.send) {
        const res = await batchApi.send(payload);
        if (res?.error) throw new Error(res.error.message || "Batch rejected");
        sent += chunk.length;
      } else {
        throw new Error("batch unavailable");
      }
    } catch {
      // Fallback: individual sends in parallel (bounded).
      const results = await Promise.allSettled(
        payload.map((p) => resend.emails.send(p as Parameters<typeof resend.emails.send>[0]))
      );
      for (const r of results) {
        if (r.status === "fulfilled" && !(r.value as { error?: unknown }).error) sent++;
        else {
          failed++;
          const err = r.status === "rejected" ? r.reason : (r.value as { error?: { message?: string } }).error;
          lastError = err instanceof Error ? err.message : String((err as { message?: string })?.message || err);
        }
      }
    }
  }
  return { sent, failed, lastError };
}

export async function sendClaimOtpEmail(
  c: { env?: unknown },
  email: string,
  name: string,
  code: string
) {
  if (!email || !code) return;
  const resend = getResendClient(c);
  if (resend) {
    const fromAddress =
      getSecret(c, "RESEND_FROM_EMAIL") ||
      "Kingdom Missions Network <partners@kingdommissionsnetwork.org>";
    const { subject, html } = claimOtpEmail({ name, code });
    await resend.emails.send({ from: fromAddress, to: email, subject, html });
  } else {
    console.log(`[CLAIM-OTP] ${email} code: ${code} (no RESEND_API_KEY configured)`);
  }
}

function claimTrackUrl(email: string, reference: string): string {
  return `https://kingdommissionsnetwork.org/track?ref=${encodeURIComponent(reference)}&email=${encodeURIComponent(email)}`;
}

/**
 * Acknowledgment that a payment code entered the verification queue.
 * Best-effort: never throws (webhooks and verify endpoints must ack fast).
 */
export async function sendClaimReceivedEmail(
  c: { env?: unknown },
  params: { email: string; name: string; reference: string; amount: number; planName: string }
): Promise<void> {
  if (!params.email) return;
  try {
    const resend = getResendClient(c);
    const { subject, html } = claimReceivedEmail({
      name: params.name,
      reference: params.reference,
      amount: params.amount,
      planName: params.planName,
      trackUrl: claimTrackUrl(params.email, params.reference),
    });
    if (!resend) {
      console.log(`[CLAIM-ACK] ${params.email} ref ${params.reference} (no RESEND_API_KEY configured)`);
      return;
    }
    const fromAddress =
      getSecret(c, "RESEND_FROM_EMAIL") ||
      "Kingdom Missions Network <partners@kingdommissionsnetwork.org>";
    const res = await resend.emails.send({ from: fromAddress, to: params.email, subject, html });
    if (res.error) console.error(`[CLAIM-ACK] Resend error for ${params.email}:`, res.error);
  } catch (err) {
    console.error("[CLAIM-ACK] dispatch error:", err);
  }
}

/**
 * Terminal decision notice for a claim (approved / rejected / mismatch / expired).
 * Best-effort: never throws. Approved subscription claims already receive the
 * donation receipt + welcome emails from fulfillment; this adds the hub CTA.
 */
export async function sendClaimDecisionEmail(
  c: { env?: unknown },
  params: {
    email: string;
    name: string;
    reference: string;
    planName: string;
    decision: "approved" | "rejected" | "amount_mismatch" | "expired";
    reason?: string;
  }
): Promise<void> {
  if (!params.email) return;
  try {
    const resend = getResendClient(c);
    const { subject, html } = claimDecisionEmail({
      name: params.name,
      reference: params.reference,
      planName: params.planName,
      decision: params.decision,
      reason: params.reason,
      trackUrl: claimTrackUrl(params.email, params.reference),
    });
    if (!resend) {
      console.log(`[CLAIM-DECISION] ${params.email} ref ${params.reference} ${params.decision} (no RESEND_API_KEY configured)`);
      return;
    }
    const fromAddress =
      getSecret(c, "RESEND_FROM_EMAIL") ||
      "Kingdom Missions Network <partners@kingdommissionsnetwork.org>";
    const res = await resend.emails.send({ from: fromAddress, to: params.email, subject, html });
    if (res.error) console.error(`[CLAIM-DECISION] Resend error for ${params.email}:`, res.error);
  } catch (err) {
    console.error("[CLAIM-DECISION] dispatch error:", err);
  }
}

export async function sendDunningReminderEmail(
  c: { env?: unknown },
  email: string,
  params: {
    name: string;
    planName: string;
    amount: number;
    currency: string;
    renewLink: string;
    attemptNo: number;
    nextRetryDate?: string;
  }
) {
  if (!email) return;
  const resend = getResendClient(c);
  if (resend) {
    const fromAddress =
      getSecret(c, "RESEND_FROM_EMAIL") ||
      "Kingdom Missions Network <partners@kingdommissionsnetwork.org>";
    const { subject, html } = dunningReminderEmail(params);
    await resend.emails.send({ from: fromAddress, to: email, subject, html });
  } else {
    console.log(`[DUNNING] reminder for ${email} attempt ${params.attemptNo} (no RESEND_API_KEY configured)`);
  }
}

