"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "@/components/Icons";

type Theme = "light" | "dark";
const STORAGE_KEY = "mi-tracker:theme:v1";

function readInitial(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage can be unavailable (private mode); the class is still applied.
  }
}

export function ThemeToggle() {
  // The boot script in app/layout.tsx has already applied the correct class
  // before hydration, so we mirror that state on first render.
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(readInitial());
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  // Render an inert placeholder pre-hydration to avoid a flash where the icon
  // disagrees with the applied theme.
  if (!mounted) {
    return (
      <button
        aria-hidden="true"
        tabIndex={-1}
        className="w-8 h-8 rounded text-ink-muted/0"
      >
        <span className="block w-3.5 h-3.5" />
      </button>
    );
  }

  const isDark = theme === "dark";
  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="flex items-center justify-center w-8 h-8 rounded text-ink-muted hover:text-ink hover:bg-ink/5 transition-colors"
    >
      {isDark ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
