import { EnvelopeIcon } from "@heroicons/react/24/outline";
import type { StrapiContactSection } from "@/types/generated/strapi";
import BlocksContent from "../elements/BlocksContent";
import CopyEmail from "../elements/CopyEmail";
import Email from "../elements/Email";
import ContactForm from "./ContactForm";
import type { SectionContext } from "./types";

export default function ContactSection({
  title,
  description,
  contactEmail,
  nameLabel,
  emailLabel,
  messageLabel,
  sendLabel,
  successTitle,
  successDescription,
  context,
}: StrapiContactSection & { context: SectionContext }) {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl">
        {title && (
          <h2 className="text-3xl font-extrabold tracking-tight text-balance text-primary-800">
            {title}
          </h2>
        )}
        <BlocksContent
          content={description}
          className={title ? "mt-6" : undefined}
        />
        {contactEmail && (
          <p className="mt-6 flex items-center gap-3 text-slate-700">
            <EnvelopeIcon
              className="size-6 text-primary-600"
              aria-hidden="true"
            />
            <CopyEmail
              address={contactEmail}
              className="font-semibold hover:text-primary-700"
            >
              <Email address={contactEmail} />
            </CopyEmail>
          </p>
        )}
        <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 sm:p-10">
          <ContactForm
            labels={{
              name: nameLabel ?? "Name",
              email: emailLabel ?? "Email",
              message: messageLabel ?? "Message",
              send: sendLabel ?? "Send",
              successTitle: successTitle ?? "",
              successDescription: successDescription ?? "",
              error: context.global?.errorText ?? "Something went wrong",
            }}
          />
        </div>
      </div>
    </section>
  );
}
