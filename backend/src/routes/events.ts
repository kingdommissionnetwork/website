import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getSupabase } from "../lib/supabase";
import { requireAdmin } from "../lib/jwt";
import { sendEventRsvpEmail } from "../lib/email";

export const eventRoutes = new Hono();

eventRoutes.get("/", async (c) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("events").select("*").order("date", { ascending: false });
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  date: z.string().min(1).max(20),
  endDate: z.string().min(1).max(20).optional(),
  time: z.string().min(1).max(20),
  location: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  isOnline: z.boolean().optional().default(false),
  month: z.string().max(10).optional(),
  day: z.string().max(5).optional(),
  timezone: z.string().max(10).optional().default("EST"),
  image: z.string().max(500).optional().default("/images/event-worship-night.jpg"),
});

const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  date: z.string().min(1).max(20).optional(),
  endDate: z.string().min(1).max(20).optional().nullable(),
  time: z.string().min(1).max(20).optional(),
  location: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  isOnline: z.boolean().optional(),
  month: z.string().max(10).optional(),
  day: z.string().max(5).optional(),
  timezone: z.string().max(10).optional(),
  image: z.string().max(500).optional(),
});

// API payloads use camelCase, DB columns use snake_case.
function toEventRow(data: Record<string, unknown>): Record<string, unknown> {
  const { isOnline, endDate, ...rest } = data;
  return {
    ...rest,
    ...(isOnline !== undefined ? { is_online: isOnline } : {}),
    ...(endDate !== undefined ? { end_date: endDate } : {}),
  };
}

const rsvpSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

eventRoutes.post("/", requireAdmin, zValidator("json", createEventSchema), async (c) => {
  const supabase = getSupabase();
  const data = c.req.valid("json");
  const d = new Date(data.date);
  const { data: event, error } = await supabase.from("events").insert(toEventRow({
    ...data,
    month: data.month || d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: data.day || String(d.getDate()).padStart(2, "0"),
  })).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(event, 201);
});

eventRoutes.patch("/:id", requireAdmin, zValidator("json", updateEventSchema), async (c) => {
  const supabase = getSupabase();
  const id = Number(c.req.param("id"));
  const body = c.req.valid("json");
  const { data: event, error } = await supabase.from("events").update(toEventRow({ ...body })).eq("id", id).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(event);
});

eventRoutes.delete("/:id", requireAdmin, async (c) => {
  const supabase = getSupabase();
  const id = Number(c.req.param("id"));
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

eventRoutes.post("/:id/rsvp", zValidator("json", rsvpSchema), async (c) => {
  const supabase = getSupabase();
  const eventId = Number(c.req.param("id"));
  const { name, email } = c.req.valid("json");
  const { data: rsvp, error } = await supabase.from("event_rsvps").insert({
    event_id: eventId,
    name,
    email,
  }).select().single();
  if (error) return c.json({ error: error.message }, 500);

  const { data: event } = await supabase.from("events").select("title, date, location, description").eq("id", eventId).single();
  const eventTitle = event?.title || "Kingdom Missions Event";

  try {
    await sendEventRsvpEmail(c, email, name, eventTitle, {
      eventDate: event?.date,
      eventLocation: event?.location,
      eventDescription: event?.description,
    });
  } catch (err) {
    console.error("[EMAIL] Failed to send RSVP confirmation:", err);
  }

  return c.json(rsvp, 201);
});
