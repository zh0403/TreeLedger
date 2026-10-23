"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Clock,
  Fingerprint,
  Layers3,
  Leaf,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Trees,
  Unplug,
  Wrench,
  X,
} from "lucide-react";
import type { WorkspaceView } from "../workspaces/config";
import {
  evidenceLink,
  hasCoordinates,
  healthLabels,
  type AdminTreeRecord,
  type Basemap,
  type MapState,
} from "./gis-data";
import {
  INITIAL_HAZARDS,
  INITIAL_MAINTENANCE,
  fetchHazards,
  fetchMaintenanceRecords,
} from "@/lib/api";
import type { HazardReport, MaintenanceRecord } from "@/lib/types";

export const adminViewLabels: Partial<Record<WorkspaceView, string>> = {
  overview: "Township overview",
  map: "Geographic explore",
  trees: "Tree registry",
  maintenance: "Maintenance",
  hazards: "Hazard reports",
  sla: "SLA monitoring",
  insights: "Environmental insights",
};

const ARBISCAN_CONTRACT_URL =
  "https://sepolia.arbiscan.io/address/0x685049b310922F6bc8d6FA17ddae010E13803701";

const CONTRACTOR_SLA_DATA = [
  {
    name: "Elmina GreenWorks Sdn Bhd",
    precinct: "Sector 4A - Ilham Residence",
    treesManaged: 14,
    complianceRate: 98.2,
    completedOnTime: 18,
    totalTasks: 18,
    breaches: 0,
    retainerStatus: "Full Retainer · RM 0 Deducted",
    penaltyActive: false,
  },
  {
    name: "Tropika ArborCare Enterprise",
    precinct: "Sector 1B - Elmina Central Park",
    treesManaged: 14,
    complianceRate: 96.4,
    completedOnTime: 14,
    totalTasks: 14,
    breaches: 0,
    retainerStatus: "Full Retainer · RM 0 Deducted",
    penaltyActive: false,
  },
  {
    name: "Nusantara AgroTech Services",
    precinct: "Sector 4B & Sector 2A",
    treesManaged: 12,
    complianceRate: 89.5,
    completedOnTime: 11,
    totalTasks: 12,
    breaches: 1,
    retainerStatus: "10% Penalty Deduction (RM 1,450)",
    penaltyActive: true,
  },
] as const;

const SPECIES_BREAKDOWN = [
  {
    species: "Hopea odorata",
    commonName: "Merawan Siput Jantan",
    count: 12,
    share: 30,
    co2PerTree: "28.4 kg/yr",
  },
  {
    species: "Samanea saman",
    commonName: "Rain Tree (Pukul Lima)",
    count: 10,
    share: 25,
    co2PerTree: "48.5 kg/yr",
  },
  {
    species: "Bucida molineti",
    commonName: "Spiny Black Olive",
    count: 8,
    share: 20,
    co2PerTree: "22.8 kg/yr",
  },
  {
    species: "Dipterocarpus baudii & Native Mix",
    commonName: "Keruing Bulu · Meranti · Tecoma",
    count: 10,
    share: 25,
    co2PerTree: "34.6 kg/yr",
  },
] as const;

function Metric({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="gis-metric">
      <span>{label}</span>
      <span>{value ?? "—"}</span>
    </div>
  );
}

function getSlaCountdown(hazard: HazardReport): {
  label: string;
  urgent: boolean;
} {
  if (hazard.status === "RESOLVED") {
    return { label: "Resolved within SLA window", urgent: false };
  }
  if (hazard.ai_severity_grade === "CRITICAL_24H") {
    return {
      label:
        hazard.id === 101
          ? "24h Critical SLA · 05h 42m left"
          : "24h Critical SLA · 10h 18m left",
      urgent: true,
    };
  }
  return { label: "72h Standard SLA · 51h 30m left", urgent: false };
}

/**
 * Google-Maps-style Place Card / Digital Tree Passport rendered inside the unified Left Side Panel
 * whenever a user clicks a TreePine marker on the map or selects a tree from a list.
 */
