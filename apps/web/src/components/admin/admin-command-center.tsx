"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Compass,
  Crosshair,
  Layers3,
  Leaf,
  Map as MapIcon,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightOpen,
  ShieldCheck,
  Table2,
  Trees,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import {
  workspaceConfig,
  workspaceHref,
  type WorkspaceRole,
  type WorkspaceView,
} from "../workspaces/config";
import {
  healthLabels,
  toAdminTreeRecord,
  type AdminTreeRecord,
  type Basemap,
  type MapState,
  type MapView,
} from "./gis-data";
import { GISMap } from "./gis-map";
import {
  adminViewLabels,
  ConnectionPanel,
  IntelligencePanel,
  LayerPanel,
  OperationPanel,
} from "./gis-panels";
import "./admin-gis.css";
import { Brand } from "../ui/brand";
import { Navigation, NavigationLink } from "../ui/navigation";
import {
  INITIAL_HAZARDS,
  INITIAL_MAINTENANCE,
  INITIAL_TREES,
  fetchHazards,
  fetchMaintenanceRecords,
  fetchTrees,
} from "@/lib/api";
import type { HazardReport, MaintenanceRecord, Tree } from "@/lib/types";

const navIcons = {
  overview: Compass,
  map: MapIcon,
  trees: Trees,
  maintenance: Wrench,
  hazards: TriangleAlert,
  sla: ShieldCheck,
  insights: Leaf,
};

