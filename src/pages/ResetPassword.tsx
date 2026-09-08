import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import SEO from "../components/SEO";
import brandLogo from "../assets/logo.png";

/**
 * Supabase recovery links land here in one of two shapes:
 * - Implicit flow: /reset-password#access_token=...&type=recovery
 * - Query flow:    /reset-password?token=... (or ?access_token=...)
 * The fragment never reaches the server, so it must be read client-side
 * and forwarded to POST /api/auth/reset-password as { password, token }.
 */
export function extractRecoveryToken(hash: string, search: string): string | null {
  const fromHash = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const hashToken = fromHash.get("access_token");
  if (hashToken) return hashToken;
  const fromQuery = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return fromQuery.get("access_token") || fromQuery.get("token");
}

export function extractRecoveryError(hash: string, search: string): string | null {
  const fromHash = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const err = fromHash.get("error_description") || fromHash.get("error");
  if (err) return err;
  const fromQuery = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return fromQuery.get("error_description") || fromQuery.get("error");
}

export default function ResetPassword() {
  const [token, setToken] = useState<string | null>(null);
  const [linkError, setLinkError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const hash = window.location.hash || "";
    const search = window.location.search || "";
    const problem = extractRecoveryError(hash, search);
    if (problem) {
      setLinkError(decodeURIComponent(problem.replace(/\+/g, " ")));
      return;
    }
    const t = extractRecoveryToken(hash, search);
    if (!t) {
      setLinkError("This password reset link is invalid or expired. Please request a new one.");
      return;
    }
    setToken(t);
    // Remove the token from the visible URL so it isn't leaked via
    // copy-paste, history sync, or referrer headers.
    try {
      window.history.replaceState(null, "", window.location.pathname);
    } catch {
      // history unavailable — ignore
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("Missing reset token. Please request a new reset link.");
      return;
    }
    setSubmitting(true);
    try {
      await api.auth.resetPassword(password, token);
      setDone(true);
    } catch {
      setError("Failed to update password. The link may have expired — request a new one.");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c1b33] via-[#071324] to-[#1a1107] flex items-center justify-center p-4">
      <SEO
        title="Reset Password | Kingdom Missions Network"
        description="Set a new password for your Kingdom Missions Network account."
      />
      <div className="bg-[#0d1d36] rounded-3xl p-8 sm:p-10 max-w-md w-full border border-white/10 shadow-2xl text-white space-y-6">
        <div className="text-center space-y-2">
          <img src={brandLogo} alt="Kingdom Missions Network" className="w-16 h-16 mx-auto object-contain drop-shadow-[0_0_12px_rgba(212,175,55,0.5)]" width="64" height="64" />
          <h1 className="font-brand text-2xl font-bold text-white">Set New Password</h1>
          <p className="text-xs text-white/60">Enter a new password for your account.</p>
        </div>

        {done ? (
          <div className="text-center space-y-4">
            <p className="text-emerald-400 text-sm">Password updated successfully.</p>
            <Link to="/admin" className="inline-block w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-sm shadow-md text-center">
              Continue to Sign In
            </Link>
          </div>
        ) : linkError ? (
          <div className="text-center space-y-4">
            <p className="text-red-400 text-xs">{linkError}</p>
            <Link to="/admin" className="block mx-auto text-xs text-[#d4af37] font-bold hover:underline">
              Request a new reset link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="resetPasswordInput" className="block text-xs uppercase font-bold text-white/60 mb-2">New Password</label>
              <input
                id="resetPasswordInput"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-white/30 text-xs focus:outline-none focus:border-[#d4af37]"
              />
            </div>
            <div>
              <label htmlFor="resetPasswordConfirmInput" className="block text-xs uppercase font-bold text-white/60 mb-2">Confirm Password</label>
              <input
                id="resetPasswordConfirmInput"
                type="password"
                placeholder="••••••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-white/30 text-xs focus:outline-none focus:border-[#d4af37]"
              />
            </div>
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !token}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-sm shadow-md disabled:opacity-50"
            >
              {submitting ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
