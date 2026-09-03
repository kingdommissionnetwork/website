import { Resend } from "resend";
import { getEnv } from "./env";
import {
  donationReceiptEmail,
  eventRsvpEmail,
  adminInvitationEmail,
  partnerWelcomeEmail,
  pastoralBroadcastEmail,
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
  if (resend) {
    const fromAddress =
      getSecret(c, "RESEND_FROM_EMAIL") ||
      "Kingdom Missions Network <bishop@kingdommissionsnetwork.org>";
    const template = pastoralBroadcastEmail({
      recipientName,
      subject,
      body,
      audience,
    });
    await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: template.subject,
      html: template.html,
    });
  }
}

