"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  TreePine,
  X,
  AlertTriangle,
  ShieldCheck,
  MapPin,
  Calendar,
  Wind,
  Activity,
  ExternalLink,
  Crosshair,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  Clock,
  QrCode,
  Sparkles,
  Globe,
  Map as MapIcon,
} from "lucide-react";

export type MapViewMode = "default" | "satellite";

const FREE_REAL_MAP_STYLES: Record<MapViewMode, mapboxgl.StyleSpecification> = {
  default: {
    version: 8,
    name: "Elmina Default Street & Park GIS",
    sources: {
      "carto-voyager": {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
          "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
          "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        ],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors © CARTO",
      },
    },
    layers: [
      {
        id: "carto-voyager-layer",
        type: "raster",
        source: "carto-voyager",
        minzoom: 0,
        maxzoom: 20,
      },
    ],
  },
  satellite: {
    version: 8,
    name: "Elmina Satellite Hybrid Imagery",
    sources: {
      "esri-world-imagery": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "© Esri, Maxar, Earthstar Geographics",
      },
      "esri-transportation": {
        type: "raster",
        tiles: [
          "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
      },
      "carto-labels": {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}@2x.png",
          "https://b.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}@2x.png",
        ],
        tileSize: 256,
      },
    },
    layers: [
      {
        id: "esri-satellite-base",
        type: "raster",
        source: "esri-world-imagery",
        minzoom: 0,
        maxzoom: 19,
      },
      {
        id: "esri-satellite-roads",
        type: "raster",
        source: "esri-transportation",
        minzoom: 0,
        maxzoom: 19,
        paint: {
          "raster-opacity": 0.85,
        },
      },
      {
        id: "carto-hybrid-labels",
        type: "raster",
        source: "carto-labels",
        minzoom: 0,
        maxzoom: 20,
      },
    ],
  },
};

const MAPBOX_CLOUD_STYLES: Record<MapViewMode, string> = {
  default: "mapbox://styles/mapbox/navigation-night-v1",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
};

export type HandoverStatus =
  | "PRE_HANDOVER_PLANTED"
  | "DLP_ACTIVE"
  | "COMMISSIONED";

export interface HazardReportItem {
  id: number;
  tree_id: string;
  reporter_id: string;
  hazard_type: "STORM_DAMAGE" | "ROOT_HEAVE" | "DRY_FOLIAGE" | "PEST";
  description: string;
  evidence_photo_url: string;
  status: "REPORTED" | "TRIAGED" | "DISPATCHED" | "RESOLVED";
  ai_severity_grade: "LOW" | "MEDIUM" | "CRITICAL_24H";
  ai_confidence: number;
  reported_at: string;
}

export interface MaintenanceRecordItem {
  id: number;
  hazard_id?: number | null;
  tree_id: string;
  contractor_id: string;
  action_type: "CANOPY_PRUNING" | "DEEP_ROOT_WATERING" | "REPLACED_SAPLING";
  before_photo_url: string;
  after_photo_url: string;
  notes: string;
  ai_verification_passed: boolean;
  arbitrum_tx_hash: string;
  completed_at: string;
}

export interface TreeAsset {
  id: string;
  precinct: string;
  species: string;
  common_name: string;
  handover_status: HandoverStatus;
  planted_at: string;
  co2_kg_per_year: number;
  biomass_kg: number;
  health_score: number;
  latitude: number;
  longitude: number;
  qr_code_hash: string;
  canopy_diameter_m: number;
  hazards?: HazardReportItem[];
  maintenance_logs?: MaintenanceRecordItem[];
}

export interface TownshipMapProps {
  trees: TreeAsset[];
  selectedTreeId: string | null;
  onSelectTree: (tree: TreeAsset | null) => void;
  onDispatchSlaOrder?: (tree: TreeAsset) => void;
  handoverFilter: "ALL" | HandoverStatus;
  healthFilter: "ALL" | "HEALTHY" | "WARNING" | "CRITICAL";
}

// Elmina Central Park center coordinates: [lat: 3.195, lng: 101.515]
export const ELMINA_CENTER_LAT = 3.195;
export const ELMINA_CENTER_LNG = 101.515;

