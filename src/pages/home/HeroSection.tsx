import { Link } from "react-router-dom";
import { Play, Heart, ShieldCheck, Sparkles } from "lucide-react";
import AmbientParticles from "../../components/AmbientParticles";
import ScrollReveal from "../../components/ScrollReveal";
import bishopHeroImg from "../../assets/bishop-hero.png";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#071324] via-[#0c1b33] to-[#142642] pt-[72px] md:pt-[100px] lg:pt-[72px] md:pt-[108px] pb-12 md:pb-16 px-4 sm:px-6 lg:px-8">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-[radial-gradient(circle,rgba(212,175,55,0.15)_0%,transparent_70%)] pointer-events-none blur-2xl" />
      <div className="absolute top-1/2 right-0 md:right-10 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-[radial-gradient(circle,rgba(14,165,233,0.10)_0%,transparent_70%)] pointer-events-none blur-3xl" />

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
                  to="/about"
                  className="w-full sm:w-auto px-6 py-3 rounded-full text-white/70 hover:text-white font-medium text-sm transition-colors flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <span>About Us →</span>
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
      </div>

      {/* Bottom transition blend */}
      <div className="absolute bottom-0 left-0 right-0 h-12 md:h-16 bg-gradient-to-t from-[#e6eef7] to-transparent pointer-events-none" />
    </section>
  );
}
