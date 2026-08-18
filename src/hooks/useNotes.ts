import { useCallback, useEffect, useMemo, useState } from "react";

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

const notesKey = (namespace: string) => `glass-notes-v1:${namespace}`;
const collectionsKey = (namespace: string) => `glass-notes-collections-v1:${namespace}`;

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

/** Reads a course's note count without mounting the hook — safe to call from a list/grid. */
export function getNoteCount(namespace: string): number {
  try {
    const raw = localStorage.getItem(notesKey(namespace));
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

/** Reads a course's most recent note-edit timestamp without mounting the hook. */
export function getLastEditedAt(namespace: string): number | null {
  try {
    const raw = localStorage.getItem(notesKey(namespace));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    let max = 0;
    for (const n of parsed) {
      if (n && typeof n.updatedAt === "number" && n.updatedAt > max) max = n.updatedAt;
    }
    return max || null;
  } catch {
    return null;
  }
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

export function useNotes(namespace: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const [query, setQuery] = useState("");

  useEffect(() => {
    const loadedNotes = load<Note[]>(notesKey(namespace), []);
    setNotes(loadedNotes);
    setCollections(load<Collection[]>(collectionsKey(namespace), []));
    setSelectedId(loadedNotes[0]?.id ?? null);
    setFilter({ kind: "all" });
    setQuery("");
    setHydrated(true);
  }, [namespace]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(notesKey(namespace), JSON.stringify(notes));
      localStorage.setItem(collectionsKey(namespace), JSON.stringify(collections));
    } catch {
      /* ignore quota errors */
    }
  }, [notes, collections, hydrated, namespace]);

  const createNote = useCallback(() => {
    const note: Note = {
      id: uid(),
      title: "Untitled note",
      body: "",
      favorite: false,
      collectionId: filter.kind === "collection" ? filter.id : null,
      updatedAt: Date.now(),
    };
    setNotes((prev) => [note, ...prev]);
    setSelectedId(note.id);
    return note.id;
  }, [filter]);

  const updateNote = useCallback((id: string, patch: Partial<Omit<Note, "id">>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)),
    );
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, favorite: !n.favorite } : n)));
  }, []);

  const addCollection = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCollections((prev) => [...prev, { id: uid(), name: trimmed }]);
  }, []);

  const renameCollection = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c)));
  }, []);

  const deleteCollection = useCallback((id: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== id));
    setNotes((prev) => prev.map((n) => (n.collectionId === id ? { ...n, collectionId: null } : n)));
    setFilter((f) => (f.kind === "collection" && f.id === id ? { kind: "all" } : f));
  }, []);

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
  };
}
