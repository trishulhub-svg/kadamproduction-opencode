// src/lib/auth.ts
// Pragmatic auth for MVP: bcrypt password verify (preserves PHP behavior) +
// signed JWT session cookie (httpOnly, sameSite=lax). The spec's access/refresh
// rotation model is preserved conceptually via the `sessions` table.
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { eq, and, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, schema } from "./db";

const COOKIE = "kp_session";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "employee";
};

async function sign(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

async function verify(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

/** Get current user from cookie (server components / route handlers). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  return verify(token);
}

/** Require an authenticated user, else redirect to /login. */
export async function requireUser(): Promise<SessionUser> {
  const u = await getCurrentUser();
  if (!u) throw new Error("UNAUTHENTICATED");
  return u;
}

/** Require an admin; otherwise return null so pages can redirect. */
export async function requireAdmin(): Promise<SessionUser | null> {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return null;
  return u;
}

export async function login(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await db
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.email, email.toLowerCase()), isNull(schema.users.deletedAt)))
    .limit(1)
    .then((r) => r[0]);

  // No email enumeration — same generic error as PHP.
  if (!user) return { ok: false, error: "Invalid Credentials" };
  const match = await bcrypt.compare(password, user.password);
  if (!match) return { ok: false, error: "Invalid Credentials" };

  const store = await cookies();
  const token = await sign({ id: user.id, name: user.name, email: user.email, role: user.role });
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return { ok: true };
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

/** Hash a password (bcrypt) — used by seed + employee create. */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

/** Verify current + set new password (Change Password page). */
export async function changePassword(
  userId: number,
  current: string,
  next: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1).then((r) => r[0]);
  if (!user) return { ok: false, error: "User not found" };
  if (!(await bcrypt.compare(current, user.password))) return { ok: false, error: "Current password is incorrect" };
  await db.update(schema.users).set({ password: await hashPassword(next), mustChangePwd: false }).where(eq(schema.users.id, userId));
  return { ok: true };
}
