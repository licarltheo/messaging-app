/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "#8B5CF6", foreground: "#ffffff" },
        secondary: { DEFAULT: "#3B82F6", foreground: "#ffffff" },
        accent: { DEFAULT: "#22D3EE", foreground: "#0f172a" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
      },
      borderRadius: { lg: "0.75rem" },
      backgroundImage: {
        "hero-glow": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139, 92, 246, 0.3), transparent)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
