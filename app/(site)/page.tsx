import Link from "next/link";
import { ArrowRight, Award, Calculator, Building2, CircleCheckBig, Clock, DollarSign, FileText, Shield, TrendingUp, Users } from "lucide-react";
import Accordion from "@/components/site/Accordion";
import Estimator from "@/components/site/Estimator";
import QuoteForm from "@/components/site/QuoteForm";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import { IMG, QUOTE_HREF } from "@/components/site/ui";
import { DISCLAIMER_SHORT, FAQ_2026, HOME_FAQ } from "@/lib/site-content";

const STEPS = [
  { icon: FileText, title: "Submit Your Property Details", text: "Provide basic information about your real estate investment in under 2 minutes." },
  { icon: Users, title: "Get Multiple Quotes", text: "Receive competitive pricing and terms from qualified cost segregation providers." },
  { icon: TrendingUp, title: "Compare & Choose", text: "Review proposals side-by-side and select the best provider for your needs." },
  { icon: CircleCheckBig, title: "Maximize Tax Savings", text: "Work with your chosen provider to accelerate depreciation and reduce tax liability." },
];

const BENEFITS = [
  { icon: DollarSign, title: "Increase Cash Flow", text: "Accelerate depreciation deductions and reduce current year tax liability by up to 30%." },
  { icon: Shield, title: "IRS Compliant", text: "All providers deliver audit-ready reports that meet IRS cost segregation requirements." },
  { icon: Clock, title: "Fast Turnaround", text: "Most studies are completed within 2-4 weeks, allowing you to claim savings quickly." },
  { icon: Award, title: "Expert Providers", text: "Compare quotes from certified engineers and tax professionals with proven track records." },
];

const STATS = [
  { icon: Building2, value: "500+", label: "Properties Analyzed" },
  { icon: Users, value: "10+", label: "Trusted Providers" },
  { icon: Award, value: "100%", label: "IRS Compliant" },
  { icon: TrendingUp, value: "$50M+", label: "Tax Savings Generated" },
];

// Faint ring pattern laid over the hero photo (from the Lovable site).
const PATTERN = "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptMCAwYzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02eiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L2c+PC9zdmc+')]";

export default function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader variant="home" />

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${IMG.hero}")` }}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/90 to-primary-glow/85" />
        </div>
        <div className={`absolute inset-0 ${PATTERN} opacity-10`} />
        <div className="container px-4 mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Maximize Your Real Estate Tax Benefits
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
              Compare cost segregation services from top providers. Save thousands on your taxes with expert engineering and accounting analysis.
            </p>
            <Link
              href={QUOTE_HREF}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-11 rounded-md bg-accent hover:bg-accent-glow text-accent-foreground font-semibold px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 delay-300"
            >
              Get Free Quotes <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="#calculator"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-11 rounded-md border-2 border-primary-foreground/80 text-primary-foreground hover:bg-primary-foreground/10 font-semibold px-8 py-6 text-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 delay-300 mt-4 sm:mt-0 sm:ml-4"
            >
              Estimate Your Tax Benefit <Calculator className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      <section className="py-24 bg-secondary/30">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Get started in minutes and unlock significant tax savings on your real estate investments</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="rounded-lg border text-card-foreground shadow-sm p-8 text-center hover:shadow-xl transition-all duration-300 bg-card border-border animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 150}ms` }}>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6"><Icon className="h-8 w-8" /></div>
                <h3 className="text-xl font-semibold text-card-foreground mb-3">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container px-4 mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 mb-6"><Building2 className="h-7 w-7 text-accent" /></div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Is my asset class eligible?</h2>
          <p className="text-primary-foreground/85 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Cost segregation applies to many investment property types — not primary residences. See the full list and details in our FAQ.
          </p>
          <Link
            href="/faq"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-11 rounded-md px-8 bg-accent hover:bg-accent-glow text-accent-foreground font-semibold shadow-lg"
          >
            View eligible property types <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Why Cost Segregation?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Transform your real estate investment into immediate tax savings</p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {BENEFITS.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="flex gap-6 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-accent/10 text-accent"><Icon className="h-7 w-7" /></div>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">{title}</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container px-4 mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMG.taxSavings} alt="Tax savings and financial growth" className="rounded-2xl shadow-2xl w-full h-[500px] object-cover" />
              <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-accent/20 rounded-full blur-3xl -z-10" />
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Why Real Estate Investors Trust Us</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                CostSegTrust connects you with the nation&apos;s most qualified cost segregation specialists. Our network of certified engineers and tax professionals have helped property investors unlock millions in tax savings through compliant, audit-ready cost segregation studies.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Whether you own commercial buildings, multi-family properties, or single-family rentals, our platform makes it simple to compare providers and choose the right partner for your investment.
              </p>
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Partnering with Industry Leaders</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                We&apos;ve carefully vetted each provider in our network to ensure they meet the highest standards for engineering expertise, tax knowledge, and customer service. You&apos;ll receive multiple quotes from qualified firms, making it easy to find the best value for your specific property type and timeline.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {STATS.map(({ icon: Icon, value, label }, i) => (
                  <div key={label} className="text-center animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3"><Icon className="h-6 w-6" /></div>
                    <div className="text-3xl font-bold text-foreground">{value}</div>
                    <div className="text-sm text-muted-foreground mt-1">{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative order-1 lg:order-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMG.handshake} alt="Professional partnership and trust" className="rounded-2xl shadow-2xl w-full h-[500px] object-cover" />
              <div className="absolute -top-8 -left-8 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/30">
        <div className="container px-4 mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-lg">Get answers to common questions about cost segregation</p>
          </div>
          <Accordion items={[...HOME_FAQ, ...FAQ_2026]} />
          <p className="mt-8 text-sm text-muted-foreground text-center">
            {DISCLAIMER_SHORT} <Link className="underline hover:text-foreground" href="/faq">Read the full 2026 FAQ</Link>.
          </p>
        </div>
      </section>

      <QuoteForm />

      <section id="calculator" className="py-24 bg-secondary/30 scroll-mt-24">
        <div className="container px-4 mx-auto max-w-xl">
          <Estimator />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
