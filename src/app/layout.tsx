import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Indian Railways — Block Planning & Scheduling System | SIH26027",
  description:
    "AI-Powered Automatic Block Planning and Scheduling System for Indian Railways — Northern Railway, Delhi Division. Multi-Departmental Negotiation Engine.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='4' fill='%23003087'/><text x='4' y='22' font-size='16' fill='%23FF9933' font-family='serif' font-weight='bold'>IR</text></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Noto Sans — standard Indian Gov portal font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Noto Sans', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
