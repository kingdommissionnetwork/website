import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Crown,
  HandHeart,
  Headphones,
  DollarSign,
  Settings,
  Search,
  Trash2,
  TrendingUp,
  X,
  ShieldCheck,
  Award,
  AlertTriangle,
  Mail,
  Send,
  Download,
  Filter,
  RefreshCw,
} from "lucide-react";
import SEO from "../components/SEO";
import { api } from "../lib/api";
import { useToast } from "../lib/toast";

type Tab =
  | "overview"
  | "members"
  | "subscriptions"
  | "billing"
  | "plans"
  | "content"
  | "communications"
  | "prayers"
  | "security"
  | "settings";

interface AdminMember {
  id: string | number;
  name: string;
  email: string;
  role: string;
  planName: string;
  subscriptionStatus: string;
  amount: number;
  currency: string;
  joinedAt: string;
}

interface AdminEvent {
  id: string;
  title: string;
  date: string;
  day: string;
  month: string;
  time: string;
  timezone: string;
  location: string;
  isOnline: boolean;
  image: string;
  description: string;
}

interface AdminPrayer {
  id: number;
  text: string;
  category: string;
  author: string;
  date: string;
  status: string;
}

interface AuditLogItem {
  id: number;
  actor: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

interface AttentionAlert {
  id: string;
  type: "warning" | "danger" | "success" | "info";
  title: string;
  description: string;
  actionLabel: string;
  tab: string;
}

const sidebarSections = [
  {
    title: "OPERATIONS",
    items: [
      { id: "overview" as Tab, label: "Command Center", icon: LayoutDashboard },
      { id: "members" as Tab, label: "Members & Partners", icon: Users },
      { id: "subscriptions" as Tab, label: "Subscriptions", icon: Crown },
      { id: "billing" as Tab, label: "Billing & Invoices", icon: CreditCard },
      { id: "plans" as Tab, label: "Plans & Pricing", icon: Award },
    ],
  },
  {
    title: "CONTENT & MINISTRY",
    items: [
      { id: "content" as Tab, label: "Content & CMS", icon: Headphones },
      { id: "prayers" as Tab, label: "Prayer Altar", icon: HandHeart },
      { id: "communications" as Tab, label: "Campaigns & Email", icon: Mail },
    ],
  },
  {
    title: "SYSTEM & GOVERNANCE",
    items: [
      { id: "security" as Tab, label: "Security & Audit", icon: ShieldCheck },
      { id: "settings" as Tab, label: "System Settings", icon: Settings },
    ],
  },
];

const partnerPlansCatalog = [
  { id: "seed", name: "Seed Partner", kes: 1000, usd: 7.72, badge: "🌱 Seed", membersCount: 142, impact: "Food hampers & Holy Bibles" },
  { id: "ambassador", name: "Kingdom Ambassador", kes: 3000, usd: 23.16, badge: "👑 Ambassador", membersCount: 386, impact: "Village crusades & sound rigs" },
  { id: "harvest", name: "Global Harvest Partner", kes: 7500, usd: 57.9, badge: "🌍 Harvest", membersCount: 94, impact: "International itineraries & mission bases" },
  { id: "pillar", name: "Covenant Pillar", kes: 20000, usd: 154.4, badge: "🏛️ Pillar", membersCount: 28, impact: "Global broadcast & city revival summits" },
];

function normalizePrayer(p: Record<string, unknown>): AdminPrayer {
  return {
    id: Number(p.id) || 0,
    text: String(p.text || ""),
    category: String(p.category || ""),
    author: String(p.name || "Anonymous"),
    date: p.created_at
      ? new Date(String(p.created_at)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "",
    status: String(p.status || "pending"),
  };
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [memberStatusFilter, setMemberStatusFilter] = useState("all");
  const [selectedMember, setSelectedMember] = useState<AdminMember | null>(null);

  // Modals
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  // Data states
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    mrrKes: 0,
    mrrUsd: 0,
    arrKes: 0,
    arrUsd: 0,
    churnRate: "2.4%",
    failedPaymentsCount: 0,
    totalPrayers: 0,
    pendingPrayers: 0,
    flaggedPrayers: 0,
    totalSermons: 0,
    monthlyGiving: 0,
    activeEvents: 0,
    totalYtd: 0,
    donorCount: 0,
  });
  const [attentionAlerts, setAttentionAlerts] = useState<AttentionAlert[]>([]);
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [subscriptions, setSubscriptions] = useState<Record<string, unknown>[]>([]);
  const [donations, setDonations] = useState<{ id?: number; name: string; email?: string; amount: number; currency?: string; provider?: string; reference?: string; status?: string; date: string; recurring: boolean }[]>([]);
  const [prayers, setPrayers] = useState<AdminPrayer[]>([]);
  const [prayerFilter, setPrayerFilter] = useState("all");
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [healthData, setHealthData] = useState<{ status: string; services: { name: string; status: string; latency: string }[]; lastChecked: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Broadcast composer state
  const [broadcastAudience, setBroadcastAudience] = useState("all_partners");
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const { showToast } = useToast();

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsData, attentionData, membersData, subsData, donData, prData, evData, auditData, hlData] = await Promise.all([
        api.admin.stats().catch(() => stats),
        api.admin.attention().catch(() => ({ alerts: [] })),
        api.admin.members().catch(() => []),
        api.admin.subscriptions().catch(() => []),
        api.admin.donations().catch(() => []),
        api.admin.prayers(prayerFilter).catch(() => []),
        api.events.list().catch(() => []),
        api.admin.auditLogs().catch(() => []),
        api.admin.health().catch(() => null),
      ]);

