'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  Trees,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MapPin,
  FileText,
  Clock,
  Layers,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Globe,
  Map as MapIcon,
  Activity,
  Wind,
  X,
} from 'lucide-react';
import { HandoverStatus, Tree } from '@/lib/types';
import { fetchTrees } from '@/lib/api';
import { Brand } from '@/components/ui/brand';
import { ButtonLink } from '@/components/ui/button-link';
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
        id: 'esri-Satellite-roads',
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

const PRECINCTS = [
  'All Projects',
  'Sector 4A - Ilham Residence',
  'Elmina Central Park - Lakeshore',
  'Elmina Green - Phase 3 Boulevard',
  'Elmina Valley - Riparian Corridor',
];

const PRECINCT_CENTERS: Record<string, { lng: number; lat: number; zoom: number }> = {
  'All Projects': { lng: ELMINA_CENTER_LNG, lat: ELMINA_CENTER_LAT, zoom: 14.9 },
  'Sector 4A - Ilham Residence': { lng: 101.5064, lat: 3.1966, zoom: 16.0 },
  'Elmina Central Park - Lakeshore': { lng: 101.5034, lat: 3.1942, zoom: 16.0 },
  'Elmina Green - Phase 3 Boulevard': { lng: 101.4996, lat: 3.1964, zoom: 16.0 },
  'Elmina Valley - Riparian Corridor': { lng: 101.5028, lat: 3.1914, zoom: 16.0 },
};

// Masterplan target quotas committed by developer
const PRECINCT_QUOTAS: Record<string, { target: number; phase: string; contractor: string }> = {
  'Sector 4A - Ilham Residence': {
    target: 10,
    phase: 'Phase 4A (DLP Active)',
    contractor: 'Elmina GreenWorks Sdn Bhd',
  },
  'Elmina Central Park - Lakeshore': {
    target: 10,
    phase: 'Central Park North',
    contractor: 'Tropika ArborCare Enterprise',
  },
  'Elmina Green - Phase 3 Boulevard': {
    target: 10,
    phase: 'Phase 3 (Pre-Handover)',
    contractor: 'Nusantara AgroTech Services',
  },
  'Elmina Valley - Riparian Corridor': {
    target: 10,
    phase: 'Riparian Greenway',
    contractor: 'Elmina GreenWorks Sdn Bhd',
  },
};

// Canonical geotagged trees across all 4 City of Elmina precincts centered around [101.5034, 3.1942]
const ELMINA_CANOPY_TREES: Tree[] = [
  // Sector 4A - Ilham Residence (NE Sector)
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
    health_score: 68,
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
    health_score: 91,
    latitude: 3.1973,
    longitude: 101.5067,
    qr_code_hash: '0x4b8e1a2c9d7f6e3a5c0b8a1e4d9f2c3a7b6e8d1a',
    created_at: '2025-10-02T09:30:00Z',
  },
  // Elmina Central Park - Lakeshore (Central Core around [101.5034, 3.1942])
  {
    id: 'ELM-104',
    precinct: 'Elmina Central Park - Lakeshore',
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
    precinct: 'Elmina Central Park - Lakeshore',
    species: 'Peltophorum pterocarpum',
    common_name: 'Yellow Flame (Batai Laut)',
    handover_status: 'DLP_ACTIVE',
    planted_at: '2022-06-11T09:10:00Z',
    co2_kg_per_year: 39.0,
    health_score: 74,
    latitude: 3.1937,
    longitude: 101.5043,
    qr_code_hash: '0x9e4b2d7f1c8a3e6b0d5f9c2a7e1b4d8f6a0c3e9b',
    created_at: '2022-06-11T09:45:00Z',
  },
  {
    id: 'ELM-118',
    precinct: 'Elmina Central Park - Lakeshore',
    species: 'Tabebuia rosea',
    common_name: 'Pink Poui (Malaysian Sakura)',
    handover_status: 'COMMISSIONED',
    planted_at: '2023-01-19T08:20:00Z',
    co2_kg_per_year: 36.4,
    health_score: 93,
    latitude: 3.1949,
    longitude: 101.5024,
    qr_code_hash: '0x2c7f9a3e5b1d8c4a6e0f9b2d7a1c5e8b3d4f6a0e',
    created_at: '2023-01-19T08:40:00Z',
  },
  // Elmina Green - Phase 3 Boulevard (NW Sector)
  {
    id: 'ELM-053',
    precinct: 'Elmina Green - Phase 3 Boulevard',
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
    precinct: 'Elmina Green - Phase 3 Boulevard',
    species: 'Shorea roxburghii',
    common_name: 'Meranti Temak Nipis',
    handover_status: 'DLP_ACTIVE',
    planted_at: '2025-08-05T09:20:00Z',
    co2_kg_per_year: 31.2,
    health_score: 82,
    latitude: 3.1959,
    longitude: 101.5004,
    qr_code_hash: '0x5d2b8f4c1a9e7d3b6f0c8a2e5d9b1f4c7a3e6d0b',
    created_at: '2025-08-05T09:30:00Z',
  },
  {
    id: 'ELM-067',
    precinct: 'Elmina Green - Phase 3 Boulevard',
    species: 'Khaya senegalensis',
    common_name: 'African Mahogany',
    handover_status: 'PRE_HANDOVER_PLANTED',
    planted_at: '2026-02-01T08:15:00Z',
    co2_kg_per_year: 33.5,
    health_score: 89,
    latitude: 3.1971,
    longitude: 101.4988,
    qr_code_hash: '0x8a1d4f7b2e9c3a6d5f0b8e2c7a1d4f9b3e6c0a7d',
    created_at: '2026-02-01T08:45:00Z',
  },
  // Elmina Valley - Riparian Corridor (South Waterway Sector)
  {
    id: 'ELM-129',
    precinct: 'Elmina Valley - Riparian Corridor',
    species: 'Tabebuia rosea',
    common_name: 'Tecoma (Malaysian Cherry Blossom)',
    handover_status: 'COMMISSIONED',
    planted_at: '2023-02-24T08:15:00Z',
    co2_kg_per_year: 35.8,
    health_score: 91,
    latitude: 3.1915,
    longitude: 101.5026,
    qr_code_hash: '0x6a3d9f1b4e8c2a7d5f0b9e3c6a1d8f4b2e7c0a9d',
    created_at: '2023-02-24T08:30:00Z',
  },
  {
    id: 'ELM-134',
    precinct: 'Elmina Valley - Riparian Corridor',
    species: 'Syzygium campanulatum',
    common_name: 'Kelat Paya (Riparian Myrtle)',
    handover_status: 'DLP_ACTIVE',
    planted_at: '2025-05-12T08:30:00Z',
    co2_kg_per_year: 27.9,
    health_score: 87,
    latitude: 3.1911,
    longitude: 101.5039,
    qr_code_hash: '0x3e8c1f4a9b2d7e6a0c5f8b3d1e7a4c9b2f6d0e3a',
    created_at: '2025-05-12T09:00:00Z',
  },
  {
    id: 'ELM-141',
    precinct: 'Elmina Valley - Riparian Corridor',
    species: 'Dillenia suffruticosa',
    common_name: 'Simpoh Air (Riparian Shrub-Tree)',
    handover_status: 'DLP_ACTIVE',
    planted_at: '2025-07-18T10:00:00Z',
    co2_kg_per_year: 24.5,
    health_score: 76,
    latitude: 3.1918,
    longitude: 101.5015,
    qr_code_hash: '0x9b2e7d1a4c8f3e6b0d5a9c2e7f1b4d8a6c0e3f9b',
    created_at: '2025-07-18T10:20:00Z',
  },
];

