import { Eye, Mail, Smartphone, Keyboard, Contrast } from "lucide-react";
import SEO from "../components/SEO";

export default function Accessibility() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#0c1b33] pt-[108px] pb-24">
      <SEO
        title="Accessibility Statement — Kingdom Missions Network"
        description="Accessibility statement of Kingdom Missions Network. Committed to ensuring scripture, prayer, and sermons are accessible to everyone regardless of ability."
      />

      {/* Header */}
      <section className="bg-gradient-to-b from-[#0c1b33] to-[#162a4a] text-white py-16 px-4 sm:px-6">
        <div className="container-main mx-auto max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-[#fbf5b7] text-xs font-semibold uppercase tracking-wider border border-white/15">
            <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
            Universal Design & Inclusion
          </div>
          <h1 className="font-outfit text-3xl sm:text-5xl font-bold tracking-tight">
            Accessibility Statement
          </h1>
          <p className="font-outfit text-white/75 text-sm sm:text-base max-w-2xl mx-auto">
            Ensuring every believer worldwide can access God&apos;s Word, intercession, and fellowship seamlessly.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container-main mx-auto max-w-4xl px-4 sm:px-6 py-12">
        <div className="bg-white rounded-3xl p-6 sm:p-12 shadow-md border border-black/5 space-y-10">
          {/* Commitment */}
          <div className="space-y-4">
            <h2 className="font-outfit text-xl sm:text-2xl font-bold text-[#0c1b33]">
              Our Commitment to Accessibility
            </h2>
            <p className="text-black/75 text-sm sm:text-base leading-relaxed">
              Kingdom Missions Network is dedicated to providing a digital platform that is accessible to all individuals, including people with visual, auditory, cognitive, and physical disabilities. We continually work to align our web experiences with the <strong>Web Content Accessibility Guidelines (WCAG 2.1 Level AA)</strong> standards.
            </p>
          </div>

          {/* Key Accessibility Features */}
          <div className="space-y-4">
            <h2 className="font-outfit text-xl sm:text-2xl font-bold text-[#0c1b33]">
              Key Accessibility Implementations
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-black/5 space-y-2">
                <Contrast className="w-6 h-6 text-[#996515]" />
                <h3 className="font-bold text-base text-[#0c1b33]">High Contrast & Legible Typography</h3>
                <p className="text-xs text-black/65">Curated color pairings with verified color contrast ratios to ensure readability in both light and dark environments.</p>
              </div>
              <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-black/5 space-y-2">
                <Keyboard className="w-6 h-6 text-[#996515]" />
                <h3 className="font-bold text-base text-[#0c1b33]">Keyboard Navigation</h3>
                <p className="text-xs text-black/65">Full keyboard navigation support with visible focus outlines across prayer walls, scripture selectors, and menus.</p>
              </div>
              <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-black/5 space-y-2">
                <Eye className="w-6 h-6 text-[#996515]" />
                <h3 className="font-bold text-base text-[#0c1b33]">Screen Reader Optimization</h3>
                <p className="text-xs text-black/65">Semantic HTML5 tags, ARIA attributes, and descriptive alt text on all ministry graphics and portraits.</p>
              </div>
              <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-black/5 space-y-2">
                <Smartphone className="w-6 h-6 text-[#996515]" />
                <h3 className="font-bold text-base text-[#0c1b33]">Responsive & Zoom Friendly</h3>
                <p className="text-xs text-black/65">Fully fluid layouts supporting text zooming up to 200% without loss of content or functionality on mobile and desktop.</p>
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
