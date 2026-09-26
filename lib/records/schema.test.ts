import { describe, expect, it } from "vitest";
import { formatValue, keyFromLabel, listColumns, nextStatuses, statusOf, validateValues, type FieldDefinition } from "./schema";

const field = (key: string, fieldType: FieldDefinition["fieldType"], extra: Partial<FieldDefinition> = {}): FieldDefinition => ({
  key,
  label: key,
  fieldType,
  required: false,
  position: 0,
  showInList: true,
  customerVisible: false,
  unit: null,
  options: {},
  ...extra,
});

describe("validating record values", () => {
  const fields = [
    field("unit", "text", { required: true }),
    field("area", "number", { unit: "sq ft", options: { min: 0 } }),
    field("price", "money"),
    field("handover", "date"),
    field("corner", "boolean"),
    field("facing", "select", { options: { choices: [{ key: "east", label: "East" }, { key: "west", label: "West" }] } }),
    field("amenities", "multi_select", { options: { choices: [{ key: "lift", label: "Lift" }, { key: "parking", label: "Parking" }] } }),
    field("buyer_phone", "phone"),
    field("salesperson", "member"),
  ];

  it("cleans a good form into typed values", () => {
    const { values, issues } = validateValues(fields, {
      unit: " 101 ",
      area: "1,420",
      price: "₹ 85,00,000",
      handover: "2027-03-31",
      corner: "on",
      facing: "east",
      amenities: ["lift", "parking", "lift"],
      buyer_phone: "+91 98765 43210",
      salesperson: "2b1c6f1e-9c3a-4c1e-8f5d-1a2b3c4d5e6f",
      nonsense: "dropped",
    });
    expect(issues).toEqual([]);
    expect(values).toEqual({
      unit: "101",
      area: 1420,
      price: 8500000,
      handover: "2027-03-31",
      corner: true,
      facing: "east",
      amenities: ["lift", "parking"],
      buyer_phone: "+919876543210",
      salesperson: "2b1c6f1e-9c3a-4c1e-8f5d-1a2b3c4d5e6f",
    });
    expect("nonsense" in values).toBe(false);
  });

  it("names every problem, per field", () => {
    const { issues } = validateValues(fields, {
      unit: "",
      area: "-5",
      price: "abc",
      handover: "31/03/2027",
      facing: "north",
      amenities: ["pool"],
      buyer_phone: "call me",
      salesperson: "not-a-uuid",
    });
    expect(issues).toEqual([
      { key: "unit", reason: "required" },
      { key: "area", reason: "range" },
      { key: "price", reason: "type" },
      { key: "handover", reason: "format" },
      { key: "facing", reason: "choice" },
      { key: "amenities", reason: "choice" },
      { key: "buyer_phone", reason: "format" },
      { key: "salesperson", reason: "format" },
    ]);
  });

  it("treats empty optional fields as null, not as errors", () => {
    const { values, issues } = validateValues(fields, { unit: "A" });
    expect(issues).toEqual([]);
    expect(values.price).toBeNull();
  });
});

describe("reading values", () => {
  const words = { yes: "Yes", no: "No", none: "—" };
  it("formats money in rupees and choices by label", () => {
    expect(formatValue(field("p", "money"), 8500000, words)).toBe("₹85,00,000");
    expect(formatValue(field("a", "number", { unit: "sq ft" }), 1420, words)).toBe("1,420 sq ft");
    expect(formatValue(field("f", "select", { options: { choices: [{ key: "east", label: "East" }] } }), "east", words)).toBe("East");
    expect(formatValue(field("c", "boolean"), false, words)).toBe("No");
    expect(formatValue(field("c", "boolean"), null, words)).toBe("—");
    expect(formatValue(field("m", "member"), "u1", words, { names: new Map([["u1", "Neha"]]) })).toBe("Neha");
  });
  it("shows at most six list columns in position order", () => {
    const many = Array.from({ length: 9 }, (_, i) => field(`f${i}`, "text", { position: 9 - i }));
    expect(listColumns(many).map((f) => f.key)).toEqual(["f8", "f7", "f6", "f5", "f4", "f3"]);
  });
});

describe("statuses and keys", () => {
  const statuses = [
    { key: "available", label: "Available", tone: "hara" as const },
    { key: "held", label: "Held", tone: "amber" as const },
    { key: "sold", label: "Sold", tone: "neel" as const, isTerminal: true },
  ];
  it("offers every other status as a move", () => {
    expect(nextStatuses(statuses, "held").map((s) => s.key)).toEqual(["available", "sold"]);
  });
  it("never crashes on an unknown status", () => {
    expect(statusOf(statuses, "vanished")).toEqual({ key: "vanished", label: "vanished", tone: "outline" });
    expect(statusOf(statuses, null)).toBeNull();
  });
  it("makes stable keys from labels", () => {
    expect(keyFromLabel("Unit Number")).toBe("unit_number");
    expect(keyFromLabel("  Area (sq ft) ")).toBe("area_sq_ft");
    expect(keyFromLabel("2 BHK")).toBe("f_2_bhk");
  });
});