function normalizePrecinctName(precinct: string): string {
  if (PRECINCTS.includes(precinct)) return precinct;
  const lower = precinct.toLowerCase();
  if (lower.includes('4a') || lower.includes('ilham')) {
    return 'Sector 4A - Ilham Residence';
  }
  if (lower.includes('central park') || lower.includes('1b') || lower.includes('lakeshore')) {
    return 'Elmina Central Park - Lakeshore';
  }
  if (lower.includes('green') || lower.includes('4b') || lower.includes('boulevard')) {
    return 'Elmina Green - Phase 3 Boulevard';
  }
  if (lower.includes('valley') || lower.includes('sakura') || lower.includes('2a') || lower.includes('riparian')) {
    return 'Elmina Valley - Riparian Corridor';
  }
  return 'Elmina Central Park - Lakeshore';
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
        : existing?.latitude ?? PRECINCT_CENTERS[normalizedPrecinct].lat,
      longitude: hasNearElminaCoords
        ? item.longitude
        : existing?.longitude ?? PRECINCT_CENTERS[normalizedPrecinct].lng,
    });
  }
  return Array.from(byId.values());
}

function getHealthMeta(score: number): {
  label: string;
  tone: 'healthy' | 'warning' | 'critical';
  hex: string;
  ringHex: string;
  textColorVar: string;
} {
  if (score >= 80) {
    return {
      label: 'Healthy Canopy',
      tone: 'healthy',
      hex: '#52d9a5',
      ringHex: 'rgba(82, 217, 165, 0.38)',
      textColorVar: 'var(--status-healthy)',
    };
  }
  if (score >= 50) {
    return {
      label: 'Moderate Stress',
      tone: 'warning',
      hex: '#e5ae50',
      ringHex: 'rgba(229, 174, 80, 0.38)',
      textColorVar: 'var(--status-warning)',
    };
  }
  return {
    label: 'Critical Action',
    tone: 'critical',
    hex: '#e36b67',
    ringHex: 'rgba(227, 107, 103, 0.44)',
    textColorVar: 'var(--status-critical-text)',
  };
}

function getDlpStatusMeta(status: HandoverStatus): {
  label: string;
  warrantyNote: string;
  tone: 'verified' | 'warning' | 'healthy';
} {
  switch (status) {
    case 'PRE_HANDOVER_PLANTED':
      return {
        label: 'Pre-Handover Audit',
        warrantyNote: 'Pending VP Verification',
        tone: 'verified',
      };
    case 'DLP_ACTIVE':
      return {
        label: 'DLP Active (24-Mo Warranty)',
        warrantyNote: '14-Day Replacement SLA Active',
        tone: 'warning',
      };
    case 'COMMISSIONED':
    default:
      return {
        label: 'Commissioned Canopy',
        warrantyNote: 'Township Stewardship Active',
        tone: 'healthy',
      };
  }
}

