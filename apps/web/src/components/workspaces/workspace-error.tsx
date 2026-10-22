"use client";

import Link from "next/link";

export function WorkspaceError({ reset }: { reset: () => void }) {
  return <main style={{ padding: 32, maxWidth: 650, margin: "auto" }}><h1 style={{ fontSize: 28, marginBottom: 20 }}>The workspace could not load.</h1><p style={{ marginBottom: 24 }}>Your saved local drafts remain in this browser. Try loading the workspace again.</p><button type="button" className="button button--primary" onClick={reset}>Try again</button><Link href="/" className="button button--secondary" style={{ marginLeft: 12 }}>Back to TreeLedger</Link></main>;
}
