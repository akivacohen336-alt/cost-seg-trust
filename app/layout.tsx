import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(config.appUrl),
  title: "Cost Seg Trust | Compare cost segregation quotes",
  description:
    "Submit your property once and compare cost segregation quotes from multiple providers side by side. Free, with no obligation.",
  icons: { icon: "/img/favicon.png", apple: "/img/apple-touch-icon.png" },
};

// Styles: the public site (app/(site)) uses Tailwind with the Lovable look;
// the admin, supplier and partner pages import app/globals.css themselves.

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
