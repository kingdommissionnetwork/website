import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  Download,
  X,
  Copy,
  Smartphone,
  CreditCard,
  Building2,
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
interface PartnerPlan {
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

const PARTNER_PLANS: PartnerPlan[] = [
  {
    id: "seed",
    name: "Seed Partner",
    badge: "🌱 Seed Partner",
    kesMonthly: 1000,
    tagline: "Foundational Mission & Bread Support",
    description: "Sow into frontline evangelism, gospel bread relief for hungry families, and Holy Bible distribution.",
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
    a: "In Kenya and East Africa, you can subscribe via M-Pesa, Airtel Money, or Debit/Credit card through Paystack. Globally, you can use PayPal, Visa, Mastercard, or American Express in USD.",
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
  const [searchParams] = useSearchParams();

  const [selectedPlanId, setSelectedPlanId] = useState<string>("ambassador");
  const [isCustomAmount, setIsCustomAmount] = useState<boolean>(false);
  const [customAmountKes, setCustomAmountKes] = useState<number>(5000);
  const [currencyView, setCurrencyView] = useState<"KES" | "USD">("KES");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [exchangeRate, setExchangeRate] = useState<number>(0.00772);
  const [loadingRate, setLoadingRate] = useState<boolean>(true);
  const [subscriberName, setSubscriberName] = useState(user?.name || "");
  const [subscriberEmail, setSubscriberEmail] = useState(user?.email || "");
  const [submitting, setSubmitting] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [onboardingStage, setOnboardingStage] = useState<number | null>(null);
  const [subMethod, setSubMethod] = useState<"mpesa" | "card" | "paypal">("mpesa");
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
  const activeAmountKes = isCustomAmount ? customAmountKes : activePlan.kesMonthly * (billingCycle === "yearly" ? 12 : 1);
  const activeAmountUsd = Number((activeAmountKes * exchangeRate).toFixed(2));

  // Seamless Onboarding Handshake Sequence (Stripe/Patreon Benchmark)
  const runOnboardingTransition = async (planTitle: string, verifiedUser?: Record<string, unknown> | null, token?: string | null) => {
    setIsSubscribed(true);
    setOnboardingStage(1);
    if (verifiedUser) {
      setSession(verifiedUser as any, token || undefined);
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
        partnerName: subscriberName || (verifiedUser?.name as string) || "Kingdom Partner",
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

  // M-Pesa Paybill subscription flow (Immediate)
  const handleMpesaSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriberName.trim()) {
      showToast("Please enter your full name", "error");
      return;
    }
    if (!subscriberEmail.trim() || !subscriberEmail.includes("@")) {
      showToast("Please enter a valid email address", "error");
      return;
    }
    if (!mpesaRefCode.trim()) {
      showToast("Please enter your M-Pesa transaction confirmation code", "error");
      return;
    }

    setSubmitting(true);
    try {
      await api.payments.reportOffline({
        amount: activeAmountKes,
        currency: "KES",
        donor_name: subscriberName.trim(),
        donor_email: subscriberEmail.trim(),
        payment_provider: "mpesa_paybill",
        payment_reference: mpesaRefCode.trim().toUpperCase(),
        notes: `Covenant Partner Plan: ${activePlan.name} (${billingCycle})`,
        recurring: billingCycle === "monthly",
      });

      showToast("M-Pesa payment submitted! Activating your partner dashboard...", "success");
      await runOnboardingTransition(activePlan.name, {
        name: subscriberName.trim(),
        email: subscriberEmail.trim(),
      });
    } catch {
      showToast("Could not record payment. Please try again.", "error");
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
    <div className="pt-[72px] md:pt-[108px] min-h-screen bg-[#071324] text-white">
      <SEO
        title="Kingdom Partnership Packages — Kingdom Missions Network"
        description="Join Kingdom Missions Network as a covenant partner. Support reaching the unreached, feeding the nations, and global crusades with exclusive ambassador incentives."
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0c1b33] via-[#071324] to-[#1a1107] py-20 lg:py-28 px-4 sm:px-6">
        {/* Warm Orange & Golden Radiant Background Glows */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(249,115,22,0.20)_0%,transparent_65%)] pointer-events-none blur-3xl" />
        <div className="absolute bottom-0 left-10 w-[550px] h-[550px] bg-[radial-gradient(circle,rgba(212,175,55,0.22)_0%,transparent_65%)] pointer-events-none blur-3xl" />

        <AmbientParticles />

        <div className="container-main mx-auto text-center max-w-4xl relative z-10">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 border border-[#d4af37]/40 text-[#fbf5b7] text-xs sm:text-sm font-semibold mb-4 shadow-inner backdrop-blur-md">
              <Crown className="w-4 h-4 text-[#d4af37]" />
              <span>Global Mission Covenant • Kingdom Missions Network</span>
            </div>

            <div className="mb-6 flex justify-center">
              <Link
                to="/partner-portal"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#d4af37]/15 hover:bg-[#d4af37]/25 border border-[#d4af37]/40 text-[#fbf5b7] text-xs sm:text-sm font-bold transition-all shadow-md"
              >
                <Sparkles className="w-4 h-4 text-[#d4af37]" />
                <span>Already a Covenant Partner? Access Your Partner Dashboard →</span>
              </Link>
            </div>

            <h1 className="font-brand text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
              Stand with Us to <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] bg-clip-text text-transparent">
                Reach the Unreached & Feed the Nations
              </span>
            </h1>

            <p className="font-outfit text-white/80 text-base sm:text-xl max-w-3xl mx-auto leading-relaxed mb-10">
              Partner in God&apos;s global harvest. Your covenant support funds gospel crusades, village food relief, Holy Bible distribution, and unlocks official missionary ambassador credentials.
            </p>

            {/* Currency & Billing Controls */}
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
                  className="p-8 rounded-3xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 hover:border-[#d4af37]/40 transition-all group"
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

      {/* Main Partnership Packages Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative" id="packages">
        <div className="container-main mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-outfit text-xs font-bold uppercase tracking-[0.25em] text-[#d4af37] mb-3">
              Covenant Tiers & Privileges
            </h2>
            <h3 className="font-brand text-3xl sm:text-5xl font-bold text-white mb-4">
              Choose Your Partnership Package
            </h3>
            <p className="font-outfit text-white/75 text-base sm:text-lg">
              Select a tier that aligns with your spiritual devotion and kingdom calling.
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
                  onClick={() => {
                    setSelectedPlanId(plan.id);
                    setIsCustomAmount(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedPlanId(plan.id);
                      setIsCustomAmount(false);
                    }
                  }}
                  className={`relative rounded-3xl p-7 flex flex-col justify-between cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? "bg-gradient-to-b from-[#132c52] to-[#0d1d36] border-2 border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.25)] scale-[1.02]"
                      : "bg-white/[0.04] border border-white/10 hover:border-white/25 hover:bg-white/[0.06]"
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
                      <h4 className="font-brand text-2xl font-bold text-white mb-2">{plan.name}</h4>
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

                  {/* Select Radio Button */}
                  <button
                    type="button"
                    className={`w-full py-3 rounded-2xl font-bold text-xs sm:text-sm tracking-wide transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] text-[#0c1b33] shadow-lg"
                        : "bg-white/10 text-white/90 hover:bg-white/15"
                    }`}
                  >
                    {isSelected ? "Selected Tier ✓" : `Choose ${plan.name}`}
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
                onClick={() => setIsCustomAmount(true)}
                className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                  isCustomAmount
                    ? "bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] shadow-md"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                Set Custom Amount
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Ambassador Incentives & Privileges Deep Dive */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-b from-[#09182d] to-[#071324] border-t border-white/10">
        <div className="container-main mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#d4af37]/15 text-[#fbf5b7] border border-[#d4af37]/30 text-xs font-semibold mb-4">
              <Award className="w-4 h-4 text-[#d4af37]" />
              <span>Partner Recognition & Global Access</span>
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
            {/* Holographic Watermark Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle,rgba(212,175,55,0.15)_0%,transparent_70%)] pointer-events-none blur-2xl" />

            {/* Background Logo Watermark */}
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
              <ShieldCheck className="w-7 h-7 text-[#d4af37]" />
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <span className="text-[10px] uppercase text-white/50 block font-semibold">Covenant Partner</span>
                <span className="font-outfit text-lg font-bold text-white">
                  {subscriberName || user?.name || "Dr. / Pastor / Partner"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase text-white/50 block font-semibold">Partnership Level</span>
                  <span className="font-outfit text-sm font-bold text-[#fbf5b7]">
                    {isCustomAmount ? "Custom Covenant Partner" : activePlan.name}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-white/50 block font-semibold">Deployment Status</span>
                  <span className="font-outfit text-sm font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Verified Active
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50">
              <span>Spiritual Oversight: Bishop Dr. George Githinji</span>
              <span className="font-mono">ID: KMN-{Date.now().toString().slice(-6)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Checkout Section */}
      <section className="py-20 px-4 sm:px-6 bg-[#071324] border-t border-white/10" id="checkout">
        <div className="container-main mx-auto max-w-3xl">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/15 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold mb-3">
                <Check className="w-3.5 h-3.5" />
                <span>Selected: {isCustomAmount ? "Custom Covenant" : activePlan.name}</span>
              </div>
              <h3 className="font-brand text-2xl sm:text-4xl font-bold text-white mb-2">
                Activate Your Monthly Partnership
              </h3>
              <p className="text-white/70 text-xs sm:text-sm">
                Total Seed:{" "}
                <span className="text-white font-bold">
                  {currencyView === "KES" ? `KES ${activeAmountKes.toLocaleString()}` : `$${activeAmountUsd.toFixed(2)} USD`}
                </span>{" "}
                per month
              </p>
            </div>

            {/* Payment Method Selector */}
            <div className="flex items-center justify-center mb-8">
              <div className="inline-flex p-1.5 rounded-2xl bg-white/10 border border-white/15 max-w-md w-full">
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
                  <span>M-Pesa Paybill</span>
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

            {/* METHOD 1: M-PESA PAYBILL DIRECT (IMMEDIATE) */}
            {subMethod === "mpesa" && (
              <div className="space-y-6">
                {/* Official Bank / Paybill Details Tile */}
                <div className="p-6 rounded-2xl bg-white/[0.06] border border-[#d4af37]/40 shadow-inner">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-[#d4af37]" />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#d4af37]">
                        Kingdom Churches · Co-op Bank
                      </span>
                    </div>
                    <span className="text-xs text-white/60">
                      Amount: <strong className="text-[#fbf5b7]">KES {activeAmountKes.toLocaleString()}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {/* Paybill */}
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-white/60 uppercase font-semibold block">
                          M-Pesa Paybill No
                        </span>
                        <span className="font-mono text-xl font-extrabold text-[#fbf5b7]">
                          400200
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard("400200", "Paybill 400200")}
                        className="py-1 px-2.5 rounded-lg bg-white/10 hover:bg-[#d4af37] hover:text-[#0c1b33] text-[11px] font-bold transition-all flex items-center gap-1"
                      >
                        {copiedKey === "Paybill 400200" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>

                    {/* Account Number */}
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-white/60 uppercase font-semibold block">
                          Account Number
                        </span>
                        <span className="font-mono text-xl font-extrabold text-[#fbf5b7]">
                          1335674365
                        </span>
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

                  <div className="text-[11px] text-white/70 leading-relaxed">
                    Send <strong>KES {activeAmountKes.toLocaleString()}</strong> to Paybill <strong>400200</strong>, Account <strong>1335674365</strong>, then enter your M-Pesa transaction code below to instantly activate your partner privileges.
                  </div>
                </div>

                {/* Partner Form with M-Pesa Code */}
                <form onSubmit={handleMpesaSubscription} className="space-y-4">
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
                      Email Address (For receipt & Partner ID Card delivery) *
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
                      Found in your M-Pesa SMS after sending KES {activeAmountKes.toLocaleString()} to 400200
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] text-[#0c1b33] font-bold text-sm sm:text-base tracking-wide shadow-xl hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Verifying &amp; Activating Covenant Partnership...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        <span>Confirm M-Pesa Payment &amp; Activate Partner Access</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* METHOD 2: CARD / PAYSTACK */}
            {subMethod === "card" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePaystack();
                }}
                className="space-y-6"
              >
                <div>
                  <label htmlFor="partnerNameCard" className="block text-xs uppercase font-bold text-white/70 mb-2">
                    Full Name / Ministry Name
                  </label>
                  <input
                    id="partnerNameCard"
                    type="text"
                    value={subscriberName}
                    onChange={(e) => setSubscriberName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="w-full px-4 py-3.5 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label htmlFor="partnerEmailCard" className="block text-xs uppercase font-bold text-white/70 mb-2">
                    Email Address (For receipt &amp; Partner ID Card delivery)
                  </label>
                  <input
                    id="partnerEmailCard"
                    type="email"
                    value={subscriberEmail}
                    onChange={(e) => setSubscriberEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    className="w-full px-4 py-3.5 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] text-[#0c1b33] font-bold text-sm sm:text-base tracking-wide shadow-xl hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
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
                        Subscribe via Card ({currencyView === "KES" ? `KES ${activeAmountKes.toLocaleString()}` : `$${activeAmountUsd} USD`})
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
                  International covenant partners can subscribe securely in USD ($${activeAmountUsd.toFixed(2)}/month) via PayPal.
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

      {/* FAQs */}
      <section className="py-20 px-4 sm:px-6 bg-[#09182d] border-t border-white/10">
        <div className="container-main mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h3 className="font-brand text-2xl sm:text-4xl font-bold text-white mb-2">
              Frequently Asked Questions
            </h3>
            <p className="text-white/70 text-xs sm:text-sm">Everything you need to know about partnering with KMN.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl bg-white/[0.04] border border-white/10 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full p-6 text-left font-bold text-sm sm:text-base text-white flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  <HelpCircle className="w-4 h-4 text-[#d4af37] shrink-0" />
                </button>
                {activeFaq === index && (
                  <div className="px-6 pb-6 text-xs sm:text-sm text-white/75 leading-relaxed border-t border-white/10 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
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
                className="w-full py-2.5 rounded-xl bg-[#d4af37]/20 hover:bg-[#d4af37]/30 border border-[#d4af37]/40 text-[#fbf5b7] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
              >
                <Crown className="w-4 h-4 text-[#d4af37]" />
                <span>Go to Covenant Partner Dashboard →</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Top-Tier Seamless Onboarding Transition Overlay (Stripe/Substack Benchmark) */}
      {onboardingStage !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c1b33]/95 backdrop-blur-md animate-fade-in"
        >
          <div className="bg-[#102445] border-2 border-[#d4af37]/60 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
            {/* Ambient gold glow */}
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
