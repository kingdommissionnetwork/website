import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getSupabase, createAuthClient } from "../lib/supabase";
import { signToken, verifyToken } from "../lib/jwt";
import { rateLimit, strictRateLimit } from "../lib/rateLimiter";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";

export const authRoutes = new Hono();

const loginSchema = z.object({
  email: z.string().email().max(100),
  password: z.string().min(1).max(100),
});

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email().max(100),
  password: z.string().min(6).max(100),
});

const googleSchema = z.object({
  token: z.string().min(1).max(5000),
});

const ALLOWED_RESET_ORIGINS = [
  "https://kingdommissionsnetwork.org",
  "https://www.kingdommissionsnetwork.org",
  "https://kingdommissionnetwork.org",
  "https://www.kingdommissionnetwork.org",
  "https://heavenlykingdomnetwork.org",
  "https://www.heavenlykingdomnetwork.org",
];

function safeResetBase(c: { req: { header: (n: string) => string | undefined } }): string {
  const origin = c.req.header("origin") || "";
  if (ALLOWED_RESET_ORIGINS.includes(origin)) return origin;
  return "https://kingdommissionsnetwork.org";
}

function setAuthCookie(c: { req: { url: string } }, token: string) {
  // Secure only on HTTPS so localhost dev still receives the cookie.
  let secure = true;
  try {
    if (new URL(c.req.url).protocol === "http:") secure = false;
  } catch {
    secure = true;
  }
  (setCookie as (c: unknown, n: string, v: string, o: Record<string, unknown>) => void)(c, "token", token, {
    httpOnly: true,
    secure,
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

authRoutes.post("/login", rateLimit, zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  const authClient = createAuthClient(c.env as Record<string, string>);
  const { data: authUser, error } = await authClient.auth.signInWithPassword({ email, password });
  if (error || !authUser.user) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const supabase = getSupabase(c.env as Record<string, string>);
  let { data: user } = await supabase.from("users").select("*").eq("id", authUser.user.id).single();
  
  if (!user && authUser.user.email) {
    // Fallback: check by email in case auth ID differs
    const { data: userByEmail } = await supabase.from("users").select("*").eq("email", authUser.user.email).single();
    if (userByEmail) {
      user = userByEmail;
    } else {
      // Auto-provision profile if missing. New profiles are ALWAYS member —
      // elevated roles are granted only by an existing admin via /admin APIs.
      // (Never derive roles from the email string; that allows self-promotion.)
      const { data: created } = await supabase.from("users").insert({
        id: authUser.user.id,
        name: authUser.user.user_metadata?.full_name || authUser.user.email.split("@")[0] || "User",
        email: authUser.user.email,
        role: "member",
      }).select().single();
      user = created;
    }
  }

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Check if account has been suspended
  if (user.email) {
    const { data: suspendedSub } = await supabase
      .from("subscriptions")
      .select("status")
      .ilike("subscriber_email", user.email)
      .eq("status", "suspended")
      .limit(1)
      .maybeSingle();

    if (suspendedSub) {
      return c.json({ error: "Your account has been suspended. Please contact administration for assistance." }, 403);
    }
  }

  const token = await signToken({ userId: user.id, role: user.role || "member", name: user.name, email: user.email || undefined }, c.env as Record<string, string>);
  setAuthCookie(c, token);
  // NOTE: token is set via httpOnly cookie only. It is intentionally NOT
  // returned in the body to avoid localStorage theft via XSS.
  return c.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
  });
});

authRoutes.post("/register", strictRateLimit, zValidator("json", registerSchema), async (c) => {
  const { name, email, password } = c.req.valid("json");

  const authClient = createAuthClient(c.env as Record<string, string>);
  const { data: authUser, error } = await authClient.auth.signUp({ email, password });
  if (error) {
    if (error.message.includes("already")) {
      return c.json({ error: "Email already registered" }, 409);
    }
    console.error("[AUTH] signup error:", error.message);
    return c.json({ error: "Registration failed. Please try again." }, 400);
  }
  if (!authUser.user) {
    return c.json({ error: "Registration failed" }, 500);
  }

  const supabase = getSupabase(c.env as Record<string, string>);
  await supabase.from("users").insert({ id: authUser.user.id, name, email, role: "member" });
  const { data: user } = await supabase.from("users").select("*").eq("id", authUser.user.id).single();

  if (!user) return c.json({ error: "Failed to create profile" }, 500);

  const token = await signToken({ userId: user.id, role: user.role || "member", name: user.name, email: user.email || undefined }, c.env as Record<string, string>);
  setAuthCookie(c, token);
  return c.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

authRoutes.post("/google", strictRateLimit, zValidator("json", googleSchema), async (c) => {
  const authClient = createAuthClient(c.env as Record<string, string>);
  const { token: idToken } = c.req.valid("json");

  const { data, error } = await authClient.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
  });
  if (error || !data.user) {
    return c.json({ error: "Google authentication failed" }, 401);
  }

  const supabase = getSupabase(c.env as Record<string, string>);
  const authUser = data.user;
  let { data: user } = await supabase.from("users").select("*").eq("id", authUser.id).single();
  if (!user) {
    const { data: created } = await supabase.from("users").insert({
      id: authUser.id,
      name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User",
      email: authUser.email!,
      role: "member",
      avatar: authUser.user_metadata?.avatar_url || null,
    }).select().single();
    user = created;
  }
  if (!user) return c.json({ error: "Failed to create profile" }, 500);

  const jwt = await signToken({ userId: user.id, role: user.role || "member", name: user.name, email: user.email || undefined }, c.env as Record<string, string>);
  setAuthCookie(c, jwt);
  return c.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
  });
});

authRoutes.post("/forgot-password", strictRateLimit, zValidator("json", z.object({ email: z.string().email() })), async (c) => {
  const { email } = c.req.valid("json");
  // User-context flow: must use the publishable client, never service-role.
  const authClient = createAuthClient(c.env as Record<string, string>);
  const { error } = await authClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${safeResetBase(c)}/reset-password`,
  });
  // Always return ok to avoid email enumeration; never echo provider errors.
  if (error) console.error("[AUTH] resetPasswordForEmail error:", error.message);
  return c.json({ ok: true, message: "If that email is registered, a reset link has been sent." });
});

authRoutes.post("/reset-password", strictRateLimit, zValidator("json", z.object({
  password: z.string().min(6).max(100),
  token: z.string().min(1).max(5000),
})), async (c) => {
  const { password, token } = c.req.valid("json");
  const authClient = createAuthClient(c.env as Record<string, string>);
  const { data: { user }, error: userError } = await authClient.auth.getUser(token);
  if (userError || !user) return c.json({ error: "Invalid or expired token" }, 400);

  const supabase = getSupabase(c.env as Record<string, string>);
  const { error } = await supabase.auth.admin.updateUserById(user.id, { password });
  if (error) return c.json({ error: "Failed to update password." }, 400);
  return c.json({ ok: true, message: "Password updated successfully." });
});

authRoutes.post("/logout", async (c) => {
  deleteCookie(c, "token", { path: "/" });
  return c.json({ ok: true });
});

authRoutes.get("/me", async (c) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : getCookie(c, "token");

  if (!token) {
    return c.json({ error: "No token provided" }, 401);
  }

  try {
    const payload = await verifyToken(token, c.env as Record<string, string>);
    const supabase = getSupabase(c.env as Record<string, string>);
    const { data: user } = await supabase.from("users").select("*").eq("id", payload.userId).single();
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    return c.json({ id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar });
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
});
