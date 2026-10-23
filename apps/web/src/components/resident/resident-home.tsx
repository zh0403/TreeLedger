"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, Camera, ChevronDown, ClipboardList, Heart, Leaf, MapPin, Search, ShieldCheck, SlidersHorizontal, TreePine, TriangleAlert, X } from "lucide-react";
import { filterResidentTrees, residentHealthLabels, residentTreeRecords, type ResidentHealthFilter, type ResidentTreeRecord } from "./resident-data";
import { ResidentMap } from "./resident-map";
import { TreeDiscovery } from "./tree-discovery";
import { useResidentReportEditor } from "./resident-shell";

function BotanicalFrond() {
  return <svg className="explorer-frond" viewBox="0 0 140 580" fill="none" aria-hidden="true"><path d="M18 -10C95 128 14 318 64 580" stroke="currentColor" strokeWidth="2" />{[0,1,2,3,4,5].map(i => <g key={i} transform={`translate(${i % 2 ? 38 : 20} ${i * 92}) rotate(${i % 2 ? -28 : 18})`}><path d="M12 72C-36 26-18-22 12-51C59-2 61 42 12 72Z" fill="currentColor" fillOpacity=".28" stroke="currentColor" strokeOpacity=".4" /><path d="M12 72V-40M12 28L-9 6M12 4L29-16M12 49L36 26" stroke="currentColor" strokeOpacity=".5" /></g>)}</svg>;
}

