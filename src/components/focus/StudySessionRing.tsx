import type { StudySessionSegment } from "@/components/focus/StudySessionPanel";

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

type Props = {
  segment?: StudySessionSegment;
  remaining: number;
};

export function StudySessionRing({ segment, remaining }: Props) {
  const totalSeconds = Math.max(1, (segment?.minutes ?? 1) * 60);
  const progress = Math.min(1, Math.max(0, remaining / totalSeconds));
  const size = 320;
  const radius = 124;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="relative mx-auto mt-3 size-[min(76vw,20rem)] min-h-52 min-w-52 max-w-[20rem]" aria-label={`${segment?.label ?? "Session"} timer ${formatTime(remaining)} remaining`}>
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90" role="img" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="12" className="text-white/10" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} className={segment?.kind === "rest" ? "text-white/70 transition-[stroke-dashoffset] duration-300" : "text-foreground transition-[stroke-dashoffset] duration-300"} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{segment?.label ?? "Complete"}</span>
        <span className="mt-3 text-5xl font-semibold tabular-nums tracking-[-0.05em] text-foreground sm:text-6xl">{formatTime(remaining)}</span>
      </div>
    </div>
  );
}
