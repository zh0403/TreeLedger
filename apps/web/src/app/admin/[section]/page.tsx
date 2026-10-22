import { notFound } from "next/navigation";
import { Suspense } from "react";
import Loading from "../loading";
import { AdminCommandCenter } from "@/components/admin/admin-command-center";
import { isWorkspaceView, workspaceConfig } from "@/components/workspaces/config";

export function generateStaticParams() {
  return workspaceConfig.admin.navigation.filter(item => item.view !== "overview").map(item => ({ section: item.view }));
}

type SectionProps = { params: Promise<{ section: string }> };

export default function Page({ params }: SectionProps) {
  return <Suspense fallback={<Loading />}><SectionPage params={params} /></Suspense>;
}

async function SectionPage({ params }: SectionProps) {
  const { section } = await params;
  if (!isWorkspaceView("admin", section)) notFound();
  return <AdminCommandCenter key={section} view={section} />;
}
