'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Trees, AlertTriangle, ShieldCheck, HardHat, Leaf } from 'lucide-react';
import { MainPrototypeNotice } from '@/components/main-services';
import { Brand } from '@/components/ui/brand';
import { Navigation, NavigationLink } from '@/components/ui/navigation';
import { ButtonLink } from '@/components/ui/button-link';

interface MobileShellProps {
  children: React.ReactNode;
  role?: 'resident' | 'contractor';
}

const SERVICE_TABS = [
  { href: '/app/explore', label: 'Explore', sublabel: 'Trees & carbon', icon: Trees },
  { href: '/app/hazards', label: 'Hazards', sublabel: 'Report & track', icon: AlertTriangle },
  { href: '/app/maintenance', label: 'Maintenance', sublabel: 'Care records', icon: ShieldCheck },
  { href: '/contractor/tasks', label: 'Tasks', sublabel: 'Contractor', icon: HardHat },
];

export function MobileShell({ children, role = 'resident' }: MobileShellProps) {
  const pathname = usePathname();
  return <div className="service-shell legacy-app" data-theme="dark">
    <div className="service-shell-inner">
      <header className="service-header">
        <Brand href={role === 'resident' ? '/app' : '/contractor'} subtitle="City of Elmina · Service preview" />
        <ButtonLink href={role === 'resident' ? '/contractor/tasks' : '/app/explore'} variant="secondary" className="service-role-link" title={role === 'resident' ? 'Switch to Contractor Work Order Queue' : 'Switch to Resident Stewardship App'}>
          {role === 'resident' ? <HardHat size={16} strokeWidth={1.5} aria-hidden="true" /> : <Leaf size={16} strokeWidth={1.5} aria-hidden="true" />}
          <span>{role === 'resident' ? 'Contractor' : 'Resident PWA'}</span>
        </ButtonLink>
      </header>
      <MainPrototypeNotice home={role === 'resident' ? '/app' : '/contractor'} />
      <main>{children}</main>
      <Navigation label="Mobile Bottom Navigation" className="service-tabs">
        {SERVICE_TABS.map(tab => {
          const Icon = tab.icon;
          return <NavigationLink key={tab.href} href={tab.href} active={pathname === tab.href || pathname.startsWith(tab.href + '/')}>
            <Icon size={19} strokeWidth={1.5} aria-hidden="true" />
            <span>{tab.label}</span><small>{tab.sublabel}</small>
          </NavigationLink>;
        })}
      </Navigation>
    </div>
  </div>;
}
