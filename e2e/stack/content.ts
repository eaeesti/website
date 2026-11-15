/**
 * The content the seed puts in Strapi, and the texts the tests look for.
 * Every name, address and person is made up. Fields left out get Strapi's
 * defaults from the schema.
 */
import { PORTS, TEAM_EMAIL, URLS } from "./config.ts";

/** In place of an image: the seed puts the uploaded fixture there. */
export const IMAGE = "@image";

/** The texts the tests read. */
export const TEXT = {
  siteName: "Näidisühing",
  enSiteName: "Example Society",
  heroTitle: "Teeme head targalt",
  heroSubtitle:
    "Näidisühing aitab inimestel leida, kuidas teha kõige rohkem head.",
  heroButton: "Loe meist",
  enHeroTitle: "Doing good, wisely",
  cardsTitle: "Mida me teeme",
  cardTitle: "Lugemisring",
  testimonialName: "Kati Kask",
  testimonialText: "Lugemisringis leidsin inimesed, kellega koos mõelda.",
  ctaTitle: "Liitu meiega",
  ctaButton: "Tule vabatahtlikuks",
  partnerText: "Näidisühing on osa rahvusvahelisest liikumisest.",
  latestPostsTitle: "Viimased postitused",
  allPostsButton: "Kõik postitused",

  aboutTitle: "Meist",
  aboutText: "Oleme vabatahtlike kogukond, mis tegutseb aastast 2017.",
  enAboutTitle: "About us",
  teamTitle: "Meeskond",
  memberName: "Mari Maasikas",
  memberRole: "Kogukonnaheaolu juht",
  memberEmail: "mari@e2e.test",
  faqTitle: "Korduma kippuvad küsimused",
  question: "Kas üritused on tasuta?",
  answer: "Jah, kõik meie üritused on tasuta.",

  contactTitle: "Kontakt",
  contactSuccess: "Aitäh, sõnum on saadetud!",
  contactSubject: "Uus sõnum veebilehelt",

  donateTitle: "Toeta meid",
  donateSubmit: "Anneta",
  thanksTitle: "Aitäh annetuse eest!",
  otherBankText: "Seadista püsimakse oma internetipangas.",

  eventsTitle: "Üritused",
  upcomingEvent: "Lugemisõhtu",
  pastEvent: "Suvepäevad",
  noEvents: "Praegu üritusi ei ole.",
  podcastTitle: "Taskuhääling",
  episodeTitle: "Esimene osa: kust alustada",
  newsletterTitle: "Uudiskiri",
  embedTitle: "Video",

  blogTitle: "Blogi",
  postTitles: [
    "Kuidas valida heategevust",
    "Karjäär, mis loeb",
    "Aasta kokkuvõte",
  ],
  postHeading: "Kolm küsimust",
  categoryName: "Karjäär",
  authorName: "Jaan Tamm",

  editableTitle: "Algne pealkiri",
  notFoundTitle: "Lehte ei leitud",
  notFoundButton: "Avalehele",
};

/** A paragraph per string, in Strapi's Blocks format. */
export const blocks = (...paragraphs: string[]) =>
  paragraphs.map((text) => ({
    type: "paragraph",
    children: [{ type: "text", text }],
  }));

const button = (text: string, href: string, type = "primary") => ({
  text,
  href,
  type,
});

export function globalData(locale: "et" | "en") {
  const en = locale === "en";
  return {
    siteName: en ? TEXT.enSiteName : TEXT.siteName,
    dateLocale: en ? "en-GB" : "et-EE",
    languageSwitchText: en ? "Eesti keeles" : "In English",
    closeText: en ? "Close" : "Sulge",
    blogTitle: TEXT.blogTitle,
    metadata: {
      title: en ? TEXT.enSiteName : TEXT.siteName,
      description: en ? "A site for the tests." : "Testide veebileht.",
    },
    navbar: {
      links: en
        ? [{ text: "About", href: "/en/about" }]
        : [
            { text: "Meist", href: "/meist" },
            {
              text: "Tegevused",
              children: [
                { text: "Üritused", href: "/uritused" },
                { text: "Taskuhääling", href: "/taskuhaaling" },
              ],
            },
            { text: "Blogi", href: "/blogi" },
            { text: "Kontakt", href: "/kontakt" },
          ],
      ctaButton: button(en ? "Donate" : "Anneta", en ? "/en" : "/anneta"),
    },
    footer: {
      text: en ? "Footer text." : "Jaluse tekst.",
      email: "info@e2e.test",
      socialMediaLinks: [{ type: "github", href: "https://github.com/e2e" }],
      columns: [
        {
          title: en ? "Links" : "Lingid",
          links: [
            { text: en ? "About" : "Meist", href: en ? "/en/about" : "/meist" },
          ],
        },
      ],
      bottomText: "© Näidisühing",
    },
    notFoundPage: {
      title: TEXT.notFoundTitle,
      description: blocks("Kontrolli aadressi."),
      buttons: [button(TEXT.notFoundButton, en ? "/en" : "/")],
    },
  };
}

