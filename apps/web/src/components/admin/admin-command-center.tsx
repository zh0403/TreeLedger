"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  Fingerprint,
  Layers3,
  Leaf,
  Map as MapIcon,
  ShieldCheck,
  Table2,
  Trees,
  TriangleAlert,
  Wrench,
  X,
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
  LayerPanel,
  OperationPanel,
  TreePassportDetail,
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

const navIcons: Partial<Record<WorkspaceView, typeof Compass>> = {
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
  const [activeView, setActiveView] = useState<WorkspaceView>(
    view === "map" ? "overview" : view
  );
  // Google Maps style: one unified docked left side panel that can slide open/closed
  const [leftPanelOpen, setLeftPanelOpen] = useState<boolean>(true);
  const [layersOpen, setLayersOpen] = useState<boolean>(false);
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
  const [tool, setTool] = useState<"connection" | null>(null);
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
  const connectionButton = useRef<HTMLButtonElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    if (typeof window !== "undefined" && window.innerWidth < 760) {
      setLeftPanelOpen(false);
    }
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

  // Switch active view inside the unified Google Maps-style Left Panel without reloading the map
  const handleSelectRailView = useCallback(
    (targetView: WorkspaceView) => {
      const normalizedView = targetView === "map" ? "overview" : targetView;
      setDisplayMode("map");
      setTool(null);
      setSelected(null);

      if (activeView === normalizedView && tool === null && selected === null) {
        // Clicking the already-active rail tab toggles the left side panel open/closed
        setLeftPanelOpen((open) => !open);
      } else {
        setActiveView(normalizedView);
        setLeftPanelOpen(true);
      }

      if (typeof window !== "undefined") {
        window.history.replaceState(
          null,
          "",
          workspaceHref("admin", normalizedView)
        );
      }
    },
    [activeView, tool, selected]
  );

  // Selecting a tree (from the map OR from any list) opens its Digital Tree Passport inside the Left Panel
  const selectTree = useCallback((tree: AdminTreeRecord) => {
    setSelected(tree);
    setTool(null);
    setDisplayMode("map");
    setLeftPanelOpen(true);
  }, []);

  const closeTool = () => {
    setTool(null);
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

  const ActiveHeaderIcon =
    tool === "connection"
      ? ShieldCheck
      : selected
      ? Fingerprint
      : navIcons[activeView] ?? Compass;

  const panelHeaderTitle =
    tool === "connection"
      ? "Data Connections"
      : selected
      ? `Tree ${selected.id}`
      : adminViewLabels[activeView] ?? "Township Overview";

  return (
    <div
      ref={workspaceRef}
      className="gis"
      data-inspector="closed"
      data-tool={leftPanelOpen ? "operation" : "none"}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        if (displayMode === "table") {
          event.preventDefault();
          setDisplayMode("map");
        } else if (selected) {
          event.preventDefault();
          setSelected(null);
        } else if (tool) {
          event.preventDefault();
          closeTool();
        } else if (leftPanelOpen) {
          event.preventDefault();
          setLeftPanelOpen(false);
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
            className="gis-mode-switch"
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
              <span>
                Map<em className="gis-mode-view-word"> View</em>
              </span>
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
              <span>
                Table<em className="gis-mode-view-word"> View</em>
              </span>
            </button>
          </div>

          <button
            ref={connectionButton}
            className="gis-connection-button"
            type="button"
            aria-label="View data connection details"
            aria-expanded={tool === "connection" && leftPanelOpen}
            onClick={() => {
              setDisplayMode("map");
              if (tool === "connection" && leftPanelOpen) {
                setTool(null);
              } else {
                setTool("connection");
                setLeftPanelOpen(true);
              }
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
        {workspaceConfig.admin.navigation
          .filter((item) => item.view !== "map")
          .map((item) => {
            const Icon = navIcons[item.view] ?? Compass;
            const isActive =
              activeView === item.view && tool === null && leftPanelOpen;
            return (
              <div className="gis-tool-group" key={item.view}>
                <button
                  type="button"
                  onClick={() => handleSelectRailView(item.view)}
                  className="gis-tool"
                  aria-label={item.label}
                  title={item.label}
                  aria-current={isActive ? "page" : undefined}
                  style={isActive ? activePillStyle : undefined}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2 : 1.5}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </button>
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
          leftDrawerOpen={leftPanelOpen && displayMode === "map"}
          onSelect={selectTree}
          onStatus={setMapState}
          onViewChange={setMapView}
        />

        {displayMode === "table" ? (
          <section
            aria-label="Fullscreen operational data tables"
            className="gis-table-overlay"
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

              <div
                className="gis-table-tabs"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
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
            {/* Google Maps-Style Unified Left Side Panel + Middle Edge Collapse/Expand Tab Handle */}
            <aside
              id="gis-unified-panel"
              className="gis-unified-panel"
              aria-label="Township operations side panel"
              style={{
                position: "absolute",
                top: 0,
                bottom: "33px",
                left: 0,
                zIndex: 5,
                width: "min(380px, calc(100vw - 32px))",
                display: "flex",
                flexDirection: "column",
                background: "color-mix(in srgb, var(--gis-panel) 97%, transparent)",
                backdropFilter: "blur(16px)",
                borderRight: "1px solid var(--gis-border)",
                boxShadow: leftPanelOpen
                  ? "10px 0 32px rgba(2, 11, 19, 0.42)"
                  : "none",
                transform: leftPanelOpen ? "translateX(0)" : "translateX(-100%)",
                transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              {/* Google Maps-style Middle Edge Collapse / Expand Handle */}
              <button
                type="button"
                onClick={() => setLeftPanelOpen((open) => !open)}
                aria-label={
                  leftPanelOpen
                    ? "Collapse left side panel"
                    : "Expand left side panel"
                }
                title={
                  leftPanelOpen
                    ? "Collapse side panel"
                    : "Expand side panel"
                }
                style={{
                  position: "absolute",
                  top: "50%",
                  right: "-24px",
                  transform: "translateY(-50%)",
                  width: "24px",
                  height: "56px",
                  display: "grid",
                  placeItems: "center",
                  padding: 0,
                  border: "1px solid var(--gis-border)",
                  borderLeft: 0,
                  borderRadius: "0 10px 10px 0",
                  background: "var(--gis-panel)",
                  color: "var(--gis-text)",
                  boxShadow: "6px 0 18px rgba(0, 0, 0, 0.32)",
                  cursor: "pointer",
                }}
              >
                {leftPanelOpen ? (
                  <ChevronLeft size={16} aria-hidden="true" />
                ) : (
                  <ChevronRight size={16} aria-hidden="true" />
                )}
              </button>

              {/* Unified Panel Header */}
              <header className="gis-panel-header">
                <div>
                  <ActiveHeaderIcon size={17} aria-hidden="true" />
                  <div>
                    <h2 style={{ margin: 0 }}>{panelHeaderTitle}</h2>
                    <span
                      style={{
                        display: "block",
                        fontSize: "10px",
                        color: "var(--gis-muted)",
                        lineHeight: 1.2,
                      }}
                    >
                      City of Elmina · 40 Verified Trees
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (selected) {
                      setSelected(null);
                    } else if (tool) {
                      setTool(null);
                    } else {
                      setLeftPanelOpen(false);
                    }
                  }}
                  aria-label={
                    selected
                      ? "Close tree passport"
                      : "Collapse left side panel"
                  }
                  title={selected ? "Close tree passport" : "Collapse panel"}
                >
                  {selected ? (
                    <X size={17} aria-hidden="true" />
                  ) : (
                    <ChevronLeft size={17} aria-hidden="true" />
                  )}
                </button>
              </header>

              {/* Scrollable Panel Body */}
              <div
                className="gis-panel-scroll"
                tabIndex={0}
                style={{ flex: 1, padding: "0 16px 18px" }}
              >
                {tool === "connection" ? (
                  <ConnectionPanel mapState={mapState} onClose={closeTool} />
                ) : selected ? (
                  <TreePassportDetail
                    selected={selected}
                    returnLabel={adminViewLabels[activeView] ?? "Overview"}
                    hazards={hazards}
                    maintenanceRecords={maintenance}
                    onBack={() => setSelected(null)}
                    onNavigateView={handleSelectRailView}
                  />
                ) : (
                  <OperationPanel
                    key={activeView}
                    view={activeView}
                    trees={treeList}
                    onSelect={selectTree}
                    onNavigateView={handleSelectRailView}
                  />
                )}
              </div>

              <footer className="gis-panel-footnote">
                {selected
                  ? "Digital Tree Passport anchored to Arbitrum Sepolia."
                  : "Click any TreePine badge on the map to inspect its passport."}
              </footer>
            </aside>

            {/* Unified Bottom-Right Map Control Panel: Map Layers + TreePine Badges & Status */}
            <section
              className="gis-map-control-card"
              aria-label="Map layers and TreePine badge legend"
              style={{
                position: "absolute",
                right: "12px",
                bottom: "42px",
                zIndex: 5,
                width: "244px",
                maxWidth: "calc(100vw - 24px)",
                border: "1px solid var(--gis-border)",
                borderRadius: "10px",
                background:
                  "color-mix(in srgb, var(--gis-panel) 95%, transparent)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 6px 20px rgba(2, 11, 19, 0.36)",
                padding: "8px 10px",
                display: "flex",
                flexDirection: "column",
                gap: "7px",
                color: "var(--gis-text)",
                fontSize: "10px",
                lineHeight: 1.3,
              }}
            >
              {/* Top Control Row: Basemap Quick Toggle + Expandable Layers Toggle */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "6px",
                }}
              >
                <div
                  role="group"
                  aria-label="Basemap style"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "2px",
                    borderRadius: "6px",
                    border: "1px solid var(--gis-border)",
                    background: "var(--gis-base)",
                    gap: "2px",
                  }}
                >
                  <button
                    type="button"
                    aria-pressed={basemap === "geographic"}
                    onClick={() => setBasemap("geographic")}
                    style={{
                      minHeight: "22px",
                      padding: "0 7px",
                      borderRadius: "4px",
                      border: 0,
                      fontSize: "10px",
                      fontWeight: basemap === "geographic" ? 600 : 400,
                      background:
                        basemap === "geographic"
                          ? "var(--gis-accent)"
                          : "transparent",
                      color:
                        basemap === "geographic"
                          ? "#071c16"
                          : "var(--gis-muted)",
                    }}
                  >
                    Light
                  </button>
                  <button
                    type="button"
                    aria-pressed={basemap === "satellite"}
                    onClick={() => setBasemap("satellite")}
                    style={{
                      minHeight: "22px",
                      padding: "0 7px",
                      borderRadius: "4px",
                      border: 0,
                      fontSize: "10px",
                      fontWeight: basemap === "satellite" ? 600 : 400,
                      background:
                        basemap === "satellite"
                          ? "var(--gis-accent)"
                          : "transparent",
                      color:
                        basemap === "satellite"
                          ? "#071c16"
                          : "var(--gis-muted)",
                    }}
                  >
                    Satellite
                  </button>
                </div>

                <button
                  type="button"
                  aria-expanded={layersOpen}
                  onClick={() => setLayersOpen((open) => !open)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    minHeight: "24px",
                    padding: "0 8px",
                    borderRadius: "6px",
                    border: "1px solid var(--gis-border)",
                    background: layersOpen
                      ? "rgba(82, 217, 165, 0.14)"
                      : "var(--gis-secondary)",
                    color: layersOpen
                      ? "var(--gis-accent)"
                      : "var(--gis-text)",
                    fontSize: "10px",
                    fontWeight: 500,
                  }}
                >
                  <Layers3 size={12} aria-hidden="true" />
                  <span>Layers</span>
                  <ChevronDown
                    size={11}
                    aria-hidden="true"
                    style={{
                      transform: layersOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 160ms ease",
                    }}
                  />
                </button>
              </div>

              {/* Expandable Layer Settings Drawer */}
              {layersOpen && (
                <div
                  style={{
                    paddingTop: "6px",
                    borderTop: "1px solid var(--gis-border)",
                    display: "grid",
                    gap: "6px",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ color: "var(--gis-text)", fontSize: "10px" }}>
                      TreePine badges ({treeList?.length ?? 40})
                    </span>
                    <input
                      type="checkbox"
                      checked={showTrees}
                      onChange={(e) => setShowTrees(e.target.checked)}
                      style={{ width: "13px", height: "13px", margin: 0 }}
                    />
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      cursor: showTrees ? "pointer" : "not-allowed",
                      opacity: showTrees ? 1 : 0.5,
                    }}
                  >
                    <span style={{ color: "var(--gis-text)", fontSize: "10px" }}>
                      Health status colors
                    </span>
                    <input
                      type="checkbox"
                      checked={showHealth}
                      disabled={!showTrees}
                      onChange={(e) => setShowHealth(e.target.checked)}
                      style={{ width: "13px", height: "13px", margin: 0 }}
                    />
                  </label>
                  <label
                    style={{
                      display: "grid",
                      gap: "3px",
                      color: "var(--gis-muted)",
                      fontSize: "9.5px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>Badge opacity</span>
                      <output style={{ color: "var(--gis-text)" }}>
                        {Math.round(opacity * 100)}%
                      </output>
                    </div>
                    <input
                      type="range"
                      min="0.25"
                      max="1"
                      step="0.05"
                      value={opacity}
                      disabled={!showTrees}
                      onChange={(e) => setOpacity(Number(e.target.value))}
                      style={{
                        width: "100%",
                        height: "14px",
                        minHeight: "14px",
                        margin: 0,
                        accentColor: "var(--gis-accent)",
                      }}
                    />
                  </label>
                </div>
              )}

              {/* Merged TreePine Badges & Status Reference (Compact 2x2 Grid) */}
              <div
                style={{
                  paddingTop: "6px",
                  borderTop: "1px solid var(--gis-border)",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "4px 8px",
                  fontSize: "9.5px",
                  color: "var(--gis-muted)",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <i className="gis-health-key gis-health-key--healthy" />
                  Healthy (≥80%)
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <i className="gis-health-key gis-health-key--attention" />
                  Attention (60–79%)
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <i className="gis-health-key gis-health-key--critical">!</i>
                  Critical (&lt;60%)
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <i className="gis-verified-key" />
                  Arbitrum Sealed
                </span>
              </div>
            </section>
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
