import { Eye, PanelLeft, Pencil, Star, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { GlassPanel } from "@/components/liquid/GlassPanel";
import { NotebookPreviewAdditive } from "@/components/notes/NotebookPreviewAdditive";
import { TerminalOutput } from "@/components/notes/TerminalOutput";
import { MarkdownToolbar } from "@/components/notes/MarkdownToolbar";
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
};

const NO_COLLECTION = "__none__";

export function NoteEditor({ minimized, onMinimize, note, collections, onUpdate, onDelete, onToggleFavorite }: Props) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load the selected note into the local draft.
  useEffect(() => {
    setTitle(note?.title ?? "");
    setBody(note?.body ?? "");
  }, [note?.id]);

  // Debounced autosave.
  useEffect(() => {
    if (!note) return;
    if (title === note.title && body === note.body) return;
    const timer = setTimeout(() => onUpdate(note.id, { title, body }), 450);
    return () => clearTimeout(timer);
  }, [title, body, note, onUpdate]);

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
      <GlassPanel className="relative flex h-full min-h-0 items-center justify-center !p-8 text-center">
        <button
          type="button"
          onClick={onMinimize}
          className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full border border-white/25 bg-white/10 text-foreground backdrop-blur-xl transition-colors hover:bg-white/20"
          aria-label="Minimize editor panel"
          title="Minimize editor panel"
        >
          <PanelLeft className="size-4 stroke-[1.8]" />
        </button>
        <p className="text-sm text-muted-foreground">
          Select a note from the list, or create a new one to start writing.
        </p>
      </GlassPanel>
    );
  }

  // Terminal-output fences are rendered by the exact same TerminalOutput
  // component in both modes. Remove only those fences from the Markdown body
  // so Preview never creates a second, different code-snippet box for them.
  const previewBody = body.replace(/```(?:output|terminal-output)\s*\n[\s\S]*?```/gi, "").replace(/\n{3,}/g, "\n\n").trim();

  return (
    <GlassPanel className="relative flex h-full min-h-0 flex-col overflow-hidden !p-0">
      <div className="flex min-h-10 flex-wrap items-center gap-2 border-b border-white/10 p-4 pr-12">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          aria-label="Note title"
          placeholder="Note title"
          className="h-9 min-w-[10rem] flex-1 border-white/20 bg-white/10 text-sm font-semibold on-stage"
        />
        <Select
          value={note.collectionId ?? NO_COLLECTION}
          onValueChange={(value) =>
            onUpdate(note.id, { collectionId: value === NO_COLLECTION ? null : value })
          }
        >
          <SelectTrigger className="h-9 w-[9.5rem] border-white/20 bg-white/10 text-xs" aria-label="Collection">
            <SelectValue placeholder="Collection" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_COLLECTION}>No collection</SelectItem>
            {collections.map((collection) => (
              <SelectItem key={collection.id} value={collection.id}>
                {collection.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="icon"
          variant="ghost"
          aria-label={note.favorite ? "Remove from favorites" : "Add to favorites"}
          onClick={() => onToggleFavorite(note.id)}
        >
          <Star className={cn("size-4", note.favorite && "fill-amber-300 text-amber-300")} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Delete note"
          className="text-destructive"
          onClick={() => onDelete(note.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <button
        type="button"
        onClick={onMinimize}
        className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full border border-white/25 bg-white/10 text-foreground backdrop-blur-xl transition-colors hover:bg-white/20"
        aria-label="Minimize editor panel"
        title="Minimize editor panel"
      >
        <PanelLeft className="size-4 stroke-[1.8]" />
      </button>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#0d1117] px-3 py-2">
        <MarkdownToolbar
          textareaRef={textareaRef}
          value={body}
          onChange={setBody}
          disabled={mode === "preview"}
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1.5 text-[#c9d1d9] hover:bg-white/10 hover:text-white"
          onClick={() => setMode((prev) => (prev === "edit" ? "preview" : "edit"))}
        >
          {mode === "edit" ? <Eye className="size-3.5" /> : <Pencil className="size-3.5" />}
          <span className="text-xs">{mode === "edit" ? "Preview" : "Edit"}</span>
        </Button>
      </div>

      <div className={`min-h-0 flex-1 overflow-y-auto bg-[#0d1117] ${mode === "edit" ? "p-4" : "p-0"}`}>
        {mode === "edit" ? (
          <div className="flex min-h-full flex-col">
            <textarea
              ref={textareaRef}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              aria-label="Note body"
              placeholder="Write markdown here…"
              spellCheck={false}
              className="min-h-[16rem] flex-1 resize-none bg-transparent text-sm leading-relaxed text-[#c9d1d9] outline-none placeholder:text-[#8b949e]"
              style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace" }}
            />
            <TerminalOutput value={body} />
          </div>
        ) : (
          <div className="min-h-full">
            {previewBody && <NotebookPreviewAdditive body={previewBody} />}
            <div className="mx-auto w-full max-w-4xl px-6 pb-8 sm:px-10">
              <TerminalOutput value={body} className="mt-0" />
            </div>
          </div>
        )}
      </div>

      <p className="border-t border-white/10 bg-[#0d1117] px-4 py-2 text-[0.65rem] uppercase tracking-[0.2em] text-[#8b949e]">
        Autosaved · edited {relativeDate(note.updatedAt)}
      </p>
    </GlassPanel>
  );
}
