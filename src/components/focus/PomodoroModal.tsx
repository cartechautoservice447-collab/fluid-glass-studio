import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Pause, Play, RotateCcw, Settings2, Smartphone, X } from "lucide-react";

import { StudySessionPanel } from "@/components/focus/StudySessionPanel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { broadcastRestStart } from "@/lib/pomodoroSync";

type Mode = "focus" | "short" | "long";
type SessionPhase = "working" | "resting";
type PersistedSession = { mode: Mode; phase: SessionPhase; deadline: number; running: boolean };

const DEFAULT_DURATIONS: Record<Mode, number> = { focus: 60, short: 5 * 60, long: 15 * 60 };
const LABELS: Record<Mode, string> = { focus: "Focus", short: "Short Break", long: "Long Break" };
const STORAGE_KEY = "liquid-glass-pomodoro-durations";
const SESSION_KEY = "liquid-glass-pomodoro-session";
const FLASH_TITLE = "⏰ Break Time!";

function loadDurations(): Record<Mode, number> {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    return {
      focus: Number.isFinite(saved?.focus) && saved.focus > 0 ? saved.focus : DEFAULT_DURATIONS.focus,
      short: Number.isFinite(saved?.short) && saved.short > 0 ? saved.short : DEFAULT_DURATIONS.short,
      long: Number.isFinite(saved?.long) && saved.long > 0 ? saved.long : DEFAULT_DURATIONS.long,
    };
  } catch { return DEFAULT_DURATIONS; }
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function loadSession(): PersistedSession | null {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null");
    if (!saved || !["focus", "short", "long"].includes(saved.mode) || !["working", "resting"].includes(saved.phase)) return null;
    return saved;
  } catch { return null; }
}

