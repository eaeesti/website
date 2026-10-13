import type { StrapiDonationSection } from "@/types/generated/strapi";
import BlocksContent from "../elements/BlocksContent";
import DonationForm from "./DonationForm";
import type { SectionContext } from "./types";

/**
 * A donation form whose donations are processed by Anneta Targalt, which
 * forwards them to Montonio or the donor's bank.
 */
export default function DonationSection({
  title,
  description,
  defaultFrequency,
  recurringLabel,
  onetimeLabel,
  amounts,
  otherAmountLabel,
  customAmountLabel,
  firstNameLabel,
  lastNameLabel,
  emailLabel,
  idCodeLabel,
  idCodeDescription,
  bankLabel,
  otherBankLabel,
  companyLabel,
  companyNameLabel,
  companyCodeLabel,
  submitLabel,
  invalidIdCodeText,
  invalidAmountText,
  otherBankInstructions,
  returnPath,
  context,
}: StrapiDonationSection & { context: SectionContext }) {
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
        <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 first:mt-0 sm:p-10">
          <DonationForm
            defaultFrequency={defaultFrequency ?? "recurring"}
            amounts={amounts.map((amount) => amount.amount)}
            returnPath={returnPath}
            labels={{
              recurring: recurringLabel ?? "Monthly donation",
              onetime: onetimeLabel ?? "One-time donation",
              otherAmount: otherAmountLabel ?? "Other amount",
              customAmount: customAmountLabel ?? "Amount (EUR)",
              firstName: firstNameLabel ?? "First name",
              lastName: lastNameLabel ?? "Last name",
              email: emailLabel ?? "Email",
              idCode: idCodeLabel ?? "Personal ID code",
              idCodeDescription: idCodeDescription ?? null,
              bank: bankLabel ?? "Bank",
              otherBank: otherBankLabel ?? "Other bank",
              company: companyLabel ?? "I'm donating on behalf of a company",
              companyName: companyNameLabel ?? "Company name",
              companyCode: companyCodeLabel ?? "Registry code",
              submit: submitLabel ?? "Donate",
              invalidIdCode:
                invalidIdCodeText ?? "Check your personal ID code.",
              invalidAmount:
                invalidAmountText ??
                "Enter an amount between 1 and 15 000 euros.",
              error: context.global?.errorText ?? "Something went wrong",
            }}
            otherBankInstructions={
              <BlocksContent content={otherBankInstructions} />
            }
          />
        </div>
      </div>
    </section>
  );
}
