import type { Core } from "@strapi/strapi";

/**
 * Content types the public site never shows. Writes to these don't need the
 * frontend's cache cleared.
 */
const PRIVATE_CONTENT_TYPES = new Set<string>([
  "api::contact-submission.contact-submission",
  "api::email-config.email-config",
]);

/**
 * Document Service actions that can change what the site shows. For content
 * types with drafts, saving a draft changes nothing the site shows (previews
 * skip the cache), so only these count; create and update count too when
 * they publish in the same call, as the REST API's do unless asked for a
 * draft.
 */
const PUBLISHED_CHANGES = new Set<string>(["publish", "unpublish", "delete"]);

/** For content types without drafts, every write is live at once. */
const WRITES = new Set<string>(["create", "update", "delete"]);

export interface DocumentWrite {
  uid: string;
  action: string;
  /** The content type has drafts (draftAndPublish). */
  hasDrafts: boolean;
  /** The `status` parameter of the call, if any. */
  status?: unknown;
}

/**
 * Publishing several entries at once fires one write per entry. Waiting a
 * moment after the last one turns a bulk publish into a single request.
 */
const DEBOUNCE_MS = 500;

let pending: NodeJS.Timeout | null = null;

export function affectsPublicSite({
  uid,
  action,
  hasDrafts,
  status,
}: DocumentWrite): boolean {
  if (!uid.startsWith("api::") || PRIVATE_CONTENT_TYPES.has(uid)) return false;
  if (!hasDrafts) return WRITES.has(action);
  return (
    PUBLISHED_CHANGES.has(action) ||
    ((action === "create" || action === "update") && status === "published")
  );
}

/**
 * Ask the frontend to drop its cached pages, so a publish shows up on the
 * next page load instead of after a timeout.
 *
 * Fire-and-forget on purpose: the editor's save must never fail because the
 * frontend was restarting. If a request is lost, the frontend's own fallback
 * revalidation interval still catches up.
 */
export function scheduleFrontendRevalidation(strapi: Core.Strapi): void {
  const url = process.env.FRONTEND_REVALIDATE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!url || !secret) return;

  if (pending) clearTimeout(pending);
  pending = setTimeout(() => {
    pending = null;
    void notifyFrontend(strapi, url, secret);
  }, DEBOUNCE_MS);
  pending.unref();
}

async function notifyFrontend(
  strapi: Core.Strapi,
  url: string,
  secret: string,
): Promise<void> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      strapi.log.warn(
        `Frontend revalidation returned HTTP ${response.status} from ${url}`,
      );
    }
  } catch (error: unknown) {
    strapi.log.warn(
      `Frontend revalidation failed (${url}): ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
