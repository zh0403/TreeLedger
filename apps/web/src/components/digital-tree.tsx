"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, ArrowUpRight, Fingerprint, Pause, Play } from "lucide-react";
import type { SceneController } from "./tree-scene";
import { demoTreeIdentity, TreePassport } from "./tree-passport";

function StaticTree({ hidden }: { hidden: boolean }) {
  return (
    <svg className="static-tree" viewBox="0 0 800 700" role="img" aria-label="A green particle tree with branching roots and circular ground rings" aria-hidden={hidden}>
      <defs><radialGradient id="tree-fallback-glow"><stop stopColor="var(--accent)" stopOpacity=".18" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></radialGradient></defs>
      <ellipse cx="400" cy="570" rx="260" ry="100" fill="url(#tree-fallback-glow)" />
      <g fill="none" stroke="var(--accent)" strokeOpacity=".45"><ellipse cx="400" cy="570" rx="180" ry="40" /><ellipse cx="400" cy="570" rx="240" ry="58" /><path d="M400 565 Q375 430 405 330 M400 460 Q310 380 280 280 M400 430 Q495 350 530 260 M400 390 Q350 300 370 210 M400 520 Q370 565 280 575 M400 520 Q430 565 520 575" /></g>
      {Array.from({ length: 500 }, (_, i) => {
        const angle = i * 2.39996;
        const radius = Math.sqrt(((i * 137) % 499) / 499);
        return <circle key={i} cx={400 + Math.cos(angle) * radius * 205} cy={265 + Math.sin(angle) * radius * 165} r={.7 + (i % 3) * .3} fill={i % 4 ? "var(--accent)" : "var(--accent-soft)"} opacity={.25 + (i % 5) * .13} />;
      })}
    </svg>
  );
}

export function DigitalTree() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controller = useRef<SceneController | null>(null);
  const playbackPaused = useRef(false);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback" | "reduced" | "lightweight">("loading");
  const [paused, setPaused] = useState(false);
  const [passportOpen, setPassportOpen] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);
  const [controlsHost, setControlsHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const story = canvasRef.current?.closest<HTMLElement>(".cinematic-story");
    let active = true;
    queueMicrotask(() => { if (active && story) setControlsHost(story); });
    const hero = story?.querySelector(".hero");
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setHeroVisible(entry.intersectionRatio > .3), { threshold: [0, .3] });
    observer.observe(hero);
    return () => { active = false; observer.disconnect(); };
  }, []);

  useEffect(() => {
    playbackPaused.current = paused || passportOpen;
    controller.current?.setPaused(playbackPaused.current);
  }, [paused, passportOpen]);

  useEffect(() => {
    let disposed = false;
    let generation = 0;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const device = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const lowPower = (device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 2) || (device.deviceMemory !== undefined && device.deviceMemory < 4) || device.connection?.saveData;
    const configure = () => {
      if (disposed) return;
      const request = ++generation;
      controller.current?.dispose();
      controller.current = null;
      if (media.matches || lowPower) { setStatus(media.matches ? "reduced" : "lightweight"); return; }
      setStatus("loading");
      import("./tree-scene").then(({ mountTreeScene }) => {
        if (disposed || request !== generation || !canvasRef.current) return;
        try {
          controller.current = mountTreeScene(canvasRef.current, () => { if (!disposed) setStatus("fallback"); });
          controller.current.setPaused(playbackPaused.current);
          setStatus("ready");
        } catch { setStatus("fallback"); }
      }).catch(() => { if (!disposed && request === generation) setStatus("fallback"); });
    };
    queueMicrotask(configure);
    media.addEventListener("change", configure);
    return () => { disposed = true; generation++; media.removeEventListener("change", configure); controller.current?.dispose(); controller.current = null; };
  }, []);

  const toggle = () => {
    const next = !paused;
    controller.current?.setPaused(next || passportOpen);
    setPaused(next);
  };

  const controls = <div className="scene-controls">
    <a href="#record" className="scroll-cue"><span><ArrowDown size={15} aria-hidden="true" /></span>Follow the story</a>
    <span className="scene-status" role="status">{status === "loading" ? "Preparing the digital tree · illustrative, not live data" : status === "fallback" ? "Static illustration · 3D unavailable · not live data" : status === "reduced" ? "Static illustration · reduced motion · not live data" : status === "lightweight" ? "Lightweight illustration · not live data" : "Illustrative tree and township · not live data"}</span>
    {status === "ready" && <button type="button" className="motion-toggle" onClick={toggle} aria-pressed={paused} aria-label={paused ? "Resume scene animation" : "Pause scene animation"}>{paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}<span>{paused ? "Resume motion" : "Pause motion"}</span></button>}
  </div>;

  return (
    <div className={`digital-tree is-${status}`}>
      <StaticTree hidden={status === "ready"} />
      <canvas ref={canvasRef} aria-hidden={status !== "ready"} aria-label="Open demo Tree Passport. Particle tree becomes an illustrative township grove on scroll." role="button" tabIndex={status === "ready" ? 0 : -1} aria-haspopup="dialog" aria-controls="tree-passport"
        onClick={(event) => { if (controller.current?.hitTest(event.clientX, event.clientY)) setPassportOpen(true); }}
        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setPassportOpen(true); } }} />
      <aside className="tree-identity" aria-label="Demo digital tree identity" hidden={!heroVisible}>
        <div className="identity-heading"><Fingerprint size={18} strokeWidth={1.4} aria-hidden="true" /><span>Digital Tree Identity</span><span className="identity-demo">Demo</span></div>
        <dl><div><dt>Tree ID</dt><dd>{demoTreeIdentity.id}</dd></div><div><dt>Health status</dt><dd>{demoTreeIdentity.health}</dd></div><div><dt>Verification</dt><dd>{demoTreeIdentity.verification}</dd></div></dl>
        <button type="button" onClick={() => setPassportOpen(true)} aria-haspopup="dialog" aria-controls="tree-passport">Open Tree Passport <ArrowUpRight size={15} aria-hidden="true" /></button>
      </aside>
      {controlsHost ? createPortal(controls, controlsHost) : controls}
      <TreePassport open={passportOpen} onClose={() => setPassportOpen(false)} />
    </div>
  );
}
