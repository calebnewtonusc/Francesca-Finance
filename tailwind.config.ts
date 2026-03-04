import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        apple: {
          green: "#30d158",
          "green-dim": "#1a7a32",
          blue: "#0a84ff",
          red: "#ff453a",
          orange: "#ff9f0a",
          yellow: "#ffd60a",
          purple: "#bf5af2",
          bg: "#000000",
          surface1: "#1c1c1e",
          surface2: "#2c2c2e",
          surface3: "#3a3a3c",
          label: "#ffffff",
          "label-2": "rgba(235,235,245,0.6)",
          "label-3": "rgba(235,235,245,0.3)",
          "label-4": "rgba(235,235,245,0.18)",
          separator: "rgba(84,84,88,0.65)",
          "separator-opaque": "#38383a",
        },
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      backdropBlur: {
        apple: "40px",
        nav: "28px",
      },
      animation: {
        "fade-up": "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
        pulse: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
