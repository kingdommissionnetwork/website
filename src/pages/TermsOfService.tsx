import { ShieldCheck, Mail } from "lucide-react";
import SEO from "../components/SEO";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#0c1b33] pt-[72px] md:pt-[108px] pb-24">
      <SEO
        title="Terms of Service — Kingdom Missions Network"
        description="Terms of Service and Community Guidelines for Kingdom Missions Network. Understand our biblical standards, prayer wall guidelines, and stewardship terms."
      />

      {/* Header */}
      <section className="bg-gradient-to-b from-[#0c1b33] to-[#162a4a] text-white py-16 px-4 sm:px-6">
        <div className="container-main mx-auto max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-[#fbf5b7] text-xs font-semibold uppercase tracking-wider border border-white/15">
            <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
            Community Covenant & Standards
          </div>
          <h1 className="font-outfit text-3xl sm:text-5xl font-bold tracking-tight">
            Terms of Service
          </h1>
          <p className="font-outfit text-white/75 text-sm sm:text-base max-w-2xl mx-auto">
            Last Updated: September 2026 • Governing your participation across Kingdom Missions Network platform and ministries.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container-main mx-auto max-w-4xl px-4 sm:px-6 py-12">
        <div className="bg-white rounded-3xl p-6 sm:p-12 shadow-md border border-black/5 space-y-10">
          {/* Section 1 */}
          <div className="space-y-3">
            <h2 className="font-outfit text-xl sm:text-2xl font-bold text-[#0c1b33]">
              1. Acceptance of Terms
            </h2>
            <p className="text-black/75 text-sm sm:text-base leading-relaxed">
              By accessing, browsing, or utilizing the services provided by <strong>Kingdom Missions Network (&ldquo;KMN&rdquo;)</strong>, you agree to comply with and be bound by these Terms of Service, our Statement of Faith, and our Privacy Policy. If you disagree with any portion of these terms, please discontinue use of the platform.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h2 className="font-outfit text-xl sm:text-2xl font-bold text-[#0c1b33]">
              2. Christian Fellowship & Prayer Wall Conduct
            </h2>
            <p className="text-black/75 text-sm sm:text-base leading-relaxed">
              Our 24/7 Prayer Wall and community interaction spaces exist solely to build up the Body of Christ, encourage believers, and petition the Lord in unity. Users covenant to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base text-black/75">
              <li>Submit genuine, respectful prayer requests and biblically sound encouragement.</li>
              <li>Refrain from posting promotional spam, profanity, abusive language, hate speech, or defamatory content.</li>
              <li>Respect the confidentiality and dignity of individuals named in prayers.</li>
            </ul>
            <p className="text-black/75 text-sm leading-relaxed mt-2">
              Our pastoral moderation team reserves the right to review, edit, or remove any submission that violates biblical integrity or community standards.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h2 className="font-outfit text-xl sm:text-2xl font-bold text-[#0c1b33]">
              3. Donations, Tithes, & Stewardship
            </h2>
            <p className="text-black/75 text-sm sm:text-base leading-relaxed">
              All financial contributions given to Kingdom Missions Network are voluntary offerings dedicated to global evangelism, ministry operations, pastoral missions, and kingdom outreach under the spiritual oversight of Bishop Dr. George Githinji.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base text-black/75">
              <li>Donations are processed securely via certified third-party payment gateways.</li>
              <li>Recurring partnership subscriptions may be managed, paused, or cancelled at any time through our Subscription Portal or by contacting our team.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h2 className="font-outfit text-xl sm:text-2xl font-bold text-[#0c1b33]">
              4. Scripture & Content Copyright
            </h2>
            <p className="text-black/75 text-sm sm:text-base leading-relaxed">
              Bible texts presented across translations are provided according to respective copyright agreements with publishers (e.g., Crossway, Biblica, Lockman Foundation, Public Domain). Original sermons, audio teachings, and devotional writings by Bishop Dr. George Githinji and KMN are protected under international copyright law.
            </p>
          </div>

          {/* Contact Box */}
          <div className="p-6 rounded-2xl bg-[#0c1b33] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-[#fbf5b7]">Need Clarification on our Terms?</h3>
              <p className="text-xs text-white/70 mt-0.5">We are here to assist with any questions.</p>
            </div>
            <a
              href="mailto:kingdommissionsnetwork@gmail.com"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#d4af37] text-[#0c1b33] font-bold text-xs sm:text-sm hover:brightness-110 transition-all shrink-0"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Pastoral Secretariat</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
