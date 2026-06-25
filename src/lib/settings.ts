// src/lib/settings.ts
import { eq } from "drizzle-orm";
import { db, schema } from "./db";

export async function getSetting(key: string): Promise<string | null> {
  const row = await db.select().from(schema.settings).where(eq(schema.settings.key, key)).limit(1).then((r) => r[0]);
  return row?.value ?? null;
}

export async function getLogoUrl(): Promise<string | null> {
  const v = await getSetting("logo_url");
  return v && v.length > 0 ? v : null;
}
