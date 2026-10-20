import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  HardHat,
  LayoutDashboard,
  ShieldCheck,
  Trees,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-2xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Trees className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              TreeLedger OS
            </h1>
            <p className="text-xs text-slate-400">
              City of Elmina • Civic dMRV & Contractor SLA Platform
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Select a role-based mobile PWA portal below to inspect pre-handover
          tree quotas, report civic hazards, or execute contractor proof-of-work
          tasks:
        </p>

        <div className="space-y-2.5">
          <Link
            href="/app/explore"
            className="flex items-center justify-between rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-emerald-500/30 p-3.5 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Trees className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-sm font-semibold text-white">
                  Resident Explore & dMRV
                </div>
                <div className="text-[11px] text-slate-400">
                  /app/explore • Precinct Switcher & Carbon Ticker
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </Link>

          <Link
            href="/app/hazards"
            className="flex items-center justify-between rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-amber-500/30 p-3.5 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-sm font-semibold text-white">
                  Public Hazard Feed & AI Triage
                </div>
                <div className="text-[11px] text-slate-400">
                  /app/hazards • 4-Stage Stepper & Photo Drawer
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </Link>

          <Link
            href="/app/maintenance"
            className="flex items-center justify-between rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-cyan-500/30 p-3.5 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="text-sm font-semibold text-white">
                  Audited Maintenance Stream
                </div>
                <div className="text-[11px] text-slate-400">
                  /app/maintenance • Before/After & Arbitrum Badges
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </Link>

          <Link
            href="/contractor/tasks"
            className="flex items-center justify-between rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-700 p-3.5 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <HardHat className="w-5 h-5 text-amber-300" />
              <div>
                <div className="text-sm font-semibold text-white">
                  Contractor Task Execution Queue
                </div>
                <div className="text-[11px] text-slate-400">
                  /contractor/tasks • Proof-of-Work Upload & Resolution
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
          </Link>

          <Link
            href="/admin"
            className="flex items-center justify-between rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-purple-500/40 p-3.5 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-sm font-semibold text-white">
                  Township Operations Command Center
                </div>
                <div className="text-[11px] text-purple-300/80">
                  /admin • Mapbox GIS, SLA Penalties & ESG Export
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
