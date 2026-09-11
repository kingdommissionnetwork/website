import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getSupabase } from "../lib/supabase";
import { requireAuth } from "../lib/jwt";
import type { JwtPayload } from "../lib/jwt";
import { rateLimit } from "../lib/rateLimiter";
import { publicCache } from "../lib/httpCache";

export const bibleRoutes = new Hono<{ Variables: { user: JwtPayload } }>();

const searchCache = new Map<string, { time: number; results: unknown }>();

const BIBLE_API = "https://bible-api.com";
const CDN = "https://cdn.jsdelivr.net/gh/wldeh/bible-api@latest";
const RKEPLIN = "https://bible-go-api.rkeplin.com/v1";

const BOOKS = [
  { name: "Genesis", chapters: 50, testament: "old" },
  { name: "Exodus", chapters: 40, testament: "old" },
  { name: "Leviticus", chapters: 27, testament: "old" },
  { name: "Numbers", chapters: 36, testament: "old" },
  { name: "Deuteronomy", chapters: 34, testament: "old" },
  { name: "Joshua", chapters: 24, testament: "old" },
  { name: "Judges", chapters: 21, testament: "old" },
  { name: "Ruth", chapters: 4, testament: "old" },
  { name: "1 Samuel", chapters: 31, testament: "old" },
  { name: "2 Samuel", chapters: 24, testament: "old" },
  { name: "1 Kings", chapters: 22, testament: "old" },
  { name: "2 Kings", chapters: 25, testament: "old" },
  { name: "1 Chronicles", chapters: 29, testament: "old" },
  { name: "2 Chronicles", chapters: 36, testament: "old" },
  { name: "Ezra", chapters: 10, testament: "old" },
  { name: "Nehemiah", chapters: 13, testament: "old" },
  { name: "Esther", chapters: 10, testament: "old" },
  { name: "Job", chapters: 42, testament: "old" },
  { name: "Psalms", chapters: 150, testament: "old" },
  { name: "Proverbs", chapters: 31, testament: "old" },
  { name: "Ecclesiastes", chapters: 12, testament: "old" },
  { name: "Song of Solomon", chapters: 8, testament: "old" },
  { name: "Isaiah", chapters: 66, testament: "old" },
  { name: "Jeremiah", chapters: 52, testament: "old" },
  { name: "Lamentations", chapters: 5, testament: "old" },
  { name: "Ezekiel", chapters: 48, testament: "old" },
  { name: "Daniel", chapters: 12, testament: "old" },
  { name: "Hosea", chapters: 14, testament: "old" },
  { name: "Joel", chapters: 3, testament: "old" },
  { name: "Amos", chapters: 9, testament: "old" },
  { name: "Obadiah", chapters: 1, testament: "old" },
  { name: "Jonah", chapters: 4, testament: "old" },
  { name: "Micah", chapters: 7, testament: "old" },
  { name: "Nahum", chapters: 3, testament: "old" },
  { name: "Habakkuk", chapters: 3, testament: "old" },
  { name: "Zephaniah", chapters: 3, testament: "old" },
  { name: "Haggai", chapters: 2, testament: "old" },
  { name: "Zechariah", chapters: 14, testament: "old" },
  { name: "Malachi", chapters: 4, testament: "old" },
  { name: "Matthew", chapters: 28, testament: "new" },
  { name: "Mark", chapters: 16, testament: "new" },
  { name: "Luke", chapters: 24, testament: "new" },
  { name: "John", chapters: 21, testament: "new" },
  { name: "Acts", chapters: 28, testament: "new" },
  { name: "Romans", chapters: 16, testament: "new" },
  { name: "1 Corinthians", chapters: 16, testament: "new" },
  { name: "2 Corinthians", chapters: 13, testament: "new" },
  { name: "Galatians", chapters: 6, testament: "new" },
  { name: "Ephesians", chapters: 6, testament: "new" },
  { name: "Philippians", chapters: 4, testament: "new" },
  { name: "Colossians", chapters: 4, testament: "new" },
  { name: "1 Thessalonians", chapters: 5, testament: "new" },
  { name: "2 Thessalonians", chapters: 3, testament: "new" },
  { name: "1 Timothy", chapters: 6, testament: "new" },
  { name: "2 Timothy", chapters: 4, testament: "new" },
  { name: "Titus", chapters: 3, testament: "new" },
  { name: "Philemon", chapters: 1, testament: "new" },
  { name: "Hebrews", chapters: 13, testament: "new" },
  { name: "James", chapters: 5, testament: "new" },
  { name: "1 Peter", chapters: 5, testament: "new" },
  { name: "2 Peter", chapters: 3, testament: "new" },
  { name: "1 John", chapters: 5, testament: "new" },
  { name: "2 John", chapters: 1, testament: "new" },
  { name: "3 John", chapters: 1, testament: "new" },
  { name: "Jude", chapters: 1, testament: "new" },
  { name: "Revelation", chapters: 22, testament: "new" },
];

