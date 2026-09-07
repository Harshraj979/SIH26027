import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans:  ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono:  ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        // RailBlock AI semantic palette
        hazard:    "#EF4444",  // crimson — Safety Alert
        optimal:   "#10B981",  // emerald — Operational/Optimized
        caution:   "#F59E0B",  // amber   — Delay/Warning
        // Background layers
        surface:   "#0B0F17",
        panel:     "#111827",
        card:      "#1F2937",
      },
    },
  },
  plugins: [],
};

export default config;
