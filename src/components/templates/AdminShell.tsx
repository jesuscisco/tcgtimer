"use client";

import type { ReactNode } from "react";

const SECTIONS = [
  { id: "timer", label: "Timer" },
  { id: "apariencia", label: "Apariencia" },
  { id: "perfiles", label: "Perfiles" },
  { id: "pantallas", label: "Pantallas" },
  { id: "datos", label: "Datos" },
] as const;

export type AdminSection = (typeof SECTIONS)[number]["id"];

export function AdminShell({
  active,
  onNavigate,
  header,
  content,
  preview,
}: {
  active: AdminSection;
  onNavigate: (id: AdminSection) => void;
  header: ReactNode;
  content: ReactNode;
  preview: ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      {header}
      <div className="flex min-h-0 flex-1">
        <nav aria-label="Secciones del panel" className="flex w-52 shrink-0 flex-col overflow-y-auto border-r border-slate-800 bg-slate-900/40 p-3">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onNavigate(s.id)}
              aria-current={active === s.id ? "page" : undefined}
              className={`mb-1 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                active === s.id
                  ? "bg-cyan-500/15 text-cyan-300"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <main className="min-w-0 flex-1 overflow-y-auto p-4">
          <div className="mx-auto flex max-w-3xl flex-col gap-4">{content}</div>
        </main>

        <aside className="hidden min-h-0 w-[min(38vw,540px)] shrink-0 flex-col overflow-hidden border-l border-slate-800 bg-slate-900/30 lg:flex">
          {preview}
        </aside>
      </div>
    </div>
  );
}