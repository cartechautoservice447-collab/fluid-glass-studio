import { useEffect, useMemo, useState } from "react";
import { Bell, BellRing, Check, Clock3, Gauge, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Reminder = { id: string; title: string; when: number; createdAt: number; notified?: boolean };
type PerformanceMode = "high" | "ultra";
const KEY = "liquid-glass-study-reminders";
const PERFORMANCE_KEY = "liquid-glass-performance-mode";

function load(): Reminder[] { try { const value = JSON.parse(localStorage.getItem(KEY) ?? "[]"); return Array.isArray(value) ? value : []; } catch { return []; } }
function save(value: Reminder[]) { localStorage.setItem(KEY, JSON.stringify(value)); }
function formatWhen(timestamp: number) { return new Date(timestamp).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }); }
function loadPerformance(): PerformanceMode { return localStorage.getItem(PERFORMANCE_KEY) === "ultra" ? "ultra" : "high"; }

export function GlassReminderCenter() {
  const [open, setOpen] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [popup, setPopup] = useState<Reminder | null>(null);
  const [performance, setPerformance] = useState<PerformanceMode>(() => loadPerformance());

  useEffect(() => { setReminders(load()); if ("Notification" in window) setPermission(Notification.permission); }, []);
  useEffect(() => { document.documentElement.dataset.glassPerformance = performance; localStorage.setItem(PERFORMANCE_KEY, performance); return () => { delete document.documentElement.dataset.glassPerformance; }; }, [performance]);

  useEffect(() => {
    const check = () => {
      const now = Date.now();
      const current = load();
      let changed = false;
      const next = current.map((item) => {
        if (!item.notified && item.when <= now) {
          changed = true;
          const notificationText = `${item.title} is due now.`;
          if ("Notification" in window && Notification.permission === "granted") new Notification("Glass Notes", { body: notificationText, tag: item.id });
          setPopup(item);
          return { ...item, notified: true };
        }
        return item;
      });
      if (changed) { save(next); setReminders(next); }
    };
    check();
    const id = window.setInterval(check, 1000);
    return () => window.clearInterval(id);
  }, []);

  const upcoming = useMemo(() => reminders.filter((item) => item.when > Date.now()).sort((a, b) => a.when - b.when), [reminders]);
  const enableDesktop = async () => { if (!("Notification" in window)) return; const result = await Notification.requestPermission(); setPermission(result); };
  const addReminder = () => { const timestamp = new Date(when).getTime(); if (!title.trim() || !Number.isFinite(timestamp) || timestamp <= Date.now()) return; const next = [{ id: crypto.randomUUID(), title: title.trim(), when: timestamp, createdAt: Date.now() }, ...load()]; save(next); setReminders(next); setTitle(""); setWhen(""); };
  const removeReminder = (id: string) => { const next = load().filter((item) => item.id !== id); save(next); setReminders(next); };

  return <>
    <div className="fixed bottom-5 right-5 z-[80]"><Button type="button" size="icon" onClick={() => setOpen((value) => !value)} className="size-12 rounded-full border border-white/20 bg-white/10 text-foreground shadow-xl backdrop-blur-xl hover:bg-white/15" aria-label="Study reminders">{upcoming.length ? <BellRing className="size-5" /> : <Bell className="size-5" />}</Button></div>

    {open && <div className="fixed bottom-20 right-5 z-[81] w-[min(380px,calc(100vw-40px))] overflow-hidden rounded-[28px] border border-white/20 bg-black/40 text-foreground shadow-2xl backdrop-blur-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div><p className="font-semibold">Study Reminders</p><p className="text-[11px] text-muted-foreground">Glass alerts + laptop notifications</p></div><button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-muted-foreground hover:bg-white/10" aria-label="Close reminders"><X className="size-4" /></button></div>
      <div className="p-4">
        <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3"><div className="mb-2 flex items-center gap-2"><Gauge className="size-4" /><p className="text-xs font-semibold">Performance</p></div><p className="mb-2 text-[11px] text-muted-foreground">Controls the intensity of Glass animations and visual effects.</p><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setPerformance("high")} className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${performance === "high" ? "border-white/30 bg-white/15" : "border-white/10 bg-white/[0.03] text-muted-foreground"}`}>High<span className="block text-[10px] font-normal opacity-70">Balanced</span></button><button type="button" onClick={() => setPerformance("ultra")} className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${performance === "ultra" ? "border-white/30 bg-white/15" : "border-white/10 bg-white/[0.03] text-muted-foreground"}`}>Ultra<span className="block text-[10px] font-normal opacity-70">Maximum effects</span></button></div></div>
        {permission !== "granted" && <button type="button" onClick={enableDesktop} className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-xs font-medium hover:bg-white/10"><BellRing className="size-4" /> {permission === "denied" ? "Browser notifications blocked" : "Enable laptop notifications"}</button>}
        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3"><p className="text-xs font-semibold">New reminder</p><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Revise Economics" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-xs outline-none placeholder:text-muted-foreground" /><input type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-xs outline-none" /><Button type="button" onClick={addReminder} className="mt-2 w-full rounded-xl">Set reminder</Button></div>
        <div className="mt-4"><p className="mb-2 text-xs font-semibold">Upcoming</p>{upcoming.length === 0 ? <p className="rounded-2xl border border-dashed border-white/10 p-4 text-center text-xs text-muted-foreground">No reminders scheduled.</p> : <div className="space-y-2">{upcoming.slice(0, 8).map((item) => <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3"><Clock3 className="size-4 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{item.title}</p><p className="text-[10px] text-muted-foreground">{formatWhen(item.when)}</p></div><button type="button" onClick={() => removeReminder(item.id)} className="rounded-full p-1.5 text-muted-foreground hover:bg-white/10" aria-label="Delete reminder"><X className="size-3.5" /></button></div>)}</div>}</div>
      </div>
    </div>}

    {popup && <div className={`fixed right-5 top-5 z-[120] w-[min(380px,calc(100vw-40px))] ${performance === "ultra" ? "animate-in slide-in-from-right-4 fade-in" : "animate-in fade-in"} rounded-[24px] border border-white/20 bg-black/40 p-4 text-foreground shadow-2xl backdrop-blur-2xl`} role="alert"><div className="flex items-start gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.08]"><BellRing className="size-5" /></div><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-muted-foreground">Study Reminder</p><p className="mt-1 text-sm font-semibold">{popup.title}</p><p className="mt-1 text-xs text-muted-foreground">Your reminder is due now.</p></div><button type="button" onClick={() => setPopup(null)} className="rounded-full p-1.5 text-muted-foreground hover:bg-white/10" aria-label="Dismiss reminder"><X className="size-3.5" /></button></div><button type="button" onClick={() => setPopup(null)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2 text-xs font-medium hover:bg-white/15"><Check className="size-3.5" /> Dismiss</button></div>}
  </>;
}
