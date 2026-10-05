// Illustrative layout of a client comparison. The figures are hypothetical
// and labeled as such; they are not real quotes, providers or results.
const PROVIDERS = ["Provider A", "Provider B", "Provider C"];
const ROWS: [string, string[]][] = [
  ["Study fee", ["$5,200", "$3,900", "$6,400"]],
  ["Estimated first-year depreciation", ["$212,000", "$188,000", "$231,000"]],
  ["Turnaround", ["3 weeks", "2 weeks", "5 weeks"]],
  ["Site inspection", ["On-site visit", "Document review", "On-site visit"]],
  ["Audit support", ["Included", "Add-on fee", "Included"]],
  ["Key assumptions", ["Land at 20%", "Land at 25%", "Land at 18%"]],
];

export default function SampleComparison() {
  return (
    <figure className="s-sample">
      <div className="s-sample-head">
        <span>Sample comparison</span>
        <span className="s-sample-tag">Hypothetical figures</span>
      </div>
      <div className="s-sample-scroll" tabIndex={0} role="region" aria-label="Sample comparison table">
        <table>
          <thead>
            <tr><th scope="col"><span className="s-sr">Item</span></th>{PROVIDERS.map(p => <th scope="col" key={p}>{p}</th>)}</tr>
          </thead>
          <tbody>
            {ROWS.map(([label, vals]) => (
              <tr key={label}><th scope="row">{label}</th>{vals.map((v, i) => <td key={i}>{v}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption>
        Hypothetical example for illustration only. These are not actual quotes, providers or results. Real comparisons
        depend on your property and on what each provider submits, and all estimates may vary.
      </figcaption>
    </figure>
  );
}
