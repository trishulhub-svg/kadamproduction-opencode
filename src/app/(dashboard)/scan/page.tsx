// src/app/(dashboard)/scan/page.tsx
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { ScanView } from "@/components/scan/ScanView";

export default async function ScanPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const ongoing = await db
    .select({ id: schema.orders.id, clientName: schema.orders.clientName, contactPerson: schema.orders.contactPerson, eventDate: schema.orders.eventDate })
    .from(schema.orders)
    .where(eq(schema.orders.status, "ongoing"));

  return <ScanView ongoing={ongoing} />;
}
