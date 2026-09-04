import { useState, useEffect, useMemo } from "react";
import SEO from "../components/SEO";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  CalendarDays,
  CalendarPlus,
  Clock,
  MapPin,
  Video,
  Users,
  ArrowRight,
  Globe,
  Search,
  LayoutList,
  Share2,
  Ticket,
  Crown,
  X,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import ScrollReveal from "../components/ScrollReveal";
import AmbientParticles from "../components/AmbientParticles";
import { api } from "../lib/api";
import type { Event } from "../data/demoData";
import { useToast } from "../lib/toast";

/* ---------- helpers ---------- */

function parseEventDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  if (y && m && d) return new Date(y, m - 1, d);
  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isUpcoming(event: Event, today: Date): boolean {
  return parseEventDate(event.date).getTime() >= today.getTime();
}

function downloadICS(event: Event) {
  const start = event.date.replace(/-/g, "");
  const end = new Date(parseEventDate(event.date).getTime() + 86400000);
  const endStr = `${end.getFullYear()}${String(end.getMonth() + 1).padStart(2, "0")}${String(
    end.getDate()
  ).padStart(2, "0")}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kingdom Missions Network//Events//EN",
    "BEGIN:VEVENT",
    `UID:event-${event.id}@kingdommissionsnetwork.org`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${endStr}`,
    `SUMMARY:${event.title}`,
    `LOCATION:${event.location}`,
    `DESCRIPTION:${(event.dateRange ? event.dateRange + " — " : "") + event.description}`.slice(0, 500),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function useCountdown(targetDate: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!targetDate) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [targetDate]);
  if (!targetDate) return null;
  const diff = Math.max(0, parseEventDate(targetDate).getTime() - now);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    live: diff === 0,
  };
}

/* ---------- page ---------- */

