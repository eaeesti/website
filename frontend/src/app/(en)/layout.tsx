import "../globals.css";
import type { ReactNode } from "react";
import RootHtml from "@/components/RootHtml";
import { layoutMetadata } from "@/utils/layout-metadata";

export function generateMetadata() {
  return layoutMetadata("en");
}

export default function EnglishLayout({ children }: { children: ReactNode }) {
  return <RootHtml locale="en">{children}</RootHtml>;
}
