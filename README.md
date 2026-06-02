# PrivateSpace

An **invite-only, private event platform** with a completely generic public face.
Before authentication the site looks like a neutral corporate member portal —
nothing reveals that behind the login wall lives a **Birthday Memories**
experience (hero, wishes, countdown, timeline, and a private photo feed with
likes & comments).

Built to be enterprise-grade: invite-gated registration, Argon2 password
hashing, passkey/biometric login (WebAuthn), private signed-URL image delivery,
strict route protection, rate limiting, CSRF defence, audit logging, and a full
admin console.

---

## Tech stack

| Layer        | Choice                                              |
| ------------ | --------------------------------------------------- |
| Framework    | Next.js 15 (App Router) + React 19                  |
| Language     | TypeScript (strict)                                 |
| Styling      | Tailwind CSS + shadcn-style UI + dark/light themes  |
| Auth         | Auth.js (NextAuth v5) — JWT sessions                |
| Passwords    | Argon2id (`argon2`)                                 |
| Passkeys     | WebAuthn (`@simplewebauthn/server` + `/browser`)    |
| DB           | TiDB Serverless (MySQL-compatible)                  |
| ORM          | Prisma (`relationMode = "prisma"`)                  |
| Validation   | Zod                                                 |
| Data fetching| TanStack Query                                      |
| Forms        | React Hook Form                                     |
| Storage      | S3-compatible (S3/R2/B2/MinIO) or local (dev)       |

---

## Auth & reveal flow

```
Invite link (/invite/<token>)
        │  token hashed (SHA-256) & checked: unused, unexpired, email matches
        ▼
Create account  ──►  Argon2id hash stored, invite consumed (atomic)
        │
        ▼
Auto sign-in  ──►  Optional passkey setup (/onboarding/passkey)
        │
        ▼
Private dashboard (/dashboard)  ──►  Birthday Memories experience revealed
```

Returning users can sign in with **email + password** or a **passkey**
(fingerprint / face / device PIN) from the generic `/login` page.

---

## Security model

- **Invite-only**: registration requires a valid, unexpired, single-use invite
  whose email matches. Only the SHA-256 *hash* of each token is stored.
- **Route protection**: Edge `middleware.ts` runs the `authorized` callback on
  every non-asset route. `/admin/**` additionally requires `role = ADMIN`.
  Every API handler **re-checks** the session (defence in depth).
- **Passwords**: Argon2id (OWASP defaults). Login does a constant-time dummy
  verify on unknown users to prevent timing-based user enumeration.
- **Private images**: object storage is private. Bytes are served only through
  `/api/images/[id]`, which requires (1) a valid session, (2) a valid, unexpired
  **HMAC-signed** URL, and (3) a non-hidden photo. Signed URLs expire in 5 min.
- **Image validation**: uploads are checked by **magic bytes**, not the
  client-supplied content type, blocking disguised/polyglot files.
- **CSRF**: SameSite=Lax session cookie + explicit same-origin check on all
  mutating requests (`assertSameOrigin`). Auth.js protects its own endpoints.
- **Rate limiting**: login, register, upload, comment, and passkey endpoints are
  throttled (in-memory by default; Upstash Redis for multi-instance).
- **Input validation**: every payload is parsed with Zod before use.
- **SQL injection**: all DB access goes through Prisma's parameterised queries.
- **XSS**: React escaping + a strict Content-Security-Policy.
- **Secure headers**: HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, CSP — see `next.config.ts`.
- **Audit logs**: auth events, invites, uploads, likes, comments, deletions, and
  all admin actions are recorded (`audit_logs`).

---

## Project structure

