// src/server/team-actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { dispatchNotification } from "./notification-dispatcher";

export async function createTeam(input: { name: string; description?: string }) {
  const user = await requireAdmin();
  if (!user) throw new Error("Unauthorized");
  await db.insert(schema.teams).values({ name: input.name.trim(), description: input.description?.trim() || null });
  revalidatePath("/teams");
}

export async function deleteTeam(id: number) {
  const user = await requireAdmin();
  if (!user) throw new Error("Unauthorized");
  await db.update(schema.teams).set({ deletedAt: new Date() }).where(eq(schema.teams.id, id));
  revalidatePath("/teams");
}

export async function addMember(teamId: number, userId: number) {
  const user = await requireAdmin();
  if (!user) throw new Error("Unauthorized");
  await db.insert(schema.teamMembers).values({ teamId, userId }).onConflictDoNothing();
  const [team] = await db.select({ name: schema.teams.name }).from(schema.teams).where(eq(schema.teams.id, teamId)).limit(1).then((r) => r);
  const teamName = team?.name ?? "Team";
  await dispatchNotification({
    userId,
    type: "team_assigned",
    title: "Assigned to Team",
    message: `You have been added to "${teamName}" team.`,
    link: "/teams",
  });
  revalidatePath("/teams");
}

export async function removeMember(teamId: number, userId: number) {
  const user = await requireAdmin();
  if (!user) throw new Error("Unauthorized");
  const [team] = await db.select({ name: schema.teams.name }).from(schema.teams).where(eq(schema.teams.id, teamId)).limit(1).then((r) => r);
  await db.delete(schema.teamMembers).where(and(eq(schema.teamMembers.teamId, teamId), eq(schema.teamMembers.userId, userId)));
  const teamName = team?.name ?? "Team";
  await dispatchNotification({
    userId,
    type: "team_removed",
    title: "Removed from Team",
    message: `You have been removed from "${teamName}" team.`,
  });
  revalidatePath("/teams");
}
