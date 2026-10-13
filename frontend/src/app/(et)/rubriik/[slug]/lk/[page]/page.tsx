import { notFound, permanentRedirect } from "next/navigation";
import CategoryPage, { categoryMetadata } from "@/components/blog/CategoryPage";
import { categoryPath, parsePageNumber } from "@/utils/blog";

interface Props {
  params: Promise<{ slug: string; page: string }>;
}

export function generateStaticParams() {
  return [];
}

async function resolve(params: Props["params"]) {
  const { slug, page } = await params;
  return { slug: decodeURIComponent(slug), page: parsePageNumber(page) };
}

export async function generateMetadata({ params }: Props) {
  const { slug, page } = await resolve(params);
  return page ? categoryMetadata({ slug, page }) : {};
}

export default async function CategoryListingRoute({ params }: Props) {
  const { slug, page } = await resolve(params);
  if (!page) notFound();
  if (page === 1) permanentRedirect(categoryPath(slug));
  return <CategoryPage slug={slug} page={page} />;
}
