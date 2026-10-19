import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container px-4 mx-auto">
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4">CostSegTrust</h3>
            <p className="text-primary-foreground/80 leading-relaxed">Connect with top cost segregation providers and maximize your real estate tax benefits.</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">About Cost Segregation</h4>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              Cost segregation is an IRS-approved tax strategy that accelerates depreciation deductions on commercial and residential investment properties, resulting in immediate tax savings.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Resources</h4>
            <Link className="block text-primary-foreground/80 text-sm hover:text-accent transition-colors" href="/faq">FAQ: Cost Segregation &amp; 2026 Bonus Depreciation</Link>
            <Link className="block mt-3 text-primary-foreground/80 text-sm hover:text-accent transition-colors" href="/articles">Articles</Link>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <p className="text-primary-foreground/80 text-sm">
              Questions about our service?
              <br />
              <a className="hover:text-accent transition-colors" href="mailto:sales@costsegtrust.com">sales@costsegtrust.com</a>
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">For Vendors</h4>
            <p className="text-primary-foreground/80 text-sm mb-3">Are you a cost segregation provider?</p>
            <Link className="inline-block text-sm font-medium text-accent hover:text-accent/80 transition-colors" href="/vendor/login">Vendor Portal Login →</Link>
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 pt-8 text-center text-primary-foreground/60 text-sm">
          <p>© {new Date().getFullYear()} CostSegTrust. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
