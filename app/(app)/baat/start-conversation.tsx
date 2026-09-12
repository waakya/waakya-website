"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { getDictionary, type Locale } from "@/lib/i18n";
import { startDirectConversation } from "@/lib/actions/conversations";

/** Pick a teammate and open the one conversation you have with them. */
export function StartConversation({
  locale,
  people,
}: {
  locale: Locale;
  people: { userId: string; name: string; role: string }[];
}) {
  const t = getDictionary(locale);
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function start(userId: string) {
    setError(null);
    startTransition(async () => {
      const result = await startDirectConversation({ userId });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push(`/baat/${result.data.conversationId}`);
    });
  }

  return (
    <div>
      <Button variant="outline" onClick={() => setOpen((value) => !value)}>
        <Plus aria-hidden="true" />
        {t.baat.newChat}
      </Button>

      {open ? (
        <Card className="mt-3 p-3">
          <p className="mb-2 text-[13px] font-semibold text-ink-700">
            {t.baat.choosePerson}
          </p>
          {error ? (
            <p
              role="alert"
              className="mb-2 rounded-card bg-laal-100 px-3 py-2 text-[15px] text-laal-700"
            >
              {error}
            </p>
          ) : null}
          <ul className="flex flex-col gap-1">
            {people.map((person) => (
              <li key={person.userId}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => start(person.userId)}
                  className="flex w-full items-center gap-3 rounded-card px-2 py-2 text-left transition-colors hover:bg-paper-100 disabled:opacity-50"
                >
                  <Avatar name={person.name} size={30} />
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-semibold text-ink-900">
                      {person.name}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
