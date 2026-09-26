"use client";

import { useRouter } from "next/navigation";

/**
 * "Everything this person has" without going back to Today (V3 review).
 * Two people with the same name are told apart by the end of their number.
 */
export function PersonFilter({
  people,
  current,
  label,
  anyone,
  keep,
}: {
  people: { id: string; name: string; phone: string | null }[];
  current: string | null;
  label: string;
  anyone: string;
  /** The status filter to keep while switching person. */
  keep: string | null;
}) {
  const router = useRouter();
  const counts = new Map<string, number>();
  for (const person of people) counts.set(person.name, (counts.get(person.name) ?? 0) + 1);
  const sorted = [...people].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <label className="mb-2 flex min-h-11 items-center gap-2 text-label font-semibold text-fg-muted">
      <span className="sr-only">{label}</span>
      <select
        value={current ?? ""}
        onChange={(event) => {
          const q = new URLSearchParams();
          if (keep) q.set("status", keep);
          if (event.target.value) q.set("person", event.target.value);
          const text = q.toString();
          router.push(text ? `/work?${text}` : "/work");
        }}
        className="h-11 max-w-[14rem] rounded-button border border-line bg-surface px-3 text-body-sm text-fg"
      >
        <option value="">{anyone}</option>
        {sorted.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name}
            {(counts.get(person.name) ?? 0) > 1 && person.phone ? ` · …${person.phone.slice(-4)}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
