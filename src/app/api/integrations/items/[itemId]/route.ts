import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { leisureItems } from "@/db/schema";
import { authorizeIntegration } from "@/lib/integration";
import type { LeisureProgress, LeisureStatus } from "@/lib/types";

type RouteContext = { params: Promise<{ itemId: string }> };

const statuses: LeisureStatus[] = ["queue", "active", "done"];

export async function PATCH(request: Request, context: RouteContext) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const profile = await authorizeIntegration(request);
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    status?: LeisureStatus;
    progress?: LeisureProgress;
  };

  const update: { status?: LeisureStatus; progress?: LeisureProgress } = {};
  if (body.status !== undefined) {
    if (!statuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    update.status = body.status;
  }
  if (body.progress !== undefined) update.progress = body.progress;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const db = getDb();
    const [row] = await db
      .update(leisureItems)
      .set(update)
      .where(and(eq(leisureItems.id, itemId), eq(leisureItems.userId, profile.id)))
      .returning({ id: leisureItems.id, status: leisureItems.status });
    if (!row) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    return NextResponse.json({ item: row });
  } catch {
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}
