"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, ClipboardList, Leaf, MessageCircle, Search, X } from "lucide-react";
import { TownshipMap } from "../workspaces/township-map";
import { residentTreeRecords, type ResidentHealthFilter, type ResidentTreeRecord } from "./resident-data";
import { TreeDiscovery } from "./tree-discovery";
import { useResidentReportEditor } from "./resident-shell";
import { MainServicesLinks } from "../main-services";

export function ResidentHome({ trees = residentTreeRecords }: { trees?: readonly ResidentTreeRecord[] | null }) {
  const [query, setQuery] = useState("");
  const [health, setHealth] = useState<ResidentHealthFilter>("all");
  const search = useRef<HTMLInputElement>(null);
  const home = useRef<HTMLElement>(null);
  const openReport = useResidentReportEditor();

  return <main ref={home} className="resident-home" id="resident-home">
    <section className="resident-welcome" aria-labelledby="resident-welcome-title"><div className="resident-welcome-copy"><p className="resident-eyebrow"><Leaf size={15} aria-hidden="true" />A greener everyday</p><h1 id="resident-welcome-title">Get to know your<br /> greener neighbourhood.</h1><p>The trees you walk past have a story.<br /> Take a look around. See what grows.</p></div><div className="resident-nature-image"><Image src="/forest-canopy.jpg" fill sizes="(max-width:700px) 100vw,45vw" alt="Sunlight along a forest path, used as general nature imagery rather than a registered tree photo" preload /><span>Room to slow down.</span></div></section>

    <form className="resident-discovery-search" role="search" onSubmit={event => { event.preventDefault(); const results = home.current?.querySelector<HTMLElement>("#resident-search-results"); results?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); results?.focus({ preventScroll: true }); }}>
      <label className="resident-sr-only" htmlFor="resident-tree-query">Search tree profiles by name, species, tree ID, or location</label><Search size={21} strokeWidth={1.5} aria-hidden="true" /><input ref={search} id="resident-tree-query" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search a tree, species, or place" aria-describedby="resident-discovery-help" />{query && <button type="button" className="resident-search-clear" aria-label="Clear tree search" onClick={() => { setQuery(""); search.current?.focus(); }}><X size={17} aria-hidden="true" /></button>}<button type="submit" className="resident-search-submit" aria-label="Show tree search results"><ArrowRight size={19} aria-hidden="true" /></button>
    </form><p className="resident-search-help" id="resident-discovery-help">Search by tree name, species, tree ID, or place.</p>

    <div className="resident-explore-row"><section className="resident-map-card" aria-labelledby="resident-map-title"><div className="resident-map-heading"><div><h2 id="resident-map-title">Take a look around.</h2><p>A map is a good place to start.</p></div><Link href="/app/map" className="resident-text-link">Open explorer <ArrowUpRight size={15} aria-hidden="true" /></Link></div><div className="resident-map-preview"><TownshipMap light /></div></section>
      <aside className="resident-care-card" aria-labelledby="resident-care-title"><span className="resident-care-icon"><MessageCircle size={25} strokeWidth={1.4} aria-hidden="true" /></span><h2 id="resident-care-title">Noticed something<br /> that needs care?</h2><p>A damaged branch or a tree concern? Make a note while it’s fresh.</p><button type="button" className="resident-button resident-button--primary" onClick={openReport}>Report an issue <ArrowRight size={16} aria-hidden="true" /></button><Link href="/app/reports" className="resident-text-link"><ClipboardList size={16} aria-hidden="true" />My reports & drafts</Link><p className="resident-draft-note">Reports currently save as drafts on your device. They are not submitted.</p></aside>
    </div>
    <section aria-labelledby="resident-services-title"><h2 id="resident-services-title">Township services</h2><p>Open the integrated registry, reporting, and maintenance prototypes. Sample fallbacks are labelled in those views.</p><MainServicesLinks /></section>
    <TreeDiscovery trees={trees} query={query} health={health} onHealth={setHealth} onReset={() => { setQuery(""); setHealth("all"); }} />
  </main>;
}
