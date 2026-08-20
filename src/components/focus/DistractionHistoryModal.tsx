import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, History, X } from "lucide-react";

type HistoryEntry = { id: string; courseName: string; date: string; plannedSeconds: number; completedSeconds: number; status: "completed" | "interrupted" };
const KEY = "liquid-glass-distraction-history";

function loadHistory(): HistoryEntry[] { try { const value = JSON.parse(localStorage.getItem(KEY) ?? "[]"); return Array.isArray(value) ? value : []; } catch { return []; } }
function formatDuration(seconds: number) { const m = Math.floor(seconds / 60); const h = Math.floor(m / 60); const mm = m % 60; return h ? `${h}h ${mm}m` : `${mm}m`; }

export function DistractionHistoryModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  useEffect(() => { if (!open) return; setHistory(loadHistory()); }, [open]);
  const total = useMemo(() => history.reduce((sum, item) => sum + item.completedSeconds, 0), [history]);
  if (!open) return null;
  return <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/45 p-5 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Distraction history">
    <div className="w-full max-w-2xl overflow-hidden rounded-[30px] border border-white/20 bg-black/40 text-foreground shadow-2xl backdrop-blur-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]"><History className="size-5" /></div><div><h2 className="text-lg font-semibold">Distraction History</h2><p className="text-xs text-muted-foreground">Your distraction-free study sessions</p></div></div><button type="button" onClick={() => onOpenChange(false)} className="rounded-full p-2 text-muted-foreground hover:bg-white/10" aria-label="Close"><X className="size-4" /></button></div>
      <div className="grid grid-cols-2 gap-3 p-6"><div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"><p className="text-xs text-muted-foreground">Total distraction-free time</p><p className="mt-1 text-2xl font-semibold">{formatDuration(total)}</p></div><div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"><p className="text-xs text-muted-foreground">Sessions</p><p className="mt-1 text-2xl font-semibold">{history.length}</p></div></div>
      <div className="max-h-[55vh] overflow-y-auto px-6 pb-6">{history.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-muted-foreground">No distraction sessions recorded yet.</div> : <div className="space-y-2">{history.map((item) => <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{item.courseName}</p><p className="mt-1 text-xs text-muted-foreground">{item.date}</p></div><span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${item.status === "completed" ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}>{item.status === "completed" ? <CheckCircle2 className="size-3" /> : <Clock3 className="size-3" />}{item.status === "completed" ? "Completed" : "Interrupted"}</span></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-black/15 p-2.5"><span className="text-muted-foreground">Planned</span><p className="mt-0.5 font-medium">{formatDuration(item.plannedSeconds)}</p></div><div className="rounded-xl bg-black/15 p-2.5"><span className="text-muted-foreground">Completed</span><p className="mt-0.5 font-medium">{formatDuration(item.completedSeconds)}</p></div></div></div>)}</div>}</div>
    </div>
  </div>;
}

export function recordDistractionSession(entry: Omit<HistoryEntry, "id">) { const history = loadHistory(); history.unshift({ ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` }); localStorage.setItem(KEY, JSON.stringify(history.slice(0, 100))); }
