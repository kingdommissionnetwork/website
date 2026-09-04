import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, Heart, ShieldCheck, Sparkles, Calendar, MapPin, ArrowRight, Crown, Globe, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AmbientParticles from "../../components/AmbientParticles";
import ScrollReveal from "../../components/ScrollReveal";
import bishopHeroImg from "../../assets/bishop-hero.png";

const UPCOMING_MISSIONS = [
  {
    id: "zimbabwe",
    title: "Zimbabwe Kingdom Missions Conference",
    dates: "October 6–10, 2026",
    shortDates: "Oct 6–10, 2026",
    location: "Harare, Zimbabwe",
    flag: "🇿🇼",
    badge: "International Summit",
    summary: "An apostolic gathering uniting leaders, pastors, and believers across nations for revival fire and kingdom breakthrough in Zimbabwe.",
    image: "/images/zimbabwe-conference.jpg",
  },
  {
    id: "pakistan",
    title: "Pakistan Kingdom Gospel Mission",
    dates: "December 1–6, 2026",
    shortDates: "Dec 1–6, 2026",
    location: "Lahore, Pakistan",
    flag: "🇵🇰",
    badge: "Gospel Crusade & Outreach",
    summary: "A historic week of mass evangelistic crusades, pastors' empowerment seminars, and salvation harvest reaching unreached souls across Pakistan.",
    image: "/images/pakistan-mission.jpg",
  },
  {
    id: "mombasa",
    title: "New Dawn Conference — Mombasa",
    dates: "March 12–14, 2027",
    shortDates: "Mar 12–14, 2027",
    location: "Mombasa, Kenya",
    flag: "🇰🇪",
    badge: "Flagship Annual Conference",
    summary: "A prophetic landmark conference heralding a new spiritual dawn, dynamic worship, and apostolic commissioning at the coastal city of Mombasa.",
    image: "/images/new-dawn-mombasa.jpg",
  },
];

