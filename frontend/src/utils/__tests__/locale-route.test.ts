import { describe, it, expect } from "vitest";
import { isLocale, otherLocale, pagePath, slugFromSegments } from "../locale";
import { parseListingSegments } from "../route";

describe("pagePath", () => {
  it("puts Estonian at the root and English under /en", () => {
    expect(pagePath("/", "et")).toBe("/");
    expect(pagePath("/", "en")).toBe("/en");
    expect(pagePath("kontakt", "et")).toBe("/kontakt");
    expect(pagePath("about", "en")).toBe("/en/about");
    expect(pagePath(null, "et")).toBe("/");
  });
});

describe("slugFromSegments", () => {
  it("joins segments and treats none as the home page", () => {
    expect(slugFromSegments(undefined)).toBe("/");
    expect(slugFromSegments([])).toBe("/");
    expect(slugFromSegments(["kursused", "luhikursus"])).toBe(
      "kursused/luhikursus",
    );
    expect(slugFromSegments(["%C3%BCritused"])).toBe("üritused");
  });
});

describe("locales", () => {
  it("knows its two languages", () => {
    expect(isLocale("et")).toBe(true);
    expect(isLocale("fi")).toBe(false);
    expect(otherLocale("et")).toBe("en");
    expect(otherLocale("en")).toBe("et");
  });
});

describe("parseListingSegments", () => {
  it("passes ordinary pages through as page 1", () => {
    expect(parseListingSegments(["blogi"])).toEqual({
      segments: ["blogi"],
      pageNumber: 1,
      explicitFirstPage: false,
    });
    expect(parseListingSegments(undefined)).toEqual({
      segments: [],
      pageNumber: 1,
      explicitFirstPage: false,
    });
  });

  it("splits off a trailing /lk/N", () => {
    expect(parseListingSegments(["blogi", "lk", "3"])).toEqual({
      segments: ["blogi"],
      pageNumber: 3,
      explicitFirstPage: false,
    });
  });

  it("flags /lk/1 so it can redirect, and rejects nonsense page numbers", () => {
    expect(parseListingSegments(["blogi", "lk", "1"])?.explicitFirstPage).toBe(
      true,
    );
    expect(parseListingSegments(["blogi", "lk", "x"])).toBeNull();
  });
});
