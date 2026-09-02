import { useState, useEffect, useCallback } from "react";
import SEO from "../components/SEO";
import { Search, Clock, Bookmark, Play, Headphones, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ScrollReveal from "../components/ScrollReveal";
import AmbientParticles from "../components/AmbientParticles";
import { api } from "../lib/api";
import type { Sermon } from "../data/demoData";

export default function Sermons() {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const [bookmarkedSermons, setBookmarkedSermons] = useState<Set<string>>(new Set());
  const [playingSermon, setPlayingSermon] = useState<string | null>(null);

  const fetchSermons = useCallback(async (category: string, query: string) => {
    setLoading(true);
    try {
      const data = await api.sermons.list(category, query || undefined);
      setSermons(data);
    } catch { setSermons([]); }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSermons(activeCategory, searchQuery);
  }, [activeCategory, searchQuery, fetchSermons]);

  useEffect(() => {
    api.sermons.getCategories().then(setCategories).catch(() => {});
  }, []);

  const sortedSermons = [...sermons].sort((a, b) => {
    if (sortBy === "popular") return b.title.localeCompare(a.title);
    return 0;
  });

  const toggleBookmark = (id: string) => {
    setBookmarkedSermons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="pt-[72px] md:pt-[108px] min-h-screen bg-white">
      <SEO title="Sermons" description="Browse our collection of sermons on faith, hope, love, and discipleship." />
      
      <div className="relative overflow-hidden py-16 lg:py-20 px-4 bg-gradient-to-br from-[#0c1b33] via-[#071324] to-[#1a1107]">
        {/* Warm Orange & Golden Radiant Background Glows */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(249,115,22,0.18)_0%,transparent_65%)] pointer-events-none blur-3xl" />
        <div className="absolute bottom-0 left-10 w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(212,175,55,0.20)_0%,transparent_65%)] pointer-events-none blur-3xl" />

        <AmbientParticles />

        <div className="container-main mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-[#d4af37]/40 text-[#fbf5b7] text-xs font-semibold mb-4 backdrop-blur-md">
            <span>Anointed Teachings & Media Archive</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
            Sermon <span className="bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] bg-clip-text text-transparent">Library</span>
          </h1>
          <p className="text-white/80 text-base md:text-xl max-w-xl mx-auto mb-8 leading-relaxed">
            Searchable teachings and sound doctrine from ministries worldwide.
          </p>

          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b7c93]" />
            <input
              type="text"
              placeholder="Search sermons by title, speaker, or scripture..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-[#0c1b33] placeholder-[#6b7c93] focus:outline-none focus:ring-2 focus:ring-[#d4af37] shadow-xl"
            />
          </div>
        </div>
      </div>

      <div className="container-main mx-auto px-4 sm:px-6 py-8">
        <ScrollReveal>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex flex-wrap gap-2">
              {(categories.length ? categories : ["All", "Worship", "Teaching", "Prophetic", "Healing", "Deliverance", "Faith", "Prayer"]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeCategory === cat
                      ? "bg-[#0c1b33] text-white"
                      : "bg-[#e6eef7] text-[#0c1b33] hover:bg-[#0c1b33]/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#6b7c93]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "recent" | "popular")}
                className="px-3 py-2 rounded-lg border border-[#0c1b33]/10 bg-[#f8f6f3] text-sm text-[#0c1b33] focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-[#0c1b33]/5">
                <div className="aspect-video bg-[#e6eef7] animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-16 bg-[#e6eef7] rounded animate-pulse" />
                  <div className="h-4 w-full bg-[#e6eef7] rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-[#e6eef7] rounded animate-pulse" />
                  <div className="flex items-center justify-between pt-2">
                    <div className="h-3 w-24 bg-[#e6eef7] rounded animate-pulse" />
                    <div className="h-3 w-16 bg-[#e6eef7] rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedSermons.length === 0 ? (
          <div className="text-center py-20">
            <Headphones className="w-12 h-12 text-[#6b7c93] mx-auto mb-4" />
            <p className="text-lg text-[#6b7c93]">No sermons found matching your criteria.</p>
            <button
              onClick={() => {
                setActiveCategory("All");
                setSearchQuery("");
              }}
              className="mt-4 text-[#d4af37] font-medium hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {sortedSermons.map((sermon, index) => (
                <motion.div
                  key={sermon.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <ScrollReveal delay={index * 80}>
                    <div className="bg-white rounded-2xl overflow-hidden border border-[#0c1b33]/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={sermon.thumbnail}
                          alt={sermon.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() =>
                              setPlayingSermon(playingSermon === sermon.id ? null : sermon.id)
                            }
                            className="w-14 h-14 rounded-full bg-[#d4af37] flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                          >
                            {playingSermon === sermon.id ? (
                              <Headphones className="w-6 h-6 text-[#0c1b33]" />
                            ) : (
                              <Play className="w-6 h-6 text-[#0c1b33] ml-1" />
                            )}
                          </button>
                        </div>
                        <span className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/70 text-white text-xs font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {sermon.duration}
                        </span>
                      </div>

                      {playingSermon === sermon.id && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          className="bg-[#0c1b33] p-4 overflow-hidden"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#d4af37] flex items-center justify-center">
                              <Headphones className="w-5 h-5 text-[#0c1b33]" />
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">Now Playing</p>
                              <p className="text-white/60 text-xs">{sermon.title}</p>
                            </div>
                          </div>
                          <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full w-1/3 bg-[#d4af37] rounded-full animate-pulse" />
                          </div>
                        </motion.div>
                      )}

                      <div className="p-5">
                        <span className="inline-block px-3 py-1 rounded-full bg-[#d4af37]/10 text-[#8b5e3c] text-xs font-medium mb-2">
                          {sermon.category}
                        </span>
                        <h3 className="font-semibold text-[#0c1b33] mb-1 line-clamp-2 group-hover:text-[#d4af37] transition-colors">
                          {sermon.title}
                        </h3>
                        <p className="text-sm text-[#6b7c93]">{sermon.speaker}</p>
                        <p className="text-xs text-[#6b7c93]/70 mt-1">{sermon.ministry}</p>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#0c1b33]/5">
                          <span className="text-xs text-[#6b7c93]">{sermon.date}</span>
                          <button
                            onClick={() => toggleBookmark(sermon.id)}
                            className={`p-1.5 rounded-full transition-colors ${
                              bookmarkedSermons.has(sermon.id)
                                ? "text-[#d4af37] bg-[#d4af37]/10"
                                : "text-[#6b7c93] hover:bg-[#e6eef7]"
                            }`}
                          >
                            <Bookmark
                              className="w-4 h-4"
                              fill={bookmarkedSermons.has(sermon.id) ? "currentColor" : "none"}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}