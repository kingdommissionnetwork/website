import { useState, useEffect, useRef } from "react";
import {
  Printer,
  Copy,
  Check,
  RotateCw,
  Camera,
  Upload,
  CheckCircle2,
  Sparkles,
  User,
  Eye,
  CreditCard,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import brandLogo from "../assets/logo.png";
import {
  type PartnerCardDetails,
  printPartnerIdCard,
  buildPartnerIdCardHtml,
  generateQrDataUrl,
  getSmartChipSvg,
  getBarcodeSvg,
  toDisplayId,
  credentialVerifyUrl,
} from "../lib/printEngine";
import { useToast } from "../lib/toast";
import { PARTNERSHIP_SUPPORT_PHONE_DISPLAY } from "../lib/support";
import bishopSignature from "../assets/bishop-signature.png";

interface PartnerIdCardProps {
  card: PartnerCardDetails;
  showPrintControls?: boolean;
  onClose?: () => void;
}

type CardView = "interactive" | "print-preview";

export default function PartnerIdCard({
  card,
  showPrintControls = true,
  onClose,
}: PartnerIdCardProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  const [printing, setPrinting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [view, setView] = useState<CardView>("interactive");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [zoom, setZoom] = useState(1.6);

  const photoStorageKey = `kmn_partner_photo_${String(card.id || card.email).toLowerCase()}`;
  const [photoUrl, setPhotoUrl] = useState<string>(() => {
    return localStorage.getItem(photoStorageKey) || card.photoUrl || "";
  });

  // Prefer the issued credential number (KMN-P-2026/4002); legacy ids kept whole.
  const displayId = toDisplayId(card.partnerNumber || card.id);
  const holderName = (card.name || "Covenant Partner").trim();
  const expiry = card.expiryYear || "2027";
  const joined = card.joinedAt || "2026";

  const initials = (card.name || "KMN")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // QR deep link: unguessable /v/<token> opens the holder's details directly
  // (no form, no code entry). Legacy cards without a token fall back to the
  // manual verify page.
  useEffect(() => {
    const verifyUrl = credentialVerifyUrl(window.location.origin, displayId, card.verifyToken);
    generateQrDataUrl(verifyUrl).then(setQrCodeUrl);
  }, [displayId, card.verifyToken]);

  // Load print preview iframe whenever switching to that view or photo changes
  useEffect(() => {
    if (view !== "print-preview") return;
    setPreviewLoading(true);

    buildPartnerIdCardHtml({ ...card, id: displayId, partnerNumber: displayId, verifyToken: card.verifyToken, photoUrl: photoUrl || undefined }).then((html) => {
      const iframe = previewIframeRef.current;
      if (!iframe) return;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;
      doc.open();
      doc.write(html);
      doc.close();
      iframe.onload = () => setPreviewLoading(false);
      setTimeout(() => setPreviewLoading(false), 800);
    });
  }, [view, card, displayId, photoUrl]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file (PNG, JPG, WebP)", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setPhotoUrl(base64);
        try {
          localStorage.setItem(photoStorageKey, base64);
          showToast("Member passport photo updated & saved!", "success");
        } catch {
          showToast("Member photo set for this session.", "info");
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Passport photo is mandatory: an ID credential must never print faceless.
  const photoMissing = !photoUrl;

  const handlePrint = async () => {
    if (photoMissing) {
      showToast("Please upload the holder's passport photo first — the credential cannot print without it.", "error");
      setView("interactive");
      return;
    }
    setPrinting(true);
    try {
      await printPartnerIdCard({ ...card, id: displayId, partnerNumber: displayId, verifyToken: card.verifyToken, photoUrl: photoUrl || undefined });
      showToast("Partner Credential Pass sent to printer!", "success");
    } catch (err) {
      console.error(err);
      showToast("Printing failed. Please check browser permissions.", "error");
    } finally {
      setPrinting(false);
    }
  };

  const handleCopyCode = () => {
    const text = `Kingdom Missions Network Partner Credential | ID: ${displayId} | Partner: ${card.name} | Tier: ${card.planName} | Status: Verified Active`;
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    showToast("Credential verification code copied to clipboard!", "success");
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // CR80 at 96dpi ≈ 324×204px. We'll render the iframe at 324×204 then scale.
  // 85.6mm = 323.7px, 54mm = 204px at 96dpi
  const CARD_W = 324;
  const CARD_H = 204;

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        className="hidden"
      />

      {/* ── Tab Bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
          <button
            type="button"
            onClick={() => setView("interactive")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              view === "interactive"
                ? "bg-[#d4af37] text-[#0c1b33] shadow"
                : "text-white/60 hover:text-white"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>ID Card</span>
          </button>
          <button
            type="button"
            onClick={() => setView("print-preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              view === "print-preview"
                ? "bg-[#d4af37] text-[#0c1b33] shadow"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Print Preview</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {view === "interactive" && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10"
              >
                <Camera className="w-3.5 h-3.5 text-[#d4af37]" />
                <span className="hidden sm:inline">{photoUrl ? "Change Photo" : "Upload Photo"}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFlipped(!isFlipped)}
                className="px-3 py-1.5 rounded-xl bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#fbf5b7] text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#d4af37]/30"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{isFlipped ? "View Front" : "View Back"}</span>
              </button>
            </>
          )}

          {view === "print-preview" && (
            <div className="flex items-center gap-1 bg-white/5 rounded-lg px-1 py-0.5 border border-white/10">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.8, +(z - 0.2).toFixed(1)))}
                className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-white/50 text-xs font-mono w-10 text-center select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3.5, +(z + 0.2).toFixed(1)))}
                className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1.6)}
                className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Interactive Card View ───────────────────────────────────── */}
      {view === "interactive" && (
        <div>
          {!isFlipped ? (
            /* ── FRONT ── */
            <div
              id="printable-partner-id-card"
              className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-[#fdfaf1] via-[#f6ecd4] to-[#efe0bd] border-2 border-[#b8912a] p-5 sm:p-7 shadow-[0_10px_40px_rgba(138,109,28,0.25)] text-[#0c1b33] select-none transition-all duration-300"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#b8912a] via-[#f3dfa0] to-[#8a6d1c] opacity-90" />
              <div className="absolute right-2 -bottom-6 opacity-10 pointer-events-none">
                <img src={brandLogo} alt="" className="w-52 h-52 object-contain" />
              </div>

              <div className="flex items-center justify-between border-b border-[#b8912a]/40 pb-3 mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <img src={brandLogo} alt="Kingdom Missions Network" className="w-11 h-11 rounded-xl object-contain border border-[#b8912a] p-0.5 bg-white shadow-md" />
                  <div>
                    <h4 className="font-brand font-bold text-xs sm:text-sm tracking-wider text-[#0c1b33] uppercase leading-tight">KINGDOM MISSIONS NETWORK</h4>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#8a6d1c] font-bold block mt-0.5">Global Apostolic Partner Credential</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full bg-[#0c1b33] border border-[#b8912a] text-[#f6e9c8] text-[10px] font-extrabold uppercase tracking-wide">
                    {card.planName || "Covenant Partner"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-4 sm:gap-5 mb-4 relative z-10">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative w-20 h-24 sm:w-24 sm:h-28 rounded-2xl bg-gradient-to-br from-[#060e1a] to-[#0c1f38] border-2 border-[#d4af37] overflow-hidden shrink-0 shadow-xl cursor-pointer flex items-center justify-center"
                  title="Click to change member photo"
                >
                  {photoUrl ? (
                    <img src={photoUrl} alt={card.name} className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2 text-center">
                      <User className="w-8 h-8 text-[#d4af37]/80 mb-1" />
                      <span className="text-xs font-bold font-brand text-[#fbf5b7]">{initials}</span>
                      <span className="text-[8px] text-white/50 group-hover:text-white mt-1">Upload</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                    <Upload className="w-4 h-4 text-[#d4af37] mb-1" />
                    <span className="text-[9px] font-bold">Change</span>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-[#d4af37]/90 text-[#0c1b33] text-[8px] font-extrabold text-center py-0.5 tracking-wider uppercase">OFFICIAL ID</div>
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div>
                    <h3 className="font-brand font-bold text-base sm:text-xl text-[#0c1b33] truncate leading-tight">{card.name || "Covenant Partner"}</h3>
                    <p className="text-[11px] font-mono text-[#0c1b33]/60 truncate">{card.email}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-[8px] uppercase tracking-wider text-[#0c1b33]/45 block font-bold">Credential ID No.</span>
                      <span className="font-mono text-xs sm:text-sm font-bold text-[#7c6116] tracking-wider">{displayId}</span>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase tracking-wider text-[#0c1b33]/45 block font-bold">Validity Period</span>
                      <span className="font-semibold text-[#0c1b33]/85 text-xs">{joined} – {expiry}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-600/10 text-emerald-700 border border-emerald-600/30 text-[10px] font-bold uppercase inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      Verified Active Partner
                    </span>
                  </div>
                </div>

                <div className="hidden sm:flex flex-col items-center gap-2 shrink-0">
                  <div dangerouslySetInnerHTML={{ __html: getSmartChipSvg() }} className="drop-shadow-sm" />
                  {qrCodeUrl && (
                    <img src={qrCodeUrl} alt="QR Verification" className="w-12 h-12 rounded-lg bg-white p-0.5 border border-[#d4af37]" />
                  )}
                </div>
              </div>

              <div className="border-t border-[#0c1b33]/15 pt-2.5 flex items-center justify-between text-[10px] text-[#0c1b33]/50 relative z-10">
                <div>
                  <span className="block text-[8px] uppercase tracking-widest text-[#0c1b33]/40">Spiritual Oversight</span>
                  <img src={bishopSignature} alt="Bishop Dr. George Githinji Official Signature" className="h-4 sm:h-5 w-auto object-contain my-0.5" />
                  <span className="font-bold text-[#0c1b33]/90 block">Bishop Dr. George Githinji</span>
                </div>
                <div className="text-center">
                  <span className="font-mono text-[8px] text-[#8a6d1c] tracking-widest block font-bold">★ HOLO-SECURE PASS ★</span>
                  <span className="text-[8px] text-[#0c1b33]/40">AUTH: {displayId.slice(-6)}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[8px] uppercase tracking-widest text-[#0c1b33]/40">Secretariat</span>
                  <span className="font-brand font-bold text-[#0c1b33]">Nairobi, Kenya</span>
                </div>
              </div>

              <div className="text-[7px] text-[#8a6d1c]/70 text-center tracking-widest uppercase mt-2 border-t border-[#0c1b33]/10 pt-1 truncate">
                KINGDOM MISSIONS NETWORK • APOSTOLIC CREDENTIAL • VERIFIED IN HEAVEN & EARTH • OFFICIAL COVENANT PASS
              </div>
            </div>
          ) : (
            /* ── BACK ── */
            <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-[#faf4e4] via-[#f3e7c9] to-[#efe0bd] border-2 border-[#b8912a] p-5 sm:p-7 shadow-[0_10px_40px_rgba(138,109,28,0.25)] text-[#0c1b33] select-none space-y-4">
              <div className="h-8 bg-[#111111] border-y border-[#b8912a]/40 -mx-5 sm:-mx-7 mb-2" />
              <div>
                <span className="text-[8px] uppercase tracking-widest text-[#0c1b33]/50 block mb-1">
                  Authorized Holder Signature: <em className="normal-case font-normal">(digital facsimile — no wet signature required)</em>
                </span>
                <div className="h-9 bg-white rounded-lg border border-[#0c1b33]/20 flex items-center justify-between gap-2 px-3">
                  <span
                    className="text-[#16294d] text-lg leading-none italic truncate"
                    style={{ fontFamily: "'Brush Script MT','Segoe Script','Snell Roundhand','Apple Chancery',cursive" }}
                  >
                    {holderName}
                  </span>
                  <span className="text-gray-500 text-[10px] font-mono font-bold whitespace-nowrap">{displayId}</span>
                </div>
              </div>
              <div className="text-[10px] text-[#0c1b33]/70 leading-relaxed space-y-1.5">
                <p><strong>COVENANT DEPLOYMENT STATEMENT:</strong> This credential certifies that the bearer is a fully consecrated global covenant partner supporting frontline evangelism, church planting, and humanitarian relief under Kingdom Missions Network.</p>
                <blockquote className="italic text-[#7c6116] text-[10px] border-l-2 border-[#b8912a] pl-2 my-1">
                  "And the twelve were with him, and certain women... which ministered unto him of their substance." — Luke 8:1-3
                </blockquote>
              </div>
              <div className="border-t border-[#0c1b33]/15 pt-3 flex items-center justify-between">
                <div className="text-[9px] text-[#0c1b33]/60 leading-relaxed">
                  <span><strong>Secretariat:</strong> Nairobi, Kenya</span><br />
                  <span><strong>Hotline:</strong> {PARTNERSHIP_SUPPORT_PHONE_DISPLAY} | kingdommissionsnetwork.org</span>
                </div>
                <div dangerouslySetInnerHTML={{ __html: getBarcodeSvg(displayId) }} className="bg-white p-1 rounded-md border border-[#0c1b33]/10" />
              </div>
            </div>
          )}

          <p className="text-center text-white/30 text-[10px] mt-2 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-[#d4af37]" />
            <span>Switch to <strong>Print Preview</strong> to see exactly what will be printed</span>
          </p>
        </div>
      )}

      {/* ── Print Preview (WYSIWYG iframe) ─────────────────────────── */}
      {view === "print-preview" && (
        <div className="rounded-2xl bg-[#1a1a2e] border border-white/10 overflow-hidden">
          <div className="bg-[#12122b] border-b border-white/10 px-4 py-2 text-white/40 text-xs flex items-center gap-2 flex-wrap">
            <Eye className="w-3.5 h-3.5" />
            <span>CR80 card (85.6 × 54 mm) — exact printed output at {Math.round(zoom * 100)}% zoom</span>
            {photoMissing && (
              <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
                <Camera className="w-3.5 h-3.5" />
                Passport photo required before printing
              </span>
            )}
          </div>
          <div className="bg-[#2a2a3e] flex items-center justify-center p-8 overflow-auto" style={{ minHeight: "280px" }}>
            <div
              className="relative shadow-2xl shadow-black/70"
              style={{ width: `${Math.round(CARD_W * zoom)}px`, height: `${Math.round(CARD_H * zoom)}px` }}
            >
              {previewLoading && (
                <div className="absolute inset-0 z-10 bg-white rounded-md flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <iframe
                ref={previewIframeRef}
                title="Partner ID Card Print Preview"
                sandbox="allow-same-origin"
                style={{
                  width: `${CARD_W}px`,
                  height: `${CARD_H}px`,
                  border: "none",
                  display: "block",
                  transformOrigin: "top left",
                  transform: `scale(${zoom})`,
                  borderRadius: "4px",
                }}
              />
            </div>
          </div>
          <div className="bg-[#12122b] border-t border-white/10 px-4 py-2 text-white/30 text-xs">
            What you see above is exactly what will be printed. Upload a photo in ID Card view to update the print.
          </div>
        </div>
      )}

      {/* ── Action Buttons ──────────────────────────────────────────── */}
      {showPrintControls && (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={handlePrint}
            disabled={printing}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] text-[#0c1b33] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-[#0c1b33]" />
            <span>{printing ? "Preparing Badge…" : "Print Official Credential Badge"}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyCode}
            className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm border border-white/15 transition-all flex items-center gap-2"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? "Copied!" : "Copy Verification Code"}</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs sm:text-sm transition-colors"
            >
              Close
            </button>
          )}
        </div>
      )}
    </div>
  );
}
