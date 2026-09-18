import type { TimerProfile } from "../types";

export interface BackupPayload {
  /** "tcg-timer-backup" */
  schema: string;
  version: number;
  exportedAt: string;
  source: string;
  profiles: TimerProfile[];
  activeProfileId: string | null;
}

export const BACKUP_SCHEMA = "tcg-timer-backup";

export function buildBackup(profiles: TimerProfile[], activeProfileId: string | null): BackupPayload {
  return {
    schema: BACKUP_SCHEMA,
    version: 1,
    exportedAt: new Date().toISOString(),
    source: "panel",
    profiles,
    activeProfileId,
  };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isProfileLike(v: unknown): v is TimerProfile {
  if (!isObject(v)) return false;
  if (typeof v.id !== "string" || !v.id) return false;
  if (typeof v.name !== "string" || !v.name) return false;
  const duration = Number(v.durationMinutes);
  if (!Number.isFinite(duration) || duration < 1) return false;
  return true;
}

/**
 * Strict validation of an imported backup. Rejects anything that does not
 * look like a payload produced by this app.
 */
export function parseBackup(raw: string): BackupPayload {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("El archivo no es JSON válido.");
  }
  if (!isObject(data)) throw new Error("Estructura de respaldo inválida.");
  if (data.schema !== BACKUP_SCHEMA) {
    throw new Error("No es un respaldo de esta aplicación (schema incorrecto).");
  }
  if (!Array.isArray(data.profiles) || data.profiles.length === 0) {
    throw new Error("El respaldo no contiene perfiles válidos.");
  }
  if (!data.profiles.every(isProfileLike)) {
    throw new Error("Uno o más perfiles del respaldo están corruptos.");
  }
  const activeId = typeof data.activeProfileId === "string" ? data.activeProfileId : null;
  const ids = new Set(data.profiles.map((p) => p.id));
  const backup: BackupPayload = {
    schema: BACKUP_SCHEMA,
    version: Number(data.version) || 1,
    exportedAt: typeof data.exportedAt === "string" ? data.exportedAt : new Date().toISOString(),
    source: typeof data.source === "string" ? data.source : "import",
    profiles: data.profiles as TimerProfile[],
    activeProfileId: activeId && ids.has(activeId) ? activeId : data.profiles[0].id,
  };
  return backup;
}

export function downloadBackup(backup: BackupPayload): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tcg-timer-backup.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}