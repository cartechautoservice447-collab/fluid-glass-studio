import { Bell, Monitor, Zap, X } from "lucide-react";
import { useEffect, useState } from "react";

const PERFORMANCE_KEY = "liquid-glass-performance-mode";
const REMINDER_KEY = "liquid-glass-reminders";

type Reminder = { id: string; title: string; at: string };

export function ReminderCenter({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [performance, setPerformance] = useState(() => localStorage.getItem(PERFORMANCE_KEY) ?? "high");
  const [notifications, setNotifications] = useState(() => typeof Notification !== "undefined" && Notification.permission === "granted");
  const [title, setTitle] = useState("");
  const [at, setAt] = useState("");
  const [reminders, setReminders] = useState<Reminder[]>(() => { try { return JSON.parse(localStorage.getItem(REMINDER_KEY) ?? "[]"); } catch { return []; } });

  useEffect(() => { document.documentElement.dataset.glassPerformance = performance; localStorage.setItem(PERFORMANCE_KEY, performance); }, [performance]);
  useEffect(() => { localStorage.setItem(REMINDER_KEY, JSON.stringify(reminders)); }, [reminders]);
  useEffect(() => { const timer = window.setInterval(() => { const now = Date.now(); const due = reminders.filter(r => new Date(r.at).getTime() <= now); if (!due.length) return; due.forEach(r => { if (notifications && typeof Notification !== "undefined") new Notification("Glass Notes", { body: r.title }); }); setReminders(prev => prev.filter(r => new Date(r.at).getTime() > now)); }, 1000); return () => window.clearInterval(timer); }, [reminders, notifications]);

  if (!open) return null;
  const enableNotifications = async () => { if (typeof Notification === "undefined") return; const permission = await Notification.requestPermission(); setNotifications(permission === "granted"); };
  const addReminder = () => { if (!title.trim() || !at) return; setReminders(prev => [...prev, { id: crypto.randomUUID(), title: title.trim(), at }].sort((a,b) => a.at.localeCompare(b.at))); setTitle(""); setAt(""); };

  return <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/45 p-5 backdrop-blur-md"><div className="w-full max-w-lg rounded-[30px] border border-white/20 bg-black/45 p-6 text-foreground shadow-2xl backdrop-blur-2xl">
    <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Bell className="size-5"/><div><h2 className="text-lg font-semibold">Reminders & Performance</h2><p className="text-xs text-muted-foreground">Notifications and Glass engine performance</p></div></div><button onClick={() => onOpenChange(false)} aria-label="Close"><X className="size-4"/></button></div>
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.04] p-4"><div className="flex items-center gap-2"><Zap className="size-4"/><p className="font-semibold">Adaptive Engine Performance</p></div><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => setPerformance("high")} className={`rounded-xl border p-3 text-left ${performance === "high" ? "border-white/40 bg-white/10" : "border-white/10 bg-white/[.03]"}`}><b>High</b><span className="mt-1 block text-xs text-muted-foreground">Default balanced mode</span></button><button onClick={() => setPerformance("ultra")} className={`rounded-xl border p-3 text-left ${performance === "ultra" ? "border-white/40 bg-white/10" : "border-white/10 bg-white/[.03]"}`}><b>Ultra</b><span className="mt-1 block text-xs text-muted-foreground">Maximum visual effects</span></button></div></div>
    <div className="mt-3 rounded-2xl border border-white/10 bg-white/[.04] p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Monitor className="size-4"/><b>Desktop notifications</b></div><button onClick={enableNotifications} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs">{notifications ? "Enabled" : "Enable"}</button></div></div>
    <div className="mt-3 rounded-2xl border border-white/10 bg-white/[.04] p-4"><b className="text-sm">Add reminder</b><div className="mt-3 grid gap-2"><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Reminder title" className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"/><input type="datetime-local" value={at} onChange={e => setAt(e.target.value)} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"/><button onClick={addReminder} className="rounded-xl bg-white/10 px-3 py-2 text-sm font-medium">Add reminder</button></div></div>
    {reminders.length > 0 && <div className="mt-3 space-y-2">{reminders.map(r => <div key={r.id} className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-xs"><span>{r.title}</span><span className="text-muted-foreground">{new Date(r.at).toLocaleString()}</span></div>)}</div>}
  </div></div>;
}
