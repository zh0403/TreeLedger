"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import { MainPrototypeNotice } from "../main-services";
import { FieldHeader } from "../contractor/field-header";
import { SectionNavigation } from "./section-navigation";
import "../contractor/field-workspace.css";
import "./service-workspace.css";

const serviceHeadings: Record<string, [string,string]> = {
  "/app/explore": ["The trees behind your township.", "Explore the registry, precincts and existing tree records."],
  "/app/hazards": ["A concern. A clearer care trail.", "Report a tree issue and follow the community care timeline."],
  "/app/maintenance": ["See the care behind each record.", "Review maintenance history, before-and-after photos and available references."],
  "/contractor/tasks": ["Your work, connected to the tree.", "Review work orders and record supporting photos and field notes."],
};

function ServiceContent({ children, role }: { children: ReactNode; role: "resident" | "contractor" }) {
  const pathname = usePathname();
  const heading = serviceHeadings[pathname];
  if (role === "resident" && pathname === "/app/hazards") {
    return <div className="integrated-service integrated-service--resident integrated-service--community legacy-app" data-theme="light">
      <header className="community-report-header">
        <div className="community-report-header-inner">
          <nav className="community-report-breadcrumb" aria-label="Breadcrumb"><Link href="/app"><ArrowLeft size={15} aria-hidden="true" />Home</Link><span aria-hidden="true">/</span><span aria-current="page">Community reports</span></nav>
          <div className="community-report-header-content">
            <div><h1>Community reports.</h1><p>Report a tree concern and follow its care timeline.</p></div>
            <div className="community-report-header-note"><ShieldCheck size={23} strokeWidth={1.4} aria-hidden="true" /><p>From the first observation to field work.<span>View the status and supporting evidence available for each report.</span></p></div>
          </div>
        </div>
      </header>
      <div className="integrated-service-inner">
        <MainPrototypeNotice home="/app" integrated />
        <div className="integrated-service-content">{children}</div>
      </div>
    </div>;
  }
  return <div className={`integrated-service integrated-service--${role} legacy-app`} data-theme="dark">
    <div className="integrated-service-inner">
      {heading && <header className="integrated-service-heading"><h1>{heading[0]}</h1><p>{heading[1]}</p></header>}
      <MainPrototypeNotice home={role === "resident" ? "/app" : "/contractor"} integrated />
      <div className="integrated-service-content">{children}</div>
    </div>
  </div>;
}

/** Resident routes already inherit ResidentShell. Contractor tasks use exactly
 * the same header as FieldWorkspace, without the old cross-role bottom bar. */
export function ServiceWorkspace({ children, role }: { children: ReactNode; role: "resident" | "contractor" }) {
  if (role === "resident") return <ServiceContent role={role}>{children}</ServiceContent>;
  return <div className="field-shell" data-theme="light">
    <a className="skip-link" href="#field-content">Skip to field workspace</a>
    <FieldHeader />
    <main id="field-content"><SectionNavigation area="tasks" /><ServiceContent role={role}>{children}</ServiceContent></main>
  </div>;
}
