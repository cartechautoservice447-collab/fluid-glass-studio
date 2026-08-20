import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Plus, Search, SlidersHorizontal } from "lucide-react";

import { EngineSettingsModal } from "@/components/liquid/EngineSettingsModal";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { NoteList } from "@/components/notes/NoteList";
import { Sidebar } from "@/components/notes/Sidebar";
import { Input } from "@/components/ui/input";
import type { Course } from "@/hooks/useCourses";
import { useNotes } from "@/hooks/useNotes";

type Props = {
  course: Course;
  onBack: () => void;
  onLogout: () => void;
  userId: string;
  email: string | null;
};

type MobileView = "list" | "filters" | "editor";

const noop = () => {};

export function CourseNotesViewMobile({ course, onBack, onLogout, userId, email }: Props) {
  const notes = useNotes(course.id, userId);
  const { filter } = notes;
  const [view, setView] = useState<MobileView>("list");

  const heading =
    filter.kind === "all"
      ? "All Notes"
      : filter.kind === "favorites"
        ? "Favorites"
        : (notes.collections.find((c) => c.id === filter.id)?.name ?? "Collection");

  const shell = "mobile-notes-panel flex h-full min-h-0 w-full flex-col gap-3";

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <AnimatePresence mode="wait" initial={false}>
        {view === "list" && (
          <motion.div
            key="mobile-list"
            className={shell}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onBack}
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-foreground backdrop-blur-xl"
                aria-label="Back to My Courses"
              >
                <ArrowLeft className="size-5" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.6rem] font-bold uppercase tracking-[0.28em] text-muted-foreground on-stage">
                  {course.name}
                </p>
                <h1 className="truncate text-base font-semibold text-foreground on-stage">{heading}</h1>
              </div>
              <button
                type="button"
                onClick={() => setView("filters")}
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-foreground backdrop-blur-xl"
                aria-label="Open filters and collections"
              >
                <SlidersHorizontal className="size-5" />
              </button>
              <EngineSettingsModal trigger="icon" />
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={notes.query}
                onChange={(event) => notes.setQuery(event.target.value)}
                placeholder="Search notes"
                aria-label="Search notes"
                className="h-11 border-white/25 bg-white/10 pl-9 text-sm"
              />
            </div>

            <div className="min-h-0 flex-1">
              <NoteList
                minimized={false}
                onMinimize={noop}
                notes={notes.visibleNotes}
                selectedId={notes.selectedId}
                onSelect={(id) => {
                  notes.setSelectedId(id);
                  setView("editor");
                }}
                onToggleFavorite={notes.toggleFavorite}
                heading={heading}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                notes.createNote();
                setView("editor");
              }}
              className="notes-pulse-glow absolute bottom-4 right-4 z-20 flex size-14 items-center justify-center rounded-full bg-emerald-500 text-emerald-950 shadow-lg active:scale-95"
              aria-label="New note"
            >
              <Plus className="size-6" />
            </button>
          </motion.div>
        )}

        {view === "filters" && (
          <motion.div
            key="mobile-filters"
            className={shell}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <button
              type="button"
              onClick={() => setView("list")}
              className="flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-2 text-xs font-semibold text-foreground backdrop-blur-xl"
            >
              <ArrowLeft className="size-4" />
              Notes
            </button>
            <div className="min-h-0 flex-1">
              <Sidebar
                minimized={false}
                onMinimize={noop}
                email={email}
                onBack={onBack}
                onLogout={onLogout}
                collections={notes.collections}
                counts={notes.counts}
                filter={notes.filter}
                setFilter={(next) => {
                  notes.setFilter(next);
                  setView("list");
                }}
                query={notes.query}
                setQuery={notes.setQuery}
                onCreateNote={() => {
                  notes.createNote();
                  setView("editor");
                }}
                onAddCollection={notes.addCollection}
                onRenameCollection={notes.renameCollection}
                onDeleteCollection={notes.deleteCollection}
              />
            </div>
          </motion.div>
        )}

        {view === "editor" && (
          <motion.div
            key="mobile-editor"
            className={shell}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <button
              type="button"
              onClick={() => setView("list")}
              className="flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-2 text-xs font-semibold text-foreground backdrop-blur-xl"
            >
              <ArrowLeft className="size-4" />
              {heading}
            </button>
            <div className="min-h-0 flex-1">
              <NoteEditor
                minimized={false}
                onMinimize={noop}
                note={notes.selected}
                collections={notes.collections}
                onUpdate={notes.updateNote}
                onDelete={(id) => {
                  notes.deleteNote(id);
                  setView("list");
                }}
                onToggleFavorite={notes.toggleFavorite}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
