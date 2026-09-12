import { Link } from "react-router-dom";
import { Home, Heart, Book, ShieldAlert, ArrowLeft } from "lucide-react";
import SEO from "../components/SEO";

export default function NotFound() {
  return (
    <div className="min-h-[85vh] bg-[#FAF7F2] dark:bg-[#071324] text-[#0c1b33] dark:text-white pt-[120px] pb-24 flex items-center justify-center px-4 sm:px-6">
      <SEO
        title="404 — Page Not Found | Kingdom Missions Network"
        description="The page you are looking for does not exist. Return to Kingdom Missions Network homepage."
      />

      <div className="max-w-xl w-full text-center bg-white dark:bg-[#0a1628] rounded-3xl p-8 sm:p-12 shadow-xl border border-black/5 dark:border-white/10 space-y-6">
        <div className="w-20 h-20 rounded-full bg-[#d4af37]/15 text-[#996515] dark:text-[#f6c873] flex items-center justify-center mx-auto">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="font-outfit text-xs font-bold uppercase tracking-widest text-[#996515] dark:text-[#f6c873]">
            404 Error • Page Not Found
          </span>
          <h1 className="font-outfit text-3xl sm:text-4xl font-bold text-[#0c1b33] dark:text-white">
            Let Us Guide You Home
          </h1>
          <p className="text-black/70 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            The page or resource you requested may have moved or is temporarily unavailable. Explore our key ministry destinations below:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
          <Link
            to="/about"
            className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-white/5 hover:bg-[#d4af37]/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 flex items-center gap-3 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0c1b33] text-white flex items-center justify-center shrink-0">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#0c1b33] dark:text-white">About Us</div>
              <div className="text-[11px] text-black/60 dark:text-slate-400">Our Vision & Faith</div>
            </div>
          </Link>

          <Link
            to="/prayer-wall"
            className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-white/5 hover:bg-[#d4af37]/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 flex items-center gap-3 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0c1b33] text-white flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#0c1b33] dark:text-white">Prayer Wall</div>
              <div className="text-[11px] text-black/60 dark:text-slate-400">24/7 Global Prayers</div>
            </div>
          </Link>

          <Link
            to="/bible"
            className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-white/5 hover:bg-[#d4af37]/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 flex items-center gap-3 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0c1b33] text-white flex items-center justify-center shrink-0">
              <Book className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#0c1b33] dark:text-white">Scriptures</div>
              <div className="text-[11px] text-black/60 dark:text-slate-400">22 Translations</div>
            </div>
          </Link>

          <Link
            to="/"
            className="p-3.5 rounded-2xl bg-[#0c1b33] dark:bg-[#d4af37] text-white dark:text-[#0c1b33] hover:bg-[#162a4a] dark:hover:brightness-110 border border-black/5 flex items-center gap-3 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#d4af37] dark:bg-[#0c1b33] text-[#0c1b33] dark:text-[#d4af37] flex items-center justify-center shrink-0 font-bold">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#fbf5b7] dark:text-[#0c1b33]">Return Home</div>
              <div className="text-[11px] text-white/70 dark:text-[#0c1b33]/80">Homepage Portal</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
