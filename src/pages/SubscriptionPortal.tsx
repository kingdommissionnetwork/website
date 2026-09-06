import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Crown,
  Check,
  Sparkles,
  Heart,
  Globe,
  Loader2,
  HelpCircle,
  Zap,
  RefreshCw,
  Award,
  Compass,
  Plane,
  UserCheck,
  Flame,
  ShieldCheck,
  Copy,
  Smartphone,
  CreditCard,
  Building2,
  ArrowLeft,
  Lock,
  ChevronRight,
  Shield,
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

// 4 Structured Partnership Tiers
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

const missionPillars = [
  {
    icon: Compass,
    title: "Reach the Unreached",
    desc: "Deploying evangelists, mobile crusade rigs, and sound equipment to remote villages and unreached population groups across Africa and the nations.",
  },
  {
    icon: Heart,
    title: "Feed the Nations",
    desc: "Providing essential food hampers, clean water, and practical compassionate relief to vulnerable families, widows, and orphanages alongside the Gospel message.",
  },
  {
    icon: Flame,
    title: "Global Revival Outreaches",
    desc: "Organizing mass gospel crusades, equipping local church leaders, distributing Bibles in 22 translations, and live satellite broadcasts.",
  },
];

const ambassadorIncentives = [
  {
    icon: UserCheck,
    title: "Official Partner ID & Credential",
    desc: "Every verified partner receives an official Kingdom Missions Network membership ID card and certificate recognizing them as a bona fide kingdom partner.",
  },
  {
    icon: Plane,
    title: "Mission Team Deployment Priority",
    desc: "When KMN plans mission trips, crusades, and regional outreaches, registered partners are given primary eligibility to travel as part of the official team.",
  },
  {
    icon: Globe,
    title: "Preaching Abroad Logistics Support",
    desc: "When partner ministers plan to minister outside their country, KMN provides pastoral endorsement, connects them with local church leadership, and assists with advance meeting mobilization and logistics.",
  },
  {
    icon: Crown,
    title: "Bishop's Prophetic Impartation",
    desc: "Receive monthly live spiritual fellowship, prophetic alignment, and dedicated intercession directly from Bishop Dr. George Githinji and the oversight council.",
  },
];

const faqs = [
  {
    q: "How are the KES and USD amounts calculated?",
    a: "Our system continuously computes live exchange rates using market financial APIs. You can view and pay in either Kenyan Shillings (KES) or US Dollars (USD).",
  },
  {
    q: "How does the 'Preaching Abroad Logistics Support' work?",
    a: "If you are a minister or partner traveling abroad for ministry, Kingdom Missions Network leverages its global network to write official letters of endorsement, introduce you to verified local pastoral councils, and assist with meeting preparation and ground mobilization.",
  },
  {
    q: "What payment methods are supported?",
    a: "In Kenya and East Africa, you can subscribe via Safaricom M-Pesa (Instant STK Push with zero code entry), or Debit/Credit card through Paystack. Globally, you can use PayPal, Visa, Mastercard, or American Express in USD.",
  },
  {
    q: "How do I receive my Official Partner ID Card?",
    a: "Upon completing your subscription, your verified digital Partner ID is generated instantly in your dashboard. You can download, print, or share your official credential.",
  },
  {
    q: "Can I cancel or change my plan anytime?",
    a: "Yes, you have full control over your partnership. You can change tiers, update payment methods, or cancel at any time with no penalties.",
  },
];

