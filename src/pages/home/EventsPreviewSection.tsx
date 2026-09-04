import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Video, ChevronRight, Crown, Sparkles } from "lucide-react";
import ScrollReveal from "../../components/ScrollReveal";
import { api } from "../../lib/api";
import { getUpcomingEvents } from "../../lib/events";
import type { Event } from "../../data/demoData";

export default function EventsPreviewSection() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.events.list().then((data) => {
      setEvents(getUpcomingEvents(Array.isArray(data) ? data : []).slice(0, 6));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <section className="bg-[#f8f6f3] section-padding">
      <div className="container-main mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#0c1b33] text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Gathering Nations For Global Awakening</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-[#0c1b33] mb-3">
              Kingdom Events & Global Summits
            </h2>
            <p className="text-[#6b7c93] text-lg max-w-2xl mx-auto">
              Upcoming international conferences, gospel crusades, and revival worship nights uniting the global body of Christ.
            </p>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-[#0c1b33]/5">
                <div className="h-48 bg-[#e6eef7] animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-4 w-16 bg-[#e6eef7] rounded animate-pulse" />
                  <div className="h-5 w-3/4 bg-[#e6eef7] rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-[#e6eef7] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-10 h-10 text-[#6b7c93]/30 mx-auto mb-3" />
            <p className="text-[#6b7c93]">No upcoming events</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <ScrollReveal key={event.id} delay={index * 100}>
                <div className="bg-white rounded-2xl overflow-hidden border border-[#0c1b33]/10 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group flex flex-col h-full">
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                    
                    {/* Date Badge */}
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md rounded-xl px-3 py-1.5 text-center shadow-lg border border-[#0c1b33]/5">
                      <p className="text-[10px] font-bold text-[#8b5e3c] uppercase tracking-wider">{event.month}</p>
                      <p className="text-xl font-bold text-[#0c1b33] font-display leading-tight">{event.day}</p>
                    </div>

                    {/* Tag / Online / Badge */}
                    <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5">
                      {event.badge && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#0c1b33]/85 text-[#fbf5b7] border border-[#d4af37]/50 text-[10px] font-bold shadow-md backdrop-blur-sm">
                          {event.badge}
                        </span>
                      )}
                      {event.isOnline && (
                        <div className="px-2.5 py-0.5 rounded-full bg-[#d4af37] text-[#0c1b33] text-[10px] font-bold flex items-center gap-1 shadow">
                          <Video className="w-3 h-3" />
                          Online
                        </div>
                      )}
                    </div>

                    {/* Date range footer on image */}
                    {event.dateRange && (
                      <div className="absolute bottom-2.5 left-3 text-white text-xs font-semibold drop-shadow flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>{event.dateRange}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="font-display text-xl font-bold text-[#0c1b33] mb-2 group-hover:text-[#d4af37] transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[#6b7c93] mb-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                          {event.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#6b7c93]" />
                          {event.time} {event.timezone}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-[#6b7c93] line-clamp-3 mb-4 leading-relaxed">
                        {event.description}
                      </p>
                    </div>

                    {/* Dual Action CTAs */}
                    <div className="pt-3 border-t border-[#0c1b33]/5 flex items-center justify-between gap-2">
                      <Link
                        to="/events"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0c1b33] hover:text-[#d4af37] transition-colors"
                      >
                        <span>RSVP / Register</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>

                      <Link
                        to="/subscribe"
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#996515] hover:text-[#0c1b33] text-[11px] font-bold border border-[#d4af37]/40 transition-colors"
                      >
                        <Crown className="w-3 h-3 text-[#996515]" />
                        <span>Partner</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}

        <ScrollReveal>
          <div className="text-center mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/events"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-[#0c1b33] text-white font-semibold hover:bg-[#1a2d4d] transition-all shadow-md"
            >
              <Calendar className="w-4 h-4 text-[#d4af37]" />
              Explore Event Calendar
            </Link>
            <Link
              to="/subscribe"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c5961d] text-[#0c1b33] font-bold hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all"
            >
              <Crown className="w-4 h-4 text-[#0c1b33]" />
              Kingdom Partnership Packages
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}