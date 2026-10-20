'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Cpu,
  Eye,
  Filter,
  Image as ImageIcon,
  MapPin,
  Plus,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import {
  fetchHazards,
  fetchTrees,
  runAiTriage,
  submitHazardReport,
} from '@/lib/api';
import {
  HazardReport,
  HazardStatus,
  HazardType,
  TriageResponse,
  Tree,
} from '@/lib/types';

const STEPPER_STEPS: { key: HazardStatus; label: string }[] = [
  { key: 'REPORTED', label: 'Reported' },
  { key: 'TRIAGED', label: 'AI Triaged' },
  { key: 'DISPATCHED', label: 'Dispatched' },
  { key: 'RESOLVED', label: 'Resolved' },
];

const HAZARD_TYPES: { value: HazardType; label: string; hint: string }[] = [
  {
    value: 'DRY_FOLIAGE',
    label: 'Dry Foliage / Desiccation',
    hint: 'Leaf scorch, wilting crown, or soil drought stress',
  },
  {
    value: 'STORM_DAMAGE',
    label: 'Storm / Structural Limb Damage',
    hint: 'Cracked bough, leaning trunk, or hanging branch',
  },
  {
    value: 'ROOT_HEAVE',
    label: 'Root Heave / Paver Uplift',
    hint: 'Surface roots cracking walkway or drain slabs',
  },
  {
    value: 'PEST',
    label: 'Pest / Fungal Infection',
    hint: 'Bark borers, fungal brackets, or leaf defoliation',
  },
];

const SAMPLE_EVIDENCE_PHOTOS: Record<HazardType, string> = {
  DRY_FOLIAGE:
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=900&q=80',
  STORM_DAMAGE:
    'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=900&q=80',
  ROOT_HEAVE:
    'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=900&q=80',
  PEST: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80',
};

