import type { Metadata } from "next";

import "./demo.css";

/**
 * The sales demo sits outside the product's own shell: no app chrome, no
 * navigation, no session. It is a presentation that happens to live on the
 * website, and it shares nothing with the signed-in application but the
 * typefaces.
 */
export const metadata: Metadata = {
  title: "Waakya — Product demonstration",
  description:
    "An interactive walk-through of the Waakya business workspace: conversation, commitment, execution, proof and record.",
  robots: { index: false, follow: false },
};

export default function DemoLayout({ children }: LayoutProps<"/demo">) {
  return children;
}