export function getHealthBand(score: number): {
  label: "Healthy" | "Moderate Stress" | "Critical Action";
  tier: "HEALTHY" | "WARNING" | "CRITICAL";
  hex: string;
  ringHex: string;
  badgeClass: string;
  dotClass: string;
} {
  if (score >= 80) {
    return {
      label: "Healthy",
      tier: "HEALTHY",
      hex: "#10b981", // emerald-500
      ringHex: "rgba(16, 185, 129, 0.35)",
      badgeClass:
        "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
      dotClass: "bg-emerald-400",
    };
  }
  if (score >= 50) {
    return {
      label: "Moderate Stress",
      tier: "WARNING",
      hex: "#f59e0b", // amber-500
      ringHex: "rgba(245, 158, 11, 0.35)",
      badgeClass: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
      dotClass: "bg-amber-400",
    };
  }
  return {
    label: "Critical Action",
    tier: "CRITICAL",
    hex: "#ef4444", // red-500
    ringHex: "rgba(239, 68, 68, 0.45)",
    badgeClass: "bg-red-500/15 text-red-300 border border-red-500/30",
    dotClass: "bg-red-500",
  };
}

export function formatHandoverStatus(status: HandoverStatus): {
  label: string;
  shortLabel: string;
  badgeClass: string;
} {
  switch (status) {
    case "PRE_HANDOVER_PLANTED":
      return {
        label: "Pre-Handover Audit",
        shortLabel: "Pre-Handover",
        badgeClass: "bg-sky-500/15 text-sky-300 border border-sky-500/30",
      };
    case "DLP_ACTIVE":
      return {
        label: "DLP Active Stewardship",
        shortLabel: "DLP Active",
        badgeClass:
          "bg-violet-500/15 text-violet-300 border border-violet-500/30",
      };
    case "COMMISSIONED":
      return {
        label: "Commissioned Township",
        shortLabel: "Commissioned",
        badgeClass: "bg-slate-700/70 text-slate-200 border border-slate-600",
      };
  }
}

