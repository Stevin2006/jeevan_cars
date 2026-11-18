# Jeevan Cars — Architecture (Phase 1)

Status: **implemented** (Phases 1–6, 2026-11-06). Deployment target: Vercel + Neon + Cloudinary. Schema: [`prisma/schema.prisma`](../prisma/schema.prisma).

## 1. Environment findings

| Item              | Finding                                                                                                                                                                                                                                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository        | Empty git repo on `main`, no commits, no files                                                                                                                                                                                                                                                                  |
| Node / npm        | Node 24.21.0, npm 11.19.0                                                                                                                                                                                                                                                                                       |
| PostgreSQL        | Not installed locally; **Docker is available** → local Postgres via `docker compose`                                                                                                                                                                                                                            |
| Animation tooling | No packages installed (empty repo). Available in the dev environment: **Motion** (docs MCP + skill), **Animate UI** (shadcn-registry components built on Motion), **React Bits**. Only `motion` becomes a runtime dependency; Animate UI components are copied in as source, so nothing redundant is installed. |

Latest stable versions checked on 2026-11-06:

| Package                                      | Version           | Note                                                                    |
| -------------------------------------------- | ----------------- | ----------------------------------------------------------------------- |
| next                                         | 16.4.5            | App Router, `proxy.ts` (formerly middleware)                            |
| react / react-dom                            | 19.x              |                                                                         |
| tailwindcss                                  | 4.3.4             | CSS-first config, `@theme` tokens                                       |
| shadcn (CLI)                                 | 4.23.0            | Radix base                                                              |
| prisma / @prisma/client / @prisma/adapter-pg | **7.10.1**        | npm `latest` tag points to 8.0.0-rc — deliberately pinned to stable 7.x |
| motion                                       | 14.10.0           | `motion/react`                                                          |
| zod                                          | 4.6.7             |                                                                         |
| react-hook-form / @hookform/resolvers        | 7.91.0 / 7.0.3    |                                                                         |
| cloudinary (server SDK)                      | 2.11.0            |                                                                         |
| @dnd-kit/core + @dnd-kit/sortable            | latest / 10.0.0   | image reordering                                                        |
| @node-rs/argon2                              | 2.2.2             | password hashing                                                        |
| sonner                                       | 2.0.8             | toasts (shadcn standard)                                                |
| recharts                                     | 3.10.1            | via shadcn `chart`, dashboard only                                      |
| next-auth                                    | 5.0.0-**beta**.32 | not used — see §2.3                                                     |

## 2. System architecture

```
Browser ──► Next.js (Node runtime)
            ├─ proxy.ts            optimistic cookie check on /admin/* (redirect only)
            ├─ (public) RSC pages  cached reads ("use cache" + cacheTag)
            ├─ admin RSC pages     requireAdmin() on every page/action
            ├─ Server Actions      all mutations, Zod-validated
            ├─ Route Handlers      /api/cloudinary/sign, sitemap.xml, robots.txt
            └─ lib/data/*          the only place Prisma is called
                     │
                     ├─► PostgreSQL (Prisma 7 + pg driver adapter)
                     └─► Cloudinary (signed direct uploads, delivery transforms)
```

### 2.1 Rendering & data access

- **Server Components by default.** Client components only for: navbar scroll state, mobile menu, filters UI, gallery, forms, image uploader/reorder, dashboard counters.
- **Data Access Layer** (`src/lib/data/`): every Prisma query lives here. Public queries use a shared `publicVehicleSelect` that structurally excludes `registrationNumber`, `internalNotes` and drafts — private fields can't leak through a careless `include`.
- **Caching**: public catalogue reads are cached and tagged (`vehicles`, `vehicle:<slug>`, `taxonomy`, `settings`). Admin mutations invalidate the matching tags, so the public site is fast yet updates instantly after an edit.
- **Catalogue filters** are URL search params (`?category=suv&fuel=DIESEL&minPrice=300000&sort=price_asc&page=2`), parsed by one Zod schema shared by the page and the filter UI. Pages are fully server-rendered and crawlable.

### 2.2 Mutations

