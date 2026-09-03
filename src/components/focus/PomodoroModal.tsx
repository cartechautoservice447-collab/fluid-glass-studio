import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Check, Pause, Play, RotateCcw, Settings2, Smartphone, X } from "lucide-react";

import {
  StudySessionPanel,
  type StudySessionPattern,
  type StudySessionSegment,
} from "@/components/focus/StudySessionPanel";
import { StudySessionRing } from "@/components/focus/StudySessionRing";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { broadcastRestStart } from "@/lib/pomodoroSync";

type Mode = "focus" | "short" | "long";
type SessionPhase = "working" | "resting";
type PersistedSession = { mode: Mode; phase: SessionPhase; deadline: number; running: boolean };
type StudySessionState = {
  pattern: StudySessionPattern;
  title: string;
  focusMinutes: number;
  schedule: StudySessionSegment[];
  index: number;
  running: boolean;
  deadline: number | null;
};

const DEFAULT_DURATIONS: Record<Mode, number> = { focus: 60, short: 5 * 60, long: 15 * 60 };
const LABELS: Record<Mode, string> = { focus: "Focus", short: "Short Break", long: "Long Break" };
const STORAGE_KEY = "liquid-glass-pomodoro-durations";
const SESSION_KEY = "liquid-glass-pomodoro-session";
const STUDY_SESSION_KEY = "liquid-glass-study-session";
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

