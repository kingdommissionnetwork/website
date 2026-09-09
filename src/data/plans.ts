/**
 * Kingdom Missions Network — Frontend plan catalog (single source of truth).
 *
 * Price truth lives server-side in `backend/src/lib/plans.ts`.
 * Keep `kesMonthly` values in sync with `PARTNER_PLAN_CATALOG` there:
 * seed=1000, ambassador=3000, harvest=7500, pillar=20000.
 * Display-only fields (badges, perks, copy) live here.
 */

/** Annual billing discount — must match backend `ANNUAL_DISCOUNT`. */
export const ANNUAL_DISCOUNT = 0.15;

/** Fallback KES→USD rate when live pricing is unavailable. */
export const USD_FALLBACK_RATE = 0.00772;

export function yearlyPriceFromMonthly(monthlyKes: number): number {
  return Math.round(monthlyKes * 12 * (1 - ANNUAL_DISCOUNT));
}

export function kesToUsd(kes: number, rate = USD_FALLBACK_RATE): number {
  return Number((kes * rate).toFixed(2));
}

export interface PartnerPlan {
  id: string;
  name: string;
  badge: string;
  kesMonthly: number;
  description: string;
  isPopular?: boolean;
  tagline: string;
  impactHighlight: string;
  perks: string[];
}

export const PARTNER_PLANS: PartnerPlan[] = [
  {
    id: "seed",
    name: "Seed Partner",
    badge: "🌱 Seed Partner",
    kesMonthly: 1000,
    tagline: "Foundational Mission & Bread Support",
    description:
      "Sow into frontline evangelism, gospel bread relief for vulnerable families, and Holy Bible distribution.",
    impactHighlight:
      "Feeds 2 vulnerable families & supplies 1 Holy Bible to new converts each month.",
    perks: [
      "Official Digital Partner Membership Certificate",
      "Name & Family listed on 24/7 Global Intercessory Altar",
      "Monthly Mission Impact Digest & Financial Report",
      "Access to partner devotional library & study plans",
      "Interactive Partner Dashboard & giving history",
    ],
  },
  {
    id: "ambassador",
    name: "Kingdom Ambassador",
    badge: "👑 Kingdom Ambassador",
    kesMonthly: 3000,
    isPopular: true,
    tagline: "Outreach Crusades & Field Deployment",
    description:
      "Directly sponsor village crusades, church planting, and qualify for official mission delegation travel.",
    impactHighlight:
      "Funds village crusade sound equipment & regional evangelist mobilization.",
    perks: [
      "Official Kingdom Missions Network Partner ID Card",
      "Priority Selection for Mission Travel Teams & Global Crusades",
      "Monthly Live Prophetic Briefing with Bishop Dr. George Githinji",
      "Dedicated 24/7 Urgent Pastoral Prayer WhatsApp Line",
      "Reserved Partner Seating at all KMN Summits & Conferences",
      "All Seed Partner perks included",
    ],
  },
  {
    id: "harvest",
    name: "Global Harvest Partner",
    badge: "🌍 Global Harvest Partner",
    kesMonthly: 7500,
    tagline: "International Itineraries & Ministry Logistical Backing",
    description:
      "Empower international missionary travel, satellite broadcasts, and receive itinerary facilitation for overseas ministry.",
    impactHighlight:
      "Establishes permanent regional mission bases & international crusades.",
    perks: [
      "International Preaching Logistics & Pastoral Network Facilitation (KMN connects you with vetted pastoral bodies abroad & helps arrange meeting logistics)",
      "Official Ministry Ambassador Credential Endorsement",
      "Quarterly Private Executive Roundtable with Bishop George",
      "VIP Access & Reserved Platform Seating at all Global Summits",
      "Direct sponsorship recognition in KMN broadcast credits",
      "All Kingdom Ambassador perks included",
    ],
  },
  {
    id: "pillar",
    name: "Covenant Pillar",
    badge: "🏛️ Covenant Pillar",
    kesMonthly: 20000,
    tagline: "Strategic Vision & Global Expansion",
    description:
      "Lead major kingdom expansion initiatives, television broadcasting, and strategic disaster relief.",
    impactHighlight:
      "Sponsors city-wide stadium crusades and multi-nation satellite broadcasts.",
    perks: [
      "Advisory Seat on KMN Global Missions Strategy Council",
      "Personalized Physical Gold-Plated Partner Seal & Ordination Letter",
      "Comprehensive International Preaching Delegation Logistics Coordination",
      "Personal Monthly Pastoral Prayer Covenant with Bishop Dr. George Githinji",
      "Executive Briefing & Strategy Access on upcoming mission frontiers",
      "All Global Harvest perks included",
    ],
  },
];

export interface PartnerTierInfo extends PartnerPlan {
  usdMonthly: number;
}

/** Record view for dashboards keyed by plan id (USD at fallback rate). */
export const PARTNER_TIERS: Record<string, PartnerTierInfo> = Object.fromEntries(
  PARTNER_PLANS.map((p) => [p.id, { ...p, usdMonthly: kesToUsd(p.kesMonthly) }]),
);

export function getPartnerPlan(id: string | undefined | null): PartnerPlan {
  return PARTNER_PLANS.find((p) => p.id === id) ?? PARTNER_PLANS[1];
}

export function getPartnerTier(id: string | undefined | null): PartnerTierInfo {
  const plan = getPartnerPlan(id);
  return { ...plan, usdMonthly: kesToUsd(plan.kesMonthly) };
}
