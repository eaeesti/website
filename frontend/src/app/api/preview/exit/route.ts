import { draftMode } from "next/headers";
import { isSafeRedirectPath } from "@/utils/secret";

/** The "exit preview" button in the preview banner posts here. */
export async function POST(request: Request) {
  const form = await request.formData();
  const path = form.get("path");

  (await draftMode()).disable();

  // 303, so the browser follows with a GET instead of re-posting.
  return new Response(null, {
    status: 303,
    headers: {
      Location:
        typeof path === "string" && isSafeRedirectPath(path) ? path : "/",
    },
  });
}
