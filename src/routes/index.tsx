import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import { CustomizationProvider } from "@/context/CustomizationContext";
import { LiquidFilters } from "@/components/liquid/LiquidFilters";
import { Sidebar } from "@/components/notes/Sidebar";
import { NoteList } from "@/components/notes/NoteList";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { useNotes } from "@/hooks/useNotes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Glass Notes — Liquid Glass note-taking" },
      {
        name: "description",
        content:
          "A three-column markdown note-taking app wrapped in a real-time Apple-style Liquid Glass engine — tune density, transparency, clearness, gel and bounce live.",
      },
      { property: "og:title", content: "Glass Notes — Liquid Glass note-taking" },
      {
        property: "og:description",
        content: "Notes, collections and markdown editing inside a live liquid-glass interface.",
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
      <GlassNotesApp />
    </CustomizationProvider>
  );
}

type MobileView = "sidebar" | "list" | "editor";

function GlassNotesApp() {
  const notes = useNotes();
  const [mobileView, setMobileView] = useState<MobileView>("sidebar");

  const heading =
    notes.filter.kind === "favorites"
      ? "Favorites"
      : notes.filter.kind === "collection"
        ? (notes.collections.find((c) => c.id === notes.filter.id)?.name ?? "Collection")
        : "All Notes";

  const handleSelectNote = (id: string) => {
    notes.setSelectedId(id);
    setMobileView("editor");
  };

  const handleCreateNote = () => {
    notes.createNote();
    setMobileView("editor");
  };

  return (
    <main className="liquid-stage relative flex h-screen flex-col overflow-hidden px-3 py-3 sm:px-5 sm:py-5 lg:px-6">
      <div className="liquid-orb liquid-orb-a" aria-hidden />
      <div className="liquid-orb liquid-orb-b" aria-hidden />
      <div className="liquid-orb liquid-orb-c" aria-hidden />

      <div className="relative flex min-h-0 flex-1 gap-4">
        {/* Sidebar column */}
        <div
          className={`min-h-0 w-full flex-col lg:flex lg:w-80 lg:shrink-0 ${
            mobileView === "sidebar" ? "flex" : "hidden"
          }`}
        >
          <Sidebar
            collections={notes.collections}
            counts={notes.counts}
            filter={notes.filter}
            setFilter={(f) => {
              notes.setFilter(f);
              setMobileView("list");
            }}
            query={notes.query}
            setQuery={notes.setQuery}
            onCreateNote={handleCreateNote}
            onAddCollection={notes.addCollection}
            onRenameCollection={notes.renameCollection}
            onDeleteCollection={notes.deleteCollection}
          />
        </div>

        {/* Note list column */}
        <div
          className={`min-h-0 w-full flex-col lg:flex lg:w-80 lg:shrink-0 ${
            mobileView === "list" ? "flex" : "hidden"
          }`}
        >
          <button
            type="button"
            onClick={() => setMobileView("sidebar")}
            className="on-stage mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide lg:hidden"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </button>
          <NoteList
            notes={notes.visibleNotes}
            selectedId={notes.selectedId}
            onSelect={handleSelectNote}
            onToggleFavorite={notes.toggleFavorite}
            heading={heading}
          />
        </div>

        {/* Editor column */}
        <div
          className={`min-h-0 w-full flex-1 flex-col lg:flex ${
            mobileView === "editor" ? "flex" : "hidden"
          }`}
        >
          <button
            type="button"
            onClick={() => setMobileView("list")}
            className="on-stage mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide lg:hidden"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </button>
          <NoteEditor
            note={notes.selected}
            collections={notes.collections}
            onUpdate={notes.updateNote}
            onDelete={(id) => {
              notes.deleteNote(id);
              setMobileView("list");
            }}
            onToggleFavorite={notes.toggleFavorite}
          />
        </div>
      </div>
    </main>
  );
}
