"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarDays, Fingerprint, MapPin, TreePine, X } from "lucide-react";
import { StatusBadge } from "../ui/status-badge";
import { fieldPhoto, taskDue, taskOverdue, taskStatusLabels, type FieldTask } from "./field-data";

export function FieldDue({ task }: { task: FieldTask }) {
  const due = taskDue(task);
  return due === undefined ? <>Due date unavailable</> : <time dateTime={task.dueAt}>{new Intl.DateTimeFormat("en-MY",{ dateStyle: "medium", timeZone: "Asia/Kuala_Lumpur" }).format(due)}</time>;
}

function TaskPhoto({ task }: { task: FieldTask }) {
  const [failed, setFailed] = useState<string | null>(null);
  const photo = fieldPhoto(task.photoUrl);
  return <div className="field-task-photo">{photo && photo !== failed ? <Image src={photo} alt={`Photo supplied for ${task.treeId ?? task.id}`} fill sizes="110px" unoptimized onError={() => setFailed(photo)} /> : <><TreePine size={35} strokeWidth={1.2} aria-hidden="true" /><span>No photo supplied</span></>}</div>;
}

export function FieldTaskCards({ tasks, selected, onSelect, now }: { tasks: readonly FieldTask[]; selected?: FieldTask; onSelect: (task: FieldTask) => void; now: number | null }) {
  return <div className="field-task-list">{tasks.map(task => <article key={task.id} className={`field-task-card${selected?.id === task.id ? " is-selected" : ""}`}>
    <TaskPhoto task={task} />
    <div className="field-task-copy"><div className="field-task-badges">{task.priority && <StatusBadge tone={task.priority === "high" ? "critical" : task.priority === "medium" ? "warning" : "healthy"}>{task.priority} priority</StatusBadge>}<StatusBadge>{task.status ? taskStatusLabels[task.status] : "Status unavailable"}</StatusBadge>{now !== null && taskOverdue(task,now) && <StatusBadge tone="critical">Overdue</StatusBadge>}</div><h3>{task.title}</h3><p className="field-task-identity">{task.treeId ?? "Tree ID unavailable"}{task.species ? ` / ${task.species}` : ""}</p><div className="field-task-meta"><span><MapPin size={14} aria-hidden="true" />{task.location ?? "Location not provided"}</span><span><CalendarDays size={14} aria-hidden="true" /><FieldDue task={task} /></span></div></div>
    <button type="button" className="field-open-task" onClick={() => onSelect(task)}>Open task <ArrowRight size={16} aria-hidden="true" /></button>
  </article>)}</div>;
}

export function FieldTaskDetails({ task, open, onClose, onEvidence }: { task: FieldTask | undefined; open: boolean; onClose: () => void; onEvidence: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (open && task) dialog.current?.showModal(); else dialog.current?.close(); }, [open,task]);
  return <dialog ref={dialog} className="field-task-dialog" aria-labelledby="field-task-detail-title" onClose={onClose} onCancel={onClose}>
    <div className="field-detail-heading"><Fingerprint size={25} strokeWidth={1.3} aria-hidden="true" /><span>Task & tree identity</span><button type="button" aria-label="Close task details" onClick={onClose}><X size={20} aria-hidden="true" /></button></div>
    <h2 id="field-task-detail-title">{task?.title ?? "Assignment details"}</h2>
    {task && <><dl>{[["Task reference",task.id],["Tree ID",task.treeId],["Tree name",task.treeName],["Species",task.species],["Location",task.location],["Priority",task.priority],["Status",task.status ? taskStatusLabels[task.status] : undefined]].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value ?? "Not provided"}</dd></div>)}<div><dt>Due date</dt><dd><FieldDue task={task} /></dd></div></dl>{task.notes && <p className="field-task-notes">{task.notes}</p>}<p className="field-honest-note">Available assignment details only. No completion or blockchain verification is inferred from this panel.</p><button type="button" className="button button--primary" onClick={onEvidence}>Prepare evidence notes <ArrowRight size={16} aria-hidden="true" /></button></>}
  </dialog>;
}
