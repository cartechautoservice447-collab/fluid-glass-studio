import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { newId, supabase } from "@/lib/supabaseClient";

export type Note = {
  id: string;
  title: string;
  body: string;
  favorite: boolean;
  collectionId: string | null;
  sourceId: string | null;
  createdAt: number;
  updatedAt: number;
};

export type Collection = { id: string; name: string };

export type Filter = { kind: "all" } | { kind: "favorites" } | { kind: "collection"; id: string };

type NoteRow = {
  id: string;
  title: string | null;
  body: string | null;
  favorite: boolean | null;
  collection_id: string | null;
  source_id: string | null;
  created_at: string;
  updated_at: string;
};

type CollectionRow = { id: string; name: string };
type NotesScope = "editor" | "study-hub";

type NoteWritePayload = {
  op: "insert" | "update" | "delete";
  id: string;
  ids?: string[];
  values?: Record<string, unknown>;
  rollback?: () => void;
};

const EMPTY_NOTES: Note[] = [];
const EMPTY_COLLECTIONS: Collection[] = [];

function toNote(row: NoteRow): Note {
  const createdAt = new Date(row.created_at).getTime();
  const updatedAt = new Date(row.updated_at).getTime();
  return {
    id: row.id,
    title: row.title ?? "Untitled note",
    body: row.body ?? "",
    favorite: Boolean(row.favorite),
    collectionId: row.collection_id,
    sourceId: row.source_id,
    createdAt: Number.isFinite(createdAt) ? createdAt : updatedAt,
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : createdAt,
  };
}

function dedupeNotes(items: Note[]): Note[] {
  const byId = new Map<string, Note>();
  for (const note of items) {
    const existing = byId.get(note.id);
    if (!existing || note.updatedAt >= existing.updatedAt) byId.set(note.id, note);
  }
  return Array.from(byId.values());
}

function normalizeTitle(value: string) {
  return value.trim() || "Untitled note";
}

