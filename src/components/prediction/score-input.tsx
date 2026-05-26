"use client";

import { Button } from "@/components/ui/button";
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
    <div className="flex items-center justify-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-11 w-11 shrink-0 rounded-full border-2 border-foreground/80 bg-card"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={disabled || value <= 0}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span
        className={cn(
          "w-14 select-none text-center font-heading text-6xl font-black leading-none tabular-nums",
          disabled && "opacity-50"
        )}
      >
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-11 w-11 shrink-0 rounded-full border-2 border-foreground/80 bg-card"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
