// src/server/notification-dispatcher.ts
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

type NotifyInput = {
  userId?: number;
  userIds?: number[];
  teamId?: number;
  orderId?: number;
  type: string;
  title: string;
  message?: string;
  link?: string;
};

export async function dispatchNotification(input: NotifyInput) {
  let recipients: number[] = [];

  if (input.teamId) {
    const members = await db
      .select({ userId: schema.teamMembers.userId })
      .from(schema.teamMembers)
      .where(eq(schema.teamMembers.teamId, input.teamId));
    recipients = members.map((m) => m.userId);
  }

  if (input.userIds) recipients.push(...input.userIds);
  if (input.userId) recipients.push(input.userId);

  recipients = [...new Set(recipients)];
  if (!recipients.length) return;

  const values = recipients.map((uid) => ({
    userId: uid,
    orderId: input.orderId ?? null,
    type: input.type,
    title: input.title,
    message: input.message ?? null,
    link: input.link ?? null,
  }));

  await db.insert(schema.notifications).values(values);
}

const IMPORTANT_TYPES = new Set([
  "password_reset",
  "account_created",
  "team_assigned",
  "setup_done",
]);

export function isImportant(type: string): boolean {
  return IMPORTANT_TYPES.has(type);
}