```
.
├─ prisma/
│  ├─ schema.prisma            # users, invites, albums, photos, likes,
│  │                           # comments, authenticators, challenges, audit_logs
│  ├─ migrations/              # SQL migration (TiDB/MySQL)
│  └─ seed.ts                  # bootstraps the first ADMIN invite link
├─ scripts/
│  └─ create-invite.ts         # CLI: mint an invite without the admin UI
├─ public/
│  └─ logo.svg                 # brand mark (replace with your real logo)
├─ src/
│  ├─ middleware.ts            # edge route protection
│  ├─ auth.ts                  # Auth.js (Node): credentials + passkey providers
│  ├─ auth.config.ts           # edge-safe config + authorized() gate
│  ├─ config/event.ts          # birthday content (celebrant, wishes, timeline)
│  ├─ lib/
│  │  ├─ env.ts                # validated env (fails fast)
│  │  ├─ prisma.ts             # singleton Prisma client
│  │  ├─ password.ts           # Argon2id hash/verify
│  │  ├─ validation.ts         # Zod schemas
│  │  ├─ tokens.ts             # invite token gen + hashing
│  │  ├─ signed-url.ts         # HMAC signed image URLs
│  │  ├─ storage.ts            # local / S3 driver + magic-byte sniffing
│  │  ├─ webauthn.ts           # passkey ceremonies
│  │  ├─ invites.ts            # create/validate invites
│  │  ├─ auth-guard.ts         # requireUser / requireAdmin
│  │  ├─ api.ts                # handler wrapper + same-origin (CSRF) check
│  │  ├─ rate-limit.ts         # fixed-window limiter (memory/Redis)
│  │  ├─ audit.ts              # audit log writer
│  │  └─ serialize.ts          # photo DTO + signed URL
│  ├─ components/              # UI (brand, nav, theme, birthday/*, memories/*, admin/*)
│  └─ app/
│     ├─ login/                # generic sign-in (password + passkey)
│     ├─ invite/[token]/       # invite acceptance + registration
│     ├─ onboarding/passkey/   # step 4: optional biometric setup
│     ├─ dashboard/            # private Birthday Memories experience
│     ├─ admin/                # invites, users, activity console
│     └─ api/                  # all API routes (see below)
└─ ...
```

### API routes

| Method | Route                              | Purpose                          |
| ------ | ---------------------------------- | -------------------------------- |
| POST   | `/api/register`                    | Accept invite + create account   |
| *      | `/api/auth/[...nextauth]`          | Auth.js (login/logout/session)   |
| POST   | `/api/webauthn/register/options`   | Begin passkey enrolment          |
| POST   | `/api/webauthn/register/verify`    | Complete passkey enrolment       |
| POST   | `/api/webauthn/authenticate/options` | Begin passkey login            |
| GET    | `/api/photos`                      | Paginated memories feed          |
| POST   | `/api/photos`                      | Upload photo (multipart)         |
| DELETE | `/api/photos/[id]`                 | Delete (owner or admin)          |
| POST   | `/api/photos/[id]/like`            | Toggle like                      |
| GET/POST | `/api/photos/[id]/comments`      | List / add comments              |
| DELETE | `/api/comments/[id]`               | Delete comment (author/admin)    |
| GET    | `/api/images/[id]`                 | **Signed, auth-gated** image     |
| GET/POST | `/api/admin/invites`             | List / create invites            |
| DELETE | `/api/admin/invites/[id]`          | Revoke invite                    |
| GET    | `/api/admin/users`                 | List users                       |
| PATCH  | `/api/admin/users/[id]`            | Change role / activation         |
| PATCH  | `/api/admin/photos/[id]`           | Hide / unhide (moderation)       |
| GET    | `/api/admin/audit-logs`            | Activity log feed                |

---

## Local development

### 1. Prerequisites
- Node.js ≥ 20
- A TiDB Serverless cluster (free): https://tidbcloud.com

### 2. Install
```bash
npm install            # .npmrc sets legacy-peer-deps for next-auth beta
```

### 3. Configure env
```bash
cp .env.example .env
# generate secrets:
openssl rand -base64 32   # -> AUTH_SECRET
openssl rand -base64 48   # -> IMAGE_URL_SIGNING_SECRET
```
Fill in `DATABASE_URL` from TiDB Cloud → **Connect → Prisma** (keep
`?sslaccept=strict`). Set `BOOTSTRAP_ADMIN_EMAIL` to your admin email.

### 4. Create the schema
```bash
npx prisma migrate deploy   # apply the committed migration to TiDB
# (or, to evolve the schema during dev: npx prisma migrate dev)
npx prisma generate
```

