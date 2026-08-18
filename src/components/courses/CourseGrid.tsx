import { BookOpen } from "lucide-react";

import { AddCourseModal } from "@/components/courses/AddCourseModal";
import { CourseCard } from "@/components/courses/CourseCard";
import { EngineSettingsModal } from "@/components/liquid/EngineSettingsModal";
import { ThemeToggle } from "@/components/liquid/ThemeToggle";
import type { Course, CourseAccent } from "@/hooks/useCourses";

type Props = {
  courses: Course[];
  noteCounts: Record<string, number>;
  /** Course currently expanding into the notes view — rendered as a blank
   *  spacer here so the grid doesn't reflow while the shared-layout
   *  transition is in flight. */
  hiddenCourseId: string | null;
  onOpenCourse: (id: string) => void;
  onCreateCourse: (input: { name: string; description: string; color: CourseAccent }) => void;
};

export function CourseGrid({
  courses,
  noteCounts,
  hiddenCourseId,
  onOpenCourse,
  onCreateCourse,
}: Props) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-6 overflow-y-auto px-2 py-2">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white/15">
            <BookOpen className="size-5 text-foreground on-stage" />
          </span>
          <div>
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-muted-foreground on-stage-muted">
              Liquid Glass
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-foreground on-stage">
              My Courses
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <EngineSettingsModal />
          <AddCourseModal onCreate={onCreateCourse} />
        </div>
      </header>

      {courses.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm font-medium text-foreground on-stage">No courses yet</p>
          <p className="max-w-xs text-xs text-muted-foreground on-stage-muted">
            Add your first course to start taking notes inside its own glass workspace.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
          {courses.map((course) =>
            course.id === hiddenCourseId ? (
              <div key={course.id} className="h-48" aria-hidden />
            ) : (
              <CourseCard
                key={course.id}
                course={course}
                noteCount={noteCounts[course.id] ?? 0}
                onOpen={() => onOpenCourse(course.id)}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}
