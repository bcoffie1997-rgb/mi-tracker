// Starts the OAuth dance. Generates a random `state` for CSRF protection,
// stashes it in the iron-session cookie, then redirects the user to Google.
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getSession } from "@/lib/server/session";
import { buildAuthUrl } from "@/lib/server/gmail";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  const state = randomBytes(16).toString("hex");
  session.oauthState = state;
  await session.save();

  const url = buildAuthUrl(state);
  return NextResponse.redirect(url);
}
