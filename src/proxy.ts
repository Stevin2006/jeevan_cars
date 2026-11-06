import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIES = ["__Host-jc_session", "jc_session"];

/**
 * Optimistic gate for /admin: bounce visitors with no session cookie straight
 * to the login page. This is a UX shortcut only — every admin page and Server
 * Action re-validates the session against the database via requireAdmin().
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL("/admin/login", request.url);
  if (pathname !== "/admin") loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
