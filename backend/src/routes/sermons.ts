import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getSupabase } from "../lib/supabase";
import { requireAdmin } from "../lib/jwt";
import { publicCache } from "../lib/httpCache";

export const sermonRoutes = new Hono();

sermonRoutes.get("/", async (c) => {
  const supabase = getSupabase(c.env as Record<string, string>);
  const category = (c.req.query("category") || "").slice(0, 50);
  const query = (c.req.query("q") || "").slice(0, 100);
  const limit = Math.min(Math.max(Number(c.req.query("limit")) || 50, 1), 100);
  const offset = Math.max(Number(c.req.query("offset")) || 0, 0);

  let q = supabase.from("sermons").select("*");
  if (category && category !== "All") {
    q = q.eq("category", category);
  }
  if (query) {
    // Sanitize for PostgREST or-filter: strip wildcards and delimiters.
    const safe = query.replace(/[%(),"]/g, "").trim().slice(0, 100);
    if (safe) {
      const p = `%${safe}%`;
      q = q.or(`title.ilike.${p},speaker.ilike.${p},ministry.ilike.${p}`);
    }
  }

  const { data, error } = await q.range(offset, offset + limit - 1);
  if (error) {
    console.error("[SERMONS] list error:", error.message);
    return c.json({ error: "Failed to load sermons." }, 500);
  }
  publicCache(c);
  return c.json(data);
});

sermonRoutes.get("/categories", async (c) => {
  publicCache(c, 3600, 86400);
  return c.json([
    "All", "Faith", "Hope", "Love", "Discipleship", "Leadership", "Worship", "Prophecy", "Healing", "Finance", "Relationships",
  ]);
});

const createSermonSchema = z.object({
  title: z.string().min(1).max(200),
  speaker: z.string().min(1).max(100),
  ministry: z.string().max(100).optional().default(""),
  duration: z.string().min(1).max(20),
  category: z.string().min(1).max(50),
  thumbnail: z.string().max(500).optional().default("/images/sermon-default.jpg"),
  date: z.string().max(50).optional().default(() => new Date().toISOString()),
});

const updateSermonSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  speaker: z.string().min(1).max(100).optional(),
  ministry: z.string().max(100).optional(),
  duration: z.string().min(1).max(20).optional(),
  category: z.string().min(1).max(50).optional(),
  thumbnail: z.string().max(500).optional(),
  date: z.string().max(50).optional(),
});

sermonRoutes.post("/", requireAdmin, zValidator("json", createSermonSchema), async (c) => {
  const supabase = getSupabase(c.env as Record<string, string>);
  const data = c.req.valid("json");
  const { data: sermon, error } = await supabase.from("sermons").insert(data).select().single();
  if (error) {
    console.error("[SERMONS] create error:", error.message);
    return c.json({ error: "Failed to create sermon." }, 500);
  }
  return c.json(sermon, 201);
});

sermonRoutes.patch("/:id", requireAdmin, zValidator("json", updateSermonSchema), async (c) => {
  const supabase = getSupabase(c.env as Record<string, string>);
  const id = Number(c.req.param("id"));
  const body = c.req.valid("json");
  const { data: sermon, error } = await supabase.from("sermons").update(body).eq("id", id).select().single();
  if (error) {
    console.error("[SERMONS] update error:", error.message);
    return c.json({ error: "Failed to update sermon." }, 500);
  }
  return c.json(sermon);
});

sermonRoutes.delete("/:id", requireAdmin, async (c) => {
  const supabase = getSupabase(c.env as Record<string, string>);
  const id = Number(c.req.param("id"));
  const { error } = await supabase.from("sermons").delete().eq("id", id);
  if (error) {
    console.error("[SERMONS] delete error:", error.message);
    return c.json({ error: "Failed to delete sermon." }, 500);
  }
  return c.json({ success: true });
});
