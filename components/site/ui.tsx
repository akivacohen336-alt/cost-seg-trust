// Building blocks shared by the public site. Class names match the Lovable
// site (shadcn/ui) so pages look the same.
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Where every "Get Free Quote" button goes: the form at the bottom of the homepage. */
export const QUOTE_HREF = "/#quote-form";

/** Site photos, served from the database (see app/img/[name]/route.ts). */
export const IMG = {
  logo: "/img/costsegtrust-logo.png",
  hero: "/img/hero-building.jpg",
  taxSavings: "/img/tax-savings-graphic.jpg",
  handshake: "/img/partnership-handshake.jpg",
};

const BTN = "inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

export const btn = {
  /** The orange "Get Free Quote" button in the page headers. */
  header: `${BTN} rounded-md h-10 px-4 py-2 transition-colors bg-accent hover:bg-accent-glow text-accent-foreground font-semibold shadow-md`,
  homeHeader: `${BTN} rounded-md h-10 py-2 bg-accent hover:bg-accent-glow text-accent-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-300 text-sm sm:text-base px-3 sm:px-4 flex-shrink-0`,
  accentLg: `${BTN} text-sm transition-colors h-11 rounded-md px-8 bg-accent hover:bg-accent-glow text-accent-foreground font-semibold`,
  primary: `${BTN} rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2`,
  primaryLg: `${BTN} text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-md px-8`,
  outline: `${BTN} rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2`,
  outlineSm: `${BTN} text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3`,
  ghostSm: `${BTN} text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3`,
};

export const card = "rounded-lg border bg-card text-card-foreground shadow-sm";

/** The CTA used at the end of the FAQ page and each article. */
export function FreeEstimateButton() {
  return (
    <Link className={btn.accentLg} href={QUOTE_HREF}>
      Get Free Estimate <ArrowRight className="ml-2 h-5 w-5" />
    </Link>
  );
}
