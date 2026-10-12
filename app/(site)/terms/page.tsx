import type { Metadata } from "next";
import LegalPage from "@/components/site/LegalPage";
import { config } from "@/lib/config";

export const metadata: Metadata = { title: "Terms of Use", description: "The terms that apply to your use of the Cost Seg Trust website and services." };

export default function Terms() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of Use" intro="The terms that apply when you use the Cost Seg Trust website and services.">
      <h2>About our service</h2>
      <p>
        Cost Seg Trust is a comparison service. We request quotes from independent cost segregation providers and organize
        them so you can compare your options. We do not perform cost segregation studies, and we do not provide tax, legal
        or accounting advice.
      </p>

      <h2>No advice and no guarantees</h2>
      <p>
        Information on this website and in any comparison is provided for general informational purposes. Quotes, estimated
        benefits and timelines come from providers, are estimates only and may vary. Cost Seg Trust does not guarantee any tax
        savings, study result, price or turnaround. Consult a qualified tax professional before making decisions.
      </p>

      <h2>Independent providers</h2>
      <p>
        Providers are independent businesses. If you engage a provider, your agreement is with that provider, and the provider
        is responsible for its services, its study and its conclusions. Cost Seg Trust is not a party to that agreement.
      </p>

      <h2>No obligation</h2>
      <p>Requesting quotes is free and does not obligate you to engage any provider.</p>

      <h2>Your information</h2>
      <p>
        You agree to provide accurate information. Comparisons depend on the information you provide. Our use of your
        information is described in our <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>Acceptable use</h2>
      <p>
        You agree not to misuse the website, interfere with its operation, attempt to access areas you are not authorized to
        use, or submit false or misleading requests.
      </p>

      <h2>Intellectual property</h2>
      <p>The content and design of this website belong to Cost Seg Trust and may not be copied without permission.</p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, Cost Seg Trust is not liable for any indirect, incidental or consequential
        damages, or for decisions made based on information provided through the website, a comparison or a provider.
      </p>

      <h2>Changes</h2>
      <p>We may update these terms from time to time. Continued use of the website means you accept the updated terms.</p>

      <h2>Contact</h2>
      <p>Questions about these terms can be sent to <a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a>.</p>
    </LegalPage>
  );
}
