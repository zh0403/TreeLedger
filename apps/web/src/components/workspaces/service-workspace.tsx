"use client";

import type { ReactNode } from "react";
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
