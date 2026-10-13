import type { StrapiBlogPostsSection } from "@/types/generated/strapi";
import { getCategories, getPosts } from "@/utils/strapi";
import CategoryLinks from "../blog/CategoryLinks";
import Button from "../elements/Button";
import Pagination from "../elements/Pagination";
import PostGrid from "../blog/PostGrid";
import type { SectionContext } from "./types";

export default async function BlogPostsSection({
  title,
  postsPerPage,
  showPagination,
  showCategories,
  allPostsButton,
  context,
}: StrapiBlogPostsSection & { context: SectionContext }) {
  const page = showPagination ? context.pageNumber : 1;
  const [{ posts, pagination }, categories] = await Promise.all([
    getPosts({ page, pageSize: postsPerPage ?? 12 }),
    showCategories ? getCategories() : Promise.resolve([]),
  ]);
  if (posts.length === 0) return null;

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        {title && (
          <h2 className="mb-12 text-center text-3xl font-extrabold tracking-tight text-balance text-primary-800">
            {title}
          </h2>
        )}
        <CategoryLinks
          categories={categories}
          className="mb-12 sm:justify-center"
        />
        <PostGrid posts={posts} dateLocale={context.global?.dateLocale} />
        {showPagination && (
          <Pagination
            basePath={context.path}
            page={pagination.page}
            pageCount={pagination.pageCount}
            previousText={context.global?.previousPageText ?? null}
            nextText={context.global?.nextPageText ?? null}
          />
        )}
        {allPostsButton && (
          <div className="mt-12 flex justify-center">
            <Button
              text={allPostsButton.text}
              href={allPostsButton.href}
              type={allPostsButton.type}
              size={allPostsButton.size}
              arrow={allPostsButton.arrow}
              newTab={allPostsButton.newTab}
              plausibleEvent={allPostsButton.plausibleEvent}
            />
          </div>
        )}
      </div>
    </section>
  );
}
