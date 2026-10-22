import Link from "next/link";
import { BrandLogo } from "./brand-logo";

export function Brand({ href = "/", subtitle, className = "" }: { href?: string; subtitle?: string; className?: string }) {
  return <Link href={href} className={`tl-brand ${className}`} aria-label={subtitle ? `TreeLedger — ${subtitle}` : "TreeLedger home"}>
    <BrandLogo />
    <span>TreeLedger{subtitle && <small>{subtitle}</small>}</span>
  </Link>;
}
