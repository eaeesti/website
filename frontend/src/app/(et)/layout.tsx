import "../globals.css";
import type { ReactNode } from "react";
import RootHtml from "@/components/RootHtml";
import { layoutMetadata } from "@/utils/layout-metadata";

export function generateMetadata() {
  return layoutMetadata("et");
}

export default function EstonianLayout({ children }: { children: ReactNode }) {
  return <RootHtml locale="et">{children}</RootHtml>;
}
