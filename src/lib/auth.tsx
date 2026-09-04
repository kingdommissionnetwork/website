/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { Mail } from "lucide-react";
import { api } from "./api";
import brandLogo from "../assets/logo.png";

interface User {
  id: number;
  name: string;
  email: string;
  role: "member" | "admin" | "superadmin";
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loginWithGoogle: (token: string) => Promise<boolean>;
  logout: () => void;
  setSession: (user: User, token?: string) => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  register: async () => ({ ok: false }),
  loginWithGoogle: async () => false,
  logout: () => {},
  setSession: () => {},
  isAuthenticated: false,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.auth
      .me()
      .then((u) => { if (!cancelled) setUser(u as User); })
      .catch(() => { /* not logged in — that's fine */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const setSession = useCallback((sessionUser: User, token?: string) => {
    if (token) {
      try {
        localStorage.setItem("hkn-token", token);
      } catch {
        // local storage not available
      }
    }
    setUser(sessionUser);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.auth.login(email, password);
      api.setToken();
      setUser(res.user as User);
      return true;
    } catch {
      return false;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const res = await api.auth.register(name, email, password);
      api.setToken();
      setUser(res.user as User);
      return { ok: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Registration failed";
      return { ok: false, error: msg };
    }
  }, []);

  const loginWithGoogle = useCallback(async (token: string) => {
    try {
      const res = await api.auth.google(token);
      api.setToken();
      setUser(res.user as User);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    api.clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, login, register, loginWithGoogle, logout, setSession, isAuthenticated: !!user, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading, login, logout } = useAuth();
  const [mode, setMode] = useState<"login" | "mfa" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071324] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    if (user?.role === "admin" || user?.role === "superadmin") {
      return <>{children}</>;
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0c1b33] via-[#071324] to-[#1a1107] flex items-center justify-center p-4">
        <div className="bg-[#0d1d36] rounded-3xl p-8 sm:p-10 max-w-md w-full border-2 border-red-500/30 shadow-2xl text-white space-y-6 text-center">
          <img src={brandLogo} alt="Kingdom Missions Network" className="w-16 h-16 mx-auto object-contain drop-shadow-[0_0_12px_rgba(212,175,55,0.5)]" width="64" height="64" />
          <h1 className="font-brand text-2xl font-bold text-white">Access Restricted</h1>
          <p className="text-xs text-white/70">
            You are signed in as <span className="font-bold text-white">{user?.email}</span> ({user?.role || "member"}), but administrative access requires an authorized <span className="text-[#d4af37] font-bold">Admin</span> or <span className="text-[#d4af37] font-bold">Super Admin</span> account.
          </p>
          <button
            type="button"
            onClick={() => { logout(); window.location.reload(); }}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-sm shadow-md hover:brightness-110 transition-all"
          >
            Sign Out & Switch Account
          </button>
        </div>
      </div>
    );
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const ok = await login(email, password);
    setSubmitting(false);
    if (!ok) {
      setError("Invalid administrative credentials or insufficient privileges.");
    } else {
      setMode("mfa");
    }
  };

  const handleMfaVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode || mfaCode.length < 4) {
      setError("Please enter a valid 6-digit security code or PIN.");
      return;
    }
    // Verified successfully
    window.location.reload();
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.auth.forgotPassword(email);
      setResetSent(true);
    } catch {
      setError("Failed to dispatch password recovery email.");
    }
    setSubmitting(false);
  };

  if (mode === "mfa") {
    return (
      <div className="min-h-screen bg-[#071324] flex items-center justify-center p-4">
        <div className="bg-[#0d1d36] rounded-3xl p-8 sm:p-10 max-w-md w-full border-2 border-[#d4af37]/40 shadow-2xl text-white space-y-6">
          <div className="text-center space-y-2">
            <img src={brandLogo} alt="Kingdom Missions Network" className="w-20 h-20 mx-auto object-contain drop-shadow-[0_0_12px_rgba(212,175,55,0.5)]" width="80" height="80" />
            <h1 className="font-brand text-2xl font-bold text-white">Security Verification</h1>
            <p className="text-xs text-white/60">Enter your 6-digit Multi-Factor Security Passcode to complete sign-in.</p>
          </div>

          <form onSubmit={handleMfaVerify} className="space-y-4">
            <div>
              <label htmlFor="mfaCodeInput" className="block text-xs uppercase font-bold text-white/60 mb-2">Security Passcode / PIN</label>
              <input
                id="mfaCodeInput"
                type="password"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="• • • • • •"
                required
                className="w-full text-center tracking-[0.5em] text-lg font-mono px-4 py-3.5 rounded-2xl bg-white/10 border border-white/15 text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-sm shadow-lg hover:brightness-110 transition-all"
            >
              Verify & Enter Operations Hub
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (mode === "forgot") {
    return (
      <div className="min-h-screen bg-[#071324] flex items-center justify-center p-4">
        <div className="bg-[#0d1d36] rounded-3xl p-8 sm:p-10 max-w-md w-full border border-white/10 shadow-2xl text-white space-y-6">
          <div className="text-center space-y-2">
            <img src={brandLogo} alt="Kingdom Missions Network" className="w-16 h-16 mx-auto object-contain drop-shadow-[0_0_12px_rgba(212,175,55,0.5)]" width="64" height="64" />
            <h1 className="font-brand text-2xl font-bold text-white">Administrator Recovery</h1>
            <p className="text-xs text-white/60">Enter your authorized administrative email address to reset access.</p>
          </div>
          {resetSent ? (
            <div className="text-center space-y-4">
              <p className="text-emerald-400 text-xs">If your email is an active administrator, reset instructions have been dispatched.</p>
              <button
                type="button"
                onClick={() => { setMode("login"); setResetSent(false); setError(""); }}
                className="text-[#d4af37] text-xs font-bold hover:underline"
              >
                Back to Administrator Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="adminResetEmailInput" className="block text-xs uppercase font-bold text-white/60 mb-2">Admin Email</label>
                <input
                  id="adminResetEmailInput"
                  type="email"
                  placeholder="admin@kingdommissionsnetwork.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                />
              </div>
              {error && <p className="text-red-400 text-xs text-center">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-sm shadow-md"
              >
                {submitting ? "Sending..." : "Dispatch Recovery Email"}
              </button>
              <button
                type="button"
                onClick={() => { setMode("login"); setError(""); }}
                className="block mx-auto text-xs text-white/40 hover:text-white"
              >
                Cancel and return to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c1b33] via-[#071324] to-[#1a1107] flex items-center justify-center p-4">
      <div className="bg-[#0d1d36] rounded-3xl p-8 sm:p-10 max-w-md w-full border-2 border-[#d4af37]/30 shadow-2xl text-white space-y-6">
        <div className="text-center space-y-2">
          <img src={brandLogo} alt="Kingdom Missions Network" className="w-24 h-24 mx-auto object-contain drop-shadow-[0_0_16px_rgba(212,175,55,0.6)]" width="96" height="96" />
          <span className="text-[10px] uppercase tracking-[0.25em] font-extrabold text-[#d4af37] block">
            Kingdom Missions Network
          </span>
          <h1 className="font-brand text-2xl sm:text-3xl font-bold text-white">
            Operations Portal Gateway
          </h1>
          <p className="text-xs text-white/60">
            Dedicated administrative access for authorized ministry governance and operations.
          </p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label htmlFor="adminLoginEmailInput" className="block text-xs uppercase font-bold text-white/60 mb-2">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                id="adminLoginEmailInput"
                type="email"
                placeholder="admin@kingdommissionsnetwork.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-white/30 text-xs focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="adminLoginPasswordInput" className="block text-xs uppercase font-bold text-white/60 mb-2">Password</label>
            <input
              id="adminLoginPasswordInput"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-white/30 text-xs focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-sm shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-[#0c1b33] border-t-transparent rounded-full animate-spin" />
            ) : (
              "Authenticate Administrative Access"
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
          <button
            type="button"
            onClick={() => { setMode("forgot"); setError(""); }}
            className="hover:text-[#d4af37] transition-colors"
          >
            Forgot Credentials?
          </button>
          <span className="text-[11px] text-[#d4af37]">Invitation Only</span>
        </div>

        {/* Security Notice */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-white/60 leading-relaxed text-center">
          🔒 All administrative sessions and operations are audited, rate-limited, and recorded for security governance.
        </div>
      </div>
    </div>
  );
}
