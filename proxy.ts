import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic routing guard for the books application.
 *
 * This only looks for the presence of a session cookie. It deliberately does not
 * verify the signature or touch the database: the proxy runs on every request
 * including prefetches, and a database round trip here would tax every
 * navigation in the app.
 *
 * It is therefore a redirect convenience, not a security boundary. Real
 * authorisation happens in the data access layer, which verifies the cookie
 * signature and confirms the session is still live before returning any data.
 * A forged cookie gets past this check and then fails there.
 */

const SESSION_COOKIE = "books_session";

/** Signed-in area. Everything else under /books is public. */
const PROTECTED_PREFIXES = [
  "/books/dashboard",
  "/books/transactions",
  "/books/reports",
  "/books/gst",
  "/books/tax",
  "/books/forecast",
  "/books/settings",
];

const AUTH_PAGES = ["/books/login", "/books/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !hasSessionCookie) {
    const loginUrl = new URL("/books/login", request.nextUrl);
    // Remember where they were headed so the login can return them there.
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (AUTH_PAGES.includes(pathname) && hasSessionCookie) {
    return NextResponse.redirect(new URL("/books/dashboard", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/books/:path*"],
};