Server Actions per domain (`vehicles`, `categories`, `brands`, `enquiries`, `settings`, `auth`). Each action: `requireAdmin()` → Zod parse → DAL call → `revalidateTag` → typed `ActionResult<T>` (`{ ok: true, data } | { ok: false, error, fieldErrors }`) consumed by React Hook Form. The same Zod schemas validate client-side via `zodResolver`.

### 2.3 Authentication — recommendation: custom DB sessions, not Auth.js

Auth.js v5 is still beta and is built around multi-user/OAuth flows we don't need. For a single admin, a small, auditable implementation is more secure and simpler:

- Password hashed with **Argon2id** (`@node-rs/argon2`).
- On login: 32-byte random token → cookie `__Host-jc_session` (`httpOnly`, `Secure`, `SameSite=Lax`, path `/`); DB stores only the SHA-256 hash (`AdminSession`). 7-day sliding expiry; logout and "sign out everywhere" delete rows.
- `proxy.ts` only checks the cookie exists (fast redirect). **Real authorization** is `requireAdmin()` in every admin layout, page and Server Action — never relying on the proxy alone.
- Login is rate-limited (per IP + per email) and returns a generic error.
- The admin account is created by a CLI seed script (`npm run admin:create`) from env vars; there is no public sign-up route. Password change lives in `/admin/settings`.

### 2.4 Images (Cloudinary)

- **Upload**: admin requests a signature via an auth-checked Server Action (restricted to the `jeevan-cars/vehicles` folder, `allowed_formats=jpg,png,webp,avif`) → browser uploads directly to Cloudinary (no large bodies through our server) → saving the vehicle form records each new image after **re-verifying** the asset via the Admin API (format, bytes ≤ 10 MB, dimensions); invalid assets are deleted.
- **Delivery**: `next/image` with a Cloudinary loader (`f_auto,q_auto,c_limit,w_<n>`), responsive `sizes`, blur placeholder.
- **Ordering/primary**: drag-to-reorder with dnd-kit; one primary image per vehicle enforced by a partial unique index in the DB.
- Deleting images or vehicles removes Cloudinary assets too (best-effort, logged).

### 2.5 Enquiries & spam protection

Public Server Action with: Zod validation (Indian phone normalisation), honeypot field, minimum time-to-submit check, Postgres-backed rate limit (e.g. 5 per IP per 10 min), and hashed IP storage. WhatsApp CTA is a `wa.me` deep link with a prefilled message naming the vehicle (number from `SiteSettings`).

### 2.6 Pricing logic

