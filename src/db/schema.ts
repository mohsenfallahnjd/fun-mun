import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const leisureItems = pgTable("leisure_items", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  imageUrl: text("image_url"),
  watchUrl: text("watch_url"),
  notes: text("notes"),
  status: text("status").notNull().default("queue"),
  year: integer("year"),
  progress: jsonb("progress"),
  order: integer("order"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type DbLeisureItem = typeof leisureItems.$inferSelect;
