import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  ChevronDown,
  Crown,
  ArrowRight,
  Globe,
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

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [rsvpForm, setRsvpForm] = useState({ name: "", email: "" });
  const { showToast } = useToast();

  useEffect(() => {
    api.events.list().then((data) => {
      setEvents(data);
      setLoading(false);
    }).catch(() => { setLoading(false); });
  }, []);

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
    const targetTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
    const [sY, sM, sD] = event.date.split("-").map(Number);
    const startTime = new Date(sY, sM - 1, sD).getTime();
    if (event.endDate) {
      const [eY, eM, eD] = event.endDate.split("-").map(Number);
      const endTime = new Date(eY, eM - 1, eD).getTime();
      return targetTime >= startTime && targetTime <= endTime;
    }
    return targetTime === startTime;
  };

  const eventsForDate = (date: Date) =>
    events.filter((e) => isEventOnDate(e, date));

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

  const jumpToMonth = (year: number, monthIndex: number) => {
    setCurrentMonth(new Date(year, monthIndex, 1));
    setSelectedDate(null);
  };

  return (
    <div className="pt-[72px] md:pt-[108px] min-h-screen bg-white">
      <SEO title="Events & Global Summits" description="Join our global events — Zimbabwe Conference, Pakistan Gospel Mission, New Dawn Mombasa, worship nights, and prayer summits." />
      
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1b33] via-[#071324] to-[#1a1107] py-16 lg:py-20 px-4">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(249,115,22,0.18)_0%,transparent_65%)] pointer-events-none blur-3xl" />
        <div className="absolute bottom-0 left-10 w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(212,175,55,0.20)_0%,transparent_65%)] pointer-events-none blur-3xl" />

        <AmbientParticles />

        <div className="container-main mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-[#d4af37]/40 text-[#fbf5b7] text-xs font-semibold mb-4 backdrop-blur-md">
            <Globe className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Global Summits, International Missions & Revivals</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
            Kingdom <span className="bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] bg-clip-text text-transparent">Events & Missions</span>
          </h1>
          <p className="text-white/80 text-base md:text-xl max-w-2xl mx-auto leading-relaxed">
            Join believers worldwide for apostolic conferences, revival crusades, and worship gatherings. Register to attend or partner to sponsor the global harvest.
          </p>

          {/* Quick Summit Jump Navigation Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            <button
              onClick={() => jumpToMonth(2026, 9)}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-[#d4af37] hover:text-[#0c1b33] text-white border border-[#d4af37]/40 text-xs font-bold transition-all flex items-center gap-1.5 backdrop-blur-md"
            >
              <span>🇿🇼</span>
              <span>Zimbabwe (Oct 6–10, 2026)</span>
            </button>
            <button
              onClick={() => jumpToMonth(2026, 11)}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-[#d4af37] hover:text-[#0c1b33] text-white border border-[#d4af37]/40 text-xs font-bold transition-all flex items-center gap-1.5 backdrop-blur-md"
            >
              <span>🇵🇰</span>
              <span>Pakistan (Dec 1–6, 2026)</span>
            </button>
            <button
              onClick={() => jumpToMonth(2027, 2)}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-[#d4af37] hover:text-[#0c1b33] text-white border border-[#d4af37]/40 text-xs font-bold transition-all flex items-center gap-1.5 backdrop-blur-md"
            >
              <span>🇰🇪</span>
              <span>New Dawn Mombasa (Mar 12–14, 2027)</span>
            </button>
            <Link
              to="/subscribe"
              className="px-4 py-2 rounded-full bg-gradient-to-r from-[#d4af37] to-[#c5961d] text-[#0c1b33] font-bold text-xs shadow-md hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all flex items-center gap-1.5"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Partner Packages</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="container-main mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-[#0c1b33]/5 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="h-8 w-8 bg-[#e6eef7] rounded-lg animate-pulse" />
                  <div className="h-6 w-40 bg-[#e6eef7] rounded animate-pulse" />
                  <div className="h-8 w-8 bg-[#e6eef7] rounded-lg animate-pulse" />
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-[#e6eef7] rounded-lg animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-[#0c1b33]/5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-[#e6eef7] rounded-xl animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 w-3/4 bg-[#e6eef7] rounded animate-pulse" />
                      <div className="h-3 w-1/2 bg-[#e6eef7] rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <ScrollReveal className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-[#0c1b33]/10 p-6">
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
                    <div key={d} className="text-center text-xs font-medium text-[#6b7c93] uppercase tracking-wider py-2">
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
                        className={`relative aspect-square rounded-xl flex flex-col items-center justify-start pt-2 transition-all ${
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
                          <div className="flex gap-0.5 mt-1">
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
                    {selectedDate
                      ? `Events — ${format(selectedDate, "MMM d, yyyy")}`
                      : "Upcoming Missions & Events"}
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
                {(selectedDate ? eventsForDate(selectedDate) : events).length === 0 ? (
                  <div className="text-center py-8 bg-[#f8f6f3] rounded-2xl p-6">
                    <Calendar className="w-10 h-10 text-[#6b7c93] mx-auto mb-3" />
                    <p className="text-[#6b7c93]">No events scheduled on this day.</p>
                    <button
                      onClick={() => setSelectedDate(null)}
                      className="mt-3 text-xs text-[#8b5e3c] font-bold hover:underline"
                    >
                      View all upcoming events
                    </button>
                  </div>
                ) : (
                  (selectedDate ? eventsForDate(selectedDate) : events).map((event, index) => (
                    <ScrollReveal key={event.id} delay={index * 100}>
                      <motion.div
                        whileHover={{ y: -2 }}
                        className="bg-[#f8f6f3] rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow border border-[#0c1b33]/5"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="relative h-36">
                          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
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
                              <h4 className="font-semibold text-sm sm:text-base text-[#0c1b33] mb-1 line-clamp-1">{event.title}</h4>
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
                      </motion.div>
                    </ScrollReveal>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event Details & RSVP Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="relative h-44 shrink-0">
                <img src={selectedEvent.image} alt={selectedEvent.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-4 right-4">
                  {selectedEvent.badge && (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-[#d4af37] text-[#0c1b33] text-[10px] font-bold uppercase tracking-wider mb-1">
                      {selectedEvent.badge}
                    </span>
                  )}
                  <h3 className="font-display text-xl font-bold text-white leading-tight">{selectedEvent.title}</h3>
                </div>
              </div>

              <div className="p-6 overflow-y-auto">
                <div className="flex flex-wrap items-center gap-3 mb-4 text-xs sm:text-sm text-[#6b7c93]">
                  <span className="flex items-center gap-1 font-semibold text-[#0c1b33]">
                    <Calendar className="w-4 h-4 text-[#d4af37]" />
                    {selectedEvent.dateRange || `${selectedEvent.month} ${selectedEvent.day}, ${new Date(selectedEvent.date).getFullYear()}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-[#d4af37]" />
                    {selectedEvent.time} {selectedEvent.timezone}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-[#d4af37]" />
                    {selectedEvent.location}
                  </span>
                </div>

                <p className="text-sm text-[#0c1b33] mb-5 leading-relaxed">{selectedEvent.description}</p>

                {/* Kingdom Partnership Callout Box */}
                <div className="mb-5 p-4 rounded-xl bg-gradient-to-br from-[#0c1b33] to-[#1a1107] text-white border border-[#d4af37]/40 shadow-inner">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] uppercase font-bold text-[#d4af37] tracking-wider flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
                      Kingdom Mission Partner Opportunity
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">Open</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed mb-3">
                    Support crusade venues, delegate transport, pastors' training, and Bible distributions across Zimbabwe, Pakistan, and Kenya through monthly partnership tiers.
                  </p>
                  <Link
                    to="/subscribe"
                    className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c5961d] text-[#0c1b33] font-bold text-xs flex items-center justify-center gap-1.5 hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all"
                  >
                    <Crown className="w-3.5 h-3.5 text-[#0c1b33]" />
                    <span>View Kingdom Partnership Packages</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="border-t border-[#0c1b33]/10 pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0c1b33] mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#d4af37]" />
                    RSVP to Attend
                  </h4>
                  <form onSubmit={handleRsvp} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Your Full Name"
                      value={rsvpForm.name}
                      onChange={(e) => setRsvpForm({ ...rsvpForm, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#0c1b33]/10 bg-[#f8f6f3] focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
                    />
                    <input
                      type="email"
                      placeholder="Your Email Address"
                      value={rsvpForm.email}
                      onChange={(e) => setRsvpForm({ ...rsvpForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#0c1b33]/10 bg-[#f8f6f3] focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
                    />
                    <button type="submit" className="w-full btn-gold flex items-center justify-center gap-2 text-sm">
                      <Users className="w-4 h-4" />
                      Confirm RSVP for Conference
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}