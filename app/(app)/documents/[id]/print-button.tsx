"use client";

import { Download, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { openDocument } from "@/lib/actions/documents";

/** Print the rendered document, or save it as a PDF through the print dialog. */
export function PrintButton({
  label,
  downloadLabel,
  documentId,
}: {
  label: string;
  downloadLabel: string;
  documentId: string;
}) {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={async () => {
          const result = await openDocument({ id: documentId, download: true });
          if (result.ok) window.location.assign(result.data.url);
        }}
      >
        <Download aria-hidden="true" />
        {downloadLabel}
      </Button>
      <Button
        onClick={() => {
          const frame = document.getElementById("document-frame") as HTMLIFrameElement | null;
          frame?.contentWindow?.focus();
          frame?.contentWindow?.print();
        }}
      >
        <Printer aria-hidden="true" />
        {label}
      </Button>
    </div>
  );
}