export function ResidentHome({ trees = residentTreeRecords }: { trees?: readonly ResidentTreeRecord[] | null }) {
  const [query, setQuery] = useState("");
  const [health, setHealth] = useState<ResidentHealthFilter>("all");
  const [species, setSpecies] = useState("all");
  const [location, setLocation] = useState("all");
  const search = useRef<HTMLInputElement>(null);
  const home = useRef<HTMLElement>(null);
  const openReport = useResidentReportEditor();
  const filtered = trees === null ? null : filterResidentTrees(trees, query, health, species, location);
  const speciesOptions = [...new Set((trees ?? []).map(tree => tree.species ?? tree.scientificName).filter((value): value is string => !!value))].sort();
  const locations = [...new Set((trees ?? []).map(tree => tree.location).filter((value): value is string => !!value))].sort();
  const assessed = (filtered ?? []).filter(tree => tree.health && tree.health !== "unassessed");
  const healthy = assessed.filter(tree => tree.health === "healthy").length;
  const attention = assessed.filter(tree => tree.health === "attention" || tree.health === "critical").length;
  const reset = () => { setQuery(""); setHealth("all"); setSpecies("all"); setLocation("all"); };
  const showList = () => {
    const results = home.current?.querySelector<HTMLElement>("#resident-search-results");
    results?.focus({ preventScroll: true });
    results?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };

  return <main ref={home} className="resident-home explorer-home" id="resident-home">
    <section className="explorer-hero" aria-labelledby="resident-welcome-title">
      <BotanicalFrond />
      <div className="explorer-hero-inner">
        <div className="explorer-intro">
          <p className="resident-eyebrow"><Leaf size={16} strokeWidth={1.5} aria-hidden="true" />A greener everyday</p>
          <h1 id="resident-welcome-title">Get to know your<br /><span>greener</span> neighbourhood.</h1>
          <p className="explorer-intro-description">The trees you walk past have a story.<br />Take a look around. See what grows.</p>
          <form className="resident-discovery-search" role="search" onSubmit={event => { event.preventDefault(); showList(); }}>
            <label className="resident-sr-only" htmlFor="resident-tree-query">Search tree profiles by name, species, tree ID, or location</label>
            <Search size={22} strokeWidth={1.6} aria-hidden="true" />
            <input ref={search} id="resident-tree-query" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search a tree, species, or place" aria-describedby="resident-discovery-help" />
            {query && <button type="button" className="resident-search-clear" aria-label="Clear tree search" onClick={() => { setQuery(""); search.current?.focus(); }}><X size={17} aria-hidden="true" /></button>}
            <button type="submit" className="resident-search-submit" aria-label="Show tree search results"><ArrowRight size={21} aria-hidden="true" /></button>
          </form>
          <div className="explorer-filters">
            <button type="button" disabled className="explorer-filter explorer-nearby" title="Distances require connected tree coordinates" aria-describedby="resident-discovery-help"><MapPin size={15} aria-hidden="true" />Nearby<span className="resident-sr-only"> distances unavailable</span></button>
            <label className="explorer-filter"><MapPin size={15} aria-hidden="true" /><span className="resident-sr-only">Filter by location</span><select aria-label="Filter by location" value={location} onChange={event => setLocation(event.target.value)} disabled={!locations.length}><option value="all">All places</option>{locations.map(value => <option key={value}>{value}</option>)}</select><ChevronDown size={13} aria-hidden="true" /></label>
            <label className="explorer-filter"><SlidersHorizontal size={15} aria-hidden="true" /><span className="resident-sr-only">Filter by species</span><select aria-label="Filter by species" value={species} onChange={event => setSpecies(event.target.value)} disabled={!speciesOptions.length}><option value="all">All species</option>{speciesOptions.map(value => <option key={value}>{value}</option>)}</select><ChevronDown size={13} aria-hidden="true" /></label>
            <label className="explorer-filter"><Heart size={15} aria-hidden="true" /><span className="resident-sr-only">Filter by health status</span><select aria-label="Filter by health status" value={health} onChange={event => setHealth(event.target.value as ResidentHealthFilter)}><option value="all">All health</option>{Object.entries(residentHealthLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown size={13} aria-hidden="true" /></label>
          </div>
          <p id="resident-discovery-help" className="explorer-data-note">{trees === null ? "Tree registry not connected. Nearby distances unavailable." : "Search your available tree profiles. Nearby distances are not calculated."}</p>
        </div>
        <div className="explorer-map-region"><ResidentMap trees={filtered} onList={showList} /></div>
        <div className="explorer-bottom-strip">
          <div className="explorer-summary" aria-label="Tree profile summary">
            <div><TreePine size={30} strokeWidth={1.5} aria-hidden="true" /><p><strong>{filtered === null ? "—" : filtered.length}</strong><span>Tree profiles</span></p></div>
            <div><Leaf size={29} strokeWidth={1.5} aria-hidden="true" /><p><strong>{assessed.length ? `${Math.round(healthy / assessed.length * 100)}%` : "—"}</strong><span>Healthy · of assessed</span></p></div>
            <div><TriangleAlert size={29} strokeWidth={1.5} aria-hidden="true" /><p><strong>{filtered === null || !assessed.length ? "—" : attention}</strong><span>Need attention</span></p></div>
            <Link href="/app/reports"><ShieldCheck size={29} strokeWidth={1.5} aria-hidden="true" /><p><strong>Community</strong><span>Care starts close to home</span></p></Link>
          </div>
          <button type="button" className="explorer-community-banner" onClick={showList}><Leaf size={34} strokeWidth={1.2} aria-hidden="true" /><span><strong>Every tree matters.</strong><small>Explore. Learn. Report. Make a difference.</small></span><ArrowRight size={22} aria-hidden="true" /></button>
        </div>
      </div>
    </section>
    <div className="explorer-lower">
      <TreeDiscovery trees={trees} query={query} health={health} species={species} location={location} onHealth={setHealth} onReset={reset} />
      <aside className="resident-care-card" aria-labelledby="resident-care-title">
        <span className="resident-care-icon"><Camera size={26} strokeWidth={1.5} aria-hidden="true" /></span>
        <h2 id="resident-care-title">Spotted something<br />that needs care?</h2>
        <p>A damaged branch, fallen tree, or other concern? Make a note while it’s fresh.</p>
        <button type="button" className="resident-button resident-button--primary" onClick={openReport}>Report an issue <ArrowRight size={17} aria-hidden="true" /></button>
        <Link href="/app/reports" className="explorer-reports-link"><ClipboardList size={21} aria-hidden="true" /><span>My reports & drafts<small>Track your notes and saved local drafts.</small></span><ArrowRight size={17} aria-hidden="true" /></Link>
        <p className="resident-draft-note">Local drafts only. Reports are not submitted while the service is disconnected.</p>
      </aside>
    </div>
  </main>;
}
