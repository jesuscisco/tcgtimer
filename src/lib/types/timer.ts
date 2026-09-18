import type { TimerStateTier } from "./config";

export interface TimerState {
  status: TimerStateTier;
  /** initial duration, ms */
  durationMs: number;
  /** epoch ms */
  startedAt: number | null;
  /** epoch ms */
  endTime: number | null;
  /** accumulated elapsed ms from prior RUNNING segments */
  accumulatedMs: number;
  /** epoch ms */
  finishedAt: number | null;
  updatedAt: number;
}

export interface TimerSnapshot {
  status: TimerStateTier;
  durationMs: number;
  /** computed at `now` */
  remainingMs: number;
  /** computed at `now` */
  elapsedMs: number;
  startedAt: number | null;
  endTime: number | null;
  pausedAt: number | null;
  finishedAt: number | null;
  /** reference time used to compute remaining (monotonic, client corrected) */
  now: number;
}

export type TimerCommand =
  | { cmd: "start" }
  | { cmd: "pause" }
  | { cmd: "resume" }
  | { cmd: "reset" }
  | { cmd: "addMinutes"; minutes: number };

export interface TimerSettings {
  durationMinutes: number;
  autoStart: boolean;
}