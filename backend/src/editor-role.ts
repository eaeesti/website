/**
 * The Editor role: everything volunteers need to run the site, nothing that
 * could lock others out or leak data. Set on every boot, so this file is the
 * source of truth: changes made to the role in the admin are overwritten.
 *
 * Editors can create, edit, publish and delete all content, in every
 * language and every field (new fields included), upload and edit media,
 * and handle contact form messages. They can't delete media (a page using
 * the file would break), change who receives contact form messages (Email
 * settings), or reach users, roles, API tokens or any other settings.
 */
import type { Core } from "@strapi/strapi";

/** Content types editors don't see at all. */
const HIDDEN_FROM_EDITORS = [
  "api::email-config.email-config",
  "plugin::users-permissions.user",
];

const MEDIA_ACTIONS = [
  "plugin::upload.read",
  "plugin::upload.configure-view",
  "plugin::upload.assets.create",
  "plugin::upload.assets.update",
  "plugin::upload.assets.download",
  "plugin::upload.assets.copy-link",
];

interface Permission {
  action: string;
  subject?: string | null;
  properties?: Record<string, unknown>;
  conditions?: string[];
}

interface Action {
  actionId: string;
  section: string;
  subjects?: string[];
}

interface PermissionServices {
  actions: Action[];
  withNestedFields(
    actions: Action[],
    options: { restrictedSubjects: string[] },
  ): Permission[];
  assign(roleId: number, permissions: Permission[]): Promise<unknown>;
}

function services(strapi: Core.Strapi): PermissionServices {
  const permission = strapi.service("admin::permission") as unknown as {
    actionProvider: { values(): Action[] };
  };
  const contentType = strapi.service("admin::content-type") as unknown as {
    getPermissionsWithNestedFields: PermissionServices["withNestedFields"];
  };
  const role = strapi.service("admin::role") as unknown as {
    assignPermissions: PermissionServices["assign"];
  };
  return {
    actions: permission.actionProvider.values(),
    withNestedFields: (actions, options) =>
      contentType.getPermissionsWithNestedFields(actions, options),
    assign: (roleId, permissions) =>
      role.assignPermissions(roleId, permissions),
  };
}

export async function syncEditorRole(strapi: Core.Strapi): Promise<void> {
  const editor = (await strapi.db
    .query("admin::role")
    .findOne({ where: { code: "strapi-editor" } })) as { id: number } | null;
  if (!editor) return;

  const { actions, withNestedFields, assign } = services(strapi);
  const hidden = [
    ...HIDDEN_FROM_EDITORS,
    // Types the content manager doesn't show (Strapi's own internals).
    ...Object.values(strapi.contentTypes)
      .filter(
        (type) =>
          !type.uid.startsWith("api::") &&
          (type.pluginOptions?.["content-manager"] as { visible?: boolean })
            ?.visible === false,
      )
      .map((type) => type.uid),
  ];

  const locales = (
    (await strapi.db.query("plugin::i18n.locale").findMany({})) as {
      code: string;
    }[]
  ).map((locale) => locale.code);

  const localized = new Set(
    Object.values(strapi.contentTypes)
      .filter(
        (type) =>
          (type.pluginOptions?.i18n as { localized?: boolean } | undefined)
            ?.localized,
      )
      .map((type) => type.uid),
  );

  const content = withNestedFields(
    actions.filter((action) => action.section === "contentTypes"),
    { restrictedSubjects: hidden },
  )
    .filter((permission) => permission.subject?.startsWith("api::"))
    .map((permission) =>
      permission.subject && localized.has(permission.subject)
        ? { ...permission, properties: { ...permission.properties, locales } }
        : permission,
    );

  await assign(editor.id, [
    ...content,
    ...MEDIA_ACTIONS.map((action) => ({ action })),
  ]);
  strapi.log.info(
    `✅ Editor role synced (${content.length} content permissions)`,
  );
}
