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
