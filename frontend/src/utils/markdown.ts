import type {
  Block,
  BlocksContent,
  BlocksImage,
  InlineNode,
  ListBlock,
  TextNode,
} from "@/types/blocks";
import { isEmptyParagraph } from "./blocks";
import type { Locale } from "./locale";
import { safeHref, siteUrl } from "./url";

/**
 * Markdown, for the Markdown versions of the pages that AI agents and other
 * programs can read more easily than HTML (utils/page-markdown.ts). This file
 * has the building blocks: escaping, links, and Strapi's rich text.
 */

export interface MarkdownOptions {
  /** The page's language, for the "@" in email addresses. */
  locale: Locale;
}

/**
 * Where a page's Markdown version is: its address with .md added, and
 * index.md for a home page. Keep in sync with the rewrites in next.config.ts.
 */
export function markdownPath(path: string): string {
  if (path === "/") return "/index.md";
  if (path === "/en") return "/en/index.md";
  return `${path}.md`;
}

/**
 * Like the pages (Email.tsx), the Markdown has no email addresses as such:
 * "@" is written "[ät]", or "[at]" in English.
 */
const EMAIL_AT: Record<Locale, string> = { et: "[ät]", en: "[at]" };

// The same pattern as in Email.tsx.
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;

function hideEmails(text: string, { locale }: MarkdownOptions): string {
  return text.replace(EMAIL, (address) =>
    address.replace("@", EMAIL_AT[locale]),
  );
}

/**
 * Escapes what would turn text into formatting, links or HTML. An "_" only
 * matters at the edge of a word, so "some_name" stays as it is.
 */
