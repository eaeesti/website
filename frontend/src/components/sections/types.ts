import type { StrapiGlobal } from "@/types/generated/strapi";
import type { Locale } from "@/utils/locale";

/** What every section knows about the page it's on. */
export interface SectionContext {
  locale: Locale;
  global: StrapiGlobal | null;
  /** The page's own path, e.g. "/blogi" (without any /lk/2 suffix). */
  path: string;
  /** For paginated sections: which listing page is being shown. */
  pageNumber: number;
  /** The section is the first on the page, so its image should load first. */
  isFirst: boolean;
}
