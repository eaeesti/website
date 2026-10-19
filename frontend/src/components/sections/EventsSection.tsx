import { MapPinIcon } from "@heroicons/react/20/solid";
import type { StrapiEventsSection } from "@/types/generated/strapi";
import { hasBlocksContent } from "@/utils/blocks";
import {
  eventDay,
  formatEventDate,
  formatEventTime,
  getCalendarEvents,
  type CalendarEvent,
} from "@/utils/calendar";
import { classes } from "@/utils/react";
import Anchor from "../elements/Anchor";
import BlocksContent from "../elements/BlocksContent";
import ButtonGroup from "./ButtonGroup";
import type { SectionContext } from "./types";

/**
 * Upcoming events from a public calendar (cached for 15 minutes), and
 * optionally the latest past ones. With a title or intro, the events are
 * beside it on wide screens.
 */
export default async function EventsSection({
  title,
  text,
  calendarUrl,
  upcomingCount,
  pastCount,
  pastTitle,
  noEventsText,
  background,
  buttons,
  context,
}: StrapiEventsSection & { context: SectionContext }) {
  const events = await getCalendarEvents(calendarUrl, {
    language: context.locale,
    // Empty means all of them.
    upcoming: upcomingCount,
    past: pastCount ?? 0,
  });
  const locale = context.global?.dateLocale ?? "et-EE";
  const grey = background === "grey";
  const hasText = hasBlocksContent(text);
  const hasIntro = Boolean(title || hasText || buttons.length > 0);

  return (
    <section
      className={classes("px-4 py-12 sm:px-6 sm:py-16", grey && "bg-slate-100")}
    >
      <div
        className={classes(
          "mx-auto",
          hasIntro
            ? "max-w-6xl lg:grid lg:grid-cols-[2fr_3fr] lg:gap-16"
            : "max-w-3xl",
        )}
      >
        {hasIntro && (
          <div>
            {title && (
              <h2 className="text-3xl font-extrabold tracking-tight text-balance text-primary-800">
                {title}
              </h2>
            )}
            {hasText && <BlocksContent content={text} className="mt-4" />}
            <ButtonGroup buttons={buttons} className="mt-8" />
          </div>
        )}
        {/* Nothing at all when the calendar can't be read. */}
        {events && (
          <div className={classes(hasIntro && "mt-10 lg:mt-0")}>
            {events.upcoming.length > 0 ? (
              <ul role="list" className="space-y-4">
                {events.upcoming.map((event) => (
                  <UpcomingEvent
                    key={event.id}
                    event={event}
                    locale={locale}
                    now={events.now}
                    grey={grey}
                  />
                ))}
              </ul>
            ) : (
              <p
                className={classes(
                  "rounded-2xl p-6 text-slate-600 ring-1 ring-slate-900/5",
                  grey ? "bg-white" : "bg-slate-50",
                )}
              >
                {noEventsText ?? "No upcoming events at the moment."}
              </p>
            )}
            {events.past.length > 0 && (
              <>
                <h3 className="mt-12 text-lg font-bold text-slate-900">
                  {pastTitle ?? "Past events"}
                </h3>
                <ul
                  role="list"
                  className="mt-3 divide-y divide-slate-200 border-y border-slate-200"
                >
                  {events.past.map((event) => (
                    <li
                      key={event.id}
                      className="flex flex-col gap-x-6 gap-y-0.5 py-3 sm:flex-row sm:items-baseline"
                    >
                      <time
                        dateTime={event.start}
                        className="flex-none text-sm text-slate-500 sm:w-36"
                      >
                        {formatEventDate(event, locale)}
                      </time>
                      <EventTitle
                        event={event}
                        className="font-medium text-slate-800"
                      />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function UpcomingEvent({
  event,
  locale,
  now,
  grey,
}: {
  event: CalendarEvent;
  locale: string;
  now: Date;
  grey: boolean;
}) {
  const { day, month } = eventDay(event, locale);
  return (
    <li
      className={classes(
        // The title's link covers the whole card.
        "relative flex gap-5 rounded-2xl p-5 ring-1 ring-slate-900/5 transition-shadow has-[a:hover]:shadow-md sm:p-6",
        grey ? "bg-white shadow-sm" : "bg-slate-50",
      )}
    >
      <div
        aria-hidden="true"
        className="flex size-16 flex-none flex-col items-center justify-center rounded-xl bg-primary-600 text-white"
      >
        <span className="text-2xl leading-none font-extrabold">{day}</span>
        <span className="mt-1 text-xs font-semibold uppercase">{month}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-primary-700 first-letter:uppercase">
          <time dateTime={event.start}>
            {formatEventTime(event, locale, now)}
          </time>
        </p>
        <h3 className="mt-1 text-lg leading-snug font-bold text-slate-900">
          <EventTitle
            event={event}
            className="after:absolute after:inset-0 after:rounded-2xl"
          />
        </h3>
        {event.location && (
          <p className="mt-1.5 flex gap-1.5 text-sm text-slate-600">
            <MapPinIcon
              aria-hidden="true"
              className="mt-0.5 size-4 flex-none text-slate-400"
            />
            {event.location}
          </p>
        )}
      </div>
    </li>
  );
}

/** Links to the event in Google Calendar, which has the full description. */
function EventTitle({
  event,
  className,
}: {
  event: CalendarEvent;
  className?: string;
}) {
  if (!event.link) return <span className={className}>{event.title}</span>;
  return (
    <Anchor
      href={event.link}
      newTab
      externalIcon
      className={classes("hover:text-primary-700", className)}
    >
      {event.title}
    </Anchor>
  );
}
