<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Tooling

- **Package manager & runtime:** Always use [Bun](https://bun.sh) — `bun install`, `bun run dev`, `bun run build`, etc. Never use npm, yarn, or pnpm.
- **Lint & format:** Always use [Biome](https://biomejs.dev) — `bun run lint`, `bun run lint:fix`, `bun run format`. Do not use ESLint or Prettier.
