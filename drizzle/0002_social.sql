-- Social profile fields + follows
-- Run: bun run db:migrate

ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "username" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "bio" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "is_public" boolean DEFAULT true NOT NULL;

UPDATE "profiles" p
SET "username" = sub.candidate
FROM (
  SELECT
    id,
    CASE
      WHEN base = '' THEN 'user' || substr(replace(id::text, '-', ''), 1, 8)
      WHEN EXISTS (
        SELECT 1 FROM "profiles" p2
        WHERE p2.username = base AND p2.id <> t.id
      ) THEN base || substr(replace(t.id::text, '-', ''), 1, 4)
      ELSE base
    END AS candidate
  FROM (
    SELECT
      id,
      lower(regexp_replace(split_part(email, '@', 1), '[^a-z0-9]', '', 'g')) AS base
    FROM "profiles"
    WHERE "username" IS NULL
  ) t
) sub
WHERE p.id = sub.id AND p.username IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "profiles_username_unique" ON "profiles" ("username");

CREATE TABLE IF NOT EXISTS "follows" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "follower_id" uuid NOT NULL,
  "following_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "follows_follower_id_profiles_id_fk" FOREIGN KEY ("follower_id") REFERENCES "profiles"("id") ON DELETE cascade,
  CONSTRAINT "follows_following_id_profiles_id_fk" FOREIGN KEY ("following_id") REFERENCES "profiles"("id") ON DELETE cascade,
  CONSTRAINT "follows_pair_unique" UNIQUE("follower_id", "following_id")
);

CREATE INDEX IF NOT EXISTS "follows_follower_id_idx" ON "follows" ("follower_id");
CREATE INDEX IF NOT EXISTS "follows_following_id_idx" ON "follows" ("following_id");
