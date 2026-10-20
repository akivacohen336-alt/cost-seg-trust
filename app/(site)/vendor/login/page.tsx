import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { card } from "@/components/site/ui";

export const metadata: Metadata = { title: "Vendor Portal", robots: { index: false } };

// Providers don't sign in here: each quote request reaches them as a private
// link by email. This page keeps the Lovable site's look and explains that.
export default function VendorLogin() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className={`${card} w-full max-w-md`}>
        <div className="flex flex-col space-y-1.5 p-6 text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit"><Building2 className="w-10 h-10 text-primary" /></div>
          <h3 className="font-semibold tracking-tight text-2xl">Vendor Portal</h3>
          <p className="text-sm text-muted-foreground">Submit quotes from the secure link we email you</p>
        </div>
        <div className="p-6 pt-0">
          <div className="rounded-md border border-border bg-muted/30 p-4 text-sm text-muted-foreground space-y-2">
            <p>Each new quote request arrives by email with your own private link. Open it to see the property details and submit your quote. No password is needed.</p>
            <p>Can&apos;t find the email? Search your inbox for &ldquo;CostSegTrust&rdquo; or ask us to resend it.</p>
          </div>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Don&apos;t have an account?</p>
            <p className="mt-1">Contact <a href="mailto:sales@costsegtrust.com" className="text-primary hover:underline">sales@costsegtrust.com</a> to become a vendor partner.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
