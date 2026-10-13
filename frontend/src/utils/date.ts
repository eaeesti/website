/**
 * Formats a Strapi date ("2026-05-17") for display, e.g. "17. mai 2026".
 *
 * Date-only strings parse as UTC midnight, so they are formatted in UTC too;
 * formatting in local time would show the previous day west of Greenwich.
 */
export function formatDate(
  date: string | null | undefined,
  locale: string | null | undefined,
): string | null {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString(locale ?? "et-EE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
