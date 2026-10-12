import type { Metadata } from "next";
import LegalPage from "@/components/site/LegalPage";

export const metadata: Metadata = { title: "Tax Disclaimer", description: "Cost Seg Trust does not provide tax, legal or accounting advice. Estimates are not guarantees." };

export default function TaxDisclaimer() {
  return (
    <LegalPage eyebrow="Legal" title="Tax Disclaimer" intro="Important information about estimates, tax benefits and the limits of our role.">
      <h2>Not tax, legal or accounting advice</h2>
      <p>
        Cost Seg Trust does not provide tax, legal or accounting advice. Nothing on this website, in a comparison or in any
        communication from us should be relied on as such advice. Content is provided for general educational and
        informational purposes only.
      </p>

      <h2>Estimates are not guarantees</h2>
      <p>
        Any estimated depreciation, reclassification amounts, tax benefits, fees or timelines shown in a quote or comparison are
        estimates prepared by independent providers based on limited information. They are not guarantees. The completed
        study may differ, and the tax benefit, if any, that you realize depends on your individual circumstances.
      </p>

      <h2>Results may vary</h2>
      <p>
        Whether cost segregation benefits you, and by how much, depends on factors including your property, its cost basis
        and placed-in-service date, your tax situation, passive activity and other limitations, how long you hold the
        property, possible depreciation recapture when you sell, and the tax law in effect. Tax laws and their interpretation
        change over time.
      </p>

      <h2>We do not perform studies</h2>
      <p>
        Cost Seg Trust does not perform cost segregation studies. Studies are performed by independent providers, who are
        responsible for their methods, conclusions and supporting documentation.
      </p>

      <h2>Consult a qualified professional</h2>
      <p>
        Before acting on any information or engaging a provider, consult your CPA, tax advisor or attorney about your specific
        situation.
      </p>
    </LegalPage>
  );
}
