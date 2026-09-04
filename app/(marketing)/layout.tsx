/**
 * The signed-out shell. Full width, no app chrome — this is a website, not the
 * product.
 */
export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return <div className="min-h-dvh bg-paper-50">{children}</div>;
}
