import { useState, useEffect } from "react";
import { DollarSign, ArrowLeft, Loader2, Download, X } from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import AmbientParticles from "../components/AmbientParticles";
import brandLogo from "../assets/logo.png";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";

interface Donation {
  id: string;
  amount: number;
  currency: string;
  donor_name: string;
  donor_email: string;
  recurring: boolean;
  status: string;
  created_at: string;
}

export default function DonationHistory() {
  const [email, setEmail] = useState("");
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const fetchHistory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await api.donations.history(email);
      setDonations(data as Donation[]);
    } catch {
      showToast("Could not load donation history.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-[72px] md:pt-[108px] min-h-screen bg-[#e6eef7]">
      <SEO title="Giving History" description="View your past donations to Kingdom Missions Network." />
      
      {/* Hero Header with Orange Gradient and Ambient Particles */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1b33] via-[#071324] to-[#1a1107] py-16 px-4">
        {/* Dynamic Warm Orange & Gold Background Glows */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(249,115,22,0.18)_0%,transparent_65%)] pointer-events-none blur-3xl" />
        <div className="absolute bottom-0 left-10 w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(212,175,55,0.20)_0%,transparent_65%)] pointer-events-none blur-3xl" />

        <AmbientParticles />

        <div className="container-main mx-auto text-center relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-xs sm:text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="font-brand text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            Giving <span className="bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] bg-clip-text text-transparent">Records & History</span>
          </h1>
          <p className="font-outfit text-white/80 text-sm sm:text-base mt-2 max-w-lg mx-auto">
            View your past seed gifts and kingdom partnership contributions.
          </p>
        </div>
      </div>

      <div className="container-main mx-auto px-4 sm:px-6 py-10">
        {!hasSearched ? (
          <div className="bg-white rounded-2xl shadow-sm border border-[#0c1b33]/5 p-8 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-[#d4af37]/10 flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-7 h-7 text-[#d4af37]" />
            </div>
            <h2 className="font-display text-xl font-semibold text-[#0c1b33] text-center mb-2">Find Your Donations</h2>
            <p className="text-sm text-[#6b7c93] text-center mb-6">Enter the email you used when donating.</p>
            <form onSubmit={fetchHistory} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-[#0c1b33]/10 bg-[#f8f6f3] focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
              />
              <button type="submit" className="w-full btn-gold flex items-center justify-center gap-2">
                View History
              </button>
            </form>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
          </div>
        ) : donations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-[#0c1b33]/5 p-8 max-w-md mx-auto text-center">
            <DollarSign className="w-12 h-12 text-[#6b7c93]/30 mx-auto mb-3" />
            <p className="text-[#6b7c93]">No donations found</p>
            <p className="text-sm text-[#6b7c93]/70 mt-1">Donations made with {email} will appear here.</p>
            <Link to="/#give" className="mt-4 inline-block text-[#d4af37] font-medium text-sm hover:underline">
              Make a donation
            </Link>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#6b7c93]">{donations.length} donation{donations.length !== 1 ? "s" : ""} found</p>
            </div>
            {donations.map((d, i) => (
              <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-[#0c1b33]/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-[#d4af37]" />
                  </div>
                  <div>
                    <p className="text-[#0c1b33] font-medium">${d.amount.toFixed(2)}</p>
                    <p className="text-xs text-[#6b7c93]">{new Date(d.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {d.recurring && (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">Monthly</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedDonation(d)}
                    className="px-3 py-1.5 rounded-lg bg-[#0c1b33]/5 hover:bg-[#0c1b33]/10 text-[#0c1b33] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Official Receipt</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Official Tax Invoice & Donation Receipt Modal */}
      {selectedDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl p-8 rounded-3xl bg-gradient-to-br from-[#0c1b33] via-[#112440] to-[#1a1208] border-2 border-[#d4af37] shadow-[0_0_50px_rgba(212,175,55,0.3)] text-white">
            <button
              type="button"
              onClick={() => setSelectedDonation(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Document Header with Logo */}
            <div className="flex items-center gap-4 pb-6 border-b border-white/15 mb-6">
              <img
                src={brandLogo}
                alt="Kingdom Missions Network"
                className="w-16 h-16 rounded-2xl object-contain border-2 border-[#d4af37] p-1.5 bg-[#0c1b33] drop-shadow-[0_0_12px_rgba(212,175,55,0.5)]"
                width="64"
                height="64"
              />
              <div>
                <span className="font-brand text-xl font-bold text-white tracking-wider block">
                  KINGDOM MISSIONS NETWORK
                </span>
                <span className="text-xs text-[#d4af37] uppercase tracking-[0.2em] font-bold block">
                  Official Giving Receipt & Tax Document
                </span>
                <span className="text-[11px] text-white/50 block mt-0.5">
                  Registered Faith-Based Global Missions Network
                </span>
              </div>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-6 rounded-2xl bg-white/[0.05] border border-white/10 space-y-4 mb-6 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
                <img src={brandLogo} alt="" className="w-40 h-40 object-contain" />
              </div>

              <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-10">
                <div>
                  <span className="text-[10px] uppercase text-white/50 block font-semibold">Total Seed Gift</span>
                  <span className="font-brand text-2xl font-bold text-emerald-400">
                    {selectedDonation.currency || "USD"} ${selectedDonation.amount.toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-white/50 block font-semibold">Status</span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold inline-block mt-0.5">
                    ✓ Verified Official Record
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs relative z-10">
                <div>
                  <span className="text-[10px] uppercase text-white/50 block font-semibold">Donor / Partner</span>
                  <span className="font-bold text-white">{selectedDonation.donor_name || user?.name || "Kingdom Covenant Partner"}</span>
                  <span className="text-white/60 block text-[11px]">{selectedDonation.donor_email || email}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-white/50 block font-semibold">Receipt Number</span>
                  <span className="font-mono font-bold text-[#fbf5b7]">
                    KMN-REC-{selectedDonation.id}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-white/50 block font-semibold">Contribution Type</span>
                  <span className="text-white/80">{selectedDonation.recurring ? "Monthly Recurring Covenant Seed" : "One-Time Kingdom Offering"}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-white/50 block font-semibold">Contribution Date</span>
                  <span className="text-white/80">
                    {new Date(selectedDonation.created_at).toLocaleDateString("en-US", { dateStyle: "long" })}
                  </span>
                </div>
                <div className="col-span-2 pt-2 border-t border-white/10">
                  <span className="text-[10px] uppercase text-white/50 block font-semibold">Spiritual Oversight</span>
                  <span className="text-white/80">Bishop Dr. George Githinji — Presiding Prelate</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:brightness-110 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Print Official Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedDonation(null)}
                className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
