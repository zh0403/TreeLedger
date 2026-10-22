"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ClipboardList, FilePenLine, HardHat, MapPin } from "lucide-react";
import { Brand } from "../ui/brand";
import { Navigation, NavigationLink } from "../ui/navigation";

/** The same field navigation surrounds both the overview and API work orders. */
export function FieldHeader() {
  const pathname = usePathname();
  const router = useRouter();
  return <header className="field-header"><div>
    <Brand href="/contractor" subtitle="Field Workspace" />
    <Navigation label="Field workspace navigation" className="field-navigation">
      <NavigationLink href="/contractor/tasks" active={pathname === "/contractor" || pathname === "/contractor/tasks"}><ClipboardList size={19} aria-hidden="true" /><span>Assigned tasks</span></NavigationLink>
      <NavigationLink href="/contractor/map" active={pathname === "/contractor/map"}><MapPin size={19} aria-hidden="true" /><span>Tree locations</span></NavigationLink>
      <NavigationLink href="/contractor/history" active={pathname === "/contractor/history"}><FilePenLine size={19} aria-hidden="true" /><span>Evidence drafts</span></NavigationLink>
    </Navigation>
    <label className="field-role"><HardHat size={20} strokeWidth={1.5} aria-hidden="true" /><span className="field-sr-only">Choose workspace preview</span><select aria-label="Choose workspace preview" value="contractor" onChange={event => router.push(event.target.value === "resident" ? "/app" : event.target.value === "admin" ? "/admin" : "/contractor")}><option value="contractor">Contractor</option><option value="resident">Resident</option><option value="admin">Admin</option></select><ChevronDown size={13} aria-hidden="true" /></label>
  </div></header>;
}
