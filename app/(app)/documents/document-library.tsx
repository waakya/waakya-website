"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { DocumentList } from "@/components/waakya/document-list";
import { type Locale } from "@/lib/i18n";
import { getPhase1 } from "@/lib/i18n/phase1";
import type { DocumentItem } from "@/lib/documents/queries";
import { cn } from "@/lib/utils";

/** Search and category filter over the library, answered instantly. */
export function DocumentLibrary({
  locale,
  documents,
  viewerId,
  manages,
}: {
  locale: Locale;
  documents: DocumentItem[];
  viewerId: string;
  manages: boolean;
}) {
  const p = getPhase1(locale);
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<string>("all");

  const present = React.useMemo(
    () => [...new Set(documents.map((doc) => doc.category))],
    [documents],
  );

  const shown = documents.filter((doc) => {
    if (category !== "all" && doc.category !== category) return false;
    if (!query.trim()) return true;
    const needle = query.trim().toLowerCase();
    return (
      doc.name.toLowerCase().includes(needle) ||
      (doc.taskTitle ?? "").toLowerCase().includes(needle) ||
      (doc.projectName ?? "").toLowerCase().includes(needle) ||
      doc.uploaderName.toLowerCase().includes(needle)
    );
  });

  return (
    <section className="mt-5">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={p.documents.searchPlaceholder}
          aria-label={p.documents.searchPlaceholder}
          className="pl-9"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={p.documents.category}>
        {["all", ...present].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setCategory(value)}
            aria-pressed={category === value}
            className={cn(
              "rounded-chip border px-3 py-1 text-[13px] font-semibold transition-colors",
              category === value
                ? "border-neel-600 bg-neel-600 text-white"
                : "border-paper-200 bg-paper-0 text-ink-700 hover:bg-paper-100",
            )}
          >
            {value === "all" ? p.common.all : p.documents.categories[value]}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="mt-6 text-center text-[15px] text-ink-500">{p.documents.noResults}</p>
      ) : (
        <DocumentList
          className="mt-4"
          locale={locale}
          documents={shown}
          viewerId={viewerId}
          manages={manages}
        />
      )}
    </section>
  );
}
