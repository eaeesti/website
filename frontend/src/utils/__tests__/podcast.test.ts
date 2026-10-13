import { describe, it, expect } from "vitest";
import { formatDuration, htmlToText, parsePodcastFeed } from "../podcast";

const FEED = `<?xml version="1.0"?>
<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"><channel>
  <title>Taskuhääling</title>
  <item>
    <title><![CDATA[#28 Arvamusfestivali eri]]></title>
    <description><![CDATA[<p>Paneelis osalesid:</p><p><br>- Risto Uuk &amp; teised</p>]]></description>
    <link>https://podcasters.spotify.com/pod/show/x/episodes/28</link>
    <pubDate>Mon, 12 Oct 2026 10:33:39 GMT</pubDate>
    <enclosure url="https://anchor.fm/s/x/play/1.mp3" length="1" type="audio/mpeg"/>
    <itunes:duration>01:32:41</itunes:duration>
    <itunes:image href="https://cdn.example/28.jpg"/>
  </item>
</channel></rss>`;

describe("parsePodcastFeed", () => {
  it("reads each episode", () => {
    expect(parsePodcastFeed(FEED)).toEqual([
      {
        title: "#28 Arvamusfestivali eri",
        link: "https://podcasters.spotify.com/pod/show/x/episodes/28",
        date: "2026-10-12T10:33:39.000Z",
        duration: "01:32:41",
        audioUrl: "https://anchor.fm/s/x/play/1.mp3",
        image: "https://cdn.example/28.jpg",
        description: "Paneelis osalesid:\n- Risto Uuk & teised",
      },
    ]);
  });

  it("returns nothing for something that isn't a feed", () => {
    expect(parsePodcastFeed("<html></html>")).toEqual([]);
  });
});

describe("htmlToText", () => {
  it("keeps paragraphs as lines and drops tags", () => {
    expect(htmlToText("<p>Üks <b>kaks</b></p><p>Kolm&nbsp;neli</p>")).toBe(
      "Üks kaks\nKolm neli",
    );
  });
});

describe("formatDuration", () => {
  it("shows hours only when there are some", () => {
    expect(formatDuration("01:32:41")).toBe("1 h 33 min");
    expect(formatDuration("45:10")).toBe("45 min");
    expect(formatDuration(null)).toBeNull();
  });
});
