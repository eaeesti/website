/**
 * Splits items into two columns of about equal height, keeping their order
 * within each column. Each item goes to the column that is shorter so far.
 *
 * CSS columns would do this in the browser, but Safari balances them badly
 * when items can't be split (e.g. three cards on the left and one on the
 * right).
 */
export function balanceColumns<T>(
  items: T[],
  height: (item: T) => number,
): [T[], T[]] {
  const columns: [T[], T[]] = [[], []];
  const heights = [0, 0];
  for (const item of items) {
    const shorter = heights[1] < heights[0] ? 1 : 0;
    columns[shorter].push(item);
    heights[shorter] += height(item);
  }
  return columns;
}
