import type { ReactNode } from "react";

export function SectionHeading({ id, label, children, description }: { id: string; label: string; children: ReactNode; description?: string }) {
  return <div className="section-heading"><p className="section-label">{label}</p><h2 id={id}>{children}</h2>{description && <p className="section-description">{description}</p>}</div>;
}
