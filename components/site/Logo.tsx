import { IMG } from "./ui";

/** The CostSegTrust shield and name. "md" on phones and the quote page, "xl" in the desktop header. */
export default function Logo({ size, className = "" }: { size: "md" | "xl"; className?: string }) {
  const img = size === "xl" ? "h-16 w-16" : "h-10 w-10";
  const text = size === "xl" ? "text-3xl" : "text-lg";
  return (
    <div className={`flex items-center ${className}`.trim()}>
      <div className="relative flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-lg" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMG.logo} alt="CostSegTrust Logo" className={`relative object-contain ${img}`} />
      </div>
      <span className={`font-bold text-foreground ml-2 ${text}`}>CostSegTrust</span>
    </div>
  );
}
