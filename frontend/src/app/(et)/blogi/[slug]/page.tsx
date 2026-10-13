import BlogPostPage, { blogPostMetadata } from "@/components/blog/BlogPostPage";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props) {
  return blogPostMetadata(decodeURIComponent((await params).slug));
}

export default async function BlogPostRoute({ params }: Props) {
  return <BlogPostPage slug={decodeURIComponent((await params).slug)} />;
}
