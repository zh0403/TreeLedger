'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Clock,
  Cpu,
  Eye,
  Filter,
  GitBranch,
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
import { StatusBadge } from '@/components/ui/status-badge';

const STEPPER_STEPS: { key: HazardStatus; label: string; detail: string }[] = [
  {
    key: 'REPORTED',
    label: 'Reported',
    detail: 'Citizen field observation & GPS frame logged',
  },
  {
    key: 'TRIAGED',
    label: 'AI Triaged',
    detail: 'Gemini 3.8 Vision severity & SLA graded',
  },
  {
    key: 'DISPATCHED',
    label: 'Dispatched',
    detail: 'Assigned to field arborist crew queue',
  },
  {
    key: 'RESOLVED',
    label: 'Resolved',
    detail: 'Verified proof-of-work anchored on-chain',
  },
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
    let active = true;
    void Promise.all([fetchHazards(), fetchTrees()]).then(
      ([hazardList, treeList]) => {
        if (!active) return;
        setHazards(hazardList);
        setTrees(treeList);
        const params = new URLSearchParams(window.location.search);
        const treeIdParam = params.get('treeId');
        setSelectedTreeId(treeIdParam || treeList[0]?.id || '');
        if (treeIdParam) {
          setDrawerOpen(true);
        }
        setLoading(false);
      }
    );
    return () => {
      active = false;
    };
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

  const getSeverityMeta = (
    severity: HazardReport['ai_severity_grade']
  ): {
    label: string;
    tone: 'critical' | 'warning' | 'healthy';
    colorVar: string;
    borderVar: string;
  } => {
    switch (severity) {
      case 'CRITICAL_24H':
        return {
          label: 'CRITICAL • 24H SLA',
          tone: 'critical',
          colorVar: 'var(--status-critical-text)',
          borderVar: 'var(--status-critical)',
        };
      case 'MEDIUM':
        return {
          label: 'MEDIUM • 72H SLA',
          tone: 'warning',
          colorVar: 'var(--status-warning)',
          borderVar: 'var(--status-warning)',
        };
      case 'LOW':
      default:
        return {
          label: 'LOW • ROUTINE SLA',
          tone: 'healthy',
          colorVar: 'var(--status-healthy)',
          borderVar: 'var(--status-healthy)',
        };
    }
  };

  return (
    <div className="p-4 space-y-5 font-sans text-[var(--foreground)]">
      {/* Top Banner & Report CTA */}
      <section
        className="surface-panel p-4"
        style={{
          background:
            'radial-gradient(ellipse at top right, var(--ambient), transparent 65%), var(--surface)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-[var(--status-warning)] text-xs font-medium uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" />
              <span>Civic Hazard &amp; SLA Feed</span>
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Every resident report is triaged by{' '}
              <span className="text-[var(--foreground)] font-medium">
                Gemini Vision AI
              </span>{' '}
              and bound to an automated contractor SLA countdown.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="min-h-[44px] shrink-0 inline-flex items-center gap-1.5 rounded-[var(--radius-control)] bg-[var(--accent)] hover:bg-[var(--accent-soft)] text-[var(--accent-foreground)] font-medium px-4 py-2 text-xs transition-colors cursor-pointer"
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
              aria-pressed={statusFilter === tab.key}
              className={`min-h-[38px] shrink-0 rounded-[var(--radius-pill)] px-3.5 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-foreground)]'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={loadAll}
          className="min-h-[38px] px-2.5 rounded-[var(--radius-control)] shrink-0 inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Sync
        </button>
      </div>

      {/* Incident Feed */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="rounded-[var(--radius-panel)] bg-[var(--surface)] border border-[var(--border)] p-4 animate-pulse space-y-3"
            >
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-[var(--surface-raised)] rounded" />
                <div className="h-4 w-28 bg-[var(--surface-raised)] rounded" />
              </div>
              <div className="h-24 w-full bg-[var(--surface-raised)] rounded-[var(--radius-control)]" />
              <div className="h-24 w-full bg-[var(--surface-raised)] rounded-[var(--radius-control)]" />
            </div>
          ))}
        </div>
      ) : filteredHazards.length === 0 ? (
        <div className="rounded-[var(--radius-panel)] bg-[var(--surface)] border border-[var(--border)] p-8 text-center space-y-3">
          <div className="w-11 h-11 rounded-full bg-[var(--surface-raised)] flex items-center justify-center mx-auto text-[var(--accent)]">
            <Filter className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--foreground)]">
              No Incidents in This Stage
            </p>
            <p className="text-xs text-[var(--muted)] max-w-xs mx-auto leading-relaxed">
              There are currently no civic hazard reports matching the{' '}
              <strong>{statusFilter}</strong> status filter.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className="button button--secondary"
            >
              Show All Incidents
            </button>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="button button--primary"
            >
              <Plus className="w-3.5 h-3.5" />
              New Report
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHazards.map((hazard) => {
            const activeIdx = getStepIndex(hazard.status);
            const severity = getSeverityMeta(hazard.ai_severity_grade);

            return (
              <article
                key={hazard.id}
                className="surface-panel p-4 space-y-4 transition-colors hover:border-[var(--control-border)]"
                style={{
                  borderLeft: `3px solid ${severity.borderVar}`,
                }}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-medium px-2.5 py-0.5 rounded-[var(--radius-pill)] bg-[var(--background)] text-[var(--accent)] border border-[var(--border)]">
                        {hazard.tree_id}
                      </span>
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        {hazard.hazard_type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-1 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-[var(--accent)]" />
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

                  <StatusBadge tone={severity.tone}>
                    <span style={{ color: severity.colorVar }} className="font-mono font-medium">
                      {severity.label}
                    </span>
                  </StatusBadge>
                </div>

                {/* Evidence Photo & Gemini AI Triage Summary */}
                <div className="flex gap-3.5 items-start">
                  <button
                    type="button"
                    onClick={() => setPreviewHazard(hazard)}
                    className="relative w-24 h-24 rounded-[var(--radius-control)] overflow-hidden border border-[var(--control-border)] shrink-0 group bg-[var(--background)] cursor-pointer"
                  >
                    <img
                      src={hazard.evidence_photo_url}
                      alt={`Hazard evidence for ${hazard.tree_id}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute inset-0 bg-[var(--scrim)] opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-medium text-[var(--foreground)] transition-opacity">
                      <Eye className="w-4 h-4" />
                    </span>
                  </button>

                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-xs text-[var(--foreground)] leading-relaxed line-clamp-3">
                      {hazard.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--background)] border border-[var(--border)] px-2.5 py-0.5 text-[11px] font-mono text-[var(--verification)]">
                        <Cpu className="w-3 h-3" />
                        Gemini AI Confidence: {Math.round(hazard.ai_confidence * 100)}%
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--muted)] font-mono">
                        <MapPin className="w-3 h-3 text-[var(--accent)]" />
                        {Number(hazard.latitude).toFixed(4)}°N,{' '}
                        {Number(hazard.longitude).toFixed(4)}°E
                      </span>
                    </div>
                  </div>
                </div>

                {/* Organic Minimalist Vertical Branch Progression Timeline */}
                <div
                  aria-label="Incident Status Stepper"
                  className="rounded-[var(--radius-control)] bg-[var(--background)] border border-[var(--border)] p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
                    <span className="inline-flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-[var(--accent)]" />
                      Living Resolution Branch
                    </span>
                    <span className="text-[var(--accent)]">
                      Stage {activeIdx + 1} of {STEPPER_STEPS.length}
                    </span>
                  </div>

                  <ol className="relative ml-2 border-l border-[var(--control-border)] space-y-2.5 pl-4 py-0.5 list-none">
                    {STEPPER_STEPS.map((step, idx) => {
                      const isCompleted = idx <= activeIdx;
                      const isCurrent = idx === activeIdx;

                      return (
                        <li
                          key={step.key}
                          className="relative flex items-start justify-between gap-2"
                        >
                          {/* Branch Node Marker */}
                          <span
                            className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full border flex items-center justify-center transition-all"
                            style={
                              isCurrent
                                ? {
                                    backgroundColor: 'var(--accent)',
                                    borderColor: 'var(--accent-soft)',
                                    boxShadow: '0 0 0 3px var(--ambient)',
                                  }
                                : isCompleted
                                ? {
                                    backgroundColor: 'var(--surface-raised)',
                                    borderColor: 'var(--accent)',
                                  }
                                : {
                                    backgroundColor: 'var(--background)',
                                    borderColor: 'var(--border)',
                                  }
                            }
                            aria-hidden="true"
                          />

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs font-medium"
                                style={{
                                  color: isCurrent
                                    ? 'var(--accent)'
                                    : isCompleted
                                    ? 'var(--foreground)'
                                    : 'var(--muted)',
                                }}
                              >
                                {step.label}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] font-mono px-2 py-0.2 rounded-[var(--radius-pill)] bg-[var(--surface-raised)] text-[var(--accent-soft)] border border-[var(--border)]">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[var(--muted)] leading-snug">
                              {step.detail}
                            </p>
                          </div>

                          <span className="text-[11px] font-mono text-[var(--muted)] shrink-0">
                            {isCompleted ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                            ) : (
                              `0${idx + 1}`
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>

                {/* Recommended SLA Action Footer */}
                {hazard.recommended_sla_action && (
                  <div className="rounded-[var(--radius-control)] bg-[var(--surface-raised)] border border-[var(--border)] px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
                    <span className="text-[var(--muted)] truncate">
                      <strong className="text-[var(--foreground)] font-medium">
                        SLA Prescription:
                      </strong>{' '}
                      {hazard.recommended_sla_action}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewHazard(hazard)}
                      className="shrink-0 text-[var(--accent)] hover:text-[var(--foreground)] font-medium cursor-pointer"
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
          className="fixed inset-0 z-50 bg-[var(--scrim)] backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-[var(--radius-dialog)] bg-[var(--surface)] border border-[var(--control-border)] overflow-hidden shadow-[var(--shadow-panel)]">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)]">
              <div>
                <span className="font-mono text-xs font-medium text-[var(--accent)]">
                  {previewHazard.tree_id}
                </span>
                <h3 className="text-sm font-medium text-[var(--foreground)]">
                  Incident #{previewHazard.id} •{' '}
                  {previewHazard.hazard_type.replace('_', ' ')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewHazard(null)}
                className="w-10 h-10 grid place-items-center rounded-full text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)]"
                aria-label="Close inspection modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative h-64 bg-[var(--background)]">
              <img
                src={previewHazard.evidence_photo_url}
                alt={`Evidence for ${previewHazard.tree_id}`}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-3 left-3 rounded-[var(--radius-pill)] bg-[var(--background)]/90 border border-[var(--border)] px-3 py-1 text-xs font-mono text-[var(--accent-soft)]">
                Reporter: {previewHazard.reporter_id}
              </span>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-[var(--foreground)] leading-relaxed">
                {previewHazard.description}
              </p>
              {previewHazard.detected_issues &&
                previewHazard.detected_issues.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {previewHazard.detected_issues.map((issue) => (
                      <span
                        key={issue}
                        className="rounded-[var(--radius-pill)] bg-[var(--surface-raised)] border border-[var(--border)] px-2.5 py-0.5 text-xs font-medium text-[var(--status-warning)]"
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
          className="fixed inset-0 z-50 bg-[var(--scrim)] backdrop-blur-sm flex items-end justify-center"
        >
          <div className="w-full max-w-md rounded-t-[var(--radius-dialog)] bg-[var(--surface)] border-t border-x border-[var(--control-border)] p-5 max-h-[90vh] overflow-y-auto space-y-4 shadow-[var(--shadow-panel)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[var(--radius-control)] bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--status-warning)]">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-medium text-[var(--foreground)]">
                    Report Civic Tree Hazard
                  </h2>
                  <p className="text-xs text-[var(--muted)]">
                    Geofenced Photo Capture &amp; Gemini Vision Triage
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-10 h-10 grid place-items-center rounded-full text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)]"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitHazard} className="space-y-4">
              {/* Select Tree ID */}
              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">
                  Target Tree Asset ID
                </label>
                <select
                  value={selectedTreeId}
                  onChange={(e) => setSelectedTreeId(e.target.value)}
                  className="w-full min-h-[44px] rounded-[var(--radius-control)] bg-[var(--background)] border border-[var(--control-border)] px-3 py-2 text-xs text-[var(--foreground)]"
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
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">
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
                      className={`rounded-[var(--radius-control)] p-3 text-left border transition-all cursor-pointer ${
                        hazardType === type.value
                          ? 'bg-[var(--surface-raised)] border-[var(--accent)] text-[var(--foreground)]'
                          : 'bg-[var(--background)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      <div className="text-xs font-medium text-[var(--foreground)]">
                        {type.label}
                      </div>
                      <div className="text-[11px] text-[var(--muted)] mt-0.5 line-clamp-1">
                        {type.hint}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera Capture / Upload Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[var(--foreground)]">
                    Photographic Evidence (Required)
                  </label>
                  <span className="text-[11px] font-mono text-[var(--muted)] truncate max-w-[170px]">
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

                <div className="relative h-44 rounded-[var(--radius-panel)] overflow-hidden border border-[var(--control-border)] bg-[var(--background)]">
                  <img
                    src={photoDataUrl}
                    alt="Selected hazard evidence"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="min-h-[40px] inline-flex items-center gap-1.5 rounded-[var(--radius-control)] bg-[var(--background)]/95 hover:bg-[var(--surface-raised)] border border-[var(--control-border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] shadow-[var(--shadow-panel)] cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[var(--accent)]" />
                      Capture / Upload Photo
                    </button>

                    <button
                      type="button"
                      onClick={handleRunTriagePreview}
                      disabled={triaging}
                      className="min-h-[40px] inline-flex items-center gap-1.5 rounded-[var(--radius-control)] bg-[var(--accent)] hover:bg-[var(--accent-soft)] text-[var(--accent-foreground)] px-3.5 py-1.5 text-xs font-medium shadow-[var(--shadow-panel)] disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {triaging ? 'Analyzing...' : 'Run AI Triage'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Live AI Vision Triage Output Card */}
              {triagePreview && (
                <div className="rounded-[var(--radius-control)] bg-[var(--background)] border border-[var(--control-border)] p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--accent)] flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" />
                      Gemini 3.8 Flash Vision Assessment
                    </span>
                    <span className="text-xs font-mono text-[var(--muted)]">
                      Confidence: {Math.round(triagePreview.confidence * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs">
                    <StatusBadge
                      tone={
                        triagePreview.severity_grade === 'CRITICAL_24H'
                          ? 'critical'
                          : triagePreview.severity_grade === 'MEDIUM'
                          ? 'warning'
                          : 'healthy'
                      }
                    >
                      <span
                        className="font-mono font-medium"
                        style={{
                          color:
                            triagePreview.severity_grade === 'CRITICAL_24H'
                              ? 'var(--status-critical-text)'
                              : triagePreview.severity_grade === 'MEDIUM'
                              ? 'var(--status-warning)'
                              : 'var(--status-healthy)',
                        }}
                      >
                        {triagePreview.severity_grade}
                      </span>
                    </StatusBadge>
                    <span className="text-[var(--foreground)] text-xs">
                      Canopy Score:{' '}
                      <strong className="font-mono">{triagePreview.health_score}/100</strong>
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">
                    <strong className="text-[var(--foreground)] font-medium">
                      Recommended SLA:
                    </strong>{' '}
                    {triagePreview.recommended_sla_action}
                  </p>
                </div>
              )}

              {/* Field Notes */}
              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">
                  Location &amp; Observation Notes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe branch condition, walkway obstruction, or root uplift..."
                  className="w-full rounded-[var(--radius-control)] bg-[var(--background)] border border-[var(--control-border)] p-3 text-xs text-[var(--foreground)] placeholder:text-[var(--muted)]"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="button button--secondary w-1/3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="button button--primary w-2/3"
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
