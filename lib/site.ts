// Shared content for the public website: navigation, the quote entry point
// and the FAQ (used on the FAQ page and the homepage preview).

/** Every "Compare Quotes" button leads here, to the existing quote form. */
export const QUOTE_PATH = "/quote";

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/why-compare", label: "Why Compare" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export const LEGAL_NAV = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/tax-disclaimer", label: "Tax Disclaimer" },
] as const;

export type Faq = { q: string; a: string[] };
export type FaqGroup = { title: string; items: Faq[] };

export const FAQ_GROUPS: FaqGroup[] = [
  {
    title: "Cost segregation basics",
    items: [
      {
        q: "What is cost segregation?",
        a: [
          "Cost segregation is an engineering-based analysis that identifies parts of a property that may qualify for shorter depreciation lives than the building itself. Items such as certain fixtures, finishes, equipment and site improvements may be depreciated over 5, 7 or 15 years instead of 27.5 or 39 years.",
          "Accelerating depreciation can increase deductions in the earlier years of ownership. Whether and how much this helps depends on your property, your tax situation and current tax law.",
        ],
      },
      {
        q: "Who should consider a cost segregation study?",
        a: [
          "Owners of income-producing real estate often look into cost segregation, including owners of residential rentals, short-term rentals, multifamily, office, retail, industrial, self storage and hospitality properties. It may also be worth reviewing after a purchase, new construction or a significant renovation.",
          "Whether a study makes sense for you depends on factors such as the property's cost basis, when it was placed in service, how long you plan to hold it and your overall tax position. Your CPA or tax advisor is the right person to help you decide.",
        ],
      },
      {
        q: "Are tax savings guaranteed?",
        a: [
          "No. Any figures in a provider's quote or in your comparison are estimates. Actual results depend on the completed study, your individual tax situation, how the study is applied on your return and the tax law in effect. Cost Seg Trust does not guarantee any tax outcome.",
        ],
      },
    ],
  },
  {
    title: "Comparing providers",
    items: [
      {
        q: "Why should I compare multiple providers?",
        a: [
          "Cost segregation studies can differ in price, estimated benefit, turnaround time, scope of work, whether a site inspection is included, the level of audit support and the assumptions behind the numbers. Seeing several options side by side makes those differences easier to spot before you commit.",
        ],
      },
      {
        q: "How are providers compared?",
        a: [
          "Each provider's quote is organized into the same format so the options can be read side by side. Depending on what each provider supplies, the comparison may include the study fee, the estimated depreciation or tax benefit, turnaround time, scope of work, site inspection, audit support, key assumptions and any additional services.",
          "Where providers use different assumptions or leave something out, we aim to point that out rather than hide it. The comparison is there to help you ask better questions, not to make the decision for you.",
        ],
      },
      {
        q: "Does Cost Seg Trust perform the study itself?",
        a: [
          "No. Cost Seg Trust does not perform cost segregation studies. We request quotes from independent providers and help you compare them. The provider you choose performs the study and is responsible for its work.",
        ],
      },
      {
        q: "Do I have to choose a provider?",
        a: [
          "No. Requesting quotes does not obligate you to move forward with anyone. You can review your comparison, share it with your CPA and decide on your own timeline, or decide not to proceed.",
        ],
      },
      {
        q: "Will providers contact me directly?",
        a: [
          "Providers receive the property details they need to prepare a quote. Your contact information is not passed to them unless you decide to move forward with a provider.",
        ],
      },
    ],
  },
  {
    title: "Cost, timing and process",
    items: [
      {
        q: "Is the quote request free?",
        a: ["Yes. Submitting your property and receiving your comparison is free, with no obligation."],
      },
      {
        q: "How much does a study cost?",
        a: [
          "Study fees vary from provider to provider and depend on the property's type, size and complexity, whether a site inspection is required, and the scope of the deliverable. Comparing quotes is one of the simplest ways to see the range of pricing available for your specific property.",
        ],
      },
      {
        q: "How long does a study take?",
        a: [
          "Turnaround depends on the provider, the property and whether a site visit is needed. Each provider's estimated timeline is shown in your comparison so you can factor it in, for example if you are working toward a filing deadline.",
        ],
      },
      {
        q: "What information do I need to provide?",
        a: [
          "Just the basics: your name and contact details, the property address, the property type, the purchase price and the date the property was purchased or placed in service. You can also add an approximate land value, renovation spend, whether you work with a CPA and any notes. You only need to submit this once.",
        ],
      },
      {
        q: "What happens after I submit my property?",
        a: [
          "We send your property details to multiple cost segregation providers and request their quotes. As quotes come in, we organize them into a side-by-side comparison, review it, and send it to you. From there, you decide whether to move forward and with whom.",
        ],
      },
      {
        q: "Can my CPA review the comparison?",
        a: [
          "Yes, and we encourage it. Your CPA or tax advisor can help you judge whether a study makes sense and which option best fits your situation. Cost Seg Trust does not provide tax, legal or accounting advice.",
        ],
      },
    ],
  },
];

export const FAQ_PREVIEW = [
  "Does Cost Seg Trust perform the study itself?",
  "Is the quote request free?",
  "Do I have to choose a provider?",
  "Are tax savings guaranteed?",
].map(q => FAQ_GROUPS.flatMap(g => g.items).find(i => i.q === q)!);
