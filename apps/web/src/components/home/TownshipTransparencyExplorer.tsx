'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Trees,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MapPin,
  Sparkles,
  FileText,
  Clock,
  Layers,
  Info,
} from 'lucide-react';
import { Tree } from '@/lib/types';
import { fetchTrees, INITIAL_TREES } from '@/lib/api';

const PRECINCTS = [
  'All Projects',
  'Sector 4A - Ilham Residence',
  'Elmina Central Park - Lakeshore',
  'Elmina Green - Phase 3 Boulevard',
  'Elmina Valley - Riparian Corridor',
];

// Masterplan target quotas committed by developer
const PRECINCT_QUOTAS: Record<string, { target: number; phase: string; contractor: string }> = {
  'Sector 4A - Ilham Residence': {
    target: 10,
    phase: 'Phase 4A (DLP Active)',
    contractor: 'Elmina GreenWorks Sdn Bhd',
  },
  'Elmina Central Park - Lakeshore': {
    target: 10,
    phase: 'Central Park North',
    contractor: 'Tropika ArborCare Enterprise',
  },
  'Elmina Green - Phase 3 Boulevard': {
    target: 10,
    phase: 'Phase 3 (Pre-Handover)',
    contractor: 'Nusantara AgroTech Services',
  },
  'Elmina Valley - Riparian Corridor': {
    target: 10,
    phase: 'Riparian Greenway',
    contractor: 'Elmina GreenWorks Sdn Bhd',
  },
};

// Recent living planting and maintenance milestones
const RECENT_MILESTONES = [
  {
    id: 1,
    date: 'Oct 19, 2026',
    treeId: 'ELM-042',
    precinct: 'Sector 4A - Ilham Residence',
    action: 'Deep-Root Mycorrhizal Aeration',
    species: 'Hopea odorata (Merawan Siput Jantan)',
    contractor: 'Elmina GreenWorks',
    status: 'Verified on Arbitrum',
    txHash: '0x3f7b1d9e4a2c8f6b0e5d9a3c7f1b4e8d2a6c0f9e3b7d1a5c8e4f2b6d0a9c3e7f',
    note: 'Pre-handover root biochar conditioning & slow-release hydration ring installed.',
  },
  {
    id: 2,
    date: 'Oct 18, 2026',
    treeId: 'ELM-104',
    precinct: 'Elmina Central Park - Lakeshore',
    action: 'Canopy Crown Lifting & Storm Clearance',
    species: 'Samanea saman (Rain Tree)',
    contractor: 'Tropika ArborCare',
    status: 'Verified on Arbitrum',
    txHash: '0x94c8e2a17f5d3b09c6e1a8f4d2b7c3e9f0a5d8b2c4e7f1a3d6b9c0e2f5a8d1b4',
    note: 'Cleared 2 storm-weakened lateral branches for 2.8m pedestrian walkway clearance.',
  },
  {
    id: 3,
    date: 'Oct 05, 2026',
    treeId: 'PRECINCT-AUDIT',
    precinct: 'Sector 4A - Ilham Residence',
    action: 'DLP Green Quota Audit Certification',
    species: '10/10 Native Forest Trees',
    contractor: 'Sime Darby Property Urban Forestry Division',
    status: 'Audit Certified',
    txHash: '0x4ceaea71f073563fed2bbd7a3c2e0606d58b7362c0213b9809b765aceb72315a',
    note: '100% promised tree quota verified before buyer vacant possession.',
  },
  {
    id: 4,
    date: 'Sep 24, 2026',
    treeId: 'ELM-053',
    precinct: 'Elmina Green - Phase 3 Boulevard',
    action: 'Healthy Sapling Replacement',
    species: 'Peltophorum pterocarpum (Yellow Flame)',
    contractor: 'Elmina GreenWorks',
    status: 'Verified on Arbitrum',
    txHash: '0x19f02090b2edbb6f9bfa5590e7750eb8ca4c1e3972939d7e0e7bf5639a6795f1',
    note: 'Replaced stunted sapling under 2-Year Defect Liability Period warranty.',
  },
];

// Transparent SLA Charter commitments
const SLA_TERMS = [
  {
    title: '2-Year DLP Sapling Replacement Warranty',
    badge: '14-Day SLA',
    description:
      'Any tree displaying severe crown desiccation (>30%), root heave failure, or terminal disease during the 24-month Defect Liability Period must be replaced by the appointed landscaping contractor within 14 calendar days at zero cost to homebuyers.',
  },
  {
    title: '85% Minimum Canopy Survival Index',
    badge: 'Enforceable Penalty',
    description:
      'Contractors are contractually bound to maintain an overall precinct health benchmark of 85% or higher. Falling below this threshold triggers an automated 10% monthly maintenance fee deduction calculated by the TreeLedger governance engine.',
  },
  {
    title: '24-Hour Emergency Storm Hazard Response',
    badge: 'Critical Safety',
    description:
      'Reports classified by Google Gemini AI Vision as CRITICAL_24H (fallen limbs, branch overhang over roads) require contractor crew dispatch and site clearance within 24 hours of citizen submission.',
  },
  {
    title: 'Immutable Proof-of-Work Verification',
    badge: 'Arbitrum Sepolia',
    description:
      'Zero contractor invoices are cleared without verified before-and-after photographic evidence. Every completed task generates a cryptographic keccak256 proof hash recorded on Arbitrum Sepolia.',
  },
];

