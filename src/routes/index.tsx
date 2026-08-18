import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { LiquidFilters } from "@/components/liquid/LiquidFilters";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { NoteList } from "@/components/notes/NoteList";
import { Sidebar } from "@/components/notes/Sidebar";
import { CustomizationProvider, useCustomization } from "@/context/CustomizationContext";
import { useNotes } from "@/hooks/useNotes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Glass Notes — Liquid Glass markdown notes" },
      {
        name: "description",
        content:
          "Fully functional Glass Notes: collections sidebar with the Liquid Glass engine, a live note list, and a markdown editor with autosave.",
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
      <NotesShell />
    </CustomizationProvider>
  );
}

function NotesShell() {
  const { setTheme } = useCustomization();
  const notes = useNotes();

  useEffect(() => {
    setTheme("dark");
  }, [setTheme]);

  const heading =
    notes.filter.kind === "all"
      ? "All Notes"
      : notes.filter.kind === "favorites"
        ? "Favorites"
        : (notes.collections.find((c) => c.id === notes.filter.id)?.name ?? "Collection");

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#07070c]">
      <main className="liquid-stage relative flex h-full w-full overflow-hidden px-5 py-5">
        <div className="liquid-orb liquid-orb-a" aria-hidden />
        <div className="liquid-orb liquid-orb-b" aria-hidden />
        <div className="liquid-orb liquid-orb-c" aria-hidden />

        <div className="relative flex min-h-0 w-full flex-1 flex-row gap-4">
          <div className="w-72 shrink-0">
            <Sidebar
              collections={notes.collections}
              counts={notes.counts}
              filter={notes.filter}
              setFilter={notes.setFilter}
              query={notes.query}
              setQuery={notes.setQuery}
              onCreateNote={notes.createNote}
              onAddCollection={notes.addCollection}
              onRenameCollection={notes.renameCollection}
              onDeleteCollection={notes.deleteCollection}
            />
          </div>
          <div className="w-80 shrink-0">
            <NoteList
              notes={notes.visibleNotes}
              selectedId={notes.selectedId}
              onSelect={notes.setSelectedId}
              onToggleFavorite={notes.toggleFavorite}
              heading={heading}
            />
          </div>
          <div className="min-w-0 flex-1">
            <NoteEditor
              note={notes.selected}
              collections={notes.collections}
              onUpdate={notes.updateNote}
              onDelete={notes.deleteNote}
              onToggleFavorite={notes.toggleFavorite}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
