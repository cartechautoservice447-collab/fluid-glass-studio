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
    <div className="flex h-full min-h-0 flex-col gap-3 rounded-3xl border border-white/15 bg-white/5 p-4 backdrop-blur-lg">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[0.62rem] font-bold uppercase tracking-[0.28em] on-stage">{heading}</h2>
        <span className="font-mono text-xs on-stage-muted">{notes.length}</span>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {notes.length === 0 ? (
          <p className="px-1 py-6 text-sm on-stage-muted">No notes match this view.</p>
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
    </div>
  );
}
