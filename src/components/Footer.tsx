import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Twitter, Youtube, Mail, Send, CheckCircle2, ShieldCheck, Globe, Crown } from "lucide-react";
import brandLogo from "../assets/logo.png";
import AmbientParticles from "./AmbientParticles";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && email.includes("@")) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <footer className="bg-gradient-to-br from-[#071324] via-[#0c1b33] to-[#1a1107] text-white border-t border-[#d4af37]/30 relative overflow-hidden">
      {/* Top radiant gold accent line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent shadow-[0_1px_8px_rgba(212,175,55,0.4)]" />

      {/* Warm Orange & Golden Radiant Background Glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(249,115,22,0.12)_0%,transparent_70%)] pointer-events-none blur-3xl" />
      <div className="absolute bottom-0 left-10 w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(212,175,55,0.14)_0%,transparent_70%)] pointer-events-none blur-3xl" />

      {/* Ambient Particles in Footer */}
      <AmbientParticles />

      <div className="container-main mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative z-10">
        {/* Main 12-Column Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-14 border-b border-white/10">
          {/* Column 1: Brand, Identity & Mission (5 cols on lg) */}
          <div className="lg:col-span-4 space-y-5">
            <Link to="/" className="inline-flex items-center gap-3.5 group">
              <img
                src={brandLogo}
                alt="Kingdom Missions Network Logo"
                className="h-12 sm:h-14 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(212,175,55,0.3)] transition-transform duration-300 group-hover:scale-105"
                width="56"
                height="56"
              />
              <div className="flex flex-col">
                <span className="font-outfit text-lg sm:text-xl font-extrabold text-white tracking-tight leading-tight">
                  Kingdom Missions Network
                </span>
                <span className="font-outfit text-[10px] sm:text-[11px] font-bold tracking-[0.28em] text-[#d4af37] uppercase leading-none mt-1">
                  Global Christian Community
                </span>
              </div>
            </Link>

            <p className="text-white/70 text-sm leading-relaxed max-w-sm">
              A 24/7 global sanctuary uniting believers across nations through continuous intercession, scripture in 22 translations, live sermons, and kingdom outreach.
            </p>

            <div className="flex items-center gap-2 text-xs text-white/60 font-medium">
              <Globe className="w-4 h-4 text-[#d4af37]" />
              <span>Headquarters: Nairobi, Kenya • Global Online Outreach</span>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://www.youtube.com/@georgegithinji7542"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Official YouTube Channel"
                className="w-10 h-10 rounded-xl bg-white/[0.08] hover:bg-[#d4af37] hover:text-[#071324] text-white/80 flex items-center justify-center transition-all shadow-sm border border-white/10"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter / X"
                className="w-10 h-10 rounded-xl bg-white/[0.08] hover:bg-[#d4af37] hover:text-[#071324] text-white/80 flex items-center justify-center transition-all shadow-sm border border-white/10"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="mailto:kingdommissionsnetwork@gmail.com"
                aria-label="Email Pastoral Office"
                className="w-10 h-10 rounded-xl bg-white/[0.08] hover:bg-[#d4af37] hover:text-[#071324] text-white/80 flex items-center justify-center transition-all shadow-sm border border-white/10"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Ministry & Vision (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-outfit text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
              Ministry
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-sm text-white/70 hover:text-white transition-colors">
                  Our Mission
                </Link>
              </li>
              <li>
                <Link to="/about#faith" className="text-sm text-white/70 hover:text-white transition-colors">
                  Statement of Faith
                </Link>
              </li>
              <li>
                <Link to="/about#leadership" className="text-sm text-white/70 hover:text-white transition-colors">
                  Leadership & Founder
                </Link>
              </li>
              <li>
                <Link to="/about#contact" className="text-sm text-white/70 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/subscribe" className="text-sm text-[#fbf5b7] hover:text-[#d4af37] transition-colors flex items-center gap-1.5 font-semibold">
                  <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
                  Become a Partner
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform & Fellowship (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-outfit text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
              Sanctuary
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/prayer-wall" className="text-sm text-white/70 hover:text-white transition-colors">
                  24/7 Prayer Wall
                </Link>
              </li>
              <li>
                <Link to="/bible" className="text-sm text-white/70 hover:text-white transition-colors">
                  Holy Scriptures (22)
                </Link>
              </li>
              <li>
                <Link to="/sermons" className="text-sm text-white/70 hover:text-white transition-colors">
                  Sermon Library
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-sm text-white/70 hover:text-white transition-colors">
                  Live Events & Broadcasts
                </Link>
              </li>
              <li>
                <Link to="/donations" className="text-sm text-white/70 hover:text-white transition-colors">
                  Giving History
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Daily Devotional & Newsletter (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="font-outfit text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
              Stay Connected
            </h4>
            <p className="text-sm text-white/70 leading-relaxed">
              Receive daily scripture verses, prayer alerts, and inspirational teachings directly from our pastoral team.
            </p>

            {subscribed ? (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>God bless you! You are subscribed to our global prayer network.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2.5">
                <div className="flex items-center rounded-2xl bg-white/[0.08] border border-white/20 p-1.5 focus-within:border-[#d4af37] transition-all">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
                  />
                  <button
                    type="submit"
                    aria-label="Subscribe"
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c5961d] text-[#0c1b33] font-bold text-xs sm:text-sm hover:brightness-110 transition-all flex items-center gap-1.5 shrink-0 shadow-md"
                  >
                    <span>Join</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-white/50">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Free • No Spam • Unsubscribe at any time</span>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-xs text-white/50 flex items-center gap-1.5 justify-center sm:justify-start">
            &copy; 2026 Kingdom Missions Network. All Rights Reserved.
            <Heart className="w-3 h-3 text-[#d4af37] fill-[#d4af37]" />
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-white/50">
            <Link to="/privacy" className="hover:text-[#d4af37] transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-[#d4af37] transition-colors">
              Terms of Service
            </Link>
            <Link to="/accessibility" className="hover:text-[#d4af37] transition-colors">
              Accessibility
            </Link>
            <Link to="/donations" className="hover:text-[#d4af37] transition-colors">
              Giving Records
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
