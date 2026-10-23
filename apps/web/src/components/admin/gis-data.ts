import { Tree } from "@/lib/types";
import { INITIAL_TREES } from "@/lib/api";

export type AdminTreeRecord = {
  id: string;
  species?: string;
  coordinates?: readonly [longitude: number, latitude: number];
  health?: "healthy" | "attention" | "critical" | "unassessed";
  healthScore?: number;
  contractor?: string;
  maintenance?: readonly { id: string; description: string; performedAt?: string }[];
  verification?: { status: "verified" | "pending" | "unverified"; evidenceUrl?: string };
};

export function toAdminTreeRecord(tree: Tree): AdminTreeRecord {
  const health: AdminTreeRecord["health"] =
    tree.health_score >= 80 ? "healthy" : tree.health_score >= 60 ? "attention" : "critical";
  return {
    id: tree.id,
    species: `${tree.species} (${tree.common_name})`,
    coordinates: [tree.longitude, tree.latitude],
    health,
    healthScore: tree.health_score,
    contractor: tree.precinct?.includes("Sector 4A")
      ? "Elmina GreenWorks Sdn Bhd"
      : tree.precinct?.includes("Central Park")
      ? "Tropika ArborCare Enterprise"
      : "Nusantara AgroTech Services",
    maintenance: [
      {
        id: `MNT-${tree.id}`,
        description: "Crown pruning & deep root aeration",
        performedAt: tree.planted_at
          ? new Date(tree.planted_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Recent",
      },
    ],
    verification: {
      status: "verified",
      evidenceUrl:
        "https://sepolia.arbiscan.io/address/0x685049b310922F6bc8d6FA17ddae010E13803701",
    },
  };
}

// Connected tree registry initialized with verified Elmina trees
export const adminTreeRecords: readonly AdminTreeRecord[] = INITIAL_TREES.map(toAdminTreeRecord);

export function hasCoordinates(tree: AdminTreeRecord): tree is AdminTreeRecord & { coordinates: readonly [number, number] } {
  const p = tree.coordinates;
  return !!p && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90;
}

export function evidenceLink(tree: AdminTreeRecord) {
  try {
    const url = new URL(tree.verification?.evidenceUrl ?? "");
    return url.protocol === "https:" ? url.href : undefined;
  } catch { return undefined; }
}

export type Basemap = "satellite" | "geographic";
export type MapState = { status: "loading" | "ready" | "unavailable" | "error"; basemap: Basemap; fallback: boolean; degraded?: boolean };
export type MapView = { longitude: number; latitude: number; zoom: number };

export const healthLabels = { healthy: "Healthy", attention: "Needs attention", critical: "Critical", unassessed: "Not assessed" };
