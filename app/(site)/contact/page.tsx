import type { Metadata } from "next";
import ContactForm from "@/components/site/ContactForm";
import PageHero from "@/components/site/PageHero";
import { config } from "@/lib/config";
import { QUOTE_PATH } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Cost Seg Trust by email, phone or message.",
};

export default function Contact() {
  const tel = config.contactPhone.replace(/\D/g, "").slice(-10);
  return (
    <>
      <PageHero eyebrow="Contact" title="We're here to help.">
        <p>Questions about cost segregation, a quote request or how Cost Seg Trust works? Reach out by email, phone or the form below.</p>
      </PageHero>
      <section className="s-sec">
        <div className="s-wrap s-contact">
          <div className="s-contact-info">
            <div className="s-info-card">
              <h2>Cost Seg Trust</h2>
              <dl>
                <div><dt>Email</dt><dd><a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a></dd></div>
                <div><dt>Phone</dt><dd><a href={`tel:+1${tel}`}>{config.contactPhone}</a></dd></div>
              </dl>
            </div>
            <div className="s-info-card s-info-quiet">
              <h3>Ready for quotes?</h3>
              <p>You don't need to contact us first. Submit your property and we'll start requesting quotes.</p>
              <a className="s-arrow" href={QUOTE_PATH}>Compare Quotes</a>
            </div>
            <p className="s-muted s-small">
              Please don't send tax documents or sensitive financial information through this form. We don't provide tax,
              legal or accounting advice.
            </p>
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
