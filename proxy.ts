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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // Only the *absence* of a cookie is acted on here, and only that is reliable:
  // no cookie means no session, full stop. Presence proves nothing without
  // verifying the signature, so the reverse redirect — bouncing a cookie-bearing
  // visitor off /books/login — does not belong in the proxy. It used to live
  // here, and a stale cookie (a dev restart rotating the session secret, or a
  // sign-out from another device) would bounce forever between this redirect and
  // the data access layer's, with no way to reach the form and clear it. The
  // login and register pages already send genuinely signed-in visitors to the
  // dashboard, on a verified getSession() check.
  if (isProtected && !hasSessionCookie) {
    const loginUrl = new URL("/books/login", request.nextUrl);
    // Remember where they were headed so the login can return them there.
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/books/:path*"],
};
