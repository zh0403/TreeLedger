"use client";

import { useState, useEffect, useMemo } from "react";
import "@/components/admin/admin-gis.css";
import { MainPrototypeNotice } from "@/components/main-services";
import { Brand } from "@/components/ui/brand";
import { StatusBadge } from "@/components/ui/status-badge";
import TownshipMap, {
  TreeAsset,
  HandoverStatus,
  getHealthBand,
  formatHandoverStatus,
} from "@/components/map/TownshipMap";
import {
  Trees,
  ShieldCheck,
  Activity,
  Wind,
  Download,
  RefreshCw,
  AlertTriangle,
  FileSpreadsheet,
  Search,
  Filter,
  Building2,
  Sparkles,
  ExternalLink,
  X,
  ArrowUpRight,
  Layers,
} from "lucide-react";

interface ContractorSlaRow {
  contractor_id: string;
  company_name: string;
  assigned_precinct: string;
  avg_turnaround_hours: number;
  sla_target_hours: number;
  unresolved_tasks: number;
  critical_overdue: number;
  verified_proofs_count: number;
  sla_compliance_pct: number;
  automated_penalty_rm: number;
  penalty_rate_pct: number;
  status_tag:
    | "COMPLIANT"
    | "AT_RISK"
    | "DEDUCTION_ENFORCED"
    | "CRITICAL_BREACH";
  last_arbitrum_tx: string;
}