type ViewMode = "list" | "calendar";
type FormatFilter = "all" | "in-person" | "online";

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState<FormatFilter>("all");
  const [view, setView] = useState<ViewMode>("list");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [rsvpForm, setRsvpForm] = useState({ name: "", email: "" });
  const { showToast } = useToast();

  useEffect(() => {
    api.events
      .list()
      .then((data) => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const today = useMemo(() => startOfToday(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (formatFilter === "online" && !e.isOnline) return false;
      if (formatFilter === "in-person" && e.isOnline) return false;
      if (!q) return true;
      return [e.title, e.location, e.description].some((f) => f?.toLowerCase().includes(q));
    });
  }, [events, query, formatFilter]);

  const upcoming = useMemo(
    () =>
      filtered
        .filter((e) => isUpcoming(e, today))
        .sort((a, b) => parseEventDate(a.date).getTime() - parseEventDate(b.date).getTime()),
    [filtered, today]
  );
  const past = useMemo(
    () =>
      filtered
        .filter((e) => !isUpcoming(e, today))
        .sort((a, b) => parseEventDate(b.date).getTime() - parseEventDate(a.date).getTime()),
    [filtered, today]
  );

  const featured = upcoming[0] ?? null;
  const countdown = useCountdown(featured ? featured.date : null);

  const monthPills = useMemo(() => {
    const seen = new Map<string, Date>();
    for (const e of upcoming) {
      const d = parseEventDate(e.date);
      const key = format(d, "MMM yyyy");
      if (!seen.has(key)) seen.set(key, new Date(d.getFullYear(), d.getMonth(), 1));
      if (seen.size >= 4) break;
    }
    return [...seen.entries()];
  }, [upcoming]);

  const nations = useMemo(() => {
    const set = new Set(events.map((e) => e.location));
    return set.size;
  }, [events]);

  /* calendar grid */
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const isEventOnDate = (event: Event, targetDate: Date) => {
    const t = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
    const s = parseEventDate(event.date).getTime();
    if (event.endDate) return t >= s && t <= parseEventDate(event.endDate).getTime();
    return t === s;
  };
  const eventsForDate = (date: Date) => filtered.filter((e) => isEventOnDate(e, date));

  const handleRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpForm.name || !rsvpForm.email) {
      showToast("Please fill in all fields", "error");
      return;
    }
    if (!selectedEvent) return;
    try {
      const numId = Number(selectedEvent.id) || 1;
      await api.events.rsvp(numId, rsvpForm.name, rsvpForm.email);
      showToast(`RSVP confirmed for ${selectedEvent.title}!`, "success");
    } catch {
      showToast("Failed to RSVP. Please try again.", "error");
    }
    setRsvpForm({ name: "", email: "" });
    setSelectedEvent(null);
  };

  const shareEvent = async (event: Event) => {
    const url = `${window.location.origin}/events`;
    const text = `${event.title} — ${event.dateRange || format(parseEventDate(event.date), "MMM d, yyyy")} at ${event.location}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text, url });
      } catch {
        /* dismissed */
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        showToast("Event link copied to clipboard", "success");
      } catch {
        showToast("Unable to share right now", "error");
      }
    }
  };

  const jumpToMonth = (monthDate: Date) => {
    setCurrentMonth(monthDate);
    setSelectedDate(null);
    setView("calendar");
  };

  return (
    <div className="pt-[72px] md:pt-[108px] min-h-screen bg-white">
      <SEO
        title="Events & Global Summits"
        description="Join our global events — conferences, gospel missions, worship nights, and prayer summits. Browse upcoming gatherings, RSVP free, and add them to your calendar."
      />

      {/* ---------- HERO ---------- */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1b33] via-[#071324] to-[#1a1107] px-4 pt-14 pb-10 lg:pt-20 lg:pb-14">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(249,115,22,0.18)_0%,transparent_65%)] pointer-events-none blur-3xl" />
        <div className="absolute bottom-0 left-10 w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(212,175,55,0.20)_0%,transparent_65%)] pointer-events-none blur-3xl" />
        <AmbientParticles />

        <div className="container-main mx-auto relative z-10 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-[#d4af37]/40 text-[#fbf5b7] text-xs font-semibold mb-4 backdrop-blur-md">
            <Globe className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Global Summits, International Missions & Revivals</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
            Kingdom{" "}
            <span className="bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] bg-clip-text text-transparent">
              Events & Missions
            </span>
          </h1>
          <p className="text-white/80 text-base md:text-xl max-w-2xl mx-auto leading-relaxed mb-8">
            Apostolic conferences, revival crusades, and worship gatherings around the world.
            Find a gathering near you — or join online — and RSVP in under a minute.
          </p>

          {/* search + view toggle */}
          <div className="flex flex-col sm:flex-row items-stretch gap-3 max-w-2xl mx-auto">
            <label className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, city, or keyword…"
                aria-label="Search events"
                className="w-full pl-12 pr-4 py-3.5 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-sm backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-[#d4af37]/60"
              />
            </label>
            <div
              className="flex items-center rounded-full bg-white/10 border border-white/20 p-1 backdrop-blur-md"
              role="tablist"
              aria-label="Change layout"
            >
              {(
                [
                  { mode: "list" as ViewMode, icon: LayoutList, label: "List view" },
                  { mode: "calendar" as ViewMode, icon: CalendarDays, label: "Calendar view" },
                ]
              ).map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  role="tab"
                  aria-selected={view === mode}
                  title={label}
                  aria-label={label}
                  onClick={() => setView(mode)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold transition-all ${
                    view === mode ? "bg-[#d4af37] text-[#0c1b33]" : "text-white/70 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{mode === "list" ? "List" : "Calendar"}</span>
                </button>
              ))}
            </div>
          </div>

          {/* format filters + stats */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            {(
              [
                { value: "all" as FormatFilter, label: "All gatherings" },
                { value: "in-person" as FormatFilter, label: "In person" },
                { value: "online" as FormatFilter, label: "Online" },
              ]
            ).map((f) => (
              <button
                key={f.value}
                onClick={() => setFormatFilter(f.value)}
                aria-pressed={formatFilter === f.value}
                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                  formatFilter === f.value
                    ? "bg-white text-[#0c1b33] border-white"
                    : "bg-transparent text-white/80 border-white/25 hover:border-[#d4af37]/60 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {!loading && (
            <div className="flex items-center justify-center gap-2 mt-6 text-xs text-white/60 font-medium">
              <Ticket className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>
                {upcoming.length} upcoming gathering{upcoming.length === 1 ? "" : "s"}
                {nations > 0 && ` · ${nations} ${nations === 1 ? "location" : "locations"}`} · Free RSVP
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="container-main mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <EventsSkeleton />
        ) : (
          <>
            {/* ---------- FEATURED ---------- */}
            {featured && (
              <ScrollReveal>
                <section aria-label="Featured gathering" className="mb-12">
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1b33] via-[#101f3a] to-[#1a1107] border border-[#d4af37]/25 shadow-xl">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-[radial-gradient(circle,rgba(212,175,55,0.25)_0%,transparent_65%)] pointer-events-none blur-3xl" />
                    <div className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-0">
                      <div className="relative bg-black/40 flex items-center justify-center p-6 md:p-8">
                        <img
                          src={featured.image}
                          alt={`${featured.title} poster`}
                          className="w-full max-w-[320px] max-h-[420px] object-contain rounded-xl shadow-2xl ring-1 ring-white/20"
                          loading="eager"
                        />
                        {featured.badge && (
                          <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#d4af37] text-[#0c1b33] text-[11px] font-bold uppercase tracking-wider shadow">
                            {featured.badge}
                          </span>
                        )}
                      </div>
                      <div className="p-6 sm:p-8 md:p-10 flex flex-col justify-center">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d4af37] mb-2">
                          Featured gathering
                        </p>
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight mb-3">
                          {featured.title}
                        </h2>
                        {countdown && !countdown.live && (
                          <div className="flex items-center gap-2 mb-4" aria-label="Countdown to event">
                            {[
                              { v: countdown.days, l: "days" },
                              { v: countdown.hours, l: "hrs" },
                              { v: countdown.minutes, l: "min" },
                              { v: countdown.seconds, l: "sec" },
                            ].map((u) => (
                              <div
                                key={u.l}
                                className="min-w-[58px] text-center px-2 py-1.5 rounded-lg bg-white/10 border border-white/15 backdrop-blur-sm"
                              >
                                <p className="font-display text-xl font-bold text-[#fbf5b7] tabular-nums leading-none">
                                  {String(u.v).padStart(2, "0")}
                                </p>
                                <p className="text-[10px] uppercase tracking-wider text-white/60 mt-0.5">{u.l}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/80 mb-4">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-[#d4af37]" />
                            {featured.dateRange || format(parseEventDate(featured.date), "MMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-[#d4af37]" />
                            {featured.time} {featured.timezone}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-[#d4af37]" />
                            {featured.location}
                            {featured.isOnline && " · Online"}
                          </span>
                        </div>
                        <p className="text-white/75 text-sm md:text-base leading-relaxed mb-6 line-clamp-4">
                          {featured.description}
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => setSelectedEvent(featured)}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c5961d] text-[#0c1b33] font-bold text-sm hover:shadow-[0_0_20px_rgba(212,175,55,0.45)] transition-all"
                          >
                            <Ticket className="w-4 h-4" />
                            RSVP free
                          </button>
                          <button
                            onClick={() => {
                              downloadICS(featured);
                              showToast("Added to your calendar file — open it to save", "success");
                            }}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-white/25 text-white text-sm font-semibold hover:border-[#d4af37]/70 hover:text-[#fbf5b7] transition-all"
                          >
                            <CalendarPlus className="w-4 h-4" />
                            Add to calendar
                          </button>
                          <button
                            onClick={() => shareEvent(featured)}
                            aria-label="Share this gathering"
                            className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-white/25 text-white hover:border-[#d4af37]/70 hover:text-[#fbf5b7] transition-all"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </ScrollReveal>
            )}

            {/* ---------- MONTH QUICK JUMPS ---------- */}
            {monthPills.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 mb-8" aria-label="Jump to month">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6b7c93] mr-1">Jump to:</span>
                {monthPills.map(([label, monthDate]) => (
                  <button
                    key={label}
                    onClick={() => jumpToMonth(monthDate)}
                    className="px-4 py-1.5 rounded-full bg-[#f8f6f3] border border-[#0c1b33]/10 text-xs font-bold text-[#0c1b33] hover:border-[#d4af37] hover:bg-[#d4af37]/10 transition-all"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {view === "list" ? (
              <>
                {/* ---------- UPCOMING LIST ---------- */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-2xl font-semibold text-[#0c1b33]">
                    Upcoming gatherings
                  </h2>
                  <span className="text-xs font-semibold text-[#6b7c93]">
                    {upcoming.length} event{upcoming.length === 1 ? "" : "s"}
                  </span>
                </div>

                {upcoming.length === 0 ? (
                  <div className="text-center py-14 bg-[#f8f6f3] rounded-3xl border border-[#0c1b33]/5 px-6">
                    <Calendar className="w-12 h-12 text-[#6b7c93]/40 mx-auto mb-4" />
                    <h3 className="font-display text-xl font-semibold text-[#0c1b33] mb-2">
                      {query || formatFilter !== "all"
                        ? "No gatherings match your search"
                        : "New gatherings are on the way"}
                    </h3>
                    <p className="text-sm text-[#6b7c93] max-w-md mx-auto mb-5">
                      {query || formatFilter !== "all"
                        ? "Try a different keyword or clear the filters to see everything."
                        : "Check back soon — or partner with us to help bring the next mission to your city."}
                    </p>
                    {(query || formatFilter !== "all") && (
                      <button
                        onClick={() => {
                          setQuery("");
                          setFormatFilter("all");
                        }}
                        className="px-5 py-2.5 rounded-full bg-[#0c1b33] text-white text-sm font-semibold hover:bg-[#1a2d4d] transition-colors"
                      >
                        Clear search & filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcoming.map((event, index) => {
                      const d = parseEventDate(event.date);
                      return (
                        <ScrollReveal key={event.id} delay={Math.min(index, 4) * 60}>
                          <div
                            onClick={() => setSelectedEvent(event)}
                            onKeyDown={(e) => e.key === "Enter" && setSelectedEvent(event)}
                            tabIndex={0}
                            role="button"
                            aria-label={`View details for ${event.title}`}
                            className="group grid grid-cols-[auto_1fr] sm:grid-cols-[auto_180px_1fr_auto] items-center gap-4 bg-white rounded-2xl border border-[#0c1b33]/10 p-4 sm:p-5 cursor-pointer hover:shadow-lg hover:border-[#d4af37]/50 transition-all focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                          >
                            <div className="bg-gradient-to-b from-[#0c1b33] to-[#1a2d4d] rounded-xl px-3 py-2 text-center min-w-[62px] shadow-sm">
                              <p className="text-[10px] font-bold text-[#d4af37] uppercase tracking-wider">
                                {event.month || format(d, "MMM").toUpperCase()}
                              </p>
                              <p className="text-2xl font-bold text-white font-display leading-tight">
                                {event.day || format(d, "d")}
                              </p>
                            </div>
                            <div className="hidden sm:block relative h-24 w-[180px] rounded-xl overflow-hidden">
                              <img
                                src={event.image}
                                alt=""
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              {event.isOnline && (
                                <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-[#d4af37] text-[#0c1b33] text-[10px] font-bold flex items-center gap-1">
                                  <Video className="w-3 h-3" />
                                  Online
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 col-span-1 sm:col-span-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="font-semibold text-base sm:text-lg text-[#0c1b33] group-hover:text-[#8b5e3c] transition-colors line-clamp-1">
                                  {event.title}
                                </h3>
                                {event.badge && (
                                  <span className="px-2 py-0.5 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#996515] text-[10px] font-bold uppercase tracking-wide">
                                    {event.badge}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-[#6b7c93]">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                                  {event.dateRange || format(d, "EEEE, MMM d, yyyy")} · {event.time}{" "}
                                  {event.timezone}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                                  {event.location}
                                </span>
                              </div>
                            </div>
                            <span className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0c1b33] text-white text-xs font-bold group-hover:bg-[#d4af37] group-hover:text-[#0c1b33] transition-colors">
                              Details
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </ScrollReveal>
                      );
                    })}
                  </div>
                )}

                {/* ---------- PAST ---------- */}
                {past.length > 0 && (
                  <div className="mt-10">
                    <button
                      onClick={() => setShowPast((v) => !v)}
                      aria-expanded={showPast}
                      className="flex items-center gap-2 text-sm font-bold text-[#6b7c93] hover:text-[#0c1b33] transition-colors"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${showPast ? "rotate-180" : ""}`}
                      />
                      Past gatherings ({past.length})
                    </button>
                    {showPast && (
                      <div className="mt-4 space-y-3 opacity-80">
                        {past.map((event) => {
                          const d = parseEventDate(event.date);
                          return (
                            <div
                              key={event.id}
                              className="flex items-center gap-4 bg-[#f8f6f3] rounded-2xl border border-[#0c1b33]/5 p-4"
                            >
                              <div className="bg-white rounded-xl px-3 py-2 text-center min-w-[62px] border border-[#0c1b33]/10">
                                <p className="text-[10px] font-bold text-[#8b5e3c] uppercase">
                                  {event.month || format(d, "MMM").toUpperCase()}
                                </p>
                                <p className="text-xl font-bold text-[#0c1b33] font-display">
                                  {event.day || format(d, "d")}
                                </p>
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-semibold text-sm text-[#0c1b33] line-clamp-1">
                                  {event.title}
                                </h3>
                                <p className="text-xs text-[#6b7c93] flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {event.location} · {format(d, "yyyy")}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <CalendarPanel
                days={days}
                monthStart={monthStart}
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                eventsForDate={eventsForDate}
                filtered={filtered}
                setSelectedEvent={setSelectedEvent}
              />
            )}
          </>
        )}
      </div>

      {/* ---------- DETAILS MODAL ---------- */}
      <AnimatePresence>
        {selectedEvent && (
          <EventModal
            event={selectedEvent}
            onClose={() => {
              setSelectedEvent(null);
              setRsvpForm({ name: "", email: "" });
            }}
            rsvpForm={rsvpForm}
            setRsvpForm={setRsvpForm}
            handleRsvp={handleRsvp}
            onShare={() => shareEvent(selectedEvent)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- loading skeleton ---------- */

function EventsSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading events">
      <div className="h-64 bg-[#e6eef7] rounded-3xl animate-pulse" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 border border-[#0c1b33]/5 flex gap-4">
          <div className="w-[62px] h-[68px] bg-[#e6eef7] rounded-xl animate-pulse shrink-0" />
          <div className="space-y-2 flex-1 py-1">
            <div className="h-4 w-2/3 bg-[#e6eef7] rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-[#e6eef7] rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- calendar panel ---------- */

function CalendarPanel({
  days,
  monthStart,
  currentMonth,
  setCurrentMonth,
  selectedDate,
  setSelectedDate,
  eventsForDate,
  filtered,
  setSelectedEvent,
}: {
  days: Date[];
  monthStart: Date;
  currentMonth: Date;
  setCurrentMonth: (d: Date) => void;
  selectedDate: Date | null;
  setSelectedDate: (d: Date | null) => void;
  eventsForDate: (d: Date) => Event[];
  filtered: Event[];
  setSelectedEvent: (e: Event) => void;
}) {
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <ScrollReveal className="lg:col-span-2">
        <div className="bg-white rounded-3xl shadow-sm border border-[#0c1b33]/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 rounded-lg hover:bg-[#e6eef7] transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5 text-[#0c1b33]" />
            </button>
            <h2 className="font-display text-2xl font-semibold text-[#0c1b33]">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 rounded-lg hover:bg-[#e6eef7] transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5 text-[#0c1b33]" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-[#6b7c93] uppercase tracking-wider py-2"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              const isCurrentMonth = isSameMonth(d, monthStart);
              const isToday = isSameDay(d, new Date());
              const isSelected = selectedDate && isSameDay(d, selectedDate);
              const dayEvents = eventsForDate(d);
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(d)}
                  aria-label={`${format(d, "MMMM d, yyyy")}${dayEvents.length ? `, ${dayEvents.length} events` : ""}`}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-start pt-2 transition-all focus:outline-none focus:ring-2 focus:ring-[#d4af37] ${
                    isSelected
                      ? "bg-[#d4af37]/20 ring-2 ring-[#d4af37]"
                      : isToday
                      ? "bg-[#0c1b33] text-white"
                      : dayEvents.length > 0
                      ? "bg-[#d4af37]/10 text-[#0c1b33] font-semibold hover:bg-[#d4af37]/20"
                      : isCurrentMonth
                      ? "hover:bg-[#f8f6f3] text-[#0c1b33]"
                      : "text-[#6b7c93]/40"
                  }`}
                >
                  <span className={`text-sm font-medium ${isToday && !isSelected ? "text-white" : ""}`}>
                    {format(d, "d")}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-1" aria-hidden="true">
                      {dayEvents.slice(0, 3).map((_, j) => (
                        <span key={j} className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </ScrollReveal>

      <div>
        <ScrollReveal>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-semibold text-[#0c1b33]">
              {selectedDate ? `Events — ${format(selectedDate, "MMM d, yyyy")}` : "All gatherings"}
            </h3>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="text-xs text-[#8b5e3c] hover:underline font-medium"
              >
                Show all
              </button>
            )}
          </div>
        </ScrollReveal>

        <div className="space-y-4">
          {(selectedDate ? eventsForDate(selectedDate) : filtered).length === 0 ? (
            <div className="text-center py-8 bg-[#f8f6f3] rounded-2xl p-6">
              <Calendar className="w-10 h-10 text-[#6b7c93] mx-auto mb-3" />
              <p className="text-[#6b7c93]">
                {selectedDate ? "No gatherings on this day." : "No gatherings found."}
              </p>
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate(null)}
                  className="mt-3 text-xs text-[#8b5e3c] font-bold hover:underline"
                >
                  View all gatherings
                </button>
              )}
            </div>
          ) : (
            (selectedDate ? eventsForDate(selectedDate) : filtered).map((event, index) => (
              <ScrollReveal key={event.id} delay={Math.min(index, 4) * 80}>
                <motion.button
                  whileHover={{ y: -2 }}
                  onClick={() => setSelectedEvent(event)}
                  className="w-full text-left bg-[#f8f6f3] rounded-2xl overflow-hidden hover:shadow-md transition-shadow border border-[#0c1b33]/5 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                >
                  <div className="relative h-36">
                    <img
                      src={event.image}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                    {event.badge && (
                      <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-[#0c1b33]/85 text-[#fbf5b7] border border-[#d4af37]/40 text-[10px] font-bold">
                        {event.badge}
                      </div>
                    )}
                    {event.isOnline && (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-[#d4af37] text-[#0c1b33] text-[10px] font-bold flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        Online
                      </div>
                    )}
                    {event.dateRange && (
                      <div className="absolute bottom-2 left-3 text-white text-xs font-semibold drop-shadow flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>{event.dateRange}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-white rounded-lg px-2.5 py-1.5 text-center flex-shrink-0 shadow-sm border border-[#0c1b33]/5">
                        <p className="text-[10px] font-bold text-[#8b5e3c] uppercase">{event.month}</p>
                        <p className="text-lg font-bold text-[#0c1b33] font-display">{event.day}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm sm:text-base text-[#0c1b33] mb-1 line-clamp-1">
                          {event.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#6b7c93]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#d4af37]" />
                            {event.time} {event.timezone}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#d4af37]" />
                            {event.location}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#0c1b33]/5 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#8b5e3c]">Click for RSVP & Details</span>
                      <span className="text-xs font-bold text-[#d4af37] flex items-center gap-1">
                        Partner <Crown className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </motion.button>
              </ScrollReveal>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- details modal ---------- */

function EventModal({
  event,
  onClose,
  rsvpForm,
  setRsvpForm,
  handleRsvp,
  onShare,
}: {
  event: Event;
  onClose: () => void;
  rsvpForm: { name: string; email: string };
  setRsvpForm: (f: { name: string; email: string }) => void;
  handleRsvp: (e: React.FormEvent) => void;
  onShare: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const eventDate = parseEventDate(event.date);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={event.title}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 12 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="relative shrink-0 bg-[#0c1b33] flex justify-center max-h-[300px] overflow-hidden">
          <img
            src={event.image}
            alt={`${event.title} poster`}
            className="w-full max-h-[300px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
          <button
            onClick={onClose}
            aria-label="Close details"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-4 right-4">
            {event.badge && (
              <span className="inline-block px-2 py-0.5 rounded-full bg-[#d4af37] text-[#0c1b33] text-[10px] font-bold uppercase tracking-wider mb-1.5">
                {event.badge}
              </span>
            )}
            <h3 className="font-display text-xl sm:text-2xl font-bold text-white leading-tight">
              {event.title}
            </h3>
          </div>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
            {[
              { icon: Calendar, label: "Date", value: event.dateRange || format(eventDate, "MMM d, yyyy") },
              { icon: Clock, label: "Time", value: `${event.time} ${event.timezone}` },
              {
                icon: event.isOnline ? Video : MapPin,
                label: event.isOnline ? "Format" : "Venue",
                value: event.isOnline ? `Online · ${event.location}` : event.location,
              },
            ].map((f) => (
              <div key={f.label} className="rounded-xl bg-[#f8f6f3] border border-[#0c1b33]/5 p-3">
                <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#8b5e3c] mb-1">
                  <f.icon className="w-3.5 h-3.5 text-[#d4af37]" />
                  {f.label}
                </p>
                <p className="text-xs font-semibold text-[#0c1b33] leading-snug">{f.value}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-[#0c1b33] mb-5 leading-relaxed">{event.description}</p>

          <div className="flex gap-2.5 mb-5">
            <button
              onClick={() => downloadICS(event)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-[#0c1b33]/15 text-xs font-bold text-[#0c1b33] hover:border-[#d4af37] hover:bg-[#d4af37]/10 transition-all"
            >
              <CalendarPlus className="w-4 h-4 text-[#d4af37]" />
              Add to calendar
            </button>
            <button
              onClick={onShare}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-[#0c1b33]/15 text-xs font-bold text-[#0c1b33] hover:border-[#d4af37] hover:bg-[#d4af37]/10 transition-all"
            >
              <Share2 className="w-4 h-4 text-[#d4af37]" />
              Share gathering
            </button>
          </div>

          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-[#0c1b33] to-[#1a1107] text-white border border-[#d4af37]/40">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] uppercase font-bold text-[#d4af37] tracking-wider flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
                Kingdom Mission Partner Opportunity
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                Open
              </span>
            </div>
            <p className="text-xs text-white/80 leading-relaxed mb-3">
              Support venues, delegate transport, pastors&apos; training, and Bible distributions
              through monthly partnership tiers.
            </p>
            <a
              href="/subscribe"
              className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c5961d] text-[#0c1b33] font-bold text-xs flex items-center justify-center gap-1.5 hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all"
            >
              <Crown className="w-3.5 h-3.5 text-[#0c1b33]" />
              <span>View Kingdom Partnership Packages</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="border-t border-[#0c1b33]/10 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0c1b33] mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#d4af37]" />
              RSVP to attend — it&apos;s free
            </h4>
            <form onSubmit={handleRsvp} className="space-y-3">
              <input
                type="text"
                placeholder="Your full name"
                value={rsvpForm.name}
                onChange={(e) => setRsvpForm({ ...rsvpForm, name: e.target.value })}
                aria-label="Your full name"
                className="w-full px-4 py-2.5 rounded-lg border border-[#0c1b33]/10 bg-[#f8f6f3] focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
              />
              <input
                type="email"
                placeholder="Your email address"
                value={rsvpForm.email}
                onChange={(e) => setRsvpForm({ ...rsvpForm, email: e.target.value })}
                aria-label="Your email address"
                className="w-full px-4 py-2.5 rounded-lg border border-[#0c1b33]/10 bg-[#f8f6f3] focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
              />
              <button
                type="submit"
                className="w-full btn-gold flex items-center justify-center gap-2 text-sm"
              >
                <Users className="w-4 h-4" />
                Confirm RSVP
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
