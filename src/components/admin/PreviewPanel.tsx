"use client";

import { useTimerStore } from "../../lib/store/timer-store";
import { DisplayStage } from "../display/DisplayStage";

/**
 * Live preview rendered by the SAME DisplayStage used on the TV, scaled
 * into a 16:9 box. Because sizes are container-relative, the preview is
 * pixel-accurate with the real display.
 */
export function PreviewPanel() {
  const editing = useTimerStore((s) => s.editing);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between px-4 pt-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">Vista previa</h2>
          <p className="text-xs text-slate-500">Misma renderización que la TV.</p>
        </div>
      </div>
      <div
        className="flex min-h-0 min-w-0 flex-1 items-center justify-center px-4 pb-4"
        style={{ containerType: "size" }}
      >
        <div
          className="relative overflow-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-2xl"
          style={{ width: "min(100cqw, calc(100cqh * 16 / 9))", aspectRatio: "16 / 9" }}
        >
          <DisplayStage profile={editing} className="rounded-lg" />
        </div>
      </div>
    </div>
  );
}