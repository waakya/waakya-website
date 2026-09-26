/**
 * Today's "never hidden" rule as a pure function (docs/WAAKYA_V3_INFORMATION_
 * ARCHITECTURE.md, "Today's contract"). Items keep their order; groups appear
 * in the order their first item appears. Short lists show everything; from
 * `busyAt` items, each group shows its first `perGroup` and reports how many
 * more it holds. No item is ever dropped without being counted.
 */
export interface Folded<T, K extends string> {
  key: K;
  /** Everything in the group, for its count. */
  total: number;
  shown: T[];
  /** How many are behind the group's "N more" link. */
  rest: number;
}

export function foldGroups<T, K extends string>(
  items: T[],
  groupOf: (item: T) => K,
  { perGroup = 3, busyAt = 9 }: { perGroup?: number; busyAt?: number } = {},
): Folded<T, K>[] {
  const groups: { key: K; items: T[] }[] = [];
  for (const item of items) {
    const key = groupOf(item);
    const group = groups.find((g) => g.key === key);
    if (group) group.items.push(item);
    else groups.push({ key, items: [item] });
  }
  const busy = items.length >= busyAt;
  return groups.map(({ key, items: all }) => {
    const shown = busy ? all.slice(0, perGroup) : all;
    return { key, total: all.length, shown, rest: all.length - shown.length };
  });
}
