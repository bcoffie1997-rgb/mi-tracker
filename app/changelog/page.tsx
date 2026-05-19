"use client";

import { TopBar } from "@/components/TopBar";
import { Changelog } from "@/components/Changelog";
import { CHANGELOG } from "@/lib/changelog";

export default function ChangelogPage() {
  const latest = CHANGELOG[0];
  return (
    <main className="relative min-h-screen pb-12">
      <TopBar activePage="changelog" />

      <div className="max-w-[1100px] mx-auto px-6 py-5">
        <div className="mb-6">
          <h2 className="serif-display text-2xl font-semibold tracking-tighter text-ink leading-tight">
            What's new
          </h2>
          <p className="text-[13px] text-ink-muted mt-1 max-w-2xl">
            Every change shipped to the tracker, freshest first. Generated from
            <span className="font-mono"> git log</span> at build time
            {latest && (
              <>
                {" · "}
                <span className="font-mono">latest {latest.hash}</span>
              </>
            )}
            .
          </p>
        </div>

        <Changelog />
      </div>
    </main>
  );
}
