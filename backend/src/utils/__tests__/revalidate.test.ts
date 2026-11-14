import { describe, it, expect } from "vitest";
import { affectsPublicSite } from "../revalidate";

const page = { uid: "api::page.page", hasDrafts: true };
const global = { uid: "api::global.global", hasDrafts: false };

describe("affectsPublicSite", () => {
  it("is true when published content changes", () => {
    expect(affectsPublicSite({ ...page, action: "publish" })).toBe(true);
    expect(affectsPublicSite({ ...page, action: "unpublish" })).toBe(true);
    expect(affectsPublicSite({ ...page, action: "delete" })).toBe(true);
  });

  it("is false for draft saves", () => {
    expect(affectsPublicSite({ ...page, action: "create" })).toBe(false);
    expect(affectsPublicSite({ ...page, action: "update" })).toBe(false);
    expect(
      affectsPublicSite({ ...page, action: "update", status: "draft" }),
    ).toBe(false);
    expect(affectsPublicSite({ ...page, action: "discardDraft" })).toBe(false);
  });

  it("is true for writes that publish in the same call", () => {
    expect(
      affectsPublicSite({ ...page, action: "update", status: "published" }),
    ).toBe(true);
    expect(
      affectsPublicSite({ ...page, action: "create", status: "published" }),
    ).toBe(true);
  });

  it("is true for any write to content without drafts", () => {
    expect(affectsPublicSite({ ...global, action: "update" })).toBe(true);
    expect(affectsPublicSite({ ...global, action: "create" })).toBe(true);
    expect(affectsPublicSite({ ...global, action: "delete" })).toBe(true);
  });

  it("is false for reads", () => {
    expect(affectsPublicSite({ ...page, action: "findMany" })).toBe(false);
    expect(affectsPublicSite({ ...global, action: "findOne" })).toBe(false);
  });

  it("is false for content the site never shows", () => {
    expect(
      affectsPublicSite({
        uid: "api::contact-submission.contact-submission",
        action: "create",
        hasDrafts: false,
      }),
    ).toBe(false);
    expect(
      affectsPublicSite({
        uid: "admin::user",
        action: "update",
        hasDrafts: false,
      }),
    ).toBe(false);
  });
});
