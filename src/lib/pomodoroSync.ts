import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type RestStartPayload = { minutes: number };
export type SyncStatus = "idle" | "connecting" | "connected" | "error";

export const REST_START_EVENT = "rest-start";

export function pomodoroChannelName(userId: string) {
  return `pomodoro-sync:${userId}`;
}

/** Broadcasts only the rest duration — never note content or personal data. */
export async function broadcastRestStart(userId: string, minutes: number) {
  try {
    const channel = supabase.channel(pomodoroChannelName(userId), { config: { broadcast: { self: false } } });
    await new Promise<void>((resolve) => {
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") resolve();
      });
    });
    await channel.send({ type: "broadcast", event: REST_START_EVENT, payload: { minutes } satisfies RestStartPayload });
    setTimeout(() => void supabase.removeChannel(channel), 1500);
  } catch {
    /* Sync is best-effort; local rest behavior is unaffected. */
  }
}

/** Subscribes the current device to rest-start signals for this account. */
export function usePomodoroRestSync(userId: string | null, onRestStart?: (payload: RestStartPayload) => void) {
  const [status, setStatus] = useState<SyncStatus>("idle");

  useEffect(() => {
    if (!userId || typeof window === "undefined") {
      setStatus("idle");
      return;
    }
    setStatus("connecting");
    let channel: RealtimeChannel | null = supabase.channel(pomodoroChannelName(userId));
    channel
      .on("broadcast", { event: REST_START_EVENT }, ({ payload }) => {
        const minutes = Number((payload as RestStartPayload | undefined)?.minutes);
        const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 5;
        onRestStart?.({ minutes: safeMinutes });
        if (!("Notification" in window) || Notification.permission !== "granted") return;
        try {
          const n = new Notification("Break time!", {
            body: `Rest for ${safeMinutes} min. Step away from the screen.`,
            icon: "/pwa-icon-192.svg",
            tag: "liquid-glass-pomodoro-rest",
          });
          n.onclick = () => {
            window.focus();
            n.close();
          };
        } catch {
          /* Some mobile browsers block the Notification constructor. */
        }
      })
      .subscribe((state) => {
        if (state === "SUBSCRIBED") setStatus("connected");
        else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT") setStatus("error");
      });

    return () => {
      if (channel) void supabase.removeChannel(channel);
      channel = null;
      setStatus("idle");
    };
  }, [userId]);

  return status;
}
