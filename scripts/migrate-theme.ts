import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(url);
await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme text DEFAULT 'terracotta'`;
console.log("Added profiles.theme column.");
