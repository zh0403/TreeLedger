import { notFound } from "next/navigation";
import { Workspace } from "@/components/workspaces/workspace";
import { ResidentHome } from "@/components/resident/resident-home";
import { isWorkspaceView, workspaceConfig } from "@/components/workspaces/config";

export function generateStaticParams() {
  return workspaceConfig.resident.navigation.filter(item => item.view !== "trees").map(item => ({ section: item.view }));
}

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!isWorkspaceView("resident", section)) notFound();
  if (section === "trees") return <ResidentHome />;
  return <Workspace role="resident" view={section} />;
}
