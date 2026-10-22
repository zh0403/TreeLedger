import type { Metadata } from "next";
import { FieldWorkspace } from "@/components/contractor/field-workspace";

export const metadata: Metadata = { title: "TreeLedger | Field workspace" };

export default function Page() {
  return <FieldWorkspace />;
}
