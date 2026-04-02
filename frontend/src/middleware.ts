import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Support both Firebase-backed session cookie and legacy JWT cookie.
  const sessionCookie = request.cookies.get("session");
  const legacyCookie = request.cookies.get("edusense_token");

  const isDashboardPage =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/planner") ||
    request.nextUrl.pathname.startsWith("/tasks") ||
    request.nextUrl.pathname.startsWith("/users") ||
    request.nextUrl.pathname.startsWith("/materials") ||
    request.nextUrl.pathname.startsWith("/ai") ||
    request.nextUrl.pathname.startsWith("/analytics") ||
    request.nextUrl.pathname.startsWith("/notifications") ||
    request.nextUrl.pathname.startsWith("/settings");
  // Protect dashboard pages - require authentication
  if (!sessionCookie && !legacyCookie && isDashboardPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/landing",
    "/dashboard/:path*",
    "/planner/:path*",
    "/tasks/:path*",
    "/users/:path*",
    "/materials/:path*",
    "/ai/:path*",
    "/analytics/:path*",
    "/notifications/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};
