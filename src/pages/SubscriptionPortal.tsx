import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
  Crown,
  Check,
  Sparkles,
  Heart,
  Globe,
  Loader2,
  ShieldCheck,
  Copy,
  Smartphone,
  CreditCard,
  Building2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Printer,
  CheckCircle2,
  Clock,
  RotateCcw,
  X,
  BadgeCheck,
} from "lucide-react";
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
    tagline: "Foundational Mission & Bread Relief",
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
      "International Preaching Logistics & Pastoral Network Facilitation",
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

const GIVING_PURPOSES = [
  { id: "general", label: "General Missions Outreach", icon: "🕊️" },
  { id: "tithe", label: "Tithes & Love Offerings", icon: "🌾" },
  { id: "crusades", label: "Village Crusades & Outreaches", icon: "🔥" },
  { id: "relief", label: "Bread of Life Food Aid", icon: "🍞" },
  { id: "pastoral", label: "Pastoral & Missionary Travel", icon: "⛪" },
  { id: "bibles", label: "Bibles & Discipleship", icon: "📖" },
];

const ONE_TIME_PRESETS = [500, 1000, 2500, 5000, 10000];

interface ReceiptInfo {
  reference: string;
  donorName: string;
  donorEmail: string;
  amountKes: number;
  amountUsd: number;
  givingType: "onetime" | "monthly" | "yearly";
  purpose: string;
  paymentMethod: string;
  date: string;
}

type CheckoutStep = "plans" | "checkout" | "success";

/** Canonical step parsing — supports new (?step=checkout) + legacy (?step=payment, ?step=2) deep-links */
function parseStepParam(raw: string | null): CheckoutStep | null {
  if (!raw) return null;
  const v = raw.toLowerCase().trim();
  if (v === "checkout" || v === "payment" || v === "2" || v === "pay") return "checkout";
  if (v === "plans" || v === "1" || v === "select" || v === "plan") return "plans";
  if (v === "success" || v === "3" || v === "receipt" || v === "done") return "success";
  return null;
}

function yearlyPrice(monthlyKes: number) {
  return Math.round(monthlyKes * 12 * 0.85);
}

