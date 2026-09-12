import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Crown,
  Heart,
  Calendar,
  Download,
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
  Send,
  Loader2,
  LogOut,
  BookOpen,
  Headphones,
  Check,
  X,
  KeyRound,
  Pause,
  Play,
  AlertTriangle,
  Menu,
  ArrowLeft,
} from "lucide-react";
import SEO from "../components/SEO";
import AmbientParticles from "../components/AmbientParticles";
import PartnershipSupportCard from "../components/PartnershipSupportCard";
import ThemeToggle from "../components/ThemeToggle";
import brandLogo from "../assets/logo.png";
import { api, normalizeAuthUser } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import PartnerIdCard from "../components/PartnerIdCard";
import OfficialInvoiceModal from "../components/OfficialInvoiceModal";
import { type InvoiceDetails, type AnnualStatementDetails } from "../lib/printEngine";
import AnnualStatementModal from "../components/AnnualStatementModal";

type SubscriberTab =
  | "overview"
  | "credentials"
  | "giving"
  | "devotionals"
  | "delegations"
  | "prayer"
  | "settings";

import { PARTNER_TIERS } from "../data/plans";

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
  const { user, setSession, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();

  // Extract payment / subscriber state from recent checkout or navigation
  const navState = location.state as {
    justSubscribed?: boolean;
    planName?: string;
    partnerName?: string;
    partnerEmail?: string;
    paymentReference?: string;
    paymentProvider?: string;
    amount?: number;
    currency?: string;
    subscription?: Record<string, unknown>;
    partnerNumber?: string | null;
    verifyToken?: string | null;
    claimRequired?: boolean;
  } | null;

  const [activeTab, setActiveTab] = useState<SubscriberTab>("overview");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState<boolean>(
    Boolean(navState?.justSubscribed)
  );
  const celebrationPlanName = navState?.planName || (navState?.subscription?.plan_name as string) || "Kingdom Ambassador";
  const celebrationPartnerName = navState?.partnerName || user?.name || "Covenant Partner";

  // Target identity for this partner dashboard:
  // Priority: 1. Verified payment state from checkout -> 2. Authenticated user profile -> 3. Fallback
  const partnerName = navState?.partnerName || user?.name || "Faithful Covenant Partner";
  const partnerEmail = navState?.partnerEmail || user?.email || "partner@kingdommissionsnetwork.org";
  const targetEmail = navState?.partnerEmail || user?.email || "";

  // Subscription state initialized from verified payment or active tier
  const [partnerTierKey, setPartnerTierKey] = useState<string>(() => {
    const pName = (navState?.subscription?.plan_name as string) || navState?.planName || "";
    const lower = pName.toLowerCase();
    if (lower.includes("pillar")) return "pillar";
    if (lower.includes("harvest")) return "harvest";
    if (lower.includes("seed")) return "seed";
    return "ambassador";
  });

  const [subscriptionData, setSubscriptionData] = useState<{
    status: string;
    amount: number;
    currency: string;
    created_at?: string;
    current_period_end?: string;
    payment_provider?: string;
    payment_reference?: string;
    plan_id?: string;
    interval?: string;
    retry_count?: number;
    next_retry_at?: string;
    partner_number?: string;
    verify_token?: string;
  } | null>(() => {
    if (navState?.subscription) {
      const s = navState.subscription;
      return {
        status: String(s.status || "active"),
        amount: Number(s.amount) || navState.amount || 3000,
        currency: String(s.currency || navState.currency || "KES"),
        created_at: String(s.created_at || new Date().toISOString()),
        current_period_end: String(s.current_period_end || ""),
        payment_provider: String(s.payment_provider || navState.paymentProvider || "mpesa_paybill"),
        payment_reference: String(s.payment_reference || navState.paymentReference || ""),
        partner_number: String(s.partner_number || navState.partnerNumber || ""),
        verify_token: String(s.verify_token || navState.verifyToken || ""),
      };
    }
    if (navState?.paymentReference) {
      return {
        status: "active",
        amount: navState.amount || 3000,
        currency: navState.currency || "KES",
        created_at: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
        payment_provider: navState.paymentProvider || "mpesa_paybill",
        payment_reference: navState.paymentReference,
      };
    }
    return null;
  });

  // Lifecycle + progressive-identity claim + self-serve management state
  const [lifecycle, setLifecycle] = useState<{ status: string; renewable: boolean; renewLink: string } | null>(null);
  const [claimCode, setClaimCode] = useState("");
  const [claimSending, setClaimSending] = useState(false);
  const [claimVerifying, setClaimVerifying] = useState(false);
  const [claimDone, setClaimDone] = useState(false);
  const [manageBusy, setManageBusy] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"cancel" | "pause" | null>(null);
  const [planPreview, setPlanPreview] = useState<{
    from: { planName: string; amount: number; interval: string };
    to: { planId: string; planName: string; amount: number; interval: string };
    remainingDays: number;
    unusedCredit: number;
    immediateBalance: number;
    effective: string;
    payLink: string;
  } | null>(null);
  const [planPreviewBusy, setPlanPreviewBusy] = useState(false);

  const [dismissChecklist, setDismissChecklist] = useState<boolean>(() => {
    return localStorage.getItem("kmn_partner_checklist_dismissed") === "true";
  });

  const handleDismissChecklist = () => {
    setDismissChecklist(true);
    localStorage.setItem("kmn_partner_checklist_dismissed", "true");
  };

  const needsClaim = Boolean(navState?.claimRequired) && !claimDone && !user;
  const claimEmail = navState?.partnerEmail || targetEmail;

  // Auto-send the ownership code right after a gated checkout lands here
  useEffect(() => {
    if (navState?.claimRequired && claimEmail && !claimDone) {
      setClaimSending(true);
      api.subscriptions
        .requestClaim(claimEmail)
        .catch(() => undefined)
        .finally(() => setClaimSending(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerifyClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimEmail || claimCode.trim().length < 4) {
      showToast("Please enter the 6-digit code from your email", "error");
      return;
    }
    setClaimVerifying(true);
    try {
      const res = await api.subscriptions.verifyClaim(claimEmail, claimCode.trim());
      if (res.user) {
        const sessionUser = normalizeAuthUser(res.user);
        if (sessionUser) {
          setSession(sessionUser);
          setClaimDone(true);
          showToast("Partner Hub secured! Welcome back.", "success");
        }
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Verification failed. Please try again.", "error");
    } finally {
      setClaimVerifying(false);
    }
  };

  const handleManageAction = async (action: "cancel" | "pause" | "resume", reason?: string) => {
    if (!targetEmail) {
      showToast("No partner email on record for this hub.", "error");
      return;
    }
    setManageBusy(action);
    try {
      const res = await api.subscriptions.manageSubscription(action, {
        email: targetEmail,
        paymentReference: subscriptionData?.payment_reference,
        reason,
      });
      const sub = (res.subscription || {}) as Record<string, unknown>;
      setSubscriptionData((prev) =>
        prev
          ? {
              ...prev,
              status: String(sub.status || res.status || prev.status),
              current_period_end: String(sub.current_period_end || prev.current_period_end || ""),
            }
          : prev
      );
      setConfirmAction(null);
      showToast(
        action === "cancel"
          ? "Partnership canceled. You can renew anytime — thank you for sowing."
          : action === "pause"
            ? "Partnership paused. Resume anytime to continue."
            : "Partnership restored. Welcome back!",
        "success"
      );
      loadSubscriberData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Could not update partnership.", "error");
    } finally {
      setManageBusy(null);
    }
  };

  const handlePreviewPlanChange = async (newPlanId: string, apply: boolean) => {
    if (!targetEmail) {
      showToast("No partner email on record for this hub.", "error");
      return;
    }
    setPlanPreviewBusy(true);
    try {
      const res = await api.subscriptions.previewPlanChange({
        email: targetEmail,
        paymentReference: subscriptionData?.payment_reference,
        newPlanId,
        interval: "monthly",
        apply,
      });
      setPlanPreview(res.preview);
      if (apply) {
        setPartnerTierKey(newPlanId);
        showToast("Covenant tier updated.", "success");
        loadSubscriberData();
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Could not change plan.", "error");
    } finally {
      setPlanPreviewBusy(false);
    }
  };

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
  >(() => {
    if (navState?.paymentReference) {
      return [
        {
          id: navState.paymentReference,
          amount: navState.amount || 3000,
          currency: navState.currency || "KES",
          donor_name: partnerName,
          created_at: new Date().toISOString(),
          recurring: true,
          status: "completed",
        },
      ];
    }
    return [];
  });

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

  // Invoice & Statement Print State
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetails | null>(null);
  const [statementPreview, setStatementPreview] = useState<AnnualStatementDetails | null>(null);

  const handleDownloadAnnualStatement = () => {
    // Open WYSIWYG preview modal — user can then print/save PDF from there
    setStatementPreview({
      partnerName,
      partnerEmail,
      partnerId: partnerIdNumber,
      year: new Date().getFullYear(),
      donations: donations.map((d) => ({
        date: d.created_at,
        description: d.recurring ? "Covenant Monthly Partnership Seed" : "Kingdom Mission Offering",
        reference: d.id || `REC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        amount: Number(d.amount),
        currency: d.currency || "KES",
        recurring: Boolean(d.recurring),
      })),
    });
  };

  // Load subscriber details
  const loadSubscriberData = async () => {
    setLoading(true);
    const emailToQuery = targetEmail;
    try {
      if (emailToQuery) {
        const [subRes, histRes] = await Promise.all([
          api.subscriptions.getStatus(emailToQuery).catch(() => ({ hasActiveSubscription: false, subscription: null })),
          api.donations.history(emailToQuery).catch(() => []),
        ]);

        if (subRes.subscription) {
          const sub = subRes.subscription as Record<string, unknown>;
          setSubscriptionData((prev) => ({
            status: String(sub.status || "active"),
            amount: Number(sub.amount) || 3000,
            currency: String(sub.currency || "KES"),
            created_at: String(sub.created_at || new Date().toISOString()),
            current_period_end: String(sub.current_period_end || ""),
            payment_provider: String(sub.payment_provider || "mpesa_paybill"),
            payment_reference: String(sub.payment_reference || navState?.paymentReference || "KMN-SUB-84920"),
            plan_id: String(sub.plan_id || ""),
            interval: String(sub.interval || "monthly"),
            retry_count: Number(sub.retry_count) || 0,
            next_retry_at: String(sub.next_retry_at || ""),
            // Issued credential identifiers (owner-only from the API); keep
            // checkout-provided values when the redacted response omits them.
            partner_number: String(sub.partner_number || prev?.partner_number || ""),
            verify_token: String(sub.verify_token || prev?.verify_token || ""),
          }));
          if (subRes.lifecycle) {
            setLifecycle(subRes.lifecycle as { status: string; renewable: boolean; renewLink: string });
          }

          const planStr = String(sub.plan_name || "").toLowerCase();
          if (planStr.includes("pillar")) setPartnerTierKey("pillar");
          else if (planStr.includes("harvest")) setPartnerTierKey("harvest");
          else if (planStr.includes("seed")) setPartnerTierKey("seed");
          else setPartnerTierKey("ambassador");
        } else if (!subscriptionData) {
          // Default profile if no active subscription in DB yet
          setSubscriptionData({
            status: "active",
            amount: 3000,
            currency: "KES",
            created_at: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
            payment_provider: "mpesa_paybill",
            payment_reference: navState?.paymentReference || "KMN-SUB-PENDING",
          });
        }

        if (Array.isArray(histRes) && histRes.length > 0) {
          setDonations(histRes as typeof donations);
        } else if (navState?.paymentReference) {
          setDonations([
            {
              id: navState.paymentReference,
              amount: navState.amount || 3000,
              currency: navState.currency || "KES",
              donor_name: partnerName,
              created_at: new Date().toISOString(),
              recurring: true,
              status: "completed",
            },
          ]);
        }
      }
    } catch {
      // offline profile loaded
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriberData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, targetEmail]);

  const currentTier = PARTNER_TIERS[partnerTierKey] || PARTNER_TIERS.ambassador;
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
    <div className="subscriber-dashboard min-h-screen bg-[#f4f7fb] dark:bg-[#071324] text-[#0c1b33] dark:text-white flex flex-col font-outfit transition-colors duration-300">
      <SEO
        title="Covenant Partner Hub — Kingdom Missions Network"
        description="Subscriber & Partner Portal: access official credentials, giving statements, prophetic briefings, mission delegations, and the 24/7 prayer altar."
      />

      {/* Dedicated Sticky Partner Hub Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#071324]/95 backdrop-blur-md border-b border-black/10 dark:border-white/10 px-4 sm:px-6 lg:px-8 py-3 transition-colors duration-300 shadow-sm">
        <div className="container-main mx-auto flex items-center justify-between gap-4">
          {/* Left: Mobile Navigation Trigger + Brand Identity + Main Site Return Link */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-xl text-[#0c1b33] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
              aria-label="Open portal navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link
              to="/"
              className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-[#d4af37] rounded-lg shrink-0"
              title="Return to Kingdom Missions Network main website"
            >
              <div className="w-9 h-9 rounded-xl bg-[#0c1b33] p-1 border border-[#d4af37]/40 flex items-center justify-center shadow-sm">
                <img src={brandLogo} alt="KMN Logo" className="w-6 h-6 object-contain" />
              </div>
              <div className="hidden sm:block leading-tight">
                <div className="text-xs font-bold font-brand text-[#0c1b33] dark:text-white tracking-wide group-hover:text-[#d4af37] transition-colors">
                  KINGDOM MISSIONS
                </div>
                <div className="text-[10px] tracking-wider text-[#0c1b33]/60 dark:text-white/50 uppercase font-semibold">
                  Partner Portal
                </div>
              </div>
            </Link>

            <div className="h-5 w-px bg-black/10 dark:bg-white/10 hidden md:block" />

            <Link
              to="/"
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-[#0c1b33]/70 dark:text-white/70 hover:text-[#d4af37] dark:hover:text-[#d4af37] transition-colors px-2.5 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Main Ministry Website</span>
            </Link>
          </div>

          {/* Right: Active Covenant Status, Theme Toggle, Quick Actions & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Active Covenant status badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#996515] dark:text-[#fbf5b7] text-[11px] font-bold">
              <Crown className="w-3 h-3 text-[#996515] dark:text-[#d4af37]" />
              <span>{currentTier.badge}</span>
            </div>

            {/* Quick Action: Partner Credential */}
            <button
              type="button"
              onClick={() => setActiveTab("credentials")}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 border border-black/10 dark:border-white/10 text-xs font-semibold text-[#0c1b33] dark:text-white transition-colors"
            >
              <Award className="w-3.5 h-3.5 text-[#996515] dark:text-[#d4af37]" />
              <span>Partner Credential</span>
            </button>

            {/* Quick Action: Prayer Altar */}
            <button
              type="button"
              onClick={() => setActiveTab("prayer")}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] text-xs font-bold shadow-sm hover:brightness-105 transition-all"
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Altar Prayer</span>
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Profile Avatar & Sign Out */}
            <div className="flex items-center gap-2 pl-2 border-l border-black/10 dark:border-white/10">
              <div
                className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d4af37] to-[#8b5e3c] p-0.5 shadow-sm"
                title={`Signed in as ${partnerName}`}
              >
                <div className="w-full h-full rounded-full bg-[#0c1b33] text-[#fbf5b7] flex items-center justify-center text-xs font-bold">
                  {partnerName.charAt(0).toUpperCase()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="p-1.5 rounded-lg text-[#0c1b33]/60 dark:text-white/60 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Portal Navigation Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-[#09182d] border-r border-black/10 dark:border-white/10 shadow-2xl p-4 flex flex-col z-10">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <img src={brandLogo} alt="" className="w-6 h-6 object-contain" />
                <span className="font-bold text-xs uppercase tracking-wider text-[#0c1b33] dark:text-white font-brand">
                  Partner Navigation
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[#0c1b33] dark:text-white"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto">
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
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] shadow-md font-bold"
                        : "text-[#0c1b33]/75 dark:text-white/70 hover:text-[#0c1b33] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? "text-[#0c1b33]" : "text-[#996515] dark:text-[#d4af37]"}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </nav>

            <div className="pt-4 mt-2 border-t border-black/10 dark:border-white/10 space-y-2">
              <Link
                to="/"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#0c1b33]/80 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Main Website</span>
              </Link>
              <div className="text-[11px] text-[#0c1b33]/60 dark:text-white/50 px-2">
                <span>Signed in:</span>
                <span className="block font-semibold text-[#0c1b33] dark:text-white truncate">{partnerEmail}</span>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero / Partner Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-white via-[#f5f0e8] to-[#e6eef7] dark:from-[#0c1b33] dark:via-[#09182d] dark:to-[#1a1107] border-b border-black/10 dark:border-white/10 px-4 sm:px-6 lg:px-8 py-6 transition-colors duration-300">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(249,115,22,0.15)_0%,transparent_65%)] pointer-events-none blur-3xl" />
        <div className="absolute bottom-0 left-10 w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(212,175,55,0.18)_0%,transparent_65%)] pointer-events-none blur-3xl" />
        <AmbientParticles />

        <div className="container-main mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Identity & Status */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#8b5e3c] p-0.5 shadow-xl">
                  <div className="w-full h-full rounded-2xl bg-[#0c1b33] flex items-center justify-center overflow-hidden">
                    <img src={brandLogo} alt="" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full border-2 border-white dark:border-[#071324]" title="Active Covenant">
                  <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#996515] dark:text-[#fbf5b7] text-[11px] font-bold tracking-wide flex items-center gap-1">
                    <Crown className="w-3 h-3 text-[#996515] dark:text-[#d4af37]" />
                    {currentTier.badge}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                    Active Covenant
                  </span>
                  <span className="text-[#0c1b33]/60 dark:text-white/40 text-xs">• ID: {partnerIdNumber}</span>
                </div>

                <h1 className="font-brand text-xl sm:text-2xl lg:text-3xl font-bold text-[#0c1b33] dark:text-white tracking-tight">
                  Welcome back, <span className="bg-gradient-to-r from-[#996515] via-[#d4af37] to-[#b38318] dark:from-[#d4af37] dark:via-[#f5e6b3] dark:to-[#c5961d] bg-clip-text text-transparent">{partnerName}</span>
                </h1>
                <p className="text-[#0c1b33]/70 dark:text-white/70 text-xs sm:text-sm mt-0.5">
                  Standing with Bishop Dr. George Githinji to reach the unreached and feed the nations.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("credentials")}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-black/5 dark:bg-white/10 dark:hover:bg-white/15 border border-black/10 dark:border-white/15 text-[#0c1b33] dark:text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm"
              >
                <Award className="w-4 h-4 text-[#996515] dark:text-[#d4af37]" />
                <span className="hidden sm:inline">Partner ID &amp; Seal</span>
                <span className="sm:hidden">ID Seal</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("prayer")}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] text-[#0c1b33] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md hover:brightness-105 transition-all"
              >
                <Heart className="w-4 h-4 text-[#0c1b33] fill-current" />
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
            <div className="bg-white dark:bg-[#09182d] rounded-2xl border border-black/10 dark:border-white/10 p-3 static lg:sticky lg:top-20 space-y-1 shadow-md dark:shadow-xl transition-colors">
              <div className="px-3 py-2 text-[10px] uppercase font-bold text-[#0c1b33]/50 dark:text-white/40 tracking-[0.2em]">
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
                        : "text-[#0c1b33]/75 dark:text-white/70 hover:text-[#0c1b33] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? "text-[#0c1b33]" : "text-[#996515] dark:text-[#d4af37]"}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                );
              })}

              <div className="pt-4 mt-4 border-t border-black/10 dark:border-white/10 px-2 space-y-2">
                <div className="text-[11px] text-[#0c1b33]/60 dark:text-white/50 px-2">
                  <span>Signed in as:</span>
                  <span className="block font-semibold text-[#0c1b33] dark:text-white truncate">{partnerEmail}</span>
                </div>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
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
                {/* New Partner Onboarding Guided Checklist (Top-Tier SaaS/Ministry Benchmark) */}
                {!dismissChecklist && (
                  <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#0c1b33] via-[#102447] to-[#1c1208] border-2 border-[#d4af37]/50 text-white shadow-xl relative overflow-hidden">
                    <div className="flex items-start justify-between gap-4 pb-3 border-b border-white/10 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#8b5e3c] p-0.5 shadow-md flex items-center justify-center shrink-0">
                          <Sparkles className="w-5 h-5 text-[#0c1b33]" />
                        </div>
                        <div>
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#fbf5b7] text-[10px] font-bold uppercase tracking-wider mb-0.5">
                            Partner Onboarding Guide
                          </div>
                          <h3 className="font-brand text-base sm:text-lg font-bold text-white">
                            What to Do Next as an Active Kingdom Partner
                          </h3>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleDismissChecklist}
                        className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                        title="Dismiss onboarding checklist"
                        aria-label="Dismiss onboarding checklist"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {/* Item 1: Activated */}
                      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                        <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-emerald-300">Covenant Partnership Activated</div>
                          <div className="text-[11px] text-white/70 mt-0.5">
                            Tier: <strong className="text-white">{currentTier.name}</strong> · Ref: {subscriptionData?.payment_reference || "KMN-ACTIVE"}
                          </div>
                        </div>
                      </div>

                      {/* Item 2: ID Card */}
                      <div className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 flex items-start justify-between gap-3 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-xl bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center shrink-0 mt-0.5">
                            <Award className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#fbf5b7]">Download Your Digital ID Card</div>
                            <div className="text-[11px] text-white/70 mt-0.5">Official pass with verified partner QR code.</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab("credentials")}
                          className="px-2.5 py-1 rounded-lg bg-[#d4af37]/20 hover:bg-[#d4af37] text-[#fbf5b7] hover:text-[#0c1b33] text-[11px] font-bold shrink-0 transition-colors"
                        >
                          View ID →
                        </button>
                      </div>

                      {/* Item 3: Prayer Altar */}
                      <div className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 flex items-start justify-between gap-3 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Heart className="w-4 h-4 fill-current" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">Place Prayer on 24/7 Altar</div>
                            <div className="text-[11px] text-white/70 mt-0.5">Pastoral intercession by Bishop Dr. George Githinji.</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab("prayer")}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold shrink-0 transition-colors"
                        >
                          Pray →
                        </button>
                      </div>

                      {/* Item 4: Devotionals / Prophetic Briefings */}
                      <div className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 flex items-start justify-between gap-3 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">Prophetic Audio Briefings</div>
                            <div className="text-[11px] text-white/70 mt-0.5">Exclusive teachings &amp; frontline crusade digests.</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab("devotionals")}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold shrink-0 transition-colors"
                        >
                          Listen →
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-white/60 pt-2 border-t border-white/10">
                      <span>Need personal assistance? Contact our partner oversight team at <strong className="text-white">partners@kingdommissionsnetwork.org</strong></span>
                      <button
                        type="button"
                        onClick={handleDismissChecklist}
                        className="text-[#d4af37] hover:underline font-semibold"
                      >
                        Dismiss Guide
                      </button>
                    </div>
                  </div>
                )}

                {/* Email-ownership claim (progressive identity): payment succeeded for a
                    known email — verify the inbox code to mint the hub session. */}
                {needsClaim && claimEmail && (
                  <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-400/40 space-y-4" role="status" aria-live="polite">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#0c1b33] dark:text-white text-sm">Secure your Partner Hub — one quick step</h3>
                        <p className="text-xs text-[#0c1b33]/70 dark:text-white/65">
                          Your payment is confirmed. We sent a 6-digit code to <strong className="text-[#0c1b33] dark:text-white">{claimEmail}</strong> to
                          prove this hub belongs to you. {claimSending ? "Sending…" : "It expires in 10 minutes."}
                        </p>
                      </div>
                    </div>
                    <form onSubmit={handleVerifyClaim} className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={claimCode}
                        onChange={(e) => setClaimCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="Enter 6-digit code"
                        aria-label="Verification code"
                        className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-black/40 border border-amber-400/50 text-[#0c1b33] dark:text-white font-mono font-bold tracking-[0.3em] text-center focus:outline-none focus:border-amber-500 dark:focus:border-amber-300 placeholder:text-[#0c1b33]/40 dark:placeholder:text-white/30 placeholder:font-sans placeholder:tracking-normal shadow-sm dark:shadow-none"
                      />
                      <button
                        type="submit"
                        disabled={claimVerifying}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-xs disabled:opacity-60 flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        {claimVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        <span>{claimVerifying ? "Verifying…" : "Verify & Unlock"}</span>
                      </button>
                      <button
                        type="button"
                        disabled={claimSending}
                        onClick={() => {
                          setClaimSending(true);
                          api.subscriptions
                            .requestClaim(claimEmail)
                            .then(() => showToast("A fresh code is on its way.", "success"))
                            .catch(() => showToast("Could not resend code. Try again.", "error"))
                            .finally(() => setClaimSending(false));
                        }}
                        className="px-4 py-2.5 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-[#0c1b33] dark:text-white font-bold text-xs disabled:opacity-60 border border-black/10 dark:border-transparent transition-colors"
                      >
                        Resend code
                      </button>
                    </form>
                  </div>
                )}

                {/* Overdue / grace renewal nudge */}
                {lifecycle?.renewable && subscriptionData && (
                  <div className="p-5 rounded-3xl bg-blue-500/10 border border-blue-400/40 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-300 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#0c1b33] dark:text-white">
                        Your partnership is {lifecycle.status.replace("_", " ")} — renew to restore full access.
                      </p>
                      <p className="text-xs text-[#0c1b33]/70 dark:text-white/65">
                        M-Pesa needs your PIN each cycle, so renewals are one tap. No back-charges are ever made silently.
                      </p>
                    </div>
                    <a
                      href={lifecycle.renewLink}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-xs shrink-0 shadow-sm"
                    >
                      Renew now →
                    </a>
                  </div>
                )}

                {/* Kingdom Impact Banner */}
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0e213d] via-[#102444] to-[#1f170b] border border-[#d4af37]/30 shadow-xl relative overflow-hidden text-white">
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
                        className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>Latest Prophetic Briefing</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* KPI Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.04] border border-black/10 dark:border-white/10 space-y-2 shadow-sm dark:shadow-none transition-colors">
                    <div className="flex items-center justify-between text-[#0c1b33]/60 dark:text-white/50 text-xs font-semibold">
                      <span>MONTHLY COVENANT SEED</span>
                      <CreditCard className="w-4 h-4 text-[#996515] dark:text-[#d4af37]" />
                    </div>
                    <div className="text-2xl font-brand font-extrabold text-[#0c1b33] dark:text-white">
                      KES {subscriptionData?.amount.toLocaleString() || "3,000"}
                    </div>
                    <div className="text-xs text-[#0c1b33]/60 dark:text-white/60">
                      ≈ ${(Number(subscriptionData?.amount || 3000) * 0.00772).toFixed(2)} USD / month
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.04] border border-black/10 dark:border-white/10 space-y-2 shadow-sm dark:shadow-none transition-colors">
                    <div className="flex items-center justify-between text-[#0c1b33]/60 dark:text-white/50 text-xs font-semibold">
                      <span>NEXT COVENANT RENEWAL</span>
                      <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-brand font-bold text-emerald-600 dark:text-emerald-400">
                      {subscriptionData?.current_period_end
                        ? new Date(subscriptionData.current_period_end).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Active & Current"}
                    </div>
                    <div className="text-xs text-[#0c1b33]/60 dark:text-white/60">Auto-billed via {subscriptionData?.payment_provider || "Paystack"}</div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.04] border border-black/10 dark:border-white/10 space-y-2 shadow-sm dark:shadow-none transition-colors">
                    <div className="flex items-center justify-between text-[#0c1b33]/60 dark:text-white/50 text-xs font-semibold">
                      <span>ALTAR PRAYER LINE</span>
                      <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-brand font-bold text-amber-600 dark:text-amber-300">
                      {prayerRequests.length} Requests
                    </div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">● Intercessory Team Active</div>
                  </div>
                </div>

                {/* Tier Perks & Endorsements */}
                <div className="p-6 rounded-3xl bg-white dark:bg-white/[0.03] border border-black/10 dark:border-white/10 space-y-4 shadow-sm dark:shadow-none transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-brand text-lg font-bold text-[#0c1b33] dark:text-white">
                        Your {currentTier.name} Privileges & Ministry Backing
                      </h3>
                      <p className="text-xs text-[#0c1b33]/60 dark:text-white/60">Exclusive privileges granted to your partnership covenant level.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("settings")}
                      className="text-xs text-[#996515] dark:text-[#d4af37] font-bold hover:underline"
                    >
                      Change Plan →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentTier.perks.map((perk, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="text-xs sm:text-sm text-[#0c1b33]/85 dark:text-white/80">{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Giving Snapshot */}
                <div className="p-6 rounded-3xl bg-white dark:bg-white/[0.03] border border-black/10 dark:border-white/10 space-y-4 shadow-sm dark:shadow-none transition-colors">
                  <div className="flex items-center justify-between">
                    <h3 className="font-brand text-lg font-bold text-[#0c1b33] dark:text-white">Recent Partnership Contributions</h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("giving")}
                      className="text-xs text-[#996515] dark:text-[#d4af37] font-bold hover:underline"
                    >
                      View All Records & Receipts →
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-black/10 dark:border-white/10 text-[#0c1b33]/60 dark:text-white/50 text-[11px] uppercase tracking-wider">
                          <th className="pb-3 font-semibold">Date</th>
                          <th className="pb-3 font-semibold">Description</th>
                          <th className="pb-3 font-semibold">Amount</th>
                          <th className="pb-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5 dark:divide-white/5">
                        {donations.slice(0, 3).map((d, idx) => (
                          <tr key={idx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 text-[#0c1b33]/70 dark:text-white/70">
                              {new Date(d.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </td>
                            <td className="py-3 font-medium text-[#0c1b33] dark:text-white">
                              {d.recurring ? "Monthly Covenant Seed" : "One-Time Mission Seed"}
                            </td>
                            <td className="py-3 font-bold text-[#996515] dark:text-[#fbf5b7]">
                              {d.currency} {Number(d.amount).toLocaleString()}
                            </td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
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
                  <h2 className="font-brand text-2xl font-bold text-[#0c1b33] dark:text-white">Official Partner Credential & ID Card</h2>
                  <p className="text-[#0c1b33]/70 dark:text-white/70 text-xs sm:text-sm mt-1">
                    Your authenticated digital credential issued by Kingdom Missions Network under the oversight of Bishop Dr. George Githinji.
                  </p>
                </div>

                {/* Interactive High-Security ID Card Display */}
                <PartnerIdCard
                  card={{
                    id: subscriptionData?.partner_number || partnerIdNumber,
                    name: partnerName,
                    email: partnerEmail,
                    role: currentTier.name,
                    planName: currentTier.name,
                    subscriptionStatus: subscriptionData?.status || "active",
                    amount: subscriptionData?.amount,
                    currency: subscriptionData?.currency,
                    joinedAt: "2026",
                    partnerNumber: subscriptionData?.partner_number || null,
                    verifyToken: subscriptionData?.verify_token || null,
                  }}
                />
              </div>
            )}

            {/* TAB 3: GIVING RECORDS & TAX STATEMENTS */}
            {activeTab === "giving" && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-brand text-2xl font-bold text-[#0c1b33] dark:text-white">Giving History & Official Statements</h2>
                    <p className="text-[#0c1b33]/70 dark:text-white/70 text-xs sm:text-sm mt-1">
                      Download tax receipts, giving summaries, and track your kingdom stewardship.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadAnnualStatement}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md hover:brightness-110 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Preview Annual Tax Statement</span>
                  </button>
                </div>

                {/* Ledger Table & Mobile Cards */}
                <div className="rounded-3xl bg-white dark:bg-white/[0.03] border border-black/10 dark:border-white/10 p-4 sm:p-6 space-y-4 shadow-sm dark:shadow-none transition-colors">
                  {/* Mobile Card List (< sm) */}
                  <div className="sm:hidden space-y-3">
                    {donations.map((d, index) => (
                      <div key={index} className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-[#0c1b33] dark:text-white text-sm">
                              {d.recurring ? "Covenant Monthly Partnership Seed" : "Kingdom Mission Offering"}
                            </p>
                            <p className="text-[#0c1b33]/60 dark:text-white/50 text-xs mt-0.5">
                              {new Date(d.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold shrink-0">
                            Verified
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-black/10 dark:border-white/10">
                          <div>
                            <span className="text-xs text-[#0c1b33]/60 dark:text-white/50 block">Amount</span>
                            <span className="font-bold text-[#996515] dark:text-[#fbf5b7] text-sm">
                              {d.currency} {Number(d.amount).toLocaleString()}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedInvoice({
                                id: d.id,
                                reference: d.id || `REC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                                name: partnerName,
                                email: partnerEmail,
                                partnerId: partnerIdNumber,
                                planName: currentTier.name,
                                amount: Number(d.amount),
                                currency: d.currency || "KES",
                                date: d.created_at,
                                recurring: Boolean(d.recurring),
                                provider: "PAYSTACK SECURE / M-PESA",
                                status: "completed",
                              });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-[#0c1b33] dark:text-white text-xs font-semibold inline-flex items-center gap-1.5 border border-black/10 dark:border-transparent transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop / Tablet Table (>= sm) */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-black/10 dark:border-white/10 text-[#0c1b33]/60 dark:text-white/50 text-[11px] uppercase tracking-wider">
                          <th className="pb-3 font-semibold">Transaction Date</th>
                          <th className="pb-3 font-semibold">Contribution Category</th>
                          <th className="pb-3 font-semibold">Amount</th>
                          <th className="pb-3 font-semibold">Payment Method</th>
                          <th className="pb-3 font-semibold">Status</th>
                          <th className="pb-3 font-semibold text-right">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5 dark:divide-white/5">
                        {donations.map((d, index) => (
                          <tr key={index} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 text-[#0c1b33]/70 dark:text-white/80">
                              {new Date(d.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </td>
                            <td className="py-4 font-medium text-[#0c1b33] dark:text-white">
                              {d.recurring ? "Covenant Monthly Partnership Seed" : "Kingdom Mission Offering"}
                            </td>
                            <td className="py-4 font-bold text-[#996515] dark:text-[#fbf5b7]">
                              {d.currency} {Number(d.amount).toLocaleString()}
                            </td>
                            <td className="py-4 text-[#0c1b33]/60 dark:text-white/60">Paystack / Card</td>
                            <td className="py-4">
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                                Verified
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedInvoice({
                                    id: d.id,
                                    reference: d.id || `REC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                                    name: partnerName,
                                    email: partnerEmail,
                                    partnerId: partnerIdNumber,
                                    planName: currentTier.name,
                                    amount: Number(d.amount),
                                    currency: d.currency || "KES",
                                    date: d.created_at,
                                    recurring: Boolean(d.recurring),
                                    provider: "PAYSTACK SECURE / M-PESA",
                                    status: "completed",
                                  });
                                }}
                                className="px-3 py-1 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-[#0c1b33] dark:text-white text-xs font-semibold inline-flex items-center gap-1 border border-black/10 dark:border-transparent transition-colors"
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
                  <h2 className="font-brand text-2xl font-bold text-[#0c1b33] dark:text-white">
                    Exclusive Prophetic Briefings & Partner Resources
                  </h2>
                  <p className="text-[#0c1b33]/70 dark:text-white/70 text-xs sm:text-sm mt-1">
                    Monthly live impartations, spiritual teachings, and missionary intelligence from Bishop Dr. George Githinji.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {DEVOTIONAL_RESOURCES.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-3xl bg-white dark:bg-white/[0.04] border border-black/10 dark:border-white/10 p-6 flex flex-col justify-between hover:border-[#d4af37]/50 shadow-sm dark:shadow-none transition-all group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#d4af37]/20 text-[#996515] dark:text-[#fbf5b7] text-[10px] font-bold">
                            {item.tag}
                          </span>
                          <span className="text-xs text-[#0c1b33]/60 dark:text-white/40">{item.duration}</span>
                        </div>

                        <h3 className="font-brand text-lg font-bold text-[#0c1b33] dark:text-white group-hover:text-[#996515] dark:group-hover:text-[#fbf5b7] transition-colors">
                          {item.title}
                        </h3>

                        <div className="text-xs text-[#0c1b33]/70 dark:text-white/60 space-y-1">
                          <p>Oversight: {item.speaker}</p>
                          <p className="text-[#0c1b33]/50 dark:text-white/40">{item.date}</p>
                        </div>
                      </div>

                      <div className="pt-5 mt-5 border-t border-black/10 dark:border-white/10">
                        <button
                          type="button"
                          onClick={() => {
                            showToast(`Opening "${item.title}"...`, "info");
                          }}
                          className="w-full py-2.5 rounded-xl bg-black/5 hover:bg-gradient-to-r hover:from-[#d4af37] hover:to-[#c5961d] hover:!text-[#0c1b33] text-[#0c1b33] dark:bg-white/10 dark:hover:bg-gradient-to-r dark:hover:from-[#d4af37] dark:hover:to-[#c5961d] dark:hover:!text-[#0c1b33] dark:text-white font-bold text-xs flex items-center justify-center gap-2 border border-black/10 dark:border-transparent transition-all shadow-sm"
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
                  <h2 className="font-brand text-2xl font-bold text-[#0c1b33] dark:text-white">Mission Delegations & Itinerary Facilitation</h2>
                  <p className="text-[#0c1b33]/70 dark:text-white/70 text-xs sm:text-sm mt-1">
                    Join frontline crusade teams, receive pastoral endorsement, or request overseas preaching itinerary support.
                  </p>
                </div>

                <div className="space-y-5">
                  {UPCOMING_DELEGATIONS.map((trip) => (
                    <div
                      key={trip.id}
                      className="p-6 rounded-3xl bg-white dark:bg-white/[0.04] border border-black/10 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#d4af37]/40 shadow-sm dark:shadow-none transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                            {trip.status}
                          </span>
                          <span className="text-xs text-[#996515] dark:text-[#d4af37] font-semibold">{trip.slots}</span>
                        </div>
                        <h3 className="font-brand text-xl font-bold text-[#0c1b33] dark:text-white">{trip.title}</h3>
                        <p className="text-xs sm:text-sm text-[#0c1b33]/70 dark:text-white/70">{trip.focus}</p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-[#0c1b33]/60 dark:text-white/50 pt-1">
                          <span className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-[#996515] dark:text-[#d4af37]" />
                            {trip.location}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
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
                <div className="p-7 rounded-3xl bg-gradient-to-br from-[#0c1b33] to-[#17263d] border border-white/15 space-y-4 text-white">
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
                  <h2 className="font-brand text-2xl font-bold text-[#0c1b33] dark:text-white">24/7 Priority Pastoral Prayer Altar</h2>
                  <p className="text-[#0c1b33]/70 dark:text-white/70 text-xs sm:text-sm mt-1">
                    Your prayer requests are placed directly before the 24/7 Global Intercessory Council and Bishop Dr. George Githinji.
                  </p>
                </div>

                {/* Submit New Request Form */}
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-white/[0.04] border border-black/10 dark:border-white/10 space-y-6 shadow-sm dark:shadow-none transition-colors">
                  <h3 className="font-brand text-lg font-bold text-[#0c1b33] dark:text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-[#996515] dark:text-[#d4af37]" />
                    <span>Send Urgent Prayer Request to the Altar</span>
                  </h3>

                  <form onSubmit={handlePrayerSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="prayerCategorySelect" className="block text-xs uppercase font-bold text-[#0c1b33]/75 dark:text-white/70 mb-2">
                        Urgency & Spiritual Focus
                      </label>
                      <select
                        id="prayerCategorySelect"
                        value={prayerUrgency}
                        onChange={(e) => setPrayerUrgency(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-black/[0.03] dark:bg-[#09182d] border border-black/15 dark:border-white/15 text-[#0c1b33] dark:text-white text-xs sm:text-sm focus:outline-none focus:border-[#d4af37]"
                      >
                        <option value="Urgent Pastoral Intercession">Urgent Pastoral Intercession</option>
                        <option value="Health, Healing & Miracle">Health, Healing & Miracle</option>
                        <option value="Business, Career & Provision">Business, Career & Provision</option>
                        <option value="Family, Marriage & Children">Family, Marriage & Children</option>
                        <option value="Ministry Calling & Spiritual Breakthrough">Ministry Calling & Spiritual Breakthrough</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="prayerSubjectInput" className="block text-xs uppercase font-bold text-[#0c1b33]/75 dark:text-white/70 mb-2">Prayer Subject</label>
                      <input
                        id="prayerSubjectInput"
                        type="text"
                        value={prayerSubject}
                        onChange={(e) => setPrayerSubject(e.target.value)}
                        placeholder="e.g. Divine Favor in Ministry Crusade & Health Miracle"
                        required
                        className="w-full px-4 py-3 rounded-2xl bg-black/[0.03] dark:bg-[#09182d] border border-black/15 dark:border-white/15 text-[#0c1b33] dark:text-white placeholder:text-[#0c1b33]/40 dark:placeholder:text-white/40 text-xs sm:text-sm focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    <div>
                      <label htmlFor="prayerDetailsInput" className="block text-xs uppercase font-bold text-[#0c1b33]/75 dark:text-white/70 mb-2">
                        Specific Intercession Details
                      </label>
                      <textarea
                        id="prayerDetailsInput"
                        value={prayerDetails}
                        onChange={(e) => setPrayerDetails(e.target.value)}
                        rows={4}
                        placeholder="Write your personal petitions. All partner submissions remain strictly confidential with the bishop and intercessors."
                        required
                        className="w-full px-4 py-3 rounded-2xl bg-black/[0.03] dark:bg-[#09182d] border border-black/15 dark:border-white/15 text-[#0c1b33] dark:text-white placeholder:text-[#0c1b33]/40 dark:placeholder:text-white/40 text-xs sm:text-sm focus:outline-none focus:border-[#d4af37]"
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
                  <h3 className="font-brand text-lg font-bold text-[#0c1b33] dark:text-white">Your Intercession History</h3>
                  <div className="space-y-3">
                    {prayerRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-black/10 dark:border-white/10 flex items-center justify-between gap-4 shadow-sm dark:shadow-none transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
                            <Heart className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-[#0c1b33] dark:text-white text-xs sm:text-sm block">{req.subject}</span>
                            <span className="text-[11px] text-[#0c1b33]/60 dark:text-white/50">Submitted: {req.date}</span>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            req.status === "Prayed Over"
                              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                              : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
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
                  <h2 className="font-brand text-2xl font-bold text-[#0c1b33] dark:text-white">Covenant Partnership & Billing Settings</h2>
                  <p className="text-[#0c1b33]/70 dark:text-white/70 text-xs sm:text-sm mt-1">
                    Manage your partnership tier, billing preferences, and currency options.
                  </p>
                </div>

                {/* Plan Switcher */}
                <div className="p-6 rounded-3xl bg-white dark:bg-white/[0.04] border border-black/10 dark:border-white/10 space-y-6 shadow-sm dark:shadow-none transition-colors">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="font-brand text-lg font-bold text-[#0c1b33] dark:text-white">Adjust Your Covenant Tier</h3>
                    {subscriptionData && (
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                          subscriptionData.status === "active"
                            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                            : subscriptionData.status === "past_due" || subscriptionData.status === "grace"
                              ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                              : subscriptionData.status === "paused"
                                ? "bg-blue-500/20 text-blue-700 dark:text-blue-300"
                                : "bg-black/10 dark:bg-white/10 text-[#0c1b33]/60 dark:text-white/60"
                        }`}
                      >
                        {subscriptionData.status.replace("_", " ")}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.values(PARTNER_TIERS).map((plan) => {
                      const isSelected = partnerTierKey === plan.id;
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => {
                            setPartnerTierKey(plan.id);
                            setPlanPreview(null);
                            handlePreviewPlanChange(plan.id, false);
                          }}
                          className={`p-5 rounded-2xl border cursor-pointer transition-all text-left w-full ${
                            isSelected
                              ? "bg-[#d4af37]/15 border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                              : "bg-black/[0.02] dark:bg-white/[0.02] border-black/10 dark:border-white/10 hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm text-[#0c1b33] dark:text-white">{plan.badge}</span>
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded-full bg-[#d4af37] text-[#0c1b33] text-[10px] font-extrabold">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-lg font-brand font-bold text-[#996515] dark:text-[#fbf5b7] mb-1">
                            KES {plan.kesMonthly.toLocaleString()} / month
                            <span className="text-xs text-[#0c1b33]/60 dark:text-white/50 block font-normal">
                              ≈ ${plan.usdMonthly.toFixed(2)} USD
                            </span>
                          </div>
                          <p className="text-xs text-[#0c1b33]/70 dark:text-white/70">{plan.tagline}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Proration preview (server-computed, honest before/after) */}
                  {planPreviewBusy && (
                    <p className="text-xs text-[#0c1b33]/70 dark:text-white/60 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Computing fair proration…
                    </p>
                  )}
                  {planPreview && !planPreviewBusy && (
                    <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-black/30 border border-[#d4af37]/30 text-xs space-y-2" aria-live="polite">
                      <p className="text-[#0c1b33]/85 dark:text-white/80">
                        <strong className="text-[#0c1b33] dark:text-white">{planPreview.from.planName}</strong> (KES {planPreview.from.amount.toLocaleString()})
                        {" → "}
                        <strong className="text-[#996515] dark:text-[#fbf5b7]">{planPreview.to.planName}</strong> (KES {planPreview.to.amount.toLocaleString()}/{planPreview.to.interval === "yearly" ? "yr" : "mo"})
                      </p>
                      <p className="text-[#0c1b33]/70 dark:text-white/65">
                        {planPreview.remainingDays} days left this cycle · unused credit KES {planPreview.unusedCredit.toLocaleString()}
                        {planPreview.immediateBalance > 0 ? (
                          <> · balance due <strong className="text-[#0c1b33] dark:text-white">KES {planPreview.immediateBalance.toLocaleString()}</strong> via checkout (M-Pesa needs your PIN — never silent)</>
                        ) : (
                          <> · no balance due, takes effect at next renewal</>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          disabled={planPreviewBusy}
                          onClick={() => handlePreviewPlanChange(planPreview.to.planId, true)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-xs disabled:opacity-60"
                        >
                          Confirm tier change
                        </button>
                        {planPreview.immediateBalance > 0 && (
                          <a href={planPreview.payLink} className="px-4 py-2 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-[#0c1b33] dark:text-white font-bold text-xs border border-black/10 dark:border-transparent">
                            Pay balance via checkout →
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Partnership lifecycle: pause / resume / cancel (self-serve, FTC-friendly) */}
                <div className="p-6 rounded-3xl bg-white dark:bg-white/[0.03] border border-black/10 dark:border-white/10 space-y-4 shadow-sm dark:shadow-none transition-colors">
                  <div>
                    <h3 className="font-brand text-lg font-bold text-[#0c1b33] dark:text-white">Partnership Lifecycle</h3>
                    <p className="text-xs text-[#0c1b33]/60 dark:text-white/60">
                      Pause, resume, or cancel anytime — no calls, no retention traps. Canceling stops future renewals; your giving history stays intact.
                    </p>
                  </div>
                  {subscriptionData?.next_retry_at && ["past_due", "grace"].includes(subscriptionData.status) && (
                    <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>
                        Next gentle retry: {new Date(subscriptionData.next_retry_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {lifecycle?.renewLink ? (
                          <> · <a href={lifecycle.renewLink} className="underline font-bold">renew now</a> to skip the wait</>
                        ) : null}
                      </span>
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {subscriptionData && ["active", "past_due", "grace"].includes(subscriptionData.status) && (
                      confirmAction === "pause" ? (
                        <>
                          <button type="button" disabled={manageBusy === "pause"} onClick={() => handleManageAction("pause")}
                            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs disabled:opacity-60 flex items-center gap-1.5">
                            {manageBusy === "pause" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pause className="w-3.5 h-3.5" />}
                            <span>Confirm pause</span>
                          </button>
                          <button type="button" onClick={() => setConfirmAction(null)}
                            className="px-4 py-2.5 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-[#0c1b33] dark:text-white font-bold text-xs border border-black/10 dark:border-transparent">
                            Keep partnership
                          </button>
                        </>
                      ) : (
                        <button type="button" onClick={() => setConfirmAction("pause")}
                          className="px-4 py-2.5 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-[#0c1b33] dark:text-white font-bold text-xs flex items-center gap-1.5 border border-black/10 dark:border-transparent">
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause partnership</span>
                        </button>
                      )
                    )}
                    {subscriptionData && ["paused", "past_due", "grace", "suspended"].includes(subscriptionData.status) && (
                      <button type="button" disabled={manageBusy === "resume"} onClick={() => handleManageAction("resume")}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs disabled:opacity-60 flex items-center gap-1.5">
                        {manageBusy === "resume" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        <span>Resume partnership</span>
                      </button>
                    )}
                    {subscriptionData && !["canceled"].includes(subscriptionData.status) && (
                      confirmAction === "cancel" ? (
                        <>
                          <button type="button" disabled={manageBusy === "cancel"} onClick={() => handleManageAction("cancel", "self-serve hub cancellation")}
                            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs disabled:opacity-60">
                            {manageBusy === "cancel" ? "Canceling…" : "Yes, cancel renewals"}
                          </button>
                          <button type="button" onClick={() => setConfirmAction(null)}
                            className="px-4 py-2.5 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-[#0c1b33] dark:text-white font-bold text-xs border border-black/10 dark:border-transparent">
                            Keep partnership
                          </button>
                        </>
                      ) : (
                        <button type="button" onClick={() => setConfirmAction("cancel")}
                          className="px-4 py-2.5 rounded-xl bg-black/[0.03] hover:bg-red-500/15 border border-black/10 dark:bg-white/[0.04] dark:hover:bg-red-500/20 dark:border-white/10 hover:border-red-400/50 text-[#0c1b33]/70 dark:text-white/70 hover:text-red-700 dark:hover:text-red-300 font-bold text-xs">
                          Cancel renewals
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Payment Gateway Information */}
                <div className="p-6 rounded-3xl bg-white dark:bg-white/[0.03] border border-black/10 dark:border-white/10 space-y-4 shadow-sm dark:shadow-none transition-colors">
                  <h3 className="font-brand text-lg font-bold text-[#0c1b33] dark:text-white">Payment Method & Security</h3>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/10 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-[#0c1b33] dark:text-white text-sm block">
                          {subscriptionData?.payment_provider === "paypal" ? "PayPal Express Checkout" : "Paystack M-Pesa / Card Gateway"}
                        </span>
                        <span className="text-xs text-[#0c1b33]/60 dark:text-white/50">
                          Ref: {subscriptionData?.payment_reference || "KMN-SUB-84920"}
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
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

                {/* 24/7 subscription help — call or SMS for any query / complaint */}
                <PartnershipSupportCard />
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
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-[#d4af37]/30 text-left space-y-2 mb-4">
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

              {/* Immediate Next Steps in Portal */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-left space-y-1.5 mb-6">
                <div className="text-[11px] font-bold text-[#fbf5b7] uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Your Partner Privileges Are Active:</span>
                </div>
                <div className="space-y-1 text-xs text-white/80">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Digital ID Card &amp; QR verification seal generated</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>24/7 Priority Pastoral Prayer Altar ready for your petitions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Prophetic audio briefings &amp; mission field digests unlocked</span>
                  </div>
                </div>
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

      {/* Official Tax Invoice & Giving Receipt Modal */}
      {selectedInvoice && (
        <OfficialInvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Annual Tax Statement Preview Modal */}
      {statementPreview && (
        <AnnualStatementModal
          statement={statementPreview}
          onClose={() => setStatementPreview(null)}
        />
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
