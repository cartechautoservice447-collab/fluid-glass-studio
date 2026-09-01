import { PanelLeft, Star, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GlassPanel } from "@/components/liquid/GlassPanel";
import { MarkdownToolbar } from "@/components/notes/MarkdownToolbar";
import { NoteDocumentEditor, parseNoteSegments, type Segment } from "@/components/notes/NoteDocumentEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Collection, Note } from "@/hooks/useNotes";
import { relativeDate } from "@/hooks/useNotes";
import { cn } from "@/lib/utils";

type Props = {
  minimized: boolean;
  onMinimize: () => void;
  note: Note | null;
  collections: Collection[];
  onUpdate: (id: string, patch: Partial<Omit<Note, "id">>) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  notes?: Note[];
  onSelectNote?: (id: string | null) => void;
  showAllNotes?: boolean;
};

const NO_COLLECTION = "__none__";

export function NoteEditor({
  minimized,
  onMinimize,
  note,
  collections,
  onUpdate,
  onDelete,
  onToggleFavorite,
}: Props) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const segments = useMemo(() => parseNoteSegments(body), [body]);

  useEffect(() => {
    setTitle(note?.title ?? "");
    setBody(note?.body ?? "");
    setConfirmDelete(false);
    setActiveSegmentIndex(0);
  }, [note?.id]);

  useEffect(() => {
    if (activeSegmentIndex >= segments.length) {
      setActiveSegmentIndex(Math.max(segments.length - 1, 0));
    }
  }, [activeSegmentIndex, segments.length]);

  useEffect(() => {
    if (!note) return;
    if (title === note.title && body === note.body) return;
    const timer = setTimeout(() => onUpdate(note.id, { title, body }), 450);
    return () => clearTimeout(timer);
  }, [title, body, note, onUpdate]);

  const activeSegment: Segment | undefined = segments[activeSegmentIndex];
  const activeValue = activeSegment?.content ?? body;

  const updateSegment = useCallback((index: number, nextContent: string) => {
    setBody((current) => {
      const currentSegments = parseNoteSegments(current);
      const segment = currentSegments[index];
      if (!segment) return current;
      const replacement = segment.type === "output"
        ? `\`\`\`output\n${nextContent}\n\`\`\``
        : nextContent;
      return `${current.slice(0, segment.start)}${replacement}${current.slice(segment.end)}`;
    });
  }, []);

  const replaceAll = useCallback((next: string) => {
    setBody(next);
    setActiveSegmentIndex(0);
  }, []);

  const setActiveTextarea = useCallback((element: HTMLTextAreaElement | null) => {
    textareaRef.current = element;
  }, []);

  if (minimized) {
    return (
      <GlassPanel className="flex h-full items-start justify-center !p-3">
        <button
          type="button"
          onClick={onMinimize}
          className="flex size-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-foreground backdrop-blur-xl transition-colors hover:bg-white/20"
          aria-label="Restore editor panel"
          title="Restore editor panel"
        >
          <PanelLeft className="size-5 stroke-[1.8]" />
        </button>
      </GlassPanel>
    );
  }

  if (!note) {
    return (
      <GlassPanel className="relative flex h-full min-h-0 flex-col overflow-hidden !p-0">
        <div className="flex min-h-10 items-center gap-2 border-b border-white/10 p-4 pr-12">
          <span className="text-xs text-muted-foreground">Select a note</span>
        </div>
        <button type="button" onClick={onMinimize} className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full border border-white/25 bg-white/10 text-foreground backdrop-blur-xl transition-colors hover:bg-white/20" aria-label="Minimize editor panel" title="Minimize editor panel"><PanelLeft className="size-4 stroke-[1.8]" /></button>
        <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-center">
          <p className="text-sm text-muted-foreground">Select a note from the list, or create a new one to start writing.</p>
        </div>
      </GlassPanel>
    );
  }

  return (
    <>
      <GlassPanel className="relative flex h-full min-h-0 flex-col overflow-hidden !p-0">
        <div className="flex min-h-10 flex-wrap items-center gap-2 border-b border-white/10 p-4 pr-12">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} aria-label="Note title" placeholder="Note title" className="h-9 min-w-[10rem] flex-1 border-white/20 bg-white/10 text-sm font-semibold on-stage" />
          <Select value={note.collectionId ?? NO_COLLECTION} onValueChange={(value) => onUpdate(note.id, { collectionId: value === NO_COLLECTION ? null : value })}>
            <SelectTrigger className="h-9 w-[9.5rem] border-white/20 bg-white/10 text-xs" aria-label="Collection"><SelectValue placeholder="Collection" /></SelectTrigger>
            <SelectContent><SelectItem value={NO_COLLECTION}>No collection</SelectItem>{collections.map((collection) => <SelectItem key={collection.id} value={collection.id}>{collection.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button size="icon" variant="ghost" aria-label={note.favorite ? "Remove from favorites" : "Add to favorites"} onClick={() => onToggleFavorite(note.id)}><Star className={cn("size-4", note.favorite && "fill-amber-300 text-amber-300")} /></Button>
          <Button size="icon" variant="ghost" aria-label="Delete note" className="text-destructive" onClick={() => setConfirmDelete(true)}><Trash2 className="size-4" /></Button>
        </div>
        <button type="button" onClick={onMinimize} className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full border border-white/25 bg-white/10 text-foreground backdrop-blur-xl transition-colors hover:bg-white/20" aria-label="Minimize editor panel" title="Minimize editor panel"><PanelLeft className="size-4 stroke-[1.8]" /></button>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#0d1117] px-3 py-2">
          <MarkdownToolbar textareaRef={textareaRef} value={activeValue} onChange={(next) => updateSegment(activeSegmentIndex, next)} onReplaceAll={replaceAll} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#0d1117] p-4">
          <NoteDocumentEditor
            value={body}
            activeIndex={activeSegmentIndex}
            onActiveIndexChange={setActiveSegmentIndex}
            onChangeSegment={updateSegment}
            onActiveTextarea={setActiveTextarea}
          />
        </div>

        <p className="border-t border-white/10 bg-[#0d1117] px-4 py-2 text-[0.65rem] uppercase tracking-[0.2em] text-[#8b949e]">Autosaved · edited {relativeDate(note.updatedAt)}</p>
      </GlassPanel>

      {confirmDelete && <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/35 p-5 backdrop-blur-md" role="alertdialog" aria-modal="true" aria-labelledby="delete-note-title">
        <div className="relative w-full max-w-sm overflow-hidden rounded-[30px] border border-white/25 bg-white/[0.12] p-6 text-foreground shadow-[inset_0_1px_2px_rgba(255,255,255,.45),0_20px_60px_rgba(0,0,0,.35)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.16] via-transparent to-transparent" aria-hidden />
          <button type="button" onClick={() => setConfirmDelete(false)} className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full text-foreground/60 transition hover:bg-white/10 hover:text-foreground" aria-label="Close"><X className="size-4" /></button>
          <div className="relative"><div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10"><Trash2 className="size-5" /></div><h2 id="delete-note-title" className="text-lg font-semibold">Delete note?</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Are you sure you want to delete <span className="font-medium text-foreground">{note.title || "this note"}</span>? This action cannot be undone.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setConfirmDelete(false)} className="rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-2.5 text-sm font-medium transition hover:bg-white/[0.14]">Cancel</button><button type="button" onClick={() => { setConfirmDelete(false); onDelete(note.id); }} className="rounded-2xl border border-white/15 bg-white/[0.14] px-4 py-2.5 text-sm font-semibold transition hover:bg-white/[0.2]">Delete</button></div></div>
        </div>
      </div>}
    </>
  );
}
