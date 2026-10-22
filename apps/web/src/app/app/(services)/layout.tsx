import React from 'react';
import { MobileShell } from '@/components/mobile/MobileShell';

export default function ResidentAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MobileShell role="resident">{children}</MobileShell>;
}
