import { createFileRoute } from "@tanstack/react-router";
import { AppDownloadCenter } from "@/components/pwa/AppDownloadCenter";

export const Route = createFileRoute("/download-app")({
  head: () => ({
    meta: [
      { title: "Install Liquid Glass Studio — App downloads" },
      {
        name: "description",
        content: "Install Liquid Glass Studio to your device, or grab a platform package when a signed release is available.",
      },
      { property: "og:title", content: "Install Liquid Glass Studio — App downloads" },
      {
        property: "og:description",
        content: "Install the Liquid Glass Studio workspace as an app on your phone, tablet or desktop.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DownloadAppPage,
});

function DownloadAppPage() {
  return (
    <main className="min-h-screen bg-[#07070c] px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="text-3xl font-semibold">Liquid Glass Studio App</h1>
        <p className="mt-3 text-white/70">Install the app as a PWA or download a platform package when a signed release is available.</p>
        <div className="mt-8"><AppDownloadCenter /></div>
      </div>
    </main>
  );
}
