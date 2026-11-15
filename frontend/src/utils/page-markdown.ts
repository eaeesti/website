import { socialMediaName } from "@/components/elements/SocialMediaIcon";
import type {
  StrapiBlogCategory,
  StrapiBlogPost,
  StrapiButton,
  StrapiDonationSection,
  StrapiGlobal,
  StrapiPage,
  StrapiSection,
  StrapiSocialMediaLink,
} from "@/types/generated/strapi";
import { hasBlocksContent } from "./blocks";
import { bylineText, categoryPath, postPath } from "./blog";
import {
  calendarSubscribeLinks,
  formatEventDate,
  formatEventTime,
  getCalendarEvents,
  type CalendarEvent,
} from "./calendar";
import { formatDate } from "./date";
import { RECURRING_BANKS } from "./donation";
import { embedDetails, mediaEmbed, toEmbedUrl } from "./embed";
import { pagePath, type Locale } from "./locale";
import {
  blocksToMarkdown,
  bulletList,
  heading,
  imageMarkdown,
  inlineText,
  joinBlocks,
  link,
  markdownPath,
  paragraphs,
  quote,
  type MarkdownOptions,
} from "./markdown";
import { formatDuration, getPodcastEpisodes } from "./podcast";
import { leadSection } from "./seo";
import {
  getAllPosts,
  getCategories,
  getPageSummaries,
  getPosts,
  type PageSummary,
} from "./strapi";
import { siteUrl } from "./url";

/**
 * The Markdown versions of the pages, for AI agents and other programs that
 * read text more easily than HTML, and llms.txt, which lists them. They're
 * built from the same Strapi content as the pages, section by section, so
 * they need nothing of their own in Strapi. Forms can't be used from
 * Markdown; the Markdown links to the page that has them. Listings show
 * every post rather than a page at a time.
 */

interface MarkdownContext extends MarkdownOptions {
  global: StrapiGlobal | null;
  /** The page's own path, which forms link to. */
  path: string;
}

/** The few words the Markdown needs that the site's settings don't have. */
const TEXTS: Record<
  Locale,
  {
    contactForm: string;
    categories: string;
    video: string;
    donationForm: string;
    /** Before the list of what the donation form asks; {link} links to it. */
    donationFields: string;
    amount: string;
    recurringBank: string;
    donationSteps: string;
    otherBankTitle: string;
  }
> = {
  et: {
    contactForm: "Kontaktivorm",
    categories: "Rubriigid",
    video: "Video",
    donationForm: "annetusvorm",
    donationFields: "Annetamiseks täida {link}. Vormis küsitakse:",
    amount: "Summa",
    recurringBank: "Püsiannetuse puhul pank",
    donationSteps:
      "Ühekordne annetus makstakse pangalingiga. Püsiannetuse puhul avab " +
      "vorm sinu internetipangas püsimakse, mille saad seal kinnitada.",
    otherBankTitle: "Püsiannetus muust pangast",
  },
  en: {
    contactForm: "Contact form",
    categories: "Categories",
    video: "Video",
    donationForm: "donation form",
    donationFields: "To donate, fill in the {link}. It asks for:",
    amount: "Amount",
    recurringBank: "For a monthly donation, your bank",
    donationSteps:
      "A one-time donation is paid by bank link. For a monthly donation, " +
      "the form opens a standing order in your online bank for you to " +
      "confirm there.",
    otherBankTitle: "Monthly donation from another bank",
  },
};

/** A Markdown document: its blocks, ending with a newline. */
function document(parts: Parameters<typeof joinBlocks>[0]): string {
  return `${joinBlocks(parts)}\n`;
}

export function markdownResponse(markdown: string, path: string): Response {
  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // Also the answer at the page's own address to Accept: text/markdown.
      Vary: "Accept",
      // Search engines should list the page itself, not this copy.
      Link: `<${siteUrl(path)}>; rel="canonical"`,
    },
  });
}

