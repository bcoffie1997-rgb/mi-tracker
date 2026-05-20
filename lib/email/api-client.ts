// Client-side fetch wrappers for the Gmail-related API routes.

export interface AuthStatus {
  connected: boolean;
  email: string | null;
}

export async function getAuthStatus(): Promise<AuthStatus> {
  try {
    const res = await fetch("/api/auth/status", { cache: "no-store" });
    if (!res.ok) return { connected: false, email: null };
    return await res.json();
  } catch {
    return { connected: false, email: null };
  }
}

export async function disconnectGmail(): Promise<void> {
  await fetch("/api/auth/disconnect", { method: "POST" });
}

export interface SendArgs {
  to: string;
  subject: string;
  body: string;
  fromName?: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string[];
}

export interface SendResult {
  ok: true;
  messageId: string;
  threadId: string;
  rfc822MessageId: string;
}

export interface SendError {
  ok: false;
  error: string;
  message: string;
  status: number;
}

export async function sendEmail(args: SendArgs): Promise<SendResult | SendError> {
  const res = await fetch("/api/email/send", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(args),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: data.error ?? "unknown",
      message: data.message ?? `HTTP ${res.status}`,
      status: res.status,
    };
  }
  return data as SendResult;
}
