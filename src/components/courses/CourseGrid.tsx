import { BookOpen, Timer } from "lucide-react";
import { useState } from "react";

import { AddCourseModal } from "@/components/courses/AddCoursesModal";
import { CourseCard } from "@/components/courses/CourseCard";
import { PomodoroModal } from "@/components/focus/PomodoroModal";
import { EngineSettingsModal } from "@/components/liquid/EngineSettingsModal";
import { ThemeToggle } from "@/components/liquid/ThemeToggle";
import { useCustomization } from "@/context/CustomizationContext";
import type { Course, CourseAccent } from "@/hooks/useCourses";

type Props = {
  courses: Course[];
  noteCounts: Record<string, number>;
  lastEdited: Record<string, number | null>;
  hiddenCourseId: string | null;
  onOpenCourse: (id: string) => void;
  onCreateCourse: (input: { name: string; description: string; color: CourseAccent }) => void;
};

export function CourseGrid({ courses, noteCounts, lastEdited, hiddenCourseId, onOpenCourse, onCreateCourse }: Props) {
  const { displayName } = useCustomization();
  const [pomodoroOpen, setPomodoroOpen] = useState(false);

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-6 overflow-y-auto px-2 py-2">
      <div className="liquid-panel flex flex-wrap items-center justify-between gap-4 rounded-3xl p-5" style={{ backgroundColor: "var(--water-gel-bg)", backdropFilter: "blur(var(--liquid-density, 12px)) saturate(200%) contrast(105%)", borderTop: "1px solid rgba(255, 255, 255, 0.4)", boxShadow: "inset 0 1px 2px 0 rgba(255, 255, 255, 0.5), inset 0 -2px 4px 0 rgba(0, 0, 0, 0.25), 0 8px 32px 0 rgba(0, 0, 0, 0.37)" }}>
        <div className="flex items-center gap-4">
          <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-full"><BookOpen className="size-6 text-white drop-shadow" /></span>
          <div><h1 className="text-xl font-semibold tracking-tight text-foreground">Welcome back{displayName ? `, ${displayName}` : ""}! 👋</h1><p className="text-sm text-muted-foreground">Select a course folder to access your workspace</p></div>
        </div>
        <div className="flex items-center gap-2"><ThemeToggle /><EngineSettingsModal /></div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button type="button" onClick={() => setPomodoroOpen(true)} className="liquid-panel group flex min-h-28 items-center gap-4 rounded-3xl p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:brightness-110" style={{ backgroundColor: "var(--water-gel-bg)", backdropFilter: "blur(var(--liquid-density, 12px)) saturate(180%)", borderTop: "1px solid rgba(255,255,255,.32)" }}>
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-foreground shadow-inner"><Timer className="size-5" /></span>
          <span><span className="block text-base font-semibold text-foreground">Pomodoro</span><span className="mt-1 block text-xs text-muted-foreground">Focus with a timer</span></span>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary" aria-hidden /><h2 className="text-[0.68rem] font-bold uppercase tracking-[0.3em] text-muted-foreground on-stage-muted">Course Folders</h2></div>
        <AddCourseModal onCreate={onCreateCourse} />
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center"><p className="text-sm font-medium text-foreground on-stage">No courses yet</p><p className="max-w-xs text-xs text-muted-foreground on-stage-muted">Add your first course to start taking notes inside its own glass workspace.</p></div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
          {courses.map((course) => course.id === hiddenCourseId ? <div key={course.id} className="h-52" aria-hidden /> : <CourseCard key={course.id} course={course} noteCount={noteCounts[course.id] ?? 0} lastEditedAt={lastEdited[course.id] ?? null} onOpen={() => onOpenCourse(course.id)} />)}
        </div>
      )}

      <PomodoroModal open={pomodoroOpen} onOpenChange={setPomodoroOpen} />
    </div>
  );
}
