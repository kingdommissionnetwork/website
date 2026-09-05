import { useState, useEffect } from "react";
import {
  Heart,
  Shield,
  Receipt,
  Check,
  Loader2,
  Globe,
  Copy,
  CheckCircle2,
  Building2,
  Smartphone,
  Printer,
  Sparkles,
  X,
  CreditCard,
  QrCode,
  ArrowRight,
} from "lucide-react";
import ScrollReveal from "../../components/ScrollReveal";
import { useToast } from "../../lib/toast";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import brandLogo from "../../assets/logo.png";

const presetAmounts = [10, 25, 50, 100, 250];
const presetAmountsKes = [500, 1000, 2500, 5000, 10000];

const currencies = [
  { code: "KES", label: "KES - Kenyan Shilling", symbol: "KSh", countries: ["KE"] },
  { code: "USD", label: "USD - US Dollar", symbol: "$", countries: ["US", "GB", "CA", "AU", "DE", "FR", "NL", "others"] },
  { code: "EUR", label: "EUR - Euro", symbol: "€", countries: ["DE", "FR", "NL", "IT", "ES", "BE"] },
  { code: "GBP", label: "GBP - British Pound", symbol: "£", countries: ["GB"] },
  { code: "NGN", label: "NGN - Nigerian Naira", symbol: "₦", countries: ["NG"] },
  { code: "GHS", label: "GHS - Ghana Cedi", symbol: "GH₵", countries: ["GH"] },
  { code: "ZAR", label: "ZAR - South African Rand", symbol: "R", countries: ["ZA"] },
  { code: "TZS", label: "TZS - Tanzanian Shilling", symbol: "TSh", countries: ["TZ"] },
  { code: "UGX", label: "UGX - Ugandan Shilling", symbol: "USh", countries: ["UG"] },
  { code: "RWF", label: "RWF - Rwandan Franc", symbol: "FRw", countries: ["RW"] },
];

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

const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "";

