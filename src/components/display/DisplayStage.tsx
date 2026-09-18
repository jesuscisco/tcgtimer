"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { AnimationKind, TimerProfile, TimerSnapshot, VerticalZone } from "../../lib/types";
import { formatRemaining, resolveVisualTier } from "../../lib/timer/format";
import { sectionStyle, timerStyle } from "../../lib/display/styles";
import { useTimerStore } from "../../lib/store/timer-store";

const ALIGN_TO_JUSTIFY: Record<string, "flex-start" | "center" | "flex-end"> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};

const ZONE_INDEX: Record<VerticalZone, number> = { top: 0, middle: 1, bottom: 2 };

const ANIMATION_CLASS: Record<AnimationKind, string> = {
  none: "",
  pulse: "anim-pulse",
  blink: "anim-blink",
  glow: "anim-glow",
  shake: "anim-shake",
  scale: "anim-scale",
  countdown: "anim-countdown",
};

type SlotInput =
  | { key: "header"; enabled: boolean; zone: VerticalZone; align: string }
  | { key: "timer"; enabled: boolean; zone: VerticalZone; align: string }
  | { key: "footer"; enabled: boolean; zone: VerticalZone; align: string };

function Slotted({ slot, gap, overlap, onRender }: {
  slot: SlotInput;
  gap: number;
  overlap?: number;
  onRender: () => React.ReactNode;
}) {
  if (!slot.enabled) return null;
  return (
    <div
      className="display-slot"
      data-slot={slot.key}
      style={{
        flex: "1 1 0",
        minHeight: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: ALIGN_TO_JUSTIFY[slot.align] ?? "center",
        gap: `${gap}px`,
        order: ZONE_INDEX[slot.zone],
        ...(overlap ? { marginTop: `${overlap}px` } : {}),
      }}
    >
      {onRender()}
    </div>
  );
}

interface DisplayCompositionProps {
  profile: TimerProfile;
  snapshot: TimerSnapshot;
  remainingMs: number;
  tier: "normal" | "warning" | "critical" | "finished";
}

function DisplayComposition({ profile, snapshot, remainingMs, tier }: DisplayCompositionProps) {
  const { layout } = profile;
  const finishedOverlay = snapshot.status === "FINISHED";

  const slots: SlotInput[] = [
    { key: "header", enabled: profile.header.enabled && !finishedOverlay, zone: layout.headerZone, align: profile.header.textAlign },
    { key: "timer", enabled: true, zone: layout.timerZone, align: layout.timerAlign },
    { key: "footer", enabled: profile.footer.enabled || finishedOverlay, zone: layout.footerZone, align: profile.footer.textAlign },
  ];
  const gap = finishedOverlay ? 0 : layout.gap;
  const cssGap = Math.max(0, gap);
  const overlap = gap < 0 ? gap : 0;

  const effectiveHeader = finishedOverlay ? null : profile.header;
  const effectiveFooterText = finishedOverlay
    ? profile.sound.showFinishOverlay
      ? profile.sound.finishOverlayText || "TIME!"
      : ""
    : profile.footer.text;

  const animKey = finishedOverlay
    ? profile.animation.finished
    : remainingMs <= profile.animation.countdownEmphasisSeconds * 1000
      ? profile.animation.lastSeconds
      : tier === "critical"
        ? profile.animation.critical
        : tier === "warning"
          ? profile.animation.warning
          : profile.animation.running;

  const animClass = finishedOverlay ? ANIMATION_CLASS[profile.animation.finished] : ANIMATION_CLASS[animKey];
  const displaySince = finishedOverlay ? "00:00" : formatRemaining(remainingMs);

  return (
    <div
      className="display-composition"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: `${cssGap}px`,
        maxWidth: `${layout.maxWidthPct}%`,
        margin: "0 auto",
        transform: `translateY(${layout.offsetY}px)`,
      }}
    >
      <Slotted slot={slots[0]} overlap={overlap} gap={cssGap} onRender={() =>
        effectiveHeader ? (
          <div style={{ width: `${effectiveHeader.maxWidthPct}%`, ...sectionStyle(effectiveHeader, "#ffffff") }}>
            {effectiveHeader.text}
          </div>
        ) : null
      } />

      <Slotted slot={slots[1]} overlap={slots[0].enabled ? overlap : 0} gap={cssGap} onRender={() => (
        <div
          className={`display-timer ${animClass}`}
          style={{ width: `${profile.timer.maxWidthPct}%`, ...timerStyle(profile.timer, tier), fontVariantNumeric: "tabular-nums" }}
          aria-live="off"
        >
          {displaySince}
        </div>
      )} />

      <Slotted slot={slots[2]} overlap={slots[1].enabled ? overlap : (slots[0].enabled ? overlap : 0)} gap={cssGap} onRender={() => (
        effectiveFooterText ? (
          <div
            className={finishedOverlay ? `display-finish-text ${animClass}` : ""}
            style={{ width: `${profile.footer.maxWidthPct}%`, ...sectionStyle(profile.footer, "#cbd5e1") }}
          >
            {effectiveFooterText}
          </div>
        ) : null
      )} />
    </div>
  );
}

function DisplayBackground({ profile }: { profile: TimerProfile }) {
  const bg = profile.background;
  if (bg.kind === "image" && bg.imageUrl) {
    return (
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        {/* Dynamic LAN image URL — next/image would require allowlisted remote domains */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bg.imageUrl}
          alt=""
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: bg.size,
            transform: `scale(${bg.zoom})`,
            transformOrigin: `${bg.positionX}% ${bg.positionY}%`,
            position: "absolute",
            left: 0,
            top: 0,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: bg.overlayColor,
            opacity: Math.min(1, Math.max(0, bg.overlayOpacity)),
          }}
        />
      </div>
    );
  }
  return <div className="absolute inset-0" style={{ backgroundColor: bg.color }} aria-hidden />;
}

export interface DisplayStageProps {
  profile: TimerProfile;
  className?: string;
  style?: CSSProperties;
}

/**
 * Single renderer shared by /display and the admin preview.
 * Sizes are relative to its own container (container query units), so the
 * same tree scales from a 400px preview up to a 4K TV.
 */
/**
 * Forces a re-render at ~4fps while the timer is RUNNING so the countdown
 * text stays in sync with the authoritative endTime without affecting the
 * server or other consumers.
 */
function useTimerTick(enabled: boolean, intervalMs = 250): void {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs]);
}

export function DisplayStage({ profile, className, style }: DisplayStageProps) {
  const snapshot = useTimerStore((s) => s.snapshot);
  const running = snapshot?.status === "RUNNING";

  useTimerTick(running, 200);

  const remainingMs = snapshot
    ? useTimerStore.getState().remainingMsNow()
    : profile.durationMinutes * 60_000;
  const tier = snapshot
    ? resolveVisualTier(snapshot, profile.warning.warningMinutes, profile.warning.criticalMinutes)
    : "normal";

  const effectiveSnapshot = snapshot ?? {
    status: "NOT_STARTED" as const,
    durationMs: profile.durationMinutes * 60_000,
    remainingMs,
    elapsedMs: 0,
    startedAt: null,
    endTime: null,
    pausedAt: null,
    finishedAt: null,
    now: 0,
  };

  return (
    <div
      className={`display-stage relative ${className ?? ""}`}
      style={{
        containerType: "size",
        overflow: "hidden",
        width: "100%",
        height: "100%",
        ...style,
      }}
    >
      <DisplayBackground profile={profile} />
      <DisplayComposition profile={profile} snapshot={effectiveSnapshot} remainingMs={remainingMs} tier={tier} />
    </div>
  );
}