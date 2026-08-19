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

  const heading =
    filter.kind === "all"
      ? "All Notes"
      : filter.kind === "favorites"
        ? "Favorites"
        : (notes.collections.find((c) => c.id === filter.id)?.name ?? "Collection");

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-3">
      <div className="relative flex min-h-0 w-full flex-1 flex-row items-stretch gap-4 overflow-x-auto">
        <div className={minimized.sidebar ? "h-full w-14 min-w-14 shrink-0" : "h-full w-72 min-w-[220px] shrink basis-72"}>
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
        </div>
        <div className={minimized.notes ? "h-full w-14 min-w-14 shrink-0" : "h-full w-80 min-w-[240px] shrink basis-80"}>
          <NoteList
            minimized={minimized.notes}
            onMinimize={() => setMinimized((current) => ({ ...current, notes: !current.notes }))}
            notes={notes.visibleNotes}
            selectedId={notes.selectedId}
            onSelect={notes.setSelectedId}
            onToggleFavorite={notes.toggleFavorite}
            heading={heading}
          />
        </div>
        <div className={minimized.editor ? "h-full w-14 min-w-14 shrink-0" : "h-full min-w-[280px] flex-1"}>
          <NoteEditor
            minimized={minimized.editor}
            onMinimize={() => setMinimized((current) => ({ ...current, editor: !current.editor }))}
            note={notes.selected}
            collections={notes.collections}
            onUpdate={notes.updateNote}
            onDelete={notes.deleteNote}
            onToggleFavorite={notes.toggleFavorite}
          />
        </div>
      </div>
    </div>
  );
}
