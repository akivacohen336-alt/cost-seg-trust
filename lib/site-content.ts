// Copy for the public website, taken word for word from the Lovable site
// (costsegtrust.com) so the Vercel site reads exactly the same.

export type Faq = { q: string; a: string };

export const DISCLAIMER_SHORT = "Educational only — not tax, legal, accounting, or investment advice. Your CPA decides usability.";
export const DISCLAIMER_ARTICLE =
  "Educational only — not tax, legal, accounting, or investment advice. Cost segregation reclassifies depreciable basis for MACRS depreciation; it is not a tax credit. Results vary. Illustrative figures only. Primary residences do not qualify. Your CPA decides usability (passive loss rules, REPS, bonus depreciation, Form 3115, state conformity).";

/** The 2026 FAQ: the whole /faq page, and the second half of the homepage FAQ. */
export const FAQ_2026: Faq[] = [
  {
    q: "What changed for bonus depreciation in 2026?",
    a: "Under the old TCJA phase-down, 2026 would have been about a 20% bonus year. The One Big Beautiful Bill Act permanently restored 100% bonus depreciation for qualified property acquired after January 19, 2025. IRS Notice 2026-11 is the guidance owners and CPAs are using now.",
  },
  {
    q: "What does a cost segregation study do?",
    a: "It is an engineering study that allocates building cost into MACRS classes — moving eligible components into shorter lives (often 5, 7, or 15 years) so more basis can take bonus depreciation in year one. The building shell stays on 27.5-year (residential) or 39-year (commercial) schedules. Land is never depreciable.",
  },
  {
    q: "Is cost segregation a tax credit?",
    a: "No. It accelerates depreciation timing (cash-flow timing). It is not a tax credit. Primary residences do not qualify.",
  },
  {
    q: "What typically “moves” vs what “stays”?",
    a: "Moves (often bonus-eligible): finishes, FF&E, appliances, specialty systems, parking, landscaping, site improvements. Stays long: foundation, framing, roof, general building systems. Never depreciable: land.",
  },
  {
    q: "Can you give an example?",
    a: "Illustrative only — $10M apartment (27.5-year): ~$363,636 year-one depreciation with no study vs ~$2,200,000 with cost seg + 100% bonus (~$1,836,364 additional). Actual results vary by basis, land allocation, component mix, and whether your CPA can use the deduction.",
  },
  {
    q: "What date traps should owners watch?",
    a: "1. A binding contract on or before Jan 19, 2025 may keep you on the old TCJA schedule even if you close later. 2. State conformity — federal 100% does not automatically mean your state matches. Confirm both with your CPA.",
  },
  {
    q: "What do owners usually get wrong?",
    a: "Assuming the whole building writes off in year one; skipping a study; ignoring passive loss / REPS / STR usability; not comparing providers on fee, reclass assumptions, inspection, and audit support.",
  },
  {
    q: "We bought years ago and never did a study — too late?",
    a: "Often not. Many owners use Form 3115 with a §481(a) catch-up in the current year — CPA-driven. Historic bonus rates apply for that property's timing; it is not a free upgrade to 2026's 100%.",
  },
  {
    q: "What type of assets can be cost segregated?",
    a: "Cost segregation applies to investment real estate — not primary residences. Asset classes that commonly benefit include: Short Term Rentals; Hotels & Motels; Shopping Centers; Ranch & Agricultural; Warehouse Facilities; Apartment Complexes; Nursing Homes; Office Buildings; Self Storage Facilities; Restaurants; Gas Stations; Industrial Manufacturing; Medical Offices; and Student Housing. A free estimate only needs your property price, purchase date, and address.",
  },
  {
    q: "How do I get a free estimate from CostSegTrust?",
    a: "Send three inputs: property price, purchase date, and address. CostSegTrust compares vetted providers so you can shop fee, scope, and method — then pick. Start at costsegtrust.com.",
  },
];

