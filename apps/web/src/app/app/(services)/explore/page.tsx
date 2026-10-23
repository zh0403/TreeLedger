'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Compass,
  Filter,
  Fingerprint,
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
import { StatusBadge } from '@/components/ui/status-badge';

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
    void fetchTrees().then((data) => {
      if (active) {
        setTrees(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
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

  const formatHandoverBadge = (
    status: Tree['handover_status']
  ): {
    label: string;
    tone: 'verified' | 'warning' | 'healthy';
  } => {
    switch (status) {
      case 'PRE_HANDOVER_PLANTED':
        return {
          label: 'Pre-Handover Planted',
          tone: 'verified',
        };
      case 'DLP_ACTIVE':
        return {
          label: 'DLP Active Warranty',
          tone: 'warning',
        };
      case 'COMMISSIONED':
        return {
          label: 'Township Commissioned',
          tone: 'healthy',
        };
    }
  };

  const getHealthBadgeMeta = (
    score: number
  ): {
    barColor: string;
    tone: 'healthy' | 'warning' | 'critical';
    label: string;
  } => {
    if (score >= 85) {
      return {
        barColor: 'var(--status-healthy)',
        tone: 'healthy',
        label: 'Optimal Canopy',
      };
    }
    if (score >= 70) {
      return {
        barColor: 'var(--status-warning)',
        tone: 'warning',
        label: 'Moderate Stress',
      };
    }
    return {
      barColor: 'var(--status-critical)',
      tone: 'critical',
      label: 'SLA Intervention Needed',
    };
  };

  return (
    <div className="p-4 space-y-5 font-sans text-[var(--foreground)]">
      {/* 1. Precinct Lifecycle Switcher */}
      <section aria-label="Precinct Lifecycle Switcher" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[var(--accent)]" />
            Precinct Lifecycle Mode
          </span>
          <button
            type="button"
            onClick={() => setQrModalOpen(true)}
            className="min-h-[44px] inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--surface-raised)] hover:bg-[var(--surface)] border border-[var(--control-border)] px-3.5 py-1.5 text-xs font-medium text-[var(--accent)] transition-colors cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            Scan Tree QR
          </button>
        </div>

        {/* Organic Pre-Handover vs Living Stewardship Segmented Toggle */}
        <div className="tl-segmented tl-segmented--descriptive grid grid-cols-2" role="group" aria-label="Tree registry view">
          <button
            type="button"
            onClick={() => changeMode('PRE_HANDOVER_AUDIT')}
            aria-pressed={mode === 'PRE_HANDOVER_AUDIT'}
            className={`min-h-[56px] flex flex-col items-start justify-center rounded-[var(--radius-control)] px-3.5 py-2.5 text-left transition-all cursor-pointer border ${
              mode === 'PRE_HANDOVER_AUDIT'
                ? 'bg-[var(--surface-raised)] text-[var(--foreground)] border-[var(--verification)] shadow-[var(--shadow-panel)]'
                : 'bg-transparent text-[var(--muted)] hover:text-[var(--foreground)] border-transparent'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck
                className={`w-3.5 h-3.5 ${
                  mode === 'PRE_HANDOVER_AUDIT'
                    ? 'text-[var(--verification)]'
                    : 'text-[var(--muted)]'
                }`}
              />
              <span className="text-xs font-medium text-[var(--foreground)]">
                Pre-Handover Audit
              </span>
            </div>
            <span className="text-[11px] text-[var(--muted)] mt-0.5">
              DLP Quota &amp; Baseline dMRV
            </span>
          </button>

          <button
            type="button"
            onClick={() => changeMode('LIVING_STEWARDSHIP')}
            aria-pressed={mode === 'LIVING_STEWARDSHIP'}
            className={`min-h-[56px] flex flex-col items-start justify-center rounded-[var(--radius-control)] px-3.5 py-2.5 text-left transition-all cursor-pointer border ${
              mode === 'LIVING_STEWARDSHIP'
                ? 'bg-[var(--surface-raised)] text-[var(--foreground)] border-[var(--accent)] shadow-[var(--shadow-panel)]'
                : 'bg-transparent text-[var(--muted)] hover:text-[var(--foreground)] border-transparent'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Sprout
                className={`w-3.5 h-3.5 ${
                  mode === 'LIVING_STEWARDSHIP'
                    ? 'text-[var(--accent)]'
                    : 'text-[var(--muted)]'
                }`}
              />
              <span className="text-xs font-medium text-[var(--foreground)]">
                Living Stewardship
              </span>
            </div>
            <span className="text-[11px] text-[var(--muted)] mt-0.5">
              Active Township Canopy
            </span>
          </button>
        </div>

        {/* Precinct Filter Pills */}
        <div className="tl-segmented flex items-center" role="group" aria-label="Filter trees by precinct">
          <button
            type="button"
            onClick={() => setSelectedPrecinct('ALL')}
            aria-pressed={selectedPrecinct === 'ALL'}
            className={`min-h-[38px] shrink-0 rounded-[var(--radius-pill)] px-3.5 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
              selectedPrecinct === 'ALL'
                ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-foreground)]'
                : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            All Precincts ({modeTrees.length})
          </button>
          {precincts.map((precinct) => (
            <button
              key={precinct}
              type="button"
              onClick={() => setSelectedPrecinct(precinct)}
              aria-pressed={selectedPrecinct === precinct}
              className={`min-h-[38px] shrink-0 rounded-[var(--radius-pill)] px-3.5 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
                selectedPrecinct === precinct
                  ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-foreground)]'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]'
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
        className="surface-panel p-4 relative overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse at top left, var(--ambient), transparent 68%), var(--surface)',
        }}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-[var(--accent)] text-xs font-medium uppercase tracking-wider">
            <Wind className="w-4 h-4" />
            <span>Decarbonization Ticker</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-[var(--background)] border border-[var(--border)] text-[var(--accent-soft)] px-2.5 py-0.5 rounded-[var(--radius-pill)]">
            <Sparkles className="w-3 h-3 text-[var(--accent)]" />
            {mode === 'PRE_HANDOVER_AUDIT'
              ? 'DLP Audit Telemetry'
              : 'Active Sequestration'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 my-2">
          <div className="rounded-[var(--radius-control)] bg-[var(--background)] border border-[var(--border)] p-3">
            <span className="text-xs text-[var(--muted)] block">
              Annual Carbon Baseline
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-medium font-mono text-[var(--foreground)]">
                {totalAnnualCo2Kg.toFixed(1)}
              </span>
              <span className="text-xs font-medium text-[var(--accent)]">
                kg CO₂e/yr
              </span>
            </div>
            <div className="mt-1.5 text-[11px] font-mono text-[var(--accent-soft)] flex items-center gap-1">
              <Activity className="w-3 h-3 animate-pulse text-[var(--accent)]" />+
              {(142.8 + liveMicroGramsOffset / 1000).toFixed(4)} g session live
            </div>
          </div>

          <div className="rounded-[var(--radius-control)] bg-[var(--background)] border border-[var(--border)] p-3">
            <span className="text-xs text-[var(--muted)] block">
              Canopy Health Index
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-medium font-mono text-[var(--foreground)]">
                {avgHealthScore}
              </span>
              <span className="text-xs font-medium text-[var(--muted)]">/ 100</span>
            </div>
            <div className="mt-1.5 text-[11px] text-[var(--muted)] flex items-center justify-between">
              <span>{filteredTrees.length} Verified Assets</span>
              <span className="text-[var(--accent)] font-medium">100% Quota</span>
            </div>
          </div>
        </div>

        {mode === 'PRE_HANDOVER_AUDIT' && (
          <div className="mt-2 pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Pre-Handover DLP Tree Quota Verification</span>
            <span className="font-mono font-medium text-[var(--verification)]">
              {filteredTrees.length} / {filteredTrees.length} Planted &amp; Tagged
            </span>
          </div>
        )}
      </section>

      {/* 3. Search & Active QR Scan Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Tree ID (e.g. ELM-042), species, or precinct..."
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

        {scannedTreeId && (
          <div className="flex items-center justify-between rounded-[var(--radius-control)] bg-[var(--surface-raised)] border border-[var(--control-border)] px-3.5 py-2.5 text-xs text-[var(--foreground)]">
            <span className="flex items-center gap-1.5 font-medium">
              <QrCode className="w-3.5 h-3.5 text-[var(--accent)]" />
              Filtered by QR Tag: <strong className="font-mono">{scannedTreeId}</strong>
            </span>
            <button
              type="button"
              onClick={() => setScannedTreeId(null)}
              className="text-[var(--accent)] hover:text-[var(--foreground)] underline text-xs cursor-pointer"
            >
              Show All
            </button>
          </div>
        )}
      </div>

      {/* 4. Botanical Passport Plates List */}
      <section aria-label="Tree Asset Registry" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
            <Trees className="w-3.5 h-3.5 text-[var(--accent)]" />
            Botanical Passport Registry ({filteredTrees.length})
          </h2>
          <button
            type="button"
            onClick={loadData}
            className="min-h-[36px] px-2.5 rounded-[var(--radius-control)] inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-[var(--radius-panel)] bg-[var(--surface)] border border-[var(--border)] p-4 animate-pulse space-y-3"
              >
                <div className="flex justify-between">
                  <div className="h-4 w-24 bg-[var(--surface-raised)] rounded" />
                  <div className="h-4 w-32 bg-[var(--surface-raised)] rounded" />
                </div>
                <div className="h-5 w-48 bg-[var(--surface-raised)] rounded" />
                <div className="h-2 w-full bg-[var(--surface-raised)] rounded" />
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="h-12 bg-[var(--surface-raised)] rounded-[var(--radius-control)]" />
                  <div className="h-12 bg-[var(--surface-raised)] rounded-[var(--radius-control)]" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTrees.length === 0 ? (
          <div className="rounded-[var(--radius-panel)] bg-[var(--surface)] border border-[var(--border)] p-8 text-center space-y-3">
            <div className="w-11 h-11 rounded-full bg-[var(--surface-raised)] flex items-center justify-center mx-auto text-[var(--accent)]">
              <Filter className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-[var(--foreground)]">
                No Matching Tree Assets
              </p>
              <p className="text-xs text-[var(--muted)] max-w-xs mx-auto leading-relaxed">
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
              className="button button--secondary"
            >
              Reset Precinct Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredTrees.map((tree) => {
              const handoverBadge = formatHandoverBadge(tree.handover_status);
              const healthStyle = getHealthBadgeMeta(tree.health_score);

              return (
                <article
                  key={tree.id}
                  className="surface-panel p-4 space-y-3.5 transition-colors hover:border-[var(--control-border)]"
                  style={{
                    background:
                      'linear-gradient(160deg, var(--surface) 0%, var(--surface-raised) 100%)',
                  }}
                >
                  {/* Top Botanical Passport Plate Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-[var(--border)] pb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-medium px-2.5 py-0.5 rounded-[var(--radius-pill)] bg-[var(--background)] text-[var(--accent)] border border-[var(--border)]">
                          <Fingerprint className="w-3 h-3" />
                          {tree.id}
                        </span>
                        <StatusBadge tone={handoverBadge.tone}>
                          {handoverBadge.label}
                        </StatusBadge>
                      </div>
                      <h3 className="text-base font-medium text-[var(--foreground)] mt-2 tracking-tight">
                        {tree.common_name}
                      </h3>
                      <p className="text-xs italic text-[var(--muted)]">
                        {tree.species}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <StatusBadge tone={healthStyle.tone}>
                        {healthStyle.label}
                      </StatusBadge>
                      <p className="text-xs text-[var(--muted)] mt-1.5 flex items-center justify-end gap-1">
                        <MapPin className="w-3 h-3 text-[var(--accent)]" />
                        {tree.precinct}
                      </p>
                    </div>
                  </div>

                  {/* Metrics Grid: Carbon Baseline & Health Score */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-[var(--radius-control)] bg-[var(--background)] border border-[var(--border)] p-3">
                      <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                        <Leaf className="w-3.5 h-3.5 text-[var(--accent)]" />
                        <span>Carbon Baseline</span>
                      </div>
                      <p className="text-sm font-medium font-mono text-[var(--foreground)] mt-1">
                        {Number(tree.co2_kg_per_year).toFixed(2)}{' '}
                        <span className="text-xs font-normal text-[var(--accent-soft)]">
                          kg CO₂/yr
                        </span>
                      </p>
                    </div>

                    <div className="rounded-[var(--radius-control)] bg-[var(--background)] border border-[var(--border)] p-3">
                      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                        <span>Canopy Health</span>
                        <span className="font-mono font-medium text-[var(--foreground)]">
                          {tree.health_score}/100
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-[var(--radius-pill)] bg-[var(--surface)] overflow-hidden mt-2">
                        <div
                          className="h-full rounded-[var(--radius-pill)]"
                          style={{
                            width: `${tree.health_score}%`,
                            backgroundColor: healthStyle.barColor,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Metadata & Actions Footer */}
                  <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
                    <div className="truncate font-mono text-[11px] text-[var(--muted)]">
                      GPS: {Number(tree.latitude).toFixed(4)}°N,{' '}
                      {Number(tree.longitude).toFixed(4)}°E • Planted{' '}
                      {new Date(tree.planted_at).toLocaleDateString('en-MY', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>

                    <Link
                      href={`/app/hazards?treeId=${encodeURIComponent(tree.id)}`}
                      className="min-h-[38px] shrink-0 inline-flex items-center gap-1.5 rounded-[var(--radius-control)] bg-[var(--background)] hover:bg-[var(--surface)] border border-[var(--control-border)] px-3 py-1.5 text-xs font-medium text-[var(--status-warning)] transition-colors"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
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
          className="fixed inset-0 z-50 bg-[var(--scrim)] backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-[var(--radius-dialog)] bg-[var(--surface)] border border-[var(--control-border)] p-5 space-y-4 shadow-[var(--shadow-panel)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="text-sm font-medium text-[var(--foreground)]">
                  Scan Physical Tree QR Plaque
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                className="w-10 h-10 grid place-items-center rounded-full text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)]"
                aria-label="Close QR modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--muted)] leading-relaxed">
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
                  className="w-full flex items-center justify-between rounded-[var(--radius-control)] bg-[var(--background)] hover:bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-left transition-colors cursor-pointer"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium text-[var(--accent)]">
                        {tree.id}
                      </span>
                      <span className="text-xs font-medium text-[var(--foreground)]">
                        {tree.common_name}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-[var(--muted)] mt-0.5 truncate max-w-[240px]">
                      QR Hash: {tree.qr_code_hash}
                    </p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
