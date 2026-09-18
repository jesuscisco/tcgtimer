"use client";

import { useState } from "react";
import { useTimerStore } from "@/lib/store/timer-store";
import { useRealtime } from "@/lib/hooks/useRealtime";
import { useAutoSave, useKeyboardShortcuts, useUnlockAudio } from "@/lib/hooks/useAdmin";
import type { AdminSection } from "@/components/templates/AdminShell";
import { AdminShell } from "@/components/templates/AdminShell";
import { TimerPanel } from "@/components/admin/TimerPanel";
import {
  AnimationSection,
  BackgroundSection,
  FooterSection,
  HeaderSection,
  LayoutSection,
  TimerSection,
  WarningSection,
} from "@/components/admin/AppearanceSections";
import { ExtraSettings, ProfilesPanel } from "@/components/admin/ProfilesPanel";
import { DataPanel, DisplaysPanel } from "@/components/admin/ManagementPanels";
import { PreviewPanel } from "@/components/admin/PreviewPanel";
import { Button } from "@/components/atoms/controls";

const CONNECTION_LABEL = {
  connected: { color: "bg-emerald-400", text: "Conectado" },
  disconnected: { color: "bg-amber-400", text: "Sin conexión" },
} as const;

function AdminHeader({
  onSave,
}: {
  onSave: () => void;
}) {
  const connected = useTimerStore((s) => s.connected);
  const dirty = useTimerStore((s) => s.dirty);
  const editing = useTimerStore((s) => s.editing);
  const autoSave = useTimerStore((s) => s.autoSave);
  const snapshot = useTimerStore((s) => s.snapshot);
  const conn = connected ? CONNECTION_LABEL.connected : CONNECTION_LABEL.disconnected;

  return (
    <header className="relative flex h-22 shrink-0 items-center gap-4 border-b border-slate-800 bg-slate-900/60 px-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logoboards.png"
        alt=""
        draggable={false}
        className="absolute left-1/2 top-1/2 h-22 w-22 -translate-x-1/2 -translate-y-1/2 object-contain"
      />
      <h1 className="text-base font-bold uppercase tracking-widest text-cyan-400">
        TCG<span className="text-slate-400"> Timer</span>
      </h1>

      <span className="hidden items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300 sm:inline-flex">
        <span className={`h-2 w-2 rounded-full ${conn.color}`} aria-hidden />
        {conn.text}
      </span>

      <span className="min-w-0 flex-1 truncate text-sm text-slate-400">
        Perfil: <span className="font-semibold text-slate-200">{editing.name}</span>
        {dirty ? <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-xs text-amber-300">sin guardar</span> : null}
        {autoSave ? <span className="ml-2 text-xs text-emerald-400">autosave</span> : null}
      </span>

      <div className="flex shrink-0 items-center gap-2">
        <span className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase ${statusPill(snapshot?.status)}`}>
          {statusLabel(snapshot?.status)}
        </span>
        <Button onClick={onSave} disabled={!dirty && autoSave}>
          {dirty ? "Guardar cambios" : "Guardado"}
        </Button>
      </div>
    </header>
  );
}

function statusPill(status?: string): string {
  switch (status) {
    case "RUNNING":
      return "bg-emerald-500/15 text-emerald-300";
    case "PAUSED":
      return "bg-amber-500/15 text-amber-300";
    case "FINISHED":
      return "bg-cyan-500/15 text-cyan-300";
    default:
      return "bg-slate-800 text-slate-400";
  }
}

function statusLabel(status?: string): string {
  switch (status) {
    case "RUNNING":
      return "En curso";
    case "PAUSED":
      return "En pausa";
    case "FINISHED":
      return "Finalizado";
    default:
      return "No iniciado";
  }
}

export function AdminApp() {
  useRealtime("admin");
  useKeyboardShortcuts();
  useUnlockAudio();
  useAutoSave();

  const [section, setSection] = useState<AdminSection>("timer");
  const saveProfile = useTimerStore((s) => s.saveProfile);

  const content = (
    <>
      {section === "timer" && <TimerPanel />}
      {section === "apariencia" && (
        <>
          <LayoutSection />
          <BackgroundSection />
          <HeaderSection />
          <TimerSection />
          <FooterSection />
          <AnimationSection />
          <WarningSection />
        </>
      )}
      {section === "perfiles" && (
        <>
          <ProfilesPanel />
          <ExtraSettings />
        </>
      )}
      {section === "pantallas" && <DisplaysPanel />}
      {section === "datos" && <DataPanel />}
    </>
  );

  return (
    <AdminShell
      active={section}
      onNavigate={setSection}
      header={<AdminHeader onSave={saveProfile} />}
      content={content}
      preview={<PreviewPanel />}
    />
  );
}