-- Run if migrating from Clerk schema
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "clerk_user_id";
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "password_hash" text;
UPDATE "profiles" SET "password_hash" = '' WHERE "password_hash" IS NULL;
-- Then manually set NOT NULL after clearing old rows, or drop and recreate profiles
