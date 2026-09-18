export type AlignX = "left" | "center" | "right";

export type VerticalZone = "top" | "middle" | "bottom";

export type AnimationKind =
  | "none"
  | "pulse"
  | "blink"
  | "glow"
  | "shake"
  | "scale"
  | "countdown";

export type BackgroundKind = "solid" | "image";

export interface SectionStyle {
  enabled: boolean;
  text: string;
  fontFamily: string;
  /** Scale 1..10, mapped to responsive clamp() size */
  size: number;
  color: string;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  /** px */
  letterSpacing: number;
  textAlign: AlignX;
  /** percentage 20..100 */
  maxWidthPct: number;
  textTransform: "none" | "uppercase" | "lowercase";
}

export interface TimerStyle {
  fontFamily: string;
  /** Scale 1..10, mapped to responsive clamp() size */
  size: number;
  color: string;
  warningColor: string;
  criticalColor: string;
  finishedColor: string;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  letterSpacing: number;
  textAlign: AlignX;
  /** maximum width percentage of the screen */
  maxWidthPct: number;
}

export interface BackgroundConfig {
  kind: BackgroundKind;
  /** base / solid color (hex or rgba) */
  color: string;
  imageUrl: string | null;
  size: "cover" | "contain";
  /** percent offset, -100..100 */
  positionX: number;
  positionY: number;
  /** 1..1.5 zoom multiplier */
  zoom: number;
  overlayColor: string;
  /** 0..1 */
  overlayOpacity: number;
}

export interface LayoutConfig {
  /** gap between header / timer / footer, px */
  gap: number;
  /** vertical offset of the whole composition, px (-200..200) */
  offsetY: number;
  /** overall max width percentage 40..100 */
  maxWidthPct: number;
  headerAlign: AlignX;
  headerZone: VerticalZone;
  timerAlign: AlignX;
  timerZone: VerticalZone;
  footerAlign: AlignX;
  footerZone: VerticalZone;
}

export interface AnimationConfig {
  running: AnimationKind;
  warning: AnimationKind;
  critical: AnimationKind;
  finished: AnimationKind;
  /** applied during the last seconds of a RUNNING timer */
  lastSeconds: AnimationKind;
  /** seconds below which lastSeconds takes over */
  countdownEmphasisSeconds: number;
}

export interface WarningConfig {
  /** minutes below which state = WARNING */
  warningMinutes: number;
  /** minutes below which state = CRITICAL */
  criticalMinutes: number;
}

export interface SoundConfig {
  enabled: boolean;
  start: boolean;
  pause: boolean;
  finish: boolean;
  warning: boolean;
  /** total volume 0..1 */
  volume: number;
  /** text shown over/under the timer on FINISH (e.g. "TIME!") */
  finishOverlayText: string;
  showFinishOverlay: boolean;
}

export interface TimerProfile {
  id: string;
  name: string;
  /** initial duration in minutes (integer) */
  durationMinutes: number;
  background: BackgroundConfig;
  layout: LayoutConfig;
  timer: TimerStyle;
  header: SectionStyle;
  footer: SectionStyle;
  animation: AnimationConfig;
  warning: WarningConfig;
  sound: SoundConfig;
  createdAt: number;
  updatedAt: number;
}

export type TimerStateTier = "NOT_STARTED" | "RUNNING" | "PAUSED" | "FINISHED";
export type TimerVisualTier = "normal" | "warning" | "critical" | "finished";