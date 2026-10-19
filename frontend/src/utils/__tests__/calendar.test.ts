import { describe, it, expect } from "vitest";
import {
  calendarFeedUrl,
  cleanLocation,
  eventDay,
  formatEventDate,
  formatEventTime,
  parseCalendar,
  splitEvents,
  type CalendarEvent,
} from "../calendar";

const CALENDAR_ID = "abc123@group.calendar.google.com";
const FEED_URL = `https://calendar.google.com/calendar/ical/${encodeURIComponent(CALENDAR_ID)}/public/basic.ics`;

/** Shaped like Google Calendar's public feed. */
const ICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
X-WR-TIMEZONE:Europe/Tallinn
BEGIN:VTIMEZONE
TZID:Europe/Tallinn
BEGIN:DAYLIGHT
TZOFFSETFROM:+0200
TZOFFSETTO:+0300
TZNAME:EEST
DTSTART:19700329T030000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0300
TZOFFSETTO:+0200
TZNAME:EET
DTSTART:19701025T040000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
DTSTART:20261024T140000Z
DTEND:20261024T170000Z
UID:single@google.com
SUMMARY:Estimation Game
LOCATION:Telliskivi tn 60a/5\\, 10412 Tallinn\\, Eesti
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260828
DTEND;VALUE=DATE:20260831
UID:summer@google.com
SUMMARY:Suvepäevad
END:VEVENT
BEGIN:VEVENT
DTSTART;TZID=Europe/Tallinn:20260107T180000
DTEND;TZID=Europe/Tallinn:20260107T200000
RRULE:FREQ=WEEKLY;UNTIL=20260204T215959Z;INTERVAL=2;BYDAY=WE
EXDATE;TZID=Europe/Tallinn:20260121T180000
UID:series@google.com
SUMMARY:Aruteluõhtu
LOCATION:EA Eesti Discord: https://discord.gg/abc
END:VEVENT
BEGIN:VEVENT
DTSTART;TZID=Europe/Tallinn:20260205T190000
DTEND;TZID=Europe/Tallinn:20260205T210000
RECURRENCE-ID;TZID=Europe/Tallinn:20260204T180000
UID:series@google.com
SUMMARY:Aruteluõhtu (moved)
END:VEVENT
BEGIN:VEVENT
DTSTART:20261101T100000Z
DTEND:20261101T110000Z
UID:cancelled@google.com
SUMMARY:Cancelled
STATUS:CANCELLED
END:VEVENT
BEGIN:VEVENT
DTSTART:20261201T100000Z
DTEND:20261201T110000Z
UID:12345@facebook.com
SUMMARY:From Facebook
END:VEVENT
END:VCALENDAR
`.replace(/\n/g, "\r\n");

const events = parseCalendar(ICS, {
  until: new Date("2027-01-01T00:00:00Z"),
  feedUrl: FEED_URL,
  language: "et",
});

const byTitle = (title: string) => {
  const event = events.find((item) => item.title === title);
  if (!event) throw new Error(`No event "${title}"`);
  return event;
};

describe("calendarFeedUrl", () => {
  it("accepts the iCal address, the embed link and the bare ID", () => {
    expect(calendarFeedUrl(FEED_URL)).toBe(FEED_URL);
    expect(
      calendarFeedUrl(
        `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(CALENDAR_ID)}&hl=et`,
      ),
    ).toBe(FEED_URL);
    expect(calendarFeedUrl(` ${CALENDAR_ID} `)).toBe(FEED_URL);
  });

  it("rejects anything else", () => {
    expect(calendarFeedUrl("http://example.com/cal.ics")).toBeNull();
    expect(calendarFeedUrl("not a url")).toBeNull();
    expect(calendarFeedUrl("")).toBeNull();
  });
});

describe("cleanLocation", () => {
  it("drops links and the country", () => {
    expect(cleanLocation("Tatari 64/2, 10134 Tallinn, Eesti")).toBe(
      "Tatari 64/2, 10134 Tallinn",
    );
    expect(cleanLocation("EA Eesti Discord: https://discord.gg/abc")).toBe(
      "EA Eesti Discord",
    );
    expect(cleanLocation("https://meet.google.com/abc")).toBeNull();
    expect(cleanLocation(null)).toBeNull();
  });
});

describe("parseCalendar", () => {
  it("expands repeating events, with their exceptions", () => {
    expect(
      events
        .filter((event) => event.title.startsWith("Aruteluõhtu"))
        .map((event) => [event.title, event.start]),
    ).toEqual([
      ["Aruteluõhtu", "2026-01-07T16:00:00.000Z"],
      // 21 January is excluded, and 4 February moved to the 5th.
      ["Aruteluõhtu (moved)", "2026-02-05T17:00:00.000Z"],
    ]);
  });

  it("reads all-day events as dates, with an exclusive end", () => {
    expect(byTitle("Suvepäevad")).toMatchObject({
      start: "2026-08-28",
      end: "2026-08-31",
      allDay: true,
    });
  });

  it("leaves out cancelled events and sorts by start", () => {
    expect(events.map((event) => event.title)).toEqual([
      "Aruteluõhtu",
      "Aruteluõhtu (moved)",
      "Suvepäevad",
      "Estimation Game",
      "From Facebook",
    ]);
  });

  it("stops at `until`", () => {
    const early = parseCalendar(ICS, {
      until: new Date("2026-09-01T00:00:00Z"),
      feedUrl: FEED_URL,
      language: "et",
    });
    expect(early.map((event) => event.title)).not.toContain("Estimation Game");
  });

  it("links Google events to their page in Google Calendar", () => {
    const link = byTitle("Estimation Game").link ?? "";
    const eid = new URL(link).searchParams.get("eid") ?? "";
    expect(atob(eid)).toBe(`single ${CALENDAR_ID}`);
    expect(link).toContain("hl=et");
    expect(byTitle("From Facebook").link).toBeNull();
  });

  it("cleans up locations", () => {
    expect(byTitle("Estimation Game").location).toBe(
      "Telliskivi tn 60a/5, 10412 Tallinn",
    );
    expect(byTitle("Aruteluõhtu").location).toBe("EA Eesti Discord");
  });
});

describe("splitEvents", () => {
  it("keeps events in progress as upcoming and lists the latest past first", () => {
    // During the summer days, before the Estimation Game.
    const now = new Date("2026-08-29T12:00:00Z");
    const { upcoming, past } = splitEvents(events, now, {
      upcoming: 2,
      past: 2,
    });
    expect(upcoming.map((event) => event.title)).toEqual([
      "Suvepäevad",
      "Estimation Game",
    ]);
    expect(past.map((event) => event.title)).toEqual([
      "Aruteluõhtu (moved)",
      "Aruteluõhtu",
    ]);
  });

  it("ends an all-day event at midnight in Tallinn", () => {
    const summer = byTitle("Suvepäevad");
    // 31 August 00:30 in Tallinn is still 30 August in UTC.
    const now = new Date("2026-08-30T21:30:00Z");
    expect(splitEvents([summer], now, { upcoming: 1, past: 1 }).past).toEqual([
      summer,
    ]);
  });

  it("lists no past events unless asked", () => {
    const now = new Date("2027-01-01T00:00:00Z");
    expect(splitEvents(events, now, { upcoming: 3, past: 0 })).toEqual({
      upcoming: [],
      past: [],
    });
  });
});

describe("formatting", () => {
  const now = new Date("2026-10-19T12:00:00Z");
  const game = byTitle("Estimation Game");
  const summer = byTitle("Suvepäevad");

  it("shows times in Tallinn", () => {
    expect(formatEventTime(game, "et-EE", now)).toBe(
      "laupäev, 24. oktoober 17:00–20:00",
    );
    expect(formatEventTime(game, "en-GB", now)).toBe(
      "Saturday 24 October, 17:00–20:00",
    );
  });

  it("shows several days as a range, and other years", () => {
    expect(formatEventTime(summer, "et-EE", now)).toBe("28.–30. august");
    const nextYear: CalendarEvent = {
      ...game,
      start: "2027-01-05T15:00:00.000Z",
      end: "2027-01-05T17:00:00.000Z",
    };
    expect(formatEventTime(nextYear, "en-GB", now)).toBe(
      "Tuesday, 5 January 2027, 17:00–19:00",
    );
  });

  it("formats short dates and the day badge", () => {
    expect(formatEventDate(game, "et-EE")).toBe("24. okt 2026");
    expect(formatEventDate(summer, "en-GB")).toBe("28\u2009–\u200930 Aug 2026");
    expect(eventDay(game, "et-EE")).toEqual({ day: "24", month: "okt" });
  });
});
