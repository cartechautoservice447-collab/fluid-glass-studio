import { GlassPanel } from "@/components/liquid/GlassPanel";
import { NoteCard } from "@/components/notes/NoteCard";
import type { Note } from "@/hooks/useNotes";

type Props = {
  notes: Note[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  heading: string;
};

export function NoteList({ notes, selectedId, onSelect, onToggleFavorite, heading }: Props) {
  return (
    <GlassPanel className="flex h-full min-h-0 flex-col gap-3 !p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[0.62rem] font-bold uppercase tracking-[0.28em] text-foreground">
          {heading}
        </h2>
        <span className="font-mono text-xs text-muted-foreground">{notes.length}</span>
      </div>
      <div className="glass-scrollbar -mx-2 -my-2 min-h-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto px-2 py-2">
        {notes.length === 0 ? (
          <p className="px-1 py-6 text-sm text-muted-foreground">No notes match this view.</p>
        ) : (
          notes.map((note) => (
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