export const EMAIL_CONFIG = {
  contactRecipients: TEAM_EMAIL,
  contactSubject: TEXT.contactSubject,
};

const header = (title: string, description = "") => ({
  __component: "sections.header-section",
  title,
  description: description ? blocks(description) : [],
});

interface PageContent {
  name: string;
  slug: string;
  description: string;
  sections: Record<string, unknown>[];
  /** The page in English, if it has one. */
  en?: Omit<PageContent, "en">;
}

export const PAGES: PageContent[] = [
  {
    name: "Home",
    slug: "/",
    description: "Avalehe kirjeldus.",
    sections: [
      {
        __component: "sections.hero-section",
        title: TEXT.heroTitle,
        subtitle: TEXT.heroSubtitle,
        image: IMAGE,
        buttons: [button(TEXT.heroButton, "/meist")],
      },
      {
        __component: "sections.cards-section",
        title: TEXT.cardsTitle,
        cards: [
          {
            title: TEXT.cardTitle,
            text: blocks("Kord kuus loeme ja arutame."),
            href: "/uritused",
            linkText: "Vaata üritusi",
          },
        ],
      },
      {
        __component: "sections.testimonials-section",
        title: "Liikmed räägivad",
        testimonials: [
          {
            name: TEXT.testimonialName,
            role: "Liige",
            text: blocks(TEXT.testimonialText),
          },
        ],
      },
      {
        __component: "sections.blog-posts-section",
        title: TEXT.latestPostsTitle,
        postsPerPage: 2,
        showPagination: false,
        allPostsButton: button(TEXT.allPostsButton, "/blogi", "secondary"),
      },
      {
        __component: "sections.partner-section",
        text: blocks(TEXT.partnerText),
        image: IMAGE,
      },
      {
        __component: "sections.cta-section",
        title: TEXT.ctaTitle,
        description: blocks("Ootame sind."),
        buttons: [button(TEXT.ctaButton, "/kontakt")],
      },
    ],
    en: {
      name: "Home",
      slug: "/",
      description: "The home page.",
      sections: [
        {
          __component: "sections.hero-section",
          title: TEXT.enHeroTitle,
          buttons: [button("About us", "/en/about")],
        },
      ],
    },
  },
  {
    name: "About",
    slug: "meist",
    description: "Kes me oleme.",
    sections: [
      {
        ...header(TEXT.aboutTitle),
        breadcrumbs: [{ title: "Avaleht", href: "/" }],
      },
      {
        __component: "sections.text-image-section",
        title: "Meie lugu",
        text: blocks(TEXT.aboutText),
        image: IMAGE,
      },
      {
        __component: "sections.team-section",
        title: TEXT.teamTitle,
        teamMembers: [
          {
            name: TEXT.memberName,
            role: TEXT.memberRole,
            email: TEXT.memberEmail,
            bio: blocks("Mari hoolitseb kogukonna eest."),
            socialMediaLinks: [
              { type: "linkedin", href: "https://www.linkedin.com/in/e2e" },
            ],
          },
        ],
      },
      {
        __component: "sections.faq-section",
        title: TEXT.faqTitle,
        questions: [{ question: TEXT.question, answer: blocks(TEXT.answer) }],
      },
    ],
    en: {
      name: "About",
      slug: "about",
      description: "Who we are.",
      sections: [header(TEXT.enAboutTitle, "A community of volunteers.")],
    },
  },
  {
    name: "Contact",
    slug: "kontakt",
    description: "Kirjuta meile.",
    sections: [
      header(TEXT.contactTitle),
      {
        __component: "sections.contact-section",
        title: "Kirjuta meile",
        contactEmail: "info@e2e.test",
        nameLabel: "Nimi",
        emailLabel: "E-post",
        messageLabel: "Sõnum",
        sendLabel: "Saada",
        successTitle: TEXT.contactSuccess,
        successDescription: "Vastame niipea kui saame.",
      },
    ],
  },
  {
    name: "Donate",
    slug: "anneta",
    description: "Toeta meie tegevust.",
    sections: [
      header(TEXT.donateTitle),
      {
        __component: "sections.donation-section",
        title: "Annetusvorm",
        defaultFrequency: "onetime",
        recurringLabel: "Igakuine annetus",
        onetimeLabel: "Ühekordne annetus",
        amounts: [{ amount: 10 }, { amount: 25 }, { amount: 50 }],
        otherAmountLabel: "Muu summa",
        customAmountLabel: "Summa (EUR)",
        firstNameLabel: "Eesnimi",
        lastNameLabel: "Perekonnanimi",
        emailLabel: "E-post",
        idCodeLabel: "Isikukood",
        bankLabel: "Pank",
        otherBankLabel: "Muu pank",
        submitLabel: TEXT.donateSubmit,
        invalidIdCodeText: "Kontrolli isikukoodi.",
        otherBankInstructions: blocks(TEXT.otherBankText),
        returnPath: "/annetatud",
      },
    ],
  },
  {
    name: "Thank you",
    slug: "annetatud",
    description: "Aitäh.",
    sections: [header(TEXT.thanksTitle)],
  },
  {
    name: "Events",
    slug: "uritused",
    description: "Tulevased üritused.",
    sections: [
      {
        __component: "sections.events-section",
        title: TEXT.eventsTitle,
        // Over HTTPS, as the section requires; the site trusts the fakes'
        // certificate.
        calendarUrl: `${URLS.fakesHttps}/calendar.ics`,
        upcomingCount: 3,
        pastCount: 1,
        pastTitle: "Möödunud üritused",
        noEventsText: TEXT.noEvents,
      },
    ],
  },
  {
    name: "Podcast",
    slug: "taskuhaaling",
    description: "Meie taskuhääling.",
    sections: [
      {
        __component: "sections.podcast-section",
        title: TEXT.podcastTitle,
        rssUrl: `http://127.0.0.1:${PORTS.fakes}/podcast.rss`,
      },
      {
        __component: "sections.newsletter-section",
        title: TEXT.newsletterTitle,
        buttonText: "Telli uudiskiri",
        formUrl: "https://ufp4cbgs.sendsmaily.net/landing-pages/e2e/html/",
      },
      {
        __component: "sections.embed-section",
        title: TEXT.embedTitle,
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
    ],
  },
  {
    name: "Blog",
    slug: "blogi",
    description: "Meie blogi.",
    sections: [
      { ...header(TEXT.blogTitle), showBlogCategories: true },
      {
        __component: "sections.blog-posts-section",
        postsPerPage: 2,
        showPagination: true,
        showCategories: true,
      },
    ],
  },
  {
    // The publishing test changes this page; nothing else reads it.
    name: "Editable",
    slug: "muudetav",
    description: "Muudetav leht.",
    sections: [header(TEXT.editableTitle)],
  },
];

export const POSTS = TEXT.postTitles.map((title, index) => ({
  title,
  slug: ["kuidas-valida", "karjaar-mis-loeb", "aasta-kokkuvote"][index],
  // Newest last, so the list shows them in reverse.
  date: `2026-0${index + 1}-15`,
  excerpt: `${title}: lühikokkuvõte.`,
  inCategory: index === 1,
  content: [
    ...blocks(`${title}. Esimene lõik.`),
    {
      type: "heading",
      level: 2,
      children: [{ type: "text", text: TEXT.postHeading }],
    },
    {
      type: "list",
      format: "unordered",
      children: ["Kus?", "Kuidas?", "Miks?"].map((text) => ({
        type: "list-item",
        children: [{ type: "text", text }],
      })),
    },
  ],
}));
