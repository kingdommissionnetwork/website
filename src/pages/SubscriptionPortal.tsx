import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Check,
  Sparkles,
  Heart,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Download,
  X,
  Copy,
  Smartphone,
  CreditCard,
  Building2,
  ArrowRight,
  ArrowLeft,
  Zap,
} from "lucide-react";
import ScrollReveal from "../components/ScrollReveal";
import AmbientParticles from "../components/AmbientParticles";
import SEO from "../components/SEO";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import brandLogo from "../assets/logo.png";

const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "";

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        ref: string;
        callback: (response: { reference: string }) => void;
        onClose: () => void;
        metadata?: Record<string, unknown>;
      }) => { openIframe: () => void };
    };
    paypal: {
      Buttons: (config: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError: (err: unknown) => void;
        style?: Record<string, string>;
      }) => { render: (el: string) => void };
    };
  }
}

export interface PartnerPlan {
  id: string;
  name: string;
  badge: string;
  kesMonthly: number;
  description: string;
  isPopular?: boolean;
  tagline: string;
  impactHighlight: string;
  perks: string[];
}

export const PARTNER_PLANS: PartnerPlan[] = [
  {
    id: "seed",
    name: "Seed Partner",
    badge: "🌱 Seed Partner",
    kesMonthly: 1000,
    tagline: "Foundational Mission & Bread Support",
    description: "Sow into frontline evangelism, gospel bread relief for vulnerable families, and Holy Bible distribution.",
    impactHighlight: "Feeds 2 vulnerable families & supplies 1 Holy Bible to new converts each month.",
    perks: [
      "Official Digital Partner Membership Certificate",
      "Name & Family listed on 24/7 Global Intercessory Altar",
      "Monthly Mission Impact Digest & Financial Report",
      "Access to partner devotional library & study plans",
      "Interactive Partner Dashboard & giving history",
    ],
  },
  {
    id: "ambassador",
    name: "Kingdom Ambassador",
    badge: "👑 Kingdom Ambassador",
    kesMonthly: 3000,
    isPopular: true,
    tagline: "Outreach Crusades & Field Deployment",
    description: "Directly sponsor village crusades, church planting, and qualify for official mission delegation travel.",
    impactHighlight: "Funds village crusade sound equipment & regional evangelist mobilization.",
    perks: [
      "Official Kingdom Missions Network Partner ID Card",
      "Priority Selection for Mission Travel Teams & Global Crusades",
      "Monthly Live Prophetic Briefing with Bishop Dr. George Githinji",
      "Dedicated 24/7 Urgent Pastoral Prayer WhatsApp Line",
      "Reserved Partner Seating at all KMN Summits & Conferences",
      "All Seed Partner perks included",
    ],
  },
  {
    id: "harvest",
    name: "Global Harvest Partner",
    badge: "🌍 Global Harvest Partner",
    kesMonthly: 7500,
    tagline: "International Itineraries & Ministry Logistical Backing",
    description: "Empower international missionary travel, satellite broadcasts, and receive itinerary facilitation for overseas ministry.",
    impactHighlight: "Establishes permanent regional mission bases & international crusades.",
    perks: [
      "International Preaching Logistics & Pastoral Network Facilitation (KMN connects you with vetted pastoral bodies abroad & helps arrange meeting logistics)",
      "Official Ministry Ambassador Credential Endorsement",
      "Quarterly Private Executive Roundtable with Bishop George",
      "VIP Access & Reserved Platform Seating at all Global Summits",
      "Direct sponsorship recognition in KMN broadcast credits",
      "All Kingdom Ambassador perks included",
    ],
  },
  {
    id: "pillar",
    name: "Covenant Pillar",
    badge: "🏛️ Covenant Pillar",
    kesMonthly: 20000,
    tagline: "Strategic Vision & Global Expansion",
    description: "Lead major kingdom expansion initiatives, television broadcasting, and strategic disaster relief.",
    impactHighlight: "Sponsors city-wide stadium crusades and multi-nation satellite broadcasts.",
    perks: [
      "Advisory Seat on KMN Global Missions Strategy Council",
      "Personalized Physical Gold-Plated Partner Seal & Ordination Letter",
      "Comprehensive International Preaching Delegation Logistics Coordination",
      "Personal Monthly Pastoral Prayer Covenant with Bishop Dr. George Githinji",
      "Executive Briefing & Strategy Access on upcoming mission frontiers",
      "All Global Harvest perks included",
    ],
  },
];


