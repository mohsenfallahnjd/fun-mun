import { and, desc, eq, inArray } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";
import { requireAuthUserId } from "@/lib/auth";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const userId = await requireAuthUserId();
    const db = getDb();

    const rows = await db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: desc(notifications.createdAt),
      limit: 50,
    });

    return NextResponse.json({ notifications: rows });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const userId = await requireAuthUserId();
    const body = (await request.json()) as { ids?: string[]; all?: boolean };
    const db = getDb();

    if (body.all) {
      await db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    } else if (Array.isArray(body.ids) && body.ids.length > 0) {
      await db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.userId, userId), inArray(notifications.id, body.ids)));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
