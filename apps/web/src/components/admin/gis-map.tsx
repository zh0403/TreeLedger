"use client";

import { useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { Map as MapboxMap, Marker, StyleSpecification } from "mapbox-gl";
import { MapPin, RefreshCw, TreePine } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  hasCoordinates,
  healthLabels,
  type AdminTreeRecord,
  type Basemap,
  type MapState,
  type MapView,
} from "./gis-data";

// High-contrast, clean light geographic basemap (OpenStreetMap raster with light cartographic grading)
const lightGeographicStyle: StyleSpecification = {
  version: 8,
  sources: {
    geography: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: "geography",
      type: "raster",
      source: "geography",
      paint: {
        "raster-saturation": -0.55,
        "raster-contrast": 0.08,
        "raster-brightness-min": 0.06,
        "raster-brightness-max": 0.98,
      },
    },
  ],
};

// High-availability satellite imagery style
const satelliteRasterStyle: StyleSpecification = {
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
      paint: {
        "raster-saturation": -0.1,
        "raster-brightness-max": 0.92,
      },
    },
  ],
};

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

function getBadgeStyle(
  health: AdminTreeRecord["health"],
  showHealth: boolean
): { bg: string; border: string; fg: string } {
  if (!showHealth) {
    return { bg: "#59c8e8", border: "#0b1d18", fg: "#071c16" };
  }
  switch (health) {
    case "healthy":
      return { bg: "#a3e1b5", border: "#0b241d", fg: "#071c16" };
    case "attention":
      return { bg: "#e5ae50", border: "#0b241d", fg: "#071c16" };
    case "critical":
      return { bg: "#e36b67", border: "#0b241d", fg: "#071c16" };
    default:
      return { bg: "#b6c4bc", border: "#0b241d", fg: "#071c16" };
  }
}