export function notFoundResponse(): Response {
  return new Response("Not found\n", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

// ── Pages ─────────────────────────────────────────────────────────────────────

/** A CMS page. One that doesn't open with a hero or header gets its name. */
export async function pageMarkdown(
  page: StrapiPage,
  global: StrapiGlobal | null,
  locale: Locale,
): Promise<string> {
  const context: MarkdownContext = {
    locale,
    global,
    path: pagePath(page.slug, locale),
  };
  const lead = leadSection(page.sections);
  const sections = await Promise.all(
    page.sections.map((section) =>
      sectionMarkdown(section, context, section === lead),
    ),
  );
  return document([
    !lead && heading(1, page.metadata?.title || page.name, context),
    ...sections,
  ]);
}

/** One section, with what its component shows. Add new sections here. */
async function sectionMarkdown(
  section: StrapiSection,
  context: MarkdownContext,
  /** The hero or header the page opens with, whose title is the page's. */
  isLead: boolean,
): Promise<string> {
  // A section's items are headings under its title, or under the page's.
  const itemLevel = "title" in section && section.title ? 3 : 2;
  const title =
    "title" in section && section.title
      ? heading(isLead ? 1 : 2, section.title, context)
      : null;

  switch (section.__component) {
    case "sections.hero-section":
      return joinBlocks([
        title,
        section.subtitle && paragraphs(section.subtitle, context),
        buttons(section.buttons, context),
      ]);

    case "sections.header-section": {
      const categories = section.showBlogCategories
        ? await getCategories()
        : [];
      return joinBlocks([
        title,
        blocksToMarkdown(section.description, context),
        buttons(section.buttons, context),
        categoryLinks(categories, context),
      ]);
    }

    case "sections.text-section":
      return blocksToMarkdown(section.text, context);

    case "sections.text-image-section": {
      // A video takes the image's place. Only described images are worth
      // mentioning; the others are decoration to anyone reading this.
      const { image, videoUrl } = section;
      const media = mediaEmbed(videoUrl)
        ? link(TEXTS[context.locale].video, videoUrl)
        : image?.alternativeText
          ? imageMarkdown(image, context)
          : null;
      return joinBlocks([
        title,
        blocksToMarkdown(section.text, context),
        media,
        buttons(section.buttons, context),
      ]);
    }

    case "sections.cards-section":
      return joinBlocks([
        title,
        section.description && paragraphs(section.description, context),
        ...section.cards.map((card) =>
          joinBlocks([
            heading(itemLevel, card.title, context),
            card.label && `*${inlineText(card.label, context)}*`,
            blocksToMarkdown(card.text, context),
            card.href &&
              card.linkText &&
              link(inlineText(card.linkText, context), card.href),
          ]),
        ),
      ]);

    case "sections.cta-section":
      return joinBlocks([
        title,
        blocksToMarkdown(section.description, context),
        buttons(section.buttons, context),
      ]);

    case "sections.faq-section":
      return joinBlocks([
        title,
        ...section.questions.map((question) =>
          joinBlocks([
            heading(itemLevel, question.question, context),
            blocksToMarkdown(question.answer, context),
          ]),
        ),
      ]);

    case "sections.team-section":
      return joinBlocks([
        title,
        ...section.teamMembers.map((member) =>
          joinBlocks([
            heading(itemLevel, member.name, context),
            member.role && `*${inlineText(member.role, context)}*`,
            blocksToMarkdown(member.bio, context),
            member.button && buttons([member.button], context),
            [
              member.email && inlineText(member.email, context),
              ...socialMediaLinks(member.socialMediaLinks),
            ]
              .filter(Boolean)
              .join(" · "),
          ]),
        ),
      ]);

    case "sections.testimonials-section":
      return joinBlocks([
        title,
        ...section.testimonials.map((testimonial) =>
          quote(
            joinBlocks([
              blocksToMarkdown(testimonial.text, context),
              `— ${[testimonial.name, testimonial.role]
                .filter(Boolean)
                .map((text) => inlineText(text ?? "", context))
                .join(", ")}`,
            ]),
          ),
        ),
      ]);

    case "sections.contact-section":
      return joinBlocks([
        title,
        blocksToMarkdown(section.description, context),
        section.contactEmail && inlineText(section.contactEmail, context),
        link(TEXTS[context.locale].contactForm, context.path),
      ]);

    case "sections.blog-posts-section": {
      // A paginated listing is the whole blog: all of it, then.
      const [posts, categories] = await Promise.all([
        section.showPagination
          ? getAllPosts()
          : getPosts({ pageSize: section.postsPerPage ?? 12 }).then(
              (listing) => listing.posts,
            ),
        section.showCategories ? getCategories() : Promise.resolve([]),
      ]);
      if (posts.length === 0) return "";
      return joinBlocks([
        title,
        categoryLinks(categories, context),
        postList(posts, context),
        section.allPostsButton && buttons([section.allPostsButton], context),
      ]);
    }

    case "sections.donation-section":
      return joinBlocks([
        title,
        blocksToMarkdown(section.description, context),
        donationForm(section, context),
        hasBlocksContent(section.otherBankInstructions) &&
          joinBlocks([
            heading(itemLevel, TEXTS[context.locale].otherBankTitle, context),
            blocksToMarkdown(section.otherBankInstructions, context),
          ]),
      ]);

    case "sections.events-section": {
      const events = await getCalendarEvents(section.calendarUrl, {
        language: context.locale,
        upcoming: section.upcomingCount,
        past: section.pastCount ?? 0,
      });
      const dateLocale = context.global?.dateLocale ?? "et-EE";
      const subscribe = section.subscribeText
        ? calendarSubscribeLinks(section.calendarUrl)
        : null;
      return joinBlocks([
        title,
        blocksToMarkdown(section.text, context),
        buttons(section.buttons, context),
        events &&
          (events.upcoming.length > 0
            ? bulletList(
                events.upcoming.map((event) =>
                  eventItem(
                    event,
                    formatEventTime(event, dateLocale, events.now),
                    context,
                  ),
                ),
              )
            : paragraphs(
                section.noEventsText ?? "No upcoming events at the moment.",
                context,
              )),
        events &&
          subscribe &&
          [
            inlineText(section.subscribeText ?? "", context),
            [
              subscribe.google && link("Google Calendar", subscribe.google),
              link("Apple Calendar, Outlook", subscribe.ical),
            ]
              .filter(Boolean)
              .join(" · "),
          ].join(" "),
        events &&
          events.past.length > 0 &&
          joinBlocks([
            heading(itemLevel, section.pastTitle ?? "Past events", context),
            bulletList(
              events.past.map((event) =>
                eventItem(event, formatEventDate(event, dateLocale), context),
              ),
            ),
          ]),
      ]);
    }

    case "sections.podcast-section": {
      const episodes = await getPodcastEpisodes(section.rssUrl);
      if (episodes.length === 0) return "";
      return joinBlocks([
        title,
        ...episodes.map((episode) =>
          joinBlocks([
            heading(itemLevel, episode.title, context),
            inlineText(
              [
                formatDate(episode.date, context.global?.dateLocale),
                formatDuration(episode.duration),
              ]
                .filter(Boolean)
                .join(" · "),
              context,
            ),
            paragraphs(episode.description, context),
            episode.link &&
              link(
                inlineText(section.listenText ?? "Listen on Spotify", context),
                episode.link,
              ),
          ]),
        ),
      ]);
    }

    case "sections.partner-section":
      return blocksToMarkdown(section.text, context);

    case "sections.newsletter-section": {
      const src = toEmbedUrl(section.formUrl);
      if (!src) return "";
      return joinBlocks([
        title,
        blocksToMarkdown(section.text, context),
        link(inlineText(section.buttonText, context), src),
      ]);
    }

    case "sections.embed-section": {
      const src = toEmbedUrl(section.url);
      if (!src) return "";
      return joinBlocks([
        title,
        link(
          inlineText(section.caption ?? embedDetails(src).service, context),
          section.url,
        ),
      ]);
    }

    default:
      return unknownSection(section);
  }
}

/**
 * What the donation form asks for, in its own labels (with the component's
 * defaults), and what happens when it's sent.
 */
function donationForm(
  section: StrapiDonationSection,
  context: MarkdownContext,
): string {
  const texts = TEXTS[context.locale];
  const label = (text: string) => `**${inlineText(text, context)}**`;
  const either = new Intl.ListFormat(context.locale, { type: "disjunction" });
  const both = new Intl.ListFormat(context.locale, { type: "conjunction" });
  const euros = new Intl.NumberFormat(context.global?.dateLocale ?? "et-EE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
  const frequencies = [
    label(section.recurringLabel ?? "Monthly donation"),
    label(section.onetimeLabel ?? "One-time donation"),
  ];
  if (section.defaultFrequency === "onetime") frequencies.reverse();
  const formLink = link(inlineText(texts.donationForm, context), context.path);

  return joinBlocks([
    escapeLink(texts.donationFields, formLink),
    bulletList([
      either.format(frequencies),
      `${inlineText(texts.amount, context)}: ${either.format([
        ...section.amounts.map((amount) => euros.format(amount.amount)),
        label(section.otherAmountLabel ?? "Other amount"),
      ])}${section.invalidAmountText ? ` (${inlineText(section.invalidAmountText, context)})` : ""}`,
      [
        both.format([
          label(section.firstNameLabel ?? "First name"),
          label(section.lastNameLabel ?? "Last name"),
          label(section.emailLabel ?? "Email"),
          label(section.idCodeLabel ?? "Personal ID code"),
        ]),
        section.idCodeDescription &&
          inlineText(section.idCodeDescription, context),
      ]
        .filter(Boolean)
        .join(": "),
      `${inlineText(texts.recurringBank, context)}: ${either.format([
        ...RECURRING_BANKS.map((bank) => bank.label),
        label(section.otherBankLabel ?? "Other bank"),
      ])}`,
      `${label(section.companyLabel ?? "I'm donating on behalf of a company")}: ${both.format(
        [
          label(section.companyNameLabel ?? "Company name"),
          label(section.companyCodeLabel ?? "Registry code"),
        ],
      )}`,
    ]),
    paragraphs(texts.donationSteps, context),
  ]);
}

/** A sentence of ours with a link in place of {link}. */
function escapeLink(sentence: string, markdownLink: string): string {
  const [before = "", after = ""] = sentence.split("{link}");
  return `${before}${markdownLink}${after}`;
}

/**
 * Fails type-checking when a section type has no case above. At runtime, a
 * section added in Strapi before the frontend knows it is left out.
 */
function unknownSection(_section: never): string {
  return "";
}

/**
 * Buttons as one line of links. Not a list: one right before another list
 * (a section's events or posts) would merge with it.
 */
function buttons(
  list: StrapiButton[] | null | undefined,
  options: MarkdownOptions,
): string {
  return (list ?? [])
    .filter((button) => button.text && button.href)
    .map((button) => link(inlineText(button.text, options), button.href))
    .join(" · ");
}

function categoryLinks(
  categories: Pick<StrapiBlogCategory, "name" | "slug">[],
  options: MarkdownOptions,
): string {
  if (categories.length === 0) return "";
  return `${TEXTS[options.locale].categories}: ${categories
    .map((category) =>
      link(inlineText(category.name, options), categoryPath(category.slug)),
    )
    .join(" · ")}`;
}

function socialMediaLinks(links: StrapiSocialMediaLink[]): string[] {
  return links.map((item) =>
    link(socialMediaName(item.type) ?? item.href, item.href),
  );
}

/** "[Title](address) (date · author): excerpt" for each post. */
function postList(posts: StrapiBlogPost[], context: MarkdownContext): string {
  return bulletList(
    posts.map((post) => {
      const details = [
        formatDate(post.date, context.global?.dateLocale),
        bylineText(post),
      ]
        .filter(Boolean)
        .join(" · ");
      return [
        link(inlineText(post.title, context), postPath(post.slug)),
        details && ` (${inlineText(details, context)})`,
        post.excerpt && `: ${inlineText(post.excerpt, context)}`,
      ]
        .filter(Boolean)
        .join("");
    }),
  );
}

function eventItem(
  event: CalendarEvent,
  when: string,
  options: MarkdownOptions,
): string {
  return [
    link(inlineText(event.title, options), event.link),
    `: ${inlineText(when, options)}`,
    event.location && ` · ${inlineText(event.location, options)}`,
  ]
    .filter(Boolean)
    .join("");
}

// ── Blog ──────────────────────────────────────────────────────────────────────

export function postMarkdown(
  post: StrapiBlogPost,
  global: StrapiGlobal | null,
): string {
  const context: MarkdownContext = {
    locale: "et",
    global,
    path: postPath(post.slug),
  };
  const details = [bylineText(post), formatDate(post.date, global?.dateLocale)]
    .filter(Boolean)
    .join(" · ");
  return document([
    heading(1, post.title, context),
    details && paragraphs(details, context),
    blocksToMarkdown(post.content, context),
    categoryLinks(post.categories ?? [], context),
    ...(post.authors ?? [])
      .filter((author) => author.bio)
      .map(
        (author) =>
          `**${[author.name, author.role]
            .filter(Boolean)
            .map((text) => inlineText(text ?? "", context))
            .join(", ")}**\\\n${inlineText(author.bio ?? "", context)}`,
      ),
  ]);
}

export function categoryMarkdown(
  category: StrapiBlogCategory,
  posts: StrapiBlogPost[],
  global: StrapiGlobal | null,
): string {
  const context: MarkdownContext = {
    locale: "et",
    global,
    path: categoryPath(category.slug),
  };
  return document([
    heading(1, category.name, context),
    category.description && paragraphs(category.description, context),
    postList(posts, context),
  ]);
}

// ── llms.txt ──────────────────────────────────────────────────────────────────

/** Pages by address, each with its description. */
function pageList(pages: PageSummary[], locale: Locale): string {
  return bulletList(
    pages
      .map((page) => ({ page, path: pagePath(page.slug, locale) }))
      .toSorted((a, b) => a.path.localeCompare(b.path))
      .map(({ page, path }) =>
        [
          link(
            inlineText(page.metadata?.title || page.name, { locale }),
            markdownPath(path),
          ),
          page.metadata?.description &&
            `: ${inlineText(page.metadata.description, { locale })}`,
        ]
          .filter(Boolean)
          .join(""),
      ),
  );
}

/**
 * The site at a glance, as llmstxt.org proposes: what it is, then links to
 * the Markdown version of every page and post. In English, since it's for
 * programs; the titles and descriptions are the pages' own.
 */
export async function llmsTxt(
  globals: Record<Locale, StrapiGlobal | null>,
): Promise<string> {
  const [pagesEt, pagesEn, posts] = await Promise.all([
    getPageSummaries("et"),
    getPageSummaries("en"),
    getAllPosts(),
  ]);
  const english: MarkdownOptions = { locale: "en" };
  const footer = globals.et?.footer;

  return document([
    heading(1, globals.et?.siteName ?? "Efektiivne Altruism Eesti", english),
    globals.en?.metadata?.description &&
      quote(paragraphs(globals.en.metadata.description, english)),
    "The website of Efektiivne Altruism Eesti (Effective Altruism Estonia). " +
      "It's in Estonian, and some pages are also in English. Every page has " +
      "a Markdown version at its address with `.md` added (`/index.md` and " +
      "`/en/index.md` for the home pages), and any page's own address gives " +
      "Markdown to a request with `Accept: text/markdown`. The links below " +
      "go to the Markdown versions.",
    [
      footer?.email && `Contact: ${inlineText(footer.email, english)}`,
      ...socialMediaLinks(footer?.socialMediaLinks ?? []),
    ]
      .filter(Boolean)
      .join(" · "),
    heading(2, "Pages", english),
    pageList(pagesEt, "et"),
    pagesEn.length > 0 && heading(2, "Pages in English", english),
    pageList(pagesEn, "en"),
    posts.length > 0 && heading(2, "Blog (in Estonian)", english),
    bulletList(
      posts.map((post) =>
        [
          link(
            inlineText(post.title, english),
            markdownPath(postPath(post.slug)),
          ),
          ` (${post.date})`,
          post.excerpt && `: ${inlineText(post.excerpt, english)}`,
        ]
          .filter(Boolean)
          .join(""),
      ),
    ),
  ]);
}
