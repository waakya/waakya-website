/**
 * The signed-out shell. No coloured header, the logo centred, and the primary
 * action within thumb reach on a small phone.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4">
      {children}
    </div>
  );
}
