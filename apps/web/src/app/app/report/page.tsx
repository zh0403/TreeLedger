import { Suspense } from "react";
import { ResidentReportForm } from "@/components/resident/resident-report-form";

type Props = { searchParams: Promise<Record<string,string | string[] | undefined>> };
export default function ReportPage({ searchParams }: Props) {
  return <Suspense fallback={<p className="nature-page-loading">Opening your report draft…</p>}><ReportContent searchParams={searchParams} /></Suspense>;
}
async function ReportContent({ searchParams }: Props) {
  const params = await searchParams;
  const reference = typeof params.tree === "string" ? params.tree.slice(0,100) : "";
  const location = typeof params.place === "string" ? params.place.slice(0,250) : "";
  return <ResidentReportForm key={`${reference}/${location}`} initialReference={reference} initialLocation={location} />;
}
