import { Hono } from "hono";
import { getSupabase } from "../lib/supabase";
import { publicCache } from "../lib/httpCache";

export const streamRoutes = new Hono();

streamRoutes.get("/upcoming", async (c) => {
  const supabase = getSupabase(c.env as Record<string, string>);
  const { data, error } = await supabase
    .from("events")
    .select("id, title, location, date, time")
    .eq("is_online", true)
    .order("date", { ascending: true })
    .limit(5);

  if (error || !data) {
    return c.json([]);
  }
  publicCache(c);

  const mapped = data.map(e => ({
    id: e.id.toString(),
    title: e.title,
    host: e.location || "Online Ministry",
    time: `${new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} at ${e.time}`
  }));

  return c.json(mapped);
});
