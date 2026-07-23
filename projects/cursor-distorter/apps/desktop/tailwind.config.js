/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // "Comically professional" venture-SaaS palette.
        ink: {
          950: "#05060a",
          900: "#0a0c14",
          850: "#0e111c",
          800: "#131826",
          700: "#1b2233",
          600: "#273049",
          500: "#3a4657",
        },
        brand: {
          50: "#eef4ff",
          100: "#dbe6ff",
          300: "#9db8ff",
          400: "#6f92ff",
          500: "#4f6bf6",
          600: "#3b4fe0",
          700: "#2f3cbe",
        },
        accent: {
          cyan: "#38e1c8",
          violet: "#a983ff",
          amber: "#ffbf47",
          rose: "#ff6b8b",
        },
        signal: {
          ok: "#3fe08a",
          warn: "#ffbf47",
          bad: "#ff5c72",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "SF Mono",
          "Menlo",
          "monospace",
        ],
      },
      boxShadow: {
        glass: "0 8px 40px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
        glow: "0 0 0 1px rgba(79,107,246,0.4), 0 0 28px -4px rgba(79,107,246,0.55)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(79,107,246,0.45)" },
          "70%": { boxShadow: "0 0 0 10px rgba(79,107,246,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(79,107,246,0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 2s infinite",
        shimmer: "shimmer 2.4s linear infinite",
        "spin-slow": "spin-slow 1.1s linear infinite",
      },
    },
  },
  plugins: [],
};