function escapeInline(text: string): string {
  return (
    text
      // Soft hyphens, which editors add for line breaking, would only get in
      // the way of searching the text.
      .replace(/\u00AD/g, "")
      .replace(/[\\`*[\]<]/g, "\\$&")
      .replace(/(?<![\p{L}\p{N}])_|_(?![\p{L}\p{N}])/gu, "\\_")
  );
}

/**
 * Escapes what would make a line a heading, quote, list item or rule. Matters
 * for Estonian, where "2025. aastal" at the start of a paragraph would
 * otherwise become a numbered list starting at 2025.
 */
function escapeLineStart(line: string): string {
  return line
    .replace(/^(#{1,6})(?=\s|$)/, "\\$1")
    .replace(/^>/, "\\>")
    .replace(/^([-+])(?=\s|$)/, "\\$1")
    .replace(/^(\d{1,9})([.)])(?=\s|$)/, "$1\\$2")
    .replace(/^([=-])(?=\1*$)/, "\\$1");
}

/** A paragraph's lines, each escaped where it starts. */
function escapeLineStarts(text: string): string {
  return text
    .split("\n")
    .map((line) => escapeLineStart(line.trim()))
    .join("\n");
}

/** Plain text to put inside a line: escaped, on one line. */
export function inlineText(text: string, options: MarkdownOptions): string {
  return hideEmails(escapeInline(text.replace(/\s+/g, " ").trim()), options);
}

/** Plain text, possibly of several lines, as paragraphs. */
export function paragraphs(text: string, options: MarkdownOptions): string {
  return joinBlocks(
    text.split(/\n+/).map((line) => escapeLineStart(inlineText(line, options))),
  );
}

export function heading(
  level: number,
  text: string,
  options: MarkdownOptions,
): string {
  return `${"#".repeat(level)} ${inlineText(text, options)}`;
}

/**
 * The URL to link to: absolute, since the Markdown may be read anywhere.
 * Null for unsafe links (see safeHref), anchors on the same page and email
 * links, whose address isn't written out.
 */
export function absoluteUrl(href: string | null | undefined): string | null {
  const safe = safeHref(href);
  if (safe.startsWith("#") || safe.startsWith("mailto:")) return null;
  const url = safe.startsWith("/") ? siteUrl(safe) : safe;
  return url.replace(
    /[\s()<>]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/** A link, or only its text when there's nothing to link to. */
export function link(label: string, href: string | null | undefined): string {
  const url = absoluteUrl(href);
  return url ? `[${label}](${url})` : label;
}

/** Joins blocks (paragraphs, lists, headings), leaving out empty ones. */
export function joinBlocks(
  parts: (string | null | undefined | false | 0)[],
): string {
  return parts
    .filter((part) => typeof part === "string")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n\n");
}

/** A bulleted list. Each item's further lines are indented to stay in it. */
export function bulletList(items: string[]): string {
  return items.map((item) => `- ${item.replace(/\n/g, "\n  ")}`).join("\n");
}

export function quote(markdown: string): string {
  return markdown
    .split("\n")
    .map((line) => (line ? `> ${line}` : ">"))
    .join("\n");
}

/** An image, described by its alt text, with its caption under it. */
export function imageMarkdown(
  image: Pick<BlocksImage, "url" | "alternativeText" | "caption">,
  options: MarkdownOptions,
): string {
  const url = absoluteUrl(image.url);
  if (!url) return "";
  // Brackets would end the alt text early, escaped or not.
  const alt = inlineText(
    image.alternativeText ?? image.caption ?? "",
    options,
  ).replace(/\\?[[\]]/g, "");
  const caption = image.caption?.trim();
  return caption
    ? `![${alt}](${url})\n*${inlineText(caption, options)}*`
    : `![${alt}](${url})`;
}

// ── Rich text (Strapi's Blocks) ───────────────────────────────────────────────

/**
 * Rich text as Markdown, as BlocksContent renders it: a heading 1 becomes a
 * heading 2 (the page title is the only one), email links lose their link.
 */
export function blocksToMarkdown(
  content: BlocksContent | null | undefined,
  options: MarkdownOptions,
): string {
  return joinBlocks(
    (content ?? [])
      .filter((block) => !isEmptyParagraph(block))
      .map((block) => blockToMarkdown(block, options)),
  );
}

function blockToMarkdown(block: Block, options: MarkdownOptions): string {
  switch (block.type) {
    case "paragraph":
      return escapeLineStarts(inlineMarkdown(block.children, options));

    case "heading":
      return `${"#".repeat(Math.max(block.level, 2))} ${inlineMarkdown(
        block.children,
        options,
      )
        .replace(/\\\n/g, " ")
        .trim()}`;

    case "quote":
      return quote(escapeLineStarts(inlineMarkdown(block.children, options)));

    case "code": {
      const code = block.children.map((child) => child.text).join("");
      const fence = code.includes("```") ? "~~~" : "```";
      return `${fence}${block.language ?? ""}\n${code}\n${fence}`;
    }

    case "list":
      return listMarkdown(block, "", options);

    case "image":
      return imageMarkdown(block.image, options);

    default:
      return "";
  }
}

/**
 * A list. A nested list arrives as a sibling of the items and is indented
 * under the item before it, as far as that item's text starts.
 */
function listMarkdown(
  block: ListBlock,
  indent: string,
  options: MarkdownOptions,
): string {
  const lines: string[] = [];
  let number = 0;
  let itemIndent = `${indent}  `;
  for (const child of block.children) {
    if (child.type === "list") {
      lines.push(listMarkdown(child, itemIndent, options));
      continue;
    }
    number += 1;
    const marker = block.format === "ordered" ? `${number}.` : "-";
    itemIndent = indent + " ".repeat(marker.length + 1);
    const text = escapeLineStarts(inlineMarkdown(child.children, options));
    lines.push(`${indent}${marker} ${text.replace(/\n/g, `\n${itemIndent}`)}`);
  }
  return lines.join("\n");
}

type Marks = Pick<TextNode, "bold" | "italic" | "strikethrough" | "code">;

function sameMarks(a: Marks, b: Marks): boolean {
  return (
    Boolean(a.bold) === Boolean(b.bold) &&
    Boolean(a.italic) === Boolean(b.italic) &&
    Boolean(a.strikethrough) === Boolean(b.strikethrough) &&
    Boolean(a.code) === Boolean(b.code)
  );
}

/**
 * Text with the same formatting in a row is merged first: "**a****b**"
 * wouldn't read as bold.
 */
function mergeText<T extends InlineNode>(nodes: T[]): T[] {
  const merged: T[] = [];
  for (const node of nodes) {
    const previous = merged.at(-1);
    if (
      previous?.type === "text" &&
      node.type === "text" &&
      sameMarks(previous, node)
    ) {
      merged[merged.length - 1] = {
        ...previous,
        text: previous.text + node.text,
      };
    } else {
      merged.push(node);
    }
  }
  return merged;
}

/** A line break inside a paragraph (Shift+Enter in the editor). */
const LINE_BREAK = "\\\n";

function inlineMarkdown(nodes: InlineNode[], options: MarkdownOptions): string {
  return mergeText(nodes)
    .map((node) => {
      if (node.type === "text") return textMarkdown(node, options);
      const label = mergeText(node.children)
        .map((child) => textMarkdown(child, options))
        .join("");
      return link(label, node.url);
    })
    .join("");
}

function textMarkdown(node: TextNode, options: MarkdownOptions): string {
  // Formatting marks must touch the text: "** bold **" isn't bold.
  const [, before = "", core = "", after = ""] =
    /^(\s*)([\s\S]*?)(\s*)$/.exec(node.text) ?? [];
  const space = (whitespace: string) =>
    whitespace.includes("\n") ? LINE_BREAK : whitespace ? " " : "";
  if (!core) return space(node.text);

  let text = node.code
    ? core.includes("`")
      ? `\`\` ${core} \`\``
      : `\`${core}\``
    : core
        .split("\n")
        .map((line) => hideEmails(escapeInline(line), options))
        .join(LINE_BREAK);
  if (node.bold) text = `**${text}**`;
  if (node.italic) text = `*${text}*`;
  if (node.strikethrough) text = `~~${text}~~`;
  return space(before) + text + space(after);
}
