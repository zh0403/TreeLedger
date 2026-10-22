import type { ReactNode } from "react";
import { Suspense } from "react";
import { ResidentShell } from "@/components/resident/resident-shell";

export default function ResidentLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div data-theme="light" style={{ minHeight: "100svh", padding: 32, background: "var(--background)", color: "var(--foreground)" }}>Opening Nature Explorer…</div>}><ResidentShell>{children}</ResidentShell></Suspense>;
}
