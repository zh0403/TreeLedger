import type { ReactNode } from "react";
import { Leaf } from "lucide-react";

export function EmptyState({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="workspace-empty"><span className="empty-symbol"><Leaf size={26} strokeWidth={1.3} aria-hidden="true" /></span><h3>{title}</h3><p>{description}</p>{children}</div>;
}

export function LoadingSkeleton({ label = "Loading workspace" }: { label?: string }) {
  return <div className="workspace-skeleton" role="status" aria-label={label}><span /><span /><span /><p>{label}…</p></div>;
}
