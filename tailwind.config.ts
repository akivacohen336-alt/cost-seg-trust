import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

// Tailwind is used only by the public website, which copies the look of the
// Lovable site (costsegtrust.com): the same theme, colours and class names.
export default {
  content: ["./app/(site)/**/*.{ts,tsx}", "./app/not-found.tsx", "./components/site/**/*.{ts,tsx}", "./lib/site-content.ts"],
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))", glow: "hsl(var(--primary-glow))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))", glow: "hsl(var(--accent-glow))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--accordion-height)" } },
        "accordion-up": { from: { height: "var(--accordion-height)" }, to: { height: "0" } },
      },
      animation: { "accordion-down": "accordion-down 0.2s ease-out", "accordion-up": "accordion-up 0.2s ease-out" },
    },
  },
  plugins: [animate],
} satisfies Config;
