import { ArrowRight, ArrowUpRight, Fingerprint, Leaf, MapPin, QrCode, ShieldCheck, Users, Wrench } from "lucide-react";
import { DigitalTree } from "@/components/digital-tree";
import { ScrollReveals } from "@/components/scroll-reveals";
import { SiteHeader } from "@/components/site-header";
import { ButtonLink } from "@/components/ui/button-link";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusBadge } from "@/components/ui/status-badge";

const experiences = [
  { id: "residents", title: "Resident", icon: Users, description: "Get to know the trees around you and raise concerns when something needs attention.", journey: ["Discover a tree", "View its identity and care history", "Report a concern", "Track the report status"], href: "#community", link: "See the resident journey" },
  { id: "field-teams", title: "Contractor", icon: Wrench, description: "Follow assigned work and attach maintenance evidence to the tree being cared for.", journey: ["View assigned tasks", "Open the tree location", "Record work and photo evidence", "Submit maintenance proof"], href: "#lifecycle", link: "See the verification workflow" },
  { id: "township", title: "Admin", icon: MapPin, description: "Bring tree identities, location context, and maintenance obligations into one township view.", journey: ["Explore township trees", "Review maintenance and reports", "Check SLA obligations", "Review available verification evidence"], href: "#intelligence", link: "See township intelligence" },
];

