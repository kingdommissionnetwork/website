import { useState } from "react";
import { PhoneCall, MessageSquareText, Check, Copy, Headset } from "lucide-react";
import {
  PARTNERSHIP_SUPPORT_PHONE_DISPLAY,
  PARTNERSHIP_SUPPORT_SMS_LINK,
  PARTNERSHIP_SUPPORT_TEL_LINK,
  PARTNERSHIP_SUPPORT_BLURB,
} from "../lib/support";

interface Props {
  compact?: boolean;
  className?: string;
}

/**
 * 24/7 partnership subscription support banner.
 * Shown on partnership checkout + giving flows so partners can
 * call/SMS for any query, help, guidance or complaint.
 */
export default function PartnershipSupportCard({ compact = false, className = "" }: Props) {
  const [copied, setCopied] = useState(false);

  const copyNumber = () => {
    const num = PARTNERSHIP_SUPPORT_PHONE_DISPLAY;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(num).catch(() => undefined);
    } else {
      const ta = document.createElement("textarea");
      ta.value = num;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        // clipboard unavailable — number stays visible for manual dial
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (compact) {
    return (
      <div
        className={`flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center ${className}`}
        role="contentinfo"
        aria-label="24/7 partnership support contact"
      >
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
          <Headset className="w-3.5 h-3.5" />
          24/7 Partnership Support:
        </span>
        <a
          href={PARTNERSHIP_SUPPORT_TEL_LINK}
          className="font-mono font-extrabold text-sm text-white hover:text-emerald-300 transition-colors tracking-wide"
        >
          {PARTNERSHIP_SUPPORT_PHONE_DISPLAY}
        </a>
        <span className="hidden sm:inline text-white/30">•</span>
        <span className="flex items-center gap-2">
          <a
            href={PARTNERSHIP_SUPPORT_TEL_LINK}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-[11px] font-bold transition-colors"
          >
            <PhoneCall className="w-3 h-3" /> Call
          </a>
          <a
            href={PARTNERSHIP_SUPPORT_SMS_LINK}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-colors"
          >
            <MessageSquareText className="w-3 h-3" /> SMS
          </a>
        </span>
      </div>
    );
  }

  return (
    <div
      className={`p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-[#0c1b33] border border-emerald-500/30 shadow-inner ${className}`}
      role="contentinfo"
      aria-label="24/7 partnership support contact"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
          <Headset className="w-5 h-5 text-emerald-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
            24/7 Partnership Subscription Support
          </p>
          <p className="text-[11px] text-white/65 mt-0.5 leading-relaxed">{PARTNERSHIP_SUPPORT_BLURB}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <a
              href={PARTNERSHIP_SUPPORT_TEL_LINK}
              className="font-mono text-lg font-extrabold text-white hover:text-emerald-300 transition-colors tracking-wide"
            >
              {PARTNERSHIP_SUPPORT_PHONE_DISPLAY}
            </a>
            <button
              type="button"
              onClick={copyNumber}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-[11px] font-bold transition-colors"
              title="Copy support number"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <a
              href={PARTNERSHIP_SUPPORT_TEL_LINK}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call Now — 24/7</span>
            </a>
            <a
              href={PARTNERSHIP_SUPPORT_SMS_LINK}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition-all"
            >
              <MessageSquareText className="w-3.5 h-3.5" />
              <span>SMS Us — 24/7</span>
            </a>
          </div>
          <p className="text-[11px] text-white/50 mt-2.5 leading-relaxed">
            Tip: SMS your M-Pesa transaction code + full name to this number for the fastest manual verification.
          </p>
        </div>
      </div>
    </div>
  );
}
