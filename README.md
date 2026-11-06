# Jeevan Cars

A website and admin CMS for Jeevan Cars, a used-vehicle dealership.

Built with Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS 4, shadcn/ui, Prisma 7, PostgreSQL and Cloudinary.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the system design, data model and roadmap.

## Requirements

- Node.js ≥ 20.19 (developed on 24)
- Docker (for the local PostgreSQL database)

## Local setup

```bash
npm install                 # also generates the Prisma client
cp .env.example .env        # then fill in AUTH_SECRET (openssl rand -base64 48)
npm run db:up               # start PostgreSQL 17 in Docker
npm run db:migrate          # apply migrations
npm run db:seed             # categories, brands, site settings
npm run db:seed:sample      # optional: dev sample vehicles + demo contact details
npm run admin:create        # create the admin from ADMIN_* in .env
npm run dev                 # http://localhost:3000
```

Health check: `GET /api/health` returns `{"status":"ok","database":"up"}`, or HTTP 503 if the database can't be reached.

## Scripts

| Script                      | Purpose                                                  |
| --------------------------- | -------------------------------------------------------- |
| `dev` / `build` / `start`   | Next.js development, production build, production server |
| `lint` / `typecheck`        | ESLint; route type generation + `tsc --noEmit`           |
| `format` / `format:check`   | Prettier (with Tailwind class sorting)                   |
| `db:up` / `db:down`         | Start / stop the local Docker database                   |
| `db:migrate`                | Create and apply migrations in development               |
| `db:deploy`                 | Apply pending migrations in production                   |
| `db:seed`                   | Idempotent base data (safe to re-run)                    |
| `db:seed:sample`            | Development-only sample inventory (Unsplash photos)      |
| `db:studio`                 | Prisma Studio                                            |
| `admin:create [-- --reset]` | Create the single admin, or reset their credentials      |

## Notes

- The Prisma client is generated into `src/generated/prisma`, which is gitignored.
- The initial migration adds raw-SQL constraints that Prisma can't express: one primary image per vehicle, a required price whenever it's shown publicly, and non-negative mileage and price.
- Cloudinary variables are validated only when image features are used, so the site runs without them.