const INITIAL_TREES: TreeAsset[] = [
  {
    id: "ELM-042",
    precinct: "Elmina Central Park",
    species: "Hopea odorata",
    common_name: "Merawan Siput Jantan",
    handover_status: "COMMISSIONED",
    planted_at: "2023-04-12T08:30:00Z",
    co2_kg_per_year: 28.4,
    biomass_kg: 412,
    health_score: 94,
    latitude: 3.1954,
    longitude: 101.5148,
    qr_code_hash: "0x8f3c9a12e4b7d051a6c2",
    canopy_diameter_m: 6.4,
    hazards: [],
    maintenance_logs: [
      {
        id: 501,
        tree_id: "ELM-042",
        contractor_id: "CTR-SD-01",
        action_type: "CANOPY_PRUNING",
        before_photo_url: "/evidence/elm042-before.jpg",
        after_photo_url: "/evidence/elm042-after.jpg",
        notes:
          "Structural crown thinning completed; verified via Gemini 3.8 Vision.",
        ai_verification_passed: true,
        arbitrum_tx_hash:
          "0x94a8b1f2c3d4e5f60718293a4b5c6d7e8f901a2b3c4d5e6f7a8b9c0d1e2f3a4b",
        completed_at: "2026-09-19T14:20:00Z",
      },
    ],
  },
  {
    id: "ELM-108",
    precinct: "Sector 4A - Ilham Residence",
    species: "Shorea roxburghii",
    common_name: "Meranti Temak Nipis (IUCN Endangered)",
    handover_status: "PRE_HANDOVER_PLANTED",
    planted_at: "2025-11-04T09:15:00Z",
    co2_kg_per_year: 22.8,
    biomass_kg: 195,
    health_score: 88,
    latitude: 3.1982,
    longitude: 101.5204,
    qr_code_hash: "0x4d1e7b89c2a0f34e91b5",
    canopy_diameter_m: 3.8,
    hazards: [],
    maintenance_logs: [
      {
        id: 502,
        tree_id: "ELM-108",
        contractor_id: "CTR-SD-02",
        action_type: "DEEP_ROOT_WATERING",
        before_photo_url: "/evidence/elm108-before.jpg",
        after_photo_url: "/evidence/elm108-after.jpg",
        notes:
          "Pre-handover baseline root conditioning and mycorrhizal inoculation.",
        ai_verification_passed: true,
        arbitrum_tx_hash:
          "0x3f7c2e19a8b6d405e1c2f3a4b5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8",
        completed_at: "2026-10-02T11:05:00Z",
      },
    ],
  },
  {
    id: "ELM-119",
    precinct: "Sector 4A - Ilham Residence",
    species: "Samanea saman",
    common_name: "Rain Tree (Pukul Lima)",
    handover_status: "PRE_HANDOVER_PLANTED",
    planted_at: "2025-10-18T10:00:00Z",
    co2_kg_per_year: 34.5,
    biomass_kg: 310,
    health_score: 42,
    latitude: 3.1969,
    longitude: 101.5221,
    qr_code_hash: "0x7a9b3c4d5e6f10293847",
    canopy_diameter_m: 4.5,
    hazards: [
      {
        id: 901,
        tree_id: "ELM-119",
        reporter_id: "RES-ILHAM-088",
        hazard_type: "DRY_FOLIAGE",
        description:
          "Severe leaf scorch and upper crown desiccation detected during pre-handover walkdown.",
        evidence_photo_url: "/hazards/elm119-scorch.jpg",
        status: "DISPATCHED",
        ai_severity_grade: "CRITICAL_24H",
        ai_confidence: 0.96,
        reported_at: "2026-10-19T16:40:00Z",
      },
    ],
    maintenance_logs: [],
  },
  {
    id: "ELM-204",
    precinct: "Elmina Central Park",
    species: "Dipterocarpus baudii",
    common_name: "Keruing Bulu",
    handover_status: "COMMISSIONED",
    planted_at: "2022-08-22T08:00:00Z",
    co2_kg_per_year: 31.2,
    biomass_kg: 520,
    health_score: 91,
    latitude: 3.1938,
    longitude: 101.5129,
    qr_code_hash: "0x1c2d3e4f5a6b7c8d9e0f",
    canopy_diameter_m: 7.2,
    hazards: [],
    maintenance_logs: [],
  },
  {
    id: "ELM-231",
    precinct: "Elmina Green Six",
    species: "Peltophorum pterocarpum",
    common_name: "Yellow Flame (Batai Laut)",
    handover_status: "DLP_ACTIVE",
    planted_at: "2024-06-14T09:45:00Z",
    co2_kg_per_year: 26.0,
    biomass_kg: 340,
    health_score: 67,
    latitude: 3.1905,
    longitude: 101.5094,
    qr_code_hash: "0x5e4d3c2b1a0987654321",
    canopy_diameter_m: 5.1,
    hazards: [
      {
        id: 904,
        tree_id: "ELM-231",
        reporter_id: "RES-EG6-214",
        hazard_type: "ROOT_HEAVE",
        description:
          "Surface lateral root uplifting tactile paving near jogging track.",
        evidence_photo_url: "/hazards/elm231-root.jpg",
        status: "TRIAGED",
        ai_severity_grade: "MEDIUM",
        ai_confidence: 0.91,
        reported_at: "2026-10-18T09:12:00Z",
      },
    ],
    maintenance_logs: [],
  },
  {
    id: "ELM-277",
    precinct: "Elmina Central Park",
    species: "Tabebuia rosea",
    common_name: "Pink Poui (Tecoma)",
    handover_status: "COMMISSIONED",
    planted_at: "2023-01-30T08:15:00Z",
    co2_kg_per_year: 24.7,
    biomass_kg: 390,
    health_score: 85,
    latitude: 3.1961,
    longitude: 101.5165,
    qr_code_hash: "0x6b7c8d9e0f1a2b3c4d5e",
    canopy_diameter_m: 5.9,
    hazards: [],
    maintenance_logs: [],
  },
  {
    id: "ELM-312",
    precinct: "Elmina Valley Five",
    species: "Khaya senegalensis",
    common_name: "African Mahogany",
    handover_status: "DLP_ACTIVE",
    planted_at: "2024-09-01T10:30:00Z",
    co2_kg_per_year: 29.8,
    biomass_kg: 445,
    health_score: 38,
    latitude: 3.1892,
    longitude: 101.5168,
    qr_code_hash: "0x2a3b4c5d6e7f8091a2b3",
    canopy_diameter_m: 5.6,
    hazards: [
      {
        id: 908,
        tree_id: "ELM-312",
        reporter_id: "RES-EV5-019",
        hazard_type: "STORM_DAMAGE",
        description:
          "Split secondary leader branch overhanging perimeter walkway after monsoon squall.",
        evidence_photo_url: "/hazards/elm312-storm.jpg",
        status: "REPORTED",
        ai_severity_grade: "CRITICAL_24H",
        ai_confidence: 0.98,
        reported_at: "2026-10-20T07:55:00Z",
      },
    ],
    maintenance_logs: [],
  },
  {
    id: "ELM-356",
    precinct: "Sector 4A - Ilham Residence",
    species: "Cratoxylum formosum",
    common_name: "Mempat (Pink Mempat)",
    handover_status: "PRE_HANDOVER_PLANTED",
    planted_at: "2025-12-01T08:45:00Z",
    co2_kg_per_year: 19.6,
    biomass_kg: 165,
    health_score: 92,
    latitude: 3.1991,
    longitude: 101.5182,
    qr_code_hash: "0x9e8d7c6b5a4f3e2d1c0b",
    canopy_diameter_m: 3.4,
    hazards: [],
    maintenance_logs: [],
  },
  {
    id: "ELM-401",
    precinct: "Elmina Central Park",
    species: "Bucida molineti",
    common_name: "Spiny Black Olive (Pokok Doa)",
    handover_status: "COMMISSIONED",
    planted_at: "2022-05-19T07:50:00Z",
    co2_kg_per_year: 27.3,
    biomass_kg: 470,
    health_score: 73,
    latitude: 3.1945,
    longitude: 101.5108,
    qr_code_hash: "0x3c4d5e6f7a8b9c0d1e2f",
    canopy_diameter_m: 6.1,
    hazards: [
      {
        id: 911,
        tree_id: "ELM-401",
        reporter_id: "PARK-RANGER-04",
        hazard_type: "PEST",
        description:
          "Localized bagworm defoliation observed on lower eastern boughs.",
        evidence_photo_url: "/hazards/elm401-pest.jpg",
        status: "TRIAGED",
        ai_severity_grade: "MEDIUM",
        ai_confidence: 0.89,
        reported_at: "2026-10-17T15:10:00Z",
      },
    ],
    maintenance_logs: [],
  },
  {
    id: "ELM-449",
    precinct: "Elmina Green Six",
    species: "Syzygium campanulatum",
    common_name: "Kelat Paya",
    handover_status: "DLP_ACTIVE",
    planted_at: "2024-11-11T09:00:00Z",
    co2_kg_per_year: 21.4,
    biomass_kg: 260,
    health_score: 84,
    latitude: 3.1918,
    longitude: 101.5132,
    qr_code_hash: "0x7f6e5d4c3b2a19081726",
    canopy_diameter_m: 4.2,
    hazards: [],
    maintenance_logs: [],
  },
  {
    id: "ELM-488",
    precinct: "Elmina Central Park",
    species: "Alstonia angustiloba",
    common_name: "Pulai (White Cheesewood)",
    handover_status: "COMMISSIONED",
    planted_at: "2021-11-25T08:20:00Z",
    co2_kg_per_year: 36.1,
    biomass_kg: 615,
    health_score: 96,
    latitude: 3.1958,
    longitude: 101.5139,
    qr_code_hash: "0x4a5b6c7d8e9f0a1b2c3d",
    canopy_diameter_m: 8.1,
    hazards: [],
    maintenance_logs: [],
  },
  {
    id: "ELM-512",
    precinct: "Elmina Valley Five",
    species: "Mimusops elengi",
    common_name: "Bunga Tanjung",
    handover_status: "DLP_ACTIVE",
    planted_at: "2024-07-09T09:30:00Z",
    co2_kg_per_year: 23.9,
    biomass_kg: 305,
    health_score: 61,
    latitude: 3.1909,
    longitude: 101.5195,
    qr_code_hash: "0x8b9c0d1e2f3a4b5c6d7e",
    canopy_diameter_m: 4.8,
    hazards: [],
    maintenance_logs: [],
  },
];

