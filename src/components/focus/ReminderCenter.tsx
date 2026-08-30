import { Bell, BookOpen, Monitor, Zap, X } from "lucide-react";
import { useEffect, useState } from "react";

const PERFORMANCE_KEY = "liquid-glass-performance-mode";
const REMINDER_KEY = "liquid-glass-reminders";
const NOTIFICATION_KEY = "liquid-glass-desktop-notifications";
const PERFORMANCE_EVENT = "glass-performance-changed";
type Reminder = { id: string; title: string; at: string };

const CS50_LINKS = [
  { label: "cs50.harvard.edu", url: "https://cs50.harvard.edu" },
  { label: "cs50.dev", url: "https://cs50.dev" },
  { label: "cs50.ai", url: "https://cs50.ai" },
];

function readReminders(): Reminder[] { try { const value = JSON.parse(localStorage.getItem(REMINDER_KEY) ?? "[]"); return Array.isArray(value) ? value : []; } catch { return []; } }

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function ReminderCenter({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [performance, setPerformance] = useState(() => localStorage.getItem(PERFORMANCE_KEY) ?? "high");
  const [notifications, setNotifications] = useState(() => localStorage.getItem(NOTIFICATION_KEY) === "true" && typeof Notification !== "undefined" && Notification.permission === "granted");
  const [title, setTitle] = useState("");
  const [at, setAt] = useState("");
  const [reminders, setReminders] = useState<Reminder[]>(readReminders);
  const [browserUrl, setBrowserUrl] = useState(CS50_LINKS[0].url);
  const [urlInput, setUrlInput] = useState(CS50_LINKS[0].url);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => { localStorage.setItem(PERFORMANCE_KEY, performance); document.documentElement.dataset['glassPerformance'] = performance; window.dispatchEvent(new CustomEvent(PERFORMANCE_EVENT, { detail: performance })); }, [performance]);
  useEffect(() => { localStorage.setItem(REMINDER_KEY, JSON.stringify(reminders)); }, [reminders]);
  useEffect(() => { localStorage.setItem(NOTIFICATION_KEY, String(notifications)); }, [notifications]);
  useEffect(() => {
    const onExternalChange = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail && detail !== performance) setPerformance(detail);
    };
    window.addEventListener(PERFORMANCE_EVENT, onExternalChange);
    return () => window.removeEventListener(PERFORMANCE_EVENT, onExternalChange);
  }, [performance]);
  useEffect(() => { const timer = window.setInterval(() => { const now = Date.now(); const due = reminders.filter(r => new Date(r.at).getTime() <= now); if (!due.length) return; due.forEach(r => { if (notifications && typeof Notification !== "undefined" && Notification.permission === "granted") new Notification("Glass Notes", { body: r.title }); }); setReminders(prev => prev.filter(r => new Date(r.at).getTime() > now)); }, 1000); return () => window.clearInterval(timer); }, [reminders, notifications]);

  if (!open) return null;
  const enableNotifications = async () => { if (typeof Notification === "undefined") return; const permission = await Notification.requestPermission(); const enabled = permission === "granted"; setNotifications(enabled); localStorage.setItem(NOTIFICATION_KEY, String(enabled)); };
  const addReminder = () => { if (!title.trim() || !at) return; setReminders(prev => [...prev, { id: crypto.randomUUID(), title: title.trim(), at }].sort((a,b) => a.at.localeCompare(b.at))); setTitle(""); setAt(""); };
  const loadUrl = (raw: string) => { const normalized = normalizeUrl(raw); if (!normalized) return; setBrowserUrl(normalized); setUrlInput(normalized); setIframeKey((k) => k + 1); };

  return <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/45 p-5 backdrop-blur-md"><div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[30px] border border-white/20 bg-black/45 p-6 text-foreground shadow-2xl backdrop-blur-2xl">
    <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Bell className="size-5"/><div><h2 className="text-lg font-semibold">Study Hub</h2><p className="text-xs text-muted-foreground">Reminders, performance & lectures — saved automatically</p></div></div><button onClick={() => onOpenChange(false)} aria-label="Close"><X className="size-4"/></button></div>
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.04] p-4"><div className="flex items-center gap-2"><Zap className="size-4"/><p className="font-semibold">Adaptive Engine Performance</p></div><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => setPerformance("high")} className={`rounded-xl border p-3 text-left ${performance === "high" ? "border-white/40 bg-white/10" : "border-white/10 bg-white/[.03]"}`}><b>High</b><span className="mt-1 block text-xs text-muted-foreground">Default balanced mode</span></button><button onClick={() => setPerformance("ultra")} className={`rounded-xl border p-3 text-left ${performance === "ultra" ? "border-white/40 bg-white/10" : "border-white/10 bg-white/[.03]"}`}><b>Ultra</b><span className="mt-1 block text-xs text-muted-foreground">Maximum visual effects</span></button></div><p className="mt-2 text-[11px] text-muted-foreground">Current setting: <span className="font-medium text-foreground">{performance === "ultra" ? "Ultra" : "High"}</span> · saved automatically</p></div>
    <div className="mt-3 rounded-2xl border border-white/10 bg-white/[.04] p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Monitor className="size-4"/><b>Desktop notifications</b></div><button onClick={enableNotifications} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs">{notifications ? "Enabled" : "Enable"}</button></div><p className="mt-2 text-[11px] text-muted-foreground">Notification preference is saved automatically.</p></div>
    <div className="mt-3 rounded-2xl border border-white/10 bg-white/[.04] p-4">
      <div className="flex items-center gap-2"><BookOpen className="size-4"/><p className="font-semibold">CS50 Lectures</p></div>
      <div className="mt-3 flex flex-wrap gap-2">{CS50_LINKS.map((link) => <button key={link.url} onClick={() => loadUrl(link.url)} className={`rounded-xl border px-3 py-1.5 text-xs font-medium ${browserUrl === link.url ? "border-white/40 bg-white/15" : "border-white/10 bg-white/[.03] text-muted-foreground"}`}>{link.label}</button>)}</div>
      <div className="mt-3 flex items-center gap-2"><input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") loadUrl(urlInput); }} placeholder="Paste any lecture URL" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs outline-none" /><button onClick={() => loadUrl(urlInput)} className="shrink-0 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium">Go</button></div>
      <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/40"><iframe key={iframeKey} src={browserUrl} title="CS50 lecture viewer" className="h-72 w-full" sandbox="allow-scripts allow-same-origin allow-popups allow-forms" /></div>
      <p className="mt-2 text-[10px] text-muted-foreground">Some sites block being shown inside another site for security — if the box stays blank, use "Open in new tab" below.</p>
      <a href={browserUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[10px] text-muted-foreground underline">Open in new tab</a>
    </div>
    <div className="mt-3 rounded-2xl border border-white/10 bg-white/[.04] p-4"><b className="text-sm">Add reminder</b><div className="mt-3 grid gap-2"><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Reminder title" className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"/><input type="datetime-local" value={at} onChange={e => setAt(e.target.value)} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"/><button onClick={addReminder} className="rounded-xl bg-white/10 px-3 py-2 text-sm font-medium">Save reminder</button></div></div>
    {reminders.length > 0 && <div className="mt-3 space-y-2">{reminders.map(r => <div key={r.id} className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-xs"><span>{r.title}</span><span className="text-muted-foreground">{new Date(r.at).toLocaleString()}</span></div>)}</div>}
  </div></div>;
}
