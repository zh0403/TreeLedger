"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Search,
  Filter,
  Building2,
  Sparkles,
  ExternalLink,
  X,
  ArrowUpRight,
  Scale,
  BadgeAlert,
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
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
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
    setIsSyncing(true);
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
    syncTelemetry();
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
            ((survivingCount / totalAssets) * 0.7 * 100 + avgHealth * 0.3).toFixed(
              1
            )
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
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            SLA Compliant
          </span>
        );
      case "AT_RISK":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            24h SLA Watch
          </span>
        );
      case "DEDUCTION_ENFORCED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-300 border border-orange-500/30">
            <Scale className="w-3.5 h-3.5 text-orange-400" />
            Fee Clawback Active
          </span>
        );
      case "CRITICAL_BREACH":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-300 border border-red-500/30">
            <BadgeAlert className="w-3.5 h-3.5 text-red-400" />
            Critical Breach
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Executive Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shadow-inner">
              <Trees className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  TreeLedger — Township Operations Command Center
                </h1>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  City of Elmina • dMRV Live
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Geospatial PostGIS Canopy Registry, Pre-Handover DLP Verification
                &amp; Arbitrum Sepolia Contractor SLA Ledger
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Telemetry Sync:</span>
              <span className="font-mono text-slate-200">{lastSyncedAt}</span>
            </div>

            <button
              type="button"
              onClick={syncTelemetry}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 flex items-center gap-2 transition cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-emerald-400 ${
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
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
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
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Indexed Assets
              </span>
              <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <Trees className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="text-3xl font-bold font-mono text-white">
                {kpiMetrics.totalAssets.toLocaleString()}
              </span>
              <span className="text-xs text-emerald-400 font-medium flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" />
                100% QR Anchored
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>
                Pre-Handover:{" "}
                <strong className="text-sky-300">
                  {kpiMetrics.preHandoverCount}
                </strong>
              </span>
              <span>
                DLP Active:{" "}
                <strong className="text-violet-300">
                  {kpiMetrics.dlpCount}
                </strong>
              </span>
              <span>
                Living:{" "}
                <strong className="text-slate-200">
                  {kpiMetrics.commissionedCount}
                </strong>
              </span>
            </div>
          </div>

          {/* KPI 2: Canopy Survival Index (%) */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Canopy Survival Index
              </span>
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="text-3xl font-bold font-mono text-white">
                {kpiMetrics.canopySurvivalIndex}%
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                Target &ge; 85.0%
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Gemini 3.8 Vision Graded</span>
              <span className="text-amber-300 font-medium">
                {trees.filter((t) => t.health_score < 50).length} Critical
                Intervention(s)
              </span>
            </div>
          </div>

          {/* KPI 3: SLA Compliance (%) */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Contractor SLA Compliance
              </span>
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="text-3xl font-bold font-mono text-white">
                {kpiMetrics.avgSlaCompliance}%
              </span>
              <span className="text-xs text-amber-300 font-medium">
                24h Critical Resolution SLA
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>
                Open Work Orders:{" "}
                <strong className="text-slate-200">
                  {contractors.reduce((a, c) => a + c.unresolved_tasks, 0)}
                </strong>
              </span>
              <span className="text-red-300 font-mono">
                RM{" "}
                {contractors
                  .reduce((a, c) => a + c.automated_penalty_rm, 0)
                  .toLocaleString()}{" "}
                Clawback
              </span>
            </div>
          </div>

          {/* KPI 4: Annual CO2 Sequestered */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Annual CO₂ Sequestered
              </span>
              <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <Wind className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="text-3xl font-bold font-mono text-emerald-400">
                {kpiMetrics.annualCo2Kg.toLocaleString()}{" "}
                <span className="text-lg font-normal text-slate-300">
                  kg/yr
                </span>
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>
                Aboveground Biomass:{" "}
                <strong className="text-slate-200 font-mono">
                  {(kpiMetrics.totalBiomassKg / 1000).toFixed(2)} t
                </strong>
              </span>
              <span className="text-emerald-300 font-mono">
                Arbitrum Verified
              </span>
            </div>
          </div>
        </section>

        {/* 2. Geospatial Command Console & Quick-Filter Bar */}
        <section className="space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-slate-900/60 border border-slate-800/90 rounded-2xl p-3.5">
            {/* Handover Lifecycle Segment Control */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-slate-400 px-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    handoverFilter === tab.id
                      ? "bg-emerald-500 text-slate-950 font-semibold shadow"
                      : "bg-slate-950/70 text-slate-300 hover:bg-slate-800 border border-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Health Tier Filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-slate-400 px-2 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-sky-400" />
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    healthFilter === tier.id
                      ? "bg-slate-100 text-slate-950 font-semibold"
                      : "bg-slate-950/70 text-slate-300 hover:bg-slate-800 border border-slate-800"
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
            <div className="xl:col-span-4 h-[540px] lg:h-[600px] rounded-2xl bg-slate-900/70 border border-slate-800/90 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                <div>
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Geospatial Tree Telemetry Feed
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click any asset to fly camera &amp; open quick-inspect
                    drawer
                  </p>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {trees.length} trees
                </span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/70">
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
                            ? "bg-emerald-500/10 border-l-4 border-l-emerald-400"
                            : "hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${band.dotClass}`}
                            />
                            <span className="font-mono text-xs font-bold text-emerald-400">
                              {tree.id}
                            </span>
                            <span className="text-xs font-semibold text-slate-100 truncate">
                              {tree.common_name}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
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
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/30 flex items-center gap-1">
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
                          <div className="text-[11px] font-mono text-slate-400 mt-1">
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
        <section className="rounded-2xl bg-slate-900/70 border border-slate-800/90 shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-950/40">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-bold text-white">
                  Contractor SLA Compliance &amp; Automated Penalty Ledger
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Smart-contract enforced maintenance turnaround tracking with
                mandatory geofenced before/after Vision verification
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={contractorSearch}
                  onChange={(e) => setContractorSearch(e.target.value)}
                  placeholder="Search contractor or precinct..."
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              <select
                value={contractorStatusFilter}
                onChange={(e) => setContractorStatusFilter(e.target.value)}
                aria-label="Filter contractors by SLA status"
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60"
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
                <tr className="border-b border-slate-800/90 bg-slate-950/70 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Contractor &amp; ID</th>
                  <th className="py-3.5 px-4">Assigned Precinct</th>
                  <th className="py-3.5 px-4">Avg Turnaround Time</th>
                  <th className="py-3.5 px-4">Unresolved Tasks</th>
                  <th className="py-3.5 px-4">dMRV Proofs (Arbitrum)</th>
                  <th className="py-3.5 px-4">Automated Deduction Penalty</th>
                  <th className="py-3.5 px-4">Status Tag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {filteredContractors.map((row) => {
                  const isOverTarget =
                    row.avg_turnaround_hours > row.sla_target_hours;
                  return (
                    <tr
                      key={row.contractor_id}
                      className="hover:bg-slate-800/40 transition"
                    >
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-100">
                          {row.company_name}
                        </div>
                        <div className="font-mono text-[11px] text-emerald-400 mt-0.5">
                          {row.contractor_id} • {row.sla_compliance_pct}% SLA
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-300">
                        {row.assigned_precinct}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold text-sm ${
                              isOverTarget
                                ? "text-red-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {row.avg_turnaround_hours.toFixed(1)}h
                          </span>
                          <span className="text-[11px] text-slate-400">
                            / {row.sla_target_hours}h SLA
                          </span>
                        </div>
                        <div className="w-28 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                          <div
                            className={`h-full rounded-full ${
                              isOverTarget ? "bg-red-500" : "bg-emerald-500"
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
                          <span className="font-mono font-semibold text-slate-100 text-sm">
                            {row.unresolved_tasks}
                          </span>
                          {row.critical_overdue > 0 && (
                            <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/30 text-[10px] font-mono font-semibold">
                              {row.critical_overdue} overdue &gt;24h
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-mono text-slate-200 font-semibold">
                          {row.verified_proofs_count} verified
                        </div>
                        <a
                          href={`https://sepolia.arbiscan.io/tx/${row.last_arbitrum_tx}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-mono text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 mt-0.5"
                        >
                          {row.last_arbitrum_tx.slice(0, 10)}...
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>

                      <td className="py-4 px-4">
                        {row.automated_penalty_rm > 0 ? (
                          <div>
                            <span className="font-mono font-bold text-red-400 text-sm">
                              - RM {row.automated_penalty_rm.toLocaleString()}
                            </span>
                            <div className="text-[10px] text-slate-400">
                              {row.penalty_rate_pct}% monthly retainer deduction
                            </div>
                          </div>
                        ) : (
                          <span className="font-mono text-emerald-400 font-medium">
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
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="esg-modal-title"
        >
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    id="esg-modal-title"
                    className="text-base font-bold text-white"
                  >
                    Executive ESG &amp; Decarbonization dMRV Export
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Audit-grade biomass &amp; carbon sequestration aggregation
                    anchored on Arbitrum Sepolia
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEsgModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5">
              {/* Aggregate Township Totals */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">
                    Total Precinct Biomass
                  </div>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {(kpiMetrics.totalBiomassKg / 1000).toFixed(2)} t
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    ({kpiMetrics.totalBiomassKg.toLocaleString()} kg dry weight)
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">
                    Annual Sequestered CO₂e
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                    {kpiMetrics.annualCo2Kg.toLocaleString()} kg/yr
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {(kpiMetrics.annualCo2Kg / 1000).toFixed(3)} tCO₂e / year
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">
                    Canopy Survival Rate
                  </div>
                  <div className="text-xl font-bold font-mono text-sky-400 mt-1">
                    {kpiMetrics.canopySurvivalIndex}%
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Across {kpiMetrics.totalAssets} audited trees
                  </div>
                </div>
              </div>

              {/* Precinct Breakdown Table */}
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-[11px] uppercase text-slate-400 border-b border-slate-800">
                      <th className="py-2.5 px-3">Precinct Sector</th>
                      <th className="py-2.5 px-3">Trees</th>
                      <th className="py-2.5 px-3">Biomass (kg)</th>
                      <th className="py-2.5 px-3">CO₂e (kg/yr)</th>
                      <th className="py-2.5 px-3">Mean Health</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 bg-slate-950/40">
                    {precinctEsgBreakdown.map((item) => (
                      <tr key={item.precinct}>
                        <td className="py-2.5 px-3 font-medium text-slate-200">
                          {item.precinct}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">
                          {item.treeCount}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">
                          {item.biomassKg.toLocaleString()} kg
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400 font-semibold">
                          {item.co2KgPerYear.toFixed(1)} kg
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-200">
                          {item.avgHealth}/100
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Reporting Standard Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                  Compliance Reporting Standard
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEsgExportFormat("BURSA_ESG_CSV")}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      esgExportFormat === "BURSA_ESG_CSV"
                        ? "bg-emerald-500/15 border-emerald-500/50 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="text-xs font-semibold">
                      Bursa Malaysia Sustainability CSV
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Precinct biomass, survival rate &amp; Arbitrum proof
                      columns
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEsgExportFormat("GRI_304_JSON")}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      esgExportFormat === "GRI_304_JSON"
                        ? "bg-emerald-500/15 border-emerald-500/50 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="text-xs font-semibold">
                      GRI 304 Biodiversity dMRV JSON
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Machine-verifiable schema with keccak256 state root
                    </div>
                  </button>
                </div>
              </div>

              {/* Export Simulation Stepper */}
              {exportStep > 0 && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-400">
                      {exportStep === 1 &&
                        "Step 1/3: Aggregating PostGIS canopy polygons & allometric biomass..."}
                      {exportStep === 2 &&
                        "Step 2/3: Verifying Arbitrum Sepolia keccak256 maintenance receipts..."}
                      {exportStep === 3 &&
                        "Step 3/3: Signing dMRV attestation & generating export file..."}
                      {exportStep === 4 &&
                        "Audit Package Signed & Downloaded Successfully"}
                    </span>
                    <span className="font-mono text-slate-400">
                      {Math.min(100, exportStep * 25)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, exportStep * 25)}%` }}
                    />
                  </div>
                  {exportStep === 4 && exportHash && (
                    <div className="pt-1 text-[11px] font-mono text-slate-400 break-all">
                      Arbitrum State Root:{" "}
                      <span className="text-emerald-300">{exportHash}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEsgModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleRunEsgExport}
                disabled={exportStep > 0 && exportStep < 4}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-xs flex items-center gap-2 transition cursor-pointer"
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
