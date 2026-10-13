import type { StrapiBlogPost } from "@/types/generated/strapi";
import PostCard from "./PostCard";

export default function PostGrid({
  posts,
  dateLocale,
}: {
  posts: StrapiBlogPost[];
  dateLocale: string | null | undefined;
}) {
  return (
    <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.documentId} post={post} dateLocale={dateLocale} />
      ))}
    </div>
  );
}
