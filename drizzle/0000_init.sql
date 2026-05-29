CREATE TABLE IF NOT EXISTS "profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "clerk_user_id" text NOT NULL,
  "email" text,
  "name" text,
  "image_url" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "profiles_clerk_user_id_unique" UNIQUE("clerk_user_id")
);

CREATE TABLE IF NOT EXISTS "leisure_items" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "subtitle" text,
  "image_url" text,
  "watch_url" text,
  "notes" text,
  "status" text DEFAULT 'queue' NOT NULL,
  "year" integer,
  "progress" jsonb,
  "order" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "leisure_items"
  ADD CONSTRAINT "leisure_items_user_id_profiles_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "leisure_items_user_id_idx" ON "leisure_items" ("user_id");
