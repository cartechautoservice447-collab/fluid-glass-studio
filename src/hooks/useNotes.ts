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

const NOTES_KEY = "glass-notes-v1";
const COLLECTIONS_KEY = "glass-notes-collections-v1";

const uid = () => Math.random().toString(36).slice(2, 10);

const DEMO_COLLECTIONS: Collection[] = [
  { id: "col-code", name: "Code" },
  { id: "col-ideas", name: "Ideas" },
];

const DEMO_NOTES: Note[] = [
  {
    id: "n-python",
    title: "Python — glass gradient helper",
    body: `A tiny helper that blends two colors for the liquid stage.

\`\`\`python
def blend(a: tuple, b: tuple, t: float = 0.5) -> tuple:
    """Linear interpolate two RGB tuples."""
    t = max(0.0, min(1.0, t))
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))

print(blend((13, 17, 23), (121, 192, 255), 0.35))
\`\`\`

Use it to generate **panel tints** that match the engine density.`,
    favorite: true,
    collectionId: "col-code",
    updatedAt: Date.now() - 1000 * 60 * 42,
  },
  {
    id: "n-engine",
    title: "Liquid engine notes",
    body: `Sliders map straight onto root CSS variables:

- \`--liquid-density\` → backdrop blur
- \`--liquid-transparency\` → panel alpha
- \`--liquid-gel\` → bevel + spring mass

> Tune density around 12px for the crispest read.`,
    favorite: false,
    collectionId: "col-ideas",
    updatedAt: Date.now() - 1000 * 60 * 60 * 5,
  },
  {
    id: "n-todo",
    title: "Roadmap",
    body: `| Task | State |
| --- | --- |
| Three column shell | done |
| Markdown preview | done |
| Collections | done |

Next: export notes as \`.md\`.`,
    favorite: false,
    collectionId: null,
    updatedAt: Date.now() - 1000 * 60 * 60 * 30,
  },
];

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
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

/** Pass a courseId to scope this hook's storage to one course's isolated notes. Omit it for the legacy/global store. */
export function useNotes(courseId?: string) {
  const notesKey = courseId ? `${NOTES_KEY}:${courseId}` : NOTES_KEY;
  const collectionsKey = courseId ? `${COLLECTIONS_KEY}:${courseId}` : COLLECTIONS_KEY;
  const defaultNotes = courseId ? [] : DEMO_NOTES;
  const defaultCollections = courseId ? [] : DEMO_COLLECTIONS;

  const [notes, setNotes] = useState<Note[]>(defaultNotes);
  const [collections, setCollections] = useState<Collection[]>(defaultCollections);
  const [hydrated, setHydrated] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const [query, setQuery] = useState("");

  useEffect(() => {
    const loadedNotes = load(notesKey, defaultNotes);
    const loadedCollections = load(collectionsKey, defaultCollections);
    setNotes(loadedNotes);
    setCollections(loadedCollections);
    setSelectedId(loadedNotes[0]?.id ?? null);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notesKey, collectionsKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(notesKey, JSON.stringify(notes));
      localStorage.setItem(collectionsKey, JSON.stringify(collections));
    } catch {
      /* ignore quota errors */
    }
  }, [notes, collections, hydrated, notesKey, collectionsKey]);

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
