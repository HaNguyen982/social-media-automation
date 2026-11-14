import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  getAdminSecret,
  verifySessionToken,
} from "@/lib/admin-auth";

export const config = {
  matcher: [
    "/posts/:path*",
    "/posts",
    "/generator/:path*",
    "/generator",
    "/login",
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secret = getAdminSecret();

  const isProtectedPage =
    pathname.startsWith("/posts") || pathname.startsWith("/generator");
  const isLoginPage = pathname === "/login";

  let isAuthenticated = false;

  const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (sessionCookie && secret) {
    const verification = await verifySessionToken(sessionCookie, secret);
    isAuthenticated = verification.valid;
  }

  // 1. Unauthenticated users accessing protected write pages are redirected to /login
  if (isProtectedPage && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    const response = NextResponse.redirect(loginUrl);
    if (sessionCookie) {
      // Clear invalid, tampered, or expired session cookie
      response.cookies.delete(ADMIN_COOKIE_NAME);
    }
    return response;
  }

  // 2. Already-authenticated users accessing /login are redirected to their destination or /posts
  if (isLoginPage && isAuthenticated) {
    const from = request.nextUrl.searchParams.get("from") || "/posts";
    const redirectUrl = new URL(from, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}
