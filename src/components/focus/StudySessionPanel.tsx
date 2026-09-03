import { useEffect, useMemo, useState } from "react";
import { Check, Clock3, Pause, Play, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export type StudySessionPattern = "deep" | "balanced" | "classic";
type Segment = { label: string; minutes: number; kind: "focus" | "rest" };

const PATTERNS: Record<StudySessionPattern, { title: string; description: string; cycle: Segment[] }> = {
  deep: {
    title: "Deep Study",
    description: "Longer focused blocks for coding and difficult problems.",
    cycle: [
      { label: "Focus", minutes: 50, kind: "focus" },
      { label: "Rest", minutes: 10, kind: "rest" },
    ],
  },
  balanced: {
    title: "Balanced Study",
    description: "Shorter focus blocks with a full reset between them.",
    cycle: [
      { label: "Focus", minutes: 20, kind: "focus" },
      { label: "Rest", minutes: 10, kind: "rest" },
      { label: "Focus", minutes: 20, kind: "focus" },
      { label: "Rest", minutes: 10, kind: "rest" },
    ],
  },
  classic: {
    title: "Classic Study",
    description: "Two steady focus blocks with short resets.",
    cycle: [
      { label: "Focus", minutes: 25, kind: "focus" },
      { label: "Rest", minutes: 5, kind: "rest" },
      { label: "Focus", minutes: 25, kind: "focus" },
      { label: "Rest", minutes: 5, kind: "rest" },
    ],
  },
};

const MAX_FOCUS_MINUTES = 150;
const MIN_FOCUS_MINUTES = 30;

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes} min`;
  return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`;
}

function buildSchedule(cycle: Segment[], targetFocusMinutes: number) {
  const schedule: Segment[] = [];
  let focusRemaining = targetFocusMinutes;
  let cycleIndex = 0;

  while (focusRemaining > 0) {
    const segment = cycle[cycleIndex % cycle.length];
    if (!segment) break;

    if (segment.kind === "focus") {
      const minutes = Math.min(segment.minutes, focusRemaining);
      schedule.push({ ...segment, minutes });
      focusRemaining -= minutes;
      cycleIndex += 1;

      // Rest is a break between focus blocks, so don't add one after the final focus block.
      if (focusRemaining > 0) {
        const next = cycle[cycleIndex % cycle.length];
        if (next?.kind === "rest") {
          schedule.push({ ...next });
          cycleIndex += 1;
        }
      }
    } else {
      cycleIndex += 1;
    }
  }

  return schedule;
}

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function StudySessionPanel() {
  const [pattern, setPattern] = useState<StudySessionPattern>("deep");
  const [focusMinutesTarget, setFocusMinutesTarget] = useState(150);
  const [running, setRunning] = useState(false);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);

  const selected = PATTERNS[pattern];
  const schedule = useMemo(
    () => buildSchedule(selected.cycle, focusMinutesTarget),
    [selected.cycle, focusMinutesTarget],
  );
  const actualTotal = schedule.reduce((sum, segment) => sum + segment.minutes, 0);
  const focusMinutes = schedule
    .filter((segment) => segment.kind === "focus")
    .reduce((sum, segment) => sum + segment.minutes, 0);
  const restMinutes = actualTotal - focusMinutes;
  const active = schedule[segmentIndex];

  useEffect(() => {
    if (!running || !active) return;
    const id = window.setInterval(() => {
      setRemaining((value) => {
        if (value > 1) return value - 1;
        if (segmentIndex + 1 < schedule.length) {
          setSegmentIndex((value) => value + 1);
          return (schedule[segmentIndex + 1]?.minutes ?? 0) * 60;
        }
        setRunning(false);
        return 0;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [active, running, schedule, segmentIndex]);

  const start = () => {
    setSegmentIndex(0);
    setRemaining((schedule[0]?.minutes ?? 0) * 60);
    setRunning(true);
  };

  const pause = () => setRunning(false);

  const reset = () => {
    setRunning(false);
    setSegmentIndex(0);
    setRemaining(0);
  };

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Study Session</p>
          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">Choose a study style and set focused study time up to 2.5 hours.</p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] font-medium text-muted-foreground">
          <Clock3 className="size-3" /> {formatDuration(actualTotal)} total
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2">
        {(Object.keys(PATTERNS) as StudySessionPattern[]).map((key) => {
          const item = PATTERNS[key];
          const activePattern = key === pattern;
          return (
            <button key={key} type="button" onClick={() => { setPattern(key); reset(); }} className={`rounded-xl border p-3 text-left transition ${activePattern ? "border-white/30 bg-white/10" : "border-white/10 bg-black/15 hover:bg-white/[0.07]"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{item.description}</p>
                </div>
                {activePattern && <Check className="mt-0.5 size-4 shrink-0 text-foreground" />}
              </div>
            </button>
          );
        })}
      </div>

      <label className="mt-4 block">
        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
          <span>Focus time</span>
          <span className="text-foreground">{formatDuration(focusMinutesTarget)}</span>
        </div>
        <input type="range" min={MIN_FOCUS_MINUTES} max={MAX_FOCUS_MINUTES} step={10} value={focusMinutesTarget} disabled={running} onChange={(event) => { setFocusMinutesTarget(Math.min(MAX_FOCUS_MINUTES, Number(event.target.value))); reset(); }} className="mt-2 w-full accent-current disabled:opacity-50" aria-label="Study session focus time" />
        <div className="mt-1 flex justify-between text-[9px] text-muted-foreground"><span>30 min focus</span><span>2.5 hr focus max</span></div>
      </label>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Session plan</p>
        <div className="flex h-10 w-full overflow-hidden rounded-lg">
          {schedule.map((segment, index) => (
            <div key={`${segment.label}-${index}`} className={`${segment.kind === "focus" ? "bg-foreground/80 text-background" : "bg-white/15 text-foreground"} flex min-w-0 items-center justify-center border-r border-black/20 px-1 ${index === segmentIndex && running ? "ring-2 ring-inset ring-white/80" : ""}`} style={{ width: `${(segment.minutes / actualTotal) * 100}%` }} title={`${segment.label} · ${segment.minutes} min`}>
              <span className="truncate text-[9px] font-semibold">{segment.minutes}m</span>
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground"><span>Focus · {formatDuration(focusMinutes)}</span><span className="text-right">Rest · {formatDuration(restMinutes)}</span></div>
      </div>

      {running && active && (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{active.label}</p>
          <p className="mt-2 text-4xl font-semibold tabular-nums tracking-[-0.04em] text-foreground">{formatClock(remaining)}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">Segment {segmentIndex + 1} of {schedule.length}</p>
        </div>
      )}

      {remaining === 0 && !running && segmentIndex === schedule.length - 1 && schedule.length > 0 && (
        <p className="mt-3 text-center text-[11px] text-muted-foreground">Study session complete.</p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Button type="button" variant="secondary" onClick={reset} disabled={!running && segmentIndex === 0 && remaining === 0}><RotateCcw className="mr-2 size-3.5" />Reset</Button>
        <Button type="button" variant="outline" onClick={running ? pause : start} className="col-span-2">{running ? <Pause className="mr-2 size-3.5" /> : <Play className="mr-2 size-3.5" />}{running ? "Pause session" : "Start study session"}</Button>
      </div>
    </div>
  );
}
