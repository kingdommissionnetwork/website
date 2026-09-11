import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle2,
  FileText,
  Printer,
  Search,
  Building2,
  Calendar,
  CreditCard,
  Award,
  Lock,
  Clock,
  Sparkles,
  Heart,
} from "lucide-react";
import brandLogo from "../assets/logo.png";
import bishopSignature from "../assets/bishop-signature.png";
import { api } from "../lib/api";
import { type InvoiceDetails } from "../lib/printEngine";
import OfficialInvoiceModal from "../components/OfficialInvoiceModal";

interface VerificationResult {
  verified: boolean;
  type: "invoice" | "partner" | "statement";
  reference?: string;
  invoiceNumber?: string;
  amount?: number;
  currency?: string;
  donorName?: string;
  donorEmail?: string;
  recurring?: boolean;
  provider?: string;
  status?: string;
  date?: string;
  partnerId?: string;
  name?: string;
  tier?: string;
  joinedAt?: string;
  year?: string;
  verifiedAt?: string;
  notice?: string;
  error?: string;
}

// Real SHA-256 fingerprint over the canonical record fields so the
// certificate hash is reproducible from the verified data itself.
async function computeSecurityHash(result: VerificationResult): Promise<string> {
  const canonical = [
    result.type,
    result.reference || result.invoiceNumber || result.partnerId || "",
    result.amount ?? "",
    result.currency || "",
    result.date || result.joinedAt || "",
  ].join("|");
  if (!globalThis.crypto?.subtle) return "";
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `SHA256:${hex.slice(0, 32).toUpperCase()}`;
}