type TranslationSource = "bible-api" | "wldeh" | "rkeplin";

interface TranslationInfo {
  id: string;
  name: string;
  source: TranslationSource;
  wldehVersion?: string;
  bookFormat: "name" | "abbr" | "number";
  language: string;
}

const TRANSLATIONS: TranslationInfo[] = [
  { id: "kjv", name: "King James Version", source: "bible-api", bookFormat: "name", language: "en" },
  { id: "web", name: "World English Bible", source: "bible-api", bookFormat: "name", language: "en" },
  { id: "asv", name: "American Standard Version", source: "bible-api", bookFormat: "name", language: "en" },
  { id: "bbe", name: "Bible in Basic English", source: "bible-api", bookFormat: "name", language: "en" },
  { id: "darby", name: "Darby Translation", source: "bible-api", bookFormat: "name", language: "en" },
  { id: "ylt", name: "Young's Literal Translation", source: "bible-api", bookFormat: "name", language: "en" },
  { id: "bsb", name: "Berean Standard Bible", source: "wldeh", wldehVersion: "en-bsb", bookFormat: "name", language: "en" },
  { id: "gnv", name: "Geneva Bible 1599", source: "wldeh", wldehVersion: "en-gnv", bookFormat: "name", language: "en" },
  { id: "lsv", name: "Literal Standard Version", source: "wldeh", wldehVersion: "en-lsv", bookFormat: "name", language: "en" },
  { id: "fbv", name: "Free Bible Version", source: "wldeh", wldehVersion: "en-fbv", bookFormat: "name", language: "en" },
  { id: "rv", name: "Revised Version", source: "wldeh", wldehVersion: "en-rv", bookFormat: "name", language: "en" },
  { id: "wmb", name: "World Messianic Bible", source: "wldeh", wldehVersion: "en-wmb", bookFormat: "name", language: "en" },
  { id: "niv", name: "New International Version", source: "rkeplin", bookFormat: "number", language: "en" },
  { id: "nlt", name: "New Living Translation", source: "rkeplin", bookFormat: "number", language: "en" },
  { id: "esv", name: "English Standard Version", source: "rkeplin", bookFormat: "number", language: "en" },
  { id: "dra", name: "Douay-Rheims 1899", source: "wldeh", wldehVersion: "en-dra", bookFormat: "name", language: "en" },
  { id: "t4t", name: "Translation for Translators", source: "wldeh", wldehVersion: "en-t4t", bookFormat: "name", language: "en" },
  { id: "webbe", name: "World English Bible (British)", source: "bible-api", bookFormat: "name", language: "en" },
  { id: "cuv", name: "Chinese Union Version", source: "bible-api", bookFormat: "name", language: "zh" },
  { id: "bkr", name: "Bible kralická", source: "bible-api", bookFormat: "name", language: "cs" },
  { id: "almeida", name: "João Ferreira de Almeida", source: "bible-api", bookFormat: "name", language: "pt" },
  { id: "rccv", name: "Romanian Corrected Cornilescu", source: "bible-api", bookFormat: "name", language: "ro" },
];

const TRANSLATION_NAMES: Record<string, string> = {};
const TRANSLATION_IDS: string[] = [];
for (const t of TRANSLATIONS) {
  TRANSLATION_NAMES[t.id] = t.name;
  TRANSLATION_IDS.push(t.id);
}

function getBookNumber(bookName: string): number {
  const idx = BOOKS.findIndex((b) => b.name.toLowerCase() === bookName.toLowerCase());
  return idx >= 0 ? idx + 1 : 1;
}

function bookNameToSlug(bookName: string): string {
  return bookName.toLowerCase().replace(/\s+/g, "-");
}

async function fetchFromBibleApi(book: string, chapter: number, translation: string) {
  const res = await fetch(`${BIBLE_API}/${encodeURIComponent(book)}+${chapter}?translation=${translation}`);
  if (!res.ok) return null;
  const data = await res.json();
  return { verses: data.verses || [] };
}

