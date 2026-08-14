import { Slider } from "@/components/ui/slider";

type LiquidSliderProps = {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display: string;
  onChange: (value: number) => void;
};

export function LiquidSlider({
  label,
  hint,
  value,
  min,
  max,
  step = 1,
  display,
  onChange,
}: LiquidSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-foreground">
          {label}
        </span>
        <span className="font-mono text-xs text-accent-foreground">{display}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(vals) => onChange(vals[0] ?? value)}
        aria-label={label}
      />
      <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  );
}
