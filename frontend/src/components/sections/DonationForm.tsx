"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  DONATION_API_URL,
  RECURRING_BANKS,
  donationRequestBody,
  isRecurringBank,
  parseEuroAmount,
  validateIdCode,
  type Frequency,
  type RecurringBank,
} from "@/utils/donation";
import { classes } from "@/utils/react";
import { buttonClasses } from "../elements/Button";

interface DonationFormProps {
  defaultFrequency: Frequency;
  /** Preset amounts in euros. */
  amounts: number[];
  /** Where the donor lands after paying, e.g. "/annetatud". */
  returnPath: string;
  labels: {
    recurring: string;
    onetime: string;
    otherAmount: string;
    customAmount: string;
    firstName: string;
    lastName: string;
    email: string;
    idCode: string;
    idCodeDescription: string | null;
    bank: string;
    otherBank: string;
    company: string;
    companyName: string;
    companyCode: string;
    submit: string;
    invalidIdCode: string;
    invalidAmount: string;
    error: string;
  };
  /** Shown after a monthly donation set up with a bank we can't link to. */
  otherBankInstructions: ReactNode;
}

const OTHER = "other";

const inputClass =
  "mt-2 block w-full rounded-md border-0 px-3.5 py-2 text-slate-900 shadow-sm ring-1 ring-slate-300 ring-inset focus:ring-2 focus:ring-primary-600 focus:ring-inset sm:text-sm sm:leading-6";
const labelClass = "block text-sm font-semibold text-slate-900";

