import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Sparkles,
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
  Globe,
  Heart,
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

const GIVING_PURPOSES = [
  { id: "general", label: "General Missions Outreach", icon: "🕊️" },
  { id: "tithe", label: "Tithes & Love Offerings", icon: "🌾" },
  { id: "crusades", label: "Village Crusades & Outreaches", icon: "🔥" },
  { id: "relief", label: "Bread of Life Food Aid", icon: "🍞" },
  { id: "pastoral", label: "Pastoral & Missionary Travel", icon: "⛪" },
];

const ONE_TIME_PRESETS = [500, 1000, 2500, 5000, 10000];

interface ReceiptInfo {
  reference: string;
  donorName: string;
  donorEmail: string;
  amountKes: number;
  amountUsd: number;
  purpose: string;
  paymentMethod: string;
  date: string;
}

const showStkPush = import.meta.env.VITE_ENABLE_STK_PUSH === "true";

export default function GivePage() {
  const { user, setSession } = useAuth();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedPurpose, setSelectedPurpose] = useState<string>("General Missions Outreach");
  const [oneTimeAmount, setOneTimeAmount] = useState<number>(2500);
  const [isCustomAmount, setIsCustomAmount] = useState<boolean>(false);
  const [customAmountVal, setCustomAmountVal] = useState<number>(3000);
  const [currencyView, setCurrencyView] = useState<"KES" | "USD">("KES");
  const [exchangeRate, setExchangeRate] = useState<number>(0.00772);
  const [donorName, setDonorName] = useState(user?.name || "");
  const [donorEmail, setDonorEmail] = useState(user?.email || "");
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "card" | "manual" | "paypal">(showStkPush ? "mpesa" : "manual");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [stkPending, setStkPending] = useState(false);
  const [stkStatusMessage, setStkStatusMessage] = useState("");
  const [stkSecondsLeft, setStkSecondsLeft] = useState(60);
  const [manualRefCode, setManualRefCode] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptInfo | null>(null);

  const currentAmountKes = isCustomAmount ? customAmountVal : oneTimeAmount;
  const currentAmountUsd = Number((currentAmountKes * exchangeRate).toFixed(2));

  useEffect(() => {
    if (user?.name && !donorName) setDonorName(user.name);
    if (user?.email && !donorEmail) setDonorEmail(user.email);
  }, [user, donorName, donorEmail]);

  useEffect(() => {
    api.subscriptions
      .getPricing(1000)
      .then((data) => { if (data.exchangeRate) setExchangeRate(data.exchangeRate); })
      .catch(() => setExchangeRate(0.00772));
    if (paystackKey && !window.PaystackPop) {
      const s = document.createElement("script");
      s.src = "https://js.paystack.co/v1/inline.js";
      s.async = true;
      document.body.appendChild(s);
      return () => { if (document.body.contains(s)) document.body.removeChild(s); };
    }
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedKey(label);
    showToast(`${label} copied!`, "success");
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleProceedToPayment = () => {
    if (currentAmountKes < 50) { showToast("Minimum gift amount is KES 50", "error"); return; }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const completeTransaction = (
    reference: string,
    provider: string,
    verifiedUser?: Record<string, unknown> | null,
    token?: string | null
  ) => {
    if (token && verifiedUser) {
      const authUser = {
        id: (verifiedUser.id as number) || 1,
        name: (verifiedUser.name as string) || donorName || "Kingdom Partner",
        email: (verifiedUser.email as string) || donorEmail,
        role: ((verifiedUser.role === "admin" || verifiedUser.role === "superadmin")
          ? verifiedUser.role : "member") as "member" | "admin" | "superadmin",
      };
      setSession(authUser, token);
    }
    setReceipt({
      reference,
      donorName: donorName || "Kingdom Giver",
      donorEmail: donorEmail || "info@kingdommissionnetwork.org",
      amountKes: currentAmountKes,
      amountUsd: currentAmountUsd,
      purpose: selectedPurpose,
      paymentMethod: provider,
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
      }),
    });
    setStkPending(false);
    setSubmitting(false);
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("Payment confirmed! Thank you for your kingdom seed.", "success");
  };

  const handleMpesaStk = async () => {
    if (!mpesaPhone || mpesaPhone.trim().length < 9) {
      showToast("Please enter a valid Safaricom phone number (e.g. 0712345678)", "error"); return;
    }
    if (!donorEmail || !donorEmail.includes("@")) {
      showToast("Please enter a valid email address for your receipt", "error"); return;
    }
    setSubmitting(true);
    setStkPending(true);
    setStkSecondsLeft(60);
    setStkStatusMessage("Contacting Safaricom M-Pesa gateway...");
    try {
      const res = await api.subscriptions.initiateMpesaStk({
        phoneNumber: mpesaPhone.trim(),
        name: donorName || "Kingdom Partner",
        email: donorEmail.trim(),
        amount: currentAmountKes,
        planName: `Offering: ${selectedPurpose}`,
        planId: "onetime_seed",
        interval: "monthly",
      });
      setStkStatusMessage("Prompt sent to your phone! Please enter your M-Pesa PIN now.");
      const checkoutId = res.checkoutRequestId;
      const pollInterval = setInterval(async () => {
        try {
          const pollRes = await api.subscriptions.queryMpesaStk(checkoutId);
          if (pollRes.status === "completed") {
            clearInterval(pollInterval);
            completeTransaction(pollRes.receiptCode || checkoutId, "M-Pesa STK Push", pollRes.user as Record<string, unknown>, pollRes.token);
          } else if (pollRes.status === "failed") {
            clearInterval(pollInterval);
            setStkPending(false); setSubmitting(false);
            showToast("M-Pesa payment cancelled or failed. Please try again.", "error");
          }
        } catch { /* ignore polling errors */ }
      }, 3000);
      const timer = setInterval(() => {
        setStkSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer); clearInterval(pollInterval);
            setStkPending(false); setSubmitting(false);
            setStkStatusMessage("Prompt timed out. If you entered your PIN, verify using your M-Pesa code below.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setStkPending(false); setSubmitting(false);
      showToast("Failed to initiate M-Pesa prompt. You can give via Paybill 522522 directly.", "error");
    }
  };

  const handleCardPayment = async () => {
    if (!donorEmail || !donorEmail.includes("@")) { showToast("Please enter a valid email address", "error"); return; }
    setSubmitting(true);
    try {
      const initData = await api.subscriptions.initialize({
        email: donorEmail.trim(), name: donorName || "Kingdom Partner",
        amount: currentAmountKes, currency: "KES", interval: "monthly",
        planId: "onetime_seed", planName: `Gift: ${selectedPurpose}`,
      });
      if (window.PaystackPop && initData.reference) {
        const handler = window.PaystackPop.setup({
          key: paystackKey, email: donorEmail.trim(),
          amount: currentAmountKes * 100, currency: "KES", ref: initData.reference,
          callback: async (response: { reference: string }) => {
            try {
              const verifyRes = await api.subscriptions.verify(response.reference);
              completeTransaction(response.reference, "Card (Paystack)", verifyRes.user as Record<string, unknown>, verifyRes.token);
            } catch { completeTransaction(response.reference, "Card (Paystack)", null, null); }
          },
          onClose: () => { showToast("Payment window closed.", "info"); setSubmitting(false); },
        });
        handler.openIframe();
      } else if (initData.authorization_url) {
        window.location.href = initData.authorization_url;
      }
    } catch { showToast("Could not start card checkout. Please try again or use M-Pesa.", "error"); setSubmitting(false); }
  };

  const handleManualVerification = async () => {
    if (!manualRefCode || manualRefCode.trim().length < 5) {
      showToast("Please enter your M-Pesa transaction code", "error"); return;
    }
    setSubmitting(true);
    try {
      await api.payments.reportOffline({
        amount: currentAmountKes, currency: "KES",
        donor_name: donorName || "Kingdom Partner",
        donor_email: donorEmail || "partner@kingdommissionnetwork.org",
        payment_provider: "mpesa_paybill",
        payment_reference: manualRefCode.trim().toUpperCase(),
        recurring: false, notes: selectedPurpose,
      });
      completeTransaction(manualRefCode.trim().toUpperCase(), "M-Pesa Paybill 522522", null, null);
    } catch { completeTransaction(manualRefCode.trim().toUpperCase(), "M-Pesa Paybill 522522", null, null); }
  };

  const handlePayPal = async () => {
    setSubmitting(true);
    try {
      const order = await api.subscriptions.paypalCreate({
        name: donorName || "Kingdom Partner",
        email: donorEmail || "partner@kingdommissionnetwork.org",
        amount: currentAmountKes, planName: `Gift: ${selectedPurpose}`,
      });
      if (window.paypal) {
        window.paypal.Buttons({
          createOrder: () => Promise.resolve(order.id),
          onApprove: async (data: { orderID: string }) => {
            try {
              const capture = await api.subscriptions.paypalCapture({ orderId: data.orderID, subscriberName: donorName || "Kingdom Partner" });
              completeTransaction(capture.id || data.orderID, "PayPal", capture.user as Record<string, unknown>, capture.token);
            } catch { completeTransaction(data.orderID, "PayPal", null, null); }
          },
          onError: () => { showToast("PayPal transaction was not completed.", "error"); setSubmitting(false); },
        }).render("#paypal-button-mount");
      } else { showToast("PayPal service loading, please try in a moment.", "info"); setSubmitting(false); }
    } catch { showToast("Unable to initialize PayPal.", "error"); setSubmitting(false); }
  };

  return (
    <div className="pt-[68px] md:pt-[96px] min-h-screen bg-[#071324] text-white flex flex-col">
      <SEO
        title="Give Online — Kingdom Missions Network"
        description="Support frontline evangelism, gospel bread relief, and village crusades. Instant M-Pesa STK push and official tax receipts."
      />

      <div className="relative py-6 sm:py-10 px-4 sm:px-6 grow flex items-center justify-center">
        <AmbientParticles />
        <div className="w-full max-w-4xl mx-auto relative z-10">

          {/* STEP INDICATOR */}
          <div className="mb-6 max-w-xl mx-auto">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-white/60">
              <span className={`flex items-center gap-1.5 ${currentStep >= 1 ? "text-[#d4af37]" : ""}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                  currentStep > 1 ? "bg-emerald-500 text-white" : currentStep === 1 ? "bg-[#d4af37] text-[#0c1b33]" : "bg-white/20"
                }`}>{currentStep > 1 ? "✓" : "1"}</span>
                Choose Gift
              </span>
              <div className={`h-0.5 flex-1 mx-3 rounded ${currentStep >= 2 ? "bg-[#d4af37]" : "bg-white/10"}`} />
              <span className={`flex items-center gap-1.5 ${currentStep >= 2 ? "text-[#d4af37]" : ""}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                  currentStep > 2 ? "bg-emerald-500 text-white" : currentStep === 2 ? "bg-[#d4af37] text-[#0c1b33]" : "bg-white/20"
                }`}>{currentStep > 2 ? "✓" : "2"}</span>
                Payment
              </span>
              <div className={`h-0.5 flex-1 mx-3 rounded ${currentStep === 3 ? "bg-emerald-500" : "bg-white/10"}`} />
              <span className={`flex items-center gap-1.5 ${currentStep === 3 ? "text-emerald-400" : ""}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                  currentStep === 3 ? "bg-emerald-500 text-white" : "bg-white/20"
                }`}>3</span>
                Receipt
              </span>
            </div>
          </div>

          {/* ══ STEP 1: CHOOSE GIFT ══ */}
          {currentStep === 1 && (
            <div className="bg-[#0c1b33]/90 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#fbf5b7] text-xs font-bold uppercase tracking-wider mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                  Kingdom Missions Network
                </div>
                <h1 className="font-brand text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">
                  Give &amp; Sow Your{" "}
                  <span className="bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] bg-clip-text text-transparent">
                    Kingdom Seed
                  </span>
                </h1>
                <p className="text-white/65 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
                  100% of your gift directly powers village crusades, missionary transit, and humanitarian bread relief.
                </p>
                <p className="text-[11px] text-white/40 mt-2">
                  Want to become a monthly covenant partner?{" "}
                  <Link to="/subscribe" className="text-[#d4af37] hover:underline font-semibold">View Partnership Plans →</Link>
                </p>
              </div>

              {/* Purpose Selector */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-[#fbf5b7] uppercase tracking-wider mb-3">
                  Select Giving Designation / Purpose:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {GIVING_PURPOSES.map((purpose) => (
                    <button key={purpose.id} type="button" onClick={() => setSelectedPurpose(purpose.label)}
                      className={`p-3.5 rounded-xl text-left text-xs font-bold border transition-all flex items-center gap-2.5 ${
                        selectedPurpose === purpose.label
                          ? "bg-[#d4af37]/20 border-[#d4af37] text-white shadow-md"
                          : "bg-white/[0.04] border-white/10 text-white/75 hover:bg-white/[0.08] hover:border-white/20"
                      }`}>
                      <span className="text-lg">{purpose.icon}</span>
                      <span>{purpose.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset Amounts */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-[#fbf5b7] uppercase tracking-wider">Select Amount:</label>
                  <div className="flex items-center bg-white/[0.06] rounded-xl p-0.5 border border-white/10">
                    <button type="button" onClick={() => setCurrencyView("KES")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${currencyView === "KES" ? "bg-[#d4af37] text-[#0c1b33]" : "text-white/50 hover:text-white"}`}>
                      KES
                    </button>
                    <button type="button" onClick={() => setCurrencyView("USD")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${currencyView === "USD" ? "bg-[#d4af37] text-[#0c1b33]" : "text-white/50 hover:text-white"}`}>
                      USD
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                  {ONE_TIME_PRESETS.map((amt) => {
                    const isSelected = !isCustomAmount && oneTimeAmount === amt;
                    const usdVal = (amt * exchangeRate).toFixed(0);
                    return (
                      <button key={amt} type="button"
                        onClick={() => { setIsCustomAmount(false); setOneTimeAmount(amt); }}
                        className={`py-3.5 px-2 rounded-2xl border text-center transition-all ${
                          isSelected
                            ? "bg-gradient-to-br from-[#d4af37] to-[#b38a1f] text-[#0c1b33] border-white/30 font-extrabold shadow-lg scale-[1.03]"
                            : "bg-white/[0.05] border-white/10 text-white hover:bg-white/[0.1] hover:border-white/20 font-semibold"
                        }`}>
                        <div className="text-sm sm:text-base font-bold">
                          {currencyView === "KES" ? `KES ${amt.toLocaleString()}` : `$${usdVal}`}
                        </div>
                        <div className="text-[10px] opacity-70 mt-0.5">
                          {currencyView === "KES" ? `~$${usdVal}` : `~${amt.toLocaleString()} KES`}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {!isCustomAmount ? (
                  <button type="button" onClick={() => setIsCustomAmount(true)}
                    className="w-full py-2.5 px-4 rounded-xl border border-dashed border-white/25 text-xs text-white/60 hover:text-white hover:border-[#d4af37] transition-all font-semibold text-center">
                    + Enter Custom Amount
                  </button>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.05] border border-[#d4af37]/50">
                    <span className="text-sm font-bold text-[#d4af37]">KES</span>
                    <input type="number" min="50" step="100" value={customAmountVal}
                      onChange={(e) => setCustomAmountVal(Math.max(50, Number(e.target.value)))}
                      placeholder="Enter amount in KES"
                      className="w-full bg-transparent text-white font-bold text-base focus:outline-none" />
                    <span className="text-xs text-white/50 shrink-0">~${(customAmountVal * exchangeRate).toFixed(2)} USD</span>
                    <button type="button" onClick={() => { setIsCustomAmount(false); setOneTimeAmount(2500); }}
                      className="text-white/40 hover:text-white text-xs shrink-0 transition-colors">✕</button>
                  </div>
                )}
              </div>

              {/* Action Row */}
              <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-white/60">
                  <span>Sowing </span>
                  <span className="font-bold text-[#fbf5b7]">KES {currentAmountKes.toLocaleString()} (~${currentAmountUsd} USD)</span>
                  <span> into </span>
                  <span className="font-semibold text-white/80">{selectedPurpose}</span>
                </div>
                <button type="button" onClick={handleProceedToPayment}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c5961d] text-[#0c1b33] font-extrabold text-sm sm:text-base hover:scale-105 hover:shadow-[0_0_25px_rgba(212,175,55,0.45)] transition-all flex items-center justify-center gap-2 shadow-xl">
                  <Heart className="w-4 h-4" />
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ══ STEP 2: PAYMENT ══ */}
          {currentStep === 2 && (
            <div className="bg-[#0c1b33]/90 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <button type="button" onClick={() => { setCurrentStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-[#d4af37] transition-colors mb-5 font-semibold">
                <ArrowLeft className="w-3.5 h-3.5" /> Change Amount or Purpose
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT: SUMMARY */}
                <div className="lg:col-span-5 p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-xs uppercase font-bold tracking-wider text-[#d4af37]">Giving Summary</span>
                    <button type="button" onClick={() => setCurrentStep(1)}
                      className="text-[11px] text-[#fbf5b7] underline hover:text-white">Edit</button>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white mb-1">{selectedPurpose}</div>
                    <div className="text-xs text-white/60 mb-2">One-Time Kingdom Seed Offering</div>
                    <div className="font-brand text-3xl font-extrabold text-[#fbf5b7]">KES {currentAmountKes.toLocaleString()}</div>
                    <div className="text-xs text-white/50">~${currentAmountUsd} USD</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-white/70 leading-relaxed">
                    Your offering directly supports crusade sound gear, Bibles, and missionary bread rations.
                  </div>
                  <div className="space-y-2 pt-2 text-[11px] text-white/60">
                    <div className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /><span>256-Bit SSL Encrypted &amp; Bank Compliant</span></div>
                    <div className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-[#d4af37] shrink-0" /><span>Safaricom M-Pesa &amp; Central Bank Verified</span></div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" /><span>Instant Digital Tax Receipt Issued</span></div>
                  </div>
                </div>

                {/* RIGHT: FORM */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-white/80 mb-1">Your Full Name:</label>
                      <input type="text" value={donorName} onChange={(e) => setDonorName(e.target.value)}
                        placeholder="e.g. John Kariuki"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm focus:outline-none focus:border-[#d4af37]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-white/80 mb-1">Email (for Receipt):</label>
                      <input type="email" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)}
                        placeholder="e.g. john@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm focus:outline-none focus:border-[#d4af37]" />
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-xs font-bold text-[#fbf5b7] uppercase tracking-wider mb-2">Select Payment Method:</label>
                    <div className={`grid ${showStkPush ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"} gap-2`}>
                      {showStkPush && (
                        <button type="button" onClick={() => setPaymentMethod("mpesa")}
                          className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${paymentMethod === "mpesa" ? "bg-emerald-600/20 border-emerald-400 text-white shadow-md font-bold" : "bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/[0.08]"}`}>
                          <Smartphone className="w-4 h-4 text-emerald-400" /><span className="text-[11px]">M-Pesa STK</span>
                        </button>
                      )}
                      <button type="button" onClick={() => setPaymentMethod("manual")}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${paymentMethod === "manual" ? "bg-emerald-600/20 border-emerald-400 text-white shadow-md font-bold" : "bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/[0.08]"}`}>
                        <Smartphone className="w-4 h-4 text-emerald-400" /><span className="text-[11px]">M-Pesa (Paybill 522522)</span>
                      </button>
                      <button type="button" onClick={() => setPaymentMethod("card")}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${paymentMethod === "card" ? "bg-[#d4af37]/20 border-[#d4af37] text-white shadow-md font-bold" : "bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/[0.08]"}`}>
                        <CreditCard className="w-4 h-4 text-[#d4af37]" /><span className="text-[11px]">Card / Online</span>
                      </button>
                      <button type="button" onClick={() => setPaymentMethod("paypal")}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${paymentMethod === "paypal" ? "bg-sky-600/20 border-sky-400 text-white shadow-md font-bold" : "bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/[0.08]"}`}>
                        <Globe className="w-4 h-4 text-sky-400" /><span className="text-[11px]">PayPal (USD)</span>
                      </button>
                    </div>
                  </div>

                  {/* M-PESA STK (Only when enabled in env) */}
                  {showStkPush && paymentMethod === "mpesa" && (
                    <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-emerald-300 mb-1">Safaricom M-Pesa Phone Number:</label>
                        <div className="relative">
                          <input type="tel" value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)}
                            placeholder="e.g. 0712345678" disabled={stkPending}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-emerald-400/40 text-white font-bold text-sm focus:outline-none focus:border-emerald-400 pr-32" />
                          <span className="absolute right-3 top-2.5 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">Instant STK Push</span>
                        </div>
                        <p className="text-[11px] text-white/60 mt-1">We will trigger an instant pop-up on your handset to authorize KES {currentAmountKes.toLocaleString()}.</p>
                      </div>
                      {stkPending ? (
                        <div className="p-4 rounded-xl bg-emerald-900/40 border border-emerald-400 text-center space-y-3">
                          <div className="relative w-12 h-12 mx-auto">
                            <span className="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-75" />
                            <div className="relative w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-[#0c1b33]">
                              <Smartphone className="w-6 h-6 animate-bounce" />
                            </div>
                          </div>
                          <div className="text-sm font-bold text-emerald-300">Check Your Phone Now!</div>
                          <div className="text-xs text-white/80">{stkStatusMessage}</div>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 text-emerald-400 font-mono text-xs font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            <span>00:{stkSecondsLeft < 10 ? `0${stkSecondsLeft}` : stkSecondsLeft}</span>
                          </div>
                        </div>
                      ) : (
                        <button type="button" onClick={handleMpesaStk} disabled={submitting}
                          className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm transition-all shadow-lg flex items-center justify-center gap-2">
                          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Sending STK Prompt...</span></>
                            : <><Smartphone className="w-4 h-4" /><span>Send M-Pesa Prompt (KES {currentAmountKes.toLocaleString()})</span></>}
                        </button>
                      )}
                    </div>
                  )}

                  {/* CARD */}
                  {paymentMethod === "card" && (
                    <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                      <div className="flex items-center gap-2 text-xs text-white/80">
                        <CreditCard className="w-4 h-4 text-[#d4af37]" /><span>Accepts Visa, MasterCard, and Apple Pay worldwide.</span>
                      </div>
                      <button type="button" onClick={handleCardPayment} disabled={submitting}
                        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c5961d] text-[#0c1b33] font-extrabold text-sm transition-all shadow-lg flex items-center justify-center gap-2 hover:brightness-110">
                        {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Opening Secure Gateway...</span></>
                          : <><Lock className="w-4 h-4" /><span>Pay KES {currentAmountKes.toLocaleString()} via Card</span></>}
                      </button>
                    </div>
                  )}

                  {/* MANUAL PAYBILL */}
                  {paymentMethod === "manual" && (
                    <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10">
                          <div className="text-[10px] text-white/50 uppercase font-bold">M-Pesa Paybill</div>
                          <div className="font-mono text-lg font-extrabold text-[#fbf5b7]">522522</div>
                          <button type="button" onClick={() => copyToClipboard("522522", "Paybill 522522")}
                            className="mt-1.5 w-full py-1 px-2 rounded bg-white/10 hover:bg-[#d4af37] hover:text-[#0c1b33] text-[10px] font-bold transition-all flex items-center justify-center gap-1">
                            {copiedKey === "Paybill 522522" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedKey === "Paybill 522522" ? "Copied!" : "Copy"}</span>
                          </button>
                        </div>
                        <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10">
                          <div className="text-[10px] text-white/50 uppercase font-bold">Account Number</div>
                          <div className="font-mono text-lg font-extrabold text-[#fbf5b7]">1335674365</div>
                          <button type="button" onClick={() => copyToClipboard("1335674365", "Account 1335674365")}
                            className="mt-1.5 w-full py-1 px-2 rounded bg-white/10 hover:bg-[#d4af37] hover:text-[#0c1b33] text-[10px] font-bold transition-all flex items-center justify-center gap-1">
                            {copiedKey === "Account 1335674365" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedKey === "Account 1335674365" ? "Copied!" : "Copy"}</span>
                          </button>
                        </div>
                      </div>
                      <div className="text-[11px] text-white/70 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>Account Name: <strong className="text-white">Heavenly God Kingdom Churches</strong> (KCB Bank)</span>
                      </div>

                      {/* Quick Steps */}
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white/80 space-y-1.5">
                        <div className="font-bold text-[#fbf5b7] text-[11px] uppercase tracking-wider mb-0.5">Quick Steps:</div>
                        <div className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-[#d4af37]/20 text-[#d4af37] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                          <span>Open M-Pesa &gt; <strong>Lipa na M-Pesa</strong> &gt; <strong>Paybill</strong></span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-[#d4af37]/20 text-[#d4af37] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                          <span>Business: <strong className="text-[#fbf5b7]">522522</strong> · Account: <strong className="text-[#fbf5b7]">1335674365</strong></span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-[#d4af37]/20 text-[#d4af37] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                          <span>Enter Amount: <strong className="text-[#fbf5b7]">KES {currentAmountKes.toLocaleString()}</strong> and your PIN</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-[#d4af37]/20 text-[#d4af37] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
                          <span>Enter the M-Pesa confirmation code below to get your digital receipt</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/10">
                        <label className="block text-xs font-bold text-white/80 mb-1">Enter your M-Pesa Transaction Code:</label>
                        <div className="flex gap-2">
                          <input type="text" value={manualRefCode} onChange={(e) => setManualRefCode(e.target.value.toUpperCase())}
                            placeholder="e.g. QKJ8921820"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white font-mono font-bold text-sm focus:outline-none focus:border-[#d4af37]" />
                          <button type="button" onClick={handleManualVerification} disabled={submitting}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-xs shrink-0 transition-all hover:brightness-110">
                            {submitting ? "Verifying..." : "Confirm & Receipt"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PAYPAL */}
                  {paymentMethod === "paypal" && (
                    <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                      <div className="text-xs text-white/80">Total Charge: <strong className="text-[#fbf5b7]">${currentAmountUsd} USD</strong></div>
                      <button type="button" onClick={handlePayPal} disabled={submitting}
                        className="w-full py-3.5 px-4 rounded-xl bg-[#0070ba] hover:bg-[#005ea6] text-white font-extrabold text-sm transition-all shadow-lg flex items-center justify-center gap-2">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                        <span>Pay with PayPal (${currentAmountUsd} USD)</span>
                      </button>
                      <div id="paypal-button-mount" className="mt-2" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══ STEP 3: RECEIPT ══ */}
          {currentStep === 3 && receipt && (
            <div className="bg-[#0c1b33]/90 backdrop-blur-xl border border-emerald-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="font-brand text-2xl sm:text-4xl font-extrabold text-white mb-2">Seed Successfully Received!</h2>
                <p className="text-white/70 text-xs sm:text-sm max-w-md mx-auto">
                  May God replenish your storehouse abundantly according to Luke 6:38. An official receipt has been issued below.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.05] border border-white/15 max-w-lg mx-auto mb-8 space-y-4 text-xs sm:text-sm">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <img src={brandLogo} alt="" className="w-6 h-6 object-contain" />
                    <span className="font-bold text-white tracking-wide">KINGDOM MISSIONS NETWORK</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Official Receipt</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-[10px] text-white/50 uppercase font-semibold block">Receipt Ref</span><span className="font-mono font-bold text-white">{receipt.reference}</span></div>
                  <div><span className="text-[10px] text-white/50 uppercase font-semibold block">Date &amp; Time</span><span className="text-white">{receipt.date}</span></div>
                  <div><span className="text-[10px] text-white/50 uppercase font-semibold block">Donor Name</span><span className="font-bold text-white">{receipt.donorName}</span></div>
                  <div><span className="text-[10px] text-white/50 uppercase font-semibold block">Email</span><span className="text-white truncate">{receipt.donorEmail}</span></div>
                  <div className="col-span-2 pt-2 border-t border-white/5 flex items-center justify-between">
                    <div><span className="text-[10px] text-white/50 uppercase font-semibold block">Designation</span><span className="font-bold text-[#fbf5b7]">{receipt.purpose}</span></div>
                    <div className="text-right"><span className="text-[10px] text-white/50 uppercase font-semibold block">Total Gift</span><span className="font-brand text-lg font-bold text-emerald-300">KES {receipt.amountKes.toLocaleString()}</span></div>
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
                  <Printer className="w-3.5 h-3.5" /><span>Print Receipt</span>
                </button>
                <Link to="/"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c5961d] text-[#0c1b33] font-bold text-xs sm:text-sm hover:scale-105 transition-all flex items-center justify-center gap-1.5 shadow-lg">
                  Return to Home
                </Link>
                <button type="button" onClick={() => { setReceipt(null); setCurrentStep(1); }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-white/80 font-bold text-xs flex items-center justify-center gap-1.5 transition-all">
                  <RotateCcw className="w-3.5 h-3.5" /><span>Give Another Gift</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
