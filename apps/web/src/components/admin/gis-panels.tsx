"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowUpRight, CircleHelp, Fingerprint, Layers3, Leaf, PanelRightClose, Search, ShieldCheck, Trees, TriangleAlert, Unplug, Wrench, X } from "lucide-react";
import type { WorkspaceView } from "../workspaces/config";
import { evidenceLink, hasCoordinates, healthLabels, type AdminTreeRecord, type Basemap, type MapState } from "./gis-data";

export const adminViewLabels: Partial<Record<WorkspaceView, string>> = { overview: "Overview", map: "Geographic view", trees: "Tree registry", maintenance: "Maintenance", hazards: "Hazard reports", sla: "SLA monitoring", insights: "Environmental insights" };

function Metric({ label, value }: { label: string; value?: string | number }) {
  return <div className="gis-metric"><span>{label}</span><span>{value ?? "—"}</span></div>;
}

export function IntelligencePanel({ trees, selected, onClear, onClose }: { trees: readonly AdminTreeRecord[] | null; selected: AdminTreeRecord | null; onClear: () => void; onClose: () => void }) {
  const evidence = selected && evidenceLink(selected);
  return <aside className="gis-intelligence gis-panel" aria-labelledby="intelligence-panel-title" id="gis-intelligence">
    <header className="gis-panel-header"><div>{selected ? <Fingerprint size={17} aria-hidden="true" /> : <Trees size={17} aria-hidden="true" />}<h2 id="intelligence-panel-title">{selected ? "Digital Tree Passport" : "Township intelligence"}</h2></div><button type="button" onClick={onClose} aria-label="Collapse intelligence panel"><PanelRightClose size={17} aria-hidden="true" /></button></header>
    <div className="gis-panel-scroll" tabIndex={0} role="region" aria-label={selected ? "Selected tree details" : "Township intelligence summaries"}>
      {selected ? <>
        <button type="button" className="gis-text-button" onClick={onClear}><ArrowLeft size={14} aria-hidden="true" />Township summary</button>
        <div className="gis-passport-id"><span>Digital Tree ID</span><h3>{selected.id}</h3><p>{selected.species ?? "Species not provided"}</p></div>
        <dl className="gis-passport-fields">
          <div><dt>Health condition</dt><dd>{healthLabels[selected.health ?? "unassessed"]}</dd></div>
          <div><dt>Health score</dt><dd>{selected.healthScore ?? "Not provided"}</dd></div>
          <div><dt>Location (WGS84)</dt><dd>{hasCoordinates(selected) ? `${selected.coordinates[1].toFixed(5)}, ${selected.coordinates[0].toFixed(5)}` : "Not provided"}</dd></div>
          <div><dt>Contractor</dt><dd>{selected.contractor ?? "Not provided"}</dd></div>
          <div><dt>Verification</dt><dd>{selected.verification?.status === "verified" && evidence ? "Verified status supplied by source" : selected.verification?.status === "pending" ? "Pending verification" : "No verified evidence available"}</dd></div>
        </dl>
        <section className="gis-intelligence-section"><h3>Maintenance history</h3>{selected.maintenance?.length ? <ol className="gis-history">{selected.maintenance.map(entry => <li key={entry.id}><p>{entry.description}</p>{entry.performedAt && <span>{entry.performedAt}</span>}</li>)}</ol> : <p>{selected.maintenance ? "No maintenance entries supplied." : "Maintenance history is not connected."}</p>}</section>
        {evidence && <a className="gis-action-link" href={evidence} target="_blank" rel="noopener noreferrer">Review supplied audit evidence <ArrowUpRight size={14} aria-hidden="true" /></a>}
        <Link className="gis-action-link" href="/admin/maintenance">Open maintenance workspace <ArrowUpRight size={14} aria-hidden="true" /></Link>
      </> : <>
        <div className="gis-source-label"><span />{trees === null ? "Operational records disconnected" : "Connected tree registry"}</div>
        <section className="gis-intelligence-section gis-population"><div className="gis-section-title"><h3>Tree population</h3><Trees size={15} aria-hidden="true" /></div><div className="gis-population-total"><strong>{trees?.length.toLocaleString() ?? "—"}</strong><span>registered trees</span></div><Metric label="Geolocated records" value={trees?.filter(hasCoordinates).length} /><p>{trees === null ? "Awaiting an attributable tree registry." : "Registry totals are separate from environmental measurements."}</p></section>
        <section className="gis-intelligence-section"><div className="gis-section-title"><h3>Health distribution</h3><Leaf size={15} aria-hidden="true" /></div><div className="gis-health-list">{Object.entries(healthLabels).map(([key, label]) => <div key={key}><span className={`gis-health-key gis-health-key--${key}`} aria-hidden="true">{key === "critical" ? "!" : ""}</span><span>{label}</span><span>{trees?.filter(tree => (tree.health ?? "unassessed") === key).length ?? "—"}</span></div>)}</div><p>{trees === null ? "No health assessments connected." : "Conditions as supplied by the registry."}</p></section>
        <section className="gis-intelligence-section"><div className="gis-section-title"><h3>Maintenance overview</h3><Wrench size={15} aria-hidden="true" /></div><Metric label="Open work orders" /><Metric label="Evidence awaiting review" /><Link className="gis-action-link" href="/admin/maintenance">View maintenance <ArrowUpRight size={13} aria-hidden="true" /></Link></section>
        <section className="gis-intelligence-section"><div className="gis-section-title"><h3>SLA compliance</h3><ShieldCheck size={15} aria-hidden="true" /></div><Metric label="Compliance rate" /><p>No obligations or due dates are connected. A rate cannot be calculated.</p></section>
        <section className="gis-intelligence-section"><div className="gis-section-title"><h3>Environmental insights</h3><Leaf size={15} aria-hidden="true" /></div><Metric label="Canopy coverage" /><p>No environmental measurements connected.</p><Link className="gis-action-link" href="/admin/insights">View data requirements <ArrowUpRight size={13} aria-hidden="true" /></Link></section>
      </>}
    </div>
    <footer className="gis-panel-footnote">{selected ? "Only supplied records are shown." : "Unavailable is not zero. No estimated statistics."}</footer>
  </aside>;
}

