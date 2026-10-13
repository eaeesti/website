import type { StrapiSection } from "@/types/generated/strapi";
import BlogPostsSection from "./BlogPostsSection";
import CardsSection from "./CardsSection";
import ContactSection from "./ContactSection";
import CtaSection from "./CtaSection";
import DonationSection from "./DonationSection";
import EmbedSection from "./EmbedSection";
import FaqSection from "./FaqSection";
import HeaderSection from "./HeaderSection";
import HeroSection from "./HeroSection";
import NewsletterSection from "./NewsletterSection";
import PartnerSection from "./PartnerSection";
import PodcastSection from "./PodcastSection";
import TeamSection from "./TeamSection";
import TestimonialsSection from "./TestimonialsSection";
import TextImageSection from "./TextImageSection";
import TextSection from "./TextSection";
import type { SectionContext } from "./types";

/** Renders a page's sections in order. Add new section types here. */
export default function Sections({
  sections,
  context,
}: {
  sections: StrapiSection[];
  context: Omit<SectionContext, "isFirst">;
}) {
  return sections.map((section, index) => (
    <Section
      key={`${section.__component}-${section.id}`}
      section={section}
      context={{ ...context, isFirst: index === 0 }}
    />
  ));
}

function Section({
  section,
  context,
}: {
  section: StrapiSection;
  context: SectionContext;
}) {
  switch (section.__component) {
    case "sections.hero-section":
      return <HeroSection {...section} context={context} />;
    case "sections.header-section":
      return <HeaderSection {...section} context={context} />;
    case "sections.text-section":
      return <TextSection {...section} />;
    case "sections.text-image-section":
      return <TextImageSection {...section} />;
    case "sections.cards-section":
      return <CardsSection {...section} />;
    case "sections.cta-section":
      return <CtaSection {...section} />;
    case "sections.faq-section":
      return <FaqSection {...section} />;
    case "sections.team-section":
      return <TeamSection {...section} />;
    case "sections.testimonials-section":
      return <TestimonialsSection {...section} />;
    case "sections.contact-section":
      return <ContactSection {...section} context={context} />;
    case "sections.blog-posts-section":
      return <BlogPostsSection {...section} context={context} />;
    case "sections.donation-section":
      return <DonationSection {...section} context={context} />;
    case "sections.podcast-section":
      return <PodcastSection {...section} context={context} />;
    case "sections.partner-section":
      return <PartnerSection {...section} />;
    case "sections.newsletter-section":
      return <NewsletterSection {...section} />;
    case "sections.embed-section":
      return <EmbedSection {...section} />;
    default:
      return null;
  }
}
