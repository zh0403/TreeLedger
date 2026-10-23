'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { Map as MapboxMap, Marker, StyleSpecification } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  ArrowUpRight,
  Layers,
  MapPin,
  Navigation,
  ShieldCheck,
  TreePine,
  Trees,
  X,
} from 'lucide-react';
import { Tree } from '@/lib/types';
import { fetchTrees } from '@/lib/api';
import { SectionHeading } from '@/components/ui/section-heading';
import { StatusBadge } from '@/components/ui/status-badge';

// City of Elmina Masterplan Center Coordinates [lng, lat]
export const ELMINA_CENTER_LNG = 101.5034;
export const ELMINA_CENTER_LAT = 3.1942;

// Same geographic basemap specification used in /app (resident-map.tsx)
const geographicStyle: StyleSpecification = {
  version: 8,
  sources: {
    geography: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: 'geography',
      type: 'raster',
      source: 'geography',
      paint: { 'raster-saturation': -0.6, 'raster-brightness-max': 0.75 },
    },
  ],
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
    zoom: 14.8,
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
  bg: string;
} {
  if (score >= 80) {
    return {
      label: `Healthy ${score}%`,
      tone: 'healthy',
      bg: '#a3e1b5',
    };
  }
  if (score >= 50) {
    return {
      label: `Monitor ${score}%`,
      tone: 'warning',
      bg: '#e5ae50',
    };
  }
  return {
    label: `Critical ${score}%`,
    tone: 'critical',
    bg: '#e36b67',
  };
}

