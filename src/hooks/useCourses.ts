import { useCallback, useEffect, useState } from "react";

export const COURSE_ACCENTS = ["sky", "violet", "amber", "emerald", "rose", "cyan"] as const;
export type CourseAccent = (typeof COURSE_ACCENTS)[number];

export type Course = {
  id: string;
  name: string;
  description: string;
  color: CourseAccent;
  createdAt: number;
};

const COURSES_KEY = "liquid-courses-v1";

// Pre-migration global notes keys (from the old single-workspace Glass Notes).
const LEGACY_NOTES_KEY = "glass-notes-v1";
const LEGACY_COLLECTIONS_KEY = "glass-notes-collections-v1";
const MIGRATION_FLAG_KEY = "liquid-courses-legacy-migrated-v1";
const LEGACY_OWNER_KEY = "liquid-courses-legacy-owner-v1";

const uid = () => Math.random().toString(36).slice(2, 10);

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * One-time migration: if this browser has notes saved under the old global
 * keys (from before courses existed), move them into a new "My Notes"
 * course instead of losing them. Runs at most once ever, guarded by
 * MIGRATION_FLAG_KEY — safe to ship even after some users already have
 * courses. The original legacy keys are left in place untouched as a backup.
 */
function migrateLegacyNotesOnce(userId: string, existingCourses: Course[]): Course[] {
  try {
    const migrationKey = `${MIGRATION_FLAG_KEY}:${userId}`;
    const legacyOwner = localStorage.getItem(LEGACY_OWNER_KEY);
    if (localStorage.getItem(migrationKey) || (legacyOwner && legacyOwner !== userId)) return existingCourses;

    const legacyNotes = load<unknown[]>(LEGACY_NOTES_KEY, []);
    const legacyCollections = load<unknown[]>(LEGACY_COLLECTIONS_KEY, []);

    // Mark as handled regardless of outcome so this never re-runs.
    localStorage.setItem(migrationKey, "1");
    localStorage.setItem(LEGACY_OWNER_KEY, userId);

    const hasLegacyData =
      (Array.isArray(legacyNotes) && legacyNotes.length > 0) ||
      (Array.isArray(legacyCollections) && legacyCollections.length > 0);

    if (!hasLegacyData) return existingCourses;

    const migratedCourse: Course = {
      id: uid(),
      name: "My Notes",
      description: "Imported from your previous notes.",
      color: COURSE_ACCENTS[0],
      createdAt: Date.now(),
    };

    localStorage.setItem(`glass-notes-v1:${userId}:${migratedCourse.id}`, JSON.stringify(legacyNotes));
    localStorage.setItem(
      `glass-notes-collections-v1:${userId}:${migratedCourse.id}`,
      JSON.stringify(legacyCollections),
    );

    return [migratedCourse, ...existingCourses];
  } catch {
    return existingCourses;
  }
}

/** Course list (the folders on the home screen). Each course owns its own isolated notes store. */
export function useCourses(userId: string) {
  const coursesKey = `${COURSES_KEY}:${userId}`;
  const [courses, setCourses] = useState<Course[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = load<Course[]>(coursesKey, []);
    setCourses(migrateLegacyNotesOnce(userId, loaded));
    setHydrated(true);
  }, [coursesKey, userId]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(coursesKey, JSON.stringify(courses));
    } catch {
      /* ignore quota errors */
    }
  }, [courses, hydrated, coursesKey]);

  const addCourse = useCallback(
    (input: { name: string; description?: string; color?: CourseAccent }) => {
      const name = input.name.trim();
      if (!name) return null;
      const course: Course = {
        id: uid(),
        name,
        description: input.description?.trim() ?? "",
        color: input.color ?? COURSE_ACCENTS[0],
        createdAt: Date.now(),
      };
      setCourses((prev) => [course, ...prev]);
      return course.id;
    },
    [],
  );

  const renameCourse = useCallback(
    (id: string, patch: Partial<Omit<Course, "id" | "createdAt">>) => {
      setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    },
    [],
  );

  const deleteCourse = useCallback((id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    try {
      localStorage.removeItem(`glass-notes-v1:${userId}:${id}`);
      localStorage.removeItem(`glass-notes-collections-v1:${userId}:${id}`);
    } catch {
      /* ignore */
    }
  }, [userId]);

  return { courses, hydrated, addCourse, renameCourse, deleteCourse };
}
