import { describe, it, expect } from "vitest";
import { affectsPublicSite } from "../revalidate";

describe("affectsPublicSite", () => {
  it("is true for writes to public content types", () => {
    expect(affectsPublicSite("api::page.page", "publish")).toBe(true);
    expect(affectsPublicSite("api::blog-post.blog-post", "update")).toBe(true);
    expect(affectsPublicSite("api::global.global", "update")).toBe(true);
    expect(
      affectsPublicSite("api::blog-category.blog-category", "delete"),
    ).toBe(true);
  });

  it("is false for reads", () => {
    expect(affectsPublicSite("api::page.page", "findMany")).toBe(false);
    expect(affectsPublicSite("api::page.page", "findOne")).toBe(false);
  });

  it("is false for content the site never shows", () => {
    expect(
      affectsPublicSite("api::contact-submission.contact-submission", "create"),
    ).toBe(false);
    expect(affectsPublicSite("api::email-config.email-config", "update")).toBe(
      false,
    );
    expect(affectsPublicSite("admin::user", "update")).toBe(false);
  });
});
