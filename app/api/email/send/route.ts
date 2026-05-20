import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/server/session";
import { clientFromRefreshToken, sendMessage } from "@/lib/server/gmail";

export const dynamic = "force-dynamic";

interface SendBody {
  to: string;
  subject: string;
  body: string;
  fromName?: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string[];
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.refreshToken || !session.email) {
    return NextResponse.json(
      { error: "not_connected", message: "Gmail is not connected. Connect via /api/auth/google." },
      { status: 401 }
    );
  }

  let body: SendBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.to || !body.subject) {
    return NextResponse.json(
      { error: "missing_fields", message: "to + subject required" },
      { status: 400 }
    );
  }

  try {
    const client = clientFromRefreshToken(session.refreshToken);
    const result = await sendMessage({
      client,
      from: session.email,
      fromName: body.fromName,
      to: body.to,
      subject: body.subject,
      body: body.body ?? "",
      threadId: body.threadId,
      inReplyTo: body.inReplyTo,
      references: body.references,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("Gmail send failed", err);
    const status = err?.code ?? err?.response?.status ?? 500;
    return NextResponse.json(
      {
        error: "send_failed",
        message: err?.message ?? "Gmail send failed",
        details: err?.response?.data,
      },
      { status: typeof status === "number" ? status : 500 }
    );
  }
}
