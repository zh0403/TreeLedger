import { Navigation, NavigationLink } from "./ui/navigation";
import { ButtonLink } from "./ui/button-link";

export function MainServicesLinks() {
  return <Navigation label="Integrated application services" className="service-navigation">
    <NavigationLink href="/app/explore">Tree registry</NavigationLink>
    <NavigationLink href="/app/hazards">Hazard reporting</NavigationLink>
    <NavigationLink href="/app/maintenance">Maintenance records</NavigationLink>
    <NavigationLink href="/contractor/tasks">Contractor tasks</NavigationLink>
    <NavigationLink href="/admin/operations">Operations prototype</NavigationLink>
  </Navigation>;
}

export function MainPrototypeNotice({ home, integrated = false }: { home: string; integrated?: boolean }) {
  return <aside aria-label="Prototype data disclosure" className="prototype-notice">
    {!integrated && <ButtonLink href={home} variant="text">Back to workspace</ButtonLink>}
    <p><strong>{integrated ? "Service data disclosure." : "Prototype services from main."}</strong> These views may use sample data, local-only updates, simulated AI results, and illustrative transaction hashes when services are unavailable. Displayed badges are not independent proof of blockchain verification.</p>
  </aside>;
}
