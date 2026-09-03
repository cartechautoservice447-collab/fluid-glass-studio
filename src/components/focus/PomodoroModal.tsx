import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Clock3, Coffee, Flame, Pause, Play, RotateCcw, Settings2, SkipForward, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { StudySessionPanel, type StudySessionPattern, type StudySessionSegment } from "@/components/focus/StudySessionPanel";
import { StudySessionRing } from "@/components/focus/StudySessionRing";
import { GlassPanel } from "@/components/liquid/GlassPanel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { broadcastRestStart } from "@/lib/pomodoroSync";
import { cn } from "@/lib/utils";

type Mode = "focus" | "short-break" | "long-break";
type SessionPhase = "working" | "resting";
type PersistedSession = { mode: Mode; phase: SessionPhase; deadline: number; running: boolean };
type StudySessionState = { pattern: StudySessionPattern; title: string; focusMinutes: number; schedule: StudySessionSegment[]; index: number; running: boolean; deadline: number | null; remaining?: number; pendingStart?: boolean };
type PomodoroSettings = { focusMinutes: number; shortBreakMinutes: number; longBreakMinutes: number; sessionsUntilLongBreak: number; soundEnabled: boolean };

const SETTINGS_KEY = "liquid-glass-pomodoro-settings-v1";
const SESSION_KEY = "liquid-glass-pomodoro-session";
const STUDY_SESSION_KEY = "liquid-glass-study-session";
const FLASH_TITLE = "⏰ Break Time!";
const DEFAULT_SETTINGS: PomodoroSettings = { focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, sessionsUntilLongBreak: 4, soundEnabled: true };
const MODE_META: Record<Mode, { label: string; icon: typeof Flame; ring: string; glow: string }> = {
  focus: { label: "Focus", icon: Flame, ring: "oklch(0.75 0.19 250)", glow: "oklch(0.62 0.18 250)" },
  "short-break": { label: "Short Break", icon: Coffee, ring: "oklch(0.8 0.17 160)", glow: "oklch(0.68 0.16 160)" },
  "long-break": { label: "Long Break", icon: Sparkles, ring: "oklch(0.78 0.16 300)", glow: "oklch(0.6 0.18 300)" },
};

function loadSettings(): PomodoroSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<PomodoroSettings>) };
  } catch { return DEFAULT_SETTINGS; }
}

function saveSettings(settings: PomodoroSettings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {}
}

function durationFor(mode: Mode, settings: PomodoroSettings) {
  if (mode === "focus") return Math.max(1, settings.focusMinutes) * 60;
  if (mode === "short-break") return Math.max(1, settings.shortBreakMinutes) * 60;
  return Math.max(1, settings.longBreakMinutes) * 60;
}

function formatTime(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  return `${Math.floor(safe / 60).toString().padStart(2, "0")}:${(safe % 60).toString().padStart(2, "0")}`;
}

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes} min`;
  return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`;
}

function loadSession(): PersistedSession | null {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null");
    if (!saved || !saved.running || typeof saved.deadline !== "number") return null;
    if (!["focus", "short-break", "long-break"].includes(saved.mode)) return null;
    if (!["working", "resting"].includes(saved.phase)) return null;
    return saved as PersistedSession;
  } catch { return null; }
}

function loadStudySession(): StudySessionState | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STUDY_SESSION_KEY) ?? "null");
    if (!saved || !Array.isArray(saved.schedule) || !saved.schedule.length) return null;
    if (!["deep", "balanced", "classic"].includes(saved.pattern)) return null;
    if (!Number.isInteger(saved.index) || saved.index < 0 || saved.index >= saved.schedule.length) return null;
    if (typeof saved.running !== "boolean") return null;
    if (saved.pendingStart) return saved as StudySessionState;
    if (saved.running && (typeof saved.deadline !== "number" || saved.deadline <= Date.now())) return null;
    if (!saved.running && saved.remaining !== undefined && (!Number.isFinite(saved.remaining) || saved.remaining < 0)) return null;
    return saved as StudySessionState;
  } catch { return null; }
}

