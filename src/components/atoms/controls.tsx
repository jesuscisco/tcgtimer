"use client";

import { useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { toHex } from "../../lib/utils/color";
import { clamp } from "../../lib/utils/misc";

/* ------------------------------- Button ------------------------------- */

type ButtonVariant = "primary" | "ghost" | "danger" | "outline";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-lg shadow-cyan-500/20",
  ghost: "bg-slate-800 hover:bg-slate-700 text-slate-200",
  danger: "bg-rose-600/90 hover:bg-rose-500 text-white",
  outline: "border border-slate-600 hover:border-slate-400 text-slate-200",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT_CLASSES[variant]} ${className}`}
    />
  );
}

/* -------------------------------- Field ------------------------------- */

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 min-w-0">
      <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</span>
      {children}
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

const inputBase =
  "w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-cyan-500";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  className = "",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  return (
    <input
      type="number"
      className={`${inputBase} ${className}`}
      value={Number.isFinite(value) ? value : ""}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const parsed = Number(e.target.value);
        if (e.target.value === "" || Number.isNaN(parsed)) {
          onChange(min ?? 0);
          return;
        }
        onChange(clamp(parsed, min ?? -Infinity, max ?? Infinity));
      }}
    />
  );
}

export function SelectInput({
  value,
  onChange,
  options,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputBase} appearance-none cursor-pointer ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
        checked ? "bg-cyan-500" : "bg-slate-700"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-[left] duration-200 ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = "",
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  label?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = (raw: string) => {
    setDraft(null);
    const clean = raw.trim().replace(unit, "").replace(",", ".").trim();
    if (clean === "") return;
    const parsed = Number(clean);
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.min(max, Math.max(min, parsed));
    if (clamped !== value) onChange(clamped);
  };

  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 min-w-0 flex-1 cursor-pointer accent-cyan-500"
      />
      <input
        type="text"
        inputMode="decimal"
        aria-label={label ? `${label} (valor exacto)` : "Valor exacto"}
        value={draft ?? `${value}${unit}`}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(e.currentTarget.value);
          if (e.key === "Escape") setDraft(null);
        }}
        onBlur={(e) => commit(e.target.value)}
        className="w-14 shrink-0 rounded border border-transparent bg-slate-800 px-1.5 py-0.5 text-right text-xs tabular-nums text-slate-300 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
      />
    </div>
  );
}

export function ColorInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  const [text, setText] = useState(value);

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        aria-label={label}
        value={toHex(value)}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-10 shrink-0 cursor-pointer rounded border border-slate-700 bg-transparent p-0.5"
      />
      <TextInput
        value={text}
        aria-label={`${label ?? "Color"} (hex)`}
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value);
          const v = e.target.value.trim();
          if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v);
        }}
        onBlur={() => setText(value)}
        className="font-mono text-xs w-24"
      />
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
  label?: string;
}) {
  return (
    <div
      role={label ? "radiogroup" : undefined}
      aria-label={label}
      className="flex flex-wrap gap-1 rounded-md bg-slate-800/70 p-1"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              active ? "bg-cyan-500 text-slate-950" : "text-slate-300 hover:bg-slate-700"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}