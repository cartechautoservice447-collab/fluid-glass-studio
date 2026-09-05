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

const VISUAL_CONTROL_LABELS = new Set(["Drop Shadow", "Inner Shadow", "Blur"]);

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
  const handleChange = (nextValue: number) => {
    onChange(nextValue);
    if (typeof window !== "undefined" && VISUAL_CONTROL_LABELS.has(label)) {
      window.dispatchEvent(
        new CustomEvent("liquid-visual-control-changed", {
          detail: { label, value: nextValue },
        }),
      );
    }
  };

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
        onValueChange={(vals) => handleChange(vals[0] ?? value)}
        aria-label={label}
      />
      <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  );
}
