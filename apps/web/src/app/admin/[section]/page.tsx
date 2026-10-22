import { notFound } from "next/navigation";
import { AdminCommandCenter } from "@/components/admin/admin-command-center";
import { isWorkspaceView, workspaceConfig } from "@/components/workspaces/config";

export function generateStaticParams() {
  return workspaceConfig.admin.navigation.filter(item => item.view !== "overview").map(item => ({ section: item.view }));
}

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!isWorkspaceView("admin", section)) notFound();
  return <AdminCommandCenter key={section} view={section} />;
}
