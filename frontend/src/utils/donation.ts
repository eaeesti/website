/**
 * Donations made on this site are processed by Anneta Targalt's backend
 * (`POST /api/donateExternal`), which records them and sends the donor to
 * Montonio or to their bank. See the external donation API documentation.
 */

export const DONATION_API_URL =
  process.env.NEXT_PUBLIC_DONATION_API_URL ??
  "https://strapi.annetatargalt.ee/api/donateExternal";

/** Anneta Targalt refuses amounts of 15 000 € or more. */
export const MAX_DONATION_CENTS = 1_500_000;

/**
 * Banks Anneta Targalt can build a standing order link for. Anyone else
 * chooses "other" and gets manual instructions instead.
 */
export const RECURRING_BANKS = [
  { value: "swedbank", label: "Swedbank" },
  { value: "lhv", label: "LHV" },
  { value: "seb", label: "SEB" },
] as const;

export type RecurringBank = (typeof RECURRING_BANKS)[number]["value"] | "other";

export type Frequency = "recurring" | "onetime";

export function isRecurringBank(value: string): value is RecurringBank {
  return (
    value === "other" || RECURRING_BANKS.some((bank) => bank.value === value)
  );
}

/**
 * Validates an Estonian personal ID code (isikukood): the format, and the
 * check digit as specified at https://et.wikipedia.org/wiki/Isikukood.
 */
export function validateIdCode(idCode: string): boolean {
  if (!/^[1-6]\d{2}[0-1]\d[0-3]\d{5}$/.test(idCode)) return false;

  const digits = Array.from(idCode).map(Number);
  const checkDigit = digits[10];
  const firstTen = digits.slice(0, 10);

  const weights1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1];
  const modulo1 =
    firstTen.reduce((sum, digit, i) => sum + digit * weights1[i], 0) % 11;
  if (modulo1 < 10) return checkDigit === modulo1;

  const weights2 = [3, 4, 5, 6, 7, 8, 9, 1, 2, 3];
  const modulo2 =
    firstTen.reduce((sum, digit, i) => sum + digit * weights2[i], 0) % 11;
  return checkDigit === modulo2 % 10;
}

/**
 * Parses an amount typed in euros ("25", "12,50", "12.5") into cents.
 * Returns null for anything that isn't a valid donation amount.
 */
export function parseEuroAmount(input: string): number | null {
  const normalized = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  if (cents < 100 || cents >= MAX_DONATION_CENTS) return null;
  return cents;
}

export interface DonationFormValues {
  frequency: Frequency;
  amountCents: number;
  firstName: string;
  lastName: string;
  email: string;
  idCode: string;
  bank: RecurringBank;
  company: { name: string; code: string } | null;
}

/** The request body for Anneta Targalt's donateExternal endpoint. */
export function donationRequestBody(
  values: DonationFormValues,
  returnUrl: string,
): Record<string, string | number> {
  const common = {
    type: values.frequency,
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    idCode: values.idCode.trim(),
    amount: values.amountCents,
    returnUrl,
    ...(values.company
      ? {
          companyName: values.company.name.trim(),
          companyCode: values.company.code.trim(),
        }
      : {}),
  };

  return values.frequency === "recurring"
    ? { ...common, bank: values.bank }
    : { ...common, paymentMethod: "paymentInitiation" };
}
