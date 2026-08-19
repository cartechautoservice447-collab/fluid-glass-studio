import { ArrowLeft } from "lucide-react";

import { NoteEditor } from "@/components/notes/NoteEditor";
import { NoteList } from "@/components/notes/NoteList";
import { Sidebar } from "@/components/notes/Sidebar";
import type { Course } from "@/hooks/useCourses";
import { useNotes } from "@/hooks/useNotes";

type Props = {
  course: Course;
  onBack: () => void;
  userId: string;
};

export function CourseNotesView({ course, onBack, userId }: Props) {
  const notes = useNotes(course.id, userId);
  const { filter } = notes;

  const heading =
    filter.kind === "all"
      ? "All Notes"
      : filter.kind === "favorites"
        ? "Favorites"
        : (notes.collections.find((c) => c.id === filter.id)?.name ?? "Collection");

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-3">
      <div className="flex items-center gap-3 px-1">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-xs font-medium text-foreground on-stage transition-colors hover:bg-white/20"
        >
          <ArrowLeft className="size-3.5" />
          My Courses
        </button>
        <span className="text-xs text-muted-foreground on-stage-muted">/</span>
        <span className="truncate text-sm font-semibold text-foreground on-stage">
          {course.name}
        </span>
      </div>

      <div className="relative flex min-h-0 w-full flex-1 flex-row items-stretch gap-4 overflow-x-auto">
        <div className="h-full w-72 min-w-[220px] shrink basis-72">
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
        <div className="h-full w-80 min-w-[240px] shrink basis-80">
          <NoteList
            notes={notes.visibleNotes}
            selectedId={notes.selectedId}
            onSelect={notes.setSelectedId}
            onToggleFavorite={notes.toggleFavorite}
            heading={heading}
          />
        </div>
        <div className="h-full min-w-[280px] flex-1">
          <NoteEditor
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