export function relativeDate(ts: number) {
  const diff = Date.now() - ts;
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

/** Notes + collections for one course, stored in Supabase (RLS-scoped to the user). */
export function useNotes(courseId?: string, userId?: string, scope: NotesScope = "editor") {
  const queryClient = useQueryClient();
  const enabled = Boolean(courseId && userId);

  // Keep the Study Hub and original editor caches separate. They still read/write
  // the same Supabase records, but UI-specific state can never leak between modes.
  const notesKey = useMemo(() => ["notes", userId ?? null, courseId ?? null, scope], [userId, courseId, scope]);
  const collectionsKey = useMemo(
    () => ["collections", userId ?? null, courseId ?? null, scope],
    [userId, courseId, scope],
  );

  const notesQuery = useQuery({
    queryKey: notesKey,
    enabled,
    queryFn: async (): Promise<Note[]> => {
      const { data, error } = await supabase
        .from("notes")
        .select("id, title, body, favorite, collection_id, source_id, created_at, updated_at")
        .eq("course_id", courseId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return dedupeNotes(((data ?? []) as NoteRow[]).map(toNote));
    },
  });

  const collectionsQuery = useQuery({
    queryKey: collectionsKey,
    enabled,
    queryFn: async (): Promise<Collection[]> => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, name")
        .eq("course_id", courseId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as CollectionRow[]).map((c) => ({ id: c.id, name: c.name }));
    },
  });

  const notes = notesQuery.data ?? EMPTY_NOTES;
  const collections = collectionsQuery.data ?? EMPTY_COLLECTIONS;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const [query, setQuery] = useState("");

  useEffect(() => {
    setSelectedId(null);
    setFilter({ kind: "all" });
    setQuery("");
  }, [courseId, userId, scope]);

  useEffect(() => {
    if (notes.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (!selectedId || !notes.some((n) => n.id === selectedId)) {
      setSelectedId(notes[0]!.id);
    }
  }, [notes, selectedId]);

  const patchNotesCache = useCallback(
    (updater: (prev: Note[]) => Note[]) => {
      queryClient.setQueryData<Note[]>(notesKey, (prev) => dedupeNotes(updater(dedupeNotes(prev ?? []))));
    },
    [queryClient, notesKey],
  );

  const patchCollectionsCache = useCallback(
    (updater: (prev: Collection[]) => Collection[]) => {
      queryClient.setQueryData<Collection[]>(collectionsKey, (prev) => updater(prev ?? []));
    },
    [queryClient, collectionsKey],
  );

  const invalidateNotes = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: notesKey });
    void queryClient.invalidateQueries({ queryKey: ["course-stats", userId ?? null] });
  }, [queryClient, notesKey, userId]);

  const invalidateCollections = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: collectionsKey });
  }, [queryClient, collectionsKey]);

  const writeNote = useMutation({
    mutationFn: async (payload: NoteWritePayload) => {
      if (payload.op === "insert") {
        const { error } = await supabase.from("notes").insert({
          id: payload.id,
          user_id: userId!,
          course_id: courseId!,
          ...payload.values,
        });
        if (error) throw error;
        return;
      }
      if (payload.op === "update") {
        const { error } = await supabase
          .from("notes")
          .update({ ...payload.values, updated_at: new Date().toISOString() })
          .eq("id", payload.id)
          .eq("course_id", courseId!);
        if (error) throw error;
        return;
      }
      const ids = payload.ids?.length ? payload.ids : [payload.id];
      const { error } = await supabase
        .from("notes")
        .delete()
        .in("id", ids)
        .eq("course_id", courseId!);
      if (error) throw error;
    },
    onError: (_error, payload) => {
      // Never leave a failed optimistic write visible as if it were saved.
      payload.rollback?.();
      invalidateNotes();
    },
    onSuccess: invalidateNotes,
  });

  const writeCollection = useMutation({
    mutationFn: async (payload: {
      op: "insert" | "update" | "delete";
      id: string;
      values?: Record<string, unknown>;
    }) => {
      if (payload.op === "insert") {
        const { error } = await supabase.from("collections").insert({
          id: payload.id,
          user_id: userId!,
          course_id: courseId!,
          ...payload.values,
        } as never);
        if (error) throw error;
        return;
      }
      if (payload.op === "update") {
        const { error } = await supabase
          .from("collections")
          .update({ ...payload.values, updated_at: new Date().toISOString() })
          .eq("id", payload.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("collections").delete().eq("id", payload.id);
      if (error) throw error;
    },
    onSettled: () => {
      invalidateCollections();
      invalidateNotes();
    },
  });

  const createNote = useCallback(
    (initial?: {
      sourceId?: string | null;
      title?: string;
      body?: string;
      favorite?: boolean;
      collectionId?: string | null;
    }) => {
      if (!enabled) return "";

      const collectionId = initial?.collectionId ?? (filter.kind === "collection" ? filter.id : null);
      const title = normalizeTitle(initial?.title ?? "Untitled note");
      const body = initial?.body ?? "";
      const favorite = initial?.favorite ?? false;
      const sourceId = initial?.sourceId ?? null;
      const currentNotes = dedupeNotes(queryClient.getQueryData<Note[]>(notesKey) ?? notes);

      // Restore/import replay protection uses the original note id, not content.
      if (sourceId) {
        const existingBySource = currentNotes.find((note) => note.sourceId === sourceId || note.id === sourceId);
        if (existingBySource) {
          setSelectedId(existingBySource.id);
          return existingBySource.id;
        }
      }

      // Only blank placeholder creation is deduplicated by content. Identical
      // non-empty notes are legitimate and must remain independently creatable.
      if (!sourceId && title === "Untitled note" && body === "" && !favorite) {
        const existingBlank = currentNotes.find(
          (note) =>
            normalizeTitle(note.title) === "Untitled note" &&
            note.body === "" &&
            note.favorite === false &&
            note.collectionId === collectionId,
        );
        if (existingBlank) {
          setSelectedId(existingBlank.id);
          return existingBlank.id;
        }
      }

      const now = Date.now();
      const note: Note = {
        id: newId(),
        title,
        body,
        favorite,
        collectionId,
        sourceId,
        createdAt: now,
        updatedAt: now,
      };
      const previous = currentNotes;
      patchNotesCache((prev) => [note, ...prev]);
      setSelectedId(note.id);
      writeNote.mutate({
        op: "insert",
        id: note.id,
        values: {
          title: note.title,
          body: note.body,
          favorite: note.favorite,
          collection_id: note.collectionId,
          source_id: note.sourceId,
        },
        rollback: () => queryClient.setQueryData<Note[]>(notesKey, previous),
      });
      return note.id;
    },
    [enabled, filter, notes, notesKey, patchNotesCache, queryClient, writeNote],
  );

  const updateNote = useCallback(
    (id: string, patch: Partial<Omit<Note, "id">>) => {
      const previous = dedupeNotes(queryClient.getQueryData<Note[]>(notesKey) ?? notes);
      patchNotesCache((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)),
      );
      const values: Record<string, unknown> = {};
      if (patch.title !== undefined) values["title"] = patch.title;
      if (patch.body !== undefined) values["body"] = patch.body;
      if (patch.favorite !== undefined) values["favorite"] = patch.favorite;
      if (patch.collectionId !== undefined) values["collection_id"] = patch.collectionId;
      if (patch.sourceId !== undefined) values["source_id"] = patch.sourceId;
      if (Object.keys(values).length === 0) return;
      writeNote.mutate({
        op: "update",
        id,
        values,
        rollback: () => queryClient.setQueryData<Note[]>(notesKey, previous),
      });
    },
    [notes, notesKey, patchNotesCache, queryClient, writeNote],
  );

  const deleteNote = useCallback(
    (id: string) => {
      const currentNotes = dedupeNotes(queryClient.getQueryData<Note[]>(notesKey) ?? notes);
      const target = currentNotes.find((note) => note.id === id);
      if (!target) return;

      // Delete means delete exactly the selected record. Never delete other notes
      // merely because their text happens to match.
      const previous = currentNotes;
      patchNotesCache((prev) => prev.filter((note) => note.id !== id));
      setSelectedId((cur) => (cur === id ? null : cur));
      writeNote.mutate({
        op: "delete",
        id,
        rollback: () => queryClient.setQueryData<Note[]>(notesKey, previous),
      });
    },
    [notes, notesKey, patchNotesCache, queryClient, writeNote],
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      const currentNotes = dedupeNotes(queryClient.getQueryData<Note[]>(notesKey) ?? notes);
      const current = currentNotes.find((n) => n.id === id);
      if (!current) return;
      const previous = currentNotes;
      const next = !current.favorite;
      patchNotesCache((prev) => prev.map((n) => (n.id === id ? { ...n, favorite: next, updatedAt: Date.now() } : n)));
      writeNote.mutate({
        op: "update",
        id,
        values: { favorite: next },
        rollback: () => queryClient.setQueryData<Note[]>(notesKey, previous),
      });
    },
    [notes, notesKey, patchNotesCache, queryClient, writeNote],
  );

  const addCollection = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed || !enabled) return;
      const id = newId();
      patchCollectionsCache((prev) => [...prev, { id, name: trimmed }]);
      writeCollection.mutate({ op: "insert", id, values: { name: trimmed } });
    },
    [enabled, patchCollectionsCache, writeCollection],
  );

  const renameCollection = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      patchCollectionsCache((prev) => prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c)));
      writeCollection.mutate({ op: "update", id, values: { name: trimmed } });
    },
    [patchCollectionsCache, writeCollection],
  );

  const deleteCollection = useCallback(
    (id: string) => {
      patchCollectionsCache((prev) => prev.filter((c) => c.id !== id));
      patchNotesCache((prev) =>
        prev.map((n) => (n.collectionId === id ? { ...n, collectionId: null } : n)),
      );
      setFilter((f) => (f.kind === "collection" && f.id === id ? { kind: "all" } : f));
      writeCollection.mutate({ op: "delete", id });
    },
    [patchCollectionsCache, patchNotesCache, writeCollection],
  );

  const visibleNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dedupeNotes(notes)
      .filter((n) => {
        if (filter.kind === "favorites" && !n.favorite) return false;
        if (filter.kind === "collection" && n.collectionId !== filter.id) return false;
        if (!q) return true;
        return n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q);
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [notes, filter, query]);

  const counts = useMemo(
    () => ({
      all: dedupeNotes(notes).length,
      favorites: dedupeNotes(notes).filter((n) => n.favorite).length,
      byCollection: Object.fromEntries(
        collections.map((c) => [c.id, dedupeNotes(notes).filter((n) => n.collectionId === c.id).length]),
      ) as Record<string, number>,
    }),
    [notes, collections],
  );

  const selected = dedupeNotes(notes).find((n) => n.id === selectedId) ?? null;

  return {
    notes: dedupeNotes(notes),
    visibleNotes,
    collections,
    counts,
    selected,
    selectedId,
    setSelectedId,
    filter,
    setFilter,
    query,
    setQuery,
    createNote,
    updateNote,
    deleteNote,
    toggleFavorite,
    addCollection,
    renameCollection,
    deleteCollection,
    loading: notesQuery.isLoading || collectionsQuery.isLoading,
  };
}
