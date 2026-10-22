import Link from "next/link";

export function MainServicesLinks() {
  return <nav aria-label="Integrated application services" className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4 text-sm">
    <Link className="inline-flex min-h-11 items-center underline underline-offset-4" href="/app/explore">Tree registry</Link>
    <Link className="inline-flex min-h-11 items-center underline underline-offset-4" href="/app/hazards">Hazard reporting</Link>
    <Link className="inline-flex min-h-11 items-center underline underline-offset-4" href="/app/maintenance">Maintenance records</Link>
    <Link className="inline-flex min-h-11 items-center underline underline-offset-4" href="/contractor/tasks">Contractor tasks</Link>
    <Link className="inline-flex min-h-11 items-center underline underline-offset-4" href="/admin/operations">Operations prototype</Link>
  </nav>;
}

export function MainPrototypeNotice({ home }: { home: string }) {
  return <aside aria-label="Prototype data disclosure" className="border-b border-emerald-800 bg-slate-950 px-4 py-3 text-sm leading-relaxed text-slate-200">
    <Link href={home} className="inline-flex min-h-11 items-center text-emerald-300 underline underline-offset-4">Back to workspace</Link>
    <p><strong>Prototype services from main.</strong> These views may use sample data, local-only updates, simulated AI results, and illustrative transaction hashes when services are unavailable. Displayed badges are not independent proof of blockchain verification.</p>
  </aside>;
}
