import { notFound } from "next/navigation";
import { Suspense } from "react";
import Loading from "../loading";
import { Workspace } from "@/components/workspaces/workspace";
import { ResidentHome } from "@/components/resident/resident-home";
import { ResidentExplore } from "@/components/resident/resident-explore";
import { ResidentReports } from "@/components/resident/resident-reports";
import { isWorkspaceView, workspaceConfig } from "@/components/workspaces/config";

export function generateStaticParams() {
  return workspaceConfig.resident.navigation.filter(item => item.view !== "trees").map(item => ({ section: item.view }));
}

type SectionProps = { params: Promise<{ section: string }> };

export default function Page({ params }: SectionProps) {
  return <Suspense fallback={<Loading />}><SectionPage params={params} /></Suspense>;
}

async function SectionPage({ params }: SectionProps) {
  const { section } = await params;
  if (!isWorkspaceView("resident", section)) notFound();
  if (section === "trees") return <ResidentHome />;
  if (section === "map") return <ResidentExplore />;
  if (section === "reports") return <ResidentReports />;
  return <Workspace role="resident" view={section} />;
}
