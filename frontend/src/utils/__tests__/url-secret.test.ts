import { describe, it, expect } from "vitest";
import { isSafeRedirectPath, secretMatches } from "../secret";
import { isExternalUrl, safeHref } from "../url";

describe("safeHref", () => {
  it("keeps relative paths, anchors and known protocols", () => {
    for (const href of [
      "/blogi",
      "#kontakt",
      "https://example.com",
      "mailto:a@b.ee",
      "tel:+3725555",
      "webcal://calendar.google.com/calendar/ical/x/public/basic.ics",
    ]) {
      expect(safeHref(href)).toBe(href);
    }
  });

  it("drops anything else", () => {
    for (const href of [
      "javascript:alert(1)",
      "data:text/html,x",
      "//evil.example",
      "",
      null,
    ]) {
      expect(safeHref(href)).toBe("#");
    }
  });
});

describe("isExternalUrl", () => {
  it("is true only for web links", () => {
    expect(isExternalUrl("https://example.com")).toBe(true);
    expect(isExternalUrl("/blogi")).toBe(false);
    expect(isExternalUrl("mailto:a@b.ee")).toBe(false);
  });
});

describe("secretMatches", () => {
  it("matches only the configured secret", () => {
    expect(secretMatches("abc", "abc")).toBe(true);
    expect(secretMatches("abd", "abc")).toBe(false);
    expect(secretMatches("abcd", "abc")).toBe(false);
  });

  it("fails closed when the secret isn't configured", () => {
    expect(secretMatches("", "")).toBe(false);
    expect(secretMatches("anything", undefined)).toBe(false);
    expect(secretMatches(null, "abc")).toBe(false);
  });
});

describe("isSafeRedirectPath", () => {
  it("allows paths on this site only", () => {
    expect(isSafeRedirectPath("/blogi/x")).toBe(true);
    expect(isSafeRedirectPath("/en")).toBe(true);
    for (const path of [
      "//evil.example",
      "https://evil.example",
      "/\\evil.example",
      "blogi",
      null,
    ]) {
      expect(isSafeRedirectPath(path)).toBe(false);
    }
  });
});