export function TreePassportDetail({
  selected,
  returnLabel,
  hazards,
  maintenanceRecords,
  onBack,
  onNavigateView,
}: {
  selected: AdminTreeRecord;
  returnLabel: string;
  hazards: readonly HazardReport[];
  maintenanceRecords: readonly MaintenanceRecord[];
  onBack: () => void;
  onNavigateView: (view: WorkspaceView) => void;
}) {
  const evidence = evidenceLink(selected);
  const treeHazards = hazards.filter((h) => h.tree_id === selected.id);
  const treeMaintenance = maintenanceRecords.filter(
    (m) => m.tree_id === selected.id
  );

  const toneColor =
    selected.health === "healthy"
      ? "var(--gis-accent)"
      : selected.health === "attention"
      ? "var(--gis-amber)"
      : selected.health === "critical"
      ? "#ff8a86"
      : "var(--gis-muted)";

  return (
    <div style={{ padding: "14px 0 18px" }}>
      {/* Google Maps-style Back to Results Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          paddingBottom: "12px",
          marginBottom: "14px",
          borderBottom: "1px solid var(--gis-border)",
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            minHeight: "36px",
            padding: "0 12px",
            borderRadius: "999px",
            border: "1px solid var(--gis-border)",
            background: "var(--gis-secondary)",
            color: "var(--gis-text)",
            fontSize: "11px",
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          <span>Back to {returnLabel}</span>
        </button>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "10px",
            color: "var(--gis-cyan)",
          }}
        >
          <Fingerprint size={13} aria-hidden="true" />
          Digital Tree Passport
        </span>
      </div>

      {/* Tree Identity Hero Card */}
      <div
        style={{
          padding: "16px",
          borderRadius: "14px",
          border: "1px solid var(--gis-border)",
          background: "var(--gis-secondary)",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            marginBottom: "6px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: "11px",
              color: "var(--gis-cyan)",
              letterSpacing: "0.04em",
            }}
          >
            {selected.id}
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "3px 9px",
              borderRadius: "999px",
              background: "rgba(7, 28, 22, 0.75)",
              border: `1px solid ${toneColor}`,
              color: toneColor,
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            <span
              className={`gis-health-key gis-health-key--${
                selected.health ?? "unassessed"
              }`}
            >
              {selected.health === "critical" ? "!" : ""}
            </span>
            {healthLabels[selected.health ?? "unassessed"]}
            {typeof selected.healthScore === "number"
              ? ` · ${selected.healthScore}%`
              : ""}
          </span>
        </div>

        <h3
          style={{
            fontSize: "17px",
            fontWeight: 500,
            color: "var(--gis-text)",
            margin: "4px 0 6px",
            lineHeight: 1.35,
          }}
        >
          {selected.species ?? "Botanical specimen"}
        </h3>

        {hasCoordinates(selected) && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              color: "var(--gis-muted)",
              fontFamily: "var(--font-geist-mono), monospace",
            }}
          >
            <MapPin
              size={13}
              aria-hidden="true"
              style={{ color: "var(--gis-accent)" }}
            />
            {selected.coordinates[1].toFixed(5)}° N,{" "}
            {selected.coordinates[0].toFixed(5)}° E
          </div>
        )}
      </div>

      {/* Key Operational Metadata */}
      <dl className="gis-passport-fields" style={{ margin: "0 0 14px" }}>
        <div>
          <dt>Responsible Contractor (2-Yr DLP)</dt>
          <dd>{selected.contractor ?? "Elmina GreenWorks Sdn Bhd"}</dd>
        </div>
        <div>
          <dt>On-Chain Audit Status</dt>
          <dd style={{ color: "var(--gis-accent)" }}>
            {selected.verification?.status === "verified" && evidence
              ? "Anchored on Arbitrum Sepolia"
              : "Pending verification"}
          </dd>
        </div>
      </dl>

      {/* Linked Hazard Reports for this Tree (if any) */}
      {treeHazards.length > 0 && (
        <section className="gis-intelligence-section">
          <div className="gis-section-title">
            <h3>Linked Hazard Reports ({treeHazards.length})</h3>
            <Sparkles size={14} aria-hidden="true" />
          </div>
          <div style={{ display: "grid", gap: "10px" }}>
            {treeHazards.map((h) => (
              <div
                key={h.id}
                style={{
                  padding: "10px",
                  borderRadius: "10px",
                  border: "1px solid rgba(227, 107, 103, 0.4)",
                  background: "rgba(227, 107, 103, 0.08)",
                  fontSize: "11px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  <span>
                    #{h.id} · {h.hazard_type.replace(/_/g, " ")}
                  </span>
                  <span style={{ color: "#ff8a86" }}>
                    {h.ai_severity_grade}
                  </span>
                </div>
                <p style={{ margin: "0 0 6px", color: "var(--gis-muted)" }}>
                  {h.description}
                </p>
                <div style={{ fontSize: "10px", color: "var(--gis-accent)" }}>
                  {getSlaCountdown(h).label}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Maintenance History & Proof Photos */}
      <section className="gis-intelligence-section">
        <div className="gis-section-title">
          <h3>Verified Maintenance History</h3>
          <Wrench size={14} aria-hidden="true" />
        </div>
        {treeMaintenance.length > 0 ? (
          <div style={{ display: "grid", gap: "10px" }}>
            {treeMaintenance.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: "10px",
                  borderRadius: "10px",
                  border: "1px solid var(--gis-border)",
                  background: "var(--gis-secondary)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    fontWeight: 500,
                    marginBottom: "6px",
                  }}
                >
                  <span>{m.action_type.replace(/_/g, " ")}</span>
                  <span style={{ color: "var(--gis-muted)", fontSize: "10px" }}>
                    {new Date(m.completed_at).toLocaleDateString("en-US")}
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "6px",
                    marginBottom: "6px",
                  }}
                >
                  <img
                    src={m.before_photo_url}
                    alt="Before proof"
                    style={{
                      width: "100%",
                      height: "56px",
                      objectFit: "cover",
                      borderRadius: "6px",
                    }}
                  />
                  <img
                    src={m.after_photo_url}
                    alt="After proof"
                    style={{
                      width: "100%",
                      height: "56px",
                      objectFit: "cover",
                      borderRadius: "6px",
                      border: "1px solid var(--gis-accent)",
                    }}
                  />
                </div>
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--gis-muted)",
                    margin: 0,
                  }}
                >
                  {m.notes}
                </p>
              </div>
            ))}
          </div>
        ) : selected.maintenance?.length ? (
          <ol className="gis-history">
            {selected.maintenance.map((entry) => (
              <li key={entry.id}>
                <p>{entry.description}</p>
                {entry.performedAt && <span>{entry.performedAt}</span>}
              </li>
            ))}
          </ol>
        ) : (
          <p>No maintenance entries supplied.</p>
        )}
      </section>

      {evidence && (
        <a
          className="gis-action-link"
          href={evidence}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>Verify contract on Arbitrum Sepolia</span>
          <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      )}
      <button
        type="button"
        className="gis-action-link"
        style={{
          width: "100%",
          background: "transparent",
          border: 0,
          padding: 0,
        }}
        onClick={() => {
          onBack();
          onNavigateView("maintenance");
        }}
      >
        <span>Browse all township maintenance proofs</span>
        <ArrowUpRight size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

