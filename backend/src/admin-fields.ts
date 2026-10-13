/**
 * What editors see next to each field in the admin: a label, a help text and
 * sometimes a placeholder. Applied to the content manager's view settings on
 * every boot, so this file is the source of truth: labels and descriptions
 * changed under "Configure the view" in the admin are overwritten. Fields
 * not listed get a label made from their name ("postsPerPage" → "Posts per
 * page").
 */
import type { Core } from "@strapi/strapi";
import {
  withFieldHints,
  type FieldHint,
  type ViewConfiguration,
} from "./utils/view-configuration";

const LINK: FieldHint = {
  label: "Link",
  description:
    'A page on this site ("/meist", "/en/about"), a full address ("https://…") or an email address ("mailto:info@efektiivnealtruism.org").',
};
const NEW_TAB: FieldHint = {
  label: "Open in a new tab",
  description: "For links to other sites.",
};
const ANALYTICS_EVENT: FieldHint = {
  label: "Analytics event",
  description:
    'Optional. Counts clicks in Plausible under this name, e.g. "Donate click".',
};
const INTRO: FieldHint = {
  label: "Intro",
  description: "Optional text under the title.",
};
const SEO: FieldHint = {
  label: "SEO and sharing",
  description:
    "Optional. How this appears in search results and when shared on social media.",
};

