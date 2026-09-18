"use client";

import { useState } from "react";
import { useTimerStore } from "../../lib/store/timer-store";
import { formatDurationMinutes } from "../../lib/timer/format";
import { Button, TextInput, Toggle } from "../atoms/controls";
import { SectionCard } from "../molecules/common";

export function ProfilesPanel() {
  const profiles = useTimerStore((s) => s.profiles);
  const activeProfileId = useTimerStore((s) => s.activeProfileId);
  const editingId = useTimerStore((s) => s.editing.id);
  const applyProfile = useTimerStore((s) => s.applyProfile);
  const editProfile = useTimerStore((s) => s.editProfile);
  const deleteProfile = useTimerStore((s) => s.deleteProfile);
  const createProfile = useTimerStore((s) => s.createProfile);
  const duplicateActiveProfile = useTimerStore((s) => s.duplicateActiveProfile);
  const restoreActiveProfileDefaults = useTimerStore((s) => s.restoreActiveProfileDefaults);
  const dirty = useTimerStore((s) => s.dirty);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  return (
    <SectionCard
      title="Perfiles"
      description="Cada perfil guarda duración, apariencia, animaciones y sonidos."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={restoreActiveProfileDefaults}>
            Valores default
          </Button>
          <Button variant="outline" onClick={duplicateActiveProfile}>
            Duplicar activo
          </Button>
        </div>
      }
    >
      <div className="flex gap-2">
        <TextInput
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre del nuevo perfil (ej. Pokémon 50 min)"
          onKeyDown={(e) => {
            if (e.key === "Enter" && newName.trim()) {
              createProfile(newName.trim());
              setNewName("");
            }
          }}
        />
        <Button
          className="shrink-0"
          onClick={() => {
            createProfile(newName.trim() || "Nuevo perfil");
            setNewName("");
          }}
        >
          Crear
        </Button>
      </div>

      <ul className="flex flex-col gap-2">
        {profiles.map((p) => {
          const isActive = p.id === activeProfileId;
          const isEditing = p.id === editingId;
          return (
            <li
              key={p.id}
              className={`rounded-md border p-3 transition-colors ${
                isActive ? "border-cyan-500/60 bg-cyan-500/5" : "border-slate-800 bg-slate-900/60"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-100">{p.name}</div>
                  <div className="text-xs text-slate-500">
                    {formatDurationMinutes(p.durationMinutes)}
                    {isActive ? " · En pantalla" : ""}
                    {isEditing && dirty ? " · Editando (sin guardar)" : ""}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1">
                  <Button
                    variant={isActive ? "ghost" : "primary"}
                    className="px-2.5 py-1 text-xs"
                    onClick={() => applyProfile(p.id)}
                    disabled={isActive}
                  >
                    {isActive ? "Activo" : "Aplicar"}
                  </Button>
                  <Button variant="outline" className="px-2.5 py-1 text-xs" onClick={() => editProfile(p.id)}>
                    Editar
                  </Button>
                  {confirmDelete === p.id ? (
                    <>
                      <Button variant="danger" className="px-2.5 py-1 text-xs" onClick={() => { deleteProfile(p.id); setConfirmDelete(null); }}>
                        Confirmar
                      </Button>
                      <Button variant="ghost" className="px-2.5 py-1 text-xs" onClick={() => setConfirmDelete(null)}>
                        No
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      className="px-2.5 py-1 text-xs text-rose-400"
                      disabled={profiles.length <= 1}
                      onClick={() => setConfirmDelete(p.id)}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

export function ExtraSettings() {
  const autoSave = useTimerStore((s) => s.autoSave);
  const shortcutsEnabled = useTimerStore((s) => s.shortcutsEnabled);
  const toggleAutoSave = useTimerStore((s) => s.toggleAutoSave);
  const toggleShortcuts = useTimerStore((s) => s.toggleShortcuts);

  return (
    <SectionCard title="Preferencias">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm text-slate-200">Auto-guardado</div>
          <div className="text-xs text-slate-500">Guarda los cambios de apariencia automáticamente.</div>
        </div>
        <Toggle checked={autoSave} onChange={toggleAutoSave} label="Auto guardado" />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm text-slate-200">Atajos de teclado</div>
          <div className="text-xs text-slate-500">
            <kbd>Espacio</kbd> iniciar/pausar · <kbd>R</kbd> reset · <kbd>+</kbd> / <kbd>−</kbd> agregar/quitar 5 min
          </div>
        </div>
        <Toggle checked={shortcutsEnabled} onChange={toggleShortcuts} label="Atajos de teclado" />
      </div>
    </SectionCard>
  );
}