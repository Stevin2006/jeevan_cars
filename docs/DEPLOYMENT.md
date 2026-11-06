# Deploying Jeevan Cars

Target setup: **Vercel** (app) + **Neon** (PostgreSQL) + **Cloudinary** (photos).
Everything below assumes the repository is on GitHub and you have admin access to all three services.

## 0. Before the first deploy

1. **Rotate shared secrets.** The Neon password and Cloudinary API secret were shared in a chat during development. Reset both:
   - Neon → your project → **Roles** → `neondb_owner` → _Reset password_, then update `.env.neon` and Vercel.
   - Cloudinary → **Settings → API Keys** → generate a new key pair, delete the old one, then update `.env` and Vercel.
2. **Generate a production `AUTH_SECRET`** (never reuse the development one):
   ```bash
   openssl rand -base64 48
   ```
3. **Pick the regions.** The Neon database is in AWS `us-east-1`. Put Vercel Functions in the matching region (`iad1`, Washington D.C.) so database calls stay short. Public pages are cached, so visitors in India mostly hit Vercel's edge, not the database. If you'd rather keep everything closer to Kerala, create the Neon project in an Asia-Pacific region and pick the nearest Vercel region before launch — moving later means a data migration.

## 1. Database (Neon)

The project uses two connection strings:

| Variable       | Neon endpoint                                | Used by               |
| -------------- | -------------------------------------------- | --------------------- |
| `DATABASE_URL` | pooled (`…-pooler…`), `sslmode=verify-full`  | the running app       |
| `DIRECT_URL`   | direct (no `-pooler`), `sslmode=verify-full` | `prisma migrate` only |

Locally these live in the gitignored `.env.neon`. With it in place, run once:

```bash
npm run prod:migrate   # create the tables
npm run prod:seed      # categories, brands, empty site settings (safe to re-run)
npm run prod:admin     # prompts for the admin email, name and password
```

`prod:admin` never reads the `ADMIN_*` values from `.env` (those are development credentials). Use a long passphrase; you can change it later in **Admin › Settings**.

Do **not** run `npm run db:seed:sample` against production — it refuses when `NODE_ENV=production`, and the sample photos are hotlinked from Unsplash.

## 2. App (Vercel)

1. **Import** the GitHub repository in Vercel. Framework preset: Next.js. Leave the build command (`next build`) and install command (`npm install`, which runs `prisma generate`) as detected.
2. **Settings › Functions › Region:** `iad1` (or the region matching your Neon database).
3. **Environment variables** (Production, and Preview if you use preview deployments with a separate Neon branch):

   | Name                                | Value                                                                  |
   | ----------------------------------- | ---------------------------------------------------------------------- |
   | `DATABASE_URL`                      | Neon **pooled** URL with `sslmode=verify-full&channel_binding=require` |
   | `NEXT_PUBLIC_SITE_URL`              | `https://your-domain` (no trailing slash; must be https)               |
   | `AUTH_SECRET`                       | the value generated above                                              |
   | `TRUSTED_PROXY_HOPS`                | `1`                                                                    |
   | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | your cloud name                                                        |
   | `CLOUDINARY_API_KEY`                | API key                                                                |
   | `CLOUDINARY_API_SECRET`             | API secret (mark _Sensitive_)                                          |
   | `CLOUDINARY_FOLDER`                 | `jeevan-cars`                                                          |

   Leave `ALLOW_SAMPLE_IMAGES` and `DIRECT_URL` unset on Vercel.

4. **Deploy.** The build validates environment variables and fails fast with a clear message if one is missing or malformed.
5. **Domain:** add it under **Settings › Domains**, then update `NEXT_PUBLIC_SITE_URL` and redeploy so canonical URLs, the sitemap and Open Graph tags use it.

## 3. After the first deploy

- `https://your-domain/api/health` → `{"status":"ok","database":"up"}`
- Sign in at `/admin/login`, open **Settings**, fill in the real phone, WhatsApp number, address, hours and map link, and upload a hero photo.
- Add a vehicle with photos and publish it; check it appears on `/vehicles` and in `/sitemap.xml`.
- Send a test enquiry from the contact page and confirm it appears in **Admin › Enquiries**.
- Submit `https://your-domain/sitemap.xml` in Google Search Console.
- Add an uptime monitor (e.g. Better Stack, UptimeRobot) on `/api/health`.

## 4. Changing the database schema later

1. Create the migration locally against Docker: `npm run db:migrate`.
2. Commit it, then apply it to Neon **before** deploying code that needs it: `npm run prod:migrate`.
3. Push / deploy.

Migrations are additive by default; for destructive changes, take a Neon branch snapshot first.

## 5. Backups and rollback

- **Database:** Neon keeps point-in-time history (window depends on plan). To recover, create a branch from a past timestamp and point `DATABASE_URL` at it, or restore in place from the Neon console.
- **App:** Vercel › Deployments › _Promote to Production_ on a previous build.
- **Photos:** Cloudinary keeps originals; deleted assets can be restored from the Media Library's backup if backups are enabled on your plan.

## 6. Continuous integration

`.github/workflows/ci.yml` runs lint, typecheck, formatting, the Vitest suite (with a Postgres service) and the Playwright suite against a production build. To include the real Cloudinary upload test, add repository secrets `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` (CI uploads into a separate `jeevan-cars-ci` folder and deletes what it creates).

## 7. Self-hosting instead of Vercel

The app is a standard Next.js server: `npm ci && npm run build && npm start` on Node 24 behind nginx or Caddy (HTTPS). Set the same environment variables, keep `TRUSTED_PROXY_HOPS=1` for a single proxy, and make the proxy **append** the client IP (`proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`). Use a process manager (systemd or PM2) and point `/api/health` at your monitor. Note that the in-memory `use cache` store persists between requests on a single server, which makes cached pages even cheaper than on serverless.
