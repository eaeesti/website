import type { StrapiBlogPost } from "@/types/generated/strapi";
import PostCard from "./PostCard";

export default function PostGrid({
  posts,
  dateLocale,
  headingLevel = 3,
}: {
  posts: StrapiBlogPost[];
  dateLocale: string | null | undefined;
  /** 2 when nothing on the page between the h1 and the grid is an h2. */
  headingLevel?: 2 | 3;
}) {
  return (
    <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard
          key={post.documentId}
          post={post}
          dateLocale={dateLocale}
          headingLevel={headingLevel}
        />
      ))}
    </div>
  );
}