// Build the complete 40-tree City of Elmina registry anchored around INITIAL_TREES
function buildElmina40Registry(seedTrees: Tree[]): AdminTreeRecord[] {
  const byId = new Map<string, AdminTreeRecord>();
  for (const t of seedTrees) {
    byId.set(t.id, toAdminTreeRecord(t));
  }

  const supplementarySpecs: Array<{
    id: string;
    species: string;
    commonName: string;
    lng: number;
    lat: number;
    score: number;
    contractor: string;
    performedAt: string;
  }> = [
    {
      id: "ELM-044",
      species: "Hopea odorata",
      commonName: "Merawan Siput Jantan",
      lng: 101.5159,
      lat: 3.1891,
      score: 95,
      contractor: "Elmina GreenWorks Sdn Bhd",
      performedAt: "Oct 19, 2026",
    },
    {
      id: "ELM-045",
      species: "Hopea odorata",
      commonName: "Merawan Siput Jantan",
      lng: 101.5166,
      lat: 3.1896,
      score: 91,
      contractor: "Elmina GreenWorks Sdn Bhd",
      performedAt: "Oct 18, 2026",
    },
    {
      id: "ELM-046",
      species: "Bucida molineti",
      commonName: "Spiny Black Olive",
      lng: 101.5172,
      lat: 3.1901,
      score: 54,
      contractor: "Elmina GreenWorks Sdn Bhd",
      performedAt: "Oct 20, 2026",
    },
    {
      id: "ELM-047",
      species: "Hopea odorata",
      commonName: "Merawan Siput Jantan",
      lng: 101.5155,
      lat: 3.1888,
      score: 89,
      contractor: "Elmina GreenWorks Sdn Bhd",
      performedAt: "Oct 17, 2026",
    },
    {
      id: "ELM-049",
      species: "Samanea saman",
      commonName: "Rain Tree (Pukul Lima)",
      lng: 101.5161,
      lat: 3.1903,
      score: 93,
      contractor: "Elmina GreenWorks Sdn Bhd",
      performedAt: "Oct 15, 2026",
    },
    {
      id: "ELM-050",
      species: "Bucida molineti",
      commonName: "Spiny Black Olive",
      lng: 101.5168,
      lat: 3.1889,
      score: 86,
      contractor: "Elmina GreenWorks Sdn Bhd",
      performedAt: "Oct 14, 2026",
    },
    {
      id: "ELM-051",
      species: "Hopea odorata",
      commonName: "Merawan Siput Jantan",
      lng: 101.5175,
      lat: 3.1895,
      score: 92,
      contractor: "Elmina GreenWorks Sdn Bhd",
      performedAt: "Oct 12, 2026",
    },
    {
      id: "ELM-052",
      species: "Hopea odorata",
      commonName: "Merawan Siput Jantan",
      lng: 101.5152,
      lat: 3.1899,
      score: 90,
      contractor: "Elmina GreenWorks Sdn Bhd",
      performedAt: "Oct 11, 2026",
    },
    {
      id: "ELM-054",
      species: "Dipterocarpus baudii",
      commonName: "Keruing Bulu",
      lng: 101.5178,
      lat: 3.1912,
      score: 96,
      contractor: "Nusantara AgroTech Services",
      performedAt: "Oct 19, 2026",
    },
    {
      id: "ELM-055",
      species: "Shorea roxburghii",
      commonName: "Meranti Temak Nipis",
      lng: 101.5184,
      lat: 3.1908,
      score: 88,
      contractor: "Nusantara AgroTech Services",
      performedAt: "Oct 16, 2026",
    },
    {
      id: "ELM-056",
      species: "Hopea odorata",
      commonName: "Merawan Siput Jantan",
      lng: 101.5189,
      lat: 3.1914,
      score: 91,
      contractor: "Nusantara AgroTech Services",
      performedAt: "Oct 15, 2026",
    },
    {
      id: "ELM-057",
      species: "Bucida molineti",
      commonName: "Spiny Black Olive",
      lng: 101.5176,
      lat: 3.1918,
      score: 73,
      contractor: "Nusantara AgroTech Services",
      performedAt: "Oct 14, 2026",
    },
    {
      id: "ELM-058",
      species: "Dipterocarpus baudii",
      commonName: "Keruing Bulu",
      lng: 101.5182,
      lat: 3.1921,
      score: 94,
      contractor: "Nusantara AgroTech Services",
      performedAt: "Oct 13, 2026",
    },
    {
      id: "ELM-059",
      species: "Samanea saman",
      commonName: "Rain Tree (Pukul Lima)",
      lng: 101.5191,
      lat: 3.1919,
      score: 90,
      contractor: "Nusantara AgroTech Services",
      performedAt: "Oct 12, 2026",
    },
    {
      id: "ELM-060",
      species: "Hopea odorata",
      commonName: "Merawan Siput Jantan",
      lng: 101.5173,
      lat: 3.1907,
      score: 87,
      contractor: "Nusantara AgroTech Services",
      performedAt: "Oct 10, 2026",
    },
    {
      id: "ELM-062",
      species: "Shorea roxburghii",
      commonName: "Meranti Temak Nipis",
      lng: 101.5188,
      lat: 3.1904,
      score: 56,
      contractor: "Nusantara AgroTech Services",
      performedAt: "Oct 20, 2026",
    },
    {
      id: "ELM-101",
      species: "Samanea saman",
      commonName: "Rain Tree (Pukul Lima)",
      lng: 101.5119,
      lat: 3.1846,
      score: 97,
      contractor: "Tropika ArborCare Enterprise",
      performedAt: "Oct 18, 2026",
    },
    {
      id: "ELM-102",
      species: "Samanea saman",
      commonName: "Rain Tree (Pukul Lima)",
      lng: 101.5127,
      lat: 3.1839,
      score: 95,
      contractor: "Tropika ArborCare Enterprise",
      performedAt: "Oct 18, 2026",
    },
    {
      id: "ELM-103",
      species: "Hopea odorata",
      commonName: "Merawan Siput Jantan",
      lng: 101.5133,
      lat: 3.1844,
      score: 92,
      contractor: "Tropika ArborCare Enterprise",
      performedAt: "Oct 17, 2026",
    },
    {
      id: "ELM-105",
      species: "Peltophorum pterocarpum",
      commonName: "Yellow Flame (Batai Laut)",
      lng: 101.5121,
      lat: 3.1852,
      score: 89,
      contractor: "Tropika ArborCare Enterprise",
      performedAt: "Oct 16, 2026",
    },
    {
      id: "ELM-106",
      species: "Samanea saman",
      commonName: "Rain Tree (Pukul Lima)",
      lng: 101.5136,
      lat: 3.1851,
      score: 94,
      contractor: "Tropika ArborCare Enterprise",
      performedAt: "Oct 15, 2026",
    },
    {
      id: "ELM-107",
      species: "Bucida molineti",
      commonName: "Spiny Black Olive",
      lng: 101.5116,
      lat: 3.1841,
      score: 85,
      contractor: "Tropika ArborCare Enterprise",
      performedAt: "Oct 14, 2026",
    },
    {
      id: "ELM-108",
      species: "Tabebuia rosea",
      commonName: "Tecoma (Malaysian Cherry Blossom)",
      lng: 101.5128,
      lat: 3.1855,
      score: 91,
      contractor: "Tropika ArborCare Enterprise",
      performedAt: "Oct 13, 2026",
    },
    {
      id: "ELM-109",
      species: "Hopea odorata",
      commonName: "Merawan Siput Jantan",
      lng: 101.5139,
      lat: 3.1847,
      score: 90,
      contractor: "Tropika ArborCare Enterprise",
      performedAt: "Oct 12, 2026",
    },
    {
      id: "ELM-110",
      species: "Samanea saman",
      commonName: "Rain Tree (Pukul Lima)",
      lng: 101.5123,
      lat: 3.1835,
      score: 93,
      contractor: "Tropika ArborCare Enterprise",
      performedAt: "Oct 11, 2026",
    },
    {
      id: "ELM-111",
      species: "Peltophorum pterocarpum",
      commonName: "Yellow Flame (Batai Laut)",
      lng: 101.5134,
      lat: 3.1838,
      score: 76,
      contractor: "Tropika ArborCare Enterprise",
      performedAt: "Oct 10, 2026",
    },
    {
      id: "ELM-121",
      species: "Tabebuia rosea",
      commonName: "Tecoma (Malaysian Cherry Blossom)",
      lng: 101.5141,
      lat: 3.1864,
      score: 93,
      contractor: "Nusantara AgroTech Services",
      performedAt: "Oct 18, 2026",
    },
    {
      id: "ELM-122",
      species: "Samanea saman",
      commonName: "Rain Tree (Pukul Lima)",
      lng: 101.5148,
      lat: 3.1869,
      score: 95,
      contractor: "Nusantara AgroTech Services",
      performedAt: "Oct 17, 2026",
    },
    {
      id: "ELM-123",
      species: "Hopea odorata",
      commonName: "Merawan Siput Jantan",
      lng: 101.5138,
      lat: 3.1872,
      score: 89,
      contractor: "Nusantara AgroTech Services",
      performedAt: "Oct 16, 2026",
    },
    {
      id: "ELM-124",
      species: "Bucida molineti",
      commonName: "Spiny Black Olive",
      lng: 101.5151,
      lat: 3.1863,
      score: 84,
      contractor: "Nusantara AgroTech Services",
      performedAt: "Oct 15, 2026",
    },
    {
      id: "ELM-125",
      species: "Hopea odorata",
      commonName: "Merawan Siput Jantan",
      lng: 101.5145,
      lat: 3.1875,
      score: 92,
      contractor: "Nusantara AgroTech Services",
      performedAt: "Oct 14, 2026",
    },
    {
      id: "ELM-126",
      species: "Samanea saman",
      commonName: "Rain Tree (Pukul Lima)",
      lng: 101.5135,
      lat: 3.1867,
      score: 94,
      contractor: "Nusantara AgroTech Services",
      performedAt: "Oct 13, 2026",
    },
    {
      id: "ELM-127",
      species: "Bucida molineti",
      commonName: "Spiny Black Olive",
      lng: 101.5149,
      lat: 3.1878,
      score: 87,
      contractor: "Nusantara AgroTech Services",
      performedAt: "Oct 12, 2026",
    },
  ];

  for (const item of supplementarySpecs) {
    if (byId.size >= 40) break;
    if (!byId.has(item.id)) {
      const health: AdminTreeRecord["health"] =
        item.score >= 80
          ? "healthy"
          : item.score >= 60
          ? "attention"
          : "critical";
      byId.set(item.id, {
        id: item.id,
        species: `${item.species} (${item.commonName})`,
        coordinates: [item.lng, item.lat],
        health,
        healthScore: item.score,
        contractor: item.contractor,
        maintenance: [
          {
            id: `MNT-${item.id}`,
            description: "Crown pruning & deep root aeration",
            performedAt: item.performedAt,
          },
        ],
        verification: {
          status: "verified",
          evidenceUrl:
            "https://sepolia.arbiscan.io/address/0x685049b310922F6bc8d6FA17ddae010E13803701",
        },
      });
    }
  }

  return Array.from(byId.values());
}

