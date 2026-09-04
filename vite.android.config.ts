import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Android APK build: ship the app as a client-side static bundle so the
    // installed APK does not depend on the Lovable website URL at runtime.
    spa: {
      enabled: true,
    },
  },
});
