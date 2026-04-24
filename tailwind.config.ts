import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0b0d10",
        surface: "#14181e",
        "surface-elev": "#191e25",
        "surface-hover": "rgba(255,255,255,0.05)",
        border: "rgba(255,255,255,0.06)",
        primary: "#e5e7eb",
        secondary: "#cbd5e1",
        tertiary: "#9ca3af",
        muted: "#6b7280",
        "tone-success": "#34d399",
        "tone-success-dim": "rgba(52,211,153,0.12)",
        "tone-warn": "#fbbf24",
        "tone-warn-dim": "rgba(251,191,36,0.12)",
        "tone-danger": "#f87171",
        "tone-danger-dim": "rgba(248,113,113,0.12)",
        "tone-info": "#7dd3fc",
        "tone-info-dim": "rgba(125,211,252,0.12)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "SF Mono", "Menlo", "monospace"],
      },
      boxShadow: {
        "glass-inset": "inset 0 1px 0 rgba(255,255,255,0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