export function LayerPanel({ trees, mapState, basemap, onBasemap, showTrees, onTrees, showHealth, onHealth, opacity, onOpacity, onClose }: {
  trees: readonly AdminTreeRecord[] | null; mapState: MapState; basemap: Basemap; onBasemap: (mode: Basemap) => void;
  showTrees: boolean; onTrees: (show: boolean) => void; showHealth: boolean; onHealth: (show: boolean) => void; opacity: number; onOpacity: (opacity: number) => void; onClose: () => void;
}) {
  const locationsAvailable = !!trees?.some(hasCoordinates) && mapState.status === "ready";
  const healthAvailable = locationsAvailable && !!trees?.some(tree => hasCoordinates(tree) && tree.health && tree.health !== "unassessed");
  return <aside className="gis-tool-panel gis-panel" aria-labelledby="layers-title" id="gis-layers">
    <header className="gis-panel-header"><div><Layers3 size={17} aria-hidden="true" /><h2 id="layers-title">Map layers</h2></div><button type="button" onClick={onClose} aria-label="Close map layers"><X size={17} aria-hidden="true" /></button></header>
    <div className="gis-panel-scroll"><fieldset className="gis-basemap-options"><legend>Geographic basemap</legend><label><input type="radio" name="basemap" value="satellite" checked={basemap === "satellite"} onChange={() => onBasemap("satellite")} /><span>Satellite + labels<small>Mapbox provider access required</small></span></label><label><input type="radio" name="basemap" value="geographic" checked={basemap === "geographic"} onChange={() => onBasemap("geographic")} /><span>Dark geographic<small>Real geographic context</small></span></label></fieldset>
      <p className="gis-layer-note">{mapState.status === "ready" ? `${mapState.basemap === "satellite" ? "Satellite" : "Geographic"} basemap loaded${mapState.fallback ? " as a fallback" : ""}. Imagery is not a live environmental feed.` : "Basemap availability is checked when the provider responds."}</p>
      <h3 className="gis-subheading">Operational overlays</h3>
      {[{ label: "Tree locations", enabled: locationsAvailable, checked: showTrees, toggle: onTrees, tone: "healthy" }, { label: "Health conditions", enabled: healthAvailable, checked: showHealth, toggle: onHealth, tone: "attention" }].map(layer => <label className="gis-layer-row" key={layer.label}><span className={`gis-health-key gis-health-key--${layer.tone}`} aria-hidden="true" /><span>{layer.label}<small>{layer.enabled ? "Registry source available" : "No connected source"}</small></span><input type="checkbox" checked={layer.enabled && layer.checked} disabled={!layer.enabled} onChange={event => layer.toggle(event.target.checked)} /></label>)}
      {[{ label: "Maintenance activity", icon: Wrench }, { label: "Hazard reports", icon: TriangleAlert }, { label: "Township boundaries", icon: Layers3 }, { label: "Environmental data", icon: Leaf }].map(({ label, icon: Icon }) => <label className="gis-layer-row" key={label}><Icon size={15} aria-hidden="true" /><span>{label}<small>No connected source</small></span><input type="checkbox" disabled checked={false} readOnly /></label>)}
      <label className="gis-opacity">Tree layer opacity <output>{Math.round(opacity * 100)}%</output><input type="range" min="20" max="100" value={Math.round(opacity * 100)} disabled={!locationsAvailable} onChange={event => onOpacity(Number(event.target.value) / 100)} /></label>
    </div><footer className="gis-panel-footnote">Unavailable layers stay off. No synthetic locations.</footer>
  </aside>;
}

