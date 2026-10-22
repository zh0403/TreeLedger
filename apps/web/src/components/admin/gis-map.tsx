"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapboxMap } from "mapbox-gl";
import type { FeatureCollection, Point } from "geojson";
import { MapPin, RefreshCw } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";
import { evidenceLink, hasCoordinates, type AdminTreeRecord, type Basemap, type MapState, type MapView } from "./gis-data";

const styles = { satellite: "mapbox://styles/mapbox/satellite-streets-v12", geographic: "mapbox://styles/mapbox/dark-v11" };
const treeLayers = ["tl-clusters", "tl-counts", "tl-trees", "tl-critical", "tl-selection"];

type Props = {
  records: readonly AdminTreeRecord[];
  basemap: Basemap;
  showTrees: boolean;
  showHealth: boolean;
  opacity: number;
  selectedId?: string;
  onSelect: (tree: AdminTreeRecord) => void;
  onStatus: (state: MapState) => void;
  onViewChange: (view: MapView) => void;
};

export function GISMap({ records, basemap, showTrees, showHealth, opacity, selectedId, onSelect, onStatus, onViewChange }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const recordsRef = useRef(records);
  const viewRef = useRef<MapView>({ longitude: 102, latitude: 4, zoom: 5 });
  const [state, setState] = useState<MapState>({ status: "loading", basemap, fallback: false });
  const [attempt, setAttempt] = useState(0);
  const [revision, setRevision] = useState(0);
  const data = useMemo<FeatureCollection<Point>>(() => ({ type: "FeatureCollection", features: records.filter(hasCoordinates).map(tree => ({
    type: "Feature", properties: { recordId: tree.id, health: tree.health ?? "unassessed", verified: tree.verification?.status === "verified" && !!evidenceLink(tree) },
    geometry: { type: "Point", coordinates: [...tree.coordinates] },
  })) }), [records]);

  useEffect(() => { recordsRef.current = records; }, [records]);

  useEffect(() => {
    let disposed = false;
    let instance: MapboxMap | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let activeBasemap = basemap;
    let fallback = false;
    let loaded = false;
    let hasProviderTile = false;
    let degraded = false;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const report = (status: MapState["status"], degraded = false) => {
      if (disposed) return;
      const next = { status, basemap: activeBasemap, fallback, degraded };
      setState(next); onStatus(next);
    };
    const startTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => recover(), 18000);
    };
    const recover = () => {
      if (disposed || !instance) return;
      if (activeBasemap === "satellite" && !fallback) {
        fallback = true; activeBasemap = "geographic"; loaded = false; hasProviderTile = false; degraded = false;
        report("loading"); instance.setStyle(styles.geographic); startTimer();
      } else { clearTimeout(timer); report("error"); }
    };
    const boot = async () => {
      if (!token || !token.startsWith("pk.")) { report("unavailable"); return; }
      report("loading");
      try {
        const { default: mapboxgl } = await import("mapbox-gl");
        if (disposed || !container.current) return;
        const previous = viewRef.current;
        instance = new mapboxgl.Map({ container: container.current, accessToken: token, style: styles[basemap], center: [previous.longitude, previous.latitude], zoom: previous.zoom, attributionControl: true });
        mapRef.current = instance;
        const map = instance;
        map.addControl(new mapboxgl.NavigationControl(), "top-right");
        map.addControl(new mapboxgl.ScaleControl({ maxWidth: 110, unit: "metric" }), "bottom-left");
        const updateView = () => {
          const c = map.getCenter();
          viewRef.current = { longitude: c.lng, latitude: c.lat, zoom: map.getZoom() };
          onViewChange(viewRef.current);
        };
        map.on("moveend", updateView);
        map.on("style.load", () => {
          if (disposed) return;
          const css = getComputedStyle(container.current!);
          const color = (name: string) => css.getPropertyValue(name).trim();
          // Restyle real provider geometry, never substitute decorative geography.
          if (activeBasemap === "geographic") {
            if (map.getLayer("background")?.type === "background") map.setPaintProperty("background", "background-color", color("--gis-land"));
            if (map.getLayer("water")?.type === "fill") map.setPaintProperty("water", "fill-color", color("--gis-water"));
            for (const id of ["admin-0-boundary", "admin-1-boundary"]) {
              if (map.getLayer(id)?.type === "line") {
                map.setPaintProperty(id, "line-color", color("--gis-cyan"));
                map.setPaintProperty(id, "line-opacity", .28);
              }
            }
          }
          map.addSource("tl-registry", { type: "geojson", data: { type: "FeatureCollection", features: [] }, cluster: true, clusterMaxZoom: 14, clusterRadius: 48 });
          map.addLayer({ id: "tl-clusters", type: "circle", source: "tl-registry", filter: ["has", "point_count"], paint: { "circle-color": color("--gis-accent"), "circle-radius": ["step", ["get", "point_count"], 18, 100, 23, 1000, 28], "circle-stroke-width": 2, "circle-stroke-color": color("--gis-panel") } });
          map.addLayer({ id: "tl-counts", type: "symbol", source: "tl-registry", filter: ["has", "point_count"], layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12 }, paint: { "text-color": color("--gis-panel") } });
          map.addLayer({ id: "tl-trees", type: "circle", source: "tl-registry", filter: ["!", ["has", "point_count"]], paint: { "circle-radius": ["case", ["==", ["get", "health"], "critical"], 9, 6], "circle-color": color("--gis-accent"), "circle-stroke-width": 2, "circle-stroke-color": ["case", ["get", "verified"], color("--gis-cyan"), color("--gis-panel")] } });
          map.addLayer({ id: "tl-critical", type: "symbol", source: "tl-registry", filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "health"], "critical"]], layout: { "text-field": "!", "text-size": 13, "text-allow-overlap": true }, paint: { "text-color": color("--gis-panel") } });
          map.addLayer({ id: "tl-selection", type: "circle", source: "tl-registry", filter: ["==", ["get", "recordId"], ""], paint: { "circle-radius": 13, "circle-color": color("--gis-cyan"), "circle-opacity": 0, "circle-stroke-width": 2, "circle-stroke-color": color("--gis-cyan") } });
          setRevision(value => value + 1);
        });
        map.on("sourcedata", event => {
          const tile = event.tile as { state?: string } | undefined;
          const expectedType = activeBasemap === "satellite" ? "raster" : "vector";
          if (event.source?.type === expectedType && tile?.state === "loaded") hasProviderTile = true;
        });
        map.on("idle", () => {
          if (!disposed && hasProviderTile) { loaded = true; clearTimeout(timer); report("ready", degraded); updateView(); }
        });
        map.on("error", () => {
          if (loaded) { degraded = true; report("ready", true); }
          // Old satellite tile requests can finish after switching styles. Do not
          // mistake those failures for a failure of the geographic fallback.
          else if (activeBasemap === "satellite" && !fallback) recover();
          // For a geographic load failure the existing timeout supplies the error state.
        });
        map.on("click", "tl-clusters", event => {
          const feature = event.features?.[0];
          if (!feature || feature.geometry.type !== "Point") return;
          const center = feature.geometry.coordinates as [number, number];
          (map.getSource("tl-registry") as GeoJSONSource).getClusterExpansionZoom(Number(feature.properties?.cluster_id), (error, zoom) => {
            if (error || zoom == null || disposed) return;
            map.easeTo({ center, zoom, duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 500 });
          });
        });
        map.on("click", "tl-trees", event => {
          const id = event.features?.[0]?.properties?.recordId;
          const tree = recordsRef.current.find(record => record.id === id);
          if (tree) onSelect(tree);
        });
        for (const layer of ["tl-clusters", "tl-trees"]) {
          map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; });
          map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; });
        }
        startTimer();
      } catch { clearTimeout(timer); report("error"); }
    };
    void boot();
    return () => { disposed = true; clearTimeout(timer); instance?.remove(); mapRef.current = null; };
  }, [basemap, attempt, onSelect, onStatus, onViewChange]);

  useEffect(() => {
    const source = mapRef.current?.getSource("tl-registry") as GeoJSONSource | undefined;
    source?.setData(data);
  }, [data, revision]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer("tl-trees")) return;
    const css = getComputedStyle(container.current!);
    const color = (name: string) => css.getPropertyValue(name).trim();
    for (const layer of treeLayers) map.setLayoutProperty(layer, "visibility", showTrees ? "visible" : "none");
    map.setPaintProperty("tl-trees", "circle-opacity", opacity);
    map.setPaintProperty("tl-trees", "circle-stroke-opacity", opacity);
    map.setPaintProperty("tl-clusters", "circle-opacity", opacity);
    map.setPaintProperty("tl-counts", "text-opacity", opacity);
    map.setPaintProperty("tl-critical", "text-opacity", opacity);
    map.setPaintProperty("tl-trees", "circle-color", showHealth ? ["match", ["get", "health"], "healthy", color("--gis-accent"), "attention", color("--gis-amber"), "critical", color("--gis-red"), color("--gis-muted")] : color("--gis-cyan"));
    map.setFilter("tl-selection", ["==", ["get", "recordId"], selectedId ?? ""]);
  }, [showTrees, showHealth, opacity, selectedId, revision]);

  useEffect(() => {
    const tree = records.find(record => record.id === selectedId);
    const map = mapRef.current;
    if (!tree || !hasCoordinates(tree) || !map?.getLayer("tl-trees")) return;
    const phone = window.innerWidth < 760;
    map.easeTo({ center: [tree.coordinates[0], tree.coordinates[1]], zoom: Math.max(map.getZoom(), 16), duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 750, padding: { top: 75, bottom: phone ? Math.round(window.innerHeight * .45) : 80, left: phone ? 30 : 75, right: phone ? 30 : 325 } });
  }, [selectedId, records, revision]);

  return <div className="gis-map" data-map-status={state.status} data-basemap={state.basemap}>
    <div ref={container} className="gis-map-canvas" aria-label="Interactive geographic map of Malaysia" />
    {state.status !== "ready" && <div className="gis-map-message" role="status">
      {state.status === "loading" ? <><span className="gis-loading-mark" /><h2>Opening the geographic view</h2><p>{state.fallback ? "Satellite imagery unavailable. Trying the geographic basemap." : "Connecting to the configured Mapbox provider."}</p></> : <><MapPin size={28} strokeWidth={1.4} aria-hidden="true" /><h2>{state.status === "unavailable" ? "Basemap not configured" : "Basemap unavailable"}</h2><p>{state.status === "unavailable" ? "Set NEXT_PUBLIC_MAPBOX_TOKEN to a valid public Mapbox token, then restart the frontend." : "Check the map provider, token permissions, WebGL support, and network connection."}</p>{state.status === "error" && <button type="button" onClick={() => setAttempt(value => value + 1)}><RefreshCw size={14} aria-hidden="true" />Retry basemap</button>}<span>No tree locations or satellite imagery are being displayed.</span></>}
    </div>}
  </div>;
}
