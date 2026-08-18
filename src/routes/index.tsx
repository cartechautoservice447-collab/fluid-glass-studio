import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { CourseGrid } from "@/components/courses/CourseGrid";
import { CourseNotesView } from "@/components/courses/CourseNotesView";
import { LiquidFilters } from "@/components/liquid/LiquidFilters";
import { CustomizationProvider, useCustomization } from "@/context/CustomizationContext";
import { useCourses } from "@/hooks/useCourses";
import type { Note } from "@/hooks/useNotes";

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
    <CustomizationProvider>
      <LiquidFilters />
      <Workspace />
    </CustomizationProvider>
  );
}

function readCourseNotes(courseId: string): Note[] {
  try {
    const raw = localStorage.getItem(`glass-notes-v1:${courseId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Note[]) : [];
  } catch {
    return [];
  }
}

function Workspace() {
  const { setTheme } = useCustomization();
  const { courses, addCourse } = useCourses();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  useEffect(() => {
    setTheme("dark");
  }, [setTheme]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) ?? null;

  // Recomputed whenever we land back on the grid, so counts reflect any
  // notes just added/removed inside a course.
  const { noteCounts, lastEdited } = useMemo(() => {
    const counts: Record<string, number> = {};
    const last: Record<string, number | null> = {};
    for (const course of courses) {
      const courseNotes = readCourseNotes(course.id);
      counts[course.id] = courseNotes.length;
      last[course.id] =
        courseNotes.length > 0 ? Math.max(...courseNotes.map((n) => n.updatedAt)) : null;
    }
    return { noteCounts: counts, lastEdited: last };
  }, [courses, selectedCourseId]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#07070c]">
      <main className="liquid-stage relative flex h-full w-full overflow-hidden px-5 py-5">
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
                <CourseNotesView course={selectedCourse} onBack={() => setSelectedCourseId(null)} />
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
