/** Presentation fields only. Bind documented registry responses here when available. */
export type ResidentTreeRecord = {
  id: string;
  commonName?: string;
  scientificName?: string;
  species?: string;
  location?: string;
  health?: "healthy" | "attention" | "critical" | "unassessed";
  photoUrl?: string;
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

export function filterResidentTrees(trees: readonly ResidentTreeRecord[], query: string, health: ResidentHealthFilter) {
  const term = query.trim().toLocaleLowerCase();
  return trees.filter(tree => (health === "all" || tree.health === health) &&
    [tree.id, tree.commonName, tree.scientificName, tree.species, tree.location].filter(Boolean).join(" ").toLocaleLowerCase().includes(term));
}
