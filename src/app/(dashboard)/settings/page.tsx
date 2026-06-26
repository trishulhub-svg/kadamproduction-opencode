// src/app/(dashboard)/settings/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { getLogoUrl, getScanEnabled, getSmtpSettings } from "@/lib/settings";
import { SettingsView } from "@/components/settings/SettingsView";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  let logoUrl: string | null = null;
  let scanEnabled = true;
  let smtp = { host: "", port: "", user: "", pass: "", from: "" };
  try { logoUrl = await getLogoUrl(); } catch { logoUrl = null; }
  try { scanEnabled = await getScanEnabled(); } catch { scanEnabled = true; }
  try { smtp = await getSmtpSettings(); } catch {}
  return <SettingsView logoUrl={logoUrl} scanEnabled={scanEnabled} smtp={smtp} />;
}
