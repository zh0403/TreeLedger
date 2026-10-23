"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Fingerprint,
  HardHat,
  Laptop,
  LayoutDashboard,
  Leaf,
  MapPin,
  QrCode,
  ShieldCheck,
  Smartphone,
  Trees,
  Users,
  Wrench,
} from "lucide-react";
import { DigitalTree } from "@/components/digital-tree";
import { ScrollReveals } from "@/components/scroll-reveals";
import { SiteHeader } from "@/components/site-header";
import { Brand } from "@/components/ui/brand";
import { ButtonLink } from "@/components/ui/button-link";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusBadge } from "@/components/ui/status-badge";
import TownshipTransparencyExplorer from "@/components/home/TownshipTransparencyExplorer";

const experiences = [
  {
    id: "residents",
    title: "Resident",
    icon: Users,
    description:
      "Get to know the trees around you and raise concerns when something needs attention.",
    journey: [
      "Discover a tree",
      "View its identity and care history",
      "Report a concern",
      "Track the report status",
    ],
    href: "#community",
    link: "See the resident journey",
  },
  {
    id: "field-teams",
    title: "Contractor",
    icon: Wrench,
    description:
      "Follow assigned work and attach maintenance evidence to the tree being cared for.",
    journey: [
      "View assigned tasks",
      "Open the tree location",
      "Record work and photo evidence",
      "Submit maintenance proof",
    ],
    href: "#lifecycle",
    link: "See the verification workflow",
  },
  {
    id: "township",
    title: "Admin",
    icon: MapPin,
    description:
      "Bring tree identities, location context, and maintenance obligations into one township view.",
    journey: [
      "Explore township trees",
      "Review maintenance and reports",
      "Check SLA obligations",
      "Review available verification evidence",
    ],
    href: "#intelligence",
    link: "See township intelligence",
  },
];

