// src/lib/rate-limiter.ts
import { eq } from "drizzle-orm";
import { db, schema } from "./db";

type WindowConfig = { max: number; windowMs: number };

const DEFAULTS: Record<string, WindowConfig> = {
  login: { max: 5, windowMs: 5 * 60 * 1000 },
  forgot_otp: { max: 3, windowMs: 10 * 60 * 1000 },
  otp_verify: { max: 5, windowMs: 15 * 60 * 1000 },
  general: { max: 100, windowMs: 60 * 1000 },
};

export async function checkRateLimit(key: string, config?: WindowConfig): Promise<{ allowed: boolean; retryAfter?: number }> {
  const cfg = config ?? DEFAULTS.general;
  const rlKey = `rl:${key}`;
  try {
    const row = await db.select().from(schema.settings).where(eq(schema.settings.key, rlKey)).limit(1).then((r) => r[0]);
    const now = Date.now();
    if (row) {
      const data = JSON.parse(row.value);
      if (now - data.start > cfg.windowMs) {
        await db.update(schema.settings).set({ value: JSON.stringify({ count: 1, start: now }) }).where(eq(schema.settings.key, rlKey));
        return { allowed: true };
      }
      if (data.count >= cfg.max) {
        const retryAfter = Math.ceil((cfg.windowMs - (now - data.start)) / 1000);
        return { allowed: false, retryAfter };
      }
      await db.update(schema.settings).set({ value: JSON.stringify({ count: data.count + 1, start: data.start }) }).where(eq(schema.settings.key, rlKey));
    } else {
      await db.insert(schema.settings).values({ key: rlKey, value: JSON.stringify({ count: 1, start: now }) });
    }
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

export async function clearRateLimit(key: string): Promise<void> {
  const rlKey = `rl:${key}`;
  try {
    await db.delete(schema.settings).where(eq(schema.settings.key, rlKey));
  } catch {}
}