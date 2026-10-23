"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Fingerprint,
  HardHat,
  Leaf,
  MapPin,
  QrCode,
  ShieldCheck,
  Users,
} from "lucide-react";
import { DigitalTree } from "@/components/digital-tree";
import { ScrollReveals } from "@/components/scroll-reveals";
import { SiteHeader } from "@/components/site-header";
import { Brand } from "@/components/ui/brand";
import { ButtonLink } from "@/components/ui/button-link";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusBadge } from "@/components/ui/status-badge";
import TownshipTransparencyExplorer from "@/components/home/TownshipTransparencyExplorer";
import "./landing-workspaces.css";

export default function Home() {
  const [deviceType, setDeviceType] = useState<"mobile" | "desktop">("desktop");

  useEffect(() => {
    const runDetection = () => {
      if (typeof window === "undefined") return;

      const ua = (navigator.userAgent || navigator.vendor || "").toLowerCase();
      const isMobileUA =
        /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|touch|silk|fennec|windows phone/i.test(
          ua
        );
      const isSmallScreen =
        window.innerWidth <= 820 || window.screen.width <= 820;
      const hasTouch =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);

      if (isMobileUA || (hasTouch && isSmallScreen) || isSmallScreen) {
        setDeviceType("mobile");
      } else {
        setDeviceType("desktop");
      }
    };

    const frame = requestAnimationFrame(runDetection);
    window.addEventListener("resize", runDetection);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", runDetection);
    };
  }, []);

  const targetPath = deviceType === "mobile" ? "/app/explore" : "/admin";

  return (
    <div className="landing">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <ScrollReveals />
      <main id="main">
        <div className="cinematic-story" id="overview">
          <div className="scene-sticky">
            <DigitalTree />
            <div className="scene-vignette" />
            <div className="scene-progress" aria-hidden="true">
              <span />
            </div>
          </div>
          <div className="story-content">
            <section
              className="hero story-panel"
              aria-labelledby="hero-title"
            >
              <div className="hero-topline">
                <span>Forest Intelligence</span>
              </div>
              <div className="hero-copy">
                <h1 id="hero-title">
                  Every tree
                  <br />
                  has a story.
                  <br />
                  Every action
                  <br />
                  leaves proof.
                </h1>
                <p className="hero-description">
                  Transforming township greenery into a living, verifiable
                  digital ecosystem.
                </p>
                <div className="hero-actions">
                  <ButtonLink href={targetPath}>
                    Launch TreeLedger{" "}
                    <ArrowRight size={17} aria-hidden="true" />
                  </ButtonLink>
                  <ButtonLink href="#ledger" variant="secondary">
                    View Live Tree Map{" "}
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </ButtonLink>
                </div>
              </div>
            </section>

            <section
              className="identity-chapter story-panel"
              id="record"
              aria-labelledby="identity-title"
            >
              <div className="chapter-copy" data-reveal>
                <Fingerprint
                  className="chapter-icon"
                  size={29}
                  strokeWidth={1.3}
                  aria-hidden="true"
                />
                <SectionHeading
                  id="identity-title"
                  label="01 / Digital tree identity"
                >
                  A living tree.
                  <br />A lasting identity.
                </SectionHeading>
                <p>
                  A QR-linked identity connects the tree in front of you to its
                  species, location, and care history. Each new report or
                  maintenance proof belongs to that same record.
                </p>
                <div className="chapter-details">
                  <span>
                    <QrCode size={18} aria-hidden="true" />
                    Discover through a QR identity
                  </span>
                  <span>
                    <MapPin size={18} aria-hidden="true" />
                    Keep location and history together
                  </span>
                </div>
              </div>
            </section>

            <section
              className="township-chapter story-panel"
              id="intelligence"
              aria-labelledby="intelligence-title"
            >
              <div className="chapter-copy" data-reveal>
                <MapPin
                  className="chapter-icon"
                  size={29}
                  strokeWidth={1.3}
                  aria-hidden="true"
                />
                <SectionHeading
                  id="intelligence-title"
                  label="02 / Living township intelligence"
                >
                  From a single tree
                  <br />
                  to the whole
                  <br />
                  neighbourhood.
                </SectionHeading>
                <p>
                  The single identity becomes part of a wider canopy. As the
                  view opens into a township, each tree keeps its own story:
                  location, condition, and care history, brought together
                  through GIS.
                </p>
                <div className="surface-panel map-availability" id="tree-map">
                  <StatusBadge tone="healthy">
                    Elmina GIS Canopy Ready
                  </StatusBadge>
                  <h3>Live tree map</h3>
                  <p>
                    Inspect City of Elmina precincts, pre-handover DLP quotas,
                    and real-time canopy telemetry in the living ledger below.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <ButtonLink href="#ledger">
                      Open Live Tree Map{" "}
                      <ArrowRight size={15} aria-hidden="true" />
                    </ButtonLink>
                  </div>
                </div>
              </div>
            </section>

            <section
              className="proof-chapter story-panel"
              id="lifecycle"
              aria-labelledby="proof-title"
            >
              <div className="chapter-copy" data-reveal>
                <ShieldCheck
                  className="chapter-icon"
                  size={29}
                  strokeWidth={1.3}
                  aria-hidden="true"
                />
                <SectionHeading
                  id="proof-title"
                  label="03 / Environmental accountability"
                >
                  The work matters.
                  <br />
                  So does the proof.
                </SectionHeading>
                <p>
                  Connect community reports to work in the field, supporting
                  evidence, and municipal SLA review. Make the care trail
                  understandable from start to finish.
                </p>
                <ol className="proof-steps">
                  <li>
                    <span>01</span>Identify
                  </li>
                  <li>
                    <span>02</span>Report
                  </li>
                  <li>
                    <span>03</span>Maintain
                  </li>
                  <li>
                    <span>04</span>Verify
                  </li>
                </ol>
                <div className="audit-note">
                  <ShieldCheck size={18} aria-hidden="true" />
                  <p>
                    Backed by Arbitrum Sepolia audit records.
                    <span>
                      TreeLedgerAudit Contract:{" "}
                      0x685049b310922F6bc8d6FA17ddae010E13803701
                    </span>
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* 04 / The living ledger — Scoped outside .cinematic-story for a clean ground-truth transition */}
        <section
          className="ledger-section"
          id="ledger"
          aria-labelledby="ledger-title"
        >
          <TownshipTransparencyExplorer showEditorialIntro />
        </section>

        <section
          className="community-section"
          id="community"
          data-theme="light"
          aria-labelledby="community-title"
        >
          <div className="community-copy" data-reveal>
            <Leaf size={30} strokeWidth={1.3} aria-hidden="true" />
            <SectionHeading
              id="community-title"
              label="05 / Community participation"
            >
              Caring for a township
              <br />
              starts close to home.
            </SectionHeading>
            <p>
              Notice a damaged branch? Want to know more about a tree on your
              daily walk? The resident experience is designed to make both
              simple.
            </p>
            <ButtonLink href="#workspaces">
              Explore the resident journey{" "}
              <ArrowRight size={17} aria-hidden="true" />
            </ButtonLink>
          </div>
          <ol className="community-steps" data-reveal>
            {[
              {
                title: "Discover",
                text: "Find a tree or scan its QR identity.",
                icon: QrCode,
              },
              {
                title: "Understand",
                text: "View its profile, condition, and care history.",
                icon: Leaf,
              },
              {
                title: "Speak up",
                text: "Report a hazard with clear location context.",
                icon: MapPin,
              },
              {
                title: "Stay informed",
                text: "Follow the status of a submitted concern.",
                icon: Users,
              },
            ].map(({ title, text, icon: Icon }, i) => (
              <li key={title}>
                <span className="community-step-number">0{i + 1}</span>
                <Icon size={21} strokeWidth={1.4} aria-hidden="true" />
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="platform-section"
          id="workspaces"
          aria-labelledby="platform-title"
        >
          <div className="platform-heading" data-reveal>
            <SectionHeading
              id="platform-title"
              label="06 / Explore the platform"
            >
              The right view.
              <br />
              For the work you do.
            </SectionHeading>
            <div className="platform-launch">
              <ButtonLink href={targetPath}>
                Launch TreeLedger <ArrowRight size={17} aria-hidden="true" />
              </ButtonLink>
              <p>Or choose your workspace below.</p>
            </div>
          </div>
          <div className="platform-workspaces">
            <div className="platform-workspaces-caption"><Leaf size={18} strokeWidth={1.4} aria-hidden="true" /><p>One canopy. Shared responsibility.</p><span>Find your place in its care.</span></div>
            <nav className="platform-workspace-links" aria-label="Choose your TreeLedger workspace">
              {[
                { title: "Resident", subtitle: "Your neighbourhood", href: "/app", icon: Leaf, description: "Get to know the trees around you and flag a concern when something needs care.", features: ["Discover trees", "Report concerns"], action: "Explore as a resident" },
                { title: "Contractor", subtitle: "In the field", href: "/contractor/tasks", icon: HardHat, description: "Review assigned work orders and add photos and field notes to the care record.", features: ["Work orders", "Photo evidence"], action: "Open field workspace" },
                { title: "Admin", subtitle: "Across the township", href: "/admin", icon: ShieldCheck, description: "Bring tree locations, maintenance and outstanding reports into one operational view.", features: ["Township GIS", "Maintenance oversight"], action: "Open township operations" },
              ].map(({ title, subtitle, href, icon: Icon, description, features, action }) => (
                <Link key={title} href={href} className="platform-workspace-link">
                  <div className="platform-workspace-top"><span className="platform-workspace-icon"><Icon size={25} strokeWidth={1.4} aria-hidden="true" /></span><ArrowUpRight className="platform-workspace-arrow" size={20} strokeWidth={1.5} aria-hidden="true" /></div>
                  <p className="platform-workspace-subtitle">{subtitle}</p>
                  <h3>{title}</h3>
                  <p className="platform-workspace-description">{description}</p>
                  <ul className="platform-workspace-features">{features.map(feature => <li key={feature}>{feature}</li>)}</ul>
                  <span className="platform-workspace-action">{action}<ArrowRight size={16} aria-hidden="true" /></span>
                </Link>
              ))}
            </nav>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <Brand href="#overview" className="wordmark" />
        <p>Urban forestry &amp; municipal SLA verification.</p>
        <a href="#overview">
          Back to the canopy <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </footer>
    </div>
  );
}