export default function HeroSection() {
  const [activeTab, setActiveTab] = useState(0);
  const currentEvent = UPCOMING_MISSIONS[activeTab];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#071324] via-[#0c1b33] to-[#1a1107] pt-[72px] md:pt-[100px] lg:pt-[108px] pb-14 md:pb-20 px-4 sm:px-6 lg:px-8">
      {/* Dynamic Warm Orange & Gold Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[650px] h-[400px] md:h-[650px] bg-[radial-gradient(circle,rgba(212,175,55,0.18)_0%,transparent_70%)] pointer-events-none blur-2xl" />
      <div className="absolute top-12 right-0 md:right-10 w-[350px] md:w-[550px] h-[350px] md:h-[550px] bg-[radial-gradient(circle,rgba(249,115,22,0.16)_0%,transparent_65%)] pointer-events-none blur-3xl" />
      <div className="absolute bottom-10 left-10 w-[300px] md:w-[450px] h-[300px] md:h-[450px] bg-[radial-gradient(circle,rgba(234,88,12,0.12)_0%,transparent_70%)] pointer-events-none blur-3xl" />

      {/* Ambient Particles */}
      <AmbientParticles />

      {/* Main Container */}
      <div className="container-main mx-auto relative z-10 max-w-7xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* Left Column: Mission, Typography & Actions */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-5 md:space-y-6 order-1">
            <ScrollReveal delay={100}>
              <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/[0.08] border border-[#d4af37]/40 text-[#fbf5b7] text-[10px] sm:text-xs font-semibold shadow-inner backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Official Global Platform • Kingdom Missions Network</span>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <h1 className="font-brand text-[32px] sm:text-4xl md:text-5xl lg:text-[58px] xl:text-[62px] font-bold text-white leading-[1.1] tracking-tight">
                Connecting Believers{" "}
                <span className="bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] bg-clip-text text-transparent">
                  Worldwide in Prayer
                </span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <p className="font-outfit text-sm sm:text-base md:text-lg text-white/80 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                A 24/7 global sanctuary uniting Christians across nations through continuous intercession, scripture in 22 translations, anointed sermons, and kingdom missions.
              </p>
            </ScrollReveal>

            {/* Action Buttons */}
            <ScrollReveal delay={400}>
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
                <Link
                  to="/prayer-wall"
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c5961d] text-[#0c1b33] font-bold text-sm hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Heart className="w-4 h-4 fill-current text-[#0c1b33]" />
                  <span>24/7 Prayer Wall</span>
                </Link>
                <Link
                  to="/sermons"
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/25 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 backdrop-blur-sm active:scale-95"
                >
                  <Play className="w-4 h-4 text-[#d4af37]" />
                  <span>Watch Sermons</span>
                </Link>
                <Link
                  to="/subscribe"
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#d4af37]/15 hover:bg-[#d4af37]/25 border border-[#d4af37]/50 text-[#fbf5b7] font-semibold text-sm transition-all flex items-center justify-center gap-2 backdrop-blur-sm active:scale-95 shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                >
                  <Crown className="w-4 h-4 text-[#d4af37]" />
                  <span>Partnership Packages</span>
                </Link>
              </div>
            </ScrollReveal>

            {/* Scripture Verse Bar */}
            <ScrollReveal delay={500}>
              <div className="pt-5 border-t border-white/10 max-w-xl mx-auto lg:mx-0">
                <p className="font-brand text-sm sm:text-base italic text-[#f3e5ab]">
                  &ldquo;For where two or three gather in my name, there am I with them.&rdquo;
                </p>
                <p className="font-outfit text-[10px] sm:text-xs text-[#d4af37] font-semibold uppercase tracking-widest mt-1">
                  — Matthew 18:20
                </p>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Bishop Portrait — below text on mobile, right on desktop */}
          <div className="lg:col-span-5 flex justify-center relative order-2">
            <ScrollReveal delay={300}>
              <div className="relative w-full max-w-[260px] sm:max-w-[340px] md:max-w-[400px] lg:max-w-[470px]">
                {/* Background Golden Radiance Aura */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#d4af37]/20 via-[#d4af37]/10 to-transparent blur-3xl transform scale-90 pointer-events-none" />

                {/* Bishop Cut-Out Image */}
                <div className="relative z-10 flex justify-center">
                  <img
                    src={bishopHeroImg}
                    alt="Bishop Dr. George Githinji — Founder of Kingdom Missions Network"
                    className="w-full h-auto max-h-[320px] sm:max-h-[460px] md:max-h-[540px] lg:max-h-[600px] object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
                    width="470"
                    height="595"
                    loading="eager"
                  />
                </div>

                {/* Floating Glass Leadership Badge */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 w-[88%] sm:w-auto px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-[#071324]/90 border border-[#d4af37]/50 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md text-left">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-outfit text-[9px] font-bold uppercase tracking-wider text-[#d4af37]">
                      Founder & Spiritual Overseer
                    </span>
                  </div>
                  <h2 className="font-brand text-sm sm:text-base font-bold text-white leading-tight">
                    Bishop Dr. George Githinji
                  </h2>
                  <p className="font-outfit text-[10px] text-white/70">
                    HKM Ministries International & KMN
                  </p>
                </div>

                {/* Floating Prayer Metric Badge — desktop only */}
                <div className="hidden lg:flex absolute top-10 -right-2 z-20 items-center gap-2.5 px-4 py-2 rounded-full bg-[#0c1b33]/85 border border-white/20 shadow-lg backdrop-blur-md">
                  <Sparkles className="w-4 h-4 text-[#d4af37]" />
                  <span className="font-outfit text-xs font-semibold text-white">
                    24/7 Global Intercession
                  </span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Global Missions & Conferences Announcement Banner */}
        <ScrollReveal delay={450}>
          <div className="mt-10 md:mt-14 rounded-3xl bg-gradient-to-r from-white/[0.07] via-white/[0.04] to-white/[0.07] border border-[#d4af37]/40 shadow-[0_12px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl p-4 sm:p-6 md:p-7 relative overflow-hidden">
            {/* Ambient inner glow */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#d4af37]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#f97316]/15 rounded-full blur-3xl pointer-events-none" />

            {/* Banner Top Header with Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4af37] opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#d4af37]" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#d4af37]" />
                    <span className="text-xs uppercase font-extrabold tracking-wider text-[#d4af37]">
                      Upcoming Global Missions & Conferences
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                    Register to Attend or Partner with the Global Harvest
                  </h3>
                </div>
              </div>

              {/* Event Switcher Tabs */}
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                {UPCOMING_MISSIONS.map((mission, idx) => (
                  <button
                    key={mission.id}
                    onClick={() => setActiveTab(idx)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 ${
                      activeTab === idx
                        ? "bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                        : "bg-white/[0.08] hover:bg-white/[0.14] text-white/80 border border-white/10"
                    }`}
                  >
                    <span>{mission.flag}</span>
                    <span>{mission.shortDates.split(",")[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Event Card Body */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentEvent.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-7 items-center pt-4 sm:pt-5"
              >
                {/* Event Image Banner */}
                <div className="md:col-span-5 relative rounded-2xl overflow-hidden aspect-video md:aspect-[16/10] group shadow-lg border border-white/15">
                  <img
                    src={currentEvent.image}
                    alt={currentEvent.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Floating Date Badge */}
                  <div className="absolute top-3 left-3 bg-[#0c1b33]/90 border border-[#d4af37]/60 text-white rounded-xl px-3 py-1 text-xs font-bold flex items-center gap-1.5 shadow-md backdrop-blur-md">
                    <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>{currentEvent.dates}</span>
                  </div>

                  {/* Location Badge */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                    <span className="flex items-center gap-1 font-semibold text-[#fbf5b7] drop-shadow">
                      <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                      {currentEvent.location}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-medium uppercase tracking-wider">
                      {currentEvent.badge}
                    </span>
                  </div>
                </div>

                {/* Event Content & Direct Dual CTAs */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-3 sm:space-y-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#fbf5b7] text-[11px] font-bold uppercase tracking-wider mb-2">
                      <span>{currentEvent.flag}</span>
                      <span>{currentEvent.badge}</span>
                    </div>
                    <h4 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">
                      {currentEvent.title}
                    </h4>
                    <p className="text-white/80 text-xs sm:text-sm leading-relaxed mt-2 font-normal">
                      {currentEvent.summary}
                    </p>
                  </div>

                  {/* Action Buttons: Register & Partnership Packages */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                    <Link
                      to="/events"
                      className="px-5 py-2.5 rounded-xl bg-white/[0.12] hover:bg-white/[0.20] border border-white/25 text-white font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 backdrop-blur-md active:scale-95 hover:border-[#d4af37]"
                    >
                      <Calendar className="w-4 h-4 text-[#d4af37]" />
                      <span>Register / RSVP for Event</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    <Link
                      to="/subscribe"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c5961d] text-[#0c1b33] font-bold text-xs sm:text-sm hover:shadow-[0_0_20px_rgba(212,175,55,0.45)] transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Crown className="w-4 h-4 text-[#0c1b33]" />
                      <span>Support via Partnership Packages</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <p className="text-[11px] text-white/50 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Open to international participants • Sponsor souls, crusades, and Bibles through monthly partnership tiers.
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollReveal>
      </div>

      {/* Bottom transition blend */}
      <div className="absolute bottom-0 left-0 right-0 h-12 md:h-16 bg-gradient-to-t from-[#e6eef7] to-transparent pointer-events-none" />
    </section>
  );
}
