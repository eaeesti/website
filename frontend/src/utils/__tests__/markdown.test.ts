import { describe, expect, it } from "vitest";
import type { InlineNode, ParagraphBlock } from "@/types/blocks";
import {
  absoluteUrl,
  blocksToMarkdown,
  bulletList,
  inlineText,
  markdownPath,
  paragraphs,
} from "../markdown";
import { siteUrl } from "../url";

const et = { locale: "et" as const };

const paragraph = (...children: InlineNode[]): ParagraphBlock => ({
  type: "paragraph",
  children,
});

describe("markdownPath", () => {
  it("adds .md, and index.md for the home pages", () => {
    expect(markdownPath("/meist")).toBe("/meist.md");
    expect(markdownPath("/en/about")).toBe("/en/about.md");
    expect(markdownPath("/blogi/postitus")).toBe("/blogi/postitus.md");
    expect(markdownPath("/")).toBe("/index.md");
    expect(markdownPath("/en")).toBe("/en/index.md");
  });
});

describe("absoluteUrl", () => {
  it("makes the site's paths absolute and keeps other safe links", () => {
    expect(absoluteUrl("/meist")).toBe(siteUrl("/meist"));
    expect(absoluteUrl("https://example.org/a_(b)")).toBe(
      "https://example.org/a_%28b%29",
    );
    expect(absoluteUrl("tel:+3725555555")).toBe("tel:+3725555555");
  });

  it("drops unsafe links, anchors and email links", () => {
    expect(absoluteUrl("javascript:alert(1)")).toBeNull();
    expect(absoluteUrl("#uudiskiri")).toBeNull();
    expect(absoluteUrl("mailto:info@example.org")).toBeNull();
    expect(absoluteUrl("")).toBeNull();
  });
});

describe("inlineText and paragraphs", () => {
  it("escapes formatting and hides email addresses like the pages do", () => {
    expect(inlineText("a *b* [c] <d> \\", et)).toBe(
      "a \\*b\\* \\[c\\] \\<d> \\\\",
    );
    expect(inlineText("snake_case _x_", et)).toBe("snake_case \\_x\\_");
    expect(inlineText("Kirjuta info@example.org", et)).toBe(
      "Kirjuta info[ät]example.org",
    );
    expect(inlineText("Write info@example.org", { locale: "en" })).toBe(
      "Write info[at]example.org",
    );
  });

  it("keeps Estonian ordinals at the start of a line from becoming lists", () => {
    expect(paragraphs("2025. aastal\n- mitte loend\n# ega pealkiri", et)).toBe(
      "2025\\. aastal\n\n\\- mitte loend\n\n\\# ega pealkiri",
    );
  });
});

describe("blocksToMarkdown", () => {
  it("formats text, merging neighbours with the same formatting", () => {
    expect(
      blocksToMarkdown(
        [
          paragraph(
            { type: "text", text: "Tere " },
            { type: "text", text: "pai", bold: true },
            { type: "text", text: "ne ", bold: true },
            { type: "text", text: "maailm", italic: true },
            { type: "text", text: ", " },
            { type: "text", text: "kood`", code: true },
          ),
        ],
        et,
      ),
    ).toBe("Tere **paine** *maailm*, `` kood` ``");
  });

  it("writes links with absolute addresses and email links as text", () => {
    expect(
      blocksToMarkdown(
        [
          paragraph(
            { type: "text", text: "Vaata " },
            {
              type: "link",
              url: "/meist",
              children: [{ type: "text", text: "meist" }],
            },
            { type: "text", text: " või kirjuta " },
            {
              type: "link",
              url: "mailto:info@example.org",
              children: [{ type: "text", text: "info@example.org" }],
            },
            {
              type: "link",
              url: "javascript:x()",
              children: [{ type: "text", text: "!" }],
            },
          ),
        ],
        et,
      ),
    ).toBe(
      `Vaata [meist](${siteUrl("/meist")}) või kirjuta info[ät]example.org!`,
    );
  });

  it("turns line breaks into hard breaks and skips empty paragraphs", () => {
    expect(
      blocksToMarkdown(
        [
          paragraph({ type: "text", text: "üks\n1. kaks" }),
          paragraph({ type: "text", text: "  " }),
          paragraph({ type: "text", text: "kolm" }),
        ],
        et,
      ),
    ).toBe("üks\\\n1\\. kaks\n\nkolm");
  });

  it("writes headings from level 2, quotes, code and images", () => {
    expect(
      blocksToMarkdown(
        [
          {
            type: "heading",
            level: 1,
            children: [{ type: "text", text: "Pealkiri" }],
          },
          {
            type: "heading",
            level: 3,
            children: [{ type: "text", text: "Alam" }],
          },
          {
            type: "quote",
            children: [{ type: "text", text: "Tsitaat\nteine rida" }],
          },
          { type: "code", children: [{ type: "text", text: "const a = 1;" }] },
          {
            type: "image",
            image: {
              name: "a.jpg",
              url: "/uploads/a.jpg",
              alternativeText: "Pilt [1]",
              caption: "Allkiri",
            },
            children: [],
          },
        ],
        et,
      ),
    ).toBe(
      [
        "## Pealkiri",
        "### Alam",
        "> Tsitaat\\\n> teine rida",
        "```\nconst a = 1;\n```",
        `![Pilt 1](${siteUrl("/uploads/a.jpg")})\n*Allkiri*`,
      ].join("\n\n"),
    );
  });

  it("indents nested lists under the item before them", () => {
    expect(
      blocksToMarkdown(
        [
          {
            type: "list",
            format: "ordered",
            children: [
              {
                type: "list-item",
                children: [{ type: "text", text: "Esimene" }],
              },
              {
                type: "list",
                format: "unordered",
                children: [
                  {
                    type: "list-item",
                    children: [{ type: "text", text: "alam" }],
                  },
                ],
              },
              {
                type: "list-item",
                children: [{ type: "text", text: "Teine\nrida" }],
              },
            ],
          },
        ],
        et,
      ),
    ).toBe("1. Esimene\n   - alam\n2. Teine\\\n   rida");
  });
});

describe("bulletList", () => {
  it("indents an item's further lines", () => {
    expect(bulletList(["a", "b\nc"])).toBe("- a\n- b\n  c");
  });
});
