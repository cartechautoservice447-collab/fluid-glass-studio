import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    spa: {
      enabled: true,
    },
  },
  // The SPA shell is prerendered by TanStack Start during the build.
  // Use a Node-executable Nitro target for that temporary preview server;
  // the Android APK itself still packages only the generated static public bundle.
  nitro: {
    preset: "node-server",
  },
});
