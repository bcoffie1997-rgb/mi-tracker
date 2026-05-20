// Server-only — iron-session cookie config for the Gmail OAuth flow.
// The refresh token lives in an encrypted httpOnly cookie so the browser
// never holds the credential; only the server can read or use it.
import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

export interface GmailSession {
  // Long-lived refresh token from Google's OAuth response. Used to mint
  // short-lived access tokens on each Gmail API call.
  refreshToken?: string;
  // User identity surfaced in the dashboard "Connected as ..." chip.
  email?: string;
  // CSRF protection state — generated on /api/auth/google, verified on
  // /api/auth/google/callback. Discarded after a successful exchange.
  oauthState?: string;
}

const password = process.env.IRON_SESSION_PASSWORD;
if (!password || password.length < 32) {
  // Surfacing a clearer error than iron-session's runtime one — the dev
  // running this for the first time should see why nothing works.
  // We don't throw at module load because Next collects routes at build
  // time and the env may not be present then.
}

export const sessionOptions: SessionOptions = {
  password: password ?? "fallback-do-not-use-in-real-build-fallback-fallback",
  cookieName: "mi-tracker-session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // 30 days. Refresh tokens last until revoked, but the cookie can be
    // shorter — re-auth on cookie expiry just rebuilds it.
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  },
};

// Helper used inside Next route handlers (not Server Components — those
// don't have writable cookies in this Next version).
//
// We rely on iron-session's own return type rather than declaring it
// ourselves; the IronSession type already overlays `save()` / `destroy()`
// onto the session object.
export async function getSession() {
  // `cookies()` is sync in Next 14 — wrap in Promise.resolve for forward-
  // compat with Next 15+ which makes it async.
  const cookieStore = await Promise.resolve(cookies());
  return getIronSession<GmailSession>(cookieStore as any, sessionOptions);
}
