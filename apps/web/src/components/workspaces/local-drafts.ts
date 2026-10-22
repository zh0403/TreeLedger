"use client";

import { useCallback, useEffect, useState } from "react";

export type LocalDraft = { id: string; reference: string; location: string; severity: "low" | "medium" | "high"; description: string; createdAt: string };

function parseDrafts(raw: string | null): LocalDraft[] {
  try {
    const parsed: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((draft): draft is LocalDraft => draft && typeof draft.id === "string" && typeof draft.reference === "string" && typeof draft.location === "string" && typeof draft.description === "string" && typeof draft.createdAt === "string" && Number.isFinite(Date.parse(draft.createdAt)) && ["low", "medium", "high"].includes(draft.severity));
  } catch { return []; }
}

export function useLocalDrafts(kind: "report" | "evidence") {
  const storageKey = `treeledger.local-${kind}-drafts.v1`;
  const [drafts, setDrafts] = useState<LocalDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    let active = true;
    const load = () => {
      if (!active) return;
      try { setDrafts(parseDrafts(localStorage.getItem(storageKey))); }
      catch { setStorageError("Browser storage is unavailable. Drafts cannot be saved on this device."); }
      setLoading(false);
    };
    queueMicrotask(load);
    const sync = (event: StorageEvent) => { if (event.key === storageKey || event.key === null) load(); };
    window.addEventListener("storage", sync);
    return () => { active = false; window.removeEventListener("storage", sync); };
  }, [storageKey]);

  const save = useCallback((draft: LocalDraft) => {
    try {
      const next = [draft, ...parseDrafts(localStorage.getItem(storageKey))];
      localStorage.setItem(storageKey, JSON.stringify(next));
      setDrafts(next); setStorageError(""); return true;
    } catch { setStorageError("The draft could not be saved. Browser storage may be blocked or full."); return false; }
  }, [storageKey]);

  return { drafts, loading, storageError, save };
}
