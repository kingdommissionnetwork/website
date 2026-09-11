# Kingdom Mission Network — Backend

Hono API on Cloudflare Workers (`src/app.ts` canonical, `src/index.ts` Worker entry).

## Setup

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Configure Supabase (Cloudflare secrets in production, `.dev.vars` locally):
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxxxxxxxxx
   SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxx
   JWT_SECRET=generate-a-secure-random-64-character-secret
   ```

3. Apply the database schema (replayable SQL, in order):
   ```bash
   # In Supabase SQL editor, run:
   # drizzle/0000_swift_spencer_smythe.sql
   # drizzle/0000_rpc_functions.sql
   # drizzle/0001_unique_payment_reference.sql
   # drizzle/0002_mpesa_stk_sessions.sql
   # drizzle/0003_billing_tables.sql
   # drizzle/0004_missing_columns.sql
   ```

4. Seed demo data:
   ```bash
   npm run seed
   ```
   The seed script creates demo users with random passwords (printed to console).
   Provision real admins via `POST /api/admin/invite` as a super admin.

5. Start the dev server:
   ```bash
   npm run dev
   ```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | Login (JWT httpOnly cookie) |
| GET | `/api/prayers` | List prayers |
| POST | `/api/prayers` | Submit prayer |
| POST | `/api/prayers/:id/pray` | Pray for a request |
| GET | `/api/sermons` | List sermons |
| GET | `/api/events` | List events |
| POST | `/api/events/:id/rsvp` | RSVP to event |
| GET | `/api/bible/books` | Bible book list |
| GET | `/api/bible/verses/:book/:chapter` | Get verses (cached, 3 sources) |
| GET | `/api/admin/stats` | Admin dashboard stats (cached 60s) |
| GET | `/api/admin/prayers` | Admin prayer management |
