// Google redirects back here with `?code=...&state=...` after the user
// approves access. We verify state, exchange the code for tokens, save
// the refresh token + email in the iron-session cookie, then bounce the
// user back to /outreach.
import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/server/session";
import {
  clientFromRefreshToken,
  exchangeCodeForTokens,
  getUserEmail,
} from "@/lib/server/gmail";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const baseUrl = `${url.protocol}//${url.host}`;

  if (errorParam) {
    return NextResponse.redirect(
      `${baseUrl}/outreach?gmailError=${encodeURIComponent(errorParam)}`
    );
  }
  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/outreach?gmailError=missing_code`);
  }

  const session = await getSession();
  if (!session.oauthState || session.oauthState !== state) {
    return NextResponse.redirect(`${baseUrl}/outreach?gmailError=state_mismatch`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      // No refresh_token means the user has consented before and Google
      // didn't re-issue one. We forced `prompt=consent` in buildAuthUrl
      // to avoid this, but if it still happens, surface a clear error.
      return NextResponse.redirect(
        `${baseUrl}/outreach?gmailError=no_refresh_token`
      );
    }
    const client = clientFromRefreshToken(tokens.refresh_token);
    client.setCredentials(tokens);
    const email = await getUserEmail(client);

    session.refreshToken = tokens.refresh_token;
    session.email = email;
    session.oauthState = undefined; // burn the CSRF token
    await session.save();

    return NextResponse.redirect(`${baseUrl}/outreach?gmailConnected=1`);
  } catch (err: any) {
    console.error("OAuth callback failed", err);
    return NextResponse.redirect(
      `${baseUrl}/outreach?gmailError=${encodeURIComponent(err?.message ?? "exchange_failed")}`
    );
  }
}
