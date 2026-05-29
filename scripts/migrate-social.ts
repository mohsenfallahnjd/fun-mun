import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(url);
const migration = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../drizzle/0002_social.sql"),
  "utf8",
);

function splitStatements(source: string): string[] {
  return source
    .split(";")
    .map((s) => s.replace(/^\s*--[^\n]*\n?/gm, "").trim())
    .filter((s) => s.length > 0);
}

for (const [i, statement] of splitStatements(migration).entries()) {
  console.log(`[${i + 1}] ${statement.split("\n")[0].slice(0, 60)}…`);
  await sql.query(`${statement};`);
}

const profiles = await sql`SELECT email, username FROM profiles`;
console.log("\nProfiles:");
for (const p of profiles) console.log(`  ${p.email} → @${p.username}`);
console.log("\nMigration complete.");
