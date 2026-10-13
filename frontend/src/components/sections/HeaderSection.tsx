import type { StrapiHeaderSection } from "@/types/generated/strapi";
import { getCategories } from "@/utils/strapi";
import CategoryLinks from "../blog/CategoryLinks";
import PageHeader from "../layout/PageHeader";
import type { SectionContext } from "./types";

export default async function HeaderSection({
  title,
  description,
  image,
  buttons,
  breadcrumbs,
  showBlogCategories,
  context,
}: StrapiHeaderSection & { context: SectionContext }) {
  const categories = showBlogCategories ? await getCategories() : [];
  return (
    <PageHeader
      title={title}
      description={description}
      image={image}
      breadcrumbs={breadcrumbs}
      buttons={buttons}
      priority={context.isFirst}
    >
      <CategoryLinks categories={categories} dark className="mt-8" />
    </PageHeader>
  );
}
