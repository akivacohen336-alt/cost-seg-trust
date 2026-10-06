import type { Metadata } from "next";
import "./globals.css";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(config.appUrl),
  title: "Cost Seg Trust | Compare cost segregation quotes",
  description:
    "Submit your property once and compare cost segregation quotes from multiple providers side by side. Free, with no obligation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
