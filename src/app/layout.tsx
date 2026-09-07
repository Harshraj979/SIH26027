import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RailBlock AI — Section Controller Cockpit | Northern Railway",
  description:
    "AI-Powered Multi-Departmental Block Planning and Dynamic Train Dispatching Engine for Indian Railways",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='4' fill='%230B0F17'/><path d='M4 22 L10 14 L14 18 L18 12 L22 22' stroke='%2310B981' fill='none' stroke-width='2' stroke-linecap='round'/></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} font-sans bg-[#0B0F17] text-slate-200 antialiased overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
