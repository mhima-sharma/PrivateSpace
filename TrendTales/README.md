# TrendTales — _Where Trends Meet Stories_

A production-ready full-stack **Blog & Affiliate Marketing Platform** built with
Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn-style UI, Prisma + MySQL,
Auth.js (NextAuth v5), Cloudinary, Tiptap and Recharts.

Categories supported out of the box: **Fashion, Travel, Technology, Lifestyle,
Food, Deals** — plus any custom categories you create.

---

## ✨ Features

**Public**
- Home page: hero slider, category grid, trending & latest blogs, featured affiliate products, popular destinations, newsletter
- `/blogs` with search, category filters, sort (latest/popular) and pagination
- `/category/[slug]` category pages
- `/blog/[slug]` rich blog detail: featured image, author, reading time, Tiptap-rendered content, **affiliate product blocks**, related posts, **share buttons**, **comments**, and a **travel destination block** (map embed, best time, budget, tips, gallery) for travel posts
- `/destinations` + `/destinations/[slug]`
- Global `/search` across blogs, products, categories and destinations
- Newsletter subscription, dark mode, responsive mobile-first UI, skeleton-friendly components
- Affiliate click tracking via `/go/[id]` redirect (records click → 302 to merchant)

**Admin** (`/admin`, protected)
- Email/password login (Auth.js Credentials, JWT sessions, middleware-gated)
- Dashboard: totals (blogs, categories, products, clicks, views, subscribers) + **Recharts** monthly views & clicks, most-viewed blogs, top products
- Full CRUD for **Blogs** (Tiptap editor, draft/publish/schedule, featured/trending, tags, SEO meta), **Categories**, **Affiliate Products** (platform, price, click counts), **Travel Destinations**, and **Comment moderation**
- Cloudinary image uploads (with paste-URL fallback)

**SEO**
- Dynamic Metadata API, Open Graph + Twitter cards, JSON-LD (Article, WebSite, Breadcrumb), canonical URLs, `sitemap.xml`, `robots.txt`

---

## 🧱 Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS, shadcn-style components, Radix UI, lucide-react |
| Data | Prisma ORM + MySQL (works with TiDB / PlanetScale) |
| Auth | Auth.js (NextAuth v5) — Credentials provider |
| Editor | Tiptap |
| Charts | Recharts |
| Images | Cloudinary |
| Validation | Zod + React Hook Form patterns |

---

## 🚀 Getting Started

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env` — at minimum `DATABASE_URL` and `AUTH_SECRET`:

```bash
# generate a secret
openssl rand -base64 32
```

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `AUTH_SECRET` | Auth.js JWT secret |
| `NEXTAUTH_URL` / `NEXT_PUBLIC_SITE_URL` | App base URL |
| `CLOUDINARY_*` | Image uploads (optional — paste-URL fallback works without) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Browser-side cloud name |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Admin created by the seed |

### 3. Create the database schema

```bash
npm run prisma:push      # push schema to the DB (no migration files)
# or, for migration history:
npm run prisma:migrate
```

### 4. Seed demo data (admin user, categories, blogs, products, destinations)

```bash
npm run db:seed
```

Default admin: `admin@trendtales.com` / `ChangeMe123!` (override via `SEED_ADMIN_*`).

### 5. Run

```bash
npm run dev
```

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin

---

## 📜 Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Start production server |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run prisma:push` | Push schema to DB |
| `npm run prisma:migrate` | Create & run a migration |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed demo data |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (public)/        # public site (Navbar + Footer layout)
│   │   ├── page.tsx              # home
│   │   ├── blogs/                # listing (search/filter/sort/paginate)
│   │   ├── blog/[slug]/          # blog detail
│   │   ├── category/[slug]/      # category page
│   │   ├── destinations/         # travel destinations
│   │   ├── search/               # global search
│   │   └── about|contact|privacy|terms/
│   ├── admin/
│   │   ├── login/                # public login
│   │   └── (panel)/              # protected: dashboard + CRUD
│   ├── api/                      # auth, upload, view tracking
│   ├── go/[id]/                  # affiliate click → redirect
│   ├── sitemap.ts / robots.ts
│   └── layout.tsx / globals.css
├── actions/             # server actions (mutations)
├── services/            # data-access read queries
├── components/          # ui/ (primitives), admin/, blog/, layout/, …
├── lib/                 # prisma, auth, cloudinary, seo, utils, validations
└── types/
prisma/
├── schema.prisma        # User, Category, Blog, Product, TravelDestination,
│                        # Comment, NewsletterSubscriber, AffiliateClick
└── seed.ts
```

---

## ☁️ Deploy to Vercel

1. Push this folder to a Git repository.
2. Import the repo in **Vercel** → it auto-detects Next.js.
3. Add all environment variables from `.env.example` in **Project → Settings → Environment Variables**.
   Set `NEXTAUTH_URL` / `NEXT_PUBLIC_SITE_URL` to your production domain.
4. Use a managed MySQL provider reachable from Vercel — **PlanetScale**, **TiDB Serverless**, or any MySQL host. Set `DATABASE_URL` accordingly.
5. Apply the schema to production:
   ```bash
   npm run prisma:deploy   # or prisma:push for non-migration workflows
   npm run db:seed         # optional: seed the admin + demo content
   ```
6. Deploy. The `build` script runs `prisma generate` automatically.

> **Note:** DB-backed public pages are rendered dynamically (`force-dynamic`)
> so the build never requires build-time DB connectivity and content is always
> fresh. To add CDN caching/ISR later, swap `force-dynamic` for `revalidate`
> on the relevant routes once your DB is reachable during builds.

---

## 🔐 Notes & Conventions

- **Affiliate links** use `rel="nofollow sponsored noopener"` and route through `/go/[id]` for click tracking.
- **Comments** are submitted publicly but require admin approval before display.
- **Search** uses indexed `contains` (LIKE) queries for portability across MySQL hosts. Upgrade to `@@fulltext` + Prisma full-text search if your DB supports it.
- **Roles**: `ADMIN` and `EDITOR` (both can manage content; extend `requireAdmin` in `src/lib/guard.ts` to differentiate).

---

Built with ❤️ — TrendTales.