/** The homepage FAQ: these six, then the 2026 FAQ. */
export const HOME_FAQ: Faq[] = [
  {
    q: "What are the benefits of a cost seg study?",
    a: "A cost segregation study provides substantial financial benefits for property owners by accelerating depreciation deductions on your real estate investment. Instead of depreciating your entire property over 27.5 or 39 years, the study identifies components that can be depreciated over 5, 7, or 15 years. This acceleration results in significant tax savings in the early years of ownership, dramatically improving your cash flow. The immediate tax reduction can be reinvested into your business, used to acquire additional properties, or applied to reduce debt. Additionally, cost segregation studies can capture missed depreciation from previous years through a look-back analysis, allowing you to recover tax benefits you didn't claim initially. The study also provides detailed documentation that stands up to IRS scrutiny, giving you confidence in your tax position while maximizing your return on investment.",
  },
  {
    q: "Does cost segregation affect past tax filings?",
    a: "Yes, cost segregation can benefit past tax years through a \"look-back\" study. If you acquired or constructed a property in previous years and didn't perform a cost segregation study, you can still capture missed depreciation deductions. The IRS allows you to \"catch up\" on the additional depreciation you should have taken by filing Form 3115 (Change in Accounting Method). This means you can claim all the missed deductions in a single year without having to amend prior returns, making it a streamlined way to recover substantial tax benefits from properties you've owned for years.",
  },
  {
    q: "Can a regular CPA conduct the study?",
    a: "No, a typical CPA cannot conduct a cost segregation study on their own. The IRS requires that cost segregation studies be performed by qualified professionals with expertise in both engineering and tax law. A proper study requires detailed knowledge of construction methods, building systems, and IRS regulations. Qualified firms employ teams that include licensed engineers, construction specialists, and tax professionals who work together to identify and properly classify every component of your property. Your CPA plays an important role in implementing the study results on your tax return, but the actual analysis must be performed by specialized cost segregation experts.",
  },
  {
    q: "Can a cost seg study be done by the property owner?",
    a: "No, property owners cannot perform their own cost segregation studies. The IRS requires that cost segregation studies be conducted by independent, qualified professionals to ensure accuracy and compliance. Self-prepared studies lack the necessary credibility and would likely be rejected in an IRS audit. Professional cost segregation firms have the required engineering expertise, tax law knowledge, and documentation standards that the IRS expects. Additionally, an independent third-party study provides the objectivity and professional certification needed to defend the depreciation deductions if audited. While you know your property well, the technical requirements, construction cost analysis, and IRS compliance standards demand specialized professional expertise that goes far beyond property ownership knowledge.",
  },
  {
    q: "How long does a cost segregation study take?",
    a: "A typical cost segregation study takes 2-6 weeks from start to finish, depending on the property size and complexity. The process begins with an initial consultation and information gathering phase (1-3 days), where you provide property details, purchase documents, and construction records. Next, the engineering team conducts a detailed site visit and analysis (1-2 weeks), examining building components, systems, and improvements to properly classify assets. The team then prepares the comprehensive report with supporting documentation (1-2 weeks), which includes detailed cost allocations and IRS-compliant backup. Finally, your CPA receives the report and implements the findings on your tax return (timing varies by tax season). Some firms offer expedited services for urgent deadlines, completing studies in as little as 1-2 weeks for an additional fee.",
  },
  {
    q: "What type of assets can be cost segregated?",
    a: "Cost segregation applies to investment real estate — not primary residences. Asset classes that commonly benefit include: Short Term Rentals; Hotels & Motels; Shopping Centers; Ranch & Agricultural; Warehouse Facilities; Apartment Complexes; Nursing Homes; Office Buildings; Self Storage Facilities; Restaurants; Gas Stations; Industrial Manufacturing; Medical Offices; and Student Housing. Properties valued at $500,000 or more usually see the best return, though significant renovations or specialized systems can make smaller properties worthwhile. Want to see what your property could yield? A free estimate only needs your property price, purchase date, and address.",
  },
];

/** Property types on the quote form, in the Lovable site's order. */
export const LOVABLE_PROPERTY_TYPES = [
  "Short Term Rentals", "Hotels & Motels", "Shopping Centers", "Ranch & Agricultural", "Warehouse Facilities",
  "Apartment Complexes", "Nursing Homes", "Office Buildings", "Self Storage Facilities", "Restaurants",
  "Gas Stations", "Industrial Manufacturing", "Medical Offices", "Student Housing",
] as const;

export const US_STATES: [string, string][] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"], ["CO", "Colorado"],
  ["CT", "Connecticut"], ["DE", "Delaware"], ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"],
  ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"],
  ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"],
  ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"],
  ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"],
  ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"],
  ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"],
  ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"], ["DC", "District of Columbia"],
];

export type Article = {
  slug: string; title: string; author: string; date: string; displayDate: string; excerpt: string;
  related: { href: string; label: string }[];
  /** Trusted HTML written by us (copied from the Lovable site). */
  html: string;
};

