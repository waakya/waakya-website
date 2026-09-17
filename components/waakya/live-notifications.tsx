"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { SOUND_FILES, soundFor } from "@/lib/notify/sounds";
import { toast } from "@/components/ui/sonner";

/**
 * The moment the product actually pings.
 *
 * Subscribes to this person's own notification rows — RLS applies to realtime
 * too, so nobody else's ever arrive — plays the one sound that moment owns
 * (Character document §2.6), shows the line, and refreshes the screen so the
 * lists agree with the sound.
 *
 * Reminders deliberately make no sound: the three sounds are reserved for new
 * work, done work and an escalation, which is what keeps them meaningful.
 */
export function LiveNotifications({ userId }: { userId: string }) {
  const router = useRouter();

  React.useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    // Row level security applies to realtime: the socket has to carry this
    // person's token, not just the public key, or the database filters out
    // every row and nothing ever arrives. Load the session first.
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) await supabase.realtime.setAuth(data.session.access_token);
      channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { event?: string; body?: string };
          const sound = soundFor(row.event ?? "");
          if (sound) play(SOUND_FILES[sound]);
          if (row.body) toast(row.body);
          router.refresh();
        },
      )
      .subscribe();
    })();

    // Keep the socket's token fresh when the session refreshes.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void supabase.realtime.setAuth(session.access_token);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
      if (channel) void supabase.removeChannel(channel);
    };
  }, [router, userId]);

  return null;
}

/**
 * Browsers refuse audio before the person has interacted with the page, and
 * that refusal is not an error worth showing anyone — the toast already
 * carried the message.
 */
function play(src: string): void {
  try {
    const audio = new Audio(src);
    audio.volume = 0.6;
    void audio.play().catch(() => undefined);
  } catch {
    // No audio support: the line on screen is the message.
  }
}