export default function SubscriptionPortal() {
  const { user, setSession } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Multi-Step State (Inspired by Zoom & ChatGPT): "plans" | "checkout"
  const currentStep = searchParams.get("step") === "checkout" ? "checkout" : "plans";

  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    return searchParams.get("plan") || "ambassador";
  });
  const [isCustomAmount, setIsCustomAmount] = useState<boolean>(false);
  const [customAmountKes, setCustomAmountKes] = useState<number>(5000);
  const [currencyView, setCurrencyView] = useState<"KES" | "USD">("KES");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(() => {
    return searchParams.get("interval") === "yearly" ? "yearly" : "monthly";
  });
  const [exchangeRate, setExchangeRate] = useState<number>(0.00772);
  const [loadingRate, setLoadingRate] = useState<boolean>(true);
  const [subscriberName, setSubscriberName] = useState(user?.name || "");
  const [subscriberEmail, setSubscriberEmail] = useState(user?.email || "");
  const [submitting, setSubmitting] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [onboardingStage, setOnboardingStage] = useState<number | null>(null);
  const [subMethod, setSubMethod] = useState<"mpesa" | "card" | "paypal" | "manual">("mpesa");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [stkPending, setStkPending] = useState(false);
  const [stkStatusMessage, setStkStatusMessage] = useState("");
  const [stkSecondsLeft, setStkSecondsLeft] = useState(60);
  const [mpesaRefCode, setMpesaRefCode] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync state if user changes in auth context
  useEffect(() => {
    if (user?.name && !subscriberName) setSubscriberName(user.name);
    if (user?.email && !subscriberEmail) setSubscriberEmail(user.email);
  }, [user, subscriberName, subscriberEmail]);

  // Sync plan from URL
  useEffect(() => {
    const urlPlan = searchParams.get("plan");
    if (urlPlan && PARTNER_PLANS.some((p) => p.id === urlPlan)) {
      setSelectedPlanId(urlPlan);
    }
  }, [searchParams]);

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

  // Active selected plan & computed amounts
  const activePlan = PARTNER_PLANS.find((p) => p.id === selectedPlanId) || PARTNER_PLANS[1];
  const activeAmountKes = isCustomAmount ? customAmountKes : activePlan.kesMonthly * (billingCycle === "yearly" ? 12 : 1);
  const activeAmountUsd = Number((activeAmountKes * exchangeRate).toFixed(2));

  // Step Transitions
  const handleSelectPlanAndProceed = (planId: string) => {
    setSelectedPlanId(planId);
    setIsCustomAmount(false);
    setSearchParams({ step: "checkout", plan: planId, interval: billingCycle });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectCustomAndProceed = () => {
    setIsCustomAmount(true);
    setSearchParams({ step: "checkout", plan: "custom", interval: billingCycle });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToPlans = () => {
    setSearchParams({});
    setStkPending(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Seamless Onboarding Handshake Sequence
  const runOnboardingTransition = async (
    planTitle: string,
    verifiedUser?: Record<string, unknown> | null,
    token?: string | null,
    subscription?: Record<string, unknown> | null,
    refCode?: string | null
  ) => {
    setOnboardingStage(1);
    if (verifiedUser && token) {
      const numericId = typeof verifiedUser.id === "number" ? verifiedUser.id : Date.now();
      setSession(
        {
          id: numericId,
          name: String(verifiedUser.name || subscriberName.trim() || "Kingdom Partner"),
          email: String(verifiedUser.email || subscriberEmail.trim() || ""),
          role: "member",
        },
        token
      );
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
          runOnboardingTransition(res.planName || activePlan.name, res.user, res.token);
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

  // M-Pesa STK Push (Express Auto-Prompt)
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
    setStkStatusMessage("Sending M-Pesa prompt to Safaricom...");

    try {
      const initRes = await api.subscriptions.initiateMpesaStk({
        phoneNumber: phone,
        name,
        email,
        amount: activeAmountKes,
        planName: activePlan.name,
        planId: activePlan.id,
        interval: billingCycle,
      });

      setStkStatusMessage(`Prompt sent to ${phone}! Check your phone and enter your M-Pesa PIN.`);
      showToast("Prompt sent! Please check your phone and enter your PIN.", "info");

      // Auto-poll checkout session every 2 seconds
      const checkoutId = initRes.checkoutRequestId;
      let attempts = 0;
      const maxAttempts = 30; // 60s timeout

      const countdownTimer = setInterval(() => {
        setStkSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      const pollTimer = setInterval(async () => {
        attempts++;
        try {
          const qRes = await api.subscriptions.queryMpesaStk(checkoutId);
          if (qRes.status === "completed") {
            clearInterval(pollTimer);
            clearInterval(countdownTimer);
            setStkPending(false);
            setStkStatusMessage("Payment confirmed! Opening your partner dashboard...");
            showToast("Payment verified! Opening your partner covenant dashboard...", "success");
            await runOnboardingTransition(
              qRes.planName || activePlan.name,
              qRes.user,
              qRes.token,
              qRes.subscription,
              qRes.receiptCode
            );
          } else if (qRes.status === "failed") {
            clearInterval(pollTimer);
            clearInterval(countdownTimer);
            setStkPending(false);
            showToast("M-Pesa transaction was cancelled or declined on phone.", "error");
          } else if (attempts >= maxAttempts) {
            clearInterval(pollTimer);
            clearInterval(countdownTimer);
            setStkPending(false);
            showToast("Transaction timeout. If you completed payment, you can enter the SMS receipt code.", "info");
            setSubMethod("manual");
          }
        } catch {
          // keep polling
        }
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to trigger M-Pesa STK Push.";
      showToast(msg, "error");
      setStkPending(false);
    } finally {
      setSubmitting(false);
    }
  };

  // M-Pesa Manual Code Verification
  const handleMpesaManualVerify = async (e: React.FormEvent) => {
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
    if (cleanRef.length !== 10) {
      showToast("M-Pesa transaction code must be exactly 10 characters (e.g. TK78AB12CD).", "error");
      return;
    }
    if (!/^[A-Z][A-Z0-9]{9}$/.test(cleanRef)) {
      showToast("M-Pesa transaction code must start with a letter and contain valid alphanumeric characters.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.subscriptions.verifyMpesa({
        reference: cleanRef,
        name,
        email,
        amount: activeAmountKes,
        planName: activePlan.name,
        planId: activePlan.id,
        interval: billingCycle,
      });

      showToast("M-Pesa payment verified! Activating your partner covenant dashboard...", "success");
      await runOnboardingTransition(
        res.planName || activePlan.name,
        res.user,
        res.token,
        res.subscription,
        cleanRef
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "M-Pesa verification failed. Please try again.";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Paystack Card flow
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
        amount: activeAmountKes,
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
              await runOnboardingTransition(res.planName || activePlan.name, res.user, res.token);
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

  // PayPal flow
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
        amount: activeAmountKes,
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
              await runOnboardingTransition(activePlan.name, capture.user, capture.token);
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
    <div className="pt-[72px] md:pt-[100px] min-h-screen bg-[#071324] text-white">
      <SEO
        title={
          currentStep === "checkout"
            ? `Checkout: ${activePlan.name} — Kingdom Missions Network`
            : "Kingdom Partnership Packages — Kingdom Missions Network"
        }
        description="Join Kingdom Missions Network as a covenant partner. Support reaching the unreached, feeding the nations, and global crusades with exclusive ambassador incentives."
      />

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 2: DEDICATED CHECKOUT VIEW (Inspired by Zoom & ChatGPT)
          ══════════════════════════════════════════════════════════════════════ */}
      {currentStep === "checkout" ? (
        <div className="min-h-[85vh] py-8 sm:py-12 px-4 sm:px-6 relative">
          <AmbientParticles />
          <div className="max-w-6xl mx-auto relative z-10">
            
            {/* Top Navigation & Breadcrumb */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-white/10">
              <button
                type="button"
                onClick={handleBackToPlans}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-white/70 hover:text-white transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#d4af37]/60 group-hover:bg-[#d4af37]/10 transition-all">
                  <ArrowLeft className="w-4 h-4 text-[#d4af37]" />
                </div>
                <span>← Back to all partnership plans</span>
              </button>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#fbf5b7] text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Step 2 of 2: Checkout &amp; Activate</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-xs text-emerald-400">
                  <Lock className="w-3.5 h-3.5" />
                  <span>256-Bit Encrypted</span>
                </span>
              </div>
            </div>

            {/* 2-Column Split Checkout Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              
              {/* ── LEFT COLUMN: Information & Payment Methods (Col 7) ── */}
              <div className="lg:col-span-7 space-y-8">
                
                {/* Section Header */}
                <div>
                  <h1 className="font-brand text-2xl sm:text-4xl font-extrabold text-white mb-2">
                    Complete Your Partnership
                  </h1>
                  <p className="text-white/70 text-xs sm:text-sm">
                    Enter your contact details and choose your preferred payment option below.
                  </p>
                </div>

                {/* 1. Partner Information Card */}
                <div className="p-6 sm:p-7 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
                  <h2 className="text-xs uppercase font-extrabold tracking-wider text-[#d4af37] mb-4 flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    <span>1. Partner &amp; Certificate Information</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="checkoutPartnerName" className="block text-xs font-semibold text-white/80 mb-1.5">
                        Full Name / Ministry Name *
                      </label>
                      <input
                        id="checkoutPartnerName"
                        type="text"
                        value={subscriberName}
                        onChange={(e) => setSubscriberName(e.target.value)}
                        placeholder="e.g. Pastor John Doe"
                        required
                        disabled={stkPending}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#d4af37] transition-colors"
                      />
                    </div>

                    <div>
                      <label htmlFor="checkoutPartnerEmail" className="block text-xs font-semibold text-white/80 mb-1.5">
                        Email Address (For Official ID &amp; Receipt) *
                      </label>
                      <input
                        id="checkoutPartnerEmail"
                        type="email"
                        value={subscriberEmail}
                        onChange={(e) => setSubscriberEmail(e.target.value)}
                        placeholder="john@example.com"
                        required
                        disabled={stkPending}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#d4af37] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Payment Method Selector Tabs */}
                <div className="p-6 sm:p-7 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
                  <h2 className="text-xs uppercase font-extrabold tracking-wider text-[#d4af37] mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>2. Select Payment Method</span>
                  </h2>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
                    {/* Method 1: M-Pesa STK */}
                    <button
                      type="button"
                      onClick={() => setSubMethod("mpesa")}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        subMethod === "mpesa"
                          ? "bg-emerald-950/50 border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                          : "bg-white/[0.02] border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Smartphone className={`w-5 h-5 ${subMethod === "mpesa" ? "text-emerald-400" : "text-white/60"}`} />
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold">
                          Instant
                        </span>
                      </div>
                      <span className="font-bold text-xs text-white block">M-Pesa STK</span>
                      <span className="text-[10px] text-white/50">Auto-Prompt</span>
                    </button>

                    {/* Method 2: Card */}
                    <button
                      type="button"
                      onClick={() => setSubMethod("card")}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        subMethod === "card"
                          ? "bg-[#d4af37]/15 border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                          : "bg-white/[0.02] border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <CreditCard className={`w-5 h-5 ${subMethod === "card" ? "text-[#d4af37]" : "text-white/60"}`} />
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-semibold">
                          Card
                        </span>
                      </div>
                      <span className="font-bold text-xs text-white block">Credit / Debit</span>
                      <span className="text-[10px] text-white/50">Visa · Master</span>
                    </button>

                    {/* Method 3: PayPal */}
                    <button
                      type="button"
                      onClick={() => setSubMethod("paypal")}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        subMethod === "paypal"
                          ? "bg-[#0070ba]/20 border-[#0070ba] shadow-[0_0_20px_rgba(0,112,186,0.2)]"
                          : "bg-white/[0.02] border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Globe className={`w-5 h-5 ${subMethod === "paypal" ? "text-[#0070ba]" : "text-white/60"}`} />
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0070ba]/30 text-blue-300 font-semibold">
                          USD
                        </span>
                      </div>
                      <span className="font-bold text-xs text-white block">PayPal</span>
                      <span className="text-[10px] text-white/50">Global USD</span>
                    </button>

                    {/* Method 4: Manual Paybill */}
                    <button
                      type="button"
                      onClick={() => setSubMethod("manual")}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        subMethod === "manual"
                          ? "bg-white/10 border-white/40 shadow-md"
                          : "bg-white/[0.02] border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Building2 className={`w-5 h-5 ${subMethod === "manual" ? "text-white" : "text-white/60"}`} />
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-semibold">
                          Offline
                        </span>
                      </div>
                      <span className="font-bold text-xs text-white block">Manual Code</span>
                      <span className="text-[10px] text-white/50">Paybill 522522</span>
                    </button>
                  </div>

                  {/* ── METHOD 1: M-PESA STK PUSH (DEFAULT & PRIMARY) ── */}
                  {subMethod === "mpesa" && (
                    <div className="space-y-6 animate-fade-in">
                      {!stkPending ? (
                        <form onSubmit={handleMpesaStkPush} className="space-y-5">
                          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
                            <Zap className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                            <div className="text-xs text-emerald-200/90 leading-relaxed">
                              <strong className="text-emerald-100 block mb-0.5 font-bold">
                                Zero receipt code entry — 100% automatic
                              </strong>
                              Enter your Safaricom number and tap below. Your phone will immediately vibrate with a Safaricom M-Pesa PIN prompt. Enter your PIN and your partner dashboard unlocks in real time.
                            </div>
                          </div>

                          <div>
                            <label htmlFor="checkoutMpesaPhone" className="block text-xs font-semibold text-white/80 mb-1.5">
                              Safaricom M-Pesa Phone Number *
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-emerald-400 flex items-center gap-1 pointer-events-none">
                                <span>🇰🇪 +254</span>
                              </span>
                              <input
                                id="checkoutMpesaPhone"
                                type="tel"
                                value={mpesaPhone}
                                onChange={(e) => setMpesaPhone(e.target.value)}
                                placeholder="0722 000 000"
                                required
                                className="w-full pl-24 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 text-sm font-mono font-bold focus:outline-none focus:border-emerald-400 transition-colors"
                              />
                            </div>
                            <span className="text-[11px] text-white/50 mt-1 block">
                              Accepts formats: 07XXXXXXXX, 01XXXXXXXX, or 254XXXXXXXXX
                            </span>
                          </div>

                          <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white font-extrabold text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all shadow-[0_0_25px_rgba(16,185,129,0.35)] disabled:opacity-50"
                          >
                            {submitting ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Connecting to Safaricom...</span>
                              </>
                            ) : (
                              <>
                                <Smartphone className="w-5 h-5" />
                                <span>Send M-Pesa Prompt to My Phone — KES {activeAmountKes.toLocaleString()}</span>
                              </>
                            )}
                          </button>

                          <div className="pt-2 text-center">
                            <button
                              type="button"
                              onClick={() => setSubMethod("manual")}
                              className="text-xs text-white/50 hover:text-white underline transition-colors"
                            >
                              Prefer to pay manually via Paybill 522522? Click here
                            </button>
                          </div>
                        </form>
                      ) : (
                        /* ── LIVE STK PENDING PROMPT VISUALIZER ── */
                        <div className="p-7 rounded-3xl bg-gradient-to-br from-emerald-950/60 to-[#0c1b33] border-2 border-emerald-500/60 shadow-[0_0_40px_rgba(16,185,129,0.25)] text-center space-y-5 animate-fade-in">
                          <div className="relative w-20 h-20 mx-auto">
                            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                            <div className="relative w-20 h-20 rounded-full bg-emerald-500/30 border-2 border-emerald-400 flex items-center justify-center">
                              <Smartphone className="w-10 h-10 text-emerald-300 animate-pulse" />
                            </div>
                          </div>

                          <div>
                            <h3 className="font-brand text-xl font-bold text-emerald-200 mb-1">
                              Check Your Phone Screen Now
                            </h3>
                            <p className="text-xs sm:text-sm text-white/80 max-w-md mx-auto leading-relaxed">
                              {stkStatusMessage || `A prompt of KES ${activeAmountKes.toLocaleString()} was sent to your phone. Enter your Safaricom PIN to authorize.`}
                            </p>
                          </div>

                          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-emerald-500/30 text-xs font-mono text-emerald-300">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                            <span>Auto-detecting authorization... ({stkSecondsLeft}s)</span>
                          </div>

                          <div className="pt-3 border-t border-white/10 flex items-center justify-center gap-4 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setStkPending(false);
                              }}
                              className="text-white/60 hover:text-white underline transition-colors"
                            >
                              Change Phone Number
                            </button>
                            <span className="text-white/20">|</span>
                            <button
                              type="button"
                              onClick={() => {
                                setStkPending(false);
                                setSubMethod("manual");
                              }}
                              className="text-emerald-400 hover:text-emerald-300 font-semibold underline transition-colors"
                            >
                              Enter SMS code manually
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── METHOD 2: DEBIT / CREDIT CARD (PAYSTACK) ── */}
                  {subMethod === "card" && (
                    <div className="space-y-5 animate-fade-in">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/80 leading-relaxed flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-white block mb-0.5 font-bold">
                            Bank-Grade Card Processing
                          </strong>
                          Supports all Visa, Mastercard, and Verve debit/credit cards with instant 3D-Secure authentication.
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handlePaystack}
                        disabled={submitting}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] text-[#0c1b33] font-extrabold text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all shadow-[0_0_25px_rgba(212,175,55,0.3)] disabled:opacity-50"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Opening Payment Window...</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            <span>
                              Pay with Card —{" "}
                              {currencyView === "KES"
                                ? `KES ${activeAmountKes.toLocaleString()}`
                                : `$${activeAmountUsd.toFixed(2)} USD`}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* ── METHOD 3: PAYPAL (GLOBAL USD) ── */}
                  {subMethod === "paypal" && (
                    <div className="space-y-5 animate-fade-in">
                      <div className="p-4 rounded-2xl bg-[#0070ba]/10 border border-[#0070ba]/30 text-xs text-blue-200 leading-relaxed flex items-start gap-3">
                        <Globe className="w-5 h-5 text-[#0070ba] shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-white block mb-0.5 font-bold">
                            Worldwide PayPal Partnership
                          </strong>
                          Instant covenant activation for international partners in US Dollars ($USD).
                        </div>
                      </div>

                      <div id="paypal-subscription-container" className="min-h-[50px]">
                        <button
                          type="button"
                          onClick={handlePayPal}
                          disabled={submitting}
                          className="w-full py-3.5 rounded-2xl bg-[#0070ba] hover:bg-[#005ea6] text-white font-extrabold text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
                        >
                          <Lock className="w-4 h-4" />
                          <span>Subscribe with PayPal — ${activeAmountUsd.toFixed(2)} USD</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── METHOD 4: MANUAL PAYBILL CODE ── */}
                  {subMethod === "manual" && (
                    <div className="space-y-6 animate-fade-in">
                      {/* Official Paybill Details Tile */}
                      <div className="p-5 rounded-2xl bg-white/[0.04] border border-[#d4af37]/40 shadow-inner">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-[#d4af37]" />
                            <span className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
                              Heavenly God Kingdom Churches · KCB Bank
                            </span>
                          </div>
                          <span className="text-xs text-white/60">
                            Amount: <strong className="text-[#fbf5b7]">KES {activeAmountKes.toLocaleString()}</strong>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-white/60 uppercase font-semibold block">Paybill Number</span>
                              <span className="font-mono text-lg font-extrabold text-[#fbf5b7]">522522</span>
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
                          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-white/60 uppercase font-semibold block">Account Number</span>
                              <span className="font-mono text-lg font-extrabold text-[#fbf5b7]">1335674365</span>
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

                      {/* Code Verification Form */}
                      <form onSubmit={handleMpesaManualVerify} className="space-y-4">
                        <div>
                          <label htmlFor="checkoutMpesaRef" className="block text-xs font-semibold text-white/80 mb-1.5">
                            M-Pesa 10-Character Receipt Code *
                          </label>
                          <input
                            id="checkoutMpesaRef"
                            type="text"
                            maxLength={10}
                            value={mpesaRefCode}
                            onChange={(e) => setMpesaRefCode(e.target.value.toUpperCase())}
                            placeholder="e.g. TK78AB12CD"
                            required
                            className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 text-sm font-mono font-bold tracking-widest uppercase focus:outline-none focus:border-[#d4af37] transition-colors"
                          />
                          <span className="text-[11px] text-white/50 mt-1 block">
                            Enter the 10-character transaction code from your Safaricom SMS.
                          </span>
                        </div>

                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] text-[#0c1b33] font-extrabold text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all shadow-[0_0_25px_rgba(212,175,55,0.3)] disabled:opacity-50"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Verifying Code...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-5 h-5" />
                              <span>Verify &amp; Activate My Partnership</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Trust and Safety Badges */}
                <div className="flex flex-wrap items-center justify-center gap-6 py-2 text-xs text-white/50">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>Direct Missionary Giving</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-[#d4af37]" />
                    <span>256-Bit SSL Encryption</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-400" />
                    <span>Official Verified Credential</span>
                  </div>
                </div>
              </div>

              {/* ── RIGHT COLUMN: Sticky Order Summary (Col 5) (Zoom / ChatGPT style) ── */}
              <div className="lg:col-span-5 lg:sticky lg:top-28">
                <div className="rounded-3xl bg-gradient-to-b from-[#0e213b] via-[#0b1b31] to-[#071324] border-2 border-[#d4af37]/40 shadow-2xl p-6 sm:p-7 backdrop-blur-md relative overflow-hidden">
                  
                  {/* Subtle Top Glow */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-[radial-gradient(circle,rgba(212,175,55,0.15)_0%,transparent_70%)] pointer-events-none blur-2xl" />

                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                      <span className="text-xs uppercase font-extrabold tracking-wider text-[#d4af37]">
                        Order Summary
                      </span>
                      <button
                        type="button"
                        onClick={handleBackToPlans}
                        className="text-xs text-[#fbf5b7] hover:underline font-semibold"
                      >
                        Change Tier
                      </button>
                    </div>

                    {/* Selected Plan Details */}
                    <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-block px-2.5 py-1 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#fbf5b7] text-xs font-bold">
                          {activePlan.badge}
                        </span>
                        <Crown className="w-4 h-4 text-[#d4af37]" />
                      </div>
                      <h3 className="font-brand text-xl font-bold text-white mb-1">{activePlan.name}</h3>
                      <p className="text-xs text-white/70 leading-relaxed">{activePlan.tagline}</p>
                    </div>

                    {/* In-Place Billing Cycle Selector (Like Zoom!) */}
                    <div className="mb-6">
                      <label className="block text-xs font-semibold text-white/70 mb-2">
                        Subscription Cycle
                      </label>
                      <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/[0.05] border border-white/10">
                        <button
                          type="button"
                          onClick={() => setBillingCycle("monthly")}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                            billingCycle === "monthly"
                              ? "bg-white text-[#0c1b33] shadow-md font-extrabold"
                              : "text-white/70 hover:text-white"
                          }`}
                        >
                          Monthly
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillingCycle("yearly")}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            billingCycle === "yearly"
                              ? "bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] shadow-md font-extrabold"
                              : "text-white/70 hover:text-white"
                          }`}
                        >
                          <span>Annual</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-extrabold">
                            1 Year
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Covenant Perks Bulletpoints */}
                    <div className="mb-6 pb-6 border-b border-white/10">
                      <span className="text-xs uppercase font-bold text-white/60 mb-3 block">
                        Included Privileges:
                      </span>
                      <ul className="space-y-2.5 text-xs text-white/85">
                        {activePlan.perks.slice(0, 4).map((perk, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-[#d4af37] shrink-0 mt-0.5" />
                            <span>{perk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Financial Breakdown */}
                    <div className="space-y-2.5 text-xs text-white/75 mb-6">
                      <div className="flex items-center justify-between">
                        <span>Covenant Seed ({billingCycle})</span>
                        <span className="font-mono font-bold text-white">KES {activeAmountKes.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-white/50">
                        <span>USD Value Equivalent</span>
                        <span className="font-mono">≈ ${activeAmountUsd.toFixed(2)} USD</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Processing &amp; Admin Fees</span>
                        <span className="text-emerald-400 font-semibold">KES 0 (Covered by Ministry)</span>
                      </div>

                      <div className="pt-3 border-t border-white/15 flex items-baseline justify-between text-white">
                        <span className="font-brand text-sm font-bold">Total Due Today:</span>
                        <div className="text-right">
                          <span className="font-brand text-2xl font-extrabold text-[#fbf5b7] block">
                            KES {activeAmountKes.toLocaleString()}
                          </span>
                          <span className="text-[11px] text-white/50">
                            {currencyView === "USD" ? `$${activeAmountUsd.toFixed(2)} USD` : "Kenyan Shillings"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Assurance */}
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-[11px] text-white/60 flex items-start gap-2 leading-relaxed">
                      <ShieldCheck className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                      <span>
                        Official Kingdom Missions Network covenant partnership. Renews {billingCycle} until cancelled. You can change your plan or cancel anytime in your dashboard.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════════
            STEP 1: PLANS OVERVIEW & CATALOG SHOWCASE
            ══════════════════════════════════════════════════════════════════════ */
        <>
          {/* Hero Section */}
          <section className="relative overflow-hidden bg-gradient-to-br from-[#0c1b33] via-[#071324] to-[#1a1107] py-20 lg:py-28 px-4 sm:px-6">
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(249,115,22,0.20)_0%,transparent_65%)] pointer-events-none blur-3xl" />
            <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(212,175,55,0.18)_0%,transparent_60%)] pointer-events-none blur-3xl" />
            <AmbientParticles />

            <div className="container-main mx-auto max-w-5xl text-center relative z-10">
              <ScrollReveal>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 backdrop-blur-md mb-8 shadow-inner">
                  <Crown className="w-4 h-4 text-[#d4af37]" />
                  <span className="text-xs sm:text-sm font-semibold text-[#fbf5b7] tracking-wider uppercase">
                    Kingdom Missions Network Covenant Partnership
                  </span>
                </div>

                <h1 className="font-brand text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
                  Stand with Us to <br className="hidden sm:inline" />
                  <span className="bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] bg-clip-text text-transparent">
                    Reach the Unreached &amp; Feed the Nations
                  </span>
                </h1>

                <p className="font-outfit text-white/80 text-base sm:text-xl max-w-3xl mx-auto leading-relaxed mb-10">
                  Partner in God&apos;s global harvest. Your covenant support funds gospel crusades, village food relief, Holy Bible distribution, and unlocks official missionary ambassador credentials.
                </p>

                {/* Controls: Currency & Billing */}
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {/* Currency Selector */}
                  <div className="inline-flex rounded-2xl bg-white/10 p-1 border border-white/15 backdrop-blur-md">
                    <button
                      type="button"
                      onClick={() => setCurrencyView("KES")}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                        currencyView === "KES"
                          ? "bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] shadow-md"
                          : "text-white/70 hover:text-white"
                      }`}
                    >
                      KES (Kenyan Shillings)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrencyView("USD")}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                        currencyView === "USD"
                          ? "bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] shadow-md"
                          : "text-white/70 hover:text-white"
                      }`}
                    >
                      USD ($ US Dollars)
                    </button>
                  </div>

                  {/* Billing Cycle Toggle */}
                  <div className="inline-flex rounded-2xl bg-white/10 p-1 border border-white/15 backdrop-blur-md">
                    <button
                      type="button"
                      onClick={() => setBillingCycle("monthly")}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                        billingCycle === "monthly"
                          ? "bg-white text-[#0c1b33] shadow-md"
                          : "text-white/70 hover:text-white"
                      }`}
                    >
                      Monthly Seed
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle("yearly")}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                        billingCycle === "yearly"
                          ? "bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] shadow-md"
                          : "text-white/70 hover:text-white"
                      }`}
                    >
                      <span>Annual Covenant</span>
                      <span className="text-[10px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.5 rounded-full">
                        1 Year
                      </span>
                    </button>
                  </div>

                  {/* Live Rate Badge */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/70">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live Rate: 1 USD ≈ {(1 / exchangeRate).toFixed(2)} KES</span>
                    <button
                      type="button"
                      onClick={loadPricing}
                      disabled={loadingRate}
                      title="Refresh rates"
                      className="p-0.5 text-white/50 hover:text-white transition-colors"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingRate ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </section>

          {/* 3 Core Mission Impact Pillars */}
          <section className="py-16 px-4 sm:px-6 bg-[#09182d] border-y border-white/10 relative">
            <div className="container-main mx-auto max-w-7xl">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="font-outfit text-xs font-bold uppercase tracking-[0.25em] text-[#d4af37] mb-2">
                  Every Contribution Counts
                </h2>
                <h3 className="font-brand text-2xl sm:text-4xl font-bold text-white">
                  Where Your Partnership Goes
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {missionPillars.map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <div
                      key={pillar.title}
                      className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-[#d4af37]/40 transition-all duration-300 group"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d4af37]/20 to-[#f97316]/20 border border-[#d4af37]/30 flex items-center justify-center text-[#fbf5b7] mb-6 group-hover:scale-110 transition-transform">
                        <Icon className="w-7 h-7 text-[#d4af37]" />
                      </div>
                      <h4 className="font-brand text-xl font-bold text-white mb-3">{pillar.title}</h4>
                      <p className="font-outfit text-white/70 text-sm leading-relaxed">{pillar.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 4 Partnership Tiers (Plan Selection Cards) */}
          <section id="tiers" className="py-20 px-4 sm:px-6 bg-[#071324] relative">
            <div className="container-main mx-auto max-w-7xl">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#d4af37]/15 text-[#fbf5b7] border border-[#d4af37]/30 text-xs font-semibold mb-4">
                  <Sparkles className="w-4 h-4 text-[#d4af37]" />
                  <span>Covenant Giving Tiers</span>
                </div>
                <h2 className="font-brand text-3xl sm:text-5xl font-bold text-white mb-4">
                  Choose Your Partnership Level
                </h2>
                <p className="font-outfit text-white/75 text-base sm:text-lg">
                  Select a tier that aligns with your spiritual devotion. Tap any plan to proceed directly to checkout.
                </p>
              </div>

              {/* 4 Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
                {PARTNER_PLANS.map((plan) => {
                  const isSelected = selectedPlanId === plan.id && !isCustomAmount;
                  const kesDisplay = plan.kesMonthly.toLocaleString();
                  const usdDisplay = (plan.kesMonthly * exchangeRate).toFixed(2);

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
                      className={`relative rounded-3xl p-7 flex flex-col justify-between cursor-pointer transition-all duration-300 group ${
                        isSelected
                          ? "bg-gradient-to-b from-[#132c52] to-[#0d1d36] border-2 border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.25)] scale-[1.02]"
                          : "bg-white/[0.04] border border-white/10 hover:border-white/25 hover:bg-white/[0.06] hover:scale-[1.01]"
                      }`}
                    >
                      {/* Popular Tag */}
                      {plan.isPopular && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] text-[#0c1b33] text-[11px] font-extrabold uppercase tracking-wider shadow-lg">
                          Most Popular Tier
                        </div>
                      )}

                      <div>
                        {/* Header */}
                        <div className="mb-6">
                          <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-[#fbf5b7] mb-3">
                            {plan.badge}
                          </span>
                          <h3 className="font-brand text-2xl font-bold text-white mb-2">{plan.name}</h3>
                          <p className="font-outfit text-xs text-[#d4af37] font-semibold">{plan.tagline}</p>
                        </div>

                        {/* Price */}
                        <div className="mb-6 pb-6 border-b border-white/10">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-brand text-3xl sm:text-4xl font-extrabold text-white">
                              {currencyView === "KES" ? `KES ${kesDisplay}` : `$${usdDisplay}`}
                            </span>
                            <span className="text-white/60 text-xs sm:text-sm">/ month</span>
                          </div>
                          <p className="text-[11px] text-white/50 mt-1">
                            {currencyView === "KES" ? `≈ $${usdDisplay} USD / mo` : `≈ ${kesDisplay} KES / mo`}
                          </p>
                        </div>

                        {/* Impact Note */}
                        <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 text-xs text-[#fbf5b7] mb-6 leading-relaxed flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                          <span>{plan.impactHighlight}</span>
                        </div>

                        {/* Perks */}
                        <ul className="space-y-3 mb-8">
                          {plan.perks.map((perk, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-white/80 leading-snug">
                              <Check className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                              <span>{perk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Direct Step-Forward Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPlanAndProceed(plan.id);
                        }}
                        className="w-full py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm tracking-wide transition-all shadow-md bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] text-[#0c1b33] hover:brightness-110 flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                      >
                        <span>Choose {plan.name}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Custom Giving Option */}
              <div className="mt-12 max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white/[0.04] border border-white/10 text-center">
                <h4 className="font-brand text-xl font-bold text-white mb-2">Desire to Sow a Custom Covenant Amount?</h4>
                <p className="text-white/70 text-xs sm:text-sm mb-6">
                  Enter any amount you are led in your heart to support the global harvest.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <div className="relative w-full max-w-xs">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-sm font-semibold">
                      {currencyView}
                    </span>
                    <input
                      type="number"
                      min="100"
                      value={isCustomAmount ? customAmountKes : ""}
                      onChange={(e) => {
                        setIsCustomAmount(true);
                        setCustomAmountKes(Math.max(100, Number(e.target.value)));
                      }}
                      placeholder="e.g. 15,000"
                      className="w-full pl-16 pr-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-sm focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSelectCustomAndProceed}
                    className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] hover:brightness-110 shadow-md transition-all flex items-center gap-2"
                  >
                    <span>Proceed to Checkout</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Ambassador Privileges Deep Dive */}
          <section className="py-20 px-4 sm:px-6 bg-gradient-to-b from-[#09182d] to-[#071324] border-t border-white/10">
            <div className="container-main mx-auto max-w-7xl">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#d4af37]/15 text-[#fbf5b7] border border-[#d4af37]/30 text-xs font-semibold mb-4">
                  <Award className="w-4 h-4 text-[#d4af37]" />
                  <span>Partner Recognition &amp; Global Access</span>
                </div>
                <h3 className="font-brand text-3xl sm:text-5xl font-bold text-white mb-4">
                  Exclusive Kingdom Ambassador Incentives
                </h3>
                <p className="font-outfit text-white/75 text-base sm:text-lg">
                  We honor our covenant partners with practical ministerial support, travel opportunities, and verified credentials.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                {ambassadorIncentives.map((incentive) => {
                  const Icon = incentive.icon;
                  return (
                    <div
                      key={incentive.title}
                      className="p-8 rounded-3xl bg-white/[0.04] border border-white/10 hover:border-[#d4af37]/30 transition-all flex flex-col sm:flex-row items-start gap-6"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d4af37]/20 to-[#f97316]/20 border border-[#d4af37]/30 flex items-center justify-center text-[#fbf5b7] shrink-0">
                        <Icon className="w-7 h-7 text-[#d4af37]" />
                      </div>
                      <div>
                        <h4 className="font-brand text-xl font-bold text-white mb-2">{incentive.title}</h4>
                        <p className="font-outfit text-white/70 text-sm leading-relaxed">{incentive.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Interactive Digital Partner ID Card Mockup Preview */}
              <div className="max-w-xl mx-auto p-8 rounded-3xl bg-gradient-to-br from-[#0c1b33] via-[#112440] to-[#1a1208] border-2 border-[#d4af37]/50 shadow-[0_0_40px_rgba(212,175,55,0.2)] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle,rgba(212,175,55,0.15)_0%,transparent_70%)] pointer-events-none blur-2xl" />
                <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
                  <img src={brandLogo} alt="" className="w-56 h-56 object-contain" />
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <img
                      src={brandLogo}
                      alt="Kingdom Missions Network"
                      className="w-12 h-12 rounded-xl object-contain border border-[#d4af37]/40 p-1 bg-white/5 drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]"
                      width="48"
                      height="48"
                    />
                    <div>
                      <span className="font-brand text-base font-bold text-white tracking-wider block">
                        KINGDOM MISSIONS NETWORK
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#d4af37]">
                        Official Global Partner Credential
                      </span>
                    </div>
                  </div>
                  <Crown className="w-7 h-7 text-[#d4af37] drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 relative z-10 text-xs">
                  <div>
                    <span className="text-[10px] text-white/50 uppercase font-semibold block">Member Name</span>
                    <span className="font-bold text-white text-sm">Pastor David M. Kariuki</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/50 uppercase font-semibold block">Partner Tier</span>
                    <span className="font-bold text-[#fbf5b7] text-sm">Kingdom Ambassador</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/50 uppercase font-semibold block">Credential ID</span>
                    <span className="font-mono text-emerald-400 font-bold">KMN-AMB-2026-8941</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/50 uppercase font-semibold block">Status</span>
                    <span className="inline-flex items-center gap-1 text-emerald-300 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Active &amp; Endorsed
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60 relative z-10">
                  <span>Authorized by Bishop Dr. George Githinji</span>
                  <span className="text-[#d4af37] font-semibold">24/7 Altar Enrollment</span>
                </div>
              </div>
            </div>
          </section>

          {/* FAQs */}
          <section className="py-20 px-4 sm:px-6 bg-[#071324] border-t border-white/10">
            <div className="container-main mx-auto max-w-4xl">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-semibold mb-4">
                  <HelpCircle className="w-4 h-4 text-[#d4af37]" />
                  <span>Frequently Asked Questions</span>
                </div>
                <h3 className="font-brand text-3xl sm:text-4xl font-bold text-white">
                  Everything You Need to Know
                </h3>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, index) => {
                  const isOpen = activeFaq === index;
                  return (
                    <div
                      key={faq.q}
                      className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveFaq(isOpen ? null : index)}
                        className="w-full p-6 text-left flex items-center justify-between gap-4 font-brand text-base sm:text-lg font-semibold text-white hover:text-[#d4af37] transition-colors"
                      >
                        <span>{faq.q}</span>
                        <ChevronRight
                          className={`w-5 h-5 text-white/50 shrink-0 transition-transform ${
                            isOpen ? "rotate-90 text-[#d4af37]" : ""
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-6 pt-0 font-outfit text-white/70 text-sm leading-relaxed border-t border-white/5">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Top-Tier Seamless Onboarding Transition Overlay */}
      {onboardingStage !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c1b33]/95 backdrop-blur-md animate-fade-in"
        >
          <div className="bg-[#102445] border-2 border-[#d4af37]/60 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#d4af37]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#4169e1]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center border-2 border-[#d4af37] bg-[#0c1b33] shadow-[0_0_24px_rgba(212,175,55,0.4)]">
                  <img src={brandLogo} alt="Kingdom Missions Network" className="w-14 h-14 object-contain" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-1 text-[#0c1b33] border-2 border-[#102445]">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>

              <h3 className="font-brand text-2xl font-bold text-white mb-2">
                Activating Covenant Partnership
              </h3>
              <p className="text-xs text-white/70 mb-6">
                Please wait while our secure gateway provisions your digital credentials...
              </p>

              {/* Progress Steps */}
              <div className="space-y-3 text-left">
                {[
                  { step: 1, label: "Payment verified & authorized" },
                  { step: 2, label: "Minting official Partner Credential & ID" },
                  { step: 3, label: "Enrolling on Bishop's 24/7 Global Prayer Altar" },
                  { step: 4, label: "Preparing your Covenant Partner Dashboard" },
                ].map((item) => {
                  const isDone = onboardingStage > item.step;
                  const isCurrent = onboardingStage === item.step;
                  return (
                    <div
                      key={item.step}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        isDone
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                          : isCurrent
                          ? "bg-[#d4af37]/15 border-[#d4af37]/60 text-white shadow-[0_0_12px_rgba(212,175,55,0.2)]"
                          : "bg-white/[0.02] border-white/5 text-white/40"
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {isDone ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : isCurrent ? (
                          <Loader2 className="w-5 h-5 text-[#d4af37] animate-spin" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-white/20 text-white/30 text-[10px] font-bold flex items-center justify-center">
                            {item.step}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
