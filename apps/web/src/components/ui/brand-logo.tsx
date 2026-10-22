import Image from "next/image";
import "./brand-logo.css";

/** The user's original mark; its accessible name belongs to the parent link. */
export function BrandLogo() {
  return <Image src="/treeledger-mark.png" width={40} height={40} alt="" aria-hidden="true" className="tl-brand-logo" unoptimized />;
}
