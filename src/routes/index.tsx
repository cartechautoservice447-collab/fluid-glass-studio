import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { AuthPage } from "@/components/auth/AuthPage";
import { CourseGrid } from "@/components/courses/CourseGrid";
import { CourseNotesView } from "@/components/courses/CourseNotesView";
import { LiquidFilters } from "@/components/liquid/LiquidFilters";
import { PwaInstallButton } from "@/components/pwa/PwaInstallButton";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CustomizationProvider } from "@/context/CustomizationContext";
import { useCourses, useCourseStats } from "@/hooks/useCourses";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Glass Notes — Liquid Glass course workspaces" },
      { name: "description", content: "Course folders open into an isolated Liquid Glass notes workspace: sidebar with engine settings, a live note list, and a markdown editor with autosave." },
      { property: "og:title", content: "Glass Notes — Liquid Glass course workspaces" },
      { property: "og:description", content: "Pick a course folder, then take notes inside a liquid-glass three-column workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const DISTRACTION_KEY = "liquid-glass-distraction-mode";

type DistractionSession = { active: boolean; courseId?: string | null; courseName: string; date: string; durationHours: number; endsAt: number | null };

function readDistractionSession(): DistractionSession | null {
  try {
    const saved = JSON.parse(localStorage.getItem(DISTRACTION_KEY) ?? "null");
    if (!saved?.active || !saved?.endsAt) return null;
    if (saved.endsAt <= Date.now()) {
      localStorage.removeItem(DISTRACTION_KEY);
      return null;
    }
    return saved as DistractionSession;
  } catch {
    return null;
  }
}

function Page() {
  return <AuthProvider><CustomizationProvider><LiquidFilters /><AuthenticatedWorkspace /><PwaInstallButton /></CustomizationProvider></AuthProvider>;
}

function AuthenticatedWorkspace() {
  const { user, loading, logout } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#07070c] text-sm text-slate-300">Loading your workspace…</div>;
  if (!user) return <AuthPage />;
  return <Workspace userId={user.id} email={user.email} onLogout={() => void logout()} />;
}

function Workspace({ userId, email, onLogout }: { userId: string; email: string | null; onLogout: () => void }) {
  const { courses, addCourse } = useCourses(userId);
  const { data: stats } = useCourseStats(userId);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [distraction, setDistraction] = useState<DistractionSession | null>(() => readDistractionSession());

  useEffect(() => {
    const sync = () => setDistraction(readDistractionSession());
    const onStorage = () => sync();
    window.addEventListener("storage", onStorage);
    const timer = window.setInterval(sync, 500);
    return () => { window.removeEventListener("storage", onStorage); window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!distraction?.active || !distraction.endsAt) return;
    const finish = () => {
      if (distraction.endsAt && distraction.endsAt <= Date.now()) {
        localStorage.removeItem(DISTRACTION_KEY);
        setDistraction(null);
        setSelectedCourseId(null);
      }
    };
    finish();
  }, [distraction]);

  const distractionCourse = distraction?.active
    ? courses.find((course) => course.id === distraction.courseId || course.name.trim().toLowerCase() === distraction.courseName.trim().toLowerCase()) ?? null
    : null;

  useEffect(() => {
    if (distractionCourse && selectedCourseId !== distractionCourse.id) setSelectedCourseId(distractionCourse.id);
  }, [distractionCourse, selectedCourseId]);

  useEffect(() => {
    if (!distraction?.active) return;

    // Keep browser-history navigation inside the study workspace while the session is active.
    const lockHistory = () => {
      window.history.pushState({ distractionLock: true }, "", window.location.href);
    };
    lockHistory();
    const onPopState = () => lockHistory();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [distraction?.active]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) ?? null;
  const noteCounts = stats?.counts ?? {};
  const lastEdited = stats?.lastEdited ?? {};

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#07070c]">
      <main className="liquid-stage relative flex h-full w-full overflow-hidden p-[10px]">
        <div className="liquid-orb liquid-orb-a" aria-hidden /><div className="liquid-orb liquid-orb-b" aria-hidden /><div className="liquid-orb liquid-orb-c" aria-hidden />
        <div className="relative min-h-0 w-full flex-1">
          <AnimatePresence mode="wait" initial={false}>
            {selectedCourse ? (
              <motion.div key={`course-${selectedCourse.id}`} className="absolute inset-0 p-[10px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.28, ease: "easeInOut" }}>
                <CourseNotesView
                  course={selectedCourse}
                  userId={userId}
                  email={email}
                  onLogout={distraction?.active ? () => {} : onLogout}
                  onBack={() => { if (!distraction?.active) setSelectedCourseId(null); }}
                />
              </motion.div>
            ) : (
              <motion.div key="course-grid" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.28, ease: "easeInOut" }}>
                <CourseGrid
                  courses={courses}
                  noteCounts={noteCounts}
                  lastEdited={lastEdited}
                  hiddenCourseId={null}
                  onOpenCourse={setSelectedCourseId}
                  onCreateCourse={addCourse}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      {distraction?.active && (
        <div className="pointer-events-none fixed right-5 top-5 z-[1000] rounded-2xl border border-white/15 bg-black/30 px-4 py-2 text-xs text-white/80 shadow-lg backdrop-blur-xl" aria-live="polite">
          <span className="font-semibold">Distraction Mode</span>
          <span className="mx-2 opacity-40">•</span>
          <span>{distraction.courseName}</span>
          <span className="mx-2 opacity-40">•</span>
          <span>{formatDistractionRemaining(distraction.endsAt ?? Date.now())}</span>
        </div>
      )}
    </div>
  );
}

function formatDistractionRemaining(endsAt: number) {
  const totalSeconds = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}
