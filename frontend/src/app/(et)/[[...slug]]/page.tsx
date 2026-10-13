import CmsPage, { cmsPageMetadata } from "@/components/CmsPage";

interface Props {
  params: Promise<{ slug?: string[] }>;
}

// Nothing is rendered at build time (the build never talks to Strapi); each
// page is rendered on its first visit and then served from the cache.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props) {
  return cmsPageMetadata({ locale: "et", segments: (await params).slug });
}

export default async function EstonianPage({ params }: Props) {
  return <CmsPage locale="et" segments={(await params).slug} />;
}
