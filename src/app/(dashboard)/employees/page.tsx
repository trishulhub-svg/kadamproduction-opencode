// src/app/(dashboard)/employees/page.tsx
import { and, eq, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { EmployeesView } from "@/components/employees/EmployeesView";

export default async function EmployeesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  const employees = await db
    .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, phone: schema.users.phone })
    .from(schema.users)
    .where(and(eq(schema.users.role, "employee"), isNull(schema.users.deletedAt)));
  return <EmployeesView employees={employees} />;
}
