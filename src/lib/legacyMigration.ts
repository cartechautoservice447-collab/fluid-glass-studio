import { newId, supabase } from "@/lib/supabaseClient";

/**
 * Imports pre-Supabase browser data into cloud storage.
 *
 * Every legacy record gets a deterministic UUID derived from the authenticated
 * user, entity type, and original legacy id. This makes the migration
 * idempotent even when an earlier attempt stopped after partially importing
 * the user's data. The completion flag is written only after every source
 * record has been processed successfully.
 */
const FLAG_KEY = "supabase-data-migrated-v3";
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
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function scoped(key: string, userId: string) {
  return `${key}:${userId}`;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/** Deterministically maps arbitrary legacy identifiers to a valid UUID. */
async function stableUuid(namespace: string): Promise<string> {
  const bytes = new TextEncoder().encode(namespace);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const value = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${(parseInt(hex.slice(16, 18), 16) & 0x3f | 0x80).toString(16).padStart(2, "0")}${hex.slice(18, 20)}-${hex.slice(20, 32)}`;
  return value;
}

async function deterministicId(userId: string, kind: string, legacyId: string) {
  return stableUuid(`${userId}:${kind}:${legacyId}`);
}

async function ensureCourse(userId: string, legacy: LegacyCourse) {
  const id = await deterministicId(userId, "course", legacy.id);
  const { data: existing, error: lookupError } = await supabase
    .from("courses")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return id;

  const { error } = await supabase.from("courses").insert({
    id,
    user_id: userId,
    name: legacy.name?.trim() || "Untitled course",
    description: legacy.description?.trim() ?? "",
    color: legacy.color ?? "sky",
    ...(legacy.createdAt ? { created_at: new Date(legacy.createdAt).toISOString() } : {}),
  });
  if (error) {
    // A concurrent retry may have inserted the same deterministic row. Verify
    // by id before treating the write as a real failure.
    const { data: raced, error: raceLookupError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (raceLookupError) throw raceLookupError;
    if (!raced) throw error;
  }
  return id;
}

async function ensureCollection(userId: string, courseId: string, legacy: LegacyCollection) {
  const id = await deterministicId(userId, "collection", legacy.id);
  const { data: existing, error: lookupError } = await supabase
    .from("collections")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return id;

  const { error } = await supabase.from("collections").insert({
    id,
    user_id: userId,
    course_id: courseId,
    name: legacy.name.trim(),
  });
  if (error) {
    const { data: raced, error: raceLookupError } = await supabase
      .from("collections")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (raceLookupError) throw raceLookupError;
    if (!raced) throw error;
  }
  return id;
}

async function ensureNote(userId: string, courseId: string, collectionId: string | null, legacy: LegacyNote) {
  const id = await deterministicId(userId, "note", legacy.id);
  const sourceId = isUuid(legacy.id) ? legacy.id : null;
  const { data: existing, error: lookupError } = await supabase
    .from("notes")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return;

  const { error } = await supabase.from("notes").insert({
    id,
    user_id: userId,
    course_id: courseId,
    collection_id: collectionId,
    title: legacy.title ?? "Untitled note",
    body: legacy.body ?? "",
    favorite: Boolean(legacy.favorite),
    updated_at: new Date(legacy.updatedAt ?? Date.now()).toISOString(),
    source_id: sourceId,
  });
  if (error) {
    const { data: raced, error: raceLookupError } = await supabase
      .from("notes")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (raceLookupError) throw raceLookupError;
    if (!raced) throw error;
  }
}

export async function runLegacyMigrationOnce(userId: string): Promise<boolean> {
  if (typeof window === "undefined" || !userId) return false;

  const flag = scoped(FLAG_KEY, userId);
  try {
    if (localStorage.getItem(flag)) return false;
  } catch {
    return false;
  }

  try {
    let changed = false;
    const legacyCourses = read<LegacyCourse[]>(scoped(COURSES_KEY, userId), []);
    const courses = Array.isArray(legacyCourses) ? legacyCourses : [];

    // Process every legacy course independently. Never use the total cloud
    // course count as a completion condition, because that makes partial
    // migrations impossible to resume.
    for (const legacyCourse of courses) {
      if (!legacyCourse || typeof legacyCourse.id !== "string") continue;

      const courseId = await ensureCourse(userId, legacyCourse);
      const legacyCollections = read<LegacyCollection[]>(
        `${scoped(COLLECTIONS_KEY, userId)}:${legacyCourse.id}`,
        [],
      );
      const collections = Array.isArray(legacyCollections) ? legacyCollections : [];
      const collectionIdMap = new Map<string, string>();

      for (const legacyCollection of collections) {
        if (!legacyCollection || typeof legacyCollection.id !== "string" || typeof legacyCollection.name !== "string") continue;
        const collectionId = await ensureCollection(userId, courseId, legacyCollection);
        collectionIdMap.set(legacyCollection.id, collectionId);
        changed = true;
      }

      const legacyNotes = read<LegacyNote[]>(
        `${scoped(NOTES_KEY, userId)}:${legacyCourse.id}`,
        [],
      );
      const notes = Array.isArray(legacyNotes) ? legacyNotes : [];
      for (const legacyNote of notes) {
        if (!legacyNote || typeof legacyNote.id !== "string") continue;
        const collectionId = legacyNote.collectionId
          ? collectionIdMap.get(legacyNote.collectionId) ?? null
          : null;
        await ensureNote(userId, courseId, collectionId, legacyNote);
        changed = true;
      }
      changed = true;
    }

    // Preserve support for the very old global notes store. Only use it when
    // the account has no legacy per-user courses, so its records are not
    // attached to an arbitrary existing cloud course.
    if (courses.length === 0) {
      const { count, error: countError } = await supabase
        .from("courses")
        .select("id", { count: "exact", head: true });
      if (countError) throw countError;

      const globalNotes = read<LegacyNote[]>(NOTES_KEY, []);
      const globalCollections = read<LegacyCollection[]>(COLLECTIONS_KEY, []);
      if (!count && (globalNotes.length || globalCollections.length)) {
        const courseId = await ensureCourse(userId, {
          id: "legacy-global-notes",
          name: "My Notes",
          description: "Imported from your previous notes.",
          color: "sky",
        });
        const collectionIdMap = new Map<string, string>();
        for (const legacyCollection of globalCollections) {
          if (!legacyCollection || typeof legacyCollection.id !== "string" || typeof legacyCollection.name !== "string") continue;
          collectionIdMap.set(
            legacyCollection.id,
            await ensureCollection(userId, courseId, legacyCollection),
          );
        }
        for (const legacyNote of globalNotes) {
          if (!legacyNote || typeof legacyNote.id !== "string") continue;
          await ensureNote(
            userId,
            courseId,
            legacyNote.collectionId ? collectionIdMap.get(legacyNote.collectionId) ?? null : null,
            legacyNote,
          );
        }
        changed = true;
      }
    }

    const engine = read<Record<string, number> | null>(
      scoped(ENGINE_KEY, userId),
      read<Record<string, number> | null>(ENGINE_KEY, null),
    );
    const theme = localStorage.getItem(scoped(THEME_KEY, userId)) ?? localStorage.getItem(THEME_KEY);
    const displayName =
      localStorage.getItem(scoped(DISPLAY_NAME_KEY, userId)) ??
      localStorage.getItem(DISPLAY_NAME_KEY);

    const { data: profile, error: profileReadError } = await supabase
      .from("profiles")
      .select("id,theme,display_name,liquid_density,liquid_transparency,liquid_clearness,liquid_gel,liquid_bounce_stiffness,liquid_bounce_damping")
      .eq("id", userId)
      .maybeSingle();
    if (profileReadError) throw profileReadError;

    const patch: Record<string, unknown> = {};
    if (engine) {
      const settings = {
        liquid_density: engine.density,
        liquid_transparency: engine.transparency,
        liquid_clearness: engine.clearness,
        liquid_gel: engine.gel,
        liquid_bounce_stiffness: engine.bounceStiffness,
        liquid_bounce_damping: engine.bounceDamping,
      };
      for (const [key, value] of Object.entries(settings)) {
        if (typeof value === "number" && Number.isFinite(value)) patch[key] = value;
      }
    }
    if ((theme === "light" || theme === "dark") && !profile?.theme) patch.theme = theme;
    if (displayName && !profile?.display_name) patch.display_name = displayName;

    if (Object.keys(patch).length > 0) {
      const { error: profileError } = await supabase.from("profiles").upsert({ id: userId, ...patch });
      if (profileError) throw profileError;
      changed = true;
    }

    // Only this final step marks completion. Any error above leaves the flag
    // unset, so the next authenticated load resumes safely from the same IDs.
    localStorage.setItem(flag, "1");
    return changed;
  } catch {
    return false;
  }
}
