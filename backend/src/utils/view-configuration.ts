/**
 * Helpers for the content manager's view configuration: the labels, help
 * texts and list settings editors see in the admin.
 */

export interface FieldHint {
  label?: string;
  description?: string;
  placeholder?: string;
}

type Metadata = Record<string, unknown>;

/** The stored shape (`plugin_content_manager_configuration_*`). */
export interface ViewConfiguration {
  settings: Record<string, unknown>;
  metadatas: Record<string, { edit?: Metadata; list?: Metadata }>;
  layouts: unknown;
}

const WORDS: Record<string, string> = {
  cta: "CTA",
  href: "link",
  id: "ID",
  seo: "SEO",
  url: "URL",
};

/** "postsPerPage" → "Posts per page", "videoUrl" → "Video URL" */
export function fieldLabel(name: string): string {
  const label = name
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(" ")
    .map((word) => WORDS[word] ?? word)
    .join(" ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * The configuration with every field's label, description and placeholder
 * taken from `hints`, or a label made from the field's name, and `settings`
 * merged in. Returns null when nothing would change.
 */
export function withFieldHints(
  configuration: ViewConfiguration,
  hints: Record<string, FieldHint> = {},
  settings: Record<string, unknown> = {},
): ViewConfiguration | null {
  const metadatas = Object.fromEntries(
    Object.entries(configuration.metadatas).map(([field, metadata]) => {
      const hint = hints[field] ?? {};
      const label = hint.label ?? fieldLabel(field);
      return [
        field,
        {
          ...metadata,
          ...(metadata.edit && {
            edit: {
              ...metadata.edit,
              label,
              description: hint.description ?? "",
              placeholder: hint.placeholder ?? "",
            },
          }),
          ...(metadata.list && { list: { ...metadata.list, label } }),
        },
      ];
    }),
  );
  const updated = {
    ...configuration,
    settings: { ...configuration.settings, ...settings },
    metadatas,
  };
  return JSON.stringify(updated) === JSON.stringify(configuration)
    ? null
    : updated;
}
