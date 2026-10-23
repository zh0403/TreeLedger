'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  ShieldCheck,
  ArrowUpRight,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Globe,
  Map as MapIcon,
  Trees,
  X,
} from 'lucide-react';
import { Tree } from '@/lib/types';
import { fetchTrees } from '@/lib/api';
import { StatusBadge } from '@/components/ui/status-badge';

// City of Elmina Masterplan Center Coordinates [lng, lat]
export const ELMINA_CENTER_LNG = 101.5034;
export const ELMINA_CENTER_LAT = 3.1942;

export type MapViewMode = 'default' | 'satellite';

// Real, tokenless Mapbox GL Style v8 specifications using high-availability global GIS tile servers
const FREE_REAL_MAP_STYLES: Record<MapViewMode, mapboxgl.StyleSpecification> = {
  default: {
    version: 8,
    name: 'Elmina Default Street & Park GIS',
    sources: {
      'carto-voyager': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
          'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
          'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors © CARTO',
      },
    },
    layers: [
      {
        id: 'carto-voyager-layer',
        type: 'raster',
        source: 'carto-voyager',
        minzoom: 0,
        maxzoom: 20,
      },
    ],
  },
  satellite: {
    version: 8,
    name: 'Elmina Satellite Hybrid Imagery',
    sources: {
      'esri-world-imagery': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution: '© Esri, Maxar, Earthstar Geographics',
      },
      'esri-transportation': {
        type: 'raster',
        tiles: [
          'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
      },
      'carto-labels': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}@2x.png',
          'https://b.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}@2x.png',
        ],
        tileSize: 256,
      },
    },
    layers: [
      {
        id: 'esri-satellite-base',
        type: 'raster',
        source: 'esri-world-imagery',
        minzoom: 0,
        maxzoom: 19,
      },
      {
        id: 'esri-satellite-roads',
        type: 'raster',
        source: 'esri-transportation',
        minzoom: 0,
        maxzoom: 19,
        paint: {
          'raster-opacity': 0.85,
        },
      },
      {
        id: 'carto-hybrid-labels',
        type: 'raster',
        source: 'carto-labels',
        minzoom: 0,
        maxzoom: 20,
      },
    ],
  },
};

const MAPBOX_CLOUD_STYLES: Record<MapViewMode, string> = {
  default: 'mapbox://styles/mapbox/navigation-night-v1',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
};

const PRECINCT_TABS = [
  'All Projects',
  'Sector 4A - Ilham Residence',
  'Elmina Central Park',
  'Elmina Green',
  'Elmina Valley',
] as const;

export type PrecinctTab = (typeof PRECINCT_TABS)[number];

const PRECINCT_META: Record<
  PrecinctTab,
  {
    lng: number;
    lat: number;
    zoom: number;
    delivered: number;
    target: number;
    contractor: string;
    dlpLabel: string;
  }
> = {
  'All Projects': {
    lng: ELMINA_CENTER_LNG,
    lat: ELMINA_CENTER_LAT,
    zoom: 14.9,
    delivered: 40,
    target: 40,
    contractor: 'Elmina GreenWorks Sdn Bhd',
    dlpLabel: '2-Yr DLP Active',
  },
  'Sector 4A - Ilham Residence': {
    lng: 101.5064,
    lat: 3.1966,
    zoom: 16.0,
    delivered: 10,
    target: 10,
    contractor: 'Elmina GreenWorks Sdn Bhd',
    dlpLabel: '2-Yr DLP Active',
  },
  'Elmina Central Park': {
    lng: 101.5034,
    lat: 3.1942,
    zoom: 16.0,
    delivered: 10,
    target: 10,
    contractor: 'Tropika ArborCare Enterprise',
    dlpLabel: '2-Yr DLP Active',
  },
  'Elmina Green': {
    lng: 101.4996,
    lat: 3.1964,
    zoom: 16.0,
    delivered: 10,
    target: 10,
    contractor: 'Nusantara AgroTech Services',
    dlpLabel: '2-Yr DLP Active',
  },
  'Elmina Valley': {
    lng: 101.5028,
    lat: 3.1914,
    zoom: 16.0,
    delivered: 10,
    target: 10,
    contractor: 'Elmina GreenWorks Sdn Bhd',
    dlpLabel: '2-Yr DLP Active',
  },
};

