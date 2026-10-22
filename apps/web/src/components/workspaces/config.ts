export type WorkspaceRole = "admin" | "resident" | "contractor";
export type WorkspaceView = "overview" | "map" | "trees" | "profile" | "maintenance" | "hazards" | "sla" | "insights" | "reports" | "tasks" | "history";

export const workspaceConfig = {
  admin: { name: "Township operations", base: "/admin", home: "overview", navigation: [
    { view: "overview", label: "Overview" }, { view: "map", label: "Township map" },
    { view: "trees", label: "Tree registry" }, { view: "maintenance", label: "Maintenance" },
    { view: "hazards", label: "Hazard reports" }, { view: "sla", label: "SLA monitoring" },
    { view: "insights", label: "Environmental insights" },
  ] },
  resident: { name: "Your neighbourhood", base: "/app", home: "trees", navigation: [
    { view: "trees", label: "Discover trees" }, { view: "map", label: "Explore map" }, { view: "profile", label: "Tree profile" }, { view: "reports", label: "My reports" },
  ] },
  contractor: { name: "Field workspace", base: "/contractor", home: "tasks", navigation: [
    { view: "tasks", label: "Assigned tasks" }, { view: "map", label: "Tree locations" }, { view: "history", label: "Evidence drafts" },
  ] },
} as const;

export function workspaceHref(role: WorkspaceRole, view: string) {
  const config = workspaceConfig[role];
  return view === config.home ? config.base : `${config.base}/${view}`;
}

export function isWorkspaceView(role: WorkspaceRole, section: string): section is WorkspaceView {
  return workspaceConfig[role].navigation.some(item => item.view === section);
}
