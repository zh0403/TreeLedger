"use client";

import { useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Brand } from "./ui/brand";
import { Navigation, NavigationLink } from "./ui/navigation";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigationId = useId();
  const menuButton = useRef<HTMLButtonElement>(null);
  return (
    <header className="site-header" data-menu-open={menuOpen} onKeyDown={event => {
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    }}>
      <Brand href="/#overview" className="wordmark" />
      <button ref={menuButton} type="button" className="site-menu-toggle" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls={navigationId} onClick={() => setMenuOpen(open => !open)}>{menuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}</button>
      <Navigation id={navigationId} label="Primary navigation" onClick={event => {
        if ((event.target as HTMLElement).closest("a")) setMenuOpen(false);
      }}>
        <NavigationLink href="/#record">The identity</NavigationLink>
        <NavigationLink href="/#intelligence">The township</NavigationLink>
        <NavigationLink href="/#ledger">The ledger</NavigationLink>
        <NavigationLink href="/#community">The community</NavigationLink>
        <NavigationLink href="/map">Live Map</NavigationLink>
      </Navigation>
    </header>
  );
}