### 5. Bootstrap the first admin
```bash
npm run db:seed
# prints a one-time invite link for BOOTSTRAP_ADMIN_EMAIL — open it,
# register, and you're the admin.
```

### 6. Run
```bash
npm run dev    # http://localhost:3000
```

Mint more invites from the **Admin console** or the CLI:
```bash
npm run create-invite -- guest@example.com USER
npm run create-invite -- cohost@example.com ADMIN
```

> **Note on passkeys in dev:** WebAuthn requires a secure context. `localhost`
> qualifies, so passkeys work locally with `WEBAUTHN_RP_ID=localhost`.

---

## Deployment — Vercel + TiDB Serverless

### A. Database (TiDB)
1. Create a **TiDB Serverless** cluster at tidbcloud.com.
2. **Connect → Prisma** → copy the connection string into `DATABASE_URL`
   (it includes `?sslaccept=strict` — TLS is mandatory).
3. From your machine (or a CI step), apply migrations once:
   ```bash
   DATABASE_URL="<tidb-url>" npx prisma migrate deploy
   ```

### B. Image storage (production)
Local disk is **not** durable on Vercel — use an S3-compatible bucket:
1. Create a **private** bucket (AWS S3, Cloudflare R2, Backblaze B2…).
   Ensure **no public access** — we never expose object URLs.
2. Set: `STORAGE_DRIVER=s3`, `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`,
   `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`. For R2/MinIO keep
   `S3_FORCE_PATH_STYLE=true`.

### C. Vercel
1. Import the repo into Vercel (framework auto-detected as Next.js).
2. **Build command:** `prisma generate && next build` (already the `build`
   script). **Install command:** `npm install` (the `.npmrc` handles peer deps).
3. Add **Environment Variables** (Project → Settings → Environment Variables)
   from `.env.example`, with production values:
   - `DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST=true`
   - `NEXTAUTH_URL=https://your-domain.com`
   - `WEBAUTHN_RP_ID=your-domain.com` (registrable domain, **no scheme/port**)
   - `WEBAUTHN_RP_ORIGIN=https://your-domain.com`
   - `IMAGE_URL_SIGNING_SECRET`, storage (`S3_*`), `BOOTSTRAP_ADMIN_EMAIL`
   - *(optional)* `UPSTASH_REDIS_REST_URL` / `_TOKEN` for cross-instance rate
     limiting.
4. Deploy. Then bootstrap the admin against production:
   ```bash
   DATABASE_URL="<tidb-url>" NEXTAUTH_URL="https://your-domain.com" \
   BOOTSTRAP_ADMIN_EMAIL="you@example.com" npm run db:seed
   ```
   Open the printed invite link on the live site and register.

> **WebAuthn RP gotcha:** `WEBAUTHN_RP_ID` must equal your final domain
> (e.g. `events.example.com`). Passkeys registered on a Vercel preview URL
> won't work on the production domain and vice-versa — set it to the domain
> users actually visit.

---

## Customising the event

The **occasion**, **note**, **celebrant**, and **date** are editable live from
the **Admin console → Event** tab (no redeploy). They're stored in the
`settings` table and fall back to [`src/config/event.ts`](src/config/event.ts)
when unset. The remaining content (wishes, timeline) lives in that same config
file. Replace [`public/logo.svg`](public/logo.svg) — currently the **"MS"**
monogram — with your real logo to rebrand everywhere.

Nothing in `config/event.ts` or the `settings` table is ever exposed before login.

---

## Scripts

| Command                                   | Description                          |
| ----------------------------------------- | ------------------------------------ |
| `npm run dev`                             | Dev server                           |
| `npm run build` / `npm start`             | Production build / serve             |
| `npm run typecheck`                       | `tsc --noEmit`                       |
| `npm run lint`                            | ESLint                               |
| `npm run prisma:migrate` / `:deploy`      | Migrate (dev / prod)                 |
| `npm run prisma:studio`                   | Prisma Studio                        |
| `npm run db:seed`                         | Bootstrap admin invite               |
| `npm run create-invite -- <email> [ROLE]` | Mint an invite link                  |

---

## License

Private project scaffold — adapt freely for your event.