function loadStudySession(): StudySessionState | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STUDY_SESSION_KEY) ?? "null");
    if (!saved || !Array.isArray(saved.schedule) || !saved.schedule.length) return null;
    if (!saved.running || typeof saved.deadline !== "number" || saved.deadline <= Date.now()) return null;
    if (!["deep", "balanced", "classic"].includes(saved.pattern)) return null;
    const index = Number.isInteger(saved.index) ? saved.index : 0;
    if (index < 0 || index >= saved.schedule.length) return null;
    return saved as StudySessionState;
  } catch { return null; }
}

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes} min`;
  return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`;
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
  const [studySession, setStudySession] = useState<StudySessionState | null>(null);
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

    const study = loadStudySession();
    if (study) {
      const segment = study.schedule[study.index];
      if (segment) {
        setStudySession(study);
        setView("timer");
        setMode(segment.kind === "focus" ? "focus" : "short");
        setPhase(segment.kind === "focus" ? "working" : "resting");
        setDeadline(study.deadline);
        setRunning(true);
        setLocked(segment.kind === "rest");
        setRemaining(Math.max(0, Math.ceil((((study.deadline ?? Date.now()) - Date.now())) / 1000)));
        return;
      }
    }

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

  const persistStudySession = (next: StudySessionState | null) => {
    if (next) localStorage.setItem(STUDY_SESSION_KEY, JSON.stringify(next));
    else localStorage.removeItem(STUDY_SESSION_KEY);
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
    setStudySession(null);
    persistStudySession(null);
    setView("timer");
    setMode(nextMode);
    setPhase(nextPhase);
    setRemaining(seconds);
    setDeadline(nextDeadline);
    setRunning(true);
    setLocked(nextPhase === "resting");
    persistSession({ mode: nextMode, phase: nextPhase, deadline: nextDeadline, running: true });
  };

  const startStudySession = (input: { pattern: StudySessionPattern; title: string; focusMinutes: number; schedule: StudySessionSegment[] }) => {
    const first = input.schedule[0];
    if (!first) return;
    const nextDeadline = Date.now() + first.minutes * 60 * 1000;
    const nextStudy: StudySessionState = {
      pattern: input.pattern,
      title: input.title,
      focusMinutes: input.focusMinutes,
      schedule: input.schedule,
      index: 0,
      running: true,
      deadline: nextDeadline,
    };

    ensureAudioContext();
    setStudySession(nextStudy);
    persistStudySession(nextStudy);
    persistSession(null);
    setView("timer");
    setSettingsOpen(false);
    setMobileSyncOpen(false);
    setMode(first.kind === "focus" ? "focus" : "short");
    setPhase(first.kind === "focus" ? "working" : "resting");
    setRemaining(first.minutes * 60);
    setDeadline(nextDeadline);
    setRunning(true);
    setLocked(first.kind === "rest");
    if (first.kind === "rest") notifyRestStart(first.minutes * 60);
  };

  const selectMode = (next: Mode) => {
    if (locked) return;
    setStudySession(null);
    persistStudySession(null);
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

      if (studySession) {
        const nextIndex = studySession.index + 1;
        if (nextIndex < studySession.schedule.length) {
          const nextSegment = studySession.schedule[nextIndex];
          if (!nextSegment) return;
          const nextDeadline = Date.now() + nextSegment.minutes * 60 * 1000;
          const nextStudy: StudySessionState = { ...studySession, index: nextIndex, running: true, deadline: nextDeadline };
          setStudySession(nextStudy);
          persistStudySession(nextStudy);
          setMode(nextSegment.kind === "focus" ? "focus" : "short");
          setPhase(nextSegment.kind === "focus" ? "working" : "resting");
          setRemaining(nextSegment.minutes * 60);
          setDeadline(nextDeadline);
          setRunning(true);
          setLocked(nextSegment.kind === "rest");
          if (nextSegment.kind === "rest") notifyRestStart(nextSegment.minutes * 60);
          return;
        }

        setRunning(false);
        setDeadline(null);
        persistStudySession(null);
        setStudySession(null);
        setMode("focus");
        setPhase("working");
        setRemaining(durations.focus);
        setLocked(false);
        persistSession(null);
        return;
      }

      setRunning(false);
      setDeadline(null);
      persistSession(null);
      if (phase === "working") beginRest();
      else {
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
  }, [deadline, durations.focus, phase, restMinutes, running, studySession]);

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
      if (studySession) {
        const paused = { ...studySession, running: false, deadline: null };
        setStudySession(paused);
        persistStudySession(paused);
      }
      persistSession(null);
      return;
    }
    ensureAudioContext();
    if (studySession) {
      const active = studySession.schedule[studySession.index];
      if (!active) return;
      const nextDeadline = Date.now() + remaining * 1000;
      const resumed = { ...studySession, running: true, deadline: nextDeadline };
      setStudySession(resumed);
      persistStudySession(resumed);
      setDeadline(nextDeadline);
      setRunning(true);
      setLocked(active.kind === "rest");
      return;
    }
    startSession(mode);
  };

  const reset = () => {
    if (locked) return;
    setStudySession(null);
    persistStudySession(null);
    setRunning(false);
    setDeadline(null);
    setPhase("working");
    setMode("focus");
    setRemaining(durations.focus);
    setLocked(false);
    persistSession(null);
  };

  const newStudySession = () => {
    setStudySession(null);
    persistStudySession(null);
    setRunning(false);
    setDeadline(null);
    setLocked(false);
    setMode("focus");
    setPhase("working");
    setRemaining(durations.focus);
    setView("study");
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

  const studyComplete = studySession && !studySession.running && studySession.index >= studySession.schedule.length - 1 && remaining === 0;
  const currentStudySegment = studySession?.schedule[studySession.index];

  return (
    <>
      <Dialog open={open && !locked} onOpenChange={onOpenChange}>
        <DialogContent className={`${view === "study" ? "max-w-2xl" : "max-w-2xl"} overflow-hidden rounded-[28px] border-white/20 bg-black/35 p-0 text-foreground shadow-2xl backdrop-blur-2xl [&>button]:hidden`}>
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

              {view === "study" ? (
                <StudySessionPanel onStartSession={startStudySession} />
              ) : (
                <>
                  {studySession && (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{studySession.title}</p>
                          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">Pomodoro is running this study session.</p>
                        </div>
                        <button type="button" onClick={newStudySession} className="shrink-0 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[10px] text-muted-foreground hover:bg-white/10">Change session</button>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Study focus</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">{formatDuration(studySession.focusMinutes)}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Total rest</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">{formatDuration(studySession.schedule.filter((segment) => segment.kind === "rest").reduce((sum, segment) => sum + segment.minutes, 0))}</p>
                        </div>
                      </div>

                      <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-5 text-center">
                        <StudySessionRing segment={currentStudySegment} remaining={remaining} />
                        <p className="mt-2 text-[11px] text-muted-foreground">Block {Math.min(studySession.index + 1, studySession.schedule.length)} of {studySession.schedule.length}</p>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {studySession.schedule.map((segment, index) => {
                          const isCurrent = index === studySession.index && studySession.running;
                          const isPast = index < studySession.index || (index === studySession.index && studyComplete);
                          return (
                            <div key={`${segment.label}-${index}`} className={`rounded-xl border p-3 transition ${isCurrent ? "border-white/40 bg-white/10" : isPast ? "border-white/10 bg-white/[0.025] opacity-55" : "border-white/10 bg-black/15"}`}>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className={`flex size-7 items-center justify-center rounded-lg ${segment.kind === "focus" ? "bg-foreground/80 text-background" : "bg-white/15 text-foreground"}`}>
                                    {isPast ? <Check className="size-3.5" /> : <span className="text-[9px] font-semibold">{index + 1}</span>}
                                  </span>
                                  <div><p className="text-xs font-medium text-foreground">{segment.label}</p><p className="text-[9px] text-muted-foreground">{segment.minutes} min</p></div>
                                </div>
                                <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{isCurrent ? "Now" : isPast ? "Done" : "Next"}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <Button type="button" variant="secondary" onClick={reset}><RotateCcw className="mr-2 size-3.5" />Reset</Button>
                        <Button type="button" variant="outline" onClick={toggleRunning} className="col-span-2">{running ? <Pause className="mr-2 size-3.5" /> : <Play className="mr-2 size-3.5" />}{running ? "Pause session" : "Resume session"}</Button>
                      </div>
                    </div>
                  )}

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

                  {!studySession && !studyComplete && (
                    <>
                      <div className="mt-4 grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-white/[0.045] p-1">
                        {(Object.keys(LABELS) as Mode[]).map((item) => <button key={item} type="button" onClick={() => selectMode(item)} className={`rounded-xl px-2 py-2 text-xs font-medium transition ${mode === item ? "bg-white/15 text-foreground shadow-sm" : "text-muted-foreground hover:bg-white/10 hover:text-foreground"}`}>{LABELS[item]}</button>)}
                      </div>

                      <div className="flex flex-col items-center py-10"><div className="text-7xl font-semibold tabular-nums tracking-[-0.05em] text-foreground sm:text-8xl" aria-live="polite">{formatted}</div><p className="mt-3 text-sm text-muted-foreground">{running ? "Stay focused" : "Ready when you are"}</p></div>

                      <div className="flex items-center justify-center gap-3"><Button variant="ghost" size="icon" className="size-11 rounded-full bg-white/[0.06] hover:bg-white/10" onClick={reset} aria-label="Reset timer"><RotateCcw className="size-4" /></Button><Button size="lg" className="h-12 rounded-full px-7 shadow-lg" onClick={toggleRunning}>{running ? <Pause className="mr-2 size-4" /> : <Play className="mr-2 size-4" />}{running ? "Pause" : "Start"}</Button></div>
                    </>
                  )}

                  {studyComplete && (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.045] p-5 text-center">
                      <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-white/10"><Check className="size-5" /></div>
                      <p className="mt-3 text-sm font-semibold">Study session complete</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">Your selected Focus blocks are complete.</p>
                      <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={newStudySession}>Start another study session</Button>
                    </div>
                  )}
                </>
              )}
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