async function fetchFromWldeh(book: string, chapter: number, version: string) {
  const slug = bookNameToSlug(book);
  const res = await fetch(`${CDN}/bibles/${version}/books/${slug}/chapters/${chapter}.json`);
  if (!res.ok) return null;
  const data = await res.json();
  const verses = (data.data || []).map((v: { verse: string; text: string }) => ({
    verse: Number(v.verse),
    text: v.text,
  }));
  return { verses };
}

async function fetchFromRkeplin(book: string, chapter: number, translation: string) {
  const bookNum = getBookNumber(book);
  const res = await fetch(`${RKEPLIN}/books/${bookNum}/chapters/${chapter}?translation=${translation.toUpperCase()}`);
  if (!res.ok) return null;
  const data = await res.json();
  const verses = (Array.isArray(data) ? data : []).map((v: { verseId: number; verse: string }) => ({
    verse: v.verseId,
    text: v.verse,
  }));
  return { verses };
}

// Chapter cache: Cloudflare Cache API (shared across isolates) with in-memory
// fallback for Node/tests. Scripture is immutable — cache 1h + SWR 24h so the
// third-party APIs are neither a latency nor an availability SPOF.
interface ChapterVerses {
  verses: { verse: number; text: string }[];
}
const chapterMemoryCache = new Map<string, { time: number; value: ChapterVerses }>();
const CHAPTER_TTL_MS = 60 * 60 * 1000;

function chapterCacheKey(book: string, chapter: number, translationId: string): string {
  return `bible:${translationId}:${book.toLowerCase()}:${chapter}`;
}

type CfCaches = { default: { match(r: string): Promise<Response | undefined>; put(r: string, res: Response): Promise<void> } };

async function readCachedChapter(key: string): Promise<ChapterVerses | null> {
  try {
    const cache = (globalThis as unknown as { caches?: CfCaches }).caches?.default;
    if (cache) {
      const hit = await cache.match(`https://cache.local/${key}`);
      if (hit) return (await hit.json()) as ChapterVerses;
    }
  } catch {
    // Cache API unavailable — fall through to memory.
  }
  const mem = chapterMemoryCache.get(key);
  if (mem && Date.now() - mem.time < CHAPTER_TTL_MS) return mem.value;
  return null;
}

async function writeCachedChapter(key: string, value: ChapterVerses): Promise<void> {
  chapterMemoryCache.set(key, { time: Date.now(), value });
  if (chapterMemoryCache.size > 500) {
    const oldest = chapterMemoryCache.keys().next();
    if (!oldest.done) chapterMemoryCache.delete(oldest.value);
  }
  try {
    const cache = (globalThis as unknown as { caches?: CfCaches }).caches?.default;
    if (cache) {
      await cache.put(
        `https://cache.local/${key}`,
        new Response(JSON.stringify(value), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
          },
        })
      );
    }
  } catch {
    // non-fatal
  }
}

async function fetchChapter(book: string, chapter: number, translationId: string): Promise<ChapterVerses | null> {
  const info = TRANSLATIONS.find((t) => t.id === translationId);
  if (!info) return null;
  const key = chapterCacheKey(book, chapter, translationId);
  const cached = await readCachedChapter(key);
  if (cached) return cached;

  let result: ChapterVerses | null = null;
  if (info.source === "bible-api") {
    result = await fetchFromBibleApi(book, chapter, translationId);
  } else if (info.source === "wldeh" && info.wldehVersion) {
    result = await fetchFromWldeh(book, chapter, info.wldehVersion);
  } else if (info.source === "rkeplin") {
    result = await fetchFromRkeplin(book, chapter, translationId);
  }
  if (result) await writeCachedChapter(key, result);
  return result;
}

bibleRoutes.get("/books", (c) => {
  publicCache(c, 3600, 86400);
  return c.json({
    books: BOOKS,
    translations: TRANSLATION_IDS,
    translationNames: TRANSLATION_NAMES,
  });
});

bibleRoutes.get("/verses/:book/:chapter", rateLimit, async (c) => {
  const book = c.req.param("book");
  const chapter = Number(c.req.param("chapter"));
  const translation = c.req.query("translation") || "kjv";
  const translationId = translation.toLowerCase();

  try {
    const result = await fetchChapter(book, chapter, translationId);
    // Scripture is immutable: safe for long edge/browser caching.
    publicCache(c, 3600, 86400);
    if (!result) {
      return c.json({ verses: [], book, chapter, translation: translationId, translationName: TRANSLATION_NAMES[translationId] || translationId.toUpperCase() });
    }
    return c.json({
      verses: result.verses,
      book,
      chapter,
      translation: translationId,
      translationName: TRANSLATION_NAMES[translationId] || translationId.toUpperCase(),
    });
  } catch {
    return c.json({ verses: [], book, chapter, translation: translationId, translationName: "Error" });
  }
});

