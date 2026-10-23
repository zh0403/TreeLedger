import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Brand } from "@/components/ui/brand";
import TownshipTransparencyExplorer from "@/components/home/TownshipTransparencyExplorer";

export default function LiveMapPage() {
  return (
    <div className="landing min-h-screen flex flex-col bg-[var(--forest-950)] text-[var(--foreground)]">
      <a className="skip-link" href="#live-map-main">
        Skip to live map
      </a>
      <SiteHeader />
      <main
        id="live-map-main"
        className="flex-1 w-full px-[var(--page-gutter)] pt-28 pb-16 bg-[var(--forest-950)] border-b border-[var(--border)]"
      >
        <div className="max-w-7xl mx-auto rounded-[var(--radius-panel)] bg-[var(--surface)]/35 border border-[var(--border)] p-4 sm:p-6 lg:p-8 shadow-[var(--shadow-panel)]">
          <TownshipTransparencyExplorer />
        </div>
      </main>
      <footer className="site-footer">
        <Brand href="/" className="wordmark" />
        <p>Urban forestry &amp; municipal SLA verification.</p>
        <Link href="/#overview">
          Back to the story <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </footer>
    </div>
  );
}
