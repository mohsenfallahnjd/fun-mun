# Fun Mun — Leisure Time

A modern, open-source bookmarker for your free time. Track books, movies, series, podcasts, games, hobbies, and more — across devices, with or without an account.

## Features

- **8 types** — Book, Audiobook, Podcast, Movie, Series, Game, Hobby, Article
- **Auto-fill** when adding items (Open Library, TMDB, TVMaze, RAWG, iTunes, Wikipedia)
- **Status tracking** — Queue / In Progress / Done
- **Progress tracking** — pages, episodes, hours played
- **Release reminders** — get notified the day before and on release day (or weekly for recurring series)
- **Push notifications** — web push via service worker
- **Social profiles** — public profiles, follow people, discover lists
- **Explore** — browse trending items by category
- **Random suggestion** — "What should I do tonight?" wizard
- **Filter, sort, drag to reorder**
- **PWA** — installable on phone and desktop
- **Guest mode** — works without sign-in (localStorage), sync to cloud after sign-up

## Quick start

```bash
bun install
cp .env.example .env.local
# fill in AUTH_SECRET + DATABASE_URL (see below)
bun run db:migrate
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `AUTH_SECRET` | ✅ | Random string — `openssl rand -base64 32` |
| `DATABASE_URL` | ✅ | Neon Postgres connection string |
| `AUTH_URL` | ✅ | Your app URL (`http://localhost:3000` locally) |
| `TMDB_API_KEY` | optional | Movie & series auto-fill (v3 key or v4 JWT) |
| `RAWG_API_KEY` | optional | Game auto-fill (Wikipedia fallback works without it) |
| `VAPID_PUBLIC_KEY` | optional | Web push notifications |
| `VAPID_PRIVATE_KEY` | optional | Web push notifications |
| `CRON_SECRET` | optional | Secures the `/api/cron/releases` endpoint |

### Database (Neon Postgres)

1. Create a database at [neon.tech](https://neon.tech) (free tier works)
2. Set `DATABASE_URL` in `.env.local`
3. Run migrations:

```bash
bun run db:migrate
```

Use `db:migrate` — not `db:push` — on any database that already has data.

### Auth

Sign up with email + password at `/sign-up`. No third-party OAuth required.

### Push notifications (optional)

Generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

Set `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` in your environment.

## Deploy on Vercel

1. Push to GitHub and import at [vercel.com/new](https://vercel.com/new)
2. Add **Neon** from the Vercel Marketplace (or set `DATABASE_URL` manually)
3. Set `AUTH_SECRET`, `AUTH_URL` (your production domain), and optional API keys
4. Run `bun run db:migrate` with the production `DATABASE_URL` once
5. Deploy

The cron job (`vercel.json`) runs daily at 08:00 UTC to send release reminders.

## Stack

- **Next.js 16** · **Tailwind CSS 4** · **Bun** · **Biome**
- **Auth.js** (email/password) · **Neon Postgres** · **Drizzle ORM**
- **Serwist** (PWA/service worker) · **Web Push API**

## Scripts

```bash
bun run dev          # start dev server
bun run build        # production build
bun run lint         # Biome check
bun run lint:fix     # Biome auto-fix
bun run db:migrate   # apply schema migrations (safe, keeps data)
bun run db:studio    # Drizzle Studio
```

## License

MIT — see [LICENSE](LICENSE).
