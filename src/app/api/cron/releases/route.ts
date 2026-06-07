import { and, eq, isNotNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { leisureItems, releaseReminders } from "@/db/schema";
import { notifyUser } from "@/lib/notifications";

/** Returns days until the given ISO date string (YYYY-MM-DD), relative to today (UTC). */
function daysUntilRelease(dateStr: string): number {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const release = new Date(`${dateStr}T00:00:00Z`);
  return Math.round((release.getTime() - today.getTime()) / 86_400_000);
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const db = getDb();
  const today = todayDateString();

  const items = await db.query.leisureItems.findMany({
    where: and(eq(leisureItems.releaseReminderEnabled, true), isNotNull(leisureItems.releaseDate)),
  });

  let sent = 0;

  for (const item of items) {
    if (!item.releaseDate) continue;

    const days = daysUntilRelease(item.releaseDate);
    if (days < 0 || days > 1) continue;

    // Check deduplication: only notify once per (user, item) per day
    const existing = await db.query.releaseReminders.findFirst({
      where: and(eq(releaseReminders.userId, item.userId), eq(releaseReminders.itemId, item.id)),
    });

    const lastNotifiedDate = existing?.lastNotifiedAt?.toISOString().slice(0, 10);
    if (lastNotifiedDate === today) continue;

    const label = item.type === "series" ? "series" : "movie";
    const when = days === 0 ? "releases today" : "releases tomorrow";
    const title = days === 0 ? `${item.title} is out!` : `${item.title} releases tomorrow`;
    const body = `The ${label} "${item.title}" ${when}. Time to get ready!`;

    await notifyUser({
      userId: item.userId,
      type: "release_reminder",
      title,
      body,
      link: item.watchUrl ?? "/",
    });

    // Upsert last_notified_at for deduplication
    await db
      .insert(releaseReminders)
      .values({ userId: item.userId, itemId: item.id, lastNotifiedAt: new Date() })
      .onConflictDoUpdate({
        target: [releaseReminders.userId, releaseReminders.itemId],
        set: { lastNotifiedAt: new Date() },
      });

    sent++;
  }

  return NextResponse.json({ sent });
}
