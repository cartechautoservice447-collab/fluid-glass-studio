import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { CourseGrid } from "@/components/courses/CourseGrid";
import { CourseNotesView } from "@/components/courses/CourseNotesView";
import { LiquidFilters } from "@/components/liquid/LiquidFilters";
import { CustomizationProvider, useCustomization } from "@/context/CustomizationContext";
import { useCourses } from "@/hooks/useCourses";
import { getNoteCount } from "@/hooks/useNotes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Glass Courses — Liquid Glass course notes" },
      {
        name: "description",
        content:
          "Organize markdown notes by course inside a liquid-glass interface: add a course, open it, and take notes in a three-column workspace.",
      },
      { property: "og:title", content: "Glass Courses — Liquid Glass course notes" },
      {
        property: "og:description",
        content:
          "Course folders, a live note list, and a markdown editor inside a liquid-glass interface.",
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
      <CoursesShell />
    </CustomizationProvider>
  );
}

function CoursesShell() {
  const { setTheme, liquid } = useCustomization();
  const { courses, addCourse } = useCourses();
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [noteCounts, setNoteCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setTheme("dark");
  }, [setTheme]);

  useEffect(() => {
    setNoteCounts(Object.fromEntries(courses.map((c) => [c.id, getNoteCount(c.id)])));
  }, [courses]);

  const activeCourse = useMemo(
    () => courses.find((c) => c.id === activeCourseId) ?? null,
    [courses, activeCourseId],
  );

  const shellSpring = {
    type: "spring" as const,
    stiffness: liquid.bounceStiffness,
    damping: liquid.bounceDamping,
  };

  const refreshCounts = () =>
    setNoteCounts(Object.fromEntries(courses.map((c) => [c.id, getNoteCount(c.id)])));

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#07070c]">
      <main className="liquid-stage relative flex h-full w-full overflow-hidden px-5 py-5">
        <div className="liquid-orb liquid-orb-a" aria-hidden />
        <div className="liquid-orb liquid-orb-b" aria-hidden />
        <div className="liquid-orb liquid-orb-c" aria-hidden />

        <div className="relative min-h-0 w-full flex-1">
          <AnimatePresence>
            {!activeCourse ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0"
              >
                <CourseGrid
                  courses={courses}
                  noteCounts={noteCounts}
                  hiddenCourseId={activeCourseId}
                  onOpenCourse={setActiveCourseId}
                  onCreateCourse={(input) => addCourse(input)}
                />
              </motion.div>
            ) : (
              <motion.div
                key={activeCourse.id}
                layoutId={`course-shell-${activeCourse.id}`}
                transition={shellSpring}
                style={{
                  backgroundColor: "var(--water-gel-bg)",
                  backdropFilter: "blur(var(--liquid-density, 12px)) saturate(200%) contrast(105%)",
                  borderRadius: "24px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.4)",
                  boxShadow:
                    "inset 0 1px 2px 0 rgba(255, 255, 255, 0.5), inset 0 -2px 4px 0 rgba(0, 0, 0, 0.25), 0 8px 32px 0 rgba(0, 0, 0, 0.37)",
                }}
                className="liquid-panel absolute inset-0 overflow-hidden p-5"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.18, duration: 0.3 }}
                  className="flex h-full min-h-0 w-full flex-col"
                >
                  <CourseNotesView
                    course={activeCourse}
                    onBack={() => {
                      setActiveCourseId(null);
                      refreshCounts();
                    }}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
