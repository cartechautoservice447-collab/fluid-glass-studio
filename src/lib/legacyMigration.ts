import { newId, supabase } from "@/lib/supabaseClient";

/**
 * One-time import of pre-Supabase localStorage data into the database.
 *
 * Runs at most once per user (guarded by a localStorage flag) and only when the
 * user's Supabase rows are still empty. Legacy localStorage entries are left in
 * place as a backup — nothing is deleted.
 */
const FLAG_KEY = "supabase-data-migrated-v1";

const COURSES_KEY = "liquid-courses-v1";
const NOTES_KEY = "glass-notes-v1";
const COLLECTIONS_KEY = "glass-notes-collections-v1";
const ENGINE_KEY = "liquid-glass-engine-v1";
const THEME_KEY = "liquid-glass-theme-v1";
const DISPLAY_NAME_KEY = "liquid-glass-display-name-v1";

type LegacyCourse = { id: string; name: string; description?: string; color?: string; createdAt?: number };
type LegacyNote = {
  id: string;
  title?: string;
  body?: string;
  favorite?: boolean;
  collectionId?: string | null;
  updatedAt?: number;
};
type LegacyCollection = { id: string; name: string };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function runLegacyMigrationOnce(userId: string): Promise<boolean> {
  if (typeof window === "undefined" || !userId) return false;
  const flag = `${FLAG_KEY}:${userId}`;
  try {
    if (localStorage.getItem(flag)) return false;
  } catch {
    return false;
  }

  try {
    const { count, error } = await supabase
      .from("courses")
      .select("id", { count: "exact", head: true });
    if (error) throw error;

    let imported = false;

    if (!count) {
      const legacyCourses = read<LegacyCourse[]>(`${COURSES_KEY}:${userId}`, []);
      const courses: LegacyCourse[] = Array.isArray(legacyCourses) ? legacyCourses : [];

      // Sources of notes: per-course scoped keys, plus the very old global keys.
      const buckets: {
        course: { name: string; description: string; color: string; createdAt?: number };
        notes: LegacyNote[];
        collections: LegacyCollection[];
      }[] = [];

      for (const course of courses) {
        buckets.push({
          course: {
            name: course.name ?? "Untitled course",
            description: course.description ?? "",
            color: course.color ?? "sky",
            ...(course.createdAt ? { createdAt: course.createdAt } : {}),
          },
          notes: read<LegacyNote[]>(`${NOTES_KEY}:${userId}:${course.id}`, []),
          collections: read<LegacyCollection[]>(`${COLLECTIONS_KEY}:${userId}:${course.id}`, []),
        });
      }

      if (courses.length === 0) {
        const globalNotes = read<LegacyNote[]>(NOTES_KEY, []);
        const globalCollections = read<LegacyCollection[]>(COLLECTIONS_KEY, []);
        if (
          (Array.isArray(globalNotes) && globalNotes.length > 0) ||
          (Array.isArray(globalCollections) && globalCollections.length > 0)
        ) {
          buckets.push({
            course: {
              name: "My Notes",
              description: "Imported from your previous notes.",
              color: "sky",
            },
            notes: globalNotes,
            collections: globalCollections,
          });
        }
      }

      for (const bucket of buckets) {
        const courseId = newId();
        const { error: courseError } = await supabase.from("courses").insert({
          id: courseId,
          user_id: userId,
          name: bucket.course.name,
          description: bucket.course.description,
          color: bucket.course.color,
          ...(bucket.course.createdAt
            ? { created_at: new Date(bucket.course.createdAt).toISOString() }
            : {}),
        });
        if (courseError) throw courseError;
        imported = true;

        const collectionIdMap = new Map<string, string>();
        const collectionRows = (Array.isArray(bucket.collections) ? bucket.collections : [])
          .filter((c) => c && typeof c.name === "string")
          .map((c) => {
            const id = newId();
            collectionIdMap.set(c.id, id);
            return { id, user_id: userId, course_id: courseId, name: c.name };
          });
        if (collectionRows.length > 0) {
          const { error: colError } = await supabase.from("collections").insert(collectionRows);
          if (colError) throw colError;
        }

        const noteRows = (Array.isArray(bucket.notes) ? bucket.notes : []).map((n) => ({
          id: newId(),
          user_id: userId,
          course_id: courseId,
          collection_id: n.collectionId ? (collectionIdMap.get(n.collectionId) ?? null) : null,
          title: n.title ?? "Untitled note",
          body: n.body ?? "",
          favorite: Boolean(n.favorite),
          updated_at: new Date(n.updatedAt ?? Date.now()).toISOString(),
        }));
        if (noteRows.length > 0) {
          const { error: noteError } = await supabase.from("notes").insert(noteRows);
          if (noteError) throw noteError;
        }
      }
    }

    // Settings + theme + display name.
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, theme, display_name")
      .eq("id", userId)
      .maybeSingle();

    const engine = read<Record<string, number> | null>(ENGINE_KEY, null);
    const theme = localStorage.getItem(THEME_KEY);
    const displayName = localStorage.getItem(DISPLAY_NAME_KEY);
    const settingsPatch: Record<string, unknown> = {};

    if (engine && typeof engine === "object") {
      if (typeof engine["density"] === "number") settingsPatch["liquid_density"] = engine["density"];
      if (typeof engine["transparency"] === "number")
        settingsPatch["liquid_transparency"] = engine["transparency"];
      if (typeof engine["clearness"] === "number")
        settingsPatch["liquid_clearness"] = engine["clearness"];
      if (typeof engine["gel"] === "number") settingsPatch["liquid_gel"] = engine["gel"];
      if (typeof engine["bounceStiffness"] === "number")
        settingsPatch["liquid_bounce_stiffness"] = engine["bounceStiffness"];
      if (typeof engine["bounceDamping"] === "number")
        settingsPatch["liquid_bounce_damping"] = engine["bounceDamping"];
    }
    if (theme === "light" || theme === "dark") settingsPatch["theme"] = theme;
    if (displayName && !(profile as { display_name?: string } | null)?.display_name) {
      settingsPatch["display_name"] = displayName;
    }

    if (Object.keys(settingsPatch).length > 0) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({ id: userId, ...settingsPatch });
      if (profileError) throw profileError;
      imported = true;
    }

    localStorage.setItem(flag, "1");
    return imported;
  } catch {
    // Leave the flag unset so the import can be retried on the next load.
    return false;
  }
}