export default function SubscriptionPortal() {
  const { user, setSession } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [currentStep, setCurrentStep] = useState<"plans" | "checkout">(() => {
    return searchParams.get("step") === "checkout" ? "checkout" : "plans";
  });
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    const planParam = searchParams.get("plan");
    if (planParam && PARTNER_PLANS.some((p) => p.id === planParam)) return planParam;
    return "ambassador";
  });
  const [isCustomAmount, setIsCustomAmount] = useState<boolean>(false);
  const [customAmountKes, setCustomAmountKes] = useState<number>(5000);
  const [currencyView, setCurrencyView] = useState<"KES" | "USD">("KES");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [exchangeRate, setExchangeRate] = useState<number>(0.00772);
  const [loadingRate, setLoadingRate] = useState<boolean>(true);
  const [subscriberName, setSubscriberName] = useState(user?.name || "");
  const [subscriberEmail, setSubscriberEmail] = useState(user?.email || "");
  const [submitting, setSubmitting] = useState(false);

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [onboardingStage, setOnboardingStage] = useState<number | null>(null);
  const [subMethod, setSubMethod] = useState<"mpesa" | "card" | "paypal">("mpesa");
  const [mpesaMode, setMpesaMode] = useState<"stk" | "manual">("stk");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [stkPending, setStkPending] = useState(false);
  const [stkPromptSent, setStkPromptSent] = useState(false);
  const [stkStatusMessage, setStkStatusMessage] = useState("");
  const [stkSecondsLeft, setStkSecondsLeft] = useState(60);
  const [mpesaRefCode, setMpesaRefCode] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setCopiedKey(label);
    showToast(`${label} copied to clipboard!`, "success");
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Active selected plan
  const activePlan = PARTNER_PLANS.find((p) => p.id === selectedPlanId) || PARTNER_PLANS[1];
  const activeAmountKes = isCustomAmount
    ? customAmountKes
    : activePlan.kesMonthly * (billingCycle === "yearly" ? 12 * 0.85 : 1);
  const activeAmountUsd = Number((activeAmountKes * exchangeRate).toFixed(2));

  // Handler to select a plan and advance directly to Step 2 (Checkout)
  const handleSelectPlanAndProceed = (planId: string) => {
    setSelectedPlanId(planId);
    setIsCustomAmount(false);
    setCurrentStep("checkout");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Seamless Onboarding Handshake Sequence (Stripe/Patreon Benchmark)
  // claimRequired: payment succeeded for a KNOWN email — the hub session is
  // minted only after the emailed ownership code is verified (anti-takeover).
  const runOnboardingTransition = async (
    planTitle: string,
    verifiedUser?: Record<string, unknown> | null,
    token?: string | null,
    subscription?: Record<string, unknown> | null,
    refCode?: string | null,
    claimRequired?: boolean
  ) => {
    setIsSubscribed(true);
    setOnboardingStage(1);
    if (verifiedUser && token) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSession(verifiedUser as any, token);
    }
    if (claimRequired) {
      showToast("Payment confirmed! A verification code was sent to your email to secure your Partner Hub.", "info");
    }
    await new Promise((r) => setTimeout(r, 650));
    setOnboardingStage(2);
    await new Promise((r) => setTimeout(r, 650));
    setOnboardingStage(3);
    await new Promise((r) => setTimeout(r, 650));
    setOnboardingStage(4);
    await new Promise((r) => setTimeout(r, 500));
    navigate("/partner-portal", {
      state: {
        justSubscribed: true,
        planName: planTitle,
        partnerName: subscriberName.trim() || (verifiedUser?.name as string) || "Kingdom Partner",
        partnerEmail: subscriberEmail.trim() || (verifiedUser?.email as string) || "",
        paymentReference: refCode || "",
        paymentProvider: "mpesa_paybill",
        amount: activeAmountKes,
        currency: "KES",
        subscription: subscription || null,
        claimRequired: Boolean(claimRequired),
      },
    });
  };

  // Auto-verify URL query params from 3D-secure / bank / M-Pesa redirects
  useEffect(() => {
    const ref = searchParams.get("reference") || searchParams.get("trxref");
    if (ref) {
      setSubmitting(true);
      api.subscriptions
        .verify(ref)
        .then((res) => {
          runOnboardingTransition(res.planName || activePlan.name, res.user, res.token, null, ref, res.claimRequired);
        })
        .catch(() => {
          showToast("Payment verified. Redirecting to your dashboard...", "success");
          runOnboardingTransition(activePlan.name, null, null);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Load pricing
  const loadPricing = async () => {
    setLoadingRate(true);
    try {
      const data = await api.subscriptions.getPricing(1000);
      if (data.exchangeRate) {
        setExchangeRate(data.exchangeRate);
      }
    } catch {
      setExchangeRate(0.00772);
    } finally {
      setLoadingRate(false);
    }
  };

  useEffect(() => {
    loadPricing();
    if (paystackKey) {
      const s = document.createElement("script");
      s.src = "https://js.paystack.co/v1/inline.js";
      s.async = true;
      document.body.appendChild(s);
      return () => {
        if (document.body.contains(s)) {
          document.body.removeChild(s);
        }
      };
    }
  }, []);

  // M-Pesa STK Push (Express PIN Prompt - 100% Zero Code Entry)
  const handleMpesaStkPush = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = subscriberName.trim();
    const email = subscriberEmail.trim();
    const phone = mpesaPhone.trim();

    if (!name) {
      showToast("Please enter your full name", "error");
      return;
    }
    if (!email || !email.includes("@")) {
      showToast("Please enter a valid email address", "error");
      return;
    }
    if (!phone) {
      showToast("Please enter your Safaricom M-Pesa phone number", "error");
      return;
    }

    setSubmitting(true);
    setStkPending(true);
    setStkSecondsLeft(60);
    setStkStatusMessage("Contacting Safaricom to prompt your phone...");

    try {
      const initRes = await api.subscriptions.initiateMpesaStk({
        phoneNumber: phone,
        name,
        email,
        amount: Math.round(activeAmountKes),
        planName: isCustomAmount ? "Custom Covenant Partner" : activePlan.name,
        planId: isCustomAmount ? "custom" : activePlan.id,
        interval: billingCycle,
      });

      setStkPromptSent(true);
      setStkStatusMessage(`M-Pesa PIN prompt sent to ${phone}! Please enter your PIN on your phone.`);
      showToast("M-Pesa PIN prompt sent! Please enter your PIN on your phone.", "info");

      const checkoutId = initRes.checkoutRequestId;
      let attempts = 0;
      const maxAttempts = 30;

      // Live countdown for the PIN window (matches the 60s poll budget)
      const countdownTimer = setInterval(() => {
        setStkSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      const stopPolling = () => {
        clearInterval(pollTimer);
        clearInterval(countdownTimer);
      };

      const pollTimer = setInterval(async () => {
        attempts++;
        try {
          const qRes = await api.subscriptions.queryMpesaStk(checkoutId);
          if (qRes.status === "completed") {
            stopPolling();
            setStkPending(false);
            setStkStatusMessage("Payment confirmed! Opening your partner dashboard...");
            showToast("Payment verified! Opening your partner covenant dashboard...", "success");
            await runOnboardingTransition(
              qRes.planName || activePlan.name,
              qRes.user,
              qRes.token,
              qRes.subscription,
              qRes.receiptCode,
              qRes.claimRequired
            );
          } else if (qRes.status === "failed") {
            stopPolling();
            setStkPending(false);
            setStkPromptSent(false);
            showToast("M-Pesa transaction was cancelled or declined on phone.", "error");
          } else if (attempts >= maxAttempts) {
            stopPolling();
            setStkPending(false);
            setStkPromptSent(false);
            showToast("Transaction timeout. If you completed payment, you can enter the SMS receipt code below.", "info");
            setMpesaMode("manual");
          }
        } catch {
          // keep polling
        }
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to trigger M-Pesa STK Push.";
      showToast(msg, "error");
      setStkPending(false);
      setStkPromptSent(false);
    } finally {
      setSubmitting(false);
    }
  };

  // M-Pesa Paybill subscription flow (Immediate Verification & Activation)
  const handleMpesaSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = subscriberName.trim();
    const email = subscriberEmail.trim();
    const cleanRef = mpesaRefCode.trim().toUpperCase();

    if (!name) {
      showToast("Please enter your full name", "error");
      return;
    }
    if (!email || !email.includes("@")) {
      showToast("Please enter a valid email address", "error");
      return;
    }
    if (!cleanRef) {
      showToast("Please enter your M-Pesa transaction confirmation code", "error");
      return;
    }

    if (cleanRef.length !== 10) {
      showToast("M-Pesa transaction code must be exactly 10 characters long (e.g. TK78AB12CD).", "error");
      return;
    }
    if (!/^[A-Z][A-Z0-9]{9}$/.test(cleanRef)) {
      showToast("M-Pesa transaction code must start with a letter and contain valid alphanumeric characters (e.g. TK78AB12CD).", "error");
      return;
    }
    const letters = (cleanRef.match(/[A-Z]/g) || []).length;
    const digits = (cleanRef.match(/[0-9]/g) || []).length;
    if (letters < 2 || digits < 2 || /^(.)\1{9}$/.test(cleanRef)) {
      showToast("Invalid M-Pesa code format. Please check the transaction SMS from MPESA.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.subscriptions.verifyMpesa({
        reference: cleanRef,
        name,
        email,
        amount: Math.round(activeAmountKes),
        planName: isCustomAmount ? "Custom Covenant Partner" : activePlan.name,
        planId: isCustomAmount ? "custom" : activePlan.id,
        interval: billingCycle,
      });

      showToast("M-Pesa payment verified! Activating your partner covenant dashboard...", "success");
      await runOnboardingTransition(
        res.planName || activePlan.name,
        res.user,
        res.token,
        res.subscription,
        cleanRef,
        res.claimRequired
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "M-Pesa verification failed. Please try again.";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Paystack flow (KES or USD)
  const handlePaystack = async () => {
    if (!subscriberEmail) {
      showToast("Please enter your email address", "error");
      return;
    }
    setSubmitting(true);
    try {
      const initData = await api.subscriptions.initialize({
        email: subscriberEmail,
        name: subscriberName || "Kingdom Partner",
        interval: billingCycle,
        currency: currencyView,
        planId: isCustomAmount ? "custom" : activePlan.id,
        planName: isCustomAmount ? "Custom Covenant Partner" : activePlan.name,
        amount: Math.round(activeAmountKes),
      });

      if (window.PaystackPop) {
        const handler = window.PaystackPop.setup({
          key: paystackKey,
          email: subscriberEmail,
          amount: currencyView === "KES" ? Math.round(activeAmountKes * 100) : Math.round(activeAmountUsd * 100),
          currency: currencyView,
          ref: initData.reference || `KMN-SUB-${Date.now()}`,
          metadata: {
            name: subscriberName,
            planId: isCustomAmount ? "custom" : activePlan.id,
            planName: isCustomAmount ? "Custom Covenant Partner" : activePlan.name,
            interval: billingCycle,
            kesAmount: activeAmountKes,
            usdAmount: activeAmountUsd,
          },
          callback: async (response: { reference: string }) => {
            try {
              const res = await api.subscriptions.verify(response.reference);
              await runOnboardingTransition(res.planName || activePlan.name, res.user, res.token, null, response.reference, res.claimRequired);
            } catch {
              await runOnboardingTransition(activePlan.name, null, null);
            }
          },
          onClose: () => {
            setSubmitting(false);
          },
        });
        handler.openIframe();
      } else if (initData.authorization_url) {
        window.location.href = initData.authorization_url;
      }
    } catch {
      showToast("Payment initialization failed. Please try again.", "error");
      setSubmitting(false);
    }
  };

  // PayPal flow (USD)
  const handlePayPal = async () => {
    if (!window.paypal) {
      showToast("PayPal is loading. Please try again in a few seconds.", "info");
      return;
    }
    setSubmitting(true);
    try {
      const order = await api.subscriptions.paypalCreate({
        name: subscriberName || "Kingdom Partner",
        email: subscriberEmail,
        amount: Math.round(activeAmountKes),
        planName: isCustomAmount ? "Custom Covenant Partner" : activePlan.name,
      });

      window.paypal.Buttons({
        createOrder: () => Promise.resolve(order.id),
        onApprove: async (data: { orderID: string }) => {
          try {
            const capture = await api.subscriptions.paypalCapture({
              orderId: data.orderID,
              subscriberName: subscriberName || "Kingdom Partner",
            });
            if (capture.status === "COMPLETED") {
              await runOnboardingTransition(activePlan.name, capture.user, capture.token, null, data.orderID, capture.claimRequired);
            }
          } catch {
            await runOnboardingTransition(activePlan.name, null, null);
          }
        },
        onError: () => {
          showToast("PayPal subscription processing failed.", "error");
          setSubmitting(false);
        },
      }).render("#paypal-subscription-container");
    } catch {
      showToast("Failed to initialize PayPal order.", "error");
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-[72px] md:pt-[108px] min-h-screen bg-[#071324] text-white">
      <SEO
        title="Kingdom Partnership Packages — Kingdom Missions Network"
        description="Join Kingdom Missions Network as a covenant partner. Support reaching the unreached, feeding the nations, and global crusades with exclusive ambassador incentives."
      />

      {/* STEP 1: CHOOSE PACKAGE (ULTRA COMPACT HEADER + 4 TIERS GRID) */}
      {currentStep === "plans" && (
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0c1b33] via-[#071324] to-[#1a1107] pt-3 pb-8 sm:pt-4 sm:pb-12 px-3 sm:px-6 lg:px-8 min-h-[calc(100vh-92px)] flex flex-col justify-between" id="packages">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(249,115,22,0.12)_0%,transparent_65%)] pointer-events-none blur-3xl" />
          <div className="absolute bottom-0 left-10 w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(212,175,55,0.15)_0%,transparent_65%)] pointer-events-none blur-3xl" />
          <AmbientParticles />

          <div className="container-main mx-auto relative z-10 max-w-7xl w-full">
            {/* Ultra-compact Header to maximize space for cards */}
            <div className="text-center max-w-4xl mx-auto mb-4 sm:mb-6">
              <ScrollReveal>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-[#d4af37]/40 text-[#fbf5b7] text-[11px] font-semibold mb-2 backdrop-blur-md">
                  <Sparkles className="w-3 h-3 text-[#d4af37]" />
                  <span>Kingdom Missions Network Covenant Partnership</span>
                </div>

                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37] mb-1">
                  Covenant Tiers &amp; Privileges
                </div>

                <h1 className="font-brand text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-1.5 leading-tight tracking-tight">
                  Choose Your{" "}
                  <span className="bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] bg-clip-text text-transparent">
                    Partnership Package
                  </span>
                </h1>

                <p className="font-outfit text-white/75 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed mb-3">
                  Select a tier that aligns with your spiritual devotion and kingdom calling.
                </p>

                {/* Single Compact Row for Currency, Billing & Live Rate */}
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                  {/* Currency Toggle */}
                  <div className="inline-flex rounded-xl bg-white/10 p-0.5 border border-white/15 backdrop-blur-md shadow-sm">
                    <button
                      type="button"
                      onClick={() => setCurrencyView("KES")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        currencyView === "KES"
                          ? "bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] shadow-sm"
                          : "text-white/70 hover:text-white"
                      }`}
                    >
                      KES (Kenyan Shillings)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrencyView("USD")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        currencyView === "USD"
                          ? "bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] shadow-sm"
                          : "text-white/70 hover:text-white"
                      }`}
                    >
                      USD ($ US Dollars)
                    </button>
                  </div>

                  {/* Billing Cycle Toggle */}
                  <div className="inline-flex rounded-xl bg-white/10 p-0.5 border border-white/15 backdrop-blur-md shadow-sm">
                    <button
                      type="button"
                      onClick={() => setBillingCycle("monthly")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        billingCycle === "monthly"
                          ? "bg-white text-[#0c1b33] shadow-sm"
                          : "text-white/70 hover:text-white"
                      }`}
                    >
                      Monthly Seed
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle("yearly")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        billingCycle === "yearly"
                          ? "bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] shadow-sm"
                          : "text-white/70 hover:text-white"
                      }`}
                    >
                      <span>Annual Covenant</span>
                      <span className="text-[9px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.2 rounded-full">
                        Save 15%
                      </span>
                    </button>
                  </div>

                  {/* Live Rate Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live Rate: 1 USD ≈ {(1 / exchangeRate).toFixed(2)} KES</span>
                    <button
                      type="button"
                      onClick={loadPricing}
                      disabled={loadingRate}
                      title="Refresh rates"
                      className="p-0.5 text-white/50 hover:text-white transition-colors"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${loadingRate ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* 4 Cards Grid — Occupies full space cleanly */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch mb-6">
              {PARTNER_PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id && !isCustomAmount;
                const billedKes = billingCycle === "yearly" ? Math.round(plan.kesMonthly * 12 * 0.85) : plan.kesMonthly;
                const kesDisplay = billedKes.toLocaleString();
                const usdDisplay = (billedKes * exchangeRate).toFixed(2);

                return (
                  <div
                    key={plan.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectPlanAndProceed(plan.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectPlanAndProceed(plan.id);
                      }
                    }}
                    className={`relative rounded-3xl p-5 sm:p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? "bg-gradient-to-b from-[#132c52] to-[#0d1d36] border-2 border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.3)] scale-[1.02]"
                        : "bg-white/[0.04] border border-white/10 hover:border-white/25 hover:bg-white/[0.06]"
                    }`}
                  >
                    {/* Popular Tag */}
                    {plan.isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] text-[#0c1b33] text-[9px] font-extrabold uppercase tracking-wider shadow-md whitespace-nowrap">
                        Most Popular Tier
                      </div>
                    )}

                    <div>
                      {/* Header */}
                      <div className="mb-3">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold text-[#fbf5b7] mb-1.5">
                          {plan.badge}
                        </span>
                        <h4 className="font-brand text-xl font-bold text-white mb-0.5">{plan.name}</h4>
                        <p className="font-outfit text-[11px] text-[#d4af37] font-semibold mb-1.5">{plan.tagline}</p>
                        <p className="font-outfit text-xs text-white/70 leading-relaxed min-h-[32px]">{plan.description}</p>
                      </div>

                      {/* Price */}
                      <div className="mb-4 pb-3 border-b border-white/10">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-brand text-2xl sm:text-3xl font-extrabold text-white">
                            {currencyView === "KES" ? `KES ${kesDisplay}` : `$${usdDisplay}`}
                          </span>
                          <span className="text-white/60 text-xs">
                            / {billingCycle === "yearly" ? "year" : "month"}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/50 mt-0.5">
                          {currencyView === "KES" ? `≈ $${usdDisplay} USD / mo` : `≈ ${kesDisplay} KES / mo`}
                          {billingCycle === "yearly" && " · 15% discount included"}
                        </p>
                      </div>

                      {/* ═══════════════════════════════════════════════════════════
                          SELECT BUTTON PLACED ABOVE — CHATGPT PILL BUTTON STYLE
                          High-contrast, pill-shaped (rounded-full), stands out boldly
                          ═══════════════════════════════════════════════════════════ */}
                      <div className="my-3 sm:my-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPlanAndProceed(plan.id);
                          }}
                          className={`w-full py-3 px-4 rounded-full font-extrabold text-xs sm:text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                            isSelected
                              ? "bg-gradient-to-r from-[#d4af37] via-[#faea9f] to-[#c5961d] text-[#081220] shadow-[0_0_24px_rgba(212,175,55,0.7)] ring-2 ring-[#d4af37] ring-offset-2 ring-offset-[#0d1d36] scale-[1.02]"
                              : plan.isPopular
                              ? "bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#081220] hover:brightness-110 shadow-[0_4px_18px_rgba(212,175,55,0.45)] hover:scale-[1.02] active:scale-[0.98]"
                              : "bg-white text-[#0a1526] hover:bg-[#faea9f] hover:text-[#081220] shadow-[0_4px_16px_rgba(255,255,255,0.2)] hover:shadow-[0_6px_22px_rgba(255,255,255,0.35)] hover:scale-[1.02] active:scale-[0.98]"
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-4 h-4 stroke-[3]" />
                              <span>Selected Tier ✓</span>
                            </>
                          ) : (
                            <>
                              <span>Choose {plan.name}</span>
                              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                            </>
                          )}
                        </button>
                      </div>

                      {/* Impact Note */}
                      <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10 text-[11px] text-[#fbf5b7] mb-4 leading-relaxed flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#d4af37] shrink-0 mt-0.5" />
                        <span>{plan.impactHighlight}</span>
                      </div>

                      {/* Perks Section Heading */}
                      <div className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-2">
                        Everything in this tier:
                      </div>

                      {/* Perks List */}
                      <ul className="space-y-2">
                        {plan.perks.map((perk, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-white/80 leading-snug">
                            <Check className="w-3.5 h-3.5 text-[#d4af37] shrink-0 mt-0.5" />
                            <span>{perk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Action Bar — Direct Proceed + Custom Giving */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 max-w-4xl mx-auto w-full">
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/60">Selected Plan:</span>
                <span className="text-xs sm:text-sm font-bold text-[#fbf5b7] bg-white/10 px-3 py-1 rounded-xl">
                  {activePlan.name} · {currencyView === "KES" ? `KES ${Math.round(activeAmountKes).toLocaleString()}` : `$${activeAmountUsd.toFixed(2)} USD`} / {billingCycle === "yearly" ? "yr" : "mo"}
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomAmount(true);
                    setCurrentStep("checkout");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
                >
                  Sow Custom Amount
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep("checkout");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-xs sm:text-sm shadow-lg hover:brightness-110 transition-all"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* STEP 2: CHECKOUT SECTION (OCCUPIES ENTIRE SCREEN, NO ENDLESS SCROLLING) */}
      {currentStep === "checkout" && (
        <section className="py-8 sm:py-12 px-4 sm:px-6 min-h-[calc(100vh-92px)] flex flex-col justify-start" id="checkout">
          <div className="container-main mx-auto max-w-3xl w-full">
            {/* Step Navigation & Breadcrumbs */}
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
              <button
                type="button"
                onClick={() => {
                  setCurrentStep("plans");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Packages</span>
              </button>

              <div className="inline-flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-[#d4af37]/20 text-[#fbf5b7] font-bold">
                  Step 2 of 2
                </span>
                <span className="text-white/60">Payment &amp; Activation</span>
              </div>
            </div>

            <div className="p-6 sm:p-9 rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/15 shadow-2xl">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold mb-3">
                  <Check className="w-3.5 h-3.5" />
                  <span>Selected: {isCustomAmount ? "Custom Covenant" : activePlan.name}</span>
                </div>
                <h3 className="font-brand text-2xl sm:text-3xl font-bold text-white mb-2">
                  Activate Your Monthly Partnership
                </h3>
                {isCustomAmount ? (
                  <div className="max-w-xs mx-auto mb-4 p-3 rounded-2xl bg-white/5 border border-[#d4af37]/30 text-center">
                    <label htmlFor="customAmountInput" className="block text-[11px] uppercase font-bold text-[#d4af37] mb-1.5">
                      Adjust Custom Covenant Amount ({currencyView})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-xs font-bold">
                        {currencyView}
                      </span>
                      <input
                        id="customAmountInput"
                        type="number"
                        min="100"
                        value={customAmountKes}
                        onChange={(e) => setCustomAmountKes(Math.max(100, Number(e.target.value)))}
                        className="w-full pl-14 pr-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm text-center focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-white/70 text-xs sm:text-sm">
                    Total Seed:{" "}
                    <span className="text-white font-bold">
                      {currencyView === "KES" ? `KES ${Math.round(activeAmountKes).toLocaleString()}` : `$${activeAmountUsd.toFixed(2)} USD`}
                    </span>{" "}
                    per {billingCycle === "yearly" ? "year" : "month"}
                  </p>
                )}
              </div>

              {/* Payment Method Selector */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex p-1.5 rounded-2xl bg-white/[0.08] border border-white/15 w-full max-w-md shadow-inner">
                  <button
                    type="button"
                    onClick={() => setSubMethod("mpesa")}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      subMethod === "mpesa"
                        ? "bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] shadow-md font-extrabold"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>M-Pesa</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                      Active
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubMethod("card")}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      subMethod === "card"
                        ? "bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] shadow-md font-extrabold"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubMethod("paypal")}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      subMethod === "paypal"
                        ? "bg-[#0070ba] text-white shadow-md font-extrabold"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    <span>PayPal</span>
                  </button>
                </div>
              </div>

              {/* METHOD 1: M-PESA */}
              {subMethod === "mpesa" && (
                <div className="space-y-6">
                  {/* Official Paybill Details Tile */}
                  <div className="p-5 rounded-2xl bg-white/[0.06] border border-[#d4af37]/40 shadow-inner">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-[#d4af37]" />
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[#d4af37]">
                          Heavenly God Kingdom Churches · KCB Bank
                        </span>
                      </div>
                      <span className="text-xs text-white/60">
                        Amount: <strong className="text-[#fbf5b7]">KES {Math.round(activeAmountKes).toLocaleString()}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-white/60 uppercase font-semibold block">M-Pesa Paybill No</span>
                          <span className="font-mono text-xl font-extrabold text-[#fbf5b7]">522522</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard("522522", "Paybill 522522")}
                          className="py-1 px-2.5 rounded-lg bg-white/10 hover:bg-[#d4af37] hover:text-[#0c1b33] text-[11px] font-bold transition-all flex items-center gap-1"
                        >
                          {copiedKey === "Paybill 522522" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>Copy</span>
                        </button>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-white/60 uppercase font-semibold block">Account Number</span>
                          <span className="font-mono text-xl font-extrabold text-[#fbf5b7]">1335674365</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard("1335674365", "Account 1335674365")}
                          className="py-1 px-2.5 rounded-lg bg-white/10 hover:bg-[#d4af37] hover:text-[#0c1b33] text-[11px] font-bold transition-all flex items-center gap-1"
                        >
                          {copiedKey === "Account 1335674365" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* M-Pesa Mode Toggle */}
                  <div className="flex items-center justify-center">
                    <div className="inline-flex p-1 rounded-2xl bg-white/[0.08] border border-white/15 w-full">
                      <button
                        type="button"
                        onClick={() => { setMpesaMode("stk"); setStkPending(false); setStkPromptSent(false); setStkStatusMessage(""); }}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          mpesaMode === "stk"
                            ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md"
                            : "text-white/60 hover:text-white"
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Express Auto-Prompt</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 font-extrabold">✨ NEW</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMpesaMode("manual"); setStkPending(false); }}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          mpesaMode === "manual"
                            ? "bg-white/20 text-white shadow-md"
                            : "text-white/60 hover:text-white"
                        }`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Enter Receipt Code</span>
                      </button>
                    </div>
                  </div>

                  {/* STK Push Mode */}
                  {mpesaMode === "stk" && (
                    <form onSubmit={handleMpesaStkPush} className="space-y-4">
                      <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 leading-relaxed flex items-start gap-3">
                        <Zap className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
                        <span>
                          <strong className="text-emerald-200 block mb-0.5">Zero code entry — fully automatic</strong>
                          Enter your Safaricom number and tap the button. Your phone will instantly receive an M-Pesa PIN prompt. Just enter your PIN and your partner dashboard unlocks automatically.
                        </span>
                      </div>

                      <div>
                        <label htmlFor="partnerNameStk" className="block text-xs uppercase font-bold text-white/70 mb-1.5">
                          Full Name / Ministry Name *
                        </label>
                        <input
                          id="partnerNameStk"
                          type="text"
                          value={subscriberName}
                          onChange={(e) => setSubscriberName(e.target.value)}
                          placeholder="Enter your full name"
                          required
                          disabled={stkPending}
                          className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:border-[#d4af37] disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label htmlFor="partnerEmailStk" className="block text-xs uppercase font-bold text-white/70 mb-1.5">
                          Email Address (For receipt &amp; Partner ID) *
                        </label>
                        <input
                          id="partnerEmailStk"
                          type="email"
                          value={subscriberEmail}
                          onChange={(e) => setSubscriberEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          required
                          disabled={stkPending}
                          className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:border-[#d4af37] disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label htmlFor="mpesaPhoneStk" className="block text-xs uppercase font-bold text-white/70 mb-1.5">
                          Safaricom M-Pesa Phone Number *
                        </label>
                        <div className="flex items-stretch gap-2">
                          <span className="flex items-center gap-1 px-3 rounded-2xl bg-white/10 border border-white/15 text-white/60 text-sm font-mono shrink-0">
                            🇰🇪 +254
                          </span>
                          <input
                            id="mpesaPhoneStk"
                            type="tel"
                            value={mpesaPhone}
                            onChange={(e) => setMpesaPhone(e.target.value)}
                            placeholder="7XX XXX XXX"
                            required
                            disabled={stkPending}
                            className="flex-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white font-mono font-bold tracking-wider placeholder:text-white/40 focus:outline-none focus:border-emerald-400 disabled:opacity-50"
                          />
                        </div>
                        <span className="text-[10px] text-white/50 mt-1 block">
                          e.g. 0722000000 or 254722000000 — must be a Safaricom M-Pesa line
                        </span>
                      </div>

                      {stkPending && (
                        <div className="p-4 rounded-2xl bg-amber-900/30 border border-amber-500/40 flex items-center gap-4" role="status" aria-live="polite">
                          {/* Live radar: pulsing rings while awaiting the handset PIN */}
                          <div className="relative w-14 h-14 shrink-0" aria-hidden="true">
                            <span className="absolute inset-0 rounded-full bg-amber-400/25 animate-ping" />
                            <span className="absolute inset-2 rounded-full border border-amber-400/50 animate-ping [animation-delay:300ms]" />
                            <span className="absolute inset-4 rounded-full border border-amber-400/70 animate-ping [animation-delay:600ms]" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Smartphone className="w-5 h-5 text-amber-300" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-amber-300">
                              {stkPromptSent ? "Check your phone — enter your M-Pesa PIN" : "Contacting Safaricom…"}
                            </p>
                            <p className="text-xs text-amber-300/70 mt-0.5">{stkStatusMessage}</p>
                          </div>
                          <div className="text-center shrink-0" aria-label={`${stkSecondsLeft} seconds remaining`}>
                            <div className="font-mono text-lg font-extrabold text-amber-200">
                              00:{stkSecondsLeft < 10 ? `0${stkSecondsLeft}` : stkSecondsLeft}
                            </div>
                            <div className="text-[10px] text-amber-300/60 uppercase font-bold">waiting</div>
                          </div>
                        </div>
                      )}

                      {!stkPending && (
                        <button
                          id="btn-stk-push"
                          type="submit"
                          disabled={submitting}
                          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-600 text-white font-extrabold text-sm sm:text-base tracking-wide shadow-xl hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Sending PIN Prompt to Your Phone…</span>
                            </>
                          ) : (
                            <>
                              <Smartphone className="w-5 h-5" />
                              <span>Send M-Pesa Prompt to My Phone — KES {Math.round(activeAmountKes).toLocaleString()}</span>
                            </>
                          )}
                        </button>
                      )}

                      <p className="text-center text-[11px] text-white/40">
                        Secured by Safaricom STK Push · Paybill 522522 · KCB Bank
                      </p>
                    </form>
                  )}

                  {/* Manual Code Mode */}
                  {mpesaMode === "manual" && (
                    <form onSubmit={handleMpesaSubscription} className="space-y-4">
                      <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/25 text-xs text-blue-300 leading-relaxed">
                        First send <strong>KES {Math.round(activeAmountKes).toLocaleString()}</strong> to Paybill <strong>522522</strong>, Account <strong>1335674365</strong>, then paste the M-Pesa transaction code from your SMS below.
                      </div>

                      <div>
                        <label htmlFor="partnerNameMpesa" className="block text-xs uppercase font-bold text-white/70 mb-1.5">
                          Full Name / Ministry Name *
                        </label>
                        <input
                          id="partnerNameMpesa"
                          type="text"
                          value={subscriberName}
                          onChange={(e) => setSubscriberName(e.target.value)}
                          placeholder="Enter your full name"
                          required
                          className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>

                      <div>
                        <label htmlFor="partnerEmailMpesa" className="block text-xs uppercase font-bold text-white/70 mb-1.5">
                          Email Address (For receipt &amp; Partner ID Card) *
                        </label>
                        <input
                          id="partnerEmailMpesa"
                          type="email"
                          value={subscriberEmail}
                          onChange={(e) => setSubscriberEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          required
                          className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>

                      <div>
                        <label htmlFor="mpesaRefInput" className="block text-xs uppercase font-bold text-white/70 mb-1.5">
                          M-Pesa Transaction Code *
                        </label>
                        <input
                          id="mpesaRefInput"
                          type="text"
                          value={mpesaRefCode}
                          onChange={(e) => setMpesaRefCode(e.target.value.toUpperCase())}
                          placeholder="e.g. SI84XYZ123"
                          required
                          className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white font-mono font-bold tracking-wider placeholder:text-white/40 focus:outline-none focus:border-[#d4af37]"
                        />
                        <span className="text-[10px] text-white/50 mt-1 block">
                          10-character code in the M-Pesa confirmation SMS (e.g. TK78AB12CD)
                        </span>
                      </div>

                      <button
                        id="btn-mpesa-verify"
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] text-[#0c1b33] font-bold text-sm sm:text-base tracking-wide shadow-xl hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Verifying M-Pesa Payment…</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5" />
                            <span>Verify &amp; Activate Partner Dashboard</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* METHOD 2: CARD (PAYSTACK) */}
              {subMethod === "card" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handlePaystack();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor="cardSubscriberName" className="block text-xs uppercase font-bold text-white/70 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      id="cardSubscriberName"
                      type="text"
                      value={subscriberName}
                      onChange={(e) => setSubscriberName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                      className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label htmlFor="cardSubscriberEmail" className="block text-xs uppercase font-bold text-white/70 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      id="cardSubscriberEmail"
                      type="email"
                      value={subscriberEmail}
                      onChange={(e) => setSubscriberEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      required
                      className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] text-[#0c1b33] font-bold text-sm sm:text-base tracking-wide shadow-xl hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Initializing Secure Checkout...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        <span>
                          Subscribe via Card ({currencyView === "KES" ? `KES ${Math.round(activeAmountKes).toLocaleString()}` : `$${activeAmountUsd} USD`})
                        </span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* METHOD 3: PAYPAL */}
              {subMethod === "paypal" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-400/20 text-xs text-blue-200">
                    International covenant partners can subscribe securely in USD (${activeAmountUsd.toFixed(2)}/month) via PayPal.
                  </div>
                  <button
                    type="button"
                    onClick={handlePayPal}
                    disabled={submitting}
                    className="w-full py-3.5 rounded-2xl bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <span>Launch PayPal Checkout (${activeAmountUsd.toFixed(2)} USD)</span>
                  </button>
                  <div id="paypal-subscription-container" className="pt-2" />
                </div>
              )}

              <div className="flex items-center justify-center gap-6 pt-6 text-xs text-white/50 border-t border-white/10 mt-6">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  256-Bit SSL Encryption
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-[#d4af37]" />
                  Cancel Anytime
                </span>
              </div>
            </div>
          </div>
        </section>
      )}



      {/* Verified Partner ID Card Modal */}
      {showIdCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0c1b33] via-[#112440] to-[#1a1208] border-2 border-[#d4af37] shadow-[0_0_50px_rgba(212,175,55,0.3)] text-white">
            <button
              type="button"
              onClick={() => setShowIdCardModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <img
                src={brandLogo}
                alt="Kingdom Missions Network"
                className="w-16 h-16 rounded-2xl mx-auto mb-3 object-contain border-2 border-[#d4af37] p-1.5 bg-[#0c1b33] drop-shadow-[0_0_16px_rgba(212,175,55,0.5)]"
                width="64"
                height="64"
              />
              <h3 className="font-brand text-2xl font-bold text-white">Official Partner Credential</h3>
              <p className="text-xs text-emerald-400 font-semibold mt-1">
                {isSubscribed ? "✓ Covenant Partnership Activated" : "Official Verification Ready"}
              </p>
            </div>

            {/* Credential Card Display */}
            <div className="p-6 rounded-2xl bg-white/[0.05] border border-white/15 space-y-4 mb-6 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
                <img src={brandLogo} alt="" className="w-36 h-36 object-contain" />
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-10">
                <div className="flex items-center gap-2.5">
                  <img src={brandLogo} alt="" className="w-6 h-6 object-contain" width="24" height="24" />
                  <span className="font-brand text-sm font-bold text-white">KINGDOM MISSIONS NETWORK</span>
                </div>
                <span className="text-[10px] font-bold text-[#d4af37] tracking-wider uppercase">{activePlan.badge}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-white/50 block font-semibold">Partner Name</span>
                <span className="font-outfit text-base font-bold text-white">{subscriberName || user?.name || "Partner"}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-white/50 block font-semibold">Deployment Level</span>
                  <span className="font-bold text-[#fbf5b7]">{isCustomAmount ? "Custom Partner" : activePlan.name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-white/50 block font-semibold">Oversight</span>
                  <span className="font-bold text-white/90">Bishop Dr. George Githinji</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] text-[#0c1b33] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  <span>Print / Save Credential</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowIdCardModal(false)}
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition-colors"
                >
                  Done
                </button>
              </div>
              <Link
                to="/partner-portal"
                className="block text-center text-xs text-[#d4af37] hover:underline font-semibold"
              >
                Go to Partner Covenant Dashboard →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Transition Modal */}
      {onboardingStage !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md p-8 rounded-3xl bg-[#0c1b33] border border-[#d4af37]/50 text-center text-white shadow-2xl">
            <Loader2 className="w-12 h-12 text-[#d4af37] animate-spin mx-auto mb-4" />
            <h4 className="font-brand text-2xl font-bold mb-2">Activating Your Covenant Partnership</h4>
            <p className="text-white/70 text-xs sm:text-sm mb-6">
              {onboardingStage === 1 && "Verifying contribution transaction..."}
              {onboardingStage === 2 && "Registering membership on the global covenant ledger..."}
              {onboardingStage === 3 && "Generating your official digital Partner ID Card..."}
              {onboardingStage === 4 && "Provisioning your partner covenant dashboard..."}
            </p>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#d4af37] to-emerald-400 h-2 transition-all duration-500"
                style={{ width: `${(onboardingStage / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
