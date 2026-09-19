/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#F26622",
          "orange-hover": "#D95314",
          "orange-light": "#FFF4EE",
          "orange-border": "#FED7AA",
          purple: "#662C90",
          "purple-hover": "#532376",
          "purple-light": "#F7F2FA",
          "purple-border": "#E9D8FD",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#F26622",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#662C90",
          foreground: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ['"Hind Siliguri"', "Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
