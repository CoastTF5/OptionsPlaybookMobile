import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        surface: "rgba(255,255,255,0.03)",
        "surface-hover": "rgba(255,255,255,0.05)",
        primary: "#e2e8f0",
        secondary: "#cbd5e1",
        tertiary: "#94a3b8",
        muted: "#64748b",
      },
      boxShadow: {
        "glass-inset": "inset 0 1px 0 rgba(255,255,255,0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
