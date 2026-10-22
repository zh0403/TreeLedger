import { Leaf } from "lucide-react";

export function BrandMark() {
  return (
    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#174b34] text-[#d7ed9f] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]">
      <span className="absolute -bottom-3 -right-2 h-7 w-7 rounded-full bg-[#6b9447]" aria-hidden="true" />
      <Leaf className="relative h-4.5 w-4.5 -rotate-12" strokeWidth={2} aria-hidden="true" />
    </span>
  );
}
