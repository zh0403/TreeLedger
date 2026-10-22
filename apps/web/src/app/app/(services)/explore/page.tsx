'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Compass,
  Filter,
  Leaf,
  MapPin,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Sprout,
  Trees,
  Wind,
  X,
} from 'lucide-react';
import { fetchTrees } from '@/lib/api';
import { StewardshipMode, Tree } from '@/lib/types';

export default function ExplorePage() {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mode, setMode] = useState<StewardshipMode>('PRE_HANDOVER_AUDIT');
  const [selectedPrecinct, setSelectedPrecinct] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);
  const [scannedTreeId, setScannedTreeId] = useState<string | null>(null);
  const [liveMicroGramsOffset, setLiveMicroGramsOffset] = useState<number>(0);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchTrees();
    setTrees(data);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    void fetchTrees().then(data => {
      if (active) { setTrees(data); setLoading(false); }
    });
    return () => { active = false; };
  }, []);

  // Filter trees by selected stewardship mode first
  const modeTrees = useMemo(() => {
    return trees.filter((tree) => {
      if (mode === 'PRE_HANDOVER_AUDIT') {
        return (
          tree.handover_status === 'PRE_HANDOVER_PLANTED' ||
          tree.handover_status === 'DLP_ACTIVE'
        );
      }
      return tree.handover_status === 'COMMISSIONED';
    });
  }, [trees, mode]);

  // Available precincts within current mode
  const precincts = useMemo(() => {
    const unique = Array.from(new Set(modeTrees.map((t) => t.precinct)));
    return unique;
  }, [modeTrees]);

  // Reset related filters as part of the user's mode change, not a second render.
  const changeMode = (nextMode: StewardshipMode) => {
    setMode(nextMode);
    setSelectedPrecinct('ALL');
    setScannedTreeId(null);
  };

  const filteredTrees = useMemo(() => {
    return modeTrees.filter((tree) => {
      if (selectedPrecinct !== 'ALL' && tree.precinct !== selectedPrecinct) {
        return false;
      }
      if (scannedTreeId && tree.id !== scannedTreeId) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return (
          tree.id.toLowerCase().includes(q) ||
          tree.species.toLowerCase().includes(q) ||
          tree.common_name.toLowerCase().includes(q) ||
          tree.precinct.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [modeTrees, selectedPrecinct, scannedTreeId, searchQuery]);

  // Decarbonization Ticker Calculations
  const totalAnnualCo2Kg = useMemo(() => {
    return filteredTrees.reduce(
      (sum, t) => sum + Number(t.co2_kg_per_year || 0),
      0
    );
  }, [filteredTrees]);

  const avgHealthScore = useMemo(() => {
    if (filteredTrees.length === 0) return 0;
    const sum = filteredTrees.reduce((acc, t) => acc + t.health_score, 0);
    return Math.round(sum / filteredTrees.length);
  }, [filteredTrees]);

  // Real-time decarbonization ticker interval
  useEffect(() => {
    if (totalAnnualCo2Kg <= 0) return;
    // Per second sequestration rate in milligrams
    const mgPerTick = (totalAnnualCo2Kg * 1_000_000) / (365 * 24 * 3600) / 2;
    const timer = setInterval(() => {
      setLiveMicroGramsOffset((prev) => prev + mgPerTick);
    }, 500);
    return () => clearInterval(timer);
  }, [totalAnnualCo2Kg]);

  const formatHandoverBadge = (status: Tree['handover_status']) => {
    switch (status) {
      case 'PRE_HANDOVER_PLANTED':
        return {
          label: 'Pre-Handover Planted',
          className:
            'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        };
      case 'DLP_ACTIVE':
        return {
          label: 'DLP Active Warranty',
          className:
            'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };
      case 'COMMISSIONED':
        return {
          label: 'Township Commissioned',
          className:
            'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        };
    }
  };

  const getHealthBadgeColor = (score: number) => {
    if (score >= 85) {
      return {
        bar: 'bg-emerald-400',
        badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        label: 'Optimal Canopy',
      };
    }
    if (score >= 70) {
      return {
        bar: 'bg-amber-400',
        badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        label: 'Moderate Stress',
      };
    }
    return {
      bar: 'bg-rose-500',
      badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      label: 'SLA Intervention Needed',
    };
  };

  return (
    <div className="p-4 space-y-4">
      {/* 1. Precinct Lifecycle Switcher */}
      <section aria-label="Precinct Lifecycle Switcher" className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            Precinct Lifecycle Mode
          </span>
          <button
            type="button"
            onClick={() => setQrModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 px-2.5 py-1 text-xs font-medium text-emerald-300 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
            Scan Tree QR
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => changeMode('PRE_HANDOVER_AUDIT')}
            className={`flex flex-col items-start rounded-lg px-3 py-2 text-left transition-all ${
              mode === 'PRE_HANDOVER_AUDIT'
                ? 'bg-slate-800 text-white shadow-sm border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck
                className={`w-3.5 h-3.5 ${
                  mode === 'PRE_HANDOVER_AUDIT'
                    ? 'text-cyan-400'
                    : 'text-slate-500'
                }`}
              />
              <span className="text-xs font-semibold">Pre-Handover Audit</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">
              DLP Quota & Baseline dMRV
            </span>
          </button>

          <button
            type="button"
            onClick={() => changeMode('LIVING_STEWARDSHIP')}
            className={`flex flex-col items-start rounded-lg px-3 py-2 text-left transition-all ${
              mode === 'LIVING_STEWARDSHIP'
                ? 'bg-slate-800 text-white shadow-sm border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Sprout
                className={`w-3.5 h-3.5 ${
                  mode === 'LIVING_STEWARDSHIP'
                    ? 'text-emerald-400'
                    : 'text-slate-500'
                }`}
              />
              <span className="text-xs font-semibold">Living Stewardship</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">
              Active Township Canopy
            </span>
          </button>
        </div>

        {/* Precinct Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedPrecinct('ALL')}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              selectedPrecinct === 'ALL'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Precincts ({modeTrees.length})
          </button>
          {precincts.map((precinct) => (
            <button
              key={precinct}
              type="button"
              onClick={() => setSelectedPrecinct(precinct)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                selectedPrecinct === precinct
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {precinct}
            </button>
          ))}
        </div>
      </section>

      {/* 2. Decarbonization Ticker */}
      <section
        aria-label="Decarbonization Telemetry Ticker"
        className="rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 p-4 shadow-lg relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Wind className="w-4 h-4" />
            <span>Decarbonization Ticker</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-slate-950/80 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-md">
            <Sparkles className="w-3 h-3" />
            {mode === 'PRE_HANDOVER_AUDIT'
              ? 'DLP Audit Telemetry'
              : 'Active Sequestration'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 my-2">
          <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-3">
            <span className="text-[11px] text-slate-400 block">
              Annual Carbon Baseline
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold font-mono text-white">
                {totalAnnualCo2Kg.toFixed(1)}
              </span>
              <span className="text-xs font-medium text-emerald-400">
                kg CO₂e/yr
              </span>
            </div>
            <div className="mt-1.5 text-[10px] font-mono text-emerald-300/90 flex items-center gap-1">
              <Activity className="w-3 h-3 animate-pulse" />+
              {(142.8 + liveMicroGramsOffset / 1000).toFixed(4)} g session live
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-3">
            <span className="text-[11px] text-slate-400 block">
              Canopy Health Index
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold font-mono text-white">
                {avgHealthScore}
              </span>
              <span className="text-xs font-medium text-slate-400">/ 100</span>
            </div>
            <div className="mt-1.5 text-[10px] text-slate-300 flex items-center justify-between">
              <span>{filteredTrees.length} Verified Assets</span>
              <span className="text-emerald-400 font-medium">100% Quota</span>
            </div>
          </div>
        </div>

        {mode === 'PRE_HANDOVER_AUDIT' && (
          <div className="mt-2 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300">
            <span>Pre-Handover DLP Tree Quota Verification</span>
            <span className="font-mono font-semibold text-cyan-300">
              {filteredTrees.length} / {filteredTrees.length} Planted & Tagged
            </span>
          </div>
        )}
      </section>

      {/* 3. Search & Active QR Scan Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Tree ID (e.g. ELM-042), species, or precinct..."
            className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-9 pr-9 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {scannedTreeId && (
          <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-xs text-emerald-200">
            <span className="flex items-center gap-1.5 font-medium">
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              Filtered by QR Tag: <strong>{scannedTreeId}</strong>
            </span>
            <button
              type="button"
              onClick={() => setScannedTreeId(null)}
              className="text-emerald-300 hover:text-white underline text-[11px]"
            >
              Show All
            </button>
          </div>
        )}
      </div>

      {/* 4. Tree Profile Cards List */}
      <section aria-label="Tree Asset Registry" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Trees className="w-3.5 h-3.5 text-emerald-400" />
            Tree Profile Cards ({filteredTrees.length})
          </h2>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 animate-pulse space-y-3"
              >
                <div className="flex justify-between">
                  <div className="h-4 w-24 bg-slate-800 rounded" />
                  <div className="h-4 w-32 bg-slate-800 rounded" />
                </div>
                <div className="h-5 w-48 bg-slate-800 rounded" />
                <div className="h-2 w-full bg-slate-800 rounded" />
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="h-12 bg-slate-800 rounded-xl" />
                  <div className="h-12 bg-slate-800 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTrees.length === 0 ? (
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
              <Filter className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-200">
                No Matching Tree Assets
              </p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                No trees matched your current precinct filter or search query in{' '}
                {mode === 'PRE_HANDOVER_AUDIT'
                  ? 'Pre-Handover Audit'
                  : 'Living Stewardship'}{' '}
                mode.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedPrecinct('ALL');
                setSearchQuery('');
                setScannedTreeId(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 px-3.5 py-2 text-xs font-semibold text-emerald-300 transition-colors"
            >
              Reset Precinct Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTrees.map((tree) => {
              const handoverBadge = formatHandoverBadge(tree.handover_status);
              const healthStyle = getHealthBadgeColor(tree.health_score);

              return (
                <article
                  key={tree.id}
                  className="rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 p-4 space-y-3.5 transition-all shadow-md"
                >
                  {/* Top Row: ID & Handover Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-800 text-emerald-400 border border-slate-700">
                          {tree.id}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${handoverBadge.className}`}
                        >
                          {handoverBadge.label}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1.5">
                        {tree.common_name}
                      </h3>
                      <p className="text-xs italic text-slate-400">
                        {tree.species}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${healthStyle.badge}`}
                      >
                        {healthStyle.label}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-end gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {tree.precinct}
                      </p>
                    </div>
                  </div>

                  {/* Metrics Grid: Carbon Baseline & Health Score */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-2.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Carbon Baseline</span>
                      </div>
                      <p className="text-sm font-bold font-mono text-slate-100 mt-1">
                        {Number(tree.co2_kg_per_year).toFixed(2)}{' '}
                        <span className="text-[11px] font-normal text-emerald-400">
                          kg CO₂/yr
                        </span>
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-2.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Canopy Health</span>
                        <span className="font-mono font-bold text-slate-100">
                          {tree.health_score}/100
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mt-2">
                        <div
                          className={`h-full rounded-full ${healthStyle.bar}`}
                          style={{ width: `${tree.health_score}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Metadata & Actions Footer */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                    <div className="truncate font-mono text-[10px] text-slate-500">
                      GPS: {Number(tree.latitude).toFixed(4)}°N,{' '}
                      {Number(tree.longitude).toFixed(4)}°E • Planted{' '}
                      {new Date(tree.planted_at).toLocaleDateString('en-MY', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>

                    <Link
                      href={`/app/hazards?treeId=${encodeURIComponent(tree.id)}`}
                      className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 text-[11px] font-medium text-amber-300 transition-colors"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      Flag Hazard
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* QR Code Scanner / Tag Selector Modal */}
      {qrModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Scan Tree QR Tag"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Scan Physical Tree QR Plaque
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select a verified City of Elmina NFC/QR tree plaque below to
              inspect its dMRV passport and handover telemetry:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {trees.map((tree) => (
                <button
                  key={tree.id}
                  type="button"
                  onClick={() => {
                    const targetMode: StewardshipMode =
                      tree.handover_status === 'COMMISSIONED'
                        ? 'LIVING_STEWARDSHIP'
                        : 'PRE_HANDOVER_AUDIT';
                    changeMode(targetMode);
                    setTimeout(() => {
                      setScannedTreeId(tree.id);
                    }, 10);
                    setQrModalOpen(false);
                  }}
                  className="w-full flex items-center justify-between rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 p-3 text-left transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        {tree.id}
                      </span>
                      <span className="text-xs font-medium text-white">
                        {tree.common_name}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5 truncate max-w-[240px]">
                      QR Hash: {tree.qr_code_hash}
                    </p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
