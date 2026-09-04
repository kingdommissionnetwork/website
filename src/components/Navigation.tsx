import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Radio, User, Book, Heart, Headphones, Calendar, Gift, DollarSign, Crown, ShieldCheck, LogOut, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import brandLogo from "../assets/logo.png";
import { useAuth } from "../lib/auth";

const navLinks = [
  { label: "About Us", path: "/about", icon: ShieldCheck },
  { label: "Scriptures", path: "/bible", icon: Book },
  { label: "Prayer Wall", path: "/prayer-wall", icon: Heart },
  { label: "Sermons", path: "/sermons", icon: Headphones },
  { label: "Events", path: "/events", icon: Calendar },
  { label: "Partner", path: "/subscribe", icon: Crown },
];

export default function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-300 bg-[#FAF7F2] border-b border-[#d4af37] shadow-[0_2px_16px_rgba(0,0,0,0.1)] h-[64px] md:h-[92px] lg:h-[108px] ${
          scrolled ? "shadow-[0_4px_24px_rgba(0,0,0,0.15)]" : ""
        }`}
      >
        {/* Bottom luminous gold gradient accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#d4af37]/40 via-[#d4af37] to-[#d4af37]/40 pointer-events-none" />

        <div className="container-main mx-auto h-full flex items-center justify-between px-3 sm:px-4 md:px-6">
          {/* Brand Logo & Identity */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 md:gap-4 group py-1 shrink-0">
            <img
              src={brandLogo}
              alt="Kingdom Missions Network"
              className="h-10 sm:h-12 md:h-16 lg:h-20 w-auto object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.2)] transition-transform duration-300 group-hover:scale-105"
              width="80"
              height="80"
            />
            <div className="flex flex-col">
              <span className="font-outfit text-[11px] sm:text-[12.5px] md:text-[14px] lg:text-[15.5px] font-extrabold text-[#0c1b33] tracking-[0.08em] md:tracking-[0.095em] leading-tight uppercase group-hover:text-[#996515] transition-colors whitespace-nowrap">
                Kingdom Missions Network
              </span>
              <span className="font-outfit text-[8px] sm:text-[9px] md:text-[10px] lg:text-[11px] font-bold tracking-[0.25em] md:tracking-[0.32em] text-[#996515] uppercase leading-none mt-0.5">
                Global Christian Community
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links (Clean, Un-crowded, Single Line) */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`relative px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold tracking-wide whitespace-nowrap transition-all duration-200 ${
                    active
                      ? "text-[#0c1b33] font-bold bg-[#d4af37]/20 shadow-sm border border-[#d4af37]/40"
                      : "text-[#0c1b33]/85 hover:text-[#996515] hover:bg-black/[0.04]"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#996515] rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Actions: Standout Give CTA, Live Button, Admin */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Standout Gold Give CTA Button */}
            <Link
              to="/#give"
              onClick={(e) => {
                e.preventDefault();
                if (location.pathname !== "/") {
                  window.location.hash = "#/";
                  setTimeout(() => {
                    document.getElementById("give")?.scrollIntoView({ behavior: "smooth" });
                  }, 300);
                } else {
                  document.getElementById("give")?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c5961d] text-[#0c1b33] font-bold text-xs sm:text-sm tracking-wide shadow-md hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:scale-105 transition-all whitespace-nowrap"
            >
              <Gift className="w-4 h-4 text-[#0c1b33]" />
              <span>Give</span>
            </Link>

            {/* Live Indicator Button */}
            <Link
              to="/events"
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#dc2626] text-white text-xs sm:text-sm font-bold hover:bg-[#b91c1c] transition-all shadow-[0_2px_10px_rgba(220,38,38,0.35)] whitespace-nowrap"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-80" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <span>LIVE</span>
            </Link>

            {/* User Profile & Portals Dropdown */}
            <div className="relative hidden md:block" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="User Account & Dashboards"
                className="flex items-center gap-1.5 p-1.5 rounded-full bg-[#0c1b33] text-[#FAF7F2] hover:bg-[#162a4a] transition-all shadow-sm"
              >
                <div className="w-6 h-6 rounded-full bg-[#d4af37]/20 text-[#fbf5b7] text-[11px] font-bold flex items-center justify-center">
                  {user?.name ? user.name.slice(0, 1).toUpperCase() : <User className="w-3.5 h-3.5" />}
                </div>
                <ChevronDown className="w-3 h-3 text-[#d4af37] pr-0.5" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#09182d] border border-white/15 shadow-2xl p-2.5 z-50 text-white space-y-1"
                  >
                    <div className="px-3 py-2 border-b border-white/10 mb-1">
                      <span className="text-[10px] uppercase font-bold text-[#d4af37] tracking-wider block">
                        {isAuthenticated ? "Signed In" : "Partner Access"}
                      </span>
                      <span className="font-bold text-xs text-white block truncate">
                        {user?.name || "Kingdom Partner"}
                      </span>
                      {user?.email && (
                        <span className="text-[10px] text-white/50 block truncate font-mono">
                          {user.email}
                        </span>
                      )}
                    </div>

                    <Link
                      to="/partner-portal"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Crown className="w-4 h-4 text-[#d4af37]" />
                      <span>Covenant Partner Hub</span>
                    </Link>

                    <Link
                      to="/donations"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>Giving Records & History</span>
                    </Link>

                    {(user?.role === "admin" || user?.role === "superadmin" || !isAuthenticated) && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-sky-400" />
                        <span>Operations Admin Hub</span>
                      </Link>
                    )}

                    {isAuthenticated && (
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
              <div className="p-4 pt-2 border-t border-white/10 space-y-1">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.23 }}
                >
                  <Link
                    to="/partner-portal"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-[#fbf5b7] hover:bg-white/5 transition-all"
                  >
                    <Crown className="w-5 h-5 text-[#d4af37]" />
                    Covenant Partner Hub
                  </Link>
                </motion.div>
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
