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
import { StatusBadge } from '@/components/ui/status-badge';

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
    let active = true;
    void fetchMaintenanceRecords().then((data) => {
      if (active) {
        setRecords(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
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

  const formatActionBadge = (
    action: MaintenanceActionType
  ): {
    label: string;
    tone: 'healthy' | 'verified' | 'warning';
  } => {
    switch (action) {
      case 'CANOPY_PRUNING':
        return {
          label: 'Canopy Pruning',
          tone: 'healthy',
        };
      case 'DEEP_ROOT_WATERING':
        return {
          label: 'Deep-Root Watering',
          tone: 'verified',
        };
      case 'REPLACED_SAPLING':
        return {
          label: 'Replaced Sapling',
          tone: 'warning',
        };
    }
  };

  return (
    <div className="p-4 space-y-5 font-sans text-[var(--foreground)]">
      {/* Header Card */}
      <section
        className="surface-panel p-4 space-y-2"
        style={{
          background:
            'radial-gradient(ellipse at top right, color-mix(in srgb, var(--proof-400) 14%, transparent), transparent 65%), var(--surface)',
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 text-[var(--proof-400)] text-xs font-medium uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>On-Chain Audited Maintenance Stream</span>
          </div>
          <span className="rounded-[var(--radius-pill)] bg-[var(--background)] border border-[var(--proof-400)]/40 px-2.5 py-0.5 text-[11px] font-mono text-[var(--proof-400)]">
            Arbitrum Sepolia
          </span>
        </div>
        <p className="text-xs text-[var(--muted)] leading-relaxed">
          Every contractor work order is verified via before/after computer
          vision and anchored to{' '}
          <span className="font-mono text-[var(--proof-400)]">
            TreeLedgerAudit.sol
          </span>{' '}
          with a cryptographic <span className="font-mono">keccak256</span>{' '}
          receipt.
        </p>
      </section>

      {/* Search & Action Type Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Tree ID, Contractor, or Arbitrum 0x hash..."
            className="w-full min-h-[44px] rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--control-border)] pl-9 pr-9 py-2.5 text-xs text-[var(--foreground)] placeholder:text-[var(--muted)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
              aria-label="Clear search"
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
                aria-pressed={actionFilter === tab.key}
                className={`min-h-[38px] shrink-0 rounded-[var(--radius-pill)] px-3.5 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
                  actionFilter === tab.key
                    ? 'bg-[var(--proof-400)] border-[var(--proof-400)] text-[var(--forest-950)]'
                    : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={loadRecords}
            className="min-h-[38px] px-2.5 rounded-[var(--radius-control)] shrink-0 inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
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
              className="rounded-[var(--radius-panel)] bg-[var(--surface)] border border-[var(--border)] p-4 animate-pulse space-y-3"
            >
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-[var(--surface-raised)] rounded" />
                <div className="h-4 w-32 bg-[var(--surface-raised)] rounded" />
              </div>
              <div className="h-44 w-full bg-[var(--surface-raised)] rounded-[var(--radius-control)]" />
              <div className="h-12 w-full bg-[var(--surface-raised)] rounded-[var(--radius-control)]" />
            </div>
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="rounded-[var(--radius-panel)] bg-[var(--surface)] border border-[var(--border)] p-8 text-center space-y-3">
          <div className="w-11 h-11 rounded-full bg-[var(--surface-raised)] flex items-center justify-center mx-auto text-[var(--proof-400)]">
            <Filter className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--foreground)]">
              No Audited Maintenance Logs Found
            </p>
            <p className="text-xs text-[var(--muted)] max-w-xs mx-auto leading-relaxed">
              No verified proof-of-work records match your current filter.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setActionFilter('ALL');
              setSearchQuery('');
            }}
            className="button button--secondary"
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
                className="surface-panel p-4 space-y-4 transition-colors hover:border-[var(--control-border)]"
              >
                {/* Archival Record Header */}
                <div className="flex items-start justify-between gap-2 border-b border-[var(--border)] pb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-medium px-2.5 py-0.5 rounded-[var(--radius-pill)] bg-[var(--background)] text-[var(--accent)] border border-[var(--border)]">
                        {rec.tree_id}
                      </span>
                      <StatusBadge tone={actionBadge.tone}>
                        {actionBadge.label}
                      </StatusBadge>
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-1.5 flex items-center gap-1.5">
                      <Wrench className="w-3 h-3 text-[var(--accent)]" />
                      <span>{rec.contractor_id}</span>
                    </p>
                  </div>

                  {rec.ai_verification_passed && (
                    <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--background)] border border-[var(--proof-400)]/40 px-2.5 py-1 text-xs font-medium text-[var(--proof-400)]">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI PoW Verified
                    </span>
                  )}
                </div>

                {/* View Mode Switcher for Archival Before/After Comparison */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[var(--muted)] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[var(--proof-400)]" />
                    Archival Before / After Proof Plate
                  </span>
                  <div className="inline-flex rounded-[var(--radius-pill)] bg-[var(--background)] border border-[var(--border)] p-1 text-xs font-medium">
                    {(['SPLIT', 'BEFORE', 'AFTER'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() =>
                          setActiveSlideMap((prev) => ({
                            ...prev,
                            [rec.id]: m,
                          }))
                        }
                        aria-pressed={viewMode === m}
                        className={`px-2.5 py-1 rounded-[var(--radius-pill)] transition-colors cursor-pointer ${
                          viewMode === m
                            ? 'bg-[var(--surface-raised)] text-[var(--foreground)]'
                            : 'text-[var(--muted)] hover:text-[var(--foreground)]'
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

                {/* Clean Archival Before / After Photo Comparison Plates */}
                {viewMode === 'SPLIT' ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    <figure className="m-0 rounded-[var(--radius-control)] overflow-hidden border border-[var(--border)] bg-[var(--background)] flex flex-col">
                      <div className="relative h-36">
                        <img
                          src={rec.before_photo_url}
                          alt={`Before maintenance on ${rec.tree_id}`}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 rounded-[var(--radius-pill)] bg-[var(--background)]/90 border border-[var(--border)] px-2.5 py-0.5 text-[10px] font-mono font-medium text-[var(--status-critical-text)]">
                          BEFORE
                        </span>
                      </div>
                      <figcaption className="px-2.5 py-1.5 text-[11px] font-mono text-[var(--muted)] border-t border-[var(--border)]">
                        Baseline Incident Frame
                      </figcaption>
                    </figure>

                    <figure className="m-0 rounded-[var(--radius-control)] overflow-hidden border border-[var(--proof-400)]/45 bg-[var(--background)] flex flex-col">
                      <div className="relative h-36">
                        <img
                          src={rec.after_photo_url}
                          alt={`After maintenance on ${rec.tree_id}`}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 rounded-[var(--radius-pill)] bg-[var(--background)]/90 border border-[var(--proof-400)]/50 px-2.5 py-0.5 text-[10px] font-mono font-medium text-[var(--proof-400)] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          AFTER • SEALED
                        </span>
                      </div>
                      <figcaption className="px-2.5 py-1.5 text-[11px] font-mono text-[var(--proof-400)] border-t border-[var(--border)]">
                        Verified Completion Plate
                      </figcaption>
                    </figure>
                  </div>
                ) : (
                  <figure className="m-0 relative h-52 rounded-[var(--radius-control)] overflow-hidden border border-[var(--control-border)] bg-[var(--background)]">
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
                      className="absolute top-2.5 left-2.5 rounded-[var(--radius-pill)] bg-[var(--background)]/90 px-3 py-1 text-xs font-mono font-medium border"
                      style={
                        viewMode === 'BEFORE'
                          ? {
                              borderColor: 'var(--status-critical)',
                              color: 'var(--status-critical-text)',
                            }
                          : {
                              borderColor: 'var(--proof-400)',
                              color: 'var(--proof-400)',
                            }
                      }
                    >
                      {viewMode} ARCHIVAL PLATE
                    </span>
                  </figure>
                )}

                {/* Arborist Notes */}
                <p className="text-xs text-[var(--foreground)] leading-relaxed bg-[var(--background)] rounded-[var(--radius-control)] p-3 border border-[var(--border)]">
                  {rec.notes}
                </p>

                {/* Cryptographic Verification Seal (--proof-400) */}
                <div
                  className="rounded-[var(--radius-control)] bg-[var(--background)] border p-3.5 space-y-2.5"
                  style={{
                    borderColor: 'color-mix(in srgb, var(--proof-400) 42%, var(--border))',
                  }}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[var(--proof-400)] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[var(--proof-400)]" />
                      Cryptographic Verification Seal • Arbitrum L2
                    </span>
                    <span className="text-xs font-mono text-[var(--muted)]">
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
                      <code className="font-mono text-xs text-[var(--foreground)] bg-[var(--surface)] px-2.5 py-1 rounded-[var(--radius-control)] border border-[var(--border)] truncate">
                        {shortTx}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyTx(rec.arbitrum_tx_hash)}
                        className="w-9 h-9 grid place-items-center rounded-[var(--radius-control)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                        title="Copy full transaction hash"
                      >
                        {copiedTx === rec.arbitrum_tx_hash ? (
                          <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <a
                      href={`https://sepolia.arbiscan.io/tx/${rec.arbitrum_tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[36px] shrink-0 inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--surface-raised)] hover:bg-[var(--surface)] border border-[var(--proof-400)]/45 px-3 py-1 text-xs font-medium text-[var(--proof-400)] transition-colors"
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
