"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  max?: number;
}

export function ScoreInput({
  value,
  onChange,
  disabled = false,
  max = 20,
}: ScoreInputProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className={cn(
          "select-none text-center font-heading text-[46px] font-black leading-[0.9] tabular-nums",
          disabled && "opacity-50"
        )}
      >
        {value}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          aria-label="Diminuir"
          className="grid h-[34px] w-[42px] place-items-center rounded-[11px] bg-secondary text-foreground transition-transform active:scale-[0.92] disabled:opacity-40"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={disabled || value <= 0}
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Aumentar"
          className="grid h-[34px] w-[42px] place-items-center rounded-[11px] bg-primary text-primary-foreground transition-transform active:scale-[0.92] disabled:opacity-40"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={disabled || value >= max}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
