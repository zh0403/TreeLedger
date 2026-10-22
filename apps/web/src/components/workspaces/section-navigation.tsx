"use client";

import { usePathname } from "next/navigation";
import { Navigation, NavigationLink } from "../ui/navigation";
import "./service-workspace.css";

const sections = {
  explore: { label: "Explore sections", links: [["/app/map","Township map"],["/app/explore","Tree registry"],["/app/maintenance","Maintenance records"]] },
  reports: { label: "Report sections", links: [["/app/reports","My local drafts"],["/app/hazards","Community reports"]] },
  tasks: { label: "Assignment sections", links: [["/contractor/tasks","Work orders"],["/contractor","Workspace overview"]] },
} as const;

/** Route links, not simulated tabs: deep links and browser Back stay functional. */
export function SectionNavigation({ area }: { area?: keyof typeof sections }) {
  const pathname = usePathname();
  const section = area ? sections[area] : Object.values(sections).find(group => group.links.some(([href]) => href === pathname));
  if (!section) return null;
  return <Navigation label={section.label} className="workspace-section-navigation">
    {section.links.map(([href,label]) => <NavigationLink key={href} href={href} active={pathname === href}>{label}</NavigationLink>)}
  </Navigation>;
}
