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
  const size = 400;
  const radius = 152;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="relative mx-auto mt-4 size-[min(88vw,25rem)] min-h-64 min-w-64 max-w-[25rem]" aria-label={`${segment?.label ?? "Session"} timer ${formatTime(remaining)} remaining`}>
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90" role="img" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="14" className="text-white/10" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} className={segment?.kind === "rest" ? "text-white/70 transition-[stroke-dashoffset] duration-300" : "text-foreground transition-[stroke-dashoffset] duration-300"} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <span className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">{segment?.label ?? "Complete"}</span>
        <span className="mt-4 text-6xl font-semibold tabular-nums tracking-[-0.05em] text-foreground sm:text-7xl">{formatTime(remaining)}</span>
      </div>
    </div>
  );
}
