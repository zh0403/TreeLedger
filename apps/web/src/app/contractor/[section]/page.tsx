import { notFound } from "next/navigation";
import { Workspace } from "@/components/workspaces/workspace";
import { isWorkspaceView, workspaceConfig } from "@/components/workspaces/config";

export function generateStaticParams() {
  return workspaceConfig.contractor.navigation.filter(item => item.view !== "tasks").map(item => ({ section: item.view }));
}

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!isWorkspaceView("contractor", section)) notFound();
  return <Workspace role="contractor" view={section} />;
}
