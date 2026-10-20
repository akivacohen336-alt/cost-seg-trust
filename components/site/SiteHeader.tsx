import Link from "next/link";
import Logo from "./Logo";
import { QUOTE_HREF, btn } from "./ui";

/**
 * The page header, as on the Lovable site: fixed over the homepage hero,
 * sticky elsewhere. The FAQ page shows only the logo and the quote button.
 */
export default function SiteHeader({ variant }: { variant: "home" | "nav" | "plain" }) {
  const position = variant === "home" ? "fixed top-0 left-0 right-0" : "sticky top-0";
  return (
    <header className={`${position} z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm`}>
      <div className="container px-4 mx-auto">
        <div className="flex items-center justify-between h-16 sm:h-24">
          <Link href="/" aria-label="CostSegTrust home">
            <Logo size="md" className="sm:hidden" />
            <Logo size="xl" className="hidden sm:flex" />
          </Link>
          {variant === "plain" ? (
            <Link className={btn.header} href={QUOTE_HREF}>Get Free Quote</Link>
          ) : (
            <div className="flex items-center gap-3 sm:gap-5">
              <Link className="text-sm sm:text-base font-medium text-foreground/80 hover:text-foreground transition-colors" href="/articles">Articles</Link>
              <Link className="text-sm sm:text-base font-medium text-foreground/80 hover:text-foreground transition-colors" href="/faq">FAQ</Link>
              <Link className={variant === "home" ? btn.homeHeader : btn.header} href={QUOTE_HREF}>
                <span className="hidden sm:inline">Get Free Quote</span>
                <span className="sm:hidden">Get Quote</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
