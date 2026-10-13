import CategoryPage, { categoryMetadata } from "@/components/blog/CategoryPage";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props) {
  return categoryMetadata({
    slug: decodeURIComponent((await params).slug),
    page: 1,
  });
}

export default async function CategoryRoute({ params }: Props) {
  return (
    <CategoryPage slug={decodeURIComponent((await params).slug)} page={1} />
  );
}
