import type { FieldDefinition, StatusDefinition } from "./schema";

/**
 * Record type templates: the shapes two reference businesses start from.
 * A template is data. Any business can install one and then change it;
 * nothing in the code ever asks which template a type came from.
 */
export interface RecordTemplate {
  key: string;
  name: string;
  namePlural: string;
  icon: string;
  description: string;
  statuses: StatusDefinition[];
  defaultStatus: string;
  customerVisibleDefault: boolean;
  fields: Omit<FieldDefinition, "position">[];
}

const f = (
  key: string,
  label: string,
  fieldType: FieldDefinition["fieldType"],
  extra: Partial<Omit<FieldDefinition, "key" | "label" | "fieldType" | "position">> = {},
): Omit<FieldDefinition, "position"> => ({
  key,
  label,
  fieldType,
  required: false,
  showInList: true,
  customerVisible: false,
  unit: null,
  options: {},
  ...extra,
});

export const RECORD_TEMPLATES: Record<string, RecordTemplate> = {
  property_unit: {
    key: "property_unit",
    name: "Property unit",
    namePlural: "Property inventory",
    icon: "building",
    description: "Every flat, plot or shop you sell: where it is, what it is, what it costs, whether it is still available.",
    statuses: [
      { key: "available", label: "Available", tone: "hara" },
      { key: "held", label: "Held", tone: "amber" },
      { key: "booked", label: "Booked", tone: "neel" },
      { key: "sold", label: "Sold", tone: "muted", isTerminal: true },
      { key: "blocked", label: "Not for sale", tone: "outline" },
    ],
    defaultStatus: "available",
    customerVisibleDefault: false,
    fields: [
      f("tower", "Tower / Block", "text"),
      f("unit_number", "Unit number", "text", { required: true }),
      f("unit_type", "Type", "select", { options: { choices: [{ key: "1bhk", label: "1 BHK" }, { key: "2bhk", label: "2 BHK" }, { key: "3bhk", label: "3 BHK" }, { key: "4bhk", label: "4 BHK" }, { key: "plot", label: "Plot" }, { key: "shop", label: "Shop" }, { key: "office", label: "Office" }] } }),
      f("floor", "Floor", "number"),
      f("area_sqft", "Area", "number", { unit: "sq ft", options: { min: 0 } }),
      f("facing", "Facing", "select", { options: { choices: [{ key: "east", label: "East" }, { key: "west", label: "West" }, { key: "north", label: "North" }, { key: "south", label: "South" }] }, showInList: false }),
      f("price", "Price", "money"),
      f("salesperson", "Salesperson", "member", { showInList: false }),
      f("notes", "Notes", "long_text", { showInList: false }),
    ],
  },
  work_package: {
    key: "work_package",
    name: "Work package",
    namePlural: "Work packages",
    icon: "hammer",
    description: "One piece of a project a vendor delivers: what, how much, who, what it costs, whether it is paid and done.",
    statuses: [
      { key: "planned", label: "Planned", tone: "outline" },
      { key: "waiting_customer", label: "Waiting on customer", tone: "amber" },
      { key: "ordered", label: "Ordered", tone: "neel" },
      { key: "in_progress", label: "In progress", tone: "neel" },
      { key: "submitted", label: "Submitted, to verify", tone: "amber" },
      { key: "complete", label: "Complete", tone: "hara", isTerminal: true },
      { key: "on_hold", label: "On hold", tone: "muted" },
    ],
    defaultStatus: "planned",
    customerVisibleDefault: true,
    fields: [
      f("area", "Area", "text", { customerVisible: true }),
      f("category", "Category", "select", { customerVisible: true, options: { choices: [{ key: "civil", label: "Civil" }, { key: "electrical", label: "Electrical" }, { key: "plumbing", label: "Plumbing" }, { key: "carpentry", label: "Carpentry" }, { key: "false_ceiling", label: "False ceiling" }, { key: "flooring", label: "Flooring" }, { key: "painting", label: "Painting" }, { key: "furniture", label: "Furniture" }, { key: "lighting", label: "Lighting" }, { key: "other", label: "Other" }] } }),
      f("item", "Item", "text", { required: true, customerVisible: true }),
      f("quantity", "Quantity", "number", { customerVisible: true, options: { min: 0 } }),
      f("cost", "Cost", "money"),
      f("payment_status", "Payment", "select", { options: { choices: [{ key: "unpaid", label: "Unpaid" }, { key: "advance", label: "Advance paid" }, { key: "paid", label: "Paid" }] } }),
      f("target_date", "Target date", "date", { customerVisible: true }),
      f("notes", "Notes", "long_text", { showInList: false }),
    ],
  },
};

export function recordTemplate(key: string): RecordTemplate | undefined {
  return RECORD_TEMPLATES[key];
}
