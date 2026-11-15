import { randomUUID } from "node:crypto";
import { expect } from "@playwright/test";
import { URLS } from "../stack/config.ts";
import type { Donation, Email } from "../stack/fakes.ts";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

function isEmail(value: unknown): value is Email {
  return (
    isRecord(value) &&
    Array.isArray(value.to) &&
    typeof value.subject === "string" &&
    typeof value.text === "string" &&
    typeof value.replyTo === "string"
  );
}

/** An address no other test uses, so what's sent to it is this test's own. */
export function uniqueEmail(name = "visitor") {
  return `${name}-${randomUUID().slice(0, 8)}@e2e.test`;
}

async function getJson(path: string): Promise<unknown> {
  const response = await fetch(`${URLS.fakes}${path}`);
  return response.json();
}

/** Waits for an email to the address with `containing` in its text. */
export async function waitForEmail(
  address: string,
  containing: string,
): Promise<Email> {
  let found: Email | undefined;
  await expect
    .poll(
      async () => {
        const body = await getJson(
          `/emails?${new URLSearchParams({ to: address })}`,
        );
        found = (Array.isArray(body) ? body.filter(isEmail) : []).find(
          (email) => email.text.includes(containing),
        );
        return Boolean(found);
      },
      { message: `an email to ${address} with "${containing}" in it` },
    )
    .toBe(true);
  if (!found) throw new Error("unreachable");
  return found;
}

/** The donation the fake donation API got from this email address. */
export async function donationFrom(
  email: string,
): Promise<Donation | undefined> {
  const body = await getJson("/donations");
  return (Array.isArray(body) ? body.filter(isRecord) : []).find(
    (donation) => donation.email === email,
  );
}
