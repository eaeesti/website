/**
 * The JSON that Strapi's Blocks editor stores. Strapi doesn't export these
 * types for the frontend, so they are written out here.
 */

export interface TextNode {
  type: "text";
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
}

export interface LinkNode {
  type: "link";
  url: string;
  children: TextNode[];
}

export type InlineNode = TextNode | LinkNode;

export interface ParagraphBlock {
  type: "paragraph";
  children: InlineNode[];
}

export interface HeadingBlock {
  type: "heading";
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: InlineNode[];
}

export interface QuoteBlock {
  type: "quote";
  children: InlineNode[];
}

export interface CodeBlock {
  type: "code";
  language?: string;
  children: TextNode[];
}

export interface ListItemBlock {
  type: "list-item";
  children: InlineNode[];
}

export interface ListBlock {
  type: "list";
  format: "ordered" | "unordered";
  indentLevel?: number;
  children: (ListItemBlock | ListBlock)[];
}

export interface BlocksImage {
  name: string;
  url: string;
  alternativeText?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
  mime?: string | null;
}

export interface ImageBlock {
  type: "image";
  image: BlocksImage;
  children: TextNode[];
}

export type Block =
  | ParagraphBlock
  | HeadingBlock
  | QuoteBlock
  | CodeBlock
  | ListBlock
  | ImageBlock;

export type BlocksContent = Block[];
