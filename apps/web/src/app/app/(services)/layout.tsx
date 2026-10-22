import React from 'react';
import { ServiceWorkspace } from '@/components/workspaces/service-workspace';

export default function ResidentAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ServiceWorkspace role="resident">{children}</ServiceWorkspace>;
}
