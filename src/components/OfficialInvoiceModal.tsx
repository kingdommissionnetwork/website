import { useState, useEffect } from "react";
import { X, Printer, CheckCircle2, ShieldCheck, Copy, Check } from "lucide-react";
import brandLogo from "../assets/logo.png";
import { type InvoiceDetails, printInvoice, generateQrDataUrl } from "../lib/printEngine";
import { useToast } from "../lib/toast";

interface OfficialInvoiceModalProps {
  invoice: InvoiceDetails | null;
  onClose: () => void;
}

export default function OfficialInvoiceModal({ invoice, onClose }: OfficialInvoiceModalProps) {
  const { showToast } = useToast();
  const [printing, setPrinting] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [copiedRef, setCopiedRef] = useState(false);

  useEffect(() => {
    if (invoice) {
      const refCode = invoice.reference || `REF-${String(invoice.id || Date.now()).slice(-6)}`;
      const invCode = invoice.invoiceNumber || `KMN-INV-${String(invoice.id || Date.now()).slice(-6)}`;
      const verifyUrl = `${window.location.origin}/verify?doc=invoice&ref=${encodeURIComponent(refCode)}&inv=${encodeURIComponent(invCode)}`;
      generateQrDataUrl(verifyUrl).then(setQrCodeUrl);
    }
  }, [invoice]);

  if (!invoice) return null;

  const invoiceNo = invoice.invoiceNumber || `KMN-REC-${String(invoice.id || Date.now()).slice(-6).toUpperCase()}`;
  const refCode = invoice.reference || `REF-${String(invoice.id || "001").toUpperCase()}`;
  const dateFormatted = invoice.date
    ? new Date(invoice.date).toLocaleDateString("en-US", { dateStyle: "long" })
    : new Date().toLocaleDateString("en-US", { dateStyle: "long" });

  const currency = invoice.currency || "KES";
  const amountFormatted = `${currency} ${Number(invoice.amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const handlePrint = async () => {
    setPrinting(true);
    try {
      await printInvoice(invoice);
      showToast("Invoice sent to printer / PDF dialog.", "success");
    } catch (err) {
      console.error(err);
      showToast("Print failed. Please check browser permissions.", "error");
    } finally {
      setPrinting(false);
    }
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(refCode);
    setCopiedRef(true);
    showToast("Transaction reference copied!", "success");
    setTimeout(() => setCopiedRef(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl my-auto rounded-3xl bg-gradient-to-br from-[#0c1b33] via-[#0e213d] to-[#171108] border-2 border-[#d4af37] shadow-[0_0_60px_rgba(212,175,55,0.35)] text-white p-6 sm:p-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
          aria-label="Close invoice"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Official Letterhead */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/15">
          <div className="flex items-center gap-3.5">
            <img
              src={brandLogo}
              alt="Kingdom Missions Network"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-contain border-2 border-[#d4af37] p-1 bg-[#0c1b33] drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]"
            />
            <div>
              <span className="font-brand text-lg sm:text-xl font-bold tracking-wider text-white block">
                KINGDOM MISSIONS NETWORK
              </span>
              <span className="text-[10px] sm:text-xs text-[#d4af37] uppercase tracking-[0.2em] font-extrabold block">
                Official Giving Receipt & Tax Invoice
              </span>
              <span className="text-[10px] text-white/50 block mt-0.5">
                Section 13 Faith-Based Non-Profit Religious Exemption
              </span>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Verified Official Record
            </span>
          </div>
        </div>

        {/* Invoice Summary Card */}
        <div className="my-6 p-5 sm:p-6 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4 relative overflow-hidden">
          {/* Subtle watermark */}
          <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
            <img src={brandLogo} alt="" className="w-48 h-48 object-contain" />
          </div>

          {/* Amount and Status Row */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
            <div>
              <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider block">
                Total Stewardship Contribution
              </span>
              <span className="font-brand text-2xl sm:text-3xl font-extrabold text-[#34d399]">
                {amountFormatted}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider block">
                Document Number
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-[#fbf5b7]">{invoiceNo}</span>
            </div>
          </div>

          {/* Detailed Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs relative z-10">
            <div>
              <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider block">Donor / Partner</span>
              <span className="font-bold text-white block truncate">{invoice.name || "Covenant Partner"}</span>
              <span className="text-white/60 text-[11px] block truncate">{invoice.email || "N/A"}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider block">
                Payment Channel
              </span>
              <span className="font-bold text-white uppercase block">
                {invoice.provider || "PAYSTACK SECURE"}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="font-mono text-[10px] text-white/70 truncate">{refCode}</span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="p-1 hover:text-[#d4af37] text-white/50 transition-colors"
                  title="Copy Reference"
                >
                  {copiedRef ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider block">
                Contribution Date
              </span>
              <span className="text-white/90 font-medium block">{dateFormatted}</span>
              <span className="text-[10px] text-white/50 block">Fiscal Year 2026</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider block">Gift Purpose</span>
              <span className="text-white/80 block">
                {invoice.recurring ? "Covenant Monthly Seed" : "One-Time Kingdom Offering"}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider block">Tax Status</span>
              <span className="text-emerald-400 font-semibold block">100% Tax Deductible</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider block">Spiritual Oversight</span>
              <span className="text-white/80 block">Bishop Dr. George Githinji</span>
            </div>
          </div>

          {/* Verification Bar & QR Code */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 bg-white/[0.02] -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 rounded-b-2xl">
            <div className="flex items-center gap-3">
              {qrCodeUrl && (
                <img
                  src={qrCodeUrl}
                  alt="QR Verification"
                  className="w-14 h-14 rounded-lg bg-white p-1 border border-white/20 shrink-0"
                />
              )}
              <div>
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Central Registry Authenticated</span>
                </div>
                <p className="text-[10px] text-white/50 mt-0.5">
                  Scan QR code with any mobile camera for real-time validation.
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[9px] uppercase tracking-widest text-[#d4af37] font-bold block">
                Authorized By
              </span>
              <span className="font-brand font-bold text-xs text-white">Presiding Bishop</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handlePrint}
            disabled={printing}
            className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] text-[#0c1b33] font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-[#0c1b33]" />
            <span>{printing ? "Preparing Document..." : "Print Official Invoice / PDF"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
