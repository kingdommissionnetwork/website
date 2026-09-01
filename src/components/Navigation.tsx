import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Radio, User, Book, Heart, Headphones, Calendar, Gift, DollarSign, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import brandLogo from "../assets/logo.png";

const navLinks = [
  { label: "Scriptures", path: "/bible", icon: Book },
  { label: "Prayer Wall", path: "/prayer-wall", icon: Heart },
  { label: "Sermons", path: "/sermons", icon: Headphones },
  { label: "Events", path: "/events", icon: Calendar },
  { label: "Partner", path: "/subscribe", icon: Crown },
  { label: "Give", path: "/#give", icon: Gift },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === "/#give") return location.pathname === "/" && location.hash === "#give";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav
        style={{ backgroundColor: '#FAF7F2' }}
        className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-300 bg-[#FAF7F2] border-b-2 border-[#d4af37] shadow-[0_4px_25px_rgba(0,0,0,0.15)] h-[78px] sm:h-[84px] ${
          scrolled ? "shadow-[0_8px_30px_rgba(0,0,0,0.22)]" : ""
        }`}
      >
        {/* Top subtle highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-white pointer-events-none" />

        {/* Bottom luminous gold gradient accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#d4af37]/40 via-[#d4af37] to-[#d4af37]/40 shadow-[0_1px_6px_rgba(212,175,55,0.7)] pointer-events-none" />

        <div className="container-main mx-auto h-full flex items-center justify-between px-4 sm:px-6">
          {/* High-Visibility Brand Logo & Identity */}
          <Link to="/" className="flex items-center gap-3 sm:gap-4 group py-1">
            <div className="relative flex items-center justify-center">
              <img
                src={brandLogo}
                alt="Kingdom Missions Network"
                className="h-11 sm:h-12 md:h-14 w-auto object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-transform duration-300 group-hover:scale-105"
                width="56"
                height="56"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-brand text-xl sm:text-2xl md:text-[26px] font-normal text-[#0c1b33] tracking-wide leading-tight group-hover:text-[#996515] transition-colors">
                Kingdom Missions Network
              </span>
              <span className="font-outfit text-[9px] sm:text-[10px] md:text-[11px] font-bold tracking-[0.28em] text-[#996515] uppercase leading-none mt-0.5">
                Global Christian Community
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1.5 xl:gap-2 bg-black/[0.04] p-1.5 rounded-full border border-black/10 shadow-inner">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                onClick={(e) => {
                  if (link.path === "/#give") {
                    e.preventDefault();
                    if (location.pathname !== "/") {
                      window.location.hash = "#/";
                      setTimeout(() => {
                        document.getElementById("give")?.scrollIntoView({ behavior: "smooth" });
                      }, 300);
                    } else {
                      document.getElementById("give")?.scrollIntoView({ behavior: "smooth" });
                    }
                  }
                }}
                className={`relative px-3.5 py-1.5 rounded-full text-xs xl:text-sm font-bold uppercase tracking-[0.6px] transition-all duration-200 ${
                  isActive(link.path)
                    ? "text-[#FAF7F2] font-black bg-[#0c1b33] shadow-[0_3px_10px_rgba(12,27,51,0.35)]"
                    : "text-[#0c1b33] hover:text-black hover:bg-black/[0.06]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Live Indicator Button */}
            <Link
              to="/events"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#dc2626] text-white text-xs sm:text-sm font-black hover:bg-[#b91c1c] transition-all shadow-[0_2px_10px_rgba(220,38,38,0.4)]"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-80" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              LIVE
            </Link>

            {/* Admin Profile */}
            <Link
              to="/admin"
              aria-label="Admin Dashboard"
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-full bg-[#0c1b33] text-[#FAF7F2] hover:bg-[#162a4a] transition-all shadow-sm"
            >
              <User className="w-4 h-4" />
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-[#0c1b33] hover:bg-black/[0.06] border border-black/15 rounded-xl transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileOpen ? <X className="w-6 h-6 text-[#0c1b33]" /> : <Menu className="w-6 h-6 text-[#0c1b33]" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[999] lg:hidden"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              onKeyDown={(e) => e.key === 'Escape' && setMobileOpen(false)}
              role="button"
              tabIndex={0}
              aria-label="Close menu"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="absolute right-0 top-0 bottom-0 w-[280px] bg-[#0c1b33] shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <img src={brandLogo} alt="Kingdom Missions Network Logo" className="h-10 w-auto object-contain filter drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" width="40" height="40" />
                  <div className="flex flex-col">
                    <span className="font-brand text-sm font-bold text-white leading-none">Kingdom Missions</span>
                    <span className="font-outfit text-[9px] text-[#d4af37] font-bold tracking-wider uppercase mt-0.5">Network</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-white/80" />
                </button>
              </div>
              <nav className="p-4 pt-2">
                {navLinks.map((link, i) => {
                  const Icon = link.icon;
                  return (
                    <motion.div
                      key={link.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                    >
                      <Link
                        to={link.path}
                        onClick={(e) => {
                          setMobileOpen(false);
                          if (link.path === "/#give") {
                            e.preventDefault();
                            if (location.pathname !== "/") {
                              window.location.hash = "#/";
                            }
                            setTimeout(() => {
                              document.getElementById("give")?.scrollIntoView({ behavior: "smooth" });
                            }, 500);
                          }
                        }}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                          isActive(link.path)
                            ? "bg-[#d4af37]/10 text-[#d4af37]"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {link.label}
                        {link.label === "Events" && (
                          <span className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            Live
                          </span>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>
              <div className="p-4 pt-2 border-t border-white/10">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Link
                    to="/donations"
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all"
                  >
                    <DollarSign className="w-5 h-5" />
                    Giving History
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.27 }}
                >
                  <Link
                    to="/admin"
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all"
                  >
                    <User className="w-5 h-5" />
                    Admin Dashboard
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-400"
                >
                  <Radio className="w-5 h-5" />
                  <span className="flex items-center gap-2">
                    Live Stream
                    <span className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                  </span>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
