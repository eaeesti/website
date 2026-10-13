import type { Core } from "@strapi/strapi";

/**
 * Content types the public site never shows. Writes to these don't need the
 * frontend's cache cleared.
 */
const PRIVATE_CONTENT_TYPES = new Set<string>([
  "api::contact-submission.contact-submission",
  "api::email-config.email-config",
]);

/** Document Service actions that can change what the site shows. */
const WRITE_ACTIONS = new Set<string>([
  "create",
  "update",
  "delete",
  "publish",
  "unpublish",
  "discardDraft",
]);

/**
 * Publishing several entries at once fires one write per entry. Waiting a
 * moment after the last one turns a bulk publish into a single request.
 */
const DEBOUNCE_MS = 500;

let pending: NodeJS.Timeout | null = null;

export function affectsPublicSite(uid: string, action: string): boolean {
  return (
    uid.startsWith("api::") &&
    !PRIVATE_CONTENT_TYPES.has(uid) &&
    WRITE_ACTIONS.has(action)
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
