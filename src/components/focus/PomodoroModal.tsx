import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type Mode = "focus" | "short" | "long";

const DURATIONS: Record<Mode, number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const LABELS: Record<Mode, string> = {
  focus: "Focus",
  short: "Short Break",
  long: "Long Break",
};

export function PomodoroModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [mode, setMode] = useState<Mode>("focus");
  const [remaining, setRemaining] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);

  const selectMode = (next: Mode) => {
    setMode(next);
    setRemaining(DURATIONS[next]);
    setRunning(false);
    setDeadline(null);
  };

  useEffect(() => {
    if (!running || deadline === null) return;

    const tick = () => {
      const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(next);

      if (next === 0) {
        setRunning(false);
        setDeadline(null);
        setMode((current) => {
          const nextMode = current === "focus" ? "short" : "focus";
          setRemaining(DURATIONS[nextMode]);
          return nextMode;
        });
      }
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [running, deadline]);

  const formatted = useMemo(() => {
    const minutes = Math.floor(remaining / 60).toString().padStart(2, "0");
    const seconds = (remaining % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [remaining]);

  const toggleRunning = () => {
    if (running) {
      setRunning(false);
      setDeadline(null);
      return;
    }

    setDeadline(Date.now() + remaining * 1000);
    setRunning(true);
  };

  const reset = () => {
    setRunning(false);
    setDeadline(null);
    setRemaining(DURATIONS[mode]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden rounded-[28px] border-white/20 bg-black/35 p-0 text-foreground shadow-2xl backdrop-blur-2xl [&>button]:hidden">
        <div className="relative p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 size-56 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold tracking-tight">Pomodoro</DialogTitle>
              <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-white/10" onClick={() => onOpenChange(false)} aria-label="Close Pomodoro">
                <X className="size-4" />
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-white/[0.045] p-1">
              {(Object.keys(LABELS) as Mode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => selectMode(item)}
                  className={`rounded-xl px-2 py-2 text-xs font-medium transition ${mode === item ? "bg-white/15 text-foreground shadow-sm" : "text-muted-foreground hover:bg-white/10 hover:text-foreground"}`}
                >
                  {LABELS[item]}
                </button>
              ))}
            </div>

            <div className="flex flex-col items-center py-10">
              <div className="text-7xl font-semibold tabular-nums tracking-[-0.05em] text-foreground sm:text-8xl" aria-live="polite">
                {formatted}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{running ? "Stay focused" : "Ready when you are"}</p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button variant="ghost" size="icon" className="size-11 rounded-full bg-white/[0.06] hover:bg-white/10" onClick={reset} aria-label="Reset timer">
                <RotateCcw className="size-4" />
              </Button>
              <Button size="lg" className="h-12 rounded-full px-7 shadow-lg" onClick={toggleRunning}>
                {running ? <Pause className="mr-2 size-4" /> : <Play className="mr-2 size-4" />}
                {running ? "Pause" : "Start"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
