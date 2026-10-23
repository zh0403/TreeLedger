import { Brand } from "./ui/brand";
import { Navigation, NavigationLink } from "./ui/navigation";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Brand href="/#overview" className="wordmark" />
      <Navigation label="Primary navigation">
        <NavigationLink href="/#record">The identity</NavigationLink>
        <NavigationLink href="/#intelligence">The township</NavigationLink>
        <NavigationLink href="/#ledger">The ledger</NavigationLink>
        <NavigationLink href="/#community">The community</NavigationLink>
        <NavigationLink href="/map">Live Map</NavigationLink>
      </Navigation>
    </header>
  );
}
