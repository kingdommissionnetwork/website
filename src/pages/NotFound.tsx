import { Link } from "react-router-dom";
import { Home, Heart, Book, ShieldAlert, ArrowLeft } from "lucide-react";
import SEO from "../components/SEO";

export default function NotFound() {
  return (
    <div className="min-h-[85vh] bg-[#FAF7F2] text-[#0c1b33] pt-[120px] pb-24 flex items-center justify-center px-4 sm:px-6">
      <SEO
        title="404 — Page Not Found | Kingdom Missions Network"
        description="The page you are looking for does not exist. Return to Kingdom Missions Network homepage."
      />

      <div className="max-w-xl w-full text-center bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-black/5 space-y-6">
        <div className="w-20 h-20 rounded-full bg-[#d4af37]/15 text-[#996515] flex items-center justify-center mx-auto">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="font-outfit text-xs font-bold uppercase tracking-widest text-[#996515]">
            404 Error • Page Not Found
          </span>
          <h1 className="font-outfit text-3xl sm:text-4xl font-bold text-[#0c1b33]">
            Let Us Guide You Home
          </h1>
          <p className="text-black/70 text-sm sm:text-base leading-relaxed">
            The page or resource you requested may have moved or is temporarily unavailable. Explore our key ministry destinations below:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
          <Link
            to="/about"
            className="p-3.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#d4af37]/10 border border-black/5 flex items-center gap-3 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0c1b33] text-white flex items-center justify-center shrink-0">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#0c1b33]">About Us</div>
              <div className="text-[11px] text-black/60">Our Vision & Faith</div>
            </div>
          </Link>

          <Link
            to="/prayer-wall"
            className="p-3.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#d4af37]/10 border border-black/5 flex items-center gap-3 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0c1b33] text-white flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#0c1b33]">Prayer Wall</div>
              <div className="text-[11px] text-black/60">24/7 Global Prayers</div>
            </div>
          </Link>

          <Link
            to="/bible"
            className="p-3.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#d4af37]/10 border border-black/5 flex items-center gap-3 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0c1b33] text-white flex items-center justify-center shrink-0">
              <Book className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#0c1b33]">Scriptures</div>
              <div className="text-[11px] text-black/60">22 Translations</div>
            </div>
          </Link>

          <Link
            to="/"
            className="p-3.5 rounded-2xl bg-[#0c1b33] text-white hover:bg-[#162a4a] border border-black/5 flex items-center gap-3 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#d4af37] text-[#0c1b33] flex items-center justify-center shrink-0 font-bold">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#fbf5b7]">Return Home</div>
              <div className="text-[11px] text-white/70">Homepage Portal</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