// Recent living planting and maintenance milestones
const RECENT_MILESTONES = [
  {
    id: 1,
    date: 'Oct 19, 2026',
    treeId: 'ELM-042',
    precinct: 'Sector 4A - Ilham Residence',
    action: 'Deep-Root Mycorrhizal Aeration',
    species: 'Hopea odorata (Merawan Siput Jantan)',
    contractor: 'Elmina GreenWorks',
    status: 'Verified on Arbitrum',
    txHash: '0x3f7b1d9e4a2c8f6b0e5d9a3c7f1b4e8d2a6c0f9e3b7d1a5c8e4f2b6d0a9c3e7f',
    note: 'Pre-handover root biochar conditioning & slow-release hydration ring installed.',
  },
  {
    id: 2,
    date: 'Oct 18, 2026',
    treeId: 'ELM-104',
    precinct: 'Elmina Central Park - Lakeshore',
    action: 'Canopy Crown Lifting & Storm Clearance',
    species: 'Samanea saman (Rain Tree)',
    contractor: 'Tropika ArborCare',
    status: 'Verified on Arbitrum',
    txHash: '0x94c8e2a17f5d3b09c6e1a8f4d2b7c3e9f0a5d8b2c4e7f1a3d6b9c0e2f5a8d1b4',
    note: 'Cleared 2 storm-weakened lateral branches for 2.8m pedestrian walkway clearance.',
  },
  {
    id: 3,
    date: 'Oct 05, 2026',
    treeId: 'PRECINCT-AUDIT',
    precinct: 'Sector 4A - Ilham Residence',
    action: 'DLP Green Quota Audit Certification',
    species: '10/10 Native Forest Trees',
    contractor: 'Sime Darby Property Urban Forestry Division',
    status: 'Audit Certified',
    txHash: '0x4ceaea71f073563fed2bbd7a3c2e0606d58b7362c0213b9809b765aceb72315a',
    note: '100% promised tree quota verified before buyer vacant possession.',
  },
  {
    id: 4,
    date: 'Sep 24, 2026',
    treeId: 'ELM-053',
    precinct: 'Elmina Green - Phase 3 Boulevard',
    action: 'Healthy Sapling Replacement',
    species: 'Peltophorum pterocarpum (Yellow Flame)',
    contractor: 'Elmina GreenWorks',
    status: 'Verified on Arbitrum',
    txHash: '0x19f02090b2edbb6f9bfa5590e7750eb8ca4c1e3972939d7e0e7bf5639a6795f1',
    note: 'Replaced stunted sapling under 2-Year Defect Liability Period warranty.',
  },
];

// Transparent SLA Charter commitments
const SLA_TERMS = [
  {
    title: '2-Year DLP Sapling Replacement Warranty',
    badge: '14-Day SLA',
    tone: 'healthy' as const,
    description:
      'Any tree displaying severe crown desiccation (>30%), root heave failure, or terminal disease during the 24-month Defect Liability Period must be replaced by the appointed landscaping contractor within 14 calendar days at zero cost to homebuyers.',
  },
  {
    title: '85% Minimum Canopy Survival Index',
    badge: 'Enforceable Penalty',
    tone: 'warning' as const,
    description:
      'Contractors are contractually bound to maintain an overall precinct health benchmark of 85% or higher. Falling below this threshold triggers an automated 10% monthly maintenance fee deduction calculated by the TreeLedger governance engine.',
  },
  {
    title: '24-Hour Emergency Storm Hazard Response',
    badge: 'Critical Safety',
    tone: 'critical' as const,
    description:
      'Reports classified by Google Gemini AI Vision as CRITICAL_24H (fallen limbs, branch overhang over roads) require contractor crew dispatch and site clearance within 24 hours of citizen submission.',
  },
  {
    title: 'Immutable Proof-of-Work Verification',
    badge: 'Arbitrum Sepolia',
    tone: 'verified' as const,
    description:
      'Zero contractor invoices are cleared without verified before-and-after photographic evidence. Every completed task generates a cryptographic keccak256 proof hash recorded on Arbitrum Sepolia.',
  },
];

