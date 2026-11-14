import ICAL from "ical.js";

export interface CalendarEvent {
  /** Unique per occurrence of a repeating event. */
  id: string;
  title: string;
  /** An ISO timestamp, or a date ("2026-08-28") for an all-day event. */
  start: string;
  /** Exclusive: for an all-day event, the day after its last day. */
  end: string;
  allDay: boolean;
  location: string | null;
  /** The event's page in Google Calendar, which has its full description. */
  link: string | null;
}

/** The organisation's events happen in Estonia, so times are shown there. */
export const CALENDAR_TIME_ZONE = "Europe/Tallinn";

/**
 * A repeating event's occurrences kept, the latest before the window's end:
 * a year ahead and plenty of past ones. Counted back from the end, so a
 * series that has run for years still shows its next dates.
 */
const MAX_OCCURRENCES = 500;

/**
 * How many dates of one repeating event are stepped through at most, from its
 * first. Bounds the work on an endless series that repeats very often; a
 * weekly one would need almost 200 years to reach it.
 */
const MAX_STEPS = 10_000;

const GOOGLE_ICAL_PREFIX = "https://calendar.google.com/calendar/ical/";

/**
 * The calendar's iCal address. Editors may paste the iCal address, Google
 * Calendar's embed link (its `src` is the calendar's ID) or the bare ID.
 */
