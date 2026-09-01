import { Shield, Lock, Eye, FileText, CheckCircle, Mail, Globe } from "lucide-react";
import SEO from "../components/SEO";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#0c1b33] pt-[108px] pb-24">
      <SEO
        title="Privacy Policy — Kingdom Missions Network"
        description="Official Privacy Policy of Kingdom Missions Network. Understand how we protect your personal data, prayer requests, and donor information."
      />

      {/* Header */}
      <section className="bg-gradient-to-b from-[#0c1b33] to-[#162a4a] text-white py-16 px-4 sm:px-6">
        <div className="container-main mx-auto max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-[#fbf5b7] text-xs font-semibold uppercase tracking-wider border border-white/15">
            <Shield className="w-3.5 h-3.5 text-[#d4af37]" />
            Data Protection & Stewardship
          </div>
          <h1 className="font-outfit text-3xl sm:text-5xl font-bold tracking-tight">
            Privacy Policy
          </h1>
          <p className="font-outfit text-white/75 text-sm sm:text-base max-w-2xl mx-auto">
            Last Updated: September 2026 • Kingdom Missions Network is committed to safeguarding the privacy and confidentiality of our global community.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container-main mx-auto max-w-4xl px-4 sm:px-6 py-12">
        <div className="bg-white rounded-3xl p-6 sm:p-12 shadow-md border border-black/5 space-y-10">
          {/* Section 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 flex items-center justify-center text-[#996515]">
                <Eye className="w-5 h-5" />
              </div>
              <h2 className="font-outfit text-xl sm:text-2xl font-bold text-[#0c1b33]">
                1. Information We Collect
              </h2>
            </div>
            <p className="text-black/75 text-sm sm:text-base leading-relaxed">
              We collect information to facilitate prayer ministry, biblical fellowship, mission support, and secure donation processing:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base text-black/75">
              <li><strong>Prayer Requests:</strong> Information submitted via the 24/7 Prayer Wall (names, prayer intentions, testimony details). You may choose to submit prayers anonymously or publicly.</li>
              <li><strong>Donation & Partner Details:</strong> Transaction records, subscription frequency, and contact information processed securely via PCI-DSS compliant payment gateways (Stripe / M-Pesa). We do NOT store complete credit card numbers on our servers.</li>
              <li><strong>Account & Communication Info:</strong> Name, email address, and ministry communication preferences when you register or reach out to our team.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 flex items-center justify-center text-[#996515]">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="font-outfit text-xl sm:text-2xl font-bold text-[#0c1b33]">
                2. How We Protect & Use Your Data
              </h2>
            </div>
            <p className="text-black/75 text-sm sm:text-base leading-relaxed">
              Your information is held in sacred trust. We strictly adhere to the following principles:
            </p>
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-black/5">
                <CheckCircle className="w-5 h-5 text-emerald-600 mb-2" />
                <h4 className="font-bold text-sm text-[#0c1b33]">No Commercial Sale</h4>
                <p className="text-xs text-black/65 mt-1">We will never sell, rent, or trade your personal data or email to commercial marketers or third parties.</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-black/5">
                <CheckCircle className="w-5 h-5 text-emerald-600 mb-2" />
                <h4 className="font-bold text-sm text-[#0c1b33]">Encrypted Transmission</h4>
                <p className="text-xs text-black/65 mt-1">All communications are encrypted using high-grade SSL/TLS protocols with enterprise-level security firewalls.</p>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 flex items-center justify-center text-[#996515]">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="font-outfit text-xl sm:text-2xl font-bold text-[#0c1b33]">
                3. Prayer Wall Privacy Controls
              </h2>
            </div>
            <p className="text-black/75 text-sm sm:text-base leading-relaxed">
              When submitting a prayer request, you retain full control over its visibility. You may designate prayers as:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base text-black/75">
              <li><strong>Public:</strong> Visible to our worldwide community for collective intercession and encouragement.</li>
              <li><strong>Confidential / Pastoral:</strong> Directed solely to Bishop Dr. George Githinji and our pastoral intercessory leadership team.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 flex items-center justify-center text-[#996515]">
                <Globe className="w-5 h-5" />
              </div>
              <h2 className="font-outfit text-xl sm:text-2xl font-bold text-[#0c1b33]">
                4. Your Rights & Data Deletion
              </h2>
            </div>
            <p className="text-black/75 text-sm sm:text-base leading-relaxed">
              You have the right to request a copy of the data we hold regarding you, or to request permanent removal of your prayer requests and contact information at any time.
            </p>
          </div>

          {/* Contact Box */}
          <div className="p-6 rounded-2xl bg-[#0c1b33] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-[#fbf5b7]">Questions Regarding Privacy?</h3>
              <p className="text-xs text-white/70 mt-0.5">Contact our Data Protection & Pastoral Office directly.</p>
            </div>
            <a
              href="mailto:kingdommissionsnetwork@gmail.com"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#d4af37] text-[#0c1b33] font-bold text-xs sm:text-sm hover:brightness-110 transition-all shrink-0"
            >
              <Mail className="w-4 h-4" />
              <span>Email Privacy Team</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
