-- Add release reminder fields to leisure_items
ALTER TABLE "leisure_items"
  ADD COLUMN IF NOT EXISTS "release_date" text,
  ADD COLUMN IF NOT EXISTS "release_reminder_enabled" boolean DEFAULT false;

-- Push subscriptions for web push API
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "endpoint" text NOT NULL UNIQUE,
  "p256dh" text NOT NULL,
  "auth" text NOT NULL,
  "user_agent" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

-- In-app notification records
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "link" text,
  "read" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

-- Deduplication log for release reminder cron
CREATE TABLE IF NOT EXISTS "release_reminders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "item_id" text NOT NULL,
  "last_notified_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "release_reminders_user_item" UNIQUE ("user_id", "item_id")
);