export function GISMap({
  records,
  basemap,
  showTrees,
  showHealth,
  opacity,
  selectedId,
  onSelect,
  onStatus,
  onViewChange,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const hasFittedBounds = useRef(false);
  const viewRef = useRef<MapView>({
    longitude: 101.5155,
    latitude: 3.1885,
    zoom: 14.8,
  });
  const [state, setState] = useState<MapState>({
    status: "loading",
    basemap,
    fallback: false,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let disposed = false;
    let instance: MapboxMap | null = null;
    let observer: ResizeObserver | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    const report = (
      status: MapState["status"],
      degraded = false,
      fallback = false
    ) => {
      if (disposed) return;
      const next: MapState = { status, basemap, fallback, degraded };
      setState(next);
      onStatus(next);
    };

    const boot = async () => {
      report("loading");
      try {
        const { default: mapboxgl } = await import("mapbox-gl");
        if (disposed || !container.current) return;
        const previous = viewRef.current;

        instance = new mapboxgl.Map({
          container: container.current,
          accessToken:
            token && token.startsWith("pk.")
              ? token
              : "pk.eyJ1IjoidHJlZWxlZGdlciIsImEiOiJjbHBsYWNlaG9sZGVyIn0.0",
          style:
            basemap === "satellite"
              ? satelliteRasterStyle
              : lightGeographicStyle,
          center: [previous.longitude, previous.latitude],
          zoom: previous.zoom,
          attributionControl: true,
        });
        mapRef.current = instance;
        const map = instance;

        map.addControl(new mapboxgl.NavigationControl(), "top-right");
        map.addControl(
          new mapboxgl.ScaleControl({ maxWidth: 110, unit: "metric" }),
          "bottom-left"
        );

        const updateView = () => {
          const c = map.getCenter();
          viewRef.current = {
            longitude: c.lng,
            latitude: c.lat,
            zoom: map.getZoom(),
          };
          onViewChange(viewRef.current);
        };

        const markReady = () => {
          if (disposed) return;
          clearTimeout(timer);
          map.resize();
          report("ready", false, false);
          updateView();
        };

        map.on("moveend", updateView);
        map.on("load", markReady);
        map.on("idle", markReady);

        if (typeof ResizeObserver !== "undefined" && container.current) {
          observer = new ResizeObserver(() => {
            map.resize();
          });
          observer.observe(container.current);
        }

        timer = setTimeout(markReady, 4000);
      } catch {
        clearTimeout(timer);
        report("error");
      }
    };

    void boot();
    return () => {
      disposed = true;
      clearTimeout(timer);
      observer?.disconnect();
      instance?.remove();
      mapRef.current = null;
    };
  }, [basemap, attempt, onStatus, onViewChange]);

  // Render tactile circular TreePine badge markers (matching /app resident-map.tsx)
  useEffect(() => {
    if (state.status !== "ready" || !mapRef.current) return;
    let disposed = false;
    const markers: Marker[] = [];
    const roots: Root[] = [];
    const instance = mapRef.current;
    const located = records.filter(hasCoordinates);

    if (!showTrees) {
      return;
    }

    void import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (disposed) return;

      for (const tree of located) {
        const isSelected = selectedId === tree.id;
        const health = tree.health ?? "unassessed";
        const badge = getBadgeStyle(health, showHealth);

        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute(
          "aria-label",
          `${tree.id} (${tree.species ?? "Tree"}): ${healthLabels[health]}${
            typeof tree.healthScore === "number" ? ` · ${tree.healthScore}%` : ""
          }`
        );
        button.setAttribute("aria-pressed", String(isSelected));
        button.style.position = "relative";
        button.style.display = "grid";
        button.style.placeItems = "center";
        button.style.padding = "0";
        button.style.width = isSelected ? "44px" : "38px";
        button.style.height = isSelected ? "44px" : "38px";
        button.style.borderRadius = "50%";
        button.style.border = `2px solid ${badge.border}`;
        button.style.background = badge.bg;
        button.style.color = badge.fg;
        button.style.opacity = String(opacity);
        button.style.cursor = "pointer";
        button.style.boxShadow = isSelected
          ? "0 0 0 4px rgba(82, 217, 165, 0.55), 0 8px 22px rgba(7, 28, 22, 0.48)"
          : "0 3px 12px rgba(7, 28, 22, 0.34)";
        if (isSelected) {
          button.style.outline = "2.5px solid #071c16";
          button.style.outlineOffset = "2px";
          button.style.zIndex = "10";
        }

        button.addEventListener("click", (event) => {
          event.stopPropagation();
          onSelect(tree);
          const phone = window.innerWidth < 760;
          instance.flyTo({
            center: [tree.coordinates[0], tree.coordinates[1]],
            zoom: Math.max(instance.getZoom(), 16.3),
            duration: matchMedia("(prefers-reduced-motion: reduce)").matches
              ? 0
              : 750,
            padding: {
              top: 75,
              bottom: phone ? Math.round(window.innerHeight * 0.45) : 80,
              left: phone ? 30 : 75,
              right: phone ? 30 : 325,
            },
          });
        });

        const root = createRoot(button);
        root.render(
          <span
            style={{
              position: "relative",
              display: "grid",
              placeItems: "center",
              width: "100%",
              height: "100%",
            }}
          >
            <TreePine size={18} strokeWidth={1.9} aria-hidden="true" />
            {health === "critical" && (
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-5px",
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  background: "#071c16",
                  color: "#ff8a86",
                  border: "1.5px solid #e36b67",
                  fontSize: "10px",
                  fontWeight: 800,
                  lineHeight: "13px",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                !
              </span>
            )}
          </span>
        );
        roots.push(root);
        markers.push(
          new mapboxgl.Marker({ element: button })
            .setLngLat([tree.coordinates[0], tree.coordinates[1]])
            .addTo(instance)
        );
      }

      if (located.length > 0 && !hasFittedBounds.current && !selectedId) {
        hasFittedBounds.current = true;
        const bounds = new mapboxgl.LngLatBounds();
        located.forEach((tree) =>
          bounds.extend([tree.coordinates[0], tree.coordinates[1]])
        );
        instance.fitBounds(bounds, {
          padding: { top: 90, bottom: 90, left: 90, right: 330 },
          maxZoom: 15.8,
          duration: 0,
        });
      }
    });

    return () => {
      disposed = true;
      markers.forEach((marker) => marker.remove());
      roots.forEach((root) => root.unmount());
    };
  }, [records, state.status, showTrees, showHealth, opacity, selectedId, onSelect]);

  // Smoothly flyTo when a tree is selected from the registry or operational panels
  useEffect(() => {
    const tree = records.find((record) => record.id === selectedId);
    const map = mapRef.current;
    if (!tree || !hasCoordinates(tree) || state.status !== "ready" || !map) {
      return;
    }
    const phone = window.innerWidth < 760;
    map.flyTo({
      center: [tree.coordinates[0], tree.coordinates[1]],
      zoom: Math.max(map.getZoom(), 16.3),
      duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 750,
      padding: {
        top: 75,
        bottom: phone ? Math.round(window.innerHeight * 0.45) : 80,
        left: phone ? 30 : 75,
        right: phone ? 30 : 325,
      },
    });
  }, [selectedId, records, state.status]);

  return (
    <div
      className="gis-map"
      data-map-status={state.status}
      data-basemap={state.basemap}
      style={{
        background: basemap === "geographic" ? "#e9efe9" : "var(--gis-base)",
      }}
    >
      <div
        ref={container}
        className="gis-map-canvas"
        aria-label="Interactive geographic map of City of Elmina"
        style={{ width: "100%", height: "100%" }}
      />
      {state.status !== "ready" && (
        <div className="gis-map-message" role="status">
          {state.status === "loading" ? (
            <>
              <span className="gis-loading-mark" />
              <h2>Opening the geographic view</h2>
              <p>Loading City of Elmina light cartography and TreePine canopy markers.</p>
            </>
          ) : (
            <>
              <MapPin size={28} strokeWidth={1.4} aria-hidden="true" />
              <h2>Basemap unavailable</h2>
              <p>Check WebGL support and network connection.</p>
              <button
                type="button"
                onClick={() => setAttempt((value) => value + 1)}
              >
                <RefreshCw size={14} aria-hidden="true" />
                Retry basemap
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
