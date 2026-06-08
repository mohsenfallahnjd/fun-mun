import { and, eq, isNotNull, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { leisureItems, releaseReminders } from "@/db/schema";
import { notifyUser } from "@/lib/notifications";

function daysUntilRelease(dateStr: string): number {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const release = new Date(`${dateStr}T00:00:00Z`);
  return Math.round((release.getTime() - today.getTime()) / 86_400_000);
}

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function todayWeekday(): number {
  return new Date().getUTCDay();
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
  const today = todayUTC();
  const weekday = todayWeekday();

  const items = await db.query.leisureItems.findMany({
    where: and(
      eq(leisureItems.releaseReminderEnabled, true),
      or(isNotNull(leisureItems.releaseDate), isNotNull(leisureItems.releaseDay)),
    ),
  });

  let sent = 0;

  for (const item of items) {
    const isSeries = item.type === "series";

    // Determine if this item should fire today
    let shouldNotify = false;
    if (item.releaseDay !== null && item.releaseDay !== undefined) {
      // Weekly: fire when today's weekday matches
      shouldNotify = weekday === item.releaseDay;
    } else if (item.releaseDate) {
      // One-time: fire 1 day before or on release day
      const days = daysUntilRelease(item.releaseDate);
      shouldNotify = days >= 0 && days <= 1;
    }

    if (!shouldNotify) continue;

    const existing = await db.query.releaseReminders.findFirst({
      where: and(eq(releaseReminders.userId, item.userId), eq(releaseReminders.itemId, item.id)),
    });

    if (item.releaseDay !== null && item.releaseDay !== undefined) {
      // Weekly: skip if notified within the last 6 days
      if (existing?.lastNotifiedAt) {
        const daysSince = (Date.now() - existing.lastNotifiedAt.getTime()) / 86_400_000;
        if (daysSince < 6) continue;
      }
    } else {
      // One-time: skip if already notified today
      if (existing?.lastNotifiedAt?.toISOString().slice(0, 10) === today) continue;
    }

    const label = isSeries ? "series" : "movie";
    let title: string;
    let body: string;

    if (item.releaseDay !== null && item.releaseDay !== undefined) {
      title = `New ${item.title} episode today!`;
      body = `A new episode of "${item.title}" is out today. Time to watch!`;
    } else {
      const days = item.releaseDate ? daysUntilRelease(item.releaseDate) : 0;
      title = days === 0 ? `${item.title} is out!` : `${item.title} releases tomorrow`;
      body =
        days === 0
          ? `The ${label} "${item.title}" releases today. Time to get ready!`
          : `The ${label} "${item.title}" releases tomorrow. Get ready!`;
    }

    await notifyUser({
      userId: item.userId,
      type: "release_reminder",
      title,
      body,
      link: item.watchUrl ?? "/",
    });

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
