/** @type {import('tailwindcss').Config} */
module.exports = {
  // Class-based dark mode — toggled via a `dark` class on <html>.
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Geist", "ui-sans-serif", "system-ui", "sans-serif"],
        sans:    ["Geist", "ui-sans-serif", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      // Colors are pulled from CSS variables declared in globals.css so that
      // light / dark themes swap by setting the .dark class on <html>.
      // Vars hold space-separated RGB triples (e.g. "9 9 11") so Tailwind's
      // `<color>/<alpha>` opacity modifier (e.g. `border-ink/10`) still works
      // by composing rgb(var(--x) / <alpha-value>).
      colors: {
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          soft:    "rgb(var(--ink-soft) / <alpha-value>)",
          muted:   "rgb(var(--ink-muted) / <alpha-value>)",
          faint:   "rgb(var(--ink-faint) / <alpha-value>)",
        },
        paper: {
          DEFAULT: "rgb(var(--paper) / <alpha-value>)",
          soft:    "rgb(var(--paper-soft) / <alpha-value>)",
          card:    "rgb(var(--paper-card) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          soft:    "rgb(var(--accent-soft) / <alpha-value>)",
          hover:   "rgb(var(--accent-hover) / <alpha-value>)",
        },
        // Semantic status hues stay constant across themes — they're meant
        // to be eye-catching dots and badges in both light and dark.
        emerald: "#10B981",
        amber:   "#F59E0B",
        rose:    "#EF4444",
        violet:  "#8B5CF6",
        cyan:    "#06B6D4",
        // Legacy alias names kept so old class refs still resolve.
        gold:    { DEFAULT: "#F59E0B", soft: "#FBBF24" },
        rust:    "#EF4444",
        sage:    "#10B981",
        stage: {
          start:     "#A1A1AA",
          research:  "#60A5FA",
          outreach:  "#FBBF24",
          response:  "#FB923C",
          discovery: "#6366F1",
          pilot:     "#06B6D4",
          proposal:  "#8B5CF6",
          negotiate: "#F59E0B",
          won:       "#10B981",
          lost:      "#EF4444",
          nurture:   "#94A3B8",
        },
      },
      boxShadow: {
        card:      "0 1px 2px rgba(9, 9, 11, 0.04)",
        cardHover: "0 4px 8px rgba(9, 9, 11, 0.08), 0 1px 2px rgba(9, 9, 11, 0.06)",
        panel:     "-8px 0 24px rgba(9, 9, 11, 0.08)",
      },
      letterSpacing: {
        tightish: "-0.015em",
        tighter:  "-0.025em",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        md:  "0.375rem",
        lg:  "0.5rem",
      },
    },
  },
  plugins: [],
};