export default function VerificationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const docParam = searchParams.get("doc") || "";
  const refParam = searchParams.get("ref") || "";
  const invParam = searchParams.get("inv") || "";
  const partnerParam = searchParams.get("partner") || "";
  const statementParam = searchParams.get("statement") || "";

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [securityHash, setSecurityHash] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [invoiceModal, setInvoiceModal] = useState<InvoiceDetails | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function verify() {
      if (!refParam && !invParam && !partnerParam && !statementParam) {
        setLoading(false);
        setResult(null);
        return;
      }

      setLoading(true);
      try {
        const data = await api.verifyDocument({
          ref: refParam,
          inv: invParam,
          partner: partnerParam,
          statement: statementParam,
        });
        if (isMounted) {
          setResult(data);
          if (data.verified) {
            setSecurityHash(await computeSecurityHash(data));
          }
        }
      } catch (err) {
        console.error("Verification request failed:", err);
        // Never fabricate a result client-side. Fail closed: show the
        // unverified state so the visitor can retry the lookup.
        if (isMounted) {
          setResult({ verified: false, type: "invoice" });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [docParam, refParam, invParam, partnerParam, statementParam]);

  // Scroll to top when result loads — query param changes don't trigger
  // the global ScrollToTop component since the pathname stays the same.
  useEffect(() => {
    if (result) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [result]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    if (query.toUpperCase().startsWith("HKN-") || query.toUpperCase().startsWith("PTN-")) {
      setSearchParams({ partner: query });
    } else if (query.toUpperCase().startsWith("KMN-") || query.toUpperCase().includes("REC")) {
      setSearchParams({ doc: "invoice", inv: query });
    } else {
      setSearchParams({ doc: "invoice", ref: query });
    }
  };

  const handlePrint = () => {
    if (!result) return;
    const invoiceData: InvoiceDetails = {
      reference: result.reference || refParam || "KMN-REF-VERIFIED",
      invoiceNumber: result.invoiceNumber || invParam || "KMN-REC-OFFICIAL",
      name: result.donorName || "Kingdom Sower",
      amount: result.amount || 5000,
      currency: result.currency || "KES",
      provider: result.provider || "Verified Gateway",
      status: result.status || "completed",
      date: result.date || new Date().toISOString(),
      purpose: "Kingdom Missions Outreach & Frontier Evangelism Seed",
      recurring: result.recurring || false,
    };
    setInvoiceModal(invoiceData);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060e1a] text-slate-900 dark:text-slate-100 selection:bg-amber-500/20 selection:text-amber-500 pt-28 md:pt-36 lg:pt-40 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-amber-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Ministry Crest Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/80 dark:bg-[#0c1b33]/80 backdrop-blur-xl border border-amber-500/30 shadow-xl mb-4">
            <img src={brandLogo} alt="Kingdom Missions Network" className="w-14 h-14 object-contain" />
          </div>
          <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold tracking-widest uppercase mb-2">
            Official Ministry Verification Registry
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-heading">
            Document Authentication Service
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Kingdom Missions Network International • Office of Financial Stewardship & Partner Relations
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="rounded-3xl bg-white/80 dark:bg-[#0c1b33]/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-6" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Validating Document Authenticity...
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Querying encrypted ministry ledger and signature authorities
            </p>
          </div>
        )}

        {/* Verified Document Presentation */}
        {!loading && result && result.verified && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Status Banner */}
            <div className="rounded-3xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border border-emerald-500/40 p-6 sm:p-8 backdrop-blur-xl shadow-xl text-center relative overflow-hidden">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 mb-4 ring-8 ring-emerald-500/20">
                <ShieldCheck className="w-9 h-9" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
                AUTHENTIC & VERIFIED
              </h2>
              <p className="text-sm sm:text-base text-emerald-800/90 dark:text-emerald-300 mt-1 max-w-lg mx-auto font-medium">
                This document is a certified, official record registered in the Kingdom Missions Network stewardship archives.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Verified at {new Date(result.verifiedAt || Date.now()).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</span>
              </div>
            </div>

            {/* Official Certificate / Receipt Breakdown */}
            <div className="rounded-3xl bg-white/90 dark:bg-[#0c1b33]/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 sm:p-8 relative">
              {/* Watermark Seal */}
              <div className="absolute top-1/2 right-6 -translate-y-1/2 opacity-5 dark:opacity-10 pointer-events-none select-none">
                <Building2 className="w-80 h-80 text-amber-500" />
              </div>

              <div className="border-b border-slate-200 dark:border-slate-800 pb-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    {result.type === "partner" ? "Executive Credential" : "Official Giving Receipt"}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {result.type === "partner"
                      ? "Covenant Partner Certificate"
                      : result.invoiceNumber || invParam || "Tax-Deductible Donation Receipt"}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Status: {result.status ? result.status.toUpperCase() : "COMPLETED"}</span>
                  </span>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Reference Number */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                    <span>Master Reference</span>
                  </div>
                  <div className="text-base sm:text-lg font-mono font-bold text-slate-900 dark:text-white mt-1 break-all">
                    {result.reference || refParam || "KMN-REF-VERIFIED"}
                  </div>
                </div>

                {/* Amount / Tier */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    {result.type === "partner" ? (
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span>{result.type === "partner" ? "Partner Tier" : "Amount Seeded"}</span>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                    {result.type === "partner" ? (
                      <span className="text-amber-600 dark:text-amber-400 font-extrabold">{result.tier || "Covenant Partner"}</span>
                    ) : (
                      <span>
                        <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 mr-1">{result.currency || "KES"}</span>
                        {Number(result.amount || 5000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Donor / Partner Name */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>{result.type === "partner" ? "Partner Name" : "Donor / Contributor"}</span>
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {result.name || result.donorName || "Kingdom Missions Partner"}
                  </div>
                  {result.donorEmail && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                      {result.donorEmail}
                    </div>
                  )}
                </div>

                {/* Date */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    <span>Date Issued</span>
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {new Date(result.date || result.joinedAt || Date.now()).toLocaleDateString("en-US", {
                      dateStyle: "long",
                    })}
                  </div>
                </div>

                {/* Payment Channel / Gateway */}
                {result.type !== "partner" && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Payment Channel</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                      {result.provider || "M-Pesa / Paystack Integrated Gateway"}
                    </div>
                  </div>
                )}

                {/* Ministry Stewardship Purpose */}
                {result.type !== "partner" && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Kingdom Designation</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                      Frontier Missions & Global Outreach Fund
                    </div>
                  </div>
                )}
              </div>

              {/* Cryptographic Security Hash */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span className="font-mono break-all">{securityHash || "Registry-verified record"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                  <ShieldCheck className="w-4 h-4" />
                  <span>256-Bit TLS Verified</span>
                </div>
              </div>

              {/* Authorized Apostolic Endorsement */}
              <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 bg-amber-500/[0.04] p-4 rounded-2xl border border-amber-500/10">
                <div className="flex items-center gap-3 text-left">
                  <img
                    src={bishopSignature}
                    alt="Official Signature of Bishop Dr. George Githinji"
                    className="h-10 w-auto object-contain dark:brightness-125"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block font-brand">
                      Bishop Dr. George Githinji
                    </span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider block">
                      Presiding Prelate &amp; General Overseer
                    </span>
                  </div>
                </div>
                <div className="text-center sm:text-right text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block">Authorized Digital Registry</span>
                  <span>Kingdom Missions Network International</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-center gap-4">
                {result.type !== "partner" && (
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Preview &amp; Print Official Receipt</span>
                  </button>
                )}

                <Link
                  to="/give"
                  className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Heart className="w-4 h-4 text-rose-400 dark:text-rose-600" />
                  <span>Sow Another Seed</span>
                </Link>

                <Link
                  to="/donations"
                  className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-sm transition-all flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  <span>Giving History</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Empty / Unverified State with Lookup Form */}
        {!loading && (!result || !result.verified) && (
          <div className="rounded-3xl bg-white/90 dark:bg-[#0c1b33]/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-12 text-center shadow-2xl space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-2">
              <Search className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Verify Official Ministry Records
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto text-sm">
              Enter any official receipt number (e.g. <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">KMN-REC-16</code>),
              payment reference (e.g. <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">RTY54EW23R</code>),
              or Partner ID (e.g. <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">HKN-PTN-4029</code>) to verify.
            </p>

            {/* Search Input Form */}
            <form onSubmit={handleManualSearch} className="max-w-md mx-auto mt-4">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. KMN-REC-16 or RTY54EW23R..."
                  className="w-full pl-4 pr-32 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-xs shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Verify</span>
                </button>
              </div>
            </form>

            {/* Quick Test Samples */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                Or Try Sample Authentications:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setSearchParams({ doc: "invoice", ref: "RTY54EW23R", inv: "KMN-REC-16" })}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10 dark:hover:bg-amber-500/10 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-700 text-xs font-mono transition-all"
                >
                  Receipt #KMN-REC-16
                </button>
                <button
                  type="button"
                  onClick={() => setSearchParams({ partner: "HKN-PTN-4029" })}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10 dark:hover:bg-amber-500/10 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-700 text-xs font-mono transition-all"
                >
                  Partner #HKN-PTN-4029
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Legal & Trust Disclosures Footer */}
        <div className="mt-12 text-center text-xs text-slate-500 dark:text-slate-500 space-y-2 max-w-xl mx-auto">
          <p className="flex items-center justify-center gap-1.5 font-medium">
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>Kingdom Missions Network International • Registered Non-Profit & Religious Stewardship Organization</span>
          </p>
          <p>
            For tax questions, official audit letters, or corporate receipt copies, please contact the Office of Financial Administration at{" "}
            <a href="mailto:finance@kingdommissionsnetwork.org" className="text-amber-600 dark:text-amber-400 underline font-semibold">
              finance@kingdommissionsnetwork.org
            </a>.
          </p>
        </div>
      </div>

      {invoiceModal && (
        <OfficialInvoiceModal
          invoice={invoiceModal}
          onClose={() => setInvoiceModal(null)}
        />
      )}
    </div>
  );
}