function Choice({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label
      className={classes(
        "flex cursor-pointer items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold ring-1 transition has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary-600",
        checked
          ? "bg-primary-700 text-white ring-primary-700"
          : "bg-white text-slate-800 ring-slate-300 hover:bg-primary-50",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      {children}
    </label>
  );
}

export default function DonationForm({
  defaultFrequency,
  amounts,
  returnPath,
  labels,
  otherBankInstructions,
}: DonationFormProps) {
  const [frequency, setFrequency] = useState<Frequency>(defaultFrequency);
  const [amountChoice, setAmountChoice] = useState(
    amounts.length > 0 ? String(amounts[0]) : OTHER,
  );
  const [customAmount, setCustomAmount] = useState("");
  const [bank, setBank] = useState<RecurringBank>("swedbank");
  const [fromCompany, setFromCompany] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "otherBank">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const field = (name: string) => String(form.get(name) ?? "");

    const amountCents =
      amountChoice === OTHER
        ? parseEuroAmount(customAmount)
        : Number(amountChoice) * 100;
    if (!amountCents) {
      setError(labels.invalidAmount);
      return;
    }
    if (!validateIdCode(field("idCode").trim())) {
      setError(labels.invalidIdCode);
      return;
    }

    setError(null);
    setStatus("sending");
    try {
      const response = await fetch(DONATION_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          donationRequestBody(
            {
              frequency,
              amountCents,
              firstName: field("firstName"),
              lastName: field("lastName"),
              email: field("email"),
              idCode: field("idCode"),
              bank,
              company: fromCompany
                ? { name: field("companyName"), code: field("companyCode") }
                : null,
            },
            `${window.location.origin}${returnPath}`,
          ),
        ),
      });
      const data: unknown = await response.json().catch(() => null);
      const redirectURL =
        data && typeof data === "object" && "redirectURL" in data
          ? String(data.redirectURL ?? "")
          : null;

      if (!response.ok || redirectURL === null) {
        const message =
          data &&
          typeof data === "object" &&
          "error" in data &&
          data.error &&
          typeof data.error === "object" &&
          "message" in data.error
            ? String(data.error.message)
            : `HTTP ${response.status}`;
        throw new Error(message);
      }

      if (redirectURL) {
        // On to Montonio, or to the bank's standing order form.
        window.location.assign(redirectURL);
        return;
      }
      // A monthly donation with a bank there is no standing order link for.
      setStatus("otherBank");
    } catch (caught: unknown) {
      setStatus("idle");
      setError(
        `${labels.error}${caught instanceof Error ? ` (${caught.message})` : ""}`,
      );
    }
  }

  if (status === "otherBank") {
    return <div aria-live="polite">{otherBankInstructions}</div>;
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="sr-only">{labels.recurring}</legend>
        <Choice
          name="frequency"
          value="recurring"
          checked={frequency === "recurring"}
          onChange={() => setFrequency("recurring")}
        >
          {labels.recurring}
        </Choice>
        <Choice
          name="frequency"
          value="onetime"
          checked={frequency === "onetime"}
          onChange={() => setFrequency("onetime")}
        >
          {labels.onetime}
        </Choice>
      </fieldset>

      <fieldset>
        <legend className="sr-only">{labels.customAmount}</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {amounts.map((amount) => (
            <Choice
              key={amount}
              name="amount"
              value={String(amount)}
              checked={amountChoice === String(amount)}
              onChange={setAmountChoice}
            >
              {amount} €
            </Choice>
          ))}
          <Choice
            name="amount"
            value={OTHER}
            checked={amountChoice === OTHER}
            onChange={setAmountChoice}
          >
            {labels.otherAmount}
          </Choice>
        </div>
        {amountChoice === OTHER && (
          <div className="mt-4">
            <label htmlFor="donation-amount" className={labelClass}>
              {labels.customAmount}
            </label>
            <input
              id="donation-amount"
              inputMode="decimal"
              autoComplete="off"
              required
              value={customAmount}
              onChange={(event) => setCustomAmount(event.target.value)}
              className={inputClass}
            />
          </div>
        )}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="donation-first-name" className={labelClass}>
            {labels.firstName}
          </label>
          <input
            id="donation-first-name"
            name="firstName"
            type="text"
            // Valid per the HTML spec; oxlint's list of tokens lacks it.
            // oxlint-disable-next-line jsx-a11y/autocomplete-valid
            autoComplete="given-name"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="donation-last-name" className={labelClass}>
            {labels.lastName}
          </label>
          <input
            id="donation-last-name"
            name="lastName"
            type="text"
            // Valid per the HTML spec; oxlint's list of tokens lacks it.
            // oxlint-disable-next-line jsx-a11y/autocomplete-valid
            autoComplete="family-name"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="donation-id-code" className={labelClass}>
            {labels.idCode}
          </label>
          <input
            id="donation-id-code"
            name="idCode"
            inputMode="numeric"
            autoComplete="off"
            maxLength={11}
            required
            aria-describedby={
              labels.idCodeDescription
                ? "donation-id-code-description"
                : undefined
            }
            className={inputClass}
          />
          {labels.idCodeDescription && (
            <p
              id="donation-id-code-description"
              className="mt-2 text-xs text-slate-500"
            >
              {labels.idCodeDescription}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="donation-email" className={labelClass}>
            {labels.email}
          </label>
          <input
            id="donation-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={inputClass}
          />
        </div>
      </div>

      {frequency === "recurring" && (
        <div>
          <label htmlFor="donation-bank" className={labelClass}>
            {labels.bank}
          </label>
          <select
            id="donation-bank"
            value={bank}
            onChange={(event) => {
              if (isRecurringBank(event.target.value))
                setBank(event.target.value);
            }}
            className={inputClass}
          >
            {RECURRING_BANKS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            <option value={OTHER}>{labels.otherBank}</option>
          </select>
        </div>
      )}

      <div>
        <label className="flex items-center gap-3 text-sm text-slate-800">
          <input
            type="checkbox"
            checked={fromCompany}
            onChange={(event) => setFromCompany(event.target.checked)}
            className="size-4 rounded border-slate-300 text-primary-700 focus:ring-primary-600"
          />
          {labels.company}
        </label>
        {fromCompany && (
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="donation-company-name" className={labelClass}>
                {labels.companyName}
              </label>
              <input
                id="donation-company-name"
                name="companyName"
                autoComplete="organization"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="donation-company-code" className={labelClass}>
                {labels.companyCode}
              </label>
              <input
                id="donation-company-code"
                name="companyCode"
                inputMode="numeric"
                required
                className={inputClass}
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className={buttonClasses("primary", "lg", "w-full")}
      >
        {labels.submit}
      </button>
    </form>
  );
}
