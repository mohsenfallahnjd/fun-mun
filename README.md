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
# Fill in Clerk + DATABASE_URL (see below)
bun run db:push
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Auth (Clerk)

1. Create an app at [clerk.com](https://clerk.com) or add **Clerk** from the [Vercel Marketplace](https://vercel.com/marketplace/clerk)
2. Add to `.env.local`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

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
2. Add **Clerk** and **Neon** integrations (or set env vars manually)
3. Run `bun run db:push` against production `DATABASE_URL` once
4. Deploy

**Guest mode:** Without signing in, data stays in browser localStorage. After sign-in, use **Import local items** to move it to your profile.

## Stack

- Next.js 16 · Tailwind CSS 4 · Bun · Biome
- Clerk (auth) · Neon Postgres · Drizzle ORM

## Scripts

```bash
bun run dev        # start dev server
bun run build      # production build
bun run db:push    # sync schema to Postgres
bun run db:studio  # Drizzle Studio
bun run lint       # Biome check
```
