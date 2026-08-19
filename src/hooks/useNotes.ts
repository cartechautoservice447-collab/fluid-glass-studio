import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { newId, supabase } from "@/lib/supabaseClient";

export type Note = {
  id: string;
  title: string;
  body: string;
  favorite: boolean;
  collectionId: string | null;
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
  updated_at: string;
};

type CollectionRow = { id: string; name: string };

const EMPTY_NOTES: Note[] = [];
const EMPTY_COLLECTIONS: Collection[] = [];

function toNote(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title ?? "Untitled note",
    body: row.body ?? "",
    favorite: Boolean(row.favorite),
    collectionId: row.collection_id,
    updatedAt: new Date(row.updated_at).getTime(),
  };
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
export function useNotes(courseId?: string, userId?: string) {
  const queryClient = useQueryClient();
  const enabled = Boolean(courseId && userId);

  const notesKey = useMemo(() => ["notes", userId ?? null, courseId ?? null], [userId, courseId]);
  const collectionsKey = useMemo(
    () => ["collections", userId ?? null, courseId ?? null],
    [userId, courseId],
  );

  const notesQuery = useQuery({
    queryKey: notesKey,
    enabled,
    queryFn: async (): Promise<Note[]> => {
      const { data, error } = await supabase
        .from("notes")
        .select("id, title, body, favorite, collection_id, updated_at")
        .eq("course_id", courseId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as NoteRow[]).map(toNote);
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

  // Reset view state when switching course/user.
  useEffect(() => {
    setSelectedId(null);
    setFilter({ kind: "all" });
    setQuery("");
  }, [courseId, userId]);

  // Keep a sane selection once notes arrive.
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
      queryClient.setQueryData<Note[]>(notesKey, (prev) => updater(prev ?? []));
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
    mutationFn: async (payload: {
      op: "insert" | "update" | "delete";
      id: string;
      values?: Record<string, unknown>;
    }) => {
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
          .eq("id", payload.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("notes").delete().eq("id", payload.id);
      if (error) throw error;
    },
    onSettled: invalidateNotes,
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
        });
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

  const createNote = useCallback(() => {
    if (!enabled) return "";
    const note: Note = {
      id: newId(),
      title: "Untitled note",
      body: "",
      favorite: false,
      collectionId: filter.kind === "collection" ? filter.id : null,
      updatedAt: Date.now(),
    };
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
      },
    });
    return note.id;
  }, [enabled, filter, patchNotesCache, writeNote]);

  const updateNote = useCallback(
    (id: string, patch: Partial<Omit<Note, "id">>) => {
      patchNotesCache((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)),
      );
      const values: Record<string, unknown> = {};
      if (patch.title !== undefined) values["title"] = patch.title;
      if (patch.body !== undefined) values["body"] = patch.body;
      if (patch.favorite !== undefined) values["favorite"] = patch.favorite;
      if (patch.collectionId !== undefined) values["collection_id"] = patch.collectionId;
      if (Object.keys(values).length === 0) return;
      writeNote.mutate({ op: "update", id, values });
    },
    [patchNotesCache, writeNote],
  );

  const deleteNote = useCallback(
    (id: string) => {
      patchNotesCache((prev) => prev.filter((n) => n.id !== id));
      setSelectedId((cur) => (cur === id ? null : cur));
      writeNote.mutate({ op: "delete", id });
    },
    [patchNotesCache, writeNote],
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      const current = (queryClient.getQueryData<Note[]>(notesKey) ?? []).find((n) => n.id === id);
      const next = !current?.favorite;
      patchNotesCache((prev) => prev.map((n) => (n.id === id ? { ...n, favorite: next } : n)));
      writeNote.mutate({ op: "update", id, values: { favorite: next } });
    },
    [queryClient, notesKey, patchNotesCache, writeNote],
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
    return notes
      .filter((n) => {
        if (filter.kind === "favorites" && !n.favorite) return false;
        if (filter.kind === "collection" && n.collectionId !== filter.id) return false;
        if (!q) return true;
        return n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q);
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, filter, query]);

  const counts = useMemo(
    () => ({
      all: notes.length,
      favorites: notes.filter((n) => n.favorite).length,
      byCollection: Object.fromEntries(
        collections.map((c) => [c.id, notes.filter((n) => n.collectionId === c.id).length]),
      ) as Record<string, number>,
    }),
    [notes, collections],
  );

  const selected = notes.find((n) => n.id === selectedId) ?? null;

  return {
    notes,
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