export function TownshipTransparencyExplorer({
  showEditorialIntro = false,
}: {
  showEditorialIntro?: boolean;
}) {
  const [trees, setTrees] = useState<Tree[]>(ELMINA_CANOPY_TREES);
  const [selectedPrecinct, setSelectedPrecinct] = useState<PrecinctTab>('All Projects');
  const [selectedTree, setSelectedTree] = useState<Tree | null>(ELMINA_CANOPY_TREES[0]);

  // Same Mapbox engine state as /app (resident-map.tsx)
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapboxMap | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [satellite, setSatellite] = useState(true);
  const satelliteMode = useRef(true);
  const [attempt, setAttempt] = useState(0);

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

  // Boot Mapbox exactly like /app (resident-map.tsx)
  useEffect(() => {
    let disposed = false;
    let instance: MapboxMap | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    const boot = async () => {
      if (!token?.startsWith('pk.')) {
        satelliteMode.current = false;
        setSatellite(false);
      }
      setStatus('loading');
      try {
        const { default: mapboxgl } = await import('mapbox-gl');
        if (disposed || !container.current) return;
        instance = new mapboxgl.Map({
          container: container.current,
          accessToken: token,
          style: satelliteMode.current
            ? 'mapbox://styles/mapbox/satellite-streets-v12'
            : geographicStyle,
          center: [ELMINA_CENTER_LNG, ELMINA_CENTER_LAT],
          zoom: 14.8,
          attributionControl: true,
        });
        map.current = instance;
        instance.addControl(
          new mapboxgl.NavigationControl({ showCompass: false }),
          'bottom-right'
        );
        instance.on('idle', () => {
          clearTimeout(timeout);
          if (!disposed) setStatus('ready');
        });
        const fail = () => {
          if (disposed) return;
          clearTimeout(timeout);
          if (satelliteMode.current) {
            satelliteMode.current = false;
            setSatellite(false);
            instance?.setStyle(geographicStyle);
            timeout = setTimeout(() => {
              if (!disposed) setStatus('error');
            }, 15000);
          } else {
            setStatus('error');
          }
        };
        instance.on('error', (event) => {
          if ('sourceId' in event || !instance?.isStyleLoaded()) fail();
        });
        timeout = setTimeout(fail, 15000);
      } catch {
        if (!disposed) setStatus('error');
      }
    };

    void boot();
    return () => {
      disposed = true;
      clearTimeout(timeout);
      instance?.remove();
      if (map.current === instance) map.current = null;
    };
  }, [attempt]);

  useEffect(() => {
    satelliteMode.current = satellite;
    const instance = map.current;
    if (instance) {
      instance.setStyle(
        satellite ? 'mapbox://styles/mapbox/satellite-streets-v12' : geographicStyle
      );
    }
  }, [satellite]);

  // Render TreePine markers and fit bounds exactly like /app (resident-map.tsx)
  useEffect(() => {
    if (status !== 'ready' || !map.current) return;
    let disposed = false;
    const markers: Marker[] = [];
    const roots: Root[] = [];
    const instance = map.current;

    void import('mapbox-gl').then(({ default: mapboxgl }) => {
      if (disposed) return;
      for (const tree of filteredTrees) {
        const isSelected = selectedTree?.id === tree.id;
        const meta = getHealthMeta(tree.health_score);
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-label', `${tree.common_name}: ${meta.label}`);
        button.setAttribute('aria-pressed', String(isSelected));
        button.style.display = 'grid';
        button.style.placeItems = 'center';
        button.style.padding = '0';
        button.style.width = '40px';
        button.style.height = '40px';
        button.style.border = '2px solid #d5f2b4';
        button.style.borderRadius = '50%';
        button.style.color = '#071c16';
        button.style.background = meta.bg;
        button.style.boxShadow = isSelected
          ? '0 0 25px rgba(163, 225, 181, 0.7)'
          : '0 3px 15px rgba(0, 0, 0, 0.4)';
        if (isSelected) {
          button.style.outline = '3px solid #f5f7f2';
          button.style.outlineOffset = '4px';
        }
        button.style.cursor = 'pointer';
        button.addEventListener('click', () => {
          setSelectedTree(tree);
          instance.easeTo({
            center: [tree.longitude, tree.latitude],
            zoom: Math.max(instance.getZoom(), 16.0),
            duration: 600,
          });
        });
        const root = createRoot(button);
        root.render(<TreePine size={17} aria-hidden="true" />);
        roots.push(root);
        markers.push(
          new mapboxgl.Marker({ element: button })
            .setLngLat([tree.longitude, tree.latitude])
            .addTo(instance)
        );
      }

      if (filteredTrees.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        filteredTrees.forEach((t) => bounds.extend([t.longitude, t.latitude]));
        instance.fitBounds(bounds, { padding: 80, maxZoom: 16.2, duration: 650 });
      }
    });

    return () => {
      disposed = true;
      markers.forEach((m) => m.remove());
      roots.forEach((r) => r.unmount());
    };
  }, [filteredTrees, status, selectedTree?.id]);

  const handleSelectPrecinct = (tab: PrecinctTab) => {
    setSelectedPrecinct(tab);
    const nextTrees =
      tab === 'All Projects' ? trees : trees.filter((t) => t.precinct === tab);
    if (nextTrees.length > 0) {
      setSelectedTree(nextTrees[0]);
    }
  };

  const handleRecenter = () => {
    const meta = PRECINCT_META[selectedPrecinct];
    map.current?.easeTo({
      center: [meta.lng, meta.lat],
      zoom: meta.zoom,
      duration: 650,
    });
  };

  return (
    <div
      className={
        showEditorialIntro
          ? 'grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start'
          : 'space-y-6'
      }
    >
      {/* Left Column: Editorial Chapter Copy matching 01/, 02/, and 03/ */}
      {showEditorialIntro && (
        <div className="lg:col-span-5 chapter-copy max-w-none" data-reveal>
          <Trees
            className="chapter-icon"
            size={29}
            strokeWidth={1.3}
            aria-hidden="true"
          />
          <SectionHeading id="ledger-title" label="04 / The living ledger">
            Every promise planted.
            <br />
            Every warranty sealed.
          </SectionHeading>
          <p>
            Pre-handover green quota audits and 2-year defect liability period
            tracking for City of Elmina homebuyers.
          </p>

          {/* Editorial Hairline Proof Steps (same rhythm as 03 / Environmental accountability) */}
          <ol className="proof-steps">
            <li>
              <span>01</span>
              {activeMeta.delivered}/{activeMeta.target} Planted
            </li>
            <li>
              <span>02</span>
              {avgHealth}% Vitality
            </li>
            <li>
              <span>03</span>
              2-Yr DLP Active
            </li>
            <li>
              <span>04</span>
              14-Day SLA
            </li>
          </ol>

          {/* Editorial Hairline Details (same rhythm as 01 / Digital tree identity) */}
          <div className="chapter-details">
            <span>
              <Trees size={18} aria-hidden="true" />
              2-Year DLP Warranty · 14-day mandatory replacement &amp; 85%
              survival benchmark at zero resident cost
            </span>
            <span>
              <MapPin size={18} aria-hidden="true" />
              {activeMeta.contractor} · {selectedPrecinct}
            </span>
          </div>

          {/* Arbitrum Sepolia Audit Note (same rhythm as 03 / Environmental accountability) */}
          <div className="audit-note mt-6 pt-5 border-t border-[var(--border)]">
            <ShieldCheck size={18} aria-hidden="true" />
            <p>
              Cryptographic proof-of-work hash verification anchored on Arbitrum
              Sepolia.
              <span>
                TreeLedgerAudit Contract:{' '}
                <a
                  href="https://sepolia.arbiscan.io/address/0x685049b310922F6bc8d6FA17ddae010E13803701"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--verification)] hover:underline"
                >
                  0x685049b310922F6bc8d6FA17ddae010E13803701
                </a>
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Right Column: Interactive /app Mapbox Stage & HUD */}
      <div
        className={
          showEditorialIntro ? 'lg:col-span-7 space-y-4' : 'space-y-5'
        }
      >
        {/* Frosted-Glass Precinct Pill Selector */}
        <div
          role="tablist"
          aria-label="City of Elmina project precincts"
          className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-[var(--radius-pill)] bg-[var(--surface)]/85 backdrop-blur-xl border border-[var(--border)]"
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
                className={`min-h-[36px] px-3.5 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium transition-all cursor-pointer ${
                  active
                    ? 'bg-[var(--accent)] text-[var(--forest-950)] font-semibold'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Interactive Mapbox Canvas (using /app geographicStyle & satellite API) */}
        <div
          className={`relative w-full h-[540px] rounded-[var(--radius-panel)] bg-[#0b241d] border border-[var(--border)] shadow-[0_0_60px_-18px_rgba(82,217,165,0.16)] overflow-hidden ${
            satellite
              ? '[&_.mapboxgl-canvas]:saturate-[.75] [&_.mapboxgl-canvas]:brightness-[.75]'
              : '[&_.mapboxgl-canvas]:sepia-[.4] [&_.mapboxgl-canvas]:hue-rotate-[65deg] [&_.mapboxgl-canvas]:saturate-[.7] [&_.mapboxgl-canvas]:brightness-[.65]'
          }`}
        >
          <div ref={container} className="absolute inset-0" />

          {/* Floating Glass HUD (Top-Left) */}
          <div className="absolute top-4 left-4 z-10 max-w-xs rounded-[var(--radius-panel)] bg-[#071c16]/88 backdrop-blur-xl border border-[var(--border)] px-4 py-3.5 shadow-xl pointer-events-auto">
            <div className="text-[11px] uppercase tracking-wider text-[var(--accent-soft)] font-mono flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
              <span>{selectedPrecinct}</span>
            </div>
            <dl className="space-y-1.5 text-xs">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-[var(--muted)]">Quota Delivery</dt>
                <dd className="font-mono text-[var(--foreground)]">
                  {activeMeta.delivered} / {activeMeta.target} Delivered (100%
                  Fulfilled)
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-[var(--muted)]">Canopy Health</dt>
                <dd className="font-mono text-[var(--accent)]">
                  {avgHealth}% Avg Health Index
                </dd>
              </div>
              <div className="pt-1.5 border-t border-[var(--border)] flex items-baseline justify-between gap-3">
                <dt className="text-[var(--muted)] shrink-0">Contractor</dt>
                <dd className="text-right text-[var(--foreground)] truncate">
                  {activeMeta.contractor} · {activeMeta.dlpLabel}
                </dd>
              </div>
            </dl>
          </div>

          {/* Minimalist Map Tools (Top-Right, matching /app explorer-map-tools) */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => setSatellite((v) => !v)}
              aria-label={
                satellite
                  ? 'Switch to geographic basemap'
                  : 'Switch to satellite imagery'
              }
              title={
                satellite
                  ? 'Switch to geographic basemap'
                  : 'Switch to satellite imagery'
              }
              className="w-11 h-11 rounded-full bg-[#071c16]/88 hover:bg-[var(--surface-raised)] border border-[#a3e1b57a] text-[var(--foreground)] grid place-items-center shadow-lg transition cursor-pointer"
            >
              <Layers size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleRecenter}
              aria-label="Recenter on precinct"
              title="Recenter on precinct"
              className="w-11 h-11 rounded-full bg-[#071c16]/88 hover:bg-[var(--surface-raised)] border border-[#a3e1b57a] text-[var(--accent)] grid place-items-center shadow-lg transition cursor-pointer"
            >
              <Navigation size={17} aria-hidden="true" />
            </button>
          </div>

          {status === 'loading' && (
            <p
              className="absolute bottom-4 right-16 z-10 px-3 py-1.5 rounded-[8px] bg-[#071c16]/90 text-[11px] text-[var(--muted)]"
              role="status"
            >
              Opening City of Elmina map…
            </p>
          )}

          {status === 'error' && (
            <div
              className="absolute inset-x-6 top-1/3 z-10 max-w-sm mx-auto p-5 rounded-[var(--radius-panel)] bg-[#071c16]/92 border border-[var(--border)] text-xs text-[var(--muted)] space-y-3"
              role="status"
            >
              <p className="text-sm text-[var(--foreground)] font-medium">
                Map connection interrupted.
              </p>
              <button
                type="button"
                onClick={() => setAttempt((a) => a + 1)}
                className="min-h-[38px] px-3.5 py-1.5 rounded-[var(--radius-control)] bg-[var(--surface-raised)] border border-[var(--control-border)] text-[var(--foreground)] cursor-pointer"
              >
                Retry map
              </button>
            </div>
          )}

          {/* Floating Tree Capsule (Bottom of map) */}
          {selectedTree && (
            <aside
              aria-label="Selected tree capsule"
              className="absolute bottom-4 left-4 right-16 z-10 max-w-2xl rounded-[var(--radius-panel)] bg-[#0b241d]/92 backdrop-blur-xl border border-[#a3e1b555] px-4 py-3 shadow-2xl pointer-events-auto"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <TreePine
                    size={22}
                    strokeWidth={1.3}
                    className="text-[var(--accent)] shrink-0"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-[var(--accent-soft)]">
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
                    <div className="text-[11px] text-[var(--muted)] font-mono mt-0.5">
                      {selectedTree.latitude.toFixed(4)}° N,{' '}
                      {selectedTree.longitude.toFixed(4)}° E ·{' '}
                      {selectedTree.precinct}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <StatusBadge
                    tone={getHealthMeta(selectedTree.health_score).tone}
                  >
                    {getHealthMeta(selectedTree.health_score).label}
                  </StatusBadge>
                  <a
                    href="https://sepolia.arbiscan.io/address/0x685049b310922F6bc8d6FA17ddae010E13803701"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[var(--accent-soft)] hover:text-[var(--foreground)] transition"
                  >
                    <span>Verify on Arbitrum Sepolia</span>
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                  <button
                    type="button"
                    aria-label="Close tree capsule"
                    onClick={() => setSelectedTree(null)}
                    className="p-1 rounded-full text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* Standalone Guarantee Cards when rendered on /map without the left editorial column */}
        {!showEditorialIntro && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <article className="surface-panel p-5 flex items-start gap-3.5">
              <Trees
                size={22}
                strokeWidth={1.4}
                className="text-[var(--accent)] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-medium text-[var(--foreground)]">
                    2-Year DLP Warranty
                  </h3>
                  <StatusBadge tone="healthy">Zero Resident Cost</StatusBadge>
                </div>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  14-day mandatory sapling replacement and 85% survival rate
                  benchmark at zero resident cost.
                </p>
              </div>
            </article>

            <article className="surface-panel p-5 flex items-start gap-3.5">
              <ShieldCheck
                size={22}
                strokeWidth={1.4}
                className="text-[var(--verification)] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-medium text-[var(--foreground)]">
                    Arbitrum Sepolia Seal
                  </h3>
                  <StatusBadge tone="verified">On-Chain Proof</StatusBadge>
                </div>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Cryptographic proof-of-work hash verification anchored to
                  contract{' '}
                  <span className="font-mono text-[11px] text-[var(--verification)] break-all">
                    0x685049b310922F6bc8d6FA17ddae010E13803701
                  </span>
                  .
                </p>
              </div>
            </article>
          </div>
        )}
      </div>
    </div>
  );
}

export default TownshipTransparencyExplorer;