export default function SubscriptionPortal() {
  const { user, setSession } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Step state (plans ↔ checkout ↔ success), zero endless scrolling ──
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(() => {
    return parseStepParam(searchParams.get("step")) ?? "plans";
  });

  const isGiveRoute = location.pathname.startsWith("/give");
  const [givingType, setGivingType] = useState<"onetime" | "monthly" | "yearly">(() => {
    const t = (searchParams.get("type") || searchParams.get("interval") || "").toLowerCase();
    if (t === "onetime" || t === "one-time" || t === "once" || isGiveRoute) {
      // /give defaults to one-time unless an explicit recurring type is present
      if (t === "monthly" || t === "yearly") return t;
      return "onetime";
    }
    if (t === "yearly" || t === "annual" || t === "annually") return "yearly";
    return "monthly";
  });

  const [selectedPurpose, setSelectedPurpose] = useState<string>(() => {
    return searchParams.get("purpose") || "General Missions Outreach";
  });

  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    const p = searchParams.get("plan");
    return PARTNER_PLANS.some((x) => x.id === p) ? (p as string) : "ambassador";
  });

  const [oneTimeAmount, setOneTimeAmount] = useState<number>(() => {
    const amt = Number(searchParams.get("amount"));
    return amt > 0 ? amt : 2500;
  });
  const [isCustomAmount, setIsCustomAmount] = useState<boolean>(false);
  const [customAmountVal, setCustomAmountVal] = useState<number>(() => {
    const amt = Number(searchParams.get("amount"));
    return amt > 0 && ![500, 1000, 2500, 5000, 10000].includes(amt) ? amt : 3000;
  });

  const [currencyView, setCurrencyView] = useState<"KES" | "USD">("KES");
  const [exchangeRate, setExchangeRate] = useState<number>(0.00772);

  const [donorName, setDonorName] = useState(user?.name || "");
  const [donorEmail, setDonorEmail] = useState(user?.email || "");
  const [submitting, setSubmitting] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "card" | "manual" | "paypal">("mpesa");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [stkPending, setStkPending] = useState(false);
  const [stkStatusMessage, setStkStatusMessage] = useState("");
  const [stkSecondsLeft, setStkSecondsLeft] = useState(60);
  const [manualRefCode, setManualRefCode] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptInfo | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(8);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep URL canonical: ?step=plans|checkout&plan=&type=&amount=
  const syncUrl = (step: CheckoutStep, type: string, planId: string, amount?: number) => {
    const params: Record<string, string> = { step, type, plan: planId };
    if (type === "onetime" && amount) params.amount = String(amount);
    const purpose = selectedPurposeRef.current;
    if (type === "onetime" && purpose) params.purpose = purpose;
    setSearchParams(params, { replace: false });
  };
  const selectedPurposeRef = useRef(selectedPurpose);
  selectedPurposeRef.current = selectedPurpose;

  useEffect(() => {
    if (user?.name && !donorName) setDonorName(user.name);
    if (user?.email && !donorEmail) setDonorEmail(user.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    api.subscriptions
      .getPricing(1000)
      .then((data) => {
        if (data.exchangeRate) setExchangeRate(data.exchangeRate);
      })
      .catch(() => setExchangeRate(0.00772));

    if (paystackKey && !window.PaystackPop) {
      const s = document.createElement("script");
      s.src = "https://js.paystack.co/v1/inline.js";
      s.async = true;
      document.body.appendChild(s);
      return () => {
        if (document.body.contains(s)) document.body.removeChild(s);
      };
    }
  }, []);

  // Clear STK timers on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const activePlan = PARTNER_PLANS.find((p) => p.id === selectedPlanId) || PARTNER_PLANS[1];
  let currentAmountKes: number;
  if (givingType === "onetime") {
    currentAmountKes = isCustomAmount ? customAmountVal : oneTimeAmount;
  } else {
    currentAmountKes = givingType === "yearly" ? yearlyPrice(activePlan.kesMonthly) : activePlan.kesMonthly;
  }
  const currentAmountUsd = Number((currentAmountKes * exchangeRate).toFixed(2));

  const nextChargeDate = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + (givingType === "yearly" ? 12 : 1));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  })();

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
    showToast(`${label} copied!`, "success");
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleGivingTypeChange = (type: "onetime" | "monthly" | "yearly") => {
    setGivingType(type);
    // Live-update URL without forcing a step change (in-place toggle works on both steps)
    const amt = type === "onetime" ? (isCustomAmount ? customAmountVal : oneTimeAmount) : undefined;
    syncUrl(currentStep, type, selectedPlanId, amt);
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setSearchParams(
      { step: currentStep, type: givingType, plan: planId },
      { replace: true }
    );
  };

  const handleProceedToCheckout = () => {
    if (currentAmountKes < 50) {
      showToast("Minimum gift amount is KES 50", "error");
      return;
    }
    setCurrentStep("checkout");
    syncUrl("checkout", givingType, selectedPlanId, givingType === "onetime" ? currentAmountKes : undefined);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToPlans = () => {
    setCurrentStep("plans");
    syncUrl("plans", givingType, selectedPlanId, givingType === "onetime" ? currentAmountKes : undefined);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const stopStkTimers = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    pollRef.current = null;
    timerRef.current = null;
  };

  const handleCancelStk = () => {
    stopStkTimers();
    setStkPending(false);
    setSubmitting(false);
    setStkStatusMessage("");
    showToast("M-Pesa prompt cancelled. You can retry or use Paybill.", "info");
  };

  const completeTransaction = (reference: string, provider: string, verifiedUser?: Record<string, unknown> | null, token?: string | null) => {
    stopStkTimers();
    if (token && verifiedUser) {
      const authUser = {
        id: (verifiedUser.id as number) || (verifiedUser._id as number) || 1,
        name: (verifiedUser.name as string) || donorName || "Kingdom Partner",
        email: (verifiedUser.email as string) || donorEmail,
        role: ((verifiedUser.role === "admin" || verifiedUser.role === "superadmin") ? verifiedUser.role : "member") as "member" | "admin" | "superadmin",
      };
      setSession(authUser, token);
    }

    setReceipt({
      reference,
      donorName: donorName || "Kingdom Giver",
      donorEmail: donorEmail || "info@kingdommissionnetwork.org",
      amountKes: currentAmountKes,
      amountUsd: currentAmountUsd,
      givingType,
      purpose: givingType === "onetime" ? selectedPurpose : `${activePlan.name} (${givingType})`,
      paymentMethod: provider,
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    setStkPending(false);
    setSubmitting(false);
    setCurrentStep("success");
    setRedirectCountdown(8);
    setSearchParams({ step: "success", type: givingType, plan: selectedPlanId }, { replace: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("Payment confirmed! Thank you for your kingdom seed.", "success");
  };

  // Automatic partner dashboard unlock — countdown then redirect (recurring only)
  useEffect(() => {
    if (currentStep !== "success" || !receipt || givingType === "onetime") return;
    setRedirectCountdown(8);
    const iv = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(iv);
          navigate("/subscriber-dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [currentStep, receipt, givingType, navigate]);

  const handleMpesaStk = async () => {
    if (!mpesaPhone || mpesaPhone.trim().length < 9) {
      showToast("Please enter a valid Safaricom phone number (e.g. 0712345678)", "error");
      return;
    }
    if (!donorEmail || !donorEmail.includes("@")) {
      showToast("Please enter a valid email address for your receipt", "error");
      return;
    }

    setSubmitting(true);
    setStkPending(true);
    setStkSecondsLeft(90);
    setStkStatusMessage("Contacting Safaricom M-Pesa gateway...");

    try {
      const res = await api.subscriptions.initiateMpesaStk({
        phoneNumber: mpesaPhone.trim(),
        name: donorName || "Kingdom Partner",
        email: donorEmail.trim(),
        amount: currentAmountKes,
        planName: givingType === "onetime" ? `Offering: ${selectedPurpose}` : activePlan.name,
        planId: givingType === "onetime" ? "onetime_seed" : activePlan.id,
        interval: givingType === "yearly" ? "yearly" : "monthly",
      });

      setStkStatusMessage("Prompt sent to your phone! Enter your M-Pesa PIN to authorize.");
      const checkoutId = res.checkoutRequestId;

      stopStkTimers();
      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await api.subscriptions.queryMpesaStk(checkoutId);
          if (pollRes.status === "completed") {
            stopStkTimers();
            completeTransaction(
              pollRes.receiptCode || checkoutId,
              "M-Pesa STK Push",
              pollRes.user as Record<string, unknown>,
              pollRes.token
            );
          } else if (pollRes.status === "failed") {
            stopStkTimers();
            setStkPending(false);
            setSubmitting(false);
            showToast("M-Pesa payment cancelled or failed. Please try again.", "error");
          }
        } catch {
          // ignore transient errors during polling
        }
      }, 3000);

      timerRef.current = setInterval(() => {
        setStkSecondsLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            if (pollRef.current) clearInterval(pollRef.current);
            setStkPending(false);
            setSubmitting(false);
            setStkStatusMessage("Prompt timed out. If you entered your PIN, verify using your M-Pesa code below.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setStkPending(false);
      setSubmitting(false);
      showToast("Failed to initiate M-Pesa prompt. You can give via Paybill 522522 directly.", "error");
    }
  };

  const handleCardPayment = async () => {
    if (!donorEmail || !donorEmail.includes("@")) {
      showToast("Please enter a valid email address", "error");
      return;
    }
    setSubmitting(true);
    try {
      const initData = await api.subscriptions.initialize({
        email: donorEmail.trim(),
        name: donorName || "Kingdom Partner",
        amount: currentAmountKes,
        currency: "KES",
        interval: givingType === "yearly" ? "yearly" : "monthly",
        planId: givingType === "onetime" ? "onetime_seed" : activePlan.id,
        planName: givingType === "onetime" ? `Gift: ${selectedPurpose}` : activePlan.name,
      });

      if (window.PaystackPop && initData.reference) {
        const handler = window.PaystackPop.setup({
          key: paystackKey,
          email: donorEmail.trim(),
          amount: currentAmountKes * 100,
          currency: "KES",
          ref: initData.reference,
          callback: async (response: { reference: string }) => {
            try {
              const verifyRes = await api.subscriptions.verify(response.reference);
              if (verifyRes.status === "success") {
                completeTransaction(response.reference, "Card (Paystack)", verifyRes.user as Record<string, unknown>, verifyRes.token);
              } else {
                completeTransaction(response.reference, "Card (Paystack)", null, null);
              }
            } catch {
              completeTransaction(response.reference, "Card (Paystack)", null, null);
            }
          },
          onClose: () => {
            showToast("Payment window closed.", "info");
            setSubmitting(false);
          },
        });
        handler.openIframe();
      } else if (initData.authorization_url) {
        window.location.href = initData.authorization_url;
      }
    } catch {
      showToast("Could not start card checkout. Please try again or use M-Pesa.", "error");
      setSubmitting(false);
    }
  };

  const handleManualVerification = async () => {
    if (!manualRefCode || manualRefCode.trim().length < 5) {
      showToast("Please enter your M-Pesa transaction code or bank reference", "error");
      return;
    }
    setSubmitting(true);
    try {
      await api.payments.reportOffline({
        amount: currentAmountKes,
        currency: "KES",
        donor_name: donorName || "Kingdom Partner",
        donor_email: donorEmail || "partner@kingdommissionnetwork.org",
        payment_provider: "mpesa_paybill",
        payment_reference: manualRefCode.trim().toUpperCase(),
        recurring: givingType !== "onetime",
        notes: givingType === "onetime" ? selectedPurpose : activePlan.name,
      });
      completeTransaction(manualRefCode.trim().toUpperCase(), "M-Pesa Paybill 522522", null, null);
    } catch {
      completeTransaction(manualRefCode.trim().toUpperCase(), "M-Pesa Paybill 522522", null, null);
    }
  };

  const handlePayPal = async () => {
    setSubmitting(true);
    try {
      const order = await api.subscriptions.paypalCreate({
        name: donorName || "Kingdom Partner",
        email: donorEmail || "partner@kingdommissionnetwork.org",
        amount: currentAmountKes,
        planName: givingType === "onetime" ? `Gift: ${selectedPurpose}` : activePlan.name,
      });

      if (window.paypal) {
        window.paypal
          .Buttons({
            createOrder: () => Promise.resolve(order.id),
            onApprove: async (data: { orderID: string }) => {
              try {
                const capture = await api.subscriptions.paypalCapture({
                  orderId: data.orderID,
                  subscriberName: donorName || "Kingdom Partner",
                });
                completeTransaction(capture.id || data.orderID, "PayPal", capture.user as Record<string, unknown>, capture.token);
              } catch {
                completeTransaction(data.orderID, "PayPal", null, null);
              }
            },
            onError: () => {
              showToast("PayPal transaction was not completed.", "error");
              setSubmitting(false);
            },
          })
          .render("#paypal-button-mount");
      } else {
        showToast("PayPal service loading, please try in a moment.", "info");
        setSubmitting(false);
      }
    } catch {
      showToast("Unable to initialize PayPal.", "error");
      setSubmitting(false);
    }
  };

  const stepIndex = currentStep === "plans" ? 1 : currentStep === "checkout" ? 2 : 3;

  return (
    <div className="pt-[68px] md:pt-[96px] min-h-screen bg-[#071324] text-white flex flex-col justify-between">
      <SEO
        title={
          givingType === "onetime"
            ? "Give Online — Kingdom Missions Network"
            : "Covenant Partnership — Kingdom Missions Network"
        }
        description="Support frontline evangelism, gospel bread relief, and village crusades. Instant M-Pesa STK push and official tax receipts."
      />

      <div className="relative py-6 sm:py-10 px-4 sm:px-6 grow">
        <AmbientParticles />

        <div className="w-full max-w-6xl mx-auto relative z-10">
          {/* STEP INDICATOR — plans ↔ checkout ↔ receipt (clickable back nav) */}
          <div className="mb-6 max-w-xl mx-auto">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-white/60 mb-2">
              <button
                type="button"
                onClick={handleBackToPlans}
                className={`flex items-center gap-1.5 ${stepIndex >= 1 ? "text-[#d4af37]" : ""}`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  stepIndex > 1 ? "bg-emerald-500 text-white" : stepIndex === 1 ? "bg-[#d4af37] text-[#0c1b33]" : "bg-white/20"
                }`}>
                  {stepIndex > 1 ? "✓" : "1"}
                </span>
                Choose Plan
              </button>
              <div className={`h-0.5 flex-1 mx-3 ${stepIndex >= 2 ? "bg-[#d4af37]" : "bg-white/10"}`} />
              <span className={`flex items-center gap-1.5 ${stepIndex >= 2 ? "text-[#d4af37]" : ""}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  stepIndex > 2 ? "bg-emerald-500 text-white" : stepIndex === 2 ? "bg-[#d4af37] text-[#0c1b33]" : "bg-white/20"
                }`}>
                  {stepIndex > 2 ? "✓" : "2"}
                </span>
                Checkout
              </span>
              <div className={`h-0.5 flex-1 mx-3 ${stepIndex === 3 ? "bg-emerald-500" : "bg-white/10"}`} />
              <span className={`flex items-center gap-1.5 ${stepIndex === 3 ? "text-emerald-400" : ""}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  stepIndex === 3 ? "bg-emerald-500 text-white" : "bg-white/20"
                }`}>
                  3
                </span>
                Receipt
              </span>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              STEP 1: PLANS — compact selector, no endless scrolling
              ═══════════════════════════════════════════════════════════ */}
          {currentStep === "plans" && (
            <div className="bg-[#0c1b33]/90 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in duration-300">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#fbf5b7] text-xs font-bold uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                  Kingdom Missions Network
                </div>
                <h1 className="font-brand text-2xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">
                  {givingType === "onetime" ? "Give & Sow Your Kingdom Seed" : "Covenant Partnership Enrollment"}
                </h1>
                <p className="text-white/70 text-xs sm:text-sm max-w-lg mx-auto">
                  100% of your gift directly powers village crusades, missionary transit, and humanitarian bread relief.
                </p>
              </div>

              {/* Mode switcher: One-time vs Monthly vs Annual */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex p-1.5 rounded-2xl bg-white/[0.08] border border-white/15 w-full max-w-lg shadow-inner">
                  <button
                    type="button"
                    onClick={() => handleGivingTypeChange("onetime")}
                    className={`flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                      givingType === "onetime"
                        ? "bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] text-[#0c1b33] shadow-md"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    <Heart className="w-4 h-4" />
                    <span>One-Time</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGivingTypeChange("monthly")}
                    className={`flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                      givingType === "monthly"
                        ? "bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] text-[#0c1b33] shadow-md"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    <Crown className="w-4 h-4" />
                    <span>Monthly</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGivingTypeChange("yearly")}
                    className={`flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                      givingType === "yearly"
                        ? "bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] text-[#0c1b33] shadow-md"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    <BadgeCheck className="w-4 h-4" />
                    <span>Annual −15%</span>
                  </button>
                </div>
              </div>

              {givingType === "onetime" && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-[#fbf5b7] uppercase tracking-wider mb-2">
                      Giving designation:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {GIVING_PURPOSES.map((purpose) => (
                        <button
                          key={purpose.id}
                          type="button"
                          onClick={() => setSelectedPurpose(purpose.label)}
                          className={`p-3 rounded-xl text-left text-xs font-bold border transition-all flex items-center gap-2.5 ${
                            selectedPurpose === purpose.label
                              ? "bg-[#d4af37]/20 border-[#d4af37] text-white shadow-md"
                              : "bg-white/[0.04] border-white/10 text-white/75 hover:bg-white/[0.08]"
                          }`}
                        >
                          <span className="text-base">{purpose.icon}</span>
                          <span className="truncate">{purpose.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-[#fbf5b7] uppercase tracking-wider">Amount:</label>
                      <div className="flex items-center gap-1 text-xs">
                        <button type="button" onClick={() => setCurrencyView("KES")}
                          className={`px-2 py-0.5 rounded font-bold ${currencyView === "KES" ? "bg-[#d4af37] text-[#0c1b33]" : "text-white/50"}`}>
                          KES
                        </button>
                        <span className="text-white/30">|</span>
                        <button type="button" onClick={() => setCurrencyView("USD")}
                          className={`px-2 py-0.5 rounded font-bold ${currencyView === "USD" ? "bg-[#d4af37] text-[#0c1b33]" : "text-white/50"}`}>
                          USD
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                      {ONE_TIME_PRESETS.map((amt) => {
                        const isSelected = !isCustomAmount && oneTimeAmount === amt;
                        const usdVal = (amt * exchangeRate).toFixed(0);
                        return (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => { setIsCustomAmount(false); setOneTimeAmount(amt); }}
                            className={`py-3 px-2 rounded-2xl border text-center transition-all ${
                              isSelected
                                ? "bg-gradient-to-br from-[#d4af37] to-[#b38a1f] text-[#0c1b33] border-white font-extrabold shadow-lg scale-[1.02]"
                                : "bg-white/[0.05] border-white/10 text-white hover:bg-white/[0.1] font-semibold"
                            }`}
                          >
                            <div className="text-sm sm:text-base font-bold">
                              {currencyView === "KES" ? `KES ${amt.toLocaleString()}` : `$${usdVal}`}
                            </div>
                            <div className="text-[10px] opacity-75">
                              {currencyView === "KES" ? `~$${usdVal} USD` : `~${amt.toLocaleString()} KES`}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {!isCustomAmount ? (
                      <button type="button" onClick={() => setIsCustomAmount(true)}
                        className="w-full py-2.5 px-4 rounded-xl border border-dashed border-white/25 text-xs text-white/70 hover:text-white hover:border-[#d4af37] transition-all font-semibold text-center">
                        + Enter Custom Amount
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.05] border border-[#d4af37]/50">
                        <span className="text-sm font-bold text-[#d4af37]">KES</span>
                        <input type="number" min="50" step="100" value={customAmountVal}
                          onChange={(e) => setCustomAmountVal(Math.max(50, Number(e.target.value)))}
                          placeholder="Enter amount in KES"
                          className="w-full bg-transparent text-white font-bold text-base focus:outline-none" />
                        <span className="text-xs text-white/50 shrink-0">~${(customAmountVal * exchangeRate).toFixed(2)} USD</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {givingType !== "onetime" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                    {PARTNER_PLANS.map((plan) => {
                      const isSelected = selectedPlanId === plan.id;
                      const billedKes = givingType === "yearly" ? yearlyPrice(plan.kesMonthly) : plan.kesMonthly;
                      const billedUsd = (billedKes * exchangeRate).toFixed(1);
                      return (
                        <div
                          key={plan.id}
                          onClick={() => handleSelectPlan(plan.id)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSelectPlan(plan.id); }}
                          role="button"
                          tabIndex={0}
                          aria-pressed={isSelected}
                          className={`relative p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected
                              ? "bg-gradient-to-b from-[#11284d] to-[#0c1b33] border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.25)] scale-[1.02]"
                              : "bg-white/[0.04] border-white/10 hover:border-white/20"
                          }`}
                        >
                          {plan.isPopular && (
                            <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f59e0b] text-[#0c1b33] text-[10px] font-extrabold uppercase">
                              Most Popular
                            </span>
                          )}
                          <div>
                            <div className="text-xs font-bold text-[#d4af37] mb-1">{plan.badge}</div>
                            <div className="font-brand text-base font-bold text-white mb-2">{plan.name}</div>
                            <div className="font-extrabold text-2xl text-white mb-1">
                              KES {billedKes.toLocaleString()}
                              <span className="text-xs font-normal text-white/60">/{givingType === "yearly" ? "yr" : "mo"}</span>
                            </div>
                            <div className="text-xs text-white/50 mb-3">
                              ~${billedUsd} USD{givingType === "yearly" ? " · save 15%" : ""}
                            </div>
                            <p className="text-[11px] text-white/70 line-clamp-2 leading-relaxed mb-4">{plan.impactHighlight}</p>
                          </div>
                          <div className="pt-3 border-t border-white/10 space-y-1.5 text-[11px] text-white/80">
                            {plan.perks.slice(0, 2).map((perk) => (
                              <div key={perk} className="flex items-start gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{perk}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-white/70 text-center sm:text-left">
                  <span>Selected: </span>
                  <span className="font-bold text-[#fbf5b7]">
                    {givingType === "onetime"
                      ? `${selectedPurpose} — KES ${currentAmountKes.toLocaleString()} (~$${currentAmountUsd} USD)`
                      : `${activePlan.name} — KES ${currentAmountKes.toLocaleString()} (${givingType})`}
                  </span>
                </div>
                <button type="button" onClick={handleProceedToCheckout}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c5961d] text-[#0c1b33] font-extrabold text-sm sm:text-base hover:scale-105 hover:shadow-[0_0_25px_rgba(212,175,55,0.45)] transition-all flex items-center justify-center gap-2 shadow-xl">
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              STEP 2: CHECKOUT — Zoom/ChatGPT split:
              LEFT = contact + payment methods | RIGHT = sticky summary w/ billing toggle
              ═══════════════════════════════════════════════════════════ */}
          {currentStep === "checkout" && (
            <div className="bg-[#0c1b33]/90 backdrop-blur-xl border border-white/15 rounded-3xl p-5 sm:p-8 shadow-2xl animate-in fade-in duration-300">
              <button type="button" onClick={handleBackToPlans}
                className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-[#d4af37] transition-colors mb-5 font-semibold">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← Change {givingType === "onetime" ? "Amount" : "Plan"}</span>
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
                {/* ── LEFT: partner contact + payment methods ── */}
                <div className="space-y-5 min-w-0">
                  <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10">
                    <h2 className="text-sm font-extrabold text-white mb-1">Partner details</h2>
                    <p className="text-[11px] text-white/55 mb-4">Receipt and dashboard access go here. Guest checkout — no account needed.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="donor-name" className="block text-xs font-bold text-white/80 mb-1">Full name</label>
                        <input id="donor-name" type="text" value={donorName} onChange={(e) => setDonorName(e.target.value)}
                          placeholder="e.g. John Kariuki" autoComplete="name"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs sm:text-sm focus:outline-none focus:border-[#d4af37] placeholder:text-white/30" />
                      </div>
                      <div>
                        <label htmlFor="donor-email" className="block text-xs font-bold text-white/80 mb-1">Email for receipt</label>
                        <input id="donor-email" type="email" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)}
                          placeholder="e.g. john@example.com" autoComplete="email"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs sm:text-sm focus:outline-none focus:border-[#d4af37] placeholder:text-white/30" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#fbf5b7] uppercase tracking-wider mb-2">
                      Payment method
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3" role="tablist" aria-label="Payment methods">
                      <button type="button" role="tab" aria-selected={paymentMethod === "mpesa"} onClick={() => setPaymentMethod("mpesa")}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          paymentMethod === "mpesa" ? "bg-emerald-600/20 border-emerald-400 text-white shadow-md font-bold" : "bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/[0.08]"
                        }`}>
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                        <span className="text-[11px]">M-Pesa STK</span>
                      </button>
                      <button type="button" role="tab" aria-selected={paymentMethod === "card"} onClick={() => setPaymentMethod("card")}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          paymentMethod === "card" ? "bg-[#d4af37]/20 border-[#d4af37] text-white shadow-md font-bold" : "bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/[0.08]"
                        }`}>
                        <CreditCard className="w-4 h-4 text-[#d4af37]" />
                        <span className="text-[11px]">Card / Online</span>
                      </button>
                      <button type="button" role="tab" aria-selected={paymentMethod === "manual"} onClick={() => setPaymentMethod("manual")}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          paymentMethod === "manual" ? "bg-blue-600/20 border-blue-400 text-white shadow-md font-bold" : "bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/[0.08]"
                        }`}>
                        <Building2 className="w-4 h-4 text-blue-400" />
                        <span className="text-[11px]">KCB Paybill</span>
                      </button>
                      <button type="button" role="tab" aria-selected={paymentMethod === "paypal"} onClick={() => setPaymentMethod("paypal")}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          paymentMethod === "paypal" ? "bg-sky-600/20 border-sky-400 text-white shadow-md font-bold" : "bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/[0.08]"
                        }`}>
                        <Globe className="w-4 h-4 text-sky-400" />
                        <span className="text-[11px]">PayPal (USD)</span>
                      </button>
                    </div>

                    {paymentMethod === "mpesa" && (
                      <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-4">
                        {!stkPending ? (
                          <>
                            <div>
                              <label htmlFor="mpesa-phone" className="block text-xs font-bold text-emerald-300 mb-1">
                                Safaricom M-Pesa phone number
                              </label>
                              <div className="relative">
                                <input id="mpesa-phone" type="tel" value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)}
                                  placeholder="e.g. 0712345678 or 254712345678" autoComplete="tel"
                                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-emerald-400/40 text-white font-bold text-sm focus:outline-none focus:border-emerald-400 placeholder:text-white/30 placeholder:font-normal" />
                                <span className="absolute right-3 top-2.5 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                                  Instant STK Push
                                </span>
                              </div>
                              <p className="text-[11px] text-white/60 mt-1">
                                Instant pop-up on your handset to authorize KES {currentAmountKes.toLocaleString()}.
                              </p>
                            </div>
                            <button type="button" onClick={handleMpesaStk} disabled={submitting}
                              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-extrabold text-sm transition-all shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01]">
                              {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" /><span>Sending STK Prompt...</span></>)
                              : (<><Smartphone className="w-4 h-4" /><span>Send M-Pesa Prompt (KES {currentAmountKes.toLocaleString()})</span></>)}
                            </button>
                          </>
                        ) : (
                          /* Live radar visualizer + countdown — auto-prompt state */
                          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-400/40 text-center space-y-3" role="status" aria-live="polite">
                            <div className="relative w-28 h-28 mx-auto" aria-hidden="true">
                              <span className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
                              <span className="absolute inset-3 rounded-full border border-emerald-400/40 animate-ping [animation-delay:300ms]" />
                              <span className="absolute inset-6 rounded-full border border-emerald-400/60 animate-ping [animation-delay:600ms]" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative w-20 h-20">
                                  <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
                                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="7" />
                                    <circle cx="40" cy="40" r="34" fill="none" stroke="#34d399" strokeWidth="7" strokeLinecap="round"
                                      strokeDasharray={2 * Math.PI * 34}
                                      strokeDashoffset={(2 * Math.PI * 34) * (1 - stkSecondsLeft / 90)}
                                      className="transition-all duration-1000" />
                                  </svg>
                                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <Smartphone className="w-5 h-5 text-emerald-300 animate-bounce" />
                                    <span className="font-mono text-sm font-extrabold text-emerald-300">
                                      {String(Math.floor(stkSecondsLeft / 60)).padStart(2, "0")}:{String(stkSecondsLeft % 60).padStart(2, "0")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-emerald-300">Check your phone now!</div>
                              <div className="text-xs text-white/80 mt-0.5">{stkStatusMessage}</div>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 text-emerald-400 font-mono text-xs font-bold">
                                <Clock className="w-3.5 h-3.5" />
                                <span>waiting for PIN… 00:{stkSecondsLeft < 10 ? `0${stkSecondsLeft}` : stkSecondsLeft}</span>
                              </div>
                            </div>
                            <button type="button" onClick={handleCancelStk}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all">
                              <X className="w-3.5 h-3.5" />
                              <span>Cancel prompt</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {paymentMethod === "card" && (
                      <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                        <div className="flex items-center gap-2 text-xs text-white/80">
                          <CreditCard className="w-4 h-4 text-[#d4af37]" />
                          <span>Accepts Visa, MasterCard, and Apple Pay worldwide.</span>
                        </div>
                        <button type="button" onClick={handleCardPayment} disabled={submitting}
                          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c5961d] text-[#0c1b33] font-extrabold text-sm transition-all shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01] disabled:opacity-60">
                          {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" /><span>Opening Secure Gateway...</span></>)
                          : (<><Lock className="w-4 h-4" /><span>Pay KES {currentAmountKes.toLocaleString()} via Card</span></>)}
                        </button>
                      </div>
                    )}

                    {paymentMethod === "manual" && (
                      <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10">
                            <div className="text-[10px] text-white/50 uppercase font-bold">M-Pesa Paybill</div>
                            <div className="font-mono text-lg font-extrabold text-[#fbf5b7]">522522</div>
                            <button type="button" onClick={() => copyToClipboard("522522", "Paybill 522522")}
                              className="mt-1.5 w-full py-1 px-2 rounded bg-white/10 hover:bg-[#d4af37] hover:text-[#0c1b33] text-[10px] font-bold transition-all flex items-center justify-center gap-1">
                              {copiedKey === "Paybill 522522" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedKey === "Paybill 522522" ? "Copied!" : "Copy Paybill"}</span>
                            </button>
                          </div>
                          <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10">
                            <div className="text-[10px] text-white/50 uppercase font-bold">Account Number</div>
                            <div className="font-mono text-lg font-extrabold text-[#fbf5b7]">1335674365</div>
                            <button type="button" onClick={() => copyToClipboard("1335674365", "Account 1335674365")}
                              className="mt-1.5 w-full py-1 px-2 rounded bg-white/10 hover:bg-[#d4af37] hover:text-[#0c1b33] text-[10px] font-bold transition-all flex items-center justify-center gap-1">
                              {copiedKey === "Account 1335674365" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedKey === "Account 1335674365" ? "Copied!" : "Copy Account"}</span>
                            </button>
                          </div>
                        </div>
                        <div className="text-[11px] text-white/70">
                          Account Name: <strong className="text-white">Heavenly God Kingdom Churches</strong> (KCB Bank)
                        </div>
                        <div className="pt-2 border-t border-white/10">
                          <label htmlFor="manual-ref" className="block text-xs font-bold text-white/80 mb-1">
                            Already sent? Enter your M-Pesa transaction code:
                          </label>
                          <div className="flex gap-2">
                            <input id="manual-ref" type="text" value={manualRefCode}
                              onChange={(e) => setManualRefCode(e.target.value.toUpperCase())}
                              placeholder="e.g. QKJ8921820"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white font-mono font-bold text-sm focus:outline-none focus:border-[#d4af37] placeholder:text-white/30" />
                            <button type="button" onClick={handleManualVerification} disabled={submitting}
                              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 transition-all disabled:opacity-60">
                              {submitting ? "Verifying..." : "Confirm & Receipt"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === "paypal" && (
                      <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                        <div className="text-xs text-white/80">
                          Total Charge: <strong className="text-[#fbf5b7]">${currentAmountUsd} USD</strong>
                        </div>
                        <button type="button" onClick={handlePayPal} disabled={submitting}
                          className="w-full py-3.5 px-4 rounded-xl bg-[#0070ba] hover:bg-[#005ea6] text-white font-extrabold text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-60">
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                          <span>Pay with PayPal (${currentAmountUsd} USD)</span>
                        </button>
                        <div id="paypal-button-mount" className="mt-2" />
                      </div>
                    )}
                  </div>
                </div>

                {/* ── RIGHT: sticky order summary w/ in-place billing toggle ── */}
                <aside className="lg:sticky lg:top-[110px] p-5 rounded-2xl bg-white/[0.04] border border-[#d4af37]/30 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-xs uppercase font-bold tracking-wider text-[#d4af37]">Order summary</span>
                    <button type="button" onClick={handleBackToPlans}
                      className="text-[11px] text-[#fbf5b7] underline hover:text-white">Edit</button>
                  </div>

                  {givingType === "onetime" ? (
                    <>
                      <div>
                        <div className="text-sm font-bold text-white mb-1">{selectedPurpose}</div>
                        <div className="text-xs text-white/60 mb-2">One-Time Kingdom Seed</div>
                        <div className="font-brand text-3xl font-extrabold text-[#fbf5b7]">KES {currentAmountKes.toLocaleString()}</div>
                        <div className="text-xs text-white/50">~${currentAmountUsd} USD · one-time charge</div>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-white/70 leading-relaxed">
                        Your offering directly supports crusade sound gears, Bibles, and missionary bread rations.
                      </div>
                    </>
                  ) : (
                    <>
                      {/* In-place billing cycle toggle (no page scroll, updates total live) */}
                      <div className="grid grid-cols-2 p-1 rounded-xl bg-black/30 border border-white/10 text-xs font-extrabold">
                        <button type="button" onClick={() => handleGivingTypeChange("monthly")}
                          aria-pressed={givingType === "monthly"}
                          className={`py-2 rounded-lg transition-all ${givingType === "monthly" ? "bg-[#d4af37] text-[#0c1b33]" : "text-white/60 hover:text-white"}`}>
                          Monthly
                        </button>
                        <button type="button" onClick={() => handleGivingTypeChange("yearly")}
                          aria-pressed={givingType === "yearly"}
                          className={`py-2 rounded-lg transition-all ${givingType === "yearly" ? "bg-[#d4af37] text-[#0c1b33]" : "text-white/60 hover:text-white"}`}>
                          Annual −15%
                        </button>
                      </div>

                      <div>
                        <label htmlFor="plan-switcher" className="block text-[10px] uppercase font-bold text-white/50 mb-1">Plan</label>
                        <select id="plan-switcher" value={selectedPlanId}
                          onChange={(e) => handleSelectPlan(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm font-bold focus:outline-none focus:border-[#d4af37]">
                          {PARTNER_PLANS.map((p) => (
                            <option key={p.id} value={p.id} className="text-black">
                              {p.name} — KES {(givingType === "yearly" ? yearlyPrice(p.kesMonthly) : p.kesMonthly).toLocaleString()}
                              {givingType === "yearly" ? "/yr" : "/mo"}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="text-sm font-bold text-white mb-1">{activePlan.badge}</div>
                        <div className="text-xs text-white/60 mb-2">
                          {givingType === "yearly" ? "Annual Covenant Partnership" : "Monthly Covenant Partnership"} · renews {nextChargeDate}
                        </div>
                        <div className="font-brand text-3xl font-extrabold text-[#fbf5b7]">KES {currentAmountKes.toLocaleString()}</div>
                        <div className="text-xs text-white/50">
                          ~${currentAmountUsd} USD{givingType === "yearly" ? ` · KES ${activePlan.kesMonthly.toLocaleString()}/mo billed annually` : " · billed monthly"}
                        </div>
                      </div>

                      <dl className="text-[11px] space-y-1.5 pt-3 border-t border-white/10">
                        <div className="flex justify-between text-white/70">
                          <dt>{activePlan.name} × 1 {givingType === "yearly" ? "year" : "month"}</dt>
                          <dd className="font-bold text-white">KES {currentAmountKes.toLocaleString()}</dd>
                        </div>
                        {givingType === "yearly" && (
                          <div className="flex justify-between text-emerald-300">
                            <dt>Annual savings (15%)</dt>
                            <dd className="font-bold">−KES {(activePlan.kesMonthly * 12 - yearlyPrice(activePlan.kesMonthly)).toLocaleString()}</dd>
                          </div>
                        )}
                        <div className="flex justify-between text-white/70">
                          <dt>Fees & taxes</dt>
                          <dd className="font-bold text-white">KES 0</dd>
                        </div>
                        <div className="flex justify-between pt-1.5 border-t border-white/10 text-sm">
                          <dt className="font-extrabold text-white">Total due today</dt>
                          <dd className="font-extrabold text-[#fbf5b7]">KES {currentAmountKes.toLocaleString()}</dd>
                        </div>
                      </dl>

                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-white/70 leading-relaxed">
                        {activePlan.impactHighlight}
                      </div>
                    </>
                  )}

                  <div className="space-y-2 pt-2 text-[11px] text-white/60">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>256-Bit SSL Encrypted & Bank Compliant</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                      <span>Safaricom M-Pesa & Central Bank Verified</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Instant Digital Tax Receipt Issued</span>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              STEP 3: SUCCESS & AUTO-UNLOCK
              ═══════════════════════════════════════════════════════════ */}
          {currentStep === "success" && receipt && (
            <div className="bg-[#0c1b33]/90 backdrop-blur-xl border border-emerald-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 mb-3 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="font-brand text-2xl sm:text-4xl font-extrabold text-white mb-2">
                  Seed Successfully Received!
                </h2>
                <p className="text-white/70 text-xs sm:text-sm max-w-md mx-auto">
                  May God replenish your storehouse abundantly according to Luke 6:38. An official receipt has been issued below.
                </p>
              </div>

              {/* Auto-unlock banner for covenant partners */}
              {givingType !== "onetime" && (
                <div className="max-w-lg mx-auto mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/40 text-center" role="status" aria-live="polite">
                  <div className="flex items-center justify-center gap-2 text-sm font-extrabold text-emerald-300 mb-1">
                    <Crown className="w-4 h-4" />
                    <span>Partner Hub unlocked — redirecting in {redirectCountdown}s</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-3">
                    <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${(redirectCountdown / 8) * 100}%` }} />
                  </div>
                  <button type="button" onClick={() => navigate("/subscriber-dashboard")}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c5961d] text-[#0c1b33] font-bold text-xs sm:text-sm hover:scale-105 transition-all inline-flex items-center gap-1.5 shadow-lg">
                    <Crown className="w-4 h-4" />
                    <span>Access Covenant Partner Hub →</span>
                  </button>
                </div>
              )}

              <div className="p-6 rounded-2xl bg-white/[0.05] border border-white/15 max-w-lg mx-auto mb-8 space-y-4 text-xs sm:text-sm">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <img src={brandLogo} alt="" className="w-6 h-6 object-contain" />
                    <span className="font-bold text-white tracking-wide">KINGDOM MISSIONS NETWORK</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Official Receipt</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-white/50 uppercase font-semibold block">Receipt Ref</span>
                    <span className="font-mono font-bold text-white">{receipt.reference}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/50 uppercase font-semibold block">Date & Time</span>
                    <span className="text-white">{receipt.date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/50 uppercase font-semibold block">Donor Name</span>
                    <span className="font-bold text-white">{receipt.donorName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/50 uppercase font-semibold block">Email</span>
                    <span className="text-white truncate">{receipt.donorEmail}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-white/50 uppercase font-semibold block">Designation</span>
                      <span className="font-bold text-[#fbf5b7]">{receipt.purpose}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-white/50 uppercase font-semibold block">Total Gift</span>
                      <span className="font-brand text-lg font-bold text-emerald-300">KES {receipt.amountKes.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-white/10 text-[10px] text-white/50 flex items-center justify-between">
                  <span>Method: {receipt.paymentMethod}</span>
                  <span>Bishop Dr. George Githinji</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button type="button" onClick={() => window.print()}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all">
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                {givingType !== "onetime" ? (
                  <button type="button" onClick={() => navigate("/subscriber-dashboard")}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c5961d] text-[#0c1b33] font-bold text-xs sm:text-sm hover:scale-105 transition-all flex items-center justify-center gap-1.5 shadow-lg">
                    <Crown className="w-4 h-4" />
                    <span>Access Covenant Partner Hub →</span>
                  </button>
                ) : (
                  <Link to="/"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c5961d] text-[#0c1b33] font-bold text-xs sm:text-sm hover:scale-105 transition-all flex items-center justify-center gap-1.5 shadow-lg">
                    <span>Return to Home</span>
                  </Link>
                )}
                <button type="button"
                  onClick={() => {
                    setReceipt(null);
                    setCurrentStep("plans");
                    setSearchParams({ step: "plans", type: givingType, plan: selectedPlanId }, { replace: false });
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-white/80 font-bold text-xs flex items-center justify-center gap-1.5 transition-all">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Give Another Gift</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