const HINTS: Record<string, Record<string, FieldHint>> = {
  // ── Content types ─────────────────────────────────────────────────────────
  "api::page.page": {
    name: {
      description:
        "The page's title in search results and the browser tab, unless SEO and sharing has its own.",
    },
    slug: {
      label: "Path",
      description:
        'The address after the domain, without slashes at the ends: "meist" is /meist. The home page is "/". English pages get /en in front automatically.',
      placeholder: "meist",
    },
    metadata: SEO,
    sections: {
      description:
        "The page's content from top to bottom. Most pages start with a Header.",
    },
  },
  "api::global.global": {
    siteName: {
      description:
        "Shown in the navbar when there's no logo, and after page titles in the browser tab.",
    },
    metadata: {
      label: "Default SEO and sharing",
      description: "Used by pages that don't set their own.",
    },
    favicon: {
      description:
        "The small icon in the browser tab: a square image, at least 48×48 pixels. Shared by both languages.",
    },
    appleTouchIcon: {
      label: "Home screen icon",
      description:
        "Shown when someone adds the site to their phone's home screen: 180×180 pixels. Shared by both languages.",
    },
    notFoundPage: {
      label: "Page not found",
      description: "Shown for addresses that don't exist.",
    },
    topBannerText: {
      label: "Banner",
      description:
        "A notice at the top of every page, e.g. about an upcoming event. Visitors can close it. Leave empty for none.",
    },
    dateLocale: {
      label: "Date format",
      description: "How dates are written, e.g. on blog posts.",
    },
    languageSwitchText: {
      label: "Language switch text",
      description:
        'The navbar link to the other language, e.g. "In English". It leads to the same page in that language when there is one, otherwise to the home page.',
    },
    closeText: {
      label: "Close button text",
      description:
        "Read out by screen readers on the menu's and banner's close buttons.",
    },
    emailCopiedText: {
      label: "Email copied message",
      description:
        "Clicking an email address copies it; this message confirms it.",
    },
    errorText: {
      label: "Error message",
      description: "Shown when a form can't be sent.",
    },
    previousPageText: {
      description: "The link to newer posts in blog lists.",
    },
    nextPageText: { description: "The link to older posts in blog lists." },
    blogTitle: {
      description: "The link back to the blog on posts and category pages.",
    },
    relatedPostsTitle: {
      label: "Related posts title",
      description: "The heading above other posts at the end of a post.",
    },
    previewText: {
      label: "Preview banner text",
      description:
        "Shown to editors who open the preview from the admin, never to visitors.",
    },
    exitPreviewText: { label: "Exit preview button text" },
  },
  "api::blog-post.blog-post": {
    slug: {
      label: "Path",
      description:
        "The post's address: /blogi/… Made from the title. Change it before publishing, not after, or links to the post will break.",
    },
    date: {
      description:
        "Shown on the post. Posts are listed by this date, newest first.",
    },
    excerpt: {
      label: "Summary",
      description: "One or two sentences for the post list and search results.",
    },
    image: {
      label: "Cover image",
      description:
        "Shown in post lists, at the top of the post and when it's shared. 1200×630 pixels works best.",
    },
    authors: {
      description:
        "The authors' bios are shown under the post. Leave empty for posts by the organisation.",
    },
    byline: {
      description:
        'Replaces the list of authors on the post, for credits like "toimetas Jete Jõgi". Usually empty.',
    },
    metadata: {
      ...SEO,
      description:
        "Optional. By default, search results and shares use the title, summary and cover image.",
    },
  },
  "api::blog-author.blog-author": {
    role: { description: 'e.g. "Volunteer". Shown with their bio.' },
    bio: { description: "A sentence or two, shown under their posts." },
    image: { label: "Photo", description: "A portrait, ideally square." },
  },
  "api::blog-category.blog-category": {
    slug: {
      label: "Path",
      description: "The category's address: /rubriik/… Made from the name.",
    },
    description: { description: "Shown at the top of the category's page." },
  },
  "api::contact-submission.contact-submission": {
    responded: {
      description: "Tick this when someone has replied, so others know.",
    },
  },
  "api::email-config.email-config": {
    contactRecipients: {
      label: "Recipients",
      description:
        "Who gets messages sent with the contact form: email addresses, one per line.",
      placeholder: "info@efektiivnealtruism.org",
    },
    contactSubject: {
      label: "Subject",
      description: "The subject line of those emails.",
    },
  },

  // ── Sections ──────────────────────────────────────────────────────────────
  "sections.hero-section": {
    subtitle: { description: "A sentence or two under the title." },
    image: {
      label: "Background image",
      description: "Darkened so the text stays readable. Optional.",
    },
    buttons: {
      description: "On the dark background, use the White or Outline style.",
    },
  },
  "sections.header-section": {
    description: INTRO,
    image: {
      label: "Background image",
      description:
        "Optional. A wide photo, darkened so the text on it stays readable.",
    },
    breadcrumbs: {
      description:
        "Links to the pages above this one, shown above the title. Usually empty.",
    },
    showBlogCategories: {
      description:
        "Links to every blog category under the title, for the blog's page.",
    },
  },
  "sections.text-section": {},
  "sections.text-image-section": {
    image: {
      description: "Shown beside the text, or above it on phones.",
    },
    videoUrl: {
      label: "Video",
      description: "A YouTube or Vimeo link. Shown instead of the image.",
      placeholder: "https://www.youtube.com/watch?v=…",
    },
    imagePosition: { label: "Image side" },
    background: {
      description:
        "Grey and Light (a pale blue) are subtle; Blue is the bright EA blue, with white text. Small images (badges, logos) get a white card on coloured backgrounds.",
    },
  },
  "sections.cards-section": { description: INTRO },
  "sections.cta-section": {
    description: { label: "Text" },
    buttons: {
      description: "On the dark background, use the White or Outline style.",
    },
  },
  "sections.faq-section": {},
  "sections.team-section": { teamMembers: { label: "People" } },
  "sections.testimonials-section": { testimonials: { label: "Quotes" } },
  "sections.contact-section": {
    description: INTRO,
    contactEmail: {
      label: "Email address shown",
      description:
        "For people who'd rather write directly. Messages sent with the form go to the recipients in Email settings.",
    },
    successTitle: { description: "Shown after a message is sent." },
    successDescription: { description: "Shown under the success title." },
  },
  "sections.blog-posts-section": {
    showPagination: {
      label: "Show page links",
      description:
        "Links to older posts. Turn off for a short list, e.g. on the home page.",
    },
    showCategories: {
      description: "Links to each category above the posts.",
    },
    allPostsButton: {
      label: "“All posts” button",
      description: "Optional, e.g. a link to /blogi under a short list.",
    },
  },
  "sections.embed-section": {
    title: { description: "Optional heading above the embed." },
    url: {
      label: "Address",
      description:
        "A YouTube, Vimeo, Spotify, Google Calendar or Google Docs link, or the newsletter form. Other sites are blocked for security; ask a developer to allow one.",
    },
    height: { label: "Height (pixels)" },
    caption: { description: "Small text under the embed." },
  },
  "sections.partner-section": {
    text: { description: "A sentence or two next to the badge." },
    image: {
      label: "Badge",
      description: "Shown in a white circle; a square image works best.",
    },
  },
  "sections.newsletter-section": {
    text: { description: "A sentence or two about what subscribers get." },
    buttonText: {
      description:
        "Clicking it shows the signup form in place of the button. The form comes from another site and loads Google's reCAPTCHA, which sets cookies, so it isn't loaded before someone asks for it.",
    },
    formUrl: {
      label: "Signup form address",
      description:
        "The address of the newsletter provider's signup page (Smaily: the landing page's HTML link).",
    },
    formHeight: {
      label: "Form height (pixels)",
      description: "How tall the form is once it's loaded.",
    },
  },
  "sections.podcast-section": {
    rssUrl: {
      label: "RSS feed",
      description:
        "The podcast's RSS address (on Spotify for Creators: Settings → Availability). New episodes appear within an hour.",
      placeholder: "https://anchor.fm/s/…/podcast/rss",
    },
    listenText: { description: "The link to the episode on Spotify." },
    showMoreText: {
      description:
        "The button under the first ten episodes that shows the rest.",
    },
  },
  "sections.donation-section": {
    description: INTRO,
    defaultFrequency: {
      label: "Selected frequency",
      description: "Which kind of donation is selected when the page opens.",
    },
    recurringLabel: { label: "Monthly donation text" },
    onetimeLabel: { label: "One-time donation text" },
    amounts: {
      description:
        "The amount buttons, in euros. The first one is selected when the page opens.",
    },
    otherAmountLabel: {
      label: "“Other amount” button text",
      description: "The button that lets donors type their own amount.",
    },
    customAmountLabel: {
      label: "Own amount field label",
      description: "The field shown after choosing the other amount.",
    },
    firstNameLabel: { label: "First name label" },
    lastNameLabel: { label: "Last name label" },
    emailLabel: { label: "Email label" },
    idCodeLabel: { label: "ID code label" },
    idCodeDescription: {
      label: "ID code help text",
      description:
        "Optional text under the ID code field, e.g. why it's asked for.",
    },
    bankLabel: {
      label: "Bank label",
      description: "Monthly donations only: donors pick their bank.",
    },
    otherBankLabel: {
      label: "“Other bank” option text",
      description:
        "For banks without a standing order link. Choosing it shows the instructions below instead of going to a bank.",
    },
    companyLabel: {
      label: "Company checkbox text",
      description: "Ticking it shows the company fields.",
    },
    companyNameLabel: { label: "Company name label" },
    companyCodeLabel: { label: "Registry code label" },
    submitLabel: { label: "Donate button text" },
    invalidIdCodeText: { label: "Invalid ID code message" },
    invalidAmountText: { label: "Invalid amount message" },
    otherBankInstructions: {
      label: "Other bank instructions",
      description:
        "How to set up a standing order by hand: the recipient, IBAN and description.",
    },
    returnPath: {
      label: "Thank-you page",
      description:
        'Where donors land after paying, e.g. "/annetatud". Must be a page on this site.',
      placeholder: "/annetatud",
    },
  },

  // ── Elements ──────────────────────────────────────────────────────────────
  "elements.button": {
    href: LINK,
    type: {
      label: "Style",
      description:
        "Primary is solid blue and Secondary light blue. White and Outline (a white border) are for dark backgrounds and photos. Text is a plain link.",
    },
    arrow: { description: "Adds → after the text." },
    newTab: NEW_TAB,
    plausibleEvent: ANALYTICS_EVENT,
  },
  "elements.link": { href: LINK, newTab: NEW_TAB },
  "elements.nav-item": {
    href: {
      ...LINK,
      description: "Not used when the item has dropdown links.",
    },
    newTab: NEW_TAB,
    children: {
      label: "Dropdown links",
      description: "Adding links here turns the item into a dropdown menu.",
    },
  },
  "elements.breadcrumb": {
    title: { label: "Text" },
    href: { ...LINK, description: 'The page\'s path, e.g. "/luhikursus".' },
  },
  "elements.footer-column": {},
  "elements.social-media-link": { type: { label: "Network" }, href: LINK },
  "elements.card": {
    label: {
      description: "Small text above the title, e.g. a category.",
    },
    image: { description: "Shown whole at the top of the card." },
    href: {
      ...LINK,
      description:
        "Optional link at the bottom of the card. Shown when the link text is set too.",
    },
    linkText: { description: 'e.g. "Read more".' },
  },
  "elements.question": {
    plausibleEvent: {
      ...ANALYTICS_EVENT,
      description:
        "Optional. Counts how often this question is opened, in Plausible.",
    },
  },
  "elements.team-member": {
    role: { description: 'e.g. "Co-founder".' },
    image: { label: "Photo", description: "A portrait, ideally square." },
    email: { description: "Shown as an email icon." },
    socialMediaLinks: { label: "Social media" },
    button: {
      description: 'Optional, e.g. "Book a chat" linking to a calendar.',
    },
  },
  "elements.testimonial": {
    role: { description: 'e.g. "Co-founder of Bolt".' },
    text: {
      label: "Quote",
      description: "Without quotation marks: the site adds them.",
    },
    image: { label: "Photo", description: "Optional. Shown small and round." },
  },
  "elements.donation-amount": {
    amount: {
      label: "Amount (EUR)",
      description: "Whole euros, from 1 to 15 000.",
    },
  },

  // ── Site settings parts ───────────────────────────────────────────────────
  "meta.metadata": {
    title: {
      description:
        "For search results and the browser tab. Under 60 characters; the site name is added after it.",
    },
    description: {
      description:
        "For search results and link previews: one or two sentences, under 160 characters.",
    },
    shareImage: {
      description:
        "Shown when the page is shared on social media. 1200×630 pixels works best.",
    },
  },
  "meta.navbar": {
    logo: { description: "Replaces the site name. Optional." },
    ctaButton: {
      label: "Button",
      description: 'The highlighted button on the right, e.g. "Support us".',
    },
  },
  "meta.footer": {
    logo: { description: "Optional, shown above the text." },
    text: { description: "A sentence about the organisation." },
    socialMediaLinks: { label: "Social media" },
    columns: { label: "Link columns" },
    bottomText: {
      label: "Small print",
      description: "The line at the very bottom, e.g. the organisation's name.",
    },
  },
  "meta.not-found-page": { description: { label: "Text" } },
};

