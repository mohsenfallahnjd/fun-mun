# Fun Mun — Leisure Time

A simple, modern bookmarker for your free time: books, audiobooks, podcasts, movies, series, and places to visit.

## Features

- **6 types**: Book, Audiobook, Podcast, Movie, Series, Place
- **Auto-fill** when adding items (Open Library for books, TMDB for movies/series)
- **Optional links** — save where you watch or listen (Netflix, Spotify, Filimo, etc.)
- **Filter by type** with counts
- **Random suggestion** — “What should I do tonight?”
- **Status tracking** — queue → in progress → done
- **Export / import** JSON backup (data lives in your browser)
- **PWA** — install on phone/desktop, works offline for your saved list

## Run locally

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Optional: movie & series auto-fill

1. Get a free API key from [TMDB](https://www.themoviedb.org/settings/api)
2. Copy `.env.example` to `.env.local` and set `TMDB_API_KEY`

Books work without any API key (Open Library).

## Deploy on Vercel

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com/new)
3. Add environment variable `TMDB_API_KEY` (optional, for movie/series search)
4. Deploy

The app is a PWA — users can install it from the browser. Service worker is built automatically at deploy time via Serwist.

No database required — your list is stored in browser localStorage. Use Export to back up.

## Stack

- Next.js 16 (App Router)
- Tailwind CSS 4
- Bun + Biome
- Open Library API + TMDB API

## Scripts

```bash
bun run dev        # start dev server
bun run build      # production build
bun run lint       # check with Biome
bun run lint:fix   # fix with Biome
bun run format     # format with Biome
```