export default function TownshipMap({
  trees,
  selectedTreeId,
  onSelectTree,
  onDispatchSlaOrder,
  handoverFilter,
  healthFilter,
}: TownshipMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() || "";
  const [useFallbackMap, setUseFallbackMap] = useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapStyleMode, setMapStyleMode] = useState<MapViewMode>("default");
  const [fallbackZoom, setFallbackZoom] = useState<number>(1);
  const [dispatchedFeedbackId, setDispatchedFeedbackId] = useState<
    string | null
  >(null);

  const filteredTrees = useMemo(() => {
    return trees.filter((tree) => {
      if (
        handoverFilter !== "ALL" &&
        tree.handover_status !== handoverFilter
      ) {
        return false;
      }
      if (healthFilter !== "ALL") {
        const band = getHealthBand(tree.health_score);
        if (band.tier !== healthFilter) return false;
      }
      return true;
    });
  }, [trees, handoverFilter, healthFilter]);

  const selectedTree = useMemo(
    () => trees.find((t) => t.id === selectedTreeId) || null,
    [trees, selectedTreeId]
  );

  // Initialize Real WebGL Map centered on Elmina Central Park
  useEffect(() => {
    if (useFallbackMap || !mapContainerRef.current) {
      return;
    }

    let isCancelled = false;

    try {
      const mapProto = mapboxgl.Map.prototype as unknown as {
        _authenticate?: () => void;
        _revokeAuth?: () => void;
      };
      mapProto._authenticate = () => {};
      mapProto._revokeAuth = () => {};

      if (mapboxToken) {
        mapboxgl.accessToken = mapboxToken;
      }

      const initialStyle = mapboxToken
        ? MAPBOX_CLOUD_STYLES[mapStyleMode]
        : FREE_REAL_MAP_STYLES[mapStyleMode];

      const mapOptions: mapboxgl.MapOptions & { testMode?: boolean } = {
        container: mapContainerRef.current,
        style: initialStyle,
        center: [ELMINA_CENTER_LNG, ELMINA_CENTER_LAT],
        zoom: 14.8,
        pitch: 28,
        bearing: 0,
        attributionControl: false,
        testMode: !mapboxToken,
      };

      const map = new mapboxgl.Map(mapOptions);

      mapInstanceRef.current = map;

      map.on("load", () => {
        if (!isCancelled) {
          setMapLoaded(true);
        }
      });

      map.on("style.load", () => {
        if (!isCancelled) {
          setMapLoaded(true);
        }
      });

      map.on("error", () => {
        if (!isCancelled && mapInstanceRef.current && mapboxToken) {
          try {
            mapInstanceRef.current.setStyle(FREE_REAL_MAP_STYLES[mapStyleMode]);
            setMapLoaded(true);
          } catch {
            setUseFallbackMap(true);
          }
        }
      });

      return () => {
        isCancelled = true;
        markersRef.current.forEach((m) => m.remove());
        markersRef.current.clear();
        map.remove();
        mapInstanceRef.current = null;
        setMapLoaded(false);
      };
    } catch {
      // Deliver the renderer failure after initialization; do not update React
      // synchronously while the map initialization effect is running.
      queueMicrotask(() => { if (!isCancelled) setUseFallbackMap(true); });
      return () => { isCancelled = true; };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxToken, useFallbackMap]);

  const handleToggleMapStyle = (nextMode: MapViewMode) => {
    setMapStyleMode(nextMode);
    if (!useFallbackMap && mapInstanceRef.current) {
      try {
        const nextStyle = mapboxToken
          ? MAPBOX_CLOUD_STYLES[nextMode]
          : FREE_REAL_MAP_STYLES[nextMode];
        mapInstanceRef.current.setStyle(nextStyle);
      } catch {
        setUseFallbackMap(true);
      }
    }
  };

  // Synchronize HTML markers on Mapbox instance
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (useFallbackMap || !map || !mapLoaded) return;

    // Clear outdated markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    filteredTrees.forEach((tree) => {
      const band = getHealthBand(tree.health_score);
      const isSelected = tree.id === selectedTreeId;

      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", `Inspect tree ${tree.id}`);
      el.style.width = isSelected ? "28px" : "20px";
      el.style.height = isSelected ? "28px" : "20px";
      el.style.borderRadius = "9999px";
      el.style.backgroundColor = band.hex;
      el.style.border = isSelected
        ? "3px solid #f8fafc"
        : "2px solid rgba(15, 23, 42, 0.9)";
      el.style.boxShadow = isSelected
        ? `0 0 0 6px ${band.ringHex}, 0 4px 14px rgba(0,0,0,0.6)`
        : `0 0 0 4px ${band.ringHex}`;
      el.style.cursor = "pointer";
      el.style.transition = "all 150ms ease";

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectTree(tree);
        map.flyTo({
          center: [tree.longitude, tree.latitude],
          zoom: Math.max(map.getZoom(), 15.6),
          duration: 650,
        });
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([tree.longitude, tree.latitude])
        .addTo(map);

      markersRef.current.set(tree.id, marker);
    });
  }, [filteredTrees, selectedTreeId, useFallbackMap, mapLoaded, onSelectTree]);

  const handleRecenter = () => {
    if (!useFallbackMap && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [ELMINA_CENTER_LNG, ELMINA_CENTER_LAT],
        zoom: 14.8,
        pitch: 28,
        bearing: 0,
        duration: 800,
      });
    } else {
      setFallbackZoom(1);
    }
  };

  const handleZoom = (delta: number) => {
    if (!useFallbackMap && mapInstanceRef.current) {
      const nextZoom = mapInstanceRef.current.getZoom() + delta;
      mapInstanceRef.current.zoomTo(nextZoom, { duration: 250 });
    } else {
      setFallbackZoom((z) =>
        Math.min(1.6, Math.max(0.75, Number((z + delta * 0.15).toFixed(2))))
      );
    }
  };

  // Convert lat/lng around Elmina Central Park ([3.195, 101.515]) to percentage coordinates for the resilient GIS canvas
  const projectToCanvasPercent = (lat: number, lng: number) => {
    const latSpan = 0.018; // ~2km vertical window around 3.195
    const lngSpan = 0.024; // ~2.6km horizontal window around 101.515
    const x = 50 + ((lng - ELMINA_CENTER_LNG) / (lngSpan / 2)) * 42;
    const y = 50 - ((lat - ELMINA_CENTER_LAT) / (latSpan / 2)) * 42;
    return {
      x: Math.min(92, Math.max(8, x)),
      y: Math.min(90, Math.max(10, y)),
    };
  };

  const handleDispatchOrder = (tree: TreeAsset) => {
    setDispatchedFeedbackId(tree.id);
    if (onDispatchSlaOrder) {
      onDispatchSlaOrder(tree);
    }
    setTimeout(() => {
      setDispatchedFeedbackId((curr) => (curr === tree.id ? null : curr));
    }, 3000);
  };

  return (
    <div className="relative w-full h-[540px] lg:h-[600px] rounded-2xl bg-slate-950 border border-slate-800/90 overflow-hidden shadow-2xl flex">
      {/* Top-Left Geospatial HUD Overlay */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3.5 py-2 flex items-center gap-2.5 shadow-lg">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <div>
            <div className="text-xs font-semibold text-slate-100 tracking-wide flex items-center gap-1.5">
              <span>ELMINA CENTRAL PARK GIS</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                [3.1950° N, 101.5150° E]
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Showing {filteredTrees.length} of {trees.length} dMRV-indexed
              canopy assets
            </p>
          </div>
        </div>

        {/* Default vs. Satellite View Toggle */}
        <div
          className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-1 flex items-center gap-1 shadow-lg"
          role="group"
          aria-label="Map view mode toggle"
        >
          <button
            type="button"
            onClick={() => handleToggleMapStyle("default")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              mapStyleMode === "default"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-300 hover:text-white"
            }`}
            title="Default Map View (Street & Park GIS)"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Default</span>
          </button>
          <button
            type="button"
            onClick={() => handleToggleMapStyle("satellite")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              mapStyleMode === "satellite"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-300 hover:text-white"
            }`}
            title="Satellite Map View (High-Res Aerial Imagery)"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Satellite</span>
          </button>
        </div>
      </div>

      {/* Bottom-Left Color Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-lg pointer-events-auto">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Canopy Health Grading (Gemini 3.8 Vision)
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
            <span className="text-slate-200 font-medium">
              Healthy <span className="text-slate-400 font-mono">(&ge;80)</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-500/20" />
            <span className="text-slate-200 font-medium">
              Amber <span className="text-slate-400 font-mono">(50–79)</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-500/25" />
            <span className="text-slate-200 font-medium">
              Critical <span className="text-slate-400 font-mono">(&lt;50)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Map Navigation Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={() => handleZoom(1)}
          className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 shadow-lg transition cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(-1)}
          className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 shadow-lg transition cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleRecenter}
          className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border border-slate-800 shadow-lg transition cursor-pointer"
          title="Recenter on Elmina Central Park [3.195, 101.515]"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Map Viewport */}
      <div className="relative flex-1 h-full">
        {!useFallbackMap ? (
          <div ref={mapContainerRef} className="w-full h-full" />
        ) : (
          /* High-Precision Tactical GIS Vector Map Fallback centered on Elmina Central Park [3.195, 101.515] */
          <div
            onClick={() => onSelectTree(null)}
            className="relative w-full h-full bg-slate-950 overflow-hidden select-none"
          >
            {/* Topographic & Hydrology SVG Layer */}
            <svg
              viewBox="0 0 1000 600"
              preserveAspectRatio="xMidYMid slice"
              className="w-full h-full opacity-90 transition-transform duration-300"
              style={{ transform: `scale(${fallbackZoom})` }}
            >
              <defs>
                <pattern
                  id="gis-grid"
                  width="50"
                  height="50"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 50 0 L 0 0 0 50"
                    fill="none"
                    stroke="rgba(51, 65, 85, 0.32)"
                    strokeWidth="1"
                  />
                </pattern>
                <radialGradient id="elmina-park-glow" cx="50%" cy="50%" r="48%">
                  <stop offset="0%" stopColor="rgba(16, 185, 129, 0.16)" />
                  <stop offset="65%" stopColor="rgba(15, 23, 42, 0.05)" />
                  <stop offset="100%" stopColor="rgba(2, 6, 23, 0)" />
                </radialGradient>
              </defs>

              {/* Coordinate Grid */}
              <rect width="1000" height="600" fill="url(#gis-grid)" />
              <circle
                cx="500"
                cy="300"
                r="260"
                fill="url(#elmina-park-glow)"
              />

              {/* Precinct Boundary Polygons */}
              <polygon
                points="210,110 560,90 620,290 480,450 220,410"
                fill="rgba(16, 185, 129, 0.05)"
                stroke="rgba(16, 185, 129, 0.25)"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
              <polygon
                points="575,95 860,130 880,390 630,430 625,290"
                fill="rgba(56, 189, 248, 0.04)"
                stroke="rgba(56, 189, 248, 0.22)"
                strokeWidth="1.5"
                strokeDasharray="5 5"
              />
              <polygon
                points="160,420 475,455 615,435 590,555 170,545"
                fill="rgba(168, 85, 247, 0.04)"
                stroke="rgba(168, 85, 247, 0.22)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Sungai Buloh / Elmina Retention Lake & Bio-Swale Waterway */}
              <path
                d="M 40,390 C 190,360 310,250 470,275 C 620,300 730,220 960,180"
                fill="none"
                stroke="rgba(14, 165, 233, 0.22)"
                strokeWidth="26"
                strokeLinecap="round"
              />
              <path
                d="M 40,390 C 190,360 310,250 470,275 C 620,300 730,220 960,180"
                fill="none"
                stroke="rgba(56, 189, 248, 0.45)"
                strokeWidth="3"
                strokeDasharray="10 6"
              />

              {/* Guthrie Corridor Expressway (GCE) & Persiaran Shorea Arterial Roads */}
              <path
                d="M 120,40 L 890,540"
                fill="none"
                stroke="rgba(71, 85, 105, 0.45)"
                strokeWidth="6"
              />
              <path
                d="M 280,570 L 740,50"
                fill="none"
                stroke="rgba(71, 85, 105, 0.35)"
                strokeWidth="4"
              />

              {/* Radar Range Rings around Elmina Central Park [3.195, 101.515] */}
              <circle
                cx="500"
                cy="300"
                r="95"
                fill="none"
                stroke="rgba(148, 163, 184, 0.14)"
                strokeWidth="1"
              />
              <circle
                cx="500"
                cy="300"
                r="195"
                fill="none"
                stroke="rgba(148, 163, 184, 0.12)"
                strokeWidth="1"
              />

              {/* Precinct Zone Labels */}
              <text
                x="250"
                y="142"
                fill="rgba(16, 185, 129, 0.65)"
                fontSize="11"
                fontWeight="600"
                letterSpacing="1.5"
              >
                ELMINA CENTRAL PARK (CORE URBAN FOREST)
              </text>
              <text
                x="635"
                y="140"
                fill="rgba(56, 189, 248, 0.65)"
                fontSize="11"
                fontWeight="600"
                letterSpacing="1.5"
              >
                SECTOR 4A — ILHAM RESIDENCE (PRE-HANDOVER)
              </text>
              <text
                x="210"
                y="525"
                fill="rgba(192, 132, 252, 0.65)"
                fontSize="11"
                fontWeight="600"
                letterSpacing="1.5"
              >
                ELMINA GREEN SIX &amp; VALLEY PRECINCTS
              </text>
            </svg>

            {/* Interactive Tree Asset Markers */}
            <div
              className="absolute inset-0 transition-transform duration-300"
              style={{ transform: `scale(${fallbackZoom})` }}
            >
              {filteredTrees.map((tree) => {
                const pos = projectToCanvasPercent(
                  tree.latitude,
                  tree.longitude
                );
                const band = getHealthBand(tree.health_score);
                const isSelected = tree.id === selectedTreeId;
                const hasCriticalHazard = tree.hazards?.some(
                  (h) =>
                    h.status !== "RESOLVED" &&
                    h.ai_severity_grade === "CRITICAL_24H"
                );

                return (
                  <button
                    key={tree.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTree(tree);
                    }}
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                    }}
                    className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none cursor-pointer z-10"
                  >
                    {/* Pulse aura for critical or selected markers */}
                    {(isSelected || band.tier === "CRITICAL") && (
                      <span
                        className="absolute -inset-2 rounded-full animate-ping opacity-60"
                        style={{ backgroundColor: band.hex }}
                      />
                    )}

                    <div
                      className={`relative flex items-center justify-center rounded-full transition-all duration-150 ${
                        isSelected
                          ? "w-8 h-8 ring-4 ring-white/90 scale-110 shadow-xl"
                          : "w-5 h-5 hover:scale-125 ring-2 ring-slate-950/90"
                      }`}
                      style={{
                        backgroundColor: band.hex,
                        boxShadow: `0 0 14px ${band.ringHex}`,
                      }}
                    >
                      <TreePine
                        className={`${
                          isSelected ? "w-4 h-4" : "w-3 h-3"
                        } text-slate-950 stroke-[2.5]`}
                      />
                      {hasCriticalHazard && !isSelected && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-white" />
                      )}
                    </div>

                    {/* Hover Mini-Tooltip */}
                    <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-slate-900/95 border border-slate-700 shadow-xl whitespace-nowrap z-30">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white">
                        <span className="font-mono text-emerald-400">
                          {tree.id}
                        </span>
                        <span>•</span>
                        <span>{tree.common_name}</span>
                      </div>
                      <div className="text-[10px] text-slate-300 flex items-center gap-2 mt-0.5">
                        <span>Health: {tree.health_score}/100</span>
                        <span>•</span>
                        <span>{tree.co2_kg_per_year} kg CO₂/yr</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick-Inspect Slide-Over Drawer for Clicked Tree */}
      <div
        className={`absolute top-0 right-0 h-full w-full sm:w-[410px] bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 z-30 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${
          selectedTree ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedTree && (
          <>
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-start justify-between gap-3 bg-slate-950/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                    {selectedTree.id}
                  </span>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      formatHandoverStatus(selectedTree.handover_status)
                        .badgeClass
                    }`}
                  >
                    {
                      formatHandoverStatus(selectedTree.handover_status)
                        .shortLabel
                    }
                  </span>
                </div>
                <h3 className="text-base font-semibold text-slate-100 mt-1.5">
                  {selectedTree.common_name}
                </h3>
                <p className="text-xs italic text-slate-400">
                  {selectedTree.species}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onSelectTree(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close tree inspector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Health Score Gauge Card */}
              {(() => {
                const band = getHealthBand(selectedTree.health_score);
                return (
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                        Canopy Vitality Index
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${band.badgeClass}`}
                      >
                        {band.label} ({selectedTree.health_score}/100)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${selectedTree.health_score}%`,
                          backgroundColor: band.hex,
                        }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Telemetry Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/90">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-emerald-400" />
                    CO₂ Sequestration
                  </div>
                  <div className="text-sm font-bold text-slate-100 mt-1 font-mono">
                    {selectedTree.co2_kg_per_year.toFixed(1)} kg/yr
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Biomass: {selectedTree.biomass_kg} kg
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/90">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    PostGIS Telemetry
                  </div>
                  <div className="text-xs font-mono font-semibold text-slate-200 mt-1">
                    {selectedTree.latitude.toFixed(5)}° N
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    {selectedTree.longitude.toFixed(5)}° E
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/90">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-violet-400" />
                    Planted Date
                  </div>
                  <div className="text-xs font-semibold text-slate-200 mt-1">
                    {new Date(selectedTree.planted_at).toLocaleDateString(
                      "en-MY",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Canopy Ø {selectedTree.canopy_diameter_m.toFixed(1)}m
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/90">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-amber-400" />
                    Asset QR Hash
                  </div>
                  <div className="text-xs font-mono text-slate-200 mt-1 truncate">
                    {selectedTree.qr_code_hash}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {selectedTree.precinct}
                  </div>
                </div>
              </div>

              {/* Active AI Vision Hazard Reports */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Gemini 3.8 Vision Triage Feed
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    {selectedTree.hazards?.length || 0} record(s)
                  </span>
                </div>

                {selectedTree.hazards && selectedTree.hazards.length > 0 ? (
                  selectedTree.hazards.map((hazard) => (
                    <div
                      key={hazard.id}
                      className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-amber-300 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          {hazard.hazard_type.replace(/_/g, " ")}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                            hazard.ai_severity_grade === "CRITICAL_24H"
                              ? "bg-red-500/20 text-red-300 border border-red-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {hazard.ai_severity_grade} (
                          {Math.round(hazard.ai_confidence * 100)}% conf)
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {hazard.description}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                        <span>Status: {hazard.status}</span>
                        <span>Reporter: {hazard.reporter_id}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/70 text-xs text-slate-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    No active structural or foliar hazards reported.
                  </div>
                )}
              </div>

              {/* Arbitrum Sepolia Proof-of-Work Ledger */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Arbitrum Sepolia dMRV Audit Trail
                </h4>

                {selectedTree.maintenance_logs &&
                selectedTree.maintenance_logs.length > 0 ? (
                  selectedTree.maintenance_logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-300">
                          {log.action_type.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(log.completed_at).toLocaleDateString(
                            "en-MY"
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{log.notes}</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-400">
                          Contractor:{" "}
                          <strong className="text-slate-200">
                            {log.contractor_id}
                          </strong>
                        </span>
                        <a
                          href={`https://sepolia.arbiscan.io/tx/${log.arbitrum_tx_hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1"
                        >
                          {log.arbitrum_tx_hash.slice(0, 10)}...
                          {log.arbitrum_tx_hash.slice(-6)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/70 text-xs text-slate-400">
                    Baseline planting hash anchored on Arbitrum Sepolia. No
                    remedial maintenance cycles required yet.
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer CTA */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80">
              {dispatchedFeedbackId === selectedTree.id ? (
                <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  SLA Work Order Dispatched to Contractor Queue
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDispatchOrder(selectedTree)}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Dispatch Priority SLA Work Order
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