export function LayerPanel({
  trees,
  mapState,
  basemap,
  onBasemap,
  showTrees,
  onTrees,
  showHealth,
  onHealth,
  opacity,
  onOpacity,
  onClose,
}: {
  trees: readonly AdminTreeRecord[] | null;
  mapState: MapState;
  basemap: Basemap;
  onBasemap: (mode: Basemap) => void;
  showTrees: boolean;
  onTrees: (show: boolean) => void;
  showHealth: boolean;
  onHealth: (show: boolean) => void;
  opacity: number;
  onOpacity: (opacity: number) => void;
  onClose: () => void;
}) {
  const locationsAvailable =
    !!trees?.some(hasCoordinates) && mapState.status === "ready";
  const healthAvailable =
    locationsAvailable &&
    !!trees?.some(
      (tree) =>
        hasCoordinates(tree) && tree.health && tree.health !== "unassessed"
    );
  return (
    <div style={{ padding: "14px 0 18px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "10px",
          borderBottom: "1px solid var(--gis-border)",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          <Layers3
            size={15}
            aria-hidden="true"
            style={{ color: "var(--gis-cyan)" }}
          />
          Map Layers &amp; Cartography
        </span>
        <button
          type="button"
          onClick={onClose}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 10px",
            borderRadius: "999px",
            border: "1px solid var(--gis-border)",
            background: "var(--gis-secondary)",
            color: "var(--gis-text)",
            fontSize: "11px",
          }}
        >
          Done
        </button>
      </div>

      <fieldset className="gis-basemap-options">
        <legend>Geographic basemap</legend>
        <label>
          <input
            type="radio"
            name="basemap"
            value="geographic"
            checked={basemap === "geographic"}
            onChange={() => onBasemap("geographic")}
          />
          <span>
            Light geographic
            <small>High-contrast light cartography with TreePine badges</small>
          </span>
        </label>
        <label>
          <input
            type="radio"
            name="basemap"
            value="satellite"
            checked={basemap === "satellite"}
            onChange={() => onBasemap("satellite")}
          />
          <span>
            Satellite imagery
            <small>High-resolution canopy aerial view</small>
          </span>
        </label>
      </fieldset>
      <p className="gis-layer-note">
        {mapState.status === "ready"
          ? `${
              mapState.basemap === "satellite"
                ? "Satellite"
                : "Light geographic"
            } basemap active. Click any TreePine badge on the map to open its Digital Tree Passport in this panel.`
          : "Connecting to geographic tile provider…"}
      </p>
      <h3 className="gis-subheading">Operational overlays</h3>
      {[
        {
          label: "TreePine canopy badges",
          enabled: locationsAvailable,
          checked: showTrees,
          toggle: onTrees,
          tone: "healthy",
        },
        {
          label: "Health condition colors",
          enabled: healthAvailable,
          checked: showHealth,
          toggle: onHealth,
          tone: "attention",
        },
      ].map((layer) => (
        <label className="gis-layer-row" key={layer.label}>
          <span
            className={`gis-health-key gis-health-key--${layer.tone}`}
            aria-hidden="true"
          />
          <span>
            {layer.label}
            <small>
              {layer.enabled
                ? "40 geolocated Elmina records"
                : "Loading registry"}
            </small>
          </span>
          <input
            type="checkbox"
            checked={layer.enabled && layer.checked}
            disabled={!layer.enabled}
            onChange={(event) => layer.toggle(event.target.checked)}
          />
        </label>
      ))}
      <label className="gis-opacity">
        Tree badge opacity <output>{Math.round(opacity * 100)}%</output>
        <input
          type="range"
          min="20"
          max="100"
          value={Math.round(opacity * 100)}
          disabled={!locationsAvailable}
          onChange={(event) => onOpacity(Number(event.target.value) / 100)}
        />
      </label>
    </div>
  );
}