export function PomodoroModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user } = useAuth();
  const [durations, setDurations] = useState(DEFAULT_DURATIONS);
  const [mode, setMode] = useState<Mode>("focus");
  const [view, setView] = useState<"timer" | "study">("timer");
  const [phase, setPhase] = useState<SessionPhase>("working");
  const [remaining, setRemaining] = useState(DEFAULT_DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileSyncOpen, setMobileSyncOpen] = useState(false);
  const [focusMinutes, setFocusMinutes] = useState(1);
  const [restMinutes, setRestMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);
  const [locked, setLocked] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");

  const audioCtxRef = useRef<AudioContext | null>(null);
  const originalTitleRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    originalTitleRef.current = document.title;
    if (!("Notification" in window)) {
      setNotifPermission("unsupported");
      return;
    }
    setNotifPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (!open) return;
    const saved = loadDurations();
    setDurations(saved);
    setFocusMinutes(Math.max(1, Math.round(saved.focus / 60)));
    setRestMinutes(Math.max(1, Math.round(saved.short / 60)));
    setLongBreakMinutes(Math.max(1, Math.round(saved.long / 60)));

    const session = loadSession();
    if (session?.running && session.deadline > Date.now()) {
      setView("timer");
      setMode(session.mode);
      setPhase(session.phase);
      setDeadline(session.deadline);
      setRunning(true);
      setLocked(session.phase === "resting" || session.mode !== "focus");
      setRemaining(Math.max(0, Math.ceil((session.deadline - Date.now()) / 1000)));
    }
  }, [open]);

  const persistDurations = (next: Record<Mode, number>) => {
    setDurations(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const persistSession = (next: PersistedSession | null) => {
    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else localStorage.removeItem(SESSION_KEY);
  };

  const ensureAudioContext = () => {
    if (typeof window === "undefined") return null;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume().catch(() => {});
    return audioCtxRef.current;
  };

  const playChime = () => {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.22);
      gain.gain.exponentialRampToValueAtTime(0.35, now + i * 0.22 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.22 + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.22);
      osc.stop(now + i * 0.22 + 0.34);
    });
  };

  const enableAlerts = () => {
    ensureAudioContext();
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((result) => setNotifPermission(result)).catch(() => {});
    }
  };

  const notifyRestStart = (seconds: number) => {
    playChime();
    if (user?.id) void broadcastRestStart(user.id, Math.max(1, Math.round(seconds / 60)));
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;
    try {
      const n = new Notification("Break time!", {
        body: `Time to rest for ${Math.round(seconds / 60)} min. Step away from the screen.`,
        icon: "/pwa-icon-192.svg",
        tag: "liquid-glass-pomodoro-rest",
        renotify: true,
      });
      n.onclick = () => { window.focus(); n.close(); };
    } catch {
      /* Notification constructor can throw on some platforms — sound/title flash still cover it. */
    }
  };

  const startSession = (nextMode: Mode) => {
    const nextPhase: SessionPhase = nextMode === "focus" ? "working" : "resting";
    const seconds = durations[nextMode];
    const nextDeadline = Date.now() + seconds * 1000;
    setView("timer");
    setMode(nextMode);
    setPhase(nextPhase);
    setRemaining(seconds);
    setDeadline(nextDeadline);
    setRunning(true);
    setLocked(nextPhase === "resting");
    persistSession({ mode: nextMode, phase: nextPhase, deadline: nextDeadline, running: true });
  };

  const selectMode = (next: Mode) => {
    if (locked) return;
    setView("timer");
    setMode(next);
    setPhase(next === "focus" ? "working" : "resting");
    setRemaining(durations[next]);
    setRunning(false);
    setDeadline(null);
    setLocked(next !== "focus");
    persistSession(null);
  };

  const beginRest = () => {
    const restSeconds = Math.max(1, restMinutes) * 60;
    const next = { ...durations, short: restSeconds };
    persistDurations(next);
    const nextDeadline = Date.now() + restSeconds * 1000;
    setView("timer");
    setMode("short");
    setPhase("resting");
    setRemaining(restSeconds);
    setLocked(true);
    setDeadline(nextDeadline);
    setRunning(true);
    persistSession({ mode: "short", phase: "resting", deadline: nextDeadline, running: true });
    notifyRestStart(restSeconds);
  };

  useEffect(() => {
    if (!running || deadline === null) return;
    const tick = () => {
      const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(next);
      if (next !== 0) return;
      setRunning(false);
      setDeadline(null);
      persistSession(null);
      if (phase === "working") {
        beginRest();
      } else {
        setPhase("working");
        setMode("focus");
        setRemaining(durations.focus);
        setLocked(false);
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    const onVisibility = () => tick();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [running, deadline, phase, durations.focus, restMinutes, user?.id]);

  useEffect(() => {
    if (phase !== "resting" || !running) {
      document.title = originalTitleRef.current;
      return;
    }
    let flashOn = false;
    const flashTitle = () => {
      if (!document.hidden) {
        document.title = originalTitleRef.current;
        return;
      }
      flashOn = !flashOn;
      document.title = flashOn ? FLASH_TITLE : originalTitleRef.current;
    };
    flashTitle();
    const id = window.setInterval(flashTitle, 1000);
    return () => {
      window.clearInterval(id);
      document.title = originalTitleRef.current;
    };
  }, [phase, running]);

  const formatted = useMemo(() => formatTime(remaining), [remaining]);

  const toggleRunning = () => {
    if (locked) return;
    if (running) {
      setRunning(false);
      setDeadline(null);
      persistSession(null);
      return;
    }
    ensureAudioContext();
    startSession(mode);
  };

  const reset = () => {
    if (locked) return;
    setRunning(false);
    setDeadline(null);
    setPhase("working");
    setMode("focus");
    setRemaining(durations.focus);
    setLocked(false);
    persistSession(null);
  };

  const changeDuration = (durationMode: Mode, value: number) => {
    const safe = Math.min(120, Math.max(1, Math.round(value)));
    const next = { ...durations, [durationMode]: safe * 60 };
    persistDurations(next);
    if (durationMode === "focus") setFocusMinutes(safe);
    if (durationMode === "short") setRestMinutes(safe);
    if (durationMode === "long") setLongBreakMinutes(safe);
    if (!running && !locked && mode === durationMode) setRemaining(safe * 60);
  };

  return (
    <>
      <Dialog open={open && !locked} onOpenChange={onOpenChange}>
        <DialogContent className={`${view === "study" ? "max-w-2xl" : "max-w-md"} overflow-hidden rounded-[28px] border-white/20 bg-black/35 p-0 text-foreground shadow-2xl backdrop-blur-2xl [&>button]:hidden`}>
          <div className="relative p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-20 -top-24 size-56 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <DialogTitle className="text-lg font-semibold tracking-tight">Pomodoro</DialogTitle>
                <div className="flex items-center gap-1">
                  {view === "timer" && <Button variant="ghost" size="icon" className={`rounded-full ${mobileSyncOpen ? "bg-white/12 text-foreground" : "text-muted-foreground"} hover:bg-white/10`} onClick={() => setMobileSyncOpen((value) => !value)} aria-label="Mobile Pomodoro sync" aria-expanded={mobileSyncOpen} title="Mobile Pomodoro sync"><Bell className="size-4" /></Button>}
                  {view === "timer" && <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-white/10" onClick={() => setSettingsOpen((value) => !value)} aria-label="Pomodoro settings"><Settings2 className="size-4" /></Button>}
                  <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-white/10" onClick={() => onOpenChange(false)} aria-label="Close Pomodoro"><X className="size-4" /></Button>
                </div>
              </div>

              {mobileSyncOpen && view === "timer" && (
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-lg backdrop-blur-xl">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]"><Smartphone className="size-4" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">Mobile Pomodoro Sync</p>
                      <p className="mt-1 text-[11px] leading-5 text-muted-foreground">Open this website on your phone and sign in to the same account. When this timer starts a rest period, your mobile site receives the rest-time alert.</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Device alerts</span>
                    {notifPermission === "granted" ? <span className="text-xs font-medium text-foreground">Enabled</span> : notifPermission === "unsupported" ? <span className="text-xs text-muted-foreground">Unsupported</span> : <button type="button" onClick={enableAlerts} className="rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-[10px] font-medium text-foreground hover:bg-white/15">Enable on this device</button>}
                  </div>
                  <p className="mt-2 text-[10px] text-muted-foreground">No notes or note content are sent — only the rest duration.</p>
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.045] p-1">
                <button type="button" onClick={() => { setView("timer"); setMobileSyncOpen(false); }} className={`rounded-lg px-3 py-2 text-xs font-medium transition ${view === "timer" ? "bg-white/15 text-foreground shadow-sm" : "text-muted-foreground hover:bg-white/10 hover:text-foreground"}`}>Pomodoro Timer</button>
                <button type="button" onClick={() => { if (!locked) { setView("study"); setSettingsOpen(false); setMobileSyncOpen(false); } }} className={`rounded-lg px-3 py-2 text-xs font-medium transition ${view === "study" ? "bg-white/15 text-foreground shadow-sm" : "text-muted-foreground hover:bg-white/10 hover:text-foreground"}`}>Study Session</button>
              </div>

              {view === "study" ? <StudySessionPanel /> : <>
                {settingsOpen && (
                  <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <p className="text-sm font-medium">Edit Pomodoro time</p>
                    <div className="grid grid-cols-3 gap-2">
                      {([["focus", "Focus", focusMinutes], ["short", "Short Break", restMinutes], ["long", "Long Break", longBreakMinutes]] as const).map(([item, label, value]) => (
                        <label key={item} className="rounded-xl border border-white/10 bg-black/20 p-2">
                          <span className="block text-[11px] text-muted-foreground">{label}</span>
                          <div className="mt-1 flex items-center gap-1"><input aria-label={`${label} minutes`} type="number" min={1} max={120} value={value} onChange={(event) => changeDuration(item, Number(event.target.value))} className="w-full min-w-0 bg-transparent text-sm font-medium outline-none" /><span className="text-[10px] text-muted-foreground">min</span></div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-white/[0.045] p-1">
                  {(Object.keys(LABELS) as Mode[]).map((item) => <button key={item} type="button" onClick={() => selectMode(item)} className={`rounded-xl px-2 py-2 text-xs font-medium transition ${mode === item ? "bg-white/15 text-foreground shadow-sm" : "text-muted-foreground hover:bg-white/10 hover:text-foreground"}`}>{LABELS[item]}</button>)}
                </div>

                <div className="flex flex-col items-center py-10"><div className="text-7xl font-semibold tabular-nums tracking-[-0.05em] text-foreground sm:text-8xl" aria-live="polite">{formatted}</div><p className="mt-3 text-sm text-muted-foreground">{running ? "Stay focused" : "Ready when you are"}</p></div>

                <div className="flex items-center justify-center gap-3"><Button variant="ghost" size="icon" className="size-11 rounded-full bg-white/[0.06] hover:bg-white/10" onClick={reset} aria-label="Reset timer"><RotateCcw className="size-4" /></Button><Button size="lg" className="h-12 rounded-full px-7 shadow-lg" onClick={toggleRunning}>{running ? <Pause className="mr-2 size-4" /> : <Play className="mr-2 size-4" />}{running ? "Pause" : "Start"}</Button></div>
              </>}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {locked && <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-hidden bg-black/60 p-5 backdrop-blur-xl" role="dialog" aria-modal="true" aria-label="Rest period in progress">
        <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-primary/20 blur-3xl" /><div className="pointer-events-none absolute -bottom-28 -right-20 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="relative w-full max-w-lg rounded-[32px] border border-white/20 bg-black/35 p-7 text-center shadow-2xl backdrop-blur-2xl sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Rest session</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Website locked</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Your notes, course folders, dashboard, and workspace are unavailable until the rest timer finishes.</p>
          <div className="mt-9 text-7xl font-semibold tabular-nums tracking-[-0.05em] sm:text-8xl">{formatted}</div>
          <p className="mt-3 text-sm text-muted-foreground">Rest time remaining</p>
        </div>
      </div>}
    </>
  );
}
