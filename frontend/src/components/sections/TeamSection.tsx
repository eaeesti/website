import { EnvelopeIcon } from "@heroicons/react/24/solid";
import type { StrapiTeamSection } from "@/types/generated/strapi";
import Anchor from "../elements/Anchor";
import BlocksContent from "../elements/BlocksContent";
import CopyEmail from "../elements/CopyEmail";
import Email from "../elements/Email";
import Button from "../elements/Button";
import SocialMediaIcon from "../elements/SocialMediaIcon";
import StrapiImage from "../elements/StrapiImage";

export default function TeamSection({ title, teamMembers }: StrapiTeamSection) {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        {title && (
          <h2 className="mb-12 text-center text-3xl font-extrabold tracking-tight text-balance text-primary-800">
            {title}
          </h2>
        )}
        <ul role="list" className="grid gap-x-12 gap-y-14 lg:grid-cols-2">
          {teamMembers.map((member) => (
            <li
              key={member.id}
              // Photo beside the text, except in narrow two-column layouts.
              className="flex flex-col gap-6 sm:flex-row lg:flex-col xl:flex-row"
            >
              {member.image && (
                // Beside the text it grows with a long bio, up to a 4:5 portrait.
                <div className="relative aspect-square w-48 flex-none overflow-hidden rounded-2xl bg-slate-100 sm:max-h-65 sm:w-52">
                  <StrapiImage
                    image={member.image}
                    fill
                    sizes="13rem"
                    className="object-cover object-[50%_25%]"
                  />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {member.name}
                </h3>
                {member.role && (
                  <p className="text-sm text-primary-700">{member.role}</p>
                )}
                <BlocksContent content={member.bio} className="prose-sm mt-4" />
                {member.button && (
                  <Button
                    className="mt-4"
                    text={member.button.text}
                    href={member.button.href}
                    type={member.button.type}
                    size={member.button.size ?? "sm"}
                    arrow={member.button.arrow}
                    newTab={member.button.newTab}
                    plausibleEvent={member.button.plausibleEvent}
                  />
                )}
                <div className="mt-4 flex gap-3 text-slate-400">
                  {member.email && (
                    <CopyEmail
                      address={member.email}
                      className="hover:text-primary-700"
                    >
                      <span className="sr-only">
                        <Email address={member.email} />
                      </span>
                      <EnvelopeIcon className="size-6" aria-hidden="true" />
                    </CopyEmail>
                  )}
                  {member.socialMediaLinks.map((link) => (
                    <Anchor
                      key={link.id}
                      href={link.href}
                      newTab
                      className="hover:text-primary-700"
                    >
                      <SocialMediaIcon type={link.type} />
                    </Anchor>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
