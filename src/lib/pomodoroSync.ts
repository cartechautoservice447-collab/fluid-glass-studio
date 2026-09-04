import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type RestStartPayload = { minutes: number; seconds?: number };
export type SyncStatus = "idle" | "connecting" | "connected" | "error";

export const REST_START_EVENT = "rest-start";

const STUDY_SESSION_KEY = "liquid-glass-study-session";
const POMODORO_SESSION_KEY = "liquid-glass-pomodoro-session";
const WEB_PUSH_PUBLIC_KEY = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY || "BOMQ0gr879geMIiymoRz_NkMobpvHh04WX5-XYiyp54FacZnEltC8QxRVmyIGEl1OW6rdUI1-uszdH9wWbO-56g";
const REST_END_NOTIFICATION_DELAY_BUFFER_MS = 250;

type NativeLocalNotifications = {
  checkPermissions?: () => Promise<{ display: string }>;
  requestPermissions?: () => Promise<{ display: string }>;
  schedule: (options: { notifications: Array<Record<string, unknown>> }) => Promise<unknown>;
};

function getNativeLocalNotifications(): NativeLocalNotifications | null {
  if (typeof window === "undefined") return null;
  const capacitor = (window as typeof window & { Capacitor?: { isNativePlatform?: () => boolean; Plugins?: { LocalNotifications?: NativeLocalNotifications } } }).Capacitor;
  if (!capacitor?.isNativePlatform?.()) return null;
  return capacitor.Plugins?.LocalNotifications ?? null;
}

export async function getDeviceNotificationStatus(): Promise<"granted" | "default" | "denied" | "unsupported"> {
  const nativePlugin = getNativeLocalNotifications();
  if (nativePlugin) {
    try {
      const permission = await nativePlugin.checkPermissions?.();
      if (permission?.display === "granted") return "granted";
      if (permission?.display === "denied") return "denied";
      return "default";
    } catch {
      return "denied";
    }
  }

  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function requestDeviceNotificationPermission(): Promise<"granted" | "default" | "denied" | "unsupported"> {
  const nativePlugin = getNativeLocalNotifications();
  if (nativePlugin) {
    try {
      const permission = await nativePlugin.requestPermissions?.();
      if (permission?.display === "granted") return "granted";
      if (permission?.display === "denied") return "denied";
      return "default";
    } catch {
      return "denied";
    }
  }

  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

async function ensureNativeNotificationPermission(plugin: NativeLocalNotifications) {
  try {
    const current = await plugin.checkPermissions?.();
    if (current?.display === "granted") return true;
    const requested = await plugin.requestPermissions?.();
    return requested?.display === "granted";
  } catch {
    return false;
  }
}

function notificationId() {
  return Math.max(1, Date.now() % 2147483000);
}

async function scheduleNativeNotification(title: string, body: string, delayMs = 50, tag?: string) {
  const plugin = getNativeLocalNotifications();
  if (!plugin || !(await ensureNativeNotificationPermission(plugin))) return false;
  try {
    await plugin.schedule({
      notifications: [{
        id: notificationId(),
        title,
        body,
        schedule: { at: new Date(Date.now() + Math.max(50, delayMs)) },
        extra: { tag: tag ?? "liquid-glass-pomodoro", url: "/" },
      }],
    });
    return true;
  } catch {
    return false;
  }
}

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
  if (await scheduleNativeNotification(title, options.body ?? "", 50, options.tag)) return;
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration() ?? await navigator.serviceWorker.register("/sw.js", { scope: "/" });
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

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)));
}

async function ensurePushSubscription(userId: string) {
  if (getNativeLocalNotifications()) return null;
  if (typeof window === "undefined" || !WEB_PUSH_PUBLIC_KEY || !("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  if (!("Notification" in window)) return null;

  try {
    if (Notification.permission === "default") await Notification.requestPermission();
    if (Notification.permission !== "granted") return null;

    const registration = await navigator.serviceWorker.getRegistration() ?? await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(WEB_PUSH_PUBLIC_KEY),
      });
    }

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) return null;

    const { error } = await (supabase as any)
      .from("push_subscriptions")
      .upsert(
        {
          user_id: userId,
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        },
        { onConflict: "endpoint" },
      );
    if (error) throw error;

    return json.endpoint;
  } catch {
    return null;
  }
}