export default function Home() {
  const [deviceType, setDeviceType] = useState<"mobile" | "desktop">("mobile");
  const [detectionSource, setDetectionSource] =
    useState<string>("Auto-detecting...");
  const [redirecting, setRedirecting] = useState<string | null>(null);

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

      if (isMobileUA) {
        setDeviceType("mobile");
        setDetectionSource("Mobile User-Agent detected");
      } else if (hasTouch && isSmallScreen) {
        setDeviceType("mobile");
        setDetectionSource("Touchscreen & mobile screen width");
      } else if (isSmallScreen) {
        setDeviceType("mobile");
        setDetectionSource(`Viewport width (${window.innerWidth}px)`);
      } else {
        setDeviceType("desktop");
        setDetectionSource("Desktop browser detected");
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
  const targetLabel =
    deviceType === "mobile"
      ? "Launch Resident Mobile PWA"
      : "Launch Township Command Center";

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
                  <ButtonLink href="#workspaces">
                    Explore TreeLedger <ArrowRight size={17} aria-hidden="true" />
                  </ButtonLink>
                  <ButtonLink href="/app/map" variant="secondary">
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
                    and real-time canopy telemetry in the transparency explorer
                    below or the operations map workspace.
                  </p>
                  <ButtonLink href="/admin/map" variant="text">
                    Open the map workspace{" "}
                    <ArrowRight size={15} aria-hidden="true" />
                  </ButtonLink>
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
              label="04 / Community participation"
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
            <ButtonLink href="#residents">
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

        {/* Public DLP Audit & Township Transparency Hub */}
        <div
          id="transparency"
          className="px-[var(--page-gutter)] py-16 bg-[var(--background)] border-t border-[var(--border)]"
        >
          <div className="max-w-6xl mx-auto">
            <TownshipTransparencyExplorer />
          </div>
        </div>

        <section
          className="platform-section"
          id="workspaces"
          aria-labelledby="platform-title"
        >
          <div className="platform-heading" data-reveal>
            <SectionHeading
              id="platform-title"
              label="05 / Explore the platform"
              description="Different responsibilities. The same tree record."
            >
              The right view.
              <br />
              For the work you do.
            </SectionHeading>
            <p className="availability-note">
              Open a unified workspace or launch directly into the live
              resident, field contractor, and township operations portals.
            </p>
          </div>

          {/* Smart Device Auto-Detection & Quick Launch Bar */}
          <div className="mb-10 max-w-4xl">
            <div className="surface-panel p-5 sm:p-6 space-y-5 bg-[var(--background)] border border-[var(--border)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-[var(--radius-control)] bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shrink-0">
                    {deviceType === "mobile" ? (
                      <Smartphone className="w-5 h-5 text-[var(--accent)]" />
                    ) : (
                      <Laptop className="w-5 h-5 text-[var(--verification)]" />
                    )}
                  </div>
                  <div>
                    <div className="text-[11px] text-[var(--muted)] uppercase tracking-wider font-mono">
                      Smart Device Auto-Detection
                    </div>
                    <div className="text-sm font-medium text-[var(--foreground)] flex flex-wrap items-center gap-2">
                      <span>
                        {deviceType === "mobile"
                          ? "Mobile Device Active"
                          : "Desktop Browser Active"}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-[var(--radius-pill)] text-[11px] font-mono bg-[var(--surface)] text-[var(--accent-soft)] border border-[var(--border)]">
                        {detectionSource}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[var(--surface)] p-1 rounded-[var(--radius-pill)] border border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => {
                      setDeviceType("mobile");
                      setDetectionSource("Manual switch: Mobile");
                    }}
                    className={`min-h-[36px] px-3.5 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      deviceType === "mobile"
                        ? "bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDeviceType("desktop");
                      setDetectionSource("Manual switch: Desktop");
                    }}
                    className={`min-h-[36px] px-3.5 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      deviceType === "desktop"
                        ? "bg-[var(--verification)] text-[var(--accent-foreground)] font-semibold"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Desktop</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  id="smart-start-button"
                  href={targetPath}
                  prefetch={true}
                  onClick={() => setRedirecting(targetPath)}
                  className="button button--primary w-full"
                >
                  <span>
                    {redirecting ? `Loading ${redirecting}...` : targetLabel}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="flex items-center justify-center gap-4 text-xs text-[var(--muted)]">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                    Target: {targetPath}
                  </span>
                  <span>•</span>
                  <span>Tap to enter immediately</span>
                </div>
              </div>

              {/* Direct Service Route Quick Links */}
              <div className="pt-3 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                <Link
                  href="/app/explore"
                  onClick={() => setRedirecting("/app/explore")}
                  className="min-h-[48px] p-2.5 rounded-[var(--radius-control)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] border border-[var(--border)] hover:border-[var(--control-border)] text-left transition-colors group flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Trees className="w-4 h-4 text-[var(--accent)] shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-[var(--foreground)]">
                        Resident Explore
                      </div>
                      <div className="text-[11px] text-[var(--muted)] font-mono">
                        /app/explore
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--muted)] group-hover:text-[var(--accent)]" />
                </Link>

                <Link
                  href="/app/hazards"
                  onClick={() => setRedirecting("/app/hazards")}
                  className="min-h-[48px] p-2.5 rounded-[var(--radius-control)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] border border-[var(--border)] hover:border-[var(--control-border)] text-left transition-colors group flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[var(--status-warning)] shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-[var(--foreground)]">
                        Hazard Triage
                      </div>
                      <div className="text-[11px] text-[var(--muted)] font-mono">
                        /app/hazards
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--muted)] group-hover:text-[var(--status-warning)]" />
                </Link>

                <Link
                  href="/app/maintenance"
                  onClick={() => setRedirecting("/app/maintenance")}
                  className="min-h-[48px] p-2.5 rounded-[var(--radius-control)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] border border-[var(--border)] hover:border-[var(--control-border)] text-left transition-colors group flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[var(--verification)] shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-[var(--foreground)]">
                        Audit Stream
                      </div>
                      <div className="text-[11px] text-[var(--muted)] font-mono">
                        /app/maintenance
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--muted)] group-hover:text-[var(--verification)]" />
                </Link>

                <Link
                  href="/contractor/tasks"
                  onClick={() => setRedirecting("/contractor/tasks")}
                  className="min-h-[48px] p-2.5 rounded-[var(--radius-control)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] border border-[var(--border)] hover:border-[var(--control-border)] text-left transition-colors group flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <HardHat className="w-4 h-4 text-[var(--accent-soft)] shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-[var(--foreground)]">
                        Field Portal
                      </div>
                      <div className="text-[11px] text-[var(--muted)] font-mono">
                        /contractor/tasks
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--muted)] group-hover:text-[var(--accent-soft)]" />
                </Link>

                <Link
                  href="/admin"
                  onClick={() => setRedirecting("/admin")}
                  className="min-h-[48px] p-2.5 rounded-[var(--radius-control)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] border border-[var(--border)] hover:border-[var(--control-border)] text-left transition-colors group flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-[var(--verification)] shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-[var(--foreground)]">
                        Command Center
                      </div>
                      <div className="text-[11px] text-[var(--muted)] font-mono">
                        /admin
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--muted)] group-hover:text-[var(--verification)]" />
                </Link>
              </div>
            </div>
          </div>

          <div className="platform-entries">
            {experiences.map(
              ({ id, title, description, journey, href, link, icon: Icon }) => (
                <details
                  className="surface-panel role-entry"
                  id={id}
                  key={id}
                  data-reveal
                >
                  <summary>
                    <Icon size={24} strokeWidth={1.4} aria-hidden="true" />
                    <span>{title}</span>
                    <span className="expand-symbol" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p className="role-description">{description}</p>
                  <ol>
                    {journey.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  <div className="role-entry-actions">
                    <ButtonLink
                      href={
                        id === "residents"
                          ? "/app"
                          : id === "field-teams"
                            ? "/contractor"
                            : "/admin"
                      }
                    >
                      Open {title.toLowerCase()} workspace{" "}
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </ButtonLink>
                    <ButtonLink variant="text" href={href}>
                      {link}
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </ButtonLink>
                  </div>
                </details>
              )
            )}
          </div>
          <p className="platform-footnote">
            Residents discover and report. Contractors document care. Township
            teams review the evidence.
          </p>
        </section>
      </main>
      <footer className="site-footer">
        <Brand href="#overview" className="wordmark" />
        <p>Urban forestry & municipal SLA verification.</p>
        <a href="#overview">
          Back to the canopy <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </footer>
    </div>
  );
}
