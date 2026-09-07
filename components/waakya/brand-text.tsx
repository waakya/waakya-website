import { Fragment } from "react";

/**
 * A sentence with the brand name in it, where the name is marked so no
 * translator treats it as a word. The copy is a formatted string (the
 * dictionaries interpolate the name); this splits it back out rather than
 * asking every locale to return JSX.
 */
export function BrandText({ text, brand }: { text: string; brand: string }) {
  const parts = text.split(brand);
  return parts.map((part, index) => (
    <Fragment key={index}>
      {index > 0 && <span translate="no">{brand}</span>}
      {part}
    </Fragment>
  ));
}