export function TownshipTransparencyExplorer() {
  const [trees, setTrees] = useState<Tree[]>(INITIAL_TREES);
  const [selectedPrecinct, setSelectedPrecinct] = useState<string>('All Projects');
  const [selectedTree, setSelectedTree] = useState<Tree | null>(null);
  const [charterOpen, setCharterOpen] = useState(true);

  useEffect(() => {
    fetchTrees().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setTrees(data);
      }
    });
  }, []);

  // Filter trees based on precinct
  const filteredTrees = useMemo(() => {
    if (selectedPrecinct === 'All Projects') return trees;
    return trees.filter((t) => t.precinct === selectedPrecinct);
  }, [trees, selectedPrecinct]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalTrees = filteredTrees.length;
    const totalCo2 = filteredTrees.reduce((acc, t) => acc + (t.co2_kg_per_year || 0), 0);
    const avgHealth =
      totalTrees > 0
        ? Math.round(filteredTrees.reduce((acc, t) => acc + (t.health_score || 0), 0) / totalTrees)
        : 100;

    let targetQuota = 40;
    if (selectedPrecinct !== 'All Projects' && PRECINCT_QUOTAS[selectedPrecinct]) {
      targetQuota = PRECINCT_QUOTAS[selectedPrecinct].target;
    }
    const fulfillmentPercent = Math.min(100, Math.round((totalTrees / targetQuota) * 100));

    return {
      totalTrees,
      targetQuota,
      fulfillmentPercent,
      totalCo2: Math.round(totalCo2),
      avgHealth,
    };
  }, [filteredTrees, selectedPrecinct]);

  return (
    <section className="space-y-8 rounded-3xl bg-slate-900/60 border border-slate-800 p-6 sm:p-8 backdrop-blur-sm relative overflow-hidden">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Public Defect Liability Period (DLP) Transparency</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Township Canopy & Quota Delivery Audit
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Publicly auditable delivery verification for Sime Darby Property&apos;s City of Elmina.
            Compare promised developer quotas, inspect living trees, and verify contractor maintenance warranties.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold transition-colors px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30"
          >
            <span>Open Operations Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* (b) Categorized by Project Tabs */}
      <div className="space-y-3">
        <div className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Select Housing Project / Masterplan Phase:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRECINCTS.map((precinct) => (
            <button
              key={precinct}
              type="button"
              onClick={() => {
                setSelectedPrecinct(precinct);
                setSelectedTree(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedPrecinct === precinct
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 hover:bg-slate-850 text-slate-300 border border-slate-700/60 hover:text-white'
              }`}
            >
              {precinct}
            </button>
          ))}
        </div>
      </div>

      {/* Quota Progress & Project Summary Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quota Delivery Card */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-mono">
                {selectedPrecinct === 'All Projects'
                  ? 'City of Elmina Masterplan Canopy Delivery'
                  : PRECINCT_QUOTAS[selectedPrecinct]?.phase || 'Project Phase'}
              </div>
              <div className="text-base font-bold text-white mt-0.5">
                {selectedPrecinct}
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
              {stats.fulfillmentPercent}% Fulfilled
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Verified Planted: {stats.totalTrees} trees</span>
              <span className="text-slate-400 font-mono">
                Promised Target: {stats.targetQuota} trees
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500"
                style={{ width: `${stats.fulfillmentPercent}%` }}
              />
            </div>
          </div>

          {/* Metrics breakdown */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
            <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
                {stats.avgHealth}%
              </div>
              <div className="text-[10px] text-slate-400">Canopy Health Index</div>
            </div>

            <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-base sm:text-lg font-bold text-teal-300 font-mono">
                {stats.totalCo2} kg/yr
              </div>
              <div className="text-[10px] text-slate-400">Annual CO₂ Baseline</div>
            </div>

            <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-base sm:text-lg font-bold text-cyan-400 font-mono">
                PostGIS
              </div>
              <div className="text-[10px] text-slate-400">GPS Verified Assets</div>
            </div>
          </div>
        </div>

        {/* Contractor Responsibility Card */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Assigned Landscape Contractor</span>
            </div>
            <div className="text-sm font-bold text-white">
              {selectedPrecinct === 'All Projects'
                ? 'Consortium of Appointed Arborists'
                : PRECINCT_QUOTAS[selectedPrecinct]?.contractor || 'Elmina GreenWorks'}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Subject to mandatory 2-Year Defect Liability Period maintenance contracts,
              monthly health index audits, and Arbitrum Sepolia proof-of-work sealing.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Status:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Contract Active
            </span>
          </div>
        </div>
      </div>

      {/* (a) General Interactive Map Preview with Tree Pins */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Interactive Tree Canopy Map (City of Elmina):</span>
          </div>
          <span className="text-xs text-slate-400">
            Click any pin to inspect verified species and GPS telemetry
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden relative">
          {/* Map Viewport Preview */}
          <div className="h-80 sm:h-96 w-full relative bg-slate-900/90 flex flex-col items-center justify-center p-4 overflow-hidden">
            {/* Grid Coordinates Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none" />

            {/* Geographical Canopy Points Representation */}
            <div className="relative w-full h-full flex flex-wrap items-center justify-center gap-3 sm:gap-4 p-4 overflow-y-auto">
              {filteredTrees.map((tree) => {
                const isSelected = selectedTree?.id === tree.id;
                const isHealthy = (tree.health_score || 0) >= 80;
                const isWarning = (tree.health_score || 0) >= 50 && (tree.health_score || 0) < 80;

                return (
                  <button
                    key={tree.id}
                    type="button"
                    onClick={() => setSelectedTree(tree)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-400/40'
                        : isHealthy
                        ? 'bg-slate-900/80 border-slate-700/80 hover:border-emerald-500/40 text-slate-200'
                        : isWarning
                        ? 'bg-slate-900/80 border-amber-500/40 text-amber-200'
                        : 'bg-slate-900/80 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isHealthy
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      <Trees className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                        <span>{tree.id}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                            isHealthy
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : isWarning
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'bg-rose-500/15 text-rose-300'
                          }`}
                        >
                          {tree.health_score}%
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                        {tree.species}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Tree Inspector Popover */}
            {selectedTree && (
              <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-96 p-4 rounded-2xl bg-slate-900/95 border border-emerald-500/40 shadow-2xl backdrop-blur-md animate-fade-in space-y-2.5 z-20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Trees className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white text-xs font-mono">
                        {selectedTree.id}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {selectedTree.precinct}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTree(null)}
                    className="text-xs text-slate-400 hover:text-white px-2 py-1"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800">
                  <div>
                    <span className="text-slate-500 block">Species:</span>
                    <span className="text-slate-200 font-medium">{selectedTree.species}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Common Name:</span>
                    <span className="text-slate-200 font-medium">
                      {selectedTree.common_name || 'Forest Native'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">GPS Coordinates:</span>
                    <span className="text-emerald-400 font-mono text-[10px]">
                      {selectedTree.latitude.toFixed(5)}, {selectedTree.longitude.toFixed(5)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">CO₂ Baseline:</span>
                    <span className="text-teal-300 font-mono">
                      {selectedTree.co2_kg_per_year} kg/year
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
                    QR: {selectedTree.qr_code_hash}
                  </span>
                  <Link
                    href={`/app/explore`}
                    className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Full Profile</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* (c) Latest Update on Tree Planting (Living Milestones Feed) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Latest Tree Planting & Maintenance Activity:</span>
          </div>
          <span className="text-[11px] text-cyan-400 font-medium hidden sm:inline">
            Sealed on Arbitrum Sepolia
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {RECENT_MILESTONES.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                  {item.date}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  {item.status}
                </span>
              </div>

              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{item.action}</span>
                  <span className="text-[10px] text-emerald-400 font-mono">[{item.treeId}]</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{item.species}</div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/80">
                &ldquo;{item.note}&rdquo;
              </p>

              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="text-slate-500 text-[10px]">
                  Contractor: <strong className="text-slate-400">{item.contractor}</strong>
                </span>
                <a
                  href={`https://sepolia.arbiscan.io/tx/${item.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[10px] font-mono"
                >
                  <span>Tx: {item.txHash.slice(0, 10)}...</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* (d) Contract Details: Public SLA & Maintenance Charter */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Developer-Contractor SLA & Warranty Charter (Transparent Commitments):</span>
          </div>
          <button
            type="button"
            onClick={() => setCharterOpen(!charterOpen)}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <span>{charterOpen ? 'Collapse' : 'Expand'}</span>
            {charterOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {charterOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {SLA_TERMS.map((term, index) => (
              <div
                key={index}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-purple-500/30 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-white">{term.title}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 shrink-0">
                    {term.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{term.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Public Smart Contract Verification Reference */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">
              TreeLedgerAudit Smart Contract:
            </span>
            <code className="text-emerald-400 font-mono text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              0x685049b310922F6bc8d6FA17ddae010E13803701
            </code>
          </div>

          <a
            href="https://sepolia.arbiscan.io/address/0x685049b310922F6bc8d6FA17ddae010E13803701"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold text-[11px] self-start sm:self-auto"
          >
            <span>Verify On Arbiscan</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </section>
  );
}

export default TownshipTransparencyExplorer;
