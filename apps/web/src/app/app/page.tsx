import type { Metadata } from "next";
import { ResidentHome } from "@/components/resident/resident-home";

export const metadata: Metadata = { title: "TreeLedger | Nature Explorer" };

export default function Page() {
  return <ResidentHome />;
}
