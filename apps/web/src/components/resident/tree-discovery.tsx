"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Leaf, MapPin, TreePine, TriangleAlert } from "lucide-react";
import { filterResidentTrees, residentHealthLabels, type ResidentHealthFilter, type ResidentTreeRecord } from "./resident-data";

function recordPhoto(src?: string) {
  if (src?.startsWith("/") && !src.startsWith("//")) return src;
  try { return new URL(src ?? "").protocol === "https:" ? src : undefined; } catch { return undefined; }
}

function TreeDiscoveryCard({ tree }: { tree: ResidentTreeRecord }) {
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  const photo = recordPhoto(tree.photoUrl);
  return <article className="resident-tree-card">
    <div className="resident-tree-photo">{photo && failedPhoto !== photo ? <Image src={photo} alt={`Photo supplied for ${tree.commonName ?? `tree ${tree.id}`}`} fill sizes="(max-width:620px) 100vw,(max-width:1000px) 50vw,33vw" unoptimized onError={() => setFailedPhoto(photo)} /> : <div className="resident-photo-empty"><TreePine size={36} strokeWidth={1.2} aria-hidden="true" /><span>{photo ? "Photo unavailable" : "No tree photo provided"}</span></div>}</div>
    <div className="resident-tree-card-copy"><div className={`resident-condition resident-condition--${tree.health ?? "unknown"}`}>{tree.health === "critical" ? <TriangleAlert size={13} aria-hidden="true" /> : <Leaf size={13} aria-hidden="true" />}<span>{tree.health ? residentHealthLabels[tree.health] : "Condition unavailable"}</span></div><h3>{tree.commonName ?? tree.species ?? "Tree identity"}</h3>{tree.scientificName && <p className="resident-scientific-name">{tree.scientificName}</p>}<p className="resident-tree-reference">Tree ID <span>{tree.id}</span></p><p className="resident-tree-location"><MapPin size={14} aria-hidden="true" />{tree.location ?? "Location not provided"}</p></div>
  </article>;
}

export function TreeDiscovery({ trees, query, health, onHealth, onReset }: { trees: readonly ResidentTreeRecord[] | null; query: string; health: ResidentHealthFilter; onHealth: (value: ResidentHealthFilter) => void; onReset: () => void }) {
  const filtered = trees === null ? null : filterResidentTrees(trees, query, health);
  const hasFilters = query.trim() !== "" || health !== "all";
  return <section className="resident-discovery" id="tree-discovery" aria-labelledby="discovery-title">
    <div className="resident-section-heading"><div><h2 id="discovery-title">Get to know the trees.</h2><p>Names, places, and the care behind every canopy.</p></div><Link href="/app/profile" className="resident-text-link">About Tree Passports <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
    <div className="resident-filter-row" role="group" aria-label="Filter tree profiles by condition"><button type="button" aria-pressed={health === "all"} onClick={() => onHealth("all")}>All trees</button>{Object.entries(residentHealthLabels).map(([value, label]) => <button key={value} type="button" aria-pressed={health === value} onClick={() => onHealth(value as ResidentHealthFilter)}>{label}</button>)}</div>
    <div className="resident-search-results" id="resident-search-results" tabIndex={-1}>
      <p className="resident-result-summary" role="status">{filtered ? `${filtered.length} of ${trees!.length} tree profiles${hasFilters ? " match your filters" : ""}` : hasFilters ? "Tree profiles are not available to search or filter yet." : ""}</p>
      {filtered?.length ? <div className="resident-tree-grid">{filtered.map(tree => <TreeDiscoveryCard key={tree.id} tree={tree} />)}</div> : <div className="resident-discovery-empty"><span className="resident-empty-leaf"><Leaf size={32} strokeWidth={1.2} aria-hidden="true" /></span><div><h3>{trees === null ? "No tree profiles to explore yet." : trees.length === 0 ? "No tree profiles have been added yet." : "No matches this time."}</h3><p>{trees === null ? "You can still explore the map or make a note of a tree concern. When profiles are available, you’ll find their names, conditions, and locations here." : trees.length === 0 ? "You can explore the map while the registry is empty." : "Try another name, species, location, or tree ID."}</p><div className="resident-empty-actions"><Link href="/app/map" className="resident-button resident-button--secondary">Explore the map <ArrowUpRight size={15} aria-hidden="true" /></Link>{hasFilters && <button className="resident-text-link" type="button" onClick={onReset}>Clear search & filters</button>}</div></div></div>}
    </div>
  </section>;
}
