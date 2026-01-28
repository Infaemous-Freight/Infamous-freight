import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#07070A",
        obsidian: "#0E0E13",
        carbon: "#121218",
        crimson: "#E10600",
        neural: "#FF1A1A",
        ember: "#FF4D4D",
        gold: "#D4AF37",
      },
      borderRadius: {
        god: "14px",
      },
      boxShadow: {
        glowSoft: "0 0 18px rgba(255,26,26,.22)",
        glowMed: "0 0 34px rgba(255,26,26,.35)",
        glowHard: "0 0 64px rgba(255,26,26,.55)",
      },
      transitionTimingFunction: {
        god: "cubic-bezier(0.4,0,0.2,1)",
      },
      keyframes: {
        idlePulse: {
          "0%,100%": { boxShadow: "0 0 18px rgba(255,26,26,.22)" },
          "50%": { boxShadow: "0 0 34px rgba(255,26,26,.35)" },
        },
      },
      animation: {
        idlePulse: "idlePulse 6.2s cubic-bezier(0.4,0,0.2,1) infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
