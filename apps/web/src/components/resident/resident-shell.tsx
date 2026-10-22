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
  const reportsPage = pathname === "/app/reports";
  // Reuse the current editor rather than implement Phase 4's reporting workflow.
  const openReport = useCallback(() => {
    setSaved(false);
    const existing = reportsPage ? content.current?.querySelector<HTMLButtonElement>(".workspace--resident .draft-action > button") : null;
    (existing ?? (!reportsPage ? trigger.current?.querySelector<HTMLButtonElement>("button") : null))?.click();
  }, [reportsPage]);
  const save = (draft: LocalDraft) => {
    if (!local.save(draft)) return false;
    // The existing hook listens for storage changes. Keep any retained report view in sync.
    window.dispatchEvent(new StorageEvent("storage", { key: "treeledger.local-report-drafts.v1" }));
    setSaved(true);
    return true;
  };

  // These imported service routes retain main's own shell and workflows.
  // Do not nest a second fixed navigation bar around them.
  if (["/app/explore", "/app/hazards", "/app/maintenance"].includes(pathname)) return children;

  return <ReportEditorContext.Provider value={openReport}><div className="resident-shell" data-theme="light">
    <a className="skip-link" href="#resident-content">Skip to resident content</a>
    <header className="resident-header"><div className="resident-header-inner">
      <Link href="/app" className="resident-brand"><Leaf size={25} strokeWidth={1.4} aria-hidden="true" /><span>TreeLedger<small>Nature Explorer</small></span></Link>
      <nav className="resident-navigation" aria-label="Resident navigation">
        <Link href="/app" aria-current={pathname === "/app" || pathname === "/app/trees" ? "page" : undefined}><House size={20} strokeWidth={1.5} aria-hidden="true" /><span>Home</span></Link>
        <Link href="/app/map" aria-current={pathname === "/app/map" ? "page" : undefined}><Compass size={20} strokeWidth={1.5} aria-hidden="true" /><span>Explore</span></Link>
        <div ref={trigger} className="resident-report-trigger"><PenLine className="resident-report-icon" size={20} strokeWidth={1.5} aria-hidden="true" />{reportsPage ? <button type="button" className="button button--primary" onClick={openReport}>Write a report</button> : <DraftDialog kind="report" onSave={save} storageError={local.storageError} />}</div>
        <Link href="/app/reports" aria-current={reportsPage ? "page" : undefined}><ClipboardList size={20} strokeWidth={1.5} aria-hidden="true" /><span>My reports</span></Link>
      </nav>
      <div className="resident-header-actions"><Link href="/app/profile" className="resident-passport-link" title="Tree Passport" aria-label="Tree Passport" aria-current={pathname === "/app/profile" ? "page" : undefined}><Fingerprint size={20} strokeWidth={1.5} aria-hidden="true" /></Link><label className="resident-preview-switch"><span className="resident-sr-only">Choose workspace preview</span><select value="resident" aria-label="Choose workspace preview" onChange={event => router.push(workspaceConfig[event.target.value as WorkspaceRole].base)}><option value="resident">Resident</option><option value="admin">Admin</option><option value="contractor">Contractor</option></select><ChevronDown size={12} aria-hidden="true" /></label></div>
    </div></header>
    <div ref={content} className="resident-content" id="resident-content" tabIndex={-1}>{children}</div>
    <footer className="resident-footer"><span><Leaf size={15} aria-hidden="true" />Discover. Connect. Protect.</span><span>Resident workspace preview</span><Link href="/">The TreeLedger story</Link></footer>
    {saved && <div className="resident-saved-notice"><div role="status"><strong>Draft saved on this device.</strong><p>Not submitted. Photo previews are not saved.</p><Link href="/app/reports">View my drafts</Link></div><button type="button" aria-label="Dismiss draft confirmation" onClick={() => setSaved(false)}><X size={17} aria-hidden="true" /></button></div>}
  </div></ReportEditorContext.Provider>;
}
