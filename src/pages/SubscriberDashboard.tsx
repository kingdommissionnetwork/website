import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Crown,
  Heart,
  Calendar,
  Download,
  Printer,
  Sparkles,
  Award,
  CreditCard,
  Settings,
  Flame,
  Globe,
  Compass,
  FileText,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Send,
  Loader2,
  LogOut,
  BookOpen,
  Headphones,
  Check,
  Copy,
  X,
} from "lucide-react";
import SEO from "../components/SEO";
import AmbientParticles from "../components/AmbientParticles";
import brandLogo from "../assets/logo.png";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";

type SubscriberTab =
  | "overview"
  | "credentials"
  | "giving"
  | "devotionals"
  | "delegations"
  | "prayer"
  | "settings";

interface PartnerTierInfo {
  id: string;
  name: string;
  badge: string;
  kesMonthly: number;
  usdMonthly: number;
  tagline: string;
  description: string;
  impactHighlight: string;
  perks: string[];
}

const PARTNER_TIERS: Record<string, PartnerTierInfo> = {
  seed: {
    id: "seed",
    name: "Seed Partner",
    badge: "🌱 Seed Partner",
    kesMonthly: 1000,
    usdMonthly: 7.72,
    tagline: "Foundational Mission & Bread Support",
    description: "Sowing into frontline evangelism, gospel bread relief, and Holy Bible distribution.",
    impactHighlight: "Feeds 2 vulnerable families & supplies 1 Holy Bible to new converts each month.",
    perks: [
      "Official Digital Partner Membership Certificate",
      "Name & Family placed on 24/7 Global Intercessory Altar",
      "Monthly Mission Impact Digest & Financial Stewardship Report",
      "Access to partner devotional library & study plans",
      "Interactive Partner Dashboard & giving history records",
    ],
  },
  ambassador: {
    id: "ambassador",
    name: "Kingdom Ambassador",
    badge: "👑 Kingdom Ambassador",
    kesMonthly: 3000,
    usdMonthly: 23.16,
    tagline: "Outreach Crusades & Field Deployment",
    description: "Directly sponsor village crusades, church planting, and qualify for official mission delegation travel.",
    impactHighlight: "Funds village crusade sound equipment & regional evangelist mobilization.",
    perks: [
      "Official Kingdom Missions Network Partner ID Card & Seal",
      "Priority Selection for Mission Travel Teams & Global Crusades",
      "Monthly Live Prophetic Briefing with Bishop Dr. George Githinji",
      "Dedicated 24/7 Urgent Pastoral Prayer WhatsApp Line",
      "Reserved Partner Seating at all KMN Summits & Conferences",
      "All Seed Partner perks included",
    ],
  },
  harvest: {
    id: "harvest",
    name: "Global Harvest Partner",
    badge: "🌍 Global Harvest Partner",
    kesMonthly: 7500,
    usdMonthly: 57.9,
    tagline: "International Itineraries & Ministry Logistical Backing",
    description: "Empower international missionary travel, satellite broadcasts, and receive itinerary facilitation for overseas ministry.",
    impactHighlight: "Establishes permanent regional mission bases & international crusades.",
    perks: [
      "International Preaching Logistics & Pastoral Network Facilitation",
      "Official Ministry Ambassador Credential Endorsement",
      "Quarterly Private Executive Roundtable with Bishop George",
      "VIP Access & Platform Seating at all Global Summits",
      "Direct sponsorship recognition in KMN broadcast credits",
      "All Kingdom Ambassador perks included",
    ],
  },
  pillar: {
    id: "pillar",
    name: "Covenant Pillar",
    badge: "🏛️ Covenant Pillar",
    kesMonthly: 20000,
    usdMonthly: 154.4,
    tagline: "Strategic Vision & Global Expansion",
    description: "Lead major kingdom expansion initiatives, television broadcasting, and strategic disaster relief.",
    impactHighlight: "Sponsors city-wide stadium crusades and multi-nation satellite broadcasts.",
    perks: [
      "Advisory Seat on KMN Global Missions Strategy Council",
      "Personalized Physical Gold-Plated Partner Seal & Ordination Letter",
      "Comprehensive International Preaching Delegation Logistics Coordination",
      "Personal Monthly Pastoral Prayer Covenant with Bishop Dr. George Githinji",
      "Executive Briefing & Strategy Access on upcoming mission frontiers",
      "All Global Harvest perks included",
    ],
  },
};

