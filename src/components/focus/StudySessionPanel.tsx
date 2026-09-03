import { useMemo, useState } from "react";
import { Check, Clock3, Play } from "lucide-react";

import { Button } from "@/components/ui/button";

export type StudySessionPattern = "deep" | "balanced" | "classic";

type Segment = { label: string; minutes: number; kind: "focus" | "rest" };

const PATTERNS: Record<StudySessionPattern, { title: string; description: string; segments: Segment[] }> = {
  deep: {
    title: "Deep Study",
    description: "Longer uninterrupted focus for coding and difficult problems.",
    segments: [
      { label: "Focus", minutes: 50, kind: "focus" },
      { label: "Rest", minutes: 10, kind: "rest" },
      { label: "Focus", minutes: 50, kind: "focus" },
      { label: "Rest", minutes: 10, kind: "rest" },
      { label: "Focus", minutes: 50, kind: "focus" },
      { label: "Rest", minutes: 10, kind: "rest" },
    ],
  },
  balanced: {
    title: "Balanced Study",
    description: "Shorter focus blocks with a meaningful reset between them.",
    segments: [
      { label: "Focus", minutes: 20, kind: "focus" },
      { label: "Rest", minutes: 10, kind: "rest" },
      { label: "Focus", minutes: 20, kind: "focus" },
      { label: "Rest", minutes: 10, kind: "rest" },
    ],
  },
  classic: {
    title: "Classic Study",
    description: "Two focused blocks with short resets for steady momentum.",
    segments: [
      { label: "Focus", minutes: 25, kind: "focus" },
      { label: "Rest", minutes: 5, kind: "rest" },
      { label: "Focus", minutes: 25, kind: "focus" },
      { label: "Rest", minutes: 5, kind: "rest" },
    ],
  },
};

const MAX_SESSION_MINUTES = 150;

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes} min`;
  return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`;
}

function scaleSegments(segments: Segment[], targetMinutes: number) {
  const sourceTotal = segments.reduce((sum, segment) => sum + segment.minutes, 0);
  if (sourceTotal >= targetMinutes) return segments;

  const focusTotal = segments.filter((segment) => segment.kind === "focus").reduce((sum, segment) => sum + segment.minutes, 0);
  const restTotal = sourceTotal - focusTotal;
  const extra = targetMinutes - sourceTotal;
  const focusExtra = Math.round(extra * (focusTotal / sourceTotal));
  const restExtra = extra - focusExtra;
  return segments.map((segment) => {
    if (segment.kind === "focus") {
      const share = focusTotal ? segment.minutes / focusTotal : 0;
      return { ...segment, minutes: segment.minutes + Math.round(focusExtra * share) };
    }
    const share = restTotal ? segment.minutes / restTotal : 0;
    return { ...segment, minutes: Math.max(1, segment.minutes + Math.round(restExtra * share)) };
  });
}

export function StudySessionPanel({ onStart }: { onStart: (segments: Segment[], totalMinutes: number) => void }) {
  const [pattern, setPattern] = useState<StudySessionPattern>("deep");
  const [totalMinutes, setTotalMinutes] = useState(150);
  const selected = PATTERNS[pattern];
  const displaySegments = useMemo(() => scaleSegments(selected.segments, totalMinutes), [selected.segments, totalMinutes]);
  const actualTotal = displaySegments.reduce((sum, segment) => sum + segment.minutes, 0);
  const focusMinutes = displaySegments.filter((segment) => segment.kind === "focus").reduce((sum, segment) => sum + segment.minutes, 0);
  const restMinutes = actualTotal - focusMinutes;

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Study Session</p>
          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">Build one focused study session. Maximum session length is 2.5 hours.</p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] font-medium text-muted-foreground">
          <Clock3 className="size-3" /> {formatDuration(actualTotal)}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2">
        {(Object.keys(PATTERNS) as StudySessionPattern[]).map((key) => {
          const item = PATTERNS[key];
          const active = key === pattern;
          return (
            <button key={key} type="button" onClick={() => setPattern(key)} className={`rounded-xl border p-3 text-left transition ${active ? "border-white/30 bg-white/10" : "border-white/10 bg-black/15 hover:bg-white/[0.07]"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{item.description}</p>
                </div>
                {active && <Check className="mt-0.5 size-4 shrink-0 text-foreground" />}
              </div>
            </button>
          );
        })}
      </div>

      <label className="mt-4 block">
        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
          <span>Session length</span>
          <span className="text-foreground">{formatDuration(totalMinutes)}</span>
        </div>
        <input type="range" min={30} max={MAX_SESSION_MINUTES} step={10} value={totalMinutes} onChange={(event) => setTotalMinutes(Math.min(MAX_SESSION_MINUTES, Number(event.target.value)))} className="mt-2 w-full accent-current" aria-label="Study session length" />
        <div className="mt-1 flex justify-between text-[9px] text-muted-foreground"><span>30 min</span><span>2.5 hr max</span></div>
      </label>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="flex h-10 w-full overflow-hidden rounded-lg">
          {displaySegments.map((segment, index) => (
            <div key={`${segment.label}-${index}`} className={segment.kind === "focus" ? "flex min-w-0 items-center justify-center border-r border-black/20 bg-foreground/80 px-1 text-background" : "flex min-w-0 items-center justify-center border-r border-white/10 bg-white/15 px-1 text-foreground"} style={{ width: `${(segment.minutes / actualTotal) * 100}%` }} title={`${segment.label} · ${segment.minutes} min`}>
              <span className="truncate text-[9px] font-semibold">{segment.minutes}m</span>
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground"><span>Focus · {formatDuration(focusMinutes)}</span><span className="text-right">Rest · {formatDuration(restMinutes)}</span></div>
      </div>

      <Button type="button" className="mt-4 w-full rounded-xl" onClick={() => onStart(displaySegments, actualTotal)}><Play className="mr-2 size-3.5" />Start study session</Button>
    </div>
  );
}