const INITIAL_CONTRACTORS: ContractorSlaRow[] = [
  {
    contractor_id: "CTR-SD-01",
    company_name: "Hijau Lestari Arborists Sdn Bhd",
    assigned_precinct: "Elmina Central Park",
    avg_turnaround_hours: 6.4,
    sla_target_hours: 24,
    unresolved_tasks: 1,
    critical_overdue: 0,
    verified_proofs_count: 142,
    sla_compliance_pct: 98.6,
    automated_penalty_rm: 0,
    penalty_rate_pct: 0,
    status_tag: "COMPLIANT",
    last_arbitrum_tx:
      "0x94a8b1f2c3d4e5f60718293a4b5c6d7e8f901a2b3c4d5e6f7a8b9c0d1e2f3a4b",
  },
  {
    contractor_id: "CTR-SD-02",
    company_name: "Tropika Canopy & Bio-Swale Works",
    assigned_precinct: "Sector 4A - Ilham Residence",
    avg_turnaround_hours: 19.8,
    sla_target_hours: 24,
    unresolved_tasks: 3,
    critical_overdue: 1,
    verified_proofs_count: 89,
    sla_compliance_pct: 89.2,
    automated_penalty_rm: 1250,
    penalty_rate_pct: 2.5,
    status_tag: "AT_RISK",
    last_arbitrum_tx:
      "0x3f7c2e19a8b6d405e1c2f3a4b5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8",
  },
  {
    contractor_id: "CTR-SD-03",
    company_name: "Lembah Subang Landscape Engineering",
    assigned_precinct: "Elmina Green Six",
    avg_turnaround_hours: 28.5,
    sla_target_hours: 24,
    unresolved_tasks: 5,
    critical_overdue: 2,
    verified_proofs_count: 64,
    sla_compliance_pct: 78.4,
    automated_penalty_rm: 4800,
    penalty_rate_pct: 7.5,
    status_tag: "DEDUCTION_ENFORCED",
    last_arbitrum_tx:
      "0x71e2d3c4b5a6978869504132e1f2a3b4c5d6e7f8091a2b3c4d5e6f7a8b9c0d1e",
  },
  {
    contractor_id: "CTR-SD-04",
    company_name: "Selangor Urban Forestry Services",
    assigned_precinct: "Elmina Valley Five",
    avg_turnaround_hours: 39.2,
    sla_target_hours: 24,
    unresolved_tasks: 7,
    critical_overdue: 3,
    verified_proofs_count: 51,
    sla_compliance_pct: 68.0,
    automated_penalty_rm: 9450,
    penalty_rate_pct: 15.0,
    status_tag: "CRITICAL_BREACH",
    last_arbitrum_tx:
      "0x55a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
  },
];