function generateRef() {
  return `KMN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface ReceiptData {
  receiptNo: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
  purpose: string;
  provider: string;
  reference: string;
  date: string;
}

export default function GiveSection() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Mode: "mpesa_bank" (Immediate) vs "online_card"
  const [activeTab, setActiveTab] = useState<"mpesa_bank" | "online_card">("mpesa_bank");

  // Copy tracking state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // M-Pesa / Bank Form state
  const [offlineName, setOfflineName] = useState(user?.name || "");
  const [offlineEmail, setOfflineEmail] = useState(user?.email || "");
  const [offlineAmount, setOfflineAmount] = useState("1000");
  const [offlineRef, setOfflineRef] = useState("");
  const [offlinePurpose, setOfflinePurpose] = useState("Tithes & Offerings");
  const [offlineSubmitting, setOfflineSubmitting] = useState(false);

  // Digital Receipt Modal
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Account format toggle: standard 10-digit vs 12-digit with prefix
  const [usePrefixAccount, setUsePrefixAccount] = useState(false);
  const currentAccountNumber = usePrefixAccount ? "011335674365" : "1335674365";

  // Card / Online state
  const [amount, setAmount] = useState<number | "custom">(50);
  const [customAmount, setCustomAmount] = useState("");
  const [recurring, setRecurring] = useState<"one-time" | "monthly">("one-time");
  const [submitting, setSubmitting] = useState(false);
  const [currency, setCurrency] = useState("KES");
  const [paymentMethod, setPaymentMethod] = useState<"auto" | "paypal">("auto");
  const [donorName, setDonorName] = useState(user?.name || "");
  const [donorEmail, setDonorEmail] = useState(user?.email || "");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (paystackKey && !window.PaystackPop) {
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paystack_callback") === "1") {
      const ref = params.get("reference");
      if (ref) {
        api.payments.verify(ref).then((res) => {
          const r = res as { status: string };
          if (r.status === "success") {
            setShowSuccess(true);
            showToast("Payment successful! Thank you!", "success");
          }
        });
      }
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [showToast]);

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
    setTimeout(() => {
      setCopiedKey(null);
    }, 2500);
  };

  const handleOfflineReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineRef.trim()) {
      showToast("Please enter your M-Pesa or Bank transaction reference", "error");
      return;
    }
    if (!offlineName.trim()) {
      showToast("Please enter your full name", "error");
      return;
    }
    if (!offlineEmail.trim() || !offlineEmail.includes("@")) {
      showToast("Please enter a valid email for receipt delivery", "error");
      return;
    }
    const parsedAmount = parseFloat(offlineAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast("Please enter a valid donation amount", "error");
      return;
    }

    setOfflineSubmitting(true);
    try {
      await api.payments.reportOffline({
        amount: parsedAmount,
        currency: "KES",
        donor_name: offlineName.trim(),
        donor_email: offlineEmail.trim(),
        payment_provider: "mpesa_paybill",
        payment_reference: offlineRef.trim().toUpperCase(),
        notes: offlinePurpose,
      });

      const receipt: ReceiptData = {
        receiptNo: `KMN-RCT-${Date.now().toString().slice(-6)}`,
        donorName: offlineName.trim(),
        donorEmail: offlineEmail.trim(),
        amount: parsedAmount,
        currency: "KES",
        purpose: offlinePurpose,
        provider: "M-Pesa Paybill (522522)",
        reference: offlineRef.trim().toUpperCase(),
        date: new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setReceiptData(receipt);
      setShowReceiptModal(true);
      showToast("Giving recorded successfully! Receipt generated.", "success");
      setOfflineRef("");
    } catch {
      showToast("Failed to record transaction. Please check your network.", "error");
    } finally {
      setOfflineSubmitting(false);
    }
  };

  const handlePaystack = async () => {
    const finalAmount = amount === "custom" ? customAmount : String(amount);
    if (!finalAmount || Number(finalAmount) <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }
    if (!donorEmail) {
      showToast("Please enter your email", "error");
      return;
    }

    setSubmitting(true);
    try {
      const data = (await api.payments.initialize({
        email: donorEmail,
        amount: Number(finalAmount),
        currency,
        metadata: { name: donorName || "Anonymous" },
      })) as { authorization_url?: string; reference?: string; access_code?: string };

      if (data.authorization_url && window.PaystackPop) {
        const popup = window.PaystackPop.setup({
          key: paystackKey,
          email: donorEmail,
          amount: Number(finalAmount) * 100,
          currency,
          ref: data.reference || generateRef(),
          callback: () => {
            setShowSuccess(true);
            showToast("Thank you for your gift!", "success");
            setAmount(50);
            setCustomAmount("");
          },
          onClose: () => {
            showToast("Payment cancelled.", "info");
          },
          metadata: { name: donorName || "Anonymous" },
        });
        popup.openIframe();
      } else if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch {
      showToast("Failed to process payment. Please try again.", "error");
    }
    setSubmitting(false);
  };

  const handleGive = async () => {
    if (paymentMethod === "paypal") {
      if (!window.paypal) {
        showToast("PayPal is loading. Please try again.", "info");
        return;
      }
      setSubmitting(true);
      const finalAmount = amount === "custom" ? customAmount : String(amount);
      if (!finalAmount || Number(finalAmount) <= 0) {
        showToast("Please enter a valid amount", "error");
        setSubmitting(false);
        return;
      }
      try {
        const order = (await api.payments.paypalCreate({
          amount: Number(finalAmount),
          currency: "USD",
        })) as { id: string };
        window.paypal
          .Buttons({
            createOrder: () => Promise.resolve(order.id),
            onApprove: async (data) => {
              const capture = (await api.payments.paypalCapture({
                orderId: data.orderID,
              })) as { status: string };
              if (capture.status === "COMPLETED") {
                setShowSuccess(true);
                showToast("Thank you for your gift!", "success");
                setAmount(50);
                setCustomAmount("");
              }
            },
            onError: () => {
              showToast("PayPal payment failed.", "error");
              setSubmitting(false);
            },
          })
          .render("#paypal-button-container");
      } catch {
        showToast("Failed to create PayPal order.", "error");
        setSubmitting(false);
      }
      return;
    }
    await handlePaystack();
  };

  return (
    <section id="give" className="bg-[#fbfcfe] section-padding relative overflow-hidden">
      {/* Background radial highlights */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(212,175,55,0.08)_0%,transparent_70%)] pointer-events-none blur-3xl" />
      <div className="absolute bottom-0 left-10 w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(12,27,51,0.05)_0%,transparent_70%)] pointer-events-none blur-3xl" />

      <div className="container-main mx-auto max-w-5xl relative z-10">
        <ScrollReveal>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#d4af37]/15 text-[#856b12] border border-[#d4af37]/30 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
              Kingdom Stewardship & Mission Giving
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#0c1b33] mb-4">
              Support the Mission
            </h2>
            <p className="text-[#596980] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Your giving directly powers gospel crusades, missionary deployments, Bible distribution,
              and humanitarian bread relief.
            </p>
          </div>
        </ScrollReveal>

        {/* Giving Method Tabs */}
        <ScrollReveal delay={100}>
          <div className="flex items-center justify-center mb-10">
            <div className="inline-flex p-1.5 rounded-2xl bg-[#eef3f9] border border-[#0c1b33]/10 max-w-md w-full shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab("mpesa_bank")}
                className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === "mpesa_bank"
                    ? "bg-white text-[#0c1b33] shadow-md border border-[#d4af37]/40"
                    : "text-[#596980] hover:text-[#0c1b33]"
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>M-Pesa & Bank</span>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                  Active
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("online_card")}
                className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === "online_card"
                    ? "bg-white text-[#0c1b33] shadow-md border border-[#d4af37]/40"
                    : "text-[#596980] hover:text-[#0c1b33]"
                }`}
              >
                <CreditCard className="w-4 h-4 text-[#d4af37]" />
                <span>Card & PayPal</span>
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* TAB 1: M-PESA & BANK DETAILS (IMMEDIATE & ACTIVE) */}
        {activeTab === "mpesa_bank" && (
          <ScrollReveal delay={150}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Official Bank & Paybill Cards with 1-Click Copy */}
              <div className="lg:col-span-7 space-y-6">
                {/* Main Highlight Card */}
                <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#0c1b33] via-[#112440] to-[#071324] text-white shadow-2xl border-2 border-[#d4af37]/40 overflow-hidden">
                  {/* Subtle Gold Watermark Seal */}
                  <div className="absolute -right-12 -bottom-12 opacity-10 pointer-events-none">
                    <img src={brandLogo} alt="" className="w-64 h-64 object-contain" />
                  </div>

                  <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#d4af37]/25 to-[#f97316]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#fbf5b7] shadow-inner">
                        <Building2 className="w-6 h-6 text-[#d4af37]" />
                      </div>
                      <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#d4af37]">
                          Official Ministry Bank Clearing
                        </span>
                        <h3 className="font-brand text-xl sm:text-2xl font-bold text-white">
                          Heavenly God Kingdom Churches
                        </h3>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Verified
                    </span>
                  </div>

                  {/* Interactive Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {/* Paybill Number Tile */}
                    <div className="p-4 rounded-2xl bg-white/[0.07] border border-white/15 hover:border-[#d4af37]/50 transition-all flex flex-col justify-between group">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-white/60 font-semibold uppercase tracking-wider">
                            M-Pesa Paybill (Business No)
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-bold">
                            KCB Bank
                          </span>
                        </div>
                        <div className="font-brand text-2xl sm:text-3xl font-extrabold text-[#fbf5b7] tracking-wider mb-2">
                          522522
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard("522522", "Paybill 522522")}
                        className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-[#d4af37] hover:text-[#0c1b33] text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-white/90 group-hover:bg-white/20"
                      >
                        {copiedKey === "Paybill 522522" ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Paybill</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Account Number Tile */}
                    <div className="p-4 rounded-2xl bg-white/[0.07] border border-white/15 hover:border-[#d4af37]/50 transition-all flex flex-col justify-between group">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-white/60 font-semibold uppercase tracking-wider">
                            Account Number
                          </span>
                          <button
                            type="button"
                            onClick={() => setUsePrefixAccount(!usePrefixAccount)}
                            className="text-[10px] text-[#d4af37] underline hover:text-[#fbf5b7]"
                            title="Switch between 10-digit MICR and 12-digit standard prefix format"
                          >
                            {usePrefixAccount ? "Format: 011..." : "Format: 133..."}
                          </button>
                        </div>
                        <div className="font-brand text-2xl sm:text-3xl font-extrabold text-[#fbf5b7] tracking-wider mb-2 font-mono">
                          {currentAccountNumber}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(currentAccountNumber, "Account Number")}
                        className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-[#d4af37] hover:text-[#0c1b33] text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-white/90 group-hover:bg-white/20"
                      >
                        {copiedKey === "Account Number" ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Account</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Account Name Tile */}
                    <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/10 flex flex-col justify-between">
                      <span className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-1">
                        Account Name
                      </span>
                      <div className="font-bold text-sm sm:text-base text-white mb-2">
                        HEAVENLY GOD KINGDOM CHURCHES
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard("HEAVENLY GOD KINGDOM CHURCHES", "Account Name")}
                        className="text-[11px] text-[#d4af37] hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Copy className="w-3 h-3" />
                        Copy Name
                      </button>
                    </div>

                    {/* Bank & Branch Details Tile */}
                    <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/10 flex flex-col justify-between">
                      <span className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-1">
                        Bank & Branch
                      </span>
                      <div className="font-bold text-sm sm:text-base text-white">
                        KCB Bank Kenya
                      </div>
                      <div className="text-xs text-white/70">
                         KCB Pay Bill · Code 522522
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white/80 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                    <span>
                      Funds sent to Paybill <strong>522522</strong> with Account <strong>1335674365</strong> deposit immediately into the official Heavenly God Kingdom Churches ministry account.
                    </span>
                  </div>
                </div>

                {/* Step-by-Step Mobile Instructions */}
                <div className="p-6 rounded-3xl bg-white border border-[#0c1b33]/10 shadow-sm">
                  <h4 className="font-display text-lg font-bold text-[#0c1b33] mb-4 flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-[#d4af37]" />
                    How to Give via M-Pesa on Your Phone
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-[#f8fafd] border border-[#0c1b33]/5 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#0c1b33] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        1
                      </div>
                      <div className="text-xs text-[#334155] leading-relaxed">
                        Open <strong>M-Pesa</strong> on your phone and select <strong>Lipa na M-Pesa</strong> → <strong>Paybill</strong>.
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#f8fafd] border border-[#0c1b33]/5 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#0c1b33] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        2
                      </div>
                      <div className="text-xs text-[#334155] leading-relaxed">
                        Enter Business Number: <strong className="text-[#0c1b33] font-mono">522522</strong>.
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#f8fafd] border border-[#0c1b33]/5 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#0c1b33] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        3
                      </div>
                      <div className="text-xs text-[#334155] leading-relaxed">
                        Enter Account Number: <strong className="text-[#0c1b33] font-mono">1335674365</strong>.
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#f8fafd] border border-[#0c1b33]/5 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#0c1b33] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        4
                      </div>
                      <div className="text-xs text-[#334155] leading-relaxed">
                        Enter your Amount &amp; PIN, verify name shows <strong>Heavenly God Kingdom Churches</strong>, and send.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: "I Have Paid" Report & Official Receipt Form */}
              <div className="lg:col-span-5">
                <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#0c1b33]/10 shadow-lg relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 flex items-center justify-center text-[#856b12]">
                      <Receipt className="w-5 h-5 text-[#d4af37]" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold text-[#0c1b33]">
                        Record Your Gift
                      </h3>
                      <p className="text-xs text-[#6b7c93]">
                        Generate an official digital receipt for your tithe or offering
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleOfflineReport} className="space-y-4">
                    {/* Amount presets in KES */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-2">
                        Amount (KES)
                      </label>
                      <div className="grid grid-cols-5 gap-2 mb-2">
                        {presetAmountsKes.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setOfflineAmount(String(p))}
                            className={`py-2 rounded-xl text-xs font-bold transition-all ${
                              offlineAmount === String(p)
                                ? "bg-[#d4af37] text-[#0c1b33] shadow-sm font-extrabold"
                                : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                            }`}
                          >
                            {p.toLocaleString()}
                          </button>
                        ))}
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#64748b]">
                          KSh
                        </span>
                        <input
                          type="number"
                          value={offlineAmount}
                          onChange={(e) => setOfflineAmount(e.target.value)}
                          placeholder="e.g. 3000"
                          required
                          min="10"
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#0c1b33]/15 bg-[#f8fafc] text-sm font-bold text-[#0c1b33] focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                        />
                      </div>
                    </div>

                    {/* M-Pesa Transaction Reference */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1.5">
                        M-Pesa Reference / Confirmation Code *
                      </label>
                      <input
                        type="text"
                        value={offlineRef}
                        onChange={(e) => setOfflineRef(e.target.value.toUpperCase())}
                        placeholder="e.g. SI84XYZ123"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-[#0c1b33]/15 bg-[#f8fafc] text-sm font-mono font-bold tracking-wider text-[#0c1b33] focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                      />
                      <span className="text-[11px] text-[#64748b] mt-1 block">
                        Found in your M-Pesa confirmation SMS (e.g., SI849...)
                      </span>
                    </div>

                    {/* Donor Name */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        value={offlineName}
                        onChange={(e) => setOfflineName(e.target.value)}
                        placeholder="e.g. John Kamau"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-[#0c1b33]/15 bg-[#f8fafc] text-sm text-[#0c1b33] focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                      />
                    </div>

                    {/* Donor Email */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1.5">
                        Email Address (For Tax Receipt) *
                      </label>
                      <input
                        type="email"
                        value={offlineEmail}
                        onChange={(e) => setOfflineEmail(e.target.value)}
                        placeholder="john@example.com"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-[#0c1b33]/15 bg-[#f8fafc] text-sm text-[#0c1b33] focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                      />
                    </div>

                    {/* Purpose Selection */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1.5">
                        Giving Purpose / Designation
                      </label>
                      <select
                        value={offlinePurpose}
                        onChange={(e) => setOfflinePurpose(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-[#0c1b33]/15 bg-[#f8fafc] text-sm text-[#0c1b33] focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                      >
                        <option value="Tithes & Offerings">Tithes &amp; Offerings</option>
                        <option value="Mission Crusades & Church Planting">Mission Crusades &amp; Church Planting</option>
                        <option value="Bread Ministry (Humanitarian Relief)">Bread Ministry (Humanitarian Relief)</option>
                        <option value="Bibles for Converts">Bibles for Converts</option>
                        <option value="Kingdom Ambassador Seed">Kingdom Ambassador Seed</option>
                        <option value="General Ministry Support">General Ministry Support</option>
                      </select>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={offlineSubmitting}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c558] to-[#c5961d] text-[#0c1b33] font-bold text-sm tracking-wide shadow-md hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
                    >
                      {offlineSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Generating Official Receipt...</span>
                        </>
                      ) : (
                        <>
                          <Receipt className="w-5 h-5" />
                          <span>Confirm &amp; Generate Official Receipt</span>
                        </>
                      )}
                    </button>
                  </form>

                  <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-[#0c1b33]/5 text-xs text-[#64748b]">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />
                      Audited Ledger
                    </span>
                    <span className="flex items-center gap-1">
                      <Receipt className="w-3.5 h-3.5 text-[#d4af37]" />
                      Tax Deductible
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* TAB 2: ONLINE CARD & PAYPAL */}
        {activeTab === "online_card" && (
          <ScrollReveal delay={150}>
            {showSuccess ? (
              <div className="bg-white rounded-3xl p-10 text-center max-w-lg mx-auto shadow-xl border border-[#0c1b33]/10">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="font-display text-3xl font-bold text-[#0c1b33] mb-3">Thank You!</h3>
                <p className="text-[#6b7c93] mb-8 leading-relaxed">
                  Your generous gift makes an eternal difference in the Kingdom. A confirmation receipt has been sent to your email.
                </p>
                <button
                  type="button"
                  onClick={() => setShowSuccess(false)}
                  className="btn-gold px-8 py-3.5"
                >
                  Give Another Gift
                </button>
              </div>
            ) : (
              <div className="max-w-lg mx-auto bg-white p-8 rounded-3xl shadow-xl border border-[#0c1b33]/10">
                {/* Currency Selector */}
                <div className="mb-6">
                  <label htmlFor="currency-select" className="block text-xs font-bold uppercase tracking-wider text-[#0c1b33] mb-2">
                    <Globe className="w-4 h-4 inline mr-1 text-[#d4af37]" />
                    Currency
                  </label>
                  <select
                    id="currency-select"
                    value={currency}
                    onChange={(e) => {
                      setCurrency(e.target.value);
                      setPaymentMethod(e.target.value === "KES" ? "auto" : "paypal");
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-[#0c1b33]/15 bg-[#f8fafc] text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Frequency Toggle */}
                <div className="flex items-center justify-center gap-2 p-1.5 bg-[#eef3f9] rounded-2xl mb-6">
                  <button
                    type="button"
                    onClick={() => setRecurring("one-time")}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      recurring === "one-time"
                        ? "bg-white text-[#0c1b33] shadow-sm"
                        : "text-[#6b7c93] hover:text-[#0c1b33]"
                    }`}
                  >
                    One-time Gift
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecurring("monthly")}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      recurring === "monthly"
                        ? "bg-white text-[#0c1b33] shadow-sm"
                        : "text-[#6b7c93] hover:text-[#0c1b33]"
                    }`}
                  >
                    Monthly Partner
                  </button>
                </div>

                {/* Amount Presets */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {presetAmounts.map((preset) => {
                    const sym = currencies.find((c) => c.code === currency)?.symbol || "$";
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setAmount(preset);
                          setCustomAmount("");
                        }}
                        className={`py-3 rounded-xl text-base font-bold transition-all ${
                          amount === preset
                            ? "bg-[#d4af37] text-[#0c1b33] shadow-md"
                            : "bg-[#f8fafc] text-[#0c1b33] border border-[#0c1b33]/10 hover:bg-[#eef3f9]"
                        }`}
                      >
                        {sym}{preset}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amount */}
                <div className="mb-6">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7c93] text-base font-bold">
                      {currencies.find((c) => c.code === currency)?.symbol || "$"}
                    </span>
                    <input
                      type="number"
                      placeholder="Other amount"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setAmount("custom");
                      }}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#0c1b33]/15 bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-base font-bold"
                    />
                  </div>
                </div>

                {/* Donor Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Grace Wanjiku"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[#0c1b33]/15 bg-[#f8fafc] text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1.5">
                      Your Email *
                    </label>
                    <input
                      type="email"
                      placeholder="grace@example.com"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-[#0c1b33]/15 bg-[#f8fafc] text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                    />
                  </div>
                </div>

                {/* Payment Method Notice */}
                {currency !== "KES" && (
                  <div className="mb-4 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs text-center font-medium">
                    International contributions are processed securely via PayPal.
                  </div>
                )}

                {/* PayPal container */}
                <div id="paypal-button-container" className="mb-4" />

                {/* Submit button */}
                <button
                  type="button"
                  onClick={handleGive}
                  disabled={submitting}
                  className="w-full btn-gold text-base font-bold py-4 flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Heart className="w-5 h-5 fill-current" />
                  )}
                  {submitting
                    ? "Connecting to Gateway..."
                    : recurring === "monthly"
                    ? "Give Monthly via Card"
                    : "Give Online with Love"}
                </button>

                {/* Fast link to M-Pesa */}
                <div className="mt-4 pt-4 border-t border-[#0c1b33]/5 text-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab("mpesa_bank")}
                    className="text-xs font-bold text-[#856b12] hover:text-[#0c1b33] inline-flex items-center gap-1.5"
                  >
                    <span>Prefer Kenya M-Pesa Paybill? Switch to instant M-Pesa</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </ScrollReveal>
        )}

        {/* Global Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-8 mt-12 pt-8 border-t border-[#0c1b33]/10">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#596980]">
            <Shield className="w-4 h-4 text-emerald-600" />
            256-Bit SSL Encrypted
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#596980]">
            <Receipt className="w-4 h-4 text-[#d4af37]" />
            Official Printable Tax Receipts
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#596980]">
            <Check className="w-4 h-4 text-emerald-600" />
            100% Dedicated to Gospel &amp; Relief
          </div>
        </div>
      </div>

      {/* OFFICIAL DIGITAL MINISTRY RECEIPT MODAL */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-[#d4af37] overflow-hidden text-[#0c1b33] animate-in fade-in zoom-in-95 duration-200">
            {/* Header with Gold Trim */}
            <div className="bg-gradient-to-r from-[#0c1b33] to-[#112440] p-6 text-white text-center relative">
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-white/10 border border-[#d4af37]/40 p-1 flex items-center justify-center">
                <img src={brandLogo} alt="Kingdom Mission Network" className="w-10 h-10 object-contain" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">
                Official Digital Ministry Receipt
              </span>
              <h3 className="font-brand text-2xl font-bold text-white mt-1">
                Heavenly God Kingdom Churches
              </h3>
              <p className="text-[11px] text-white/70">
                Under the Auspices of Kingdom Mission Network
              </p>
            </div>

            {/* Printable Receipt Body */}
            <div id="ministry-receipt-content" className="p-6 sm:p-8 space-y-5 bg-white">
              {/* Receipt Meta Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-[#0c1b33]/10 text-xs">
                <div>
                  <span className="text-[#64748b] block text-[10px] uppercase font-bold">Receipt Number</span>
                  <span className="font-mono font-bold text-[#0c1b33]">{receiptData.receiptNo}</span>
                </div>
                <div className="text-right">
                  <span className="text-[#64748b] block text-[10px] uppercase font-bold">Date &amp; Time</span>
                  <span className="font-bold text-[#0c1b33]">{receiptData.date}</span>
                </div>
              </div>

              {/* Amount Showcase Banner */}
              <div className="p-4 rounded-2xl bg-[#fbf8ee] border border-[#d4af37]/30 text-center">
                <span className="text-xs text-[#856b12] font-extrabold uppercase tracking-wider block mb-1">
                  Amount Received &amp; Verified
                </span>
                <div className="font-brand text-3xl sm:text-4xl font-extrabold text-[#0c1b33]">
                  KSh {receiptData.amount.toLocaleString()}
                </div>
                <span className="inline-block mt-2 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  Status: Recorded &amp; Logged ✓
                </span>
              </div>

              {/* Details List */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[#0c1b33]/5">
                  <span className="text-[#64748b] font-medium">Donor Name:</span>
                  <span className="font-bold text-[#0c1b33]">{receiptData.donorName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#0c1b33]/5">
                  <span className="text-[#64748b] font-medium">Donor Email:</span>
                  <span className="font-bold text-[#0c1b33]">{receiptData.donorEmail}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#0c1b33]/5">
                  <span className="text-[#64748b] font-medium">Payment Channel:</span>
                  <span className="font-bold text-[#0c1b33]">{receiptData.provider}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#0c1b33]/5">
                  <span className="text-[#64748b] font-medium">Transaction Reference:</span>
                  <span className="font-mono font-bold text-[#0c1b33]">{receiptData.reference}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#0c1b33]/5">
                  <span className="text-[#64748b] font-medium">Ministry Designation:</span>
                  <span className="font-bold text-[#0c1b33]">{receiptData.purpose}</span>
                </div>
              </div>

              {/* Scripture Blessing */}
              <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-[#0c1b33]/10 text-center italic text-xs text-[#475569] leading-relaxed">
                "Every man according as he purposeth in his heart, so let him give; not grudgingly, or of necessity: for God loveth a cheerful giver."
                <div className="font-bold text-[#0c1b33] not-italic mt-1">— 2 Corinthians 9:7</div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#0c1b33] text-white hover:bg-[#112440] font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="py-3 px-5 rounded-xl border border-[#0c1b33]/15 text-[#0c1b33] hover:bg-[#f1f5f9] font-bold text-xs transition-all"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