export default function Home() {
  return (
    <div className="landing">
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader />
      <ScrollReveals />
      <main id="main">
        <div className="cinematic-story" id="overview">
          <div className="scene-sticky"><DigitalTree /><div className="scene-vignette" /><div className="scene-progress" aria-hidden="true"><span /></div></div>
          <div className="story-content">
            <section className="hero story-panel" aria-labelledby="hero-title">
              <div className="hero-topline"><span>Forest Intelligence</span><span>Nature meets verifiable technology</span></div>
              <div className="hero-copy">
                <h1 id="hero-title">Every tree<br />has a story.<br />Every action<br />leaves proof.</h1>
                <p className="hero-description">Transforming township greenery into a living, verifiable digital ecosystem.</p>
                <div className="hero-actions"><ButtonLink href="#workspaces">Explore TreeLedger <ArrowRight size={17} aria-hidden="true" /></ButtonLink><ButtonLink href="/app/map" variant="secondary">View Live Tree Map <ArrowUpRight size={16} aria-hidden="true" /></ButtonLink></div>
              </div>
              <div className="hero-footer"><p>From one living tree<br />to a connected township.</p></div>
            </section>

            <section className="identity-chapter story-panel" id="record" aria-labelledby="identity-title">
              <div className="chapter-copy" data-reveal>
                <Fingerprint className="chapter-icon" size={29} strokeWidth={1.3} aria-hidden="true" />
                <SectionHeading id="identity-title" label="01 / Digital tree identity">A living tree.<br />A lasting identity.</SectionHeading>
                <p>A QR-linked identity connects the tree in front of you to its species, location, and care history. Each new report or maintenance proof belongs to that same record.</p>
                <div className="chapter-details"><span><QrCode size={18} aria-hidden="true" />Discover through a QR identity</span><span><MapPin size={18} aria-hidden="true" />Keep location and history together</span></div>
              </div>
            </section>

            <section className="township-chapter story-panel" id="intelligence" aria-labelledby="intelligence-title">
              <div className="chapter-copy" data-reveal>
                <MapPin className="chapter-icon" size={29} strokeWidth={1.3} aria-hidden="true" />
                <SectionHeading id="intelligence-title" label="02 / Living township intelligence">From a single tree<br />to the whole<br />neighbourhood.</SectionHeading>
                <p>The single identity becomes part of a wider canopy. As the view opens into a township, each tree keeps its own story: location, condition, and care history, brought together through GIS.</p>
                <div className="surface-panel map-availability" id="tree-map"><StatusBadge>Tree data not connected</StatusBadge><h3>Live tree map</h3><p>The map workspace can display a configured basemap. Live tree locations are not connected; this animated township is an illustration.</p><ButtonLink href="/admin/map" variant="text">Open the map workspace <ArrowRight size={15} aria-hidden="true" /></ButtonLink></div>
              </div>
            </section>

            <section className="proof-chapter story-panel" id="lifecycle" aria-labelledby="proof-title">
              <div className="chapter-copy" data-reveal>
                <ShieldCheck className="chapter-icon" size={29} strokeWidth={1.3} aria-hidden="true" />
                <SectionHeading id="proof-title" label="03 / Environmental accountability">The work matters.<br />So does the proof.</SectionHeading>
                <p>Connect community reports to work in the field, supporting evidence, and municipal SLA review. Make the care trail understandable from start to finish.</p>
                <ol className="proof-steps"><li><span>01</span>Identify</li><li><span>02</span>Report</li><li><span>03</span>Maintain</li><li><span>04</span>Verify</li></ol>
                <div className="audit-note"><ShieldCheck size={18} aria-hidden="true" /><p>Designed for blockchain-backed audit records.<span>Arbitrum audit logging is part of the project architecture. No live transactions are shown here.</span></p></div>
              </div>
            </section>
          </div>
        </div>

        <section className="community-section" id="community" data-theme="light" aria-labelledby="community-title">
          <div className="community-copy" data-reveal><Leaf size={30} strokeWidth={1.3} aria-hidden="true" /><SectionHeading id="community-title" label="04 / Community participation">Caring for a township<br />starts close to home.</SectionHeading><p>Notice a damaged branch? Want to know more about a tree on your daily walk? The resident experience is designed to make both simple.</p><ButtonLink href="#residents">Explore the resident journey <ArrowRight size={17} aria-hidden="true" /></ButtonLink></div>
          <ol className="community-steps" data-reveal>{[{ title: "Discover", text: "Find a tree or scan its QR identity.", icon: QrCode }, { title: "Understand", text: "View its profile, condition, and care history.", icon: Leaf }, { title: "Speak up", text: "Report a hazard with clear location context.", icon: MapPin }, { title: "Stay informed", text: "Follow the status of a submitted concern.", icon: Users }].map(({ title, text, icon: Icon }, i) => <li key={title}><span className="community-step-number">0{i + 1}</span><Icon size={21} strokeWidth={1.4} aria-hidden="true" /><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
        </section>

        <section className="platform-section" id="workspaces" aria-labelledby="platform-title">
          <div className="platform-heading" data-reveal><SectionHeading id="platform-title" label="05 / Explore the platform" description="Different responsibilities. The same tree record.">The right view.<br />For the work you do.</SectionHeading><p className="availability-note">Open a workspace preview below. Live records and operational services are not connected yet.</p></div>
          <div className="platform-entries">{experiences.map(({ id, title, description, journey, href, link, icon: Icon }) => <details className="surface-panel role-entry" id={id} key={id} data-reveal><summary><Icon size={24} strokeWidth={1.4} aria-hidden="true" /><span>{title}</span><span className="expand-symbol" aria-hidden="true">+</span></summary><p className="role-description">{description}</p><ol>{journey.map((step) => <li key={step}>{step}</li>)}</ol><div className="role-entry-actions"><ButtonLink href={id === "residents" ? "/app" : id === "field-teams" ? "/contractor" : "/admin"}>Open {title.toLowerCase()} workspace <ArrowUpRight size={16} aria-hidden="true" /></ButtonLink><ButtonLink variant="text" href={href}>{link}<ArrowUpRight size={16} aria-hidden="true" /></ButtonLink></div></details>)}</div>
          <p className="platform-footnote">Residents discover and report. Contractors document care. Township teams review the evidence.</p>
        </section>
      </main>
      <footer className="site-footer"><a href="#overview" className="wordmark"><Leaf size={21} aria-hidden="true" />TreeLedger</a><p>Urban forestry & municipal SLA verification.</p><a href="#overview">Back to the canopy <ArrowUpRight size={15} aria-hidden="true" /></a></footer>
    </div>
  );
}
