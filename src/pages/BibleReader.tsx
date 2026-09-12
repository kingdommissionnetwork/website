import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Copy,
  Bookmark,
  Share2,
  BookOpen,
  X,
  Highlighter,
  Loader2,
  TextQuote,
  Minus,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ScrollReveal from "../components/ScrollReveal";
import { useLocalStorage } from "../hooks/use-local-storage";
import { useToast } from "../lib/toast";
import { api } from "../lib/api";
import type { BibleBook, BibleVerse } from "../data/demoData";

interface BooksResponse {
  books: BibleBook[];
  translations: string[];
  translationNames: Record<string, string>;
}

interface VersesResponse {
  verses: BibleVerse[];
  book: string;
  chapter: number;
  translation: string;
  translationName: string;
}

interface SearchResult {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export default function BibleReader() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [booksData, setBooksData] = useState<BooksResponse | null>(null);
  const [versesData, setVersesData] = useState<VersesResponse | null>(null);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingVerses, setLoadingVerses] = useState(false);
  const [selectedBook, setSelectedBook] = useState("");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [activeTranslation, setActiveTranslation] = useState("kjv");
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [bookmarkedList, setBookmarkedList] = useLocalStorage<string[]>("bible-bookmarks", []);
  // Derive a Set for O(1) lookups. Guard against legacy corrupted values
  // (JSON.stringify(new Set()) === "{}") written before the array migration.
  const bookmarkedVerses = useMemo(() => {
    const list = Array.isArray(bookmarkedList) ? bookmarkedList : [];
    return new Set(list);
  }, [bookmarkedList]);
  const [noteText, setNoteText] = useState("");
  const [savedNotes, setSavedNotes] = useLocalStorage<Record<string, string>>("bible-notes", {});
  const [expandedSection, setExpandedSection] = useState<"old" | "new" | null>("old");

  const fetchVerses = useCallback(async (book: string, chapter: number, translation: string) => {
    setLoadingVerses(true);
    setSelectedVerse(null);
    try {
      const data = await api.bible.verses(book, chapter, translation);
      setVersesData(data);
    } catch {
      setVersesData({ verses: [], book, chapter, translation, translationName: translation.toUpperCase() });
    }
    setLoadingVerses(false);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.bible.books();
        setBooksData(data);
      } catch {
        setBooksData({ books: [], translations: ["kjv", "web", "asv", "bbe", "darby", "ylt", "bsb", "gnv", "lsv", "fbv", "rv", "wmb", "niv", "nlt", "esv", "dra", "t4t"], translationNames: { kjv: "King James Version", web: "World English Bible", asv: "American Standard Version", bbe: "Bible in Basic English", darby: "Darby Translation", ylt: "Young's Literal Translation", bsb: "Berean Standard Bible", gnv: "Geneva Bible 1599", lsv: "Literal Standard Version", fbv: "Free Bible Version", rv: "Revised Version", wmb: "World Messianic Bible", niv: "New International Version", nlt: "New Living Translation", esv: "English Standard Version", dra: "Douay-Rheims 1899", t4t: "Translation for Translators" } });
      }
      setLoadingBooks(false);
      const initialBook = "Psalms";
      const initialChapter = 1;
      setSelectedBook(initialBook);
      setSelectedChapter(initialChapter);
      fetchVerses(initialBook, initialChapter, "kjv");
    })();
  }, [fetchVerses]);

  const loadVerses = (book: string, chapter: number) => {
    setSelectedBook(book);
    setSelectedChapter(chapter);
    fetchVerses(book, chapter, activeTranslation);
  };

  const handleBookSelect = (bookName: string) => {
    loadVerses(bookName, 1);
    navigate(`/bible/${encodeURIComponent(bookName)}/1`);
  };

  const handleChapterSelect = (chapter: number) => {
    loadVerses(selectedBook, chapter);
    navigate(`/bible/${encodeURIComponent(selectedBook)}/${chapter}`);
  };

  const handleTranslationChange = (t: string) => {
    setActiveTranslation(t);
    setSelectedVerse(null);
    fetchVerses(selectedBook, selectedChapter, t);
  };

  const currentBook = booksData?.books.find((b) => b.name === selectedBook);

  const handleCopy = (verse: number, text: string) => {
    navigator.clipboard.writeText(
      `${selectedBook} ${selectedChapter}:${verse} (${versesData?.translationName || activeTranslation.toUpperCase()}) — ${text}`
    );
    showToast("Verse copied!", "success");
  };

  const handleBookmark = (verse: number) => {
    const key = `${selectedBook} ${selectedChapter}:${verse}`;
    setBookmarkedList((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      if (list.includes(key)) {
        showToast("Bookmark removed", "info");
        return list.filter((k) => k !== key);
      }
      showToast("Verse bookmarked!", "success");
      return [...list, key];
    });
  };

  const handleSaveNote = () => {
    if (!selectedVerse || !noteText.trim()) return;
    const key = `${selectedBook} ${selectedChapter}:${selectedVerse}`;
    setSavedNotes((prev) => ({ ...prev, [key]: noteText }));
    showToast("Note saved!", "success");
  };

  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.length < 3) {
      setSearchResults([]);
      if (searchTimer) clearTimeout(searchTimer);
      return;
    }
    if (searchTimer) clearTimeout(searchTimer);
    // 600ms debounce: each keystroke-settling search costs a Worker invocation
    // plus up to 9 third-party subrequests server-side. Cached repeats (same
    // query+translation within 5min) never hit the network via api SWR.
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api.bible.search(val, activeTranslation);
        setSearchResults(data.results || []);
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 600);
    setSearchTimer(timer);
  };

  useEffect(() => {
    return () => {
      if (searchTimer) clearTimeout(searchTimer);
    };
  }, [searchTimer]);

  const handleToggleSearch = () => {
    if (showSearch) {
      setSearchQuery("");
      setSearchResults([]);
      if (searchTimer) clearTimeout(searchTimer);
    }
    setShowSearch(!showSearch);
  };

  const oldTestament = booksData?.books.filter((b) => b.testament === "old") || [];
  const newTestament = booksData?.books.filter((b) => b.testament === "new") || [];
  const translations = booksData?.translations || ["kjv"];

  if (loadingBooks) {
    return (
      <div className="pt-16 md:pt-[92px] lg:pt-[108px] min-h-screen bg-[#e6eef7] dark:bg-[#071324] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-16 md:pt-[92px] lg:pt-[108px] min-h-screen lg:h-screen bg-[#e6eef7] dark:bg-[#071324] text-[#0c1b33] dark:text-white flex flex-col lg:overflow-hidden">
      <SEO title={selectedBook ? `${selectedBook} ${selectedChapter} — Bible` : "Bible"} description="Read the Bible online with multiple translations (KJV, WEB, ASV). Search, bookmark, and take study notes." />
      <div className="bg-[#0c1b33] py-5 sm:py-6 px-4 shrink-0 z-10">
        <div className="container-main mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white">Holy Bible</h1>
            <div className="flex flex-wrap items-center gap-1.5 mt-2 sm:mt-0 sm:ml-4 sm:pl-4 sm:border-l sm:border-white/10 w-full sm:w-auto">
              {translations.map((t) => (
                <button
                  key={t}
                  onClick={() => handleTranslationChange(t)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeTranslation === t
                      ? "bg-[#d4af37] text-[#0c1b33]"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container-main mx-auto px-4 sm:px-6 py-6 flex-1 lg:overflow-hidden">
        <div className="grid lg:grid-cols-12 gap-6 lg:h-full">
          <div className="lg:col-span-3 lg:h-full lg:overflow-y-auto pr-0 lg:pr-2 pb-6">
            <ScrollReveal>
              <div className="bg-white dark:bg-[#0c1c33] rounded-2xl p-5 shadow-sm border border-transparent dark:border-white/10">
                <button
                  onClick={() => setExpandedSection(expandedSection === "old" ? null : "old")}
                  className="flex items-center justify-between w-full mb-2"
                >
                  <h3 className="font-display text-lg font-semibold text-[#0c1b33] dark:text-white">Old Testament</h3>
                  <ChevronLeft className={`w-4 h-4 text-[#6b7c93] dark:text-slate-400 transition-transform ${expandedSection === "old" ? "-rotate-90" : ""}`} />
                </button>
                <AnimatePresence>
                  {expandedSection === "old" && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="space-y-0.5 mb-4">
                        {oldTestament.map((book) => (
                          <button
                            key={book.name}
                            onClick={() => handleBookSelect(book.name)}
                            className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                              selectedBook === book.name
                                ? "bg-[#d4af37]/10 dark:bg-[#d4af37]/20 text-[#8b5e3c] dark:text-[#f6c873] font-medium border-l-2 border-[#d4af37]"
                                : "text-[#6b7c93] dark:text-slate-400 hover:bg-[#e6eef7] dark:hover:bg-white/5"
                            }`}
                          >
                            {book.name}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => setExpandedSection(expandedSection === "new" ? null : "new")}
                  className="flex items-center justify-between w-full mb-2 mt-2"
                >
                  <h3 className="font-display text-lg font-semibold text-[#0c1b33] dark:text-white">New Testament</h3>
                  <ChevronLeft className={`w-4 h-4 text-[#6b7c93] dark:text-slate-400 transition-transform ${expandedSection === "new" ? "-rotate-90" : ""}`} />
                </button>
                <AnimatePresence>
                  {expandedSection === "new" && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="space-y-0.5">
                        {newTestament.map((book) => (
                          <button
                            key={book.name}
                            onClick={() => handleBookSelect(book.name)}
                            className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                              selectedBook === book.name
                                ? "bg-[#d4af37]/10 dark:bg-[#d4af37]/20 text-[#8b5e3c] dark:text-[#f6c873] font-medium border-l-2 border-[#d4af37]"
                                : "text-[#6b7c93] dark:text-slate-400 hover:bg-[#e6eef7] dark:hover:bg-white/5"
                            }`}
                          >
                            {book.name}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {currentBook && (
                  <div className="mt-6 pt-4 border-t border-[#0c1b33]/5 dark:border-white/10">
                    <h4 className="text-sm font-medium text-[#0c1b33] dark:text-white mb-3">{currentBook.name} — Chapters</h4>
                    <div className="grid grid-cols-5 gap-1.5">
                      {Array.from({ length: Math.min(currentBook.chapters, 50) }, (_, i) => i + 1).map((ch) => (
                        <button
                          key={ch}
                          onClick={() => handleChapterSelect(ch)}
                          className={`py-1.5 rounded-lg text-sm font-medium transition-all ${
                            selectedChapter === ch
                              ? "bg-[#d4af37] text-[#0c1b33]"
                              : "bg-[#f8f6f3] dark:bg-white/5 text-[#6b7c93] dark:text-slate-300 hover:bg-[#e6eef7] dark:hover:bg-white/10"
                          }`}
                        >
                          {ch}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollReveal>
          </div>

          <div className="lg:col-span-6 lg:h-full lg:overflow-y-auto pr-0 lg:pr-2 pb-6">
            <ScrollReveal>
              <div className="bg-[#f5f0e8] dark:bg-[#0c1c33] rounded-2xl p-6 sm:p-10 shadow-sm min-h-full border border-transparent dark:border-white/10">
                <div className="text-center mb-8 pb-6 border-b border-[#0c1b33]/10 dark:border-white/10">
                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0c1b33] dark:text-white">{selectedBook}</h2>
                  <p className="text-sm text-[#6b7c93] dark:text-slate-400 mt-1">{versesData?.translationName || ""}</p>

                  <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                    <button
                      onClick={() => selectedChapter > 1 && handleChapterSelect(selectedChapter - 1)}
                      disabled={selectedChapter <= 1}
                      className="p-2 rounded-lg hover:bg-[#0c1b33]/5 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-[#0c1b33] dark:text-white" />
                    </button>
                    <span className="font-display text-xl font-semibold text-[#0c1b33] dark:text-white min-w-[120px] text-center">
                      Chapter {selectedChapter}
                    </span>
                    <button
                      onClick={() => currentBook && selectedChapter < currentBook.chapters && handleChapterSelect(selectedChapter + 1)}
                      disabled={!currentBook || selectedChapter >= currentBook.chapters}
                      className="p-2 rounded-lg hover:bg-[#0c1b33]/5 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-[#0c1b33] dark:text-white" />
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-3 mt-3">
                    <button
                      onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                      disabled={fontSize <= 14}
                      className="p-1.5 rounded-lg hover:bg-[#0c1b33]/5 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
                      title="Decrease font size"
                    >
                      <Minus className="w-4 h-4 text-[#6b7c93] dark:text-slate-400" />
                    </button>
                    <span className="text-xs text-[#6b7c93] dark:text-slate-400 font-medium w-8 text-center">{fontSize}px</span>
                    <button
                      onClick={() => setFontSize(Math.min(26, fontSize + 2))}
                      disabled={fontSize >= 26}
                      className="p-1.5 rounded-lg hover:bg-[#0c1b33]/5 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
                      title="Increase font size"
                    >
                      <Plus className="w-4 h-4 text-[#6b7c93] dark:text-slate-400" />
                    </button>

                    <div className="w-px h-4 bg-[#0c1b33]/10 dark:bg-white/15 mx-1"></div>

                    <button
                      onClick={handleToggleSearch}
                      className={`p-1.5 rounded-lg transition-colors ${showSearch ? 'bg-[#0c1b33] dark:bg-[#d4af37] text-[#d4af37] dark:text-[#0c1b33]' : 'hover:bg-[#0c1b33]/5 dark:hover:bg-white/10 text-[#6b7c93] dark:text-slate-400'}`}
                      title="Search"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {showSearch && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mb-6"
                    >
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7c93] dark:text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search scripture (min 3 chars)..."
                          value={searchQuery}
                          onChange={handleSearchInputChange}
                          className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#0c1b33]/10 dark:border-white/15 bg-white dark:bg-[#071324] focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-[#0c1b33] dark:text-white"
                        />
                        {searchQuery && (
                          <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                            <X className="w-4 h-4 text-[#6b7c93] dark:text-slate-400" />
                          </button>
                        )}
                      </div>
                      {searching && (
                        <div className="mt-3 text-sm text-[#6b7c93] dark:text-slate-400 flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin" /> Searching...
                        </div>
                      )}
                      {searchResults.length > 0 && (
                        <div className="mt-3 max-h-64 overflow-y-auto bg-white dark:bg-[#071324] rounded-xl border border-[#0c1b33]/5 dark:border-white/15 p-3">
                          <p className="text-xs text-[#6b7c93] dark:text-slate-400 mb-2">{searchResults.length} results</p>
                          {searchResults.slice(0, 20).map((r, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                handleBookSelect(r.book);
                                setSelectedChapter(r.chapter);
                                setSelectedVerse(r.verse);
                                setShowSearch(false);
                                setSearchQuery("");
                                setSearchResults([]);
                              }}
                              className="block w-full text-left px-3 py-2.5 rounded-lg hover:bg-[#f8f6f3] dark:hover:bg-white/5 text-sm text-[#0c1b33] dark:text-white transition-colors mb-1 last:mb-0"
                            >
                              <span className="text-[#8b5e3c] dark:text-[#f6c873] font-semibold">{r.book} {r.chapter}:{r.verse}</span>{" "}
                              <span className="text-[#6b7c93] dark:text-slate-400">{r.text.slice(0, 100)}...</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchQuery.length >= 3 && !searching && searchResults.length === 0 && (
                        <p className="mt-3 text-sm text-[#6b7c93] dark:text-slate-400">No results found</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {loadingVerses ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
                  </div>
                ) : versesData?.verses.length ? (
                  <div className="space-y-4" style={{ fontSize: `${fontSize}px` }}>
                    {versesData.verses.map((verse) => (
                      <motion.div
                        key={verse.verse}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setSelectedVerse(selectedVerse === verse.verse ? null : verse.verse)}
                        className={`group relative p-3 rounded-xl cursor-pointer transition-all ${
                          selectedVerse === verse.verse ? "bg-[#d4af37]/10 dark:bg-[#d4af37]/20 ring-1 ring-[#d4af37]/30" : "hover:bg-white/50 dark:hover:bg-white/5"
                        }`}
                      >
                        <p className="font-display leading-relaxed text-[#0c1b33] dark:text-slate-100">
                          <sup className="text-xs text-[#8b5e3c] dark:text-[#f6c873] font-medium mr-1 align-super">{verse.verse}</sup>
                          {verse.text}
                        </p>

                        <AnimatePresence>
                          {selectedVerse === verse.verse && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="flex items-center gap-2 mt-3"
                            >
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCopy(verse.verse, verse.text); }}
                                className="p-1.5 rounded-lg bg-white dark:bg-white/10 shadow-sm hover:shadow text-[#6b7c93] dark:text-slate-300 hover:text-[#d4af37] transition-all"
                                title="Copy"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleBookmark(verse.verse); }}
                                className={`p-1.5 rounded-lg bg-white dark:bg-white/10 shadow-sm hover:shadow transition-all ${
                                  bookmarkedVerses.has(`${selectedBook} ${selectedChapter}:${verse.verse}`)
                                    ? "text-[#d4af37]" : "text-[#6b7c93] dark:text-slate-300 hover:text-[#d4af37]"
                                }`}
                                title="Bookmark"
                              >
                                <Bookmark className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); showToast("Verse shared!", "success"); }}
                                className="p-1.5 rounded-lg bg-white dark:bg-white/10 shadow-sm hover:shadow text-[#6b7c93] dark:text-slate-300 hover:text-[#d4af37] transition-all"
                                title="Share"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <TextQuote className="w-12 h-12 text-[#6b7c93]/30 mx-auto mb-4" />
                    <p className="text-[#6b7c93] dark:text-slate-400">No verses available</p>
                    <p className="text-sm text-[#6b7c93]/70 dark:text-slate-500 mt-1">Select a different book or chapter</p>
                  </div>
                )}
              </div>
            </ScrollReveal>
          </div>

          <div className="lg:col-span-3 lg:h-full lg:overflow-y-auto pr-0 lg:pr-2 pb-6">
            <ScrollReveal>
              <div className="space-y-6">
                <div className="bg-white dark:bg-[#0c1c33] rounded-2xl p-5 shadow-sm border border-transparent dark:border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <Highlighter className="w-4 h-4 text-[#d4af37]" />
                    <h3 className="font-display text-lg font-semibold text-[#0c1b33] dark:text-white">Study Notes</h3>
                  </div>
                  {selectedVerse ? (
                    <div>
                      <p className="text-xs text-[#6b7c93] dark:text-slate-400 mb-2">
                        Note for {selectedBook} {selectedChapter}:{selectedVerse}
                      </p>
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Write your thoughts..."
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg border border-[#0c1b33]/10 dark:border-white/15 bg-[#f8f6f3] dark:bg-white/5 text-[#0c1b33] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm resize-none"
                      />
                      <button
                        onClick={handleSaveNote}
                        className="mt-2 w-full py-2 rounded-lg bg-[#0c1b33] dark:bg-[#d4af37] text-white dark:text-[#0c1b33] text-sm font-medium hover:bg-[#162a4a] dark:hover:brightness-110 transition-colors"
                      >
                        Save Note
                      </button>
                      {savedNotes[`${selectedBook} ${selectedChapter}:${selectedVerse}`] && (
                        <div className="mt-3 p-3 bg-[#f5f0e8] dark:bg-white/5 rounded-lg">
                          <p className="text-xs text-[#6b7c93] dark:text-slate-400 mb-1">Saved note:</p>
                          <p className="text-sm text-[#0c1b33] dark:text-white">
                            {savedNotes[`${selectedBook} ${selectedChapter}:${selectedVerse}`]}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-[#6b7c93] dark:text-slate-400">Select a verse to add a study note.</p>
                  )}
                </div>

                <div className="bg-white dark:bg-[#0c1c33] rounded-2xl p-5 shadow-sm border border-transparent dark:border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <Bookmark className="w-4 h-4 text-[#d4af37]" />
                    <h3 className="font-display text-lg font-semibold text-[#0c1b33] dark:text-white">My Bookmarks</h3>
                  </div>
                  {bookmarkedVerses.size > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {Array.from(bookmarkedVerses).map((key) => (
                        <button
                          key={key}
                          onClick={() => {
                            const match = key.match(/^(.+?) (\d+):(\d+)$/);
                            if (match) {
                              handleBookSelect(match[1]);
                              setSelectedChapter(Number(match[2]));
                            }
                          }}
                          className="block w-full text-left px-3 py-2 rounded-lg bg-[#f8f6f3] dark:bg-white/5 hover:bg-[#e6eef7] dark:hover:bg-white/10 text-sm transition-colors"
                        >
                          <span className="text-[#d4af37] font-medium">{key}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#6b7c93] dark:text-slate-400">No bookmarks yet.</p>
                  )}
                </div>

                <div className="bg-white dark:bg-[#0c1c33] rounded-2xl p-5 shadow-sm border border-transparent dark:border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-4 h-4 text-[#d4af37]" />
                    <h3 className="font-display text-lg font-semibold text-[#0c1b33] dark:text-white">Quick Access</h3>
                  </div>
                  <div className="space-y-1">
                    {["Psalm 23", "John 3", "Romans 8", "Philippians 4", "Genesis 1", "Proverbs 3"].map((ref) => {
                      const parts = ref.split(" ");
                      const num = Number(parts.pop()) || 1;
                      const book = parts.join(" ");
                      const bookName = book === "Psalm" ? "Psalms" : book;
                      return (
                        <button
                          key={ref}
                          onClick={() => loadVerses(bookName, num)}
                          className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#f8f6f3] dark:hover:bg-white/5 text-sm text-[#6b7c93] dark:text-slate-300 hover:text-[#0c1b33] dark:hover:text-white transition-colors"
                        >
                          {book} {num}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
}