bibleRoutes.get("/daily", rateLimit, async (c) => {
  const translation = (c.req.query("translation") || "kjv") as string;
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const dailyVerses = [
    { book: "Psalms", chapter: 118, verse: 24 },
    { book: "Jeremiah", chapter: 29, verse: 11 },
    { book: "Philippians", chapter: 4, verse: 13 },
    { book: "Isaiah", chapter: 40, verse: 31 },
    { book: "Psalms", chapter: 23, verse: 1 },
    { book: "John", chapter: 3, verse: 16 },
    { book: "Romans", chapter: 8, verse: 28 },
    { book: "Psalms", chapter: 46, verse: 10 },
    { book: "Proverbs", chapter: 3, verse: 5 },
    { book: "Joshua", chapter: 1, verse: 9 },
    { book: "2 Corinthians", chapter: 5, verse: 17 },
    { book: "Ephesians", chapter: 2, verse: 8 },
    { book: "Psalms", chapter: 121, verse: 1 },
    { book: "Romans", chapter: 15, verse: 13 },
    { book: "Psalms", chapter: 34, verse: 8 },
    { book: "Matthew", chapter: 11, verse: 28 },
    { book: "Psalms", chapter: 20, verse: 4 },
    { book: "Isaiah", chapter: 43, verse: 2 },
    { book: "Hebrews", chapter: 11, verse: 1 },
    { book: "Psalms", chapter: 27, verse: 1 },
    { book: "1 Corinthians", chapter: 13, verse: 4 },
    { book: "John", chapter: 14, verse: 6 },
    { book: "Psalms", chapter: 37, verse: 4 },
    { book: "Romans", chapter: 12, verse: 2 },
    { book: "Micah", chapter: 6, verse: 8 },
    { book: "Galatians", chapter: 5, verse: 22 },
    { book: "Psalms", chapter: 62, verse: 8 },
    { book: "Colossians", chapter: 3, verse: 23 },
    { book: "1 Peter", chapter: 5, verse: 7 },
    { book: "Psalms", chapter: 16, verse: 8 },
    { book: "Matthew", chapter: 5, verse: 14 },
    { book: "Philippians", chapter: 3, verse: 14 },
    { book: "1 John", chapter: 4, verse: 19 },
    { book: "Psalms", chapter: 9, verse: 10 },
    { book: "Hebrews", chapter: 12, verse: 1 },
    { book: "Romans", chapter: 10, verse: 9 },
    { book: "Psalms", chapter: 19, verse: 14 },
    { book: "Isaiah", chapter: 55, verse: 6 },
    { book: "Deuteronomy", chapter: 7, verse: 9 },
    { book: "Zephaniah", chapter: 3, verse: 17 },
    { book: "1 Chronicles", chapter: 16, verse: 34 },
    { book: "Psalms", chapter: 136, verse: 1 },
    { book: "Ephesians", chapter: 1, verse: 11 },
    { book: "Romans", chapter: 5, verse: 8 },
    { book: "James", chapter: 1, verse: 17 },
    { book: "Psalms", chapter: 33, verse: 4 },
    { book: "Psalms", chapter: 85, verse: 8 },
    { book: "Psalms", chapter: 100, verse: 5 },
    { book: "Lamentations", chapter: 3, verse: 22 },
    { book: "Nahum", chapter: 1, verse: 7 },
    { book: "Psalms", chapter: 30, verse: 5 },
    { book: "Psalms", chapter: 34, verse: 4 },
    { book: "Psalms", chapter: 145, verse: 9 },
    { book: "Deuteronomy", chapter: 10, verse: 12 },
    { book: "Psalms", chapter: 86, verse: 5 },
    { book: "Psalms", chapter: 92, verse: 1 },
    { book: "Psalms", chapter: 107, verse: 1 },
    { book: "Psalms", chapter: 119, verse: 105 },
    { book: "Proverbs", chapter: 15, verse: 33 },
    { book: "Proverbs", chapter: 18, verse: 10 },
    { book: "Psalms", chapter: 66, verse: 20 },
    { book: "Psalms", chapter: 84, verse: 11 },
    { book: "Psalms", chapter: 103, verse: 1 },
    { book: "Psalms", chapter: 103, verse: 8 },
    { book: "Psalms", chapter: 111, verse: 10 },
    { book: "Psalms", chapter: 125, verse: 1 },
    { book: "Psalms", chapter: 138, verse: 8 },
  ];
  const idx = dayOfYear % dailyVerses.length;
  const ref = dailyVerses[idx];
  try {
    const result = await fetchChapter(ref.book, ref.chapter, translation);
    // Changes once a day at most.
    publicCache(c, 3600, 86400);
    if (!result) {
      return c.json({ text: "The Lord is my shepherd; I shall not want.", reference: "Psalms 23:1 (KJV)", translation });
    }
    const verse = result.verses.find((v: { verse: number }) => v.verse === ref.verse);
    return c.json({
      text: verse ? verse.text : (result.verses?.[0]?.text || ""),
      reference: `${ref.book} ${ref.chapter}:${ref.verse}`,
      translation,
    });
  } catch {
    return c.json({ text: "The Lord is my shepherd; I shall not want.", reference: "Psalms 23:1 (KJV)", translation });
  }
});

