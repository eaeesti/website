import { describe, expect, it, vi } from "vitest";
import type {
  StrapiBlogPost,
  StrapiGlobal,
  StrapiPage,
} from "@/types/generated/strapi";
import { llmsTxt, pageMarkdown, postMarkdown } from "../page-markdown";
import { siteUrl } from "../url";

const post = {
  id: 1,
  documentId: "post",
  title: "Kuidas teha head",
  slug: "kuidas-teha-head",
  date: "2026-05-17",
  excerpt: "Lühidalt.",
  image: null,
  content: [{ type: "paragraph", children: [{ type: "text", text: "Sisu." }] }],
  authors: [
    {
      id: 1,
      documentId: "author",
      name: "Mari Maasikas",
      role: "Vabatahtlik",
      bio: "Kirjutab.",
      image: null,
      createdAt: null,
      updatedAt: null,
    },
  ],
  byline: null,
  categories: [
    {
      id: 1,
      documentId: "cat",
      name: "Filosoofia",
      slug: "filosoofia",
      description: null,
      createdAt: null,
      updatedAt: null,
    },
  ],
  metadata: null,
  createdAt: null,
  updatedAt: null,
  publishedAt: null,
} satisfies StrapiBlogPost;

// The Strapi fetches, and the feeds, which the tests don't reach.
vi.mock("../strapi", () => ({
  getCategories: async () => [],
  getPosts: async () => ({ posts: [post], pagination: {} }),
  getAllPosts: async () => [post],
  getPageSummaries: async (locale: string) =>
    locale === "et"
      ? [
          {
            name: "Meist",
            slug: "meist",
            metadata: { title: null, description: "Kes me oleme." },
          },
          { name: "Avaleht", slug: "/", metadata: null },
        ]
      : [],
}));
vi.mock("../calendar", () => ({
  getCalendarEvents: async () => null,
  calendarSubscribeLinks: () => null,
  formatEventDate: () => "",
  formatEventTime: () => "",
}));
vi.mock("../podcast", () => ({
  getPodcastEpisodes: async () => [],
  formatDuration: () => null,
}));

const global: StrapiGlobal = {
  id: 1,
  documentId: "global",
  locale: "et",
  siteName: "Efektiivne Altruism Eesti",
  dateLocale: "et-EE",
  metadata: {
    id: 1,
    title: null,
    description: "EA in Estonia.",
    shareImage: null,
  },
  footer: {
    id: 1,
    logo: null,
    text: null,
    email: "info@example.org",
    socialMediaLinks: [
      { id: 1, type: "facebook", href: "https://facebook.com/ea" },
    ],
    columns: [],
    bottomText: null,
  },
  favicon: null,
  appleTouchIcon: null,
  navbar: null,
  notFoundPage: null,
  topBannerText: null,
  languageSwitchText: null,
  closeText: null,
  errorText: null,
  emailCopiedText: null,
  previousPageText: null,
  nextPageText: null,
  blogTitle: null,
  relatedPostsTitle: null,
  previewText: null,
  exitPreviewText: null,
  createdAt: null,
  updatedAt: null,
};

const page = (sections: StrapiPage["sections"]): StrapiPage => ({
  id: 1,
  documentId: "page",
  name: "Meist",
  slug: "meist",
  metadata: null,
  sections,
  createdAt: null,
  updatedAt: null,
  publishedAt: null,
  locale: "et",
});

const button = {
  id: 1,
  type: null,
  size: null,
  arrow: null,
  newTab: null,
  plausibleEvent: null,
};

describe("pageMarkdown", () => {
  it("uses the opening header's title as the page title", async () => {
    const markdown = await pageMarkdown(
      page([
        {
          id: 1,
          __component: "sections.header-section",
          title: "Meist",
          description: [
            {
              type: "paragraph",
              children: [{ type: "text", text: "Tutvustus." }],
            },
          ],
          image: null,
          buttons: [{ ...button, text: "Liitu", href: "/kontakt" }],
          breadcrumbs: [],
          showBlogCategories: false,
        },
        {
          id: 2,
          __component: "sections.faq-section",
          title: "KKK",
          questions: [
            {
              id: 1,
              question: "Mis see on?",
              answer: [
                {
                  type: "paragraph",
                  children: [{ type: "text", text: "Vastus." }],
                },
              ],
              plausibleEvent: null,
            },
          ],
        },
        {
          id: 3,
          __component: "sections.contact-section",
          title: null,
          description: null,
          contactEmail: "info@example.org",
          nameLabel: null,
          emailLabel: null,
          messageLabel: null,
          sendLabel: null,
          successTitle: null,
          successDescription: null,
        },
        {
          id: 4,
          __component: "sections.blog-posts-section",
          title: "Blogi",
          postsPerPage: 3,
          showPagination: false,
          showCategories: false,
          allPostsButton: null,
        },
      ]),
      global,
      "et",
    );
    expect(markdown).toBe(
      [
        "# Meist",
        "Tutvustus.",
        `[Liitu](${siteUrl("/kontakt")})`,
        "## KKK",
        "### Mis see on?",
        "Vastus.",
        "info[ät]example.org",
        `[Kontaktivorm](${siteUrl("/meist")})`,
        "## Blogi",
        `- [Kuidas teha head](${siteUrl("/blogi/kuidas-teha-head")}) (17. mai 2026 · Mari Maasikas): Lühidalt.`,
      ].join("\n\n") + "\n",
    );
  });

  it("gives a page without a header its name", async () => {
    const markdown = await pageMarkdown(
      page([
        {
          id: 1,
          __component: "sections.text-section",
          text: [
            { type: "paragraph", children: [{ type: "text", text: "Tekst." }] },
          ],
        },
      ]),
      global,
      "et",
    );
    expect(markdown).toBe("# Meist\n\nTekst.\n");
  });
});

describe("postMarkdown", () => {
  it("has the byline, content, categories and author", () => {
    expect(postMarkdown(post, global)).toBe(
      [
        "# Kuidas teha head",
        "Mari Maasikas · 17. mai 2026",
        "Sisu.",
        `Rubriigid: [Filosoofia](${siteUrl("/rubriik/filosoofia")})`,
        "**Mari Maasikas, Vabatahtlik**\\\nKirjutab.",
      ].join("\n\n") + "\n",
    );
  });
});

describe("llmsTxt", () => {
  it("lists the pages by address and the posts, linking to the Markdown", async () => {
    const text = await llmsTxt({ et: global, en: global });
    expect(text).toContain("# Efektiivne Altruism Eesti\n\n> EA in Estonia.");
    expect(text).toContain(
      "Contact: info[at]example.org · [Facebook](https://facebook.com/ea)",
    );
    expect(text).toContain(
      `## Pages\n\n- [Avaleht](${siteUrl("/index.md")})\n- [Meist](${siteUrl("/meist.md")}): Kes me oleme.`,
    );
    expect(text).not.toContain("Pages in English");
    expect(text).toContain(
      `- [Kuidas teha head](${siteUrl("/blogi/kuidas-teha-head.md")}) (2026-05-17): Lühidalt.`,
    );
  });
});
