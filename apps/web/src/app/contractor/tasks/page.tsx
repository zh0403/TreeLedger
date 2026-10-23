'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock,
  ExternalLink,
  HardHat,
  MapPin,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
  Wrench,
  X,
} from 'lucide-react';
import {
  fetchHazards,
  resolveContractorTask,
  updateHazardStatus,
} from '@/lib/api';
import {
  HazardReport,
  MaintenanceActionType,
  MaintenanceRecord,
} from '@/lib/types';
import { StatusBadge } from '@/components/ui/status-badge';

const ACTION_OPTIONS: {
  value: MaintenanceActionType;
  label: string;
  desc: string;
  sampleAfterPhoto: string;
}[] = [
  {
    value: 'DEEP_ROOT_WATERING',
    label: 'Deep-Root Watering & Biochar',
    desc: 'Sub-surface aeration + 120L hydration ring for drought stress',
    sampleAfterPhoto:
      'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=900&q=80',
  },
  {
    value: 'CANOPY_PRUNING',
    label: 'Structural Canopy Pruning',
    desc: 'Removal of fractured limbs, crown balancing & collar sealing',
    sampleAfterPhoto:
      'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=80',
  },
  {
    value: 'REPLACED_SAPLING',
    label: 'DLP Specimen Replacement',
    desc: 'Full sapling replacement & double-stake anchoring under warranty',
    sampleAfterPhoto:
      'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80',
  },
];

