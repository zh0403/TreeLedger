import type { Metadata } from "next";
import { AdminCommandCenter } from "@/components/admin/admin-command-center";

export const metadata: Metadata = { title: "TreeLedger | Township operations" };

export default function Page() {
  return <AdminCommandCenter view="overview" />;
}
