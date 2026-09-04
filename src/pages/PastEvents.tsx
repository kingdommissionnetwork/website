import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { ArrowLeft, Calendar, Clock, MapPin, Video, History, Crown, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import ScrollReveal from "../components/ScrollReveal";
import AmbientParticles from "../components/AmbientParticles";
import { api } from "../lib/api";
import { parseEventDate, getPastEvents } from "../lib/events";
import type { Event } from "../data/demoData";

export default function PastEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.events
      .list()
      .then((data) => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const past = useMemo(() => getPastEvents(events), [events]);

  return (
    <div className="pt-[72px] md:pt-[108px] min-h-screen bg-white">
      <SEO
        title="Recent & Past Gatherings"
        description="Browse recently concluded Kingdom gatherings, conferences, and missions. Relive what God did — and partner with the next one."
      />

      {/* ---------- HERO ---------- */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1b33] via-[#071324] to-[#1a1107] px-4 pt-14 pb-10 lg:pt-16 lg:pb-12">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(249,115,22,0.15)_0%,transparent_65%)] pointer-events-none blur-3xl" />
        <div className="absolute bottom-0 left-10 w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(212,175,55,0.18)_0%,transparent_65%)] pointer-events-none blur-3xl" />
        <AmbientParticles />

        <div className="container-main mx-auto relative z-10 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-[#d4af37]/40 text-[#fbf5b7] text-xs font-semibold mb-4 backdrop-blur-md">
            <History className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Archive of concluded gatherings</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Recent &{" "}
            <span className="bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] bg-clip-text text-transparent">
              Past Gatherings
            </span>
          </h1>
          <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-7">
            Every concluded gathering moves here automatically. Relive what the Lord has done —
            and sow into the next mission.
          </p>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c5961d] text-[#0c1b33] font-bold text-sm hover:shadow-[0_0_20px_rgba(212,175,55,0.45)] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to upcoming gatherings
          </Link>
        </div>
      </div>

      {/* ---------- ARCHIVE LIST ---------- */}
      <div className="container-main mx-auto px-4 sm:px-6 py-10 max-w-5xl">
        {loading ? (
          <div className="space-y-4" aria-label="Loading past gatherings">
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
        ) : past.length === 0 ? (
          <div className="text-center py-14 bg-[#f8f6f3] rounded-3xl border border-[#0c1b33]/5 px-6">
            <History className="w-12 h-12 text-[#6b7c93]/40 mx-auto mb-4" />
            <h2 className="font-display text-xl font-semibold text-[#0c1b33] mb-2">
              No concluded gatherings yet
            </h2>
            <p className="text-sm text-[#6b7c93] max-w-md mx-auto mb-5">
              When a gathering ends, it will appear here automatically — most recent first.
            </p>
            <Link
              to="/events"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0c1b33] text-white text-sm font-semibold hover:bg-[#1a2d4d] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              View upcoming gatherings
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold text-[#6b7c93] mb-4">
              {past.length} concluded gathering{past.length === 1 ? "" : "s"} · most recent first
            </p>
            <div className="space-y-4">
              {past.map((event, index) => {
                const d = parseEventDate(event.date);
                return (
                  <ScrollReveal key={event.id} delay={Math.min(index, 4) * 60}>
                    <article className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_180px_1fr] items-center gap-4 bg-[#f8f6f3] rounded-2xl border border-[#0c1b33]/5 p-4 sm:p-5">
                      <div className="bg-white rounded-xl px-3 py-2 text-center min-w-[62px] border border-[#0c1b33]/10 shadow-sm">
                        <p className="text-[10px] font-bold text-[#8b5e3c] uppercase">
                          {event.month || format(d, "MMM").toUpperCase()}
                        </p>
                        <p className="text-2xl font-bold text-[#0c1b33] font-display leading-tight">
                          {event.day || format(d, "d")}
                        </p>
                        <p className="text-[10px] font-semibold text-[#6b7c93]">{format(d, "yyyy")}</p>
                      </div>
                      <div className="hidden sm:block relative h-24 w-[180px] rounded-xl overflow-hidden">
                        <img
                          src={event.image}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-[#0c1b33]/85 text-[#fbf5b7] text-[10px] font-bold">
                          Concluded
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h2 className="font-semibold text-base sm:text-lg text-[#0c1b33] line-clamp-1">
                            {event.title}
                          </h2>
                          {event.isOnline && (
                            <span className="px-2 py-0.5 rounded-full bg-[#d4af37]/20 text-[#996515] text-[10px] font-bold flex items-center gap-1">
                              <Video className="w-3 h-3" />
                              Online
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-[#6b7c93] mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
                            {event.dateRange || format(d, "EEEE, MMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                            {event.time} {event.timezone}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                            {event.location}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#6b7c93] line-clamp-2 leading-relaxed">
                          {event.description}
                        </p>
                      </div>
                    </article>
                  </ScrollReveal>
                );
              })}
            </div>

            {/* partner CTA */}
            <div className="mt-10 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0c1b33] to-[#1a1107] text-white border border-[#d4af37]/40 flex flex-col sm:flex-row items-center gap-5">
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-display text-xl font-bold mb-1.5 flex items-center justify-center sm:justify-start gap-2">
                  <Crown className="w-5 h-5 text-[#d4af37]" />
                  Fuel the next gathering
                </h3>
                <p className="text-sm text-white/75">
                  Your partnership sends the next mission to another city and nation.
                </p>
              </div>
              <Link
                to="/subscribe"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c5961d] text-[#0c1b33] font-bold text-sm hover:shadow-[0_0_20px_rgba(212,175,55,0.45)] transition-all shrink-0"
              >
                Become a partner
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
