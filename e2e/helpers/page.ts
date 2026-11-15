import { expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

/** Collects every error the page throws or logs, for a test to check. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

/**
 * Clicks until what the click opens shows. A page from the server can be
 * clicked before React has made it work, the first time a cold server serves
 * it, and that click does nothing.
 */
export async function clickToOpen(control: Locator, opened: Locator) {
  await expect(async () => {
    if (!(await opened.isVisible())) await control.click();
    await expect(opened).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 10_000 });
}
