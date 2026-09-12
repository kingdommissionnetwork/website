import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SearchCheck, MailCheck, ShieldCheck, AlertTriangle, Clock3, RefreshCw, KeyRound, ArrowRight } from "lucide-react";
import SEO from "../components/SEO";
import { api, normalizeAuthUser } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";

type ClaimStatus = "awaiting_receipt" | "amount_mismatch" | "matched" | "rejected" | "expired" | "not_found";

interface ClaimResult {
  status: string;
  claim?: Record<string, unknown>;
  subscription?: Record<string, unknown> | null;
}

const AUTO_POLLS = 3;
const AUTO_POLL_MS = 12000;

/**
 * Track-your-payment page (best practice for approval waits): a payer who
 * closed the checkout page can return anytime with their M-Pesa code + email
 * (the two possession factors) to see the durable claim record — received,
 * verifying, approved, or rejected with reason — and claim their Partner Hub
 * once approved. No open-page waiting required.
 */
export default function TrackPaymentPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const { showToast } = useToast();

  const [reference, setReference] = useState(() => (searchParams.get("ref") || "").toUpperCase());
  const [email, setEmail] = useState(() => searchParams.get("email") || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [autoPollsLeft, setAutoPollsLeft] = useState(0);

  // Partner Hub claim (OTP) — available once the claim is matched.
  const [claimMode, setClaimMode] = useState(false);
  const [claimSending, setClaimSending] = useState(false);
  const [claimCode, setClaimCode] = useState("");
  const [claimVerifying, setClaimVerifying] = useState(false);
  const [claimDone, setClaimDone] = useState(false);

  const autoPollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopAutoPoll = useCallback(() => {
    if (autoPollTimer.current) clearTimeout(autoPollTimer.current);
    autoPollTimer.current = null;
    setAutoPollsLeft(0);
  }, []);

  useEffect(() => () => stopAutoPoll(), [stopAutoPoll]);

  const lookup = useCallback(
    async (ref: string, mail: string) => {
      const cleanRef = ref.trim().toUpperCase();
      const cleanMail = mail.trim().toLowerCase();
      if (cleanRef.length < 5) {
        setLookupError("Please enter your 10-character M-Pesa transaction code.");
        return;
      }
      if (!cleanMail.includes("@")) {
        setLookupError("Please enter the email address you used for the payment.");
        return;
      }
      setLoading(true);
      setLookupError("");
      setSearchParams({ ref: cleanRef, email: cleanMail }, { replace: true });
      try {
        const res = await api.subscriptions.getClaimStatus(cleanRef, cleanMail);
        setResult(res as ClaimResult);
        // Gentle auto-refresh while still pending: 3 checks, then the user
        // refreshes manually (quota-friendly — no open-ended polling).
        if (res.status === "awaiting_receipt") {
          setAutoPollsLeft(AUTO_POLLS);
        } else {
          stopAutoPoll();
        }
      } catch {
        setResult(null);
        setLookupError("We could not find a payment with that code and email. Double-check both and try again.");
      } finally {
        setLoading(false);
      }
    },
    [setSearchParams, stopAutoPoll]
  );

  // Follow-up polls after a pending result (max 3, then manual refresh).
  // Background tabs throttle timers natively, so this stays quota-friendly.
  useEffect(() => {
    if (autoPollsLeft <= 0 || !reference || !email) return;
    autoPollTimer.current = setTimeout(async () => {
      try {
        const res = await api.subscriptions.getClaimStatus(reference.trim().toUpperCase(), email.trim().toLowerCase());
        setResult(res as ClaimResult);
        if (res.status !== "awaiting_receipt") {
          stopAutoPoll();
          if (res.status === "matched") showToast("Payment confirmed! Your partnership is active.", "success");
        } else {
          setAutoPollsLeft((n) => n - 1);
        }
      } catch {
        setAutoPollsLeft((n) => n - 1);
      }
    }, AUTO_POLL_MS);
    return () => {
      if (autoPollTimer.current) clearTimeout(autoPollTimer.current);
    };
  }, [autoPollsLeft, reference, email, stopAutoPoll, showToast]);

  // Deep link from the acknowledgment email: /track?ref=XXX&email=YYY
  useEffect(() => {
    const ref = searchParams.get("ref");
    const mail = searchParams.get("email");
    if (ref && mail && !result && !loading) {
      lookup(ref, mail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    stopAutoPoll();
    setResult(null);
    setClaimMode(false);
    setClaimDone(false);
    lookup(reference, email);
  };

  const startClaim = async () => {
    setClaimMode(true);
    setClaimSending(true);
    try {
      await api.subscriptions.requestClaim(email.trim().toLowerCase());
      showToast("Verification code sent to your email.", "info");
    } catch {
      // requestClaim is always-ok by design; ignore transient errors
    } finally {
      setClaimSending(false);
    }
  };

  const handleVerifyClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (claimCode.trim().length < 4) {
      showToast("Please enter the 6-digit code from your email.", "error");
      return;
    }
    setClaimVerifying(true);
    try {
      const res = await api.subscriptions.verifyClaim(email.trim().toLowerCase(), claimCode.trim());
      const sessionUser = res.user ? normalizeAuthUser(res.user) : null;
      if (sessionUser) {
        setSession(sessionUser);
        setClaimDone(true);
        showToast("Partner Hub secured! Welcome back.", "success");
        navigate("/partner-portal", { state: { partnerEmail: sessionUser.email, partnerName: sessionUser.name } });
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Verification failed. Please try again.", "error");
    } finally {
      setClaimVerifying(false);
    }
  };

  // The API normalizes terminal success to "matched"; "approved" is tolerated
  // for legacy rows written before the vocabulary was unified.
  const rawStatus = result?.status || "";
  const status = (rawStatus === "approved" ? "matched" : rawStatus) as ClaimStatus | string;
  const claim = (result?.claim || {}) as Record<string, unknown>;
  const subscription = result?.subscription as Record<string, unknown> | null | undefined;
  const reason =
    (claim.note as string) ||
    (status === "amount_mismatch"
      ? "The confirmed Safaricom amount did not match the plan price on your claim."
      : status === "rejected"
        ? "Our finance team could not confirm this code against the M-Pesa statement."
        : status === "expired"
          ? "The verification window lapsed before confirmation arrived."
          : "");

  const steps = [
    { key: "received", label: "Code received", done: true, active: false },
    {
      key: "verifying",
      label: "Verifying with Safaricom / finance review",
      done: status === "matched",
      active: status === "awaiting_receipt",
    },
    {
      key: "decided",
      label: status === "matched" ? "Approved — partnership active" : "Decision",
      done: ["matched", "rejected", "amount_mismatch", "expired"].includes(status),
      active: ["rejected", "amount_mismatch", "expired"].includes(status),
    },
  ];

  return (
    <div className="pt-16 md:pt-[92px] lg:pt-[108px] min-h-screen bg-[#e6eef7] dark:bg-[#071324] transition-colors duration-300">
      <SEO title="Track My Payment — Kingdom Missions Network" description="Check the verification status of your M-Pesa payment and claim your Partner Hub access." />
      <div className="container-main mx-auto px-4 py-10 max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#d4af37]/15 border border-[#d4af37]/40 mb-4">
            <SearchCheck className="w-7 h-7 text-[#d4af37]" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-[#0c1b33] dark:text-white">Track My Payment</h1>
          <p className="text-[#6b7c93] dark:text-white/60 mt-2">
            Closed the page after paying? No problem — enter your M-Pesa code and email to see your status anytime.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0d1d36] rounded-2xl p-6 shadow-lg border border-[#0c1b33]/10 dark:border-white/10 space-y-4">
          <div>
            <label htmlFor="trackRef" className="block text-xs uppercase font-bold text-[#0c1b33] dark:text-white/60 mb-1.5">
              M-Pesa Transaction Code
            </label>
            <input
              id="trackRef"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value.toUpperCase())}
              placeholder="e.g. TK78AB12CD"
              maxLength={32}
              autoComplete="off"
              className="w-full px-4 py-3 rounded-xl border border-[#0c1b33]/15 dark:border-white/15 bg-white dark:bg-white/5 font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-[#0c1b33] dark:text-white placeholder:text-[#6b7c93]/60 placeholder:tracking-normal placeholder:font-sans"
            />
          </div>
          <div>
            <label htmlFor="trackEmail" className="block text-xs uppercase font-bold text-[#0c1b33] dark:text-white/60 mb-1.5">
              Email Used for the Payment
            </label>
            <input
              id="trackEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              autoComplete="email"
              inputMode="email"
              className="w-full px-4 py-3 rounded-xl border border-[#0c1b33]/15 dark:border-white/15 bg-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-[#0c1b33] dark:text-white"
            />
          </div>
          {lookupError && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">{lookupError}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-sm shadow-md hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <SearchCheck className="w-4 h-4" />}
            {loading ? "Checking…" : "Check Payment Status"}
          </button>
        </form>

        {result && (
          <div className="mt-6 bg-white dark:bg-[#0d1d36] rounded-2xl p-6 shadow-lg border border-[#0c1b33]/10 dark:border-white/10">
            {/* Timeline */}
            <ol className="space-y-4 mb-6">
              {steps.map((s, i) => (
                <li key={s.key} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      s.done
                        ? "bg-emerald-500 text-white"
                        : s.active
                          ? "bg-[#d4af37] text-[#0c1b33] animate-pulse"
                          : "bg-[#0c1b33]/10 dark:bg-white/10 text-[#6b7c93]"
                    }`}
                  >
                    {s.done ? "✓" : i + 1}
                  </span>
                  <span className={`text-sm font-medium ${s.done || s.active ? "text-[#0c1b33] dark:text-white" : "text-[#6b7c93]"}`}>
                    {s.label}
                  </span>
                </li>
              ))}
            </ol>

            {status === "awaiting_receipt" && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-4 text-sm text-[#0c1b33] dark:text-amber-100">
                <p className="flex items-start gap-2">
                  <Clock3 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    <strong>Received — in the verification queue.</strong> Most codes confirm automatically within
                    minutes. You can safely close this page: we will email <strong>{email}</strong> the moment there
                    is a decision.
                    {autoPollsLeft > 0 ? " Checking again shortly…" : ""}
                  </span>
                </p>
                {autoPollsLeft <= 0 && (
                  <button
                    type="button"
                    onClick={() => lookup(reference, email)}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-[#8b5e3c] dark:text-[#d4af37] hover:underline"
                  >
                    <RefreshCw className="w-4 h-4" /> Check again
                  </button>
                )}
              </div>
            )}

            {status === "matched" && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-4 text-sm text-[#0c1b33] dark:text-emerald-100">
                <p className="flex items-start gap-2">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    <strong>Approved — partnership active</strong>
                    {subscription?.plan_name ? (
                      <> ({String(subscription.plan_name)}).</>
                    ) : (
                      <>.</>
                    )}{" "}
                    Your receipt was emailed to <strong>{email}</strong>.
                  </span>
                </p>
                {!claimDone &&
                  (claimMode ? (
                    <form onSubmit={handleVerifyClaim} className="mt-4 space-y-3">
                      <label htmlFor="trackClaimCode" className="block text-xs uppercase font-bold opacity-70">
                        6-digit code from your email
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="trackClaimCode"
                          type="text"
                          inputMode="numeric"
                          value={claimCode}
                          onChange={(e) => setClaimCode(e.target.value.replace(/\D/g, "").slice(0, 12))}
                          placeholder="••••••"
                          className="flex-1 px-4 py-3 rounded-xl border border-[#0c1b33]/15 dark:border-white/15 bg-white dark:bg-white/5 font-mono tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-[#0c1b33] dark:text-white"
                        />
                        <button
                          type="submit"
                          disabled={claimVerifying}
                          className="px-5 py-3 rounded-xl bg-[#0c1b33] dark:bg-[#d4af37] text-white dark:text-[#0c1b33] font-bold text-sm disabled:opacity-60 flex items-center gap-2"
                        >
                          <KeyRound className="w-4 h-4" />
                          {claimVerifying ? "Verifying…" : "Claim Hub"}
                        </button>
                      </div>
                      <p className="text-xs opacity-60">Didn't get a code? It sends when you tap below.</p>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={startClaim}
                      disabled={claimSending}
                      className="mt-4 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0c1b33] dark:bg-[#d4af37] text-white dark:text-[#0c1b33] font-bold text-sm disabled:opacity-60"
                    >
                      <KeyRound className="w-4 h-4" />
                      {claimSending ? "Sending code…" : "Claim My Partner Hub"}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ))}
              </div>
            )}

            {(status === "rejected" || status === "amount_mismatch" || status === "expired") && (
              <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-4 text-sm text-[#0c1b33] dark:text-red-100">
                <p className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
                  <span>
                    <strong>
                      {status === "amount_mismatch"
                        ? "Amount needs your attention"
                        : status === "expired"
                          ? "Verification window expired"
                          : "Could not be confirmed"}
                    </strong>
                    {reason ? <> — {reason}</> : null}
                  </span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    to="/subscribe"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-sm"
                  >
                    Resubmit Payment <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="mailto:support@kingdommissionsnetwork.org"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#0c1b33]/20 dark:border-white/20 font-bold text-sm"
                  >
                    <MailCheck className="w-4 h-4" /> Contact Support
                  </a>
                </div>
              </div>
            )}

            {status === "not_found" && (
              <div className="rounded-xl bg-[#0c1b33]/5 dark:bg-white/5 border border-[#0c1b33]/10 dark:border-white/10 p-4 text-sm text-[#0c1b33] dark:text-white/70">
                No payment found for that code and email combination. Check the code from your M-Pesa SMS — or{" "}
                <Link to="/subscribe" className="font-bold text-[#8b5e3c] dark:text-[#d4af37] hover:underline">
                  start a new payment
                </Link>
                .
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-[#6b7c93] dark:text-white/40 mt-6">
          Paid but lost your code? It is in your M-Pesa SMS. Still stuck?{" "}
          <a href="mailto:support@kingdommissionsnetwork.org" className="underline">
            support@kingdommissionsnetwork.org
          </a>
        </p>
      </div>
    </div>
  );
}
