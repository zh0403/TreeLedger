"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapboxMap } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin } from "lucide-react";
import { LoadingSkeleton } from "./empty-state";

export function TownshipMap({ light = false }: { light?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapboxMap | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let disposed = false;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    let timeout: ReturnType<typeof setTimeout>;
    const boot = async () => {
      if (!token || !token.startsWith("pk.")) { if (!disposed) setStatus("unavailable"); return; }
      setStatus("loading");
      try {
        const { default: mapboxgl } = await import("mapbox-gl");
        if (disposed || !container.current) return;
        const instance = new mapboxgl.Map({ container: container.current, accessToken: token, style: light ? "mapbox://styles/mapbox/light-v11" : "mapbox://styles/mapbox/dark-v11", center: [102, 4], zoom: 5, attributionControl: true });
        map.current = instance;
        instance.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
        instance.on("load", () => { clearTimeout(timeout); if (!disposed) setStatus("ready"); });
        instance.on("error", () => { clearTimeout(timeout); if (!disposed) setStatus("error"); });
        timeout = setTimeout(() => { if (!disposed) setStatus("error"); }, 15000);
      } catch { if (!disposed) setStatus("error"); }
    };
    void boot();
    return () => { disposed = true; clearTimeout(timeout); map.current?.remove(); map.current = null; };
  }, [light, attempt]);

  return <div className={`workspace-map map-${status}`} aria-label="Township map area"><div ref={container} className="map-canvas" />{status === "loading" && <div className="map-message"><LoadingSkeleton label="Loading map" /></div>}{status === "unavailable" && <div className="map-message"><MapPin size={34} strokeWidth={1.2} aria-hidden="true" /><h3>Your township, in context.</h3><p>A map cannot be displayed until a valid public Mapbox token is configured.</p><span>No tree locations are connected.</span></div>}{status === "error" && <div className="map-message" role="status"><MapPin size={30} aria-hidden="true" /><h3>The map could not load.</h3><p>Check the map token, network access, and map service availability.</p><button className="button button--secondary" onClick={() => setAttempt(attempt + 1)}>Try again</button></div>}{status === "ready" && <div className="map-legend"><span className="legend-dot" />Malaysia overview <span>Tree layer not connected</span></div>}</div>;
}
