import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  return NextResponse.json({
    connected: Boolean(session.refreshToken),
    email: session.email ?? null,
  });
}
