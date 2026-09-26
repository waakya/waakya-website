"use client";

import * as React from "react";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getVendors } from "@/lib/i18n/vendors";
import type { Locale } from "@/lib/i18n";
import { VendorForm } from "../vendor-form";

export function VendorEdit({ locale, vendor }: { locale: Locale; vendor: { id: string; name: string; phone: string | null; email: string | null; category: string | null; notes: string | null; status: string } }) {
  const t = getVendors(locale);
  const [editing, setEditing] = React.useState(false);
  if (!editing) {
    return (
      <div className="mt-3">
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          <Pencil aria-hidden="true" />
          {t.fields.status}: {vendor.status === "active" ? t.status.active : t.status.inactive}
        </Button>
      </div>
    );
  }
  return <div className="mt-3"><VendorForm locale={locale} vendor={vendor} onDone={() => setEditing(false)} /></div>;
}
