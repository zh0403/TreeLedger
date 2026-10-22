"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown, Compass, Crosshair, Layers3, Leaf, Map, PanelRightOpen, ShieldCheck, Trees, TriangleAlert, Unplug, Wrench, X } from "lucide-react";
import { workspaceConfig, workspaceHref, type WorkspaceRole, type WorkspaceView } from "../workspaces/config";
import { adminTreeRecords, type AdminTreeRecord, type Basemap, type MapState, type MapView } from "./gis-data";
import { GISMap } from "./gis-map";
import { adminViewLabels, ConnectionPanel, IntelligencePanel, LayerPanel, OperationPanel } from "./gis-panels";
import "./admin-gis.css";
import { Brand } from "../ui/brand";
import { Navigation, NavigationLink } from "../ui/navigation";

const emptyRecords: readonly AdminTreeRecord[] = [];
const navIcons = { overview: Compass, map: Map, trees: Trees, maintenance: Wrench, hazards: TriangleAlert, sla: ShieldCheck, insights: Leaf };

export function AdminCommandCenter({ view, trees = adminTreeRecords }: { view: WorkspaceView; trees?: readonly AdminTreeRecord[] | null }) {
  const router = useRouter();
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [tool, setTool] = useState<"layers" | "connection" | null>(null);
  const [selected, setSelected] = useState<AdminTreeRecord | null>(null);
  // Geographic context works without requiring satellite tile access on the account.
  const [basemap, setBasemap] = useState<Basemap>("geographic");
  const [showTrees, setShowTrees] = useState(true);
  const [showHealth, setShowHealth] = useState(true);
  const [opacity, setOpacity] = useState(.9);
  const [mapState, setMapState] = useState<MapState>({ status: "loading", basemap: "geographic", fallback: false });
  const [mapView, setMapView] = useState<MapView>({ longitude: 102, latitude: 4, zoom: 5 });
  const layerButton = useRef<HTMLButtonElement>(null);
  const connectionButton = useRef<HTMLButtonElement>(null);
  const inspectorButton = useRef<HTMLButtonElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const operationalView = view !== "overview" && view !== "map";

  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) setInspectorOpen(matchMedia("(min-width:1100px)").matches); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!tool) return;
    const frame = requestAnimationFrame(() => workspaceRef.current?.querySelector<HTMLButtonElement>(".gis-tool-panel .gis-panel-header button")?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [tool]);

  const selectTree = useCallback((tree: AdminTreeRecord) => { setSelected(tree); setInspectorOpen(true); }, []);
  const closeTool = () => { setTool(null); (tool === "connection" ? connectionButton : layerButton).current?.focus({ preventScroll: true }); };
  const navigate = () => { setTool(null); };
  const openLayers = () => {
    setTool(current => current === "layers" ? null : "layers");
    if (matchMedia("(max-width:759px)").matches) setInspectorOpen(false);
  };
  const openInspector = () => {
    setInspectorOpen(true);
    if (matchMedia("(max-width:759px)").matches) setTool(null);
  };

  return <div ref={workspaceRef} className="gis" data-inspector={inspectorOpen ? "open" : "closed"} data-tool={tool ?? (operationalView ? "operation" : "none")} onKeyDown={event => {
    if (event.key !== "Escape") return;
    if (tool) { event.preventDefault(); closeTool(); }
    else if (inspectorOpen) { event.preventDefault(); setInspectorOpen(false); requestAnimationFrame(() => inspectorButton.current?.focus()); }
  }}>
    <a className="skip-link" href="#gis-main">Skip to geographic workspace</a>
    <header className="gis-header">
      <Brand href="/" className="gis-brand" subtitle="Geospatial intelligence" />
      <div className="gis-header-region"><Map size={15} aria-hidden="true" /><span>Malaysia overview</span><span className="gis-region-tag">Regional view</span></div>
      <div className="gis-header-actions"><button ref={connectionButton} className="gis-connection-button" type="button" aria-label="View data connection details" aria-expanded={tool === "connection"} onClick={() => { setTool(current => current === "connection" ? null : "connection"); if (matchMedia("(max-width:759px)").matches) setInspectorOpen(false); }}><Unplug size={15} aria-hidden="true" /><span>{trees === null ? "Records disconnected" : "Tree registry connected"}</span></button><label className="gis-role-switch"><span>Workspace preview</span><select aria-label="Choose workspace preview" value="admin" onChange={event => router.push(workspaceConfig[event.target.value as WorkspaceRole].base)}><option value="admin">Admin</option><option value="resident">Resident</option><option value="contractor">Contractor</option></select><ChevronDown size={12} aria-hidden="true" /></label></div>
    </header>
    <Navigation className="gis-rail" label="Admin GIS tools">
      {workspaceConfig.admin.navigation.map((item, index) => {
        const Icon = navIcons[item.view];
        return <div className="gis-tool-group" key={item.view}><NavigationLink href={workspaceHref("admin", item.view)} onClick={navigate} className="gis-tool" aria-label={item.label} title={item.label} aria-current={view === item.view && tool === null ? "page" : undefined}><Icon size={20} strokeWidth={1.5} aria-hidden="true" /><span>{item.label}</span></NavigationLink>{index === 1 && <button ref={layerButton} type="button" className="gis-tool" title="Map layers" aria-label="Map layers" aria-expanded={tool === "layers"} aria-controls="gis-layers" onClick={openLayers}><Layers3 size={20} strokeWidth={1.5} aria-hidden="true" /><span>Map layers</span></button>}</div>;
      })}
      <NavigationLink href="/admin/operations" className="gis-tool gis-home" aria-label="Open operations prototype from main" title="Operations prototype"><ArrowUpRight size={19} aria-hidden="true" /><span>Operations prototype</span></NavigationLink>
    </Navigation>
    <main className="gis-stage" id="gis-main" tabIndex={-1} aria-label="TreeLedger geographic workspace">
      <GISMap records={trees ?? emptyRecords} basemap={basemap} showTrees={showTrees} showHealth={showHealth} opacity={opacity} selectedId={selected?.id} onSelect={selectTree} onStatus={setMapState} onViewChange={setMapView} />
      <div className="gis-view-heading"><div><Crosshair size={14} aria-hidden="true" /><span>Forest operations</span></div><h1>{adminViewLabels[view]}</h1><p>Malaysia / regional geographic context</p></div>
      {!inspectorOpen && <button type="button" ref={inspectorButton} className="gis-open-intelligence" onClick={openInspector} aria-controls="gis-intelligence" aria-expanded={false}><PanelRightOpen size={17} aria-hidden="true" /><span>Intelligence</span></button>}
      {tool === "layers" ? <LayerPanel trees={trees} mapState={mapState} basemap={basemap} onBasemap={setBasemap} showTrees={showTrees} onTrees={setShowTrees} showHealth={showHealth} onHealth={setShowHealth} opacity={opacity} onOpacity={setOpacity} onClose={closeTool} /> : tool === "connection" ? <ConnectionPanel mapState={mapState} onClose={closeTool} /> : operationalView ? <aside className="gis-tool-panel gis-panel" aria-labelledby="operation-title"><header className="gis-panel-header"><div><h2 id="operation-title">{adminViewLabels[view]}</h2></div><Link href="/admin/map" aria-label="Close operational panel"><X size={17} aria-hidden="true" /></Link></header><div className="gis-panel-scroll"><OperationPanel key={view} view={view} trees={trees} onSelect={selectTree} /></div></aside> : null}
      {inspectorOpen && <IntelligencePanel trees={trees} selected={selected} onClear={() => setSelected(null)} onClose={() => { setInspectorOpen(false); requestAnimationFrame(() => inspectorButton.current?.focus()); }} />}
      {!operationalView && tool === null && <div className="gis-map-context"><Unplug size={18} strokeWidth={1.5} aria-hidden="true" /><div><h2>{trees === null ? "No operational layers connected" : "Tree identities in geographic context"}</h2><p>{trees === null ? "Explore the basemap. Tree locations, condition, and care records await connected sources." : "Select a geolocated tree to inspect its digital passport."}</p><button type="button" onClick={() => setTool("connection")}>Data connection details <ArrowUpRight size={12} aria-hidden="true" /></button></div></div>}
      <div className="gis-legend" aria-label="Tree status reference, not current observations"><span>Status reference</span><span><i className="gis-health-key gis-health-key--healthy" />Healthy</span><span><i className="gis-health-key gis-health-key--attention" />Attention</span><span><i className="gis-health-key gis-health-key--critical">!</i>Critical</span><span><i className="gis-verified-key" />Verified evidence</span></div>
      <footer className="gis-map-footer"><span className="gis-provider-state" role="status"><i data-status={mapState.status} />{mapState.status === "ready" ? `${mapState.basemap === "satellite" ? "Satellite imagery" : "Geographic basemap"}${mapState.fallback ? " · fallback" : ""}${mapState.degraded ? " · tile loading issue" : ""}` : mapState.status === "loading" ? "Basemap connecting" : "Basemap unavailable"}</span><span className="gis-coordinates">View centre {Math.abs(mapView.latitude).toFixed(3)}° {mapView.latitude >= 0 ? "N" : "S"} / {Math.abs(mapView.longitude).toFixed(3)}° {mapView.longitude >= 0 ? "E" : "W"}<span>Zoom {mapView.zoom.toFixed(1)}</span></span><span className="gis-footer-note">{trees === null ? "Operational data disconnected" : "Coordinates WGS84"}</span></footer>
    </main>
  </div>;
}