export default function HazardsPage() {
  const [hazards, setHazards] = useState<HazardReport[]>([]);
  const [trees, setTrees] = useState<Tree[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<HazardStatus | 'ALL'>('ALL');
  const [previewHazard, setPreviewHazard] = useState<HazardReport | null>(null);

  // Drawer & Form State
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [selectedTreeId, setSelectedTreeId] = useState<string>('ELM-042');
  const [hazardType, setHazardType] = useState<HazardType>('DRY_FOLIAGE');
  const [description, setDescription] = useState<string>('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string>(
    SAMPLE_EVIDENCE_PHOTOS.DRY_FOLIAGE
  );
  const [photoSourceLabel, setPhotoSourceLabel] = useState<string>(
    'Default field camera frame'
  );
  const [triagePreview, setTriagePreview] = useState<TriageResponse | null>(
    null
  );
  const [triaging, setTriaging] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadAll = async () => {
    setLoading(true);
    const [hazardList, treeList] = await Promise.all([
      fetchHazards(),
      fetchTrees(),
    ]);
    setHazards(hazardList);
    setTrees(treeList);
    if (treeList.length > 0 && !selectedTreeId) {
      setSelectedTreeId(treeList[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const treeIdParam = params.get('treeId');
      if (treeIdParam) {
        setSelectedTreeId(treeIdParam);
        setDrawerOpen(true);
      }
    }
  }, []);

  const filteredHazards = useMemo(() => {
    if (statusFilter === 'ALL') return hazards;
    return hazards.filter((h) => h.status === statusFilter);
  }, [hazards, statusFilter]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoSourceLabel(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoDataUrl(reader.result);
        setTriagePreview(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRunTriagePreview = async () => {
    setTriaging(true);
    const res = await runAiTriage(
      hazardType,
      description || 'Resident field observation submitted via mobile PWA.',
      photoDataUrl
    );
    setTriagePreview(res);
    setTriaging(false);
  };

  const handleSubmitHazard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoDataUrl) return;
    setSubmitting(true);

    const targetTree = trees.find((t) => t.id === selectedTreeId);
    const created = await submitHazardReport({
      tree_id: selectedTreeId,
      reporter_id: 'RES-9402 (Mobile Verified)',
      hazard_type: hazardType,
      description:
        description.trim() ||
        `Field hazard flagged on ${selectedTreeId} (${hazardType.replace(
          '_',
          ' '
        )}).`,
      evidence_photo_url: photoDataUrl,
      latitude: targetTree ? Number(targetTree.latitude) : 3.189412,
      longitude: targetTree ? Number(targetTree.longitude) : 101.516284,
    });

    setHazards((prev) => [
      created,
      ...prev.filter((item) => item.id !== created.id),
    ]);
    setSubmitting(false);
    setDrawerOpen(false);
    setDescription('');
    setTriagePreview(null);
  };

  const getStepIndex = (status: HazardStatus): number => {
    return STEPPER_STEPS.findIndex((s) => s.key === status);
  };

  const getSeverityBadge = (severity: HazardReport['ai_severity_grade']) => {
    switch (severity) {
      case 'CRITICAL_24H':
        return {
          label: 'CRITICAL • 24H SLA',
          className: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
        };
      case 'MEDIUM':
        return {
          label: 'MEDIUM • 72H SLA',
          className: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
        };
      case 'LOW':
      default:
        return {
          label: 'LOW • ROUTINE SLA',
          className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
        };
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Top Banner & Report CTA */}
      <section className="rounded-2xl bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-900 border border-amber-500/30 p-4 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" />
              <span>Civic Hazard & SLA Feed</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every resident report is triaged by{' '}
              <span className="text-white font-medium">Gemini Vision AI</span>{' '}
              and bound to an automated contractor SLA countdown.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2.5 text-xs shadow-md transition-colors"
          >
            <Camera className="w-4 h-4" />
            <span>Report Hazard</span>
          </button>
        </div>
      </section>

      {/* Status Filter Pills */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {(
            [
              { key: 'ALL', label: `All (${hazards.length})` },
              { key: 'REPORTED', label: 'Reported' },
              { key: 'TRIAGED', label: 'AI Triaged' },
              { key: 'DISPATCHED', label: 'Dispatched' },
              { key: 'RESOLVED', label: 'Resolved' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                statusFilter === tab.key
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={loadAll}
          className="shrink-0 inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Sync
        </button>
      </div>

      {/* Incident Feed */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-4 animate-pulse space-y-3"
            >
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-slate-800 rounded" />
                <div className="h-4 w-28 bg-slate-800 rounded" />
              </div>
              <div className="h-10 w-full bg-slate-800 rounded-xl" />
              <div className="h-32 w-full bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredHazards.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
            <Filter className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-200">
              No Incidents in This Stage
            </p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              There are currently no civic hazard reports matching the{' '}
              <strong>{statusFilter}</strong> status filter.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className="rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200"
            >
              Show All Incidents
            </button>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-1 rounded-xl bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-300"
            >
              <Plus className="w-3.5 h-3.5" />
              New Report
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredHazards.map((hazard) => {
            const activeIdx = getStepIndex(hazard.status);
            const severityBadge = getSeverityBadge(hazard.ai_severity_grade);

            return (
              <article
                key={hazard.id}
                className="rounded-2xl bg-slate-900/95 border border-slate-800/90 p-4 space-y-3.5 shadow-md"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-800 text-emerald-400 border border-slate-700">
                        {hazard.tree_id}
                      </span>
                      <span className="text-xs font-semibold text-white">
                        {hazard.hazard_type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>
                        Incident #{hazard.id} •{' '}
                        {new Date(hazard.reported_at).toLocaleString('en-MY', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${severityBadge.className}`}
                  >
                    {severityBadge.label}
                  </span>
                </div>

                {/* 4-Stage Status Stepper: Reported -> AI Triaged -> Dispatched -> Resolved */}
                <div
                  aria-label="Incident Status Stepper"
                  className="rounded-xl bg-slate-950/90 border border-slate-800/80 p-3"
                >
                  <div className="grid grid-cols-4 gap-1 relative">
                    {STEPPER_STEPS.map((step, idx) => {
                      const isCompleted = idx <= activeIdx;
                      const isCurrent = idx === activeIdx;
                      return (
                        <div
                          key={step.key}
                          className="flex flex-col items-center text-center"
                        >
                          <div className="flex items-center w-full justify-center mb-1.5">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                                isCurrent
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-300 ring-4 ring-emerald-500/20'
                                  : isCompleted
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-slate-900 text-slate-500 border-slate-800'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                idx + 1
                              )}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-semibold leading-tight ${
                              isCurrent
                                ? 'text-emerald-300'
                                : isCompleted
                                ? 'text-slate-300'
                                : 'text-slate-500'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Evidence Photo & Description */}
                <div className="flex gap-3 items-start">
                  <button
                    type="button"
                    onClick={() => setPreviewHazard(hazard)}
                    className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-700 shrink-0 group bg-slate-950"
                  >
                    <img
                      src={hazard.evidence_photo_url}
                      alt={`Hazard evidence for ${hazard.tree_id}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-semibold text-white transition-opacity">
                      <Eye className="w-4 h-4" />
                    </span>
                  </button>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="text-xs text-slate-200 leading-relaxed line-clamp-3">
                      {hazard.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-950 border border-slate-800 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                        <Cpu className="w-3 h-3" />
                        AI Confidence: {Math.round(hazard.ai_confidence * 100)}%
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {Number(hazard.latitude).toFixed(4)}°N,{' '}
                        {Number(hazard.longitude).toFixed(4)}°E
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recommended SLA Action Footer */}
                {hazard.recommended_sla_action && (
                  <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 px-3 py-2 flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-slate-400 truncate">
                      <strong className="text-slate-200">SLA Prescription:</strong>{' '}
                      {hazard.recommended_sla_action}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewHazard(hazard)}
                      className="shrink-0 text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      Inspect
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Photo Inspection Modal */}
      {previewHazard && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Hazard Evidence Inspection"
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  {previewHazard.tree_id}
                </span>
                <h3 className="text-sm font-bold text-white">
                  Incident #{previewHazard.id} •{' '}
                  {previewHazard.hazard_type.replace('_', ' ')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewHazard(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative h-64 bg-slate-950">
              <img
                src={previewHazard.evidence_photo_url}
                alt={`Evidence for ${previewHazard.tree_id}`}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-3 left-3 rounded-lg bg-slate-950/85 border border-slate-700 px-2.5 py-1 text-[10px] font-mono text-emerald-300">
                Reporter: {previewHazard.reporter_id}
              </span>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-200 leading-relaxed">
                {previewHazard.description}
              </p>
              {previewHazard.detected_issues &&
                previewHazard.detected_issues.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {previewHazard.detected_issues.map((issue) => (
                      <span
                        key={issue}
                        className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-medium text-amber-300"
                      >
                        Detected: {issue}
                      </span>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Photo Capture / Upload Drawer */}
      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Report Tree Hazard Drawer"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end justify-center"
        >
          <div className="w-full max-w-md rounded-t-3xl bg-slate-900 border-t border-x border-slate-800 p-4 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Report Civic Tree Hazard
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Geofenced Photo Capture & Gemini Vision Triage
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitHazard} className="space-y-3.5">
              {/* Select Tree ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Tree Asset ID
                </label>
                <select
                  value={selectedTreeId}
                  onChange={(e) => setSelectedTreeId(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  {trees.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id} — {t.common_name} ({t.precinct})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Hazard Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observed Hazard Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {HAZARD_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        setHazardType(type.value);
                        if (photoSourceLabel.startsWith('Default')) {
                          setPhotoDataUrl(SAMPLE_EVIDENCE_PHOTOS[type.value]);
                        }
                        setTriagePreview(null);
                      }}
                      className={`rounded-xl p-2.5 text-left border transition-all ${
                        hazardType === type.value
                          ? 'bg-amber-500/15 border-amber-500/50 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-semibold">{type.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        {type.hint}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera Capture / Upload Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Photographic Evidence (Required)
                  </label>
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[170px]">
                    {photoSourceLabel}
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="relative h-40 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                  <img
                    src={photoDataUrl}
                    alt="Selected hazard evidence"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      Capture / Upload Photo
                    </button>

                    <button
                      type="button"
                      onClick={handleRunTriagePreview}
                      disabled={triaging}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/90 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 text-xs font-bold shadow-lg disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {triaging ? 'Analyzing...' : 'Run AI Triage'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Live AI Vision Triage Output Card */}
              {triagePreview && (
                <div className="rounded-xl bg-slate-950 border border-emerald-500/40 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5" />
                      Gemini 3.8 Flash Vision Assessment
                    </span>
                    <span className="text-[10px] font-mono text-slate-300">
                      Confidence: {Math.round(triagePreview.confidence * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                      {triagePreview.severity_grade}
                    </span>
                    <span className="text-slate-300 text-[11px]">
                      Canopy Score: <strong>{triagePreview.health_score}/100</strong>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    <strong>Recommended SLA:</strong>{' '}
                    {triagePreview.recommended_sla_action}
                  </p>
                </div>
              )}

              {/* Field Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Location & Observation Notes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe branch condition, walkway obstruction, or root uplift..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="w-1/3 rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-2/3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 text-xs shadow-lg disabled:opacity-50"
                >
                  {submitting
                    ? 'Submitting & Triaging...'
                    : 'Submit Incident to SLA Queue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
