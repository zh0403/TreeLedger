import { notFound } from "next/navigation";
import { Suspense } from "react";
import Loading from "../loading";
import { FieldWorkspace } from "@/components/contractor/field-workspace";
import { isWorkspaceView, workspaceConfig } from "@/components/workspaces/config";

export function generateStaticParams() {
  return workspaceConfig.contractor.navigation.filter(item => item.view !== "tasks").map(item => ({ section: item.view }));
}

type SectionProps = { params: Promise<{ section: string }> };

export default function Page({ params }: SectionProps) {
  return <Suspense fallback={<Loading />}><SectionPage params={params} /></Suspense>;
}

async function SectionPage({ params }: SectionProps) {
  const { section } = await params;
  if (!isWorkspaceView("contractor", section)) notFound();
  if (section !== "map" && section !== "history") notFound();
  return <FieldWorkspace key={section} view={section} />;
}
