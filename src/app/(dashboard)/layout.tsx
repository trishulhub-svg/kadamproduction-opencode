// src/app/(dashboard)/layout.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getLogoUrl } from "@/lib/settings";
import { DashboardShell } from "@/components/DashboardShell";
import { logoutAction } from "@/server/auth-actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const logoUrl = await getLogoUrl();

  return (
    <DashboardShell role={user.role} name={user.name} logoUrl={logoUrl} logout={logoutAction}>
      {children}
    </DashboardShell>
  );
}
