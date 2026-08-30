import { PanelLeft } from "lucide-react";

import { GlassPanel } from "@/components/liquid/GlassPanel";
import { NoteCard } from "@/components/notes/NoteCard";
import type { Note } from "@/hooks/useNotes";
import { cn } from "@/lib/utils";

type Props = {
  minimized: boolean;
  onMinimize: () => void;
  notes: Note[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  heading: string;
};

export function NoteList({ minimized, onMinimize, notes, selectedId, onSelect, onToggleFavorite, heading }: Props) {
  const byId = Array.from(new Map(notes.map((note) => [note.id, note])).values());
  const uniqueNotes = Array.from(
    byId.reduce((map, note) => {
      const fingerprint = [note.title.trim(), note.body, note.collectionId ?? "", note.favorite ? "1" : "0"].join("\u0000");
      const existing = map.get(fingerprint);
      if (!existing || note.id === selectedId || note.updatedAt > existing.updatedAt) map.set(fingerprint, note);
      return map;
    }, new Map<string, Note>()).values(),
  ).sort((a, b) => b.createdAt - a.createdAt);

  if (minimized) {
    return (
      <GlassPanel className="flex h-full items-start justify-center !p-3">
        <button
          type="button"
          onClick={onMinimize}
          className="flex size-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-foreground backdrop-blur-xl transition-colors hover:bg-white/20"
          aria-label="Restore notes panel"
          title="Restore notes panel"
        >
          <PanelLeft className="size-5 stroke-[1.8]" />
        </button>
      </GlassPanel>
    );
  }
  return (
    <GlassPanel className="relative flex h-full min-h-0 flex-col gap-3 !p-4">
      <div className="flex min-h-10 items-center justify-between gap-2 pr-10">
        <h2 className="text-[0.62rem] font-bold uppercase tracking-[0.28em] text-foreground">
          {heading}
        </h2>
        <span className="font-mono text-xs text-muted-foreground">{uniqueNotes.length}</span>
      </div>
      <button
        type="button"
        onClick={onMinimize}
        className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full border border-white/25 bg-white/10 text-foreground backdrop-blur-xl transition-colors hover:bg-white/20"
        aria-label="Minimize notes panel"
        title="Minimize notes panel"
      >
        <PanelLeft className="size-4 stroke-[1.8]" />
      </button>
      <div className="glass-scrollbar -mx-2 -my-2 min-h-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto px-2 py-2">
        {uniqueNotes.length === 0 ? (
          <p className="px-1 py-6 text-sm text-muted-foreground">No notes match this view.</p>
        ) : (
          uniqueNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              selected={note.id === selectedId}
              onSelect={() => onSelect(note.id)}
              onToggleFavorite={() => onToggleFavorite(note.id)}
            />
          ))
        )}
      </div>
    </GlassPanel>
  );
}