async function sendCrossDevicePush(userId: string, title: string, body: string, tag: string, excludeEndpoint?: string | null) {
  if (getNativeLocalNotifications()) return;
  try {
    await supabase.functions.invoke("send-push-notification", {
      body: { userId, title, body, tag, excludeEndpoint: excludeEndpoint ?? null },
    });
  } catch {
    // Cross-device push is best-effort; the local notification and realtime sync continue independently.
  }
}

export function showRestStartNotification(seconds: number) {
  void showAppNotification("Rest time started", {
    body: `Your rest time has started. You have ${seconds < 60 ? `${seconds} seconds` : `${Math.ceil(seconds / 60)} minutes`} to rest.`,
    icon: "/pwa-icon-192.svg",
    badge: "/pwa-icon-192.svg",
    tag: "liquid-glass-pomodoro-rest",
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: "/" },
  });
}

export function showRestFinishedNotification() {
  void showAppNotification("Rest time finished", {
    body: "Your rest time has finished. Focus time is starting now.",
    icon: "/pwa-icon-192.svg",
    badge: "/pwa-icon-192.svg",
    tag: "liquid-glass-pomodoro-rest-finished",
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: "/" },
  });
}

function scheduleRestFinishedNotification(seconds: number, userId?: string, excludeEndpoint?: string | null) {
  const delay = Math.max(1, seconds) * 1000 + REST_END_NOTIFICATION_DELAY_BUFFER_MS;
  const nativePlugin = getNativeLocalNotifications();
  if (nativePlugin) {
    void (async () => {
      if (!(await ensureNativeNotificationPermission(nativePlugin))) return;
      try {
        await nativePlugin.schedule({
          notifications: [{
            id: notificationId(),
            title: "Rest time finished",
            body: "Your rest time has finished. Focus time is starting now.",
            schedule: { at: new Date(Date.now() + delay) },
            extra: { tag: "liquid-glass-pomodoro-rest-finished", url: "/" },
          }],
        });
      } catch {
        // Local native scheduling is best-effort.
      }
    })();
    return;
  }

  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;
  window.setTimeout(() => {
    showRestFinishedNotification();
    if (userId) {
      void sendCrossDevicePush(
        userId,
        "Rest time finished",
        "Your rest time has finished. Focus time is starting now.",
        "liquid-glass-pomodoro-rest-finished",
        excludeEndpoint,
      );
    }
  }, delay);
}

/** Broadcasts the rest duration and sends a Web Push to the user's other registered devices. */
export async function broadcastRestStart(userId: string, minutes: number) {
  const seconds = getActiveRestSeconds(minutes);

  showRestStartNotification(seconds);

  const sourceEndpoint = await ensurePushSubscription(userId);
  scheduleRestFinishedNotification(seconds, userId, sourceEndpoint);
  void sendCrossDevicePush(
    userId,
    "Rest time started",
    `Your rest time has started. You have ${seconds < 60 ? `${seconds} seconds` : `${Math.ceil(seconds / 60)} minutes`} to rest.`,
    "liquid-glass-pomodoro-rest",
    sourceEndpoint,
  );

  try {
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
    setTimeout(() => void supabase.removeChannel(channel), 1500);
  } catch {
    /* Realtime sync is best-effort; Web Push and local notifications already started above. */
  }
}

/** Subscribes the current device to rest-start signals and registers it for cross-device push. */
export function usePomodoroRestSync(userId: string | null, onRestStart?: (payload: RestStartPayload) => void) {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const restFinishedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!userId || typeof window === "undefined") {
      setStatus("idle");
      return;
    }
    void ensurePushSubscription(userId);
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

        if (getNativeLocalNotifications()) {
          showRestStartNotification(safeSeconds);
          scheduleRestFinishedNotification(safeSeconds);
          return;
        }

        if (!("Notification" in window) || Notification.permission !== "granted") return;
        showRestStartNotification(safeSeconds);

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
