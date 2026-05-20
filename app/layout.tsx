import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mindy — Federal Pipeline Tracker",
  description:
    "Pipeline tracker for Mindy's enterprise BD motion. Manage federal contracting leads, sequenced outreach, and reply tracking from one dashboard.",
  openGraph: {
    title: "Mindy — Federal Pipeline Tracker",
    description:
      "Manage federal contracting leads, sequenced outreach, and reply tracking from one dashboard.",
    siteName: "Mindy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mindy — Federal Pipeline Tracker",
    description:
      "Manage federal contracting leads, sequenced outreach, and reply tracking from one dashboard.",
  },
};

// Inlined into <head> so it runs *before* React hydrates, preventing a flash
// of the wrong theme. Reads the same localStorage key the ThemeToggle writes
// to. Mindy is dark-first — when there's no stored preference and the system
// hasn't expressed one, we default to dark.
const THEME_BOOT_SCRIPT = `
(function(){
  try {
    var stored = localStorage.getItem('mi-tracker:theme:v1');
    var prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    var theme = stored === 'dark' || stored === 'light' ? stored : (prefersLight ? 'light' : 'dark');
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
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