export function calendarFeedUrl(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (!value.includes("/") && value.includes("@")) {
    return `${GOOGLE_ICAL_PREFIX}${encodeURIComponent(value)}/public/basic.ics`;
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const embedId =
    url.hostname === "calendar.google.com" &&
    url.pathname.startsWith("/calendar/embed")
      ? url.searchParams.get("src")
      : null;
  return embedId ? calendarFeedUrl(embedId) : url.toString();
}

/** The Google Calendar ID in a Google iCal address, for linking to events. */
export function googleCalendarId(feedUrl: string): string | null {
  if (!feedUrl.startsWith(GOOGLE_ICAL_PREFIX)) return null;
  const id = feedUrl.slice(GOOGLE_ICAL_PREFIX.length).split("/")[0];
  return id ? decodeURIComponent(id) : null;
}

/**
 * Where visitors can subscribe to the calendar: Google Calendar's page for
 * adding it (only for Google calendars), and the iCal feed as a webcal: link,
 * which Apple Calendar and Outlook open as a subscription.
 */
export function calendarSubscribeLinks(
  calendarUrl: string,
): { google: string | null; ical: string } | null {
  const feedUrl = calendarFeedUrl(calendarUrl);
  if (!feedUrl) return null;
  const calendarId = googleCalendarId(feedUrl);
  return {
    google: calendarId
      ? `https://calendar.google.com/calendar/u/0?cid=${btoa(calendarId).replace(/=+$/, "")}`
      : null,
    ical: feedUrl.replace(/^https:/, "webcal:"),
  };
}

/**
 * Google Calendar's page for an event, readable without an account. Its ID
 * is the event's UID without "@google.com". A repeating event links to the
 * series: links to single occurrences ask visitors to sign in.
 */
function googleEventLink(
  uid: string,
  calendarId: string | null,
  language: string,
): string | null {
  if (!calendarId || !uid.endsWith("@google.com")) return null;
  const eventId = uid.slice(0, -"@google.com".length);
  const eid = btoa(`${eventId} ${calendarId}`).replace(/=+$/, "");
  return `https://calendar.google.com/calendar/event?eid=${eid}&ctz=${CALENDAR_TIME_ZONE}&hl=${language}`;
}

/** "10113 Tallinn" */
const POSTCODE_AND_PLACE = /^\d{4,6}\s+(\D.*)$/;
/** A house number as a word of its own: "9", "60a", "64/2", "9-19". */
const HOUSE_NUMBER = /(^|\s)\d+[a-z]?([/-]\d+[a-z]?)?(\s|$)/i;
/** A street without a number ("Raekoja plats"), a county, or Estonia. */
const LEFT_OUT =
  /\s(tn|tänav|mnt|maantee|pst|puiestee|tee|plats)\.?$|maakond$|county$|^(estonia|eesti)$/i;

/**
 * A location as shown on the site: names and places, without street
 * addresses, which are often someone's home. "Karakter, Tatari 64/2,
 * 10134 Tallinn, Estonia" becomes "Karakter, Tallinn", "Näidise tn 9, 10111
 * Tallinn" becomes "Tallinn", and "Mari's place, Tallinn" stays. Links are
 * left out too (online events often have "Discord: https://…").
 */
export function cleanLocation(location: string | null): string | null {
  if (!location) return null;
  const parts = location
    .replace(/https?:\/\/\S+/g, "")
    .split(",")
    .map((part) => {
      const trimmed = part.trim().replace(/[\s.:]+$/, "");
      return trimmed.match(POSTCODE_AND_PLACE)?.[1] ?? trimmed;
    })
    .filter((part) => part && !HOUSE_NUMBER.test(part) && !LEFT_OUT.test(part));
  return [...new Set(parts)].join(", ") || null;
}

function timeValue(time: ICAL.Time): string {
  return time.isDate
    ? time.toString()
    : new Date(time.toUnixTime() * 1000).toISOString();
}

/**
 * The events in an iCal feed that start before `until`, each occurrence of
 * a repeating event separately, sorted by start. Cancelled events are left
 * out.
 */
export function parseCalendar(
  ics: string,
  options: { until: Date; feedUrl: string; language: string },
): CalendarEvent[] {
  const root = new ICAL.Component(ICAL.parse(ics));
  // Times given in the calendar's own time zone need its definition.
  for (const zone of root.getAllSubcomponents("vtimezone")) {
    const tzid = zone.getFirstPropertyValue("tzid");
    if (typeof tzid === "string" && !ICAL.TimezoneService.has(tzid)) {
      ICAL.TimezoneService.register(zone);
    }
  }

  const calendarId = googleCalendarId(options.feedUrl);
  const until = options.until.getTime() / 1000;
  const events: CalendarEvent[] = [];

  const add = (
    item: ICAL.Event,
    start: ICAL.Time | null,
    givenEnd: ICAL.Time | null,
  ) => {
    const status = item.component.getFirstPropertyValue("status");
    if (!start || !item.summary || status === "CANCELLED") return;
    let end = givenEnd;
    if (!end || end.compare(start) <= 0) {
      // Without an end, an all-day event lasts the day and others are
      // moments.
      end = start.clone();
      if (start.isDate) end.adjust(1, 0, 0, 0);
    }
    events.push({
      id: `${item.uid}/${timeValue(start)}`,
      title: item.summary,
      start: timeValue(start),
      end: timeValue(end),
      allDay: start.isDate,
      location: cleanLocation(item.location),
      link: googleEventLink(item.uid, calendarId, options.language),
    });
  };

  // Changed occurrences of repeating events (RECURRENCE-ID) are related to
  // their event by ICAL.Event itself, so only the events are walked here.
  const masters = root
    .getAllSubcomponents("vevent")
    .filter((component) => !component.hasProperty("recurrence-id"))
    .map((component) => new ICAL.Event(component));

  for (const master of masters) {
    if (!master.isRecurring()) {
      if (master.startDate && master.startDate.toUnixTime() < until) {
        add(master, master.startDate, master.endDate);
      }
      continue;
    }
    const iterator = master.iterator();
    const dates: ICAL.Time[] = [];
    for (let step = 0; step < MAX_STEPS; step++) {
      const next = iterator.next();
      if (!next || next.toUnixTime() >= until) break;
      dates.push(next);
    }
    for (const date of dates.slice(-MAX_OCCURRENCES)) {
      const { item, startDate, endDate } = master.getOccurrenceDetails(date);
      add(item, startDate, endDate);
    }
  }

  // ISO timestamps and dates sort together well enough: a day's all-day
  // events come before its timed ones.
  return events.toSorted((a, b) => a.start.localeCompare(b.start));
}

/** Today's date where the events are, e.g. "2026-10-19". */
function todayInCalendarZone(now: Date): string {
  return now.toLocaleDateString("en-CA", { timeZone: CALENDAR_TIME_ZONE });
}

export function isOver(event: CalendarEvent, now: Date): boolean {
  return event.allDay
    ? event.end <= todayInCalendarZone(now)
    : new Date(event.end) <= now;
}

/**
 * The next events (including ones in progress), soonest first, and the most
 * recent past ones, latest first. With `upcoming` null, all upcoming events.
 */
export function splitEvents(
  events: CalendarEvent[],
  now: Date,
  counts: { upcoming: number | null; past: number },
): { upcoming: CalendarEvent[]; past: CalendarEvent[] } {
  const past = events.filter((event) => isOver(event, now));
  return {
    upcoming: events
      .filter((event) => !isOver(event, now))
      .slice(0, counts.upcoming ?? undefined),
    past: counts.past > 0 ? past.slice(-counts.past).toReversed() : [],
  };
}

/** An all-day event's date as a Date at noon UTC, formatted in UTC. */
function dateOnly(date: string, extraDays = 0): Date {
  const parsed = new Date(`${date}T12:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + extraDays);
  return parsed;
}

/**
 * When the event is, e.g. "laupäev, 24. oktoober, 17:00–20:00" or, for
 * several days, "28.–30. august". The year is included when it isn't the
 * current one.
 */
export function formatEventTime(
  event: CalendarEvent,
  locale: string,
  now: Date,
): string {
  const thisYear = todayInCalendarZone(now).slice(0, 4);
  const year =
    event.start.slice(0, 4) !== thisYear ? { year: "numeric" as const } : {};

  if (event.allDay) {
    const first = dateOnly(event.start);
    const last = dateOnly(event.end, -1);
    const sameDay = first.getTime() >= last.getTime();
    const format = new Intl.DateTimeFormat(locale, {
      ...(sameDay ? { weekday: "long" as const } : {}),
      day: "numeric",
      month: "long",
      ...year,
      timeZone: "UTC",
    });
    return sameDay ? format.format(first) : format.formatRange(first, last);
  }

  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...year,
    hour: "2-digit",
    minute: "2-digit",
    timeZone: CALENDAR_TIME_ZONE,
  }).formatRange(new Date(event.start), new Date(event.end));
}

/** A short date with the year, e.g. "15. okt 2026" or "28.–30. aug 2026". */
export function formatEventDate(event: CalendarEvent, locale: string): string {
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  if (!event.allDay) {
    return new Intl.DateTimeFormat(locale, {
      ...options,
      timeZone: CALENDAR_TIME_ZONE,
    }).format(new Date(event.start));
  }
  const first = dateOnly(event.start);
  const last = dateOnly(event.end, -1);
  const format = new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: "UTC",
  });
  return first.getTime() >= last.getTime()
    ? format.format(first)
    : format.formatRange(first, last);
}

/** The parts of the event's first day for a calendar-page style badge. */
export function eventDay(
  event: CalendarEvent,
  locale: string,
): { day: string; month: string } {
  const date = event.allDay ? dateOnly(event.start) : new Date(event.start);
  const timeZone = event.allDay ? "UTC" : CALENDAR_TIME_ZONE;
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...options, timeZone })
      .format(date)
      .replace(/\.$/, "");
  return {
    day: part({ day: "numeric" }),
    month: part({ month: "short" }),
  };
}

/**
 * The events to show from a calendar, fetched up to a year ahead and cached
 * for 15 minutes, with the time they were split at. Returns null when the
 * calendar can't be read, so the page still renders.
 */
export async function getCalendarEvents(
  calendarUrl: string,
  options: { language: string; upcoming: number | null; past: number },
): Promise<{
  upcoming: CalendarEvent[];
  past: CalendarEvent[];
  now: Date;
} | null> {
  const feedUrl = calendarFeedUrl(calendarUrl);
  if (!feedUrl) return null;
  try {
    const response = await fetch(feedUrl, {
      next: { revalidate: 900, tags: ["calendar"] },
    });
    if (!response.ok) return null;
    const now = new Date();
    const until = new Date(now);
    until.setFullYear(until.getFullYear() + 1);
    const events = parseCalendar(await response.text(), {
      until,
      feedUrl,
      language: options.language,
    });
    return { ...splitEvents(events, now, options), now };
  } catch {
    return null;
  }
}
