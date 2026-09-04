import type { Event } from "../data/demoData";

/** Parse a YYYY-MM-DD date string as a local-midnight Date. */
export function parseEventDate(value: string): Date {
  const [y, m, d] = (value || "").split("-").map(Number);
  if (y && m && d) return new Date(y, m - 1, d);
  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Last day of an event. Multi-day gatherings stay live until their end
 * date passes; single-day events expire after their date passes.
 */
export function eventEndDate(event: Pick<Event, "date" | "endDate">): Date {
  return event.endDate ? parseEventDate(event.endDate) : parseEventDate(event.date);
}

/** True while the event is still running or in the future. */
export function isUpcomingEvent(event: Pick<Event, "date" | "endDate">, today: Date = startOfToday()): boolean {
  return eventEndDate(event).getTime() >= today.getTime();
}

/** Upcoming events, soonest first. */
export function getUpcomingEvents<T extends Pick<Event, "date" | "endDate">>(list: T[]): T[] {
  const today = startOfToday();
  return list
    .filter((e) => isUpcomingEvent(e, today))
    .sort((a, b) => parseEventDate(a.date).getTime() - parseEventDate(b.date).getTime());
}

/** Expired events, most recently concluded first. */
export function getPastEvents<T extends Pick<Event, "date" | "endDate">>(list: T[]): T[] {
  const today = startOfToday();
  return list
    .filter((e) => !isUpcomingEvent(e, today))
    .sort((a, b) => eventEndDate(b).getTime() - eventEndDate(a).getTime());
}

/**
 * Normalize a raw API row (snake_case DB columns) into the camelCase
 * Event shape the UI consumes.
 */
export function normalizeEvent(row: Record<string, unknown>): Event {
  const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
  return {
    id: String(row.id ?? ""),
    title: str(row.title),
    date: str(row.date),
    endDate: typeof row.end_date === "string" && row.end_date ? row.end_date : undefined,
    dateRange: typeof row.date_range === "string" ? row.date_range : undefined,
    day: str(row.day),
    month: str(row.month),
    time: str(row.time),
    timezone: str(row.timezone, "EAT"),
    location: str(row.location),
    country: typeof row.country === "string" ? row.country : undefined,
    isOnline: Boolean(row.is_online ?? row.isOnline ?? false),
    image: str(row.image),
    description: str(row.description),
    badge: typeof row.badge === "string" ? row.badge : undefined,
    partnershipUrl: typeof row.partnership_url === "string" ? row.partnership_url : undefined,
  };
}
