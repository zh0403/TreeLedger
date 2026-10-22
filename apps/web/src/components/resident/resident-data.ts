/** Presentation fields only. Bind documented registry responses here when available. */
export type ResidentTreeRecord = {
  id: string;
  commonName?: string;
  scientificName?: string;
  species?: string;
  location?: string;
  health?: "healthy" | "attention" | "critical" | "unassessed";
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
  healthScore?: number;
};

// Disconnected is not the same as a connected registry containing zero trees.
export const residentTreeRecords: readonly ResidentTreeRecord[] | null = null;

export const residentHealthLabels = {
  healthy: "Healthy",
  attention: "Needs attention",
  critical: "Critical",
  unassessed: "Not assessed",
};

export type ResidentHealthFilter = "all" | keyof typeof residentHealthLabels;

export function residentPhotoSource(src?: string) {
  if (src?.startsWith("/") && !src.startsWith("//")) return src;
  try { return new URL(src ?? "").protocol === "https:" ? src : undefined; } catch { return undefined; }
}

export function filterResidentTrees(trees: readonly ResidentTreeRecord[], query: string, health: ResidentHealthFilter, species = "all", location = "all") {
  const term = query.trim().toLocaleLowerCase();
  return trees.filter(tree => (health === "all" || tree.health === health) &&
    (species === "all" || (tree.species ?? tree.scientificName) === species) &&
    (location === "all" || tree.location === location) &&
    [tree.id, tree.commonName, tree.scientificName, tree.species, tree.location].filter(Boolean).join(" ").toLocaleLowerCase().includes(term));
}

export function hasResidentCoordinates(tree: ResidentTreeRecord): tree is ResidentTreeRecord & { latitude: number; longitude: number } {
  return typeof tree.latitude === "number" && typeof tree.longitude === "number" && Number.isFinite(tree.latitude) && Number.isFinite(tree.longitude) && Math.abs(tree.latitude) <= 90 && Math.abs(tree.longitude) <= 180;
}
