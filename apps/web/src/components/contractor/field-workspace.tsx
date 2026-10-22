"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Camera, CalendarDays, CheckCheck, ClipboardList, FilePenLine, Fingerprint, HardHat, MapPin, Navigation as NavigationIcon, Search, ShieldCheck, SlidersHorizontal, TreePine, Wrench } from "lucide-react";
import { FieldHeader } from "./field-header";
import { SectionNavigation } from "../workspaces/section-navigation";
import { Button } from "../ui/button";
import { StatusBadge } from "../ui/status-badge";
import { DraftDialog } from "../workspaces/draft-dialog";
import { useLocalDrafts } from "../workspaces/local-drafts";
import { MainServicesLinks } from "../main-services";
import { assignedFieldTasks, fieldCoordinates, fieldSummary, filterFieldTasks, taskStatusLabels, type FieldFilter, type FieldTask } from "./field-data";
import { FieldMap } from "./field-map";
import { FieldTaskCards, FieldTaskDetails } from "./field-tasks";
import "../workspaces/workspace.css";
import "./field-workspace.css";

const tabs: [FieldFilter,string][] = [["all","All tasks"],["attention","Needs attention"],["upcoming","Upcoming"],["overdue","Overdue"],["completed","Completed"]];

export function FieldWorkspace({ view = "tasks", tasks = assignedFieldTasks }: { view?: "tasks" | "map" | "history"; tasks?: readonly FieldTask[] | null }) {
  const local = useLocalDrafts("evidence");
  const editor = useRef<HTMLDivElement>(null);
  const results = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FieldFilter>("all");
  const [status, setStatus] = useState("all");
  const [draftPriority, setDraftPriority] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(view === "map");
  const selected = tasks?.find(task => task.id === selectedId);
  const filtered = tasks === null ? null : filterFieldTasks(tasks,query,filter,status,now ?? 0);
  const summary = fieldSummary(tasks,now);
  const history = view === "history";
  const drafts = local.drafts.filter(draft => (draftPriority === "all" || draft.severity === draftPriority) && [draft.reference,draft.location,draft.description].join(" ").toLocaleLowerCase().includes(query.toLocaleLowerCase()));

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const first = setTimeout(refresh,0);
    const interval = setInterval(refresh,60000);
    return () => { clearTimeout(first); clearInterval(interval); };
  }, []);
  const selectTask = useCallback((task: FieldTask | undefined) => setSelectedId(task?.id ?? null),[]);
  const openDetails = (task: FieldTask) => { setSelectedId(task.id); setDetailsOpen(true); };
  const showList = () => { results.current?.focus({ preventScroll: true }); results.current?.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); };
  const openEvidence = (photo = false) => {
    document.querySelector<HTMLDialogElement>(".field-task-dialog[open]")?.close();
    setDetailsOpen(false);
    editor.current?.querySelector<HTMLButtonElement>(".field-draft-editor>.button")?.click();
    const dialog = editor.current?.querySelector<HTMLDialogElement>("dialog");
    if (dialog && selected) {
      const reference = dialog.querySelector<HTMLInputElement>('input[name="reference"]');
      const location = dialog.querySelector<HTMLInputElement>('input[name="location"]');
      if (reference) reference.value = selected.id;
      if (location) location.value = selected.location ?? "";
    }
    if (photo) dialog?.querySelector<HTMLInputElement>('input[type="file"]')?.click();
  };
  const navigateToTask = selected && fieldCoordinates(selected) ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${selected.latitude},${selected.longitude}`)}` : null;

  return <div className="field-shell" data-theme="light">
    <a className="skip-link" href="#field-content">Skip to field workspace</a>
    <FieldHeader />
    <main id="field-content">
      {view === "tasks" && <SectionNavigation area="tasks" />}
      <section className="field-hero" aria-labelledby="field-title"><div className="field-hero-inner"><div className="field-intro"><p className="field-eyebrow"><Wrench size={16} strokeWidth={1.5} aria-hidden="true" />Maintenance in the field</p><h1 id="field-title">{history ? <>A clearer record.<br />Ready for the field.</> : <>Ready for the<br />next assignment.</>}</h1><p>Clear assignments, practical field notes, and evidence that stays with the work.</p><div className="field-hero-actions"><Button type="button" onClick={() => openEvidence()} variant="primary">Prepare evidence notes <ArrowRight size={17} aria-hidden="true" /></Button><Link href="/contractor/tasks">View work orders <ArrowUpRight size={15} aria-hidden="true" /></Link></div><p className="field-data-disclosure"><span />{tasks === null ? "Assignment service not connected" : "Available assignment records"}<small>Workspace preview · not an authenticated crew assignment</small></p></div><div className={`field-map-region${mapExpanded ? " is-expanded" : ""}`} id="field-assignment-map"><FieldMap tasks={filtered} selected={selected} onSelect={selectTask} onOpen={() => setDetailsOpen(true)} onList={showList} now={now} /></div><div className="field-stats">{[{ label: "Assigned tasks",value: summary.assigned,icon: ClipboardList,note: "Open assignments" },{ label: "Due this week",value: summary.due,icon: CalendarDays,note: "Next seven days" },{ label: "Trees in care",value: summary.trees,icon: TreePine,note: "Distinct tree identities" },{ label: "Completed tasks",value: summary.completed,icon: CheckCheck,note: "Recorded as completed" }].map(({label,value,icon: Icon,note}) => <div key={label}><Icon size={27} strokeWidth={1.5} aria-hidden="true" /><div><span>{label}</span><strong aria-label={`${label}: ${value === null ? "unavailable" : value}`}>{value === null ? "—" : value}</strong><small>{value === null ? "Unavailable, not zero" : note}</small></div></div>)}</div><div className="field-mobile-view" role="group" aria-label="Mobile assignment view"><button type="button" aria-pressed={!mapExpanded} onClick={() => { setMapExpanded(false); showList(); }}>List</button><button type="button" aria-pressed={mapExpanded} aria-expanded={mapExpanded} aria-controls="field-assignment-map" onClick={() => setMapExpanded(true)}>Map</button></div></div></section>
      <div className="field-content-grid"><div className="field-work-column">
        <div className="field-filter-bar">{!history ? <div className="field-filter-tabs" role="group" aria-label="Filter assignments">{tabs.map(([value,label]) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div> : <span className="field-draft-label"><FilePenLine size={17} aria-hidden="true" />Evidence on this device</span>}<label className="field-search"><Search size={17} aria-hidden="true" /><span className="field-sr-only">{history ? "Search local evidence drafts" : "Search by tree, reference, or location"}</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={history ? "Search local evidence drafts" : "Tree, reference, or location"} /></label>{!history && <button type="button" className="field-advanced-toggle" aria-label="More task status filters" aria-expanded={advanced} aria-controls="field-advanced-filters" onClick={() => setAdvanced(!advanced)}><SlidersHorizontal size={18} aria-hidden="true" /></button>}</div>
        {advanced && !history && <div className="field-advanced" id="field-advanced-filters"><label>Task status<select value={status} onChange={event => setStatus(event.target.value)}><option value="all">All task statuses</option>{Object.entries(taskStatusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>}
        {history && <label className="field-draft-priority">Draft priority<select aria-label="Filter local drafts by priority" value={draftPriority} onChange={event => setDraftPriority(event.target.value)}><option value="all">All priorities</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>}
        <div className="field-section-heading"><div><h2>{history ? "Your evidence drafts" : "Your assigned work"}</h2><p>{history ? "Field notes stay local until the submission service is connected." : "Tree identity, priority, due date, and supporting information."}</p></div><StatusBadge>{history ? "Local only" : tasks === null ? "Not connected" : "Available records"}</StatusBadge></div>
        <div ref={results} id="field-results" className="field-results" tabIndex={-1}>
          {history ? <>{local.storageError && <p className="field-error" role="alert">{local.storageError}</p>}{local.loading ? <p role="status">Reading local evidence drafts…</p> : drafts.length ? <div className="field-draft-list">{drafts.map(draft => <article key={draft.id}><div><StatusBadge>Local draft · not submitted</StatusBadge><time dateTime={draft.createdAt}>{new Intl.DateTimeFormat("en-MY",{ dateStyle: "medium",timeZone: "Asia/Kuala_Lumpur" }).format(new Date(draft.createdAt))}</time></div><h3>{draft.reference || "Maintenance evidence note"}</h3><p>{draft.description}</p><span><MapPin size={14} aria-hidden="true" />{draft.location || "Location not provided"}</span></article>)}</div> : <div className="field-empty"><FilePenLine size={34} strokeWidth={1.3} aria-hidden="true" /><div><h3>{query || draftPriority !== "all" ? "No drafts match these filters." : "Good fieldwork starts with clear notes."}</h3><p>No matching evidence notes are saved on this device. Prepare a note and preview a photo using the evidence editor.</p><Button type="button" variant="secondary" onClick={() => openEvidence()}>Prepare evidence notes <ArrowRight size={16} aria-hidden="true" /></Button></div></div>}</> : <><p className="field-result-status" role="status">{tasks === null ? (query || filter !== "all" || status !== "all" ? "Assignments are unavailable to search or filter until the task service is connected." : "") : `${filtered?.length ?? 0} of ${tasks.length} assignments match your filters`}</p>{filtered?.length ? <FieldTaskCards tasks={filtered} selected={selected} onSelect={openDetails} now={now} /> : <div className="field-empty"><HardHat size={38} strokeWidth={1.2} aria-hidden="true" /><div><h3>{tasks === null ? "Your next assignment starts here." : tasks.length ? "No tasks match these filters." : "No work assigned right now."}</h3><p>{tasks === null ? "The assignment service is not connected. Tree locations, priorities and due dates cannot be loaded. No task has been marked complete." : tasks.length ? "Try a different reference, location, or task filter." : "The connected task list is empty. New assignments will appear here."}</p><Link href="/contractor/tasks">View work orders <ArrowUpRight size={15} aria-hidden="true" /></Link><span className="field-service-note">Integrated work orders · sample fallbacks are disclosed</span></div></div>}</>}
          {(query || filter !== "all" || status !== "all" || draftPriority !== "all") && <button type="button" className="field-reset" onClick={() => { setQuery(""); setFilter("all"); setStatus("all"); setDraftPriority("all"); }}>Clear search & filters</button>}
        </div>
        <div className="field-workflow" aria-label="Field evidence workflow">{["Open task","Find the tree","Record the work","Prepare evidence"].map((label,index) => <div key={label}><span>{String(index + 1).padStart(2,"0")}</span><p>{label}</p></div>)}</div>
        <details className="field-services"><summary>Connection details & township services</summary><p>This workspace does not have a connected assignment service. The Work orders section uses the existing API integrations and disclosed sample fallbacks. Drafts are stored on this browser only; photos are previews, not uploads, and saving notes does not complete or verify a task.</p><MainServicesLinks /></details>
      </div><aside className="field-evidence-column"><section className="field-evidence-panel" aria-labelledby="field-evidence-title"><span className="field-evidence-icon"><Camera size={27} strokeWidth={1.5} aria-hidden="true" /></span><h2 id="field-evidence-title">Complete your work<br />with evidence.</h2><p>Prepare photos and field notes, and keep a clear record of the tree you maintain.</p><div ref={editor}><div className="field-draft-editor"><DraftDialog kind="evidence" onSave={local.save} storageError={local.storageError} /></div></div><Link className="field-evidence-history" href="/contractor/history"><FilePenLine size={18} aria-hidden="true" /><span>My evidence drafts<small>Review notes saved on this device</small></span><ArrowRight size={17} aria-hidden="true" /></Link><p className="field-honest-note">Local drafts only. Photos are not saved or uploaded. Submission, completion and verification are not connected here.</p></section><section className="field-quick-actions" aria-labelledby="field-quick-title"><h2 id="field-quick-title">Field tools</h2><div><button type="button" onClick={() => openEvidence(true)}><Camera size={21} strokeWidth={1.5} aria-hidden="true" /><span>Take a photo</span></button><button type="button" disabled={!selected?.treeId} aria-describedby="field-selection-help" onClick={() => setDetailsOpen(true)}><Fingerprint size={21} strokeWidth={1.5} aria-hidden="true" /><span>View tree details</span></button>{navigateToTask ? <a href={navigateToTask} target="_blank" rel="noopener noreferrer"><NavigationIcon size={21} strokeWidth={1.5} aria-hidden="true" /><span>Navigate <ArrowUpRight size={12} aria-hidden="true" /></span></a> : <button type="button" disabled aria-describedby="field-selection-help"><NavigationIcon size={21} strokeWidth={1.5} aria-hidden="true" /><span>Navigate</span></button>}<button type="button" onClick={() => openEvidence()}><FilePenLine size={21} strokeWidth={1.5} aria-hidden="true" /><span>Add a field note</span></button></div><p id="field-selection-help">{selected ? "Navigation needs valid task coordinates. Evidence photos remain previews only." : "Select a connected task to view its tree or navigate to its location."}</p></section></aside></div>
    </main><footer className="field-footer"><span><ShieldCheck size={15} aria-hidden="true" />TreeLedger / Field Operations</span><span>Workspace preview · no live assignment claims</span><Link href="/">The TreeLedger story <ArrowUpRight size={13} aria-hidden="true" /></Link></footer>
    <FieldTaskDetails task={selected} open={detailsOpen} onClose={() => setDetailsOpen(false)} onEvidence={() => openEvidence()} />
  </div>;
}
