"use client";

import * as React from "react";
import { Camera, Check, Send, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InputOTP } from "@/components/ui/input-otp";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/sonner";

/** The client half of the style tile: every stateful primitive, once. */
export function PreviewInteractive({
  proofLabel,
  consentLabel,
  priorityLabels,
  sheetTitle,
  sheetPrimary,
  undoLabel,
}: {
  proofLabel: string;
  consentLabel: string;
  priorityLabels: [string, string];
  sheetTitle: string;
  sheetPrimary: string;
  undoLabel: string;
}) {
  const [priority, setPriority] = React.useState<string[]>(["normal"]);
  const [proof, setProof] = React.useState(true);
  const [consent, setConsent] = React.useState(true);

  return (
    <div className="flex flex-col gap-4">
      <InputOTP defaultValue="4821" />

      <ToggleGroup
        value={priority}
        onValueChange={(next) => setPriority(next.length ? next : priority)}
        aria-label="Priority"
      >
        <ToggleGroupItem value="normal">{priorityLabels[0]}</ToggleGroupItem>
        <ToggleGroupItem value="urgent">
          <Zap />
          {priorityLabels[1]}
        </ToggleGroupItem>
      </ToggleGroup>

      <label className="flex min-h-tap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[17px] font-bold text-ink-900">
          <Camera className="size-5" />
          {proofLabel}
        </span>
        <Switch checked={proof} onCheckedChange={setProof} />
      </label>

      <label className="flex min-h-tap items-center gap-3">
        <Checkbox checked={consent} onCheckedChange={setConsent} />
        <span className="text-[15px] leading-[20px] text-ink-900">
          {consentLabel}
        </span>
      </label>

      <div className="flex flex-wrap gap-2">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="outline">
                <Camera />
                Bottom sheet
              </Button>
            }
          />
          <SheetContent>
            <SheetTitle>{sheetTitle}</SheetTitle>
            <SheetDescription>
              Rakesh ji ne photo maangi hai. Camera khula hai, bas khinchiye.
            </SheetDescription>
            <div className="mt-4 flex flex-col gap-2">
              <SheetClose
                render={
                  <Button size="block">
                    <Send />
                    {sheetPrimary}
                  </Button>
                }
              />
              <SheetClose render={<Button variant="ghost">Band karein</Button>} />
            </div>
          </SheetContent>
        </Sheet>

        <Button
          variant="secondary"
          onClick={() =>
            toast("Kaam bheja gaya", {
              description: "Raju ko abhi bheja.",
              action: { label: undoLabel, onClick: () => undefined },
              icon: <Check className="size-4" />,
            })
          }
        >
          Toast with undo
        </Button>
      </div>
    </div>
  );
}
