import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type RestStartPayload = { minutes: number; seconds?: number };
export type SyncStatus = "idle" | "connecting" | "connected" | "error";

export const REST_START_EVENT = "rest-start";

const STUDY_SESSION_KEY = "liquid-glass-study-session";
const POMODORO_SESSION_KEY = "liquid-glass-pomodoro-session";
const REST_END_NOTIFICATION_DELAY_BUFFER_MS = 250;

export function pomodoroChannelName(userId: string) {
  return `pomodoro-sync:${userId}`;
}

function getActiveRestSeconds(fallbackMinutes: number) {
  const fallbackSeconds = Math.max(1, Math.round(fallbackMinutes * 60));
  if (typeof window === "undefined") return fallbackSeconds;

  const readDeadline = (key: string) => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "null");
      if (!saved || !saved.running || typeof saved.deadline !== "number") return null;
      if (saved.deadline <= Date.now()) return null;
      return Math.max(1, Math.ceil((saved.deadline - Date.now()) / 1000));
    } catch {
      return null;
    }
  };

  return readDeadline(STUDY_SESSION_KEY) ?? readDeadline(POMODORO_SESSION_KEY) ?? fallbackSeconds;
}

type AppNotificationOptions = NotificationOptions & { tag?: string; vibrate?: number[] };

async function showAppNotification(title: string, options: AppNotificationOptions) {
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
      return;
    }
  } catch {
    // Fall through to the desktop-only constructor when no usable service worker exists.
  }

  try {
    const notification = new Notification(title, options);
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    /* Mobile browsers intentionally reject the Notification constructor. */
  }
}

function showRestFinishedNotification() {
  void showAppNotification("Rest finished!", {
    body: "Your rest is over. Focus time is starting.",
    icon: "/pwa-icon-192.svg",
    badge: "/pwa-icon-192.svg",
    tag: "liquid-glass-pomodoro-rest-finished",
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: "/" },
  });
}

function scheduleRestFinishedNotification(seconds: number) {
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;
  const delay = Math.max(1, seconds) * 1000 + REST_END_NOTIFICATION_DELAY_BUFFER_MS;
  window.setTimeout(showRestFinishedNotification, delay);
}

/** Broadcasts the rest duration — never note content or personal data. */
export async function broadcastRestStart(userId: string, minutes: number) {
  try {
    const seconds = getActiveRestSeconds(minutes);
    const channel = supabase.channel(pomodoroChannelName(userId), { config: { broadcast: { self: false } } });
    await new Promise<void>((resolve) => {
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") resolve();
      });
    });
    await channel.send({
      type: "broadcast",
      event: REST_START_EVENT,
      payload: { minutes: Math.max(1, Math.round(seconds / 60)), seconds } satisfies RestStartPayload,
    });
    scheduleRestFinishedNotification(seconds);
    setTimeout(() => void supabase.removeChannel(channel), 1500);
  } catch {
    /* Sync is best-effort; local rest behavior is unaffected. */
  }
}

/** Subscribes the current device to rest-start signals for this account. */
export function usePomodoroRestSync(userId: string | null, onRestStart?: (payload: RestStartPayload) => void) {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const restFinishedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!userId || typeof window === "undefined") {
      setStatus("idle");
      return;
    }
    setStatus("connecting");
    let channel: RealtimeChannel | null = supabase.channel(pomodoroChannelName(userId));
    channel
      .on("broadcast", { event: REST_START_EVENT }, ({ payload }) => {
        const data = payload as RestStartPayload | undefined;
        const minutes = Number(data?.minutes);
        const seconds = Number(data?.seconds);
        const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 5;
        const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : safeMinutes * 60;
        onRestStart?.({ minutes: safeMinutes, seconds: safeSeconds });

        if (!("Notification" in window) || Notification.permission !== "granted") return;
        void showAppNotification("Break time!", {
          body: `Rest for ${safeSeconds < 60 ? `${safeSeconds} sec` : `${Math.ceil(safeSeconds / 60)} min`}. Step away from the screen.`,
          icon: "/pwa-icon-192.svg",
          badge: "/pwa-icon-192.svg",
          tag: "liquid-glass-pomodoro-rest",
          renotify: true,
          vibrate: [200, 100, 200],
          data: { url: "/" },
        });

        if (restFinishedTimerRef.current !== null) window.clearTimeout(restFinishedTimerRef.current);
        restFinishedTimerRef.current = window.setTimeout(() => {
          restFinishedTimerRef.current = null;
          showRestFinishedNotification();
        }, safeSeconds * 1000 + REST_END_NOTIFICATION_DELAY_BUFFER_MS);
      })
      .subscribe((state) => {
        if (state === "SUBSCRIBED") setStatus("connected");
        else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT") setStatus("error");
      });

    return () => {
      if (restFinishedTimerRef.current !== null) {
        window.clearTimeout(restFinishedTimerRef.current);
        restFinishedTimerRef.current = null;
      }
      if (channel) void supabase.removeChannel(channel);
      channel = null;
      setStatus("idle");
    };
  }, [userId]);

  return status;
}
