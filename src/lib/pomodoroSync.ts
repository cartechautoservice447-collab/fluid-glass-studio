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

/** Adds a Pomodoro-only minimize/restore control without changing timer behavior. */
function installPomodoroMinimize() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const STYLE_ID = "pomodoro-minimize-style-v1";
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .pomodoro-minimized-shell {
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        width: 100%;
        min-height: 64px;
        padding: 12px 14px;
        border: 1px solid rgb(255 255 255 / 18%);
        border-radius: 20px;
        background: rgb(0 0 0 / 42%);
        color: var(--foreground);
        box-shadow: 0 18px 50px rgb(0 0 0 / 28%);
        backdrop-filter: blur(22px);
      }
      .pomodoro-minimized-time {
        min-width: 0;
        font-size: 1.45rem;
        line-height: 1;
        font-weight: 650;
        font-variant-numeric: tabular-nums;
        letter-spacing: -0.04em;
      }
      .pomodoro-minimized-label {
        margin-top: 4px;
        font-size: 9px;
        line-height: 1.2;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: var(--muted-foreground);
      }
      .pomodoro-minimized-restore {
        display: inline-flex;
        width: 34px;
        height: 34px;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        border: 1px solid rgb(255 255 255 / 14%);
        border-radius: 9999px;
        background: rgb(255 255 255 / 7%);
        color: var(--foreground);
        cursor: pointer;
        font-size: 16px;
      }
      .pomodoro-minimized-restore:hover { background: rgb(255 255 255 / 12%); }
    `;
    document.head.appendChild(style);
  }

  const observer = new MutationObserver(() => {
    document.querySelectorAll<HTMLElement>('[role="dialog"]').forEach((dialog) => {
      if (dialog.dataset.pomodoroMinimizeInstalled === "true") return;
      const title = Array.from(dialog.querySelectorAll<HTMLElement>("h1,h2,h3,[data-slot='dialog-title']")).find(
        (element) => element.textContent?.trim() === "Pomodoro",
      );
      if (!title) return;

      const header = title.parentElement;
      const controls = header?.querySelector<HTMLElement>(":scope > div:last-child");
      if (!header || !controls) return;

      const minimizeButton = document.createElement("button");
      minimizeButton.type = "button";
      minimizeButton.className = "rounded-full text-muted-foreground hover:bg-white/10";
      minimizeButton.style.width = "36px";
      minimizeButton.style.height = "36px";
      minimizeButton.style.display = "inline-flex";
      minimizeButton.style.alignItems = "center";
      minimizeButton.style.justifyContent = "center";
      minimizeButton.style.border = "0";
      minimizeButton.style.background = "transparent";
      minimizeButton.style.color = "inherit";
      minimizeButton.style.cursor = "pointer";
      minimizeButton.style.fontSize = "20px";
      minimizeButton.setAttribute("aria-label", "Minimize Pomodoro");
      minimizeButton.title = "Minimize Pomodoro";
      minimizeButton.textContent = "−";

      const shell = document.createElement("div");
      shell.className = "pomodoro-minimized-shell";
      shell.style.display = "none";

      const info = document.createElement("div");
      info.style.minWidth = "0";
      const time = document.createElement("div");
      time.className = "pomodoro-minimized-time";
      const label = document.createElement("div");
      label.className = "pomodoro-minimized-label";
      label.textContent = "Pomodoro timer";
      info.append(time, label);

      const restoreButton = document.createElement("button");
      restoreButton.type = "button";
      restoreButton.className = "pomodoro-minimized-restore";
      restoreButton.setAttribute("aria-label", "Restore Pomodoro");
      restoreButton.title = "Restore Pomodoro";
      restoreButton.textContent = "↗";

      shell.append(info, restoreButton);
      dialog.appendChild(shell);
      controls.insertBefore(minimizeButton, controls.firstChild);
      dialog.dataset.pomodoroMinimizeInstalled = "true";

      const content = dialog.querySelector<HTMLElement>(":scope > div");
      let syncId: number | null = null;
      let minimized = false;
      let overlay: HTMLElement | null = null;

      const setMinimized = (next: boolean) => {
        minimized = next;
        overlay = overlay ?? document.querySelector<HTMLElement>("[data-radix-dialog-overlay]");

        if (next) {
          const timerElement = dialog.querySelector<HTMLElement>(".text-7xl");
          time.textContent = timerElement?.textContent?.trim() || "00:00";
          if (syncId !== null) window.clearInterval(syncId);
          syncId = window.setInterval(() => {
            const current = dialog.querySelector<HTMLElement>(".text-7xl");
            if (current) time.textContent = current.textContent?.trim() || time.textContent;
          }, 250);

          if (content) content.style.display = "none";
          shell.style.display = "flex";
          dialog.style.position = "fixed";
          dialog.style.right = "16px";
          dialog.style.bottom = "16px";
          dialog.style.left = "auto";
          dialog.style.top = "auto";
          dialog.style.width = "min(220px, calc(100vw - 32px))";
          dialog.style.maxWidth = "none";
          dialog.style.transform = "none";
          dialog.style.margin = "0";
          dialog.style.padding = "0";
          dialog.style.overflow = "visible";
          dialog.style.background = "transparent";
          dialog.style.border = "0";
          dialog.style.boxShadow = "none";
          if (overlay) overlay.style.display = "none";
        } else {
          if (syncId !== null) {
            window.clearInterval(syncId);
            syncId = null;
          }
          shell.style.display = "none";
          if (content) content.style.display = "";
          ["position", "right", "bottom", "left", "top", "width", "maxWidth", "transform", "margin", "padding", "overflow", "background", "border", "boxShadow"].forEach((property) => dialog.style.removeProperty(property));
          if (overlay) overlay.style.display = "";
        }

        minimizeButton.textContent = minimized ? "+" : "−";
        minimizeButton.setAttribute("aria-label", minimized ? "Pomodoro minimized" : "Minimize Pomodoro");
      };

      minimizeButton.addEventListener("click", () => setMinimized(true));
      restoreButton.addEventListener("click", () => setMinimized(false));

      const cleanupObserver = new MutationObserver(() => {
        if (!document.body.contains(dialog)) {
          if (syncId !== null) window.clearInterval(syncId);
          cleanupObserver.disconnect();
        }
      });
      cleanupObserver.observe(document.body, { childList: true, subtree: true });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

if (typeof window !== "undefined") {
  queueMicrotask(installPomodoroMinimize);
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
