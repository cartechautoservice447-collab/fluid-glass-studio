import { useState } from "react";
import { LayoutDashboard, X } from "lucide-react";
import { StudyFeaturesPanel } from "@/components/study/StudyFeaturesPanel";
import { useNotes, type Note } from "@/hooks/useNotes";
import type { Course } from "@/hooks/useCourses";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; courses: Course[]; userId: string };

function CourseStudyFeatures({ course, userId }: { course: Course; userId: string }) {
  const notes = useNotes(course.id, userId);

  const restoreNote = (note: Note) => {
    const existing = notes.notes.find((current) => current.id === note.id);
    if (existing) {
      notes.updateNote(note.id, {
        title: note.title,
        body: note.body,
        favorite: note.favorite,
        collectionId: note.collectionId,
      });
      return;
    }

    const newId = notes.createNote();
    if (!newId) return;
    notes.updateNote(newId, {
      title: note.title,
      body: note.body,
      favorite: note.favorite,
      collectionId: note.collectionId,
    });
  };

  return <StudyFeaturesPanel courseName={course.name} notes={notes.notes} onRestoreNote={restoreNote} />;
}

export function OverviewModal({ open, onOpenChange, courses, userId }: Props) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(courses[0]?.id ?? null);
  if (!open) return null;
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? courses[0] ?? null;
  return <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/45 p-5 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Overview">
    <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[30px] border border-white/20 bg-black/40 text-foreground shadow-2xl backdrop-blur-2xl">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-5"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]"><LayoutDashboard className="size-5" /></div><div><h2 className="text-lg font-semibold">Overview</h2><p className="text-xs text-muted-foreground">All study tools and progress in one place</p></div></div><button type="button" onClick={() => onOpenChange(false)} className="rounded-full p-2 text-muted-foreground hover:bg-white/10" aria-label="Close"><X className="size-4" /></button></div>
      {courses.length ? <div className="min-h-0 overflow-y-auto px-5 pb-6"><div className="flex flex-wrap gap-2 pt-4">{courses.map((course) => <button key={course.id} type="button" onClick={() => setSelectedCourseId(course.id)} className={`rounded-2xl border px-3 py-2 text-xs transition ${course.id === selectedCourse?.id ? "border-white/25 bg-white/15 text-foreground" : "border-white/10 bg-white/[0.05] text-muted-foreground hover:bg-white/10"}`}>{course.name}</button>)}</div>{selectedCourse && <CourseStudyFeatures key={selectedCourse.id} course={selectedCourse} userId={userId} />}</div> : <div className="p-10 text-center text-sm text-muted-foreground">Create a course to use the study tools.</div>}
    </div>
  </div>;
}
