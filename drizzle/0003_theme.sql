-- Add theme preference to profiles
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "theme" text DEFAULT 'terracotta';
