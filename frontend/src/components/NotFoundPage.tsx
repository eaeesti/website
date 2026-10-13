import type { Locale } from "@/utils/locale";
import { pagePath } from "@/utils/locale";
import { getGlobal } from "@/utils/strapi";
import BlocksContent from "./elements/BlocksContent";
import SiteShell from "./layout/SiteShell";
import ButtonGroup from "./sections/ButtonGroup";

export default async function NotFoundPage({ locale }: { locale: Locale }) {
  const global = await getGlobal(locale).catch(() => null);
  const content = global?.notFoundPage;

  return (
    <SiteShell global={global} locale={locale} path={pagePath("/", locale)}>
      <div className="grid flex-1 place-items-center px-6 py-24 sm:py-32">
        <div className="max-w-2xl text-center">
          <p className="text-base font-semibold text-primary-600">404</p>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-primary-800 sm:text-5xl">
            {content?.title ??
              (locale === "et" ? "Lehte ei leitud" : "Page not found")}
          </h1>
          <BlocksContent
            content={content?.description}
            className="mx-auto mt-6"
          />
          <ButtonGroup
            buttons={content?.buttons}
            className="mt-10 justify-center"
          />
        </div>
      </div>
    </SiteShell>
  );
}
