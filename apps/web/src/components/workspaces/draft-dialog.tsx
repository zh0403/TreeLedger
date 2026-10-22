"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Camera, X } from "lucide-react";
import type { LocalDraft } from "./local-drafts";
import { Button } from "../ui/button";

export function DraftDialog({ kind, onSave, storageError }: { kind: "report" | "evidence"; onSave: (draft: LocalDraft) => boolean; storageError: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [fileError, setFileError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [inputError, setInputError] = useState("");
  const evidence = kind === "evidence";

  useEffect(() => {
    if (!file) return;
    let active = true;
    const url = URL.createObjectURL(file);
    queueMicrotask(() => { if (active) setPreview(url); });
    return () => { active = false; URL.revokeObjectURL(url); };
  }, [file]);

  const close = () => { dialog.current?.close(); setFile(null); setPreview(""); setFileError(""); };
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (fileError) return;
    const data = new FormData(event.currentTarget);
    const description = String(data.get("description") || "").trim();
    if (!description) { setInputError("Describe the concern or maintenance work before saving."); form.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus(); return; }
    setInputError("");
    const draft: LocalDraft = { id: crypto.randomUUID(), reference: String(data.get("reference") || "").trim(), location: String(data.get("location") || "").trim(), severity: String(data.get("severity") || "low") as LocalDraft["severity"], description, createdAt: new Date().toISOString() };
    if (onSave(draft)) { close(); form.current?.reset(); setFeedback("Draft saved on this device. It has not been submitted. Photos are previews only and are not saved."); }
  };

  return <><Button type="button" variant="primary" onClick={() => { setFeedback(""); setInputError(""); dialog.current?.showModal(); }}>{evidence ? "Prepare evidence" : "Write a report"}</Button><p className="draft-feedback" role="status">{feedback}</p><dialog ref={dialog} className="workspace-dialog" aria-labelledby={`draft-title-${kind}`} onCancel={close} onClose={() => { setFile(null); setPreview(""); }}><div className="dialog-heading"><div><p className="workspace-label">Local draft</p><h2 id={`draft-title-${kind}`}>{evidence ? "Prepare maintenance evidence" : "Report a tree concern"}</h2></div><button type="button" className="icon-button" onClick={close} aria-label="Close draft editor"><X size={20} aria-hidden="true" /></button></div><p className="dialog-notice">Saved only in this browser. {evidence ? "Evidence cannot be uploaded or verified" : "Reports cannot be submitted"} until the service is connected. Avoid personal or sensitive information.</p><form ref={form} onSubmit={save}><label>{evidence ? "Task or tree reference" : "Tree ID, if known"}<input name="reference" maxLength={100} autoComplete="off" placeholder={evidence ? "Reference from your assigned task" : "Optional tree reference"} /></label><label>Location<input name="location" maxLength={250} placeholder="Street, park, or nearby landmark" autoComplete="off" /></label>{!evidence && <label>How urgent is the concern?<select name="severity" defaultValue="low"><option value="low">Low — routine concern</option><option value="medium">Medium — needs attention</option><option value="high">High — potential hazard</option></select></label>}<label>{evidence ? "Work completed or observations" : "What did you notice?"}<textarea name="description" aria-invalid={!!inputError} aria-describedby={`draft-error-${kind}`} onChange={() => setInputError("")} rows={4} required maxLength={3000} placeholder={evidence ? "Describe the maintenance work and supporting evidence." : "Describe the condition and what needs attention."} /></label><label className="photo-label"><Camera size={18} aria-hidden="true" />Preview a photo<input type="file" aria-invalid={!!fileError} aria-describedby={`photo-help-${kind} draft-error-${kind}`} accept="image/jpeg,image/png,image/webp" onChange={(event) => { const selected = event.target.files?.[0]; setFileError(""); setFile(null); setPreview(""); if (!selected) return; if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type) || selected.size > 10 * 1024 * 1024) { setFileError("Choose a JPEG, PNG, or WebP image smaller than 10 MB."); event.target.value = ""; return; } setFile(selected); }} /></label><p id={`photo-help-${kind}`} className="field-help">Photos stay in the preview and are not uploaded or stored with the draft.</p>{file && preview && <Image className="evidence-preview" src={preview} alt="Selected evidence photo preview" width={440} height={260} unoptimized />}{(inputError || fileError || storageError) && <p id={`draft-error-${kind}`} className="field-error" role="alert">{inputError || fileError || storageError}</p>}<div className="dialog-actions"><Button type="button" variant="secondary" onClick={close}>Cancel</Button><Button type="submit" variant="primary">Save local draft</Button></div></form></dialog></>;
}
