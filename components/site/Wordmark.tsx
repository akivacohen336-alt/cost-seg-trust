import BrandMark from "@/components/BrandMark";

// The Cost Seg Trust logo: the shield mark plus the name, set like the supplied logo.
export default function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className={`s-wordmark${light ? " is-light" : ""}`}>
      <BrandMark className="s-seal" />
      <span className="s-name">CostSegTrust</span>
    </span>
  );
}
