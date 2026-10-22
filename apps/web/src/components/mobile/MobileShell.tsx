'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MainPrototypeNotice } from '@/components/main-services';
import {
  Trees,
  AlertTriangle,
  ShieldCheck,
  HardHat,
  Sparkles,
  Radio,
} from 'lucide-react';

interface MobileShellProps {
  children: React.ReactNode;
  role?: 'resident' | 'contractor';
}

const RESIDENT_TABS = [
  {
    href: '/app/explore',
    label: 'Explore',
    sublabel: 'Asset & Carbon',
    icon: Trees,
  },
  {
    href: '/app/hazards',
    label: 'Hazards',
    sublabel: 'AI Triage Feed',
    icon: AlertTriangle,
  },
  {
    href: '/app/maintenance',
    label: 'Audited PoW',
    sublabel: 'Arbitrum Ledger',
    icon: ShieldCheck,
  },
];

export function MobileShell({
  children,
  role = 'resident',
}: MobileShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-900/95">
      <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-slate-100 shadow-2xl relative pb-20 border-x border-slate-800/80 flex flex-col">
        {/* Top Township Status Header */}
        <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <Trees className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold tracking-tight text-sm text-white">
                    TreeLedger
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                    <Radio className="w-2.5 h-2.5 animate-pulse" />
                    Prototype
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  City of Elmina · Service preview
                </p>
              </div>
            </div>

            {role === 'resident' ? (
              <Link
                href="/contractor/tasks"
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-2.5 py-1.5 text-xs font-medium text-amber-300 transition-colors"
                title="Switch to Contractor Work Order Queue"
              >
                <HardHat className="w-3.5 h-3.5" />
                <span>Contractor</span>
              </Link>
            ) : (
              <Link
                href="/app/explore"
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-2.5 py-1.5 text-xs font-medium text-emerald-300 transition-colors"
                title="Switch to Resident Stewardship App"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Resident PWA</span>
              </Link>
            )}
          </div>
        </header>

        {/* Main Content Slot */}
        <MainPrototypeNotice home={role === 'resident' ? '/app' : '/contractor'} />
        <main className="flex-1">{children}</main>

        {/* Bottom Navigation Bar */}
        <nav
          aria-label="Mobile Bottom Navigation"
          className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/90 px-2 py-1.5"
        >
          <div className="grid grid-cols-4 gap-1">
            {RESIDENT_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive =
                pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex flex-col items-center justify-center rounded-xl py-1.5 px-1 transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-0.5" />
                  <span className="text-[11px] font-semibold leading-tight">
                    {tab.label}
                  </span>
                  <span className="text-[9px] text-slate-500 leading-tight truncate max-w-full">
                    {tab.sublabel}
                  </span>
                </Link>
              );
            })}

            <Link
              href="/contractor/tasks"
              className={`flex flex-col items-center justify-center rounded-xl py-1.5 px-1 transition-all ${
                pathname?.startsWith('/contractor')
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <HardHat className="w-4 h-4 mb-0.5" />
              <span className="text-[11px] font-semibold leading-tight">
                Tasks
              </span>
              <span className="text-[9px] text-slate-500 leading-tight truncate max-w-full">
                Contractor
              </span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
