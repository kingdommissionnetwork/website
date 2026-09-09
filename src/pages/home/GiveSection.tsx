import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  ShieldCheck,
  Check,
  Copy,
  Building2,
  Smartphone,
  Sparkles,
  CreditCard,
  ArrowRight,
  Crown,
} from "lucide-react";
import ScrollReveal from "../../components/ScrollReveal";
import { useToast } from "../../lib/toast";
import brandLogo from "../../assets/logo.png";

const PRESET_AMOUNTS = [
  { kes: 1000, usd: "8", label: "Frontline Bible" },
  { kes: 2500, usd: "19", label: "Crusade Outreaches" },
  { kes: 5000, usd: "39", label: "Bread of Life Relief" },
  { kes: 10000, usd: "77", label: "Missionary Transit" },
];

export default function GiveSection() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"online" | "paybill">("online");
  const [givingType, setGivingType] = useState<"onetime" | "monthly">("onetime");
  const [selectedAmount, setSelectedAmount] = useState<number>(2500);
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [customVal, setCustomVal] = useState<string>("3000");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const effectiveAmount = isCustom ? Number(customVal) || 2500 : selectedAmount;

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

  return (
    <section id="give" className="bg-[#fbfcfe] section-padding relative overflow-hidden py-16 sm:py-24">
      {/* Background radial highlights */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(212,175,55,0.08)_0%,transparent_70%)] pointer-events-none blur-3xl" />
      <div className="absolute bottom-0 left-10 w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(12,27,51,0.05)_0%,transparent_70%)] pointer-events-none blur-3xl" />

      <div className="container-main mx-auto max-w-4xl relative z-10">
        <ScrollReveal>
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#d4af37]/15 text-[#856b12] border border-[#d4af37]/30 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
              Kingdom Stewardship & Mission Giving
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#0c1b33] mb-3">
              Support the Mission
            </h2>
            <p className="text-[#596980] text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Your giving directly powers gospel crusades, missionary deployments, Bible distribution,
              and humanitarian bread relief.
            </p>
          </div>
        </ScrollReveal>

        {/* Streamlined Giving Card */}
        <ScrollReveal delay={100}>
          <div className="bg-gradient-to-br from-[#0c1b33] via-[#112440] to-[#071324] rounded-3xl p-6 sm:p-10 text-white shadow-2xl border-2 border-[#d4af37]/40 relative overflow-hidden">
            {/* Subtle Brand Watermark */}
            <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
              <img src={brandLogo} alt="" className="w-64 h-64 object-contain" />
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-center mb-8 relative z-10">
              <div className="inline-flex p-1.5 rounded-2xl bg-white/10 border border-white/15 max-w-sm w-full">
                <button
                  type="button"
                  onClick={() => setActiveTab("online")}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    activeTab === "online"
                      ? "bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c5961d] text-[#0c1b33] shadow-md"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Give Online</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("paybill")}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    activeTab === "paybill"
                      ? "bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c5961d] text-[#0c1b33] shadow-md"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>M-Pesa Paybill</span>
                </button>
              </div>
            </div>

            {/* TAB 1: ONLINE GIVING (Direct to Streamlined Flow) */}
            {activeTab === "online" && (
              <div className="space-y-6 relative z-10">
                {/* Frequency Toggle: One-Time vs Monthly */}
                <div className="flex items-center justify-center gap-3 text-xs font-bold text-white/80">
                  <button
                    type="button"
                    onClick={() => setGivingType("onetime")}
                    className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                      givingType === "onetime"
                        ? "bg-[#d4af37]/20 border-[#d4af37] text-[#fbf5b7]"
                        : "border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>One-Time Gift</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGivingType("monthly")}
                    className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                      givingType === "monthly"
                        ? "bg-[#d4af37]/20 border-[#d4af37] text-[#fbf5b7]"
                        : "border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Monthly Partner</span>
                  </button>
                </div>

                {/* Amount Selection Grid */}
                <div>
                  <div className="text-xs font-bold text-[#fbf5b7] uppercase tracking-wider mb-2.5 text-center">
                    Select Giving Amount:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {PRESET_AMOUNTS.map((amt) => {
                      const isSelected = !isCustom && selectedAmount === amt.kes;
                      return (
                        <button
                          key={amt.kes}
                          type="button"
                          onClick={() => {
                            setIsCustom(false);
                            setSelectedAmount(amt.kes);
                          }}
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            isSelected
                              ? "bg-gradient-to-br from-[#d4af37] to-[#b38a1f] text-[#0c1b33] border-white font-extrabold shadow-lg scale-105"
                              : "bg-white/[0.06] border-white/15 text-white hover:bg-white/[0.1] font-semibold"
                          }`}
                        >
                          <div className="text-sm sm:text-base font-bold">
                            KES {amt.kes.toLocaleString()}
                          </div>
                          <div className="text-[10px] opacity-75">~${amt.usd} USD</div>
                          <div className="text-[9px] font-medium mt-1 truncate opacity-90">{amt.label}</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Amount Field */}
                  <div className="max-w-xs mx-auto text-center">
                    {!isCustom ? (
                      <button
                        type="button"
                        onClick={() => setIsCustom(true)}
                        className="text-xs text-white/70 hover:text-[#d4af37] underline font-semibold"
                      >
                        + Or Enter Custom Amount
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-white/10 border border-[#d4af37]/50">
                        <span className="text-xs font-bold text-[#d4af37]">KES</span>
                        <input
                          type="number"
                          min="50"
                          step="100"
                          value={customVal}
                          onChange={(e) => setCustomVal(e.target.value)}
                          placeholder="Amount"
                          className="w-full bg-transparent text-white font-bold text-sm focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary CTA Button: Seamless Transition to /give with Pre-filled Amount */}
                <div className="pt-2 text-center">
                  <Link
                    to={`/give?amount=${effectiveAmount}&type=${givingType}&step=checkout`}
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c5961d] text-[#0c1b33] font-extrabold text-sm sm:text-base hover:scale-105 hover:shadow-[0_0_25px_rgba(212,175,55,0.45)] transition-all shadow-xl"
                  >
                    <span>Proceed to Payment (KES {effectiveAmount.toLocaleString()})</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <p className="text-[11px] text-white/60 mt-2">
                    Supports M-Pesa STK Push, Credit/Debit Card, and PayPal. Instant digital receipt.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: M-PESA & BANK PAYBILL (1-Click Copy Cards) */}
            {activeTab === "paybill" && (
              <div className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Paybill Tile */}
                  <div className="p-5 rounded-2xl bg-white/[0.08] border border-white/15 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/60 font-semibold uppercase">
                          M-Pesa Paybill Number
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-bold">
                          KCB Bank
                        </span>
                      </div>
                      <div className="font-brand text-3xl font-extrabold text-[#fbf5b7] mb-3">
                        522522
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard("522522", "Paybill 522522")}
                      className="w-full py-2 px-3 rounded-xl bg-white/15 hover:bg-[#d4af37] hover:text-[#0c1b33] text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      {copiedKey === "Paybill 522522" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Paybill 522522</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Account Number Tile */}
                  <div className="p-5 rounded-2xl bg-white/[0.08] border border-white/15 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/60 font-semibold uppercase">
                          Account Number
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/30 text-blue-300 font-bold">
                          Direct Cleared
                        </span>
                      </div>
                      <div className="font-brand text-3xl font-extrabold text-[#fbf5b7] mb-3">
                        1335674365
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard("1335674365", "Account 1335674365")}
                      className="w-full py-2 px-3 rounded-xl bg-white/15 hover:bg-[#d4af37] hover:text-[#0c1b33] text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      {copiedKey === "Account 1335674365" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Account 1335674365</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-white/80">
                  <div className="flex items-start gap-2.5">
                    <Building2 className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                    <div>
                      <span>Official M-Pesa Paybill receipt will display our registered ministry name: <strong className="text-white">HEAVENLY GOD KINGDOM CHURCHES</strong> (Account 1335674365).</span>
                    </div>
                  </div>
                  <Link
                    to="/give?step=checkout"
                    className="text-[#fbf5b7] hover:underline font-bold text-xs shrink-0 whitespace-nowrap"
                  >
                    Enter Reference for Receipt →
                  </Link>
                </div>
              </div>
            )}

            {/* Ministry Assurance & Scripture Footer */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-white/60 relative z-10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>256-Bit SSL Encrypted & Central Bank Compliant</span>
              </div>
              <div className="italic text-center sm:text-right">
                "God loveth a cheerful giver." — 2 Corinthians 9:7
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
