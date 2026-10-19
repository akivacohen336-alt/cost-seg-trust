import type { Metadata } from "next";
import "./site.css";

export const metadata: Metadata = {
  title: { default: "CostSegTrust - Compare Top Cost Segregation Providers & Maximize Tax Savings", template: "%s | CostSegTrust" },
  description:
    "Get competitive quotes from qualified cost segregation providers. Accelerate depreciation deductions and reduce tax liability on your real estate investments with CostSegTrust.",
  keywords: ["cost segregation", "tax savings", "real estate depreciation", "IRS audit", "cost seg providers", "property depreciation", "tax benefits"],
  openGraph: {
    siteName: "CostSegTrust", type: "website", title: "CostSegTrust - Compare Top Cost Segregation Providers",
    description: "Get competitive quotes from qualified cost segregation providers. Save thousands on taxes with expert engineering and accounting analysis.",
    images: ["/img/og-image.png"],
  },
  twitter: {
    card: "summary_large_image", title: "CostSegTrust - Maximize Real Estate Tax Benefits",
    description: "Compare cost segregation services from top providers. Save thousands on taxes.", images: ["/img/og-image.png"],
  },
  icons: { icon: "/img/favicon.png", apple: "/img/apple-touch-icon.png" },
};

// Each page brings its own header and footer, as on the Lovable site.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
