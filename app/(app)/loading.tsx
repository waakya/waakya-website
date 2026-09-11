/**
 * What a signed-in screen shows the instant it is tapped, while the server
 * renders the real one.
 *
 * Two jobs. It gives a tap immediate feedback instead of a frozen page. And
 * for dynamic routes Next prefetches only up to the nearest loading boundary,
 * so without this file a sidebar link prefetched nothing at all.
 *
 * It mirrors AppShell's frame (the Neel sidebar from `lg` up, the phone
 * column below) so the page does not jump when the content arrives. It is
 * deliberately still: the design allows exactly three motions and a
 * shimmering skeleton is not one of them.
 */
export default function Loading() {
  return (
    <div className="flex min-h-dvh bg-paper-50" aria-busy="true">
      <div className="hidden w-64 shrink-0 bg-neel-900 lg:block xl:w-72">
        <div className="flex h-dvh flex-col gap-3 p-4">
          <div className="mt-3 h-6 w-28 rounded-button bg-white/15" />
          <div className="mt-6 h-3 w-16 rounded-button bg-white/10" />
          <div className="h-5 w-40 rounded-button bg-white/15" />
          <div className="mt-4 flex flex-col gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-tap rounded-button bg-white/5" />
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col p-4 lg:mx-0 lg:max-w-3xl lg:px-8">
          <span className="sr-only" role="status">
            Loading
          </span>
          <div className="h-7 w-44 rounded-button bg-paper-200" />
          <div className="mt-2 h-4 w-64 max-w-full rounded-button bg-paper-100" />
          <div className="mt-6 flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="h-20 rounded-card border border-paper-200 bg-paper-0"
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
