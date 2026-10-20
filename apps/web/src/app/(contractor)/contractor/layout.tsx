import React from 'react';
import { MobileShell } from '@/components/mobile/MobileShell';

export default function ContractorAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MobileShell role="contractor">{children}</MobileShell>;
}
