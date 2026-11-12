import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BLOG_PATH, categoryPath, listingPagePath } from "@/utils/blog";
import { buildPageMetadata, leadImage } from "@/utils/seo";
import {
  getCategories,
  getCategory,
  getGlobal,
  getPage,
  getPosts,
} from "@/utils/strapi";
import Pagination from "../elements/Pagination";
import PageHeader from "../layout/PageHeader";
import SiteShell from "../layout/SiteShell";
import CategoryLinks from "./CategoryLinks";
import PostGrid from "./PostGrid";

const POSTS_PER_PAGE = 12;

interface CategoryPageProps {
  slug: string;
  page: number;
}

/** All posts in one category, at /rubriik/slug and /rubriik/slug/lk/N. */
export default async function CategoryPage({ slug, page }: CategoryPageProps) {
  const basePath = categoryPath(slug);

  const [global, category, categories, listing, blogPage] = await Promise.all([
    getGlobal("et"),
    getCategory(slug),
    getCategories(),
    getPosts({ page, pageSize: POSTS_PER_PAGE, categorySlug: slug }),
    getPage(BLOG_PATH.slice(1), "et"),
  ]);
  if (!category) notFound();
  if (page > 1 && page > listing.pagination.pageCount) notFound();
  // Category pages share the blog page's header photo.
  const blogHeader = blogPage?.sections.find(
    (section) => section.__component === "sections.header-section",
  );

  return (
    <SiteShell
      global={global}
      locale="et"
      path={listingPagePath(basePath, page)}
    >
      <PageHeader
        title={category.name}
        description={
          category.description
            ? [
                {
                  type: "paragraph",
                  children: [{ type: "text", text: category.description }],
                },
              ]
            : null
        }
        image={blogHeader?.image}
        breadcrumbs={[{ title: global?.blogTitle ?? "Blogi", href: BLOG_PATH }]}
        priority
      >
        <CategoryLinks
          categories={categories}
          activeSlug={slug}
          dark
          className="mt-8"
        />
      </PageHeader>
      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <PostGrid
            posts={listing.posts}
            dateLocale={global?.dateLocale}
            headingLevel={2}
          />
          <Pagination
            basePath={basePath}
            page={listing.pagination.page}
            pageCount={listing.pagination.pageCount}
            previousText={global?.previousPageText ?? null}
            nextText={global?.nextPageText ?? null}
          />
        </div>
      </section>
    </SiteShell>
  );
}

export async function categoryMetadata({
  slug,
  page,
}: CategoryPageProps): Promise<Metadata> {
  const [global, category, blogPage] = await Promise.all([
    getGlobal("et"),
    getCategory(slug),
    getPage(BLOG_PATH.slice(1), "et"),
  ]);
  if (!category) return {};
  return buildPageMetadata(global, {
    locale: "et",
    title: category.name,
    description: category.description,
    // The blog page's header photo, which category pages show too.
    image: leadImage(blogPage?.sections),
    path: listingPagePath(categoryPath(slug), page),
  });
}