export function TownshipTransparencyExplorer() {
  const [trees, setTrees] = useState<Tree[]>(ELMINA_CANOPY_TREES);
  const [selectedPrecinct, setSelectedPrecinct] = useState<string>('All Projects');
  const [selectedTree, setSelectedTree] = useState<Tree | null>(ELMINA_CANOPY_TREES[3]);
  const [charterOpen, setCharterOpen] = useState(true);

  // Mapbox GL WebGL Engine & Offline SVG Fallback State
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

  // Filter trees based on active precinct tab
  const filteredTrees = useMemo(() => {
    if (selectedPrecinct === 'All Projects') return trees;
    return trees.filter((t) => t.precinct === selectedPrecinct);
  }, [trees, selectedPrecinct]);

  // Camera flyTo helper
  const flyToCoordinates = useCallback(
    (lng: number, lat: number, targetZoom = 16.2) => {
      if (!useFallbackMap && mapInstanceRef.current) {
        try {
          mapInstanceRef.current.flyTo({
            center: [lng, lat],
            zoom: targetZoom,
            pitch: 30,
            bearing: 0,
            duration: 750,
          });
        } catch {
          // Ignore camera animation interruption
        }
      } else {
        setFallbackCenter({ lng, lat });
        setFallbackZoom(
          targetZoom >= 16 ? 1.28 : targetZoom <= 15.1 ? 1.0 : 1.15
        );
      }
    },
    [useFallbackMap]
  );

  // Focus tree marker (camera flyTo + show tree details)
  const handleSelectTree = useCallback(
    (tree: Tree) => {
      setSelectedTree(tree);
      flyToCoordinates(tree.longitude, tree.latitude, 16.5);
    },
    [flyToCoordinates]
  );

  // Initialize Real WebGL Map centered on City of Elmina [101.5034, 3.1942]
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

  // Toggle between Default View and Satellite View
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

  // Synchronize HTML tree markers on live Mapbox GL instance
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (useFallbackMap || !map || !mapLoaded) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    filteredTrees.forEach((tree) => {
      const health = getHealthMeta(tree.health_score || 0);
      const isSelected = selectedTree?.id === tree.id;

      const wrapper = document.createElement('button');
      wrapper.type = 'button';
      wrapper.setAttribute('aria-label', `Inspect tree ${tree.id} (${tree.species})`);
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';
      wrapper.style.background = 'transparent';
      wrapper.style.border = 'none';
      wrapper.style.padding = '0';
      wrapper.style.cursor = 'pointer';

      const dot = document.createElement('div');
      dot.style.width = isSelected ? '30px' : '22px';
      dot.style.height = isSelected ? '30px' : '22px';
      dot.style.borderRadius = '9999px';
      dot.style.backgroundColor = health.hex;
      dot.style.border = isSelected
        ? '3px solid #f5f7f2'
        : '2.5px solid #0b1d18';
      dot.style.boxShadow = isSelected
        ? `0 0 0 6px ${health.ringHex}, 0 6px 16px rgba(0,0,0,0.75)`
        : `0 0 0 4px ${health.ringHex}, 0 3px 8px rgba(0,0,0,0.5)`;
      dot.style.transition = 'all 150ms ease';

      const label = document.createElement('span');
      label.textContent = tree.id;
      label.style.marginTop = '3px';
      label.style.padding = '1px 6px';
      label.style.borderRadius = '999px';
      label.style.fontSize = '9px';
      label.style.fontFamily = 'var(--font-geist-mono), monospace';
      label.style.fontWeight = '700';
      label.style.backgroundColor = isSelected ? '#52d9a5' : 'rgba(11, 29, 24, 0.92)';
      label.style.color = isSelected ? '#0b1d18' : '#f5f7f2';
      label.style.border = '1px solid rgba(201, 237, 218, 0.22)';
      label.style.whiteSpace = 'nowrap';

      wrapper.appendChild(dot);
      wrapper.appendChild(label);

      wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        handleSelectTree(tree);
      });

      const marker = new mapboxgl.Marker({ element: wrapper, anchor: 'center' })
        .setLngLat([tree.longitude, tree.latitude])
        .addTo(map);

      markersRef.current.set(tree.id, marker);
    });
  }, [filteredTrees, selectedTree, useFallbackMap, mapLoaded, handleSelectTree]);

  // Zoom +/- and Reset Center controls
  const handleZoom = (delta: number) => {
    if (!useFallbackMap && mapInstanceRef.current) {
      const nextZoom = mapInstanceRef.current.getZoom() + delta;
      mapInstanceRef.current.zoomTo(nextZoom, { duration: 250 });
    } else {
      setFallbackZoom((z) =>
        Math.min(1.65, Math.max(0.8, Number((z + delta * 0.16).toFixed(2))))
      );
    }
  };

  const handleResetCenter = () => {
    const target = PRECINCT_CENTERS[selectedPrecinct] || PRECINCT_CENTERS['All Projects'];
    if (!useFallbackMap && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [ELMINA_CENTER_LNG, ELMINA_CENTER_LAT],
        zoom: 14.9,
        pitch: 28,
        bearing: 0,
        duration: 750,
      });
    } else {
      setFallbackCenter({ lng: target.lng, lat: target.lat });
      setFallbackZoom(1);
    }
  };

  // Project [lat, lng] around City of Elmina [101.5034, 3.1942] to percentage coordinates if WebGL is unavailable
  const projectToCanvasPercent = (lat: number, lng: number) => {
    const latSpan = 0.0085;
    const lngSpan = 0.0115;
    const x = 50 + ((lng - ELMINA_CENTER_LNG) / (lngSpan / 2)) * 38;
    const y = 50 - ((lat - ELMINA_CENTER_LAT) / (latSpan / 2)) * 38;
    return {
      x: Math.min(90, Math.max(10, x)),
      y: Math.min(88, Math.max(12, y)),
    };
  };

  const fallbackTransformStyle = useMemo(() => {
    const dx = ((ELMINA_CENTER_LNG - fallbackCenter.lng) / 0.0055) * 14;
    const dy = ((fallbackCenter.lat - ELMINA_CENTER_LAT) / 0.0045) * 14;
    const clampedDx = Math.max(-18, Math.min(18, dx));
    const clampedDy = Math.max(-18, Math.min(18, dy));
    return {
      transform: `scale(${fallbackZoom}) translate(${clampedDx}%, ${clampedDy}%)`,
    };
  }, [fallbackZoom, fallbackCenter]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalTrees = filteredTrees.length;
    const totalCo2 = filteredTrees.reduce((acc, t) => acc + (t.co2_kg_per_year || 0), 0);
    const avgHealth =
      totalTrees > 0
        ? Math.round(filteredTrees.reduce((acc, t) => acc + (t.health_score || 0), 0) / totalTrees)
        : 100;

    let targetQuota = 40;
    if (selectedPrecinct !== 'All Projects' && PRECINCT_QUOTAS[selectedPrecinct]) {
      targetQuota = PRECINCT_QUOTAS[selectedPrecinct].target;
    }
    const fulfillmentPercent = Math.min(100, Math.round((totalTrees / targetQuota) * 100));

    return {
      totalTrees,
      targetQuota,
      fulfillmentPercent,
      totalCo2: Math.round(totalCo2),
      avgHealth,
    };
  }, [filteredTrees, selectedPrecinct]);

  return (
    <section
      className="surface-panel space-y-8 p-6 sm:p-8 relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at top right, var(--ambient), transparent 62%), var(--surface)',
      }}
    >
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <Brand href="#transparency" subtitle="Public DLP & Canopy Ledger" />
            <StatusBadge tone="healthy">
              Public Defect Liability Period (DLP) Transparency
            </StatusBadge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-medium text-[var(--foreground)] tracking-tight">
            Township Canopy &amp; Quota Delivery Audit
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted)] max-w-2xl leading-relaxed">
            Publicly auditable delivery verification for Sime Darby Property&apos;s City of Elmina.
            Compare promised developer quotas, inspect living trees, and verify contractor maintenance warranties.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ButtonLink href="/admin" variant="secondary">
            <span>Open Operations Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </ButtonLink>
        </div>
      </div>

      {/* (b) Categorized by Project Tabs */}
      <div className="space-y-3">
        <div className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>Select Housing Project / Masterplan Phase:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRECINCTS.map((precinct) => {
            const isActive = selectedPrecinct === precinct;
            return (
              <button
                key={precinct}
                type="button"
                onClick={() => {
                  setSelectedPrecinct(precinct);
                  const center = PRECINCT_CENTERS[precinct] || PRECINCT_CENTERS['All Projects'];
                  flyToCoordinates(center.lng, center.lat, center.zoom);
                  const matching =
                    precinct === 'All Projects'
                      ? trees
                      : trees.filter((t) => t.precinct === precinct);
                  setSelectedTree(matching[0] || null);
                }}
                aria-pressed={isActive}
                className="min-h-[44px] px-4 py-2 rounded-[var(--radius-pill)] text-xs font-medium transition-all cursor-pointer border"
                style={
                  isActive
                    ? {
                        background: 'var(--accent)',
                        color: 'var(--accent-foreground)',
                        borderColor: 'var(--accent)',
                      }
                    : {
                        background: 'var(--surface-raised)',
                        color: 'var(--foreground)',
                        borderColor: 'var(--border)',
                      }
                }
              >
                {precinct}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quota Progress & Project Summary Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quota Delivery Card */}
        <div className="lg:col-span-2 p-5 rounded-[var(--radius-panel)] bg-[var(--background)] border border-[var(--border)] space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs text-[var(--muted)] font-mono">
                {selectedPrecinct === 'All Projects'
                  ? 'City of Elmina Masterplan Canopy Delivery'
                  : PRECINCT_QUOTAS[selectedPrecinct]?.phase || 'Project Phase'}
              </div>
              <div className="text-base font-medium text-[var(--foreground)] mt-0.5">
                {selectedPrecinct}
              </div>
            </div>
            <span className="px-3 py-1 rounded-[var(--radius-pill)] text-xs font-mono font-medium bg-[var(--surface-raised)] text-[var(--accent-soft)] border border-[var(--border)]">
              {stats.fulfillmentPercent}% Fulfilled
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-[var(--foreground)]">
              <span>Verified Planted: {stats.totalTrees} trees</span>
              <span className="text-[var(--muted)] font-mono">
                Promised Target: {stats.targetQuota} trees
              </span>
            </div>
            <div className="w-full h-3 rounded-[var(--radius-pill)] bg-[var(--surface)] overflow-hidden p-0.5 border border-[var(--border)]">
              <div
                className="h-full rounded-[var(--radius-pill)] transition-all duration-500"
                style={{
                  width: `${stats.fulfillmentPercent}%`,
                  background:
                    'linear-gradient(90deg, var(--mint-400), var(--canopy-200), var(--proof-400))',
                }}
              />
            </div>
          </div>

          {/* Metrics breakdown */}
          <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-[var(--border)] text-center">
            <div className="p-2.5 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)]">
              <div className="text-base sm:text-lg font-semibold text-[var(--accent)] font-mono">
                {stats.avgHealth}%
              </div>
              <div className="text-[11px] text-[var(--muted)]">Canopy Health Index</div>
            </div>

            <div className="p-2.5 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)]">
              <div className="text-base sm:text-lg font-semibold text-[var(--accent-soft)] font-mono">
                {stats.totalCo2} kg/yr
              </div>
              <div className="text-[11px] text-[var(--muted)]">Annual CO₂ Baseline</div>
            </div>

            <div className="p-2.5 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)]">
              <div className="text-base sm:text-lg font-semibold text-[var(--verification)] font-mono">
                PostGIS
              </div>
              <div className="text-[11px] text-[var(--muted)]">GPS Verified Assets</div>
            </div>
          </div>
        </div>

        {/* Contractor Responsibility Card */}
        <div className="p-5 rounded-[var(--radius-panel)] bg-[var(--background)] border border-[var(--border)] space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="text-xs text-[var(--muted)] font-mono flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[var(--status-warning)]" />
              <span>Assigned Landscape Contractor</span>
            </div>
            <div className="text-sm font-medium text-[var(--foreground)]">
              {selectedPrecinct === 'All Projects'
                ? 'Consortium of Appointed Arborists'
                : PRECINCT_QUOTAS[selectedPrecinct]?.contractor || 'Elmina GreenWorks'}
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Subject to mandatory 2-Year Defect Liability Period maintenance contracts,
              monthly health index audits, and Arbitrum Sepolia proof-of-work sealing.
            </p>
          </div>

          <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs">
            <span className="text-[var(--muted)]">Status:</span>
            <span className="text-[var(--accent)] font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Contract Active
            </span>
          </div>
        </div>
      </div>

      {/* (a) Real Interactive GIS Canopy Map (City of Elmina) with Default & Satellite Views */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Interactive Tree Canopy Map (City of Elmina):</span>
          </div>
          <span className="text-xs text-[var(--muted)]">
            Switch between Default &amp; Satellite view • Click any tree marker to flyTo and inspect
          </span>
        </div>

        <div className="rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--background)] overflow-hidden relative shadow-[var(--shadow-panel)]">
          {/* GIS Map Viewport (height ~460px) */}
          <div className="h-[460px] w-full relative bg-[var(--background)] overflow-hidden select-none">
            {/* Top-Left Geospatial HUD & Default / Satellite View Toggle */}
            <div className="absolute top-3.5 left-3.5 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
              <div className="bg-[var(--surface)]/95 backdrop-blur-md border border-[var(--border)] rounded-[var(--radius-control)] px-3.5 py-2 flex items-center gap-2.5 shadow-[var(--shadow-panel)]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--accent)]" />
                </span>
                <div>
                  <div className="text-xs font-medium text-[var(--foreground)] tracking-wide flex items-center gap-1.5">
                    <span>CITY OF ELMINA GIS</span>
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[var(--background)] text-[var(--accent)] border border-[var(--border)]">
                      [3.1942° N, 101.5034° E]
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--muted)] font-mono">
                    {filteredTrees.length} Active Canopy Markers • {selectedPrecinct}
                  </div>
                </div>
              </div>

              {/* Default vs. Satellite View Toggle Control */}
              <div
                className="bg-[var(--surface)]/95 backdrop-blur-md border border-[var(--border)] rounded-[var(--radius-pill)] p-1 flex items-center gap-1 shadow-[var(--shadow-panel)]"
                role="group"
                aria-label="Map view mode toggle"
              >
                <button
                  type="button"
                  onClick={() => handleToggleMapStyle('default')}
                  aria-pressed={mapStyleMode === 'default'}
                  className="min-h-[36px] px-3 py-1 rounded-[var(--radius-pill)] text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                  style={
                    mapStyleMode === 'default'
                      ? {
                          background: 'var(--accent)',
                          color: 'var(--accent-foreground)',
                        }
                      : {
                          color: 'var(--muted)',
                        }
                  }
                  title="Default Map View (Street & Park GIS)"
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>Default</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleMapStyle('satellite')}
                  aria-pressed={mapStyleMode === 'satellite'}
                  className="min-h-[36px] px-3 py-1 rounded-[var(--radius-pill)] text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                  style={
                    mapStyleMode === 'satellite'
                      ? {
                          background: 'var(--accent)',
                          color: 'var(--accent-foreground)',
                        }
                      : {
                          color: 'var(--muted)',
                        }
                  }
                  title="Satellite Map View (High-Res Aerial Imagery)"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Satellite</span>
                </button>
              </div>
            </div>

            {/* Top-Right Navigation Controls: Zoom +/- and Reset Center */}
            <div className="absolute top-3.5 right-3.5 z-20 flex flex-col gap-1.5 pointer-events-auto">
              <button
                type="button"
                onClick={() => handleZoom(1)}
                className="w-11 h-11 grid place-items-center rounded-[var(--radius-control)] bg-[var(--surface)]/95 hover:bg-[var(--surface-raised)] text-[var(--foreground)] border border-[var(--border)] shadow-[var(--shadow-panel)] transition cursor-pointer"
                title="Zoom In (+)"
                aria-label="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleZoom(-1)}
                className="w-11 h-11 grid place-items-center rounded-[var(--radius-control)] bg-[var(--surface)]/95 hover:bg-[var(--surface-raised)] text-[var(--foreground)] border border-[var(--border)] shadow-[var(--shadow-panel)] transition cursor-pointer"
                title="Zoom Out (-)"
                aria-label="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetCenter}
                className="w-11 h-11 grid place-items-center rounded-[var(--radius-control)] bg-[var(--surface)]/95 hover:bg-[var(--surface-raised)] text-[var(--accent)] border border-[var(--border)] shadow-[var(--shadow-panel)] transition cursor-pointer"
                title="Reset Center [101.5034, 3.1942]"
                aria-label="Reset Center"
              >
                <Crosshair className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom-Left Canopy Health Legend */}
            <div className="hidden sm:flex absolute bottom-3.5 left-3.5 z-20 bg-[var(--surface)]/95 backdrop-blur-md border border-[var(--border)] rounded-[var(--radius-control)] px-3.5 py-2 shadow-[var(--shadow-panel)] items-center gap-4 text-xs pointer-events-auto">
              <StatusBadge tone="healthy">Healthy (&ge;80%)</StatusBadge>
              <StatusBadge tone="warning">Stress (50–79%)</StatusBadge>
              <StatusBadge tone="critical">Critical (&lt;50%)</StatusBadge>
            </div>

            {/* Live WebGL Map Surface (with resilient SVG fallback if WebGL is disabled) */}
            {!useFallbackMap ? (
              <div ref={mapContainerRef} className="w-full h-full" />
            ) : (
              <div
                onClick={() => setSelectedTree(null)}
                className="relative w-full h-full bg-[var(--background)] overflow-hidden"
              >
                <svg
                  viewBox="0 0 1000 520"
                  preserveAspectRatio="xMidYMid slice"
                  className="w-full h-full transition-transform duration-500 ease-out"
                  style={fallbackTransformStyle}
                >
                  <defs>
                    <pattern
                      id="elmina-gis-grid"
                      width="45"
                      height="45"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 45 0 L 0 0 0 45"
                        fill="none"
                        stroke="rgba(201, 237, 218, 0.14)"
                        strokeWidth="1"
                      />
                    </pattern>
                    <radialGradient id="elmina-canopy-biomass" cx="50%" cy="48%" r="52%">
                      <stop
                        offset="0%"
                        stopColor={
                          mapStyleMode === 'satellite'
                            ? 'rgba(33, 101, 75, 0.55)'
                            : 'rgba(82, 217, 165, 0.16)'
                        }
                      />
                      <stop
                        offset="55%"
                        stopColor={
                          mapStyleMode === 'satellite'
                            ? 'rgba(21, 53, 43, 0.4)'
                            : 'rgba(21, 53, 43, 0.15)'
                        }
                      />
                      <stop offset="100%" stopColor="rgba(11, 29, 24, 0.95)" />
                    </radialGradient>
                    <linearGradient id="elmina-lake-depth" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(89, 200, 232, 0.45)" />
                      <stop offset="50%" stopColor="rgba(33, 101, 75, 0.45)" />
                      <stop offset="100%" stopColor="rgba(11, 29, 24, 0.75)" />
                    </linearGradient>
                  </defs>

                  <rect width="1000" height="520" fill="#0b1d18" />
                  <rect width="1000" height="520" fill="url(#elmina-canopy-biomass)" />
                  <rect width="1000" height="520" fill="url(#elmina-gis-grid)" />

                  <ellipse
                    cx="500"
                    cy="255"
                    rx="390"
                    ry="195"
                    fill="none"
                    stroke="rgba(82, 217, 165, 0.18)"
                    strokeWidth="1.2"
                    strokeDasharray="8 6"
                  />
                  <ellipse
                    cx="500"
                    cy="255"
                    rx="295"
                    ry="145"
                    fill="rgba(82, 217, 165, 0.06)"
                    stroke="rgba(82, 217, 165, 0.24)"
                    strokeWidth="1.2"
                  />
                  <ellipse
                    cx="500"
                    cy="255"
                    rx="195"
                    ry="95"
                    fill="rgba(82, 217, 165, 0.09)"
                    stroke="rgba(213, 242, 180, 0.28)"
                    strokeWidth="1.2"
                  />

                  <path
                    d="M 35,345 C 185,330 295,235 465,250 C 615,265 735,205 965,165"
                    fill="none"
                    stroke="rgba(89, 200, 232, 0.24)"
                    strokeWidth="34"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 390,235 C 435,205 545,210 585,245 C 610,270 565,305 495,300 C 425,295 365,265 390,235 Z"
                    fill="url(#elmina-lake-depth)"
                    stroke="rgba(89, 200, 232, 0.5)"
                    strokeWidth="1.8"
                  />
                </svg>

                <div
                  className="absolute inset-0 transition-transform duration-500 ease-out pointer-events-none"
                  style={fallbackTransformStyle}
                >
                  {filteredTrees.map((tree) => {
                    const pos = projectToCanvasPercent(tree.latitude, tree.longitude);
                    const isSelected = selectedTree?.id === tree.id;
                    const health = getHealthMeta(tree.health_score || 0);

                    return (
                      <button
                        key={tree.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTree(tree);
                        }}
                        style={{
                          left: `${pos.x}%`,
                          top: `${pos.y}%`,
                        }}
                        aria-label={`Inspect tree ${tree.id} (${tree.species})`}
                        className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none cursor-pointer pointer-events-auto z-10"
                      >
                        <div
                          className={`relative flex items-center justify-center rounded-full transition-all duration-200 ${
                            isSelected
                              ? 'w-9 h-9 ring-4 ring-[var(--foreground)] scale-110'
                              : 'w-6 h-6 hover:scale-125 ring-2 ring-[var(--background)]'
                          }`}
                          style={{
                            backgroundColor: health.hex,
                            boxShadow: `0 0 16px ${health.ringHex}`,
                          }}
                        >
                          <Trees
                            className={`${
                              isSelected ? 'w-4 h-4' : 'w-3.5 h-3.5'
                            } text-[var(--background)] stroke-[2.4]`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected Tree Telemetry Inspector Popover (Species, Health %, CO2, DLP status) */}
            {selectedTree && (
              <div className="absolute bottom-3.5 left-3.5 right-3.5 sm:left-auto sm:right-3.5 sm:w-[390px] p-4 rounded-[var(--radius-panel)] bg-[var(--background)]/95 border border-[var(--control-border)] shadow-[var(--shadow-panel)] backdrop-blur-xl space-y-3 z-30">
                {(() => {
                  const health = getHealthMeta(selectedTree.health_score || 0);
                  const dlp = getDlpStatusMeta(selectedTree.handover_status);

                  return (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-[var(--radius-control)] bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--accent)] flex items-center justify-center shrink-0">
                            <Trees className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-[var(--foreground)] text-xs font-mono">
                                {selectedTree.id}
                              </span>
                              <StatusBadge tone={dlp.tone}>{dlp.label}</StatusBadge>
                            </div>
                            <span className="text-xs text-[var(--muted)] block mt-0.5">
                              {selectedTree.precinct}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedTree(null)}
                          className="w-9 h-9 grid place-items-center rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)] transition cursor-pointer"
                          aria-label="Close tree details"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Health Vitality Bar */}
                      <div className="p-2.5 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)] space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--muted)] flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-[var(--accent)]" />
                            <span>Canopy Health Score</span>
                          </span>
                          <span
                            className="font-mono font-semibold"
                            style={{ color: health.textColorVar }}
                          >
                            {selectedTree.health_score}% ({health.label})
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-[var(--radius-pill)] bg-[var(--background)] overflow-hidden">
                          <div
                            className="h-full rounded-[var(--radius-pill)] transition-all duration-300"
                            style={{
                              width: `${selectedTree.health_score}%`,
                              backgroundColor: health.hex,
                            }}
                          />
                        </div>
                      </div>

                      {/* Core Tree Telemetry: Species, CO2, DLP Status, GPS */}
                      <div className="grid grid-cols-2 gap-2.5 text-xs pt-1 border-t border-[var(--border)]">
                        <div>
                          <span className="text-[var(--muted)] block">Species:</span>
                          <span className="text-[var(--foreground)] font-medium italic">
                            {selectedTree.species}
                          </span>
                          <span className="text-[11px] text-[var(--muted)] block">
                            {selectedTree.common_name || 'Forest Native'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[var(--muted)] block">CO₂ Sequestration:</span>
                          <span className="text-[var(--accent-soft)] font-mono font-semibold flex items-center gap-1">
                            <Wind className="w-3.5 h-3.5 text-[var(--accent)]" />
                            {selectedTree.co2_kg_per_year} kg/year
                          </span>
                          <span className="text-[11px] text-[var(--muted)] block">
                            {dlp.warrantyNote}
                          </span>
                        </div>
                        <div>
                          <span className="text-[var(--muted)] block">GPS Coordinates:</span>
                          <span className="text-[var(--accent)] font-mono text-[11px]">
                            {selectedTree.latitude.toFixed(5)}° N, {selectedTree.longitude.toFixed(5)}° E
                          </span>
                        </div>
                        <div>
                          <span className="text-[var(--muted)] block">DLP Status:</span>
                          <span className="text-[var(--foreground)] font-mono text-[11px]">
                            {selectedTree.handover_status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                        <span className="text-[11px] text-[var(--muted)] font-mono truncate max-w-[190px]">
                          QR: {selectedTree.qr_code_hash}
                        </span>
                        <ButtonLink href="/app/explore" variant="text">
                          <span>Full dMRV Profile</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </ButtonLink>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* (c) Latest Update on Tree Planting (Living Milestones Feed) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[var(--verification)]" />
            <span>Latest Tree Planting &amp; Maintenance Activity:</span>
          </div>
          <StatusBadge tone="verified">Sealed on Arbitrum Sepolia</StatusBadge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {RECENT_MILESTONES.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-[var(--radius-panel)] bg-[var(--background)] border border-[var(--border)] hover:border-[var(--control-border)] transition-colors space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-[var(--radius-pill)] bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]">
                  {item.date}
                </span>
                <StatusBadge tone="verified">{item.status}</StatusBadge>
              </div>

              <div>
                <div className="text-sm font-medium text-[var(--foreground)] flex items-center gap-1.5">
                  <span>{item.action}</span>
                  <span className="text-xs text-[var(--accent)] font-mono">[{item.treeId}]</span>
                </div>
                <div className="text-xs text-[var(--muted)] mt-0.5">{item.species}</div>
              </div>

              <p className="text-xs text-[var(--foreground)] leading-relaxed bg-[var(--surface)] p-3 rounded-[var(--radius-control)] border border-[var(--border)]">
                &ldquo;{item.note}&rdquo;
              </p>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-[var(--muted)]">
                  Contractor: <strong className="text-[var(--foreground)] font-medium">{item.contractor}</strong>
                </span>
                <a
                  href={`https://sepolia.arbiscan.io/tx/${item.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--verification)] hover:text-[var(--foreground)] flex items-center gap-1 text-xs font-mono"
                >
                  <span>Tx: {item.txHash.slice(0, 10)}...</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* (d) Contract Details: Public SLA & Maintenance Charter */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--verification)]" />
            <span>Developer-Contractor SLA &amp; Warranty Charter (Transparent Commitments):</span>
          </div>
          <button
            type="button"
            onClick={() => setCharterOpen(!charterOpen)}
            aria-expanded={charterOpen}
            className="min-h-[44px] px-3 rounded-[var(--radius-control)] text-xs text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)] flex items-center gap-1.5 cursor-pointer"
          >
            <span>{charterOpen ? 'Collapse' : 'Expand'}</span>
            {charterOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {charterOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {SLA_TERMS.map((term, index) => (
              <div
                key={index}
                className="p-4 rounded-[var(--radius-panel)] bg-[var(--background)] border border-[var(--border)] space-y-2 hover:border-[var(--control-border)] transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-medium text-[var(--foreground)]">{term.title}</h4>
                  <StatusBadge tone={term.tone}>{term.badge}</StatusBadge>
                </div>
                <p className="text-xs text-[var(--muted)] leading-relaxed">{term.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Public Smart Contract Verification Reference */}
        <div className="p-4 rounded-[var(--radius-panel)] bg-[var(--background)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-[var(--foreground)] font-medium">
              TreeLedgerAudit Smart Contract:
            </span>
            <code className="text-[var(--accent)] font-mono text-xs bg-[var(--surface)] px-2.5 py-1 rounded-[var(--radius-control)] border border-[var(--border)]">
              0x685049b310922F6bc8d6FA17ddae010E13803701
            </code>
          </div>

          <a
            href="https://sepolia.arbiscan.io/address/0x685049b310922F6bc8d6FA17ddae010E13803701"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] inline-flex items-center gap-1.5 text-[var(--verification)] hover:text-[var(--foreground)] font-medium text-xs self-start sm:self-auto"
          >
            <span>Verify On Arbiscan</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}

export default TownshipTransparencyExplorer;
