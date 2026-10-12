import type { Metadata } from "next";
import LegalPage from "@/components/site/LegalPage";
import { config } from "@/lib/config";

export const metadata: Metadata = { title: "Privacy Policy", description: "How Cost Seg Trust collects, uses and protects your information." };

export default function Privacy() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy Policy" intro="How Cost Seg Trust collects, uses and protects the information you share with us.">
      <h2>Information we collect</h2>
      <p>When you request quotes or contact us, we collect the information you provide, which may include:</p>
      <ul>
        <li>Your name, email address and phone number</li>
        <li>Property details such as the address, property type, purchase price, placed-in-service date, land value, renovation spend and notes</li>
        <li>Whether you work with a CPA, and the content of any message you send us</li>
      </ul>
      <p>We may also record basic technical information, such as the campaign or link that brought you to the site.</p>

      <h2>How we use your information</h2>
      <ul>
        <li>To request cost segregation quotes for your property and prepare your comparison</li>
        <li>To contact you about your request by email, phone or text message</li>
        <li>To respond to your questions and provide customer support</li>
        <li>To operate, maintain and improve our website and services</li>
      </ul>

      <h2>How we share information</h2>
      <p>
        We share the property details providers need to prepare a quote with cost segregation providers. We do not share
        your name, email address or phone number with providers unless you choose to move forward with one.
      </p>
      <p>
        We use service providers that help us operate, such as website hosting, data storage, email, text messaging,
        customer relationship management and document processing. They may process information only to provide services to us.
      </p>
      <p>We do not sell your personal information. We may disclose information if required by law.</p>

      <h2>Text messages</h2>
      <p>
        If you agree to be contacted by text message, we may send messages about your quote request. Message and data rates
        may apply. You can reply STOP at any time to opt out.
      </p>

      <h2>Cookies</h2>
      <p>The public website does not use advertising cookies. We use only the cookies needed to operate the site securely.</p>

      <h2>Data security and retention</h2>
      <p>
        We use reasonable measures to protect your information. No method of transmission or storage is completely secure.
        We keep information for as long as needed to provide our services and meet our legal obligations.
      </p>

      <h2>Your choices</h2>
      <p>
        You can ask us to access, correct or delete your information, or to stop contacting you, by emailing{" "}
        <a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a>.
      </p>

      <h2>Children</h2>
      <p>Our services are intended for adults and are not directed to children under 18.</p>

      <h2>Changes to this policy</h2>
      <p>We may update this policy from time to time. The updated version will be posted on this page.</p>

      <h2>Contact</h2>
      <p>Questions about this policy can be sent to <a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a> or {config.contactPhone}.</p>
    </LegalPage>
  );
}