export function OperationPanel({ view, trees, onSelect }: { view: WorkspaceView; trees: readonly AdminTreeRecord[] | null; onSelect: (tree: AdminTreeRecord) => void }) {
  const [query, setQuery] = useState("");
  const [health, setHealth] = useState("all");
  const filtered = trees?.filter(tree => `${tree.id} ${tree.species ?? ""}`.toLowerCase().includes(query.toLowerCase()) && (health === "all" || (tree.health ?? "unassessed") === health));
  return <div className="gis-operation-content">
    {view === "trees" ? <><p>Digital identities connected to the township map.</p><label className="gis-search"><Search size={16} aria-hidden="true" /><input aria-label="Search tree registry" type="search" placeholder="Tree ID or species" value={query} onChange={event => setQuery(event.target.value)} disabled={trees === null} /></label><label className="gis-filter">Health condition<select value={health} onChange={event => setHealth(event.target.value)} disabled={trees === null}><option value="all">All conditions</option>{Object.entries(healthLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>{trees === null ? <Disconnected title="Registry not connected" text="No tree identities, species, health conditions, or geographic locations can be loaded yet." /> : filtered?.length ? <ul className="gis-tree-list">{filtered.map(tree => <li key={tree.id}><button type="button" onClick={() => onSelect(tree)}><span>{tree.id}<small>{tree.species ?? "Species not supplied"}</small></span><span className={`gis-health-key gis-health-key--${tree.health ?? "unassessed"}`} aria-label={healthLabels[tree.health ?? "unassessed"]}>{tree.health === "critical" ? "!" : ""}</span></button></li>)}</ul> : <Disconnected title="No matching tree records" text="Try another identity or health condition." />}</> : view === "maintenance" ? <><p>Work orders and evidence, attached to individual tree identities.</p><Disconnected title="Work-order feed not connected" text="Assignments, due dates, completion evidence, and contractor details are unavailable." /><h3>Evidence trail</h3><ol className="gis-process"><li>Identify the tree</li><li>Review assigned work</li><li>Inspect maintenance evidence</li><li>Review the audit record</li></ol><p className="gis-small-note">No task can be assigned, completed, or verified in this disconnected view.</p></> : view === "hazards" ? <><p>Community reports and their geographic context.</p><Disconnected title="Hazard feed not connected" text="No report locations, photos, or severity assessments are available. AI triage is not connected." /><h3>Severity reference</h3><ul className="gis-reference"><li><TriangleAlert size={16} aria-hidden="true" /><span><strong>High</strong>Potential immediate hazard</span></li><li><CircleHelp size={16} aria-hidden="true" /><span><strong>Medium</strong>Requires attention and review</span></li><li><Leaf size={16} aria-hidden="true" /><span><strong>Low</strong>Routine concern</span></li></ul></> : view === "sla" ? <><p>Accountability starts with an attributable service obligation.</p><Disconnected title="Compliance unavailable" text="Without connected obligations, due dates, and verification evidence, a compliance percentage cannot be calculated." /><dl className="gis-definitions"><div><dt>Due date</dt><dd>Service deadline supplied by the task record.</dd></div><div><dt>Maintenance proof</dt><dd>Evidence of work attached to a tree identity.</dd></div><div><dt>Audit event</dt><dd>A verifiable reference when an actual audit record exists.</dd></div></dl></> : <><p>Environmental reporting grounded in measured, attributable data.</p><Disconnected title="No analytical dataset connected" text="Canopy coverage, condition trends, and environmental outcomes cannot be calculated." /><dl className="gis-definitions"><div><dt>Species distribution</dt><dd>Requires a connected tree registry.</dd></div><div><dt>Condition trends</dt><dd>Requires dated, comparable assessments.</dd></div><div><dt>Environmental outcomes</dt><dd>Requires documented measurements and calculation methods.</dd></div></dl></>}
  </div>;
}

function Disconnected({ title, text }: { title: string; text: string }) {
  return <div className="gis-disconnected"><Unplug size={22} strokeWidth={1.4} aria-hidden="true" /><h3>{title}</h3><p>{text}</p></div>;
}

export function ConnectionPanel({ mapState, onClose }: { mapState: MapState; onClose: () => void }) {
  return <aside className="gis-tool-panel gis-panel" aria-labelledby="connection-title"><header className="gis-panel-header"><div><Unplug size={17} aria-hidden="true" /><h2 id="connection-title">Data connections</h2></div><button type="button" onClick={onClose} aria-label="Close connection details"><X size={17} aria-hidden="true" /></button></header><div className="gis-panel-scroll"><p className="gis-layer-note">This is an admin workspace preview, not an authenticated role session.</p><dl className="gis-definitions"><div><dt>Map provider</dt><dd>{mapState.status === "ready" ? `Mapbox ${mapState.basemap} basemap loaded.` : "Basemap not yet available. Configure a valid public Mapbox token and provider access."}</dd></div><div><dt>Operational records</dt><dd>The current backend exposes only GET /health. Tree, work-order, hazard, and SLA endpoints are not implemented.</dd></div><div><dt>Geographic overlays</dt><dd>Tree coordinates, township polygons, maintenance zones, and environmental datasets need documented sources.</dd></div><div><dt>Verification</dt><dd>No blockchain evidence or verification result is generated by this interface.</dd></div></dl><p className="gis-small-note">Local Resident and Contractor drafts are not submitted records and are not plotted on this map.</p></div></aside>;
}
