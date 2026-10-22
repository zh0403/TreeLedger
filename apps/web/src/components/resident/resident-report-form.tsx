"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Camera, Check, ClipboardList, Leaf, MapPin, ShieldCheck, X } from "lucide-react";
import { Button } from "../ui/button";
import { useLocalDrafts, type LocalDraft } from "../workspaces/local-drafts";

const stages = ["Tree & place","What happened","Photo evidence","Review & save"];
const urgency = { low: "Low — routine concern", medium: "Medium — needs attention", high: "High — potential hazard" };

export function ResidentReportForm({ initialReference = "", initialLocation = "" }: { initialReference?: string; initialLocation?: string }) {
  const local = useLocalDrafts("report");
  const form = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [reference, setReference] = useState(initialReference);
  const [location, setLocation] = useState(initialLocation);
  const [severity, setSeverity] = useState<LocalDraft["severity"]>("low");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [fileError, setFileError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [saved, setSaved] = useState<LocalDraft | null>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    let active = true;
    queueMicrotask(() => { if (active) setPreview(url); });
    return () => { active = false; URL.revokeObjectURL(url); };
  }, [file]);
  const move = (next: number) => { setStep(next); requestAnimationFrame(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: "start",behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); }); };
  const next = () => {
    if (step === 1 && !description.trim()) { setDescriptionError("Tell us what you noticed before continuing."); form.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus(); return; }
    if (step === 2 && fileError) { fileInput.current?.focus(); return; }
    move(Math.min(3,step + 1));
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (step < 3) { next(); return; }
    if (!description.trim() || fileError) return;
    const draft: LocalDraft = { id: crypto.randomUUID(),reference: reference.trim(),location: location.trim(),severity,description: description.trim(),createdAt: new Date().toISOString() };
    if (local.save(draft)) { setSaved(draft); setFile(null); setPreview(""); window.dispatchEvent(new StorageEvent("storage",{ key: "treeledger.local-report-drafts.v1" })); requestAnimationFrame(() => heading.current?.focus()); }
  };
  const removePhoto = () => { setFile(null); setPreview(""); setFileError(""); if (fileInput.current) fileInput.current.value = ""; };

  return <main className="nature-page nature-report-page">
    <header className="nature-page-intro"><div><p><Leaf size={16} aria-hidden="true" />A little care goes a long way</p><h1>Help keep your<br />neighbourhood green.</h1><span>Spotted a damaged or unhealthy tree? Tell us what happened.</span></div><div className="nature-intro-symbol" aria-hidden="true"><Leaf size={92} strokeWidth={.7} /></div></header>
    <div className="nature-form-layout">
      <section className="nature-guided-report" aria-labelledby="nature-stage-title">
        {saved ? <div className="nature-report-success"><span><Check size={28} aria-hidden="true" /></span><h2 ref={heading} id="nature-stage-title" tabIndex={-1}>Your draft is saved.</h2><p role="status">Saved on this device only. It has not been submitted, and the photo preview was not saved.</p><p className="nature-local-reference">Local reference · {saved.id.slice(0,8)}</p><div><Link className="resident-button resident-button--primary" href="/app/reports">View my reports & drafts <ArrowRight size={17} aria-hidden="true" /></Link><Button type="button" variant="secondary" onClick={() => { setSaved(null); setReference(""); setLocation(""); setDescription(""); setSeverity("low"); setDescriptionError(""); move(0); }}>Start another draft</Button></div></div> : <>
          <ol className="nature-form-progress" aria-label="Report preparation progress">{stages.map((label,index) => <li key={label} aria-current={step === index ? "step" : undefined} className={index < step ? "is-done" : ""}><span>{index < step ? <Check size={15} aria-hidden="true" /> : index + 1}</span><p>{label}</p></li>)}</ol>
          <form ref={form} noValidate onSubmit={submit}>
            <div className="nature-stage-heading"><p>Step {step + 1} of 4</p><h2 ref={heading} id="nature-stage-title" tabIndex={-1}>{["Where did you notice it?","Tell us what happened.","A photo can help tell the story.","A quick look before you save."][step]}</h2></div>
            <section className="nature-form-stage" hidden={step !== 0} aria-label="Tree or location"><p>Use a tree ID if you know it, or describe the place. Both are optional.</p><label>Tree ID, if known<input name="reference" autoComplete="off" value={reference} maxLength={100} onChange={event => setReference(event.target.value)} placeholder="Optional tree reference" /></label><label>Where is the tree?<input name="location" autoComplete="off" value={location} maxLength={250} onChange={event => setLocation(event.target.value)} placeholder="Street, park, or nearby landmark" /></label><p className="nature-field-help"><MapPin size={15} aria-hidden="true" />Type a location description. Map-based location selection is not connected.</p><Link href="/app/map" className="resident-text-link">Explore tree locations <ArrowRight size={15} aria-hidden="true" /></Link></section>
            <section className="nature-form-stage" hidden={step !== 1} aria-label="Issue description"><p>Tell us what you can see. Keep clear of damaged branches and immediate hazards.</p><label>How urgent is the concern?<select name="severity" value={severity} onChange={event => setSeverity(event.target.value as LocalDraft["severity"])}>{Object.entries(urgency).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>What did you notice? <span className="nature-required">Required</span><textarea name="description" rows={6} required maxLength={3000} value={description} aria-invalid={!!descriptionError} aria-describedby="nature-description-error" onChange={event => { setDescription(event.target.value); if (event.target.value.trim()) setDescriptionError(""); }} onBlur={() => { if (description && !description.trim()) setDescriptionError("Tell us what you noticed before continuing."); }} placeholder="For example, a broken branch above a footpath…" /></label><div className="nature-description-meta"><p id="nature-description-error" className="nature-form-error" role="alert">{descriptionError}</p><span>{description.length}/3000</span></div></section>
            <section className="nature-form-stage" hidden={step !== 2} aria-label="Photo evidence"><p>A photo is optional. Preview one here to help prepare your notes.</p><label className="nature-upload"><Camera size={31} strokeWidth={1.4} aria-hidden="true" /><strong>Choose a photo</strong><span>JPEG, PNG or WebP · up to 10 MB</span><input ref={fileInput} name="photo" type="file" accept="image/jpeg,image/png,image/webp" aria-invalid={!!fileError} aria-describedby="nature-photo-help nature-photo-error" onChange={event => { const image = event.target.files?.[0]; removePhoto(); if (!image) return; if (!["image/jpeg","image/png","image/webp"].includes(image.type) || image.size > 10 * 1024 * 1024) { setFileError("Choose a JPEG, PNG, or WebP image smaller than 10 MB."); return; } setFile(image); }} /></label><p id="nature-photo-error" className="nature-form-error" role="alert">{fileError}</p>{fileError && <button type="button" className="resident-text-link" onClick={removePhoto}>Remove invalid photo selection</button>}{file && preview && <div className="nature-photo-preview"><Image src={preview} alt="Selected tree concern photo preview" width={650} height={360} unoptimized /><div><span>{file.name}</span><button type="button" onClick={removePhoto} aria-label="Remove photo attachment"><X size={17} aria-hidden="true" />Remove</button></div></div>}<p id="nature-photo-help" className="nature-field-help">Photo previews are not uploaded or stored with local drafts. You will need to choose a photo again when submission becomes available.</p></section>
            <section className="nature-form-stage" hidden={step !== 3} aria-label="Review draft"><p>Check your note. Saving keeps it in this browser, not in the township’s report system.</p><dl className="nature-review"><div><dt>Tree reference</dt><dd>{reference.trim() || "Not provided"}</dd></div><div><dt>Location</dt><dd>{location.trim() || "Not provided"}</dd></div><div><dt>Urgency</dt><dd>{urgency[severity]}</dd></div><div><dt>Your observation</dt><dd>{description}</dd></div><div><dt>Photo</dt><dd>{file ? `${file.name} — preview only, not saved` : "No photo selected"}</dd></div><div><dt>Storage</dt><dd>Local draft · not submitted</dd></div></dl></section>
            {local.storageError && <p className="nature-form-error" role="alert">{local.storageError}</p>}
            <div className="nature-form-actions">{step > 0 ? <Button type="button" variant="secondary" onClick={() => move(step - 1)}><ArrowLeft size={16} aria-hidden="true" />Back</Button> : <Link href="/app" className="resident-text-link">Back to home</Link>}<Button type="submit" variant="primary">{step === 3 ? "Save local draft" : "Continue"}<ArrowRight size={17} aria-hidden="true" /></Button></div>
          </form>
        </>}
      </section>
      <aside className="nature-report-guide"><span><ShieldCheck size={25} strokeWidth={1.4} aria-hidden="true" /></span><h2>A clear note makes a difference.</h2><p>A useful location, a simple description, and a photo when it’s safe can help prepare a concern for review.</p><ul><li>Stay a safe distance from damaged trees.</li><li>A tree ID is helpful, but not required.</li><li>Avoid including personal information.</li></ul><div><ClipboardList size={19} aria-hidden="true" /><p><strong>Drafts stay on this device.</strong>This editor saves local drafts only. Saving does not send your note to a township team. Use Community reports for the existing reporting and photo workflow.</p></div><Link href="/app/reports" className="resident-text-link">My reports & drafts <ArrowRight size={15} aria-hidden="true" /></Link><Link href="/app/hazards" className="resident-text-link">Community reports & photo reporting <ArrowRight size={15} aria-hidden="true" /></Link></aside>
    </div>
  </main>;
}
