"use client";

import type { ReactNode } from "react";
import { FONT_CATALOG, fontStackCss } from "../../lib/fonts/catalog";
import { DURATION_PRESETS_MIN } from "../../lib/profiles/defaults";
import { NumberInput, SelectInput } from "../atoms/controls";
import { Button } from "../atoms/controls";

export function SectionCard({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
        </div>
        {actions}
      </header>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

export function DurationPresets({
  value,
  onChange,
}: {
  value: number;
  onChange: (minutes: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {DURATION_PRESETS_MIN.map((m) => {
        const active = value === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold tabular-nums transition-colors ${
              active
                ? "bg-cyan-500 text-slate-950"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {m}m
          </button>
        );
      })}
      <div className="flex items-center gap-1.5">
        <NumberInput
          value={value}
          min={1}
          max={180}
          onChange={onChange}
          className="w-20 py-1.5 text-sm"
          aria-label="Duración libre en minutos"
        />
        <span className="text-xs text-slate-500">min</span>
      </div>
    </div>
  );
}

export function FontPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {FONT_CATALOG.map((f) => {
        const active = f.key === value;
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => onChange(f.key)}
            aria-pressed={active}
            className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 text-left text-sm transition-colors ${
              active
                ? "border-cyan-500 bg-cyan-500/10 text-cyan-300"
                : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
            }`}
          >
            <span style={{ fontFamily: fontStackCss(f.key) }}>{f.label}</span>
            <span className="text-[10px] uppercase text-slate-500">{f.category}</span>
          </button>
        );
      })}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function WeightSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <SelectInput
      value={String(value)}
      onChange={(v) => onChange(Number(v))}
      options={[100, 200, 300, 400, 500, 600, 700, 800, 900].map((w) => ({
        value: String(w),
        label: w === 400 ? "Regular (400)" : w === 700 ? "Bold (700)" : String(w),
      }))}
      aria-label="Peso de fuente"
    />
  );
}

export function ProfileActions({
  onDanger,
  dangerLabel,
}: {
  onDanger: () => void;
  dangerLabel: string;
}) {
  return (
    <Button variant="danger" onClick={onDanger}>
      {dangerLabel}
    </Button>
  );
}