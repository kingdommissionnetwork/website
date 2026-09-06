import { getEnv } from "./env";

function getSecret(c: { env?: unknown }, key: string): string {
  const env = c.env as Record<string, string> | undefined;
  return env?.[key] || (process.env as Record<string, string>)?.[key] || getEnv(key) || "";
}

interface KcbTokenCache {
  token: string;
  expiresAt: number;
}

let cachedToken: KcbTokenCache | null = null;

/**
 * Obtain OAuth2 Bearer Token from KCB Buni Gateway
 */
export async function getKcbAccessToken(c: { env?: unknown }): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    return cachedToken.token;
  }

  const key = getSecret(c, "KCB_BUNI_CONSUMER_KEY");
  const secret = getSecret(c, "KCB_BUNI_CONSUMER_SECRET");

  if (!key || !secret) {
    throw new Error("KCB Buni credentials not configured (KCB_BUNI_CONSUMER_KEY, KCB_BUNI_CONSUMER_SECRET).");
  }

  const credentials = btoa(`${key}:${secret}`);
  const res = await fetch("https://accounts.buni.kcbgroup.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to obtain KCB OAuth2 token: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in?: number };
  const expiresInMs = (data.expires_in || 3600) * 1000;

  cachedToken = {
    token: data.access_token,
    expiresAt: now + expiresInMs,
  };

  return data.access_token;
}

/**
 * Format Kenyan phone number to 2547XXXXXXXX or 2541XXXXXXXX
 */
export function normalizeKenyanPhone(phone: string): string {
  let clean = phone.replace(/\D/g, "");
  if (clean.startsWith("0")) {
    clean = "254" + clean.substring(1);
  } else if (clean.startsWith("7") || clean.startsWith("1")) {
    clean = "254" + clean;
  } else if (clean.startsWith("+254")) {
    clean = clean.substring(1);
  }
  return clean;
}

export interface StkPushParams {
  phoneNumber: string;
  amount: number;
  invoiceNumber?: string;
  accountReference?: string;
  transactionDescription?: string;
  callbackUrl?: string;
}

export interface StkPushResult {
  merchantRequestId: string;
  checkoutRequestId: string;
  responseCode: string;
  customerMessage: string;
}

/**
 * Trigger KCB Buni M-Pesa STK Push
 */
export async function triggerKcbStkPush(
  c: { env?: unknown },
  params: StkPushParams
): Promise<StkPushResult> {
  const token = await getKcbAccessToken(c);
  const formattedPhone = normalizeKenyanPhone(params.phoneNumber);

  if (!/^254[71]\d{8}$/.test(formattedPhone)) {
    throw new Error("Invalid Safaricom phone number. Must be a valid Kenyan mobile number (e.g. 0712345678 or 0112345678).");
  }

  const messageId = `KMN_${Date.now()}`;
  const isProd = getSecret(c, "KCB_BUNI_ENV") === "production";
  // KCB Buni API gateways:
  // Production gateway: https://api.buni.kcbgroup.com
  // Sandbox/UAT gateway: https://uat.buni.kcbgroup.com
  const baseUrl = isProd
    ? (getSecret(c, "KCB_BUNI_API_URL") || "https://api.buni.kcbgroup.com/mm/api/request/1.0.0/stkpush")
    : "https://uat.buni.kcbgroup.com/mm/api/request/1.0.0/stkpush";

  const payload = {
    phoneNumber: formattedPhone,
    amount: Math.round(params.amount).toString(),
    invoiceNumber: params.invoiceNumber || "1335674365",
    sharedShortCode: true,
    orgShortCode: "",
    orgPassKey: "",
    callbackUrl: params.callbackUrl || "https://kingdommissionsnetwork.org/api/subscriptions/mpesa/kcb-callback",
    transactionDescription: (params.transactionDescription || "CovenantSeed").substring(0, 13),
  };

  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      messageId,
      operation: "STKPush",
      routeCode: "207",
    },
    body: JSON.stringify(payload),
  });

  const body = (await res.json()) as {
    header?: { statusCode?: string; statusDescription?: string };
    response?: {
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResponseCode?: string;
      CustomerMessage?: string;
      ResponseDescription?: string;
    };
  };

  if (body.header?.statusCode !== "0" && body.header?.statusCode !== "1|0") {
    throw new Error(body.header?.statusDescription || "KCB M-Pesa STK Push request failed.");
  }

  const resp = body.response || {};
  return {
    merchantRequestId: resp.MerchantRequestID || messageId,
    checkoutRequestId: resp.CheckoutRequestID || `ws_CO_${Date.now()}`,
    responseCode: resp.ResponseCode || "0",
    customerMessage: resp.CustomerMessage || "Please enter your M-Pesa PIN on your phone.",
  };
}
