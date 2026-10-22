import { LoadingSkeleton } from "@/components/workspaces/empty-state";
import "@/components/workspaces/workspace.css";

export default function Loading() {
  return <main style={{ padding: 32 }}><LoadingSkeleton label="Loading workspace" /></main>;
}
