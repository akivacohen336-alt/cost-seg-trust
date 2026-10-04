import QuoteForm from "@/components/QuoteForm";
import { config } from "@/lib/config";

// Stage 1 public page: brand, short pitch and the quote request form.
// The full marketing site (how it works, FAQ, articles) is a later stage.
export default function Home() {
  return (
    <>
      <header className="site-hdr">
        <div className="wrap">
          <a className="brand" href="/">Cost Seg <span>Trust</span></a>
          <div className="spacer" />
          <a className="btn primary" href="#quote-form">Get Free Quotes</a>
        </div>
      </header>
      <main>
        <section className="hero wrap">
          <h1>Cut the taxes on your investment property by <em>accelerating depreciation</em></h1>
          <p>Tell us about your property once. We gather competing quotes from vetted cost segregation firms and lay them out side by side, free.</p>
          <div className="trust"><span>Free to compare</span><span>No obligation</span><span>Vetted providers</span></div>
        </section>
        <section className="quote-sec" id="quote-form">
          <div className="wrap">
            <h2>Get free competing quotes</h2>
            <p className="lede">Takes about a minute. We'll be in touch with your side-by-side comparison.</p>
            <QuoteForm />
          </div>
        </section>
      </main>
      <footer className="site-foot">
        <div className="wrap">
          <div className="row">
            <b style={{ color: "#fff" }}>Cost Seg Trust</b>
            <span>
              <a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a> · <a href={`tel:${config.contactPhone.replace(/\D/g, "")}`}>{config.contactPhone}</a>
            </span>
          </div>
          <p className="fine">Content is for educational purposes only and is not tax, legal or accounting advice.</p>
        </div>
      </footer>
    </>
  );
}