bibleRoutes.get("/search", rateLimit, async (c) => {
  const query = c.req.query("q");
  const translation = (c.req.query("translation") || "kjv") as string;
  const limit = Math.min(Math.max(Number(c.req.query("limit")) || 20, 1), 50);
  const offset = Math.max(Number(c.req.query("offset")) || 0, 0);

  if (!query || query.length < 3) {
    return c.json({ results: [], error: "Query must be at least 3 characters" });
  }
  if (query.length > 100) {
    return c.json({ results: [], error: "Query too long" });
  }

  const cacheKey = `${query.toLowerCase().slice(0, 80)}:${translation}:${limit}:${offset}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.time < 1000 * 60 * 60) {
    publicCache(c, 60, 300);
    return c.json(cached.results);
  }

  const results: Array<{ book: string; chapter: number; verse: number; text: string }> = [];
  const lowerQuery = query.toLowerCase();
  const maxBooks = 3;
  const maxChapters = 3;
  const searchTimeout = 8000;
  const startTime = Date.now();

  for (const book of BOOKS.slice(0, maxBooks)) {
    if (results.length >= limit + offset) break;
    if (Date.now() - startTime > searchTimeout) break;
    for (let ch = 1; ch <= Math.min(book.chapters, maxChapters); ch++) {
      if (results.length >= limit + offset) break;
      if (Date.now() - startTime > searchTimeout) break;
      try {
        const result = await fetchChapter(book.name, ch, translation);
        if (!result) continue;
        const matches = (result.verses || []).filter(
          (v: { verse: number; text: string }) => v.text.toLowerCase().includes(lowerQuery)
        );
        for (const m of matches) {
          results.push({ book: book.name, chapter: ch, verse: m.verse, text: m.text.slice(0, 150) });
        }
        if (matches.length > 0) {
          await new Promise((r) => setTimeout(r, 200));
        }
      } catch {
        continue;
      }
    }
  }

  const paginated = results.slice(offset, offset + limit);
  const payload = { results: paginated, total: results.length, query, translation, limit, offset };
  searchCache.set(cacheKey, { time: Date.now(), results: payload });
  publicCache(c, 60, 300);
  return c.json(payload);
});

const noteSchema = z.object({
  book: z.string().min(1).max(100),
  verse: z.string().min(1).max(20),
  text: z.string().min(1).max(2000),
});

bibleRoutes.post("/notes", requireAuth, zValidator("json", noteSchema), async (c) => {
  const supabase = getSupabase(c.env as Record<string, string>);
  const body = c.req.valid("json");
  const user = c.get("user") as JwtPayload;
  const { data: note, error } = await supabase.from("bible_notes").insert({
    user_id: user.userId,
    book: body.book,
    verse: body.verse,
    text: body.text,
  }).select().single();
  if (error) {
    console.error("[BIBLE] note create error:", error.message);
    return c.json({ error: "Failed to save note." }, 500);
  }
  return c.json(note, 201);
});

bibleRoutes.get("/notes", requireAuth, async (c) => {
  const supabase = getSupabase(c.env as Record<string, string>);
  const user = c.get("user") as JwtPayload;
  const { data, error } = await supabase.from("bible_notes").select("*").eq("user_id", user.userId);
  if (error) {
    console.error("[BIBLE] notes error:", error.message);
    return c.json({ error: "Failed to load notes." }, 500);
  }
  return c.json(data);
});
