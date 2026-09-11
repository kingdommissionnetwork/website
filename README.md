# Kingdom Mission Network

**Open-source church community platform** connecting believers worldwide through prayer, Bible study, sermons, events, and fellowship. Formerly Heavenly Kingdom Network (HKN).

> **Official Website:** [kingdommissionnetwork.org](https://kingdommissionnetwork.org) · **Repository:** [github.com/kingdommissionnetwork/website](https://github.com/kingdommissionnetwork/website)

---

## Features

- **Prayer Wall** — Share prayer requests, pray for others, and build community. Real-time moderation with approve/flag/delete controls.
- **Bible Reader** — Read scripture with **22 translations** from 3 API sources (bible-api.com, wldeh/bible-api CDN, rkeplin). Includes KJV, WEB, ASV, BSB, NIV, NLT, ESV, Geneva Bible, and more. Quick-access navigation by book/chapter, verse copy, bookmarking, and study notes.
- **Sermon Library** — Searchable collection of teachings from ministries worldwide. Filter by category, speaker, or keyword.
- **Events Calendar** — Interactive calendar with RSVP, online/offline events, and event management.
- **Upcoming Streams** — Schedule of upcoming live worship services and online events with time, title, and host information.
- **Donations & Giving** — Multi-gateway payments: Paystack (cards + M-Pesa), PayPal. 10 currencies supported.
- **Admin Dashboard** — Manage users, moderate prayer requests, create/edit/delete sermons and events, view donation analytics, and platform settings.
- **User Authentication** — Login, registration, forgot/reset password, JWT-based sessions.
- **Mobile Responsive** — Fully responsive design with mobile navigation, staggered animations, and skeleton loading states.

## Tech Stack

| Category | Technology |
|---|---|
| **Frontend** | React 19 + TypeScript 5.9 |
| **Bundler** | Vite 7.2 |
| **Routing** | react-router-dom v7 (BrowserRouter) |
| **Styling** | Tailwind CSS v3.4 + shadcn/ui (New York) |
| **Animation** | Framer Motion |
| **Forms** | react-hook-form + zod |
| **Icons** | lucide-react |
| **Backend** | Hono (Cloudflare Workers) |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Hono JWT (Web Crypto API) |
| **Payments** | Paystack + PayPal + Wise FX |
| **Deployment** | Cloudflare Workers with assets (CI/CD via GitHub Actions) |
| **Testing** | Vitest + React Testing Library + Playwright E2E |

## Bible Translations Available

22 translations across 3 API sources:

| Source | Translations |
|---|---|
| **bible-api.com** | KJV, WEB, ASV, BBE, Darby, YLT, WEB-BE, CUV (Chinese), BKR (Czech), Almeida (Portuguese), RCCV (Romanian) |
| **wldeh/bible-api CDN** | BSB, Geneva 1599, LSV, FBV, Revised Version, WMB, Douay-Rheims, T4T |
| **rkeplin** | NIV, NLT, ESV |

## Getting Started

```bash
# Clone the repository
git clone https://github.com/geginj20/heavenly-kingdom-network.git
cd heavenly-kingdom-network

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Lint code
npm run lint
```

## Project Structure

```
src/
├── components/       # Shared UI components (shadcn-style, New York)
├── pages/            # Route pages
├── hooks/            # Custom React hooks
├── lib/              # API client, auth, toast, utilities
├── data/             # Type definitions
└── test/             # Vitest test files
backend/
├── src/
│   ├── app.ts        # Canonical Hono app (CORS, middleware, mounts)
│   ├── index.ts      # Worker entry (wraps app.ts, canonical deploy)
│   ├── routes/       # Hono route handlers
│   └── lib/          # Supabase client, JWT, rate limiter, env
├── drizzle/          # Replayable SQL migrations (canonical schema)
└── docs/             # Rate-limiting production controls
functions/api/        # Legacy Pages Functions wrapper (do not extend)
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | TypeScript check + Vite production build |
| `npm run lint` | Run ESLint across all source files |
| `npm run test` | Run Vitest test suite |
| `npm run test:e2e` | Run Playwright E2E suite |
| `npm run preview` | Preview production build locally |

## Architecture

- **Frontend:** React SPA with BrowserRouter, deployed as Worker assets
- **Backend:** Hono REST API on Cloudflare Workers (`backend/src/app.ts` canonical; `functions/api/[[path]].ts` is a legacy Pages wrapper)
- **Database:** Supabase PostgreSQL; replayable schema in `backend/drizzle/*.sql`; backend connects via service-role key; authorization at API layer (`requireAdmin` + `requireAdminScope`)
- **Authentication:** JWT-based with Hono middleware (httpOnly cookie), 7-day expiry
- **Rate Limiting:** In-memory per-isolate backstop (20 req/min standard, 5 req/min strict) + required Cloudflare WAF rules (see `docs/rate-limiting.md`)
- **Payments:** Paystack for African currencies (M-Pesa + cards), PayPal for international, Wise for FX rates
- **CI/CD:** GitHub Actions — lint → test → build → `wrangler deploy` (Worker with assets)

## License

MIT — see [LICENSE](LICENSE)
