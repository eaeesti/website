import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { isSafeRedirectPath, secretMatches } from "@/utils/secret";

/**
 * Strapi's "Preview" button opens this (see backend/config/admin.js). Draft
 * versions turn draft mode on, so pages fetch unpublished content; the
 * published version turns it off.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (!secretMatches(searchParams.get("secret"), process.env.PREVIEW_SECRET)) {
    return new Response("Invalid preview secret", { status: 401 });
  }

  const path = searchParams.get("path");
  if (!isSafeRedirectPath(path)) {
    return new Response("Invalid path", { status: 400 });
  }

  const draft = await draftMode();
  if (searchParams.get("status") === "published") draft.disable();
  else draft.enable();

  redirect(path);
}
