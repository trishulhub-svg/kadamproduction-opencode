// src/middleware.ts
// Auth + RBAC gate. Public routes: /login, /api/upload/logo, static assets.
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC = ["/login", "/forgot-password", "/reset-password"];
const COOKIE = "kp_session";

async function roleFromToken(token?: string): Promise<"admin" | "employee" | null> {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");
    const { payload } = await jwtVerify(token, secret);
    return (payload.role as "admin" | "employee") ?? null;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE)?.value;
  const role = await roleFromToken(token);

  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Employee-restricted admin modules
  const ADMIN_ONLY = ["/inventory", "/categories", "/orders", "/finance", "/employees", "/teams", "/settings"];
  if (role === "employee" && ADMIN_ONLY.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads|api).*)"],
};