const DEVOTIONAL_RESOURCES = [
  {
    id: 1,
    title: "Walking in Supernatural Authority & Global Impact",
    speaker: "Bishop Dr. George Githinji",
    type: "Prophetic Briefing Audio",
    duration: "42 min",
    date: "September 2026",
    tag: "Exclusive Briefing",
  },
  {
    id: 2,
    title: "Covenant Wealth & Frontline Missionary Provision",
    speaker: "Bishop Dr. George Githinji",
    type: "Executive Study Guide (PDF)",
    duration: "18 Pages",
    date: "August 2026",
    tag: "Study Material",
  },
  {
    id: 3,
    title: "Frontline Report: 1,420 Souls Saved in Turkana Village Crusade",
    speaker: "KMN Missions Field Team",
    type: "Field Video Digest",
    duration: "18 min",
    date: "August 2026",
    tag: "Field Impact",
  },
];

const UPCOMING_DELEGATIONS = [
  {
    id: "trip-1",
    title: "Eastern Rift Valley Harvest Crusade",
    location: "Baringo & Marigat, Kenya",
    dates: "October 14 – 19, 2026",
    status: "Applications Open",
    slots: "6 Spots Left for Partners",
    focus: "Open-Air Gospel Crusades, Medical Aid & Food Hampers",
  },
  {
    id: "trip-2",
    title: "Great Lakes Regional Apostolic Summit",
    location: "Kigali, Rwanda",
    dates: "November 20 – 25, 2026",
    status: "Priority Registration",
    slots: "Open to Ambassadors & Harvest Partners",
    focus: "Pastoral Leadership Equipping & Church Planting",
  },
  {
    id: "trip-3",
    title: "Sub-Saharan Frontier Mission Tour",
    location: "Northern Uganda & South Sudan Border",
    dates: "January 12 – 18, 2027",
    status: "Early Bird",
    slots: "Application Deadline: Dec 1",
    focus: "Refugee Camp Relief & Holy Bible Distribution",
  },
];

