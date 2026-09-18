"use client";

import { useState } from "react";
import { useTimerStore } from "../../lib/store/timer-store";
import { Button, TextInput } from "../atoms/controls";
import { SectionCard } from "../molecules/common";
import { parseBackup, buildBackup, downloadBackup } from "../../lib/profiles/import-export";
import { sendAdminCommand } from "../../lib/realtime/client";

function useDisplayUrl(): string {
  const [url] = useState(() =>
    typeof window !== "undefined" ? `${window.location.origin}/display` : "/display"
  );
  return url;
}

export function DisplaysPanel() {
  const clients = useTimerStore((s) => s.clients);
  const connected = useTimerStore((s) => s.connected);
  const url = useDisplayUrl();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <SectionCard
      title="Pantallas"
      description="Cualquier navegador que abra la URL del display muestra el timer sincronizado."
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
          <div className="text-2xl font-bold text-emerald-300">{clients.admins}</div>
          <div className="text-xs uppercase tracking-wider text-slate-500">PC admin</div>
        </div>
        <div className="rounded-md border border-cyan-500/30 bg-cyan-500/5 p-3">
          <div className="text-2xl font-bold text-cyan-300">{clients.displays}</div>
          <div className="text-xs uppercase tracking-wider text-slate-500">Pantallas (TV)</div>
        </div>
      </div>

      <div>
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">URL del display</span>
        <div className="mt-1.5 flex gap-2">
          <TextInput value={url} readOnly className="font-mono text-xs" onFocus={(e) => e.target.select()} />
          <Button variant="outline" className="shrink-0" onClick={copy}>
            {copied ? "✓ Copiada" : "Copiar URL"}
          </Button>
        </div>
      </div>

      <ul className="list-disc space-y-1 pl-5 text-xs text-slate-400">
        <li>Abrí la URL en cada televisión (no depende de Windows ni de pantalla secundaria).</li>
        <li>La pantalla se reconecta sola si perdés la conexión.</li>
        <li>Indicador discreto de conexión: punto verde (ok) / ámbar (sin conexión).</li>
        {!connected ? <li className="text-amber-400">El panel no está conectado al servidor realtime.</li> : null}
      </ul>
    </SectionCard>
  );
}

export function DataPanel() {
  const profiles = useTimerStore((s) => s.profiles);
  const activeProfileId = useTimerStore((s) => s.activeProfileId);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    downloadBackup(buildBackup(profiles, activeProfileId));
    setStatus("Respaldo exportado como tcg-timer-backup.json.");
    setError(null);
  };

  const handleImportFile = async (file: File) => {
    setStatus(null);
    setError(null);
    try {
      const backup = parseBackup(await file.text());
      for (const profile of backup.profiles) {
        sendAdminCommand({ type: "profile:save", profile });
      }
      if (backup.activeProfileId) {
        sendAdminCommand({ type: "profile:apply", profileId: backup.activeProfileId });
      }
      setStatus(`${backup.profiles.length} perfiles importados correctamente.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo importar el archivo.");
    }
  };

  return (
    <SectionCard
      title="Datos"
      description="Exportá e importá perfiles y configuración (tcg-timer-backup.json)."
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={handleExport} disabled={profiles.length === 0}>
          Exportar JSON
        </Button>
        <label className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-slate-400 has-focus:border-cyan-500 cursor-pointer">
          <span>Importar JSON</span>
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleImportFile(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <p className="text-xs text-slate-500">
        Nota: los fondos con imagen se referencian por URL. Si importás en otro equipo, subí las imágenes de nuevo
        desde el panel.
      </p>
      {status ? <p className="text-sm text-emerald-400">{status}</p> : null}
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
    </SectionCard>
  );
}