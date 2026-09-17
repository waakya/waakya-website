/**
 * A server action rejects outright when the connection drops mid-send — the
 * screen never hears back, so a message typed on a patchy phone connection
 * would vanish without a word. This turns that into the same refusal shape the
 * actions themselves return, so the screen can say what happened and hand the
 * person their words back.
 */
export async function attempt<T extends { ok: boolean; message?: string }>(
  run: () => Promise<T>,
  noConnection: string,
): Promise<T | { ok: false; message: string }> {
  try {
    return await run();
  } catch {
    return { ok: false, message: noConnection };
  }
}
