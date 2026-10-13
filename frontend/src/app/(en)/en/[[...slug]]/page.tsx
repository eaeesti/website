import CmsPage, { cmsPageMetadata } from "@/components/CmsPage";

interface Props {
  params: Promise<{ slug?: string[] }>;
}

// Rendered on first visit and cached; see app/(et)/[[...slug]]/page.tsx.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props) {
  return cmsPageMetadata({ locale: "en", segments: (await params).slug });
}

export default async function EnglishPage({ params }: Props) {
  return <CmsPage locale="en" segments={(await params).slug} />;
}
