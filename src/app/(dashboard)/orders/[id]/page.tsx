// src/app/(dashboard)/orders/[id]/page.tsx
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrderDetail } from "@/lib/orders-queries";
import { ManageOrderView } from "@/components/orders/ManageOrderView";

export default async function ManageOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;

  const { id } = await params;
  const detail = await getOrderDetail(Number(id));
  if (!detail) notFound();

  return <ManageOrderView detail={detail} />;
}
