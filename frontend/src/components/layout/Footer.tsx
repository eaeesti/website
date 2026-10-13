import type { StrapiGlobal } from "@/types/generated/strapi";
import Anchor from "../elements/Anchor";
import CopyEmail from "../elements/CopyEmail";
import Email from "../elements/Email";
import SocialMediaIcon from "../elements/SocialMediaIcon";
import StrapiImage from "../elements/StrapiImage";

export default function Footer({ global }: { global: StrapiGlobal | null }) {
  const footer = global?.footer;
  if (!footer) return null;

  return (
    <footer
      className="bg-primary-900 text-white"
      aria-labelledby="footer-heading"
    >
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6 lg:px-8 lg:pt-20">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12">
          <div className="flex flex-col items-start gap-6">
            {footer.logo && (
              <StrapiImage
                image={footer.logo}
                alt={global.siteName}
                className="h-10 w-auto"
              />
            )}
            {footer.text && (
              <p className="max-w-sm text-sm leading-6 whitespace-pre-line text-primary-100">
                {footer.text}
              </p>
            )}
            {footer.email && (
              <CopyEmail
                address={footer.email}
                className="text-sm font-semibold hover:text-primary-200"
              >
                <Email address={footer.email} />
              </CopyEmail>
            )}
            {footer.socialMediaLinks.length > 0 && (
              <div className="flex gap-4">
                {footer.socialMediaLinks.map((link) => (
                  <Anchor
                    key={link.id}
                    href={link.href}
                    newTab
                    className="text-primary-200 hover:text-white"
                  >
                    <SocialMediaIcon type={link.type} />
                  </Anchor>
                ))}
              </div>
            )}
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-4 lg:mt-0">
            {footer.columns.map((column) => (
              <div key={column.id}>
                {column.title && (
                  <h3 className="text-sm font-bold tracking-wider uppercase">
                    {column.title}
                  </h3>
                )}
                <ul role="list" className="mt-4 space-y-2">
                  {column.links.map((link) => (
                    <li key={link.id}>
                      <Anchor
                        href={link.href}
                        newTab={link.newTab}
                        externalIcon
                        className="text-sm text-primary-100 hover:text-white"
                      >
                        {link.text}
                      </Anchor>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        {footer.bottomText && (
          <p className="mt-12 border-t border-white/10 pt-8 text-xs text-primary-200">
            {footer.bottomText}
          </p>
        )}
      </div>
    </footer>
  );
}
