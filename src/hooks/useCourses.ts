import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { runLegacyMigrationOnce } from "@/lib/legacyMigration";
import { newId, supabase } from "@/lib/supabaseClient";

export const COURSE_ACCENTS = ["sky", "violet", "amber", "emerald", "rose", "cyan"] as const;
export type CourseAccent = (typeof COURSE_ACCENTS)[number];

export type Course = {
  id: string;
  name: string;
  description: string;
  color: CourseAccent;
  createdAt: number;
};

type CourseRow = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  created_at: string;
};

const EMPTY: Course[] = [];

function toCourse(row: CourseRow): Course {
  const color = (COURSE_ACCENTS as readonly string[]).includes(row.color ?? "")
    ? (row.color as CourseAccent)
    : COURSE_ACCENTS[0];
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    color,
    createdAt: new Date(row.created_at).getTime(),
  };
}

/** Course list (folders on the home screen), stored in Supabase and scoped by RLS. */
export function useCourses(userId: string) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["courses", userId], [userId]);
  const [migrated, setMigrated] = useState(false);

  // One-time move of any legacy localStorage data into Supabase.
  useEffect(() => {
    let cancelled = false;
    if (!userId) return;
    void runLegacyMigrationOnce(userId)
      .then((didImport) => {
        if (cancelled) return;
        if (didImport) void queryClient.invalidateQueries();
      })
      .finally(() => {
        if (!cancelled) setMigrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, queryClient]);

  const coursesQuery = useQuery({
    queryKey,
    enabled: Boolean(userId) && migrated,
    queryFn: async (): Promise<Course[]> => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, name, description, color, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as CourseRow[]).map(toCourse);
    },
  });

  const courses = coursesQuery.data ?? EMPTY;

  const patchCache = useCallback(
    (updater: (prev: Course[]) => Course[]) => {
      queryClient.setQueryData<Course[]>(queryKey, (prev) => updater(prev ?? []));
    },
    [queryClient, queryKey],
  );

  const write = useMutation({
    mutationFn: async (payload: {
      op: "insert" | "update" | "delete";
      id: string;
      values?: Record<string, unknown>;
    }) => {
      if (payload.op === "insert") {
        const { error } = await supabase
          .from("courses")
          .insert({ id: payload.id, user_id: userId, ...payload.values } as never);
        if (error) throw error;
        return;
      }
      if (payload.op === "update") {
        const { error } = await supabase
          .from("courses")
          .update({ ...payload.values, updated_at: new Date().toISOString() })
          .eq("id", payload.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("courses").delete().eq("id", payload.id);
      if (error) throw error;
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: ["course-stats", userId] });
    },
  });

  const addCourse = useCallback(
    (input: { name: string; description?: string; color?: CourseAccent }) => {
      const name = input.name.trim();
      if (!name || !userId) return null;
      const course: Course = {
        id: newId(),
        name,
        description: input.description?.trim() ?? "",
        color: input.color ?? COURSE_ACCENTS[0],
        createdAt: Date.now(),
      };
      patchCache((prev) => [course, ...prev]);
      write.mutate({
        op: "insert",
        id: course.id,
        values: { name: course.name, description: course.description, color: course.color },
      });
      return course.id;
    },
    [userId, patchCache, write],
  );

  const renameCourse = useCallback(
    (id: string, patch: Partial<Omit<Course, "id" | "createdAt">>) => {
      patchCache((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      const values: Record<string, unknown> = {};
      if (patch.name !== undefined) values["name"] = patch.name;
      if (patch.description !== undefined) values["description"] = patch.description;
      if (patch.color !== undefined) values["color"] = patch.color;
      if (Object.keys(values).length === 0) return;
      write.mutate({ op: "update", id, values });
    },
    [patchCache, write],
  );

  const deleteCourse = useCallback(
    (id: string) => {
      patchCache((prev) => prev.filter((c) => c.id !== id));
      write.mutate({ op: "delete", id });
    },
    [patchCache, write],
  );

  return {
    courses,
    hydrated: migrated && !coursesQuery.isLoading,
    addCourse,
    renameCourse,
    deleteCourse,
  };
}

/** Note count + last-edited timestamp per course, for the course grid. */
export function useCourseStats(userId: string) {
  return useQuery({
    queryKey: ["course-stats", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from("notes").select("course_id, updated_at");
      if (error) throw error;
      const counts: Record<string, number> = {};
      const lastEdited: Record<string, number | null> = {};
      for (const row of (data ?? []) as { course_id: string; updated_at: string }[]) {
        const ts = new Date(row.updated_at).getTime();
        counts[row.course_id] = (counts[row.course_id] ?? 0) + 1;
        lastEdited[row.course_id] = Math.max(lastEdited[row.course_id] ?? 0, ts);
      }
      return { counts, lastEdited };
    },
  });
}
