"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ClipboardList, Compass, Fingerprint, House, Leaf, PenLine, X } from "lucide-react";
import { DraftDialog } from "../workspaces/draft-dialog";
import { useLocalDrafts, type LocalDraft } from "../workspaces/local-drafts";
import { workspaceConfig, type WorkspaceRole } from "../workspaces/config";
import "../workspaces/workspace.css";
import "./resident.css";
import "./resident-explorer.css";
import "./resident-pages.css";
import { Brand } from "../ui/brand";
import { Navigation, NavigationLink } from "../ui/navigation";
import { SectionNavigation } from "../workspaces/section-navigation";

const ReportEditorContext = createContext<(() => void) | null>(null);

export function useResidentReportEditor() {
  const open = useContext(ReportEditorContext);
  if (!open) throw new Error("The resident report shortcut requires ResidentShell.");
  return open;
}

export function ResidentShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const trigger = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const local = useLocalDrafts("report");
  const [saved, setSaved] = useState(false);
  const reportsPage = pathname === "/app/reports" || pathname === "/app/hazards";
  const explorePage = ["/app/map", "/app/explore", "/app/maintenance"].includes(pathname);
  // Keep the existing Home shortcuts working while navigation opens the guided page.
  const openReport = useCallback(() => {
    setSaved(false);
    trigger.current?.querySelector<HTMLButtonElement>("button")?.click();
  }, []);
  const save = (draft: LocalDraft) => {
    if (!local.save(draft)) return false;
    // The existing hook listens for storage changes. Keep any retained report view in sync.
    window.dispatchEvent(new StorageEvent("storage", { key: "treeledger.local-report-drafts.v1" }));
    setSaved(true);
    return true;
  };

  return <ReportEditorContext.Provider value={openReport}><div className="resident-shell resident-shell--explorer" data-theme="light">
    <a className="skip-link" href="#resident-content">Skip to resident content</a>
    <header className="resident-header"><div className="resident-header-inner">
      <Brand href="/app" className="resident-brand" subtitle="Nature Explorer" />
      <Navigation className="resident-navigation" label="Resident navigation">
        <NavigationLink href="/app" aria-current={pathname === "/app" || pathname === "/app/trees" ? "page" : undefined}><House size={20} strokeWidth={1.5} aria-hidden="true" /><span>Home</span></NavigationLink>
        <NavigationLink href="/app/map" aria-current={explorePage ? "page" : undefined}><Compass size={20} strokeWidth={1.5} aria-hidden="true" /><span>Explore</span></NavigationLink>
        <NavigationLink href="/app/report" aria-current={pathname === "/app/report" ? "page" : undefined}><PenLine size={20} strokeWidth={1.5} aria-hidden="true" /><span>Write a report</span></NavigationLink>
        <NavigationLink href="/app/reports" aria-current={reportsPage ? "page" : undefined}><ClipboardList size={20} strokeWidth={1.5} aria-hidden="true" /><span>My reports</span></NavigationLink>
      </Navigation>
      <div className="resident-header-actions"><Link href="/app/profile" className="resident-passport-link" title="Tree Passport" aria-label="Tree Passport" aria-current={pathname === "/app/profile" ? "page" : undefined}><Fingerprint size={20} strokeWidth={1.5} aria-hidden="true" /></Link><label className="resident-preview-switch"><span className="resident-sr-only">Choose workspace preview</span><select value="resident" aria-label="Choose workspace preview" onChange={event => router.push(workspaceConfig[event.target.value as WorkspaceRole].base)}><option value="resident">Resident</option><option value="admin">Admin</option><option value="contractor">Contractor</option></select><ChevronDown size={12} aria-hidden="true" /></label></div>
    </div></header>
    <div ref={trigger} className="resident-legacy-editor"><DraftDialog kind="report" onSave={save} storageError={local.storageError} /></div>
    <div ref={content} className="resident-content" id="resident-content" tabIndex={-1}><SectionNavigation />{children}</div>
    <footer className="resident-footer"><span><Leaf size={15} aria-hidden="true" />Discover. Connect. Protect.</span><span>Resident workspace preview</span><Link href="/">The TreeLedger story</Link></footer>
    {saved && <div className="resident-saved-notice"><div role="status"><strong>Draft saved on this device.</strong><p>Not submitted. Photo previews are not saved.</p><Link href="/app/reports">View my drafts</Link></div><button type="button" aria-label="Dismiss draft confirmation" onClick={() => setSaved(false)}><X size={17} aria-hidden="true" /></button></div>}
  </div></ReportEditorContext.Provider>;
}
