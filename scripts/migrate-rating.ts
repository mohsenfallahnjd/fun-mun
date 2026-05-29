import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(url);
await sql`ALTER TABLE leisure_items ADD COLUMN IF NOT EXISTS rating jsonb`;
console.log("Added leisure_items.rating column.");
