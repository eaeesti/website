import type { Block, BlocksContent, InlineNode } from "@/types/blocks";

/** The editor leaves empty paragraphs behind, e.g. after the last line. */
export function isEmptyParagraph(block: Block): boolean {
  return (
    block.type === "paragraph" &&
    block.children.every(
      (child) => child.type === "text" && child.text.trim() === "",
    )
  );
}

export function hasBlocksContent(
  content: BlocksContent | null | undefined,
): boolean {
  return (content ?? []).some((block) => !isEmptyParagraph(block));
}

/**
 * The URL when a paragraph holds nothing but one link (or a bare URL as
 * text), which is how a player is placed in rich text.
 */
export function standaloneUrl(nodes: InlineNode[]): string | null {
  const meaningful = nodes.filter(
    (node) => node.type === "link" || node.text.trim() !== "",
  );
  if (meaningful.length !== 1) return null;
  const [node] = meaningful;
  if (node.type === "link") return node.url;
  return /^https?:\/\/\S+$/.test(node.text.trim()) ? node.text.trim() : null;
}

/** How many characters of text the content has, e.g. to estimate its height. */
export function blocksTextLength(
  content: BlocksContent | null | undefined,
): number {
  type Node = { text: string } | { children: Node[] };
  const length = (node: Node): number =>
    "text" in node
      ? node.text.length
      : "children" in node
        ? node.children.reduce((sum, child) => sum + length(child), 0)
        : 0;
  return (content ?? []).reduce((sum, block) => sum + length(block), 0);
}
