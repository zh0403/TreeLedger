/** Frontend presentation contract. Map documented API responses here when available.
 * No operational endpoint or sample records are invented by this workspace.
 */
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

// null means disconnected, unlike [] which would mean a connected, empty registry.
export const adminTreeRecords: readonly AdminTreeRecord[] | null = null;

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
