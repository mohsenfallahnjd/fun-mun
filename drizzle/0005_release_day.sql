-- Add weekly release day (0=Sun … 6=Sat) for series reminders
ALTER TABLE "leisure_items"
  ADD COLUMN IF NOT EXISTS "release_day" integer;
