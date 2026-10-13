#!/usr/bin/env node
/**
 * scripts/generate-strapi-types.mjs
 *
 * Reads the Strapi schema.json files in backend/src and generates TypeScript
 * interfaces to frontend/src/types/generated/strapi.ts.
 *
 * Interface names come from the UID ("sections.hero-section" →
 * StrapiHeroSection, "api::blog-post.blog-post" → StrapiBlogPost), not from
 * displayName, so display names can change freely.
 *
 * Run manually:  node scripts/generate-strapi-types.mjs
 * Auto-runs via: the dev and build scripts in backend/package.json
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const backendSrc = path.join(repoRoot, "backend", "src");
const outputDir = path.join(repoRoot, "frontend", "src", "types", "generated");
const outputFile = path.join(outputDir, "strapi.ts");

// ── Helpers ───────────────────────────────────────────────────────────────────

function findJsonFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findJsonFiles(full));
    else if (entry.name.endsWith(".json")) results.push(full);
  }
  return results;
}

function toPascalCase(str) {
  return str
    .replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (c) => c.toUpperCase());
}

function isLocalized(schema) {
  return schema.pluginOptions?.i18n?.localized === true;
}

// ── Step 1: Read all schemas ──────────────────────────────────────────────────

const componentDir = path.join(backendSrc, "components");
const apiDir = path.join(backendSrc, "api");

/** @type {Map<string, string>} uid → interface name */
const uidToName = new Map();
/** @type {Map<string, object>} */
const componentSchemas = new Map();
/** @type {Map<string, object>} */
const contentTypeSchemas = new Map();

for (const file of findJsonFiles(componentDir)) {
  // "sections/hero-section.json" → "sections.hero-section"
  const [category, fileName] = path
    .relative(componentDir, file)
    .split(path.sep);
  const name = fileName.replace(".json", "");
  const uid = `${category}.${name}`;
  uidToName.set(uid, "Strapi" + toPascalCase(name));
  componentSchemas.set(uid, JSON.parse(readFileSync(file, "utf8")));
}

for (const file of findJsonFiles(apiDir).filter((f) =>
  f.includes("content-types"),
)) {
  const schema = JSON.parse(readFileSync(file, "utf8"));
  const { singularName } = schema.info;
  const uid = `api::${singularName}.${singularName}`;
  uidToName.set(uid, "Strapi" + toPascalCase(singularName));
  contentTypeSchemas.set(uid, schema);
}

// ── Step 2: Collect dynamic zone members ──────────────────────────────────────

/** UIDs that appear in a dynamic zone (they get a __component discriminant) */
const dynamicZoneUids = new Set();
for (const schema of contentTypeSchemas.values()) {
  for (const attr of Object.values(schema.attributes ?? {})) {
    if (attr.type === "dynamiczone") {
      for (const uid of attr.components ?? []) dynamicZoneUids.add(uid);
    }
  }
}

// ── Step 3: Type mapping ──────────────────────────────────────────────────────

function attrToType(attr) {
  switch (attr.type) {
    case "string":
    case "text":
    case "richtext":
    case "uid":
    case "email":
    case "password":
    case "date":
    case "datetime":
    case "time":
      return attr.required ? "string" : "string | null";

    case "integer":
    case "biginteger":
    case "float":
    case "decimal":
      return attr.required ? "number" : "number | null";

    case "boolean":
      return attr.required ? "boolean" : "boolean | null";

    case "blocks":
      return "BlocksContent | null";

    case "json":
      return "unknown";

    case "enumeration":
      return attr.enum.map((v) => `"${v}"`).join(" | ") + " | null";

    case "media":
      return attr.multiple ? "StrapiMedia[]" : "StrapiMedia | null";

    case "component": {
      const name = uidToName.get(attr.component) ?? "unknown";
      return attr.repeatable ? `${name}[]` : `${name} | null`;
    }

    case "relation": {
      const name = uidToName.get(attr.target) ?? "unknown";
      const isMany = ["oneToMany", "manyToMany", "morphMany"].includes(
        attr.relation,
      );
      // Relations are only present when the query populates them.
      return isMany ? `${name}[] | undefined` : `${name} | null | undefined`;
    }

    case "dynamiczone":
      // The page's sections are the only dynamic zone.
      return "StrapiSection[]";

    default:
      return "unknown";
  }
}

// ── Step 4: Interface bodies ──────────────────────────────────────────────────

function generateInterfaceBody(schema, { uid, isContentType = false }) {
  const lines = ["  id: number;"];

  if (isContentType) lines.push("  documentId: string;");
  if (dynamicZoneUids.has(uid)) lines.push(`  __component: "${uid}";`);

  for (const [name, attr] of Object.entries(schema.attributes ?? {})) {
    const optional = attr.type === "relation" ? "?" : "";
    lines.push(`  ${name}${optional}: ${attrToType(attr)};`);
  }

  if (isContentType) {
    lines.push("  createdAt: string | null;");
    lines.push("  updatedAt: string | null;");
    if (schema.options?.draftAndPublish) {
      lines.push("  publishedAt: string | null;");
    }
    if (isLocalized(schema)) {
      lines.push("  locale: string;");
      lines.push(
        "  localizations?: Array<{ documentId: string; locale: string; slug?: string | null }>;",
      );
    }
  }

  return lines.join("\n");
}

// ── Step 5: Assemble output ───────────────────────────────────────────────────

const out = [
  "// Auto-generated by scripts/generate-strapi-types.mjs",
  "// Do not edit manually — re-run `pnpm generate-types` after changing Strapi schemas.",
  "",
  'import type { BlocksContent } from "../blocks";',
  "",
  "export interface StrapiMedia {",
  "  id: number;",
  "  documentId: string;",
  "  url: string;",
  "  alternativeText: string | null;",
  "  caption: string | null;",
  "  width: number | null;",
  "  height: number | null;",
  "  formats: Record<string, unknown> | null;",
  "  name: string | null;",
  "  mime: string | null;",
  "  size: number | null;",
  "}",
  "",
  "// ─────────────────────────────────────────────",
  "// Components",
  "// ─────────────────────────────────────────────",
  "",
];

for (const [uid, schema] of componentSchemas) {
  out.push(
    `export interface ${uidToName.get(uid)} {`,
    generateInterfaceBody(schema, { uid }),
    "}",
    "",
  );
}

if (dynamicZoneUids.size > 0) {
  out.push("export type StrapiSection =");
  const names = [...dynamicZoneUids].map((uid) => uidToName.get(uid));
  names.forEach((name, i) => {
    out.push(`  | ${name}${i === names.length - 1 ? ";" : ""}`);
  });
  out.push("");
}

out.push(
  "// ─────────────────────────────────────────────",
  "// Content types",
  "// ─────────────────────────────────────────────",
  "",
);

for (const [uid, schema] of contentTypeSchemas) {
  out.push(
    `export interface ${uidToName.get(uid)} {`,
    generateInterfaceBody(schema, { uid, isContentType: true }),
    "}",
    "",
  );
}

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputFile, out.join("\n"));

console.log(
  `✅  Generated Strapi types → ${path.relative(repoRoot, outputFile)}`,
);
