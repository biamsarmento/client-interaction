import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#005e7c",
        secondary: "#02bbb6",
        "bg-card": "#e6f2f2",
        "health-ok": "#02bbb6",
        "health-warn": "#f59e0b",
        "health-critical": "#ef4444",
      },
    },
  },
  plugins: [],
};
export default config;
