import { ArrowUpRight, Leaf } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="site-header">
      <a href="#overview" className="wordmark" aria-label="TreeLedger home"><span className="brand-symbol"><Leaf size={22} strokeWidth={1.6} aria-hidden="true" /></span>TreeLedger</a>
      <nav aria-label="Primary navigation"><a href="#record">The identity</a><a href="#intelligence">The township</a><a href="#community">The community</a></nav>
      <a className="header-link" href="#workspaces">Explore platform <ArrowUpRight size={15} aria-hidden="true" /></a>
    </header>
  );
}
