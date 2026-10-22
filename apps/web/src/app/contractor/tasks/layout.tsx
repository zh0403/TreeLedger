import React from 'react';
import { ServiceWorkspace } from '@/components/workspaces/service-workspace';

export default function ContractorAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ServiceWorkspace role="contractor">{children}</ServiceWorkspace>;
}
