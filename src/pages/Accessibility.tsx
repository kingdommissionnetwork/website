import { Eye, Mail, Smartphone, Keyboard, Contrast } from "lucide-react";
import SEO from "../components/SEO";
import AmbientParticles from "../components/AmbientParticles";

export default function Accessibility() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#071324] text-[#0c1b33] dark:text-white pt-16 md:pt-[92px] lg:pt-[108px] pb-24">
      <SEO
        title="Accessibility Statement — Kingdom Missions Network"
        description="Accessibility statement of Kingdom Missions Network. Committed to ensuring scripture, prayer, and sermons are accessible to everyone regardless of ability."
      />

      {/* Header with Responsive Light / Dark Palette */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#eef4fb] via-[#f8fafc] to-[#fdf8ee] dark:from-[#0c1b33] dark:via-[#071324] dark:to-[#1a1107] text-[#0c1b33] dark:text-white py-16 lg:py-20 px-4 sm:px-6 transition-colors duration-300">
        {/* Dynamic Warm Orange & Gold Background Glows */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(249,115,22,0.08)_0%,transparent_65%)] dark:bg-[radial-gradient(circle,rgba(249,115,22,0.18)_0%,transparent_65%)] pointer-events-none blur-3xl" />
        <div className="absolute bottom-0 left-10 w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(212,175,55,0.10)_0%,transparent_65%)] dark:bg-[radial-gradient(circle,rgba(212,175,55,0.20)_0%,transparent_65%)] pointer-events-none blur-3xl" />

        <AmbientParticles />

        <div className="container-main mx-auto max-w-4xl text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0c1b33]/5 dark:bg-white/10 text-[#0c1b33] dark:text-[#fbf5b7] text-xs font-semibold uppercase tracking-wider border border-[#0c1b33]/15 dark:border-[#d4af37]/40 backdrop-blur-md">
            <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
            Universal Design &amp; Inclusion
          </div>
          <h1 className="font-brand text-3xl sm:text-5xl font-bold tracking-tight text-[#0c1b33] dark:text-white">
            Accessibility <span className="bg-gradient-to-r from-[#996515] via-[#d4af37] to-[#8b5e3c] dark:from-[#d4af37] dark:via-[#f5e6b3] dark:to-[#c5961d] bg-clip-text text-transparent">Statement</span>
          </h1>
          <p className="font-outfit text-[#5a6578] dark:text-white/80 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Ensuring every believer worldwide can access God&apos;s Word, intercession, and fellowship seamlessly.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container-main mx-auto max-w-4xl px-4 sm:px-6 py-12">
        <div className="bg-white dark:bg-[#0a1628] rounded-3xl p-6 sm:p-12 shadow-md border border-black/5 dark:border-white/10 space-y-10">
          {/* Commitment */}
          <div className="space-y-4">
            <h2 className="font-outfit text-xl sm:text-2xl font-bold text-[#0c1b33] dark:text-white">
              Our Commitment to Accessibility
            </h2>
            <p className="text-black/75 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
              Kingdom Missions Network is dedicated to providing a digital platform that is accessible to all individuals, including people with visual, auditory, cognitive, and physical disabilities. We continually work to align our web experiences with the <strong>Web Content Accessibility Guidelines (WCAG 2.1 Level AA)</strong> standards.
            </p>
          </div>

          {/* Key Accessibility Features */}
          <div className="space-y-4">
            <h2 className="font-outfit text-xl sm:text-2xl font-bold text-[#0c1b33] dark:text-white">
              Key Accessibility Implementations
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-[#FAF7F2] dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-2">
                <Contrast className="w-6 h-6 text-[#996515] dark:text-[#f6c873]" />
                <h3 className="font-bold text-base text-[#0c1b33] dark:text-white">High Contrast & Legible Typography</h3>
                <p className="text-xs text-black/65 dark:text-slate-400">Curated color pairings with verified color contrast ratios to ensure readability in both light and dark environments.</p>
              </div>
              <div className="p-5 rounded-2xl bg-[#FAF7F2] dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-2">
                <Keyboard className="w-6 h-6 text-[#996515] dark:text-[#f6c873]" />
                <h3 className="font-bold text-base text-[#0c1b33] dark:text-white">Keyboard Navigation</h3>
                <p className="text-xs text-black/65 dark:text-slate-400">Full keyboard navigation support with visible focus outlines across prayer walls, scripture selectors, and menus.</p>
              </div>
              <div className="p-5 rounded-2xl bg-[#FAF7F2] dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-2">
                <Eye className="w-6 h-6 text-[#996515] dark:text-[#f6c873]" />
                <h3 className="font-bold text-base text-[#0c1b33] dark:text-white">Screen Reader Optimization</h3>
                <p className="text-xs text-black/65 dark:text-slate-400">Semantic HTML5 tags, ARIA attributes, and descriptive alt text on all ministry graphics and portraits.</p>
              </div>
              <div className="p-5 rounded-2xl bg-[#FAF7F2] dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-2">
                <Smartphone className="w-6 h-6 text-[#996515] dark:text-[#f6c873]" />
                <h3 className="font-bold text-base text-[#0c1b33] dark:text-white">Responsive & Zoom Friendly</h3>
                <p className="text-xs text-black/65 dark:text-slate-400">Fully fluid layouts supporting text zooming up to 200% without loss of content or functionality on mobile and desktop.</p>
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          <div className="p-6 rounded-2xl bg-[#0c1b33] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-[#fbf5b7]">Encountering an Accessibility Barrier?</h3>
              <p className="text-xs text-white/70 mt-0.5">Please let us know so we can promptly assist and improve your experience.</p>
            </div>
            <a
              href="mailto:kingdommissionsnetwork@gmail.com?subject=Accessibility%20Feedback"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#d4af37] text-[#0c1b33] font-bold text-xs sm:text-sm hover:brightness-110 transition-all shrink-0"
            >
              <Mail className="w-4 h-4" />
              <span>Report Accessibility Issue</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
