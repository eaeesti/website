import { createHash, timingSafeEqual } from "node:crypto";

const digest = (value: string) => createHash("sha256").update(value).digest();

/**
 * Compares a request's secret against the configured one in constant time.
 * Hashing first makes the lengths equal, which timingSafeEqual requires.
 * An unset secret never matches, so a missing env var fails closed.
 */
export function secretMatches(
  provided: string | null,
  expected: string | undefined,
): boolean {
  if (!expected || !provided) return false;
  return timingSafeEqual(digest(provided), digest(expected));
}

/**
 * Only paths on this site may be redirected to, never "//evil.example" or
 * "https://evil.example", so the preview routes can't be used as open
 * redirects.
 */
export function isSafeRedirectPath(
  path: string | null | undefined,
): path is string {
  if (
    !path ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\")
  ) {
    return false;
  }
  try {
    return new URL(path, "http://localhost").origin === "http://localhost";
  } catch {
    return false;
  }
}
