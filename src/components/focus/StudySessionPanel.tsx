import { useEffect, useMemo, useState } from "react";
import { Check, Clock3, Pause, Play, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export type StudySessionPattern = "deep" | "balanced" | "classic";
export type StudySessionSegment = { label: "Focus" | "Rest"; minutes: number; kind: "focus" | "rest" };

const PATTERNS: Record<StudySessionPattern, { title: string; description: string; cycle: StudySessionSegment[] }> = {
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
const TESTER_DURATION_SECONDS = 30;

type Props = {
  onStartSession: (input: {
    pattern: StudySessionPattern;
    title: string;
    focusMinutes: number;
    schedule: StudySessionSegment[];
  }) => void;
};

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes} min`;
  return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`;
}

function formatTesterTime(totalSeconds: number) {
  return `00:${String(Math.max(0, totalSeconds)).padStart(2, "0")}`;
}

function buildSchedule(cycle: StudySessionSegment[], targetFocusMinutes: number) {
  const schedule: StudySessionSegment[] = [];
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

export function StudySessionPanel({ onStartSession }: Props) {
  const [pattern, setPattern] = useState<StudySessionPattern>("deep");
  const [focusMinutesTarget, setFocusMinutesTarget] = useState(150);
  const [testerRemaining, setTesterRemaining] = useState(TESTER_DURATION_SECONDS);
  const [testerRunning, setTesterRunning] = useState(false);

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

  useEffect(() => {
    if (!testerRunning) return;
    const id = window.setInterval(() => {
      setTesterRemaining((value) => {
        if (value <= 1) {
          setTesterRunning(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [testerRunning]);

  const startTester = () => {
    if (testerRemaining === 0) setTesterRemaining(TESTER_DURATION_SECONDS);
    setTesterRunning(true);
  };

  const resetTester = () => {
    setTesterRunning(false);
    setTesterRemaining(TESTER_DURATION_SECONDS);
  };

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Study Session</p>
          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">Choose a study style. Pomodoro will run the selected Focus and Rest blocks.</p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] font-medium text-muted-foreground">
          <Clock3 className="size-3" /> {formatDuration(focusMinutes)} focus
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2">
        {(Object.keys(PATTERNS) as StudySessionPattern[]).map((key) => {
          const item = PATTERNS[key];
          const activePattern = key === pattern;
          return (
            <button key={key} type="button" onClick={() => setPattern(key)} className={`rounded-xl border p-3 text-left transition ${activePattern ? "border-white/30 bg-white/10" : "border-white/10 bg-black/15 hover:bg-white/[0.07]"}`}>
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
        <input type="range" min={MIN_FOCUS_MINUTES} max={MAX_FOCUS_MINUTES} step={10} value={focusMinutesTarget} onChange={(event) => setFocusMinutesTarget(Math.min(MAX_FOCUS_MINUTES, Number(event.target.value)))} className="mt-2 w-full accent-current" aria-label="Study session focus time" />
        <div className="mt-1 flex justify-between text-[9px] text-muted-foreground"><span>30 min focus</span><span>2.5 hr focus max</span></div>
      </label>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Pomodoro schedule</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {schedule.map((segment, index) => (
            <div key={`${segment.label}-${index}`} className="rounded-xl border border-white/10 bg-black/15 p-3">
              <div className="flex items-center gap-2">
                <span className={`flex size-7 items-center justify-center rounded-lg ${segment.kind === "focus" ? "bg-foreground/80 text-background" : "bg-white/15 text-foreground"}`}><span className="text-[9px] font-semibold">{index + 1}</span></span>
                <div>
                  <p className="text-xs font-medium text-foreground">{segment.label}</p>
                  <p className="text-[9px] text-muted-foreground">{segment.minutes} min</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground"><span>Focus · {formatDuration(focusMinutes)}</span><span className="text-right">Rest · {formatDuration(restMinutes)}</span></div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-foreground">30s Tester</p>
            <p className="mt-1 text-[10px] leading-4 text-muted-foreground">Quickly test the Study Session countdown without starting a real session.</p>
          </div>
          <span className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 font-mono text-[10px] text-muted-foreground">30 sec</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="min-w-[92px] rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-center font-mono text-lg font-semibold tabular-nums text-foreground" aria-live="polite">{formatTesterTime(testerRemaining)}</div>
          <Button type="button" size="sm" variant="outline" onClick={testerRunning ? () => setTesterRunning(false) : startTester} className="rounded-xl">
            {testerRunning ? <Pause className="mr-1.5 size-3.5" /> : <Play className="mr-1.5 size-3.5" />}
            {testerRunning ? "Pause" : testerRemaining === 0 ? "Run again" : "Start"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={resetTester} className="rounded-xl" aria-label="Reset 30 second tester">
            <RotateCcw className="mr-1.5 size-3.5" />Reset
          </Button>
          {testerRemaining === 0 && <span className="text-[10px] font-medium text-foreground">Tester complete</span>}
        </div>
      </div>

      <Button type="button" className="mt-4 w-full rounded-xl" onClick={() => onStartSession({ pattern, title: selected.title, focusMinutes, schedule })}>
        <Play className="mr-2 size-3.5" /> Start study session in Pomodoro
      </Button>
    </div>
  );
}
