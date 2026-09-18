"use client";

import { useEffect, useState } from "react";
import { useTimerStore } from "../../lib/store/timer-store";
import { formatRemaining, resolveVisualTier } from "../../lib/timer/format";
import { soundManager } from "../../lib/sound/SoundManager";
import type { TimerSnapshot } from "../../lib/types";
import { Button } from "../atoms/controls";
import { DurationPresets } from "../molecules/common";
import { SectionCard } from "../molecules/common";

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "No iniciado",
  RUNNING: "En curso",
  PAUSED: "En pausa",
  FINISHED: "Finalizado",
};

const STATUS_COLOR: Record<string, string> = {
  NOT_STARTED: "text-slate-400 bg-slate-800",
  RUNNING: "text-emerald-300 bg-emerald-500/15",
  PAUSED: "text-amber-300 bg-amber-500/15",
  FINISHED: "text-cyan-300 bg-cyan-500/15",
};

export function TimerPanel() {
  const editing = useTimerStore((s) => s.editing);
  const snapshot = useTimerStore((s) => s.snapshot);
  const timerCommand = useTimerStore((s) => s.timerCommand);
  const addMinutes = useTimerStore((s) => s.addMinutes);
  const patchBase = useTimerStore((s) => s.patchBase);
  const connected = useTimerStore((s) => s.connected);

  const [confirmReset, setConfirmReset] = useState(false);
  const [tick, setTick] = useState(0);

  const remaining = snapshot ? useTimerStore.getState().remainingMsNow() : editing.durationMinutes * 60_000;

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 300);
    return () => clearInterval(id);
  }, []);

  // Sound feedback: start/pause plus warning/critical transitions
  useEffect(() => {
    if (!snapshot) return;
    const sound = editing.sound;
    if (!sound.enabled) return;
    const prev = useTimerStore.getState().snapshot as TimerSnapshot | null;
    if (!prev) return;

    const prevTier = resolveVisualTier(prev, editing.warning.warningMinutes, editing.warning.criticalMinutes);
    const tier = resolveVisualTier(snapshot, editing.warning.warningMinutes, editing.warning.criticalMinutes);

    if (snapshot.status === "FINISHED" && prev.status !== "FINISHED" && sound.finish) {
      soundManager.play("finish", sound.volume);
    } else if (tier === "warning" && prevTier === "normal" && sound.warning) {
      soundManager.play("warning", sound.volume);
    } else if (tier === "critical" && prevTier === "warning" && sound.warning) {
      soundManager.play("warning", sound.volume);
    } else if (snapshot.status === "RUNNING" && prev.status === "NOT_STARTED" && sound.start) {
      soundManager.play("start", sound.volume);
    } else if (snapshot.status === "PAUSED" && prev.status === "RUNNING" && sound.pause) {
      soundManager.play("pause", sound.volume);
    }
  }, [snapshot, editing.sound, editing.warning]);

  const status = snapshot?.status ?? "NOT_STARTED";

  const handleReset = () => {
    if (status === "RUNNING") {
      setConfirmReset(true);
      return;
    }
    timerCommand("reset");
  };

  return (
    <SectionCard
      title="Control del timer"
      description="Los cambios se sincronizan al instante con las pantallas."
      actions={
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${STATUS_COLOR[status]}`}
          aria-label={`Estado: ${STATUS_LABEL[status]}`}
        >
          {STATUS_LABEL[status]}
        </span>
      }
    >
      <span key={`r${tick + remaining}`} className="sr-only" />

      <div className="rounded-lg bg-slate-950 py-6 text-center">
        <div
          className="text-5xl font-bold tabular-nums tracking-wider text-slate-100"
          style={{ fontFamily: "var(--font-orbitron)", letterSpacing: "0.05em" }}
          aria-live="polite"
        >
          {formatRemaining(Math.max(0, remaining))}
        </div>
        <div className="mt-1 text-xs uppercase tracking-widest text-slate-500">
          {status === "FINISHED" ? editing.sound.finishOverlayText || "Tiempo agotado" : "Tiempo restante"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {status !== "RUNNING" ? (
          <Button
            className="col-span-2 py-3 text-base font-bold"
            disabled={!connected || status === "FINISHED"}
            onClick={() => {
              soundManager.ensure();
              timerCommand("start");
            }}
          >
            ▶ {status === "PAUSED" ? "Reanudar" : "Iniciar"}
          </Button>
        ) : (
          <Button
            variant="outline"
            className="col-span-2 py-3 text-base font-bold"
            disabled={!connected}
            onClick={() => {
              soundManager.ensure();
              timerCommand("pause");
            }}
          >
            ⏸ Pausar
          </Button>
        )}
        <Button variant="outline" className="py-2.5" disabled={!connected} onClick={() => addMinutes(5)}>
          +5 min
        </Button>
        <Button variant="outline" className="py-2.5" disabled={!connected} onClick={() => addMinutes(-5)}>
          −5 min
        </Button>
        <Button
          variant="danger"
          className="col-span-2"
          disabled={!connected}
          onClick={handleReset}
        >
          Reiniciar
        </Button>
      </div>

      {confirmReset && (
        <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-3">
          <p className="mb-2 text-sm text-rose-200">
            El timer está en curso. ¿Reiniciar de todas formas?
          </p>
          <div className="flex gap-2">
            <Button
              variant="danger"
              onClick={() => {
                setConfirmReset(false);
                timerCommand("reset");
              }}
            >
              Sí, reiniciar
            </Button>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <hr className="border-slate-800" />

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Duración inicial
        </span>
        <DurationPresets value={editing.durationMinutes} onChange={(m) => patchBase({ durationMinutes: m })} />
      </div>
    </SectionCard>
  );
}