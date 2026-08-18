import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bold,
  Code2,
  Expand,
  Eye,
  Files,
  Folder,
  Image,
  Italic,
  Link2,
  LogOut,
  PanelLeft,
  Pencil,
  Plus,
  Search,
  Settings,
  Star,
  Trash2,
} from "lucide-react";

import { GlassPanel } from "@/components/liquid/GlassPanel";
import { LiquidFilters } from "@/components/liquid/LiquidFilters";
import { CustomizationProvider, useCustomization } from "@/context/CustomizationContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Glass Notes — Liquid Glass markdown notes" },
      {
        name: "description",
        content:
          "Static three-column Glass Notes interface: collections sidebar, note list and markdown editor rendered in Apple-style liquid glass.",
      },
      { property: "og:title", content: "Glass Notes — Liquid Glass markdown notes" },
      {
        property: "og:description",
        content: "Collections, note cards and a markdown editor inside a liquid-glass interface.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <CustomizationProvider>
      <LiquidFilters />
      <StaticNotesShell />
    </CustomizationProvider>
  );
}

const COLLECTIONS = [
  { name: "LECTURE 0", count: 8, active: false },
  { name: "kmw", count: 7, active: true },
  { name: "ww", count: 0, active: false },
];

const NOTE_CARDS = Array.from({ length: 7 }, (_, i) => ({ id: i, selected: i === 0 }));

const CANVAS_W = 1440;
const CANVAS_H = 900;

function StaticNotesShell() {
  const { setTheme } = useCustomization();
  const [scale, setScale] = useState(1);

  useEffect(() => {
    setTheme("dark");
  }, [setTheme]);

  useEffect(() => {
    const fit = () =>
      setScale(Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
  <div className="fixed inset-0 overflow-hidden bg-[#07070c]">
    <div
      className="laptop-canvas absolute left-1/2 top-1/2"
      style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
    >
      <main className="liquid-stage relative flex h-full w-full overflow-hidden px-5 py-5">
          <div className="liquid-orb liquid-orb-a" aria-hidden />
          <div className="liquid-orb liquid-orb-b" aria-hidden />
          <div className="liquid-orb liquid-orb-c" aria-hidden />

          <div className="relative flex min-h-0 w-full flex-1 flex-row gap-4">
            <SidebarPanel />
            <ListPanel />
            <EditorPanel />
          </div>
        </main>
      </div>
    </div>
  );
}



function SidebarPanel() {
  return (
    <GlassPanel className="flex min-h-0 flex-col gap-4 !p-5 w-72 shrink-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.3em] on-stage-muted">Glass</p>
          <h1 className="text-lg font-semibold tracking-tight on-stage">Notes</h1>
        </div>
        <PanelLeft className="size-4 on-stage-muted" />
      </div>

      <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm on-stage-muted">
        <ArrowLeft className="size-4" />
        All Courses
      </div>

      <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950">
        <Plus className="size-4" />
        New Note
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 on-stage-muted" />
        <div className="w-full rounded-xl border border-white/20 bg-white/10 py-2 pl-9 pr-3 text-sm on-stage-muted">
          Search notes
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm on-stage">
          <span className="flex items-center gap-2">
            <Files className="size-4" />
            All Notes
          </span>
          <span className="font-mono text-xs on-stage-muted">26</span>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm on-stage">
          <span className="flex items-center gap-2">
            <Star className="size-4" />
            Favorites
          </span>
          <span className="font-mono text-xs on-stage-muted">1</span>
        </div>
      </nav>

      <div className="flex min-h-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between px-1 pb-1">
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.26em] on-stage-muted">
            Collections
          </p>
          <Plus className="size-3.5 on-stage-muted" />
        </div>
        {COLLECTIONS.map((collection) => (
          <div
            key={collection.name}
            className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm ${
              collection.active ? "bg-white/15 on-stage" : "on-stage-muted"
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <Folder className="size-4 shrink-0" />
              {collection.name}
            </span>
            <span className="font-mono text-xs">{collection.count}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm on-stage-muted">
        <Settings className="size-4" />
        Settings
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/15 text-xs font-semibold on-stage">
          A
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold on-stage">amith</span>
          <span className="block truncate text-[0.65rem] on-stage-muted">
            amithkrishna336g…
          </span>
        </span>
        <LogOut className="size-4 on-stage-muted" />
      </div>
    </GlassPanel>
  );
}

function ListPanel() {
  return (
    <GlassPanel className="flex min-h-0 flex-col gap-3 !p-4 w-80 shrink-0">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[0.62rem] font-bold uppercase tracking-[0.28em] on-stage">kmw</h2>
        <span className="flex items-center gap-2 font-mono text-xs on-stage-muted">
          7 notes
          <PanelLeft className="size-3.5" />
        </span>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {NOTE_CARDS.map((card) => (
          <div
            key={card.id}
            className={`rounded-2xl border p-3 ${
              card.selected ? "border-white/40 bg-white/12" : "border-white/12 bg-white/5"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-sm font-semibold on-stage">Untitled note</p>
              <Star className="size-3.5 shrink-0 on-stage-muted" />
            </div>
            <p className="mt-1 truncate text-xs on-stage-muted">Empty note</p>
            <p className="mt-2 text-[0.6rem] uppercase tracking-[0.2em] on-stage-muted">
              Just now • KMW
            </p>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

function EditorPanel() {
  return (
    <GlassPanel className="flex min-h-0 flex-1 flex-col !p-0">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 p-4">
        <p className="min-w-0 flex-1 truncate text-base font-semibold on-stage">Untitled note</p>
        <div className="flex h-8 w-28 items-center justify-between rounded-lg border border-white/20 bg-white/10 px-2.5 text-xs on-stage-muted">
          kmw
          <span className="text-[0.6rem]">▾</span>
        </div>
        <Star className="size-4 on-stage-muted" />
        <Trash2 className="size-4 on-stage-muted" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#0d1117] px-3 py-2">
        <div className="flex items-center gap-3 text-[#c9d1d9]">
          <Bold className="size-3.5" />
          <Italic className="size-3.5" />
          <Code2 className="size-3.5" />
          <Link2 className="size-3.5" />
          <Image className="size-3.5" />
          <span className="ml-1 text-[0.6rem] uppercase tracking-[0.2em] text-[#8b949e]">
            Saved just now
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Expand className="size-3.5 text-[#8b949e]" />
          <span className="flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-xs text-white">
            <Pencil className="size-3" />
            Write
          </span>
          <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-[#8b949e]">
            <Eye className="size-3" />
            Preview
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#0d1117] p-4">
        <p
          className="text-sm leading-relaxed text-[#c9d1d9]"
          style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace" }}
        >
          Write in Markdown. Fenced code blocks use GitHub Dark colors.
        </p>
      </div>
    </GlassPanel>
  );
}