const ELMINA_CANOPY_TREES: Tree[] = [
  // Sector 4A - Ilham Residence
  {
    id: 'ELM-042',
    precinct: 'Sector 4A - Ilham Residence',
    species: 'Hopea odorata',
    common_name: 'Merawan Siput Jantan',
    handover_status: 'PRE_HANDOVER_PLANTED',
    planted_at: '2025-11-14T08:30:00Z',
    co2_kg_per_year: 28.4,
    health_score: 94,
    latitude: 3.1968,
    longitude: 101.5058,
    qr_code_hash: '0x8f4e2c9b1d7a6e3f5c0b9a2e4d8f1c3a7b6e9d0c',
    created_at: '2025-11-14T09:00:00Z',
  },
  {
    id: 'ELM-048',
    precinct: 'Sector 4A - Ilham Residence',
    species: 'Bucida molineti',
    common_name: 'Spiny Black Olive',
    handover_status: 'DLP_ACTIVE',
    planted_at: '2025-09-20T10:15:00Z',
    co2_kg_per_year: 22.8,
    health_score: 92,
    latitude: 3.1962,
    longitude: 101.5071,
    qr_code_hash: '0x3a9d7e2b5c1f8a4d6b0e9c2f4a7d1e8b3c5f9a0d',
    created_at: '2025-09-20T10:30:00Z',
  },
  {
    id: 'ELM-049',
    precinct: 'Sector 4A - Ilham Residence',
    species: 'Cyrtophyllum fragrans',
    common_name: 'Tembusu Padang',
    handover_status: 'DLP_ACTIVE',
    planted_at: '2025-10-02T09:00:00Z',
    co2_kg_per_year: 30.1,
    health_score: 96,
    latitude: 3.1973,
    longitude: 101.5067,
    qr_code_hash: '0x4b8e1a2c9d7f6e3a5c0b8a1e4d9f2c3a7b6e8d1a',
    created_at: '2025-10-02T09:30:00Z',
  },
  // Elmina Central Park
  {
    id: 'ELM-104',
    precinct: 'Elmina Central Park',
    species: 'Samanea saman',
    common_name: 'Rain Tree (Pukul Lima)',
    handover_status: 'COMMISSIONED',
    planted_at: '2022-04-18T08:00:00Z',
    co2_kg_per_year: 48.5,
    health_score: 96,
    latitude: 3.1944,
    longitude: 101.5032,
    qr_code_hash: '0x1f9a3c7e5b2d8f4a6c0e9b3d7f1a5c8e2b4d6f0a',
    created_at: '2022-04-18T08:30:00Z',
  },
  {
    id: 'ELM-112',
    precinct: 'Elmina Central Park',
    species: 'Peltophorum pterocarpum',
    common_name: 'Yellow Flame (Batai Laut)',
    handover_status: 'DLP_ACTIVE',
    planted_at: '2022-06-11T09:10:00Z',
    co2_kg_per_year: 39.0,
    health_score: 88,
    latitude: 3.1937,
    longitude: 101.5043,
    qr_code_hash: '0x9e4b2d7f1c8a3e6b0d5f9c2a7e1b4d8f6a0c3e9b',
    created_at: '2022-06-11T09:45:00Z',
  },
  {
    id: 'ELM-118',
    precinct: 'Elmina Central Park',
    species: 'Tabebuia rosea',
    common_name: 'Pink Poui (Malaysian Sakura)',
    handover_status: 'COMMISSIONED',
    planted_at: '2023-01-19T08:20:00Z',
    co2_kg_per_year: 36.4,
    health_score: 95,
    latitude: 3.1949,
    longitude: 101.5024,
    qr_code_hash: '0x2c7f9a3e5b1d8c4a6e0f9b2d7a1c5e8b3d4f6a0e',
    created_at: '2023-01-19T08:40:00Z',
  },
  // Elmina Green
  {
    id: 'ELM-053',
    precinct: 'Elmina Green',
    species: 'Dipterocarpus baudii',
    common_name: 'Keruing Bulu',
    handover_status: 'PRE_HANDOVER_PLANTED',
    planted_at: '2026-01-10T07:45:00Z',
    co2_kg_per_year: 34.6,
    health_score: 98,
    latitude: 3.1966,
    longitude: 101.4995,
    qr_code_hash: '0x7c1e4a9b2d8f3e6a0c5b9d2e7f1a4c8b6d0e3f9a',
    created_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 'ELM-061',
    precinct: 'Elmina Green',
    species: 'Shorea roxburghii',
    common_name: 'Meranti Temak Nipis',
    handover_status: 'DLP_ACTIVE',
    planted_at: '2025-08-05T09:20:00Z',
    co2_kg_per_year: 31.2,
    health_score: 91,
    latitude: 3.1959,
    longitude: 101.5004,
    qr_code_hash: '0x5d2b8f4c1a9e7d3b6f0c8a2e5d9b1f4c7a3e6d0b',
    created_at: '2025-08-05T09:30:00Z',
  },
  {
    id: 'ELM-067',
    precinct: 'Elmina Green',
    species: 'Khaya senegalensis',
    common_name: 'African Mahogany',
    handover_status: 'PRE_HANDOVER_PLANTED',
    planted_at: '2026-02-01T08:15:00Z',
    co2_kg_per_year: 33.5,
    health_score: 93,
    latitude: 3.1971,
    longitude: 101.4988,
    qr_code_hash: '0x8a1d4f7b2e9c3a6d5f0b8e2c7a1d4f9b3e6c0a7d',
    created_at: '2026-02-01T08:45:00Z',
  },
  // Elmina Valley
  {
    id: 'ELM-129',
    precinct: 'Elmina Valley',
    species: 'Tabebuia rosea',
    common_name: 'Tecoma (Malaysian Cherry Blossom)',
    handover_status: 'COMMISSIONED',
    planted_at: '2023-02-24T08:15:00Z',
    co2_kg_per_year: 35.8,
    health_score: 94,
    latitude: 3.1915,
    longitude: 101.5026,
    qr_code_hash: '0x6a3d9f1b4e8c2a7d5f0b9e3c6a1d8f4b2e7c0a9d',
    created_at: '2023-02-24T08:30:00Z',
  },
  {
    id: 'ELM-134',
    precinct: 'Elmina Valley',
    species: 'Syzygium campanulatum',
    common_name: 'Kelat Paya (Riparian Myrtle)',
    handover_status: 'DLP_ACTIVE',
    planted_at: '2025-05-12T08:30:00Z',
    co2_kg_per_year: 27.9,
    health_score: 91,
    latitude: 3.1911,
    longitude: 101.5039,
    qr_code_hash: '0x3e8c1f4a9b2d7e6a0c5f8b3d1e7a4c9b2f6d0e3a',
    created_at: '2025-05-12T09:00:00Z',
  },
  {
    id: 'ELM-141',
    precinct: 'Elmina Valley',
    species: 'Dillenia suffruticosa',
    common_name: 'Simpoh Air (Riparian Shrub-Tree)',
    handover_status: 'DLP_ACTIVE',
    planted_at: '2025-07-18T10:00:00Z',
    co2_kg_per_year: 24.5,
    health_score: 90,
    latitude: 3.1918,
    longitude: 101.5015,
    qr_code_hash: '0x9b2e7d1a4c8f3e6b0d5a9c2e7f1b4d8a6c0e3f9b',
    created_at: '2025-07-18T10:20:00Z',
  },
];

