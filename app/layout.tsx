import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MI Enterprise Tracker",
  description: "Federal contracting intelligence pipeline — MI SaaS Enterprise Program",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="paper-grain">{children}</body>
    </html>
  );
}
