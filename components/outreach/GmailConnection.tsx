"use client";

import { useEffect, useState } from "react";
import {
  getAuthStatus,
  disconnectGmail,
  type AuthStatus,
} from "@/lib/email/api-client";
import { Mail, Check, X } from "@/components/Icons";

interface GmailConnectionProps {
  // Called whenever the connection state changes so the parent can refresh
  // any UI (compose button labels, etc.) that depend on connectivity.
  onChange?: (status: AuthStatus) => void;
}

export function GmailConnection({ onChange }: GmailConnectionProps) {
  const [status, setStatus] = useState<AuthStatus>({ connected: false, email: null });
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const next = await getAuthStatus();
    setStatus(next);
    onChange?.(next);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // After OAuth callback, the URL has ?gmailConnected=1 or ?gmailError=...
    // — strip them and refresh.
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("gmailConnected") || url.searchParams.has("gmailError")) {
        const err = url.searchParams.get("gmailError");
        if (err) {
          // Surface the error so the user knows what happened.
          alert(`Gmail connection failed: ${err}`);
        }
        url.searchParams.delete("gmailConnected");
        url.searchParams.delete("gmailError");
        window.history.replaceState({}, "", url.toString());
        // refresh status once cookies have settled
        setTimeout(refresh, 50);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDisconnect() {
    if (!confirm("Disconnect Gmail? You'll need to re-authorize before sending again.")) return;
    await disconnectGmail();
    await refresh();
  }

  if (loading) {
    return (
      <span className="text-[11px] font-mono text-ink-muted">
        Checking Gmail…
      </span>
    );
  }

  if (!status.connected) {
    return (
      <a
        href="/api/auth/google"
        className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded border border-ink/15 hover:bg-ink/5 text-ink font-medium"
        title="Connect a Gmail / Workspace inbox so the tracker can send directly"
      >
        <Mail size={12} />
        Connect Gmail
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-paper-soft border border-ink/10 rounded pl-2 pr-1 py-1">
      <Check size={12} className="text-emerald" />
      <span className="text-[11px] text-ink-muted">Sending as</span>
      <span className="text-[12px] font-mono text-ink truncate max-w-[200px]">
        {status.email}
      </span>
      <button
        onClick={handleDisconnect}
        className="p-1 rounded hover:bg-ink/5 text-ink-muted hover:text-ink"
        aria-label="Disconnect Gmail"
        title="Disconnect Gmail"
      >
        <X size={11} />
      </button>
    </div>
  );
}
