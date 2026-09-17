import { FileText, Folder, Trash2, X } from "lucide-react";
import { useState } from "react";

import { GlassPanel } from "@/components/liquid/GlassPanel";
import type { Course } from "@/hooks/useCourses";
import { relativeDate } from "@/hooks/useNotes";

const ACCENT_COLOR: Record<Course["color"], string> = {
  sky: "oklch(0.75 0.14 235)",
  violet: "oklch(0.7 0.19 300)",
  amber: "oklch(0.8 0.16 80)",
  emerald: "oklch(0.75 0.16 155)",
  rose: "oklch(0.72 0.18 15)",
  cyan: "oklch(0.78 0.13 200)",
};

type Props = {
  course: Course;
  noteCount: number;
  lastEditedAt: number | null;
  onOpen: () => void;
  onDelete: () => void;
};

export function CourseCard({ course, noteCount, lastEditedAt, onOpen, onDelete }: Props) {
  const accent = ACCENT_COLOR[course.color] ?? ACCENT_COLOR.sky;
  const [confirmOpen, setConfirmOpen] = useState(false);

  const confirmDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    setConfirmOpen(true);
  };

  const cancelDelete = () => setConfirmOpen(false);
  const performDelete = () => {
    setConfirmOpen(false);
    onDelete();
  };

  return (
    <>
      <GlassPanel
        glassId={`course-card-${course.id}`}
        interactive
        onClick={onOpen}
        className="group h-52 w-full p-5 text-left"
        glassRadius={30}
        glassBezel={42}
      >
        <div className="flex h-full flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <span
              className="flex size-11 items-center justify-center rounded-2xl border border-white/10"
              style={{ backgroundColor: `color-mix(in oklab, ${accent} 55%, transparent)` }}
            >
              <Folder className="size-5 text-white drop-shadow" />
            </span>
            <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[0.65rem] font-medium text-foreground">
              <FileText className="size-3" />
              {noteCount} {noteCount === 1 ? "note" : "notes"}
            </span>
          </div>

          <div className="min-w-0 space-y-1.5">
            <h3 className="truncate text-base font-semibold text-foreground">{course.name}</h3>
            <span
              className="inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.15em] text-foreground"
              style={{ backgroundColor: `color-mix(in oklab, ${accent} 30%, transparent)` }}
            >
              {course.color}
            </span>
            {course.description && (
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{course.description}</p>
            )}
          </div>

          <div className="flex items-center border-t border-white/10 pt-3">
            <span className="text-[0.68rem] text-muted-foreground">
              {lastEditedAt ? `Last edited ${relativeDate(lastEditedAt)}` : "No notes yet"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={confirmDelete}
          className="absolute bottom-3 right-3 z-10 flex size-7 items-center justify-center text-foreground/65 transition-colors hover:text-foreground focus-visible:outline-none"
          aria-label={`Delete ${course.name}`}
          title="Delete course"
        >
          <Trash2 className="size-4" />
        </button>
      </GlassPanel>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/35 p-5 backdrop-blur-md"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={`delete-course-${course.id}`}
        >
          <GlassPanel
            glassId={`delete-course-dialog-${course.id}`}
            className="relative w-full max-w-sm p-6 text-foreground"
            glassRadius={30}
            glassBezel={40}
          >
            <button
              type="button"
              onClick={cancelDelete}
              className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full text-foreground/60 transition hover:bg-white/10 hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>

            <div className="relative">
              <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                <Trash2 className="size-5" />
              </div>
              <h2 id={`delete-course-${course.id}`} className="text-lg font-semibold">Delete course?</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Are you sure you want to delete <span className="font-medium text-foreground">{course.name}</span>? This will permanently delete the course and its notes.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={cancelDelete} className="rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-2.5 text-sm font-medium transition hover:bg-white/[0.14]">
                  Cancel
                </button>
                <button type="button" onClick={performDelete} className="rounded-2xl border border-white/15 bg-white/[0.14] px-4 py-2.5 text-sm font-semibold transition hover:bg-white/[0.2]">
                  Delete
                </button>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}
    </>
  );
}
