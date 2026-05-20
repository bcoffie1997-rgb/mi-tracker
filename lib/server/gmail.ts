// Server-only — Google OAuth2 client + Gmail API helpers.
import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
];

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export function createOAuthClient(): OAuth2Client {
  return new google.auth.OAuth2(
    requireEnv("GOOGLE_CLIENT_ID"),
    requireEnv("GOOGLE_CLIENT_SECRET"),
    requireEnv("GOOGLE_REDIRECT_URI"),
  );
}

export function buildAuthUrl(state: string): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",       // gets us a refresh_token
    prompt: "consent",            // forces refresh_token even on re-auth
    scope: SCOPES,
    state,
    include_granted_scopes: true,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

// Given a stored refresh token, build a client that automatically uses it
// to mint short-lived access tokens for each request.
export function clientFromRefreshToken(refreshToken: string): OAuth2Client {
  const client = createOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

export async function getUserEmail(client: OAuth2Client): Promise<string> {
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data } = await oauth2.userinfo.get();
  return data.email ?? "";
}

// Build an RFC 2822 message and submit via Gmail's messages.send.
// Returns the Gmail messageId + threadId + the RFC822 Message-Id header
// (useful for stitching follow-ups into the same thread later).
export async function sendMessage(args: {
  client: OAuth2Client;
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  body: string;
  // If this is a follow-up to an existing thread, pass the prior thread's
  // Gmail threadId AND the RFC 2822 Message-Id of the most recent message
  // in that thread so we can include In-Reply-To / References headers.
  threadId?: string;
  inReplyTo?: string;
  references?: string[];
}): Promise<{ messageId: string; threadId: string; rfc822MessageId: string }> {
  const gmail = google.gmail({ version: "v1", auth: args.client });

  // Generate a deterministic-ish Message-Id so we can echo it back to the
  // client and use it as the In-Reply-To header on the next follow-up.
  const messageDomain = args.from.split("@")[1] || "localhost";
  const rfc822MessageId = `<${Date.now()}.${Math.random().toString(36).slice(2)}@${messageDomain}>`;

  const fromHeader = args.fromName ? `${args.fromName} <${args.from}>` : args.from;
  const headers: string[] = [
    `From: ${fromHeader}`,
    `To: ${args.to}`,
    `Subject: ${encodeSubject(args.subject)}`,
    `Message-ID: ${rfc822MessageId}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
  ];
  if (args.inReplyTo) headers.push(`In-Reply-To: ${args.inReplyTo}`);
  if (args.references?.length) headers.push(`References: ${args.references.join(" ")}`);

  const raw = `${headers.join("\r\n")}\r\n\r\n${args.body}`;
  const encoded = Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encoded,
      ...(args.threadId ? { threadId: args.threadId } : {}),
    },
  });

  return {
    messageId: res.data.id ?? "",
    threadId: res.data.threadId ?? "",
    rfc822MessageId,
  };
}

// RFC 2047 encoded-word for non-ASCII subject lines.
function encodeSubject(subject: string): string {
  // ASCII-only subjects pass through unchanged.
  if (/^[\x20-\x7E]*$/.test(subject)) return subject;
  const b64 = Buffer.from(subject, "utf8").toString("base64");
  return `=?UTF-8?B?${b64}?=`;
}
