import type { TimerSnapshot, TimerState, TimerCommand } from "../types";

/**
 * Pure, framework-agnostic tournament timer engine.
 *
 * Time is ALWAYS represented with absolute timestamps (`endTime`) while
 * RUNNING, so throttling, focus loss, refresh and reconnection never drift
 * the countdown. `setInterval` is only used by consumers to trigger renders.
 */
export class TimerEngine {
  private state: TimerState;

  constructor(initial?: TimerState) {
    if (initial) {
      this.state = sanitize(initial);
      return;
    }
    this.state = createInitialState(0);
  }

  getStatus() {
    return this.state.status;
  }

  getState(): TimerState {
    return { ...this.state };
  }

  /** Recompute remaining ms at `now` without mutating. */
  getSnapshot(now: number = Date.now()): TimerSnapshot {
    return computeSnapshot(this.state, now);
  }

  /** Apply a command; returns the new snapshot (and mutated internal state). */
  apply(command: TimerCommand, now: number = Date.now()): TimerSnapshot {
    const s = this.state;
    switch (command.cmd) {
      case "start": {
        if (s.status === "RUNNING") break;
        if (s.status === "NOT_STARTED") {
          s.startedAt = now;
          s.accumulatedMs = 0;
          s.endTime = now + s.durationMs;
        } else if (s.status === "PAUSED") {
          const remaining = computeSnapshot(s, now).remainingMs;
          s.startedAt = now - s.accumulatedMs;
          s.endTime = now + Math.max(0, remaining);
        } else if (s.status === "FINISHED") {
          return this.resetAndStart(now);
        }
        s.status = "RUNNING";
        s.finishedAt = null;
        break;
      }
      case "pause": {
        if (s.status !== "RUNNING") break;
        s.accumulatedMs = computeSnapshot(s, now).elapsedMs;
        s.status = "PAUSED";
        s.endTime = null;
        break;
      }
      case "resume": {
        if (s.status !== "PAUSED") break;
        const remaining = computeSnapshot(s, now).remainingMs;
        s.endTime = now + Math.max(0, remaining);
        s.status = "RUNNING";
        break;
      }
      case "reset": {
        this.state = createInitialState(s.durationMs);
        return computeSnapshot(this.state, now);
      }
      case "addMinutes": {
        this.addMinutes(command.minutes, now);
        break;
      }
    }
    s.updatedAt = now;
    return computeSnapshot(s, now);
  }

  /**
   * +x minutes adds time; -x subtracts, clamped so remaining never goes
   * below zero. If subtracting while RUNNING reaches 0, the timer finishes.
   */
  private addMinutes(minutes: number, now: number): void {
    const s = this.state;
    const delta = Math.round(minutes * 60_000);

    if (s.status === "NOT_STARTED") {
      s.durationMs = Math.max(0, s.durationMs + delta);
      return;
    }
    if (s.status === "FINISHED") {
      // apply to remaining-from-now (restart with residual time)
      if (delta === 0) return;
      s.status = "RUNNING";
      s.startedAt = now - 0;
      s.accumulatedMs = 0;
      s.endTime = now + Math.max(0, delta);
      s.finishedAt = null;
      return;
    }

    const snapshot = computeSnapshot(s, now);
    const newRemaining = Math.max(0, snapshot.remainingMs + delta);

    if (s.status === "RUNNING") {
      if (newRemaining === 0) {
        this.state = createFinishedState(s.durationMs, now);
        return;
      }
      s.endTime = now + newRemaining;
    } else {
      // PAUSED
      if (newRemaining === 0) {
        this.state = createFinishedState(s.durationMs, now);
        return;
      }
      s.accumulatedMs = Math.max(0, s.durationMs - newRemaining);
    }
  }

  /** Convenience for starting a race instance of the engine. */
  configure(durationMinutes: number, now: number = Date.now()): void {
    this.state = createInitialState(durationMinutes * 60_000);
    this.state.updatedAt = now;
  }

  private resetAndStart(now: number): TimerSnapshot {
    this.state = {
      status: "RUNNING",
      durationMs: this.state.durationMs,
      startedAt: now,
      endTime: now + this.state.durationMs,
      accumulatedMs: 0,
      finishedAt: null,
      updatedAt: now,
    };
    return computeSnapshot(this.state, now);
  }
}

export function createInitialState(durationMs: number): TimerState {
  return {
    status: "NOT_STARTED",
    durationMs: Math.max(0, durationMs),
    startedAt: null,
    endTime: null,
    accumulatedMs: 0,
    finishedAt: null,
    updatedAt: 0,
  };
}

export function createFinishedState(durationMs: number, now: number): TimerState {
  return {
    status: "FINISHED",
    durationMs: Math.max(0, durationMs),
    startedAt: null,
    endTime: null,
    accumulatedMs: durationMs,
    finishedAt: now,
    updatedAt: now,
  };
}

function computeSnapshot(s: TimerState, now: number): TimerSnapshot {
  const effectiveNow = s.endTime && now > s.endTime ? s.endTime : now;

  let remainingMs: number;
  let elapsedMs: number;
  let pausedAt: number | null = null;

  switch (s.status) {
    case "RUNNING": {
      const end = s.endTime ?? now;
      remainingMs = Math.max(0, end - effectiveNow);
      elapsedMs = s.durationMs - remainingMs;
      break;
    }
    case "PAUSED": {
      remainingMs = Math.max(0, s.durationMs - s.accumulatedMs);
      elapsedMs = s.accumulatedMs;
      pausedAt = s.accumulatedMs > 0 || s.startedAt ? Math.min(s.updatedAt, now) : null;
      break;
    }
    case "FINISHED": {
      remainingMs = 0;
      elapsedMs = s.durationMs;
      pausedAt = null;
      break;
    }
    case "NOT_STARTED":
    default: {
      remainingMs = s.durationMs;
      elapsedMs = 0;
      pausedAt = null;
      break;
    }
  }

  return {
    status: s.status,
    durationMs: s.durationMs,
    remainingMs: Math.max(0, Math.round(remainingMs)),
    elapsedMs: Math.max(0, Math.round(elapsedMs)),
    startedAt: s.startedAt,
    endTime: s.endTime,
    pausedAt,
    finishedAt: s.finishedAt,
    now: Math.max(1, Math.round(effectiveNow)),
  };
}

function sanitize(raw: TimerState): TimerState {
  const s: TimerState = {
    status: raw.status,
    durationMs: Math.max(0, raw.durationMs || 0),
    startedAt: raw.startedAt ?? null,
    endTime: raw.endTime ?? null,
    accumulatedMs: Math.max(0, raw.accumulatedMs || 0),
    finishedAt: raw.finishedAt ?? null,
    updatedAt: raw.updatedAt ?? 0,
  };
  // A RUNNING engine whose endTime already passed must surface as FINISHED.
  if (s.status === "RUNNING" && s.endTime !== null && s.endTime <= Date.now()) {
    s.status = "FINISHED";
    s.finishedAt = s.finishedAt ?? s.endTime;
    s.endTime = null;
    s.accumulatedMs = s.durationMs;
  }
  return s;
}