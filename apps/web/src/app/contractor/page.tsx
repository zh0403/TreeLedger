import type { Metadata } from "next";
import { Workspace } from "@/components/workspaces/workspace";

export const metadata: Metadata = { title: "TreeLedger | Field workspace" };

export default function Page() {
  return <Workspace role="contractor" view="tasks" />;
}
