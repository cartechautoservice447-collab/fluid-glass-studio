import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { AuthPage } from "@/components/auth/AuthPage";
import { CourseGrid } from "@/components/courses/CourseGrid";
import { CourseNotesView } from "@/components/courses/CourseNotesView";
import { GlassPanel } from "@/components/liquid/GlassPanel";
import { PwaInstallButton } from "@/components/pwa/PwaInstallButton";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CustomizationProvider } from "@/context/CustomizationContext";
import { useCourseStats, useCourses } from "@/hooks/useCourses";
import { usePomodoroRestSync } from "@/lib/pomodoroSync";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Glass Notes — Liquid Glass course workspaces" },
      { name: "description", content: "Course folders open into an isolated Liquid Glass notes workspace." },
      { property: "og:title", content: "Glass Notes — Liquid Glass course workspaces" },
      { property: "og:description", content: "Course folders open into an isolated Liquid Glass notes workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
  ssr: false,
});

const POMODORO_SESSION_KEY = "liquid-glass-pomodoro-session";
const STUDY_SESSION_KEY = "liquid-glass-study-session";

type PomodoroSession = {
  mode: "focus" | "short" | "long";
  phase: "working" | "resting";
  deadline: number;
  running: boolean;
};

function readPomodoroSession(): PomodoroSession | null {
  try {
    const saved = JSON.parse(localStorage.getItem(POMODORO_SESSION_KEY) ?? "null");
    if (!saved || !saved.running || typeof saved.deadline !== "number" || saved.deadline <= Date.now()) return null;
    if (!["focus", "short", "long"].includes(saved.mode) || !["working", "resting"].includes(saved.phase)) return null;
    return saved;
  } catch {
    return null;
  }
}

function readStudyRestDeadline(): number | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STUDY_SESSION_KEY) ?? "null");
    if (!saved || !saved.running || typeof saved.deadline !== "number" || saved.deadline <= Date.now() || !Array.isArray(saved.schedule) || !Number.isInteger(saved.index) || saved.index < 0 || saved.index >= saved.schedule.length) return null;
    return saved.schedule[saved.index]?.kind === "rest" ? saved.deadline : null;
  } catch {
    return null;
  }
}

function Page() {
  return (
    <AuthProvider>
      <CustomizationProvider>
        <AuthenticatedWorkspace />
        <PwaInstallButton />
      </CustomizationProvider>
    </AuthProvider>
  );
}

function AuthenticatedWorkspace() {
  const { user, loading, logout } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-transparent text-sm text-slate-300">Loading your workspace…</div>;
  if (!user) return <AuthPage />;
  return <Workspace userId={user.id} email={user.email} onLogout={() => void logout()} />;
}

function Workspace({ userId, email, onLogout }: { userId: string; email: string | null; onLogout: () => void }) {
  const { courses, addCourse, deleteCourse } = useCourses(userId);
  const { data: stats } = useCourseStats(userId);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [lockedSession, setLockedSession] = useState<PomodoroSession | null>(null);

  usePomodoroRestSync(userId);

  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? null;
  const noteCounts = stats?.counts ?? {};
  const lastEdited = stats?.lastEdited ?? {};

  useEffect(() => {
    const sync = () => {
      const session = readPomodoroSession();
      if (session?.phase === "resting") {
        setLockedSession(session);
        window.dispatchEvent(new Event("glass-pomodoro-rest-lock"));
        return;
      }
      const studyDeadline = readStudyRestDeadline();
      if (studyDeadline) {
        setLockedSession({ mode: "short", phase: "resting", deadline: studyDeadline, running: true });
        window.dispatchEvent(new Event("glass-pomodoro-rest-lock"));
        return;
      }
      setLockedSession(null);
    };

    sync();
    const id = window.setInterval(sync, 250);
    const onStorage = (event: StorageEvent) => {
      if (event.key === POMODORO_SESSION_KEY || event.key === STUDY_SESSION_KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const remaining = lockedSession ? Math.max(0, Math.ceil((lockedSession.deadline - Date.now()) / 1000)) : 0;

  return (
    <div className="fixed inset-0 z-10 overflow-hidden bg-transparent">
      <main className="relative flex h-full w-full overflow-hidden bg-transparent p-[10px]">
        <div className="relative min-h-0 w-full flex-1">
          <AnimatePresence mode="wait" initial={false}>
            {selectedCourse ? (
              <motion.div key={`course-${selectedCourse.id}`} className="absolute inset-0 p-[10px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.28, ease: "easeInOut" }}>
                <CourseNotesView course={selectedCourse} userId={userId} email={email} onLogout={onLogout} onBack={() => setSelectedCourseId(null)} />
              </motion.div>
            ) : (
              <motion.div key="course-grid" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.28, ease: "easeInOut" }}>
                <CourseGrid courses={courses} noteCounts={noteCounts} lastEdited={lastEdited} hiddenCourseId={null} onOpenCourse={setSelectedCourseId} onCreateCourse={addCourse} onDeleteCourse={deleteCourse} userId={userId} email={email} onLogout={onLogout} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {lockedSession && (
        <div className="fixed inset-0 z-[9999] flex min-h-screen select-none items-center justify-center overflow-hidden bg-black/70 p-5 backdrop-blur-xl" role="dialog" aria-modal="true" aria-label="Rest session in progress">
          <GlassPanel glassId="pomodoro-rest-lock" className="relative w-full max-w-lg p-7 text-center sm:p-10" glassRadius={32} glassBezel={48}>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Rest session</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Website locked</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">The entire website is locked during rest, including every course, folder, Study Hub, and study tool. Everything unlocks automatically when rest ends.</p>
            <div className="mt-9 text-7xl font-semibold tabular-nums tracking-[-0.05em] sm:text-8xl">{String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}</div>
            <p className="mt-3 text-sm text-muted-foreground">Rest time remaining</p>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
