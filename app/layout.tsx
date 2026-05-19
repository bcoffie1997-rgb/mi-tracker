import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MI Enterprise Tracker",
  description: "Federal contracting intelligence pipeline — MI SaaS Enterprise Program",
};

// Inlined into <head> so it runs *before* React hydrates, preventing a flash
// of the wrong theme. Reads the same localStorage key the ThemeToggle writes
// to, falls back to the system preference.
const THEME_BOOT_SCRIPT = `
(function(){
  try {
    var stored = localStorage.getItem('mi-tracker:theme:v1');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored === 'dark' || stored === 'light' ? stored : (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="paper-grain">{children}</body>
    </html>
  );
}
