import { BookOpen, History, Timer, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { AddCourseModal } from "@/components/courses/AddCoursesModal";
import { CourseCard } from "@/components/courses/CourseCard";
import { OverviewModal } from "@/components/focus/OverviewModal";
import { PomodoroModal } from "@/components/focus/PomodoroModal";
import { ReminderCenter } from "@/components/focus/ReminderCenter";
import { GlassPanel } from "@/components/liquid/GlassPanel";
import { EngineSettingsModal } from "@/components/liquid/EngineSettingsModal";
import { ThemeToggle } from "@/components/liquid/ThemeToggle";
import { useCustomization } from "@/context/CustomizationContext";
import type { Course, CourseAccent } from "@/hooks/useCourses";

const PERFORMANCE_EVENT = "glass-performance-changed";
const performanceKey = (userId: string) => `liquid-glass-performance-mode:${userId}`;

type Props = {
  courses: Course[];
  noteCounts: Record<string, number>;
  lastEdited: Record<string, number | null>;
  hiddenCourseId: string | null;
  onOpenCourse: (id: string) => void;
  onCreateCourse: (input: { name: string; description: string; color: CourseAccent }) => void;
  onDeleteCourse: (id: string) => void;
  userId: string;
  email: string | null;
  onLogout: () => void;
};

export function CourseGrid({
  courses,
  noteCounts,
  lastEdited,
  hiddenCourseId,
  onOpenCourse,
  onCreateCourse,
  onDeleteCourse,
  userId,
  email,
  onLogout,
}: Props) {
  const { displayName } = useCustomization();
  const [pomodoroOpen, setPomodoroOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [performance, setPerformance] = useState<"high" | "ultra">(
    () => (localStorage.getItem(performanceKey(userId)) === "ultra" ? "ultra" : "high"),
  );

  useEffect(() => {
    const key = performanceKey(userId);
    const mode = localStorage.getItem(key) === "ultra" ? "ultra" : "high";
    setPerformance(mode);
    document.documentElement.dataset["glassPerformance"] = mode;

    const onExternalChange = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string; mode?: "high" | "ultra" }>).detail;
      if (detail?.userId === userId && detail.mode) {
        setPerformance(detail.mode);
        document.documentElement.dataset["glassPerformance"] = detail.mode;
      }
    };

    window.addEventListener(PERFORMANCE_EVENT, onExternalChange);
    return () => window.removeEventListener(PERFORMANCE_EVENT, onExternalChange);
  }, [userId]);

  const setPerformanceMode = (mode: "high" | "ultra") => {
    setPerformance(mode);
    localStorage.setItem(performanceKey(userId), mode);
    document.documentElement.dataset["glassPerformance"] = mode;
    window.dispatchEvent(new CustomEvent(PERFORMANCE_EVENT, { detail: { userId, mode } }));
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-6 overflow-y-auto px-2 py-2">
      <GlassPanel
        glassId="course-grid-header"
        className="relative flex flex-wrap items-center justify-between gap-3 p-5"
        glassRadius={30}
        glassBezel={42}
      >
        <div className="relative">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Welcome back{displayName ? `, ${displayName}` : ""}!
          </h1>
          <p className="text-sm text-muted-foreground">Select a course folder to access your workspace</p>
        </div>

        <div className="relative flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-transparent p-1.5">
            <span className="inline-flex items-center gap-1.5 px-2 text-xs text-muted-foreground">
              <Zap className="size-3.5" />
              Performance
            </span>
            <button
              type="button"
              onClick={() => setPerformanceMode("high")}
              className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${performance === "high" ? "border-white/40 bg-white/15 text-foreground" : "border-white/10 bg-transparent text-muted-foreground hover:bg-white/10"}`}
            >
              High
            </button>
            <button
              type="button"
              onClick={() => setPerformanceMode("ultra")}
              className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${performance === "ultra" ? "border-white/40 bg-white/15 text-foreground" : "border-white/10 bg-transparent text-muted-foreground hover:bg-white/10"}`}
            >
              Ultra
            </button>
          </div>
          <ThemeToggle />
          <EngineSettingsModal />
        </div>
      </GlassPanel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <GlassPanel glassId="course-grid-study-hub" interactive onClick={() => setReminderOpen(true)} className="min-h-24 p-5" glassRadius={30} glassBezel={40}>
          <div className="flex items-center gap-4 text-left">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-foreground shadow-inner">
              <BookOpen className="size-5" />
            </span>
            <span>
              <span className="block text-base font-semibold text-foreground">Study Hub</span>
              <span className="mt-1 block text-xs text-muted-foreground">CS50 lectures</span>
            </span>
          </div>
        </GlassPanel>

        <GlassPanel glassId="course-grid-pomodoro" interactive onClick={() => setPomodoroOpen(true)} className="min-h-24 p-5" glassRadius={30} glassBezel={40}>
          <div className="flex items-center gap-4 text-left">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-foreground shadow-inner">
              <Timer className="size-5" />
            </span>
            <span>
              <span className="block text-base font-semibold text-foreground">Pomodoro</span>
              <span className="mt-1 block text-xs text-muted-foreground">Focus, breaks &amp; Study Session</span>
            </span>
          </div>
        </GlassPanel>

        <GlassPanel glassId="course-grid-overview" interactive onClick={() => setOverviewOpen(true)} className="min-h-24 p-5" glassRadius={30} glassBezel={40}>
          <div className="flex items-center gap-4 text-left">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-foreground shadow-inner">
              <History className="size-5" />
            </span>
            <span>
              <span className="block text-base font-semibold text-foreground">Overview</span>
              <span className="mt-1 block text-xs text-muted-foreground">All study tools and progress</span>
            </span>
          </div>
        </GlassPanel>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden />
          <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.3em] text-muted-foreground on-stage-muted">
            Course Folders
          </h2>
        </div>
        <AddCourseModal onCreate={onCreateCourse} />
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm font-medium text-foreground on-stage">No courses yet</p>
          <p className="max-w-xs text-xs text-muted-foreground on-stage-muted">
            Add your first course to start taking notes inside its own glass workspace.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
          {courses.map((course) =>
            course.id === hiddenCourseId ? (
              <div key={course.id} className="h-52" aria-hidden />
            ) : (
              <CourseCard
                key={course.id}
                course={course}
                noteCount={noteCounts[course.id] ?? 0}
                lastEditedAt={lastEdited[course.id] ?? null}
                onOpen={() => onOpenCourse(course.id)}
                onDelete={() => onDeleteCourse(course.id)}
              />
            ),
          )}
        </div>
      )}

      <PomodoroModal open={pomodoroOpen} onOpenChange={setPomodoroOpen} />
      <OverviewModal open={overviewOpen} onOpenChange={setOverviewOpen} courses={courses} userId={userId} />
      <ReminderCenter
        open={reminderOpen}
        onOpenChange={setReminderOpen}
        courses={courses}
        userId={userId}
        email={email}
        onLogout={onLogout}
      />
    </div>
  );
}
