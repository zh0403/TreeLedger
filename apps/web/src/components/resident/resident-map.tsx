"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ArrowUpRight, Layers, MapPin, Navigation, TreePine, X } from "lucide-react";
import type { Map as MapboxMap, Marker, StyleSpecification } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { hasResidentCoordinates, residentHealthLabels, residentPhotoSource, type ResidentTreeRecord } from "./resident-data";

// High-availability geographic & satellite raster styles for desktop and mobile browsers.
const geographicStyle: StyleSpecification = {
  version: 8,
  sources: {
    geography: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
    },
  },
  layers: [
    {
      id: "geography",
      type: "raster",
      source: "geography",
      paint: { "raster-saturation": -0.55, "raster-brightness-max": 0.78 },
    },
  ],
};

const satelliteStyle: StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© Esri, Maxar, Earthstar Geographics",
    },
  },
  layers: [
    {
      id: "satellite",
      type: "raster",
      source: "satellite",
      paint: { "raster-saturation": -0.15, "raster-brightness-max": 0.85 },
    },
  ],
};

export function ResidentMap({ trees, onList, selectedTreeId, onSelect, showPreview = true }: { trees: readonly ResidentTreeRecord[] | null; onList: () => void; selectedTreeId?: string | null; onSelect?: (tree: ResidentTreeRecord | undefined) => void; showPreview?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapboxMap | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable" | "error">("loading");
  const [satellite, setSatellite] = useState(false);
  const satelliteMode = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  const activeId = selectedTreeId === undefined ? selectedId : selectedTreeId;
  const selected = trees?.find(tree => tree.id === activeId);
  const selectedPhoto = residentPhotoSource(selected?.photoUrl);

  useEffect(() => {
    let disposed = false;
    let instance: MapboxMap | undefined;
    let observer: ResizeObserver | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const boot = async () => {
      setStatus("loading");
      try {
        const { default: mapboxgl } = await import("mapbox-gl");
        if (disposed || !container.current) return;
        instance = new mapboxgl.Map({
          container: container.current,
          accessToken:
            token && token.startsWith("pk.")
              ? token
              : "pk.eyJ1IjoidHJlZWxlZGdlciIsImEiOiJjbHBsYWNlaG9sZGVyIn0.0",
          style: satelliteMode.current ? satelliteStyle : geographicStyle,
          center: [101.515, 3.1885],
          zoom: 14.5,
          attributionControl: true,
        });
        map.current = instance;
        instance.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");

        const markReady = () => {
          clearTimeout(timeout);
          if (!disposed) {
            instance?.resize();
            setStatus("ready");
          }
        };

        instance.on("load", markReady);
        instance.on("idle", markReady);

        if (typeof ResizeObserver !== "undefined" && container.current) {
          observer = new ResizeObserver(() => {
            instance?.resize();
          });
          observer.observe(container.current);
        }

        timeout = setTimeout(markReady, 2500);
      } catch {
        if (!disposed) setStatus("error");
      }
    };
    void boot();
    return () => {
      disposed = true;
      clearTimeout(timeout);
      observer?.disconnect();
      instance?.remove();
      if (map.current === instance) map.current = null;
    };
  }, [attempt]);

  useEffect(() => {
    satelliteMode.current = satellite;
    const instance = map.current;
    if (instance) instance.setStyle(satellite ? satelliteStyle : geographicStyle);
  }, [satellite]);

  useEffect(() => {
    if (status !== "ready" || !map.current || !trees) return;
    let disposed = false;
    const markers: Marker[] = [];
    const roots: Root[] = [];
    const instance = map.current;
    const located = trees.filter(hasResidentCoordinates);
    void import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (disposed) return;
      for (const tree of located) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `explorer-marker explorer-marker--${tree.health ?? "unassessed"}${activeId === tree.id ? " is-selected" : ""}`;
        button.setAttribute("aria-label", `${tree.commonName ?? tree.id}: ${tree.health ? residentHealthLabels[tree.health] : "Not assessed"}`);
        button.setAttribute("aria-pressed", String(activeId === tree.id));
        button.addEventListener("click", () => { setSelectedId(tree.id); onSelect?.(tree); });
        const root = createRoot(button); root.render(<TreePine size={18} aria-hidden="true" />); roots.push(root);
        markers.push(new mapboxgl.Marker({ element: button }).setLngLat([tree.longitude,tree.latitude]).addTo(instance));
      }
      // Use supplied coordinates only; never invent a township or tree location.
      if (located.length && !located.some(tree => tree.id === activeId)) {
        const bounds = new mapboxgl.LngLatBounds();
        located.forEach(tree => bounds.extend([tree.longitude,tree.latitude]));
        instance.fitBounds(bounds,{ padding: 72, maxZoom: 16, duration: 0 });
      }
    });
    return () => {
      disposed = true;
      markers.forEach((marker) => marker.remove());
      setTimeout(() => {
        roots.forEach((root) => root.unmount());
      }, 0);
    };
  }, [trees, status, activeId, onSelect]);

  const locate = () => {
    if (!navigator.geolocation) { setMessage("Location is not supported in this browser."); return; }
    setMessage("Requesting your location…");
    navigator.geolocation.getCurrentPosition(position => {
      map.current?.easeTo({ center: [position.coords.longitude,position.coords.latitude], zoom: 14, duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 700 });
      setMessage("Map centred on your location. Tree distances are not available.");
    }, () => setMessage("Location unavailable. You can still pan and zoom the map."), { timeout: 10000 });
  };

  return <div className={`explorer-map explorer-map--${status}${satellite ? "" : " explorer-map--geographic"}`} aria-label="Interactive neighbourhood map">
    <div ref={container} className="explorer-map-canvas" />
    <div className="explorer-map-switch" aria-label="Discovery view"><button type="button" aria-pressed="true">Map</button><button type="button" onClick={onList}>List</button></div>
    <div className="explorer-map-tools"><button type="button" disabled={status !== "ready" && status !== "error"} aria-label={satellite ? "Switch to geographic basemap" : "Switch to satellite imagery"} onClick={() => setSatellite(value => !value)}><Layers size={19} aria-hidden="true" /></button><button type="button" disabled={status !== "ready"} aria-label="Centre map on my location" onClick={locate}><Navigation size={18} aria-hidden="true" /></button></div>
    {status === "loading" && <p className="explorer-map-notice" role="status">Opening your map…</p>}
    {status === "unavailable" && <div className="explorer-map-empty"><MapPin size={29} strokeWidth={1.3} aria-hidden="true" /><h2>A little closer to nature.</h2><p>The interactive map needs a configured public Mapbox token.</p><span>Tree registry not connected. No locations are shown.</span></div>}
    {status === "error" && <div className="explorer-map-empty" role="status"><MapPin size={28} aria-hidden="true" /><h2>The map is taking a detour.</h2><p>Check your map access or try the geographic basemap.</p><div><button type="button" onClick={() => setAttempt(value => value + 1)}>Retry map</button>{satellite && <button type="button" onClick={() => setSatellite(false)}>Use basemap</button>}</div></div>}
    {status === "ready" && <p className="explorer-map-notice">{satellite ? "Satellite imagery" : "Geographic basemap"} · {trees === null ? "Tree registry not connected" : `${trees.filter(hasResidentCoordinates).length} mapped tree records`}</p>}
    {message && <p className="explorer-location-message" role="status">{message}</p>}
    {showPreview && selected && status === "ready" && <aside className="explorer-tree-preview" aria-label="Selected tree">{selectedPhoto && failedPhoto !== selectedPhoto ? <Image src={selectedPhoto} alt={`Photo supplied for ${selected.commonName ?? selected.id}`} width={64} height={72} unoptimized onError={() => setFailedPhoto(selectedPhoto)} /> : <TreePine size={32} strokeWidth={1.2} aria-hidden="true" />}<div><h3>{selected.commonName ?? selected.species ?? "Tree identity"}</h3><p>{selected.id}</p><span>{selected.health ? residentHealthLabels[selected.health] : "Not assessed"}{typeof selected.healthScore === "number" && Number.isFinite(selected.healthScore) && selected.healthScore >= 0 && selected.healthScore <= 100 ? ` · ${selected.healthScore}%` : ""}</span><Link href="/app/profile">Tree Passport <ArrowUpRight size={14} aria-hidden="true" /></Link></div><button type="button" aria-label="Close tree preview" onClick={() => { setSelectedId(null); onSelect?.(undefined); }}><X size={16} aria-hidden="true" /></button></aside>}
  </div>;
}
