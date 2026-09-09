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
} from "lucide-react";
import brandLogo from "../assets/logo.png";
import {
  type PartnerCardDetails,
  printPartnerIdCard,
  generateQrDataUrl,
  getSmartChipSvg,
  getBarcodeSvg,
} from "../lib/printEngine";
import { useToast } from "../lib/toast";

interface PartnerIdCardProps {
  card: PartnerCardDetails;
  showPrintControls?: boolean;
  onClose?: () => void;
}

export default function PartnerIdCard({
  card,
  showPrintControls = true,
  onClose,
}: PartnerIdCardProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [printing, setPrinting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  // Key for persisting custom uploaded photo
  const photoStorageKey = `kmn_partner_photo_${String(card.id || card.email).toLowerCase()}`;
  const [photoUrl, setPhotoUrl] = useState<string>(() => {
    return localStorage.getItem(photoStorageKey) || card.photoUrl || "";
  });

  const cardId = card.id ? String(card.id).toUpperCase() : `PTN-001`;
  const displayId = cardId.startsWith("HKN-") ? cardId : `HKN-${cardId.slice(0, 8)}`;
  const expiry = card.expiryYear || "2027";
  const joined = card.joinedAt || "2026";

  const initials = (card.name || "KMN")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const verifyUrl = `${window.location.origin}/verify?partner=${encodeURIComponent(displayId)}`;
    generateQrDataUrl(verifyUrl).then(setQrCodeUrl);
  }, [displayId]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file (PNG, JPG, WebP)", "error");
      return;
    }

    // Read as Base64 Data URL and store in localStorage
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setPhotoUrl(base64);
        try {
          localStorage.setItem(photoStorageKey, base64);
          showToast("Member passport photo updated & saved!", "success");
        } catch {
          // If quota exceeded, just keep in component state
          showToast("Member photo set for this session.", "info");
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      await printPartnerIdCard({
        ...card,
        id: displayId,
        photoUrl: photoUrl || undefined,
      });
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

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Hidden file input for photo upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Top control banner: Flip button & Photo upload prompt */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-xs text-[#d4af37]">
          <Sparkles className="w-4 h-4" />
          <span className="font-semibold uppercase tracking-wider text-[11px]">
            Executive ISO-7810 Security Credential
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10"
            title="Upload passport photo"
          >
            <Camera className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>{photoUrl ? "Change Photo" : "Upload Photo"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFlipped(!isFlipped)}
            className="px-3 py-1.5 rounded-xl bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#fbf5b7] text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#d4af37]/30"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{isFlipped ? "View Front" : "View Back"}</span>
          </button>
        </div>
      </div>

      {/* ID CARD CONTAINER */}
      <div className="perspective-1000">
        {!isFlipped ? (
          /* ================= FRONT OF CARD ================= */
          <div
            id="printable-partner-id-card"
            className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-[#081225] via-[#0c1b33] to-[#172745] border-2 border-[#d4af37] p-5 sm:p-7 shadow-[0_0_50px_rgba(212,175,55,0.3)] text-white select-none transition-all duration-300"
          >
            {/* Holographic shimmer foil bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#d4af37] via-[#fdf6d8] to-[#aa7c11] opacity-90" />

            {/* Background guilloche/watermark */}
            <div className="absolute right-2 -bottom-6 opacity-10 pointer-events-none">
              <img src={brandLogo} alt="" className="w-52 h-52 object-contain" />
            </div>

            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-[#d4af37]/30 pb-3 mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <img
                  src={brandLogo}
                  alt="Kingdom Missions Network"
                  className="w-11 h-11 rounded-xl object-contain border border-[#d4af37] p-0.5 bg-white shadow-md"
                />
                <div>
                  <h4 className="font-brand font-bold text-xs sm:text-sm tracking-wider text-white uppercase leading-tight">
                    KINGDOM MISSIONS NETWORK
                  </h4>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-[#d4af37] font-bold block mt-0.5">
                    Global Apostolic Partner Credential
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="px-2.5 py-1 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#fbf5b7] text-[10px] font-extrabold uppercase tracking-wide">
                  {card.planName || "Covenant Partner"}
                </span>
              </div>
            </div>

            {/* Card Main Body */}
            <div className="flex items-start gap-4 sm:gap-5 mb-4 relative z-10">
              {/* Member Photo Frame */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative w-20 h-24 sm:w-24 sm:h-28 rounded-2xl bg-gradient-to-br from-[#060e1a] to-[#0c1f38] border-2 border-[#d4af37] overflow-hidden shrink-0 shadow-xl cursor-pointer flex items-center justify-center"
                title="Click to change member photo"
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={card.name}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-2 text-center">
                    <User className="w-8 h-8 text-[#d4af37]/80 mb-1" />
                    <span className="text-xs font-bold font-brand text-[#fbf5b7]">{initials}</span>
                    <span className="text-[8px] text-white/50 group-hover:text-white mt-1">Upload</span>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                  <Upload className="w-4 h-4 text-[#d4af37] mb-1" />
                  <span className="text-[9px] font-bold">Change</span>
                </div>

                <div className="absolute bottom-0 inset-x-0 bg-[#d4af37]/90 text-[#0c1b33] text-[8px] font-extrabold text-center py-0.5 tracking-wider uppercase">
                  OFFICIAL ID
                </div>
              </div>

              {/* Member Details Column */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div>
                  <h3 className="font-brand font-bold text-base sm:text-xl text-white truncate leading-tight">
                    {card.name || "Covenant Partner"}
                  </h3>
                  <p className="text-[11px] font-mono text-white/70 truncate">{card.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-white/50 block font-bold">
                      Credential ID No.
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-bold text-[#fbf5b7] tracking-wider">
                      {displayId}
                    </span>
                  </div>

                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-white/50 block font-bold">
                      Validity Period
                    </span>
                    <span className="font-semibold text-white/90 text-xs">
                      {joined} – {expiry}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold uppercase inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Verified Active Partner
                  </span>
                </div>
              </div>

              {/* Smart Chip & Scannable QR Code */}
              <div className="hidden sm:flex flex-col items-center gap-2 shrink-0">
                <div
                  dangerouslySetInnerHTML={{ __html: getSmartChipSvg() }}
                  className="drop-shadow-sm"
                />
                {qrCodeUrl && (
                  <img
                    src={qrCodeUrl}
                    alt="QR Verification"
                    className="w-12 h-12 rounded-lg bg-white p-0.5 border border-[#d4af37]"
                  />
                )}
              </div>
            </div>

            {/* Bottom Security Footer */}
            <div className="border-t border-white/10 pt-2.5 flex items-center justify-between text-[10px] text-white/50 relative z-10">
              <div>
                <span className="block text-[8px] uppercase tracking-widest text-white/40">
                  Spiritual Oversight
                </span>
                <span className="font-bold text-white/90">Bishop Dr. George Githinji</span>
              </div>

              <div className="text-center">
                <span className="font-mono text-[8px] text-[#d4af37] tracking-widest block font-bold">
                  ★ HOLO-SECURE PASS ★
                </span>
                <span className="text-[8px] text-white/40">AUTH: {displayId.slice(-6)}</span>
              </div>

              <div className="text-right">
                <span className="block text-[8px] uppercase tracking-widest text-white/40">
                  Secretariat
                </span>
                <span className="font-brand font-bold text-[#fbf5b7]">Nairobi, Kenya</span>
              </div>
            </div>

            {/* Microprint bar */}
            <div className="text-[7px] text-[#d4af37]/60 text-center tracking-widest uppercase mt-2 border-t border-white/5 pt-1 truncate">
              KINGDOM MISSIONS NETWORK • APOSTOLIC CREDENTIAL • VERIFIED IN HEAVEN & EARTH • OFFICIAL COVENANT PASS
            </div>
          </div>
        ) : (
          /* ================= BACK OF CARD ================= */
          <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-[#060e1a] via-[#0c1b33] to-[#081225] border-2 border-[#d4af37] p-5 sm:p-7 shadow-[0_0_50px_rgba(212,175,55,0.3)] text-white select-none space-y-4">
            {/* Magnetic Stripe */}
            <div className="h-8 bg-[#111111] border-y border-white/10 -mx-5 sm:-mx-7 mb-2" />

            {/* Signature Strip */}
            <div>
              <span className="text-[8px] uppercase tracking-widest text-white/50 block mb-1">
                Authorized Cardholder Signature
              </span>
              <div className="h-9 bg-white rounded-lg flex items-center justify-between px-3 text-[#0c1b33] font-mono text-xs font-bold">
                <span className="italic">{card.name}</span>
                <span className="text-gray-400 text-[10px]">{displayId}</span>
              </div>
            </div>

            {/* Terms of Accreditation & Scripture */}
            <div className="text-[10px] text-white/70 leading-relaxed space-y-1.5">
              <p>
                <strong>COVENANT CLEARANCE & GLOBAL ACCESS:</strong> This credential certifies that the bearer is a recognized covenant partner of Kingdom Missions Network, actively supporting frontline apostolic evangelism, missionary deployments, and humanitarian aid.
              </p>
              <blockquote className="italic text-[#fbf5b7] text-[10px] border-l-2 border-[#d4af37] pl-2 my-1">
                "And the twelve were with him, and certain women... which ministered unto him of their substance." — Luke 8:1-3
              </blockquote>
            </div>

            {/* Barcode & Secretariat */}
            <div className="border-t border-white/10 pt-3 flex items-center justify-between">
              <div className="text-[9px] text-white/60">
                <span>Secretariat: P.O. Box Nairobi, Kenya</span><br />
                <span>Support: support@kingdommissions.org</span>
              </div>
              <div
                dangerouslySetInnerHTML={{ __html: getBarcodeSvg(displayId) }}
                className="bg-white p-1 rounded-md"
              />
            </div>
          </div>
        )}
      </div>

      {/* Print and Share Controls */}
      {showPrintControls && (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handlePrint}
            disabled={printing}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] text-[#0c1b33] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-[#0c1b33]" />
            <span>{printing ? "Preparing Badge..." : "Print Official Credential Badge"}</span>
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
