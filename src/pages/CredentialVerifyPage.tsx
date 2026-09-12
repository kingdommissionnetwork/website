import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ShieldCheck, ShieldX, BadgeCheck, CalendarDays, Hash } from "lucide-react";
import SEO from "../components/SEO";
import brandLogo from "../assets/logo.png";
import { api } from "../lib/api";

interface Credential {
  verified: boolean;
  name?: string;
  tier?: string;
  status?: string;
  partnerNumber?: string | null;
  joinedAt?: string;
  validThrough?: string | null;
  error?: string;
}

/**
 * QR deep-link target (/v/<token>): opens the holder's public credential
 * DIRECTLY — no form, no code entry (best practice for verifiable IDs).
 * The token is unguessable, so the link is safe to print and share.
 * PII-minimized by design: name + tier + status only, never email.
 */
export default function CredentialVerifyPage() {
  const { token = "" } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [credential, setCredential] = useState<Credential | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .verifyCredential(token)
      .then((data) => {
        if (!cancelled) setCredential(data);
      })
      .catch(() => {
        if (!cancelled) setCredential({ verified: false, error: "Credential could not be verified." });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const initials = (credential?.name || "KMN")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const isActive = credential?.verified && credential?.status === "Active";

  return (
    <div className="pt-16 md:pt-[92px] lg:pt-[108px] min-h-screen bg-[#e6eef7] dark:bg-[#071324] transition-colors duration-300">
      <SEO title="Verified Partner Credential — Kingdom Missions Network" description="Official partner credential verification." />
      <div className="container-main mx-auto px-4 py-10 max-w-xl">
        {loading ? (
          <div className="bg-white dark:bg-[#0d1d36] rounded-3xl p-10 shadow-lg flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#6b7c93] dark:text-white/60">Verifying credential…</p>
          </div>
        ) : credential?.verified ? (
          <div className="bg-white dark:bg-[#0d1d36] rounded-3xl overflow-hidden shadow-xl border-2 border-[#d4af37]">
            <div className="bg-gradient-to-r from-[#0c1b33] to-[#1a2d4d] px-6 py-5 flex items-center gap-4">
              <img src={brandLogo} alt="Kingdom Missions Network" className="w-12 h-12 rounded-xl object-contain bg-white p-1 border border-[#d4af37]" />
              <div>
                <p className="text-white font-bold text-sm tracking-wider uppercase">Kingdom Missions Network</p>
                <p className="text-[#d4af37] text-[10px] uppercase tracking-[0.2em] font-bold">Verified Partner Credential</p>
              </div>
            </div>
            <div className="p-6 sm:p-8 text-center">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#0c1b33] to-[#1a2d4d] border-2 border-[#d4af37] flex items-center justify-center mb-4">
                <span className="font-brand font-bold text-2xl text-[#fbf5b7]">{initials}</span>
              </div>
              <h1 className="font-brand font-bold text-2xl text-[#0c1b33] dark:text-white">{credential.name}</h1>
              <p className="text-[#8b5e3c] dark:text-[#d4af37] font-semibold mt-1">{credential.tier}</p>
              <div className="mt-4 flex justify-center">
                <span
                  className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide inline-flex items-center gap-1.5 ${
                    isActive
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40"
                      : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40"
                  }`}
                >
                  {isActive ? <BadgeCheck className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  {credential.status}
                </span>
              </div>
              <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {credential.partnerNumber && (
                  <div className="rounded-xl bg-[#0c1b33]/5 dark:bg-white/5 p-3">
                    <dt className="text-[10px] uppercase tracking-wider text-[#6b7c93] font-bold flex items-center gap-1">
                      <Hash className="w-3 h-3" /> Credential No.
                    </dt>
                    <dd className="font-mono font-bold text-[#0c1b33] dark:text-white mt-0.5">{credential.partnerNumber}</dd>
                  </div>
                )}
                {credential.validThrough && (
                  <div className="rounded-xl bg-[#0c1b33]/5 dark:bg-white/5 p-3">
                    <dt className="text-[10px] uppercase tracking-wider text-[#6b7c93] font-bold flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" /> Valid Through
                    </dt>
                    <dd className="font-semibold text-[#0c1b33] dark:text-white mt-0.5">
                      {new Date(credential.validThrough).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </dd>
                  </div>
                )}
              </dl>
              <p className="mt-6 text-xs text-[#6b7c93] dark:text-white/40 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Authenticated against the live ministry registry just now.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0d1d36] rounded-3xl p-8 sm:p-10 shadow-lg text-center">
            <ShieldX className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="font-brand font-bold text-2xl text-[#0c1b33] dark:text-white">Credential Not Verified</h1>
            <p className="text-sm text-[#6b7c93] dark:text-white/60 mt-2">
              {credential?.error || "This credential link is invalid or has been revoked."} If you received a
              printed card, use the credential number for a manual lookup.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/verify"
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-sm"
              >
                Manual Verification
              </Link>
              <a
                href="mailto:support@kingdommissionsnetwork.org"
                className="px-5 py-3 rounded-xl border border-[#0c1b33]/20 dark:border-white/20 font-bold text-sm text-[#0c1b33] dark:text-white"
              >
                Contact Support
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
