import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Auth cookies are issued by the backend domain, so Vercel middleware
  // cannot reliably read them here. Let the app render and rely on backend
  // auth checks instead of bouncing valid users back to /login.
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
