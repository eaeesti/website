import { describe, expect, it } from "vitest";
import type { StrapiMedia } from "@/types/generated/strapi";
import {
  pageShareCard,
  pageShareCardPath,
  shareCardImage,
  shorten,
} from "../share-card";

const photo = (url: string): StrapiMedia => ({
  id: 1,
  documentId: "photo",
  url,
  alternativeText: null,
  caption: null,
  width: 1600,
  height: 900,
  formats: null,
  name: null,
  mime: "image/webp",
  size: null,
});

describe("pageShareCard", () => {
  it("uses the hero's title, subtitle and photo", () => {
    const card = pageShareCard(
      {
        name: "Avaleht",
        metadata: null,
        sections: [
          {
            id: 1,
            __component: "sections.hero-section",
            title: "Teeme head paremini!",
            subtitle: "Efektiivne altruism on ülemaailmne liikumine.",
            image: photo("/uploads/hero.webp"),
            buttons: [],
          },
        ],
      },
      null,
    );
    expect(card).toEqual({
      title: "Teeme head paremini!",
      subtitle: "Efektiivne altruism on ülemaailmne liikumine.",
      photo: "/uploads/hero.webp",
    });
  });

  it("uses a header's title and photo", () => {
    const card = pageShareCard(
      {
        name: "Üritused",
        metadata: null,
        sections: [
          {
            id: 1,
            __component: "sections.header-section",
            title: "Tule üritustele",
            description: null,
            image: photo("/uploads/events.webp"),
            buttons: [],
            breadcrumbs: [],
            showBlogCategories: null,
          },
        ],
      },
      null,
    );
    expect(card).toEqual({
      title: "Tule üritustele",
      subtitle: null,
      photo: "/uploads/events.webp",
    });
  });

  it("falls back to the page's name, on plain blue", () => {
    expect(
      pageShareCard({ name: "Kontakt", metadata: null, sections: [] }, null),
    ).toEqual({ title: "Kontakt", subtitle: null, photo: null });
  });
});

describe("shareCardImage", () => {
  it("addresses the card by page, with a version that follows its content", () => {
    const card = { title: "Üritused", subtitle: null, photo: null };
    const image = shareCardImage(pageShareCardPath("uritused", "et"), card);
    expect(image).toMatchObject({
      width: 1200,
      height: 630,
      alternativeText: "Üritused",
    });
    expect(image.url).toMatch(/^\/og\/et\/uritused\?v=\w+$/);
    expect(shareCardImage("/og/et/uritused", card).url).toBe(image.url);
    expect(
      shareCardImage("/og/et/uritused", { ...card, title: "Sündmused" }).url,
    ).not.toBe(image.url);
  });

  it("puts the home pages at /og/et and /og/en", () => {
    expect(pageShareCardPath("/", "et")).toBe("/og/et");
    expect(pageShareCardPath("/", "en")).toBe("/og/en");
    expect(pageShareCardPath("events", "en")).toBe("/og/en/events");
  });
});

describe("shorten", () => {
  it("cuts long text at a word", () => {
    expect(shorten("Lühike pealkiri", 40)).toBe("Lühike pealkiri");
    expect(
      shorten("Efektiivne altruism on ülemaailmne liikumine inimestest", 30),
    ).toBe("Efektiivne altruism on…");
  });
});