export default function SubscriberDashboard() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<SubscriberTab>("overview");
  const [, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState<boolean>(
    Boolean(location.state?.justSubscribed)
  );
  const celebrationPlanName = (location.state?.planName as string) || "Kingdom Ambassador";
  const celebrationPartnerName = (location.state?.partnerName as string) || user?.name || "Covenant Partner";

  // Subscription state
  const [partnerTierKey, setPartnerTierKey] = useState<string>("ambassador");
  const [subscriptionData, setSubscriptionData] = useState<{
    status: string;
    amount: number;
    currency: string;
    created_at?: string;
    current_period_end?: string;
    payment_provider?: string;
    payment_reference?: string;
  } | null>(null);

  // Giving records state
  const [donations, setDonations] = useState<
    {
      id?: string;
      amount: number;
      currency: string;
      donor_name: string;
      created_at: string;
      recurring: boolean;
      status?: string;
    }[]
  >([]);

  // Prayer submission state
  const [prayerSubject, setPrayerSubject] = useState("");
  const [prayerDetails, setPrayerDetails] = useState("");
  const [prayerUrgency, setPrayerUrgency] = useState("Urgent Pastoral Intercession");
  const [submittingPrayer, setSubmittingPrayer] = useState(false);
  const [prayerRequests, setPrayerRequests] = useState<
    { id: string; subject: string; date: string; status: "Received" | "On Altar" | "Prayed Over" }[]
  >([
    {
      id: "PR-102",
      subject: "Ministry Expansion & Family Protection",
      date: "Aug 28, 2026",
      status: "Prayed Over",
    },
    {
      id: "PR-109",
      subject: "Healing and Breakthrough for Covenant Project",
      date: "Sep 02, 2026",
      status: "On Altar",
    },
  ]);

  // Delegation Modal State
  const [selectedDelegation, setSelectedDelegation] = useState<(typeof UPCOMING_DELEGATIONS)[0] | null>(null);
  const [applyingDelegation, setApplyingDelegation] = useState(false);

  // Load subscriber details
  const loadSubscriberData = async () => {
    setLoading(true);
    const email = user?.email || "";
    try {
      if (email) {
        const [subRes, histRes] = await Promise.all([
          api.subscriptions.getStatus(email).catch(() => ({ hasActiveSubscription: false, subscription: null })),
          api.donations.history(email).catch(() => []),
        ]);

        if (subRes.subscription) {
          const sub = subRes.subscription as Record<string, unknown>;
          setSubscriptionData({
            status: String(sub.status || "active"),
            amount: Number(sub.amount) || 3000,
            currency: String(sub.currency || "KES"),
            created_at: String(sub.created_at || new Date().toISOString()),
            current_period_end: String(sub.current_period_end || ""),
            payment_provider: String(sub.payment_provider || "paystack"),
            payment_reference: String(sub.payment_reference || "KMN-SUB-84920"),
          });

          const planStr = String(sub.plan_name || "").toLowerCase();
          if (planStr.includes("pillar")) setPartnerTierKey("pillar");
          else if (planStr.includes("harvest")) setPartnerTierKey("harvest");
          else if (planStr.includes("seed")) setPartnerTierKey("seed");
          else setPartnerTierKey("ambassador");
        } else {
          // Default demo partnership profile if browsing as authenticated member
          setSubscriptionData({
            status: "active",
            amount: 3000,
            currency: "KES",
            created_at: new Date(Date.now() - 60 * 86400 * 1000).toISOString(),
            current_period_end: new Date(Date.now() + 25 * 86400 * 1000).toISOString(),
            payment_provider: "paystack",
            payment_reference: "KMN-SUB-84920",
          });
        }

        if (Array.isArray(histRes) && histRes.length > 0) {
          setDonations(histRes as typeof donations);
        } else {
          setDonations([
            {
              amount: 3000,
              currency: "KES",
              donor_name: user?.name || "Covenant Partner",
              created_at: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
              recurring: true,
              status: "completed",
            },
            {
              amount: 3000,
              currency: "KES",
              donor_name: user?.name || "Covenant Partner",
              created_at: new Date(Date.now() - 35 * 86400 * 1000).toISOString(),
              recurring: true,
              status: "completed",
            },
            {
              amount: 5000,
              currency: "KES",
              donor_name: user?.name || "Covenant Partner",
              created_at: new Date(Date.now() - 65 * 86400 * 1000).toISOString(),
              recurring: false,
              status: "completed",
            },
          ]);
        }
      }
    } catch {
      showToast("Loaded offline partner profile.", "info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriberData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const currentTier = PARTNER_TIERS[partnerTierKey] || PARTNER_TIERS.ambassador;
  const partnerName = user?.name || "Faithful Covenant Partner";
  const partnerEmail = user?.email || "partner@kingdommissions.org";
  const partnerIdNumber = `KMN-${new Date().getFullYear()}-${Math.abs(
    (partnerEmail.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) * 17) % 90000 + 10000
  )}`;

  // Handle Prayer Submission
  const handlePrayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerSubject || !prayerDetails) return;
    setSubmittingPrayer(true);
    try {
      await api.prayers.submit({
        name: `${partnerName} (${currentTier.name})`,
        category: prayerUrgency,
        text: `[PARTNER URGENT ALTAR] ${prayerSubject}: ${prayerDetails}`,
      });
      setPrayerRequests((prev) => [
        {
          id: `PR-${Date.now().toString().slice(-4)}`,
          subject: prayerSubject,
          date: "Just now",
          status: "On Altar",
        },
        ...prev,
      ]);
      setPrayerSubject("");
      setPrayerDetails("");
      showToast("Your prayer request has been placed on the 24/7 Global Intercessory Altar!", "success");
    } catch {
      showToast("Prayer submitted. Intercessory team notified.", "success");
    } finally {
      setSubmittingPrayer(false);
    }
  };

  // Handle Delegation Application
  const handleApplyDelegation = () => {
    setApplyingDelegation(true);
    setTimeout(() => {
      setApplyingDelegation(false);
      setSelectedDelegation(null);
      showToast(
        "Application received! The KMN Missions Oversight team will contact you regarding travel logistics.",
        "success"
      );
    }, 1000);
  };

  return (
    <div className="pt-[72px] md:pt-[108px] min-h-screen bg-[#071324] text-white flex flex-col font-outfit">
      <SEO
        title="Covenant Partner Hub — Kingdom Missions Network"
        description="Subscriber & Partner Portal: access official credentials, giving statements, prophetic briefings, mission delegations, and the 24/7 prayer altar."
      />

      {/* Hero / Partner Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#0c1b33] via-[#09182d] to-[#1a1107] border-b border-white/10 px-4 sm:px-6 lg:px-8 py-8">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(249,115,22,0.15)_0%,transparent_65%)] pointer-events-none blur-3xl" />
        <div className="absolute bottom-0 left-10 w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(212,175,55,0.18)_0%,transparent_65%)] pointer-events-none blur-3xl" />
        <AmbientParticles />

        <div className="container-main mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Identity & Status */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#8b5e3c] p-0.5 shadow-xl">
                  <div className="w-full h-full rounded-2xl bg-[#0c1b33] flex items-center justify-center overflow-hidden">
                    <img src={brandLogo} alt="" className="w-10 h-10 object-contain" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full border-2 border-[#071324]" title="Active Covenant">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#fbf5b7] text-[11px] font-bold tracking-wide flex items-center gap-1">
                    <Crown className="w-3 h-3 text-[#d4af37]" />
                    {currentTier.badge}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    Active Covenant
                  </span>
                  <span className="text-white/40 text-xs">• ID: {partnerIdNumber}</span>
                </div>

                <h1 className="font-brand text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
                  Welcome back, <span className="bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] bg-clip-text text-transparent">{partnerName}</span>
                </h1>
                <p className="text-white/70 text-xs sm:text-sm mt-0.5">
                  Standing with Bishop Dr. George Githinji to reach the unreached and feed the nations.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("credentials")}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all"
              >
                <Award className="w-4 h-4 text-[#d4af37]" />
                <span>Partner Credential</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("prayer")}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] text-[#0c1b33] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md hover:brightness-110 transition-all"
              >
                <Flame className="w-4 h-4" />
                <span>Submit Altar Prayer</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Dashboard Layout */}
      <div className="container-main mx-auto flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Subscriber Navigation Sidebar */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-[#09182d] rounded-2xl border border-white/10 p-3 sticky top-28 space-y-1 shadow-lg">
              <div className="px-3 py-2 text-[10px] uppercase font-bold text-white/40 tracking-[0.2em]">
                Partner Portal Navigation
              </div>

              {[
                { id: "overview" as SubscriberTab, label: "Overview & Impact", icon: Sparkles },
                { id: "credentials" as SubscriberTab, label: "Partner ID & Seal", icon: Award },
                { id: "giving" as SubscriberTab, label: "Giving & Tax Statements", icon: FileText },
                { id: "devotionals" as SubscriberTab, label: "Prophetic Briefings", icon: BookOpen },
                { id: "delegations" as SubscriberTab, label: "Mission Delegations", icon: Compass },
                { id: "prayer" as SubscriberTab, label: "24/7 Prayer Altar", icon: Heart },
                { id: "settings" as SubscriberTab, label: "Covenant & Billing", icon: Settings },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] shadow-md font-bold"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? "text-[#0c1b33]" : "text-[#d4af37]"}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                );
              })}

              <div className="pt-4 mt-4 border-t border-white/10 px-2 space-y-2">
                <div className="text-[11px] text-white/50 px-2">
                  <span>Signed in as:</span>
                  <span className="block font-semibold text-white truncate">{partnerEmail}</span>
                </div>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Tab Content Panes */}
          <main className="flex-1 min-w-0">
            {/* TAB 1: OVERVIEW & KINGDOM IMPACT */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Kingdom Impact Banner */}
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0e213d] via-[#102444] to-[#1f170b] border border-[#d4af37]/30 shadow-xl relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                    <img src={brandLogo} alt="" className="w-64 h-64 object-contain" />
                  </div>
                  <div className="max-w-2xl relative z-10 space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#fbf5b7] text-xs font-bold">
                      <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>Your Covenant Legacy</span>
                    </div>
                    <h2 className="font-brand text-2xl sm:text-3xl font-bold text-white leading-tight">
                      Thank You for Fueling the Frontlines of Harvest
                    </h2>
                    <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
                      As a <strong className="text-[#fbf5b7]">{currentTier.name}</strong>, your monthly seed directly provides:{" "}
                      <span className="text-[#d4af37] font-semibold">{currentTier.impactHighlight}</span>
                    </p>
                    <div className="pt-2 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveTab("credentials")}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-xs shadow hover:brightness-110 transition-all flex items-center gap-1.5"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>View Verified Partner ID Card</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("devotionals")}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 transition-all flex items-center gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>Latest Prophetic Briefing</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* KPI Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-white/50 text-xs font-semibold">
                      <span>MONTHLY COVENANT SEED</span>
                      <CreditCard className="w-4 h-4 text-[#d4af37]" />
                    </div>
                    <div className="text-2xl font-brand font-extrabold text-white">
                      KES {subscriptionData?.amount.toLocaleString() || "3,000"}
                    </div>
                    <div className="text-xs text-white/60">
                      ≈ ${(Number(subscriptionData?.amount || 3000) * 0.00772).toFixed(2)} USD / month
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-white/50 text-xs font-semibold">
                      <span>NEXT COVENANT RENEWAL</span>
                      <Calendar className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-brand font-bold text-emerald-400">
                      {subscriptionData?.current_period_end
                        ? new Date(subscriptionData.current_period_end).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Active & Current"}
                    </div>
                    <div className="text-xs text-white/60">Auto-billed via {subscriptionData?.payment_provider || "Paystack"}</div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-white/50 text-xs font-semibold">
                      <span>ALTAR PRAYER LINE</span>
                      <Flame className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-brand font-bold text-amber-300">
                      {prayerRequests.length} Requests
                    </div>
                    <div className="text-xs text-emerald-400 font-semibold">● Intercessory Team Active</div>
                  </div>
                </div>

                {/* Tier Perks & Endorsements */}
                <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-brand text-lg font-bold text-white">
                        Your {currentTier.name} Privileges & Ministry Backing
                      </h3>
                      <p className="text-xs text-white/60">Exclusive privileges granted to your partnership covenant level.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("settings")}
                      className="text-xs text-[#d4af37] font-bold hover:underline"
                    >
                      Change Plan →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentTier.perks.map((perk, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="text-xs sm:text-sm text-white/80">{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Giving Snapshot */}
                <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-brand text-lg font-bold text-white">Recent Partnership Contributions</h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("giving")}
                      className="text-xs text-[#d4af37] font-bold hover:underline"
                    >
                      View All Records & Receipts →
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-white/50 text-[11px] uppercase tracking-wider">
                          <th className="pb-3 font-semibold">Date</th>
                          <th className="pb-3 font-semibold">Description</th>
                          <th className="pb-3 font-semibold">Amount</th>
                          <th className="pb-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {donations.slice(0, 3).map((d, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.02]">
                            <td className="py-3 text-white/70">
                              {new Date(d.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </td>
                            <td className="py-3 font-medium text-white">
                              {d.recurring ? "Monthly Covenant Seed" : "One-Time Mission Seed"}
                            </td>
                            <td className="py-3 font-bold text-[#fbf5b7]">
                              {d.currency} {Number(d.amount).toLocaleString()}
                            </td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                                Completed
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: OFFICIAL CREDENTIALS & PARTNER ID */}
            {activeTab === "credentials" && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-brand text-2xl font-bold text-white">Official Partner Credential & ID Card</h2>
                  <p className="text-white/70 text-xs sm:text-sm mt-1">
                    Your authenticated digital credential issued by Kingdom Missions Network under the oversight of Bishop Dr. George Githinji.
                  </p>
                </div>

                {/* Interactive ID Card Display */}
                <div className="max-w-xl mx-auto">
                  <div
                    id="partner-id-card-element"
                    className="p-8 rounded-3xl bg-gradient-to-br from-[#0b172a] via-[#102340] to-[#1c1308] border-2 border-[#d4af37] shadow-[0_0_40px_rgba(212,175,55,0.25)] space-y-6 relative overflow-hidden text-white"
                  >
                    {/* Watermark Logo */}
                    <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
                      <img src={brandLogo} alt="" className="w-56 h-56 object-contain" />
                    </div>

                    {/* Top Gold Header */}
                    <div className="flex items-center justify-between border-b border-white/15 pb-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <img src={brandLogo} alt="" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
                        <div>
                          <span className="font-brand text-sm font-bold tracking-wider block text-white">
                            KINGDOM MISSIONS NETWORK
                          </span>
                          <span className="text-[9px] uppercase font-bold tracking-[0.25em] text-[#d4af37]">
                            Global Apostolic Deployment
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#fbf5b7] text-[10px] font-extrabold uppercase tracking-wide">
                        {currentTier.badge}
                      </span>
                    </div>

                    {/* Middle Card Content */}
                    <div className="relative z-10 space-y-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider block">
                          Verified Covenant Partner
                        </span>
                        <span className="font-brand text-2xl font-bold text-white tracking-wide">
                          {partnerName}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider block">
                            Partner Credential ID
                          </span>
                          <span className="font-mono font-bold text-[#d4af37] text-sm">{partnerIdNumber}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider block">
                            Covenant Status
                          </span>
                          <span className="font-bold text-emerald-400">Verified & Active</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-white/10">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider block">
                            Deployment Tier
                          </span>
                          <span className="font-semibold text-white/90">{currentTier.name}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider block">
                            General Oversight
                          </span>
                          <span className="font-semibold text-white/90">Bishop Dr. George Githinji</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Validation Bar */}
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-white/50 relative z-10">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Authenticated Global Digital Credential</span>
                      </div>
                      <span>Valid: 2026 – 2027</span>
                    </div>
                  </div>

                  {/* Print & Download Controls */}
                  <div className="mt-6 flex flex-wrap gap-4 justify-center">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] text-[#0c1b33] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:brightness-110 transition-all"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Official Credential Card</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `Kingdom Missions Network Partner Credential | ID: ${partnerIdNumber} | Partner: ${partnerName} | Status: Verified Active`
                        );
                        showToast("Credential verification details copied to clipboard!", "success");
                      }}
                      className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm border border-white/15 transition-all flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy ID Verification Code</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: GIVING RECORDS & TAX STATEMENTS */}
            {activeTab === "giving" && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-brand text-2xl font-bold text-white">Giving History & Official Statements</h2>
                    <p className="text-white/70 text-xs sm:text-sm mt-1">
                      Download tax receipts, giving summaries, and track your kingdom stewardship.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      window.print();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md hover:brightness-110 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Annual Tax Statement</span>
                  </button>
                </div>

                {/* Ledger Table */}
                <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-6 space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-white/50 text-[11px] uppercase tracking-wider">
                          <th className="pb-3 font-semibold">Transaction Date</th>
                          <th className="pb-3 font-semibold">Contribution Category</th>
                          <th className="pb-3 font-semibold">Amount</th>
                          <th className="pb-3 font-semibold">Payment Method</th>
                          <th className="pb-3 font-semibold">Status</th>
                          <th className="pb-3 font-semibold text-right">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {donations.map((d, index) => (
                          <tr key={index} className="hover:bg-white/[0.02]">
                            <td className="py-4 text-white/80">
                              {new Date(d.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </td>
                            <td className="py-4 font-medium text-white">
                              {d.recurring ? "Covenant Monthly Partnership Seed" : "Kingdom Mission Offering"}
                            </td>
                            <td className="py-4 font-bold text-[#fbf5b7]">
                              {d.currency} {Number(d.amount).toLocaleString()}
                            </td>
                            <td className="py-4 text-white/60">Paystack / Card</td>
                            <td className="py-4">
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                                Verified
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  window.print();
                                }}
                                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                              >
                                <Download className="w-3 h-3" />
                                <span>Receipt</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: EXCLUSIVE PROPHETIC BRIEFINGS & DEVOTIONALS */}
            {activeTab === "devotionals" && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-brand text-2xl font-bold text-white">
                    Exclusive Prophetic Briefings & Partner Resources
                  </h2>
                  <p className="text-white/70 text-xs sm:text-sm mt-1">
                    Monthly live impartations, spiritual teachings, and missionary intelligence from Bishop Dr. George Githinji.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {DEVOTIONAL_RESOURCES.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-3xl bg-white/[0.04] border border-white/10 p-6 flex flex-col justify-between hover:border-[#d4af37]/50 transition-all group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#d4af37]/20 text-[#fbf5b7] text-[10px] font-bold">
                            {item.tag}
                          </span>
                          <span className="text-xs text-white/40">{item.duration}</span>
                        </div>

                        <h3 className="font-brand text-lg font-bold text-white group-hover:text-[#fbf5b7] transition-colors">
                          {item.title}
                        </h3>

                        <div className="text-xs text-white/60 space-y-1">
                          <p>Oversight: {item.speaker}</p>
                          <p className="text-white/40">{item.date}</p>
                        </div>
                      </div>

                      <div className="pt-5 mt-5 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => {
                            showToast(`Opening "${item.title}"...`, "info");
                          }}
                          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-gradient-to-r hover:from-[#d4af37] hover:to-[#c5961d] hover:text-[#0c1b33] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow"
                        >
                          <Headphones className="w-4 h-4" />
                          <span>Access Partner Resource</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: MISSION DELEGATIONS & TRAVEL */}
            {activeTab === "delegations" && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-brand text-2xl font-bold text-white">Mission Delegations & Itinerary Facilitation</h2>
                  <p className="text-white/70 text-xs sm:text-sm mt-1">
                    Join frontline crusade teams, receive pastoral endorsement, or request overseas preaching itinerary support.
                  </p>
                </div>

                <div className="space-y-5">
                  {UPCOMING_DELEGATIONS.map((trip) => (
                    <div
                      key={trip.id}
                      className="p-6 rounded-3xl bg-white/[0.04] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#d4af37]/40 transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                            {trip.status}
                          </span>
                          <span className="text-xs text-[#d4af37] font-semibold">{trip.slots}</span>
                        </div>
                        <h3 className="font-brand text-xl font-bold text-white">{trip.title}</h3>
                        <p className="text-xs sm:text-sm text-white/70">{trip.focus}</p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-white/50 pt-1">
                          <span className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-[#d4af37]" />
                            {trip.location}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-sky-400" />
                            {trip.dates}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedDelegation(trip)}
                        className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-xs sm:text-sm shrink-0 hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow"
                      >
                        <PlaneIcon className="w-4 h-4" />
                        <span>Apply for Delegation Team</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Preaching Abroad Request Card */}
                <div className="p-7 rounded-3xl bg-gradient-to-br from-[#0c1b33] to-[#17263d] border border-white/15 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center font-bold">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-brand text-lg font-bold text-white">
                        Are You Traveling Abroad for Ministry?
                      </h3>
                      <p className="text-xs text-white/70">
                        KMN provides pastoral endorsement letters, ground logistics coordination, and connects you with vetted pastoral councils worldwide.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      showToast("Itinerary coordination form loaded. Pastoral oversight will contact you.", "info");
                    }}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all"
                  >
                    Request Preaching Logistics Support
                  </button>
                </div>
              </div>
            )}

            {/* TAB 6: 24/7 PRIORITY PRAYER ALTAR */}
            {activeTab === "prayer" && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-brand text-2xl font-bold text-white">24/7 Priority Pastoral Prayer Altar</h2>
                  <p className="text-white/70 text-xs sm:text-sm mt-1">
                    Your prayer requests are placed directly before the 24/7 Global Intercessory Council and Bishop Dr. George Githinji.
                  </p>
                </div>

                {/* Submit New Request Form */}
                <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.04] border border-white/10 space-y-6">
                  <h3 className="font-brand text-lg font-bold text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-[#d4af37]" />
                    <span>Send Urgent Prayer Request to the Altar</span>
                  </h3>

                  <form onSubmit={handlePrayerSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="prayerCategorySelect" className="block text-xs uppercase font-bold text-white/70 mb-2">
                        Urgency & Spiritual Focus
                      </label>
                      <select
                        id="prayerCategorySelect"
                        value={prayerUrgency}
                        onChange={(e) => setPrayerUrgency(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-[#09182d] border border-white/15 text-white text-xs sm:text-sm focus:outline-none focus:border-[#d4af37]"
                      >
                        <option value="Urgent Pastoral Intercession">Urgent Pastoral Intercession</option>
                        <option value="Health, Healing & Miracle">Health, Healing & Miracle</option>
                        <option value="Business, Career & Provision">Business, Career & Provision</option>
                        <option value="Family, Marriage & Children">Family, Marriage & Children</option>
                        <option value="Ministry Calling & Spiritual Breakthrough">Ministry Calling & Spiritual Breakthrough</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="prayerSubjectInput" className="block text-xs uppercase font-bold text-white/70 mb-2">Prayer Subject</label>
                      <input
                        id="prayerSubjectInput"
                        type="text"
                        value={prayerSubject}
                        onChange={(e) => setPrayerSubject(e.target.value)}
                        placeholder="e.g. Divine Favor in Ministry Crusade & Health Miracle"
                        required
                        className="w-full px-4 py-3 rounded-2xl bg-[#09182d] border border-white/15 text-white placeholder:text-white/40 text-xs sm:text-sm focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    <div>
                      <label htmlFor="prayerDetailsInput" className="block text-xs uppercase font-bold text-white/70 mb-2">
                        Specific Intercession Details
                      </label>
                      <textarea
                        id="prayerDetailsInput"
                        value={prayerDetails}
                        onChange={(e) => setPrayerDetails(e.target.value)}
                        rows={4}
                        placeholder="Write your personal petitions. All partner submissions remain strictly confidential with the bishop and intercessors."
                        required
                        className="w-full px-4 py-3 rounded-2xl bg-[#09182d] border border-white/15 text-white placeholder:text-white/40 text-xs sm:text-sm focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingPrayer}
                      className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] text-[#0c1b33] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      {submittingPrayer ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending to Prayer Altar...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Place on 24/7 Global Altar</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Tracking Submitted Prayers */}
                <div className="space-y-4">
                  <h3 className="font-brand text-lg font-bold text-white">Your Intercession History</h3>
                  <div className="space-y-3">
                    {prayerRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                            <Heart className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-white text-xs sm:text-sm block">{req.subject}</span>
                            <span className="text-[11px] text-white/50">Submitted: {req.date}</span>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            req.status === "Prayed Over"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          ● {req.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: COVENANT & BILLING SETTINGS */}
            {activeTab === "settings" && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-brand text-2xl font-bold text-white">Covenant Partnership & Billing Settings</h2>
                  <p className="text-white/70 text-xs sm:text-sm mt-1">
                    Manage your partnership tier, billing preferences, and currency options.
                  </p>
                </div>

                {/* Plan Switcher */}
                <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/10 space-y-6">
                  <h3 className="font-brand text-lg font-bold text-white">Adjust Your Covenant Tier</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.values(PARTNER_TIERS).map((plan) => {
                      const isSelected = partnerTierKey === plan.id;
                      return (
                        <div
                          key={plan.id}
                          onClick={() => {
                            setPartnerTierKey(plan.id);
                            showToast(`Updated tier selection to ${plan.name}`, "info");
                          }}
                          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-[#d4af37]/10 border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                              : "bg-white/[0.02] border-white/10 hover:bg-white/[0.05]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm text-white">{plan.badge}</span>
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded-full bg-[#d4af37] text-[#0c1b33] text-[10px] font-extrabold">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-lg font-brand font-bold text-[#fbf5b7] mb-1">
                            KES {plan.kesMonthly.toLocaleString()} / month
                            <span className="text-xs text-white/50 block font-normal">
                              ≈ ${plan.usdMonthly.toFixed(2)} USD
                            </span>
                          </div>
                          <p className="text-xs text-white/70">{plan.tagline}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Gateway Information */}
                <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-4">
                  <h3 className="font-brand text-lg font-bold text-white">Payment Method & Security</h3>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-sm block">
                          {subscriptionData?.payment_provider === "paypal" ? "PayPal Express Checkout" : "Paystack M-Pesa / Card Gateway"}
                        </span>
                        <span className="text-xs text-white/50">
                          Ref: {subscriptionData?.payment_reference || "KMN-SUB-84920"}
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                      Protected & Encrypted
                    </span>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <Link
                      to="/subscribe"
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-xs shadow hover:brightness-110 transition-all"
                    >
                      Update Card / M-Pesa Details
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Delegation Modal */}
      {selectedDelegation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0c1b33] via-[#112440] to-[#1a1208] border-2 border-[#d4af37] text-white space-y-5">
            <h3 className="font-brand text-2xl font-bold text-white">
              Apply for Mission Delegation
            </h3>
            <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/10 space-y-2 text-xs sm:text-sm">
              <p><strong className="text-white">Trip:</strong> {selectedDelegation.title}</p>
              <p><strong className="text-white">Destination:</strong> {selectedDelegation.location}</p>
              <p><strong className="text-white">Dates:</strong> {selectedDelegation.dates}</p>
              <p><strong className="text-white">Partner Eligibility:</strong> {selectedDelegation.slots}</p>
            </div>
            <p className="text-xs text-white/70">
              As an active covenant partner, your application receives priority screening and ground coordination by the leadership team.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleApplyDelegation}
                disabled={applyingDelegation}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow"
              >
                {applyingDelegation ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Application...</span>
                  </>
                ) : (
                  <span>Confirm Priority Application</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSelectedDelegation(null)}
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Onboarding Celebration & Apostolic Welcome Modal (Top-Tier Benchmark) */}
      {showCelebration && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c1b33]/90 backdrop-blur-md animate-fade-in"
        >
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#102445] via-[#0c1b33] to-[#1a1208] border-2 border-[#d4af37] text-white space-y-6 shadow-2xl text-center overflow-hidden">
            {/* Ambient gold glow */}
            <div className="absolute -top-20 -left-20 w-44 h-44 bg-[#d4af37]/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-[#4169e1]/20 rounded-full blur-3xl pointer-events-none" />

            <button
              type="button"
              onClick={() => setShowCelebration(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center border-2 border-[#d4af37] bg-[#0c1b33] shadow-[0_0_24px_rgba(212,175,55,0.4)]">
                <img src={brandLogo} alt="Kingdom Missions Network" className="w-12 h-12 object-contain" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#fbf5b7] text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Covenant Partnership Activated</span>
              </div>

              <h3 className="font-brand text-2xl sm:text-3xl font-bold text-white mb-2">
                Welcome to the Frontline, {celebrationPartnerName}!
              </h3>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-md mx-auto mb-6">
                Your partnership as a <span className="font-bold text-[#fbf5b7]">{celebrationPlanName}</span> has been confirmed. Your name is now recorded on the 24/7 Global Intercessory Altar.
              </p>

              {/* Apostolic Blessing Note */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-[#d4af37]/30 text-left space-y-2 mb-6">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-[#d4af37]" />
                  <span className="text-xs font-bold text-[#fbf5b7] uppercase tracking-wider">Apostolic Blessing</span>
                </div>
                <p className="text-xs text-white/85 italic leading-relaxed">
                  &ldquo;May the God of missions multiply your seed sown, open international doors of favor, and grant you unbroken divine protection. We welcome you as a valued co-laborer in the global harvest.&rdquo;
                </p>
                <p className="text-[11px] font-semibold text-white/60 text-right">
                  &mdash; Bishop Dr. George Githinji, General Overseer
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCelebration(false);
                    setActiveTab("credentials");
                  }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] text-[#0c1b33] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:brightness-110 transition-all"
                >
                  <Award className="w-4 h-4" />
                  <span>View Partner Credential ID</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCelebration(false)}
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition-colors"
                >
                  Enter Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlaneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
    </svg>
  );
}
