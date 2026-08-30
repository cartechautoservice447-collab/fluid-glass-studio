import { useEffect, useMemo, useRef, useState } from "react";
import { ArchiveRestore, BookOpen, Check, Clock3, Download, Flame, ListTree, Redo2, Tags, Timer, Trophy, Undo2, Upload, X } from "lucide-react";
import type { Note } from "@/hooks/useNotes";
import { cn } from "@/lib/utils";

type Props = {
  courseName: string;
  notes: Note[];
  selectedId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: () => string;
  onUpdateNote: (id: string, patch: Partial<Omit<Note, "id">>) => void;
  onDeleteNote: (note: Note) => void;
  onToggleFavorite: (id: string) => void;
  onRestoreNote: (note: Note) => void;
};

type Pom = { sessions: number; minutes: number };
type HistoryState = { past: Note[]; future: Note[] };

function uniqueById(items: Note[]) {
  return Array.from(new Map(items.map((note) => [note.id, note])).values());
}

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function scopedKey(prefix: string, courseName: string) {
  return `${prefix}:${courseName}`;
}

export function StudyFeaturesPanel({ courseName, notes, selectedId, onSelectNote, onCreateNote, onUpdateNote, onDeleteNote, onToggleFavorite, onRestoreNote }: Props) {
  const uniqueNotes = useMemo(() => uniqueById(notes), [notes]);
  const [tab, setTab] = useState<"overview" | "study" | "backup" | "trash" | "tags" | "history">("overview");
  const [focus, setFocus] = useState(false);
  const [seconds, setSeconds] = useState(25 * 60);
  const [minutes, setMinutes] = useState(25);
  const [backupMessage, setBackupMessage] = useState("");
  const [trash, setTrash] = useState<Note[]>(() => uniqueById(safeRead(scopedKey("glass-notes-trash-v1", courseName), [])));
  const [history, setHistory] = useState<HistoryState>(() => safeRead(scopedKey("glass-notes-history-v1", courseName), { past: [], future: [] }));
  const [tagFilter, setTagFilter] = useState("");
  const [pom, setPom] = useState<Pom>(() => safeRead(scopedKey("glass-notes-pomodoro-v1", courseName), { sessions: 0, minutes: 0 }));
  const previousNotesRef = useRef<Map<string, Note>>(new Map(uniqueNotes.map((note) => [note.id, note])));
  const restoringHistoryRef = useRef(false);
  const skipNextHistoryRef = useRef(false);

  useEffect(() => {
    setTrash(uniqueById(safeRead(scopedKey("glass-notes-trash-v1", courseName), [])));
    setHistory(safeRead(scopedKey("glass-notes-history-v1", courseName), { past: [], future: [] }));
    setPom(safeRead(scopedKey("glass-notes-pomodoro-v1", courseName), { sessions: 0, minutes: 0 }));
    setTagFilter("");
    previousNotesRef.current = new Map(uniqueNotes.map((note) => [note.id, note]));
    skipNextHistoryRef.current = true;
  }, [courseName, uniqueNotes]);

  useEffect(() => {
    if (!focus) return;
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          setFocus(false);
          setPom((current) => {
            const next = { sessions: current.sessions + 1, minutes: current.minutes + minutes };
            localStorage.setItem(scopedKey("glass-notes-pomodoro-v1", courseName), JSON.stringify(next));
            return next;
          });
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [focus, minutes, courseName]);

  useEffect(() => {
    localStorage.setItem(scopedKey("glass-notes-history-v1", courseName), JSON.stringify(history));
  }, [history, courseName]);

  useEffect(() => {
    if (skipNextHistoryRef.current) {
      skipNextHistoryRef.current = false;
      previousNotesRef.current = new Map(uniqueNotes.map((note) => [note.id, note]));
      return;
    }
    if (restoringHistoryRef.current) {
      restoringHistoryRef.current = false;
      previousNotesRef.current = new Map(uniqueNotes.map((note) => [note.id, note]));
      return;
    }

    const previous = previousNotesRef.current;
    const next = new Map(uniqueNotes.map((note) => [note.id, note]));
    const snapshots: Note[] = [];

    previous.forEach((oldNote, id) => {
      const current = next.get(id);
      if (!current || JSON.stringify(current) !== JSON.stringify(oldNote)) snapshots.push(oldNote);
    });

    if (snapshots.length) {
      setHistory((current) => ({ past: [...current.past, ...snapshots], future: [] }));
    }
    previousNotesRef.current = next;
  }, [uniqueNotes]);

  const headings = useMemo(() => uniqueNotes.flatMap((note) => note.body.split("\n").filter((line) => /^#{1,3}\s+/.test(line)).map((line) => ({ note, heading: line.replace(/^#{1,3}\s+/, "") }))), [uniqueNotes]);
  const tags = useMemo(() => Array.from(new Set(uniqueNotes.flatMap((note) => note.body.match(/#[A-Za-z0-9_-]+/g) ?? []))).sort(), [uniqueNotes]);
  const taggedNotes = useMemo(() => uniqueNotes.filter((note) => !tagFilter || note.body.toLowerCase().includes(tagFilter.toLowerCase())), [uniqueNotes, tagFilter]);
  const progress = Math.min(100, uniqueNotes.length * 10);
  const achievements = [
    uniqueNotes.length >= 1 && "First note",
    uniqueNotes.length >= 10 && "10 notes",
    pom.sessions >= 5 && "5 focus sessions",
    pom.minutes >= 300 && "5 focus hours",
  ].filter(Boolean) as string[];
  const selectedNote = uniqueNotes.find((note) => note.id === selectedId) ?? null;
  const fmt = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const createNote = () => {
    const id = onCreateNote();
    if (id) onSelectNote(id);
  };

  const updateSelected = (patch: Partial<Omit<Note, "id">>) => {
    if (selectedNote) onUpdateNote(selectedNote.id, patch);
  };

  const undo = () => {
    const previous = history.past.at(-1);
    if (!previous) return;
    restoringHistoryRef.current = true;
    setHistory((current) => ({ past: current.past.slice(0, -1), future: [selectedNote ?? previous, ...current.future] }));
    onRestoreNote(previous);
    onSelectNote(previous.id);
  };

  const redo = () => {
    const next = history.future[0];
    if (!next) return;
    restoringHistoryRef.current = true;
    setHistory((current) => ({ past: [...current.past, selectedNote ?? next], future: current.future.slice(1) }));
    onRestoreNote(next);
    onSelectNote(next.id);
  };

  const exportBackup = () => {
    const payload = JSON.stringify({ version: 3, exportedAt: new Date().toISOString(), course: courseName, notes: uniqueNotes }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${courseName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-backup.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setBackupMessage("Backup exported successfully");
  };

  const importBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!Array.isArray(data.notes)) throw new Error("Invalid notes payload");
        const imported = uniqueById(data.notes as Note[]);
        imported.forEach(onRestoreNote);
        setBackupMessage(`${imported.length} unique notes restored to this course`);
      } catch {
        setBackupMessage("Invalid backup file");
      }
    };
    reader.readAsText(file);
  };

  const moveToTrash = (note: Note) => {
    const next = [note, ...trash.filter((item) => item.id !== note.id)];
    setTrash(next);
    localStorage.setItem(scopedKey("glass-notes-trash-v1", courseName), JSON.stringify(next));
    onDeleteNote(note);
  };

  const restoreTrash = (note: Note) => {
    onRestoreNote(note);
    onSelectNote(note.id);
    const next = trash.filter((item) => item.id !== note.id);
    setTrash(next);
    localStorage.setItem(scopedKey("glass-notes-trash-v1", courseName), JSON.stringify(next));
  };

  const removeTrash = (note: Note) => {
    const next = trash.filter((item) => item.id !== note.id);
    setTrash(next);
    localStorage.setItem(scopedKey("glass-notes-trash-v1", courseName), JSON.stringify(next));
  };

  const refreshTrash = () => setTrash(uniqueById(safeRead(scopedKey("glass-notes-trash-v1", courseName), [])));

  return <div className="mt-3 rounded-[26px] border border-white/20 bg-white/[0.07] p-3 shadow-[inset_0_1px_2px_rgba(255,255,255,.25)] backdrop-blur-2xl">
    <div className="flex flex-wrap items-center gap-1.5">
      {([["overview", "Overview"], ["study", "Study"], ["backup", "Backup"], ["trash", "Trash"], ["tags", "Tags"], ["history", "History"]] as const).map(([id, label]) => <button key={id} type="button" onClick={() => { setTab(id); if (id === "trash") refreshTrash(); }} className={cn("rounded-xl px-3 py-2 text-xs font-medium transition", tab === id ? "bg-white/20 text-foreground" : "text-muted-foreground hover:bg-white/10 hover:text-foreground")}>{label}</button>)}
      <button type="button" onClick={createNote} className="ml-auto rounded-xl bg-foreground px-3 py-2 text-xs font-semibold text-background">New note</button>
    </div>

    {tab === "overview" && <div className="mt-3 space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl border border-white/15 bg-white/[0.05] p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><BookOpen className="size-4" />Progress</div><p className="mt-2 text-xl font-semibold">{progress}%</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-foreground/70" style={{ width: `${progress}%` }} /></div></div><div className="rounded-2xl border border-white/15 bg-white/[0.05] p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Timer className="size-4" />Focus</div><p className="mt-2 text-xl font-semibold">{pom.minutes}m</p><p className="text-[11px] text-muted-foreground">{pom.sessions} completed sessions</p></div><div className="rounded-2xl border border-white/15 bg-white/[0.05] p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Tags className="size-4" />Tags</div><p className="mt-2 text-xl font-semibold">{tags.length}</p><p className="truncate text-[11px] text-muted-foreground">{tags.slice(0, 3).join(" · ") || "No #tags yet"}</p></div><div className="rounded-2xl border border-white/15 bg-white/[0.05] p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Trophy className="size-4" />Achievements</div><p className="mt-2 text-xl font-semibold">{achievements.length}/4</p><p className="text-[11px] text-muted-foreground">{achievements.join(" · ") || "Start studying"}</p></div></div>
      {selectedNote ? <div className="rounded-2xl border border-white/15 bg-white/[0.05] p-4"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Selected note</p><p className="mt-1 truncate text-sm font-semibold">{selectedNote.title}</p></div><button type="button" onClick={() => moveToTrash(selectedNote)} className="shrink-0 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs text-muted-foreground hover:bg-white/15 hover:text-foreground">Delete</button></div><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => onToggleFavorite(selectedNote.id)} className="rounded-xl bg-white/10 px-3 py-2 text-xs">{selectedNote.favorite ? "Remove favorite" : "Add favorite"}</button><button type="button" onClick={() => updateSelected({ title: "Untitled note" })} className="rounded-xl bg-white/10 px-3 py-2 text-xs">Reset title</button></div></div> : <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-xs text-muted-foreground">Select a note from the course editor or create a new note to manage it here.</p>}
    </div>}

    {tab === "study" && <div className="mt-3 space-y-3"><div className="rounded-2xl border border-white/15 bg-white/[0.05] p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold">Study Mode</p><p className="text-xs text-muted-foreground">Focus on this course without distractions.</p></div><button type="button" onClick={() => setFocus((value) => !value)} className="rounded-xl bg-foreground px-3 py-2 text-xs font-semibold text-background">{focus ? "Exit Study Mode" : "Start Study Mode"}</button></div></div><div className="rounded-2xl border border-white/15 bg-white/[0.05] p-4"><div className="flex items-center gap-2"><Timer className="size-4" /><p className="text-sm font-semibold">Pomodoro</p></div><div className="mt-3 flex flex-wrap items-center gap-2"><input aria-label="Pomodoro minutes" type="number" min={1} max={120} value={minutes} onChange={(e) => setMinutes(Math.min(120, Math.max(1, Number(e.target.value) || 1)))} className="w-24 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm" /><span className="text-xs text-muted-foreground">minutes</span><span className="font-mono text-lg tabular-nums">{fmt}</span><button type="button" onClick={startPomodoro} className="ml-auto rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold hover:bg-white/20">{focus ? "Restart" : "Start"}</button></div></div><div className="rounded-2xl border border-white/15 bg-white/[0.05] p-4"><div className="flex items-center gap-2"><ListTree className="size-4" /><p className="text-sm font-semibold">Table of Contents</p></div><div className="mt-2 max-h-40 space-y-1 overflow-auto">{headings.length ? headings.map((item, i) => <button key={`${item.note.id}-${item.heading}-${i}`} type="button" onClick={() => selectHeading(item.note)} className={cn("block w-full rounded-lg px-2 py-1 text-left text-xs hover:bg-white/10", item.note.id === selectedId && "bg-white/10")}><span className="text-foreground">{item.heading}</span><span className="ml-2 text-muted-foreground">{item.note.title}</span></button>) : <p className="text-xs text-muted-foreground">Add Markdown headings such as ## Topic to build a table of contents.</p>}</div></div><div className="rounded-2xl border border-white/15 bg-white/[0.05] p-4"><div className="flex items-center gap-2"><Flame className="size-4" /><p className="text-sm font-semibold">Achievements</p></div><div className="mt-2 flex flex-wrap gap-2">{achievements.map((a) => <span key={a} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px]">🏆 {a}</span>)}{!achievements.length && <span className="text-xs text-muted-foreground">Create notes and complete focus sessions to unlock achievements.</span>}</div></div></div>}

    {tab === "backup" && <div className="mt-3 rounded-2xl border border-white/15 bg-white/[0.05] p-4"><p className="text-sm font-semibold">Backup & Restore</p><p className="mt-1 text-xs text-muted-foreground">Export or restore this course's notes.</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={exportBackup} className="flex items-center gap-2 rounded-xl bg-foreground px-3 py-2 text-xs font-semibold text-background"><Download className="size-3.5" />Export backup</button><label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold"><Upload className="size-3.5" />Restore backup<input type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) importBackup(file); e.currentTarget.value = ""; }} /></label></div>{backupMessage && <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Check className="size-3.5" />{backupMessage}</p>}</div>}

    {tab === "trash" && <div className="mt-3 rounded-2xl border border-white/15 bg-white/[0.05] p-4"><div className="flex items-center justify-between"><p className="text-sm font-semibold">Recently Deleted</p><button type="button" onClick={refreshTrash} className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10" aria-label="Refresh trash"><ArchiveRestore className="size-3.5" /></button></div>{trash.length ? <div className="mt-3 space-y-2">{trash.map((note) => <div key={note.id} className="flex items-center gap-2 rounded-xl bg-white/5 p-2"><span className="min-w-0 flex-1 truncate text-xs">{note.title}</span><button type="button" onClick={() => restoreTrash(note)} className="rounded-lg bg-white/10 px-2 py-1 text-[11px]">Restore</button><button type="button" onClick={() => removeTrash(note)} className="rounded-lg p-1 text-muted-foreground hover:bg-white/10" aria-label={`Permanently remove ${note.title}`}><X className="size-3.5" /></button></div>)}</div> : <p className="mt-2 text-xs text-muted-foreground">No deleted notes.</p>}</div>}

    {tab === "tags" && <div className="mt-3 rounded-2xl border border-white/15 bg-white/[0.05] p-4"><p className="text-sm font-semibold">Tags & Filtering</p><div className="mt-3 flex flex-wrap gap-2">{tags.length ? tags.map((tag) => <button key={tag} type="button" onClick={() => setTagFilter((current) => current === tag ? "" : tag)} className={cn("rounded-full px-2.5 py-1 text-[11px]", tagFilter === tag ? "bg-foreground text-background" : "bg-white/10")}>{tag}</button>) : <span className="text-xs text-muted-foreground">Add #tags to notes.</span>}</div>{tagFilter && <div className="mt-3 space-y-1">{taggedNotes.map((note) => <button key={note.id} type="button" onClick={() => onSelectNote(note.id)} className={cn("block w-full rounded-xl bg-white/5 px-3 py-2 text-left text-xs hover:bg-white/10", note.id === selectedId && "bg-white/10")}>{note.title}</button>)}</div>}</div>}

    {tab === "history" && <div className="mt-3 rounded-2xl border border-white/15 bg-white/[0.05] p-4"><div className="flex items-center gap-2"><Clock3 className="size-4" /><p className="text-sm font-semibold">Undo / Redo</p></div><p className="mt-1 text-xs text-muted-foreground">Restore recent saved note states for this course.</p><div className="mt-4 flex gap-2"><button type="button" disabled={!history.past.length} onClick={undo} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs disabled:opacity-40"><Undo2 className="size-3.5" />Undo</button><button type="button" disabled={!history.future.length} onClick={redo} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs disabled:opacity-40"><Redo2 className="size-3.5" />Redo</button></div><p className="mt-3 text-[11px] text-muted-foreground">Past: {history.past.length} · Future: {history.future.length}{selectedNote ? ` · Selected: ${selectedNote.title}` : ""}</p></div>}
  </div>;
}
