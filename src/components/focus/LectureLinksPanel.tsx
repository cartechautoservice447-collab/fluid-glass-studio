import { Bookmark, ExternalLink, Link2, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LectureLink } from "@/hooks/useLectureLinks";

function displayUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "") + parsed.pathname + parsed.search;
  } catch {
    return url;
  }
}

type Props = {
  open: boolean;
  links: LectureLink[];
  loading: boolean;
  cloudAvailable: boolean;
  currentUrl: string;
  onOpen: (url: string) => void;
  onSave: (title: string, url: string) => Promise<LectureLink | null>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
};

export function LectureLinksPanel({ open, links, loading, cloudAvailable, currentUrl, onOpen, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState(currentUrl);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setUrl(currentUrl);
  }, [currentUrl, open]);

  if (!open) return null;

  const save = async () => {
    const value = url.trim();
    if (!value || saving) return;
    setSaving(true);
    const saved = await onSave(title, value);
    setSaving(false);
    if (saved) {
      setTitle("");
      setUrl(saved.url);
      onOpen(saved.url);
    }
  };

  return (
    <div className="absolute right-2 top-10 z-[170] w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-white/20 bg-[#0d1117]/95 text-foreground shadow-2xl backdrop-blur-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Bookmark className="size-3.5" />
          <span className="text-xs font-semibold">Saved lectures</span>
          {!cloudAvailable && <span className="text-[9px] text-amber-300">local fallback</span>}
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:bg-white/10" aria-label="Close saved lectures"><X className="size-3.5" /></button>
      </div>

      <div className="space-y-2 border-b border-white/10 p-3">
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Lecture title" aria-label="Lecture title" className="h-8 border-white/15 bg-white/[.06] text-xs" />
        <div className="flex gap-1.5">
          <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="YouTube lecture URL" aria-label="Lecture URL" className="h-8 min-w-0 flex-1 border-white/15 bg-white/[.06] text-xs" />
          <Button type="button" onClick={() => void save()} disabled={!url.trim() || saving} size="sm" className="h-8 shrink-0 gap-1.5 px-2.5 text-xs"><Plus className="size-3" />{saving ? "Saving" : "Save"}</Button>
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto p-2">
        {loading ? <p className="px-2 py-5 text-center text-xs text-muted-foreground">Loading saved lectures…</p> : links.length === 0 ? <div className="px-2 py-6 text-center"><Link2 className="mx-auto mb-2 size-5 text-muted-foreground" /><p className="text-xs font-medium">No saved lectures yet</p><p className="mt-1 text-[10px] text-muted-foreground">Save a lecture once, then reopen it with one click.</p></div> : links.map((link) => (
          <div key={link.id} className="group flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-white/[.06]">
            <button type="button" onClick={() => onOpen(link.url)} className="min-w-0 flex-1 text-left">
              <span className="block truncate text-xs font-medium">{link.title}</span>
              <span className="mt-0.5 block truncate text-[9px] text-muted-foreground">{displayUrl(link.url)}</span>
            </button>
            <a href={link.url} target="_blank" rel="noreferrer" className="rounded p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground" aria-label={`Open ${link.title} in new tab`} title="Open in new tab"><ExternalLink className="size-3" /></a>
            <button type="button" onClick={() => void onDelete(link.id)} className="rounded p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground" aria-label={`Delete ${link.title}`} title="Delete saved lecture"><Trash2 className="size-3" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
