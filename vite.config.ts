// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using Cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Lovable's sandbox uses its own Cloudflare-oriented Nitro target.
// Vercel sets VERCEL during its build, so explicitly switch Nitro to the
// Vercel preset there. This keeps Lovable preview behavior unchanged while
// making the GitHub -> Vercel build emit Vercel-compatible server output.
const isVercel = !!process.env.VERCEL;

export default defineConfig({
  vite: {
    // TanStack Start renders through Vite's SSR environment in development.
    // Pre-crawl every source entry so discovering a lazy route cannot trigger a
    // mid-render dependency re-optimization and split React's hook dispatcher.
    optimizeDeps: {
      entries: ["src/**/*.{ts,tsx}"],
      include: ["react", "react-dom", "@tanstack/react-router"],
    },
  },
  nitro: isVercel ? { preset: "vercel" } : undefined,
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this.
    server: { entry: "server" },
  },
});
