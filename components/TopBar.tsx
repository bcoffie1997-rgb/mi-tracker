"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Upload, Trash } from "@/components/Icons";
import { exportData, importData, resetToSeed, loadContacts } from "@/lib/storage";
import { ThemeToggle } from "@/components/ThemeToggle";

type Page = "board" | "outreach" | "changelog";

interface TopBarProps {
  activePage: Page;
  // Right-aligned slot for page-specific actions (e.g. "+ New contact")
  actions?: React.ReactNode;
  // Called after Import or Reset so the page can re-hydrate from localStorage
  onDataReplaced?: () => void;
}

const NAV: { key: Page; label: string; href: string }[] = [
  { key: "board",     label: "Tracking",  href: "/" },
  { key: "outreach",  label: "Outreach",  href: "/outreach" },
  { key: "changelog", label: "Changelog", href: "/changelog" },
];

export function TopBar({ activePage, actions, onDataReplaced }: TopBarProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  function handleExport() {
    const json = exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mi-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  }

  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const result = importData(text);
      if (result.ok) {
        onDataReplaced?.();
        alert(result.message);
      } else {
        alert(`Import failed: ${result.message}`);
      }
    };
    input.click();
    setShowMenu(false);
  }

  function handleReset() {
    resetToSeed();
    // Force re-seed by reading contacts once
    loadContacts();
    onDataReplaced?.();
    setShowResetConfirm(false);
    setShowMenu(false);
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur-md border-b border-ink/10">
        <div className="max-w-[1400px] mx-auto px-6 py-3.5 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* Mindy lettermark — purple gradient, generous radius, soft glow */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-soft to-accent-hover flex items-center justify-center text-paper-card font-bold text-base shadow-md shadow-accent/30 group-hover:shadow-accent/40 transition-shadow">
              M
            </div>
            <div>
              <h1 className="serif-display text-[15px] font-bold tracking-tighter leading-none">
                Mindy
              </h1>
              <div className="text-[10px] text-ink-muted font-mono uppercase tracking-wider mt-0.5">
                Federal Pipeline Tracker
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-4 ml-6 text-[12px]">
            {NAV.map((n) => (
              <Link
                key={n.key}
                href={n.href}
                className={
                  n.key === activePage
                    ? "nav-active text-ink font-medium px-1 py-1"
                    : "text-ink-muted hover:text-ink px-1 py-1 transition-colors"
                }
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {actions}

            <ThemeToggle />

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-[12px] px-2 py-1.5 rounded hover:bg-ink/5 text-ink-muted hover:text-ink"
                aria-label="More actions"
              >
                ⋯
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-paper border border-ink/10 rounded shadow-cardHover py-1 min-w-[180px] z-50">
                    <button
                      onClick={handleExport}
                      className="w-full text-left px-3 py-1.5 text-[12px] text-ink hover:bg-ink/5 flex items-center gap-2"
                    >
                      <Download size={12} /> Export JSON
                    </button>
                    <button
                      onClick={handleImport}
                      className="w-full text-left px-3 py-1.5 text-[12px] text-ink hover:bg-ink/5 flex items-center gap-2"
                    >
                      <Upload size={12} /> Import JSON
                    </button>
                    <div className="my-1 h-px bg-ink/10" />
                    <button
                      onClick={() => {
                        setShowResetConfirm(true);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-[12px] text-rust hover:bg-rust/5 flex items-center gap-2"
                    >
                      <Trash size={12} /> Reset to seed data
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {showResetConfirm && (
        <>
          <div
            className="fixed inset-0 bg-ink/30 backdrop-blur-[2px] z-40 overlay-fade"
            onClick={() => setShowResetConfirm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-paper border border-ink/10 rounded-lg w-full max-w-sm shadow-cardHover pointer-events-auto overlay-fade p-5">
              <h2 className="serif-display text-lg font-medium tracking-tighter">
                Reset to seed data?
              </h2>
              <p className="text-[13px] text-ink-muted mt-1.5">
                This will replace all current contacts, templates, sequences, and sent
                messages with the originals. Your changes will be lost (unless you
                export first).
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="text-[12px] px-3 py-1.5 rounded text-ink-muted hover:bg-ink/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="text-[12px] px-3 py-1.5 rounded bg-rust text-paper hover:bg-rust/90 font-medium"
                >
                  Yes, reset
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