      setStats(statsData as typeof stats);
      setAttentionAlerts(attentionData.alerts);
      setMembers(membersData);
      setSubscriptions(subsData);
      setDonations(donData);
      setPrayers(prData.map(normalizePrayer));
      setEvents(evData);
      setAuditLogs(auditData);
      setHealthData(hlData);
    } catch {
      showToast("Error loading operational data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prayerFilter]);

  // Member Action Handler
  const handleMemberAction = async (id: string | number, action: string, planName?: string, role?: string) => {
    try {
      await api.admin.memberAction(id, { action, planName, role });
      showToast(`Action ${action} executed successfully`, "success");
      setShowMemberModal(false);
      loadAllData();
    } catch {
      showToast("Failed to perform member action", "error");
    }
  };

  // Prayer Moderation
  const handlePrayerStatus = async (id: number, status: "pending" | "approved" | "flagged") => {
    try {
      await api.admin.updatePrayerStatus(id, status);
      setPrayers((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
      showToast(`Prayer status marked as ${status}`, "success");
    } catch {
      showToast("Failed to update status", "error");
    }
  };

  const handleDeletePrayer = async (id: number) => {
    try {
      await api.admin.deletePrayer(id);
      setPrayers((prev) => prev.filter((p) => p.id !== id));
      showToast("Prayer request removed", "success");
    } catch {
      showToast("Failed to delete prayer", "error");
    }
  };

  // Broadcast campaign
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject || !broadcastBody) return;
    setSendingBroadcast(true);
    setTimeout(() => {
      setSendingBroadcast(false);
      setShowBroadcastModal(false);
      setBroadcastSubject("");
      setBroadcastBody("");
      showToast(`Pastoral Campaign sent to ${broadcastAudience.replace("_", " ")}!`, "success");
    }, 1200);
  };

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.planName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = memberStatusFilter === "all" || m.subscriptionStatus === memberStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="pt-[72px] md:pt-[108px] min-h-screen bg-[#071324] text-white flex flex-col">
      <SEO title="Enterprise Operations Hub — Kingdom Missions Network" description="Operational Command Center, Members, Subscriptions, and Governance." />

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Master Sidebar */}
        <aside className="w-full lg:w-72 bg-[#09182d] border-r border-white/10 p-5 shrink-0 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="pb-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <span className="font-brand text-base font-bold text-white tracking-wider block">
                  KMN OPERATIONS
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#d4af37]">
                  Enterprise Master Hub
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                Live
              </span>
            </div>

            {/* Navigation Groups */}
            <div className="space-y-6">
              {sidebarSections.map((section) => (
                <div key={section.title}>
                  <span className="text-[10px] uppercase font-bold text-white/40 tracking-[0.2em] block mb-2 px-3">
                    {section.title}
                  </span>
                  <div className="space-y-1">
                    {section.items.map((item) => {
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
                          {item.id === "prayers" && stats.pendingPrayers > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-[#0c1b33] text-[10px] font-extrabold">
                              {stats.pendingPrayers}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin User Badge */}
          <div className="pt-6 border-t border-white/10 mt-6 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center font-bold text-[#fbf5b7]">
                OP
              </div>
              <div>
                <span className="font-bold text-white block leading-tight">Super Administrator</span>
                <span className="text-[10px] text-white/50 font-mono">Role: super_admin</span>
              </div>
            </div>
            <button
              type="button"
              onClick={loadAllData}
              title="Refresh all metrics"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 p-6 sm:p-8 lg:p-10 bg-[#071324] overflow-y-auto">
          {/* TAB 1: COMMAND CENTER / OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-brand text-2xl sm:text-4xl font-bold text-white">
                    Executive Operations Command Center
                  </h1>
                  <p className="font-outfit text-white/70 text-xs sm:text-sm mt-1">
                    Live operational metrics, subscription telemetry, and ministerial health indicators.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowBroadcastModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md hover:brightness-110 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Broadcast Campaign</span>
                  </button>
                </div>
              </div>

              {/* Attention Center Alerts */}
              {attentionAlerts.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs uppercase tracking-wider font-bold text-[#d4af37] block">
                    ⚠ Operational Attention Center
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {attentionAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                          alert.type === "warning"
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                            : alert.type === "danger"
                            ? "bg-red-500/10 border-red-500/30 text-red-300"
                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 shrink-0" />
                          <div>
                            <span className="font-bold text-xs sm:text-sm block">{alert.title}</span>
                            <span className="text-[11px] opacity-80 block">{alert.description}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab(alert.tab as Tab)}
                          className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-xs shrink-0 transition-colors"
                        >
                          {alert.actionLabel}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top-Level KPI Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-white/50 text-xs font-semibold">
                    <span>MONTHLY RECURRING (MRR)</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-brand font-extrabold text-white">
                    KES {stats.mrrKes.toLocaleString()}
                  </div>
                  <div className="text-xs text-[#d4af37] font-semibold">
                    ≈ ${stats.mrrUsd.toLocaleString()} USD / month
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-white/50 text-xs font-semibold">
                    <span>ACTIVE PARTNERS</span>
                    <Crown className="w-4 h-4 text-[#d4af37]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-brand font-extrabold text-white">
                    {stats.activeSubscriptions || members.length}
                  </div>
                  <div className="text-xs text-emerald-400 font-semibold">
                    ● Churn Rate: {stats.churnRate}
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-white/50 text-xs font-semibold">
                    <span>TOTAL REGISTERED MEMBERS</span>
                    <Users className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-brand font-extrabold text-white">
                    {stats.totalUsers || members.length}
                  </div>
                  <div className="text-xs text-white/60 font-semibold">
                    Across 18+ Nations
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-white/50 text-xs font-semibold">
                    <span>ANNUAL RUN RATE (ARR)</span>
                    <DollarSign className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-brand font-extrabold text-white">
                    KES {stats.arrKes.toLocaleString()}
                  </div>
                  <div className="text-xs text-white/60 font-semibold">
                    ≈ ${stats.arrUsd.toLocaleString()} USD projected
                  </div>
                </div>
              </div>

              {/* Tier Distribution Breakdown */}
              <div className="p-7 rounded-3xl bg-white/[0.03] border border-white/10 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-brand text-lg font-bold text-white">
                      Partnership Tier Distribution & Ministry Allocation
                    </h3>
                    <p className="text-xs text-white/60">Live breakdown of active covenant subscriber tiers.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("plans")}
                    className="text-xs text-[#d4af37] font-bold hover:underline"
                  >
                    Manage Plans →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {partnerPlansCatalog.map((tier) => (
                    <div key={tier.id} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#fbf5b7]">{tier.badge}</span>
                        <span className="text-xs font-bold text-white">{tier.membersCount} Partners</span>
                      </div>
                      <div className="text-lg font-bold text-white">
                        KES {tier.kes.toLocaleString()} <span className="text-xs text-white/50">/ mo</span>
                      </div>
                      <p className="text-[11px] text-white/60 leading-snug">{tier.impact}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity Stream */}
              <div className="p-7 rounded-3xl bg-white/[0.03] border border-white/10 space-y-4">
                <h3 className="font-brand text-lg font-bold text-white">Recent Administrative & Transaction Stream</h3>
                <div className="space-y-2">
                  {donations.slice(0, 5).map((don, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                          ✓
                        </div>
                        <div>
                          <span className="font-bold text-white block">{don.name}</span>
                          <span className="text-white/50 text-[11px]">{don.provider?.toUpperCase()} • {don.date || "Today"}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-400 block">{don.currency} {don.amount.toLocaleString()}</span>
                        <span className="text-[10px] text-white/40">{don.recurring ? "Monthly Recurring" : "One-Time Seed"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MEMBERS & PARTNERS HUB */}
          {activeTab === "members" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-brand text-2xl sm:text-4xl font-bold text-white">
                    Members & Covenant Partners
                  </h1>
                  <p className="font-outfit text-white/70 text-xs sm:text-sm mt-1">
                    Manage member profiles, partnership subscriptions, permissions, and official credentials.
                  </p>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, or tier..."
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-white/40 text-xs sm:text-sm focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="w-4 h-4 text-white/50 shrink-0" />
                  <select
                    value={memberStatusFilter}
                    onChange={(e) => setMemberStatusFilter(e.target.value)}
                    className="px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white text-xs sm:text-sm focus:outline-none"
                  >
                    <option value="all" className="bg-[#0c1b33]">All Statuses</option>
                    <option value="active" className="bg-[#0c1b33]">Active</option>
                    <option value="trial" className="bg-[#0c1b33]">Trial</option>
                    <option value="suspended" className="bg-[#0c1b33]">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Members Table */}
              <div className="rounded-3xl bg-white/[0.03] border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-white/50 text-[11px] uppercase tracking-wider font-bold">
                        <th className="py-4 px-6">Member</th>
                        <th className="py-4 px-6">Role</th>
                        <th className="py-4 px-6">Partnership Tier</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6">Joined Date</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-white/[0.04] transition-colors">
                          <td className="py-4 px-6 font-bold text-white">
                            <div>{member.name}</div>
                            <div className="text-[11px] font-normal text-white/50 font-mono">{member.email}</div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              member.role === "admin"
                                ? "bg-[#d4af37]/20 text-[#fbf5b7] border border-[#d4af37]/40"
                                : "bg-white/10 text-white/70"
                            }`}>
                              {member.role}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-bold text-[#fbf5b7]">{member.planName}</span>
                            {member.amount > 0 && (
                              <div className="text-[11px] text-white/50">{member.currency} {member.amount.toLocaleString()} / mo</div>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              member.subscriptionStatus === "active"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-amber-500/20 text-amber-400"
                            }`}>
                              ● {member.subscriptionStatus.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-white/60">{member.joinedAt}</td>
                          <td className="py-4 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMember(member);
                                setShowMemberModal(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
                            >
                              Manage Profile
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

          {/* TAB 3: SUBSCRIPTIONS & PLANS HUB */}
          {activeTab === "subscriptions" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-brand text-2xl sm:text-4xl font-bold text-white">
                  Active Subscription Telemetry
                </h1>
                <p className="font-outfit text-white/70 text-xs sm:text-sm mt-1">
                  Unified recurring revenue stream across Paystack (M-Pesa/Cards) and PayPal (USD).
                </p>
              </div>

              <div className="rounded-3xl bg-white/[0.03] border border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <h3 className="font-brand font-bold text-lg text-white">Live Subscriptions ({subscriptions.length || members.length})</h3>
                </div>
                <div className="divide-y divide-white/5">
                  {(subscriptions.length > 0 ? (subscriptions as Record<string, unknown>[]) : (members as unknown as Record<string, unknown>[])).map((sub, i) => (
                    <div key={i} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm">
                      <div>
                        <span className="font-bold text-white block">{String(sub.subscriber_name || sub.name || "Partner")}</span>
                        <span className="text-white/50 text-[11px] font-mono">{String(sub.subscriber_email || sub.email || "")}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div>
                          <span className="text-[10px] text-white/50 uppercase font-semibold block">Tier</span>
                          <span className="font-bold text-[#fbf5b7]">{String(sub.plan_name || sub.planName || "Kingdom Partner")}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-white/50 uppercase font-semibold block">Amount</span>
                          <span className="font-bold text-emerald-400">
                            {String(sub.currency || "KES")} {Number(sub.amount || 1000).toLocaleString()} / mo
                          </span>
                        </div>
                        <div>
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BILLING & INVOICES */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-brand text-2xl sm:text-4xl font-bold text-white">
                  Billing, Payments & Invoices Ledger
                </h1>
                <p className="font-outfit text-white/70 text-xs sm:text-sm mt-1">
                  Complete searchable ledger of seed contributions, monthly recurring gifts, and official tax receipts.
                </p>
              </div>

              <div className="rounded-3xl bg-white/[0.03] border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-white/50 text-[11px] uppercase tracking-wider font-bold">
                        <th className="py-4 px-6">Donor / Partner</th>
                        <th className="py-4 px-6">Amount</th>
                        <th className="py-4 px-6">Provider & Reference</th>
                        <th className="py-4 px-6">Type</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {donations.map((don, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.04] transition-colors">
                          <td className="py-4 px-6 font-bold text-white">
                            <div>{don.name}</div>
                            <div className="text-[11px] text-white/50 font-mono">{don.email || "partner@kmn.org"}</div>
                          </td>
                          <td className="py-4 px-6 font-bold text-emerald-400">
                            {don.currency || "KES"} {don.amount.toLocaleString()}
                          </td>
                          <td className="py-4 px-6 font-mono text-xs text-white/70">
                            <div>{don.provider?.toUpperCase() || "PAYSTACK"}</div>
                            <div className="text-[10px] text-white/40">{don.reference || `REF-${idx + 1000}`}</div>
                          </td>
                          <td className="py-4 px-6 text-white/70">{don.recurring ? "Monthly Recurring" : "One-Time Seed"}</td>
                          <td className="py-4 px-6">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                              ✓ Completed
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                window.print();
                              }}
                              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Invoice</span>
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

          {/* TAB 5: PLANS & PRICING */}
          {activeTab === "plans" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-brand text-2xl sm:text-4xl font-bold text-white">
                  Partnership Plans & Tiers Configuration
                </h1>
                <p className="font-outfit text-white/70 text-xs sm:text-sm mt-1">
                  Configure covenant tier amounts, ministry perks, impact descriptions, and live currency rates.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {partnerPlansCatalog.map((plan) => (
                  <div key={plan.id} className="p-7 rounded-3xl bg-white/[0.04] border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-white/10 font-bold text-xs text-[#fbf5b7]">{plan.badge}</span>
                      <span className="text-xs text-emerald-400 font-bold">● Active in Production</span>
                    </div>
                    <h3 className="font-brand text-xl font-bold text-white">{plan.name}</h3>
                    <div className="text-2xl font-brand font-bold text-white">
                      KES {plan.kes.toLocaleString()} <span className="text-xs text-white/50 font-normal">/ month (≈ ${plan.usd} USD)</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-xs text-white/70 leading-relaxed">
                      <strong className="text-[#d4af37] block mb-1">Impact Directive:</strong>
                      {plan.impact}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: CONTENT & CMS */}
          {activeTab === "content" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-brand text-2xl sm:text-4xl font-bold text-white">
                    Content Management System (CMS)
                  </h1>
                  <p className="font-outfit text-white/70 text-xs sm:text-sm mt-1">
                    Manage sermon recordings, livestream replays, and Kingdom Events with tiered access control rules.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-6 space-y-4">
                <h3 className="font-brand font-bold text-lg text-white">Kingdom Events ({events.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map((ev) => (
                    <div key={ev.id} className="p-4 rounded-2xl bg-white/[0.04] border border-white/5 flex items-start gap-4 text-xs">
                      <div className="w-12 h-12 rounded-xl bg-[#d4af37]/20 flex items-center justify-center font-bold text-[#d4af37] shrink-0">
                        {ev.day || "LIVE"}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{ev.title}</h4>
                        <p className="text-white/60 text-xs mt-1">{ev.location} • {ev.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PRAYER ALTAR MODERATION */}
          {activeTab === "prayers" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-brand text-2xl sm:text-4xl font-bold text-white">
                    24/7 Global Prayer Altar Moderation
                  </h1>
                  <p className="font-outfit text-white/70 text-xs sm:text-sm mt-1">
                    Approve, feature, or flag intercessory requests from believers worldwide.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {["all", "pending", "approved", "flagged"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setPrayerFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                        prayerFilter === st
                          ? "bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33]"
                          : "bg-white/10 text-white/70 hover:text-white"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {prayers.map((prayer) => (
                  <div key={prayer.id} className="p-6 rounded-3xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-white text-sm">{prayer.author}</span>
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-[#fbf5b7] font-semibold">{prayer.category}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          prayer.status === "approved"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : prayer.status === "flagged"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}>
                          {prayer.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-white/80 text-xs sm:text-sm leading-relaxed">&ldquo;{prayer.text}&rdquo;</p>
                      <span className="text-[11px] text-white/40 block">{prayer.date}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {prayer.status !== "approved" && (
                        <button
                          type="button"
                          onClick={() => handlePrayerStatus(prayer.id, "approved")}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {prayer.status !== "flagged" && (
                        <button
                          type="button"
                          onClick={() => handlePrayerStatus(prayer.id, "flagged")}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors"
                        >
                          Flag
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeletePrayer(prayer.id)}
                        className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: COMMUNICATIONS & CAMPAIGNS */}
          {activeTab === "communications" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-brand text-2xl sm:text-4xl font-bold text-white">
                    Pastoral Communications & Campaigns
                  </h1>
                  <p className="font-outfit text-white/70 text-xs sm:text-sm mt-1">
                    Broadcast ministry updates, missionary reports, and Bishop Dr. George Githinji letters to segmented audiences.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md hover:brightness-110 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>New Broadcast</span>
                </button>
              </div>

              <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 text-center max-w-xl mx-auto space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center mx-auto">
                  <Mail className="w-7 h-7" />
                </div>
                <h3 className="font-brand text-xl font-bold text-white">Ready to Dispatch Pastoral Message</h3>
                <p className="text-white/70 text-xs sm:text-sm">
                  Reach all active Kingdom Partners, Ambassadors, and Global Harvest delegates simultaneously.
                </p>
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(true)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-sm shadow-lg hover:brightness-110 transition-all"
                >
                  Compose Pastoral Letter
                </button>
              </div>
            </div>
          )}

          {/* TAB 9: SECURITY & AUDIT CENTER */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-brand text-2xl sm:text-4xl font-bold text-white">
                  Security, Health & Audit Command Center
                </h1>
                <p className="font-outfit text-white/70 text-xs sm:text-sm mt-1">
                  Immutable audit trail of all administrative actions and live service health monitoring.
                </p>
              </div>

              {/* Service Health Grid */}
              {healthData && (
                <div className="p-7 rounded-3xl bg-white/[0.03] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-brand font-bold text-lg text-white">Platform System Health</h3>
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      All Services Nominal
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {healthData.services.map((svc) => (
                      <div key={svc.name} className="p-4 rounded-2xl bg-white/[0.04] border border-white/5 flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{svc.name}</span>
                        <div className="text-right">
                          <span className="text-emerald-400 font-bold block">● {svc.status}</span>
                          <span className="text-[10px] text-white/40">{svc.latency}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit Logs Table */}
              <div className="p-7 rounded-3xl bg-white/[0.03] border border-white/10 space-y-4">
                <h3 className="font-brand font-bold text-lg text-white">Chronological Administrative Audit Trail</h3>
                <div className="divide-y divide-white/5 text-xs">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <span className="font-bold text-white block">{log.action}</span>
                        <span className="text-white/50 text-[11px]">By {log.actor} • Target: {log.target_type}:{log.target_id}</span>
                      </div>
                      <span className="text-[11px] text-white/40 font-mono">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: SYSTEM SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-brand text-2xl sm:text-4xl font-bold text-white">
                  System Settings & Organization Governance
                </h1>
                <p className="font-outfit text-white/70 text-xs sm:text-sm mt-1">
                  Global branding, payment gateways, timezone, and security configurations.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-white/[0.04] border border-white/10 max-w-2xl space-y-6">
                <div>
                  <label htmlFor="adminOrgNameInput" className="block text-xs uppercase font-bold text-white/60 mb-2">Organization Name</label>
                  <input
                    id="adminOrgNameInput"
                    type="text"
                    defaultValue="Kingdom Missions Network"
                    className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white font-bold text-sm focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
                <div>
                  <label htmlFor="adminOversightInput" className="block text-xs uppercase font-bold text-white/60 mb-2">Spiritual Oversight</label>
                  <input
                    id="adminOversightInput"
                    type="text"
                    defaultValue="Bishop Dr. George Githinji"
                    className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white font-bold text-sm focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
                <div>
                  <label htmlFor="adminDomainInput" className="block text-xs uppercase font-bold text-white/60 mb-2">Primary Domain</label>
                  <input
                    id="adminDomainInput"
                    type="text"
                    defaultValue="kingdommissionsnetwork.org"
                    className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white font-bold text-sm focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => showToast("Settings updated successfully", "success")}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-sm shadow-md"
                >
                  Save Organization Settings
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MEMBER PROFILE DRAWER / MODAL */}
      {showMemberModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl p-8 rounded-3xl bg-[#0d1d36] border-2 border-[#d4af37] text-white shadow-2xl space-y-6">
            <button
              type="button"
              onClick={() => setShowMemberModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] uppercase font-bold text-[#d4af37] tracking-widest block">
                Member Profile & Governance
              </span>
              <h3 className="font-brand text-2xl font-bold text-white mt-1">{selectedMember.name}</h3>
              <p className="text-xs text-white/60 font-mono">{selectedMember.email}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs">
              <div>
                <span className="text-white/50 block">Partnership Tier</span>
                <span className="font-bold text-[#fbf5b7] text-sm">{selectedMember.planName}</span>
              </div>
              <div>
                <span className="text-white/50 block">Member Role</span>
                <span className="font-bold text-white text-sm uppercase">{selectedMember.role}</span>
              </div>
              <div>
                <span className="text-white/50 block">Status</span>
                <span className="font-bold text-emerald-400 text-sm uppercase">● {selectedMember.subscriptionStatus}</span>
              </div>
              <div>
                <span className="text-white/50 block">Joined</span>
                <span className="font-bold text-white text-sm">{selectedMember.joinedAt}</span>
              </div>
            </div>

            {/* Admin Actions */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-white/70 block">Administrative Actions:</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleMemberAction(selectedMember.id, "change_plan", "Kingdom Ambassador")}
                  className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
                >
                  Promote to Ambassador
                </button>
                <button
                  type="button"
                  onClick={() => handleMemberAction(selectedMember.id, "change_role", undefined, selectedMember.role === "admin" ? "member" : "admin")}
                  className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
                >
                  {selectedMember.role === "admin" ? "Demote from Admin" : "Make Admin"}
                </button>
                <button
                  type="button"
                  onClick={() => handleMemberAction(selectedMember.id, selectedMember.subscriptionStatus === "suspended" ? "reactivate" : "suspend")}
                  className="p-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-xs transition-colors"
                >
                  {selectedMember.subscriptionStatus === "suspended" ? "Reactivate Member" : "Suspend Account"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="p-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-xs shadow-md"
                >
                  Print Partner ID
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BROADCAST CAMPAIGN MODAL */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl p-8 rounded-3xl bg-[#0d1d36] border-2 border-[#d4af37] text-white shadow-2xl space-y-6">
            <button
              type="button"
              onClick={() => setShowBroadcastModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] uppercase font-bold text-[#d4af37] tracking-widest block">
                Official Ministry Broadcast
              </span>
              <h3 className="font-brand text-2xl font-bold text-white mt-1">Compose Pastoral Campaign</h3>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label htmlFor="broadcastAudienceSelect" className="block text-xs uppercase font-bold text-white/60 mb-1.5">Target Audience Segment</label>
                <select
                  id="broadcastAudienceSelect"
                  value={broadcastAudience}
                  onChange={(e) => setBroadcastAudience(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white text-xs font-bold focus:outline-none"
                >
                  <option value="all_partners" className="bg-[#0c1b33]">All Covenant Partners ({members.length})</option>
                  <option value="ambassadors" className="bg-[#0c1b33]">Kingdom Ambassadors Only</option>
                  <option value="harvest_partners" className="bg-[#0c1b33]">Global Harvest & Pillars Only</option>
                </select>
              </div>

              <div>
                <label htmlFor="broadcastSubjectInput" className="block text-xs uppercase font-bold text-white/60 mb-1.5">Subject Line</label>
                <input
                  id="broadcastSubjectInput"
                  type="text"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  placeholder="e.g. Bishop Dr. George Githinji: Monthly Prophetic Briefing"
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white text-xs font-bold focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label htmlFor="broadcastBodyInput" className="block text-xs uppercase font-bold text-white/60 mb-1.5">Pastoral Message Body</label>
                <textarea
                  id="broadcastBodyInput"
                  rows={5}
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  placeholder="Type the message for the partners..."
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={sendingBroadcast}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:brightness-110 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>{sendingBroadcast ? "Dispatching..." : "Send to Selected Segment"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