export function PomodoroModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PomodoroSettings>(() => loadSettings());
  const [mode, setMode] = useState<Mode>("focus");
  const [view, setView] = useState<"timer" | "study">("timer");
  const [phase, setPhase] = useState<SessionPhase>("working");
  const [remaining, setRemaining] = useState(() => durationFor("focus", settings));
  const [running, setRunning] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [completedFocusSessions, setCompletedFocusSessions] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [studySession, setStudySession] = useState<StudySessionState | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");
  const rafRef = useRef<number | null>(null);
  const originalTitleRef = useRef("");

  const meta = MODE_META[mode];
  const Icon = meta.icon;
  const currentSegment = studySession?.schedule[studySession.index];
  const total = currentSegment ? currentSegment.minutes * 60 : durationFor(mode, settings);
  const progress = Math.min(1, Math.max(0, 1 - remaining / Math.max(1, total)));
  const dotsFilled = completedFocusSessions === 0 ? 0 : completedFocusSessions % settings.sessionsUntilLongBreak === 0 ? settings.sessionsUntilLongBreak : completedFocusSessions % settings.sessionsUntilLongBreak;

  useEffect(() => {
    if (typeof window === "undefined") return;
    originalTitleRef.current = document.title;
    if (!("Notification" in window)) { setNotifPermission("unsupported"); return; }
    setNotifPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (!open) return;
    const nextSettings = loadSettings();
    setSettings(nextSettings);
    const study = loadStudySession();
    if (study) {
      const segment = study.schedule[study.index];
      if (segment) {
        setStudySession(study);
        setView("timer");
        setMode(segment.kind === "focus" ? "focus" : "short-break");
        setPhase(segment.kind === "focus" ? "working" : "resting");
        if (study.pendingStart) {
          const nextDeadline = Date.now() + segment.minutes * 60 * 1000;
          const started = { ...study, pendingStart: false, running: true, deadline: nextDeadline, remaining: segment.minutes * 60 };
          setStudySession(started);
          localStorage.setItem(STUDY_SESSION_KEY, JSON.stringify(started));
          setDeadline(nextDeadline);
          setRemaining(segment.minutes * 60);
          setRunning(true);
        } else if (study.running && typeof study.deadline === "number") {
          setDeadline(study.deadline);
          setRemaining(Math.max(0, Math.ceil((study.deadline - Date.now()) / 1000)));
          setRunning(true);
        } else {
          setDeadline(null);
          setRemaining(typeof study.remaining === "number" ? Math.floor(study.remaining) : segment.minutes * 60);
          setRunning(false);
        }
        return;
      }
    }

    const session = loadSession();
    if (session && session.deadline > Date.now()) {
      setView("timer");
      setStudySession(null);
      setMode(session.mode);
      setPhase(session.phase);
      setDeadline(session.deadline);
      setRemaining(Math.max(0, Math.ceil((session.deadline - Date.now()) / 1000)));
      setRunning(true);
    } else {
      setView("timer");
      setStudySession(null);
      setMode("focus");
      setPhase("working");
      setDeadline(null);
      setRemaining(durationFor("focus", nextSettings));
      setRunning(false);
    }
  }, [open]);

  const persistSession = (next: PersistedSession | null) => next ? localStorage.setItem(SESSION_KEY, JSON.stringify(next)) : localStorage.removeItem(SESSION_KEY);
  const persistStudySession = (next: StudySessionState | null) => next ? localStorage.setItem(STUDY_SESSION_KEY, JSON.stringify(next)) : localStorage.removeItem(STUDY_SESSION_KEY);

  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      [660, 880].forEach((freq, index) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = "sine"; osc.frequency.value = freq;
        const start = ctx.currentTime + index * 0.18;
        gain.gain.setValueAtTime(0.0001, start); gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
        osc.connect(gain); gain.connect(ctx.destination); osc.start(start); osc.stop(start + 0.32);
      });
      window.setTimeout(() => void ctx.close(), 900);
    } catch {}
  };

  const enableAlerts = () => {
    if (typeof window === "undefined") return;
    try { if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().then(setNotifPermission).catch(() => {}); } catch {}
  };

  const notifyRestStart = (seconds: number) => {
    if (settings.soundEnabled) playChime();
    if (user?.id) void broadcastRestStart(user.id, Math.max(1, Math.round(seconds / 60)));
    try {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      new Notification("Break time!", { body: `Time to rest for ${Math.round(seconds / 60)} min. Step away from the screen.`, icon: "/pwa-icon-192.svg" });
    } catch {}
  };

  const startNormalSession = (nextMode: Mode) => {
    if (studySession) return;
    const seconds = durationFor(nextMode, settings);
    const nextDeadline = Date.now() + seconds * 1000;
    setMode(nextMode); setPhase(nextMode === "focus" ? "working" : "resting"); setRemaining(seconds); setDeadline(nextDeadline); setRunning(true);
    persistSession({ mode: nextMode, phase: nextMode === "focus" ? "working" : "resting", deadline: nextDeadline, running: true });
    if (nextMode !== "focus") notifyRestStart(seconds);
  };

  const advanceNormalMode = useCallback(() => {
    const nextMode: Mode = mode === "focus" ? ((completedFocusSessions + 1) % settings.sessionsUntilLongBreak === 0 ? "long-break" : "short-break") : "focus";
    if (mode === "focus") setCompletedFocusSessions((count) => count + 1);
    const nextDuration = durationFor(nextMode, settings);
    const nextDeadline = Date.now() + nextDuration * 1000;
    setMode(nextMode); setPhase(nextMode === "focus" ? "working" : "resting"); setRemaining(nextDuration); setDeadline(nextDeadline); setRunning(true);
    persistSession({ mode: nextMode, phase: nextMode === "focus" ? "working" : "resting", deadline: nextDeadline, running: true });
    if (nextMode !== "focus") notifyRestStart(nextDuration);
  }, [mode, completedFocusSessions, settings]);

  useEffect(() => {
    if (!running || deadline === null) return;
    const tick = () => {
      const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(next);
      if (next > 0) { rafRef.current = window.requestAnimationFrame(tick); return; }

      if (studySession) {
        const nextIndex = studySession.index + 1;
        if (nextIndex < studySession.schedule.length) {
          const segment = studySession.schedule[nextIndex];
          const nextDeadline = Date.now() + segment.minutes * 60 * 1000;
          const nextStudy = { ...studySession, index: nextIndex, running: true, deadline: nextDeadline, remaining: segment.minutes * 60, pendingStart: false };
          setStudySession(nextStudy); persistStudySession(nextStudy);
          setMode(segment.kind === "focus" ? "focus" : "short-break"); setPhase(segment.kind === "focus" ? "working" : "resting"); setRemaining(segment.minutes * 60); setDeadline(nextDeadline); setRunning(true);
          if (segment.kind === "rest") notifyRestStart(segment.minutes * 60);
          rafRef.current = window.requestAnimationFrame(tick); return;
        }
        setRunning(false); setDeadline(null); persistStudySession(null); setStudySession(null); setMode("focus"); setPhase("working"); setRemaining(durationFor("focus", settings)); setView("timer"); persistSession(null); return;
      }
      advanceNormalMode();
    };
    rafRef.current = window.requestAnimationFrame(tick);
    const onVisibility = () => tick();
    document.addEventListener("visibilitychange", onVisibility);
    return () => { if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current); document.removeEventListener("visibilitychange", onVisibility); };
  }, [running, deadline, studySession, settings, advanceNormalMode]);

  useEffect(() => {
    if (!open || !running) return;
    const syncTitle = () => { if (phase !== "resting" || !document.hidden) document.title = originalTitleRef.current; else document.title = document.title === FLASH_TITLE ? originalTitleRef.current : FLASH_TITLE; };
    syncTitle(); const id = window.setInterval(syncTitle, 1000);
    return () => { window.clearInterval(id); document.title = originalTitleRef.current; };
  }, [open, running, phase]);

  const toggleRunning = () => {
    if (running) {
      setRunning(false); setDeadline(null);
      if (studySession) { const paused = { ...studySession, running: false, deadline: null, remaining, pendingStart: false }; setStudySession(paused); persistStudySession(paused); }
      persistSession(null); return;
    }
    enableAlerts();
    if (studySession) {
      const active = studySession.schedule[studySession.index]; if (!active) return;
      const nextDeadline = Date.now() + remaining * 1000;
      const resumed = { ...studySession, running: true, deadline: nextDeadline, remaining, pendingStart: false };
      setStudySession(resumed); persistStudySession(resumed); setDeadline(nextDeadline); setRunning(true); setPhase(active.kind === "focus" ? "working" : "resting"); return;
    }
    startNormalSession(mode);
  };

  const reset = () => {
    setRunning(false); setDeadline(null); setStudySession(null); persistStudySession(null); setMode("focus"); setPhase("working"); setRemaining(durationFor("focus", settings)); setView("timer"); persistSession(null);
  };

  const skip = () => {
    if (studySession) {
      const nextIndex = studySession.index + 1;
      if (nextIndex >= studySession.schedule.length) { reset(); return; }
      const segment = studySession.schedule[nextIndex]; const nextDeadline = Date.now() + segment.minutes * 60 * 1000;
      const nextStudy = { ...studySession, index: nextIndex, running: true, deadline: nextDeadline, remaining: segment.minutes * 60, pendingStart: false };
      setStudySession(nextStudy); persistStudySession(nextStudy); setMode(segment.kind === "focus" ? "focus" : "short-break"); setPhase(segment.kind === "focus" ? "working" : "resting"); setRemaining(segment.minutes * 60); setDeadline(nextDeadline); setRunning(true);
      if (segment.kind === "rest") notifyRestStart(segment.minutes * 60); return;
    }
    setRunning(false); setDeadline(null); advanceNormalMode();
  };

  const updateSetting = (patch: Partial<PomodoroSettings>) => setSettings((current) => { const next = { ...current, ...patch }; saveSettings(next); return next; });

  const startStudySession = (input: { pattern: StudySessionPattern; title: string; focusMinutes: number; schedule: StudySessionSegment[] }) => {
    const first = input.schedule[0]; if (!first) return;
    const nextDeadline = Date.now() + first.minutes * 60 * 1000;
    const nextStudy: StudySessionState = { pattern: input.pattern, title: input.title, focusMinutes: input.focusMinutes, schedule: input.schedule, index: 0, running: true, deadline: nextDeadline, remaining: first.minutes * 60, pendingStart: false };
    setStudySession(nextStudy); persistStudySession(nextStudy); persistSession(null); setView("timer"); setSettingsOpen(false); setMode(first.kind === "focus" ? "focus" : "short-break"); setPhase(first.kind === "focus" ? "working" : "resting"); setRemaining(first.minutes * 60); setDeadline(nextDeadline); setRunning(true); if (first.kind === "rest") notifyRestStart(first.minutes * 60);
  };

  const restTotal = studySession?.schedule.filter((segment) => segment.kind === "rest").reduce((sum, segment) => sum + segment.minutes, 0) ?? 0;
  const studyComplete = !!studySession && !studySession.running && studySession.index >= studySession.schedule.length - 1 && remaining === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden rounded-[28px] border-white/20 bg-black/35 p-0 text-foreground shadow-2xl backdrop-blur-2xl [&>button]:hidden">
        <div className="relative max-h-[92vh] overflow-x-hidden overflow-y-auto overscroll-contain p-6 sm:p-8">
          <span aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-56 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-lg font-semibold tracking-tight">Pomodoro</DialogTitle>
              <div className="flex items-center gap-1">
                {notifPermission !== "granted" && notifPermission !== "unsupported" && <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-white/10" onClick={enableAlerts} aria-label="Enable rest notifications">🔔</Button>}
                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-white/10" onClick={() => setSettingsOpen((value) => !value)} aria-label="Pomodoro settings"><Settings2 className="size-4" /></Button>
                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-white/10" onClick={() => onOpenChange(false)} aria-label="Close Pomodoro"><X className="size-4" /></Button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/[0.045] p-1">
              <button type="button" onClick={() => { if (!studySession) setView("timer"); }} className={cn("rounded-xl px-4 py-2.5 text-xs font-semibold transition", view === "timer" ? "bg-white/15 text-foreground shadow-sm" : "text-muted-foreground hover:bg-white/10 hover:text-foreground")} aria-selected={view === "timer"}>Pomodoro Timer</button>
              <button type="button" onClick={() => { if (!studySession) { setView("study"); setSettingsOpen(false); } }} className={cn("rounded-xl px-4 py-2.5 text-xs font-semibold transition", view === "study" ? "bg-white/15 text-foreground shadow-sm" : "text-muted-foreground hover:bg-white/10 hover:text-foreground")} aria-selected={view === "study"}>Study Session</button>
            </div>

            {view === "study" && !studySession ? (
              <StudySessionPanel onStartSession={startStudySession} />
            ) : (
              <>
                {!studySession && (
                  <div className="mt-4 grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-white/[0.045] p-1">
                    {(Object.keys(MODE_META) as Mode[]).map((item) => <button key={item} type="button" onClick={() => setMode(item) || startNormalSession(item)} className={cn("rounded-xl px-2 py-2.5 text-xs font-semibold transition", mode === item ? "bg-white/15 text-foreground shadow-sm" : "text-muted-foreground hover:bg-white/10 hover:text-foreground")}>{MODE_META[item].label}</button>)}
                  </div>
                )}

                {studySession && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Current Study Session</p><p className="mt-1 truncate text-sm font-semibold">{studySession.title}</p><p className="mt-1 text-[11px] text-muted-foreground">Pomodoro is running the selected Study Session blocks.</p></div>
                      <div className="shrink-0 text-right text-[10px] text-muted-foreground"><p>{formatDuration(studySession.focusMinutes)} focus</p><p className="mt-1">{formatDuration(restTotal)} rest</p></div>
                    </div>
                  </div>
                )}

                <GlassPanel className="relative mt-4 flex w-full flex-col items-center gap-6 !p-7">
                  <span aria-hidden className="pointer-events-none absolute -top-8 -z-10 size-56 rounded-full opacity-40 blur-[70px]" style={{ background: meta.glow }} />
                  <div className="flex w-full items-center justify-between">
                    <AnimatePresence mode="wait"><motion.div key={mode} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.25 }} className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold" style={{ color: meta.ring }}><Icon className="size-3.5" />{meta.label}</motion.div></AnimatePresence>
                    {studySession ? <button type="button" onClick={() => setView("study")} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] text-muted-foreground hover:bg-white/10">Study Session</button> : <button type="button" onClick={() => setSettingsOpen((value) => !value)} className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-muted-foreground hover:bg-white/10" aria-label="Timer settings"><Settings2 className="size-4" /></button>}
                  </div>

                  {studySession ? (
                    <div className="w-full text-center"><StudySessionRing segment={currentSegment} remaining={remaining} /><p className="mt-1 text-[11px] text-muted-foreground">Block {Math.min(studySession.index + 1, studySession.schedule.length)} of {studySession.schedule.length}</p></div>
                  ) : (
                    <div className="relative flex items-center justify-center">
                      <svg width={200} height={200} className="-rotate-90"><circle cx={100} cy={100} r={92} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={10} /><circle cx={100} cy={100} r={92} fill="none" stroke={meta.ring} strokeWidth={10} strokeLinecap="round" strokeDasharray={2 * Math.PI * 92} strokeDashoffset={2 * Math.PI * 92 * (1 - progress)} style={{ transition: "stroke-dashoffset .3s linear, stroke .5s ease" }} /></svg>
                      <div className="absolute flex flex-col items-center"><span className="font-mono text-5xl font-semibold tabular-nums text-foreground">{formatTime(remaining)}</span><span className="mt-1 text-[11px] text-muted-foreground">Session {completedFocusSessions + 1}</span></div>
                    </div>
                  )}

                  {!studySession && <div className="flex items-center gap-1.5">{Array.from({ length: settings.sessionsUntilLongBreak }).map((_, index) => <span key={index} className="h-1.5 w-1.5 rounded-full" style={{ background: index < dotsFilled ? meta.ring : "rgba(255,255,255,0.15)" }} />)}</div>}

                  {studySession && <div className="w-full grid gap-2">{studySession.schedule.map((segment, index) => { const isCurrent = index === studySession.index && studySession.running; const isPast = index < studySession.index || (index === studySession.index && studyComplete); return <div key={`${segment.label}-${index}`} className={cn("rounded-xl border p-3", isCurrent ? "border-white/35 bg-white/10" : isPast ? "border-white/10 bg-white/[0.025] opacity-55" : "border-white/10 bg-black/15")}><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><span className={cn("flex size-7 items-center justify-center rounded-lg", segment.kind === "focus" ? "bg-foreground/80 text-background" : "bg-white/15 text-foreground")}>{isPast ? <Check className="size-3.5" /> : <span className="text-[9px] font-semibold">{index + 1}</span>}</span><div><p className="text-xs font-medium">{segment.label}</p><p className="text-[9px] text-muted-foreground">{segment.minutes} min</p></div></div><span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{isCurrent ? "Now" : isPast ? "Done" : "Next"}</span></div></div>; })}</div>}

                  <div className="flex w-full items-center justify-center gap-3">
                    <button type="button" onClick={reset} className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-foreground hover:bg-white/10" aria-label="Reset timer"><RotateCcw className="size-4" /></button>
                    <button type="button" onClick={toggleRunning} className="flex h-14 w-14 items-center justify-center rounded-full text-background shadow-lg transition active:scale-95" style={{ background: meta.ring, boxShadow: `0 8px 28px -6px ${meta.glow}` }} aria-label={running ? "Pause timer" : "Start timer"}>{running ? <Pause className="size-6" fill="currentColor" /> : <Play className="ml-0.5 size-6" fill="currentColor" />}</button>
                    <button type="button" onClick={skip} className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-foreground hover:bg-white/10" aria-label="Skip to next session"><SkipForward className="size-4" /></button>
                  </div>

                  {!studySession && settingsOpen && <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="grid grid-cols-2 gap-3"><label className="block text-xs text-muted-foreground">Focus (min)<input type="number" min={1} max={120} value={settings.focusMinutes} onChange={(e) => updateSetting({ focusMinutes: Math.min(120, Math.max(1, Number(e.target.value) || 1)) })} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-foreground outline-none" /></label><label className="block text-xs text-muted-foreground">Short break (min)<input type="number" min={1} max={60} value={settings.shortBreakMinutes} onChange={(e) => updateSetting({ shortBreakMinutes: Math.min(60, Math.max(1, Number(e.target.value) || 1)) })} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-foreground outline-none" /></label><label className="block text-xs text-muted-foreground">Long break (min)<input type="number" min={1} max={90} value={settings.longBreakMinutes} onChange={(e) => updateSetting({ longBreakMinutes: Math.min(90, Math.max(1, Number(e.target.value) || 1)) })} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-foreground outline-none" /></label><label className="block text-xs text-muted-foreground">Sessions / long break<input type="number" min={2} max={8} value={settings.sessionsUntilLongBreak} onChange={(e) => updateSetting({ sessionsUntilLongBreak: Math.min(8, Math.max(2, Number(e.target.value) || 4)) })} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-foreground outline-none" /></label><button type="button" onClick={() => updateSetting({ soundEnabled: !settings.soundEnabled })} className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-medium hover:bg-white/10">{settings.soundEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}{settings.soundEnabled ? "Chime on session end: On" : "Chime on session end: Off"}</button></div></div>}
                </GlassPanel>
              </>
            )}
          </div>
        </div>
      </DialogContent>

      {false && <AnimatePresence />}
    </Dialog>
  );
}
