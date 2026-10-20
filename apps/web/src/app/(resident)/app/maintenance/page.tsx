'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Filter,
  Layers,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';
import { fetchMaintenanceRecords } from '@/lib/api';
import { MaintenanceActionType, MaintenanceRecord } from '@/lib/types';

export default function MaintenanceStreamPage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionFilter, setActionFilter] = useState<
    MaintenanceActionType | 'ALL'
  >('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedTx, setCopiedTx] = useState<string | null>(null);
  const [activeSlideMap, setActiveSlideMap] = useState<
    Record<number, 'SPLIT' | 'BEFORE' | 'AFTER'>
  >({});

  const loadRecords = async () => {
    setLoading(true);
    const data = await fetchMaintenanceRecords();
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (actionFilter !== 'ALL' && rec.action_type !== actionFilter) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return (
          rec.tree_id.toLowerCase().includes(q) ||
          rec.contractor_id.toLowerCase().includes(q) ||
          rec.arbitrum_tx_hash.toLowerCase().includes(q) ||
          rec.notes.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [records, actionFilter, searchQuery]);

  const handleCopyTx = async (txHash: string) => {
    try {
      await navigator.clipboard.writeText(txHash);
      setCopiedTx(txHash);
      setTimeout(() => setCopiedTx(null), 2000);
    } catch {
      // Fallback if clipboard blocked
    }
  };

  const formatActionBadge = (action: MaintenanceActionType) => {
    switch (action) {
      case 'CANOPY_PRUNING':
        return {
          label: 'Canopy Pruning',
          className:
            'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        };
      case 'DEEP_ROOT_WATERING':
        return {
          label: 'Deep-Root Watering',
          className: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        };
      case 'REPLACED_SAPLING':
        return {
          label: 'Replaced Sapling',
          className: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header Card */}
      <section className="rounded-2xl bg-gradient-to-br from-cyan-950/50 via-slate-900 to-slate-900 border border-cyan-500/30 p-4 shadow-lg space-y-2">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>On-Chain Audited Maintenance Stream</span>
          </div>
          <span className="rounded-md bg-slate-950/90 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
            Arbitrum Sepolia
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Every contractor work order is verified via before/after computer
          vision and anchored to{' '}
          <span className="font-mono text-cyan-300">TreeLedgerAudit.sol</span>{' '}
          with a cryptographic <span className="font-mono">keccak256</span>{' '}
          receipt.
        </p>
      </section>

      {/* Search & Action Type Filters */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Tree ID, Contractor, or Arbitrum 0x hash..."
            className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-9 pr-9 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {(
              [
                { key: 'ALL', label: `All Audits (${records.length})` },
                { key: 'CANOPY_PRUNING', label: 'Canopy Pruning' },
                { key: 'DEEP_ROOT_WATERING', label: 'Deep-Root Watering' },
                { key: 'REPLACED_SAPLING', label: 'Replaced Sapling' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActionFilter(tab.key)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  actionFilter === tab.key
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={loadRecords}
            className="shrink-0 inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>
      </div>

      {/* Stream Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-4 animate-pulse space-y-3"
            >
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-slate-800 rounded" />
                <div className="h-4 w-32 bg-slate-800 rounded" />
              </div>
              <div className="h-44 w-full bg-slate-800 rounded-xl" />
              <div className="h-12 w-full bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
            <Filter className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-200">
              No Audited Maintenance Logs Found
            </p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              No verified proof-of-work records match your current filter.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setActionFilter('ALL');
              setSearchQuery('');
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 px-3.5 py-2 text-xs font-semibold text-cyan-300"
          >
            Reset Audit Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((rec) => {
            const actionBadge = formatActionBadge(rec.action_type);
            const viewMode = activeSlideMap[rec.id] || 'SPLIT';
            const shortTx = `${rec.arbitrum_tx_hash.slice(
              0,
              10
            )}...${rec.arbitrum_tx_hash.slice(-8)}`;

            return (
              <article
                key={rec.id}
                className="rounded-2xl bg-slate-900/95 border border-slate-800/90 p-4 space-y-3.5 shadow-md"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-800 text-emerald-400 border border-slate-700">
                        {rec.tree_id}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${actionBadge.className}`}
                      >
                        {actionBadge.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                      <Wrench className="w-3 h-3 text-slate-500" />
                      <span>{rec.contractor_id}</span>
                    </p>
                  </div>

                  {rec.ai_verification_passed && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                      <Sparkles className="w-3 h-3" />
                      AI PoW Verified
                    </span>
                  )}
                </div>

                {/* View Mode Switcher for Before/After Comparison */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    Before / After Visual Proof-of-Work
                  </span>
                  <div className="inline-flex rounded-lg bg-slate-950 border border-slate-800 p-0.5 text-[10px] font-semibold">
                    {(['SPLIT', 'BEFORE', 'AFTER'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() =>
                          setActiveSlideMap((prev) => ({ ...prev, [rec.id]: m }))
                        }
                        className={`px-2 py-0.5 rounded-md transition-colors ${
                          viewMode === m
                            ? 'bg-slate-800 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {m === 'SPLIT'
                          ? 'Side-by-Side'
                          : m === 'BEFORE'
                          ? 'Before'
                          : 'After'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Before / After Photo Comparison Container */}
                {viewMode === 'SPLIT' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative h-36 rounded-xl overflow-hidden border border-rose-500/30 bg-slate-950">
                      <img
                        src={rec.before_photo_url}
                        alt={`Before maintenance on ${rec.tree_id}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 rounded-md bg-slate-950/90 border border-rose-500/40 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                        BEFORE
                      </span>
                    </div>

                    <div className="relative h-36 rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-950">
                      <img
                        src={rec.after_photo_url}
                        alt={`After maintenance on ${rec.tree_id}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 rounded-md bg-slate-950/90 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        AFTER
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-48 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                    <img
                      src={
                        viewMode === 'BEFORE'
                          ? rec.before_photo_url
                          : rec.after_photo_url
                      }
                      alt={`${viewMode} maintenance on ${rec.tree_id}`}
                      className="w-full h-full object-cover"
                    />
                    <span
                      className={`absolute top-2.5 left-2.5 rounded-md bg-slate-950/90 px-2.5 py-1 text-[10px] font-bold border ${
                        viewMode === 'BEFORE'
                          ? 'border-rose-500/40 text-rose-300'
                          : 'border-emerald-500/40 text-emerald-300'
                      }`}
                    >
                      {viewMode} MAINTENANCE FRAME
                    </span>
                  </div>
                )}

                {/* Arborist Notes */}
                <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                  {rec.notes}
                </p>

                {/* Arbitrum Transaction Explorer Badge */}
                <div className="rounded-xl bg-slate-950 border border-cyan-500/30 p-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      Arbitrum L2 Audit Receipt
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(rec.completed_at).toLocaleString('en-MY', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <code className="font-mono text-xs text-slate-200 bg-slate-900 px-2 py-1 rounded border border-slate-800 truncate">
                        {shortTx}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyTx(rec.arbitrum_tx_hash)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Copy full transaction hash"
                      >
                        {copiedTx === rec.arbitrum_tx_hash ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <a
                      href={`https://sepolia.arbiscan.io/tx/${rec.arbitrum_tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 transition-colors"
                    >
                      <span>Arbiscan</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