One helper `getDisplayPrice(vehicle)` → `₹5,50,000` (`Intl.NumberFormat('en-IN', { currency: 'INR' })`) or `"Contact for Price"`. Zod refinement: `showPrice === true` requires `price > 0`; `showPrice === false` allows a stored (private) price. Prices are serialized to strings before reaching client components (Prisma `Decimal` isn't serializable).

### 2.7 Security checklist

Server-only modules (`import "server-only"`) for Prisma, Cloudinary and auth; no secrets with `NEXT_PUBLIC_` prefix except Cloudinary cloud name; env validated with Zod at boot; strict security headers + CSP in `next.config.ts`; Server Actions have built-in Origin checks (CSRF); all user text rendered as text (no `dangerouslySetInnerHTML`), descriptions stored as plain text with line breaks.

### 2.8 SEO

`generateMetadata` per page (vehicle titles like _"2019 Hyundai Creta SX Diesel — ₹11,25,000 | Jeevan Cars"_), Open Graph image = primary vehicle photo, `Vehicle`/`Car` JSON-LD with `Offer`, `AutoDealer` JSON-LD on Home/Contact, dynamic `sitemap.ts` (published vehicles + categories), `robots.ts` disallowing `/admin` and `/api`.

## 3. Entity relationships

```
Admin 1 ──< AdminSession                        (cascade)

VehicleCategory 1 ──< Vehicle                   (restrict: can't delete a category in use)
VehicleBrand    1 ──< Vehicle                   (restrict)

Vehicle 1 ──< VehicleImage                      (cascade; ≤1 isPrimary per vehicle)
Vehicle 1 ──< VehicleSpecification              (cascade; unique label per vehicle)
Vehicle 1 ──< Enquiry (optional)                (set null; vehicleLabel keeps context)

SiteSettings  — singleton (id = 1)
RateLimit     — standalone key/counter table
```

Key decisions:

- **Restrict on taxonomy deletion** — the admin UI shows "used by N vehicles" and only allows delete at 0 ("Delete categories when safe").
- **Core specs as typed columns** (filterable, indexed) + **`VehicleSpecification`** key/value rows for anything else (payload capacity, axle config, features). Commercial vehicles get rich detail with no schema churn.
- **Availability ≠ Publication.** `status` (DRAFT/PUBLISHED) controls visibility; `availability` (AVAILABLE/RESERVED/SOLD) is shown publicly. Default catalogue shows Available + Reserved; Sold is hidden from the grid but its URL still resolves with a "Sold" badge (preserves SEO/shared links).
- **`ownershipCount` Int** (1st, 2nd, 3rd+ owner) rather than an enum — simpler filtering.
- **`price Decimal(12,2)`** per your spec; `cuid()` IDs; `slug` = `brand-model-variant-year` + short suffix, generated on create.
- Indexes cover the public query paths: published + available + newest, featured, category, brand, year, price, fuel, transmission.

## 4. Folder structure

```
jeevan_cars/
├─ docker-compose.yml          local Postgres 17
├─ prisma.config.ts            Prisma 7 config (datasource URL, seed)
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed.ts                  dev-only categories, brands, sample vehicles
├─ scripts/create-admin.ts
├─ docs/ARCHITECTURE.md
└─ src/
   ├─ proxy.ts
   ├─ app/
   │  ├─ (public)/
   │  │  ├─ layout.tsx         navbar + footer
   │  │  ├─ page.tsx           home
   │  │  ├─ vehicles/page.tsx  catalogue
   │  │  ├─ vehicles/[slug]/page.tsx
   │  │  ├─ about/page.tsx
   │  │  └─ contact/page.tsx
   │  ├─ admin/
   │  │  ├─ login/page.tsx
   │  │  └─ (panel)/           auth-guarded layout with sidebar
   │  │     ├─ dashboard/ vehicles/ vehicles/new/ vehicles/[id]/edit/
   │  │     └─ categories/ brands/ enquiries/ settings/
   │  ├─ api/health/route.ts
   │  ├─ sitemap.ts  robots.ts  not-found.tsx  error.tsx  layout.tsx  globals.css
   ├─ components/
   │  ├─ ui/                   shadcn + Animate UI primitives
   │  ├─ layout/               navbar, mobile-menu, footer, admin-sidebar
   │  ├─ public/               hero, section-reveal, category-grid, enquiry-form…
   │  ├─ vehicles/             vehicle-card, gallery, spec-table, filters, price-tag
   │  └─ admin/                data-table, vehicle-form/*, image-manager, stat-card
   ├─ lib/
   │  ├─ prisma.ts             client singleton (server-only)
   │  ├─ db/create-client.ts   adapter-based client factory shared with CLI scripts
   │  ├─ env.ts                Zod-validated env
   │  ├─ auth/                 session.ts, password.ts, require-admin.ts
   │  ├─ cloudinary/           server.ts (sign/verify/delete), loader.ts
   │  ├─ data/                 vehicles.ts, taxonomy.ts, enquiries.ts, settings.ts, dashboard.ts
   │  ├─ validations/          vehicle.ts, enquiry.ts, taxonomy.ts, settings.ts, catalogue-params.ts
   │  ├─ rate-limit.ts
   │  ├─ slug.ts  format.ts    slug + INR/km formatting
   │  └─ utils.ts              cn() (shadcn)
   ├─ actions/                 auth, vehicles, images, categories, brands, enquiries, settings
   ├─ hooks/                   use-scrolled, use-reduced-motion wrappers
   ├─ types/
   └─ generated/prisma/        Prisma client output (gitignored)
```

## 5. Dependencies

**Runtime:** `next react react-dom @prisma/client @prisma/adapter-pg pg motion zod react-hook-form @hookform/resolvers cloudinary @node-rs/argon2 @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities lucide-react sonner server-only clsx tailwind-merge class-variance-authority` (+ Radix packages pulled in by shadcn, `recharts` via shadcn chart).

**Dev:** `typescript @types/node @types/react @types/react-dom @types/pg prisma tailwindcss @tailwindcss/postcss eslint eslint-config-next tsx prettier prettier-plugin-tailwindcss`.

**Not added:** Auth.js (beta; custom sessions instead), framer-motion (superseded by `motion`), any second animation library, Redis (Postgres rate limiting suffices at this scale; swap-in point kept in `lib/rate-limit.ts`).

## 6. Design direction (preview; finalised in Phase 3)

- **Type:** expanded grotesk for display headings (e.g. _Archivo_ at wide width — automotive, confident), _Geist Sans_ for body, tabular figures for prices/specs.
- **Palette:** graphite ink `#0F1216` for cinematic hero/footer bands, cool paper `#F4F5F3` browsing surfaces, and the logo's racing red as the single accent: `--brand` `#D90A12` (fills, white text), `--brand-ink` `#B3080F` (red text on light), `--brand-bright` `#FF3B42` (red text on dark), all WCAG AA. Small radii (4–6px), hairline borders, no gradients beyond photo overlays.
- **Logo:** the circular Jeevan Cars badge (`src/assets/brand/jeevan-cars-badge.png`) with a "JEEVAN CARS" wordmark for legibility at small sizes; favicon, Apple icon and the default share image are generated from it.
- **Homepage preloader:** first visit per session only — the badge with a red ring sweep, then a wipe to reveal the hero. Hidden by default in HTML (crawlers, no-JS and reduced-motion visitors never see it); capped at 3 s.
- **Motion:** hero staggered reveal + slow image scale (single run, not looped), `whileInView` section reveals (once), card hover lift + image zoom, gallery crossfade with `AnimatePresence`, navbar transparent→solid on scroll, mobile menu slide with focus trap. All gated on `useReducedMotion`. Admin: sidebar collapse, dialog/sheet transitions, toasts, count-up stats, skeletons.
- **Navbar:** jerrycomputers.com layout studied in Phase 3 and adapted — logo left, centred links, Explore Vehicles CTA right.

## 7. Roadmap

| Phase                       | Scope                                                                                                                                                                                                         | Exit criteria                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **2 Foundation**            | Scaffold Next 16 + TS strict + Tailwind 4 + shadcn; ESLint/Prettier; Docker Postgres; Prisma 7 config, initial migration (+ partial index SQL); env schema + `.env.example`; seed script; admin CLI           | `npm run build` passes; `prisma migrate dev` + seed succeed; DB health check passes |
| **3 Public site**           | Design tokens, typography, navbar/footer, home (9 sections), catalogue with filters/sort/pagination, details page with gallery/WhatsApp/enquiry/related, About, Contact, metadata, sitemap/robots, animations | All public routes render from DB; Lighthouse ≥ 90 perf/SEO/a11y on mobile           |
| **4 Admin CMS**             | Login/logout/sessions, dashboard, vehicle CRUD with multi-section form, Cloudinary upload/reorder/primary, categories, brands, enquiries pipeline, settings + password change                                 | Full CRUD round-trip; unauthenticated access blocked at page and action level       |
| **5 Integration & testing** | Vitest for validators/pricing/rate-limit/filters; Playwright e2e for enquiry, login, vehicle create→publish→visible; responsive passes at 375/768/1280; SEO checks                                            | Test suites green; bug list cleared                                                 |
| **6 Production**            | Security header/CSP review, image & bundle optimisation, production env, deployment guide (Vercel + managed Postgres such as Neon, or VPS + Docker), README/admin guide                                       | Deployed staging; documented runbook                                                |

## 8. Open questions for you

1. **Brand assets:** do you have a Jeevan Cars logo, brand colours and real hero/showroom photography? (Otherwise I'll design a wordmark and use licensed stock for the hero.)
2. **Business details:** phone, WhatsApp number, address, hours — needed for seed `SiteSettings`.
3. **Hosting target:** Vercel + managed Postgres, or a VPS?
4. **Cloudinary:** do you already have an account/cloud name?
5. **Auth:** OK with the custom DB-session approach over Auth.js beta?
6. **Sold vehicles:** OK with "hidden from catalogue, URL still works with Sold badge"?
