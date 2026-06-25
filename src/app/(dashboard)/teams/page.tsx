// src/app/(dashboard)/teams/page.tsx
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { TeamsView } from "@/components/teams/TeamsView";

export default async function TeamsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;

  const [teams, allMembers, employees] = await Promise.all([
    db.select().from(schema.teams),
    db.select().from(schema.teamMembers),
    db.select({ id: schema.users.id, name: schema.users.name }).from(schema.users).where(eq(schema.users.role, "employee")),
  ]);

  const data = teams.map((t) => ({
    ...t,
    members: allMembers.filter((m) => m.teamId === t.id).map((m) => ({ userId: m.userId, name: employees.find((e) => e.id === m.userId)?.name ?? "Unknown" })),
  }));

  return <TeamsView teams={data} employees={employees} />;
}
