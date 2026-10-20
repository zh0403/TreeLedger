'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
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
    loadQueue();
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
        task.recommended_sla_action || 'Completed prescribed arborist intervention.'
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
    <div className="p-4 space-y-4">
      {/* Contractor SLA Summary Header */}
      <section className="rounded-2xl bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/30 p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <HardHat className="w-4 h-4" />
            <span>Contractor Work Order Queue</span>
          </div>
          <span className="rounded-md bg-slate-950/80 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-amber-300">
            Crew: ARB-SD-04
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3">
            <span className="text-[11px] text-slate-400 block">
              Open Work Orders
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-bold font-mono text-white">
                {activeCount}
              </span>
              <span className="text-[11px] text-amber-300 font-medium">
                Pending PoW
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3">
            <span className="text-[11px] text-slate-400 block">
              24H Critical SLA
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-bold font-mono text-rose-400">
                {criticalCount}
              </span>
              <span className="text-[11px] text-rose-300 font-medium">
                High Priority
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Recently Minted Arbitrum Receipt Banner */}
      {lastReceipt && (
        <div className="rounded-2xl bg-emerald-950/40 border border-emerald-500/40 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Proof-of-Work Verified & Anchored on Arbitrum
            </span>
            <button
              type="button"
              onClick={() => setLastReceipt(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-300">
            Tree <strong>{lastReceipt.tree_id}</strong> maintenance receipt
            recorded. Tx:{' '}
            <code className="font-mono text-emerald-300">
              {lastReceipt.arbitrum_tx_hash.slice(0, 14)}...
            </code>
          </p>
          <div className="flex items-center gap-3 pt-0.5">
            <Link
              href="/app/maintenance"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
            >
              View Public Audit Stream <ArrowRight className="w-3 h-3" />
            </Link>
            <a
              href={`https://sepolia.arbiscan.io/tx/${lastReceipt.arbitrum_tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300"
            >
              Arbiscan Receipt <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Queue Filter Tabs */}
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-1">
          <button
            type="button"
            onClick={() => setQueueFilter('ACTIVE')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              queueFilter === 'ACTIVE'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Active Queue ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setQueueFilter('RESOLVED')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              queueFilter === 'RESOLVED'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Resolved ({hazards.length - activeCount})
          </button>
        </div>

        <button
          type="button"
          onClick={loadQueue}
          className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Sync Queue
        </button>
      </div>

      {/* Work Order Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-4 animate-pulse space-y-3"
            >
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-slate-800 rounded" />
                <div className="h-4 w-28 bg-slate-800 rounded" />
              </div>
              <div className="h-24 w-full bg-slate-800 rounded-xl" />
              <div className="h-10 w-full bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-200">
              {queueFilter === 'ACTIVE'
                ? 'All Assigned Work Orders Resolved'
                : 'No Resolved Work Orders Yet'}
            </p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {queueFilter === 'ACTIVE'
                ? 'Zero pending SLA tasks in your sector queue. Check the Resolved tab or public audit stream.'
                : 'Complete an active task with proof-of-work photo capture to populate this log.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredTasks.map((task) => {
            const isCritical = task.ai_severity_grade === 'CRITICAL_24H';
            return (
              <article
                key={task.id}
                className={`rounded-2xl bg-slate-900/95 border p-4 space-y-3.5 shadow-md ${
                  isCritical && task.status !== 'RESOLVED'
                    ? 'border-rose-500/40'
                    : 'border-slate-800/90'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-800 text-emerald-400 border border-slate-700">
                        WO #{task.id} • {task.tree_id}
                      </span>
                      <span className="text-xs font-semibold text-white">
                        {task.hazard_type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>
                        GPS: {Number(task.latitude).toFixed(4)}°N,{' '}
                        {Number(task.longitude).toFixed(4)}°E
                      </span>
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isCritical
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {task.ai_severity_grade === 'CRITICAL_24H'
                      ? '24H SLA CRITICAL'
                      : '72H STANDARD SLA'}
                  </span>
                </div>

                {/* Before Photo & AI Prescription */}
                <div className="flex gap-3 items-start">
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-700 shrink-0 bg-slate-950">
                    <img
                      src={task.evidence_photo_url}
                      alt={`Before photo for ${task.tree_id}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1.5 left-1.5 rounded bg-slate-950/90 px-1.5 py-0.5 text-[9px] font-bold text-rose-300 border border-rose-500/30">
                      BEFORE
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {task.description}
                    </p>
                    <div className="rounded-lg bg-slate-950/80 border border-slate-800 px-2.5 py-1.5 text-[11px] text-amber-200">
                      <strong className="text-amber-400">Required Action:</strong>{' '}
                      {task.recommended_sla_action ||
                        'Field arborist inspection & remedial maintenance'}
                    </div>
                  </div>
                </div>

                {/* Execution Controls */}
                {task.status !== 'RESOLVED' ? (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        Status:{' '}
                        <strong className="text-slate-200">{task.status}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {task.status !== 'DISPATCHED' && (
                        <button
                          type="button"
                          onClick={() => handleDispatch(task.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 text-amber-400" />
                          Dispatch Crew
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openResolveModal(task)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-2 text-xs shadow-md transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Upload Proof-of-Work
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-emerald-400">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      Resolved with Verified Proof-of-Work
                    </span>
                    <Link
                      href="/app/maintenance"
                      className="text-[11px] underline hover:text-emerald-300"
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

      {/* Proof-of-Work Upload & Task Resolution Drawer */}
      {activeTask && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Upload Proof-of-Work to Resolve Task"
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-end justify-center"
        >
          <div className="w-full max-w-md rounded-t-3xl bg-slate-900 border-t border-x border-slate-800 p-4 max-h-[92vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Submit Proof-of-Work • {activeTask.tree_id}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Work Order #{activeTask.id} • Geofenced AI Verification
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTask(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteWorkOrder} className="space-y-3.5">
              {/* Action Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Executed Maintenance Protocol
                </label>
                <div className="space-y-1.5">
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
                      className={`w-full rounded-xl p-2.5 text-left border transition-all ${
                        actionType === opt.value
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{opt.label}</span>
                        <span className="font-mono text-[10px] text-emerald-400">
                          {opt.value}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {opt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Side-by-Side Before & After Proof-of-Work Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Before vs. After Photographic Evidence
                  </label>
                  <span className="text-[10px] font-mono text-emerald-400 truncate max-w-[160px]">
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
                  <div className="relative h-36 rounded-xl overflow-hidden border border-rose-500/30 bg-slate-950">
                    <img
                      src={activeTask.evidence_photo_url}
                      alt="Reported before condition"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 rounded bg-slate-950/90 border border-rose-500/40 px-2 py-0.5 text-[9px] font-bold text-rose-300">
                      BEFORE (INCIDENT)
                    </span>
                  </div>

                  <div className="relative h-36 rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-950">
                    {afterPhotoUrl ? (
                      <img
                        src={afterPhotoUrl}
                        alt="After completion proof"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                        No photo selected
                      </div>
                    )}
                    <span className="absolute top-2 left-2 rounded bg-slate-950/90 border border-emerald-500/40 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                      AFTER (PROOF)
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 inset-x-2 inline-flex items-center justify-center gap-1 rounded-lg bg-slate-950/90 hover:bg-slate-900 border border-slate-700 py-1.5 text-[10px] font-semibold text-white shadow"
                    >
                      <Upload className="w-3 h-3 text-emerald-400" />
                      Capture / Upload Photo
                    </button>
                  </div>
                </div>
              </div>

              {/* Arborist Field Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Arborist Completion Log
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Document completed pruning clearance, hydration volume, or staking specs..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* On-Chain Attestation Notice */}
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-2.5 flex items-center gap-2 text-[11px] text-slate-300">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Submitting triggers vision verification and writes a{' '}
                  <code className="font-mono text-cyan-300">keccak256</code>{' '}
                  audit log to Arbitrum Sepolia.
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTask(null)}
                  className="w-1/3 rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving || !afterPhotoUrl}
                  className="w-2/3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 text-xs shadow-lg disabled:opacity-50"
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