export default function ContractorTasksPage() {
  const [hazards, setHazards] = useState<HazardReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [queueFilter, setQueueFilter] = useState<'ACTIVE' | 'RESOLVED'>(
    'ACTIVE'
  );
  const [activeTask, setActiveTask] = useState<HazardReport | null>(null);
  const [actionType, setActionType] = useState<MaintenanceActionType>(
    'DEEP_ROOT_WATERING'
  );
  const [afterPhotoUrl, setAfterPhotoUrl] = useState<string>('');
  const [afterPhotoName, setAfterPhotoName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [resolving, setResolving] = useState<boolean>(false);
  const [lastReceipt, setLastReceipt] = useState<MaintenanceRecord | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadQueue = async () => {
    setLoading(true);
    const list = await fetchHazards();
    setHazards(list);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    void fetchHazards().then((data) => {
      if (active) {
        setHazards(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const filteredTasks = useMemo(() => {
    const subset = hazards.filter((h) =>
      queueFilter === 'ACTIVE'
        ? h.status !== 'RESOLVED'
        : h.status === 'RESOLVED'
    );

    const weight = (s: HazardReport['ai_severity_grade']) =>
      s === 'CRITICAL_24H' ? 3 : s === 'MEDIUM' ? 2 : 1;

    return [...subset].sort(
      (a, b) => weight(b.ai_severity_grade) - weight(a.ai_severity_grade)
    );
  }, [hazards, queueFilter]);

  const activeCount = useMemo(
    () => hazards.filter((h) => h.status !== 'RESOLVED').length,
    [hazards]
  );

  const criticalCount = useMemo(
    () =>
      hazards.filter(
        (h) => h.status !== 'RESOLVED' && h.ai_severity_grade === 'CRITICAL_24H'
      ).length,
    [hazards]
  );

  const handleDispatch = async (hazardId: number) => {
    const updated = await updateHazardStatus(hazardId, 'DISPATCHED');
    setHazards(updated);
  };

  const openResolveModal = (task: HazardReport) => {
    setActiveTask(task);
    const defaultAction: MaintenanceActionType =
      task.hazard_type === 'DRY_FOLIAGE'
        ? 'DEEP_ROOT_WATERING'
        : task.hazard_type === 'STORM_DAMAGE'
        ? 'CANOPY_PRUNING'
        : 'REPLACED_SAPLING';
    setActionType(defaultAction);
    const preset = ACTION_OPTIONS.find((a) => a.value === defaultAction);
    setAfterPhotoUrl(preset?.sampleAfterPhoto || '');
    setAfterPhotoName('Geofenced field camera ready');
    setNotes(
      `Resolved incident #${task.id} on ${task.tree_id}: ${
        task.recommended_sla_action ||
        'Completed prescribed arborist intervention.'
      }`
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAfterPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAfterPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCompleteWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !afterPhotoUrl) return;
    setResolving(true);

    const { record, updatedHazards } = await resolveContractorTask({
      hazard_id: activeTask.id,
      tree_id: activeTask.tree_id,
      contractor_id: 'ARB-SD-04 (Elmina GreenWorks)',
      action_type: actionType,
      before_photo_url: activeTask.evidence_photo_url,
      after_photo_url: afterPhotoUrl,
      notes:
        notes.trim() ||
        `Completed ${actionType.replace('_', ' ')} on ${activeTask.tree_id}.`,
    });

    setHazards(updatedHazards);
    setLastReceipt(record);
    setResolving(false);
    setActiveTask(null);
  };

  return (
    <div className="space-y-5 font-sans text-[var(--foreground)]">
      {/* Contractor SLA Summary Header (High Outdoor Contrast) */}
      <section
        className="surface-panel p-5 space-y-4"
        style={{
          background:
            'radial-gradient(ellipse at top right, var(--ambient), transparent 65%), var(--surface)',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[var(--accent)] text-xs font-medium uppercase tracking-wider">
            <HardHat className="w-4 h-4" />
            <span>Contractor Field Work Order Queue</span>
          </div>
          <span className="rounded-[var(--radius-pill)] bg-[var(--background)] border border-[var(--control-border)] px-3 py-1 text-xs font-mono text-[var(--accent-soft)]">
            Crew: ARB-SD-04
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-[var(--radius-control)] bg-[var(--background)] border border-[var(--border)] p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-[var(--muted)] block">
                Open Work Orders
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-medium font-mono text-[var(--foreground)]">
                  {activeCount}
                </span>
                <span className="text-xs text-[var(--status-warning)] font-medium">
                  Pending Proof-of-Work
                </span>
              </div>
            </div>
            <Wrench className="w-6 h-6 text-[var(--accent)]" />
          </div>

          <div className="rounded-[var(--radius-control)] bg-[var(--background)] border border-[var(--border)] p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-[var(--muted)] block">
                24H Critical SLA Countdown
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className="text-3xl font-medium font-mono"
                  style={{ color: 'var(--status-critical-text)' }}
                >
                  {criticalCount}
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: 'var(--status-critical-text)' }}
                >
                  Immediate Dispatch
                </span>
              </div>
            </div>
            <Clock className="w-6 h-6 text-[var(--status-warning)]" />
          </div>
        </div>
      </section>

      {/* Recently Minted Arbitrum Receipt Banner */}
      {lastReceipt && (
        <div
          className="surface-panel p-4 space-y-2.5"
          style={{
            borderColor: 'var(--proof-400)',
            background: 'var(--surface-raised)',
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-[var(--proof-400)] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[var(--proof-400)]" />
              Proof-of-Work Verified &amp; Anchored on Arbitrum
            </span>
            <button
              type="button"
              onClick={() => setLastReceipt(null)}
              className="min-h-[44px] min-w-[44px] grid place-items-center rounded-full text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
              aria-label="Dismiss receipt notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-[var(--foreground)]">
            Tree <strong>{lastReceipt.tree_id}</strong> maintenance receipt
            recorded. Tx:{' '}
            <code className="font-mono text-[var(--proof-400)]">
              {lastReceipt.arbitrum_tx_hash.slice(0, 14)}...
            </code>
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <Link
              href="/app/maintenance"
              className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:text-[var(--foreground)]"
            >
              View Public Audit Stream <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <a
              href={`https://sepolia.arbiscan.io/tx/${lastReceipt.arbitrum_tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-medium text-[var(--proof-400)] hover:text-[var(--foreground)]"
            >
              Arbiscan Receipt <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Queue Filter Tabs (44px tap targets) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-[var(--radius-pill)] bg-[var(--surface)] border border-[var(--border)] p-1 gap-1">
          <button
            type="button"
            onClick={() => setQueueFilter('ACTIVE')}
            aria-pressed={queueFilter === 'ACTIVE'}
            className={`min-h-[44px] rounded-[var(--radius-pill)] px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
              queueFilter === 'ACTIVE'
                ? 'bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            Active Queue ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setQueueFilter('RESOLVED')}
            aria-pressed={queueFilter === 'RESOLVED'}
            className={`min-h-[44px] rounded-[var(--radius-pill)] px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
              queueFilter === 'RESOLVED'
                ? 'bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            Resolved ({hazards.length - activeCount})
          </button>
        </div>

        <button
          type="button"
          onClick={loadQueue}
          className="min-h-[44px] px-3.5 rounded-[var(--radius-control)] inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] bg-[var(--surface)] border border-[var(--border)] cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Sync Queue
        </button>
      </div>

      {/* Work Order Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="rounded-[var(--radius-panel)] bg-[var(--surface)] border border-[var(--border)] p-4 animate-pulse space-y-3"
            >
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-[var(--surface-raised)] rounded" />
                <div className="h-4 w-28 bg-[var(--surface-raised)] rounded" />
              </div>
              <div className="h-24 w-full bg-[var(--surface-raised)] rounded-[var(--radius-control)]" />
              <div className="h-11 w-full bg-[var(--surface-raised)] rounded-[var(--radius-control)]" />
            </div>
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-[var(--radius-panel)] bg-[var(--surface)] border border-[var(--border)] p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--accent)]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--foreground)]">
              {queueFilter === 'ACTIVE'
                ? 'All Assigned Work Orders Resolved'
                : 'No Resolved Work Orders Yet'}
            </p>
            <p className="text-xs text-[var(--muted)] max-w-xs mx-auto leading-relaxed">
              {queueFilter === 'ACTIVE'
                ? 'Zero pending SLA tasks in your sector queue. Check the Resolved tab or public audit stream.'
                : 'Complete an active task with proof-of-work photo capture to populate this log.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const isCritical = task.ai_severity_grade === 'CRITICAL_24H';
            return (
              <article
                key={task.id}
                className="surface-panel p-5 space-y-4 transition-colors"
                style={{
                  borderLeft: `4px solid ${
                    isCritical && task.status !== 'RESOLVED'
                      ? 'var(--status-critical)'
                      : 'var(--accent)'
                  }`,
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-medium px-2.5 py-1 rounded-[var(--radius-pill)] bg-[var(--background)] text-[var(--accent)] border border-[var(--control-border)]">
                        WO #{task.id} • {task.tree_id}
                      </span>
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        {task.hazard_type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-1.5 flex items-center gap-1.5 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>
                        GPS: {Number(task.latitude).toFixed(4)}°N,{' '}
                        {Number(task.longitude).toFixed(4)}°E
                      </span>
                    </p>
                  </div>

                  {/* Outdoor-Contrast SLA Countdown Badge */}
                  <StatusBadge tone={isCritical ? 'critical' : 'warning'}>
                    <span
                      className="font-mono font-medium"
                      style={{
                        color: isCritical
                          ? 'var(--status-critical-text)'
                          : 'var(--status-warning)',
                      }}
                    >
                      {isCritical ? '24H SLA CRITICAL' : '72H STANDARD SLA'}
                    </span>
                  </StatusBadge>
                </div>

                {/* Before Photo & AI Prescription */}
                <div className="flex flex-col sm:flex-row gap-3.5 items-start">
                  <div className="relative w-full sm:w-28 h-28 rounded-[var(--radius-control)] overflow-hidden border border-[var(--control-border)] shrink-0 bg-[var(--background)]">
                    <img
                      src={task.evidence_photo_url}
                      alt={`Before photo for ${task.tree_id}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 rounded-[var(--radius-pill)] bg-[var(--background)]/90 px-2 py-0.5 text-[10px] font-mono font-medium text-[var(--status-critical-text)] border border-[var(--border)]">
                      BEFORE
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-sm text-[var(--foreground)] leading-relaxed">
                      {task.description}
                    </p>
                    <div className="rounded-[var(--radius-control)] bg-[var(--background)] border border-[var(--border)] px-3.5 py-2.5 text-xs text-[var(--foreground)]">
                      <strong className="text-[var(--accent-soft)] font-medium">
                        Required Action:
                      </strong>{' '}
                      {task.recommended_sla_action ||
                        'Field arborist inspection & remedial maintenance'}
                    </div>
                  </div>
                </div>

                {/* Execution Controls (44px minimum height) */}
                {task.status !== 'RESOLVED' ? (
                  <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                      <Clock className="w-4 h-4 text-[var(--status-warning)]" />
                      <span>
                        Status:{' '}
                        <strong className="text-[var(--foreground)] font-mono">
                          {task.status}
                        </strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {task.status !== 'DISPATCHED' && (
                        <button
                          type="button"
                          onClick={() => handleDispatch(task.id)}
                          className="button button--secondary"
                        >
                          <Play className="w-3.5 h-3.5 text-[var(--status-warning)]" />
                          Dispatch Crew
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openResolveModal(task)}
                        className="button button--primary"
                      >
                        <Camera className="w-4 h-4" />
                        Upload Proof-of-Work
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--accent)]">
                    <span className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Resolved with Verified Proof-of-Work
                    </span>
                    <Link
                      href="/app/maintenance"
                      className="min-h-[44px] inline-flex items-center text-xs underline text-[var(--proof-400)] hover:text-[var(--foreground)]"
                    >
                      View Audit Receipt
                    </Link>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Proof-of-Work Upload & Task Resolution Dialog (field-workspace style) */}
      {activeTask && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Upload Proof-of-Work to Resolve Task"
          className="fixed inset-0 z-50 bg-[var(--scrim)] backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="w-full max-w-lg rounded-t-[var(--radius-dialog)] sm:rounded-[var(--radius-dialog)] bg-[var(--surface)] border border-[var(--control-border)] p-5 max-h-[92vh] overflow-y-auto space-y-4 shadow-[var(--shadow-panel)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-[var(--radius-control)] bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-medium text-[var(--foreground)]">
                    Submit Proof-of-Work • {activeTask.tree_id}
                  </h2>
                  <p className="text-xs text-[var(--muted)]">
                    Work Order #{activeTask.id} • Geofenced AI Verification
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTask(null)}
                className="w-11 h-11 grid place-items-center rounded-full text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)] cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteWorkOrder} className="space-y-4">
              {/* Action Type Selector */}
              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-2">
                  Executed Maintenance Protocol
                </label>
                <div className="space-y-2">
                  {ACTION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setActionType(opt.value);
                        if (afterPhotoName === 'Geofenced field camera ready') {
                          setAfterPhotoUrl(opt.sampleAfterPhoto);
                        }
                      }}
                      className={`w-full min-h-[56px] rounded-[var(--radius-control)] p-3 text-left border transition-all cursor-pointer ${
                        actionType === opt.value
                          ? 'bg-[var(--surface-raised)] border-[var(--accent)] text-[var(--foreground)]'
                          : 'bg-[var(--background)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[var(--foreground)]">
                          {opt.label}
                        </span>
                        <span className="font-mono text-[11px] text-[var(--accent)]">
                          {opt.value}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted)] mt-1">
                        {opt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Side-by-Side Before & After Proof-of-Work Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[var(--foreground)]">
                    Before vs. After Photographic Evidence
                  </label>
                  <span className="text-xs font-mono text-[var(--accent-soft)] truncate max-w-[180px]">
                    {afterPhotoName}
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="relative h-36 rounded-[var(--radius-control)] overflow-hidden border border-[var(--border)] bg-[var(--background)]">
                    <img
                      src={activeTask.evidence_photo_url}
                      alt="Reported before condition"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 rounded-[var(--radius-pill)] bg-[var(--background)]/90 border border-[var(--border)] px-2.5 py-0.5 text-[10px] font-mono font-medium text-[var(--status-critical-text)]">
                      BEFORE (INCIDENT)
                    </span>
                  </div>

                  <div className="relative h-36 rounded-[var(--radius-control)] overflow-hidden border border-[var(--proof-400)]/50 bg-[var(--background)]">
                    {afterPhotoUrl ? (
                      <img
                        src={afterPhotoUrl}
                        alt="After completion proof"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-[var(--muted)]">
                        No photo selected
                      </div>
                    )}
                    <span className="absolute top-2 left-2 rounded-[var(--radius-pill)] bg-[var(--background)]/90 border border-[var(--proof-400)]/50 px-2.5 py-0.5 text-[10px] font-mono font-medium text-[var(--proof-400)]">
                      AFTER (PROOF)
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="min-h-[40px] absolute bottom-2 inset-x-2 inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-control)] bg-[var(--background)]/95 hover:bg-[var(--surface-raised)] border border-[var(--control-border)] px-2.5 py-1.5 text-xs font-medium text-[var(--foreground)] shadow cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[var(--accent)]" />
                      Capture / Upload
                    </button>
                  </div>
                </div>
              </div>

              {/* Arborist Field Notes */}
              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">
                  Arborist Completion Log
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Document completed pruning clearance, hydration volume, or staking specs..."
                  className="w-full rounded-[var(--radius-control)] bg-[var(--background)] border border-[var(--control-border)] p-3 text-xs text-[var(--foreground)] placeholder:text-[var(--muted)]"
                />
              </div>

              {/* On-Chain Attestation Notice */}
              <div className="rounded-[var(--radius-control)] bg-[var(--background)] border border-[var(--border)] p-3 flex items-center gap-2.5 text-xs text-[var(--muted)]">
                <Sparkles className="w-4 h-4 text-[var(--proof-400)] shrink-0" />
                <span>
                  Submitting triggers vision verification and writes a{' '}
                  <code className="font-mono text-[var(--proof-400)]">
                    keccak256
                  </code>{' '}
                  audit log to Arbitrum Sepolia.
                </span>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTask(null)}
                  className="button button--secondary w-1/3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving || !afterPhotoUrl}
                  className="button button--primary w-2/3"
                >
                  {resolving
                    ? 'Verifying & Minting Audit Log...'
                    : 'Verify PoW & Resolve Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
