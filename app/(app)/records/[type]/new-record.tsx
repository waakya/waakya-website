"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Locale } from "@/lib/i18n";
import { getRecords } from "@/lib/i18n/records";
import { RecordForm, type FormType } from "./record-form";

/** The list's one primary: a new record, in a drawer so the list never jumps. */
export function NewRecord(props: {
  locale: Locale;
  type: FormType;
  people: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  contacts: { id: string; name: string }[];
  canSetVisibility: boolean;
}) {
  const t = getRecords(props.locale);
  const [open, setOpen] = React.useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button size="owner">
            <Plus aria-hidden="true" />
            {t.list.newRecord}: {props.type.name}
          </Button>
        }
      />
      <SheetContent side="drawer" aria-describedby={undefined}>
        <SheetTitle>
          {t.list.newRecord}: {props.type.name}
        </SheetTitle>
        <div className="mt-4">
          <RecordForm {...props} bare onCancel={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
