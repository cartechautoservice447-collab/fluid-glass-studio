import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { LiquidGlassWebGL } from "@/components/liquid/LiquidGlassWebGL";
import appCss from "../styles.css?url";
import pomodoroPlainTimerCss from "../pomodoro-plain-timer.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { registerPwaServiceWorker } from "../lib/pwa";

type NativeWindow = typeof window & {
  Capacitor?: { isNativePlatform?: () => boolean };
};

function isNativeCapacitorApp(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean((window as NativeWindow).Capacitor?.isNativePlatform?.());
}

function NotFoundComponent() {
  const router = useRouter();

  useEffect(() => {
    if (isNativeCapacitorApp()) {
      void router.navigate({ to: "/", replace: true });
    }
  }, [router]);

  if (isNativeCapacitorApp()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-sm text-muted-foreground">Opening your workspace…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Try again
          </button>
          <a href="/" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Liquid Glass Studio — Glass course workspaces & notes" },
      {
        name: "description",
        content:
          "Liquid Glass Studio keeps your course folders, notes, study sessions and engine settings in one installable glass workspace.",
      },
      { property: "og:title", content: "Liquid Glass Studio — Glass course workspaces & notes" },
      {
        property: "og:description",
        content:
          "Course folders, markdown notes, Pomodoro and Study Hub inside one Liquid Glass workspace that installs to your device.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#07070c" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Liquid Glass Studio" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: pomodoroPlainTimerCss },
      { rel: "icon", href: "/pwa-icon-exact-192-new.png", type: "image/png", sizes: "192x192" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/pwa-icon-exact-192-new.png", sizes: "192x192" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    if (!isNativeCapacitorApp()) registerPwaServiceWorker();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LiquidGlassWebGL />
      <div id="app-content" className="relative z-[2] min-h-screen">
        <Outlet />
      </div>
    </QueryClientProvider>
  );
}