export default function TownshipAdminCommandCenter() {
  const [trees, setTrees] = useState<TreeAsset[]>(INITIAL_TREES);
  const [contractors, setContractors] =
    useState<ContractorSlaRow[]>(INITIAL_CONTRACTORS);
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(
    "ELM-119"
  );
  const [handoverFilter, setHandoverFilter] = useState<"ALL" | HandoverStatus>(
    "ALL"
  );
  const [healthFilter, setHealthFilter] = useState<
    "ALL" | "HEALTHY" | "WARNING" | "CRITICAL"
  >("ALL");
  const [contractorSearch, setContractorSearch] = useState<string>("");
  const [contractorStatusFilter, setContractorStatusFilter] =
    useState<string>("ALL");
  const [isSyncing, setIsSyncing] = useState<boolean>(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>("23:28:00 MYT");

  // ESG Export Modal State
  const [isEsgModalOpen, setIsEsgModalOpen] = useState<boolean>(false);
  const [esgExportFormat, setEsgExportFormat] = useState<
    "GRI_304_JSON" | "BURSA_ESG_CSV"
  >("BURSA_ESG_CSV");
  const [exportStep, setExportStep] = useState<number>(0); // 0 = idle, 1..3 = running, 4 = done
  const [exportHash, setExportHash] = useState<string>("");

  // Attempt live backend fetch from FastAPI (/api/trees), falling back seamlessly to resilient seed telemetry
  const syncTelemetry = async () => {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
      "http://localhost:8000";

    try {
      const res = await fetch(`${apiBase}/api/trees`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(2200),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setTrees(data);
        }
      }
    } catch {
      // Resilient fallback: keep deterministic City of Elmina spatial dataset active
    } finally {
      const now = new Date();
      setLastSyncedAt(
        now.toLocaleTimeString("en-MY", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " MYT"
      );
      setTimeout(() => setIsSyncing(false), 350);
    }
  };

  useEffect(() => {
    // Let the initial map shell paint before starting provider synchronization.
    const frame = requestAnimationFrame(() => {
      void syncTelemetry();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Real-time KPI Ribbon Aggregations
  const kpiMetrics = useMemo(() => {
    const totalAssets = trees.length;
    const survivingCount = trees.filter((t) => t.health_score >= 50).length;
    const avgHealth =
      totalAssets > 0
        ? trees.reduce((acc, t) => acc + t.health_score, 0) / totalAssets
        : 0;
    const canopySurvivalIndex =
      totalAssets > 0
        ? Number(
            (
              (survivingCount / totalAssets) * 0.7 * 100 +
              avgHealth * 0.3
            ).toFixed(1)
          )
        : 0;

    const avgSlaCompliance =
      contractors.length > 0
        ? Number(
            (
              contractors.reduce((acc, c) => acc + c.sla_compliance_pct, 0) /
              contractors.length
            ).toFixed(1)
          )
        : 100;

    const annualCo2Kg = Number(
      trees.reduce((acc, t) => acc + Number(t.co2_kg_per_year), 0).toFixed(1)
    );
    const totalBiomassKg = trees.reduce(
      (acc, t) => acc + Number(t.biomass_kg || 0),
      0
    );

    const preHandoverCount = trees.filter(
      (t) => t.handover_status === "PRE_HANDOVER_PLANTED"
    ).length;
    const dlpCount = trees.filter(
      (t) => t.handover_status === "DLP_ACTIVE"
    ).length;
    const commissionedCount = trees.filter(
      (t) => t.handover_status === "COMMISSIONED"
    ).length;

    return {
      totalAssets,
      canopySurvivalIndex,
      avgSlaCompliance,
      annualCo2Kg,
      totalBiomassKg,
      preHandoverCount,
      dlpCount,
      commissionedCount,
    };
  }, [trees, contractors]);

  // Precinct-level ESG aggregation for the Export Modal
  const precinctEsgBreakdown = useMemo(() => {
    const map = new Map<
      string,
      {
        precinct: string;
        treeCount: number;
        biomassKg: number;
        co2KgPerYear: number;
        avgHealth: number;
        preHandover: number;
      }
    >();

    trees.forEach((tree) => {
      const existing = map.get(tree.precinct) || {
        precinct: tree.precinct,
        treeCount: 0,
        biomassKg: 0,
        co2KgPerYear: 0,
        avgHealth: 0,
        preHandover: 0,
      };
      existing.treeCount += 1;
      existing.biomassKg += tree.biomass_kg;
      existing.co2KgPerYear += tree.co2_kg_per_year;
      existing.avgHealth += tree.health_score;
      if (tree.handover_status === "PRE_HANDOVER_PLANTED") {
        existing.preHandover += 1;
      }
      map.set(tree.precinct, existing);
    });

    return Array.from(map.values()).map((item) => ({
      ...item,
      co2KgPerYear: Number(item.co2KgPerYear.toFixed(1)),
      avgHealth: Math.round(item.avgHealth / item.treeCount),
    }));
  }, [trees]);

  // Handle dispatching an SLA work order from the map drawer
  const handleDispatchSlaOrder = (tree: TreeAsset) => {
    setContractors((prev) =>
      prev.map((c) => {
        if (c.assigned_precinct === tree.precinct) {
          return {
            ...c,
            unresolved_tasks: c.unresolved_tasks + 1,
          };
        }
        return c;
      })
    );
  };

  // Filtered contractor rows
  const filteredContractors = useMemo(() => {
    return contractors.filter((row) => {
      if (
        contractorStatusFilter !== "ALL" &&
        row.status_tag !== contractorStatusFilter
      ) {
        return false;
      }
      if (contractorSearch.trim() !== "") {
        const q = contractorSearch.toLowerCase();
        return (
          row.company_name.toLowerCase().includes(q) ||
          row.contractor_id.toLowerCase().includes(q) ||
          row.assigned_precinct.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [contractors, contractorStatusFilter, contractorSearch]);

  // Trigger simulated ESG audit report generation & real file download
  const handleRunEsgExport = () => {
    setExportStep(1);
    setTimeout(() => setExportStep(2), 650);
    setTimeout(() => setExportStep(3), 1350);
    setTimeout(() => {
      const digest =
        "0x" +
        Array.from({ length: 64 }, (_, idx) =>
          ((idx * 7 + trees.length * 13) % 16).toString(16)
        ).join("");
      setExportHash(digest);
      setExportStep(4);

      // Trigger real client-side download of the aggregated ESG payload
      if (esgExportFormat === "BURSA_ESG_CSV") {
        const headers = [
          "Precinct",
          "Asset_Count",
          "Pre_Handover_Trees",
          "Total_Biomass_kg",
          "Total_Biomass_Tonnes",
          "Annual_CO2e_Sequestered_kg",
          "Mean_Canopy_Health_Score",
          "Arbitrum_Sepolia_Verification_Root",
        ];
        const rows = precinctEsgBreakdown.map((p) => [
          `"${p.precinct}"`,
          p.treeCount,
          p.preHandover,
          p.biomassKg,
          (p.biomassKg / 1000).toFixed(3),
          p.co2KgPerYear,
          p.avgHealth,
          digest,
        ]);
        const csvContent =
          headers.join(",") + "\n" + rows.map((e) => e.join(",")).join("\n");
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `TreeLedger_Elmina_ESG_Audit_${new Date()
          .toISOString()
          .slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const jsonPayload = {
          platform: "TreeLedger dMRV Command Center",
          township: "City of Elmina (Sime Darby Property)",
          coordinates: [3.195, 101.515],
          generated_at: new Date().toISOString(),
          arbitrum_sepolia_state_root: digest,
          summary: {
            total_indexed_trees: kpiMetrics.totalAssets,
            total_biomass_kg: kpiMetrics.totalBiomassKg,
            total_biomass_tonnes: Number(
              (kpiMetrics.totalBiomassKg / 1000).toFixed(3)
            ),
            annual_co2e_sequestered_kg: kpiMetrics.annualCo2Kg,
            canopy_survival_index_pct: kpiMetrics.canopySurvivalIndex,
          },
          precinct_breakdown: precinctEsgBreakdown,
        };
        const blob = new Blob([JSON.stringify(jsonPayload, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `TreeLedger_GRI304_dMRV_${new Date()
          .toISOString()
          .slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }, 2100);
  };

  const renderStatusBadge = (status: ContractorSlaRow["status_tag"]) => {
    switch (status) {
      case "COMPLIANT":
        return <StatusBadge tone="healthy">SLA Compliant</StatusBadge>;
      case "AT_RISK":
        return <StatusBadge tone="warning">24h SLA Watch</StatusBadge>;
      case "DEDUCTION_ENFORCED":
        return <StatusBadge tone="warning">Fee Clawback Active</StatusBadge>;
      case "CRITICAL_BREACH":
        return <StatusBadge tone="critical">Critical Breach</StatusBadge>;
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] flex flex-col"
      data-theme="dark"
    >
      <MainPrototypeNotice home="/admin" />

      {/* Top Executive Navigation Bar harmonized with admin-gis.css */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xl px-6 py-3.5">
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Brand
              href="/admin"
              subtitle="City of Elmina · Operations & SLA Ledger"
            />
            <h1 className="sr-only">Township Operations Command Center</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="min-h-[44px] px-3.5 py-1.5 rounded-[var(--radius-control)] bg-[var(--surface-raised)] border border-[var(--border)] text-xs text-[var(--muted)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
              <span>Telemetry Sync:</span>
              <span className="font-mono text-[var(--foreground)]">
                {lastSyncedAt}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsSyncing(true);
                void syncTelemetry();
              }}
              className="min-h-[44px] px-4 py-2 rounded-[var(--radius-control)] bg-[var(--surface-raised)] hover:bg-[var(--background)] border border-[var(--control-border)] text-xs font-medium text-[var(--foreground)] flex items-center gap-2 transition cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[var(--accent)] ${
                  isSyncing ? "animate-spin" : ""
                }`}
              />
              <span>Sync PostGIS</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setExportStep(0);
                setIsEsgModalOpen(true);
              }}
              className="min-h-[44px] px-4 py-2 rounded-[var(--radius-control)] bg-[var(--accent)] hover:bg-[var(--accent-soft)] text-[var(--forest-950)] font-semibold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Executive ESG Report</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Widescreen Operations Workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-6 space-y-6">
        {/* 1. Real-Time KPI Ribbon */}
        <section
          aria-label="Real-time KPI Ribbon"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          {/* KPI 1: Total Assets */}
          <div className="p-5 rounded-[var(--radius-panel)] bg-[var(--surface)] border border-[var(--border)] shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Total Indexed Assets
              </span>
              <div className="p-2 rounded-[8px] bg-[rgba(89,200,232,0.12)] border border-[rgba(89,200,232,0.28)] text-[var(--verification)]">
                <Trees className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="text-3xl font-bold font-mono text-[var(--foreground)]">
                {kpiMetrics.totalAssets.toLocaleString()}
              </span>
              <span className="text-xs text-[var(--accent)] font-medium flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" />
                100% QR Anchored
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--muted)]">
              <span>
                Pre-Handover:{" "}
                <strong className="text-[var(--verification)]">
                  {kpiMetrics.preHandoverCount}
                </strong>
              </span>
              <span>
                DLP Active:{" "}
                <strong className="text-[var(--accent-soft)]">
                  {kpiMetrics.dlpCount}
                </strong>
              </span>
              <span>
                Living:{" "}
                <strong className="text-[var(--foreground)]">
                  {kpiMetrics.commissionedCount}
                </strong>
              </span>
            </div>
          </div>

          {/* KPI 2: Canopy Survival Index (%) */}
          <div className="p-5 rounded-[var(--radius-panel)] bg-[var(--surface)] border border-[var(--border)] shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Canopy Survival Index
              </span>
              <div className="p-2 rounded-[8px] bg-[rgba(82,217,165,0.12)] border border-[rgba(82,217,165,0.28)] text-[var(--accent)]">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="text-3xl font-bold font-mono text-[var(--foreground)]">
                {kpiMetrics.canopySurvivalIndex}%
              </span>
              <StatusBadge tone="healthy">Target &ge; 85.0%</StatusBadge>
            </div>
            <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--muted)]">
              <span>Gemini 3.8 Vision Graded</span>
              <span className="text-[var(--status-warning)] font-medium">
                {trees.filter((t) => t.health_score < 50).length} Critical
                Intervention(s)
              </span>
            </div>
          </div>

          {/* KPI 3: SLA Compliance (%) */}
          <div className="p-5 rounded-[var(--radius-panel)] bg-[var(--surface)] border border-[var(--border)] shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Contractor SLA Compliance
              </span>
              <div className="p-2 rounded-[8px] bg-[rgba(230,168,58,0.12)] border border-[rgba(230,168,58,0.28)] text-[var(--status-warning)]">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="text-3xl font-bold font-mono text-[var(--foreground)]">
                {kpiMetrics.avgSlaCompliance}%
              </span>
              <span className="text-xs text-[var(--status-warning)] font-medium">
                24h Critical Resolution SLA
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--muted)]">
              <span>
                Open Work Orders:{" "}
                <strong className="text-[var(--foreground)]">
                  {contractors.reduce((a, c) => a + c.unresolved_tasks, 0)}
                </strong>
              </span>
              <span className="text-[var(--status-critical-text)] font-mono">
                RM{" "}
                {contractors
                  .reduce((a, c) => a + c.automated_penalty_rm, 0)
                  .toLocaleString()}{" "}
                Clawback
              </span>
            </div>
          </div>

          {/* KPI 4: Annual CO2 Sequestered */}
          <div className="p-5 rounded-[var(--radius-panel)] bg-[var(--surface)] border border-[var(--border)] shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Annual CO₂ Sequestered
              </span>
              <div className="p-2 rounded-[8px] bg-[rgba(82,217,165,0.12)] border border-[rgba(82,217,165,0.28)] text-[var(--accent)]">
                <Wind className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="text-3xl font-bold font-mono text-[var(--accent)]">
                {kpiMetrics.annualCo2Kg.toLocaleString()}{" "}
                <span className="text-lg font-normal text-[var(--muted)]">
                  kg/yr
                </span>
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--muted)]">
              <span>
                Aboveground Biomass:{" "}
                <strong className="text-[var(--foreground)] font-mono">
                  {(kpiMetrics.totalBiomassKg / 1000).toFixed(2)} t
                </strong>
              </span>
              <span className="text-[var(--verification)] font-mono">
                Arbitrum Verified
              </span>
            </div>
          </div>
        </section>

        {/* 2. Geospatial Command Console & Quick-Filter Bar */}
        <section className="space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-panel)] p-3.5">
            {/* Handover Lifecycle Segment Control */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-[var(--muted)] px-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[var(--accent)]" />
                Lifecycle Phase:
              </span>
              {(
                [
                  { id: "ALL", label: "All Phases" },
                  {
                    id: "PRE_HANDOVER_PLANTED",
                    label: "Pre-Handover Audit",
                  },
                  { id: "DLP_ACTIVE", label: "DLP Active" },
                  { id: "COMMISSIONED", label: "Commissioned" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setHandoverFilter(tab.id)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-[var(--radius-control)] text-xs font-medium transition cursor-pointer ${
                    handoverFilter === tab.id
                      ? "bg-[var(--accent)] text-[var(--forest-950)] font-semibold shadow"
                      : "bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)] border border-[var(--border)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Health Tier Filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-[var(--muted)] px-2 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[var(--verification)]" />
                Health Band:
              </span>
              {(
                [
                  { id: "ALL", label: "All Scores" },
                  { id: "HEALTHY", label: "Green (≥80)" },
                  { id: "WARNING", label: "Amber (50–79)" },
                  { id: "CRITICAL", label: "Red (<50)" },
                ] as const
              ).map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setHealthFilter(tier.id)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-[var(--radius-control)] text-xs font-medium transition cursor-pointer ${
                    healthFilter === tier.id
                      ? "bg-[var(--foreground)] text-[var(--forest-950)] font-semibold"
                      : "bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)] border border-[var(--border)]"
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          {/* Map + Asset Roster Split View */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-8">
              <TownshipMap
                trees={trees}
                selectedTreeId={selectedTreeId}
                onSelectTree={(tree) =>
                  setSelectedTreeId(tree ? tree.id : null)
                }
                onDispatchSlaOrder={handleDispatchSlaOrder}
                handoverFilter={handoverFilter}
                healthFilter={healthFilter}
              />
            </div>

            {/* Right-hand Live Tree Asset Roster & Hazard Triage Queue */}
            <div className="xl:col-span-4 h-[540px] lg:h-[600px] rounded-[var(--radius-panel)] bg-[var(--surface)] border border-[var(--border)] flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-raised)]/60">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                    Geospatial Tree Telemetry Feed
                  </h2>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5">
                    Click any asset to fly camera &amp; open quick-inspect
                    drawer
                  </p>
                </div>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)]">
                  {trees.length} trees
                </span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]">
                {trees
                  .filter((t) => {
                    if (
                      handoverFilter !== "ALL" &&
                      t.handover_status !== handoverFilter
                    )
                      return false;
                    if (
                      healthFilter !== "ALL" &&
                      getHealthBand(t.health_score).tier !== healthFilter
                    )
                      return false;
                    return true;
                  })
                  .map((tree) => {
                    const band = getHealthBand(tree.health_score);
                    const handover = formatHandoverStatus(tree.handover_status);
                    const isSelected = tree.id === selectedTreeId;
                    const activeHazards = tree.hazards?.length || 0;

                    return (
                      <button
                        key={tree.id}
                        type="button"
                        onClick={() => setSelectedTreeId(tree.id)}
                        className={`w-full text-left p-3.5 transition flex items-start justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? "bg-[rgba(82,217,165,0.12)] border-l-4 border-l-[var(--accent)]"
                            : "hover:bg-[var(--surface-raised)]/60"
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${band.dotClass}`}
                            />
                            <span className="font-mono text-xs font-bold text-[var(--accent)]">
                              {tree.id}
                            </span>
                            <span className="text-xs font-semibold text-[var(--foreground)] truncate">
                              {tree.common_name}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--muted)] truncate">
                            {tree.precinct} •{" "}
                            <span className="italic">{tree.species}</span>
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded ${handover.badgeClass}`}
                            >
                              {handover.shortLabel}
                            </span>
                            {activeHazards > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(220,94,88,0.16)] text-[var(--status-critical-text)] border border-[rgba(220,94,88,0.34)] flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                {activeHazards} Hazard
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div
                            className={`inline-block text-xs font-mono font-bold px-2 py-0.5 rounded-md ${band.badgeClass}`}
                          >
                            {tree.health_score}/100
                          </div>
                          <div className="text-[11px] font-mono text-[var(--muted)] mt-1">
                            {tree.co2_kg_per_year} kg CO₂/yr
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </section>

        {/* 3. Contractor SLA Compliance & Automated Deduction Table */}
        <section className="rounded-[var(--radius-panel)] bg-[var(--surface)] border border-[var(--border)] shadow-xl overflow-hidden">
          <div className="p-5 border-b border-[var(--border)] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-[var(--surface-raised)]/45">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[var(--accent)]" />
                <h2 className="text-base font-bold text-[var(--foreground)]">
                  Contractor SLA Compliance &amp; Automated Penalty Ledger
                </h2>
              </div>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Smart-contract enforced maintenance turnaround tracking with
                mandatory geofenced before/after Vision verification
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={contractorSearch}
                  onChange={(e) => setContractorSearch(e.target.value)}
                  placeholder="Search contractor or precinct..."
                  className="min-h-[44px] pl-8 pr-3 py-1.5 rounded-[var(--radius-control)] bg-[var(--background)] border border-[var(--control-border)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--verification)]"
                />
              </div>

              <select
                value={contractorStatusFilter}
                onChange={(e) => setContractorStatusFilter(e.target.value)}
                aria-label="Filter contractors by SLA status"
                className="min-h-[44px] px-3 py-1.5 rounded-[var(--radius-control)] bg-[var(--background)] border border-[var(--control-border)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--verification)]"
              >
                <option value="ALL">All Status Tags</option>
                <option value="COMPLIANT">SLA Compliant</option>
                <option value="AT_RISK">24h SLA Watch</option>
                <option value="DEDUCTION_ENFORCED">
                  Fee Clawback Active
                </option>
                <option value="CRITICAL_BREACH">Critical Breach</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background)]/75 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                  <th className="py-3.5 px-4">Contractor &amp; ID</th>
                  <th className="py-3.5 px-4">Assigned Precinct</th>
                  <th className="py-3.5 px-4">Avg Turnaround Time</th>
                  <th className="py-3.5 px-4">Unresolved Tasks</th>
                  <th className="py-3.5 px-4">dMRV Proofs (Arbitrum)</th>
                  <th className="py-3.5 px-4">Automated Deduction Penalty</th>
                  <th className="py-3.5 px-4">Status Tag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs">
                {filteredContractors.map((row) => {
                  const isOverTarget =
                    row.avg_turnaround_hours > row.sla_target_hours;
                  return (
                    <tr
                      key={row.contractor_id}
                      className="hover:bg-[var(--surface-raised)]/50 transition"
                    >
                      <td className="py-4 px-4">
                        <div className="font-semibold text-[var(--foreground)]">
                          {row.company_name}
                        </div>
                        <div className="font-mono text-[11px] text-[var(--accent)] mt-0.5">
                          {row.contractor_id} • {row.sla_compliance_pct}% SLA
                        </div>
                      </td>

                      <td className="py-4 px-4 text-[var(--muted)]">
                        {row.assigned_precinct}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold text-sm ${
                              isOverTarget
                                ? "text-[var(--status-critical-text)]"
                                : "text-[var(--accent)]"
                            }`}
                          >
                            {row.avg_turnaround_hours.toFixed(1)}h
                          </span>
                          <span className="text-[11px] text-[var(--muted)]">
                            / {row.sla_target_hours}h SLA
                          </span>
                        </div>
                        <div className="w-28 h-1.5 bg-[var(--background)] rounded-full overflow-hidden mt-1.5">
                          <div
                            className={`h-full rounded-full ${
                              isOverTarget
                                ? "bg-[var(--status-critical)]"
                                : "bg-[var(--accent)]"
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                (row.avg_turnaround_hours / 48) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-[var(--foreground)] text-sm">
                            {row.unresolved_tasks}
                          </span>
                          {row.critical_overdue > 0 && (
                            <span className="px-2 py-0.5 rounded bg-[rgba(220,94,88,0.16)] text-[var(--status-critical-text)] border border-[rgba(220,94,88,0.34)] text-[10px] font-mono font-semibold">
                              {row.critical_overdue} overdue &gt;24h
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-mono text-[var(--foreground)] font-semibold">
                          {row.verified_proofs_count} verified
                        </div>
                        <a
                          href={`https://sepolia.arbiscan.io/tx/${row.last_arbitrum_tx}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-mono text-[var(--verification)] hover:underline inline-flex items-center gap-1 mt-0.5"
                        >
                          {row.last_arbitrum_tx.slice(0, 10)}...
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>

                      <td className="py-4 px-4">
                        {row.automated_penalty_rm > 0 ? (
                          <div>
                            <span className="font-mono font-bold text-[var(--status-critical-text)] text-sm">
                              - RM {row.automated_penalty_rm.toLocaleString()}
                            </span>
                            <div className="text-[10px] text-[var(--muted)]">
                              {row.penalty_rate_pct}% monthly retainer deduction
                            </div>
                          </div>
                        ) : (
                          <span className="font-mono text-[var(--accent)] font-medium">
                            RM 0 (Zero Deductions)
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {renderStatusBadge(row.status_tag)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* 4. Executive ESG Report Export Modal */}
      {isEsgModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[var(--background)]/82 backdrop-blur-md flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="esg-modal-title"
        >
          <div className="w-full max-w-2xl rounded-[var(--radius-dialog)] bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-[var(--border)] flex items-start justify-between bg-[var(--surface-raised)]/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-[var(--radius-control)] bg-[rgba(82,217,165,0.14)] border border-[rgba(82,217,165,0.3)] text-[var(--accent)]">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    id="esg-modal-title"
                    className="text-base font-bold text-[var(--foreground)]"
                  >
                    Executive ESG &amp; Decarbonization dMRV Export
                  </h2>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Audit-grade biomass &amp; carbon sequestration aggregation
                    anchored on Arbitrum Sepolia
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEsgModalOpen(false)}
                className="min-h-[36px] min-w-[36px] p-1.5 rounded-[8px] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)] transition cursor-pointer flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5">
              {/* Aggregate Township Totals */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-[var(--radius-control)] bg-[var(--background)] border border-[var(--border)]">
                  <div className="text-[11px] text-[var(--muted)] uppercase font-semibold">
                    Total Precinct Biomass
                  </div>
                  <div className="text-xl font-bold font-mono text-[var(--foreground)] mt-1">
                    {(kpiMetrics.totalBiomassKg / 1000).toFixed(2)} t
                  </div>
                  <div className="text-[11px] text-[var(--muted)] font-mono">
                    ({kpiMetrics.totalBiomassKg.toLocaleString()} kg dry weight)
                  </div>
                </div>

                <div className="p-3.5 rounded-[var(--radius-control)] bg-[var(--background)] border border-[var(--border)]">
                  <div className="text-[11px] text-[var(--muted)] uppercase font-semibold">
                    Annual Sequestered CO₂e
                  </div>
                  <div className="text-xl font-bold font-mono text-[var(--accent)] mt-1">
                    {kpiMetrics.annualCo2Kg.toLocaleString()} kg/yr
                  </div>
                  <div className="text-[11px] text-[var(--muted)] font-mono">
                    {(kpiMetrics.annualCo2Kg / 1000).toFixed(3)} tCO₂e / year
                  </div>
                </div>

                <div className="p-3.5 rounded-[var(--radius-control)] bg-[var(--background)] border border-[var(--border)]">
                  <div className="text-[11px] text-[var(--muted)] uppercase font-semibold">
                    Canopy Survival Rate
                  </div>
                  <div className="text-xl font-bold font-mono text-[var(--verification)] mt-1">
                    {kpiMetrics.canopySurvivalIndex}%
                  </div>
                  <div className="text-[11px] text-[var(--muted)]">
                    Across {kpiMetrics.totalAssets} audited trees
                  </div>
                </div>
              </div>

              {/* Precinct Breakdown Table */}
              <div className="rounded-[var(--radius-control)] border border-[var(--border)] overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[var(--background)] text-[11px] uppercase text-[var(--muted)] border-b border-[var(--border)]">
                      <th className="py-2.5 px-3">Precinct Sector</th>
                      <th className="py-2.5 px-3">Trees</th>
                      <th className="py-2.5 px-3">Biomass (kg)</th>
                      <th className="py-2.5 px-3">CO₂e (kg/yr)</th>
                      <th className="py-2.5 px-3">Mean Health</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] bg-[var(--surface-raised)]/35">
                    {precinctEsgBreakdown.map((item) => (
                      <tr key={item.precinct}>
                        <td className="py-2.5 px-3 font-medium text-[var(--foreground)]">
                          {item.precinct}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[var(--muted)]">
                          {item.treeCount}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[var(--muted)]">
                          {item.biomassKg.toLocaleString()} kg
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[var(--accent)] font-semibold">
                          {item.co2KgPerYear.toFixed(1)} kg
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[var(--foreground)]">
                          {item.avgHealth}/100
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Reporting Standard Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] block">
                  Compliance Reporting Standard
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEsgExportFormat("BURSA_ESG_CSV")}
                    className={`p-3 rounded-[var(--radius-control)] border text-left transition cursor-pointer ${
                      esgExportFormat === "BURSA_ESG_CSV"
                        ? "bg-[rgba(82,217,165,0.14)] border-[var(--accent)] text-[var(--foreground)]"
                        : "bg-[var(--background)] border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-raised)]"
                    }`}
                  >
                    <div className="text-xs font-semibold">
                      Bursa Malaysia Sustainability CSV
                    </div>
                    <div className="text-[11px] text-[var(--muted)] mt-0.5">
                      Precinct biomass, survival rate &amp; Arbitrum proof
                      columns
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEsgExportFormat("GRI_304_JSON")}
                    className={`p-3 rounded-[var(--radius-control)] border text-left transition cursor-pointer ${
                      esgExportFormat === "GRI_304_JSON"
                        ? "bg-[rgba(82,217,165,0.14)] border-[var(--accent)] text-[var(--foreground)]"
                        : "bg-[var(--background)] border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-raised)]"
                    }`}
                  >
                    <div className="text-xs font-semibold">
                      GRI 304 Biodiversity dMRV JSON
                    </div>
                    <div className="text-[11px] text-[var(--muted)] mt-0.5">
                      Machine-verifiable schema with keccak256 state root
                    </div>
                  </button>
                </div>
              </div>

              {/* Export Simulation Stepper */}
              {exportStep > 0 && (
                <div className="p-4 rounded-[var(--radius-control)] bg-[var(--background)] border border-[var(--border)] space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--accent)]">
                      {exportStep === 1 &&
                        "Step 1/3: Aggregating PostGIS canopy polygons & allometric biomass..."}
                      {exportStep === 2 &&
                        "Step 2/3: Verifying Arbitrum Sepolia keccak256 maintenance receipts..."}
                      {exportStep === 3 &&
                        "Step 3/3: Signing dMRV attestation & generating export file..."}
                      {exportStep === 4 &&
                        "Audit Package Signed & Downloaded Successfully"}
                    </span>
                    <span className="font-mono text-[var(--muted)]">
                      {Math.min(100, exportStep * 25)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[var(--surface-raised)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent)] transition-all duration-500"
                      style={{ width: `${Math.min(100, exportStep * 25)}%` }}
                    />
                  </div>
                  {exportStep === 4 && exportHash && (
                    <div className="pt-1 text-[11px] font-mono text-[var(--muted)] break-all">
                      Arbitrum State Root:{" "}
                      <span className="text-[var(--verification)]">
                        {exportHash}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-raised)]/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEsgModalOpen(false)}
                className="min-h-[44px] px-4 py-2 rounded-[var(--radius-control)] bg-[var(--surface-raised)] hover:bg-[var(--background)] border border-[var(--control-border)] text-xs font-medium text-[var(--foreground)] transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleRunEsgExport}
                disabled={exportStep > 0 && exportStep < 4}
                className="min-h-[44px] px-4 py-2 rounded-[var(--radius-control)] bg-[var(--accent)] hover:bg-[var(--accent-soft)] disabled:opacity-50 text-[var(--forest-950)] font-semibold text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>
                  {exportStep === 4
                    ? "Re-Download Verified Report"
                    : "Generate & Download ESG Package"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
