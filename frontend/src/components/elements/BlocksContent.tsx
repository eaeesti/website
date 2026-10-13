import { Fragment, type ReactNode } from "react";
import type {
  Block,
  BlocksContent as BlocksContentData,
  InlineNode,
  ListBlock,
  TextNode,
} from "@/types/blocks";
import { classes } from "@/utils/react";
import { isEmptyParagraph, standaloneUrl } from "@/utils/blocks";
import { mediaEmbed } from "@/utils/embed";
import { isExternalUrl } from "@/utils/url";
import Anchor from "./Anchor";
import CopyEmail from "./CopyEmail";
import { WithEmails } from "./Email";
import MediaPlayer from "./MediaPlayer";
import StrapiImage from "./StrapiImage";

/**
 * Renders rich text written in Strapi's Blocks editor. Everything is built
 * from React elements, never from raw HTML, so editor content can't inject
 * markup or scripts.
 */
export default function BlocksContent({
  content,
  className,
  invert = false,
}: {
  content: BlocksContentData | null | undefined;
  className?: string;
  /** Light text, for dark backgrounds. */
  invert?: boolean;
}) {
  const blocks = (content ?? []).filter((block) => !isEmptyParagraph(block));
  if (blocks.length === 0) return null;

  return (
    <div
      className={classes(
        "prose",
        invert ? "prose-ea-invert" : "prose-ea",
        className,
      )}
    >
      {blocks.map((block, index) => (
        <BlockNode key={index} block={block} />
      ))}
    </div>
  );
}

function BlockNode({ block }: { block: Block }) {
  switch (block.type) {
    case "paragraph": {
      const embed = mediaEmbed(standaloneUrl(block.children));
      if (embed) {
        return (
          <div className="not-prose my-8">
            <MediaPlayer embed={embed} />
          </div>
        );
      }
      return <p>{renderInline(block.children)}</p>;
    }

    case "heading": {
      // The page title is the only h1; a heading 1 in the editor becomes h2.
      const Tag = `h${Math.max(block.level, 2)}` as
        | "h2"
        | "h3"
        | "h4"
        | "h5"
        | "h6";
      return <Tag>{renderInline(block.children)}</Tag>;
    }

    case "quote":
      return (
        <blockquote>
          <p>{renderInline(block.children)}</p>
        </blockquote>
      );

    case "code":
      return (
        <pre>
          <code>{block.children.map((child) => child.text).join("")}</code>
        </pre>
      );

    case "list":
      return <List block={block} />;

    case "image":
      return (
        <figure>
          {/* Tall images are capped so a portrait doesn't fill the screen. */}
          <StrapiImage
            image={block.image}
            sizes="(min-width: 768px) 48rem, 100vw"
            className="mx-auto h-auto max-h-[36rem] w-auto max-w-full rounded-lg"
          />
          {block.image.caption && (
            <figcaption className="text-center">
              {block.image.caption}
            </figcaption>
          )}
        </figure>
      );

    default:
      return null;
  }
}

function List({ block }: { block: ListBlock }) {
  const Tag = block.format === "ordered" ? "ol" : "ul";
  return (
    <Tag>
      {block.children.map((child, index) =>
        child.type === "list" ? (
          // A nested list arrives as a sibling of the items; HTML wants it
          // inside an item.
          <li key={index} className="list-none">
            <List block={child} />
          </li>
        ) : (
          <li key={index}>{renderInline(child.children)}</li>
        ),
      )}
    </Tag>
  );
}

function renderInline(nodes: InlineNode[]): ReactNode {
  return nodes.map((node, index) => {
    if (node.type === "link" && node.url.startsWith("mailto:")) {
      return (
        <CopyEmail
          key={index}
          address={node.url.slice("mailto:".length).split("?")[0]}
          className="cursor-pointer font-medium text-(--tw-prose-links) underline"
        >
          {node.children.map((child, childIndex) => (
            <Text key={childIndex} node={child} />
          ))}
        </CopyEmail>
      );
    }
    if (node.type === "link") {
      return (
        <Anchor
          key={index}
          href={node.url}
          newTab={isExternalUrl(node.url)}
          // Footnote links ("[3]") stay plain; the icon would crowd them.
          externalIcon={!isFootnote(node.children)}
        >
          {node.children.map((child, childIndex) => (
            <Text key={childIndex} node={child} />
          ))}
        </Anchor>
      );
    }
    return <Text key={index} node={node} />;
  });
}

function Text({ node }: { node: TextNode }) {
  // Shift+Enter in the editor puts a line break inside the text.
  const lines = node.text.split("\n");
  let content: ReactNode = lines.map((line, index) => (
    <Fragment key={index}>
      {index > 0 && <br />}
      <WithEmails text={line} />
    </Fragment>
  ));

  if (node.code) content = <code>{content}</code>;
  if (node.bold) content = <strong>{content}</strong>;
  if (node.italic) content = <em>{content}</em>;
  if (node.underline) content = <u>{content}</u>;
  if (node.strikethrough) content = <s>{content}</s>;
  return content;
}

/** A link whose text is just a number, like the "[3]" of a footnote. */
function isFootnote(children: TextNode[]): boolean {
  return /^\[?\d+\]?$/.test(
    children
      .map((child) => child.text)
      .join("")
      .trim(),
  );
}
