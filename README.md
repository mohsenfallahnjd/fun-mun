# Fun Mun — Leisure Time

A simple, modern bookmarker for your free time: books, audiobooks, podcasts, movies, series, and places to visit.

## Features

- **6 types**: Book, Audiobook, Podcast, Movie, Series, Place
- **Auto-fill** when adding items (Open Library, TVMaze, Wikipedia)
- **Optional links** with preview and auto-fill
- **User profiles** — sign in and save your list to the cloud
- **Filter, sort, drag to reorder**
- **Random suggestion** — “What should I do tonight?”
- **PWA** — install on phone/desktop

## Run locally

```bash
bun install
cp .env.example .env.local
# Fill in AUTH_SECRET + DATABASE_URL (see below)
bun run db:push
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Auth (Auth.js)

1. Generate a secret: `openssl rand -base64 32`
2. Add to `.env.local`:
   - `AUTH_SECRET` — random string from step 1
   - `AUTH_URL` — `http://localhost:3000` (use your production URL on Vercel)

Sign up with email and password at `/sign-up`. No third-party auth provider required.

### Database (Neon Postgres)

1. Create a database at [neon.tech](https://neon.tech) or add **Neon** from Vercel Storage
2. Set `DATABASE_URL` in `.env.local`
3. Push the schema:

```bash
bun run db:push
```

Or run the SQL in `drizzle/0000_init.sql` manually.

### Optional: TMDB

Set `TMDB_API_KEY` for richer movie posters (Wikipedia fallback works without it).

## Deploy on Vercel

1. Push to GitHub and import in [Vercel](https://vercel.com/new)
2. Add **Neon** integration (or set `DATABASE_URL` manually)
3. Set `AUTH_SECRET` and `AUTH_URL` (your production domain)
4. Run `bun run db:push` against production `DATABASE_URL` once
5. Deploy

**Guest mode:** Without signing in, data stays in browser localStorage. After sign-in, use **Import local items** to move it to your profile.

## Stack

- Next.js 16 · Tailwind CSS 4 · Bun · Biome
- Auth.js (NextAuth) · Neon Postgres · Drizzle ORM

## Scripts

```bash
bun run dev        # start dev server
bun run build      # production build
bun run db:push    # sync schema to Postgres
bun run db:studio  # Drizzle Studio
bun run lint       # Biome check
```
