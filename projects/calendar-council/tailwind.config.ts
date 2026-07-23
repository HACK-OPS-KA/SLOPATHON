import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1240px",
      },
    },
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        gold: {
          DEFAULT: "hsl(var(--gold))",
          foreground: "hsl(var(--gold-foreground))",
          muted: "hsl(var(--gold-muted))",
        },
        // Governance status semantics
        approve: "hsl(var(--approve))",
        oppose: "hsl(var(--oppose))",
        veto: "hsl(var(--veto))",
        conditional: "hsl(var(--conditional))",
        undecided: "hsl(var(--undecided))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          border: "hsl(var(--sidebar-border))",
          accent: "hsl(var(--sidebar-accent))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        seal: "0 1px 2px rgba(24,20,12,0.06), 0 8px 24px -12px rgba(24,20,12,0.28)",
        panel: "0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 40px -24px rgba(0,0,0,0.35)",
        chat: "0 2px 8px -4px rgba(0,0,0,0.18)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "message-in": {
          "0%": { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "typing-dot": {
          "0%, 60%, 100%": { transform: "translateY(0)", opacity: "0.4" },
          "30%": { transform: "translateY(-3px)", opacity: "1" },
        },
        "seal-in": {
          "0%": { opacity: "0", transform: "scale(1.6) rotate(-14deg)" },
          "60%": { opacity: "1" },
          "100%": { opacity: "1", transform: "scale(1) rotate(-8deg)" },
        },
        "consensus-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        "alarm": {
          "0%, 100%": { backgroundColor: "hsl(var(--veto) / 0)" },
          "50%": { backgroundColor: "hsl(var(--veto) / 0.10)" },
        },
        "shimmer": {
          "100%": { transform: "translateX(100%)" },
        },
        "gavel": {
          "0%": { transform: "rotate(0deg)" },
          "20%": { transform: "rotate(-24deg)" },
          "45%": { transform: "rotate(6deg)" },
          "60%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "message-in": "message-in 0.28s cubic-bezier(0.22,1,0.36,1)",
        "typing-dot": "typing-dot 1.2s infinite ease-in-out",
        "seal-in": "seal-in 0.5s cubic-bezier(0.22,1,0.36,1) forwards",
        "consensus-pulse": "consensus-pulse 1.6s infinite ease-in-out",
        "alarm": "alarm 1.1s infinite ease-in-out",
        "shimmer": "shimmer 1.8s infinite",
        "gavel": "gavel 0.7s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
