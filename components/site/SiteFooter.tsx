import { config } from "@/lib/config";
import { LEGAL_NAV, NAV, QUOTE_PATH } from "@/lib/site";
import Wordmark from "./Wordmark";

export default function SiteFooter() {
  const tel = config.contactPhone.replace(/\D/g, "");
  return (
    <footer className="s-foot">
      <div className="s-wrap">
        <div className="s-foot-grid">
          <div className="s-foot-brand">
            <Wordmark light />
            <p>A cost segregation comparison service. Submit your property once and compare options from multiple providers.</p>
            <a className="s-btn s-btn-light" href={QUOTE_PATH}>Compare Quotes</a>
          </div>
          <div>
            <h2 className="s-foot-h">Company</h2>
            <ul>{NAV.map(n => <li key={n.href}><a href={n.href}>{n.label}</a></li>)}</ul>
          </div>
          <div>
            <h2 className="s-foot-h">Legal</h2>
            <ul>{LEGAL_NAV.map(n => <li key={n.href}><a href={n.href}>{n.label}</a></li>)}</ul>
          </div>
          <div>
            <h2 className="s-foot-h">Contact</h2>
            <ul>
              <li><a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a></li>
              <li><a href={`tel:+1${tel.slice(-10)}`}>{config.contactPhone}</a></li>
              <li><a href="/contact">Send a message</a></li>
            </ul>
          </div>
        </div>
        <div className="s-foot-fine">
          <p>
            Cost Seg Trust does not perform cost segregation studies and does not provide tax, legal or accounting advice.
            Estimates provided by independent providers are not guarantees, and actual results may vary.
            Consult a qualified tax professional before making decisions. See our <a href="/tax-disclaimer">Tax Disclaimer</a>.
          </p>
          <p>© {new Date().getFullYear()} Cost Seg Trust. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
