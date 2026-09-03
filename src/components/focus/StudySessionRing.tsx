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
  const size = 240;
  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="relative mx-auto mt-3 size-56 max-w-full" aria-label={`${segment?.label ?? "Session"} timer ${formatTime(remaining)} remaining`}>
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90" role="img" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-white/10" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} className={segment?.kind === "rest" ? "text-white/70 transition-[stroke-dashoffset] duration-300" : "text-foreground transition-[stroke-dashoffset] duration-300"} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{segment?.label ?? "Complete"}</span>
        <span className="mt-2 text-4xl font-semibold tabular-nums tracking-[-0.05em] text-foreground">{formatTime(remaining)}</span>
      </div>
    </div>
  );
}
