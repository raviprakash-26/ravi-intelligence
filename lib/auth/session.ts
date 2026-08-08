import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import * as repository from "@/lib/db/repository";

export const SESSION_COOKIE = "books_session";

/** Sessions last a fortnight; the cookie and the database row expire together. */
const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Signing key for session cookies.
 *
 * In production this must be supplied. In development a random key is generated
 * per process, which means restarting the dev server signs everyone out — an
 * annoyance, but far better than shipping a hardcoded default that would end up
 * in production and let anyone mint their own session cookie.
 */
let developmentSecret: string | null = null;

function signingKey(): string {
  const configured = process.env.BOOKS_SESSION_SECRET;
  if (configured && configured.length >= 32) return configured;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "BOOKS_SESSION_SECRET must be set to a random string of at least 32 characters in production."
    );
  }

  if (!developmentSecret) {
    developmentSecret = randomBytes(32).toString("hex");
    console.warn(
      "[books] BOOKS_SESSION_SECRET is not set. Using a temporary key — sessions will not survive a restart."
    );
  }
  return developmentSecret;
}

/**
 * Signs a session id so a tampered cookie is rejected before it reaches the
 * database. The signature is not encryption — the session id is opaque and
 * useless without the matching row — it only proves we issued this value.
 */
function sign(sessionId: string): string {
  const signature = createHmac("sha256", signingKey())
    .update(sessionId)
    .digest("base64url");
  return `${sessionId}.${signature}`;
}

function unsign(value: string): string | null {
  const separator = value.lastIndexOf(".");
  if (separator <= 0) return null;

  const sessionId = value.slice(0, separator);
  const provided = value.slice(separator + 1);
  const expected = createHmac("sha256", signingKey())
    .update(sessionId)
    .digest("base64url");

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(providedBuffer, expectedBuffer)) return null;

  return sessionId;
}

/** Creates a session row and sets the cookie. */
export async function startSession(input: {
  userId: string;
  tenantId: string;
  userAgent?: string;
}): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const session = repository.createSession({
    userId: input.userId,
    tenantId: input.tenantId,
    expiresAt: expiresAt.toISOString(),
    userAgent: input.userAgent,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sign(session.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

/**
 * Resolves the current session from the cookie, verifying both the signature and
 * that the session is still live in the database. A revoked or expired session
 * fails here even if the cookie itself is intact.
 */
export async function readSession(): Promise<repository.SessionRecord | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const sessionId = unsign(raw);
  if (!sessionId) return null;

  return repository.getLiveSession(sessionId);
}

export async function endSession(): Promise<void> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;

  if (raw) {
    const sessionId = unsign(raw);
    if (sessionId) repository.deleteSession(sessionId);
  }

  cookieStore.delete(SESSION_COOKIE);
}

/** Signs the user out of every device by dropping all their session rows. */
export async function endAllSessions(userId: string): Promise<void> {
  repository.deleteSessionsForUser(userId);
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
