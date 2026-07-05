import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Middleware for route protection.
 *
 * Uses optimistic cookie check (no DB call) for performance.
 * Full session validation happens in server components/API routes.
 *
 * Protected: /dashboard/*, /documents/*, /upload/*
 * Public: /login, /signup, /api/auth/*
 */

const PUBLIC_ROUTES = ["/login", "/signup"];
const AUTH_API_PREFIX = "/api/auth";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Allow auth API routes
  if (pathname.startsWith(AUTH_API_PREFIX)) {
    return NextResponse.next();
  }

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    const sessionCookie = getSessionCookie(request);
    // If user is already authenticated, redirect to dashboard
    if (sessionCookie) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protected routes: check for session cookie
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/documents/:path*",
    "/upload/:path*",
    "/login",
    "/signup",
  ],
};
