import { LocalNotifications } from "@capacitor/local-notifications";

const CHANNEL_ID = "pomodoro";
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
      sound: notification.sound ?? "default",
      foreground: notification.foreground ?? true,
      isExactNotification: false,
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

  if (!("Notification" in window)) {
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

      constructor() {
        // Pomodoro notifications are scheduled through LocalNotifications directly.
        // This constructor intentionally does not schedule a second copy.
      }

      close() {}
    }

    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: NativeNotificationBridge,
    });
  }

  void ensureChannel();
}
