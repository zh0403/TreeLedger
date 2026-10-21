'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  ExternalLink,
  Eye,
  Globe2,
  HardHat,
  Laptop,
  LayoutDashboard,
  Leaf,
  MapPin,
  Radio,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trees,
} from 'lucide-react';

export default function Home() {
  // Default to 'mobile' on initial client render to prioritize mobile phones accessing via LAN
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('mobile');
  const [detectionSource, setDetectionSource] = useState<string>('Auto-detecting...');
  const [redirecting, setRedirecting] = useState<string | null>(null);

  useEffect(() => {
    const runDetection = () => {
      if (typeof window === 'undefined') return;

      const ua = (navigator.userAgent || navigator.vendor || '').toLowerCase();
      const isMobileUA =
        /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|touch|silk|fennec|windows phone/i.test(
          ua
        );
      const isSmallScreen =
        window.innerWidth <= 820 || window.screen.width <= 820;
      const hasTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (window.matchMedia &&
          window.matchMedia('(pointer: coarse)').matches);

      if (isMobileUA) {
        setDeviceType('mobile');
        setDetectionSource('Mobile User-Agent detected');
      } else if (hasTouch && isSmallScreen) {
        setDeviceType('mobile');
        setDetectionSource('Touchscreen & mobile screen width');
      } else if (isSmallScreen) {
        setDeviceType('mobile');
        setDetectionSource(`Viewport width (${window.innerWidth}px)`);
      } else {
        setDeviceType('desktop');
        setDetectionSource('Desktop browser detected');
      }
    };

    runDetection();
    window.addEventListener('resize', runDetection);
    return () => window.removeEventListener('resize', runDetection);
  }, []);

  const targetPath = deviceType === 'mobile' ? '/app/explore' : '/admin';
  const targetLabel =
    deviceType === 'mobile'
      ? 'Launch Resident Mobile PWA'
      : 'Launch Township Command Center';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 relative overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-emerald-500/15 via-teal-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[400px] right-0 w-[500px] h-[400px] bg-cyan-500/10 blur-[120px] pointer-events-none -z-10" />

      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-50 bg-slate-950/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Trees className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">
                  TreeLedger
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  v1.0 Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                City of Elmina • Civic dMRV & Contractor SLA Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Arbitrum Sepolia Verified</span>
            </div>

            <Link
              href={targetPath}
              onClick={() => setRedirecting(targetPath)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <span>{redirecting ? 'Loading...' : 'Start'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-20 w-full space-y-14">
        <section className="text-center space-y-6 max-w-3xl mx-auto pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-emerald-500/30 text-emerald-300 text-xs font-medium shadow-inner animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Master-Planned Township Forestry Management</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Decarbonization Due Diligence &{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Municipal SLA Verification
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            TreeLedger bridges pre-handover homeowner tree quota audits with
            active township civic stewardship—powering automated AI arborist
            triage and tamper-evident contractor proof-of-work on Arbitrum.
          </p>

          {/* Smart Device Detection & Start Card */}
          <div className="pt-2 max-w-xl mx-auto">
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative overflow-hidden text-left space-y-5">
              {/* Detection Status Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                    {deviceType === 'mobile' ? (
                      <Smartphone className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Laptop className="w-5 h-5 text-cyan-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">
                      Smart Device Auto-Detection
                    </div>
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      <span>
                        {deviceType === 'mobile'
                          ? 'Mobile Device Active'
                          : 'Desktop Browser Active'}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {detectionSource}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setDeviceType('mobile');
                      setDetectionSource('Manual switch: Mobile');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      deviceType === 'mobile'
                        ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDeviceType('desktop');
                      setDetectionSource('Manual switch: Desktop');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      deviceType === 'desktop'
                        ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Desktop</span>
                  </button>
                </div>
              </div>

              {/* Primary Direct Start Link */}
              <div className="space-y-3">
                <Link
                  id="smart-start-button"
                  href={targetPath}
                  prefetch={true}
                  onClick={() => setRedirecting(targetPath)}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-base transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 active:scale-[0.98] group cursor-pointer"
                >
                  <span>
                    {redirecting ? `Loading ${redirecting}...` : targetLabel}
                  </span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>

                <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Target: {targetPath}
                  </span>
                  <span>•</span>
                  <span>Tap to enter immediately</span>
                </div>
              </div>

              {/* Direct Quick Launch Buttons */}
              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                <Link
                  href="/app/explore"
                  onClick={() => setRedirecting('/app/explore')}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/90 border border-emerald-500/30 text-left transition-colors group flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Resident PWA
                      </div>
                      <div className="text-[10px] text-slate-400">
                        /app/explore
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </Link>

                <Link
                  href="/admin"
                  onClick={() => setRedirecting('/admin')}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/90 border border-purple-500/30 text-left transition-colors group flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Ops Center
                      </div>
                      <div className="text-[10px] text-slate-400">/admin</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-purple-400 transition-colors" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Live Township Metrics Bar */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              40+
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Elmina Central Park Trees
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-teal-300 font-mono">
              1,142 kg
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Annual CO₂ Sequestered
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono">
              &lt;24h
            </div>
            <div className="text-xs text-slate-400 font-medium">
              AI Hazard Triage Window
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 font-mono">
              On-Chain
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Arbitrum Proof-of-Work
            </div>
          </div>
        </section>

        {/* Core Pillars / Features */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Four Pillars of Digital Urban Forestry
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Built to solve defect liability disputes, phantom contractor
              billing, and unverified sustainability reporting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 hover:border-emerald-500/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Leaf className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                1. Pre-Handover Quota Audits
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Incoming homeowners can independently audit developer green
                quotas before taking vacant possession, verifying planted
                species (*Hopea odorata*, *Tembusu*) against promises.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 hover:border-amber-500/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                2. Gemini 3.8 Flash Arborist Triage
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Residents snap hazard photos (fallen limbs, root heave, leaf
                scorch). Multimodal AI immediately classifies risk, calculates
                confidence, and sets mandatory contractor SLA resolution timers.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 hover:border-cyan-500/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                3. Arbitrum Sepolia Proof-of-Work
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Before closing work orders, contractors must upload photographic
                proof. Cryptographic keccak256 hashes are anchored on Arbitrum
                Sepolia to eliminate fraudulent municipal invoicing.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 hover:border-purple-500/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                4. GIS Operations Command Center
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Township operators monitor live canopy GIS layers across City of
                Elmina, track automated contractor deduction penalties, and
                export audit-ready ESG biomass telemetry.
              </p>
            </div>
          </div>
        </section>

        {/* Role Portal Manual Selector */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                Direct Role Access
              </h2>
              <p className="text-xs text-slate-400">
                Select any view manually to test or demonstrate specific flows:
              </p>
            </div>
            <span className="text-xs text-emerald-400 font-mono hidden sm:inline">
              5 Interfaces Ready
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <Link
              href="/app/explore"
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 transition-all group flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <Trees className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Mobile PWA
                </span>
              </div>
              <div>
                <div className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  Resident Explore & dMRV
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Pre-handover audit quota checker and carbon absorption ticker.
                </div>
              </div>
              <div className="text-xs text-emerald-400 flex items-center gap-1 font-medium pt-1">
                <span>Open /app/explore</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            <Link
              href="/app/hazards"
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/40 transition-all group flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Mobile PWA
                </span>
              </div>
              <div>
                <div className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                  Public Hazard Feed & AI Triage
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Citizen camera reporting with real-time 4-stage progression
                  timeline.
                </div>
              </div>
              <div className="text-xs text-amber-400 flex items-center gap-1 font-medium pt-1">
                <span>Open /app/hazards</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            <Link
              href="/app/maintenance"
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/40 transition-all group flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Mobile PWA
                </span>
              </div>
              <div>
                <div className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  Audited Maintenance Stream
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Before/after proof photos with Arbitrum Sepolia explorer
                  badges.
                </div>
              </div>
              <div className="text-xs text-cyan-400 flex items-center gap-1 font-medium pt-1">
                <span>Open /app/maintenance</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            <Link
              href="/contractor/tasks"
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/40 transition-all group flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
                  <HardHat className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Field Portal
                </span>
              </div>
              <div>
                <div className="text-sm font-semibold text-white group-hover:text-amber-200 transition-colors">
                  Contractor Task Execution
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Field worker queue requiring mandatory photographic proof
                  upload.
                </div>
              </div>
              <div className="text-xs text-amber-300 flex items-center gap-1 font-medium pt-1">
                <span>Open /contractor/tasks</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            <Link
              href="/admin"
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-purple-500/40 transition-all group flex flex-col justify-between space-y-3 sm:col-span-2 lg:col-span-2"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Operations Console
                </span>
              </div>
              <div>
                <div className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                  Township Operations Command Center
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Full widescreen dashboard with Mapbox GIS, contractor SLA
                  penalty tracking table, and instant ESG compliance report
                  export.
                </div>
              </div>
              <div className="text-xs text-purple-400 flex items-center gap-1 font-medium pt-1">
                <span>Open /admin</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 bg-slate-950/80 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Trees className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-200">TreeLedger</span>
            <span>• City of Elmina dMRV Platform</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://sepolia.arbiscan.io/address/0x685049b310922F6bc8d6FA17ddae010E13803701"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors flex items-center gap-1 font-mono text-[11px]"
            >
              <span>Contract: 0x6850...3701</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <span className="text-slate-500">
              SDP University Hackathon 2026
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
