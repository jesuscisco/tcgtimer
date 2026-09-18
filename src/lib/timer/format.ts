import type { TimerSnapshot, TimerVisualTier } from "../types";

/** Format ms countdown as HH:MM:SS or MM:SS (hours only when >= 1h). */
export function formatRemaining(ms: number, showHours = true): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0 && showHours) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/** Format a duration in minutes to a label, e.g. 50 → "50:00". */
export function formatDurationMinutes(minutes: number): string {
  const m = Math.max(0, Math.floor(minutes));
  const mm = String(m).padStart(2, "0");
  return `${mm}:00`;
}

/**
 * Visual tier used by the display to pick colors + animations.
 * WARNING below warningMinutes, CRITICAL below criticalMinutes,
 * finished at 00:00.
 */
export function resolveVisualTier(
  snapshot: TimerSnapshot,
  warningMinutes: number,
  criticalMinutes: number
): TimerVisualTier {
  if (snapshot.status === "FINISHED") return "finished";
  if (snapshot.status !== "RUNNING") return "normal";
  const minutes = snapshot.remainingMs / 60_000;
  if (minutes <= criticalMinutes) return "critical";
  if (minutes <= warningMinutes) return "warning";
  return "normal";
}