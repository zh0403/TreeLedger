import { ArrowUpRight } from "lucide-react";
import { Brand } from "./ui/brand";
import { Navigation, NavigationLink } from "./ui/navigation";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Brand href="/#overview" className="wordmark" />
      <Navigation label="Primary navigation">
        <NavigationLink href="/#record">The identity</NavigationLink>
        <NavigationLink href="/#intelligence">The township</NavigationLink>
        <NavigationLink href="/#community">The community</NavigationLink>
        <NavigationLink href="/map">Live Map</NavigationLink>
      </Navigation>
      <a className="header-link" href="/#workspaces">
        Explore platform <ArrowUpRight size={15} aria-hidden="true" />
      </a>
    </header>
  );
}