/** List view settings: what each list is sorted by. */
const LIST_SETTINGS: Record<string, Record<string, unknown>> = {
  "api::blog-post.blog-post": {
    defaultSortBy: "date",
    defaultSortOrder: "DESC",
  },
  "api::page.page": { defaultSortBy: "slug", defaultSortOrder: "ASC" },
  "api::contact-submission.contact-submission": {
    defaultSortBy: "createdAt",
    defaultSortOrder: "DESC",
  },
};

interface ConfigurationService {
  findConfiguration(model: object): Promise<ViewConfiguration>;
  updateConfiguration(
    model: object,
    configuration: ViewConfiguration,
  ): Promise<unknown>;
}

/** Applies the labels, help texts and list settings above. */
export async function syncAdminFields(strapi: Core.Strapi): Promise<void> {
  const contentManager = strapi.plugin("content-manager");
  const contentTypes = contentManager.service(
    "content-types",
  ) as unknown as ConfigurationService;
  const components = contentManager.service(
    "components",
  ) as unknown as ConfigurationService;

  const models: [{ uid: string }, ConfigurationService][] = [
    ...Object.values(strapi.contentTypes)
      .filter((model) => model.uid.startsWith("api::"))
      .map((model): [{ uid: string }, ConfigurationService] => [
        model,
        contentTypes,
      ]),
    ...Object.values(strapi.components).map(
      (model): [{ uid: string }, ConfigurationService] => [model, components],
    ),
  ];

  let updated = 0;
  for (const [model, service] of models) {
    const { settings, metadatas, layouts } =
      await service.findConfiguration(model);
    const configuration = withFieldHints(
      { settings, metadatas, layouts },
      HINTS[model.uid],
      LIST_SETTINGS[model.uid],
    );
    if (configuration) {
      await service.updateConfiguration(model, configuration);
      updated += 1;
    }
  }
  if (updated > 0) {
    strapi.log.info(`Updated the admin's field labels for ${updated} types.`);
  }
}
