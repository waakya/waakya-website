"use client";

import { useEffect } from "react";

/**
 * Registers the service worker, which is what makes Chrome offer "Add to Home
 * screen" — the app has to be installable to sit next to WhatsApp.
 *
 * Only in production: in development it would sit between the dev server and
 * the browser for no benefit.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // An install prompt is a nicety; failing to get one is not an error
      // worth showing anybody.
    });
  }, []);

  return null;
}
