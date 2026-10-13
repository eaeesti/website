import { describe, it, expect } from "vitest";
import { hasBlocksContent, standaloneUrl } from "../blocks";
import { mediaEmbed, toEmbedUrl } from "../embed";

describe("toEmbedUrl", () => {
  it("allows the listed hosts and rewrites YouTube and Spotify links", () => {
    expect(toEmbedUrl("https://calendar.google.com/calendar/embed?src=x")).toBe(
      "https://calendar.google.com/calendar/embed?src=x",
    );
    expect(toEmbedUrl("https://www.youtube.com/watch?v=abc")).toBe(
      "https://www.youtube-nocookie.com/embed/abc",
    );
    expect(toEmbedUrl("https://youtu.be/abc")).toBe(
      "https://www.youtube-nocookie.com/embed/abc",
    );
    expect(toEmbedUrl("https://open.spotify.com/show/xyz")).toBe(
      "https://open.spotify.com/embed/show/xyz",
    );
  });

  it("rejects other hosts and non-URLs", () => {
    expect(toEmbedUrl("https://evil.example/page")).toBeNull();
    expect(toEmbedUrl("javascript:alert(1)")).toBeNull();
    expect(toEmbedUrl("")).toBeNull();
  });
});

describe("mediaEmbed", () => {
  it("recognises videos and podcast episodes", () => {
    expect(mediaEmbed("https://www.youtube.com/watch?v=abc")).toEqual({
      src: "https://www.youtube-nocookie.com/embed/abc",
      kind: "video",
    });
    expect(
      mediaEmbed(
        "https://www.youtube-nocookie.com/embed/WyprXhvGVYk?rel=0&start=0",
      ),
    ).toEqual({
      src: "https://www.youtube-nocookie.com/embed/WyprXhvGVYk",
      kind: "video",
    });
    expect(mediaEmbed("https://vimeo.com/123")).toEqual({
      src: "https://player.vimeo.com/video/123",
      kind: "video",
    });
    expect(mediaEmbed("https://open.spotify.com/episode/xyz?si=1")).toEqual({
      src: "https://open.spotify.com/embed/episode/xyz",
      kind: "audio",
      height: 352,
    });
  });

  it("ignores ordinary links", () => {
    expect(mediaEmbed("https://example.com")).toBeNull();
    expect(mediaEmbed("/blogi")).toBeNull();
  });
});

const text = (value: string) => ({ type: "text" as const, text: value });
const link = (url: string) => ({
  type: "link" as const,
  url,
  children: [text(url)],
});

describe("standaloneUrl", () => {
  it("finds a link that is alone in its paragraph", () => {
    expect(
      standaloneUrl([text(""), link("https://youtu.be/a"), text(" ")]),
    ).toBe("https://youtu.be/a");
    expect(standaloneUrl([text(" https://youtu.be/a ")])).toBe(
      "https://youtu.be/a",
    );
  });

  it("ignores links inside a sentence", () => {
    expect(
      standaloneUrl([text("Vaata "), link("https://youtu.be/a")]),
    ).toBeNull();
    expect(standaloneUrl([text("Lihtsalt tekst")])).toBeNull();
  });
});

describe("hasBlocksContent", () => {
  it("is false for missing or empty content", () => {
    expect(hasBlocksContent(null)).toBe(false);
    expect(
      hasBlocksContent([
        { type: "paragraph", children: [{ type: "text", text: " " }] },
      ]),
    ).toBe(false);
    expect(
      hasBlocksContent([
        { type: "paragraph", children: [{ type: "text", text: "Tere" }] },
      ]),
    ).toBe(true);
  });
});
