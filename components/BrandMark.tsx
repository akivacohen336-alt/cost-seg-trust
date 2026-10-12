import { BRAND_MARK, BRAND_MARK_SIZE } from "@/lib/brand-mark";

// The shield from the Cost Seg Trust logo. Height is set by the caller's CSS.
export default function BrandMark({ className = "brand-mark" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={BRAND_MARK} width={BRAND_MARK_SIZE.width} height={BRAND_MARK_SIZE.height} alt="" aria-hidden="true" />;
}
