import { describe, it, expect } from "vitest";
import {
  bylineText,
  listingPagePath,
  parsePageNumber,
  visiblePages,
} from "../blog";

describe("parsePageNumber", () => {
  it("accepts canonical positive integers only", () => {
    expect(parsePageNumber("2")).toBe(2);
    expect(parsePageNumber("10")).toBe(10);
    for (const raw of ["0", "02", "-1", "1.5", "abc", "", "99999"]) {
      expect(parsePageNumber(raw)).toBeNull();
    }
  });
});

describe("listingPagePath", () => {
  it("leaves page 1 at the base path", () => {
    expect(listingPagePath("/blogi", 1)).toBe("/blogi");
    expect(listingPagePath("/blogi", 3)).toBe("/blogi/lk/3");
    expect(listingPagePath("/rubriik/teadus", 2)).toBe("/rubriik/teadus/lk/2");
  });
});

const author = (name: string) => ({ name }) as never;

describe("bylineText", () => {
  it("prefers the explicit byline", () => {
    expect(
      bylineText({
        byline: "toimetas Jete Jõgi",
        authors: [author("Jete Jõgi")],
      }),
    ).toBe("toimetas Jete Jõgi");
  });

  it("falls back to the authors' names", () => {
    expect(
      bylineText({ byline: "  ", authors: [author("Mari"), author("Jaan")] }),
    ).toBe("Mari, Jaan");
    expect(bylineText({ byline: null, authors: [] })).toBeNull();
  });
});

describe("visiblePages", () => {
  it("shows every page when there are few", () => {
    expect(visiblePages(1, 3)).toEqual([1, 2, 3]);
  });

  it("shows the ends and the current page's neighbours with gaps", () => {
    expect(visiblePages(5, 10)).toEqual([1, null, 4, 5, 6, null, 10]);
    expect(visiblePages(1, 8)).toEqual([1, 2, null, 8]);
    expect(visiblePages(8, 8)).toEqual([1, null, 7, 8]);
  });
});
