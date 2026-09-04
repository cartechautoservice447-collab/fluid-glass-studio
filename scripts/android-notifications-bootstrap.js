import { LocalNotifications } from "@capacitor/local-notifications";

const CHANNEL_ID = "pomodoro";
const MODE_KEY = "liquid-glass-android-device-mode";
const capacitor = window.Capacitor;

if (capacitor?.isNativePlatform?.()) {
  const ensureChannel = async () => {
    try {
      await LocalNotifications.createChannel({
        id: CHANNEL_ID,
        name: "Pomodoro",
        description: "Rest and focus timer alerts",
        importance: 5,
        visibility: 1,
        sound: "default",
        vibration: true,
      });
    } catch {
      // The channel may already exist or the platform may not support channels.
    }
  };

  const originalSchedule = LocalNotifications.schedule.bind(LocalNotifications);
  LocalNotifications.schedule = (options) => originalSchedule({
    ...options,
    notifications: options.notifications.map((notification) => ({
      ...notification,
      channelId: notification.channelId ?? CHANNEL_ID,
      smallIcon: notification.smallIcon ?? "ic_stat_pomodoro",
      sound: notification.sound ?? "default",
      foreground: notification.foreground ?? true,
      // Pomodoro reminders must not depend on the webview remaining open.
      // Inexact alarms avoid the separate Android "Alarms & reminders" setting.
      isExactNotification: notification.isExactNotification ?? false,
      schedule: {
        ...notification.schedule,
        allowWhileIdle: true,
      },
    })),
  });

  capacitor.Plugins = capacitor.Plugins ?? {};
  capacitor.Plugins.LocalNotifications = LocalNotifications;

  let currentPermission = "default";
  void LocalNotifications.checkPermissions().then((result) => {
    currentPermission = result.display;
  }).catch(() => {});

  // The web Notification API is unreliable inside Android WebViews. Always bridge
  // it to the native Local Notifications plugin on Android so the existing web
  // timer code continues to work without changing the laptop/web implementation.
  class NativeNotificationBridge {
    static get permission() {
      return currentPermission;
    }

    static async requestPermission() {
      try {
        const result = await LocalNotifications.requestPermissions();
        currentPermission = result.display;
      } catch {
        currentPermission = "denied";
      }
      return currentPermission;
    }

    constructor(title, options = {}) {
      void LocalNotifications.schedule({
        notifications: [{
          id: Math.max(1, Date.now() % 2147483000),
          title,
          body: options.body ?? "",
          channelId: CHANNEL_ID,
          smallIcon: "ic_stat_pomodoro",
          sound: "default",
          foreground: true,
          schedule: { at: new Date(Date.now() + 100) },
          extra: { tag: options.tag ?? "liquid-glass-pomodoro", url: "/" },
        }],
      }).catch(() => {});
    }

    close() {}
  }

  try {
    Object.defineProperty(window, "Notification", {
      configurable: true,
      writable: true,
      value: NativeNotificationBridge,
    });
  } catch {
    // A browser-provided Notification object may be non-configurable on some WebViews.
  }

  const applyDeviceMode = (mode) => {
    const safeMode = mode === "laptop" ? "laptop" : "mobile";
    document.documentElement.dataset.deviceMode = safeMode;

    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute(
        "content",
        safeMode === "laptop"
          ? "width=1200, initial-scale=0.8, maximum-scale=1, viewport-fit=cover"
          : "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover",
      );
    }
    window.dispatchEvent(new Event("resize"));
  };

  const mountDeviceModePicker = () => {
    if (document.getElementById("android-device-mode-picker")) return;

    const style = document.createElement("style");
    style.id = "android-device-mode-style";
    style.textContent = `
      #android-device-mode-picker{position:fixed;top:max(10px,env(safe-area-inset-top));right:10px;z-index:10000;display:flex;align-items:center;gap:3px;padding:3px;border:1px solid rgba(255,255,255,.2);border-radius:999px;background:rgba(10,10,18,.62);box-shadow:0 8px 30px rgba(0,0,0,.28);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);font:600 11px/1 system-ui,sans-serif;color:rgba(255,255,255,.72)}
      #android-device-mode-picker button{border:0;border-radius:999px;padding:7px 10px;background:transparent;color:inherit;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
      #android-device-mode-picker button[aria-pressed="true"]{background:rgba(255,255,255,.16);color:#fff}
      html[data-device-mode="laptop"] body{min-width:1024px}
    `;
    document.head.appendChild(style);

    const picker = document.createElement("div");
    picker.id = "android-device-mode-picker";
    picker.setAttribute("aria-label", "Device mode");
    picker.innerHTML = '<button type="button" data-mode="mobile">Mobile</button><button type="button" data-mode="laptop">Laptop</button>';

    const saved = localStorage.getItem(MODE_KEY);
    const initialMode = saved === "laptop" || saved === "mobile"
      ? saved
      : (window.innerWidth <= 768 ? "mobile" : "laptop");

    const setMode = (mode) => {
      const safeMode = mode === "laptop" ? "laptop" : "mobile";
      localStorage.setItem(MODE_KEY, safeMode);
      applyDeviceMode(safeMode);
      picker.querySelectorAll("button").forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.mode === safeMode));
      });
    };

    picker.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => setMode(button.dataset.mode));
    });

    document.body.appendChild(picker);
    setMode(initialMode);
  };

  const startAndroidOnlyFeatures = () => {
    void ensureChannel();
    mountDeviceModePicker();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startAndroidOnlyFeatures, { once: true });
  } else {
    startAndroidOnlyFeatures();
  }
}
