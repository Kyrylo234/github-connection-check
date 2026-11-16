import type { CSSProperties } from "react";

import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface SignalSliderProps {
  label: string;
  displayValue: string;
  ariaValueText: string;
  value: number;
  min: number;
  max: number;
  step: number;
  marks: string[];
  colorScale?: "sentiment" | "severity";
  onValueChange?: (value: number) => void;
  className?: string;
}

export function SignalSlider({ label, displayValue, ariaValueText, value, min, max, step, marks, colorScale, onValueChange, className }: SignalSliderProps) {
  const position = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const colorPosition = colorScale === "severity" ? 1 - position : position;
  const thumbColor = colorPosition <= 0.5
    ? `color-mix(in oklab, var(--sentiment-negative) ${Math.round((1 - colorPosition * 2) * 100)}%, var(--sentiment-neutral))`
    : `color-mix(in oklab, var(--sentiment-neutral) ${Math.round((2 - colorPosition * 2) * 100)}%, var(--sentiment-positive))`;

  return (
    <div
      className={cn("min-w-0 space-y-2", colorScale && `signal-slider--${colorScale}`, className)}
      style={colorScale ? { "--scale-thumb-color": thumbColor } as CSSProperties : undefined}
    >
      <div className="flex items-baseline justify-between gap-2 font-system text-[10px] uppercase">
        <span className="text-muted-foreground">{label}</span>
        <span className="signal-slider-value text-right text-signal">{displayValue}</span>
      </div>
      <div className="flex h-8 items-center px-2">
        <Slider
          aria-label={label}
          aria-valuetext={ariaValueText}
          min={min}
          max={max}
          step={step}
          value={[value]}
          disabled={!onValueChange}
          className="[&_[role=slider]]:opacity-100"
          onValueChange={([nextValue]) => {
            if (nextValue !== undefined) onValueChange?.(nextValue);
          }}
        />
      </div>
      <div className="flex justify-between gap-1 font-system text-[9px] text-muted-foreground">
        {marks.map((mark) => <span key={mark}>{mark}</span>)}
      </div>
    </div>
  );
}