export function OperationPanel({
  view,
  trees,
  onSelect,
  onNavigateView,
}: {
  view: WorkspaceView;
  trees: readonly AdminTreeRecord[] | null;
  onSelect: (tree: AdminTreeRecord) => void;
  onNavigateView?: (view: WorkspaceView) => void;
}) {
  const [query, setQuery] = useState("");
  const [health, setHealth] = useState("all");
  const [hazards, setHazards] = useState<HazardReport[]>(INITIAL_HAZARDS);
  const [maintenanceRecords, setMaintenanceRecords] =
    useState<MaintenanceRecord[]>(INITIAL_MAINTENANCE);

  useEffect(() => {
    let active = true;
    void fetchHazards().then((data) => {
      if (active && Array.isArray(data) && data.length > 0) {
        setHazards(data);
      }
    });
    void fetchMaintenanceRecords().then((data) => {
      if (active && Array.isArray(data) && data.length > 0) {
        setMaintenanceRecords(data);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const filtered = trees?.filter(
    (tree) =>
      `${tree.id} ${tree.species ?? ""} ${tree.contractor ?? ""}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (health === "all" || (tree.health ?? "unassessed") === health)
  );

  const avgCanopyHealth = useMemo(() => {
    if (!trees || trees.length === 0) return 88;
    const valid = trees.filter((t) => typeof t.healthScore === "number");
    if (valid.length === 0) return 88;
    return Math.round(
      valid.reduce((sum, t) => sum + (t.healthScore ?? 88), 0) / valid.length
    );
  }, [trees]);

  const priorityTrees = useMemo(
    () =>
      (trees ?? []).filter(
        (t) => t.health === "critical" || t.health === "attention"
      ),
    [trees]
  );

  const selectByTreeId = (treeId: string) => {
    const match = trees?.find((t) => t.id === treeId);
    if (match) {
      onSelect(match);
    }
  };

  if (view === "overview" || view === "map") {
    return (
      <div className="gis-operation-content">
        <p>
          Unified City of Elmina operational hub. Select any tree on the map or
          below to inspect its Digital Tree Passport.
        </p>

        {/* Top KPI Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginBottom: "16px",
          }}
        >
          <button
            type="button"
            onClick={() => onNavigateView?.("trees")}
            style={{
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid var(--gis-border)",
              background: "var(--gis-secondary)",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: "10px", color: "var(--gis-muted)" }}>
              Registered Canopy
            </span>
            <strong
              style={{
                display: "block",
                fontSize: "22px",
                color: "var(--gis-text)",
                marginTop: "2px",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {trees?.length ?? 40} Trees
            </strong>
            <span style={{ fontSize: "10px", color: "var(--gis-accent)" }}>
              {avgCanopyHealth}% Avg Vitality →
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateView?.("sla")}
            style={{
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid var(--gis-border)",
              background: "var(--gis-secondary)",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: "10px", color: "var(--gis-muted)" }}>
              Contractor SLA
            </span>
            <strong
              style={{
                display: "block",
                fontSize: "22px",
                color: "var(--gis-accent)",
                marginTop: "2px",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              94.7%
            </strong>
            <span style={{ fontSize: "10px", color: "var(--gis-amber)" }}>
              1 Active 10% Penalty →
            </span>
          </button>
        </div>

        {/* Health Distribution Bar */}
        <section
          style={{
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid var(--gis-border)",
            background: "var(--gis-secondary)",
            marginBottom: "16px",
          }}
        >
          <div className="gis-section-title" style={{ marginBottom: "10px" }}>
            <h3>Canopy Health Breakdown</h3>
            <Leaf size={14} aria-hidden="true" />
          </div>
          <div className="gis-health-list">
            {(["healthy", "attention", "critical"] as const).map((key) => (
              <div key={key}>
                <span
                  className={`gis-health-key gis-health-key--${key}`}
                  aria-hidden="true"
                >
                  {key === "critical" ? "!" : ""}
                </span>
                <span>{healthLabels[key]}</span>
                <span>
                  {trees?.filter((tree) => tree.health === key).length ?? 0}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Priority Trees Needing Attention */}
        <h3>Priority Trees Requiring Action ({priorityTrees.length})</h3>
        <ul className="gis-tree-list" style={{ marginTop: "8px" }}>
          {priorityTrees.map((tree) => (
            <li key={tree.id}>
              <button type="button" onClick={() => onSelect(tree)}>
                <span>
                  <strong>{tree.id}</strong>
                  <small>{tree.species}</small>
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11px",
                  }}
                >
                  <span>{tree.healthScore}%</span>
                  <span
                    className={`gis-health-key gis-health-key--${
                      tree.health ?? "unassessed"
                    }`}
                  >
                    {tree.health === "critical" ? "!" : ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* Quick Navigation Shortcuts */}
        <h3>Operational Modules</h3>
        <div style={{ display: "grid", gap: "8px" }}>
          <button
            type="button"
            onClick={() => onNavigateView?.("hazards")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              borderRadius: "10px",
              border: "1px solid var(--gis-border)",
              background: "var(--gis-secondary)",
              color: "var(--gis-text)",
              fontSize: "11px",
            }}
          >
            <span>Citizen Hazard Reports (Gemini 3.8 AI)</span>
            <span style={{ color: "#ff8a86", fontWeight: 600 }}>
              {hazards.filter((h) => h.status !== "RESOLVED").length} Open →
            </span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateView?.("maintenance")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              borderRadius: "10px",
              border: "1px solid var(--gis-border)",
              background: "var(--gis-secondary)",
              color: "var(--gis-text)",
              fontSize: "11px",
            }}
          >
            <span>Verified Maintenance Proofs (Arbitrum)</span>
            <span style={{ color: "var(--gis-accent)", fontWeight: 600 }}>
              {maintenanceRecords.length} Anchored →
            </span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateView?.("insights")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              borderRadius: "10px",
              border: "1px solid var(--gis-border)",
              background: "var(--gis-secondary)",
              color: "var(--gis-text)",
              fontSize: "11px",
            }}
          >
            <span>Environmental Sequestration</span>
            <span style={{ color: "var(--gis-cyan)", fontWeight: 600 }}>
              1,142 kg CO₂/yr →
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gis-operation-content">
      {view === "trees" ? (
        <>
          <p>
            40 geolocated City of Elmina tree identities. Click any tree to fly
            the map and open its Digital Tree Passport.
          </p>
          <label className="gis-search">
            <Search size={16} aria-hidden="true" />
            <input
              aria-label="Search tree registry"
              type="search"
              placeholder="Search ID, species, or contractor…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled={trees === null}
            />
          </label>
          <label className="gis-filter">
            Health condition
            <select
              value={health}
              onChange={(event) => setHealth(event.target.value)}
              disabled={trees === null}
            >
              <option value="all">All conditions ({trees?.length ?? 0})</option>
              <option value="healthy">
                Healthy (
                {trees?.filter((t) => t.health === "healthy").length ?? 0})
              </option>
              <option value="attention">
                Needs attention (
                {trees?.filter((t) => t.health === "attention").length ?? 0})
              </option>
              <option value="critical">
                Critical (
                {trees?.filter((t) => t.health === "critical").length ?? 0})
              </option>
            </select>
          </label>
          {trees === null ? (
            <Disconnected
              title="Registry not connected"
              text="No tree identities, species, health conditions, or geographic locations can be loaded yet."
            />
          ) : filtered?.length ? (
            <ul className="gis-tree-list">
              {filtered.map((tree) => (
                <li key={tree.id}>
                  <button type="button" onClick={() => onSelect(tree)}>
                    <span>
                      <strong>{tree.id}</strong>
                      <small>{tree.species ?? "Species not supplied"}</small>
                      {tree.contractor && (
                        <small style={{ opacity: 0.78 }}>
                          {tree.contractor}
                        </small>
                      )}
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "11px",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {typeof tree.healthScore === "number" && (
                        <span>{tree.healthScore}%</span>
                      )}
                      <span
                        className={`gis-health-key gis-health-key--${
                          tree.health ?? "unassessed"
                        }`}
                        aria-label={healthLabels[tree.health ?? "unassessed"]}
                      >
                        {tree.health === "critical" ? "!" : ""}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <Disconnected
              title="No matching tree records"
              text="Try another identity, species, or health condition."
            />
          )}
        </>
      ) : view === "maintenance" ? (
        <>
          <p>
            Verified arborist work orders with before/after photo proof and
            cryptographic Arbitrum Sepolia audit hashes.
          </p>
          <div style={{ display: "grid", gap: "14px", marginTop: "12px" }}>
            {maintenanceRecords.map((record) => (
              <article
                key={record.id}
                style={{
                  padding: "12px",
                  border: "1px solid var(--gis-border)",
                  borderRadius: "12px",
                  background: "var(--gis-secondary)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    marginBottom: "6px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => selectByTreeId(record.tree_id)}
                    style={{
                      padding: "2px 8px",
                      borderRadius: "999px",
                      border: "1px solid var(--gis-accent)",
                      background: "rgba(82, 217, 165, 0.14)",
                      color: "var(--gis-accent)",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    {record.tree_id} · Open Passport
                  </button>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "var(--gis-cyan)",
                      fontFamily: "var(--font-geist-mono), monospace",
                    }}
                  >
                    {record.action_type.replace(/_/g, " ")}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--gis-muted)",
                    marginBottom: "8px",
                  }}
                >
                  {record.contractor_id} ·{" "}
                  {new Date(record.completed_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <figure style={{ margin: 0 }}>
                    <img
                      src={record.before_photo_url}
                      alt={`Before maintenance on ${record.tree_id}`}
                      style={{
                        width: "100%",
                        height: "68px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid var(--gis-border)",
                      }}
                    />
                    <figcaption
                      style={{
                        fontSize: "10px",
                        color: "var(--gis-muted)",
                        marginTop: "2px",
                      }}
                    >
                      Before proof
                    </figcaption>
                  </figure>
                  <figure style={{ margin: 0 }}>
                    <img
                      src={record.after_photo_url}
                      alt={`After maintenance on ${record.tree_id}`}
                      style={{
                        width: "100%",
                        height: "68px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid var(--gis-accent)",
                      }}
                    />
                    <figcaption
                      style={{
                        fontSize: "10px",
                        color: "var(--gis-accent)",
                        marginTop: "2px",
                      }}
                    >
                      After proof (Verified)
                    </figcaption>
                  </figure>
                </div>

                <p
                  style={{
                    fontSize: "11px",
                    lineHeight: 1.55,
                    color: "var(--gis-text)",
                    margin: "0 0 8px",
                  }}
                >
                  {record.notes}
                </p>

                <div
                  style={{
                    paddingTop: "8px",
                    borderTop: "1px solid var(--gis-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    fontSize: "10px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-geist-mono), monospace",
                      color: "var(--gis-cyan)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={record.arbitrum_tx_hash}
                  >
                    Tx: {record.arbitrum_tx_hash.slice(0, 14)}…
                    {record.arbitrum_tx_hash.slice(-6)}
                  </span>
                  <a
                    href={ARBISCAN_CONTRACT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                      color: "var(--gis-accent)",
                      flexShrink: 0,
                    }}
                  >
                    Arbiscan <ArrowUpRight size={12} aria-hidden="true" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : view === "hazards" ? (
        <>
          <p>
            Active citizen hazard reports triaged by Gemini 3.8 AI Vision with
            live municipal SLA resolution timers.
          </p>
          <div style={{ display: "grid", gap: "14px", marginTop: "12px" }}>
            {hazards.map((hazard) => {
              const sla = getSlaCountdown(hazard);
              const isCritical = hazard.ai_severity_grade === "CRITICAL_24H";
              return (
                <article
                  key={hazard.id}
                  style={{
                    padding: "12px",
                    border: `1px solid ${
                      isCritical
                        ? "rgba(227, 107, 103, 0.45)"
                        : "var(--gis-border)"
                    }`,
                    borderRadius: "12px",
                    background: "var(--gis-secondary)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => selectByTreeId(hazard.tree_id)}
                      style={{
                        padding: "2px 8px",
                        borderRadius: "999px",
                        border: "1px solid var(--gis-accent)",
                        background: "rgba(82, 217, 165, 0.14)",
                        color: "var(--gis-accent)",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}
                    >
                      #{hazard.id} · {hazard.tree_id}
                    </button>
                    <span
                      style={{
                        padding: "2px 7px",
                        borderRadius: "999px",
                        fontSize: "10px",
                        fontWeight: 600,
                        background: isCritical
                          ? "rgba(227, 107, 103, 0.2)"
                          : hazard.ai_severity_grade === "MEDIUM"
                          ? "rgba(229, 174, 80, 0.2)"
                          : "rgba(82, 217, 165, 0.18)",
                        color: isCritical
                          ? "#ff8a86"
                          : hazard.ai_severity_grade === "MEDIUM"
                          ? "#f3c46b"
                          : "var(--gis-accent)",
                      }}
                    >
                      <Sparkles
                        size={10}
                        aria-hidden="true"
                        style={{ display: "inline", marginRight: "4px" }}
                      />
                      Gemini 3.8: {hazard.ai_severity_grade} (
                      {Math.round(hazard.ai_confidence * 100)}%)
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "74px 1fr",
                      gap: "10px",
                      alignItems: "start",
                      marginBottom: "8px",
                    }}
                  >
                    <img
                      src={hazard.evidence_photo_url}
                      alt={`Hazard evidence for ${hazard.tree_id}`}
                      style={{
                        width: "74px",
                        height: "66px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid var(--gis-border)",
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 500,
                          color: "var(--gis-text)",
                          marginBottom: "3px",
                        }}
                      >
                        {hazard.hazard_type.replace(/_/g, " ")} ·{" "}
                        <span style={{ color: "var(--gis-cyan)" }}>
                          {hazard.status}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: "11px",
                          lineHeight: 1.5,
                          color: "var(--gis-muted)",
                          margin: 0,
                        }}
                      >
                        {hazard.description}
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      paddingTop: "8px",
                      borderTop: "1px solid var(--gis-border)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      fontSize: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        color: sla.urgent ? "#ff8a86" : "var(--gis-accent)",
                        fontWeight: 500,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Clock size={11} aria-hidden="true" />
                        {sla.label}
                      </span>
                      <span style={{ color: "var(--gis-muted)" }}>
                        {hazard.reporter_id}
                      </span>
                    </div>
                    {hazard.recommended_sla_action && (
                      <div style={{ color: "var(--gis-muted)" }}>
                        SLA Action: {hazard.recommended_sla_action}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      ) : view === "sla" ? (
        <>
          <p>
            Live 2-Year Defect Liability Period (DLP) contractor accountability
            and automated 10% SLA penalty deduction tracking.
          </p>

          <div
            style={{
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid var(--gis-border)",
              background: "var(--gis-secondary)",
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: "6px",
              }}
            >
              <span style={{ fontSize: "11px", color: "var(--gis-muted)" }}>
                Township SLA Compliance
              </span>
              <strong
                style={{
                  fontSize: "20px",
                  color: "var(--gis-accent)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                94.7%
              </strong>
            </div>
            <Metric label="Mandatory replacement window" value="14 Days" />
            <Metric label="Critical hazard response SLA" value="24 Hours" />
            <Metric
              label="Survival benchmark guarantee"
              value="≥ 85% (Current: 97.5%)"
            />
          </div>

          <h3>Contractor Performance &amp; 10% Penalty Tracker</h3>
          <div style={{ display: "grid", gap: "10px" }}>
            {CONTRACTOR_SLA_DATA.map((item) => (
              <article
                key={item.name}
                style={{
                  padding: "12px",
                  borderRadius: "12px",
                  border: `1px solid ${
                    item.penaltyActive
                      ? "rgba(229, 174, 80, 0.45)"
                      : "var(--gis-border)"
                  }`,
                  background: "var(--gis-secondary)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <strong style={{ fontSize: "12px", color: "var(--gis-text)" }}>
                    {item.name}
                  </strong>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: item.penaltyActive
                        ? "var(--gis-amber)"
                        : "var(--gis-accent)",
                    }}
                  >
                    {item.complianceRate}%
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--gis-muted)",
                    marginBottom: "8px",
                  }}
                >
                  {item.precinct} · {item.treesManaged} DLP trees ·{" "}
                  {item.completedOnTime}/{item.totalTasks} tasks within SLA
                </div>
                <div
                  style={{
                    padding: "6px 8px",
                    borderRadius: "8px",
                    background: item.penaltyActive
                      ? "rgba(229, 174, 80, 0.14)"
                      : "rgba(82, 217, 165, 0.1)",
                    color: item.penaltyActive
                      ? "#f3c46b"
                      : "var(--gis-accent)",
                    fontSize: "10px",
                    fontWeight: 500,
                  }}
                >
                  {item.retainerStatus}
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <>
          <p>
            Measured annual carbon sequestration, species diversity breakdown,
            and canopy vitality across City of Elmina.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid var(--gis-border)",
                background: "var(--gis-secondary)",
              }}
            >
              <span style={{ fontSize: "10px", color: "var(--gis-muted)" }}>
                Annual CO₂ Sequestration
              </span>
              <strong
                style={{
                  display: "block",
                  fontSize: "20px",
                  color: "var(--gis-accent)",
                  marginTop: "4px",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                1,142 kg/yr
              </strong>
              <span style={{ fontSize: "10px", color: "var(--gis-muted)" }}>
                40 verified Elmina trees
              </span>
            </div>

            <div
              style={{
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid var(--gis-border)",
                background: "var(--gis-secondary)",
              }}
            >
              <span style={{ fontSize: "10px", color: "var(--gis-muted)" }}>
                Average Canopy Health
              </span>
              <strong
                style={{
                  display: "block",
                  fontSize: "20px",
                  color: "var(--gis-cyan)",
                  marginTop: "4px",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {avgCanopyHealth}%
              </strong>
              <span style={{ fontSize: "10px", color: "var(--gis-muted)" }}>
                97.5% survival vs 85% DLP
              </span>
            </div>
          </div>

          <h3>Species Diversity Breakdown</h3>
          <div style={{ display: "grid", gap: "10px" }}>
            {SPECIES_BREAKDOWN.map((item) => (
              <div
                key={item.species}
                style={{
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid var(--gis-border)",
                  background: "var(--gis-secondary)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    marginBottom: "3px",
                  }}
                >
                  <strong style={{ color: "var(--gis-text)" }}>
                    {item.species}
                  </strong>
                  <span style={{ color: "var(--gis-accent)" }}>
                    {item.count} trees ({item.share}%)
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--gis-muted)",
                    marginBottom: "6px",
                  }}
                >
                  {item.commonName} · Avg {item.co2PerTree}
                </div>
                <div
                  style={{
                    height: "5px",
                    borderRadius: "999px",
                    background: "var(--gis-base)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${item.share}%`,
                      height: "100%",
                      background: "var(--gis-accent)",
                      borderRadius: "999px",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Disconnected({ title, text }: { title: string; text: string }) {
  return (
    <div className="gis-disconnected">
      <Unplug size={22} strokeWidth={1.4} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

export function ConnectionPanel({
  mapState,
  onClose,
}: {
  mapState: MapState;
  onClose: () => void;
}) {
  return (
    <div style={{ padding: "14px 0 18px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "10px",
          borderBottom: "1px solid var(--gis-border)",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          <ShieldCheck
            size={15}
            aria-hidden="true"
            style={{ color: "var(--gis-accent)" }}
          />
          Data Connections
        </span>
        <button
          type="button"
          onClick={onClose}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 10px",
            borderRadius: "999px",
            border: "1px solid var(--gis-border)",
            background: "var(--gis-secondary)",
            color: "var(--gis-text)",
            fontSize: "11px",
          }}
        >
          <X size={13} aria-hidden="true" />
          Close
        </button>
      </div>
      <p className="gis-layer-note">
        Connected to City of Elmina GIS registry, Gemini 3.8 AI hazard triage,
        and Arbitrum Sepolia audit contract.
      </p>
      <dl className="gis-definitions">
        <div>
          <dt>Map provider</dt>
          <dd>
            {mapState.status === "ready"
              ? `Active ${mapState.basemap} cartography with 40 TreePine markers.`
              : "Connecting to geographic tile server…"}
          </dd>
        </div>
        <div>
          <dt>Operational records</dt>
          <dd>
            Synced with INITIAL_TREES (40 Elmina trees), INITIAL_HAZARDS, and
            INITIAL_MAINTENANCE via TreeLedger API &amp; local state.
          </dd>
        </div>
        <div>
          <dt>On-chain verification</dt>
          <dd>
            Anchored to Arbitrum Sepolia contract{" "}
            <a
              href={ARBISCAN_CONTRACT_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--gis-cyan)", wordBreak: "break-all" }}
            >
              0x685049b310922F6bc8d6FA17ddae010E13803701
            </a>
            .
          </dd>
        </div>
      </dl>
    </div>
  );
}
