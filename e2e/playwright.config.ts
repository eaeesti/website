import { defineConfig, devices } from "@playwright/test";
import { URLS } from "./stack/config.ts";

const CI = Boolean(process.env.CI);
// Building Strapi (its admin above all) and the site takes a few minutes.
const BUILD_TIMEOUT = 10 * 60 * 1000;

export default defineConfig({
  testDir: "tests",
  outputDir: ".state/test-results",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : 3,
  timeout: 45 * 1000,
  expect: { timeout: 10 * 1000 },
  reporter: [
    [CI ? "github" : "list"],
    ["html", { outputFolder: ".state/report", open: "never" }],
  ],
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "et-EE",
    timezoneId: "Europe/Tallinn",
  },
  projects: [
    {
      name: "site",
      testDir: "tests/site",
      testIgnore: /mobile\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: URLS.site },
    },
    {
      name: "site-mobile",
      testDir: "tests/site",
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices["Pixel 7"], baseURL: URLS.site },
    },
    {
      name: "strapi",
      testDir: "tests/strapi",
      use: { ...devices["Desktop Chrome"], baseURL: URLS.strapi },
    },
  ],
  // In this order: Strapi and the site trust the fakes' certificate, and the
  // site reads the token Strapi's start writes.
  webServer: [
    {
      command: "node stack/fakes.ts",
      url: `${URLS.fakes}/health`,
      reuseExistingServer: !CI,
    },
    {
      command: "node stack/strapi.mjs",
      url: `${URLS.strapi}/_health`,
      timeout: BUILD_TIMEOUT,
      reuseExistingServer: !CI,
    },
    {
      command: "node stack/site.mjs",
      url: URLS.site,
      timeout: BUILD_TIMEOUT,
      reuseExistingServer: !CI,
    },
  ],
});
