"use client";

import { useEffect } from "react";
import { useTimerStore } from "../store/timer-store";
import { soundManager } from "../sound/SoundManager";
import { isMinusKey, isPlusKey } from "../utils/misc";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

/** Space / R / + / − keyboard shortcuts for the timer controls. */
export function useKeyboardShortcuts(): void {
  const enabled = useTimerStore((s) => s.shortcutsEnabled);

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      const store = useTimerStore.getState();
      const status = store.snapshot?.status;

      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        soundManager.ensure();
        if (status === "RUNNING") store.timerCommand("pause");
        else if (status === "PAUSED") store.timerCommand("resume");
        else store.timerCommand("start");
      } else if (e.key.toLowerCase() === "r") {
        store.timerCommand("reset");
      } else if (isPlusKey(e.key)) {
        soundManager.ensure();
        store.addMinutes(5);
      } else if (isMinusKey(e.key)) {
        soundManager.ensure();
        store.addMinutes(-5);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled]);
}

/** Unlock the WebAudio context on the first pointer/key interaction. */
export function useUnlockAudio(): void {
  useEffect(() => {
    const unlock = () => soundManager.ensure();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);
}

/** Debounced auto-save of the working profile while autoSave is on. */
export function useAutoSave(delayMs = 700): void {
  const dirty = useTimerStore((s) => s.dirty);
  const autoSave = useTimerStore((s) => s.autoSave);
  const editing = useTimerStore((s) => s.editing);

  useEffect(() => {
    if (!dirty || !autoSave) return;
    const t = setTimeout(() => useTimerStore.getState().saveProfile(), delayMs);
    return () => clearTimeout(t);
  }, [dirty, autoSave, editing, delayMs]);
}