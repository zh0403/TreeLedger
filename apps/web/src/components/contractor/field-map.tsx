"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapboxMap, Marker, StyleSpecification } from "mapbox-gl";
import { Layers, MapPin, TreePine, X } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";
import { fieldCoordinates, taskOverdue, taskStatusLabels, type FieldTask } from "./field-data";

const basemap: StyleSpecification = { version: 8, sources: { geography: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, maxzoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors' } }, layers: [{ id: "geography", type: "raster", source: "geography", paint: { "raster-saturation": -.6, "raster-brightness-max": .75 } }] };
const satelliteStyle = "mapbox://styles/mapbox/satellite-streets-v12";

export function FieldMap({ tasks, selected, onSelect, onOpen, onList, now }: { tasks: readonly FieldTask[] | null; selected: FieldTask | undefined; onSelect: (task: FieldTask | undefined) => void; onOpen: () => void; onList: () => void; now: number | null }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapboxMap | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [satellite, setSatellite] = useState(true);
  const mode = useRef(true);
  const [attempt, setAttempt] = useState(0);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let disposed = false;
    let instance: MapboxMap | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const boot = async () => {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token?.startsWith("pk.")) { mode.current = false; setSatellite(false); setNotice("Satellite access is not configured. Showing a geographic basemap."); }
      setStatus("loading");
      try {
        const { default: mapboxgl } = await import("mapbox-gl");
        if (disposed || !container.current) return;
        instance = new mapboxgl.Map({ container: container.current, accessToken: token, style: mode.current ? satelliteStyle : basemap, center: [102,4], zoom: 5, attributionControl: true });
        map.current = instance;
        instance.addControl(new mapboxgl.NavigationControl({ showCompass: false }),"bottom-right");
        instance.on("idle", () => { clearTimeout(timeout); if (!disposed) setStatus("ready"); });
        const fail = () => {
          if (disposed) return;
          clearTimeout(timeout);
          if (mode.current) { mode.current = false; setSatellite(false); setNotice("Satellite imagery is unavailable. Showing a geographic basemap."); timeout = setTimeout(() => { if (!disposed) setStatus("error"); },15000); }
          else setStatus("error");
        };
        instance.on("error", event => { if ("sourceId" in event || !instance?.isStyleLoaded()) fail(); });
        timeout = setTimeout(fail,15000);
      } catch { if (!disposed) setStatus("error"); }
    };
    void boot();
    return () => { disposed = true; clearTimeout(timeout); instance?.remove(); if (map.current === instance) map.current = null; };
  }, [attempt]);

  useEffect(() => { mode.current = satellite; map.current?.setStyle(satellite ? satelliteStyle : basemap); }, [satellite]);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(() => map.current?.resize());
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (status !== "ready" || !map.current || !tasks) return;
    let disposed = false;
    const instance = map.current;
    const markers: Marker[] = [];
    void import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (disposed) return;
      const located = tasks.filter(fieldCoordinates);
      for (const task of located) {
        const marker = document.createElement("button");
        marker.type = "button";
        marker.className = `field-map-marker${task.priority === "high" || (now !== null && taskOverdue(task,now)) ? " is-critical" : task.priority === "medium" ? " is-attention" : ""}${selected?.id === task.id ? " is-selected" : ""}`;
        const symbol = document.createElementNS("http://www.w3.org/2000/svg","svg");
        symbol.setAttribute("viewBox","0 0 24 24"); symbol.setAttribute("width","20"); symbol.setAttribute("height","20"); symbol.setAttribute("fill","none"); symbol.setAttribute("stroke","currentColor"); symbol.setAttribute("stroke-width","1.5"); symbol.setAttribute("aria-hidden","true");
        const path = document.createElementNS("http://www.w3.org/2000/svg","path");
        path.setAttribute("d","m17 14 4 6H3l4-6H4l4-6H6l6-6 6 6h-2l4 6h-3ZM12 20v2"); symbol.append(path); marker.append(symbol);
        marker.setAttribute("aria-label", `${task.title}: ${task.treeId ?? task.id}`);
        marker.setAttribute("aria-pressed",String(selected?.id === task.id));
        marker.addEventListener("click", () => onSelect(task));
        markers.push(new mapboxgl.Marker({ element: marker }).setLngLat([task.longitude,task.latitude]).addTo(instance));
      }
      if (located.length && !selected) { const bounds = new mapboxgl.LngLatBounds(); located.forEach(task => bounds.extend([task.longitude,task.latitude])); instance.fitBounds(bounds,{ padding: 70,maxZoom: 16,duration: 0 }); }
    });
    return () => { disposed = true; markers.forEach(marker => marker.remove()); };
  }, [tasks, selected, onSelect, status, now]);

  return <div className={`field-map${satellite ? "" : " field-map--geographic"}`} aria-label="Field assignment map">
    <div ref={container} className="field-map-canvas" />
    <div className="field-map-view"><button type="button" aria-pressed="true">Map</button><button type="button" onClick={onList}>List</button></div>
    <button type="button" className="field-map-layer" aria-label={satellite ? "Switch to geographic basemap" : "Switch to satellite imagery"} onClick={() => setSatellite(value => !value)} disabled={status === "loading"}><Layers size={19} aria-hidden="true" /></button>
    {notice && <p className="field-map-notice" role="status">{notice}</p>}
    <p className="field-map-disclosure">{status === "loading" ? "Opening field map…" : satellite ? "Satellite imagery" : "Geographic basemap"} · {tasks === null ? "Assignments not connected" : `${tasks.filter(fieldCoordinates).length} mapped assignments`}</p>
    {status === "error" && <div className="field-map-error" role="status"><MapPin size={25} aria-hidden="true" /><h2>The map could not load.</h2><p>Check map access and your connection.</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Retry map</button></div>}
    {selected && <aside className="field-map-preview"><TreePine size={30} strokeWidth={1.4} aria-hidden="true" /><div><h3>{selected.treeName ?? selected.title}</h3><p>{selected.treeId ?? "Tree identity unavailable"}</p><span>{selected.status ? taskStatusLabels[selected.status] : "Status unavailable"}{selected.priority ? ` · ${selected.priority} priority` : ""}</span><button type="button" onClick={onOpen}>Open task →</button></div><button type="button" aria-label="Close task preview" onClick={() => onSelect(undefined)}><X size={17} aria-hidden="true" /></button></aside>}
  </div>;
}
