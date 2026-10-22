/** Frontend presentation contract. No assignment endpoint is invented here. */
export type FieldTask = {
  id: string;
  title: string;
  treeId?: string;
  treeName?: string;
  species?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  dueAt?: string;
  priority?: "low" | "medium" | "high";
  status?: "assigned" | "in-progress" | "review" | "completed";
  photoUrl?: string;
  notes?: string;
};
export type FieldFilter = "all" | "attention" | "upcoming" | "overdue" | "completed" | "assigned" | "in-progress" | "review";
export const assignedFieldTasks: readonly FieldTask[] | null = null;
export const taskStatusLabels = { assigned: "Assigned", "in-progress": "In progress", review: "Awaiting review", completed: "Completed" };

export function taskDue(task: FieldTask) {
  // Require a full timestamp including timezone, not a date interpreted differently per device.
  if (!task.dueAt || !/T.+(?:Z|[+-]\d{2}:\d{2})$/i.test(task.dueAt)) return undefined;
  const value = Date.parse(task.dueAt);
  return Number.isFinite(value) ? value : undefined;
}
export function taskOverdue(task: FieldTask, now: number) {
  const due = taskDue(task);
  return task.status !== undefined && task.status !== "completed" && due !== undefined && due < now;
}
export function fieldCoordinates(task: FieldTask): task is FieldTask & { latitude: number; longitude: number } {
  return typeof task.latitude === "number" && typeof task.longitude === "number" && Number.isFinite(task.latitude) && Number.isFinite(task.longitude) && Math.abs(task.latitude) <= 90 && Math.abs(task.longitude) <= 180;
}
export function fieldPhoto(src?: string) {
  if (src?.startsWith("/") && !src.startsWith("//")) return src;
  try { return new URL(src ?? "").protocol === "https:" ? src : undefined; } catch { return undefined; }
}
export function filterFieldTasks(tasks: readonly FieldTask[], query: string, filter: FieldFilter, status: string, now: number) {
  const term = query.trim().toLocaleLowerCase();
  return tasks.filter(task => {
    if (status !== "all" && task.status !== status) return false;
    if (![task.id,task.title,task.treeId,task.treeName,task.species,task.location].filter(Boolean).join(" ").toLocaleLowerCase().includes(term)) return false;
    if (filter === "all") return true;
    if (filter === "completed") return task.status === "completed";
    if (filter === "overdue") return taskOverdue(task,now);
    if (filter === "attention") return task.status !== "completed" && (task.priority === "high" || task.priority === "medium" || taskOverdue(task,now));
    if (filter === "upcoming") { const due = taskDue(task); return task.status !== "completed" && due !== undefined && due >= now; }
    return task.status === filter;
  });
}
export function fieldSummary(tasks: readonly FieldTask[] | null, now: number | null) {
  if (tasks === null) return { assigned: null, due: null, trees: null, completed: null };
  const pending = tasks.filter(task => task.status !== "completed");
  const missingStatus = tasks.some(task => task.status === undefined);
  // Rolling seven-day window. Never infer a due date from severity or creation date.
  const missingDue = pending.some(task => taskDue(task) === undefined);
  return {
    assigned: missingStatus ? null : pending.length,
    due: missingStatus || now === null || missingDue ? null : pending.filter(task => { const due = taskDue(task); return due !== undefined && due >= now && due < now + 7 * 86400000; }).length,
    trees: tasks.length && tasks.some(task => !task.treeId) ? null : new Set(tasks.map(task => task.treeId).filter(Boolean)).size,
    completed: missingStatus ? null : tasks.filter(task => task.status === "completed").length,
  };
}
