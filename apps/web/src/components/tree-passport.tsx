"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, Fingerprint, X } from "lucide-react";

// No tree-record endpoint is connected. These are presentation values, not records.
export const demoTreeIdentity = {
  id: "DEMO-TREE-001",
  health: "Not assessed",
  verification: "Not verified",
};

export function TreePassport({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <dialog ref={dialogRef} className="tree-passport" id="tree-passport" aria-labelledby="passport-title" aria-describedby="passport-description" onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <header className="passport-header"><Fingerprint size={25} strokeWidth={1.3} aria-hidden="true" /><span className="identity-demo">Demo</span><button type="button" className="passport-close" onClick={onClose} aria-label="Close tree passport"><X size={20} aria-hidden="true" /></button></header>
      <h2 id="passport-title">Tree Passport</h2>
      <p id="passport-description">One identity. A place for its story to grow.</p>
      <dl className="passport-record">
        <div><dt>Tree ID</dt><dd>{demoTreeIdentity.id}</dd></div>
        <div><dt>Health status</dt><dd>{demoTreeIdentity.health}</dd></div>
        <div><dt>Species & location</dt><dd>No record connected</dd></div>
        <div><dt>Maintenance history</dt><dd>No record connected</dd></div>
        <div><dt>Verification status</dt><dd>{demoTreeIdentity.verification}</dd></div>
      </dl>
      <p className="passport-note">Illustrative identity only. No health assessment, maintenance evidence, or blockchain transaction is attached to this tree.</p>
      <Link href="/admin/map" className="button button--primary">Explore the GIS workspace <ArrowUpRight size={16} aria-hidden="true" /></Link>
      <p className="passport-map-note">Opens the existing map workspace, not a location for this demo tree.</p>
    </dialog>
  );
}