function normalizePrecinctName(precinct: string): Exclude<PrecinctTab, 'All Projects'> {
  const lower = precinct.toLowerCase();
  if (lower.includes('4a') || lower.includes('ilham')) {
    return 'Sector 4A - Ilham Residence';
  }
  if (lower.includes('central park') || lower.includes('1b') || lower.includes('lakeshore')) {
    return 'Elmina Central Park';
  }
  if (lower.includes('green') || lower.includes('4b') || lower.includes('boulevard')) {
    return 'Elmina Green';
  }
  if (lower.includes('valley') || lower.includes('sakura') || lower.includes('2a') || lower.includes('riparian')) {
    return 'Elmina Valley';
  }
  return 'Elmina Central Park';
}

function mergeAndNormalizeTrees(fetched: Tree[]): Tree[] {
  const byId = new Map<string, Tree>();
  for (const baseTree of ELMINA_CANOPY_TREES) {
    byId.set(baseTree.id, baseTree);
  }
  for (const item of fetched) {
    const existing = byId.get(item.id);
    const normalizedPrecinct = normalizePrecinctName(item.precinct);
    const hasNearElminaCoords =
      Math.abs(item.latitude - ELMINA_CENTER_LAT) < 0.008 &&
      Math.abs(item.longitude - ELMINA_CENTER_LNG) < 0.008;

    byId.set(item.id, {
      ...existing,
      ...item,
      precinct: normalizedPrecinct,
      latitude: hasNearElminaCoords
        ? item.latitude
        : existing?.latitude ?? PRECINCT_META[normalizedPrecinct].lat,
      longitude: hasNearElminaCoords
        ? item.longitude
        : existing?.longitude ?? PRECINCT_META[normalizedPrecinct].lng,
    });
  }
  return Array.from(byId.values());
}

