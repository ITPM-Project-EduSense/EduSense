import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("edusense_token");

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register");

  // Protect landing page
  if (!token && request.nextUrl.pathname.startsWith("/landing")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Prevent logged-in users from going back to login/register
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/landing", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/landing/:path*", "/login", "/register"],
};