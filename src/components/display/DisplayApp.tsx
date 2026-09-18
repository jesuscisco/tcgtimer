"use client";

import { useEffect, useState } from "react";
import { useTimerStore } from "../../lib/store/timer-store";
import { useRealtime } from "../../lib/hooks/useRealtime";
import { DisplayStage } from "./DisplayStage";

export function getDisplayIdFromUrl(): string {
  if (typeof window === "undefined") return "main";
  const params = new URLSearchParams(window.location.search);
  return params.get("display") || "main";
}

export function DisplayApp() {
  const [displayId] = useState(getDisplayIdFromUrl);
  const [fullscreen, setFullscreen] = useState(false);

  useRealtime("display", displayId);

  const connected = useTimerStore((s) => s.connected);
  const profiles = useTimerStore((s) => s.profiles);
  const activeProfileId = useTimerStore((s) => s.activeProfileId);

  const profile =
    profiles.find((p) => p.id === activeProfileId) ?? profiles[0] ?? null;

  useEffect(() => {
    const onFsChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen().catch(() => undefined);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "f") toggleFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!profile) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-slate-500">
        Conectando con el panel…
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <DisplayStage profile={profile} />

      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label={fullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        className="absolute bottom-3 right-3 z-10 rounded-md bg-black/50 px-3 py-1.5 text-xs text-white/70 opacity-0 transition-opacity hover:opacity-100 focus:opacity-100"
      >
        {fullscreen ? "⤢ Salir" : "⤢ Fullscreen"}
      </button>

      <div
        role="status"
        aria-label={connected ? "Conectado al panel" : "Sin conexión con el panel"}
        className="absolute bottom-3 left-3 z-10 flex items-center gap-2"
      >
        <span
          className={`h-2.5 w-2.5 rounded-full transition-colors ${
            connected ? "bg-emerald-400" : "bg-amber-400"
          }`}
        />
        {!connected ? (
          <span className="rounded bg-black/50 px-2 py-1 text-xs text-white/70">
            Reconectando…
          </span>
        ) : null}
      </div>
    </div>
  );
}