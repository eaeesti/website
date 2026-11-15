import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  donationFrom,
  uniqueEmail,
  waitForEmail,
} from "../../helpers/fakes.ts";
import { TEAM_EMAIL } from "../../stack/config.ts";
import { TEXT } from "../../stack/content.ts";

/**
 * One of the form's choices (frequency, amount, bank), by its button's
 * label: a group's hidden legend can carry the same words.
 */
const choice = (page: Page, text: string) =>
  page.locator("label").filter({ hasText: text });

/** A valid Estonian personal ID code, made up. */
const ID_CODE = "39001010000";

test("the contact form's message reaches the team", async ({ page }) => {
  const visitor = uniqueEmail();
  const message = `Tere! Kirjutab ${visitor}.`;
  await page.goto("/kontakt");
  await page.getByLabel("Nimi").fill("Küsija Kask");
  await page.getByLabel("E-post").fill(visitor);
  await page.getByLabel("Sõnum").fill(message);
  await page.getByRole("button", { name: "Saada" }).click();
  await expect(page.getByText(TEXT.contactSuccess)).toBeVisible();

  const email = await waitForEmail(TEAM_EMAIL, message);
  expect(email.subject).toBe(TEXT.contactSubject);
  expect(email.replyTo).toContain(visitor);
  expect(email.text).toContain("Küsija Kask");
});

test("a one-time donation goes to the donation API and back to the thank-you page", async ({
  page,
}) => {
  const email = uniqueEmail("donor");
  await page.goto("/anneta");
  await page.getByText("25 €", { exact: true }).click();
  await page.getByLabel("Eesnimi").fill("Anne");
  await page.getByLabel("Perekonnanimi").fill("Andja");
  await page.getByLabel("E-post").fill(email);
  await page.getByLabel("Isikukood").fill(ID_CODE);
  await page.getByRole("button", { name: TEXT.donateSubmit }).click();

  await page.waitForURL("**/annetatud");
  await expect(
    page.getByRole("heading", { name: TEXT.thanksTitle }),
  ).toBeVisible();
  const donation = await donationFrom(email);
  expect(donation).toMatchObject({
    type: "onetime",
    amount: 2500,
    firstName: "Anne",
    lastName: "Andja",
    idCode: ID_CODE,
    paymentMethod: "paymentInitiation",
  });
  expect(donation?.returnUrl).toMatch(/\/annetatud$/);
});

test("a monthly donation from another bank shows how to set it up", async ({
  page,
}) => {
  const email = uniqueEmail("monthly");
  await page.goto("/anneta");
  await choice(page, "Igakuine annetus").click();
  await choice(page, "Muu summa").click();
  await page.getByLabel("Summa (EUR)").fill("12,50");
  await page.getByLabel("Eesnimi").fill("Kuu");
  await page.getByLabel("Perekonnanimi").fill("Toetaja");
  await page.getByLabel("E-post").fill(email);
  await page.getByLabel("Isikukood").fill(ID_CODE);
  await page.getByLabel("Pank").selectOption({ label: "Muu pank" });
  await page.getByRole("button", { name: TEXT.donateSubmit }).click();

  await expect(page.getByText(TEXT.otherBankText)).toBeVisible();
  expect(await donationFrom(email)).toMatchObject({
    type: "recurring",
    amount: 1250,
    bank: "other",
  });
});

test("a wrong personal ID code is caught before anything is sent", async ({
  page,
}) => {
  const email = uniqueEmail("typo");
  await page.goto("/anneta");
  await page.getByLabel("Eesnimi").fill("Vale");
  await page.getByLabel("Perekonnanimi").fill("Kood");
  await page.getByLabel("E-post").fill(email);
  await page.getByLabel("Isikukood").fill("39001010001");
  await page.getByRole("button", { name: TEXT.donateSubmit }).click();
  await expect(page.getByText("Kontrolli isikukoodi.")).toBeVisible();
  expect(await donationFrom(email)).toBeUndefined();
});
