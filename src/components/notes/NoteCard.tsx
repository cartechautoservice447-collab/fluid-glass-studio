import { Star } from "lucide-react";

import { GlassPanel } from "@/components/liquid/GlassPanel";
import { relativeDate, type Note } from "@/hooks/useNotes";
import { cn } from "@/lib/utils";

type Props = {
  note: Note;
  selected: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
};

function snippet(body: string) {
  return body
    .replace(/```[\s\S]*?```/g, " [code] ")
    .replace(/[#>*_`|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function NoteCard({ note, selected, onSelect, onToggleFavorite }: Props) {
  return (
    <GlassPanel
      onClick={onSelect}
      className={cn(
        "cursor-pointer !p-4 transition-shadow",
        selected && "ring-2 ring-emerald-400/70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
          {note.title || "Untitled note"}
        </h3>
        <button
          type="button"
          aria-label={note.favorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={note.favorite}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite();
          }}
          className="shrink-0 rounded-full p-1 transition-colors hover:bg-white/15"
        >
          <Star
            className={cn(
              "size-4",
              note.favorite ? "fill-amber-300 text-amber-300" : "text-muted-foreground",
            )}
          />
        </button>
      </div>
      <p className="mt-1 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {relativeDate(note.updatedAt)}
      </p>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {snippet(note.body) || "Empty note"}
      </p>
    </GlassPanel>
  );
}
