import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw, Settings2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type Mode = "focus" | "short" | "long";
type SessionPhase = "working" | "resting";

const DEFAULT_DURATIONS: Record<Mode, number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const LABELS: Record<Mode, string> = {
  focus: "Focus",
  short: "Short Break",
  long: "Long Break",
};

const STORAGE_KEY = "liquid-glass-pomodoro-durations";

function loadDurations(): Record<Mode, number> {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    return {
      focus: Number.isFinite(saved?.focus) && saved.focus > 0 ? saved.focus : DEFAULT_DURATIONS.focus,
      short: Number.isFinite(saved?.short) && saved.short > 0 ? saved.short : DEFAULT_DURATIONS.short,
      long: Number.isFinite(saved?.long) && saved.long > 0 ? saved.long : DEFAULT_DURATIONS.long,
    };
  } catch {
    return DEFAULT_DURATIONS;
  }
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function PomodoroModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [durations, setDurations] = useState<Record<Mode, number>>(DEFAULT_DURATIONS);
  const [mode, setMode] = useState<Mode>("focus");
  const [phase, setPhase] = useState<SessionPhase>("working");
  const [remaining, setRemaining] = useState(DEFAULT_DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [restMinutes, setRestMinutes] = useState(5);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!open) return;
    const saved = loadDurations();
    setDurations(saved);
    setRestMinutes(Math.max(1, Math.round(saved.short / 60)));
  }, [open]);

  const persistDurations = (next: Record<Mode, number>) => {
    setDurations(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const selectMode = (next: Mode) => {
    if (locked) return;
    setMode(next);
    setPhase("working");
    setRemaining(durations[next]);
    setRunning(false);
    setDeadline(null);
  };

  const beginRest = () => {
    const restSeconds = Math.max(1, restMinutes) * 60;
    const next = { ...durations, short: restSeconds };
    persistDurations(next);
    setPhase("resting");
    setRemaining(restSeconds);
    setLocked(true);
    setDeadline(Date.now() + restSeconds * 1000);
    setRunning(true);
  };

  useEffect(() => {
    if (!running || deadline === null) return;

    const tick = () => {
      const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(next);

      if (next === 0) {
        setRunning(false);
        setDeadline(null);

        if (phase === "working") {
          // A completed work block immediately locks the whole app into the saved rest period.
          beginRest();
        } else {
          // Rest is complete: release the lock and make the next focus session available.
          setPhase("working");
          setMode("focus");
          setRemaining(durations.focus);
          setLocked(false);
        }
      }
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [running, deadline, phase, durations.focus, restMinutes]);

  const formatted = useMemo(() => formatTime(remaining), [remaining]);

  const toggleRunning = () => {
    if (locked) return;
    if (running) {
      setRunning(false);
      setDeadline(null);
      return;
    }
    setDeadline(Date.now() + remaining * 1000);
    setRunning(true);
  };

  const reset = () => {
    if (locked) return;
    setRunning(false);
    setDeadline(null);
    setPhase("working");
    setRemaining(durations[mode]);
  };

  const changeRestMinutes = (value: number) => {
    const safe = Math.min(120, Math.max(1, Math.round(value)));
    setRestMinutes(safe);
    const next = { ...durations, short: safe * 60 };
    persistDurations(next);
    if (!running && !locked && mode === "short") setRemaining(safe * 60);
  };

  return (
    <>
      <Dialog open={open && !locked} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md overflow-hidden rounded-[28px] border-white/20 bg-black/35 p-0 text-foreground shadow-2xl backdrop-blur-2xl [&>button]:hidden">
          <div className="relative p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-20 -top-24 size-56 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-semibold tracking-tight">Pomodoro</DialogTitle>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-white/10" onClick={() => setSettingsOpen((value) => !value)} aria-label="Pomodoro settings">
                    <Settings2 className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-white/10" onClick={() => onOpenChange(false)} aria-label="Close Pomodoro">
                    <X className="size-4" />
                  </Button>
                </div>
              </div>

              {settingsOpen && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Saved rest time</p>
                      <p className="mt-1 text-xs text-muted-foreground">Used automatically after a work session.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        aria-label="Rest minutes"
                        type="number"
                        min={1}
                        max={120}
                        value={restMinutes}
                        onChange={(event) => changeRestMinutes(Number(event.target.value))}
                        className="w-20 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-center text-sm outline-none focus:border-primary/50"
                      />
                      <span className="text-xs text-muted-foreground">min</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-white/[0.045] p-1">
                {(Object.keys(LABELS) as Mode[]).map((item) => (
                  <button key={item} type="button" onClick={() => selectMode(item)} className={`rounded-xl px-2 py-2 text-xs font-medium transition ${mode === item ? "bg-white/15 text-foreground shadow-sm" : "text-muted-foreground hover:bg-white/10 hover:text-foreground"}`}>
                    {LABELS[item]}
                  </button>
                ))}
              </div>

              <div className="flex flex-col items-center py-10">
                <div className="text-7xl font-semibold tabular-nums tracking-[-0.05em] text-foreground sm:text-8xl" aria-live="polite">{formatted}</div>
                <p className="mt-3 text-sm text-muted-foreground">{running ? "Stay focused" : "Ready when you are"}</p>
              </div>

              <div className="flex items-center justify-center gap-3">
                <Button variant="ghost" size="icon" className="size-11 rounded-full bg-white/[0.06] hover:bg-white/10" onClick={reset} aria-label="Reset timer"><RotateCcw className="size-4" /></Button>
                <Button size="lg" className="h-12 rounded-full px-7 shadow-lg" onClick={toggleRunning}>
                  {running ? <Pause className="mr-2 size-4" /> : <Play className="mr-2 size-4" />}
                  {running ? "Pause" : "Start"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {locked && (
        <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-hidden bg-black/60 p-5 backdrop-blur-xl" role="dialog" aria-modal="true" aria-label="Rest period in progress">
          <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -right-20 size-96 rounded-full bg-white/10 blur-3xl" />
          <div className="relative w-full max-w-lg rounded-[32px] border border-white/20 bg-black/35 p-7 text-center shadow-2xl backdrop-blur-2xl sm:p-10">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] text-foreground">
              <TimerIcon />
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Session complete</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Rest before the next session</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">The workspace is temporarily locked so your saved rest period can finish.</p>
            <div className="mt-9 text-7xl font-semibold tabular-nums tracking-[-0.05em] sm:text-8xl">{formatted}</div>
            <p className="mt-3 text-sm text-muted-foreground">Rest time remaining</p>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-xs text-muted-foreground">Your notes, course folders, and dashboard will become available when the rest timer reaches zero.</div>
          </div>
        </div>
      )}
    </>
  );
}

function TimerIcon() {
  return <span className="text-lg font-semibold tabular-nums">25</span>;
}
