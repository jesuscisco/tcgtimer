import type { TimerProfile } from "../types";
import { createInitialState } from "../timer/TimerEngine";

export const DURATION_PRESETS_MIN = [15, 25, 35, 45, 50, 60, 90];

export const DEFAULT_ANIMATION: TimerProfile["animation"] = {
  running: "none",
  warning: "pulse",
  critical: "blink",
  finished: "glow",
  lastSeconds: "countdown",
  countdownEmphasisSeconds: 10,
};

export function createDefaultProfile(overrides?: Partial<TimerProfile>): TimerProfile {
  const now = Date.now();
  const base: TimerProfile = {
    id: randomId(),
    name: "Nuevo perfil",
    durationMinutes: 50,
    background: {
      kind: "solid",
      color: "#0b0f14",
      imageUrl: null,
      size: "cover",
      positionX: 50,
      positionY: 50,
      zoom: 1,
      overlayColor: "#000000",
      overlayOpacity: 0.4,
    },
    layout: {
      gap: 32,
      offsetY: 0,
      maxWidthPct: 90,
      headerZone: "top",
      timerAlign: "center",
      timerZone: "middle",
      footerZone: "bottom",
    },
    timer: {
      fontFamily: "orbitron",
      size: 7,
      color: "#ffffff",
      warningColor: "#fbbf24",
      criticalColor: "#f87171",
      finishedColor: "#22d3ee",
      fontWeight: 700,
      fontStyle: "normal",
      letterSpacing: 6,
      textAlign: "center",
      maxWidthPct: 95,
    },
    header: {
      enabled: true,
      text: "ROUND 1",
      fontFamily: "bebas-neue",
      size: 3,
      color: "#ffffff",
      fontWeight: 600,
      fontStyle: "normal",
      letterSpacing: 4,
      textAlign: "center",
      maxWidthPct: 90,
      textTransform: "uppercase",
    },
    footer: {
      enabled: true,
      text: "TIME REMAINING",
      fontFamily: "montserrat",
      size: 2,
      color: "#cbd5e1",
      fontWeight: 500,
      fontStyle: "normal",
      letterSpacing: 3,
      textAlign: "center",
      maxWidthPct: 90,
      textTransform: "uppercase",
    },
    animation: { ...DEFAULT_ANIMATION },
    warning: { warningMinutes: 10, criticalMinutes: 5 },
    sound: {
      enabled: true,
      start: false,
      pause: false,
      finish: true,
      warning: true,
      volume: 0.7,
      finishOverlayText: "TIME!",
      showFinishOverlay: true,
    },
    createdAt: now,
    updatedAt: now,
  };
  return { ...base, ...overrides, createdAt: now, updatedAt: now };
}

export function createDefaultTimerState() {
  return createInitialState(0);
}

export function randomId(): string {
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Minutes typed by user, free-form, clamped 1..180. */
export function normalizeDurationMinutes(input: number): number {
  const v = Number.isFinite(input) ? input : 50;
  return Math.min(180, Math.max(1, Math.round(v)));
}