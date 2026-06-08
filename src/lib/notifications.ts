import { getDb } from "@/db";
import { notifications } from "@/db/schema";
import { sendPushToUser } from "@/lib/push";

interface NotifyParams {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
}

export async function notifyUser(params: NotifyParams): Promise<void> {
  const db = getDb();
  await db.insert(notifications).values({
    userId: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    link: params.link ?? null,
  });
  await sendPushToUser(params.userId, {
    title: params.title,
    body: params.body,
    url: params.link,
  }).catch(() => {});
}

export function notifyUserAsync(params: NotifyParams): void {
  notifyUser(params).catch((err) => console.error("notifyUserAsync failed:", err));
}