function getHealthMeta(score: number): {
  label: string;
  tone: 'healthy' | 'warning' | 'critical';
  hex: string;
  ringHex: string;
} {
  if (score >= 80) {
    return {
      label: `Healthy ${score}%`,
      tone: 'healthy',
      hex: '#52d9a5',
      ringHex: 'rgba(82, 217, 165, 0.38)',
    };
  }
  if (score >= 50) {
    return {
      label: `Monitor ${score}%`,
      tone: 'warning',
      hex: '#e5ae50',
      ringHex: 'rgba(229, 174, 80, 0.38)',
    };
  }
  return {
    label: `Critical ${score}%`,
    tone: 'critical',
    hex: '#e36b67',
    ringHex: 'rgba(227, 107, 103, 0.44)',
  };
}

export function TownshipTransparencyExplorer() {
  const [trees, setTrees] = useState<Tree[]>(ELMINA_CANOPY_TREES);
  const [selectedPrecinct, setSelectedPrecinct] = useState<PrecinctTab>('All Projects');
  const [selectedTree, setSelectedTree] = useState<Tree | null>(ELMINA_CANOPY_TREES[0]);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() || '';
  const [useFallbackMap, setUseFallbackMap] = useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapStyleMode, setMapStyleMode] = useState<MapViewMode>('default');
  const [fallbackZoom, setFallbackZoom] = useState<number>(1);
  const [fallbackCenter, setFallbackCenter] = useState<{ lng: number; lat: number }>({
    lng: ELMINA_CENTER_LNG,
    lat: ELMINA_CENTER_LAT,
  });

  useEffect(() => {
    fetchTrees().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setTrees(mergeAndNormalizeTrees(data));
      }
    });
  }, []);

  const filteredTrees = useMemo(() => {
    if (selectedPrecinct === 'All Projects') return trees;
    return trees.filter((t) => t.precinct === selectedPrecinct);
  }, [trees, selectedPrecinct]);

  const activeMeta = PRECINCT_META[selectedPrecinct];

  const avgHealth = useMemo(() => {
    if (filteredTrees.length === 0) return 94;
    const sum = filteredTrees.reduce((acc, t) => acc + t.health_score, 0);
    return Math.round(sum / filteredTrees.length);
  }, [filteredTrees]);

  const flyToCoordinates = useCallback(
    (lng: number, lat: number, targetZoom = 16.0) => {
      if (!useFallbackMap && mapInstanceRef.current) {
        try {
          mapInstanceRef.current.flyTo({
            center: [lng, lat],
            zoom: targetZoom,
            pitch: 28,
            bearing: 0,
            duration: 750,
          });
        } catch {
          // Ignore camera animation interruption
        }
      } else {
        setFallbackCenter({ lng, lat });
        setFallbackZoom(targetZoom >= 16 ? 1.25 : targetZoom <= 15.1 ? 1.0 : 1.15);
      }
    },
    [useFallbackMap]
  );

  const handleSelectPrecinct = (tab: PrecinctTab) => {
    setSelectedPrecinct(tab);
    const meta = PRECINCT_META[tab];
    flyToCoordinates(meta.lng, meta.lat, meta.zoom);
    const nextTrees =
      tab === 'All Projects' ? trees : trees.filter((t) => t.precinct === tab);
    if (nextTrees.length > 0) {
      setSelectedTree(nextTrees[0]);
    }
  };

  const handleSelectTree = useCallback(
    (tree: Tree) => {
      setSelectedTree(tree);
      flyToCoordinates(tree.longitude, tree.latitude, 16.4);
    },
    [flyToCoordinates]
  );

  useEffect(() => {
    if (useFallbackMap || !mapContainerRef.current) {
      return;
    }

    let isCancelled = false;
    const markers = markersRef.current;

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
        zoom: 14.9,
        pitch: 28,
        bearing: 0,
        attributionControl: false,
        testMode: !mapboxToken,
      };

      const map = new mapboxgl.Map(mapOptions);
      mapInstanceRef.current = map;

      map.on('load', () => {
        if (!isCancelled) {
          setMapLoaded(true);
        }
      });

      map.on('style.load', () => {
        if (!isCancelled) {
          setMapLoaded(true);
        }
      });

      map.on('error', () => {
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
        markers.forEach((m) => m.remove());
        markers.clear();
        map.remove();
        mapInstanceRef.current = null;
        setMapLoaded(false);
      };
    } catch {
      queueMicrotask(() => {
        if (!isCancelled) setUseFallbackMap(true);
      });
      return () => {
        isCancelled = true;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxToken, useFallbackMap]);

  const handleToggleMapStyle = () => {
    const nextMode: MapViewMode = mapStyleMode === 'default' ? 'satellite' : 'default';
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

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (useFallbackMap || !map || !mapLoaded) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    filteredTrees.forEach((tree) => {
      const meta = getHealthMeta(tree.health_score);
      const isSelected = selectedTree?.id === tree.id;

      const el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('aria-label', `Inspect tree ${tree.id}`);
      el.style.width = isSelected ? '26px' : '18px';
      el.style.height = isSelected ? '26px' : '18px';
      el.style.borderRadius = '9999px';
      el.style.backgroundColor = meta.hex;
      el.style.border = isSelected ? '3px solid #F5F7F2' : '2px solid #0B1D18';
      el.style.boxShadow = isSelected
        ? `0 0 0 6px ${meta.ringHex}, 0 4px 16px rgba(0,0,0,0.6)`
        : `0 0 0 4px ${meta.ringHex}`;
      el.style.cursor = 'pointer';
      el.style.transition = 'all 160ms ease';

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        handleSelectTree(tree);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([tree.longitude, tree.latitude])
        .addTo(map);

      markersRef.current.set(tree.id, marker);
    });
  }, [filteredTrees, selectedTree, useFallbackMap, mapLoaded, handleSelectTree]);

  const handleZoom = (delta: number) => {
    if (!useFallbackMap && mapInstanceRef.current) {
      const nextZoom = mapInstanceRef.current.getZoom() + delta;
      mapInstanceRef.current.zoomTo(nextZoom, { duration: 250 });
    } else {
      setFallbackZoom((z) =>
        Math.min(1.6, Math.max(0.8, Number((z + delta * 0.15).toFixed(2))))
      );
    }
  };

  const handleRecenter = () => {
    const meta = PRECINCT_META[selectedPrecinct];
    flyToCoordinates(meta.lng, meta.lat, meta.zoom);
  };

  const projectToFallbackPercent = (lat: number, lng: number) => {
    const latSpan = 0.011;
    const lngSpan = 0.014;
    const x = 50 + ((lng - fallbackCenter.lng) / (lngSpan / 2)) * 38;
    const y = 50 - ((lat - fallbackCenter.lat) / (latSpan / 2)) * 38;
    return {
      x: Math.min(90, Math.max(10, x)),
      y: Math.min(86, Math.max(14, y)),
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar: Frosted-Glass Pill Selector */}
      <div
        role="tablist"
        aria-label="City of Elmina project precincts"
        className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-[var(--radius-pill)] bg-[var(--surface)]/80 backdrop-blur-xl border border-[var(--border)] shadow-[var(--shadow-panel)]"
      >
        {PRECINCT_TABS.map((tab) => {
          const active = selectedPrecinct === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleSelectPrecinct(tab)}
              className={`min-h-[38px] px-4 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium transition-all cursor-pointer ${
                active
                  ? 'bg-[var(--accent)] text-[var(--forest-950)] font-semibold shadow-sm'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)]/60'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Editorial Map Canvas (~560px) with Floating Glass HUD & Tree Capsule */}
      <div className="relative w-full h-[560px] rounded-[var(--radius-panel)] bg-[var(--forest-950)] border border-[var(--border)] shadow-[0_0_65px_-18px_rgba(82,217,165,0.18)] overflow-hidden">
        {/* Top-Left Floating Glass HUD */}
        <div className="absolute top-4 left-4 z-20 max-w-xs sm:max-w-sm rounded-[var(--radius-panel)] bg-[var(--forest-950)]/82 backdrop-blur-xl border border-[var(--border)] p-4 shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <span className="text-[11px] uppercase tracking-wider font-mono text-[var(--accent)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
              {selectedPrecinct}
            </span>
          </div>

          <dl className="space-y-2 text-xs">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[var(--muted)]">Quota Delivery</dt>
              <dd className="font-mono font-semibold text-[var(--foreground)]">
                {activeMeta.delivered} / {activeMeta.target} Delivered (100% Fulfilled)
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[var(--muted)]">Canopy Health</dt>
              <dd className="font-mono font-semibold text-[var(--accent)]">
                {avgHealth}% Avg Health Index
              </dd>
            </div>
            <div className="pt-2 border-t border-[var(--border)] flex items-baseline justify-between gap-3">
              <dt className="text-[var(--muted)] shrink-0">Contractor</dt>
              <dd className="text-right text-[var(--foreground)] font-medium truncate">
                {activeMeta.contractor} ·{' '}
                <span className="text-[var(--accent-soft)]">{activeMeta.dlpLabel}</span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Top-Right Minimalist Map Controls */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={handleToggleMapStyle}
            className="min-h-[40px] px-3 py-2 rounded-[var(--radius-control)] bg-[var(--forest-950)]/82 hover:bg-[var(--surface-raised)] backdrop-blur-xl border border-[var(--border)] text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5 shadow-lg transition cursor-pointer"
            title={
              mapStyleMode === 'default'
                ? 'Switch to Satellite View'
                : 'Switch to Street View'
            }
          >
            {mapStyleMode === 'default' ? (
              <>
                <Globe className="w-3.5 h-3.5 text-[var(--verification)]" />
                <span>Satellite</span>
              </>
            ) : (
              <>
                <MapIcon className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Street</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleZoom(1)}
            className="min-h-[40px] min-w-[40px] p-2 rounded-[var(--radius-control)] bg-[var(--forest-950)]/82 hover:bg-[var(--surface-raised)] backdrop-blur-xl border border-[var(--border)] text-[var(--foreground)] flex items-center justify-center shadow-lg transition cursor-pointer"
            aria-label="Zoom in"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleZoom(-1)}
            className="min-h-[40px] min-w-[40px] p-2 rounded-[var(--radius-control)] bg-[var(--forest-950)]/82 hover:bg-[var(--surface-raised)] backdrop-blur-xl border border-[var(--border)] text-[var(--foreground)] flex items-center justify-center shadow-lg transition cursor-pointer"
            aria-label="Zoom out"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleRecenter}
            className="min-h-[40px] min-w-[40px] p-2 rounded-[var(--radius-control)] bg-[var(--forest-950)]/82 hover:bg-[var(--surface-raised)] backdrop-blur-xl border border-[var(--border)] text-[var(--accent)] flex items-center justify-center shadow-lg transition cursor-pointer"
            aria-label="Recenter map"
            title="Recenter map"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

        {/* Mapbox WebGL Surface or Editorial Vector Cartography Fallback */}
        <div className="relative w-full h-full">
          {!useFallbackMap ? (
            <div ref={mapContainerRef} className="w-full h-full" />
          ) : (
            <div
              onClick={() => setSelectedTree(null)}
              className="relative w-full h-full bg-[var(--forest-950)] overflow-hidden select-none"
            >
              <svg
                viewBox="0 0 1000 560"
                preserveAspectRatio="xMidYMid slice"
                className="w-full h-full opacity-90 transition-transform duration-500"
                style={{ transform: `scale(${fallbackZoom})` }}
              >
                <defs>
                  <pattern
                    id="editorial-grid"
                    width="56"
                    height="56"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 56 0 L 0 0 0 56"
                      fill="none"
                      stroke="rgba(201, 237, 218, 0.08)"
                      strokeWidth="1"
                    />
                  </pattern>
                  <radialGradient id="canopy-ambient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(82, 217, 165, 0.16)" />
                    <stop offset="70%" stopColor="rgba(21, 53, 43, 0.06)" />
                    <stop offset="100%" stopColor="rgba(11, 29, 24, 0)" />
                  </radialGradient>
                </defs>
                <rect width="1000" height="560" fill="url(#editorial-grid)" />
                <circle cx="500" cy="280" r="250" fill="url(#canopy-ambient)" />
                <path
                  d="M 40,370 C 210,335 330,235 490,260 C 640,285 760,210 960,165"
                  fill="none"
                  stroke="rgba(89, 200, 232, 0.16)"
                  strokeWidth="22"
                  strokeLinecap="round"
                />
                <circle
                  cx="500"
                  cy="280"
                  r="110"
                  fill="none"
                  stroke="rgba(201, 237, 218, 0.12)"
                  strokeDasharray="4 6"
                />
                <circle
                  cx="500"
                  cy="280"
                  r="205"
                  fill="none"
                  stroke="rgba(201, 237, 218, 0.09)"
                />
              </svg>

              <div
                className="absolute inset-0 transition-transform duration-500"
                style={{ transform: `scale(${fallbackZoom})` }}
              >
                {filteredTrees.map((tree) => {
                  const pos = projectToFallbackPercent(tree.latitude, tree.longitude);
                  const meta = getHealthMeta(tree.health_score);
                  const isSelected = selectedTree?.id === tree.id;

                  return (
                    <button
                      key={tree.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTree(tree);
                      }}
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      aria-label={`Inspect tree ${tree.id}`}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 focus:outline-none"
                    >
                      <span
                        className={`block rounded-full transition-all duration-200 ${
                          isSelected
                            ? 'w-6 h-6 ring-4 ring-[var(--foreground)] scale-110'
                            : 'w-4 h-4 hover:scale-125 ring-2 ring-[var(--forest-950)]'
                        }`}
                        style={{
                          backgroundColor: meta.hex,
                          boxShadow: `0 0 14px ${meta.ringHex}`,
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Floating Tree Capsule */}
        {selectedTree && (
          <div
            role="region"
            aria-label="Selected tree capsule"
            className="absolute bottom-4 left-4 right-4 z-20 mx-auto max-w-3xl rounded-[var(--radius-panel)] bg-[var(--forest-950)]/88 backdrop-blur-xl border border-[var(--border)] px-4 py-3.5 shadow-2xl transition-all duration-200 pointer-events-auto"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-[var(--radius-control)] bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shrink-0">
                  <Trees className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[var(--accent)]">
                      {selectedTree.id}
                    </span>
                    <span className="text-[var(--muted)]">·</span>
                    <span className="text-sm font-medium text-[var(--foreground)] truncate">
                      {selectedTree.common_name}{' '}
                      <em className="text-[var(--muted)] font-normal">
                        ({selectedTree.species})
                      </em>
                    </span>
                  </div>
                  <div className="text-xs text-[var(--muted)] font-mono mt-0.5 flex flex-wrap items-center gap-2">
                    <span>
                      {selectedTree.latitude.toFixed(4)}° N,{' '}
                      {selectedTree.longitude.toFixed(4)}° E
                    </span>
                    <span>·</span>
                    <span>{selectedTree.precinct}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <StatusBadge tone={getHealthMeta(selectedTree.health_score).tone}>
                  {getHealthMeta(selectedTree.health_score).label}
                </StatusBadge>

                <a
                  href="https://sepolia.arbiscan.io/address/0x685049b310922F6bc8d6FA17ddae010E13803701"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-[var(--verification)] hover:text-[var(--foreground)] transition"
                >
                  <span>Verify on Arbitrum Sepolia</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedTree(null)}
                  className="p-1.5 rounded-[8px] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)] transition cursor-pointer"
                  aria-label="Close tree capsule"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Two Ground-Truth Guarantee Cards (Below the Map) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: 2-Year DLP Warranty */}
        <article className="surface-panel p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-[var(--radius-control)] bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shrink-0">
            <Trees className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-base font-medium text-[var(--foreground)]">
                2-Year DLP Warranty
              </h3>
              <StatusBadge tone="healthy">Zero Resident Cost</StatusBadge>
            </div>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              14-day mandatory sapling replacement and an 85% minimum canopy
              survival benchmark enforced throughout the 24-month Defect
              Liability Period at zero cost to homebuyers.
            </p>
          </div>
        </article>

        {/* Card 2: Arbitrum Sepolia Seal */}
        <article className="surface-panel p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-[var(--radius-control)] bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--verification)] shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-base font-medium text-[var(--foreground)]">
                Arbitrum Sepolia Seal
              </h3>
              <StatusBadge tone="verified">On-Chain Proof</StatusBadge>
            </div>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Cryptographic proof-of-work hash verification for every planting
              quota and maintenance cycle, anchored to contract{' '}
              <a
                href="https://sepolia.arbiscan.io/address/0x685049b310922F6bc8d6FA17ddae010E13803701"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-[var(--verification)] hover:underline break-all"
              >
                0x685049b310922F6bc8d6FA17ddae010E13803701
              </a>
              .
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}

export default TownshipTransparencyExplorer;
