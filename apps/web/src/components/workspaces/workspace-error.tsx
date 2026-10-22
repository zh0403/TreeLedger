"use client";

import { Button } from "../ui/button";
import { ButtonLink } from "../ui/button-link";

export function WorkspaceError({ reset }: { reset: () => void }) {
  return <main style={{ padding: 32, maxWidth: 650, margin: "auto" }}><h1 style={{ fontSize: 28, marginBottom: 20 }}>The workspace could not load.</h1><p style={{ marginBottom: 24 }}>Your saved local drafts remain in this browser. Try loading the workspace again.</p><Button type="button" variant="primary" onClick={reset}>Try again</Button><ButtonLink href="/" variant="secondary" style={{ marginLeft: 12 }}>Back to TreeLedger</ButtonLink></main>;
}
