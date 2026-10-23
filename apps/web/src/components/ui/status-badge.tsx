import type { ReactNode } from "react";

type StatusTone = "healthy" | "warning" | "critical" | "verified" | "pending";

/** Always pair color with a visible label; these styles do not imply a live status. */
export function StatusBadge({ tone = "pending", children }: { tone?: StatusTone; children: ReactNode }) {
  return <span className={`status-badge status-badge--${tone}`}><span className="status-badge-dot" aria-hidden="true" /><span className="status-badge-label">{children}</span></span>;
}
