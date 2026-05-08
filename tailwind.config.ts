import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        asphalt: "#08090b",
        iron: "#111318",
        steel: "#1c2029",
        gold: "#f5c542",
        amberline: "#f59e0b",
        victory: "#39d98a",
        danger: "#ef4444"
      },
      boxShadow: {
        glow: "0 0 40px rgba(245, 197, 66, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
