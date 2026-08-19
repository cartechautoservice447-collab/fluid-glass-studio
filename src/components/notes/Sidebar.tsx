import { ArrowLeft, Check, Files, FolderPlus, LogOut, PanelLeft, Pencil, Plus, Search, Star, Trash2, X } from "lucide-react";
import { useState } from "react";

import { EngineSettingsModal } from "@/components/liquid/EngineSettingsModal";
import { GlassPanel } from "@/components/liquid/GlassPanel";
import { ThemeToggle } from "@/components/liquid/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Collection, Filter } from "@/hooks/useNotes";
import { cn } from "@/lib/utils";

type Props = {
  minimized: boolean;
  onMinimize: () => void;
  email: string | null;
  onBack: () => void;
  onLogout: () => void;
  collections: Collection[];
  counts: { all: number; favorites: number; byCollection: Record<string, number> };
  filter: Filter;
  setFilter: (filter: Filter) => void;
  query: string;
  setQuery: (query: string) => void;
  onCreateNote: () => void;
  onAddCollection: (name: string) => void;
  onRenameCollection: (id: string, name: string) => void;
  onDeleteCollection: (id: string) => void;
};

export function Sidebar({
  minimized,
  onMinimize,
  email,
  onBack,
  onLogout,
  collections,
  counts,
  filter,
  setFilter,
  query,
  setQuery,
  onCreateNote,
  onAddCollection,
  onRenameCollection,
  onDeleteCollection,
}: Props) {
  const [newCollection, setNewCollection] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  if (minimized) {
    return (
      <GlassPanel className="flex h-full items-start justify-center !p-3">
        <button
          type="button"
          onClick={onMinimize}
          className="flex size-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-foreground backdrop-blur-xl transition-colors hover:bg-white/20"
          aria-label="Restore navigation panel"
          title="Restore navigation panel"
        >
          <PanelLeft className="size-5 stroke-[1.8]" />
        </button>
      </GlassPanel>
    );
  }

  const navRow = (active: boolean) =>
    cn(
      "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
      active
        ? "bg-white/25 text-foreground shadow-inner"
        : "text-muted-foreground hover:bg-white/12 hover:text-foreground",
    );

  return (
    <GlassPanel className="flex h-full min-h-0 flex-col gap-5 !p-4">
      <div className="flex min-h-10 items-center justify-between gap-3">
        <div>
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-muted-foreground">
            Liquid Glass
          </p>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Glass Notes</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex size-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-foreground backdrop-blur-xl transition-colors hover:bg-white/20"
            aria-label="Back to My Courses"
            title="Back to My Courses"
          >
            <ArrowLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={onMinimize}
            className="flex size-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-foreground backdrop-blur-xl transition-colors hover:bg-white/20"
            aria-label="Minimize navigation panel"
            title="Minimize navigation panel"
          >
            <PanelLeft className="size-5 stroke-[1.8]" />
          </button>
          <ThemeToggle />
        </div>
      </div>

      <button
        type="button"
        onClick={onCreateNote}
        className="notes-pulse-glow flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <Plus className="size-4" />
        New Note
      </button>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search notes"
          aria-label="Search notes"
          className="border-white/25 bg-white/10 pl-9 text-sm placeholder:text-muted-foreground"
        />
      </div>

      <nav className="flex flex-col gap-1">
        <button
          type="button"
          className={navRow(filter.kind === "all")}
          onClick={() => setFilter({ kind: "all" })}
        >
          <span className="flex items-center gap-2">
            <Files className="size-4" />
            All Notes
          </span>
          <span className="font-mono text-xs">{counts.all}</span>
        </button>
        <button
          type="button"
          className={navRow(filter.kind === "favorites")}
          onClick={() => setFilter({ kind: "favorites" })}
        >
          <span className="flex items-center gap-2">
            <Star className="size-4" />
            Favorites
          </span>
          <span className="font-mono text-xs">{counts.favorites}</span>
        </button>
      </nav>

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.26em] text-muted-foreground">
          Collections
        </p>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
          {collections.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">No collections yet.</p>
          )}
          {collections.map((collection) => {
            const active = filter.kind === "collection" && filter.id === collection.id;
            if (editingId === collection.id) {
              return (
                <div key={collection.id} className="flex items-center gap-1">
                  <Input
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    aria-label={`Rename ${collection.name}`}
                    className="h-8 border-white/25 bg-white/10 text-xs"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    aria-label="Save name"
                    onClick={() => {
                      onRenameCollection(collection.id, editingName);
                      setEditingId(null);
                    }}
                  >
                    <Check className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    aria-label="Cancel rename"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              );
            }
            return (
              <div key={collection.id} className={navRow(active)}>
                <button
                  type="button"
                  className="flex-1 truncate text-left"
                  onClick={() => setFilter({ kind: "collection", id: collection.id })}
                >
                  {collection.name}
                </button>
                <span className="font-mono text-xs">{counts.byCollection[collection.id] ?? 0}</span>
                <button
                  type="button"
                  aria-label={`Rename ${collection.name}`}
                  onClick={() => {
                    setEditingId(collection.id);
                    setEditingName(collection.name);
                  }}
                  className="rounded p-1 hover:bg-white/20"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${collection.name}`}
                  onClick={() => onDeleteCollection(collection.id)}
                  className="rounded p-1 text-destructive hover:bg-white/20"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        <form
          className="flex items-center gap-1"
          onSubmit={(event) => {
            event.preventDefault();
            onAddCollection(newCollection);
            setNewCollection("");
          }}
        >
          <Input
            value={newCollection}
            onChange={(event) => setNewCollection(event.target.value)}
            placeholder="New collection"
            aria-label="New collection name"
            className="h-9 border-white/25 bg-white/10 text-xs"
          />
          <Button size="icon" variant="secondary" type="submit" aria-label="Add collection">
            <FolderPlus className="size-4" />
          </Button>
        </form>
      </div>

      <div className="border-t border-white/20 pt-4">
        <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 p-2 backdrop-blur-xl">
          <div className="min-w-0 flex-1 px-1">
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Account
            </p>
            <p className="truncate text-xs font-medium text-foreground" title={email ?? "Signed in"}>
              {email ?? "Signed in"}
            </p>
          </div>
          <EngineSettingsModal trigger="icon" />
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-white/20"
        >
          <LogOut className="size-3.5" />
          Sign out
        </button>
      </div>
    </GlassPanel>
  );
}
