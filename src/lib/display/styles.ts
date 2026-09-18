import type { SectionStyle, TimerStyle, TimerVisualTier } from "../types";

const SCALE = 10;

type CssObject = Record<string, string | number>;

/**
 * Fluid font-size relative to the display container.
 * Uses `cqmin` (the smaller container dimension) so the same scale
 * renders proportionally identical from the admin preview up to a 4K TV,
 * and never overflows on portrait, 4:3 or ultrawide screens.
 */
function fluidSize(s: number, unit: number, remMin: number, remCap: number): string {
  return `clamp(${(s * remMin).toFixed(3)}rem, ${(s * unit).toFixed(3)}cqmin, ${(s * remCap).toFixed(3)}cqmin)`;
}

/** Responsive font-size for header/footer using the section scale 1..10. */
export function sectionFontSize(section: Pick<SectionStyle, "size">): string {
  const s = section.size / SCALE;
  return fluidSize(s, 9, 0.8, 14);
}

/** Responsive font-size for the timer using the timer scale 1..10. */
export function timerFontSize(timer: Pick<TimerStyle, "size">): string {
  const s = timer.size / SCALE;
  return fluidSize(s, 28, 1.4, 38);
}

export function timerColor(profile: { timer: TimerStyle }, tier: TimerVisualTier): string {
  switch (tier) {
    case "warning":
      return profile.timer.warningColor;
    case "critical":
      return profile.timer.criticalColor;
    case "finished":
      return profile.timer.finishedColor;
    default:
      return profile.timer.color;
  }
}

export function sectionStyle(section: SectionStyle, fallbackColor: string): CssObject {
  return {
    fontFamily: `var(--font-${section.fontFamily || "montserrat"})`,
    fontSize: sectionFontSize(section),
    color: section.color || fallbackColor,
    fontWeight: section.fontWeight,
    fontStyle: section.fontStyle,
    letterSpacing: `${section.letterSpacing}px`,
    textAlign: section.textAlign,
    textTransform: section.textTransform,
    lineHeight: 1.15,
    whiteSpace: "pre-wrap",
  };
}

export function timerStyle(timer: TimerStyle, tier: TimerVisualTier): CssObject {
  return {
    fontFamily: `var(--font-${timer.fontFamily || "orbitron"})`,
    fontSize: timerFontSize(timer),
    color: timerColor({ timer }, tier),
    fontWeight: timer.fontWeight,
    fontStyle: timer.fontStyle,
    letterSpacing: `${timer.letterSpacing}px`,
    textAlign: timer.textAlign,
    lineHeight: 1,
    fontVariantNumeric: "tabular-nums",
  };
}