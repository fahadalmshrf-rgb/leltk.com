# Threat Model

## Project Overview

Lailtak is a TypeScript pnpm workspace with a single Express 5 API server, PostgreSQL via Drizzle, and multiple clients: a public web app (`/`), a merchant web portal (`/merchant/`), an admin panel (`/admin/`), and an Expo mobile app. The production server serves static frontends and exposes JSON APIs under `/api`. The deployment is currently password-protected at the Replit infrastructure level (visibility: password), which limits direct external exposure.

Current production-relevant data includes venue listings, merchant business profiles, customer booking records, invitation data, reviews, admin-uploaded field-work materials, and application secrets such as `DATABASE_URL` and `SESSION_SECRET`.

Assumptions for future scans:
- `artifacts/mockup-sandbox/` is dev-only and should be ignored unless production reachability is demonstrated.
- Production runs with `NODE_ENV=production`.
- The admin panel at `/admin/` is implemented with bcrypt-hashed password authentication via the `admins` table.
- Merchant login uses email + bcrypt password (not CR number + phone as in an earlier version).
- Replit terminates TLS for deployed traffic.

## Assets

- **Customer booking data** — groom and bride names, contact phone numbers, event dates, guest counts, notes, booking status, and merchant-visible totals. Exposure or tampering would leak sensitive event information and disrupt reservations.
- **Merchant business data** — owner names, phone numbers, email addresses, commercial registration numbers, venue inventory, dashboard metrics, and booking queues. Exposure or tampering would affect merchant trust and marketplace operations.
- **Admin-uploaded field-work materials** — venue owner photographs, commercial registration scans, business card photos, and private notes uploaded via the admin panel. These live in the private object storage namespace and contain sensitive PII.
- **Invitation management tokens and RSVP data** — public and manage tokens, guest names, attendance decisions, party sizes, and messages. These tokens act as bearer secrets for invitation access.
- **Venue inventory and public trust signals** — availability, pricing, addresses, coordinates, ratings, and review counts. Tampering can mislead customers and merchants.
- **Application secrets and database access** — environment secrets and server-side DB privileges. Compromise would expose the entire dataset.

## Trust Boundaries

- **Browser/mobile client to API** — all request bodies, query parameters, route params, and headers are attacker-controlled. The API must authenticate and authorize protected actions server-side.
- **Public marketplace to merchant surfaces** — venue browsing is public, but merchant profiles, merchant dashboards, merchant venue mutation, and booking management are higher-trust surfaces and must not rely on client-side identity.
- **Public marketplace to admin surfaces** — the admin panel requires bcrypt password authentication against the `admins` table. Admin routes are protected by a `requireAdmin` middleware that checks `req.session.adminId`.
- **API to PostgreSQL** — the API has direct read/write access to all marketplace data. Query safety and row scoping are critical.
- **Public object storage vs private object storage** — `/api/storage/public-objects/*` is intentionally open; `/api/storage/objects/*` is intended to be private but currently has no authentication guard applied.
- **Invitation public token vs manage token boundary** — `publicToken` is intended for guest-facing invitation viewing and RSVP; `manageToken` is a bearer secret for owner-level invitation management.
- **Dev-only vs production code** — `artifacts/mockup-sandbox/` is out of scope by default; `artifacts/api-server/`, `artifacts/lailtak/`, `artifacts/lailtak-merchant/`, `artifacts/lailtak-admin/`, `artifacts/lailtak-mobile/`, and `lib/*` are production or shared scan targets.

## Scan Anchors

- Production entry point: `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/*.ts`
- Highest-risk server files: `artifacts/api-server/src/routes/auth.ts`, `artifacts/api-server/src/routes/admin.ts`, `artifacts/api-server/src/routes/merchants.ts`, `artifacts/api-server/src/routes/bookings.ts`, `artifacts/api-server/src/routes/invitations.ts`, `artifacts/api-server/src/routes/storage.ts`
- Shared data model: `lib/db/src/schema/*.ts`
- Merchant web auth is session-based (email + bcrypt password) in `artifacts/api-server/src/routes/auth.ts`
- Admin auth is session-based (username + bcrypt password) in `artifacts/api-server/src/routes/admin.ts`
- Active finding: `/api/storage/objects/*` serves private files without authentication (`artifacts/api-server/src/routes/storage.ts` line 120–165)
- Active finding: CORS is configured with `origin: true, credentials: true`; mitigated by `sameSite: "strict"` in production
- Dev-only area usually ignored: `artifacts/mockup-sandbox/`, `artifacts/lailtak-mobile/server/serve.js`

## Threat Categories

### Spoofing

Merchant actions are bound to `req.session.merchantId` set after a successful email + bcrypt password login. Admin actions are bound to `req.session.adminId` set after a successful username + bcrypt password login. Both login endpoints apply rate limiting (10 attempts per 15-minute window). A constant-time dummy comparison is performed when no account exists to reduce timing side-channels. Protected API endpoints bind actions to a validated server-side identity, not to caller-supplied identifiers. Future scans should verify session regeneration is applied at all login boundaries.

### Tampering

Marketplace state changes such as booking creation, booking status updates, merchant profile edits, venue mutations, review creation, and invitation RSVPs are authorized and validated server-side. Booking totals are calculated server-side from the stored venue price; the client cannot supply a price. Venue mutations now require `requireApprovedMerchant`. Public venue listings filter by approved merchant status via the `publiclyVisibleVenue` SQL fragment.

### Information Disclosure

Booking records, merchant profiles, and invitation management data contain private names, phone numbers, business identifiers, and bearer-style access tokens. API responses are scoped by role and ownership. Invitation manage tokens are redacted from request logs in `app.ts`. The most active information-disclosure risk is the unauthenticated private object storage endpoint (`/api/storage/objects/*`), which can expose admin-uploaded field-work materials without any authentication check.

### Denial of Service

Public write endpoints (booking creation, invitation creation, RSVP submission, review creation, merchant registration) have explicit rate limiters applied via `express-rate-limit`. JSON body size is capped at 100 KB. Both merchant and admin login endpoints are rate-limited.

### Elevation of Privilege

The largest privilege boundary is between public users and merchant-only capabilities, and between merchants and admin capabilities. Merchant dashboards, merchant booking management, and merchant venue mutation enforce server-side authorization on every read and write (`requireMerchantSession`, `requireSelfMerchant`, `requireApprovedMerchant`). Admin routes enforce `requireAdmin`. Row-level venue access control in merchant venue update/delete uses `AND venuesTable.merchantId = params.data.id` to prevent cross-merchant mutation. The CORS configuration (`origin: true`) is a weak escalation surface if subdomain isolation is ever broken, but is largely mitigated by `sameSite: "strict"` session cookies.