const FAQ_LINK = { href: "/faq", label: "FAQ: Cost Segregation & 2026 Bonus Depreciation" };
const BONUS_LINK = { href: "/articles/cost-seg-2026-bonus-depreciation", label: "Cost segregation in 2026: why 100% bonus changes the math" };
const WAREHOUSE_LINK = { href: "/articles/warehouse-self-storage-cost-seg", label: "Cost segregation for warehouses, logistics & self-storage" };
const CPA_LINK = { href: "/articles/cpa-compare-three-providers", label: "Why CPAs should compare three cost segregation providers" };

const td = (s: string) => `<td class="border border-border px-3 py-2 text-muted-foreground">${s}</td>`;
const th = (s: string) => `<th class="border border-border px-3 py-2 text-left font-semibold text-foreground">${s}</th>`;
const link = (href: string, s: string) => `<a class="underline hover:text-foreground" href="${href}">${s}</a>`;

export const ARTICLES: Article[] = [
  {
    slug: "cost-segregation-study-cost",
    title: "How much does a cost segregation study cost? 2026 price guide by property type and size",
    author: "Staff writer", date: "2026-10-28", displayDate: "October 28, 2026",
    excerpt: "Published cost segregation study fees in 2026 run from about $495 for software-generated residential reports to $15,000 or more for traditional engineering firms. Here is what providers publish by property type and size, what the fee usually leaves out, and why three quotes for the same building can look so different.",
    related: [CPA_LINK, BONUS_LINK, FAQ_LINK],
    html: [
      `<p class="text-sm">Prices as of October 28, 2026 · Last updated October 28, 2026</p>`,
      "<p>This page is for general educational purposes and is not tax, legal or accounting advice. Fees shown are published by providers or market sources on the dates shown. They are not quotes or guarantees, and your fee may differ. Whether a study benefits you depends on your property, your tax situation, passive activity and other limits, how long you hold the property and the tax law in effect. CostSegTrust does not perform cost segregation studies. Consult your CPA, tax advisor or attorney before acting.</p>",
      "<h2>The short answer</h2>",
      "<p>Prices as of 2026-10-28: Published cost segregation study fees in 2026 run from about $495 for software-generated residential reports to $15,000 or more for traditional engineering firms. Engineer-reviewed residential studies commonly list at $2,000 to $4,500, and commercial studies at about $5,000 and up. Property type, size, inspection method and scope explain most of the gap.</p>",
      "<ul><li>A cheaper study is not automatically worse, and a costlier one is not automatically better. Compare what each fee includes.</li><li>Fees often leave out Form 3115 work, return implementation and audit representation. Ask for an itemized written scope.</li><li>Whether a fee pays off depends on whether you can use the deduction, how long you hold the property and what happens at sale. Ask your CPA.</li></ul>",
      "<p>A cost segregation study is a report that sorts a building's parts into depreciation categories. That is all it does. This guide covers what providers say they charge, and why two quotes for the same building can look so different.</p>",
      "<h2>One property, three quotes: what the spread looks like</h2>",
      "<p>Published price lists show what providers advertise. They do not show what happens when several providers price the same building.</p>",
      `<p>Here is one example from CostSegTrust's own published article, ${link("/articles/cpa-compare-three-providers", "how three providers quoted the same property")}. It is one anonymized engagement, three quotes. It shows the spread in that one case only.</p>`,
      `<table class="w-full border-collapse text-sm my-4"><thead><tr>${th("Property")}${th("Quote A")}${th("Quote B")}${th("Quote C")}</tr></thead><tbody>`,
      `<tr>${td("About $10M industrial property")}${td("$3,950")}${td("$7,470")}${td("$9,500")}</tr></tbody></table>`,
      `<p class="text-sm">In the published example, the $9,500 quote also lists a site fee. n = 3, one engagement. It illustrates a spread. It is not an average or a typical price.</p>`,
      "<p>The highest quote was more than double the lowest. The property was the same. What differed was the scope, the method and the extras in each proposal. That is why the first step in comparing quotes is to line up what each one covers. We make no claim that any one of these quotes was better or worse than the others.</p>",
      `<p>Want fees for your own property? ${link("/start", "Get side-by-side quotes.")}</p>`,
      "<h2>Cost by property type and size</h2>",
      "<p>The right number for you depends on what you own and how big it is. Below, the table shows one provider's published ranges by property type next to a second market source.</p>",
      "<h3>Cost by property type</h3>",
      "<p><strong>Single-family, condo and short-term rental (1 unit).</strong> Entry prices are the lowest here. One provider publishes $495 to $7,995, depending on purchase price. Another source puts these at “a few hundred dollars to about $3,500.”</p>",
      "<p><strong>Duplex to fourplex and small multifamily.</strong> One provider publishes $995 to $8,495 depending on purchase price. We found no second published range.</p>",
      "<p><strong>Apartment buildings (5+ units).</strong> One provider publishes $1,995 to $10,495. Another source puts multifamily at “$5,000 to $10,000 or more.”</p>",
      "<p><strong>Office, retail, industrial and specialty commercial.</strong> Published ranges are wider and start higher, and they run higher still for hotels and medical or restaurant space. See the table.</p>",
      `<div class="overflow-x-auto"><table class="w-full border-collapse text-sm my-4"><thead><tr>${th("Property type")}${th("One provider's published range (Cost Seg Smart, up to a $10M purchase price; read 2026-10-28)")}${th("Market reference (source and date)")}</tr></thead><tbody>`,
      `<tr>${td("Single-family, condo, short-term rental")}${td("$495 to $7,995")}${td("“a few hundred dollars to about $3,500” (Whetzel &amp; Co., Oct 26, 2026)")}</tr>`,
      `<tr>${td("Duplex to fourplex")}${td("$995 to $8,495")}${td("not published")}</tr>`,
      `<tr>${td("5+ unit apartment")}${td("$1,995 to $10,495")}${td("“$5,000 to $10,000 or more” for multifamily and commercial (Whetzel &amp; Co., Oct 26, 2026)")}</tr>`,
      `<tr>${td("Office, retail, mixed-use")}${td("$995 to $8,495")}${td("“$5,000 to $10,000 or more” for multifamily and commercial (Whetzel &amp; Co., Oct 26, 2026)")}</tr>`,
      `<tr>${td("Industrial, warehouse")}${td("$2,495 to $9,795")}${td("not published")}</tr>`,
      `<tr>${td("Self-storage")}${td("$2,495 to $10,995")}${td("not published")}</tr>`,
      `<tr>${td("Medical, restaurant, specialty")}${td("$2,995 to $10,995")}${td("not published")}</tr>`,
      `<tr>${td("Hotel, motel")}${td("$3,495 to $13,995")}${td("not published")}</tr></tbody></table></div>`,
      `<p class="text-sm">Table 1. Fee by property type, all as of 2026-10-28. Column 2 comes from a single provider's published price list. Column 3 is the other source we could find, and “not published” means we found no published range. Ranges depend on each provider's scope and are not comparable line by line.</p>`,
      "<h3>Does the fee follow square footage or purchase price?</h3>",
      "<p>Both models exist. AE Tax Advisors publishes a per-square-foot rate of $1 per sq ft with a $2,000 minimum (Oct 6, 2026), and states this is not an industry average. Cost Seg Smart publishes price bands based on purchase price; for a single-family home, short-term rental or condo they run from $495 under $300K to $3,995 for $4M to $6M (read 2026-10-28). These are two examples of how providers set fees. They are not averages, and neither is a “typical” price.</p>",
      "<h2>What drives the fee</h2>",
      "<p>Providers describe the same handful of factors.</p>",
      "<ul><li><strong>Property type and complexity.</strong> A simple rental house is less work than a hotel or a medical building, and published fees reflect that.</li><li><strong>Size and basis.</strong> Larger or costlier buildings generally list at higher fees, either by square foot or by price band (see above).</li><li><strong>Inspection method.</strong> A study can be software-based, done virtually, or include an on-site visit. The IRS audit guide, Pub 5653, says “a quality study includes a site visit.” The same guide also says the IRS “has not established any requirements or standards for the preparation of cost segregation studies.” Both statements are in the guide, so read them together.</li><li><strong>Records and renovations.</strong> Clean construction records and a clear list of improvements can reduce work. Missing records can add to it.</li><li><strong>Look-back work.</strong> For a property placed in service in earlier years, a provider may quote Form 3115 and a Section 481(a) computation. Ask who prepares them and whether they are in the fee.</li><li><strong>Audit support.</strong> Some fees cover a written response to IRS questions. Others cover representation. The scopes differ, so ask.</li></ul>",
      "<h2>What is and is not included in the fee</h2>",
      "<p>Two quotes with the same headline number can cover different work. Ask each provider to mark these items as included, extra, or not offered.</p>",
      `<div class="overflow-x-auto"><table class="w-full border-collapse text-sm my-4"><thead><tr>${th("Item")}${th("Often included")}${th("Often extra")}${th("Ask your provider")}</tr></thead><tbody>`,
      `<tr>${td("Report and depreciation schedules")}${td("Yes")}${td("")}${td("Confirm format")}</tr>`,
      `<tr>${td("Form 3115 package")}${td("")}${td("Often")}${td("Who prepares it and who files it")}</tr>`,
      `<tr>${td("Section 481(a) computation")}${td("")}${td("Often")}${td("Is it in the fee?")}</tr>`,
      `<tr>${td("Return implementation")}${td("")}${td("Often")}${td("Does it work with your CPA?")}</tr>`,
      `<tr>${td("In-person inspection and travel")}${td("")}${td("Often")}${td("Required for this property?")}</tr>`,
      `<tr>${td("Revisions to the report")}${td("Varies")}${td("Varies")}${td("How many rounds?")}</tr>`,
      `<tr>${td("Audit support (response or representation)")}${td("Varies")}${td("Varies")}${td("Which one, and for how long?")}</tr>`,
      `<tr>${td("Rush fee")}${td("")}${td("Often")}${td("What counts as “rush”?")}</tr></tbody></table></div>`,
      `<p class="text-sm">Table 2. A checklist, not a price list. “Often” describes common practice and varies by provider. No provider is singled out.</p>`,
      "<h2>Does a higher fee mean a better study?</h2>",
      "<p>Not by itself. The IRS audit guide lists 13 principal elements of a quality study, and a fee level is not one of them. It says there are no prescribed qualifications for preparers, and that a study by a construction engineer is generally more reliable than one by someone with no engineering or construction background.</p>",
      "<p>The same guide tells examiners to determine how a provider's fee is set, whether by size or as a contingency, and to look closely at contingency-fee arrangements. It refers readers to Circular 230. We describe this here without drawing a conclusion about any provider.</p>",
      "<p><strong>A word on very low-priced and do-it-yourself studies.</strong> A software-generated report, including the $495 kind, can be a reasonable starting point, but it leaves more room for costly mistakes. The IRS audit guide says a quality study includes a site visit and that a study by a construction engineer is generally more reliable, so a report prepared without those may be harder to defend if the IRS asks questions. Errors in the asset breakdown, the land allocation or the property type can lead to deductions that are reduced or disallowed, plus possible interest and penalties. Before you rely on a low-priced study, ask whether anyone visited the property, who reviewed the report, and whether the provider will support it in an audit.</p>",
      "<p>So a low quote and a high quote both need a reason. Ask each provider what the fee includes, who prepares and reviews the report, and how the property will be inspected.</p>",
      "<h2>Is it worth it? Questions to ask first</h2>",
      "<p>A fee is only half of the picture. A deduction is not cash. Ask these questions before you pay:</p>",
      "<ul><li>What is the depreciable basis of the property?</li><li>Can you actually use the loss, given passive activity rules, short-term rental rules or real estate professional status?</li><li>How long will you hold the property, and what happens when you sell?</li><li>Does your state follow the federal treatment?</li><li>What is the all-in cost, including Form 3115 and implementation?</li></ul>",
      "<p>It may not be worth it when the loss cannot be used, the hold period is short, or the all-in cost is large compared with the benefit. Your CPA can tell you which of these applies.</p>",
      `<p>To see how the numbers could look for your property, run your own estimate in the ${link("/#estimate", "calculator")}.</p>`,
      "<h2>How to compare cost segregation quotes</h2>",
      `<ol><li><strong>Give every provider the same property data.</strong> Same price, purchase date, address and improvements.</li><li><strong>Compare the same scope.</strong> Use Table 2 as your checklist.</li><li><strong>Ask who prepares and who reviews.</strong> Get names and credentials in writing.</li><li><strong>Ask how the property will be inspected.</strong> Software, virtual or on-site.</li><li><strong>Ask what audit support covers.</strong> A written response and representation are different.</li><li><strong>Add up the total cost.</strong> Include Form 3115, Section 481(a) work and implementation.</li></ol>`,
      `<p>For a real example, see ${link("/articles/cpa-compare-three-providers", "how three providers quoted the same property")}.</p>`,
      "<h2>Cost segregation cost FAQ</h2>",
      "<h3>How much does a cost segregation study cost?</h3><p>Published 2026 fees run from about $495 for software-generated residential reports to $15,000 or more for traditional engineering firms. Engineer-reviewed residential studies commonly list at $2,000 to $4,500, and commercial studies at about $5,000 and up (as of 2026-10-28).</p>",
      "<h3>Is a $495 cost segregation study legitimate?</h3><p>Price alone does not tell you. The IRS audit guide says it has set no standards for preparing studies, and it lists elements of a quality study, such as documented methodology and an expert preparer. Ask who prepares and reviews the report, how the property is inspected, and what audit support covers.</p>",
      "<h3>Does a more expensive study mean a better one?</h3><p>Not by itself. The IRS audit guide lists 13 elements of a quality study, and none is a fee level. A higher fee can reflect an on-site inspection, a complex building or extra services. A quote well above others should come with a reason specific to your property.</p>",
      "<h3>What is included in a cost segregation study fee?</h3><p>Usually a report that classifies building components into recovery periods and depreciation schedules. Many quotes leave out extras such as Form 3115 and Section 481(a) work, return implementation, in-person inspection and audit representation. Ask for an itemized written scope.</p>",
      "<h3>Who pays, and how is the fee treated for tax?</h3><p>The property owner pays the provider. How the fee is treated for tax depends on your facts, so this page does not say. Ask your CPA how it applies to your property.</p>",
      "<h2>Get side-by-side quotes for your property</h2>",
      "<p>Compare quotes for your property. Send your property price, purchase date and address and we'll show you proposals from providers side by side, so you can compare fee, scope and method before you choose. Free.</p>",
      `<p>${link("/start", "Get free quotes")}</p>`,
      `<p>You can also run an estimate in the ${link("/#estimate", "calculator")}.</p>`,
      "<h2>Sources, method and last updated</h2>",
      "<p>How we collected these figures: we read each provider or market page listed below and copied the range it published, with the date shown on that page. We did not calculate averages or fill gaps. Where we found no published range, the table says “not published.” Prices change, so re-check before you rely on any figure.</p>",
      `<ul><li>${link("https://taxstra.com/resources/best-cost-segregation-companies/", "Taxstra, residential and commercial fee ranges")} (updated August 28, 2026; price tiers checked August 2026)</li><li>${link("https://costsegsmart.com/blog/how-much-does-cost-segregation-study-cost/", "Cost Seg Smart, price list and blog")} (updated October 17, 2026)</li><li>${link("https://www.recostseg.com/post/cost-seg-pricing-5k-vs-15k", "R.E. Cost Seg, pricing tiers")} (page dated October 20, 2025)</li><li>${link("https://www.aetaxadvisors.com/blog/how-much-does-a-cost-segregation-study-cost/", "AE Tax Advisors, per-square-foot pricing")} (updated October 6, 2026)</li><li>${link("https://whetzelco.com/cost-segregation-study-cost/", "Whetzel &amp; Co., fee ranges")} (October 26, 2026)</li><li>${link("https://www.irs.gov/pub/irs-pdf/p5653.pdf", "IRS Pub 5653, Cost Segregation Audit Technique Guide")}. The guide states it “is not an official pronouncement of the law or the position of the Service.” We describe what it says, and nothing here means the IRS has approved a provider or method.</li><li>${link("/articles/cpa-compare-three-providers", "CostSegTrust, how three providers quoted the same property")}</li></ul>`,
      "<p>Change log: 2026-10-28, first published.</p>",
    ].join(""),
  },
  {
    slug: "warehouse-self-storage-cost-seg",
    title: "Cost segregation for warehouses, logistics & self-storage",
    author: "Arthur", date: "2026-09-22", displayDate: "September 22, 2026",
    excerpt: "A warehouse or self-storage facility looks simple from the curb — but racking, units, specialty lighting, climate or process HVAC, docks, security, and site work are often shorter-lived than the 39-year shell. Cost segregation separates those pieces so qualified short-life property can take accelerated depreciation.",
    related: [BONUS_LINK, CPA_LINK, FAQ_LINK],
    html: [
      "<p>A warehouse or self-storage facility looks simple from the curb: shell, slab, docks or roll-up doors.</p>",
      "<p>For depreciation, that simplicity is misleading. Much of what makes these properties work — racking, unit systems, specialty lighting, climate or process HVAC, dock equipment, security, paving, fencing — is often shorter-lived than the 39-year commercial shell. Cost segregation is the engineering study that separates those pieces so qualified short-life property can take accelerated depreciation (and, when rules are met, 100% bonus).</p>",
      "<p>Educational only — not tax advice. Your CPA confirms usability.</p>",
      "<h2>Why warehouses and self-storage are a strong fit</h2>",
      "<p>Investment warehouses, distribution centers, cold storage, and self-storage facilities are commercial property. Without a study, most of the building basis rides the long 39-year schedule.</p>",
      "<p>A study looks for components that belong in shorter MACRS classes — often 5-, 7-, or 15-year — so year-one deductions can rise when bonus applies.</p>",
      `<p>That matters more in 2026: 100% bonus is permanently restored for qualified property acquired after January 19, 2025 (${link("/articles/cost-seg-2026-bonus-depreciation", "cost segregation in 2026")}). Cost seg is how you identify the basis that can take that write-off.</p>`,
      "<h2>What often moves vs what stays</h2>",
      "<p>Every facility is different. Typical patterns:</p>",
      "<h3>Warehouse / logistics — often accelerates (when facts support it)</h3>",
      "<ul><li>Racking &amp; storage systems — freestanding or bolted systems frequently treated as personal property</li><li>Specialty / high-bay lighting — process or specialty fixtures vs general building lighting</li><li>Process HVAC &amp; refrigeration — cold rooms, freezers, process cooling (not always the same as comfort HVAC)</li><li>Dock equipment — levelers, seals, restraints, related specialty gear</li><li>Conveyors, security, specialty electrical — when tied to operations rather than the building shell</li><li>Site / land improvements — truck-court paving, fencing, landscaping, sidewalks, yard lighting (often 15-year)</li></ul>",
      "<h3>Self-storage — often accelerates (when facts support it)</h3>",
      "<ul><li>Unit partitions / demising systems that are not the structural shell</li><li>Unit doors — roll-up and overhead doors and related hardware</li><li>Climate-control HVAC for climate units (specialty vs whole-building comfort)</li><li>Security &amp; access control — cameras, keypads, gates, alarms</li><li>Office / retail-front finishes and specialty electrical</li><li>Site work — drives, parking, fencing, exterior lighting, landscaping (often 15-year)</li><li>Signage (facts-dependent)</li></ul>",
      "<h3>Usually stays longer (both asset types)</h3>",
      "<ul><li>Foundation, structural framing, roof / clear-span shell</li><li>General building systems (baseline electrical, plumbing, comfort HVAC)</li><li>Land (never depreciable)</li></ul>",
      "<p>Accelerated depreciation timing — not a tax credit. Primary residences do not qualify.</p>",
      "<h2>Owners and operators usually get wrong</h2>",
      `<ul><li>Treating the whole warehouse or self-storage facility as one 39-year bucket</li><li>Assuming racking, docks, units, or doors are “just part of the building”</li><li>Skipping a study on a new acquisition when 100% bonus is available on short-life classes</li><li>Not comparing providers (fees, reclass assumptions, inspection method, and audit support differ — see ${link("/articles/cpa-compare-three-providers", "Why CPAs should compare three providers")})</li></ul>`,
      "<h2>Free estimate</h2>",
      "<p>Send three inputs: property price · purchase date · address.</p>",
      "<p>CostSegTrust compares vetted providers on the same file so you can shop fee, scope, and method — then pick.</p>",
    ].join(""),
  },
  {
    slug: "cpa-compare-three-providers",
    title: "Why CPAs should compare three cost segregation providers",
    author: "Arthur", date: "2026-09-18", displayDate: "September 18, 2026",
    excerpt: "Your client asks whether to do a cost segregation study. Comparing three qualified providers on the same file is how price discovery and aggressiveness become visible before anyone signs.",
    related: [BONUS_LINK, FAQ_LINK, WAREHOUSE_LINK],
    html: [
      "<p>Your client asks whether to do a cost segregation study.</p>",
      "<p>Right now, many firms have no clean way to compare the answers — one favorite vendor, one proposal, one set of assumptions. Your name still goes on the return.</p>",
      "<p>Comparing three qualified providers on the same file is how price discovery and aggressiveness become visible before anyone signs.</p>",
      "<h2>What the quote spread looks like</h2>",
      "<p>Three providers quoted the same ~$10M industrial property. Same building. Same 37% rate. Same depreciable basis after normalization.</p>",
      `<table class="w-full border-collapse text-sm my-4"><thead><tr>${th("Provider")}${th("First-year net benefit")}${th("Fee quoted")}</tr></thead><tbody>`,
      `<tr>${td("A")}${td("$506,603")}${td("$9,500 + site fee")}</tr><tr>${td("B")}${td("$626,336")}${td("$7,470")}</tr><tr>${td("C")}${td("$973,268")}${td("$3,950")}</tr></tbody></table>`,
      `<p class="text-sm">Actual quotes on a real engagement (anonymized; illustrative of spread).</p>`,
      "<ul><li>Fee spread: ~2.4×</li><li>Claimed benefit spread: ~1.9×</li></ul>",
      "<p>Driven by how much basis each provider was willing to reclassify — which none disclosed until asked. The cheapest quote claimed the most aggressive result.</p>",
      "<h2>What to compare (not just fee)</h2>",
      "<ul><li>Reclassification % / assumed benefit (audit exposure lives here)</li><li>Inspection method (on-site vs virtual / hybrid)</li><li>Audit support terms</li><li>Form 3115 / lookback handling</li><li>Revision policy and what’s in vs out of the fee</li></ul>",
      "<p>Comparable proposals beat sales decks. Same basis, same rate, same units — so the differences you see are real.</p>",
      "<h2>What your firm gets</h2>",
      "<ul><li>Aggressiveness visible before the study is commissioned</li><li>A documented selection process if a study is ever examined</li><li>One intake instead of three phone calls during filing season</li><li>Client relationship and professional judgment stay with you</li></ul>",
      "<p>Keep one senior reviewer in-house. Shop the engineering.</p>",
      "<h2>Free estimate (for a sample file)</h2>",
      "<p>Send three inputs for a sample property: property price · purchase date · address (property type helps).</p>",
      "<p>CostSegTrust returns competing quotes for your review — no client meeting required to start.</p>",
    ].join(""),
  },
  {
    slug: "cost-seg-2026-bonus-depreciation",
    title: "Cost segregation in 2026: why 100% bonus changes the math",
    author: "Arthur", date: "2026-09-15", displayDate: "September 15, 2026",
    excerpt: "Under the old TCJA phase-down, 2026 would have been a ~20% bonus year. That path is gone for new acquisitions — and cost segregation is how you unlock year-one write-offs under permanently restored 100% bonus.",
    related: [FAQ_LINK, WAREHOUSE_LINK],
    html: [
      "<p>Under the old TCJA phase-down, 2026 would have been a ~20% bonus year.</p>",
      "<p>That path is gone for new acquisitions.</p>",
      "<p>The One Big Beautiful Bill Act permanently restored 100% bonus depreciation for qualified property acquired after January 19, 2025. IRS Notice 2026-11 is the guidance owners and CPAs are using now.</p>",
      "<p>Cost segregation is how you identify the short-life basis that can take that year-one write-off.</p>",
      "<h2>What moves vs what stays</h2>",
      "<p>Cost segregation is an engineering study. It allocates building cost into MACRS classes:</p>",
      "<h3>Moves fast (often 5 / 7 / 15-year — bonus-eligible when rules are met)</h3>",
      "<ul><li>Finishes, FF&amp;E, appliances, specialty systems</li><li>Parking, landscaping, site improvements</li></ul>",
      "<h3>Stays long (27.5 residential / 39 commercial — no bonus on the shell)</h3>",
      "<ul><li>Foundation, framing, roof, general building systems</li></ul>",
      "<h3>Never depreciable</h3>",
      "<ul><li>Land</li></ul>",
      "<p>Accelerated depreciation timing — not a tax credit. Primary residences do not qualify.</p>",
      "<h2>Illustrative multifamily example</h2>",
      "<p>$10,000,000 apartment building (27.5-year property) — simplified, from CostSegTrust collateral:</p>",
      "<ul><li>Standard depreciation (no study): ~$363,636 year one</li><li>With cost segregation + 100% bonus: ~$2,200,000 year one</li><li>Additional first-year deduction: ~$1,836,364</li></ul>",
      "<p>Illustrative only. Actual results vary by basis, land allocation, component mix, and whether your CPA can use the deduction.</p>",
      "<h2>Two date traps</h2>",
      "<ol><li>Binding contract on or before Jan 19, 2025 → may stay on the old TCJA schedule even if you close later.</li><li>State conformity → federal 100% ≠ automatic state match.</li></ol>",
      "<p>Confirm both with your CPA before modeling cash savings.</p>",
      "<h2>Owners usually get wrong</h2>",
      "<ul><li>Thinking the whole building writes off in year one (only reclassified short-life basis can)</li><li>Skipping a study (building-only 27.5/39 does not unlock bonus on components)</li><li>Ignoring usability (passive loss / REPS / STR facts decide if it helps this year’s return)</li><li>Not shopping providers (fees, reclass assumptions, inspection, audit support differ)</li></ul>",
      "<p>Missed a prior-year study? Often Form 3115 + §481(a) catch-up — CPA-driven; historic bonus rates apply, not a free upgrade to 2026’s 100%.</p>",
      "<h2>Free estimate</h2>",
      "<p>Send three inputs: property price, purchase date, and address.</p>",
      "<p>CostSegTrust compares vetted providers so you can shop fee, scope, and method — then pick.</p>",
    ].join(""),
  },
];

export const findArticle = (slug: string) => ARTICLES.find(a => a.slug === slug);
