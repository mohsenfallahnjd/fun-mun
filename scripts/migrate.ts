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
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Postgres codes for "already exists" — safe to ignore on idempotent migrations. */
const IGNORABLE_CODES = new Set(["42710", "42P07", "42701"]);

function splitStatements(source: string): string[] {
  return source
    .split(";")
    .map((s) => s.replace(/^\s*--[^\n]*\n?/gm, "").trim())
    .filter((s) => s.length > 0);
}

function readSql(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${table}
      AND column_name = ${column}
    LIMIT 1
  `;
  return rows.length > 0;
}

async function tableExists(table: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = ${table}
    LIMIT 1
  `;
  return rows.length > 0;
}

/** Mark migrations already reflected in an existing database (first run after upgrade). */
async function bootstrapExistingDatabase(appliedIds: Set<string>): Promise<void> {
  if (appliedIds.size > 0) return;
  if (!(await tableExists("profiles")) || !(await tableExists("leisure_items"))) return;

  console.log("Existing database detected — recording baseline migrations…");

  const baseline = ["0000_init", "0001_remove_clerk"];

  if (await columnExists("profiles", "username")) baseline.push("0002_social");
  if (await columnExists("profiles", "theme")) baseline.push("0003_theme");
  if (await columnExists("leisure_items", "rating")) baseline.push("0004_rating");
  if (await columnExists("leisure_items", "original_title")) baseline.push("0005_original_title");

  for (const id of baseline) {
    if (appliedIds.has(id)) continue;
    await sql`INSERT INTO "_fun_mun_migrations" ("id") VALUES (${id}) ON CONFLICT DO NOTHING`;
    appliedIds.add(id);
    console.log(`  recorded ${id}`);
  }
}

async function runStatement(statement: string): Promise<void> {
  try {
    await sql.query(`${statement};`);
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: string }).code)
        : "";
    if (IGNORABLE_CODES.has(code)) return;
    throw error;
  }
}

/** Additive, idempotent migrations only — safe to re-run without losing data. */
const MIGRATIONS: Array<{ id: string; label: string; sql: string }> = [
  { id: "0000_init", label: "Initial schema", sql: readSql("drizzle/0000_init.sql") },
  {
    id: "0001_remove_clerk",
    label: "Remove Clerk columns",
    sql: readSql("drizzle/0001_remove_clerk.sql"),
  },
  {
    id: "0002_social",
    label: "Social profiles + follows",
    sql: readSql("drizzle/0002_social.sql"),
  },
  { id: "0003_theme", label: "Profile theme", sql: readSql("drizzle/0003_theme.sql") },
  {
    id: "0004_rating",
    label: "Item ratings",
    sql: 'ALTER TABLE "leisure_items" ADD COLUMN IF NOT EXISTS "rating" jsonb;',
  },
  {
    id: "0005_original_title",
    label: "Original titles",
    sql: 'ALTER TABLE "leisure_items" ADD COLUMN IF NOT EXISTS "original_title" text;',
  },
];

await sql`
  CREATE TABLE IF NOT EXISTS "_fun_mun_migrations" (
    "id" text PRIMARY KEY,
    "applied_at" timestamp with time zone DEFAULT now() NOT NULL
  )
`;

const applied = await sql`SELECT id FROM "_fun_mun_migrations"`;
const appliedIds = new Set((applied as Array<{ id: string }>).map((row) => row.id));

await bootstrapExistingDatabase(appliedIds);

let ran = 0;

for (const migration of MIGRATIONS) {
  if (appliedIds.has(migration.id)) {
    console.log(`skip  ${migration.id} — ${migration.label}`);
    continue;
  }

  console.log(`apply ${migration.id} — ${migration.label}`);
  for (const [i, statement] of splitStatements(migration.sql).entries()) {
    console.log(`  [${i + 1}] ${statement.split("\n")[0].slice(0, 72)}…`);
    await runStatement(statement);
  }

  await sql`INSERT INTO "_fun_mun_migrations" ("id") VALUES (${migration.id})`;
  appliedIds.add(migration.id);
  ran++;
}

if (ran === 0) {
  console.log("\nDatabase is up to date — no migrations applied.");
} else {
  console.log(`\nApplied ${ran} migration(s). Existing rows were preserved.`);
}

const itemCount = await sql`SELECT count(*)::int AS count FROM "leisure_items"`;
console.log(`leisure_items rows: ${itemCount[0]?.count ?? 0}`);
