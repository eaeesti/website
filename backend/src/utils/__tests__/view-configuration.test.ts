import { describe, it, expect } from "vitest";
import {
  fieldLabel,
  withFieldHints,
  type ViewConfiguration,
} from "../view-configuration";

describe("fieldLabel", () => {
  it("turns camelCase names into sentences", () => {
    expect(fieldLabel("postsPerPage")).toBe("Posts per page");
    expect(fieldLabel("title")).toBe("Title");
  });

  it("writes abbreviations the usual way", () => {
    expect(fieldLabel("videoUrl")).toBe("Video URL");
    expect(fieldLabel("ctaButton")).toBe("CTA button");
    expect(fieldLabel("documentId")).toBe("Document ID");
    expect(fieldLabel("href")).toBe("Link");
  });
});

describe("withFieldHints", () => {
  const configuration: ViewConfiguration = {
    settings: { pageSize: 10, defaultSortBy: "id" },
    metadatas: {
      postsPerPage: {
        edit: { label: "postsPerPage", description: "", visible: true },
        list: { label: "postsPerPage", searchable: true },
      },
      authors: {
        edit: { label: "authors", mainField: "name" },
      },
    },
    layouts: { edit: [] },
  };

  it("sets labels, descriptions and placeholders, keeping the rest", () => {
    const updated = withFieldHints(configuration, {
      authors: { description: "Who wrote it", placeholder: "Pick" },
    });
    expect(updated?.metadatas.postsPerPage).toEqual({
      edit: {
        label: "Posts per page",
        description: "",
        placeholder: "",
        visible: true,
      },
      list: { label: "Posts per page", searchable: true },
    });
    expect(updated?.metadatas.authors.edit).toEqual({
      label: "Authors",
      description: "Who wrote it",
      placeholder: "Pick",
      mainField: "name",
    });
    expect(updated?.layouts).toBe(configuration.layouts);
  });

  it("clears help texts that are no longer in the hints", () => {
    const withHelp = withFieldHints(configuration, {
      postsPerPage: { description: "Old help" },
    });
    expect(withHelp).not.toBeNull();
    const cleared = withFieldHints(withHelp as ViewConfiguration);
    expect(cleared?.metadatas.postsPerPage.edit?.description).toBe("");
  });

  it("merges list settings", () => {
    const updated = withFieldHints(
      configuration,
      {},
      { defaultSortBy: "date", defaultSortOrder: "DESC" },
    );
    expect(updated?.settings).toEqual({
      pageSize: 10,
      defaultSortBy: "date",
      defaultSortOrder: "DESC",
    });
  });

  it("returns null when nothing changes", () => {
    const updated = withFieldHints(configuration) as ViewConfiguration;
    expect(withFieldHints(updated)).toBeNull();
  });
});
