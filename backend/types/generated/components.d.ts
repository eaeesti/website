import type { Schema, Struct } from '@strapi/strapi';

export interface ElementsBreadcrumb extends Struct.ComponentSchema {
  collectionName: 'components_elements_breadcrumb';
  info: {
    description: '';
    displayName: 'Breadcrumb';
    icon: 'arrowRight';
  };
  attributes: {
    href: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ElementsButton extends Struct.ComponentSchema {
  collectionName: 'components_elements_button';
  info: {
    description: '';
    displayName: 'Button';
    icon: 'cursor';
  };
  attributes: {
    arrow: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    href: Schema.Attribute.String & Schema.Attribute.Required;
    newTab: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    plausibleEvent: Schema.Attribute.String;
    size: Schema.Attribute.Enumeration<['sm', 'md', 'lg']> &
      Schema.Attribute.DefaultTo<'md'>;
    text: Schema.Attribute.String & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<
      ['primary', 'secondary', 'white', 'outline', 'text']
    > &
      Schema.Attribute.DefaultTo<'primary'>;
  };
}

export interface ElementsCard extends Struct.ComponentSchema {
  collectionName: 'components_elements_card';
  info: {
    description: '';
    displayName: 'Card';
    icon: 'layout';
  };
  attributes: {
    href: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    label: Schema.Attribute.String;
    linkText: Schema.Attribute.String;
    text: Schema.Attribute.Blocks;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ElementsDonationAmount extends Struct.ComponentSchema {
  collectionName: 'components_elements_donation_amounts';
  info: {
    description: '';
    displayName: 'Donation amount';
    icon: 'priceTag';
  };
  attributes: {
    amount: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 15000;
          min: 1;
        },
        number
      >;
  };
}

export interface ElementsFooterColumn extends Struct.ComponentSchema {
  collectionName: 'components_elements_footer_column';
  info: {
    description: '';
    displayName: 'Footer column';
    icon: 'apps';
  };
  attributes: {
    links: Schema.Attribute.Component<'elements.link', true>;
    title: Schema.Attribute.String;
  };
}

export interface ElementsLink extends Struct.ComponentSchema {
  collectionName: 'components_elements_link';
  info: {
    description: '';
    displayName: 'Link';
    icon: 'link';
  };
  attributes: {
    href: Schema.Attribute.String & Schema.Attribute.Required;
    newTab: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ElementsNavItem extends Struct.ComponentSchema {
  collectionName: 'components_elements_nav_item';
  info: {
    description: '';
    displayName: 'Nav item';
    icon: 'link';
  };
  attributes: {
    children: Schema.Attribute.Component<'elements.link', true>;
    href: Schema.Attribute.String;
    newTab: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ElementsQuestion extends Struct.ComponentSchema {
  collectionName: 'components_elements_question';
  info: {
    description: '';
    displayName: 'Question';
    icon: 'question';
  };
  attributes: {
    answer: Schema.Attribute.Blocks;
    plausibleEvent: Schema.Attribute.String;
    question: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ElementsSocialMediaLink extends Struct.ComponentSchema {
  collectionName: 'components_elements_social_media_link';
  info: {
    description: '';
    displayName: 'Social media link';
    icon: 'earth';
  };
  attributes: {
    href: Schema.Attribute.String & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<
      [
        'facebook',
        'instagram',
        'linkedin',
        'youtube',
        'tiktok',
        'x',
        'github',
        'spotify',
      ]
    >;
  };
}

export interface ElementsTeamMember extends Struct.ComponentSchema {
  collectionName: 'components_elements_team_member';
  info: {
    description: '';
    displayName: 'Team member';
    icon: 'user';
  };
  attributes: {
    bio: Schema.Attribute.Blocks;
    button: Schema.Attribute.Component<'elements.button', false>;
    email: Schema.Attribute.Email;
    image: Schema.Attribute.Media<'images'>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    role: Schema.Attribute.String;
    socialMediaLinks: Schema.Attribute.Component<
      'elements.social-media-link',
      true
    >;
  };
}

export interface ElementsTestimonial extends Struct.ComponentSchema {
  collectionName: 'components_elements_testimonial';
  info: {
    description: '';
    displayName: 'Testimonial';
    icon: 'quote';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    role: Schema.Attribute.String;
    text: Schema.Attribute.Blocks;
  };
}

export interface MetaFooter extends Struct.ComponentSchema {
  collectionName: 'components_meta_footer';
  info: {
    description: '';
    displayName: 'Footer';
    icon: 'layout';
  };
  attributes: {
    bottomText: Schema.Attribute.String;
    columns: Schema.Attribute.Component<'elements.footer-column', true>;
    email: Schema.Attribute.Email;
    logo: Schema.Attribute.Media<'images'>;
    socialMediaLinks: Schema.Attribute.Component<
      'elements.social-media-link',
      true
    >;
    text: Schema.Attribute.Text;
  };
}

export interface MetaMetadata extends Struct.ComponentSchema {
  collectionName: 'components_meta_metadata';
  info: {
    description: '';
    displayName: 'Metadata';
    icon: 'search';
  };
  attributes: {
    description: Schema.Attribute.Text;
    shareImage: Schema.Attribute.Media<'images'>;
    title: Schema.Attribute.String;
  };
}

export interface MetaNavbar extends Struct.ComponentSchema {
  collectionName: 'components_meta_navbar';
  info: {
    description: '';
    displayName: 'Navbar';
    icon: 'layout';
  };
  attributes: {
    ctaButton: Schema.Attribute.Component<'elements.button', false>;
    links: Schema.Attribute.Component<'elements.nav-item', true>;
    logo: Schema.Attribute.Media<'images'>;
  };
}

export interface MetaNotFoundPage extends Struct.ComponentSchema {
  collectionName: 'components_meta_not_found_page';
  info: {
    description: '';
    displayName: 'Not found page';
    icon: 'emotionUnhappy';
  };
  attributes: {
    buttons: Schema.Attribute.Component<'elements.button', true>;
    description: Schema.Attribute.Blocks;
    title: Schema.Attribute.String;
  };
}

export interface SectionsBlogPostsSection extends Struct.ComponentSchema {
  collectionName: 'components_sections_blog_posts_section';
  info: {
    description: '';
    displayName: 'Blog posts';
    icon: 'book';
  };
  attributes: {
    allPostsButton: Schema.Attribute.Component<'elements.button', false>;
    postsPerPage: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<12>;
    showCategories: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    showPagination: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    title: Schema.Attribute.String;
  };
}

export interface SectionsCardsSection extends Struct.ComponentSchema {
  collectionName: 'components_sections_cards_section';
  info: {
    description: '';
    displayName: 'Cards';
    icon: 'grid';
  };
  attributes: {
    cards: Schema.Attribute.Component<'elements.card', true>;
    description: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SectionsContactSection extends Struct.ComponentSchema {
  collectionName: 'components_sections_contact_section';
  info: {
    description: '';
    displayName: 'Contact form';
    icon: 'envelop';
  };
  attributes: {
    contactEmail: Schema.Attribute.Email;
    description: Schema.Attribute.Blocks;
    emailLabel: Schema.Attribute.String & Schema.Attribute.DefaultTo<'Email'>;
    messageLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Message'>;
    nameLabel: Schema.Attribute.String & Schema.Attribute.DefaultTo<'Name'>;
    sendLabel: Schema.Attribute.String & Schema.Attribute.DefaultTo<'Send'>;
    successDescription: Schema.Attribute.Text &
      Schema.Attribute.DefaultTo<"We'll get back to you as soon as we can.">;
    successTitle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Thanks, your message was sent!'>;
    title: Schema.Attribute.String;
  };
}

export interface SectionsCtaSection extends Struct.ComponentSchema {
  collectionName: 'components_sections_cta_section';
  info: {
    description: '';
    displayName: 'Call to action';
    icon: 'bell';
  };
  attributes: {
    buttons: Schema.Attribute.Component<'elements.button', true>;
    description: Schema.Attribute.Blocks;
    title: Schema.Attribute.String;
  };
}

export interface SectionsDonationSection extends Struct.ComponentSchema {
  collectionName: 'components_sections_donation_sections';
  info: {
    description: 'Donations go through Anneta Targalt.';
    displayName: 'Donation form';
    icon: 'heart';
  };
  attributes: {
    amounts: Schema.Attribute.Component<'elements.donation-amount', true>;
    bankLabel: Schema.Attribute.String & Schema.Attribute.DefaultTo<'Bank'>;
    companyCodeLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Registry code'>;
    companyLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<"I'm donating on behalf of a company">;
    companyNameLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Company name'>;
    customAmountLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Amount (EUR)'>;
    defaultFrequency: Schema.Attribute.Enumeration<['recurring', 'onetime']> &
      Schema.Attribute.DefaultTo<'recurring'>;
    description: Schema.Attribute.Blocks;
    emailLabel: Schema.Attribute.String & Schema.Attribute.DefaultTo<'Email'>;
    firstNameLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'First name'>;
    idCodeDescription: Schema.Attribute.String;
    idCodeLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Personal ID code'>;
    invalidAmountText: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Enter an amount between 1 and 15 000 euros.'>;
    invalidIdCodeText: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Check your personal ID code.'>;
    lastNameLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Last name'>;
    onetimeLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'One-time donation'>;
    otherAmountLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Other amount'>;
    otherBankInstructions: Schema.Attribute.Blocks;
    otherBankLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Other bank'>;
    recurringLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Monthly donation'>;
    returnPath: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'/annetatud'>;
    submitLabel: Schema.Attribute.String & Schema.Attribute.DefaultTo<'Donate'>;
    title: Schema.Attribute.String;
  };
}

export interface SectionsEmbedSection extends Struct.ComponentSchema {
  collectionName: 'components_sections_embed_section';
  info: {
    description: '';
    displayName: 'Embed';
    icon: 'code';
  };
  attributes: {
    caption: Schema.Attribute.Text;
    height: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 2000;
          min: 100;
        },
        number
      > &
      Schema.Attribute.DefaultTo<600>;
    title: Schema.Attribute.String;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsEventsSection extends Struct.ComponentSchema {
  collectionName: 'components_sections_events_sections';
  info: {
    description: 'Upcoming (and optionally past) events from a public Google Calendar';
    displayName: 'Events calendar';
    icon: 'calendar';
  };
  attributes: {
    background: Schema.Attribute.Enumeration<['white', 'grey']> &
      Schema.Attribute.DefaultTo<'white'>;
    buttons: Schema.Attribute.Component<'elements.button', true>;
    calendarUrl: Schema.Attribute.String & Schema.Attribute.Required;
    noEventsText: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'No upcoming events at the moment.'>;
    pastCount: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 50;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    pastTitle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Past events'>;
    subscribeText: Schema.Attribute.String;
    text: Schema.Attribute.Blocks;
    title: Schema.Attribute.String;
    upcomingCount: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<3>;
  };
}

export interface SectionsFaqSection extends Struct.ComponentSchema {
  collectionName: 'components_sections_faq_section';
  info: {
    description: '';
    displayName: 'FAQ';
    icon: 'question';
  };
  attributes: {
    questions: Schema.Attribute.Component<'elements.question', true>;
    title: Schema.Attribute.String;
  };
}

export interface SectionsHeaderSection extends Struct.ComponentSchema {
  collectionName: 'components_sections_header_section';
  info: {
    description: '';
    displayName: 'Header';
    icon: 'heading';
  };
  attributes: {
    breadcrumbs: Schema.Attribute.Component<'elements.breadcrumb', true>;
    buttons: Schema.Attribute.Component<'elements.button', true>;
    description: Schema.Attribute.Blocks;
    image: Schema.Attribute.Media<'images'>;
    showBlogCategories: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsHeroSection extends Struct.ComponentSchema {
  collectionName: 'components_sections_hero_section';
  info: {
    description: '';
    displayName: 'Hero';
    icon: 'landscape';
  };
  attributes: {
    buttons: Schema.Attribute.Component<'elements.button', true>;
    image: Schema.Attribute.Media<'images'>;
    subtitle: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsNewsletterSection extends Struct.ComponentSchema {
  collectionName: 'components_sections_newsletter_sections';
  info: {
    description: 'A newsletter signup band; the signup form loads only when someone clicks the button';
    displayName: 'Newsletter';
    icon: 'envelop';
  };
  attributes: {
    buttonText: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Subscribe'>;
    formHeight: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 1200;
          min: 200;
        },
        number
      > &
      Schema.Attribute.DefaultTo<420>;
    formUrl: Schema.Attribute.String & Schema.Attribute.Required;
    text: Schema.Attribute.Blocks;
    title: Schema.Attribute.String;
  };
}

export interface SectionsPartnerSection extends Struct.ComponentSchema {
  collectionName: 'components_sections_partner_sections';
  info: {
    description: 'A round badge or seal next to a short text, e.g. the good fundraising practice badge';
    displayName: 'Badge';
    icon: 'star';
  };
  attributes: {
    background: Schema.Attribute.Enumeration<['blue', 'white', 'grey']> &
      Schema.Attribute.DefaultTo<'blue'>;
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    text: Schema.Attribute.Blocks;
  };
}

export interface SectionsPodcastSection extends Struct.ComponentSchema {
  collectionName: 'components_sections_podcast_sections';
  info: {
    description: "Episodes from a podcast's RSS feed, newest first";
    displayName: 'Podcast episodes';
    icon: 'headphone';
  };
  attributes: {
    listenText: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Listen on Spotify'>;
    rssUrl: Schema.Attribute.String & Schema.Attribute.Required;
    showMoreText: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Show more episodes'>;
    title: Schema.Attribute.String;
  };
}

export interface SectionsTeamSection extends Struct.ComponentSchema {
  collectionName: 'components_sections_team_section';
  info: {
    description: '';
    displayName: 'Team';
    icon: 'user';
  };
  attributes: {
    teamMembers: Schema.Attribute.Component<'elements.team-member', true>;
    title: Schema.Attribute.String;
  };
}

export interface SectionsTestimonialsSection extends Struct.ComponentSchema {
  collectionName: 'components_sections_testimonials_section';
  info: {
    description: '';
    displayName: 'Testimonials';
    icon: 'quote';
  };
  attributes: {
    testimonials: Schema.Attribute.Component<'elements.testimonial', true>;
    title: Schema.Attribute.String;
  };
}

export interface SectionsTextImageSection extends Struct.ComponentSchema {
  collectionName: 'components_sections_text_image_section';
  info: {
    description: '';
    displayName: 'Text with image';
    icon: 'picture';
  };
  attributes: {
    background: Schema.Attribute.Enumeration<
      ['white', 'grey', 'light', 'blue']
    > &
      Schema.Attribute.DefaultTo<'white'>;
    buttons: Schema.Attribute.Component<'elements.button', true>;
    image: Schema.Attribute.Media<'images'>;
    imagePosition: Schema.Attribute.Enumeration<['left', 'right']> &
      Schema.Attribute.DefaultTo<'right'>;
    text: Schema.Attribute.Blocks;
    title: Schema.Attribute.String;
    videoUrl: Schema.Attribute.String;
  };
}

export interface SectionsTextSection extends Struct.ComponentSchema {
  collectionName: 'components_sections_text_section';
  info: {
    description: '';
    displayName: 'Text';
    icon: 'feather';
  };
  attributes: {
    text: Schema.Attribute.Blocks;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'elements.breadcrumb': ElementsBreadcrumb;
      'elements.button': ElementsButton;
      'elements.card': ElementsCard;
      'elements.donation-amount': ElementsDonationAmount;
      'elements.footer-column': ElementsFooterColumn;
      'elements.link': ElementsLink;
      'elements.nav-item': ElementsNavItem;
      'elements.question': ElementsQuestion;
      'elements.social-media-link': ElementsSocialMediaLink;
      'elements.team-member': ElementsTeamMember;
      'elements.testimonial': ElementsTestimonial;
      'meta.footer': MetaFooter;
      'meta.metadata': MetaMetadata;
      'meta.navbar': MetaNavbar;
      'meta.not-found-page': MetaNotFoundPage;
      'sections.blog-posts-section': SectionsBlogPostsSection;
      'sections.cards-section': SectionsCardsSection;
      'sections.contact-section': SectionsContactSection;
      'sections.cta-section': SectionsCtaSection;
      'sections.donation-section': SectionsDonationSection;
      'sections.embed-section': SectionsEmbedSection;
      'sections.events-section': SectionsEventsSection;
      'sections.faq-section': SectionsFaqSection;
      'sections.header-section': SectionsHeaderSection;
      'sections.hero-section': SectionsHeroSection;
      'sections.newsletter-section': SectionsNewsletterSection;
      'sections.partner-section': SectionsPartnerSection;
      'sections.podcast-section': SectionsPodcastSection;
      'sections.team-section': SectionsTeamSection;
      'sections.testimonials-section': SectionsTestimonialsSection;
      'sections.text-image-section': SectionsTextImageSection;
      'sections.text-section': SectionsTextSection;
    }
  }
}
