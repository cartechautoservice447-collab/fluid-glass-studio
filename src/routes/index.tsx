import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { AuthPage } from "@/components/auth/AuthPage";
import { CourseGrid } from "@/components/courses/CourseGrid";
import { CourseNotesView } from "@/components/courses/CourseNotesView";
import { LiquidFilters } from "@/components/liquid/LiquidFilters";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CustomizationProvider } from "@/context/CustomizationContext";
import { useCourses, useCourseStats } from "@/hooks/useCourses";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Glass Notes — Liquid Glass course workspaces" },
      {
        name: "description",
        content:
          "Course folders open into an isolated Liquid Glass notes workspace: sidebar with engine settings, a live note list, and a markdown editor with autosave.",
      },
      { property: "og:title", content: "Glass Notes — Liquid Glass course workspaces" },
      {
        property: "og:description",
        content: "Pick a course folder, then take notes inside a liquid-glass three-column workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AuthProvider>
      <CustomizationProvider>
        <LiquidFilters />
        <AuthenticatedWorkspace />
      </CustomizationProvider>
    </AuthProvider>
  );
}

function AuthenticatedWorkspace() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#07070c] text-sm text-slate-300">Loading your workspace…</div>;
  }

  if (!user) return <AuthPage />;

  return <Workspace userId={user.id} email={user.email} onLogout={() => void logout()} />;
}

function Workspace({ userId, email, onLogout }: { userId: string; email: string | null; onLogout: () => void }) {
  const { courses, addCourse } = useCourses(userId);
  const { data: stats } = useCourseStats(userId);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) ?? null;
  const noteCounts = stats?.counts ?? {};
  const lastEdited = stats?.lastEdited ?? {};

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#07070c]">
      <main className="liquid-stage relative flex h-full w-full overflow-hidden px-5 pb-4 pt-3">
        <div className="liquid-orb liquid-orb-a" aria-hidden />
        <div className="liquid-orb liquid-orb-b" aria-hidden />
        <div className="liquid-orb liquid-orb-c" aria-hidden />

        <div className="relative min-h-0 w-full flex-1">
          <AnimatePresence mode="wait" initial={false}>
            {selectedCourse ? (
              <motion.div
                key={`course-${selectedCourse.id}`}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
              >
                <CourseNotesView
                  course={selectedCourse}
                  userId={userId}
                  email={email}
                  onLogout={onLogout}
                  onBack={() => setSelectedCourseId(null)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="course-grid"
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
              >
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
    </div>
  );
}
