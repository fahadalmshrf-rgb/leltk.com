# ليلتك (Lailtak)

A fully Arabic, RTL wedding venue reservation platform for Riyadh, Saudi Arabia.
Two web apps under one project:
- **User app** (`/`) — couples browse and book wedding halls
- **Merchant portal** (`/merchant/`) — venue owners manage their listings and bookings
- **Admin panel** (`/admin/`) — internal tool (`@workspace/lailtak-admin`) for the founding team to enter venues during field-work phase; session auth via `admins` table, routes in `artifacts/api-server/src/routes/admin.ts`

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, serves both built apps and `/api`)
- `PORT=5173 BASE_PATH="/" pnpm --filter @workspace/lailtak run build` — rebuild user app (output served from `dist/public`)
- `PORT=5173 BASE_PATH="/merchant/" pnpm --filter @workspace/lailtak-merchant run build` — rebuild merchant portal
- `PORT=5173 BASE_PATH="/admin/" pnpm --filter @workspace/lailtak-admin run build` — rebuild admin panel
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Frontend: React + Vite, TailwindCSS, Framer Motion
- API codegen: Orval (from OpenAPI spec)

## Architecture decisions

- **Single server, multiple apps:** Vite preview workflows hit a known Replit health-check issue (DIDNT_OPEN_A_PORT) on this template, so the user app and merchant portal are pre-built to static files and served by the Express API server. Only the api-server workflow runs; the two `web` workflows are sleep no-ops.
- **Path-based routing:** API server serves `artifacts/lailtak/dist/public` at `/`, `artifacts/lailtak-merchant/dist/public` at `/merchant/`, and JSON API under `/api/`. SPA fallback on each app.
- **Rebuild flow:** edit React code → run the matching `pnpm --filter ... build` → restart the api-server workflow → live changes appear.

## Product

A two-sided marketplace for Saudi wedding halls (قاعات أفراح). Couples discover and reserve venues; hall owners list availability, menus, and pricing. Bookings, payments, reviews, and notifications all live in one platform. Riyadh first, Saudi-wide later.

## User preferences

- **Language:** All product UI in Arabic, RTL throughout. English only in code/comments.
- **Visual identity:** Luxurious gold + deep emerald green palette (royal Saudi wedding feel). Amiri font (classical Arabic calligraphy). Larger base font size (18px). Splash intro runs 8 seconds.
- **Theme scope:** Theme changes apply to the user app only unless explicitly stated. Merchant portal stays on its own theme.
- **Communication:** User prefers short, concrete answers. Make sensible product decisions and proceed.

## Roadmap

### Phase 1 — Foundation (next, ~2–3 weeks)
1. Database schema: venues, halls, photos, menus, pricing, availability, users, merchants, bookings, reviews
2. **Admin panel** at `/admin/` for field-work data entry (you + 1–2 teammates)
3. Image/file storage (App Storage) for venue photos and menu PDFs
4. Authentication for 3 roles: customer, merchant, admin
5. Define Riyadh district scope

### Phase 2 — Data gathering (your 6-month field work)
6. Target list of venues to visit (start ~50, scale to 200+)
7. Field visits: photos, capacity, pricing tiers, catering menus, owner contact, GPS
8. Listing-terms negotiation (commission vs flat fee vs free tier)
9. Continuous entry into admin panel
10. 5–10 real customer interviews to validate features

### Phase 3 — Customer features (~3–4 weeks)
11. Real search & filters (date, capacity, district, price, indoor/outdoor)
12. Per-venue availability calendar
13. Booking request flow (customer → merchant accept/reject)
14. Customer profile: bookings, favorites, history
15. Reviews & ratings (post-event only)
16. WhatsApp / SMS notifications (critical in KSA)

### Phase 4 — Merchant tools (~2–3 weeks)
17. Merchant self-serve onboarding + verification by admin
18. Merchant dashboard: bookings, calendar, edit venue
19. Real-time merchant notifications on new booking requests

### Phase 5 — Payments & business (~2–3 weeks)
20. Mada / Apple Pay / STC Pay (HyperPay or Moyasar)
21. Deposit + refund logic (e.g. 25% deposit, refundable until X days out)
22. Commission splits + merchant payouts
23. Commercial registration (سجل تجاري), VAT, Arabic terms & privacy

### Phase 6 — Launch (~1–2 weeks)
24. Soft launch in one Riyadh district with 10–20 verified venues
25. Instagram / TikTok content from real venue photos
26. Partnerships with wedding planners
27. Native mobile apps (later — web first)

### Admin panel spec (for Phase 1, step 2)
- **Venue CRUD:** name, district, address, GPS pin, capacity min/max, indoor/outdoor, parking, prayer area, women-only sections
- **Media:** drag-and-drop multi-photo upload, menu PDF upload
- **Pricing:** tiers for weekday / weekend / Ramadan / wedding season
- **Catering menu builder** + optional PDF
- **Amenities checklist:** sound system, lighting, kitchen, bridal room, etc.
- **Field-work tools:** status (`Not visited` → `Visited` → `Owner contacted` → `Agreement signed` → `Live`), private notes, owner contact, photos of business card / commercial registration
- **Map view** color-coded by status
- **"Convert to merchant account"** button that creates merchant login when owner signs on
- **Dashboard** with progress KPIs by district / status
- **Team access:** 2–3 admin users (you + teammates)

## Gotchas

- **API server stops on checkpoints** — restart `artifacts/api-server: API Server` workflow each session.
- **Never run `pnpm dev` at the root** — use workflows or `pnpm --filter ... run build`.
- **Vite `web` workflows do not pass Replit health checks** in this template; do not waste time debugging them. The Express server is the single source of truth.
- **After editing React code, rebuild + restart api-server**, otherwise changes won't appear.
- **Theme files:** user app theme lives in `artifacts/lailtak/src/index.css`; merchant theme is separate.

## Pointers

- Static serving setup: `artifacts/api-server/src/app.ts`
- User app theme/fonts: `artifacts/lailtak/src/index.css`
- Splash screen: `artifacts/lailtak/src/components/Splash.tsx`
- See the `pnpm-workspace` skill for workspace structure and conventions
- See the `artifacts` skill for adding/modifying artifact configuration
