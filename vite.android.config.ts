import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: {
      entry: "server",
    },
    spa: {
      enabled: true,
    },
  },
  // Android uses the static SPA shell only. Disable the repository's
  // default Nitro build for this Android-only configuration so TanStack
  // Start emits the server entry where its SPA prerender expects it.
  nitro: false,
});
