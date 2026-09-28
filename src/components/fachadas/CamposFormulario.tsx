"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  formatDecimalCl,
  formatMontoNetoInput,
  parseDecimalCl,
  parseMontoNetoCl,
} from "@/lib/fachadas/formato";

export const CONTROL_H = "min-h-10 h-10 rounded-lg";

export function Campo({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  disabled,
  columns = 2,
}: {
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
  columns?: 2 | 3;
}) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "grid gap-2",
        columns === 3 ? "grid-cols-3" : "grid-cols-2",
      )}
    >
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            className={cn(
              "min-h-10 rounded-lg border px-3 text-sm font-medium transition-colors",
              on
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted",
            )}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function InputDecimalCl({
  id,
  value,
  onChange,
  disabled,
  required,
  min,
}: {
  id?: string;
  value: number | null;
  onChange: (n: number | null) => void;
  disabled?: boolean;
  required?: boolean;
  min?: number;
}) {
  const [text, setText] = useState(value == null ? "" : formatDecimalCl(value));
  useEffect(() => {
    const parsed = parseDecimalCl(text);
    if (value == null) {
      if (text !== "") setText("");
      return;
    }
    if (parsed == null || Math.abs(parsed - value) > 0.0001) {
      setText(formatDecimalCl(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only sync from parent value
  }, [value]);

  return (
    <Input
      id={id}
      inputMode="decimal"
      required={required}
      disabled={disabled}
      className={CONTROL_H}
      value={text}
      onChange={(e) => {
        const next = e.target.value;
        setText(next);
        if (!next.trim()) {
          onChange(null);
          return;
        }
        const n = parseDecimalCl(next);
        if (n != null && (min == null || n >= min)) onChange(n);
      }}
      onBlur={() => {
        if (value == null) {
          setText("");
          return;
        }
        setText(formatDecimalCl(value));
      }}
    />
  );
}

export function InputMontoNeto({
  id,
  value,
  onChange,
  disabled,
}: {
  id?: string;
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState(formatMontoNetoInput(value));
  useEffect(() => {
    if (parseMontoNetoCl(text) !== value) {
      setText(formatMontoNetoInput(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Input
      id={id}
      inputMode="numeric"
      disabled={disabled}
      className={CONTROL_H}
      value={text}
      onChange={(e) => {
        const next = e.target.value;
        setText(next);
        onChange(parseMontoNetoCl(next));
      }}
      onBlur={() => setText(formatMontoNetoInput(value))}
    />
  );
}
