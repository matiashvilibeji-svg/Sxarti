import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          container: "hsl(var(--primary-container))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          container: "hsl(var(--secondary-container))",
        },
        tertiary: {
          DEFAULT: "hsl(var(--tertiary))",
          foreground: "hsl(var(--tertiary-foreground))",
          container: "hsl(var(--tertiary-container))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          container: "hsl(var(--error-container))",
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
        "surface-tint": "hsl(var(--surface-tint))",
        "on-surface": "hsl(var(--on-surface))",
        "on-surface-variant": "hsl(var(--on-surface-variant))",
        outline: {
          DEFAULT: "hsl(var(--outline))",
          variant: "hsl(var(--outline-variant))",
        },
        surface: {
          DEFAULT: "hsl(var(--surface))",
          "container-lowest": "hsl(var(--surface-container-lowest))",
          "container-low": "hsl(var(--surface-container-low))",
          container: "hsl(var(--surface-container))",
          "container-high": "hsl(var(--surface-container-high))",
          "container-highest": "hsl(var(--surface-container-highest))",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "BPG Arial",
          "Noto Sans Georgian",
          "DejaVu Sans",
          "sans-serif",
        ],
        georgian: [
          "BPG Arial",
          "Noto Sans Georgian",
          "DejaVu Sans",
          "sans-serif",
        ],
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.5rem",
        sm: "0.25rem",
      },
      boxShadow: {
        ambient: "0 20px 40px rgba(11, 28, 48, 0.06)",
        "ambient-sm": "0 8px 16px rgba(11, 28, 48, 0.04)",
        "ambient-lg": "0 32px 64px rgba(11, 28, 48, 0.08)",
      },
      letterSpacing: {
        display: "-0.02em",
      },
      backgroundImage: {
        "gradient-cta": "linear-gradient(135deg, #3525cd, #7531e6)",
        "gradient-cta-hover": "linear-gradient(135deg, #2a1da3, #6228c4)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [typography],
};

export default config;
