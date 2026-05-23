import type { Config } from "tailwindcss";

// 颜色 / 圆角 token 严格按 DESIGN.md §1。不要改色值。
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#0a0a14",
          elevated: "#12121f",
          "elevated-2": "#181826",
        },
        text: {
          primary: "#ECECF1",
          secondary: "#9A9AB0",
          tertiary: "#5C5C70",
        },
        accent: {
          DEFAULT: "#8B7CF6",
          blue: "#5B8DEF",
          glow: "#a78bfa",
        },
      },
      borderColor: {
        subtle: "rgba(255,255,255,0.06)",
        glow: "rgba(139,124,246,0.25)",
      },
      borderRadius: {
        sm: "8px",
        md: "14px",
        lg: "20px",
      },
      fontFamily: {
        display: ["Georgia", '"Songti SC"', '"Source Han Serif SC"', '"Noto Serif SC"', "serif"],
        body: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"PingFang SC"',
          '"Helvetica Neue"',
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 0 30px rgba(139,124,246,0.18)",
        orb: "0 0 80px rgba(139,124,246,0.75), 0 0 120px rgba(91,141,239,0.35), inset 0 0 22px rgba(255,255,255,0.35)",
        card: "0 24px 70px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,124,246,0.06)",
      },
      keyframes: {
        breathe: {
          "0%,100%": { transform: "scale(1)", opacity: "0.92" },
          "50%": { transform: "scale(1.08)", opacity: "1" },
        },
        rise: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        breathe: "breathe 6s ease-in-out infinite",
        rise: "rise .9s cubic-bezier(.2,.7,.2,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
