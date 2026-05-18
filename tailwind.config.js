/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Geist", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        ink: {
          DEFAULT: "#0F1419",
          soft: "#2A3038",
          muted: "#5C6470",
          faint: "#9BA3AE",
        },
        paper: {
          DEFAULT: "#FAF8F3",
          soft: "#F2EFE7",
          card: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#1F3A5F",  // navy
          soft: "#3A5F8A",
          hover: "#152740",
        },
        gold: {
          DEFAULT: "#9C7A2E",
          soft: "#C9A75A",
        },
        rust: "#A0522D",
        sage: "#5C7355",
        // status accent dots
        stage: {
          start: "#9BA3AE",
          research: "#5C7BA8",
          outreach: "#C9A75A",
          response: "#D88A5B",
          discovery: "#5C7BA8",
          pilot: "#5C7355",
          proposal: "#3A5F8A",
          negotiate: "#9C7A2E",
          won: "#3D7A4B",
          lost: "#A0392E",
          nurture: "#7B8FA8",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 20, 25, 0.04), 0 1px 1px rgba(15, 20, 25, 0.06)",
        cardHover: "0 4px 12px rgba(15, 20, 25, 0.08), 0 2px 4px rgba(15, 20, 25, 0.06)",
        panel: "-12px 0 32px rgba(15, 20, 25, 0.12)",
      },
      letterSpacing: {
        tightish: "-0.015em",
        tighter: "-0.025em",
      },
    },
  },
  plugins: [],
};
