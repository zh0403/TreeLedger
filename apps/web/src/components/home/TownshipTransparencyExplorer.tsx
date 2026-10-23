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

// High-availability satellite raster specification for Mapbox GL
const satelliteStyle: StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© Esri, Maxar, Earthstar Geographics',
    },
  },
  layers: [
    {
      id: 'satellite',
      type: 'raster',
      source: 'satellite',
      paint: { 'raster-saturation': -0.15, 'raster-brightness-max': 0.85 },
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

  // Same Mapbox engine architecture as /app (resident-map.tsx)
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapboxMap | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [satellite, setSatellite] = useState(false);
  const satelliteMode = useRef(false);
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

  // Boot Mapbox GL JS with reliable raster StyleSpecifications and ResizeObserver
  useEffect(() => {
    let disposed = false;
    let instance: MapboxMap | undefined;
    let observer: ResizeObserver | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    const boot = async () => {
      setStatus('loading');
      try {
        const { default: mapboxgl } = await import('mapbox-gl');
        if (disposed || !container.current) return;
        instance = new mapboxgl.Map({
          container: container.current,
          accessToken: token || 'pk.eyJ1IjoidHJlZWxlZGdlciIsImEiOiJjb placeholdersIn0.0',
          style: satelliteMode.current ? satelliteStyle : geographicStyle,
          center: [ELMINA_CENTER_LNG, ELMINA_CENTER_LAT],
          zoom: 14.8,
          attributionControl: true,
        });
        map.current = instance;
        instance.addControl(
          new mapboxgl.NavigationControl({ showCompass: false }),
          'bottom-right'
        );

        const markReady = () => {
          clearTimeout(timeout);
          if (!disposed) {
            instance?.resize();
            setStatus('ready');
          }
        };

        instance.on('load', markReady);
        instance.on('idle', markReady);

        if (typeof ResizeObserver !== 'undefined' && container.current) {
          observer = new ResizeObserver(() => {
            instance?.resize();
          });
          observer.observe(container.current);
        }

        const fail = () => {
          if (disposed) return;
          clearTimeout(timeout);
          if (satelliteMode.current) {
            satelliteMode.current = false;
            setSatellite(false);
          } else {
            setStatus('error');
          }
        };

        instance.on('error', (event) => {
          if ('sourceId' in event || !instance?.isStyleLoaded()) fail();
        });
        timeout = setTimeout(markReady, 4500);
      } catch {
        if (!disposed) setStatus('error');
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
    if (instance) {
      instance.setStyle(satellite ? satelliteStyle : geographicStyle);
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
    <div className={showEditorialIntro ? 'ledger-layout' : 'ledger-standalone'}>
      {/* Left Column: Editorial Chapter Copy matching 01/, 02/, and 03/ */}
      {showEditorialIntro && (
        <div className="ledger-copy" data-reveal>
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
          <div className="audit-note">
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
                >
                  0x685049b310922F6bc8d6FA17ddae010E13803701
                </a>
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Right Column: Interactive /app Mapbox Stage & HUD */}
      <div className="ledger-stage" data-reveal>
        {/* Frosted-Glass Precinct Pill Selector */}
        <div
          role="tablist"
          aria-label="City of Elmina project precincts"
          className="ledger-tabs"
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
                className="ledger-tab"
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Interactive Mapbox Canvas (using /app geographicStyle & satelliteStyle) */}
        <div
          className={`ledger-map ${
            satellite ? 'ledger-map--satellite' : 'ledger-map--geographic'
          }`}
        >
          <div ref={container} className="ledger-map-canvas" />

          {/* Floating Glass HUD (Top-Left) */}
          <div className="ledger-hud">
            <div className="ledger-hud-header">
              <span className="ledger-hud-dot" />
              <span>{selectedPrecinct}</span>
            </div>
            <dl className="ledger-hud-list">
              <div className="ledger-hud-row">
                <dt>Quota Delivery</dt>
                <dd>
                  {activeMeta.delivered} / {activeMeta.target} Delivered (100%
                  Fulfilled)
                </dd>
              </div>
              <div className="ledger-hud-row ledger-hud-row--accent">
                <dt>Canopy Health</dt>
                <dd>{avgHealth}% Avg Health Index</dd>
              </div>
              <div className="ledger-hud-row ledger-hud-row--divider">
                <dt>Contractor</dt>
                <dd>
                  {activeMeta.contractor} · {activeMeta.dlpLabel}
                </dd>
              </div>
            </dl>
          </div>

          {/* Minimalist Map Tools (Top-Right, matching /app explorer-map-tools) */}
          <div className="ledger-tools">
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
              className="ledger-tool-btn"
            >
              <Layers size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleRecenter}
              aria-label="Recenter on precinct"
              title="Recenter on precinct"
              className="ledger-tool-btn"
            >
              <Navigation size={17} aria-hidden="true" />
            </button>
          </div>

          {status === 'loading' && (
            <p className="ledger-status" role="status">
              Opening City of Elmina map…
            </p>
          )}

          {status === 'error' && (
            <div className="ledger-hud" role="status">
              <p>Map connection interrupted.</p>
              <button
                type="button"
                onClick={() => setAttempt((a) => a + 1)}
                className="ledger-tab"
              >
                Retry map
              </button>
            </div>
          )}

          {/* Floating Tree Capsule (Bottom of map) */}
          {selectedTree && (
            <aside
              aria-label="Selected tree capsule"
              className="ledger-capsule"
            >
              <div className="ledger-capsule-main">
                <div className="ledger-capsule-icon">
                  <TreePine size={19} strokeWidth={1.4} aria-hidden="true" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="ledger-capsule-title">
                    <span className="ledger-capsule-id">{selectedTree.id}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedTree.common_name}</span>
                    <span className="ledger-capsule-species">
                      ({selectedTree.species})
                    </span>
                  </div>
                  <div className="ledger-capsule-meta">
                    {selectedTree.latitude.toFixed(4)}° N,{' '}
                    {selectedTree.longitude.toFixed(4)}° E ·{' '}
                    {selectedTree.precinct}
                  </div>
                </div>
              </div>

              <div className="ledger-capsule-actions">
                <StatusBadge
                  tone={getHealthMeta(selectedTree.health_score).tone}
                >
                  {getHealthMeta(selectedTree.health_score).label}
                </StatusBadge>
                <a
                  href="https://sepolia.arbiscan.io/address/0x685049b310922F6bc8d6FA17ddae010E13803701"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ledger-capsule-link"
                >
                  <span>Verify on Arbitrum Sepolia</span>
                  <ArrowUpRight size={14} aria-hidden="true" />
                </a>
                <button
                  type="button"
                  aria-label="Close tree capsule"
                  onClick={() => setSelectedTree(null)}
                  className="ledger-capsule-close"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </div>
            </aside>
          )}
        </div>

        {/* Standalone Guarantee Cards when rendered on /map without the left editorial column */}
        {!showEditorialIntro && (
          <div className="ledger-guarantees">
            <article className="surface-panel ledger-guarantee-card">
              <Trees
                size={21}
                strokeWidth={1.4}
                aria-hidden="true"
              />
              <div>
                <div className="ledger-guarantee-head">
                  <h3>2-Year DLP Warranty</h3>
                  <StatusBadge tone="healthy">Zero Resident Cost</StatusBadge>
                </div>
                <p>
                  14-day mandatory sapling replacement and 85% survival rate
                  benchmark at zero resident cost.
                </p>
              </div>
            </article>

            <article className="surface-panel ledger-guarantee-card ledger-guarantee-card--proof">
              <ShieldCheck
                size={21}
                strokeWidth={1.4}
                aria-hidden="true"
              />
              <div style={{ minWidth: 0 }}>
                <div className="ledger-guarantee-head">
                  <h3>Arbitrum Sepolia Seal</h3>
                  <StatusBadge tone="verified">On-Chain Proof</StatusBadge>
                </div>
                <p>
                  Cryptographic proof-of-work hash verification anchored to
                  contract{' '}
                  <span className="ledger-guarantee-hash">
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
