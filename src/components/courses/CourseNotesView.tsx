import { AnimatePresence, motion } from "motion/react";
import { PanelLeft } from "lucide-react";

import { NoteEditor } from "@/components/notes/NoteEditor";
import { NoteList } from "@/components/notes/NoteList";
import { Sidebar } from "@/components/notes/Sidebar";
import type { Course } from "@/hooks/useCourses";
import { useNotes } from "@/hooks/useNotes";
import { useState } from "react";

type Props = {
  course: Course;
  onBack: () => void;
  onLogout: () => void;
  userId: string;
  email: string | null;
};

export function CourseNotesView({ course, onBack, onLogout, userId, email }: Props) {
  const notes = useNotes(course.id, userId);
  const { filter } = notes;
  const [minimized, setMinimized] = useState({ sidebar: false, notes: false, editor: false });
  const hasMinimizedPanel = minimized.sidebar || minimized.notes || minimized.editor;

  const heading =
    filter.kind === "all"
      ? "All Notes"
      : filter.kind === "favorites"
        ? "Favorites"
        : (notes.collections.find((c) => c.id === filter.id)?.name ?? "Collection");

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col gap-[10px]">
      <div className="relative flex min-h-0 w-full flex-1 flex-row items-stretch gap-[14px] overflow-x-auto">
        <AnimatePresence initial={false}>
          {!minimized.sidebar && (
            <motion.div
              key="sidebar"
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={hasMinimizedPanel ? "h-full min-w-[220px] flex-1 basis-0" : "h-full w-72 min-w-[220px] shrink basis-72"}
            >
              <Sidebar
                minimized={minimized.sidebar}
                onMinimize={() => setMinimized((current) => ({ ...current, sidebar: !current.sidebar }))}
                email={email}
                onBack={onBack}
                onLogout={onLogout}
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
            </motion.div>
          )}
          {!minimized.notes && (
            <motion.div
              key="notes"
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={hasMinimizedPanel ? "h-full min-w-[240px] flex-1 basis-0" : "h-full w-80 min-w-[240px] shrink basis-80"}
            >
              <NoteList
                minimized={minimized.notes}
                onMinimize={() => setMinimized((current) => ({ ...current, notes: !current.notes }))}
                notes={notes.visibleNotes}
                selectedId={notes.selectedId}
                onSelect={notes.setSelectedId}
                onToggleFavorite={notes.toggleFavorite}
                heading={heading}
              />
            </motion.div>
          )}
          {!minimized.editor && (
            <motion.div
              key="editor"
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={
                hasMinimizedPanel
                  ? "h-full min-w-[280px] flex-[1.35] basis-0"
                  : "h-full min-w-[280px] flex-1"
              }
            >
              <NoteEditor
                minimized={minimized.editor}
                onMinimize={() => setMinimized((current) => ({ ...current, editor: !current.editor }))}
                note={notes.selected}
                collections={notes.collections}
                onUpdate={notes.updateNote}
                onDelete={notes.deleteNote}
                onToggleFavorite={notes.toggleFavorite}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {hasMinimizedPanel && (
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-full border border-white/25 bg-white/10 p-1.5 text-foreground backdrop-blur-xl">
          {minimized.sidebar && (
            <button
              type="button"
              onClick={() => setMinimized((current) => ({ ...current, sidebar: false }))}
              className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-white/20"
              aria-label="Restore navigation panel"
              title="Restore navigation panel"
            >
              <PanelLeft className="size-4" />
            </button>
          )}
          {minimized.notes && (
            <button
              type="button"
              onClick={() => setMinimized((current) => ({ ...current, notes: false }))}
              className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-white/20"
              aria-label="Restore notes panel"
              title="Restore notes panel"
            >
              <PanelLeft className="size-4" />
            </button>
          )}
          {minimized.editor && (
            <button
              type="button"
              onClick={() => setMinimized((current) => ({ ...current, editor: false }))}
              className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-white/20"
              aria-label="Restore editor panel"
              title="Restore editor panel"
            >
              <PanelLeft className="size-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
