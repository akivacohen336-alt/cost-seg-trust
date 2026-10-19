import Link from "next/link";
import { House } from "lucide-react";
import { btn } from "@/components/site/ui";
import "./(site)/site.css";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center px-4">
        <h1 className="mb-4 text-8xl font-bold text-primary">404</h1>
        <h2 className="mb-4 text-3xl font-semibold text-foreground">Page Not Found</h2>
        <p className="mb-8 text-xl text-muted-foreground max-w-md mx-auto">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link href="/" className={`${btn.primaryLg} gap-2`}><House className="w-4 h-4" />Return to CostSegTrust Home</Link>
      </div>
    </div>
  );
}