const DEFAULT_40_TREES: readonly AdminTreeRecord[] =
  buildElmina40Registry(INITIAL_TREES);
const emptyRecords: readonly AdminTreeRecord[] = [];

export function AdminCommandCenter({
  view,
  trees = DEFAULT_40_TREES,
}: {
  view: WorkspaceView;
  trees?: readonly AdminTreeRecord[] | null;
}) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<WorkspaceView>(view);
  const [leftPanelOpen, setLeftPanelOpen] = useState<boolean>(
    view !== "overview" && view !== "map"
  );
  const [treeList, setTreeList] = useState<readonly AdminTreeRecord[] | null>(
    trees && trees.length >= 40 ? trees : DEFAULT_40_TREES
  );
  const [hazards, setHazards] = useState<HazardReport[]>(INITIAL_HAZARDS);
  const [maintenance, setMaintenance] =
    useState<MaintenanceRecord[]>(INITIAL_MAINTENANCE);
  const [displayMode, setDisplayMode] = useState<"map" | "table">("map");
  const [tableTab, setTableTab] = useState<
    "trees" | "hazards" | "maintenance"
  >("trees");
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [tool, setTool] = useState<"layers" | "connection" | null>(null);
  const [selected, setSelected] = useState<AdminTreeRecord | null>(null);
  const [basemap, setBasemap] = useState<Basemap>("geographic");
  const [showTrees, setShowTrees] = useState(true);
  const [showHealth, setShowHealth] = useState(true);
  const [opacity, setOpacity] = useState(0.95);
  const [mapState, setMapState] = useState<MapState>({
    status: "loading",
    basemap: "geographic",
    fallback: false,
  });
  const [mapView, setMapView] = useState<MapView>({
    longitude: 101.5155,
    latitude: 3.1885,
    zoom: 14.8,
  });
  const layerButton = useRef<HTMLButtonElement>(null);
  const connectionButton = useRef<HTMLButtonElement>(null);
  const inspectorButton = useRef<HTMLButtonElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const operationalView = activeView !== "overview" && activeView !== "map";
  const isLeftDrawerVisible =
    tool !== null || (operationalView && leftPanelOpen);

  useEffect(() => {
    let active = true;
    void fetchTrees().then((records) => {
      if (active && records && records.length > 0) {
        setTreeList(buildElmina40Registry(records));
      }
    });
    void fetchHazards().then((data) => {
      if (active && Array.isArray(data) && data.length > 0) {
        setHazards(data);
      }
    });
    void fetchMaintenanceRecords().then((data) => {
      if (active && Array.isArray(data) && data.length > 0) {
        setMaintenance(data);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setInspectorOpen(matchMedia("(min-width:1100px)").matches);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!tool) return;
    const frame = requestAnimationFrame(() =>
      workspaceRef.current
        ?.querySelector<HTMLButtonElement>(
          ".gis-tool-panel .gis-panel-header button"
        )
        ?.focus({ preventScroll: true })
    );
    return () => cancelAnimationFrame(frame);
  }, [tool]);

  // Switch active view in-place without reloading the page or Mapbox canvas
  const handleSelectRailView = useCallback(
    (targetView: WorkspaceView) => {
      setDisplayMode("map");
      if (targetView === "overview" || targetView === "map") {
        setActiveView(targetView);
        setTool(null);
        setLeftPanelOpen(false);
      } else if (activeView === targetView && tool === null) {
        // Clicking the already-active tab toggles the left side panel open/closed
        setLeftPanelOpen((open) => !open);
      } else {
        setActiveView(targetView);
        setTool(null);
        setLeftPanelOpen(true);
        if (
          typeof window !== "undefined" &&
          matchMedia("(max-width:759px)").matches
        ) {
          setInspectorOpen(false);
        }
      }

      if (typeof window !== "undefined") {
        window.history.replaceState(
          null,
          "",
          workspaceHref("admin", targetView)
        );
      }
    },
    [activeView, tool]
  );

  const selectTree = useCallback((tree: AdminTreeRecord) => {
    setSelected(tree);
    setInspectorOpen(true);
    setDisplayMode("map");
  }, []);

  const closeTool = () => {
    setTool(null);
    (tool === "connection" ? connectionButton : layerButton).current?.focus({
      preventScroll: true,
    });
  };

  const openLayers = () => {
    setDisplayMode("map");
    setTool((current) => (current === "layers" ? null : "layers"));
    if (matchMedia("(max-width:759px)").matches) setInspectorOpen(false);
  };

  const openInspector = () => {
    setInspectorOpen(true);
    if (matchMedia("(max-width:759px)").matches) setTool(null);
  };

  const activePillStyle = useMemo(
    () => ({
      color: "#071c16",
      background: "var(--gis-accent)",
      borderColor: "#d5f2b4",
      boxShadow:
        "0 0 18px rgba(82, 217, 165, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
    }),
    []
  );

  return (
    <div
      ref={workspaceRef}
      className="gis"
      data-inspector={inspectorOpen ? "open" : "closed"}
      data-tool={
        tool ?? (operationalView && leftPanelOpen ? "operation" : "none")
      }
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        if (displayMode === "table") {
          event.preventDefault();
          setDisplayMode("map");
        } else if (tool) {
          event.preventDefault();
          closeTool();
        } else if (operationalView && leftPanelOpen) {
          event.preventDefault();
          setLeftPanelOpen(false);
        } else if (inspectorOpen) {
          event.preventDefault();
          setInspectorOpen(false);
          requestAnimationFrame(() => inspectorButton.current?.focus());
        }
      }}
    >
      <a className="skip-link" href="#gis-main">
        Skip to geographic workspace
      </a>
      <header className="gis-header">
        <Brand
          href="/"
          className="gis-brand"
          subtitle="Geospatial intelligence"
        />
        <div className="gis-header-region">
          <MapIcon size={15} aria-hidden="true" />
          <span>City of Elmina</span>
          <span className="gis-region-tag">
            {treeList?.length ?? 40} Trees Active
          </span>
        </div>
        <div className="gis-header-actions">
          {/* Map View / Table View Toggle Button */}
          <div
            role="group"
            aria-label="Workspace display mode"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "3px",
              borderRadius: "10px",
              border: "1px solid var(--gis-border)",
              background: "var(--gis-base)",
              gap: "2px",
            }}
          >
            <button
              type="button"
              aria-pressed={displayMode === "map"}
              onClick={() => setDisplayMode("map")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                minHeight: "34px",
                padding: "0 11px",
                borderRadius: "8px",
                border: 0,
                fontSize: "11px",
                fontWeight: displayMode === "map" ? 600 : 400,
                background:
                  displayMode === "map" ? "var(--gis-accent)" : "transparent",
                color: displayMode === "map" ? "#071c16" : "var(--gis-muted)",
              }}
            >
              <MapIcon size={14} aria-hidden="true" />
              <span>Map View</span>
            </button>
            <button
              type="button"
              aria-pressed={displayMode === "table"}
              onClick={() => setDisplayMode("table")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                minHeight: "34px",
                padding: "0 11px",
                borderRadius: "8px",
                border: 0,
                fontSize: "11px",
                fontWeight: displayMode === "table" ? 600 : 400,
                background:
                  displayMode === "table" ? "var(--gis-accent)" : "transparent",
                color: displayMode === "table" ? "#071c16" : "var(--gis-muted)",
              }}
            >
              <Table2 size={14} aria-hidden="true" />
              <span>Table View</span>
            </button>
          </div>

          <button
            ref={connectionButton}
            className="gis-connection-button"
            type="button"
            aria-label="View data connection details"
            aria-expanded={tool === "connection"}
            onClick={() => {
              setDisplayMode("map");
              setTool((current) =>
                current === "connection" ? null : "connection"
              );
              if (matchMedia("(max-width:759px)").matches)
                setInspectorOpen(false);
            }}
          >
            <ShieldCheck
              size={15}
              aria-hidden="true"
              style={{ color: "var(--gis-accent)" }}
            />
            <span>Tree registry connected</span>
          </button>
          <label className="gis-role-switch">
            <span>Workspace preview</span>
            <select
              aria-label="Choose workspace preview"
              value="admin"
              onChange={(event) =>
                router.push(
                  workspaceConfig[event.target.value as WorkspaceRole].base
                )
              }
            >
              <option value="admin">Admin</option>
              <option value="resident">Resident</option>
              <option value="contractor">Contractor</option>
            </select>
            <ChevronDown size={12} aria-hidden="true" />
          </label>
        </div>
      </header>

      <Navigation className="gis-rail" label="Admin GIS tools">
        {workspaceConfig.admin.navigation.map((item, index) => {
          const Icon = navIcons[item.view];
          const isItemOperational =
            item.view !== "overview" && item.view !== "map";
          const isActive =
            activeView === item.view &&
            tool === null &&
            (!isItemOperational || leftPanelOpen);
          const isLayersActive = tool === "layers";
          return (
            <div className="gis-tool-group" key={item.view}>
              <button
                type="button"
                onClick={() => handleSelectRailView(item.view)}
                className="gis-tool"
                aria-label={item.label}
                title={
                  isItemOperational && activeView === item.view && leftPanelOpen
                    ? `${item.label} (click to collapse panel)`
                    : item.label
                }
                aria-current={isActive ? "page" : undefined}
                aria-expanded={
                  isItemOperational
                    ? activeView === item.view && leftPanelOpen && tool === null
                    : undefined
                }
                style={isActive ? activePillStyle : undefined}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2 : 1.5}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </button>
              {index === 1 && (
                <button
                  ref={layerButton}
                  type="button"
                  className="gis-tool"
                  title="Map layers"
                  aria-label="Map layers"
                  aria-expanded={isLayersActive}
                  aria-controls="gis-layers"
                  onClick={openLayers}
                  style={isLayersActive ? activePillStyle : undefined}
                >
                  <Layers3
                    size={20}
                    strokeWidth={isLayersActive ? 2 : 1.5}
                    aria-hidden="true"
                  />
                  <span>Map layers</span>
                </button>
              )}
            </div>
          );
        })}
        <NavigationLink
          href="/admin/operations"
          className="gis-tool gis-home"
          aria-label="Open operations prototype from main"
          title="Operations prototype"
        >
          <ArrowUpRight size={19} aria-hidden="true" />
          <span>Operations prototype</span>
        </NavigationLink>
      </Navigation>

      <main
        className="gis-stage"
        id="gis-main"
        tabIndex={-1}
        aria-label="TreeLedger geographic workspace"
      >
        <GISMap
          records={treeList ?? emptyRecords}
          basemap={basemap}
          showTrees={showTrees}
          showHealth={showHealth}
          opacity={opacity}
          selectedId={selected?.id}
          onSelect={selectTree}
          onStatus={setMapState}
          onViewChange={setMapView}
        />

        {displayMode === "table" ? (
          <section
            aria-label="Fullscreen operational data tables"
            style={{
              position: "absolute",
              inset: "0 0 33px 0",
              zIndex: 6,
              background:
                "color-mix(in srgb, var(--gis-base) 96%, transparent)",
              backdropFilter: "blur(16px)",
              padding: "24px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                borderBottom: "1px solid var(--gis-border)",
                paddingBottom: "14px",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--gis-cyan)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  City of Elmina · Fullscreen Operational Ledger
                </span>
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: 500,
                    margin: "4px 0 0",
                    color: "var(--gis-text)",
                  }}
                >
                  Township Telemetry &amp; Audit Tables
                </h2>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {(
                  [
                    ["trees", `Tree Registry (${treeList?.length ?? 40})`],
                    ["hazards", `Hazard Reports (${hazards.length})`],
                    [
                      "maintenance",
                      `Maintenance Proofs (${maintenance.length})`,
                    ],
                  ] as const
                ).map(([tabKey, label]) => (
                  <button
                    key={tabKey}
                    type="button"
                    onClick={() => setTableTab(tabKey)}
                    style={{
                      minHeight: "36px",
                      padding: "0 14px",
                      borderRadius: "999px",
                      border: "1px solid var(--gis-border)",
                      background:
                        tableTab === tabKey
                          ? "var(--gis-accent)"
                          : "var(--gis-panel)",
                      color:
                        tableTab === tabKey ? "#071c16" : "var(--gis-text)",
                      fontWeight: tableTab === tabKey ? 600 : 400,
                      fontSize: "12px",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {tableTab === "trees" && (
              <div
                style={{
                  border: "1px solid var(--gis-border)",
                  borderRadius: "12px",
                  background: "var(--gis-panel)",
                  overflowX: "auto",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "12px",
                    textAlign: "left",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid var(--gis-border)",
                        color: "var(--gis-muted)",
                      }}
                    >
                      <th style={{ padding: "12px 14px" }}>Tree ID</th>
                      <th style={{ padding: "12px 14px" }}>Botanical Species</th>
                      <th style={{ padding: "12px 14px" }}>Condition</th>
                      <th style={{ padding: "12px 14px" }}>Health Score</th>
                      <th style={{ padding: "12px 14px" }}>
                        Responsible Contractor
                      </th>
                      <th style={{ padding: "12px 14px" }}>
                        Coordinates (WGS84)
                      </th>
                      <th style={{ padding: "12px 14px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(treeList ?? []).map((t) => (
                      <tr
                        key={t.id}
                        style={{
                          borderBottom: "1px solid var(--gis-border)",
                        }}
                      >
                        <td
                          style={{
                            padding: "10px 14px",
                            fontFamily: "var(--font-geist-mono), monospace",
                            color: "var(--gis-accent)",
                            fontWeight: 600,
                          }}
                        >
                          {t.id}
                        </td>
                        <td style={{ padding: "10px 14px" }}>{t.species}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <i
                              className={`gis-health-key gis-health-key--${
                                t.health ?? "unassessed"
                              }`}
                            >
                              {t.health === "critical" ? "!" : ""}
                            </i>
                            {healthLabels[t.health ?? "unassessed"]}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          {t.healthScore ?? "—"}%
                        </td>
                        <td style={{ padding: "10px 14px" }}>{t.contractor}</td>
                        <td
                          style={{
                            padding: "10px 14px",
                            fontFamily: "var(--font-geist-mono), monospace",
                            color: "var(--gis-muted)",
                          }}
                        >
                          {t.coordinates
                            ? `${t.coordinates[1].toFixed(
                                5
                              )}° N, ${t.coordinates[0].toFixed(5)}° E`
                            : "—"}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <button
                            type="button"
                            onClick={() => selectTree(t)}
                            style={{
                              padding: "4px 10px",
                              borderRadius: "999px",
                              border: "1px solid var(--gis-accent)",
                              background: "rgba(82, 217, 165, 0.14)",
                              color: "var(--gis-accent)",
                              fontSize: "11px",
                            }}
                          >
                            Inspect on Map
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tableTab === "hazards" && (
              <div
                style={{
                  border: "1px solid var(--gis-border)",
                  borderRadius: "12px",
                  background: "var(--gis-panel)",
                  overflowX: "auto",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "12px",
                    textAlign: "left",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid var(--gis-border)",
                        color: "var(--gis-muted)",
                      }}
                    >
                      <th style={{ padding: "12px 14px" }}>Report</th>
                      <th style={{ padding: "12px 14px" }}>Tree ID</th>
                      <th style={{ padding: "12px 14px" }}>Hazard Type</th>
                      <th style={{ padding: "12px 14px" }}>
                        Gemini 3.8 AI Grade
                      </th>
                      <th style={{ padding: "12px 14px" }}>Status</th>
                      <th style={{ padding: "12px 14px" }}>
                        Recommended SLA Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {hazards.map((h) => (
                      <tr
                        key={h.id}
                        style={{ borderBottom: "1px solid var(--gis-border)" }}
                      >
                        <td style={{ padding: "10px 14px" }}>#{h.id}</td>
                        <td
                          style={{
                            padding: "10px 14px",
                            color: "var(--gis-accent)",
                            fontWeight: 600,
                          }}
                        >
                          {h.tree_id}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          {h.hazard_type.replace(/_/g, " ")}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          {h.ai_severity_grade} (
                          {Math.round(h.ai_confidence * 100)}%)
                        </td>
                        <td style={{ padding: "10px 14px" }}>{h.status}</td>
                        <td style={{ padding: "10px 14px" }}>
                          {h.recommended_sla_action}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tableTab === "maintenance" && (
              <div
                style={{
                  border: "1px solid var(--gis-border)",
                  borderRadius: "12px",
                  background: "var(--gis-panel)",
                  overflowX: "auto",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "12px",
                    textAlign: "left",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid var(--gis-border)",
                        color: "var(--gis-muted)",
                      }}
                    >
                      <th style={{ padding: "12px 14px" }}>Record</th>
                      <th style={{ padding: "12px 14px" }}>Tree ID</th>
                      <th style={{ padding: "12px 14px" }}>Action</th>
                      <th style={{ padding: "12px 14px" }}>Contractor</th>
                      <th style={{ padding: "12px 14px" }}>
                        Arbitrum Sepolia Tx Hash
                      </th>
                      <th style={{ padding: "12px 14px" }}>Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenance.map((m) => (
                      <tr
                        key={m.id}
                        style={{ borderBottom: "1px solid var(--gis-border)" }}
                      >
                        <td style={{ padding: "10px 14px" }}>#{m.id}</td>
                        <td
                          style={{
                            padding: "10px 14px",
                            color: "var(--gis-accent)",
                            fontWeight: 600,
                          }}
                        >
                          {m.tree_id}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          {m.action_type.replace(/_/g, " ")}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          {m.contractor_id}
                        </td>
                        <td
                          style={{
                            padding: "10px 14px",
                            fontFamily: "var(--font-geist-mono), monospace",
                            color: "var(--gis-cyan)",
                          }}
                        >
                          {m.arbitrum_tx_hash.slice(0, 22)}…
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          {new Date(m.completed_at).toLocaleDateString("en-US")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Top-left view heading shifts cleanly when the left side panel is open */}
            <div
              className="gis-view-heading"
              style={{
                left: isLeftDrawerVisible ? "372px" : "20px",
                transition: "left 200ms ease",
              }}
            >
              <div>
                <Crosshair size={14} aria-hidden="true" />
                <span>Forest operations</span>
              </div>
              <h1>{adminViewLabels[activeView]}</h1>
              <p>City of Elmina / Active municipal forestry</p>
            </div>

            {/* Re-open Left Side Panel button when an operational tab is collapsed */}
            {operationalView && !leftPanelOpen && tool === null && (
              <button
                type="button"
                onClick={() => setLeftPanelOpen(true)}
                aria-label={`Open ${adminViewLabels[activeView]} side panel`}
                style={{
                  position: "absolute",
                  top: "98px",
                  left: "20px",
                  zIndex: 4,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  minHeight: "42px",
                  padding: "0 14px",
                  borderRadius: "var(--radius-small)",
                  border: "1px solid var(--gis-border)",
                  background: "var(--gis-panel)",
                  color: "var(--gis-accent)",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
                  fontSize: "11px",
                  fontWeight: 500,
                }}
              >
                <PanelLeftOpen size={16} aria-hidden="true" />
                <span>Open {adminViewLabels[activeView]}</span>
              </button>
            )}

            {!inspectorOpen && (
              <button
                type="button"
                ref={inspectorButton}
                className="gis-open-intelligence"
                onClick={openInspector}
                aria-controls="gis-intelligence"
                aria-expanded={false}
              >
                <PanelRightOpen size={17} aria-hidden="true" />
                <span>Intelligence</span>
              </button>
            )}

            {tool === "layers" ? (
              <LayerPanel
                trees={treeList}
                mapState={mapState}
                basemap={basemap}
                onBasemap={setBasemap}
                showTrees={showTrees}
                onTrees={setShowTrees}
                showHealth={showHealth}
                onHealth={setShowHealth}
                opacity={opacity}
                onOpacity={setOpacity}
                onClose={closeTool}
              />
            ) : tool === "connection" ? (
              <ConnectionPanel mapState={mapState} onClose={closeTool} />
            ) : operationalView && leftPanelOpen ? (
              <aside
                className="gis-tool-panel gis-panel"
                aria-labelledby="operation-title"
                style={{
                  top: "18px",
                  left: "18px",
                  width: "340px",
                  maxHeight: "calc(100% - 68px)",
                }}
              >
                <header className="gis-panel-header">
                  <div>
                    <h2 id="operation-title">{adminViewLabels[activeView]}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLeftPanelOpen(false)}
                    aria-label="Collapse operational side panel"
                    title="Collapse side panel"
                  >
                    <PanelLeftClose size={17} aria-hidden="true" />
                  </button>
                </header>
                <div className="gis-panel-scroll">
                  <OperationPanel
                    key={activeView}
                    view={activeView}
                    trees={treeList}
                    onSelect={selectTree}
                  />
                </div>
              </aside>
            ) : null}

            {inspectorOpen && (
              <IntelligencePanel
                trees={treeList}
                selected={selected}
                onClear={() => setSelected(null)}
                onClose={() => {
                  setInspectorOpen(false);
                  requestAnimationFrame(() => inspectorButton.current?.focus());
                }}
                onNavigateView={handleSelectRailView}
              />
            )}

            {!isLeftDrawerVisible && (
              <div className="gis-map-context">
                <Trees
                  size={18}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  style={{ color: "var(--gis-accent)" }}
                />
                <div>
                  <h2>40 Elmina TreePine badges active</h2>
                  <p>
                    Click any circular TreePine badge on the light basemap to
                    fly to the tree and open its Digital Tree Passport.
                  </p>
                  <button type="button" onClick={() => setTool("connection")}>
                    Data connection details{" "}
                    <ArrowUpRight size={12} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            <div
              className="gis-legend"
              aria-label="Tree status reference, not current observations"
              style={{
                left: isLeftDrawerVisible ? "372px" : "20px",
                transition: "left 200ms ease",
              }}
            >
              <span>TreePine badges</span>
              <span>
                <i className="gis-health-key gis-health-key--healthy" />
                Healthy (≥80%)
              </span>
              <span>
                <i className="gis-health-key gis-health-key--attention" />
                Attention (60–79%)
              </span>
              <span>
                <i className="gis-health-key gis-health-key--critical">!</i>
                Critical (&lt;60%)
              </span>
              <span>
                <i className="gis-verified-key" />
                Arbitrum Verified
              </span>
            </div>
          </>
        )}

        <footer className="gis-map-footer">
          <span className="gis-provider-state" role="status">
            <i data-status={mapState.status} />
            {mapState.status === "ready"
              ? `${
                  mapState.basemap === "satellite"
                    ? "Satellite imagery"
                    : "Light geographic basemap"
                }`
              : mapState.status === "loading"
              ? "Basemap connecting"
              : "Basemap unavailable"}
          </span>
          <span className="gis-coordinates">
            View centre {Math.abs(mapView.latitude).toFixed(3)}°{" "}
            {mapView.latitude >= 0 ? "N" : "S"} /{" "}
            {Math.abs(mapView.longitude).toFixed(3)}°{" "}
            {mapView.longitude >= 0 ? "E" : "W"}
            <span>Zoom {mapView.zoom.toFixed(1)}</span>
          </span>
          <span className="gis-footer-note">
            City of Elmina · {treeList?.length ?? 40} Trees (WGS84)
          </span>
        </footer>
      </main>
    </div>
  );
}
