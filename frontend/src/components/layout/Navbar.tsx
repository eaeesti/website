import type { StrapiGlobal } from "@/types/generated/strapi";
import type { Locale } from "@/utils/locale";
import { pagePath } from "@/utils/locale";
import Anchor from "../elements/Anchor";
import Button from "../elements/Button";
import StrapiImage from "../elements/StrapiImage";
import MobileMenu from "./MobileMenu";
import NavDropdown from "./NavDropdown";
import NavScroll from "./NavScroll";

interface NavbarProps {
  global: StrapiGlobal | null;
  locale: Locale;
  /** The same page in the other language, if there is one. */
  languageSwitchHref: string;
}

export default function Navbar({
  global,
  locale,
  languageSwitchHref,
}: NavbarProps) {
  const navbar = global?.navbar;
  const links = navbar?.links ?? [];
  const homeHref = pagePath("/", locale);
  const siteName = global?.siteName ?? "Efektiivne Altruism Eesti";

  // Big at the top of the page, smaller once scrolled (on wide screens).
  const logo = navbar?.logo ? (
    <StrapiImage
      image={navbar.logo}
      alt={siteName}
      eager
      sizes="24rem"
      className="h-10 w-auto transition-[height] duration-300 lg:h-[70px] lg:group-data-scrolled/nav:h-10"
    />
  ) : (
    <span className="text-lg font-extrabold tracking-tight lg:text-2xl">
      {siteName}
    </span>
  );

  return (
    <NavScroll>
      {/* Transparent over the page's dark header until scrolled; see globals.css for pages without one. */}
      <header className="site-nav text-white transition duration-300 group-data-scrolled/nav:bg-primary-800 group-data-scrolled/nav:shadow-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-x-6 px-4 py-3 sm:px-6 lg:px-8">
          <Anchor
            href={homeHref}
            className="-m-1.5 rounded-md p-1.5 focus-visible:outline-2 focus-visible:outline-white"
          >
            {logo}
          </Anchor>

          <div className="hidden items-center gap-x-1 lg:flex">
            {links.map((link) =>
              link.children.length > 0 ? (
                <NavDropdown key={link.id} link={link} />
              ) : (
                <Anchor
                  key={link.id}
                  href={link.href}
                  newTab={link.newTab}
                  externalIcon
                  className="flex items-center rounded-md px-3 py-2 text-sm font-semibold tracking-wide uppercase hover:bg-white/10"
                >
                  {link.text}
                </Anchor>
              ),
            )}
            {global?.languageSwitchText && (
              <Anchor
                href={languageSwitchHref}
                hrefLang={locale === "et" ? "en" : "et"}
                className="rounded-md px-3 py-2 text-sm font-semibold text-primary-200 hover:bg-white/10"
              >
                {global.languageSwitchText}
              </Anchor>
            )}
            {navbar?.ctaButton && (
              <Button
                className="ml-2"
                text={navbar.ctaButton.text}
                href={navbar.ctaButton.href}
                type={navbar.ctaButton.type ?? "white"}
                size={navbar.ctaButton.size}
                arrow={navbar.ctaButton.arrow}
                newTab={navbar.ctaButton.newTab}
                plausibleEvent={navbar.ctaButton.plausibleEvent}
              />
            )}
          </div>

          <MobileMenu
            logo={logo}
            homeHref={homeHref}
            links={links}
            ctaButton={navbar?.ctaButton ?? null}
            languageSwitch={
              global?.languageSwitchText
                ? { text: global.languageSwitchText, href: languageSwitchHref }
                : null
            }
            openText={locale === "et" ? "Ava menüü" : "Open menu"}
            closeText={global?.closeText ?? "Close"}
          />
        </nav>
      </header>
    </NavScroll>
  );
}
